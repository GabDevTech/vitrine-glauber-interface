import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ManagementAccessGuard,
  type ManagementRequest,
} from './management-access.guard.js';
import { Roles } from './roles.decorator.js';
import { ManagementCategoriesService } from './management-categories.service.js';
import type { JsonBody } from './editorial-validation.js';

@Controller('management/categories')
@UseGuards(ManagementAccessGuard)
export class ManagementCategoriesController {
  constructor(private readonly categories: ManagementCategoriesService) {}

  @Get()
  @Roles('editor', 'moderator', 'admin')
  list() {
    return this.categories.list();
  }

  @Post()
  @Roles('admin')
  create(@Req() request: ManagementRequest, @Body() body: JsonBody = {}) {
    return this.categories.create(BigInt(request.managementUser!.id), body);
  }

  @Patch(':id')
  @Roles('admin')
  update(
    @Req() request: ManagementRequest,
    @Param('id') id: string,
    @Body() body: JsonBody = {},
  ) {
    return this.categories.update(BigInt(request.managementUser!.id), id, body);
  }

  @Post(':id/deactivate')
  @Roles('admin')
  deactivate(@Req() request: ManagementRequest, @Param('id') id: string) {
    return this.categories.deactivate(BigInt(request.managementUser!.id), id);
  }

  @Post(':id/activate')
  @Roles('admin')
  activate(@Req() request: ManagementRequest, @Param('id') id: string) {
    return this.categories.activate(BigInt(request.managementUser!.id), id);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Req() request: ManagementRequest, @Param('id') id: string) {
    return this.categories.remove(BigInt(request.managementUser!.id), id);
  }
}
