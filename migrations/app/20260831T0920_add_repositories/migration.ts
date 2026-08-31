#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/2427b37332c351ce59ded9265235097d9f2b4f6dc28d6add87aa361066dd324c/contract';
import endContract from '../../snapshots/2427b37332c351ce59ded9265235097d9f2b4f6dc28d6add87aa361066dd324c/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/ede5dcf8bbb6b82317a15bfd12ff5205016c7acd21270223e4d0e178e3e39123/contract';
import startContract from '../../snapshots/ede5dcf8bbb6b82317a15bfd12ff5205016c7acd21270223e4d0e178e3e39123/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  lit,
  primaryKey,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'repository',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('createdById', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('localPath', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('slug', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('visibility', 'text', {
            notNull: true,
            default: lit('PRIVATE'),
            codecRef: { codecId: 'pg/text@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'repository_visibility_check_60a8f38d',
            "\"visibility\" IN ('PUBLIC', 'PRIVATE')",
          ),
        ],
      }),
      this.addUnique({
        schema: 'public',
        table: 'repository',
        constraint: 'repository_slug_key',
        columns: ['slug'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'repository',
        index: 'repository_createdById_idx_8bf640ed',
        columns: ['createdById'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'repository',
        foreignKey: {
          name: 'repository_createdById_fkey',
          columns: ['createdById'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
