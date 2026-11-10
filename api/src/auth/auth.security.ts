import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { ForbiddenException } from '@nestjs/common';
import type { Request } from 'express';

export const SESSION_COOKIE = 'vg_session';
export const CSRF_COOKIE = 'vg_csrf';
export const INVITATION_LIFETIME_HOURS = 24;
export const SESSION_IDLE_MINUTES = 30;
export const SESSION_ABSOLUTE_HOURS = 12;
export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
export const RATE_LIMIT_MAX_ATTEMPTS = 5;

export function createOpaqueToken(): string {
  return randomBytes(32).toString('base64url');
}

export function tokenHash(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export function readCookie(request: Request, name: string): string | undefined {
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0 || part.slice(0, separator).trim() !== name) continue;
    try {
      return decodeURIComponent(part.slice(separator + 1).trim());
    } catch {
      return undefined;
    }
  }
  return undefined;
}

export function assertTrustedMutation(request: Request): string {
  const configuredOrigin = process.env.MANAGEMENT_ORIGIN;
  let allowedOrigins: string[];
  if (configuredOrigin) {
    try {
      const origin = new URL(configuredOrigin);
      const secureInProduction =
        process.env.NODE_ENV !== 'production' || origin.protocol === 'https:';
      allowedOrigins =
        secureInProduction && ['http:', 'https:'].includes(origin.protocol)
          ? [origin.origin]
          : [];
    } catch {
      allowedOrigins = [];
    }
  } else {
    allowedOrigins =
      process.env.NODE_ENV === 'production'
        ? []
        : ['http://localhost:4175', 'http://127.0.0.1:4175'];
  }
  if (
    !request.headers.origin ||
    !allowedOrigins.includes(request.headers.origin)
  ) {
    throw new ForbiddenException({
      code: 'UNTRUSTED_ORIGIN',
      message: 'Origem da solicitação não permitida.',
    });
  }
  const cookieToken = readCookie(request, CSRF_COOKIE);
  const headerToken = request.header('X-CSRF-Token');
  if (!cookieToken || !headerToken || !safeEqual(cookieToken, headerToken)) {
    throw new ForbiddenException({
      code: 'CSRF_VALIDATION_FAILED',
      message:
        'Não foi possível validar esta solicitação. Atualize a página e tente novamente.',
    });
  }
  return cookieToken;
}

export function normalizeRealName(value: string): string {
  return value
    .normalize('NFC')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('pt-BR');
}

export function validFullName(value: string): boolean {
  const normalized = value.trim().replace(/\s+/g, ' ');
  return [...normalized].length >= 2 && [...normalized].length <= 130;
}

export function validUsername(value: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9._-]{2,29}$/.test(value);
}

export function validPassword(value: string): boolean {
  const length = [...value].length;
  return length >= 8 && length <= 130;
}
