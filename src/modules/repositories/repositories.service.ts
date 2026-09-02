import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { UserRole } from '../auth/types/authenticated-user';
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
    const repository = await this.prisma.client.orm.public.Repository.where({
      slug,
    }).first();

    if (!repository) {
      throw new NotFoundException(`Repository "${slug}" not found`);
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
      visibility: createRepositoryDto.visibility ?? 'PRIVATE',
      createdById: userId,
      createdAt: now,
      updatedAt: now,
    });
  }

  async updateRepository(
    slug: string,
    updateRepositoryDto: UpdateRepositoryDto,
    userId: number,
    role: UserRole,
  ) {
    await this.assertCanManageRepository(slug, userId, role);

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

    return this.gitService.listCommits(repository.localPath, ref ?? 'HEAD');
  }

  async getTree(slug: string, ref?: string, repositoryFilePath?: string) {
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

  async enableHttpPush(slug: string) {
    const repository = await this.getRepository(slug);

    await this.gitService.enableHttpPush(repository.localPath);
  }

  async getCommit(slug: string, hash: string) {
    const repository = await this.getRepository(slug);

    return this.gitService.getCommit(repository.localPath, hash);
  }

  async getCommitDiff(slug: string, hash: string) {
    const repository = await this.getRepository(slug);

    return this.gitService.getCommitDiff(repository.localPath, hash);
  }

  async assertCanReadRepository(slug: string, userId: number, role: UserRole) {
    const repository = await this.getRepository(slug);

    // Public repositories can be read by anyone.
    if (repository.visibility === 'PUBLIC') {
      return repository;
    }

    // Application ADMIN has full access.
    if (role === 'ADMIN') {
      return repository;
    }

    // Repository owner has full access.
    if (repository.createdById === userId) {
      return repository;
    }

    const member = await this.prisma.client.orm.public.RepositoryMember.where({
      repositoryId: repository.id,
      userId,
    }).first();

    if (!member) {
      throw new ForbiddenException(
        'You do not have permission to access this repository',
      );
    }

    return repository;
  }

  async assertCanWriteRepository(slug: string, userId: number, role: UserRole) {
    const repository = await this.getRepository(slug);

    // Application ADMIN has full access.
    if (role === 'ADMIN') {
      return repository;
    }

    // Repository owner has full access.
    if (repository.createdById === userId) {
      return repository;
    }

    const member = await this.prisma.client.orm.public.RepositoryMember.where({
      repositoryId: repository.id,
      userId,
    }).first();

    if (!member || (member.role !== 'WRITE' && member.role !== 'ADMIN')) {
      throw new ForbiddenException(
        'You do not have permission to write to this repository',
      );
    }

    return repository;
  }

  async assertCanManageRepository(
    slug: string,
    userId: number,
    role: UserRole,
  ) {
    const repository = await this.getRepository(slug);

    if (role === 'ADMIN') {
      return repository;
    }

    if (repository.createdById !== userId) {
      const member =
        await this.prisma.client.orm.public.RepositoryMember.where({
          repositoryId: repository.id,
          userId,
        }).first();

      if (member?.role === 'ADMIN') {
        return repository;
      }

      throw new ForbiddenException(
        'You do not have permission to manage this repository',
      );
    }

    return repository;
  }

  async assertCanManageMembers(
    slug: string,
    userId: number,
    role: UserRole,
  ) {
    const repository = await this.getRepository(slug);

    if (role === 'ADMIN') {
      return repository;
    }

    if (repository.createdById === userId) {
      return repository;
    }

    const member = await this.prisma.client.orm.public.RepositoryMember.where({
      repositoryId: repository.id,
      userId,
    }).first();

    if (member?.role === 'ADMIN') {
      return repository;
    }

    throw new ForbiddenException(
      'You do not have permission to manage repository members',
    );
  }
}
