import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/types/authenticated-user';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { AddTagToTaskDto } from './dto/add-tag-to-task.dto';

@Controller()
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post('tags')
  @UseGuards(JwtAuthGuard)
  createTag(@Body() createTagDto: CreateTagDto) {
    return this.tagsService.createTag(createTagDto);
  }

  @Get('tags')
  getTags() {
    return this.tagsService.getTags();
  }

  @Post('tasks/:taskId/tags')
  @UseGuards(JwtAuthGuard)
  addTagToTask(
    @Param('taskId') taskId: string,
    @Body() addTagDto: AddTagToTaskDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.tagsService.addTagToTask(
      Number(taskId),
      addTagDto,
      req.user.userId,
    );
  }

  @Get('tasks/:taskId/tags')
  getTaskTags(@Param('taskId') taskId: string) {
    return this.tagsService.getTaskTags(Number(taskId));
  }

  @Delete('tasks/:taskId/tags/:tagId')
  @UseGuards(JwtAuthGuard)
  removeTagFromTask(
    @Param('taskId') taskId: string,
    @Param('tagId') tagId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.tagsService.removeTagFromTask(
      Number(taskId),
      Number(tagId),
      req.user.userId,
    );
  }
}
