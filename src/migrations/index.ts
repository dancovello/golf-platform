import * as migration_20261010_201201_initial from './20261010_201201_initial'

export const migrations = [
  {
    up: migration_20261010_201201_initial.up,
    down: migration_20261010_201201_initial.down,
    name: '20261010_201201_initial',
  },
]
