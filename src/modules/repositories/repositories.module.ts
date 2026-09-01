import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { GitService } from './git.service';
import { RepositoriesController } from './repositories.controller';
import { RepositoriesService } from './repositories.service';
import { GitTransportController } from './git-transport.controller';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [
  RepositoriesController,
  GitTransportController,
],
  providers: [GitService, RepositoriesService],
})
export class RepositoriesModule {}
