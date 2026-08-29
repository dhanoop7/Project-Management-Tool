import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TasksModule } from './modules/tasks/tasks.module';
import { CommentsModule } from './modules/comments/comments.module';
import { SubscribersModule } from './modules/subscribers/subscribers.module';
import { TagsModule } from './modules/tags/tags.module';

@Module({
  imports: [TasksModule, CommentsModule, SubscribersModule, TagsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}