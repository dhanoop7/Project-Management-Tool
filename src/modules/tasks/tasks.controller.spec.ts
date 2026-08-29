import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/types/authenticated-user';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

describe('TasksController', () => {
  let controller: TasksController;
  const tasksService = {
    getTasks: jest.fn(),
    createTask: jest.fn(),
    updateTask: jest.fn(),
    deleteTask: jest.fn(),
    getTask: jest.fn(),
    getActivities: jest.fn(),
  };

  beforeEach(async () => {
    tasksService.getTasks.mockResolvedValue([]);
    tasksService.createTask.mockResolvedValue({ id: 1 });

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: TasksService,
          useValue: tasksService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<TasksController>(TasksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return tasks from the service', async () => {
    await expect(controller.getTasks()).resolves.toEqual([]);
    expect(tasksService.getTasks).toHaveBeenCalledTimes(1);
  });

  it('should create a task through the service', async () => {
    const dto = {
      title: 'Build Maniphest create',
    };
    const req = {
      user: {
        userId: 3,
        username: 'newuser',
        role: 'USER',
      },
    } as AuthenticatedRequest;

    await expect(controller.createTask(dto, req)).resolves.toEqual({ id: 1 });
    expect(tasksService.createTask).toHaveBeenCalledWith(dto, 3);
  });
});
