import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_club_settings_header_menu_groups_links_link_type" AS ENUM('page', 'url');
  CREATE TYPE "public"."enum_club_settings_header_menu_link_type" AS ENUM('page', 'url');
  CREATE TYPE "public"."enum_club_settings_header_style" AS ENUM('classic', 'transparent', 'appBar');
  CREATE TYPE "public"."enum_club_settings_header_booking_type" AS ENUM('page', 'url');
  CREATE TABLE "club_settings_header_menu_groups_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_label" varchar NOT NULL,
  	"link_type" "enum_club_settings_header_menu_groups_links_link_type" DEFAULT 'page',
  	"link_page_id" uuid,
  	"link_url" varchar
  );
  
  CREATE TABLE "club_settings_header_menu_groups" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL
  );
  
  CREATE TABLE "club_settings_header_menu" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"link_type" "enum_club_settings_header_menu_link_type" DEFAULT 'page',
  	"link_page_id" uuid,
  	"link_url" varchar
  );
  
  ALTER TABLE "club_settings" ADD COLUMN "branding_logo_on_light_id" uuid;
  ALTER TABLE "club_settings" ADD COLUMN "branding_logo_on_dark_id" uuid;
  ALTER TABLE "club_settings" ADD COLUMN "branding_strapline" varchar;
  ALTER TABLE "club_settings" ADD COLUMN "header_style" "enum_club_settings_header_style" DEFAULT 'classic' NOT NULL;
  ALTER TABLE "club_settings" ADD COLUMN "header_booking_label" varchar;
  ALTER TABLE "club_settings" ADD COLUMN "header_booking_type" "enum_club_settings_header_booking_type" DEFAULT 'page';
  ALTER TABLE "club_settings" ADD COLUMN "header_booking_page_id" uuid;
  ALTER TABLE "club_settings" ADD COLUMN "header_booking_url" varchar;
  ALTER TABLE "club_settings" ADD COLUMN "header_phone" varchar;
  ALTER TABLE "club_settings_header_menu_groups_links" ADD CONSTRAINT "club_settings_header_menu_groups_links_link_page_id_pages_id_fk" FOREIGN KEY ("link_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "club_settings_header_menu_groups_links" ADD CONSTRAINT "club_settings_header_menu_groups_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."club_settings_header_menu_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "club_settings_header_menu_groups" ADD CONSTRAINT "club_settings_header_menu_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."club_settings_header_menu"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "club_settings_header_menu" ADD CONSTRAINT "club_settings_header_menu_link_page_id_pages_id_fk" FOREIGN KEY ("link_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "club_settings_header_menu" ADD CONSTRAINT "club_settings_header_menu_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."club_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "club_settings_header_menu_groups_links_order_idx" ON "club_settings_header_menu_groups_links" USING btree ("_order");
  CREATE INDEX "club_settings_header_menu_groups_links_parent_id_idx" ON "club_settings_header_menu_groups_links" USING btree ("_parent_id");
  CREATE INDEX "club_settings_header_menu_groups_links_link_link_page_idx" ON "club_settings_header_menu_groups_links" USING btree ("link_page_id");
  CREATE INDEX "club_settings_header_menu_groups_order_idx" ON "club_settings_header_menu_groups" USING btree ("_order");
  CREATE INDEX "club_settings_header_menu_groups_parent_id_idx" ON "club_settings_header_menu_groups" USING btree ("_parent_id");
  CREATE INDEX "club_settings_header_menu_order_idx" ON "club_settings_header_menu" USING btree ("_order");
  CREATE INDEX "club_settings_header_menu_parent_id_idx" ON "club_settings_header_menu" USING btree ("_parent_id");
  CREATE INDEX "club_settings_header_menu_link_link_page_idx" ON "club_settings_header_menu" USING btree ("link_page_id");
  ALTER TABLE "club_settings" ADD CONSTRAINT "club_settings_branding_logo_on_light_id_media_id_fk" FOREIGN KEY ("branding_logo_on_light_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "club_settings" ADD CONSTRAINT "club_settings_branding_logo_on_dark_id_media_id_fk" FOREIGN KEY ("branding_logo_on_dark_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "club_settings" ADD CONSTRAINT "club_settings_header_booking_page_id_pages_id_fk" FOREIGN KEY ("header_booking_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "club_settings_branding_branding_logo_on_light_idx" ON "club_settings" USING btree ("branding_logo_on_light_id");
  CREATE INDEX "club_settings_branding_branding_logo_on_dark_idx" ON "club_settings" USING btree ("branding_logo_on_dark_id");
  CREATE INDEX "club_settings_header_booking_header_booking_page_idx" ON "club_settings" USING btree ("header_booking_page_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "club_settings_header_menu_groups_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "club_settings_header_menu_groups" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "club_settings_header_menu" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "club_settings_header_menu_groups_links" CASCADE;
  DROP TABLE "club_settings_header_menu_groups" CASCADE;
  DROP TABLE "club_settings_header_menu" CASCADE;
  ALTER TABLE "club_settings" DROP CONSTRAINT "club_settings_branding_logo_on_light_id_media_id_fk";
  
  ALTER TABLE "club_settings" DROP CONSTRAINT "club_settings_branding_logo_on_dark_id_media_id_fk";
  
  ALTER TABLE "club_settings" DROP CONSTRAINT "club_settings_header_booking_page_id_pages_id_fk";
  
  DROP INDEX "club_settings_branding_branding_logo_on_light_idx";
  DROP INDEX "club_settings_branding_branding_logo_on_dark_idx";
  DROP INDEX "club_settings_header_booking_header_booking_page_idx";
  ALTER TABLE "club_settings" DROP COLUMN "branding_logo_on_light_id";
  ALTER TABLE "club_settings" DROP COLUMN "branding_logo_on_dark_id";
  ALTER TABLE "club_settings" DROP COLUMN "branding_strapline";
  ALTER TABLE "club_settings" DROP COLUMN "header_style";
  ALTER TABLE "club_settings" DROP COLUMN "header_booking_label";
  ALTER TABLE "club_settings" DROP COLUMN "header_booking_type";
  ALTER TABLE "club_settings" DROP COLUMN "header_booking_page_id";
  ALTER TABLE "club_settings" DROP COLUMN "header_booking_url";
  ALTER TABLE "club_settings" DROP COLUMN "header_phone";
  DROP TYPE "public"."enum_club_settings_header_menu_groups_links_link_type";
  DROP TYPE "public"."enum_club_settings_header_menu_link_type";
  DROP TYPE "public"."enum_club_settings_header_style";
  DROP TYPE "public"."enum_club_settings_header_booking_type";`)
}
