#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/6f754abe4841e49134928f18da86ae2bc3d0520823cc0ce853eb25b020878367/contract';
import endContract from '../../snapshots/6f754abe4841e49134928f18da86ae2bc3d0520823cc0ce853eb25b020878367/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/dbb55a2b187581d07408cad05177b9a880c7f9317e6040a6f6ce62f719d7e122/contract';
import startContract from '../../snapshots/dbb55a2b187581d07408cad05177b9a880c7f9317e6040a6f6ce62f719d7e122/contract.json' with { type: 'json' };
import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropDefault({ schema: 'public', table: 'Environment', column: 'updatedAt' }),
      this.dropDefault({ schema: 'public', table: 'Project', column: 'updatedAt' }),
      this.dropDefault({ schema: 'public', table: 'Repository', column: 'updatedAt' }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
