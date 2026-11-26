import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { ManagementAccessGuard } from './management-access.guard.js';
import { ManagementBoxesController } from './management-boxes.controller.js';
import { ManagementBoxesService } from './management-boxes.service.js';
import { ManagementCategoriesController } from './management-categories.controller.js';
import { ManagementCategoriesService } from './management-categories.service.js';
import { ManagementMediaController } from './management-media.controller.js';
import { ManagementMediaService } from './management-media.service.js';
import { ManagementProductsController } from './management-products.controller.js';
import { ManagementProductsService } from './management-products.service.js';

@Module({
  imports: [AuthModule],
  controllers: [
    ManagementBoxesController,
    ManagementProductsController,
    ManagementCategoriesController,
    ManagementMediaController,
  ],
  providers: [
    ManagementAccessGuard,
    ManagementBoxesService,
    ManagementProductsService,
    ManagementCategoriesService,
    ManagementMediaService,
  ],
})
export class ManagementModule {}
