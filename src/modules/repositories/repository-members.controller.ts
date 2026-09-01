import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/types/authenticated-user';

import { CreateRepositoryMemberDto } from './dto/create-repository-member.dto';
import { UpdateRepositoryMemberDto } from './dto/update-repository-member.dto';
import { RepositoryMembersService } from './repository-members.service';

@Controller('repositories/:slug/members')
@UseGuards(JwtAuthGuard)
export class RepositoryMembersController {
  constructor(
    private readonly repositoryMembersService: RepositoryMembersService,
  ) {}

  @Get()
  getMembers(@Param('slug') slug: string) {
    return this.repositoryMembersService.getMembers(slug);
  }

  @Post()
  addMember(
    @Param('slug') slug: string,
    @Body() dto: CreateRepositoryMemberDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.repositoryMembersService.addMember(
      slug,
      dto,
      req.user.userId,
      req.user.role,
    );
  }

  @Patch(':userId')
  updateMember(
    @Param('slug') slug: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateRepositoryMemberDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.repositoryMembersService.updateMember(
      slug,
      Number(userId),
      dto,
      req.user.userId,
      req.user.role,
    );
  }

  @Delete(':userId')
  removeMember(
    @Param('slug') slug: string,
    @Param('userId') userId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.repositoryMembersService.removeMember(
      slug,
      Number(userId),
      req.user.userId,
      req.user.role,
    );
  }
}