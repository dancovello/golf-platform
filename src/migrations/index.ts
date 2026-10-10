import * as migration_20261010_201201_initial from './20261010_201201_initial';
import * as migration_20261010_221827_tenants_accounts from './20261010_221827_tenants_accounts';
import * as migration_20261010_222735_drop_document_locks from './20261010_222735_drop_document_locks';

export const migrations = [
  {
    up: migration_20261010_201201_initial.up,
    down: migration_20261010_201201_initial.down,
    name: '20261010_201201_initial',
  },
  {
    up: migration_20261010_221827_tenants_accounts.up,
    down: migration_20261010_221827_tenants_accounts.down,
    name: '20261010_221827_tenants_accounts',
  },
  {
    up: migration_20261010_222735_drop_document_locks.up,
    down: migration_20261010_222735_drop_document_locks.down,
    name: '20261010_222735_drop_document_locks'
  },
];
