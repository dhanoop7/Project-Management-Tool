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
import { SubscribersService } from './subscribers.service';
import { CreateSubscriberDto } from './dto/create-subscriber.dto';

@Controller('tasks/:taskId/subscribers')
export class SubscribersController {
  constructor(private readonly subscribersService: SubscribersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  addSubscriber(
    @Param('taskId') taskId: string,
    @Body() createSubscriberDto: CreateSubscriberDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.subscribersService.addSubscriber(
      Number(taskId),
      createSubscriberDto,
      req.user.userId,
    );
  }

  @Get()
  getSubscribers(@Param('taskId') taskId: string) {
    return this.subscribersService.getSubscribers(Number(taskId));
  }

  @Delete(':userId')
  @UseGuards(JwtAuthGuard)
  removeSubscriber(
    @Param('taskId') taskId: string,
    @Param('userId') userId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.subscribersService.removeSubscriber(
      Number(taskId),
      Number(userId),
      req.user.userId,
    );
  }
}
