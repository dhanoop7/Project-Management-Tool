import { Injectable, NotFoundException } from '@nestjs/common';
import { Temporal } from 'temporal-polyfill';

import { PrismaService } from '../../prisma/prisma.service';
import { CreateSubscriberDto } from './dto/create-subscriber.dto';

@Injectable()
export class SubscribersService {
  constructor(private readonly prisma: PrismaService) {}

  async addSubscriber(
    taskId: number,
    createSubscriberDto: CreateSubscriberDto,
  ) {
    const task = await this.prisma.client.orm.public.Task.where({
      id: taskId,
    }).first();

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    const now = Temporal.Now.instant();

    const subscriber =
      await this.prisma.client.orm.public.TaskSubscriber.create({
        taskId,
        userId: createSubscriberDto.userId,
        createdAt: now,
      });

    await this.prisma.client.orm.public.TaskActivity.create({
      taskId,
      userId: createSubscriberDto.userId,
      type: 'SUBSCRIBER_ADDED',
      oldValue: null,
      newValue: String(createSubscriberDto.userId),
      comment: null,
      createdAt: now,
    });

    return subscriber;
  }

  async getSubscribers(taskId: number) {
    const task = await this.prisma.client.orm.public.Task.where({
      id: taskId,
    }).first();

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    return this.prisma.client.orm.public.TaskSubscriber.where({ taskId }).all();
  }

  async removeSubscriber(taskId: number, userId: number) {
    const subscriber = await this.prisma.client.orm.public.TaskSubscriber.where(
      {
        taskId,
        userId,
      },
    ).first();

    if (!subscriber) {
      throw new NotFoundException(
        `User ${userId} is not subscribed to task ${taskId}`,
      );
    }

    const now = Temporal.Now.instant();

    await this.prisma.client.orm.public.TaskSubscriber.where({
      taskId,
      userId,
    }).delete();

    await this.prisma.client.orm.public.TaskActivity.create({
      taskId,
      userId,
      type: 'SUBSCRIBER_REMOVED',
      oldValue: String(userId),
      newValue: null,
      comment: null,
      createdAt: now,
    });

    return {
      message: `User ${userId} unsubscribed from task ${taskId} successfully`,
    };
  }
}
