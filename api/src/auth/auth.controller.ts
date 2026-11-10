import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import {
  CSRF_COOKIE,
  SESSION_ABSOLUTE_HOURS,
  SESSION_COOKIE,
  assertTrustedMutation,
  createOpaqueToken,
  readCookie,
} from './auth.security.js';

type JsonBody = Record<string, unknown>;

function requiredString(body: JsonBody, field: string): string {
  const value = body[field];
  if (typeof value !== 'string') return '';
  return value;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  private cookieOptions() {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/api/v1',
    };
  }

  private setCsrfCookie(
    response: Response,
    token = createOpaqueToken(),
  ): string {
    response.cookie(CSRF_COOKIE, token, {
      ...this.cookieOptions(),
      maxAge: SESSION_ABSOLUTE_HOURS * 60 * 60 * 1000,
    });
    return token;
  }

  private rotateSessionCookie(response: Response, token: string): void {
    response.cookie(SESSION_COOKIE, token, {
      ...this.cookieOptions(),
      maxAge: SESSION_ABSOLUTE_HOURS * 60 * 60 * 1000,
    });
  }

  @Get('csrf')
  csrf(@Res({ passthrough: true }) response: Response) {
    const token = this.setCsrfCookie(response);
    return { data: { token } };
  }

  @Post('login')
  async login(
    @Req() request: Request,
    @Body() body: JsonBody = {},
    @Res({ passthrough: true }) response: Response,
  ) {
    assertTrustedMutation(request);
    const login = requiredString(body, 'login');
    const password = requiredString(body, 'password');
    const result = await this.auth.login(
      login,
      password,
      request.socket.remoteAddress ?? 'unknown',
      request.header('user-agent'),
    );
    this.rotateSessionCookie(response, result.sessionToken);
    this.setCsrfCookie(response);
    return { data: result.account };
  }

  @Post('logout')
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    assertTrustedMutation(request);
    await this.auth.logout(readCookie(request, SESSION_COOKIE));
    response.clearCookie(SESSION_COOKIE, this.cookieOptions());
    this.setCsrfCookie(response);
    return { data: { loggedOut: true } };
  }

  @Get('me')
  async me(@Req() request: Request) {
    const account = await this.auth.currentAccount(
      readCookie(request, SESSION_COOKIE),
    );
    return { data: account };
  }

  @Post('invitations/accept')
  async acceptInvitation(@Req() request: Request, @Body() body: JsonBody = {}) {
    assertTrustedMutation(request);
    await this.auth.acceptInvitation(
      requiredString(body, 'token'),
      requiredString(body, 'realName'),
      requiredString(body, 'username'),
      requiredString(body, 'password'),
      request.socket.remoteAddress ?? 'unknown',
    );
    return { data: { accepted: true } };
  }
}
