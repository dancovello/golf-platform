import * as migration_20261011_072736_initial from './20261011_072736_initial';
import * as migration_20261011_082024_club_content from './20261011_082024_club_content';
import * as migration_20261011_083631_two_factor from './20261011_083631_two_factor';
import * as migration_20261011_173431_app_role_grants from './20261011_173431_app_role_grants';

export const migrations = [
  {
    up: migration_20261011_072736_initial.up,
    down: migration_20261011_072736_initial.down,
    name: '20261011_072736_initial',
  },
  {
    up: migration_20261011_082024_club_content.up,
    down: migration_20261011_082024_club_content.down,
    name: '20261011_082024_club_content',
  },
  {
    up: migration_20261011_083631_two_factor.up,
    down: migration_20261011_083631_two_factor.down,
    name: '20261011_083631_two_factor',
  },
  {
    up: migration_20261011_173431_app_role_grants.up,
    down: migration_20261011_173431_app_role_grants.down,
    name: '20261011_173431_app_role_grants'
  },
];
