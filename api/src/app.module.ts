import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js';
import { PublicCatalogModule } from './catalog/public-catalog.module.js';
import { DatabaseModule } from './database/database.module.js';
import { HealthModule } from './health/health.module.js';

@Module({
  imports: [DatabaseModule, AuthModule, HealthModule, PublicCatalogModule],
})
export class AppModule {}
