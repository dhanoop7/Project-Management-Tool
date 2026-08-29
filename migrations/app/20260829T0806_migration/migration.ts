#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/31d22b49d3c14874e3b6461f73e962a803a77a717904403733313f9cd24fa29a/contract';
import endContract from '../../snapshots/31d22b49d3c14874e3b6461f73e962a803a77a717904403733313f9cd24fa29a/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/8cd90aa0acf2a156e0b5ea0cb4c8be58771e5adc473e9ea3540d3316a4320f06/contract';
import startContract from '../../snapshots/8cd90aa0acf2a156e0b5ea0cb4c8be58771e5adc473e9ea3540d3316a4320f06/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'user',
        column: col('role', 'text', {
          notNull: true,
          default: lit('USER'),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'user',
        constraint: 'user_role_check_5b1978b5',
        expression: "\"role\" IN ('ADMIN', 'USER')",
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
