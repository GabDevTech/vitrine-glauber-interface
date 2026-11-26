import { Controller, Get, Param, Query } from '@nestjs/common';
import { PublicCatalogService } from './public-catalog.service.js';
import { parseCatalogQuery } from './public-query.js';

@Controller('products')
export class ProductsController {
  constructor(private readonly catalog: PublicCatalogService) {}

  @Get()
  list(@Query() query: Record<string, unknown>) {
    return this.catalog.products(parseCatalogQuery(query, 'products'));
  }

  @Get(':slug')
  detail(@Param('slug') slug: string) {
    return this.catalog.product(slug);
  }
}
