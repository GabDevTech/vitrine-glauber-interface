import { Controller, Get, Query } from '@nestjs/common';
import { PublicCatalogService } from './public-catalog.service.js';
import { parseCatalogQuery } from './public-query.js';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly catalog: PublicCatalogService) {}

  @Get()
  list(@Query() query: Record<string, unknown>) {
    return this.catalog.categories(parseCatalogQuery(query, 'categories'));
  }
}
