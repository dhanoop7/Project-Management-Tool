import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';

import { SubscribersService } from './subscribers.service';
import { CreateSubscriberDto } from './dto/create-subscriber.dto';

@Controller('tasks/:taskId/subscribers')
export class SubscribersController {
  constructor(private readonly subscribersService: SubscribersService) {}

  @Post()
  addSubscriber(
    @Param('taskId') taskId: string,
    @Body() createSubscriberDto: CreateSubscriberDto,
  ) {
    return this.subscribersService.addSubscriber(
      Number(taskId),
      createSubscriberDto,
    );
  }

  @Get()
  getSubscribers(@Param('taskId') taskId: string) {
    return this.subscribersService.getSubscribers(Number(taskId));
  }

  @Delete(':userId')
  removeSubscriber(
    @Param('taskId') taskId: string,
    @Param('userId') userId: string,
  ) {
    return this.subscribersService.removeSubscriber(
      Number(taskId),
      Number(userId),
    );
  }
}
