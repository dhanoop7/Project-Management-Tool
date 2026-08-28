import { Injectable, OnModuleInit } from '@nestjs/common';
import postgres from '@prisma/orm-postgres/runtime';

import type { Contract } from '../../prisma/contract.d';
import contractJson from '../../prisma/contract.json';

@Injectable()
export class PrismaService implements OnModuleInit {
  private readonly db = postgres<Contract>({
    contractJson,
    url: process.env.DATABASE_URL!,
  });

  async onModuleInit() {
    await this.db.connect();
  }

  get client() {
    return this.db;
  }
}
