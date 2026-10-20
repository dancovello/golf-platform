import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_club_settings_announcement_items_tag" AS ENUM('notice', 'event', 'course', 'offer');
  CREATE TYPE "public"."enum_club_settings_announcement_items_link_type" AS ENUM('page', 'url');
  CREATE TYPE "public"."enum_club_settings_announcement_style" AS ENUM('classic', 'rotator', 'utility');
  CREATE TYPE "public"."enum_club_settings_announcement_tone" AS ENUM('brand', 'accent', 'subtle');
  CREATE TABLE "club_settings_announcement_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"message" varchar NOT NULL,
  	"tag" "enum_club_settings_announcement_items_tag" DEFAULT 'notice',
  	"starts_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL,
  	"link_label" varchar,
  	"link_type" "enum_club_settings_announcement_items_link_type" DEFAULT 'page',
  	"link_page_id" uuid,
  	"link_url" varchar
  );
  
  ALTER TABLE "club_settings" ADD COLUMN "announcement_style" "enum_club_settings_announcement_style" DEFAULT 'classic' NOT NULL;
  ALTER TABLE "club_settings" ADD COLUMN "announcement_tone" "enum_club_settings_announcement_tone" DEFAULT 'brand' NOT NULL;
  ALTER TABLE "club_settings" ADD COLUMN "announcement_show_status" boolean DEFAULT true;
  ALTER TABLE "club_settings_announcement_items" ADD CONSTRAINT "club_settings_announcement_items_link_page_id_pages_id_fk" FOREIGN KEY ("link_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "club_settings_announcement_items" ADD CONSTRAINT "club_settings_announcement_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."club_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "club_settings_announcement_items_order_idx" ON "club_settings_announcement_items" USING btree ("_order");
  CREATE INDEX "club_settings_announcement_items_parent_id_idx" ON "club_settings_announcement_items" USING btree ("_parent_id");
  CREATE INDEX "club_settings_announcement_items_link_link_page_idx" ON "club_settings_announcement_items" USING btree ("link_page_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "club_settings_announcement_items" CASCADE;
  ALTER TABLE "club_settings" DROP COLUMN "announcement_style";
  ALTER TABLE "club_settings" DROP COLUMN "announcement_tone";
  ALTER TABLE "club_settings" DROP COLUMN "announcement_show_status";
  DROP TYPE "public"."enum_club_settings_announcement_items_tag";
  DROP TYPE "public"."enum_club_settings_announcement_items_link_type";
  DROP TYPE "public"."enum_club_settings_announcement_style";
  DROP TYPE "public"."enum_club_settings_announcement_tone";`)
}
