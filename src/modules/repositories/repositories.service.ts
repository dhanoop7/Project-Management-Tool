import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Temporal } from 'temporal-polyfill';

import { PrismaService } from '../../prisma/prisma.service';
import { CreateRepositoryDto } from './dto/create-repository.dto';
import { UpdateRepositoryDto } from './dto/update-repository.dto';
import { GitService } from './git.service';

@Injectable()
export class RepositoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gitService: GitService,
  ) {}

  async getRepositories() {
    return this.prisma.client.orm.public.Repository.all();
  }

  async getRepository(slug: string) {
    const repository =
      await this.prisma.client.orm.public.Repository.where({
        slug,
      }).first();

    if (!repository) {
      throw new NotFoundException(
        `Repository "${slug}" not found`,
      );
    }

    return repository;
  }

  async createRepository(
    createRepositoryDto: CreateRepositoryDto,
    userId: number,
  ) {
    const existingRepository =
      await this.prisma.client.orm.public.Repository.where({
        slug: createRepositoryDto.slug,
      }).first();

    if (existingRepository) {
      throw new ConflictException(
        `Repository "${createRepositoryDto.slug}" already exists`,
      );
    }

    const localPath = this.gitService.getRepositoryPath(
      createRepositoryDto.slug,
    );

    if (await this.gitService.pathExists(localPath)) {
      throw new ConflictException(
        `Repository storage already exists for "${createRepositoryDto.slug}"`,
      );
    }

    await this.gitService.initBareRepository(localPath);

    const now = Temporal.Now.instant();

    return this.prisma.client.orm.public.Repository.create({
      name: createRepositoryDto.name,
      slug: createRepositoryDto.slug,
      description: createRepositoryDto.description ?? null,
      localPath,
      visibility:
        createRepositoryDto.visibility ?? 'PRIVATE',
      createdById: userId,
      createdAt: now,
      updatedAt: now,
    });
  }

  async updateRepository(
    slug: string,
    updateRepositoryDto: UpdateRepositoryDto,
  ) {
    await this.getRepository(slug);

    return this.prisma.client.orm.public.Repository.where({
      slug,
    }).update({
      ...(updateRepositoryDto.name !== undefined && {
        name: updateRepositoryDto.name,
      }),
      ...(updateRepositoryDto.description !== undefined && {
        description: updateRepositoryDto.description,
      }),
      ...(updateRepositoryDto.visibility !== undefined && {
        visibility: updateRepositoryDto.visibility,
      }),
      updatedAt: Temporal.Now.instant(),
    });
  }

  async getBranches(slug: string) {
    const repository = await this.getRepository(slug);

    return this.gitService.listBranches(repository.localPath);
  }

  async getCommits(slug: string, ref?: string) {
    const repository = await this.getRepository(slug);

    return this.gitService.listCommits(
      repository.localPath,
      ref ?? 'HEAD',
    );
  }

  async getTree(
    slug: string,
    ref?: string,
    repositoryFilePath?: string,
  ) {
    const repository = await this.getRepository(slug);

    return this.gitService.listTree(
      repository.localPath,
      ref ?? 'HEAD',
      repositoryFilePath ?? '',
    );
  }

  async getBlob(
    slug: string,
    ref: string | undefined,
    repositoryFilePath: string,
  ) {
    const repository = await this.getRepository(slug);

    return this.gitService.readBlob(
      repository.localPath,
      ref ?? 'HEAD',
      repositoryFilePath,
    );
  }
}
