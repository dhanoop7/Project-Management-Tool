import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

describe('TasksController', () => {
  let controller: TasksController;
  const tasksService = {
    getTasks: jest.fn(),
    createTask: jest.fn(),
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
    }).compile();

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
      createdById: 1,
    };

    await expect(controller.createTask(dto)).resolves.toEqual({ id: 1 });
    expect(tasksService.createTask).toHaveBeenCalledWith(dto);
  });
});
