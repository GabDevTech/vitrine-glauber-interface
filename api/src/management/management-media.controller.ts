import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Post,
  Req,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ManagementAccessGuard,
  type ManagementRequest,
} from './management-access.guard.js';
import { Roles } from './roles.decorator.js';
import {
  MAX_MEDIA_BYTES,
  ManagementMediaService,
  type UploadedFileLike,
} from './management-media.service.js';

@Controller('management/media')
@UseGuards(ManagementAccessGuard)
export class ManagementMediaController {
  constructor(private readonly media: ManagementMediaService) {}

  @Post()
  @Roles('editor', 'moderator', 'admin')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_MEDIA_BYTES },
    }),
  )
  upload(
    @Req() request: ManagementRequest,
    @UploadedFile() file: UploadedFileLike | undefined,
    @Body() body: Record<string, unknown> = {},
  ) {
    return this.media.upload(
      BigInt(request.managementUser!.id),
      file,
      body.kind,
    );
  }

  @Get(':id')
  @Roles('editor', 'moderator', 'admin')
  @Header('Cache-Control', 'no-store')
  async get(@Param('id') id: string): Promise<StreamableFile> {
    const bytes = await this.media.getBytes(id);
    return new StreamableFile(bytes, { type: 'image/webp' });
  }

  @Post(':id/unlink')
  @Roles('editor', 'moderator', 'admin')
  unlink(@Req() request: ManagementRequest, @Param('id') id: string) {
    return this.media.unlinkFromDrafts(BigInt(request.managementUser!.id), id);
  }

  @Delete(':id')
  @Roles('moderator', 'admin')
  remove(@Req() request: ManagementRequest, @Param('id') id: string) {
    return this.media.remove(BigInt(request.managementUser!.id), id);
  }
}
