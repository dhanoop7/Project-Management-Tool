import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Temporal } from 'temporal-polyfill';

import { PrismaService } from '../../prisma/prisma.service';
import type { UserRole } from '../auth/types/authenticated-user';
import { CreateRepositoryMemberDto } from './dto/create-repository-member.dto';
import { UpdateRepositoryMemberDto } from './dto/update-repository-member.dto';
import { RepositoriesService } from './repositories.service';

@Injectable()
export class RepositoryMembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repositoriesService: RepositoriesService,
  ) {}

  async getMembers(
    slug: string,
    userId: number,
    role: UserRole,
  ) {
    const repository =
      await this.repositoriesService.assertCanManageMembers(
        slug,
        userId,
        role,
      );

    return this.prisma.client.orm.public.RepositoryMember
      .where({
        repositoryId: repository.id,
      })
      .all();
  }

  async addMember(
    slug: string,
    dto: CreateRepositoryMemberDto,
    userId: number,
    role: UserRole,
  ) {
    const repository =
      await this.repositoriesService.assertCanManageMembers(
        slug,
        userId,
        role,
      );

    const targetUser =
      await this.prisma.client.orm.public.User.where({
        username: dto.username,
      }).first();

    if (!targetUser) {
      throw new NotFoundException(
        `User "${dto.username}" not found`,
      );
    }

    if (targetUser.id === repository.createdById) {
      throw new ConflictException(
        'The repository owner does not need to be added as a member',
      );
    }

    const existingMember =
      await this.prisma.client.orm.public.RepositoryMember.where({
        repositoryId: repository.id,
        userId: targetUser.id,
      }).first();

    if (existingMember) {
      throw new ConflictException(
        `User "${dto.username}" is already a repository member`,
      );
    }

    const now = Temporal.Now.instant();

    return this.prisma.client.orm.public.RepositoryMember.create({
      repositoryId: repository.id,
      userId: targetUser.id,
      role: dto.role,
      createdAt: now,
      updatedAt: now,
    });
  }

  async updateMember(
    slug: string,
    targetUserId: number,
    dto: UpdateRepositoryMemberDto,
    userId: number,
    role: UserRole,
  ) {
    this.assertValidUserId(targetUserId);

    const repository =
      await this.repositoriesService.assertCanManageMembers(
        slug,
        userId,
        role,
      );

    if (targetUserId === repository.createdById) {
      throw new ConflictException(
        'The repository owner cannot be modified as a member',
      );
    }

    const member =
      await this.prisma.client.orm.public.RepositoryMember.where({
        repositoryId: repository.id,
        userId: targetUserId,
      }).first();

    if (!member) {
      throw new NotFoundException(
        'Repository member not found',
      );
    }

    return this.prisma.client.orm.public.RepositoryMember.where({
      repositoryId: repository.id,
      userId: targetUserId,
    }).update({
      role: dto.role,
      updatedAt: Temporal.Now.instant(),
    });
  }

  async removeMember(
    slug: string,
    targetUserId: number,
    userId: number,
    role: UserRole,
  ) {
    this.assertValidUserId(targetUserId);

    const repository =
      await this.repositoriesService.assertCanManageMembers(
        slug,
        userId,
        role,
      );

    if (targetUserId === repository.createdById) {
      throw new ConflictException(
        'The repository owner cannot be removed as a member',
      );
    }

    const member =
      await this.prisma.client.orm.public.RepositoryMember.where({
        repositoryId: repository.id,
        userId: targetUserId,
      }).first();

    if (!member) {
      throw new NotFoundException(
        'Repository member not found',
      );
    }

    await this.prisma.client.orm.public.RepositoryMember.where({
      repositoryId: repository.id,
      userId: targetUserId,
    }).delete();

    return {
      message: 'Repository member removed successfully',
    };
  }

  private assertValidUserId(userId: number) {
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new BadRequestException('Invalid user ID');
    }
  }
}
