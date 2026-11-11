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

class BootstrapAccountConflict extends Error {}

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

function accountConflict(existingAccounts) {
  if (existingAccounts.length === 0) return null;

  const pendingInitialAdmin =
    existingAccounts.length === 1 &&
    existingAccounts[0].status === 'pending_invitation' &&
    existingAccounts[0].username === null &&
    existingAccounts[0].passwordHash === null &&
    existingAccounts[0].roles.some(({ role }) => role.code === 'admin');

  if (pendingInitialAdmin) {
    return new BootstrapAccountConflict(
      'Conflito entre execuções do bootstrap: outra execução já criou a conta Admin pendente, ainda sem nome de usuário e senha. A transação impediu uma segunda conta. Use o link de convite exibido pela execução que criou a conta.',
    );
  }

  return new BootstrapAccountConflict(
    'Já existe uma conta de gestão configurada neste banco. O bootstrap cria somente a primeira conta Admin.',
  );
}

async function assertNoExistingAccounts(database = prisma) {
  const existingAccounts = await database.user.findMany({
    take: 2,
    select: {
      status: true,
      username: true,
      passwordHash: true,
      roles: { select: { role: { select: { code: true } } } },
    },
  });
  const conflict = accountConflict(existingAccounts);
  if (conflict) throw conflict;
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
  let result;
  try {
    result = await prisma.$transaction(
      async (tx) => {
        // Recheck within the transaction to prevent a concurrent bootstrap race.
        await assertNoExistingAccounts(tx);
        const adminRole = await tx.role.upsert({
          where: { code: 'admin' },
          update: {},
          create: { code: 'admin' },
        });
        const user = await tx.user.create({
          data: {
            realName,
            email,
            status: 'pending_invitation',
            roles: { create: { roleId: adminRole.id } },
          },
        });

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
  } catch (transactionError) {
    try {
      await assertNoExistingAccounts();
    } catch (accountError) {
      if (accountError instanceof BootstrapAccountConflict) throw accountError;
    }
    throw transactionError;
  }

  const inviteUrl = new URL('/gestao/convite/aceitar', managementOrigin());
  inviteUrl.hash = new URLSearchParams({ token: result.token }).toString();
  return { url: inviteUrl.toString(), expiresAt: result.expiresAt };
}

async function main() {
  if (!stdin.isTTY || !stdout.isTTY)
    throw new Error('Execute este comando em um terminal interativo.');
  if (!process.env.DATABASE_URL)
    throw new Error('DATABASE_URL não está configurada em api/.env.');

  // Check before asking for personal data or operation confirmation.
  await assertNoExistingAccounts();

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
