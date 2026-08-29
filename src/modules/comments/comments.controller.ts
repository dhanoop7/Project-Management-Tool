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
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller('tasks/:taskId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  createComment(
    @Param('taskId') taskId: string,
    @Body() createCommentDto: CreateCommentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.commentsService.createComment(
      Number(taskId),
      createCommentDto,
      req.user.userId,
    );
  }

  @Get()
  getComments(@Param('taskId') taskId: string) {
    return this.commentsService.getComments(Number(taskId));
  }

  @Delete(':commentId')
  @UseGuards(JwtAuthGuard)
  deleteComment(
    @Param('taskId') taskId: string,
    @Param('commentId') commentId: string,
  ) {
    return this.commentsService.deleteComment(
      Number(taskId),
      Number(commentId),
    );
  }
}
