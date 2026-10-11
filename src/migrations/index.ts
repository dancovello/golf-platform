import * as migration_20261011_072736_initial from './20261011_072736_initial';
import * as migration_20261011_082024_club_content from './20261011_082024_club_content';

export const migrations = [
  {
    up: migration_20261011_072736_initial.up,
    down: migration_20261011_072736_initial.down,
    name: '20261011_072736_initial',
  },
  {
    up: migration_20261011_082024_club_content.up,
    down: migration_20261011_082024_club_content.down,
    name: '20261011_082024_club_content'
  },
];
