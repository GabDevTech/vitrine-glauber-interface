import { Module } from '@nestjs/common';
import { BoxesController } from './boxes.controller.js';
import { CategoriesController } from './categories.controller.js';
import { MediaController } from './media.controller.js';
import { ProductsController } from './products.controller.js';
import { PublicCatalogService } from './public-catalog.service.js';

@Module({
  controllers: [
    CategoriesController,
    BoxesController,
    ProductsController,
    MediaController,
  ],
  providers: [PublicCatalogService],
})
export class PublicCatalogModule {}
