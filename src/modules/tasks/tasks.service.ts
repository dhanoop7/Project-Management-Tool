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
    const task = await this.prisma.client.orm.public.Task.where({ id }).first();

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return task;
  }

  async createTask(createTaskDto: CreateTaskDto) {
    const existingTasks =
      await this.prisma.client.orm.public.Task.select('taskNumber').all();
    const taskNumber =
      existingTasks.reduce(
        (highestTaskNumber, task) =>
          Math.max(highestTaskNumber, task.taskNumber),
        0,
      ) + 1;
    const now = Temporal.Now.instant();

    return this.prisma.client.orm.public.Task.create({
      taskNumber,
      title: createTaskDto.title,
      description: createTaskDto.description ?? null,
      status: createTaskDto.status ?? 'OPEN',
      priority: createTaskDto.priority ?? 'NORMAL',
      visibility: createTaskDto.visibility ?? 'ALL_USERS',
      createdById: createTaskDto.createdById,
      assignedToId: createTaskDto.assignedToId ?? null,
      parentTaskId: createTaskDto.parentTaskId ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }

  async updateTask(id: number, updateTaskDto: UpdateTaskDto) {
    const task = await this.prisma.client.orm.public.Task.where({ id }).first();

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return this.prisma.client.orm.public.Task.where({ id }).update({
      ...updateTaskDto,
      updatedAt: Temporal.Now.instant(),
    });
  }

  async deleteTask(id: number) {
    const task = await this.prisma.client.orm.public.Task.where({ id }).first();

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    await this.prisma.client.orm.public.Task.where({ id }).delete();

    return {
      message: `Task with ID ${id} deleted successfully`,
    };
  }
}
