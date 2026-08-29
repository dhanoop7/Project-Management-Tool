import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TasksModule } from './modules/tasks/tasks.module';
import { CommentsModule } from './modules/comments/comments.module';

@Module({
  imports: [TasksModule, CommentsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}