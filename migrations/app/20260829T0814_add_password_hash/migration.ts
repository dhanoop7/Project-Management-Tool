#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/31d22b49d3c14874e3b6461f73e962a803a77a717904403733313f9cd24fa29a/contract';
import startContract from '../../snapshots/31d22b49d3c14874e3b6461f73e962a803a77a717904403733313f9cd24fa29a/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/ede5dcf8bbb6b82317a15bfd12ff5205016c7acd21270223e4d0e178e3e39123/contract';
import endContract from '../../snapshots/ede5dcf8bbb6b82317a15bfd12ff5205016c7acd21270223e4d0e178e3e39123/contract.json' with { type: 'json' };
import { col } from '@prisma/orm-family-sql/relational-core/contract-free';
import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'user',
        column: col('passwordHash', 'text'),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
