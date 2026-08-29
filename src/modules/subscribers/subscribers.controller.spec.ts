import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubscribersController } from './subscribers.controller';
import { SubscribersService } from './subscribers.service';

describe('SubscribersController', () => {
  let controller: SubscribersController;
  const subscribersService = {
    addSubscriber: jest.fn(),
    getSubscribers: jest.fn(),
    removeSubscriber: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubscribersController],
      providers: [
        {
          provide: SubscribersService,
          useValue: subscribersService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<SubscribersController>(SubscribersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
