#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/a51b4833fdaffe730572670ccc27dd89af7e0726ab3de7f428d21702d687cc15/contract';
import startContract from '../../snapshots/a51b4833fdaffe730572670ccc27dd89af7e0726ab3de7f428d21702d687cc15/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/dbb55a2b187581d07408cad05177b9a880c7f9317e6040a6f6ce62f719d7e122/contract';
import endContract from '../../snapshots/dbb55a2b187581d07408cad05177b9a880c7f9317e6040a6f6ce62f719d7e122/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  lit,
  primaryKey,
  sql,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'AuditLog',
        columns: [
          col('action', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('actorId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('entityId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('entityType', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('metadata', 'json', { notNull: true, codecRef: { codecId: 'pg/json@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'Deployment',
        columns: [
          col('commitSha', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('environmentId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('failureMessage', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('finishedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('imageRef', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('projectId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('rollbackOfId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('runAttempt', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('runId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('startedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('PENDING'),
            codecRef: { codecId: 'pg/text@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'Deployment_status_check_4b6cd632',
            sql`"status" IN ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED')`,
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'DeploymentEvent',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('deploymentId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('externalEventId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('message', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('occurredAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('status', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('type', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'DeploymentEvent_status_check_4b6cd632',
            sql`"status" IN ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED')`,
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'Environment',
        columns: [
          col('configRef', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('deployTarget', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('projectId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('type', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'Environment_type_check_f23ed8e8',
            sql`"type" IN ('DEVELOPMENT', 'STAGING', 'PRODUCTION')`,
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'Project',
        columns: [
          col('archivedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('ownerId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('slug', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'Repository',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('owner', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('projectId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('url', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'DeploymentEvent',
        constraint: 'DeploymentEvent_deploymentId_externalEventId_key',
        columns: ['deploymentId', 'externalEventId'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'Environment',
        constraint: 'Environment_projectId_type_key',
        columns: ['projectId', 'type'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'Project',
        constraint: 'Project_slug_key',
        columns: ['slug'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'Repository',
        constraint: 'Repository_projectId_key',
        columns: ['projectId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'AuditLog',
        index: 'AuditLog_actorId_createdAt_idx_0e9f1adf',
        columns: ['actorId', 'createdAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'AuditLog',
        index: 'AuditLog_entityType_entityId_createdAt_idx_e9eb579f',
        columns: ['entityType', 'entityId', 'createdAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Deployment',
        index: 'Deployment_environmentId_createdAt_idx_968ba84f',
        columns: ['environmentId', 'createdAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Deployment',
        index: 'Deployment_environmentId_idx_9d8fc227',
        columns: ['environmentId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Deployment',
        index: 'Deployment_projectId_createdAt_idx_d2d6484f',
        columns: ['projectId', 'createdAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Deployment',
        index: 'Deployment_projectId_idx_a96e4d92',
        columns: ['projectId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Deployment',
        index: 'Deployment_rollbackOfId_idx_506c05c4',
        columns: ['rollbackOfId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Deployment',
        index: 'Deployment_status_idx_e98638ab',
        columns: ['status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'DeploymentEvent',
        index: 'DeploymentEvent_deploymentId_idx_c43f40bb',
        columns: ['deploymentId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'DeploymentEvent',
        index: 'DeploymentEvent_deploymentId_occurredAt_idx_e37e2f0c',
        columns: ['deploymentId', 'occurredAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Environment',
        index: 'Environment_projectId_idx_a96e4d92',
        columns: ['projectId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Project',
        index: 'Project_ownerId_idx_e2d0c1ef',
        columns: ['ownerId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Deployment',
        foreignKey: {
          name: 'Deployment_projectId_fkey',
          columns: ['projectId'],
          references: { schema: 'public', table: 'Project', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Deployment',
        foreignKey: {
          name: 'Deployment_environmentId_fkey',
          columns: ['environmentId'],
          references: { schema: 'public', table: 'Environment', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Deployment',
        foreignKey: {
          name: 'Deployment_rollbackOfId_fkey',
          columns: ['rollbackOfId'],
          references: { schema: 'public', table: 'Deployment', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'DeploymentEvent',
        foreignKey: {
          name: 'DeploymentEvent_deploymentId_fkey',
          columns: ['deploymentId'],
          references: { schema: 'public', table: 'Deployment', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Environment',
        foreignKey: {
          name: 'Environment_projectId_fkey',
          columns: ['projectId'],
          references: { schema: 'public', table: 'Project', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Repository',
        foreignKey: {
          name: 'Repository_projectId_fkey',
          columns: ['projectId'],
          references: { schema: 'public', table: 'Project', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
