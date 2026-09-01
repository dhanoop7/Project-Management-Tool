import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

import { GitAccessTokenController } from './git-access-token.controller';
import { GitAccessTokenService } from './git-access-token.service';
import { GitService } from './git.service';
import { GitTransportController } from './git-transport.controller';
import { RepositoriesController } from './repositories.controller';
import { RepositoriesService } from './repositories.service';
import { GitAuthenticationService } from './git-authentication.service';
import { RepositoryMembersController } from './repository-members.controller';
import { RepositoryMembersService } from './repository-members.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [
    RepositoriesController,
    GitTransportController,
    GitAccessTokenController,
    RepositoryMembersController,
  ],
  providers: [
    GitService,
    RepositoriesService,
    GitAccessTokenService,
    GitAuthenticationService,
    RepositoryMembersService,
  ],
})
export class RepositoriesModule {}