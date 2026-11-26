import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { AuthService, type PublicAccount } from '../auth/auth.service.js';
import {
  SESSION_COOKIE,
  assertTrustedMutation,
  readCookie,
} from '../auth/auth.security.js';
import { ROLES_KEY, type ManagementRole } from './roles.decorator.js';

export type ManagementRequest = Request & {
  managementUser?: PublicAccount;
};

const MUTATION_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

@Injectable()
export class ManagementAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly auth: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<ManagementRequest>();
    const account = await this.auth.currentAccount(
      readCookie(request, SESSION_COOKIE),
    );
    if (MUTATION_METHODS.has(request.method.toUpperCase())) {
      assertTrustedMutation(request);
    }
    const requiredRoles = this.reflector.getAllAndOverride<ManagementRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (
      requiredRoles &&
      requiredRoles.length > 0 &&
      !requiredRoles.some((role) => account.roles.includes(role))
    ) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Você não tem permissão para realizar esta ação.',
      });
    }
    request.managementUser = account;
    return true;
  }
}
