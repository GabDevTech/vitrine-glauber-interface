import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ManagementAccessGuard,
  type ManagementRequest,
} from './management-access.guard.js';
import { Roles } from './roles.decorator.js';
import { ManagementBoxesService } from './management-boxes.service.js';
import type { JsonBody } from './editorial-validation.js';

@Controller('management/boxes')
@UseGuards(ManagementAccessGuard)
export class ManagementBoxesController {
  constructor(private readonly boxes: ManagementBoxesService) {}

  @Get()
  @Roles('editor', 'moderator', 'admin')
  list(@Query() query: Record<string, unknown>) {
    return this.boxes.list(query);
  }

  @Post()
  @Roles('editor', 'moderator', 'admin')
  create(@Req() request: ManagementRequest, @Body() body: JsonBody = {}) {
    return this.boxes.create(BigInt(request.managementUser!.id), body);
  }

  @Get(':id')
  @Roles('editor', 'moderator', 'admin')
  getById(@Param('id') id: string) {
    return this.boxes.getById(id);
  }

  @Patch(':id/revision')
  @Roles('editor', 'moderator', 'admin')
  updateRevision(
    @Req() request: ManagementRequest,
    @Param('id') id: string,
    @Body() body: JsonBody = {},
  ) {
    return this.boxes.updateRevision(
      BigInt(request.managementUser!.id),
      id,
      body,
    );
  }

  @Post(':id/submit-review')
  @Roles('editor', 'moderator', 'admin')
  submitReview(@Req() request: ManagementRequest, @Param('id') id: string) {
    return this.boxes.submitReview(BigInt(request.managementUser!.id), id);
  }

  @Post(':id/approve')
  @Roles('moderator', 'admin')
  approve(@Req() request: ManagementRequest, @Param('id') id: string) {
    return this.boxes.approve(BigInt(request.managementUser!.id), id);
  }

  @Post(':id/return')
  @Roles('moderator', 'admin')
  returnRevision(
    @Req() request: ManagementRequest,
    @Param('id') id: string,
    @Body() body: JsonBody = {},
  ) {
    return this.boxes.returnRevision(
      BigInt(request.managementUser!.id),
      id,
      body,
    );
  }

  @Post(':id/publish')
  @Roles('moderator', 'admin')
  publish(@Req() request: ManagementRequest, @Param('id') id: string) {
    return this.boxes.publish(BigInt(request.managementUser!.id), id);
  }

  @Post(':id/deactivate')
  @Roles('moderator', 'admin')
  deactivate(@Req() request: ManagementRequest, @Param('id') id: string) {
    return this.boxes.deactivate(BigInt(request.managementUser!.id), id);
  }

  @Post(':id/reactivate')
  @Roles('moderator', 'admin')
  reactivate(@Req() request: ManagementRequest, @Param('id') id: string) {
    return this.boxes.reactivate(BigInt(request.managementUser!.id), id);
  }
}
