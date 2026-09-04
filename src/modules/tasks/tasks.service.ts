import { Injectable, NotFoundException } from '@nestjs/common';
import { Temporal } from 'temporal-polyfill';

import { PrismaService } from '../../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async getTasks() {
    return this.prisma.client.orm.public.Task.all();
  }

  async getTask(id: number) {
    const task =
      await this.prisma.client.orm.public.Task.where({
        id,
      }).first();

    if (!task) {
      throw new NotFoundException(
        `Task with ID ${id} not found`,
      );
    }

    return task;
  }

  async createTask(
    createTaskDto: CreateTaskDto,
    userId: number,
  ) {
    const existingTasks =
      await this.prisma.client.orm.public.Task
        .select('taskNumber')
        .all();

    const taskNumber =
      existingTasks.reduce(
        (highestTaskNumber, task) =>
          Math.max(
            highestTaskNumber,
            task.taskNumber,
          ),
        0,
      ) + 1;

    const now = Temporal.Now.instant();

    const task =
      await this.prisma.client.orm.public.Task.create({
        taskNumber,
        title: createTaskDto.title,
        description:
          createTaskDto.description ?? null,
        status:
          createTaskDto.status ?? 'OPEN',
        priority:
          createTaskDto.priority ?? 'NORMAL',
        visibility:
          createTaskDto.visibility ?? 'ALL_USERS',
        createdById: userId,
        assignedToId:
          createTaskDto.assignedToId ?? null,
        parentTaskId:
          createTaskDto.parentTaskId ?? null,
        createdAt: now,
        updatedAt: now,
      });

    await this.prisma.client.orm.public.TaskActivity.create({
      taskId: task.id,
      userId,
      type: 'CREATED',
      oldValue: null,
      newValue: null,
      comment: null,
      createdAt: now,
    });

    return task;
  }

  async updateTask(
    id: number,
    updateTaskDto: UpdateTaskDto,
    userId: number,
  ) {
    const task =
      await this.prisma.client.orm.public.Task.where({
        id,
      }).first();

    if (!task) {
      throw new NotFoundException(
        `Task with ID ${id} not found`,
      );
    }

    const now = Temporal.Now.instant();

    const {
      title,
      description,
      status,
      priority,
      visibility,
      assignedToId,
      parentTaskId,
    } = updateTaskDto;

    const updatedTask =
      await this.prisma.client.orm.public.Task.where({
        id,
      }).update({
        ...(title !== undefined && { title }),
        ...(description !== undefined && {
          description,
        }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(visibility !== undefined && {
          visibility,
        }),
        ...(assignedToId !== undefined && {
          assignedToId,
        }),
        ...(parentTaskId !== undefined && {
          parentTaskId,
        }),
        updatedAt: now,
      });

    if (
      priority !== undefined &&
      priority !== task.priority
    ) {
      await this.prisma.client.orm.public.TaskActivity.create({
        taskId: id,
        userId,
        type: 'PRIORITY_CHANGED',
        oldValue: task.priority,
        newValue: priority,
        comment: null,
        createdAt: now,
      });
    }

    if (
      status !== undefined &&
      status !== task.status
    ) {
      await this.prisma.client.orm.public.TaskActivity.create({
        taskId: id,
        userId,
        type: 'STATUS_CHANGED',
        oldValue: task.status,
        newValue: status,
        comment: null,
        createdAt: now,
      });
    }

    if (
      assignedToId !== undefined &&
      assignedToId !== task.assignedToId
    ) {
      await this.prisma.client.orm.public.TaskActivity.create({
        taskId: id,
        userId,
        type: 'ASSIGNED',
        oldValue:
          task.assignedToId !== null
            ? String(task.assignedToId)
            : null,
        newValue: String(assignedToId),
        comment: null,
        createdAt: now,
      });
    }

    return updatedTask;
  }

  async deleteTask(id: number) {
    const task =
      await this.prisma.client.orm.public.Task.where({
        id,
      }).first();

    if (!task) {
      throw new NotFoundException(
        `Task with ID ${id} not found`,
      );
    }

    // Unlink any subtasks referencing this task
    await this.prisma.client.orm.public.Task.where({
      parentTaskId: id,
    }).update({
      parentTaskId: null,
    });

    // Cascade delete dependent task records
    await this.prisma.client.orm.public.TaskActivity.where({
      taskId: id,
    }).delete();

    await this.prisma.client.orm.public.TaskComment.where({
      taskId: id,
    }).delete();

    await this.prisma.client.orm.public.TaskSubscriber.where({
      taskId: id,
    }).delete();

    await this.prisma.client.orm.public.TaskTag.where({
      taskId: id,
    }).delete();

    // Delete the task
    await this.prisma.client.orm.public.Task.where({
      id,
    }).delete();

    return {
      message: `Task with ID ${id} deleted successfully`,
    };
  }

  async getActivities(taskId: number) {
    const task =
      await this.prisma.client.orm.public.Task.where({
        id: taskId,
      }).first();

    if (!task) {
      throw new NotFoundException(
        `Task with ID ${taskId} not found`,
      );
    }

    return this.prisma.client.orm.public.TaskActivity
      .where({ taskId })
      .all();
  }
}