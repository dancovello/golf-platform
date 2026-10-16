import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_club_settings_header_menu_extra_links_link_type" AS ENUM('page', 'builtIn', 'url');
  CREATE TYPE "public"."enum_club_settings_header_menu_extra_links_link_built_in" AS ENUM('news', 'events', 'contact', 'privacy');
  CREATE TYPE "public"."enum_club_settings_header_menu_kind" AS ENUM('link', 'children', 'manual');
  CREATE TYPE "public"."enum_club_settings_footer_link_columns_source" AS ENUM('manual', 'children');
  CREATE TABLE "club_settings_header_menu_extra_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_label" varchar,
  	"link_type" "enum_club_settings_header_menu_extra_links_link_type" DEFAULT 'page',
  	"link_page_id" uuid,
  	"link_built_in" "enum_club_settings_header_menu_extra_links_link_built_in",
  	"link_url" varchar
  );
  
  ALTER TABLE "club_settings_header_menu_groups_links" ALTER COLUMN "link_label" DROP NOT NULL;
  ALTER TABLE "club_settings_header_menu_groups" ALTER COLUMN "heading" DROP NOT NULL;
  ALTER TABLE "club_settings_footer_link_columns_links" ALTER COLUMN "link_label" DROP NOT NULL;
  ALTER TABLE "pages" ADD COLUMN "parent_id" uuid;
  ALTER TABLE "pages" ADD COLUMN "menu_position" numeric;
  ALTER TABLE "pages" ADD COLUMN "hide_from_menu" boolean DEFAULT false;
  ALTER TABLE "club_settings_header_menu" ADD COLUMN "kind" "enum_club_settings_header_menu_kind";
  ALTER TABLE "club_settings_header_menu" ADD COLUMN "page_id" uuid;
  ALTER TABLE "club_settings_header_menu" ADD COLUMN "include_parent" boolean DEFAULT true;
  ALTER TABLE "club_settings_footer_link_columns" ADD COLUMN "source" "enum_club_settings_footer_link_columns_source" DEFAULT 'manual';
  ALTER TABLE "club_settings_footer_link_columns" ADD COLUMN "page_id" uuid;
  ALTER TABLE "club_settings_header_menu_extra_links" ADD CONSTRAINT "club_settings_header_menu_extra_links_link_page_id_pages_id_fk" FOREIGN KEY ("link_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "club_settings_header_menu_extra_links" ADD CONSTRAINT "club_settings_header_menu_extra_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."club_settings_header_menu"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "club_settings_header_menu_extra_links_order_idx" ON "club_settings_header_menu_extra_links" USING btree ("_order");
  CREATE INDEX "club_settings_header_menu_extra_links_parent_id_idx" ON "club_settings_header_menu_extra_links" USING btree ("_parent_id");
  CREATE INDEX "club_settings_header_menu_extra_links_link_link_page_idx" ON "club_settings_header_menu_extra_links" USING btree ("link_page_id");
  ALTER TABLE "pages" ADD CONSTRAINT "pages_parent_id_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "club_settings_header_menu" ADD CONSTRAINT "club_settings_header_menu_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "club_settings_footer_link_columns" ADD CONSTRAINT "club_settings_footer_link_columns_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "pages_parent_idx" ON "pages" USING btree ("parent_id");
  CREATE INDEX "club_settings_header_menu_page_idx" ON "club_settings_header_menu" USING btree ("page_id");
  CREATE INDEX "club_settings_footer_link_columns_page_idx" ON "club_settings_footer_link_columns" USING btree ("page_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "club_settings_header_menu_extra_links" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "club_settings_header_menu_extra_links" CASCADE;
  ALTER TABLE "pages" DROP CONSTRAINT "pages_parent_id_pages_id_fk";
  
  ALTER TABLE "club_settings_header_menu" DROP CONSTRAINT "club_settings_header_menu_page_id_pages_id_fk";
  
  ALTER TABLE "club_settings_footer_link_columns" DROP CONSTRAINT "club_settings_footer_link_columns_page_id_pages_id_fk";
  
  DROP INDEX "pages_parent_idx";
  DROP INDEX "club_settings_header_menu_page_idx";
  DROP INDEX "club_settings_footer_link_columns_page_idx";
  ALTER TABLE "club_settings_header_menu_groups_links" ALTER COLUMN "link_label" SET NOT NULL;
  ALTER TABLE "club_settings_header_menu_groups" ALTER COLUMN "heading" SET NOT NULL;
  ALTER TABLE "club_settings_footer_link_columns_links" ALTER COLUMN "link_label" SET NOT NULL;
  ALTER TABLE "pages" DROP COLUMN "parent_id";
  ALTER TABLE "pages" DROP COLUMN "menu_position";
  ALTER TABLE "pages" DROP COLUMN "hide_from_menu";
  ALTER TABLE "club_settings_header_menu" DROP COLUMN "kind";
  ALTER TABLE "club_settings_header_menu" DROP COLUMN "page_id";
  ALTER TABLE "club_settings_header_menu" DROP COLUMN "include_parent";
  ALTER TABLE "club_settings_footer_link_columns" DROP COLUMN "source";
  ALTER TABLE "club_settings_footer_link_columns" DROP COLUMN "page_id";
  DROP TYPE "public"."enum_club_settings_header_menu_extra_links_link_type";
  DROP TYPE "public"."enum_club_settings_header_menu_extra_links_link_built_in";
  DROP TYPE "public"."enum_club_settings_header_menu_kind";
  DROP TYPE "public"."enum_club_settings_footer_link_columns_source";`)
}
