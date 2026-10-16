import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__pages_v_blocks_hero_style" AS ENUM('heritage', 'resort', 'bookingLed');
  CREATE TYPE "public"."enum__pages_v_blocks_hero_media_type" AS ENUM('image', 'video');
  CREATE TYPE "public"."enum__pages_v_blocks_hero_primary_button_type" AS ENUM('page', 'builtIn', 'url');
  CREATE TYPE "public"."enum__pages_v_blocks_hero_primary_button_built_in" AS ENUM('news', 'events', 'contact', 'privacy');
  CREATE TYPE "public"."enum__pages_v_blocks_hero_secondary_link_type" AS ENUM('page', 'builtIn', 'url');
  CREATE TYPE "public"."enum__pages_v_blocks_hero_secondary_link_built_in" AS ENUM('news', 'events', 'contact', 'privacy');
  CREATE TYPE "public"."enum__pages_v_blocks_cta_card_grid_cards_link_type" AS ENUM('page', 'builtIn', 'url');
  CREATE TYPE "public"."enum__pages_v_blocks_cta_card_grid_cards_link_built_in" AS ENUM('news', 'events', 'contact', 'privacy');
  CREATE TYPE "public"."enum__pages_v_blocks_cta_card_grid_style" AS ENUM('editorial', 'immersive', 'index');
  CREATE TYPE "public"."enum__pages_v_blocks_cta_card_grid_view_all_type" AS ENUM('page', 'builtIn', 'url');
  CREATE TYPE "public"."enum__pages_v_blocks_cta_card_grid_view_all_built_in" AS ENUM('news', 'events', 'contact', 'privacy');
  CREATE TYPE "public"."enum__pages_v_blocks_two_column_style" AS ENUM('split', 'collage', 'keyFacts');
  CREATE TYPE "public"."enum__pages_v_blocks_two_column_image_side" AS ENUM('left', 'right');
  CREATE TYPE "public"."enum__pages_v_blocks_two_column_tone" AS ENUM('canvas', 'brand');
  CREATE TYPE "public"."enum__pages_v_blocks_two_column_link_type" AS ENUM('page', 'builtIn', 'url');
  CREATE TYPE "public"."enum__pages_v_blocks_two_column_link_built_in" AS ENUM('news', 'events', 'contact', 'privacy');
  CREATE TYPE "public"."enum__pages_v_blocks_rich_text_style" AS ENUM('article', 'contents', 'editorial');
  CREATE TYPE "public"."enum__pages_v_blocks_rate_table_tabs_sections_start_month" AS ENUM('1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12');
  CREATE TYPE "public"."enum__pages_v_blocks_rate_table_tabs_sections_end_month" AS ENUM('1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12');
  CREATE TYPE "public"."enum__pages_v_blocks_rate_table_style" AS ENUM('classic', 'seasons', 'matrix');
  CREATE TYPE "public"."enum__pages_v_blocks_rate_table_button_type" AS ENUM('page', 'builtIn', 'url');
  CREATE TYPE "public"."enum__pages_v_blocks_rate_table_button_built_in" AS ENUM('news', 'events', 'contact', 'privacy');
  CREATE TYPE "public"."enum__pages_v_blocks_gallery_style" AS ENUM('masonry', 'grid', 'viewer');
  CREATE TYPE "public"."enum__pages_v_blocks_document_list_style" AS ENUM('grouped', 'cards', 'table');
  CREATE TYPE "public"."enum__pages_v_blocks_document_list_view_all_type" AS ENUM('page', 'builtIn', 'url');
  CREATE TYPE "public"."enum__pages_v_blocks_document_list_view_all_built_in" AS ENUM('news', 'events', 'contact', 'privacy');
  CREATE TYPE "public"."enum__pages_v_blocks_map_routes_mode" AS ENUM('car', 'train', 'air', 'bus', 'walk');
  CREATE TYPE "public"."enum__pages_v_blocks_map_style" AS ENUM('split', 'fullBleed', 'gettingHere');
  CREATE TYPE "public"."enum__pages_v_blocks_pull_quote_style" AS ENUM('centred', 'overImage', 'split');
  CREATE TYPE "public"."enum__pages_v_blocks_timeline_style" AS ENUM('alternating', 'horizontal', 'ledger');
  CREATE TYPE "public"."enum__pages_v_blocks_logo_strip_style" AS ENUM('row', 'grid', 'marquee');
  CREATE TYPE "public"."enum__pages_v_blocks_faq_style" AS ENUM('centred', 'withContact', 'searchTopics');
  CREATE TYPE "public"."enum__pages_v_blocks_faq_contact_link_type" AS ENUM('page', 'builtIn', 'url');
  CREATE TYPE "public"."enum__pages_v_blocks_faq_contact_link_built_in" AS ENUM('news', 'events', 'contact', 'privacy');
  CREATE TYPE "public"."enum__pages_v_blocks_team_style" AS ENUM('grid', 'directory', 'featured');
  CREATE TYPE "public"."enum__pages_v_blocks_team_action_type" AS ENUM('page', 'builtIn', 'url');
  CREATE TYPE "public"."enum__pages_v_blocks_team_action_built_in" AS ENUM('news', 'events', 'contact', 'privacy');
  CREATE TYPE "public"."enum__pages_v_blocks_team_view_all_type" AS ENUM('page', 'builtIn', 'url');
  CREATE TYPE "public"."enum__pages_v_blocks_team_view_all_built_in" AS ENUM('news', 'events', 'contact', 'privacy');
  CREATE TYPE "public"."enum__pages_v_blocks_membership_tiers_link_type" AS ENUM('page', 'builtIn', 'url');
  CREATE TYPE "public"."enum__pages_v_blocks_membership_tiers_link_built_in" AS ENUM('news', 'events', 'contact', 'privacy');
  CREATE TYPE "public"."enum__pages_v_blocks_membership_style" AS ENUM('cards', 'compare', 'enquire');
  CREATE TYPE "public"."enum__pages_v_blocks_membership_action_type" AS ENUM('page', 'builtIn', 'url');
  CREATE TYPE "public"."enum__pages_v_blocks_membership_action_built_in" AS ENUM('news', 'events', 'contact', 'privacy');
  CREATE TYPE "public"."enum__pages_v_blocks_membership_card_link_type" AS ENUM('page', 'builtIn', 'url');
  CREATE TYPE "public"."enum__pages_v_blocks_membership_card_link_built_in" AS ENUM('news', 'events', 'contact', 'privacy');
  CREATE TYPE "public"."enum__pages_v_blocks_hole_grid_style" AS ENUM('cards', 'carousel', 'guide');
  CREATE TYPE "public"."enum__pages_v_blocks_scorecard_style" AS ENUM('classic', 'vertical', 'teeSelector');
  CREATE TYPE "public"."enum__pages_v_blocks_course_status_style" AS ENUM('board', 'band', 'widget');
  CREATE TYPE "public"."enum__pages_v_blocks_course_status_status_page_type" AS ENUM('page', 'builtIn', 'url');
  CREATE TYPE "public"."enum__pages_v_blocks_course_status_status_page_built_in" AS ENUM('news', 'events', 'contact', 'privacy');
  CREATE TYPE "public"."enum__pages_v_blocks_news_feed_style" AS ENUM('carousel', 'leadList', 'headlines');
  CREATE TYPE "public"."enum__pages_v_blocks_news_feed_category" AS ENUM('course', 'competitions', 'clubhouse', 'membership', 'academy', 'club');
  CREATE TYPE "public"."enum__pages_v_blocks_events_feed_style" AS ENUM('carousel', 'agenda', 'featured');
  CREATE TYPE "public"."enum__pages_v_blocks_events_feed_category" AS ENUM('social', 'dining', 'competition', 'academy', 'members');
  CREATE TYPE "public"."enum__pages_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "_pages_v_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"style" "enum__pages_v_blocks_hero_style" DEFAULT 'heritage',
  	"media_type" "enum__pages_v_blocks_hero_media_type" DEFAULT 'image',
  	"image_id" uuid,
  	"video_id" uuid,
  	"eyebrow" varchar,
  	"headline" varchar,
  	"caption" varchar,
  	"primary_button_label" varchar,
  	"primary_button_type" "enum__pages_v_blocks_hero_primary_button_type" DEFAULT 'page',
  	"primary_button_page_id" uuid,
  	"primary_button_built_in" "enum__pages_v_blocks_hero_primary_button_built_in",
  	"primary_button_url" varchar,
  	"secondary_link_label" varchar,
  	"secondary_link_type" "enum__pages_v_blocks_hero_secondary_link_type" DEFAULT 'page',
  	"secondary_link_page_id" uuid,
  	"secondary_link_built_in" "enum__pages_v_blocks_hero_secondary_link_built_in",
  	"secondary_link_url" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_cta_card_grid_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"eyebrow" varchar,
  	"image_id" uuid,
  	"link_type" "enum__pages_v_blocks_cta_card_grid_cards_link_type" DEFAULT 'page',
  	"link_page_id" uuid,
  	"link_built_in" "enum__pages_v_blocks_cta_card_grid_cards_link_built_in",
  	"link_url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_cta_card_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"style" "enum__pages_v_blocks_cta_card_grid_style" DEFAULT 'editorial',
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"view_all_label" varchar,
  	"view_all_type" "enum__pages_v_blocks_cta_card_grid_view_all_type" DEFAULT 'page',
  	"view_all_page_id" uuid,
  	"view_all_built_in" "enum__pages_v_blocks_cta_card_grid_view_all_built_in",
  	"view_all_url" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_two_column_facts" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"label" varchar,
  	"value" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_two_column" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"style" "enum__pages_v_blocks_two_column_style" DEFAULT 'split',
  	"image_side" "enum__pages_v_blocks_two_column_image_side" DEFAULT 'left',
  	"tone" "enum__pages_v_blocks_two_column_tone" DEFAULT 'canvas',
  	"image_id" uuid,
  	"inset_image_id" uuid,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"body" varchar,
  	"link_label" varchar,
  	"link_type" "enum__pages_v_blocks_two_column_link_type" DEFAULT 'page',
  	"link_page_id" uuid,
  	"link_built_in" "enum__pages_v_blocks_two_column_link_built_in",
  	"link_url" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_rich_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"style" "enum__pages_v_blocks_rich_text_style" DEFAULT 'article',
  	"eyebrow" varchar,
  	"content" jsonb,
  	"note_title" varchar,
  	"note_text" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_rate_table_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_rate_table_tabs_sections_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"label" varchar,
  	"sub_label" varchar,
  	"price1" varchar,
  	"price2" varchar,
  	"price3" varchar,
  	"price4" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_rate_table_tabs_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"name" varchar,
  	"period" varchar,
  	"start_month" "enum__pages_v_blocks_rate_table_tabs_sections_start_month",
  	"end_month" "enum__pages_v_blocks_rate_table_tabs_sections_end_month",
  	"note" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_rate_table_tabs" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_rate_table_included" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"item" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_rate_table" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"style" "enum__pages_v_blocks_rate_table_style" DEFAULT 'classic',
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"footnote" varchar,
  	"button_label" varchar,
  	"button_type" "enum__pages_v_blocks_rate_table_button_type" DEFAULT 'page',
  	"button_page_id" uuid,
  	"button_built_in" "enum__pages_v_blocks_rate_table_button_built_in",
  	"button_url" varchar,
  	"aside_eyebrow" varchar,
  	"aside_heading" varchar,
  	"show_phone" boolean DEFAULT true,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_gallery_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"image_id" uuid,
  	"caption" varchar,
  	"album" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"style" "enum__pages_v_blocks_gallery_style" DEFAULT 'masonry',
  	"eyebrow" varchar,
  	"heading" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_document_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"style" "enum__pages_v_blocks_document_list_style" DEFAULT 'grouped',
  	"eyebrow" varchar,
  	"heading" varchar,
  	"view_all_label" varchar,
  	"view_all_type" "enum__pages_v_blocks_document_list_view_all_type" DEFAULT 'page',
  	"view_all_page_id" uuid,
  	"view_all_built_in" "enum__pages_v_blocks_document_list_view_all_built_in",
  	"view_all_url" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_map_routes" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"mode" "enum__pages_v_blocks_map_routes_mode",
  	"distance" varchar,
  	"directions" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_map" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"style" "enum__pages_v_blocks_map_style" DEFAULT 'split',
  	"eyebrow" varchar,
  	"heading" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_pull_quote" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"style" "enum__pages_v_blocks_pull_quote_style" DEFAULT 'centred',
  	"quote" varchar,
  	"name" varchar,
  	"role" varchar,
  	"publication" varchar,
  	"year" varchar,
  	"image_id" uuid,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_timeline_entries" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"year" varchar,
  	"title" varchar,
  	"text" varchar,
  	"image_id" uuid,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_timeline" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"style" "enum__pages_v_blocks_timeline_style" DEFAULT 'alternating',
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_logo_strip_partners" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"name" varchar,
  	"url" varchar,
  	"logo_id" uuid,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_logo_strip" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"style" "enum__pages_v_blocks_logo_strip_style" DEFAULT 'row',
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_faq_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"topic" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"style" "enum__pages_v_blocks_faq_style" DEFAULT 'centred',
  	"eyebrow" varchar,
  	"heading" varchar,
  	"first_open" boolean DEFAULT true,
  	"card_heading" varchar,
  	"contact_link_label" varchar,
  	"contact_link_type" "enum__pages_v_blocks_faq_contact_link_type" DEFAULT 'page',
  	"contact_link_page_id" uuid,
  	"contact_link_built_in" "enum__pages_v_blocks_faq_contact_link_built_in",
  	"contact_link_url" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_team" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"style" "enum__pages_v_blocks_team_style" DEFAULT 'grid',
  	"eyebrow" varchar,
  	"heading" varchar,
  	"featured_id" uuid,
  	"action_label" varchar,
  	"action_type" "enum__pages_v_blocks_team_action_type" DEFAULT 'page',
  	"action_page_id" uuid,
  	"action_built_in" "enum__pages_v_blocks_team_action_built_in",
  	"action_url" varchar,
  	"view_all_label" varchar,
  	"view_all_type" "enum__pages_v_blocks_team_view_all_type" DEFAULT 'page',
  	"view_all_page_id" uuid,
  	"view_all_built_in" "enum__pages_v_blocks_team_view_all_built_in",
  	"view_all_url" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_membership_tiers_benefits" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_membership_tiers_values" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"value" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_membership_tiers" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"name" varchar,
  	"price" varchar,
  	"period" varchar,
  	"description" varchar,
  	"availability" varchar,
  	"recommended" boolean,
  	"link_type" "enum__pages_v_blocks_membership_tiers_link_type" DEFAULT 'page',
  	"link_page_id" uuid,
  	"link_built_in" "enum__pages_v_blocks_membership_tiers_link_built_in",
  	"link_url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_membership_features" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_membership" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"style" "enum__pages_v_blocks_membership_style" DEFAULT 'cards',
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"button_label" varchar,
  	"action_label" varchar,
  	"action_type" "enum__pages_v_blocks_membership_action_type" DEFAULT 'page',
  	"action_page_id" uuid,
  	"action_built_in" "enum__pages_v_blocks_membership_action_built_in",
  	"action_url" varchar,
  	"card_heading" varchar,
  	"card_text" varchar,
  	"card_link_label" varchar,
  	"card_link_type" "enum__pages_v_blocks_membership_card_link_type" DEFAULT 'page',
  	"card_link_page_id" uuid,
  	"card_link_built_in" "enum__pages_v_blocks_membership_card_link_built_in",
  	"card_link_url" varchar,
  	"card_note" varchar,
  	"note" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_hole_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"style" "enum__pages_v_blocks_hole_grid_style" DEFAULT 'cards',
  	"eyebrow" varchar,
  	"heading" varchar,
  	"course_id" uuid,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_scorecard" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"style" "enum__pages_v_blocks_scorecard_style" DEFAULT 'classic',
  	"eyebrow" varchar,
  	"heading" varchar,
  	"course_id" uuid,
  	"download_id" uuid,
  	"link_to_guide" boolean,
  	"note" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_course_status" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"style" "enum__pages_v_blocks_course_status_style" DEFAULT 'board',
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"status_page_type" "enum__pages_v_blocks_course_status_status_page_type" DEFAULT 'page',
  	"status_page_page_id" uuid,
  	"status_page_built_in" "enum__pages_v_blocks_course_status_status_page_built_in",
  	"status_page_url" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_news_feed" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"style" "enum__pages_v_blocks_news_feed_style" DEFAULT 'carousel',
  	"eyebrow" varchar DEFAULT 'News',
  	"heading" varchar,
  	"category" "enum__pages_v_blocks_news_feed_category",
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_events_feed" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"style" "enum__pages_v_blocks_events_feed_style" DEFAULT 'carousel',
  	"eyebrow" varchar DEFAULT 'What’s on',
  	"heading" varchar,
  	"intro" varchar,
  	"category" "enum__pages_v_blocks_events_feed_category",
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_tenant_id" uuid,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_parent_id" uuid,
  	"version_menu_position" numeric,
  	"version_hide_from_menu" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__pages_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_pages_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"documents_id" uuid,
  	"staff_id" uuid
  );
  
  ALTER TABLE "pages_blocks_hero" ALTER COLUMN "style" DROP NOT NULL;
  ALTER TABLE "pages_blocks_hero" ALTER COLUMN "image_id" DROP NOT NULL;
  ALTER TABLE "pages_blocks_hero" ALTER COLUMN "headline" DROP NOT NULL;
  ALTER TABLE "pages_blocks_cta_card_grid_cards" ALTER COLUMN "title" DROP NOT NULL;
  ALTER TABLE "pages_blocks_cta_card_grid_cards" ALTER COLUMN "image_id" DROP NOT NULL;
  ALTER TABLE "pages_blocks_cta_card_grid" ALTER COLUMN "style" DROP NOT NULL;
  ALTER TABLE "pages_blocks_cta_card_grid" ALTER COLUMN "heading" DROP NOT NULL;
  ALTER TABLE "pages_blocks_two_column" ALTER COLUMN "style" DROP NOT NULL;
  ALTER TABLE "pages_blocks_two_column" ALTER COLUMN "image_id" DROP NOT NULL;
  ALTER TABLE "pages_blocks_two_column" ALTER COLUMN "heading" DROP NOT NULL;
  ALTER TABLE "pages_blocks_two_column" ALTER COLUMN "body" DROP NOT NULL;
  ALTER TABLE "pages_blocks_rich_text" ALTER COLUMN "style" DROP NOT NULL;
  ALTER TABLE "pages_blocks_rich_text" ALTER COLUMN "content" DROP NOT NULL;
  ALTER TABLE "pages_blocks_rate_table_tabs_sections_rows" ALTER COLUMN "label" DROP NOT NULL;
  ALTER TABLE "pages_blocks_rate_table_tabs" ALTER COLUMN "label" DROP NOT NULL;
  ALTER TABLE "pages_blocks_rate_table_included" ALTER COLUMN "item" DROP NOT NULL;
  ALTER TABLE "pages_blocks_rate_table" ALTER COLUMN "style" DROP NOT NULL;
  ALTER TABLE "pages_blocks_rate_table" ALTER COLUMN "heading" DROP NOT NULL;
  ALTER TABLE "pages_blocks_gallery_images" ALTER COLUMN "image_id" DROP NOT NULL;
  ALTER TABLE "pages_blocks_gallery" ALTER COLUMN "style" DROP NOT NULL;
  ALTER TABLE "pages_blocks_gallery" ALTER COLUMN "heading" DROP NOT NULL;
  ALTER TABLE "pages_blocks_document_list" ALTER COLUMN "style" DROP NOT NULL;
  ALTER TABLE "pages_blocks_document_list" ALTER COLUMN "heading" DROP NOT NULL;
  ALTER TABLE "pages_blocks_map" ALTER COLUMN "style" DROP NOT NULL;
  ALTER TABLE "pages_blocks_map" ALTER COLUMN "heading" DROP NOT NULL;
  ALTER TABLE "pages_blocks_pull_quote" ALTER COLUMN "style" DROP NOT NULL;
  ALTER TABLE "pages_blocks_pull_quote" ALTER COLUMN "quote" DROP NOT NULL;
  ALTER TABLE "pages_blocks_pull_quote" ALTER COLUMN "name" DROP NOT NULL;
  ALTER TABLE "pages_blocks_timeline_entries" ALTER COLUMN "year" DROP NOT NULL;
  ALTER TABLE "pages_blocks_timeline_entries" ALTER COLUMN "title" DROP NOT NULL;
  ALTER TABLE "pages_blocks_timeline_entries" ALTER COLUMN "text" DROP NOT NULL;
  ALTER TABLE "pages_blocks_timeline" ALTER COLUMN "style" DROP NOT NULL;
  ALTER TABLE "pages_blocks_timeline" ALTER COLUMN "heading" DROP NOT NULL;
  ALTER TABLE "pages_blocks_logo_strip_partners" ALTER COLUMN "name" DROP NOT NULL;
  ALTER TABLE "pages_blocks_logo_strip" ALTER COLUMN "style" DROP NOT NULL;
  ALTER TABLE "pages_blocks_faq_items" ALTER COLUMN "question" DROP NOT NULL;
  ALTER TABLE "pages_blocks_faq_items" ALTER COLUMN "answer" DROP NOT NULL;
  ALTER TABLE "pages_blocks_faq" ALTER COLUMN "style" DROP NOT NULL;
  ALTER TABLE "pages_blocks_faq" ALTER COLUMN "heading" DROP NOT NULL;
  ALTER TABLE "pages_blocks_team" ALTER COLUMN "style" DROP NOT NULL;
  ALTER TABLE "pages_blocks_team" ALTER COLUMN "heading" DROP NOT NULL;
  ALTER TABLE "pages_blocks_membership_tiers" ALTER COLUMN "name" DROP NOT NULL;
  ALTER TABLE "pages_blocks_membership" ALTER COLUMN "style" DROP NOT NULL;
  ALTER TABLE "pages_blocks_membership" ALTER COLUMN "heading" DROP NOT NULL;
  ALTER TABLE "pages_blocks_hole_grid" ALTER COLUMN "style" DROP NOT NULL;
  ALTER TABLE "pages_blocks_hole_grid" ALTER COLUMN "heading" DROP NOT NULL;
  ALTER TABLE "pages_blocks_hole_grid" ALTER COLUMN "course_id" DROP NOT NULL;
  ALTER TABLE "pages_blocks_scorecard" ALTER COLUMN "style" DROP NOT NULL;
  ALTER TABLE "pages_blocks_scorecard" ALTER COLUMN "heading" DROP NOT NULL;
  ALTER TABLE "pages_blocks_scorecard" ALTER COLUMN "course_id" DROP NOT NULL;
  ALTER TABLE "pages_blocks_course_status" ALTER COLUMN "style" DROP NOT NULL;
  ALTER TABLE "pages_blocks_news_feed" ALTER COLUMN "style" DROP NOT NULL;
  ALTER TABLE "pages_blocks_news_feed" ALTER COLUMN "heading" DROP NOT NULL;
  ALTER TABLE "pages_blocks_events_feed" ALTER COLUMN "style" DROP NOT NULL;
  ALTER TABLE "pages_blocks_events_feed" ALTER COLUMN "heading" DROP NOT NULL;
  ALTER TABLE "pages" ALTER COLUMN "title" DROP NOT NULL;
  ALTER TABLE "pages" ALTER COLUMN "slug" DROP NOT NULL;
  ALTER TABLE "pages" ADD COLUMN "_status" "enum_pages_status" DEFAULT 'published';
  ALTER TABLE "pages" ALTER COLUMN "_status" SET DEFAULT 'draft';
  ALTER TABLE "_pages_v_blocks_hero" ADD CONSTRAINT "_pages_v_blocks_hero_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero" ADD CONSTRAINT "_pages_v_blocks_hero_video_id_media_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero" ADD CONSTRAINT "_pages_v_blocks_hero_primary_button_page_id_pages_id_fk" FOREIGN KEY ("primary_button_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero" ADD CONSTRAINT "_pages_v_blocks_hero_secondary_link_page_id_pages_id_fk" FOREIGN KEY ("secondary_link_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero" ADD CONSTRAINT "_pages_v_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cta_card_grid_cards" ADD CONSTRAINT "_pages_v_blocks_cta_card_grid_cards_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cta_card_grid_cards" ADD CONSTRAINT "_pages_v_blocks_cta_card_grid_cards_link_page_id_pages_id_fk" FOREIGN KEY ("link_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cta_card_grid_cards" ADD CONSTRAINT "_pages_v_blocks_cta_card_grid_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_cta_card_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cta_card_grid" ADD CONSTRAINT "_pages_v_blocks_cta_card_grid_view_all_page_id_pages_id_fk" FOREIGN KEY ("view_all_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cta_card_grid" ADD CONSTRAINT "_pages_v_blocks_cta_card_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_two_column_facts" ADD CONSTRAINT "_pages_v_blocks_two_column_facts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_two_column"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_two_column" ADD CONSTRAINT "_pages_v_blocks_two_column_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_two_column" ADD CONSTRAINT "_pages_v_blocks_two_column_inset_image_id_media_id_fk" FOREIGN KEY ("inset_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_two_column" ADD CONSTRAINT "_pages_v_blocks_two_column_link_page_id_pages_id_fk" FOREIGN KEY ("link_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_two_column" ADD CONSTRAINT "_pages_v_blocks_two_column_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_rich_text" ADD CONSTRAINT "_pages_v_blocks_rich_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_rate_table_columns" ADD CONSTRAINT "_pages_v_blocks_rate_table_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_rate_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_rate_table_tabs_sections_rows" ADD CONSTRAINT "_pages_v_blocks_rate_table_tabs_sections_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_rate_table_tabs_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_rate_table_tabs_sections" ADD CONSTRAINT "_pages_v_blocks_rate_table_tabs_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_rate_table_tabs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_rate_table_tabs" ADD CONSTRAINT "_pages_v_blocks_rate_table_tabs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_rate_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_rate_table_included" ADD CONSTRAINT "_pages_v_blocks_rate_table_included_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_rate_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_rate_table" ADD CONSTRAINT "_pages_v_blocks_rate_table_button_page_id_pages_id_fk" FOREIGN KEY ("button_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_rate_table" ADD CONSTRAINT "_pages_v_blocks_rate_table_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_gallery_images" ADD CONSTRAINT "_pages_v_blocks_gallery_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_gallery_images" ADD CONSTRAINT "_pages_v_blocks_gallery_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_gallery" ADD CONSTRAINT "_pages_v_blocks_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_document_list" ADD CONSTRAINT "_pages_v_blocks_document_list_view_all_page_id_pages_id_fk" FOREIGN KEY ("view_all_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_document_list" ADD CONSTRAINT "_pages_v_blocks_document_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_map_routes" ADD CONSTRAINT "_pages_v_blocks_map_routes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_map"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_map" ADD CONSTRAINT "_pages_v_blocks_map_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_pull_quote" ADD CONSTRAINT "_pages_v_blocks_pull_quote_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_pull_quote" ADD CONSTRAINT "_pages_v_blocks_pull_quote_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_timeline_entries" ADD CONSTRAINT "_pages_v_blocks_timeline_entries_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_timeline_entries" ADD CONSTRAINT "_pages_v_blocks_timeline_entries_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_timeline"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_timeline" ADD CONSTRAINT "_pages_v_blocks_timeline_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_logo_strip_partners" ADD CONSTRAINT "_pages_v_blocks_logo_strip_partners_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_logo_strip_partners" ADD CONSTRAINT "_pages_v_blocks_logo_strip_partners_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_logo_strip"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_logo_strip" ADD CONSTRAINT "_pages_v_blocks_logo_strip_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_faq_items" ADD CONSTRAINT "_pages_v_blocks_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_faq" ADD CONSTRAINT "_pages_v_blocks_faq_contact_link_page_id_pages_id_fk" FOREIGN KEY ("contact_link_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_faq" ADD CONSTRAINT "_pages_v_blocks_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_team" ADD CONSTRAINT "_pages_v_blocks_team_featured_id_staff_id_fk" FOREIGN KEY ("featured_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_team" ADD CONSTRAINT "_pages_v_blocks_team_action_page_id_pages_id_fk" FOREIGN KEY ("action_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_team" ADD CONSTRAINT "_pages_v_blocks_team_view_all_page_id_pages_id_fk" FOREIGN KEY ("view_all_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_team" ADD CONSTRAINT "_pages_v_blocks_team_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_membership_tiers_benefits" ADD CONSTRAINT "_pages_v_blocks_membership_tiers_benefits_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_membership_tiers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_membership_tiers_values" ADD CONSTRAINT "_pages_v_blocks_membership_tiers_values_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_membership_tiers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_membership_tiers" ADD CONSTRAINT "_pages_v_blocks_membership_tiers_link_page_id_pages_id_fk" FOREIGN KEY ("link_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_membership_tiers" ADD CONSTRAINT "_pages_v_blocks_membership_tiers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_membership"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_membership_features" ADD CONSTRAINT "_pages_v_blocks_membership_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_membership"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_membership" ADD CONSTRAINT "_pages_v_blocks_membership_action_page_id_pages_id_fk" FOREIGN KEY ("action_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_membership" ADD CONSTRAINT "_pages_v_blocks_membership_card_link_page_id_pages_id_fk" FOREIGN KEY ("card_link_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_membership" ADD CONSTRAINT "_pages_v_blocks_membership_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hole_grid" ADD CONSTRAINT "_pages_v_blocks_hole_grid_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hole_grid" ADD CONSTRAINT "_pages_v_blocks_hole_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_scorecard" ADD CONSTRAINT "_pages_v_blocks_scorecard_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_scorecard" ADD CONSTRAINT "_pages_v_blocks_scorecard_download_id_documents_id_fk" FOREIGN KEY ("download_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_scorecard" ADD CONSTRAINT "_pages_v_blocks_scorecard_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_course_status" ADD CONSTRAINT "_pages_v_blocks_course_status_status_page_page_id_pages_id_fk" FOREIGN KEY ("status_page_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_course_status" ADD CONSTRAINT "_pages_v_blocks_course_status_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_news_feed" ADD CONSTRAINT "_pages_v_blocks_news_feed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_events_feed" ADD CONSTRAINT "_pages_v_blocks_events_feed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_parent_id_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_version_tenant_id_tenants_id_fk" FOREIGN KEY ("version_tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_version_parent_id_pages_id_fk" FOREIGN KEY ("version_parent_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_documents_fk" FOREIGN KEY ("documents_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_staff_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "_pages_v_blocks_hero_order_idx" ON "_pages_v_blocks_hero" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_hero_parent_id_idx" ON "_pages_v_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_hero_path_idx" ON "_pages_v_blocks_hero" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_hero_image_idx" ON "_pages_v_blocks_hero" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_hero_video_idx" ON "_pages_v_blocks_hero" USING btree ("video_id");
  CREATE INDEX "_pages_v_blocks_hero_primary_button_primary_button_page_idx" ON "_pages_v_blocks_hero" USING btree ("primary_button_page_id");
  CREATE INDEX "_pages_v_blocks_hero_secondary_link_secondary_link_page_idx" ON "_pages_v_blocks_hero" USING btree ("secondary_link_page_id");
  CREATE INDEX "_pages_v_blocks_cta_card_grid_cards_order_idx" ON "_pages_v_blocks_cta_card_grid_cards" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_cta_card_grid_cards_parent_id_idx" ON "_pages_v_blocks_cta_card_grid_cards" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_cta_card_grid_cards_image_idx" ON "_pages_v_blocks_cta_card_grid_cards" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_cta_card_grid_cards_link_link_page_idx" ON "_pages_v_blocks_cta_card_grid_cards" USING btree ("link_page_id");
  CREATE INDEX "_pages_v_blocks_cta_card_grid_order_idx" ON "_pages_v_blocks_cta_card_grid" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_cta_card_grid_parent_id_idx" ON "_pages_v_blocks_cta_card_grid" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_cta_card_grid_path_idx" ON "_pages_v_blocks_cta_card_grid" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_cta_card_grid_view_all_view_all_page_idx" ON "_pages_v_blocks_cta_card_grid" USING btree ("view_all_page_id");
  CREATE INDEX "_pages_v_blocks_two_column_facts_order_idx" ON "_pages_v_blocks_two_column_facts" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_two_column_facts_parent_id_idx" ON "_pages_v_blocks_two_column_facts" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_two_column_order_idx" ON "_pages_v_blocks_two_column" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_two_column_parent_id_idx" ON "_pages_v_blocks_two_column" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_two_column_path_idx" ON "_pages_v_blocks_two_column" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_two_column_image_idx" ON "_pages_v_blocks_two_column" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_two_column_inset_image_idx" ON "_pages_v_blocks_two_column" USING btree ("inset_image_id");
  CREATE INDEX "_pages_v_blocks_two_column_link_link_page_idx" ON "_pages_v_blocks_two_column" USING btree ("link_page_id");
  CREATE INDEX "_pages_v_blocks_rich_text_order_idx" ON "_pages_v_blocks_rich_text" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_rich_text_parent_id_idx" ON "_pages_v_blocks_rich_text" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_rich_text_path_idx" ON "_pages_v_blocks_rich_text" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_rate_table_columns_order_idx" ON "_pages_v_blocks_rate_table_columns" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_rate_table_columns_parent_id_idx" ON "_pages_v_blocks_rate_table_columns" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_rate_table_tabs_sections_rows_order_idx" ON "_pages_v_blocks_rate_table_tabs_sections_rows" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_rate_table_tabs_sections_rows_parent_id_idx" ON "_pages_v_blocks_rate_table_tabs_sections_rows" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_rate_table_tabs_sections_order_idx" ON "_pages_v_blocks_rate_table_tabs_sections" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_rate_table_tabs_sections_parent_id_idx" ON "_pages_v_blocks_rate_table_tabs_sections" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_rate_table_tabs_order_idx" ON "_pages_v_blocks_rate_table_tabs" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_rate_table_tabs_parent_id_idx" ON "_pages_v_blocks_rate_table_tabs" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_rate_table_included_order_idx" ON "_pages_v_blocks_rate_table_included" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_rate_table_included_parent_id_idx" ON "_pages_v_blocks_rate_table_included" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_rate_table_order_idx" ON "_pages_v_blocks_rate_table" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_rate_table_parent_id_idx" ON "_pages_v_blocks_rate_table" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_rate_table_path_idx" ON "_pages_v_blocks_rate_table" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_rate_table_button_button_page_idx" ON "_pages_v_blocks_rate_table" USING btree ("button_page_id");
  CREATE INDEX "_pages_v_blocks_gallery_images_order_idx" ON "_pages_v_blocks_gallery_images" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_gallery_images_parent_id_idx" ON "_pages_v_blocks_gallery_images" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_gallery_images_image_idx" ON "_pages_v_blocks_gallery_images" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_gallery_order_idx" ON "_pages_v_blocks_gallery" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_gallery_parent_id_idx" ON "_pages_v_blocks_gallery" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_gallery_path_idx" ON "_pages_v_blocks_gallery" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_document_list_order_idx" ON "_pages_v_blocks_document_list" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_document_list_parent_id_idx" ON "_pages_v_blocks_document_list" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_document_list_path_idx" ON "_pages_v_blocks_document_list" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_document_list_view_all_view_all_page_idx" ON "_pages_v_blocks_document_list" USING btree ("view_all_page_id");
  CREATE INDEX "_pages_v_blocks_map_routes_order_idx" ON "_pages_v_blocks_map_routes" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_map_routes_parent_id_idx" ON "_pages_v_blocks_map_routes" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_map_order_idx" ON "_pages_v_blocks_map" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_map_parent_id_idx" ON "_pages_v_blocks_map" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_map_path_idx" ON "_pages_v_blocks_map" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_pull_quote_order_idx" ON "_pages_v_blocks_pull_quote" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_pull_quote_parent_id_idx" ON "_pages_v_blocks_pull_quote" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_pull_quote_path_idx" ON "_pages_v_blocks_pull_quote" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_pull_quote_image_idx" ON "_pages_v_blocks_pull_quote" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_timeline_entries_order_idx" ON "_pages_v_blocks_timeline_entries" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_timeline_entries_parent_id_idx" ON "_pages_v_blocks_timeline_entries" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_timeline_entries_image_idx" ON "_pages_v_blocks_timeline_entries" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_timeline_order_idx" ON "_pages_v_blocks_timeline" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_timeline_parent_id_idx" ON "_pages_v_blocks_timeline" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_timeline_path_idx" ON "_pages_v_blocks_timeline" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_logo_strip_partners_order_idx" ON "_pages_v_blocks_logo_strip_partners" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_logo_strip_partners_parent_id_idx" ON "_pages_v_blocks_logo_strip_partners" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_logo_strip_partners_logo_idx" ON "_pages_v_blocks_logo_strip_partners" USING btree ("logo_id");
  CREATE INDEX "_pages_v_blocks_logo_strip_order_idx" ON "_pages_v_blocks_logo_strip" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_logo_strip_parent_id_idx" ON "_pages_v_blocks_logo_strip" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_logo_strip_path_idx" ON "_pages_v_blocks_logo_strip" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_faq_items_order_idx" ON "_pages_v_blocks_faq_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_faq_items_parent_id_idx" ON "_pages_v_blocks_faq_items" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_faq_order_idx" ON "_pages_v_blocks_faq" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_faq_parent_id_idx" ON "_pages_v_blocks_faq" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_faq_path_idx" ON "_pages_v_blocks_faq" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_faq_contact_link_contact_link_page_idx" ON "_pages_v_blocks_faq" USING btree ("contact_link_page_id");
  CREATE INDEX "_pages_v_blocks_team_order_idx" ON "_pages_v_blocks_team" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_team_parent_id_idx" ON "_pages_v_blocks_team" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_team_path_idx" ON "_pages_v_blocks_team" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_team_featured_idx" ON "_pages_v_blocks_team" USING btree ("featured_id");
  CREATE INDEX "_pages_v_blocks_team_action_action_page_idx" ON "_pages_v_blocks_team" USING btree ("action_page_id");
  CREATE INDEX "_pages_v_blocks_team_view_all_view_all_page_idx" ON "_pages_v_blocks_team" USING btree ("view_all_page_id");
  CREATE INDEX "_pages_v_blocks_membership_tiers_benefits_order_idx" ON "_pages_v_blocks_membership_tiers_benefits" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_membership_tiers_benefits_parent_id_idx" ON "_pages_v_blocks_membership_tiers_benefits" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_membership_tiers_values_order_idx" ON "_pages_v_blocks_membership_tiers_values" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_membership_tiers_values_parent_id_idx" ON "_pages_v_blocks_membership_tiers_values" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_membership_tiers_order_idx" ON "_pages_v_blocks_membership_tiers" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_membership_tiers_parent_id_idx" ON "_pages_v_blocks_membership_tiers" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_membership_tiers_link_link_page_idx" ON "_pages_v_blocks_membership_tiers" USING btree ("link_page_id");
  CREATE INDEX "_pages_v_blocks_membership_features_order_idx" ON "_pages_v_blocks_membership_features" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_membership_features_parent_id_idx" ON "_pages_v_blocks_membership_features" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_membership_order_idx" ON "_pages_v_blocks_membership" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_membership_parent_id_idx" ON "_pages_v_blocks_membership" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_membership_path_idx" ON "_pages_v_blocks_membership" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_membership_action_action_page_idx" ON "_pages_v_blocks_membership" USING btree ("action_page_id");
  CREATE INDEX "_pages_v_blocks_membership_card_link_card_link_page_idx" ON "_pages_v_blocks_membership" USING btree ("card_link_page_id");
  CREATE INDEX "_pages_v_blocks_hole_grid_order_idx" ON "_pages_v_blocks_hole_grid" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_hole_grid_parent_id_idx" ON "_pages_v_blocks_hole_grid" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_hole_grid_path_idx" ON "_pages_v_blocks_hole_grid" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_hole_grid_course_idx" ON "_pages_v_blocks_hole_grid" USING btree ("course_id");
  CREATE INDEX "_pages_v_blocks_scorecard_order_idx" ON "_pages_v_blocks_scorecard" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_scorecard_parent_id_idx" ON "_pages_v_blocks_scorecard" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_scorecard_path_idx" ON "_pages_v_blocks_scorecard" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_scorecard_course_idx" ON "_pages_v_blocks_scorecard" USING btree ("course_id");
  CREATE INDEX "_pages_v_blocks_scorecard_download_idx" ON "_pages_v_blocks_scorecard" USING btree ("download_id");
  CREATE INDEX "_pages_v_blocks_course_status_order_idx" ON "_pages_v_blocks_course_status" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_course_status_parent_id_idx" ON "_pages_v_blocks_course_status" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_course_status_path_idx" ON "_pages_v_blocks_course_status" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_course_status_status_page_status_page_pa_idx" ON "_pages_v_blocks_course_status" USING btree ("status_page_page_id");
  CREATE INDEX "_pages_v_blocks_news_feed_order_idx" ON "_pages_v_blocks_news_feed" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_news_feed_parent_id_idx" ON "_pages_v_blocks_news_feed" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_news_feed_path_idx" ON "_pages_v_blocks_news_feed" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_events_feed_order_idx" ON "_pages_v_blocks_events_feed" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_events_feed_parent_id_idx" ON "_pages_v_blocks_events_feed" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_events_feed_path_idx" ON "_pages_v_blocks_events_feed" USING btree ("_path");
  CREATE INDEX "_pages_v_parent_idx" ON "_pages_v" USING btree ("parent_id");
  CREATE INDEX "_pages_v_version_version_tenant_idx" ON "_pages_v" USING btree ("version_tenant_id");
  CREATE INDEX "_pages_v_version_version_slug_idx" ON "_pages_v" USING btree ("version_slug");
  CREATE INDEX "_pages_v_version_version_parent_idx" ON "_pages_v" USING btree ("version_parent_id");
  CREATE INDEX "_pages_v_version_version_updated_at_idx" ON "_pages_v" USING btree ("version_updated_at");
  CREATE INDEX "_pages_v_version_version_created_at_idx" ON "_pages_v" USING btree ("version_created_at");
  CREATE INDEX "_pages_v_version_version__status_idx" ON "_pages_v" USING btree ("version__status");
  CREATE INDEX "_pages_v_created_at_idx" ON "_pages_v" USING btree ("created_at");
  CREATE INDEX "_pages_v_updated_at_idx" ON "_pages_v" USING btree ("updated_at");
  CREATE INDEX "_pages_v_latest_idx" ON "_pages_v" USING btree ("latest");
  CREATE INDEX "_pages_v_autosave_idx" ON "_pages_v" USING btree ("autosave");
  CREATE INDEX "version_tenant_version_slug_idx" ON "_pages_v" USING btree ("version_tenant_id","version_slug");
  CREATE INDEX "_pages_v_rels_order_idx" ON "_pages_v_rels" USING btree ("order");
  CREATE INDEX "_pages_v_rels_parent_idx" ON "_pages_v_rels" USING btree ("parent_id");
  CREATE INDEX "_pages_v_rels_path_idx" ON "_pages_v_rels" USING btree ("path");
  CREATE INDEX "_pages_v_rels_documents_id_idx" ON "_pages_v_rels" USING btree ("documents_id");
  CREATE INDEX "_pages_v_rels_staff_id_idx" ON "_pages_v_rels" USING btree ("staff_id");
  CREATE INDEX "pages__status_idx" ON "pages" USING btree ("_status");`)

  // Hand-edited above: every page that existed before drafts is marked published (the column
  // is added with a 'published' default, then the default is switched to 'draft'), so no club
  // loses a page from its site; and deleting a page deletes its version history with it
  // (ON DELETE cascade), so no orphaned drafts are left behind.
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "_pages_v_blocks_hero" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_cta_card_grid_cards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_cta_card_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_two_column_facts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_two_column" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_rich_text" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_rate_table_columns" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_rate_table_tabs_sections_rows" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_rate_table_tabs_sections" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_rate_table_tabs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_rate_table_included" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_rate_table" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_gallery_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_gallery" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_document_list" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_map_routes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_map" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_pull_quote" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_timeline_entries" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_timeline" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_logo_strip_partners" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_logo_strip" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_faq_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_faq" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_team" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_membership_tiers_benefits" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_membership_tiers_values" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_membership_tiers" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_membership_features" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_membership" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_hole_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_scorecard" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_course_status" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_news_feed" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_events_feed" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "_pages_v_blocks_hero" CASCADE;
  DROP TABLE "_pages_v_blocks_cta_card_grid_cards" CASCADE;
  DROP TABLE "_pages_v_blocks_cta_card_grid" CASCADE;
  DROP TABLE "_pages_v_blocks_two_column_facts" CASCADE;
  DROP TABLE "_pages_v_blocks_two_column" CASCADE;
  DROP TABLE "_pages_v_blocks_rich_text" CASCADE;
  DROP TABLE "_pages_v_blocks_rate_table_columns" CASCADE;
  DROP TABLE "_pages_v_blocks_rate_table_tabs_sections_rows" CASCADE;
  DROP TABLE "_pages_v_blocks_rate_table_tabs_sections" CASCADE;
  DROP TABLE "_pages_v_blocks_rate_table_tabs" CASCADE;
  DROP TABLE "_pages_v_blocks_rate_table_included" CASCADE;
  DROP TABLE "_pages_v_blocks_rate_table" CASCADE;
  DROP TABLE "_pages_v_blocks_gallery_images" CASCADE;
  DROP TABLE "_pages_v_blocks_gallery" CASCADE;
  DROP TABLE "_pages_v_blocks_document_list" CASCADE;
  DROP TABLE "_pages_v_blocks_map_routes" CASCADE;
  DROP TABLE "_pages_v_blocks_map" CASCADE;
  DROP TABLE "_pages_v_blocks_pull_quote" CASCADE;
  DROP TABLE "_pages_v_blocks_timeline_entries" CASCADE;
  DROP TABLE "_pages_v_blocks_timeline" CASCADE;
  DROP TABLE "_pages_v_blocks_logo_strip_partners" CASCADE;
  DROP TABLE "_pages_v_blocks_logo_strip" CASCADE;
  DROP TABLE "_pages_v_blocks_faq_items" CASCADE;
  DROP TABLE "_pages_v_blocks_faq" CASCADE;
  DROP TABLE "_pages_v_blocks_team" CASCADE;
  DROP TABLE "_pages_v_blocks_membership_tiers_benefits" CASCADE;
  DROP TABLE "_pages_v_blocks_membership_tiers_values" CASCADE;
  DROP TABLE "_pages_v_blocks_membership_tiers" CASCADE;
  DROP TABLE "_pages_v_blocks_membership_features" CASCADE;
  DROP TABLE "_pages_v_blocks_membership" CASCADE;
  DROP TABLE "_pages_v_blocks_hole_grid" CASCADE;
  DROP TABLE "_pages_v_blocks_scorecard" CASCADE;
  DROP TABLE "_pages_v_blocks_course_status" CASCADE;
  DROP TABLE "_pages_v_blocks_news_feed" CASCADE;
  DROP TABLE "_pages_v_blocks_events_feed" CASCADE;
  DROP TABLE "_pages_v" CASCADE;
  DROP TABLE "_pages_v_rels" CASCADE;
  DROP INDEX "pages__status_idx";
  ALTER TABLE "pages_blocks_hero" ALTER COLUMN "style" SET NOT NULL;
  ALTER TABLE "pages_blocks_hero" ALTER COLUMN "image_id" SET NOT NULL;
  ALTER TABLE "pages_blocks_hero" ALTER COLUMN "headline" SET NOT NULL;
  ALTER TABLE "pages_blocks_cta_card_grid_cards" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "pages_blocks_cta_card_grid_cards" ALTER COLUMN "image_id" SET NOT NULL;
  ALTER TABLE "pages_blocks_cta_card_grid" ALTER COLUMN "style" SET NOT NULL;
  ALTER TABLE "pages_blocks_cta_card_grid" ALTER COLUMN "heading" SET NOT NULL;
  ALTER TABLE "pages_blocks_two_column" ALTER COLUMN "style" SET NOT NULL;
  ALTER TABLE "pages_blocks_two_column" ALTER COLUMN "image_id" SET NOT NULL;
  ALTER TABLE "pages_blocks_two_column" ALTER COLUMN "heading" SET NOT NULL;
  ALTER TABLE "pages_blocks_two_column" ALTER COLUMN "body" SET NOT NULL;
  ALTER TABLE "pages_blocks_rich_text" ALTER COLUMN "style" SET NOT NULL;
  ALTER TABLE "pages_blocks_rich_text" ALTER COLUMN "content" SET NOT NULL;
  ALTER TABLE "pages_blocks_rate_table_tabs_sections_rows" ALTER COLUMN "label" SET NOT NULL;
  ALTER TABLE "pages_blocks_rate_table_tabs" ALTER COLUMN "label" SET NOT NULL;
  ALTER TABLE "pages_blocks_rate_table_included" ALTER COLUMN "item" SET NOT NULL;
  ALTER TABLE "pages_blocks_rate_table" ALTER COLUMN "style" SET NOT NULL;
  ALTER TABLE "pages_blocks_rate_table" ALTER COLUMN "heading" SET NOT NULL;
  ALTER TABLE "pages_blocks_gallery_images" ALTER COLUMN "image_id" SET NOT NULL;
  ALTER TABLE "pages_blocks_gallery" ALTER COLUMN "style" SET NOT NULL;
  ALTER TABLE "pages_blocks_gallery" ALTER COLUMN "heading" SET NOT NULL;
  ALTER TABLE "pages_blocks_document_list" ALTER COLUMN "style" SET NOT NULL;
  ALTER TABLE "pages_blocks_document_list" ALTER COLUMN "heading" SET NOT NULL;
  ALTER TABLE "pages_blocks_map" ALTER COLUMN "style" SET NOT NULL;
  ALTER TABLE "pages_blocks_map" ALTER COLUMN "heading" SET NOT NULL;
  ALTER TABLE "pages_blocks_pull_quote" ALTER COLUMN "style" SET NOT NULL;
  ALTER TABLE "pages_blocks_pull_quote" ALTER COLUMN "quote" SET NOT NULL;
  ALTER TABLE "pages_blocks_pull_quote" ALTER COLUMN "name" SET NOT NULL;
  ALTER TABLE "pages_blocks_timeline_entries" ALTER COLUMN "year" SET NOT NULL;
  ALTER TABLE "pages_blocks_timeline_entries" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "pages_blocks_timeline_entries" ALTER COLUMN "text" SET NOT NULL;
  ALTER TABLE "pages_blocks_timeline" ALTER COLUMN "style" SET NOT NULL;
  ALTER TABLE "pages_blocks_timeline" ALTER COLUMN "heading" SET NOT NULL;
  ALTER TABLE "pages_blocks_logo_strip_partners" ALTER COLUMN "name" SET NOT NULL;
  ALTER TABLE "pages_blocks_logo_strip" ALTER COLUMN "style" SET NOT NULL;
  ALTER TABLE "pages_blocks_faq_items" ALTER COLUMN "question" SET NOT NULL;
  ALTER TABLE "pages_blocks_faq_items" ALTER COLUMN "answer" SET NOT NULL;
  ALTER TABLE "pages_blocks_faq" ALTER COLUMN "style" SET NOT NULL;
  ALTER TABLE "pages_blocks_faq" ALTER COLUMN "heading" SET NOT NULL;
  ALTER TABLE "pages_blocks_team" ALTER COLUMN "style" SET NOT NULL;
  ALTER TABLE "pages_blocks_team" ALTER COLUMN "heading" SET NOT NULL;
  ALTER TABLE "pages_blocks_membership_tiers" ALTER COLUMN "name" SET NOT NULL;
  ALTER TABLE "pages_blocks_membership" ALTER COLUMN "style" SET NOT NULL;
  ALTER TABLE "pages_blocks_membership" ALTER COLUMN "heading" SET NOT NULL;
  ALTER TABLE "pages_blocks_hole_grid" ALTER COLUMN "style" SET NOT NULL;
  ALTER TABLE "pages_blocks_hole_grid" ALTER COLUMN "heading" SET NOT NULL;
  ALTER TABLE "pages_blocks_hole_grid" ALTER COLUMN "course_id" SET NOT NULL;
  ALTER TABLE "pages_blocks_scorecard" ALTER COLUMN "style" SET NOT NULL;
  ALTER TABLE "pages_blocks_scorecard" ALTER COLUMN "heading" SET NOT NULL;
  ALTER TABLE "pages_blocks_scorecard" ALTER COLUMN "course_id" SET NOT NULL;
  ALTER TABLE "pages_blocks_course_status" ALTER COLUMN "style" SET NOT NULL;
  ALTER TABLE "pages_blocks_news_feed" ALTER COLUMN "style" SET NOT NULL;
  ALTER TABLE "pages_blocks_news_feed" ALTER COLUMN "heading" SET NOT NULL;
  ALTER TABLE "pages_blocks_events_feed" ALTER COLUMN "style" SET NOT NULL;
  ALTER TABLE "pages_blocks_events_feed" ALTER COLUMN "heading" SET NOT NULL;
  ALTER TABLE "pages" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "pages" ALTER COLUMN "slug" SET NOT NULL;
  ALTER TABLE "pages" DROP COLUMN "_status";
  DROP TYPE "public"."enum_pages_status";
  DROP TYPE "public"."enum__pages_v_blocks_hero_style";
  DROP TYPE "public"."enum__pages_v_blocks_hero_media_type";
  DROP TYPE "public"."enum__pages_v_blocks_hero_primary_button_type";
  DROP TYPE "public"."enum__pages_v_blocks_hero_primary_button_built_in";
  DROP TYPE "public"."enum__pages_v_blocks_hero_secondary_link_type";
  DROP TYPE "public"."enum__pages_v_blocks_hero_secondary_link_built_in";
  DROP TYPE "public"."enum__pages_v_blocks_cta_card_grid_cards_link_type";
  DROP TYPE "public"."enum__pages_v_blocks_cta_card_grid_cards_link_built_in";
  DROP TYPE "public"."enum__pages_v_blocks_cta_card_grid_style";
  DROP TYPE "public"."enum__pages_v_blocks_cta_card_grid_view_all_type";
  DROP TYPE "public"."enum__pages_v_blocks_cta_card_grid_view_all_built_in";
  DROP TYPE "public"."enum__pages_v_blocks_two_column_style";
  DROP TYPE "public"."enum__pages_v_blocks_two_column_image_side";
  DROP TYPE "public"."enum__pages_v_blocks_two_column_tone";
  DROP TYPE "public"."enum__pages_v_blocks_two_column_link_type";
  DROP TYPE "public"."enum__pages_v_blocks_two_column_link_built_in";
  DROP TYPE "public"."enum__pages_v_blocks_rich_text_style";
  DROP TYPE "public"."enum__pages_v_blocks_rate_table_tabs_sections_start_month";
  DROP TYPE "public"."enum__pages_v_blocks_rate_table_tabs_sections_end_month";
  DROP TYPE "public"."enum__pages_v_blocks_rate_table_style";
  DROP TYPE "public"."enum__pages_v_blocks_rate_table_button_type";
  DROP TYPE "public"."enum__pages_v_blocks_rate_table_button_built_in";
  DROP TYPE "public"."enum__pages_v_blocks_gallery_style";
  DROP TYPE "public"."enum__pages_v_blocks_document_list_style";
  DROP TYPE "public"."enum__pages_v_blocks_document_list_view_all_type";
  DROP TYPE "public"."enum__pages_v_blocks_document_list_view_all_built_in";
  DROP TYPE "public"."enum__pages_v_blocks_map_routes_mode";
  DROP TYPE "public"."enum__pages_v_blocks_map_style";
  DROP TYPE "public"."enum__pages_v_blocks_pull_quote_style";
  DROP TYPE "public"."enum__pages_v_blocks_timeline_style";
  DROP TYPE "public"."enum__pages_v_blocks_logo_strip_style";
  DROP TYPE "public"."enum__pages_v_blocks_faq_style";
  DROP TYPE "public"."enum__pages_v_blocks_faq_contact_link_type";
  DROP TYPE "public"."enum__pages_v_blocks_faq_contact_link_built_in";
  DROP TYPE "public"."enum__pages_v_blocks_team_style";
  DROP TYPE "public"."enum__pages_v_blocks_team_action_type";
  DROP TYPE "public"."enum__pages_v_blocks_team_action_built_in";
  DROP TYPE "public"."enum__pages_v_blocks_team_view_all_type";
  DROP TYPE "public"."enum__pages_v_blocks_team_view_all_built_in";
  DROP TYPE "public"."enum__pages_v_blocks_membership_tiers_link_type";
  DROP TYPE "public"."enum__pages_v_blocks_membership_tiers_link_built_in";
  DROP TYPE "public"."enum__pages_v_blocks_membership_style";
  DROP TYPE "public"."enum__pages_v_blocks_membership_action_type";
  DROP TYPE "public"."enum__pages_v_blocks_membership_action_built_in";
  DROP TYPE "public"."enum__pages_v_blocks_membership_card_link_type";
  DROP TYPE "public"."enum__pages_v_blocks_membership_card_link_built_in";
  DROP TYPE "public"."enum__pages_v_blocks_hole_grid_style";
  DROP TYPE "public"."enum__pages_v_blocks_scorecard_style";
  DROP TYPE "public"."enum__pages_v_blocks_course_status_style";
  DROP TYPE "public"."enum__pages_v_blocks_course_status_status_page_type";
  DROP TYPE "public"."enum__pages_v_blocks_course_status_status_page_built_in";
  DROP TYPE "public"."enum__pages_v_blocks_news_feed_style";
  DROP TYPE "public"."enum__pages_v_blocks_news_feed_category";
  DROP TYPE "public"."enum__pages_v_blocks_events_feed_style";
  DROP TYPE "public"."enum__pages_v_blocks_events_feed_category";
  DROP TYPE "public"."enum__pages_v_version_status";`)
}
