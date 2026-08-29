import { Injectable, NotFoundException } from '@nestjs/common';
import { Temporal } from 'temporal-polyfill';

import { PrismaService } from '../../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async createComment(taskId: number, createCommentDto: CreateCommentDto) {
    const task = await this.prisma.client.orm.public.Task.where({
      id: taskId,
    }).first();

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    const now = Temporal.Now.instant();

    return this.prisma.client.orm.public.TaskComment.create({
      taskId,
      userId: createCommentDto.userId,
      content: createCommentDto.content,
      createdAt: now,
      updatedAt: now,
    });
  }

  async getComments(taskId: number) {
    const task = await this.prisma.client.orm.public.Task.where({
      id: taskId,
    }).first();

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    return this.prisma.client.orm.public.TaskComment.where({ taskId }).all();
  }

  async deleteComment(taskId: number, commentId: number) {
    const comment = await this.prisma.client.orm.public.TaskComment.where({
      id: commentId,
      taskId,
    }).first();

    if (!comment) {
      throw new NotFoundException(
        `Comment with ID ${commentId} not found for task ${taskId}`,
      );
    }

    await this.prisma.client.orm.public.TaskComment.where({
      id: commentId,
      taskId,
    }).delete();

    return {
      message: `Comment with ID ${commentId} deleted successfully`,
    };
  }
}
