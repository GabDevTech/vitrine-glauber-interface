import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import argon2 from 'argon2';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../database/prisma.service.js';
import {
  BOOTSTRAP_INVITATION_LOCK_MS,
  INVITATION_MAX_NAME_ATTEMPTS,
  LOGIN_LOCK_MS,
  LOGIN_MAX_FAILED_ATTEMPTS,
  SESSION_ABSOLUTE_HOURS,
  SESSION_IDLE_MINUTES,
  createOpaqueToken,
  normalizeRealName,
  tokenHash,
  validFullName,
  validPassword,
  validUsername,
} from './auth.security.js';

const accountInclude = { roles: { include: { role: true } } } as const;
type AccountRecord = Prisma.UserGetPayload<{ include: typeof accountInclude }>;
type RateWindow = { startedAt: number; count: number; lockedUntil?: number };

export type PublicAccount = {
  id: string;
  username: string;
  realName: string;
  email: string;
  roles: string[];
};

function publicAccount(user: AccountRecord): PublicAccount {
  return {
    id: user.id.toString(),
    username: user.username ?? '',
    realName: user.realName,
    email: user.email,
    roles: user.roles.map(({ role }) => role.code),
  };
}

function invalidCredentials(): UnauthorizedException {
  return new UnauthorizedException({
    code: 'INVALID_CREDENTIALS',
    message: 'E-mail/nome de usuário ou senha inválidos.',
  });
}

@Injectable()
export class AuthService {
  private readonly rateWindows = new Map<string, RateWindow>();
  private dummyPasswordHash: Promise<string> | undefined;

  constructor(private readonly prisma: PrismaService) {}

  private checkLoginRateLimit(clientKey: string): void {
    const now = Date.now();
    const key = `login:${clientKey || 'unknown'}`;
    const current = this.rateWindows.get(key);
    if (current?.lockedUntil && current.lockedUntil > now) {
      const retryAfterSeconds = Math.ceil((current.lockedUntil - now) / 1000);
      throw new HttpException(
        {
          code: 'LOGIN_RATE_LIMITED',
          message: 'Limite de 6 tentativas atingido. Aguarde 10 minutos.',
          retryAfterSeconds,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    if (current?.lockedUntil && current.lockedUntil <= now) {
      this.rateWindows.delete(key);
      return;
    }
    if (current && now - current.startedAt >= LOGIN_LOCK_MS) {
      this.rateWindows.delete(key);
    }
  }

  private recordFailedLogin(clientKey: string): void {
    const key = `login:${clientKey || 'unknown'}`;
    const current = this.rateWindows.get(key) ?? {
      startedAt: Date.now(),
      count: 0,
    };
    current.count++;
    if (current.count >= LOGIN_MAX_FAILED_ATTEMPTS) {
      current.lockedUntil = Date.now() + LOGIN_LOCK_MS;
      this.rateWindows.set(key, current);
      throw new HttpException(
        {
          code: 'LOGIN_RATE_LIMITED',
          message: 'Limite de 6 tentativas atingido. Aguarde 10 minutos.',
          retryAfterSeconds: 600,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    this.rateWindows.set(key, current);
  }

  private clearLoginFailures(clientKey: string): void {
    this.rateWindows.delete(`login:${clientKey || 'unknown'}`);
  }

  private async burnPasswordVerification(password: string): Promise<void> {
    this.dummyPasswordHash ??= argon2.hash(createOpaqueToken(), {
      type: argon2.argon2id,
    });
    await argon2
      .verify(await this.dummyPasswordHash, password)
      .catch(() => false);
  }

  async login(
    login: string,
    password: string,
    clientKey: string,
    userAgent: string | undefined,
  ): Promise<{ sessionToken: string; account: PublicAccount }> {
    this.checkLoginRateLimit(clientKey);
    const identifier = login.trim();
    if (!identifier || identifier.length > 254 || !validPassword(password)) {
      await this.burnPasswordVerification(password);
      this.recordFailedLogin(clientKey);
      throw invalidCredentials();
    }
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: identifier, mode: 'insensitive' } },
          { username: { equals: identifier, mode: 'insensitive' } },
        ],
      },
      include: accountInclude,
    });
    const hash = user?.passwordHash;
    const matches = hash
      ? await argon2.verify(hash, password).catch(() => false)
      : (await this.burnPasswordVerification(password), false);
    if (
      !user ||
      user.status !== 'active' ||
      user.roles.length === 0 ||
      !matches
    ) {
      this.recordFailedLogin(clientKey);
      throw invalidCredentials();
    }

    this.clearLoginFailures(clientKey);

    const sessionToken = createOpaqueToken();
    const now = new Date();
    const absoluteExpiresAt = new Date(
      now.getTime() + SESSION_ABSOLUTE_HOURS * 60 * 60 * 1000,
    );
    const idleExpiresAt = new Date(
      now.getTime() + SESSION_IDLE_MINUTES * 60 * 1000,
    );
    await this.prisma.$transaction(async (tx) => {
      await tx.session.create({
        data: {
          userId: user.id,
          tokenHash: tokenHash(sessionToken),
          lastActivityAt: now,
          idleExpiresAt,
          absoluteExpiresAt,
          userAgentSummary: userAgent
            ?.split('')
            .filter((character) => {
              const code = character.charCodeAt(0);
              return code > 31 && code !== 127;
            })
            .join(' ')
            .slice(0, 180),
        },
      });
      await tx.user.update({
        where: { id: user.id },
        data: { lastActivityAt: now },
      });
    });
    return { sessionToken, account: publicAccount(user) };
  }

