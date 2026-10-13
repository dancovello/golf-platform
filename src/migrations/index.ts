import * as migration_20261011_072736_initial from './20261011_072736_initial';
import * as migration_20261011_082024_club_content from './20261011_082024_club_content';
import * as migration_20261011_083631_two_factor from './20261011_083631_two_factor';
import * as migration_20261011_173431_app_role_grants from './20261011_173431_app_role_grants';
import * as migration_20261011_201540_branding_and_club_short_name from './20261011_201540_branding_and_club_short_name';
import * as migration_20261011_210310_media_library from './20261011_210310_media_library';
import * as migration_20261012_100706_header_and_menu from './20261012_100706_header_and_menu';
import * as migration_20261012_103407_footer from './20261012_103407_footer';
import * as migration_20261012_104849_hero_block_and_photo_sizes from './20261012_104849_hero_block_and_photo_sizes';
import * as migration_20261012_153502_cta_card_grid from './20261012_153502_cta_card_grid';
import * as migration_20261012_154742_two_column from './20261012_154742_two_column';
import * as migration_20261012_161340_rich_text from './20261012_161340_rich_text';
import * as migration_20261012_171616_rate_table from './20261012_171616_rate_table';
import * as migration_20261013_065044_gallery from './20261013_065044_gallery';
import * as migration_20261013_070306_documents_library from './20261013_070306_documents_library';
import * as migration_20261013_070543_document_list from './20261013_070543_document_list';
import * as migration_20261013_072334_map_and_location from './20261013_072334_map_and_location';

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
    name: '20261011_173431_app_role_grants',
  },
  {
    up: migration_20261011_201540_branding_and_club_short_name.up,
    down: migration_20261011_201540_branding_and_club_short_name.down,
    name: '20261011_201540_branding_and_club_short_name',
  },
  {
    up: migration_20261011_210310_media_library.up,
    down: migration_20261011_210310_media_library.down,
    name: '20261011_210310_media_library',
  },
  {
    up: migration_20261012_100706_header_and_menu.up,
    down: migration_20261012_100706_header_and_menu.down,
    name: '20261012_100706_header_and_menu',
  },
  {
    up: migration_20261012_103407_footer.up,
    down: migration_20261012_103407_footer.down,
    name: '20261012_103407_footer',
  },
  {
    up: migration_20261012_104849_hero_block_and_photo_sizes.up,
    down: migration_20261012_104849_hero_block_and_photo_sizes.down,
    name: '20261012_104849_hero_block_and_photo_sizes',
  },
  {
    up: migration_20261012_153502_cta_card_grid.up,
    down: migration_20261012_153502_cta_card_grid.down,
    name: '20261012_153502_cta_card_grid',
  },
  {
    up: migration_20261012_154742_two_column.up,
    down: migration_20261012_154742_two_column.down,
    name: '20261012_154742_two_column',
  },
  {
    up: migration_20261012_161340_rich_text.up,
    down: migration_20261012_161340_rich_text.down,
    name: '20261012_161340_rich_text',
  },
  {
    up: migration_20261012_171616_rate_table.up,
    down: migration_20261012_171616_rate_table.down,
    name: '20261012_171616_rate_table',
  },
  {
    up: migration_20261013_065044_gallery.up,
    down: migration_20261013_065044_gallery.down,
    name: '20261013_065044_gallery',
  },
  {
    up: migration_20261013_070306_documents_library.up,
    down: migration_20261013_070306_documents_library.down,
    name: '20261013_070306_documents_library',
  },
  {
    up: migration_20261013_070543_document_list.up,
    down: migration_20261013_070543_document_list.down,
    name: '20261013_070543_document_list',
  },
  {
    up: migration_20261013_072334_map_and_location.up,
    down: migration_20261013_072334_map_and_location.down,
    name: '20261013_072334_map_and_location'
  },
];
