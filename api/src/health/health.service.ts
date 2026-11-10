import { randomUUID } from 'node:crypto';
import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<{ data: { status: 'ok'; database: 'ok' } }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { data: { status: 'ok', database: 'ok' } };
    } catch {
      const requestId = `req_${randomUUID()}`;
      throw new ServiceUnavailableException({
        statusCode: 503,
        code: 'SERVICE_UNAVAILABLE',
        message: 'Serviço temporariamente indisponível.',
        requestId,
      });
    }
  }
}
