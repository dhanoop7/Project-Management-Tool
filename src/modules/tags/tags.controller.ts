import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';

import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { AddTagToTaskDto } from './dto/add-tag-to-task.dto';

@Controller()
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post('tags')
  createTag(@Body() createTagDto: CreateTagDto) {
    return this.tagsService.createTag(createTagDto);
  }

  @Get('tags')
  getTags() {
    return this.tagsService.getTags();
  }

  @Post('tasks/:taskId/tags')
  addTagToTask(
    @Param('taskId') taskId: string,
    @Body() addTagDto: AddTagToTaskDto,
  ) {
    return this.tagsService.addTagToTask(Number(taskId), addTagDto);
  }

  @Get('tasks/:taskId/tags')
  getTaskTags(@Param('taskId') taskId: string) {
    return this.tagsService.getTaskTags(Number(taskId));
  }

  @Delete('tasks/:taskId/tags/:tagId')
  removeTagFromTask(
    @Param('taskId') taskId: string,
    @Param('tagId') tagId: string,
  ) {
    return this.tagsService.removeTagFromTask(Number(taskId), Number(tagId));
  }
}
