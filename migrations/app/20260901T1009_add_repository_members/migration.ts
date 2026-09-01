#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/2f647eba3c98366610b52b520bd72ec6baf50e8b85e98c37f81e1ac418997779/contract';
import startContract from '../../snapshots/2f647eba3c98366610b52b520bd72ec6baf50e8b85e98c37f81e1ac418997779/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/bb2b9683ad1b5d9f2e570daec6956a1e2ad05cc2e848a8ad29055bd370bb1ef3/contract';
import endContract from '../../snapshots/bb2b9683ad1b5d9f2e570daec6956a1e2ad05cc2e848a8ad29055bd370bb1ef3/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  primaryKey,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'repositoryMember',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('repositoryId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('role', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('userId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [
          primaryKey(['repositoryId', 'userId']),
          checkExpression(
            'repositoryMember_role_check_0f360d06',
            "\"role\" IN ('READ', 'WRITE', 'ADMIN')",
          ),
        ],
      }),
      this.createIndex({
        schema: 'public',
        table: 'repositoryMember',
        index: 'repositoryMember_repositoryId_idx_dce7a8ba',
        columns: ['repositoryId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'repositoryMember',
        index: 'repositoryMember_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'repositoryMember',
        foreignKey: {
          name: 'repositoryMember_repositoryId_fkey',
          columns: ['repositoryId'],
          references: { schema: 'public', table: 'repository', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'repositoryMember',
        foreignKey: {
          name: 'repositoryMember_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
