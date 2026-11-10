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
  RATE_LIMIT_MAX_ATTEMPTS,
  RATE_LIMIT_WINDOW_MS,
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
type RateWindow = { startedAt: number; count: number };

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

  private checkRateLimit(action: string, clientKey: string): void {
    const now = Date.now();
    for (const [key, window] of this.rateWindows) {
      if (now - window.startedAt >= RATE_LIMIT_WINDOW_MS)
        this.rateWindows.delete(key);
    }
    const key = `${action}:${clientKey || 'unknown'}`;
    const current = this.rateWindows.get(key);
    if (!current || now - current.startedAt >= RATE_LIMIT_WINDOW_MS) {
      this.rateWindows.set(key, { startedAt: now, count: 1 });
      return;
    }
    if (current.count >= RATE_LIMIT_MAX_ATTEMPTS) {
      throw new HttpException(
        {
          code: 'RATE_LIMITED',
          message: 'Muitas tentativas. Aguarde 15 minutos e tente novamente.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    current.count++;
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
    this.checkRateLimit('login', clientKey);
    const identifier = login.trim();
    if (!identifier || identifier.length > 254 || !validPassword(password)) {
      await this.burnPasswordVerification(password);
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
    )
      throw invalidCredentials();

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
    clientKey: string,
  ): Promise<void> {
    this.checkRateLimit('invitation', clientKey);
    if (
      !token ||
      token.length > 128 ||
      !validFullName(realName) ||
      !validUsername(username) ||
      !validPassword(password)
    ) {
      throw new ConflictException({
        code: 'INVALID_INVITATION',
        message: 'Convite inválido ou indisponível.',
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
    if (invitation.attemptCount >= RATE_LIMIT_MAX_ATTEMPTS) {
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
          attemptCount: { lt: RATE_LIMIT_MAX_ATTEMPTS },
        },
        data: { attemptCount: { increment: 1 } },
      });
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
          attemptCount: { lt: RATE_LIMIT_MAX_ATTEMPTS },
        },
        data: { usedAt: new Date() },
      });
      if (claimed.count !== 1) return false;
      await tx.user.update({
        where: { id: invitation.userId, status: 'pending_invitation' },
        data: {
          username: username.toLowerCase(),
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
