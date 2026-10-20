import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_hero_style" AS ENUM('heritage', 'resort', 'bookingLed');
  CREATE TYPE "public"."enum_pages_blocks_hero_media_type" AS ENUM('image', 'video');
  CREATE TYPE "public"."enum_pages_blocks_hero_primary_button_type" AS ENUM('page', 'url');
  CREATE TYPE "public"."enum_pages_blocks_hero_secondary_link_type" AS ENUM('page', 'url');
  CREATE TABLE "pages_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"style" "enum_pages_blocks_hero_style" DEFAULT 'heritage' NOT NULL,
  	"media_type" "enum_pages_blocks_hero_media_type" DEFAULT 'image',
  	"image_id" uuid NOT NULL,
  	"video_id" uuid,
  	"eyebrow" varchar,
  	"headline" varchar NOT NULL,
  	"caption" varchar,
  	"primary_button_label" varchar,
  	"primary_button_type" "enum_pages_blocks_hero_primary_button_type" DEFAULT 'page',
  	"primary_button_page_id" uuid,
  	"primary_button_url" varchar,
  	"secondary_link_label" varchar,
  	"secondary_link_type" "enum_pages_blocks_hero_secondary_link_type" DEFAULT 'page',
  	"secondary_link_page_id" uuid,
  	"secondary_link_url" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "media" ADD COLUMN "sizes_w640_url" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_w640_width" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_w640_height" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_w640_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_w640_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_w640_filename" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_w1024_url" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_w1024_width" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_w1024_height" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_w1024_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_w1024_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_w1024_filename" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_w1600_url" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_w1600_width" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_w1600_height" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_w1600_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_w1600_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_w1600_filename" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_w2400_url" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_w2400_width" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_w2400_height" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_w2400_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_w2400_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_w2400_filename" varchar;
  ALTER TABLE "pages_blocks_hero" ADD CONSTRAINT "pages_blocks_hero_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero" ADD CONSTRAINT "pages_blocks_hero_video_id_media_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero" ADD CONSTRAINT "pages_blocks_hero_primary_button_page_id_pages_id_fk" FOREIGN KEY ("primary_button_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero" ADD CONSTRAINT "pages_blocks_hero_secondary_link_page_id_pages_id_fk" FOREIGN KEY ("secondary_link_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero" ADD CONSTRAINT "pages_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_hero_order_idx" ON "pages_blocks_hero" USING btree ("_order");
  CREATE INDEX "pages_blocks_hero_parent_id_idx" ON "pages_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_hero_path_idx" ON "pages_blocks_hero" USING btree ("_path");
  CREATE INDEX "pages_blocks_hero_image_idx" ON "pages_blocks_hero" USING btree ("image_id");
  CREATE INDEX "pages_blocks_hero_video_idx" ON "pages_blocks_hero" USING btree ("video_id");
  CREATE INDEX "pages_blocks_hero_primary_button_primary_button_page_idx" ON "pages_blocks_hero" USING btree ("primary_button_page_id");
  CREATE INDEX "pages_blocks_hero_secondary_link_secondary_link_page_idx" ON "pages_blocks_hero" USING btree ("secondary_link_page_id");
  CREATE INDEX "media_sizes_w640_sizes_w640_filename_idx" ON "media" USING btree ("sizes_w640_filename");
  CREATE INDEX "media_sizes_w1024_sizes_w1024_filename_idx" ON "media" USING btree ("sizes_w1024_filename");
  CREATE INDEX "media_sizes_w1600_sizes_w1600_filename_idx" ON "media" USING btree ("sizes_w1600_filename");
  CREATE INDEX "media_sizes_w2400_sizes_w2400_filename_idx" ON "media" USING btree ("sizes_w2400_filename");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_hero" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pages_blocks_hero" CASCADE;
  DROP INDEX "media_sizes_w640_sizes_w640_filename_idx";
  DROP INDEX "media_sizes_w1024_sizes_w1024_filename_idx";
  DROP INDEX "media_sizes_w1600_sizes_w1600_filename_idx";
  DROP INDEX "media_sizes_w2400_sizes_w2400_filename_idx";
  ALTER TABLE "media" DROP COLUMN "sizes_w640_url";
  ALTER TABLE "media" DROP COLUMN "sizes_w640_width";
  ALTER TABLE "media" DROP COLUMN "sizes_w640_height";
  ALTER TABLE "media" DROP COLUMN "sizes_w640_mime_type";
  ALTER TABLE "media" DROP COLUMN "sizes_w640_filesize";
  ALTER TABLE "media" DROP COLUMN "sizes_w640_filename";
  ALTER TABLE "media" DROP COLUMN "sizes_w1024_url";
  ALTER TABLE "media" DROP COLUMN "sizes_w1024_width";
  ALTER TABLE "media" DROP COLUMN "sizes_w1024_height";
  ALTER TABLE "media" DROP COLUMN "sizes_w1024_mime_type";
  ALTER TABLE "media" DROP COLUMN "sizes_w1024_filesize";
  ALTER TABLE "media" DROP COLUMN "sizes_w1024_filename";
  ALTER TABLE "media" DROP COLUMN "sizes_w1600_url";
  ALTER TABLE "media" DROP COLUMN "sizes_w1600_width";
  ALTER TABLE "media" DROP COLUMN "sizes_w1600_height";
  ALTER TABLE "media" DROP COLUMN "sizes_w1600_mime_type";
  ALTER TABLE "media" DROP COLUMN "sizes_w1600_filesize";
  ALTER TABLE "media" DROP COLUMN "sizes_w1600_filename";
  ALTER TABLE "media" DROP COLUMN "sizes_w2400_url";
  ALTER TABLE "media" DROP COLUMN "sizes_w2400_width";
  ALTER TABLE "media" DROP COLUMN "sizes_w2400_height";
  ALTER TABLE "media" DROP COLUMN "sizes_w2400_mime_type";
  ALTER TABLE "media" DROP COLUMN "sizes_w2400_filesize";
  ALTER TABLE "media" DROP COLUMN "sizes_w2400_filename";
  DROP TYPE "public"."enum_pages_blocks_hero_style";
  DROP TYPE "public"."enum_pages_blocks_hero_media_type";
  DROP TYPE "public"."enum_pages_blocks_hero_primary_button_type";
  DROP TYPE "public"."enum_pages_blocks_hero_secondary_link_type";`)
}
