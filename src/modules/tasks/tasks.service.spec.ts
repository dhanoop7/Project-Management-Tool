import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { TasksService } from './tasks.service';

describe('TasksService', () => {
  let service: TasksService;
  const prismaService = {
    client: {
      orm: {
        public: {
          Task: {
            all: jest.fn(),
            select: jest.fn(),
            create: jest.fn(),
          },
        },
      },
    },
  };

  beforeEach(async () => {
    prismaService.client.orm.public.Task.all.mockResolvedValue([]);
    prismaService.client.orm.public.Task.select.mockReturnValue({
      all: jest.fn().mockResolvedValue([{ taskNumber: 41 }]),
    });
    prismaService.client.orm.public.Task.create.mockImplementation((task) =>
      Promise.resolve(task),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return tasks from prisma', async () => {
    await expect(service.getTasks()).resolves.toEqual([]);
    expect(prismaService.client.orm.public.Task.all).toHaveBeenCalledTimes(1);
  });

  it('should create a task with generated fields', async () => {
    await expect(
      service.createTask({
        title: 'Build Maniphest create',
        description: 'Wire POST /tasks',
        createdById: 1,
      }),
    ).resolves.toMatchObject({
      taskNumber: 42,
      title: 'Build Maniphest create',
      description: 'Wire POST /tasks',
      status: 'OPEN',
      priority: 'NORMAL',
      visibility: 'ALL_USERS',
      createdById: 1,
      assignedToId: null,
      parentTaskId: null,
    });

    expect(prismaService.client.orm.public.Task.create).toHaveBeenCalledTimes(1);
  });
});
