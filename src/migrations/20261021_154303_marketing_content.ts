import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_mk_media_ratio" AS ENUM('16:9', '3:2', '1:1', '4:5');
  CREATE TYPE "public"."enum_mk_media_frame" AS ENUM('plain', 'window');
  CREATE TYPE "public"."enum_mk_cards_cards_availability" AS ENUM('live', 'coming-next');
  CREATE TYPE "public"."enum_marketing_pages_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__mk_media_v_ratio" AS ENUM('16:9', '3:2', '1:1', '4:5');
  CREATE TYPE "public"."enum__mk_media_v_frame" AS ENUM('plain', 'window');
  CREATE TYPE "public"."enum__mk_cards_v_cards_availability" AS ENUM('live', 'coming-next');
  CREATE TYPE "public"."enum__marketing_pages_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "mk_header" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"subhead" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "mk_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"content" jsonb,
  	"block_name" varchar
  );
  
  CREATE TABLE "mk_media" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" uuid,
  	"ratio" "enum_mk_media_ratio" DEFAULT '16:9',
  	"frame" "enum_mk_media_frame" DEFAULT 'plain',
  	"caption" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "mk_cards_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar,
  	"availability" "enum_mk_cards_cards_availability" DEFAULT 'live'
  );
  
  CREATE TABLE "mk_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "mk_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"subhead" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "marketing_pages" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_marketing_pages_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_mk_header_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"subhead" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_mk_text_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"content" jsonb,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_mk_media_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"image_id" uuid,
  	"ratio" "enum__mk_media_v_ratio" DEFAULT '16:9',
  	"frame" "enum__mk_media_v_frame" DEFAULT 'plain',
  	"caption" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_mk_cards_v_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"title" varchar,
  	"body" varchar,
  	"availability" "enum__mk_cards_v_cards_availability" DEFAULT 'live',
  	"_uuid" varchar
  );
  
  CREATE TABLE "_mk_cards_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_mk_cta_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"title" varchar,
  	"subhead" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_marketing_pages_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__marketing_pages_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "marketing_media" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"alt" varchar NOT NULL,
  	"prefix" varchar,
  	"_objectkey" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_w640_url" varchar,
  	"sizes_w640_width" numeric,
  	"sizes_w640_height" numeric,
  	"sizes_w640_mime_type" varchar,
  	"sizes_w640_filesize" numeric,
  	"sizes_w640_filename" varchar,
  	"sizes_w1024_url" varchar,
  	"sizes_w1024_width" numeric,
  	"sizes_w1024_height" numeric,
  	"sizes_w1024_mime_type" varchar,
  	"sizes_w1024_filesize" numeric,
  	"sizes_w1024_filename" varchar,
  	"sizes_w1600_url" varchar,
  	"sizes_w1600_width" numeric,
  	"sizes_w1600_height" numeric,
  	"sizes_w1600_mime_type" varchar,
  	"sizes_w1600_filesize" numeric,
  	"sizes_w1600_filename" varchar,
  	"sizes_w2400_url" varchar,
  	"sizes_w2400_width" numeric,
  	"sizes_w2400_height" numeric,
  	"sizes_w2400_mime_type" varchar,
  	"sizes_w2400_filesize" numeric,
  	"sizes_w2400_filename" varchar,
  	"sizes_w3200_url" varchar,
  	"sizes_w3200_width" numeric,
  	"sizes_w3200_height" numeric,
  	"sizes_w3200_mime_type" varchar,
  	"sizes_w3200_filesize" numeric,
  	"sizes_w3200_filename" varchar
  );
  
  CREATE TABLE "marketing_settings" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"pricing_monthly_price" numeric DEFAULT 149 NOT NULL,
  	"pricing_vat_label" varchar DEFAULT '+ VAT' NOT NULL,
  	"pricing_minimum_term_months" numeric DEFAULT 12 NOT NULL,
  	"pricing_notice_days" numeric DEFAULT 90 NOT NULL,
  	"pricing_second_course_price" numeric,
  	"trust_restore_window_days" numeric,
  	"founder_name" varchar DEFAULT 'Dan' NOT NULL,
  	"founder_role" varchar,
  	"founder_message" varchar,
  	"founder_photo_id" uuid,
  	"founder_phone" varchar,
  	"founder_calendar_link" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "mk_header" ADD CONSTRAINT "mk_header_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."marketing_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "mk_text" ADD CONSTRAINT "mk_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."marketing_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "mk_media" ADD CONSTRAINT "mk_media_image_id_marketing_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."marketing_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "mk_media" ADD CONSTRAINT "mk_media_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."marketing_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "mk_cards_cards" ADD CONSTRAINT "mk_cards_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."mk_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "mk_cards" ADD CONSTRAINT "mk_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."marketing_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "mk_cta" ADD CONSTRAINT "mk_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."marketing_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_mk_header_v" ADD CONSTRAINT "_mk_header_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_marketing_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_mk_text_v" ADD CONSTRAINT "_mk_text_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_marketing_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_mk_media_v" ADD CONSTRAINT "_mk_media_v_image_id_marketing_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."marketing_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_mk_media_v" ADD CONSTRAINT "_mk_media_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_marketing_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_mk_cards_v_cards" ADD CONSTRAINT "_mk_cards_v_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_mk_cards_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_mk_cards_v" ADD CONSTRAINT "_mk_cards_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_marketing_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_mk_cta_v" ADD CONSTRAINT "_mk_cta_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_marketing_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_marketing_pages_v" ADD CONSTRAINT "_marketing_pages_v_parent_id_marketing_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."marketing_pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "marketing_settings" ADD CONSTRAINT "marketing_settings_founder_photo_id_marketing_media_id_fk" FOREIGN KEY ("founder_photo_id") REFERENCES "public"."marketing_media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "mk_header_order_idx" ON "mk_header" USING btree ("_order");
  CREATE INDEX "mk_header_parent_id_idx" ON "mk_header" USING btree ("_parent_id");
  CREATE INDEX "mk_header_path_idx" ON "mk_header" USING btree ("_path");
  CREATE INDEX "mk_text_order_idx" ON "mk_text" USING btree ("_order");
  CREATE INDEX "mk_text_parent_id_idx" ON "mk_text" USING btree ("_parent_id");
  CREATE INDEX "mk_text_path_idx" ON "mk_text" USING btree ("_path");
  CREATE INDEX "mk_media_order_idx" ON "mk_media" USING btree ("_order");
  CREATE INDEX "mk_media_parent_id_idx" ON "mk_media" USING btree ("_parent_id");
  CREATE INDEX "mk_media_path_idx" ON "mk_media" USING btree ("_path");
  CREATE INDEX "mk_media_image_idx" ON "mk_media" USING btree ("image_id");
  CREATE INDEX "mk_cards_cards_order_idx" ON "mk_cards_cards" USING btree ("_order");
  CREATE INDEX "mk_cards_cards_parent_id_idx" ON "mk_cards_cards" USING btree ("_parent_id");
  CREATE INDEX "mk_cards_order_idx" ON "mk_cards" USING btree ("_order");
  CREATE INDEX "mk_cards_parent_id_idx" ON "mk_cards" USING btree ("_parent_id");
  CREATE INDEX "mk_cards_path_idx" ON "mk_cards" USING btree ("_path");
  CREATE INDEX "mk_cta_order_idx" ON "mk_cta" USING btree ("_order");
  CREATE INDEX "mk_cta_parent_id_idx" ON "mk_cta" USING btree ("_parent_id");
  CREATE INDEX "mk_cta_path_idx" ON "mk_cta" USING btree ("_path");
  CREATE UNIQUE INDEX "marketing_pages_slug_idx" ON "marketing_pages" USING btree ("slug");
  CREATE INDEX "marketing_pages_updated_at_idx" ON "marketing_pages" USING btree ("updated_at");
  CREATE INDEX "marketing_pages_created_at_idx" ON "marketing_pages" USING btree ("created_at");
  CREATE INDEX "marketing_pages__status_idx" ON "marketing_pages" USING btree ("_status");
  CREATE INDEX "_mk_header_v_order_idx" ON "_mk_header_v" USING btree ("_order");
  CREATE INDEX "_mk_header_v_parent_id_idx" ON "_mk_header_v" USING btree ("_parent_id");
  CREATE INDEX "_mk_header_v_path_idx" ON "_mk_header_v" USING btree ("_path");
  CREATE INDEX "_mk_text_v_order_idx" ON "_mk_text_v" USING btree ("_order");
  CREATE INDEX "_mk_text_v_parent_id_idx" ON "_mk_text_v" USING btree ("_parent_id");
  CREATE INDEX "_mk_text_v_path_idx" ON "_mk_text_v" USING btree ("_path");
  CREATE INDEX "_mk_media_v_order_idx" ON "_mk_media_v" USING btree ("_order");
  CREATE INDEX "_mk_media_v_parent_id_idx" ON "_mk_media_v" USING btree ("_parent_id");
  CREATE INDEX "_mk_media_v_path_idx" ON "_mk_media_v" USING btree ("_path");
  CREATE INDEX "_mk_media_v_image_idx" ON "_mk_media_v" USING btree ("image_id");
  CREATE INDEX "_mk_cards_v_cards_order_idx" ON "_mk_cards_v_cards" USING btree ("_order");
  CREATE INDEX "_mk_cards_v_cards_parent_id_idx" ON "_mk_cards_v_cards" USING btree ("_parent_id");
  CREATE INDEX "_mk_cards_v_order_idx" ON "_mk_cards_v" USING btree ("_order");
  CREATE INDEX "_mk_cards_v_parent_id_idx" ON "_mk_cards_v" USING btree ("_parent_id");
  CREATE INDEX "_mk_cards_v_path_idx" ON "_mk_cards_v" USING btree ("_path");
  CREATE INDEX "_mk_cta_v_order_idx" ON "_mk_cta_v" USING btree ("_order");
  CREATE INDEX "_mk_cta_v_parent_id_idx" ON "_mk_cta_v" USING btree ("_parent_id");
  CREATE INDEX "_mk_cta_v_path_idx" ON "_mk_cta_v" USING btree ("_path");
  CREATE INDEX "_marketing_pages_v_parent_idx" ON "_marketing_pages_v" USING btree ("parent_id");
  CREATE INDEX "_marketing_pages_v_version_version_slug_idx" ON "_marketing_pages_v" USING btree ("version_slug");
  CREATE INDEX "_marketing_pages_v_version_version_updated_at_idx" ON "_marketing_pages_v" USING btree ("version_updated_at");
  CREATE INDEX "_marketing_pages_v_version_version_created_at_idx" ON "_marketing_pages_v" USING btree ("version_created_at");
  CREATE INDEX "_marketing_pages_v_version_version__status_idx" ON "_marketing_pages_v" USING btree ("version__status");
  CREATE INDEX "_marketing_pages_v_created_at_idx" ON "_marketing_pages_v" USING btree ("created_at");
  CREATE INDEX "_marketing_pages_v_updated_at_idx" ON "_marketing_pages_v" USING btree ("updated_at");
  CREATE INDEX "_marketing_pages_v_latest_idx" ON "_marketing_pages_v" USING btree ("latest");
  CREATE INDEX "_marketing_pages_v_autosave_idx" ON "_marketing_pages_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "marketing_media_filename_compound_idx" ON "marketing_media" USING btree ("filename","prefix");
  CREATE UNIQUE INDEX "marketing_media_prefix_idx" ON "marketing_media" USING btree ("prefix");
  CREATE INDEX "marketing_media_updated_at_idx" ON "marketing_media" USING btree ("updated_at");
  CREATE INDEX "marketing_media_created_at_idx" ON "marketing_media" USING btree ("created_at");
  CREATE INDEX "marketing_media_filename_idx" ON "marketing_media" USING btree ("filename");
  CREATE INDEX "marketing_media_sizes_w640_sizes_w640_filename_idx" ON "marketing_media" USING btree ("sizes_w640_filename");
  CREATE INDEX "marketing_media_sizes_w1024_sizes_w1024_filename_idx" ON "marketing_media" USING btree ("sizes_w1024_filename");
  CREATE INDEX "marketing_media_sizes_w1600_sizes_w1600_filename_idx" ON "marketing_media" USING btree ("sizes_w1600_filename");
  CREATE INDEX "marketing_media_sizes_w2400_sizes_w2400_filename_idx" ON "marketing_media" USING btree ("sizes_w2400_filename");
  CREATE INDEX "marketing_media_sizes_w3200_sizes_w3200_filename_idx" ON "marketing_media" USING btree ("sizes_w3200_filename");
  CREATE INDEX "marketing_settings_founder_founder_photo_idx" ON "marketing_settings" USING btree ("founder_photo_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "mk_header" CASCADE;
  DROP TABLE "mk_text" CASCADE;
  DROP TABLE "mk_media" CASCADE;
  DROP TABLE "mk_cards_cards" CASCADE;
  DROP TABLE "mk_cards" CASCADE;
  DROP TABLE "mk_cta" CASCADE;
  DROP TABLE "marketing_pages" CASCADE;
  DROP TABLE "_mk_header_v" CASCADE;
  DROP TABLE "_mk_text_v" CASCADE;
  DROP TABLE "_mk_media_v" CASCADE;
  DROP TABLE "_mk_cards_v_cards" CASCADE;
  DROP TABLE "_mk_cards_v" CASCADE;
  DROP TABLE "_mk_cta_v" CASCADE;
  DROP TABLE "_marketing_pages_v" CASCADE;
  DROP TABLE "marketing_media" CASCADE;
  DROP TABLE "marketing_settings" CASCADE;
  DROP TYPE "public"."enum_mk_media_ratio";
  DROP TYPE "public"."enum_mk_media_frame";
  DROP TYPE "public"."enum_mk_cards_cards_availability";
  DROP TYPE "public"."enum_marketing_pages_status";
  DROP TYPE "public"."enum__mk_media_v_ratio";
  DROP TYPE "public"."enum__mk_media_v_frame";
  DROP TYPE "public"."enum__mk_cards_v_cards_availability";
  DROP TYPE "public"."enum__marketing_pages_v_version_status";`)
}
