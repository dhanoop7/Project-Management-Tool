import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/types/authenticated-user';

import { CreateGitAccessTokenDto } from './dto/create-git-access-token.dto';
import { GitAccessTokenService } from './git-access-token.service';

@Controller('auth/git-tokens')
@UseGuards(JwtAuthGuard)
export class GitAccessTokenController {
  constructor(
    private readonly gitAccessTokenService: GitAccessTokenService,
  ) {}

  @Post()
  createToken(
    @Body() dto: CreateGitAccessTokenDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.gitAccessTokenService.createToken(
      req.user.userId,
      dto.name,
    );
  }

  @Delete(':id')
  revokeToken(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.gitAccessTokenService.revokeToken(
      req.user.userId,
      Number(id),
    );
  }
}