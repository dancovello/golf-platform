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
import * as migration_20261013_073551_pull_quote from './20261013_073551_pull_quote';
import * as migration_20261013_074738_timeline from './20261013_074738_timeline';
import * as migration_20261013_075847_logo_strip from './20261013_075847_logo_strip';
import * as migration_20261013_081117_faq from './20261013_081117_faq';
import * as migration_20261013_082830_team from './20261013_082830_team';
import * as migration_20261013_084416_membership from './20261013_084416_membership';
import * as migration_20261013_090048_courses_holes from './20261013_090048_courses_holes';
import * as migration_20261013_091523_scorecard from './20261013_091523_scorecard';
import * as migration_20261013_092958_course_status from './20261013_092958_course_status';
import * as migration_20261013_094450_announcement_bar from './20261013_094450_announcement_bar';
import * as migration_20261015_184351_news from './20261015_184351_news';
import * as migration_20261015_192631_news_block from './20261015_192631_news_block';
import * as migration_20261015_195334_privacy_settings from './20261015_195334_privacy_settings';
import * as migration_20261015_200921_events from './20261015_200921_events';
import * as migration_20261015_201730_events_block from './20261015_201730_events_block';
import * as migration_20261016_083527_club_agreement from './20261016_083527_club_agreement';
import * as migration_20261016_131627_contact_page from './20261016_131627_contact_page';
import * as migration_20261016_140458_enquiry_alerts from './20261016_140458_enquiry_alerts';
import * as migration_20261016_145756_builtin_links from './20261016_145756_builtin_links';
import * as migration_20261016_154202_nav_footer_control from './20261016_154202_nav_footer_control';
import * as migration_20261016_160941_page_drafts from './20261016_160941_page_drafts';
import * as migration_20261017_080622_media_w3200 from './20261017_080622_media_w3200';
import * as migration_20261019_113825_media_alt_optional from './20261019_113825_media_alt_optional';
import * as migration_20261019_185238_search_index from './20261019_185238_search_index';
import * as migration_20261019_210255_nav_dropdown_style from './20261019_210255_nav_dropdown_style';
import * as migration_20261020_092237_media_tone from './20261020_092237_media_tone';
import * as migration_20261020_112739_menu_sections from './20261020_112739_menu_sections';
import * as migration_20261020_164723_club_domains from './20261020_164723_club_domains';
import * as migration_20261020_212250_privacy_cleanup from './20261020_212250_privacy_cleanup';
import * as migration_20261021_154303_marketing_content from './20261021_154303_marketing_content';
import * as migration_20261021_160708_marketing_blocks_from_figma from './20261021_160708_marketing_blocks_from_figma';
import * as migration_20261021_163953_marketing_founder_card from './20261021_163953_marketing_founder_card';
import * as migration_20261021_170032_marketing_home_blocks from './20261021_170032_marketing_home_blocks';
import * as migration_20261021_171424_marketing_pricing_blocks from './20261021_171424_marketing_pricing_blocks';
import * as migration_20261021_173753_marketing_switching from './20261021_173753_marketing_switching';
import * as migration_20261021_175055_marketing_book_demo from './20261021_175055_marketing_book_demo';
import * as migration_20261021_214128_marketing_website_builder from './20261021_214128_marketing_website_builder';
import * as migration_20261021_215842_marketing_bookings_preview from './20261021_215842_marketing_bookings_preview';

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
    name: '20261013_072334_map_and_location',
  },
  {
    up: migration_20261013_073551_pull_quote.up,
    down: migration_20261013_073551_pull_quote.down,
    name: '20261013_073551_pull_quote',
  },
  {
    up: migration_20261013_074738_timeline.up,
    down: migration_20261013_074738_timeline.down,
    name: '20261013_074738_timeline',
  },
  {
    up: migration_20261013_075847_logo_strip.up,
    down: migration_20261013_075847_logo_strip.down,
    name: '20261013_075847_logo_strip',
  },
  {
    up: migration_20261013_081117_faq.up,
    down: migration_20261013_081117_faq.down,
    name: '20261013_081117_faq',
  },
  {
    up: migration_20261013_082830_team.up,
    down: migration_20261013_082830_team.down,
    name: '20261013_082830_team',
  },
  {
    up: migration_20261013_084416_membership.up,
    down: migration_20261013_084416_membership.down,
    name: '20261013_084416_membership',
  },
  {
    up: migration_20261013_090048_courses_holes.up,
    down: migration_20261013_090048_courses_holes.down,
    name: '20261013_090048_courses_holes',
  },
  {
    up: migration_20261013_091523_scorecard.up,
    down: migration_20261013_091523_scorecard.down,
    name: '20261013_091523_scorecard',
  },
  {
    up: migration_20261013_092958_course_status.up,
    down: migration_20261013_092958_course_status.down,
    name: '20261013_092958_course_status',
  },
  {
    up: migration_20261013_094450_announcement_bar.up,
    down: migration_20261013_094450_announcement_bar.down,
    name: '20261013_094450_announcement_bar',
  },
  {
    up: migration_20261015_184351_news.up,
    down: migration_20261015_184351_news.down,
    name: '20261015_184351_news',
  },
  {
    up: migration_20261015_192631_news_block.up,
    down: migration_20261015_192631_news_block.down,
    name: '20261015_192631_news_block',
  },
  {
    up: migration_20261015_195334_privacy_settings.up,
    down: migration_20261015_195334_privacy_settings.down,
    name: '20261015_195334_privacy_settings',
  },
  {
    up: migration_20261015_200921_events.up,
    down: migration_20261015_200921_events.down,
    name: '20261015_200921_events',
  },
  {
    up: migration_20261015_201730_events_block.up,
    down: migration_20261015_201730_events_block.down,
    name: '20261015_201730_events_block',
  },
  {
    up: migration_20261016_083527_club_agreement.up,
    down: migration_20261016_083527_club_agreement.down,
    name: '20261016_083527_club_agreement',
  },
  {
    up: migration_20261016_131627_contact_page.up,
    down: migration_20261016_131627_contact_page.down,
    name: '20261016_131627_contact_page',
  },
  {
    up: migration_20261016_140458_enquiry_alerts.up,
    down: migration_20261016_140458_enquiry_alerts.down,
    name: '20261016_140458_enquiry_alerts',
  },
  {
    up: migration_20261016_145756_builtin_links.up,
    down: migration_20261016_145756_builtin_links.down,
    name: '20261016_145756_builtin_links',
  },
  {
    up: migration_20261016_154202_nav_footer_control.up,
    down: migration_20261016_154202_nav_footer_control.down,
    name: '20261016_154202_nav_footer_control',
  },
  {
    up: migration_20261016_160941_page_drafts.up,
    down: migration_20261016_160941_page_drafts.down,
    name: '20261016_160941_page_drafts',
  },
  {
    up: migration_20261017_080622_media_w3200.up,
    down: migration_20261017_080622_media_w3200.down,
    name: '20261017_080622_media_w3200',
  },
  {
    up: migration_20261019_113825_media_alt_optional.up,
    down: migration_20261019_113825_media_alt_optional.down,
    name: '20261019_113825_media_alt_optional',
  },
  {
    up: migration_20261019_185238_search_index.up,
    down: migration_20261019_185238_search_index.down,
    name: '20261019_185238_search_index',
  },
  {
    up: migration_20261019_210255_nav_dropdown_style.up,
    down: migration_20261019_210255_nav_dropdown_style.down,
    name: '20261019_210255_nav_dropdown_style',
  },
  {
    up: migration_20261020_092237_media_tone.up,
    down: migration_20261020_092237_media_tone.down,
    name: '20261020_092237_media_tone',
  },
  {
    up: migration_20261020_112739_menu_sections.up,
    down: migration_20261020_112739_menu_sections.down,
    name: '20261020_112739_menu_sections',
  },
  {
    up: migration_20261020_164723_club_domains.up,
    down: migration_20261020_164723_club_domains.down,
    name: '20261020_164723_club_domains',
  },
  {
    up: migration_20261020_212250_privacy_cleanup.up,
    down: migration_20261020_212250_privacy_cleanup.down,
    name: '20261020_212250_privacy_cleanup',
  },
  {
    up: migration_20261021_154303_marketing_content.up,
    down: migration_20261021_154303_marketing_content.down,
    name: '20261021_154303_marketing_content',
  },
  {
    up: migration_20261021_160708_marketing_blocks_from_figma.up,
    down: migration_20261021_160708_marketing_blocks_from_figma.down,
    name: '20261021_160708_marketing_blocks_from_figma',
  },
  {
    up: migration_20261021_163953_marketing_founder_card.up,
    down: migration_20261021_163953_marketing_founder_card.down,
    name: '20261021_163953_marketing_founder_card',
  },
  {
    up: migration_20261021_170032_marketing_home_blocks.up,
    down: migration_20261021_170032_marketing_home_blocks.down,
    name: '20261021_170032_marketing_home_blocks',
  },
  {
    up: migration_20261021_171424_marketing_pricing_blocks.up,
    down: migration_20261021_171424_marketing_pricing_blocks.down,
    name: '20261021_171424_marketing_pricing_blocks',
  },
  {
    up: migration_20261021_173753_marketing_switching.up,
    down: migration_20261021_173753_marketing_switching.down,
    name: '20261021_173753_marketing_switching',
  },
  {
    up: migration_20261021_175055_marketing_book_demo.up,
    down: migration_20261021_175055_marketing_book_demo.down,
    name: '20261021_175055_marketing_book_demo',
  },
  {
    up: migration_20261021_214128_marketing_website_builder.up,
    down: migration_20261021_214128_marketing_website_builder.down,
    name: '20261021_214128_marketing_website_builder',
  },
  {
    up: migration_20261021_215842_marketing_bookings_preview.up,
    down: migration_20261021_215842_marketing_bookings_preview.down,
    name: '20261021_215842_marketing_bookings_preview'
  },
];
