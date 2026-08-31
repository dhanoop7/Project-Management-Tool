import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TasksModule } from './modules/tasks/tasks.module';
import { CommentsModule } from './modules/comments/comments.module';
import { SubscribersModule } from './modules/subscribers/subscribers.module';
import { TagsModule } from './modules/tags/tags.module';
import { AuthModule } from './modules/auth/auth.module';
import { RepositoriesModule } from './modules/repositories/repositories.module';

@Module({
  imports: [
    TasksModule,
    CommentsModule,
    SubscribersModule,
    TagsModule,
    AuthModule,
    RepositoriesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
