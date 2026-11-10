import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service.js';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async check(): Promise<{ data: { status: 'ok'; database: 'ok' } }> {
    return this.healthService.check();
  }
}
