import { ForbiddenException } from '@nestjs/common';
import { jest } from '@jest/globals';

import { PrismaService } from '../../prisma/prisma.service';
import { RepositoriesService } from './repositories.service';
import { GitService } from './git.service';

describe('RepositoriesService', () => {
  const repository = {
    id: 2,
    slug: 'private-test-repository',
    createdById: 7,
    visibility: 'PRIVATE',
  };

  const prismaService = {
    client: {
      orm: {
        public: {
          Repository: {
            where: jest.fn(),
          },
          RepositoryMember: {
            where: jest.fn(),
          },
        },
      },
    },
  };

  const gitService = {};

  let service: RepositoriesService;
  let repositoryMemberRole: 'READ' | 'WRITE' | 'ADMIN' | null;

  beforeEach(() => {
    repositoryMemberRole = null;

    prismaService.client.orm.public.Repository.where.mockReturnValue({
      first: jest.fn().mockResolvedValue(repository),
    });

    prismaService.client.orm.public.RepositoryMember.where.mockReturnValue({
      first: jest.fn().mockImplementation(() =>
        Promise.resolve(
          repositoryMemberRole
            ? {
                repositoryId: repository.id,
                userId: 8,
                role: repositoryMemberRole,
              }
            : null,
        ),
      ),
    });

    service = new RepositoriesService(
      prismaService as unknown as PrismaService,
      gitService as GitService,
    );
  });

  it('allows an application admin to manage repository members', async () => {
    await expect(
      service.assertCanManageMembers(
        'private-test-repository',
        99,
        'ADMIN',
      ),
    ).resolves.toBe(repository);
  });

  it('allows the repository owner to manage repository members', async () => {
    await expect(
      service.assertCanManageMembers(
        'private-test-repository',
        repository.createdById,
        'USER',
      ),
    ).resolves.toBe(repository);
  });

  it('allows a repository admin member to manage repository members', async () => {
    repositoryMemberRole = 'ADMIN';

    await expect(
      service.assertCanManageMembers(
        'private-test-repository',
        8,
        'USER',
      ),
    ).resolves.toBe(repository);
  });

  it('rejects a repository write member from managing repository members', async () => {
    repositoryMemberRole = 'WRITE';

    await expect(
      service.assertCanManageMembers(
        'private-test-repository',
        8,
        'USER',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects a repository read member from managing repository members', async () => {
    repositoryMemberRole = 'READ';

    await expect(
      service.assertCanManageMembers(
        'private-test-repository',
        8,
        'USER',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects a non-member from managing repository members', async () => {
    await expect(
      service.assertCanManageMembers(
        'private-test-repository',
        8,
        'USER',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
