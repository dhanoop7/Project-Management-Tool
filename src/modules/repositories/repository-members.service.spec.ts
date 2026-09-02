import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { jest } from '@jest/globals';

import { PrismaService } from '../../prisma/prisma.service';
import { RepositoryMembersService } from './repository-members.service';
import { RepositoriesService } from './repositories.service';

describe('RepositoryMembersService', () => {
  const repository = {
    id: 2,
    slug: 'private-test-repository',
    createdById: 7,
  };

  const targetUser = {
    id: 9,
    username: 'collab_test_user',
  };

  const repositoryMember = {
    repositoryId: repository.id,
    userId: targetUser.id,
    role: 'READ',
  };

  const prismaService = {
    client: {
      orm: {
        public: {
          User: {
            where: jest.fn(),
          },
          RepositoryMember: {
            where: jest.fn(),
            create: jest.fn(),
          },
        },
      },
    },
  };

  const repositoriesService = {
    assertCanManageMembers: jest.fn(),
  };

  let service: RepositoryMembersService;
  let userResult: typeof targetUser | null;
  let memberResult: typeof repositoryMember | null;
  let updateMock: jest.Mock;
  let deleteMock: jest.Mock;

  beforeEach(() => {
    userResult = targetUser;
    memberResult = null;
    updateMock = jest.fn().mockResolvedValue({
      ...repositoryMember,
      role: 'WRITE',
    });
    deleteMock = jest.fn().mockResolvedValue(undefined);

    repositoriesService.assertCanManageMembers.mockResolvedValue(repository);

    prismaService.client.orm.public.User.where.mockReturnValue({
      first: jest.fn().mockImplementation(() => Promise.resolve(userResult)),
    });

    prismaService.client.orm.public.RepositoryMember.where.mockReturnValue({
      all: jest.fn().mockResolvedValue([repositoryMember]),
      first: jest.fn().mockImplementation(() => Promise.resolve(memberResult)),
      update: updateMock,
      delete: deleteMock,
    });

    prismaService.client.orm.public.RepositoryMember.create.mockImplementation(
      (member) => Promise.resolve(member),
    );

    service = new RepositoryMembersService(
      prismaService as unknown as PrismaService,
      repositoriesService as unknown as RepositoriesService,
    );
  });

  it('lists members after member-management authorization', async () => {
    await service.getMembers('private-test-repository', 8, 'USER');

    expect(
      repositoriesService.assertCanManageMembers,
    ).toHaveBeenCalledWith('private-test-repository', 8, 'USER');
  });

  it('adds a collaborator by username', async () => {
    await expect(
      service.addMember(
        'private-test-repository',
        {
          username: targetUser.username,
          role: 'READ',
        },
        8,
        'USER',
      ),
    ).resolves.toMatchObject({
      repositoryId: repository.id,
      userId: targetUser.id,
      role: 'READ',
    });
  });

  it('rejects adding an unknown username', async () => {
    userResult = null;

    await expect(
      service.addMember(
        'private-test-repository',
        {
          username: 'missing_user',
          role: 'READ',
        },
        8,
        'USER',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects adding the repository owner as a collaborator', async () => {
    userResult = {
      id: repository.createdById,
      username: 'adminuser',
    };

    await expect(
      service.addMember(
        'private-test-repository',
        {
          username: 'adminuser',
          role: 'ADMIN',
        },
        8,
        'USER',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects adding the same collaborator twice', async () => {
    memberResult = repositoryMember;

    await expect(
      service.addMember(
        'private-test-repository',
        {
          username: targetUser.username,
          role: 'READ',
        },
        8,
        'USER',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('updates a collaborator role', async () => {
    memberResult = repositoryMember;

    await expect(
      service.updateMember(
        'private-test-repository',
        targetUser.id,
        {
          role: 'WRITE',
        },
        8,
        'USER',
      ),
    ).resolves.toMatchObject({
      role: 'WRITE',
    });
  });

  it('rejects changing the repository owner role', async () => {
    await expect(
      service.updateMember(
        'private-test-repository',
        repository.createdById,
        {
          role: 'READ',
        },
        8,
        'USER',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects updating an invalid user id', async () => {
    await expect(
      service.updateMember(
        'private-test-repository',
        Number.NaN,
        {
          role: 'READ',
        },
        8,
        'USER',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects updating a missing collaborator', async () => {
    await expect(
      service.updateMember(
        'private-test-repository',
        targetUser.id,
        {
          role: 'WRITE',
        },
        8,
        'USER',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('removes a collaborator', async () => {
    memberResult = repositoryMember;

    await expect(
      service.removeMember(
        'private-test-repository',
        targetUser.id,
        8,
        'USER',
      ),
    ).resolves.toEqual({
      message: 'Repository member removed successfully',
    });

    expect(deleteMock).toHaveBeenCalledTimes(1);
  });

  it('rejects removing the repository owner', async () => {
    await expect(
      service.removeMember(
        'private-test-repository',
        repository.createdById,
        8,
        'USER',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects removing a missing collaborator', async () => {
    await expect(
      service.removeMember(
        'private-test-repository',
        targetUser.id,
        8,
        'USER',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
