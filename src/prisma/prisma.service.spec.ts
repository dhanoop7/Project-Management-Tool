import { describe, expect, it, jest } from '@jest/globals';

const connect = jest.fn();
const postgres = jest.fn(() => ({ connect }));

jest.unstable_mockModule('@prisma/orm-postgres/runtime', () => ({
  default: postgres,
}));

const { PrismaService } = await import('./prisma.service');

describe('PrismaService', () => {
  it('should be defined', () => {
    const service = new PrismaService();

    expect(service).toBeDefined();
  });

  it('should connect on module init', async () => {
    const service = new PrismaService();

    await service.onModuleInit();

    expect(connect).toHaveBeenCalledTimes(1);
  });
});
