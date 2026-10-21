#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/6f754abe4841e49134928f18da86ae2bc3d0520823cc0ce853eb25b020878367/contract';
import startContract from '../../snapshots/6f754abe4841e49134928f18da86ae2bc3d0520823cc0ce853eb25b020878367/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/8dfe3e7883846055b794ced386890d882d3a428fda90fd09227df5b3db18eaad/contract';
import endContract from '../../snapshots/8dfe3e7883846055b794ced386890d882d3a428fda90fd09227df5b3db18eaad/contract.json' with { type: 'json' };
import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addUnique({
        schema: 'public',
        table: 'Deployment',
        constraint: 'Deployment_projectId_environmentId_runId_key',
        columns: ['projectId', 'environmentId', 'runId'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
