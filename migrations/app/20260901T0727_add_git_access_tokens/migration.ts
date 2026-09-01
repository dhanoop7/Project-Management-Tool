#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/2427b37332c351ce59ded9265235097d9f2b4f6dc28d6add87aa361066dd324c/contract';
import startContract from '../../snapshots/2427b37332c351ce59ded9265235097d9f2b4f6dc28d6add87aa361066dd324c/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/2f647eba3c98366610b52b520bd72ec6baf50e8b85e98c37f81e1ac418997779/contract';
import endContract from '../../snapshots/2f647eba3c98366610b52b520bd72ec6baf50e8b85e98c37f81e1ac418997779/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'gitAccessToken',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('expiresAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('revokedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('tokenHash', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('userId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'gitAccessToken',
        constraint: 'gitAccessToken_tokenHash_key',
        columns: ['tokenHash'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'gitAccessToken',
        index: 'gitAccessToken_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'gitAccessToken',
        foreignKey: {
          name: 'gitAccessToken_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