  async currentAccount(
    sessionToken: string | undefined,
  ): Promise<PublicAccount> {
    if (!sessionToken) throw new UnauthorizedException();
    const session = await this.prisma.session.findUnique({
      where: { tokenHash: tokenHash(sessionToken) },
      include: { user: { include: accountInclude } },
    });
    if (!session || session.revokedAt || session.user.status !== 'active')
      throw new UnauthorizedException();

    const now = new Date();
    if (session.idleExpiresAt <= now || session.absoluteExpiresAt <= now) {
      await this.prisma.session.updateMany({
        where: { id: session.id, revokedAt: null },
        data: { revokedAt: now, revocationReason: 'expired' },
      });
      throw new UnauthorizedException();
    }
    const nextIdleExpiry = new Date(
      Math.min(
        now.getTime() + SESSION_IDLE_MINUTES * 60 * 1000,
        session.absoluteExpiresAt.getTime(),
      ),
    );
    await this.prisma.$transaction([
      this.prisma.session.update({
        where: { id: session.id },
        data: { lastActivityAt: now, idleExpiresAt: nextIdleExpiry },
      }),
      this.prisma.user.update({
        where: { id: session.userId },
        data: { lastActivityAt: now },
      }),
    ]);
    return publicAccount(session.user);
  }

  async logout(sessionToken: string | undefined): Promise<void> {
    if (!sessionToken) return;
    await this.prisma.session.updateMany({
      where: { tokenHash: tokenHash(sessionToken), revokedAt: null },
      data: { revokedAt: new Date(), revocationReason: 'logout' },
    });
  }

