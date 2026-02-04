import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { TagsService } from './tags.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('tags')
@UseGuards(JwtAuthGuard)
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  async findAll(@Query('projectId') projectId: string) {
    return this.tagsService.findAllByProject(projectId);
  }

  @Post()
  async create(@Body() createTagDto: { projectId: string; name: string; color?: string }) {
    return this.tagsService.create(createTagDto.projectId, createTagDto.name, createTagDto.color);
  }

  @Post('assign')
  async assignTag(@Body() dto: { taskId: string; tagId: string }) {
    return this.tagsService.addTagToTask(dto.taskId, dto.tagId);
  }

  @Delete('unassign')
  async unassignTag(@Body() dto: { taskId: string; tagId: string }) {
    return this.tagsService.removeTagFromTask(dto.taskId, dto.tagId);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.tagsService.delete(id);
  }
}
