import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/types/authenticated-user';
import { CreateRepositoryDto } from './dto/create-repository.dto';
import { UpdateRepositoryDto } from './dto/update-repository.dto';
import { RepositoriesService } from './repositories.service';

@Controller('repositories')
export class RepositoriesController {
  constructor(
    private readonly repositoriesService: RepositoriesService,
  ) {}

  @Get()
  getRepositories() {
    return this.repositoriesService.getRepositories();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  createRepository(
    @Body() createRepositoryDto: CreateRepositoryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.repositoriesService.createRepository(
      createRepositoryDto,
      req.user.userId,
    );
  }

  @Get(':slug')
  getRepository(@Param('slug') slug: string) {
    return this.repositoriesService.getRepository(slug);
  }

  @Patch(':slug')
  @UseGuards(JwtAuthGuard)
  updateRepository(
    @Param('slug') slug: string,
    @Body() updateRepositoryDto: UpdateRepositoryDto,
  ) {
    return this.repositoriesService.updateRepository(
      slug,
      updateRepositoryDto,
    );
  }

  @Get(':slug/branches')
  getBranches(@Param('slug') slug: string) {
    return this.repositoriesService.getBranches(slug);
  }

  @Get(':slug/commits')
  getCommits(
    @Param('slug') slug: string,
    @Query('ref') ref?: string,
  ) {
    return this.repositoriesService.getCommits(slug, ref);
  }

  @Get(':slug/tree')
  getTree(
    @Param('slug') slug: string,
    @Query('ref') ref?: string,
    @Query('path') repositoryFilePath?: string,
  ) {
    return this.repositoriesService.getTree(
      slug,
      ref,
      repositoryFilePath,
    );
  }

  @Get(':slug/blob')
  getBlob(
    @Param('slug') slug: string,
    @Query('path') repositoryFilePath: string,
    @Query('ref') ref?: string,
  ) {
    return this.repositoriesService.getBlob(
      slug,
      ref,
      repositoryFilePath,
    );
  }
}