  async acceptInvitation(
    token: string,
    realName: string,
    username: string,
    password: string,
  ): Promise<void> {
    if (!token || token.length > 128) {
      throw new ConflictException({
        code: 'INVALID_INVITATION',
        message: 'Convite inválido ou indisponível.',
      });
    }

    if (!validFullName(realName)) {
      throw new ConflictException({
        code: 'INVALID_REAL_NAME',
        message:
          'Informe um nome real com pelo menos 2 e no máximo 130 caracteres.',
      });
    }
    if (!validUsername(username)) {
      throw new ConflictException({
        code: 'INVALID_USERNAME',
        message:
          'O nome de usuário deve ter de 3 a 30 caracteres e usar letras, números, ponto, hífen ou sublinhado.',
      });
    }
    if (!validPassword(password)) {
      throw new ConflictException({
        code: 'INVALID_PASSWORD',
        message: 'A senha deve ter entre 8 e 130 caracteres.',
      });
    }

    const now = new Date();
    const invitation = await this.prisma.invitation.findUnique({
      where: { tokenHash: tokenHash(token) },
      include: { user: true },
    });
    if (
      !invitation ||
      invitation.usedAt ||
      invitation.revokedAt ||
      invitation.user.status !== 'pending_invitation'
    ) {
      throw new ConflictException({
        code: 'INVALID_INVITATION',
        message: 'Convite inválido ou indisponível.',
      });
    }
    if (invitation.expiresAt <= now) {
      await this.prisma.user.updateMany({
        where: { id: invitation.userId, status: 'pending_invitation' },
        data: { status: 'invitation_expired' },
      });
      throw new ConflictException({
        code: 'INVITATION_EXPIRED',
        message: 'Este convite expirou. Solicite um novo convite.',
      });
    }
    const isBootstrapInvitation = invitation.createdByUserId === null;
    if (
      isBootstrapInvitation &&
      invitation.lockedUntil &&
      invitation.lockedUntil > now
    ) {
      throw new HttpException(
        {
          code: 'BOOTSTRAP_INVITATION_LOCKED',
          message:
            'Cinco tentativas incorretas. Aguarde para tentar novamente.',
          retryAfterSeconds: Math.ceil(
            (invitation.lockedUntil.getTime() - now.getTime()) / 1000,
          ),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    if (
      isBootstrapInvitation &&
      invitation.lockedUntil &&
      invitation.lockedUntil <= now
    ) {
      await this.prisma.invitation.updateMany({
        where: { id: invitation.id, lockedUntil: { lte: now } },
        data: { attemptCount: 0, lockedUntil: null },
      });
      invitation.attemptCount = 0;
      invitation.lockedUntil = null;
    }
    if (
      !isBootstrapInvitation &&
      invitation.attemptCount >= INVITATION_MAX_NAME_ATTEMPTS
    ) {
      throw new HttpException(
        {
          code: 'INVITATION_ATTEMPTS_EXCEEDED',
          message: 'Limite de tentativas atingido. Solicite um novo convite.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    if (
      normalizeRealName(realName) !==
      normalizeRealName(invitation.user.realName)
    ) {
      await this.prisma.invitation.updateMany({
        where: {
          id: invitation.id,
          usedAt: null,
          revokedAt: null,
          attemptCount: { lt: INVITATION_MAX_NAME_ATTEMPTS },
        },
        data: {
          attemptCount: { increment: 1 },
          ...(isBootstrapInvitation &&
          invitation.attemptCount + 1 >= INVITATION_MAX_NAME_ATTEMPTS
            ? {
                lockedUntil: new Date(
                  Date.now() + BOOTSTRAP_INVITATION_LOCK_MS,
                ),
              }
            : {}),
        },
      });
      if (
        isBootstrapInvitation &&
        invitation.attemptCount + 1 >= INVITATION_MAX_NAME_ATTEMPTS
      ) {
        throw new HttpException(
          {
            code: 'BOOTSTRAP_INVITATION_LOCKED',
            message:
              'Cinco tentativas incorretas. Aguarde 2 minutos para tentar novamente.',
            retryAfterSeconds: 120,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      throw new ConflictException({
        code: 'INVITATION_IDENTITY_MISMATCH',
        message: 'Confira o nome real informado no convite.',
      });
    }

    const usernameTaken = await this.prisma.user.findFirst({
      where: {
        id: { not: invitation.userId },
        username: { equals: username, mode: 'insensitive' },
      },
      select: { id: true },
    });
    if (usernameTaken) {
      throw new ConflictException({
        code: 'USERNAME_UNAVAILABLE',
        message: 'Este nome de usuário já está em uso.',
      });
    }

    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    const result = await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.invitation.updateMany({
        where: {
          id: invitation.id,
          usedAt: null,
          revokedAt: null,
          expiresAt: { gt: new Date() },
          ...(isBootstrapInvitation
            ? {
                OR: [
                  { attemptCount: { lt: INVITATION_MAX_NAME_ATTEMPTS } },
                  { lockedUntil: { lte: new Date() } },
                ],
              }
            : { attemptCount: { lt: INVITATION_MAX_NAME_ATTEMPTS } }),
        },
        data: { usedAt: new Date() },
      });
      if (claimed.count !== 1) return false;
      await tx.user.update({
        where: { id: invitation.userId, status: 'pending_invitation' },
        data: {
          username,
          passwordHash,
          status: 'active',
          activatedAt: new Date(),
        },
      });
      await tx.userPreference.createMany({
        data: [{ userId: invitation.userId }],
        skipDuplicates: true,
      });
      return true;
    });
    if (!result) {
      throw new ConflictException({
        code: 'INVALID_INVITATION',
        message: 'Convite inválido ou indisponível.',
      });
    }
  }
}
