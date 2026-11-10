import { Controller, Get, Header, Param, StreamableFile } from '@nestjs/common';
import { PublicCatalogService } from './public-catalog.service.js';

@Controller('media')
export class MediaController {
  constructor(private readonly catalog: PublicCatalogService) {}

  @Get(':id')
  @Header('Cache-Control', 'no-store')
  async get(@Param('id') id: string): Promise<StreamableFile> {
    const bytes = await this.catalog.media(id);
    return new StreamableFile(bytes, { type: 'image/webp' });
  }
}
