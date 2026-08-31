import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { GitService } from './git.service';
import { RepositoriesController } from './repositories.controller';
import { RepositoriesService } from './repositories.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [RepositoriesController],
  providers: [GitService, RepositoriesService],
})
export class RepositoriesModule {}
