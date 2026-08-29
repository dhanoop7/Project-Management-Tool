import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';

import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller('tasks/:taskId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  createComment(
    @Param('taskId') taskId: string,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.commentsService.createComment(Number(taskId), createCommentDto);
  }

  @Get()
  getComments(@Param('taskId') taskId: string) {
    return this.commentsService.getComments(Number(taskId));
  }

  @Delete(':commentId')
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
