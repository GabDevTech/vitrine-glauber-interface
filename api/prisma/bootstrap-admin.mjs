import 'dotenv/config';
import { createHash, randomBytes } from 'node:crypto';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { PrismaClient } from '../dist/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

const invitationHours = 24;
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function normalizeName(value) {
  return value.trim().replace(/\s+/g, ' ').normalize('NFC');
}

function managementOrigin() {
  const value = process.env.MANAGEMENT_ORIGIN ?? 'http://localhost:4175';
  const origin = new URL(value);
  if (!['http:', 'https:'].includes(origin.protocol))
    throw new Error('MANAGEMENT_ORIGIN deve usar http ou https.');
  if (process.env.NODE_ENV === 'production' && origin.protocol !== 'https:')
    throw new Error('MANAGEMENT_ORIGIN deve usar HTTPS em produção.');
  return origin.origin;
}

async function issueInvitation(realNameInput, emailInput) {
  const realName = normalizeName(realNameInput);
  const email = emailInput.trim().toLocaleLowerCase('pt-BR');
  if ([...realName].length < 2 || [...realName].length > 130)
    throw new Error('O nome real deve ter entre 2 e 130 caracteres.');
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new Error('Informe um e-mail válido.');

  const token = randomBytes(32).toString('base64url');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + invitationHours * 60 * 60 * 1000);
  const result = await prisma.$transaction(
    async (tx) => {
      const users = await tx.user.findMany({
        include: {
          roles: { include: { role: true } },
          invitations: { orderBy: { createdAt: 'desc' } },
        },
        take: 2,
      });
      let user;
      if (users.length === 0) {
        const adminRole = await tx.role.upsert({
          where: { code: 'admin' },
          update: {},
          create: { code: 'admin' },
        });
        user = await tx.user.create({
          data: {
            realName,
            email,
            status: 'pending_invitation',
            roles: { create: { roleId: adminRole.id } },
          },
        });
      } else if (users.length === 1) {
        const existing = users[0];
        const isOnlyPendingAdmin =
          existing.username === null &&
          existing.passwordHash === null &&
          ['pending_invitation', 'invitation_expired'].includes(
            existing.status,
          ) &&
          existing.roles.some(({ role }) => role.code === 'admin');
        const latestInvitation = existing.invitations[0];
        const sameIdentity =
          existing.email.toLocaleLowerCase('pt-BR') === email &&
          normalizeName(existing.realName).toLocaleLowerCase('pt-BR') ===
            realName.toLocaleLowerCase('pt-BR');
        if (!isOnlyPendingAdmin || !sameIdentity)
          throw new Error(
            'O bootstrap só pode ser repetido para a mesma conta Admin inicial, enquanto ela ainda não foi ativada.',
          );
        if (
          latestInvitation &&
          !latestInvitation.usedAt &&
          !latestInvitation.revokedAt &&
          latestInvitation.expiresAt > now
        ) {
          throw new Error(
            'Já existe um convite válido para esta conta. Use o link enviado anteriormente.',
          );
        }
        if (latestInvitation && !latestInvitation.revokedAt) {
          await tx.invitation.update({
            where: { id: latestInvitation.id },
            data: { revokedAt: now },
          });
        }
        user = await tx.user.update({
          where: { id: existing.id },
          data: { status: 'pending_invitation' },
        });
      } else {
        throw new Error(
          'O bootstrap inicial só funciona quando ainda não há contas de gestão.',
        );
      }

      await tx.invitation.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(token),
          expiresAt,
        },
      });
      return { token, expiresAt };
    },
    { isolationLevel: 'Serializable' },
  );

  const inviteUrl = new URL('/gestao/convite/aceitar', managementOrigin());
  inviteUrl.hash = new URLSearchParams({ token: result.token }).toString();
  return { url: inviteUrl.toString(), expiresAt: result.expiresAt };
}

async function main() {
  if (!stdin.isTTY || !stdout.isTTY)
    throw new Error('Execute este comando em um terminal interativo.');
  if (!process.env.DATABASE_URL)
    throw new Error('DATABASE_URL não está configurada em api/.env.');

  const prompt = createInterface({ input: stdin, output: stdout });
  try {
    console.log(
      'Este comando cria um convite de uso único para a primeira conta Admin do banco indicado por DATABASE_URL.',
    );
    const realName = await prompt.question('Nome real completo: ');
    const email = await prompt.question('E-mail: ');
    const confirmation = await prompt.question(
      'Para confirmar a operação neste banco, digite CRIAR ADMIN: ',
    );
    if (confirmation !== 'CRIAR ADMIN') {
      console.log('Operação cancelada; nenhuma conta foi criada.');
      return;
    }
    const invitation = await issueInvitation(realName, email);
    console.log(`Convite válido até ${invitation.expiresAt.toISOString()}.`);
    console.log('Envie este link diretamente ao primeiro administrador:');
    console.log(invitation.url);
    console.log(
      'O link é exibido uma vez e não fica armazenado em texto puro.',
    );
  } finally {
    prompt.close();
  }
}

main()
  .catch((error) => {
    console.error(`Bootstrap não concluído: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
