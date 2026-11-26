import { Controller, Get, Param, Query } from '@nestjs/common';
import { PublicCatalogService } from './public-catalog.service.js';
import { parseCatalogQuery } from './public-query.js';

@Controller('boxes')
export class BoxesController {
  constructor(private readonly catalog: PublicCatalogService) {}

  @Get()
  list(@Query() query: Record<string, unknown>) {
    return this.catalog.boxes(parseCatalogQuery(query, 'boxes'));
  }

  @Get(':slug')
  detail(@Param('slug') slug: string) {
    return this.catalog.box(slug);
  }
}
