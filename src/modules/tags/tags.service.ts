import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Temporal } from 'temporal-polyfill';

import { PrismaService } from '../../prisma/prisma.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { AddTagToTaskDto } from './dto/add-tag-to-task.dto';

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  async createTag(createTagDto: CreateTagDto) {
    const existingTag = await this.prisma.client.orm.public.Tag.where({
      name: createTagDto.name,
    }).first();

    if (existingTag) {
      throw new ConflictException(`Tag "${createTagDto.name}" already exists`);
    }

    const now = Temporal.Now.instant();

    return this.prisma.client.orm.public.Tag.create({
      name: createTagDto.name,
      description: createTagDto.description ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }

  async getTags() {
    return this.prisma.client.orm.public.Tag.all();
  }

  async addTagToTask(
    taskId: number,
    addTagDto: AddTagToTaskDto,
    actorUserId: number,
  ) {
    const task = await this.prisma.client.orm.public.Task.where({
      id: taskId,
    }).first();

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    const tag = await this.prisma.client.orm.public.Tag.where({
      id: addTagDto.tagId,
    }).first();

    if (!tag) {
      throw new NotFoundException(`Tag with ID ${addTagDto.tagId} not found`);
    }

    const now = Temporal.Now.instant();

    const taskTag = await this.prisma.client.orm.public.TaskTag.create({
      taskId,
      tagId: addTagDto.tagId,
    });

    await this.prisma.client.orm.public.TaskActivity.create({
      taskId,
      userId: actorUserId,
      type: 'TAG_ADDED',
      oldValue: null,
      newValue: String(addTagDto.tagId),
      comment: null,
      createdAt: now,
    });

    return taskTag;
  }

  async getTaskTags(taskId: number) {
    const task = await this.prisma.client.orm.public.Task.where({
      id: taskId,
    }).first();

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    return this.prisma.client.orm.public.TaskTag.where({ taskId }).all();
  }

  async removeTagFromTask(
    taskId: number,
    tagId: number,
    actorUserId: number,
  ) {
    const task = await this.prisma.client.orm.public.Task.where({
      id: taskId,
    }).first();

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    const taskTag = await this.prisma.client.orm.public.TaskTag.where({
      taskId,
      tagId,
    }).first();

    if (!taskTag) {
      throw new NotFoundException(
        `Tag ${tagId} is not attached to task ${taskId}`,
      );
    }

    const now = Temporal.Now.instant();

    await this.prisma.client.orm.public.TaskTag.where({
      taskId,
      tagId,
    }).delete();

    await this.prisma.client.orm.public.TaskActivity.create({
      taskId,
      userId: actorUserId,
      type: 'TAG_REMOVED',
      oldValue: String(tagId),
      newValue: null,
      comment: null,
      createdAt: now,
    });

    return {
      message: `Tag ${tagId} removed from task ${taskId} successfully`,
    };
  }
}
