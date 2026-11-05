import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_video_featured_layout" AS ENUM('standard', 'wide', 'split');
  CREATE TYPE "public"."enum_pages_blocks_video_video_side" AS ENUM('left', 'right');
  CREATE TYPE "public"."enum_pages_blocks_video_button_type" AS ENUM('page', 'builtIn', 'url');
  CREATE TYPE "public"."enum_pages_blocks_video_button_built_in" AS ENUM('news', 'events', 'contact', 'privacy');
  CREATE TYPE "public"."enum__pages_v_blocks_video_featured_layout" AS ENUM('standard', 'wide', 'split');
  CREATE TYPE "public"."enum__pages_v_blocks_video_video_side" AS ENUM('left', 'right');
  CREATE TYPE "public"."enum__pages_v_blocks_video_button_type" AS ENUM('page', 'builtIn', 'url');
  CREATE TYPE "public"."enum__pages_v_blocks_video_button_built_in" AS ENUM('news', 'events', 'contact', 'privacy');
  ALTER TABLE "pages_blocks_video" ADD COLUMN "featured_layout" "enum_pages_blocks_video_featured_layout" DEFAULT 'standard';
  ALTER TABLE "pages_blocks_video" ADD COLUMN "video_side" "enum_pages_blocks_video_video_side" DEFAULT 'left';
  ALTER TABLE "pages_blocks_video" ADD COLUMN "intro" varchar;
  ALTER TABLE "pages_blocks_video" ADD COLUMN "button_label" varchar;
  ALTER TABLE "pages_blocks_video" ADD COLUMN "button_type" "enum_pages_blocks_video_button_type" DEFAULT 'page';
  ALTER TABLE "pages_blocks_video" ADD COLUMN "button_page_id" uuid;
  ALTER TABLE "pages_blocks_video" ADD COLUMN "button_built_in" "enum_pages_blocks_video_button_built_in";
  ALTER TABLE "pages_blocks_video" ADD COLUMN "button_url" varchar;
  ALTER TABLE "_pages_v_blocks_video" ADD COLUMN "featured_layout" "enum__pages_v_blocks_video_featured_layout" DEFAULT 'standard';
  ALTER TABLE "_pages_v_blocks_video" ADD COLUMN "video_side" "enum__pages_v_blocks_video_video_side" DEFAULT 'left';
  ALTER TABLE "_pages_v_blocks_video" ADD COLUMN "intro" varchar;
  ALTER TABLE "_pages_v_blocks_video" ADD COLUMN "button_label" varchar;
  ALTER TABLE "_pages_v_blocks_video" ADD COLUMN "button_type" "enum__pages_v_blocks_video_button_type" DEFAULT 'page';
  ALTER TABLE "_pages_v_blocks_video" ADD COLUMN "button_page_id" uuid;
  ALTER TABLE "_pages_v_blocks_video" ADD COLUMN "button_built_in" "enum__pages_v_blocks_video_button_built_in";
  ALTER TABLE "_pages_v_blocks_video" ADD COLUMN "button_url" varchar;
  ALTER TABLE "pages_blocks_video" ADD CONSTRAINT "pages_blocks_video_button_page_id_pages_id_fk" FOREIGN KEY ("button_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_video" ADD CONSTRAINT "_pages_v_blocks_video_button_page_id_pages_id_fk" FOREIGN KEY ("button_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "pages_blocks_video_button_button_page_idx" ON "pages_blocks_video" USING btree ("button_page_id");
  CREATE INDEX "_pages_v_blocks_video_button_button_page_idx" ON "_pages_v_blocks_video" USING btree ("button_page_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_video" DROP CONSTRAINT "pages_blocks_video_button_page_id_pages_id_fk";
  
  ALTER TABLE "_pages_v_blocks_video" DROP CONSTRAINT "_pages_v_blocks_video_button_page_id_pages_id_fk";
  
  DROP INDEX "pages_blocks_video_button_button_page_idx";
  DROP INDEX "_pages_v_blocks_video_button_button_page_idx";
  ALTER TABLE "pages_blocks_video" DROP COLUMN "featured_layout";
  ALTER TABLE "pages_blocks_video" DROP COLUMN "video_side";
  ALTER TABLE "pages_blocks_video" DROP COLUMN "intro";
  ALTER TABLE "pages_blocks_video" DROP COLUMN "button_label";
  ALTER TABLE "pages_blocks_video" DROP COLUMN "button_type";
  ALTER TABLE "pages_blocks_video" DROP COLUMN "button_page_id";
  ALTER TABLE "pages_blocks_video" DROP COLUMN "button_built_in";
  ALTER TABLE "pages_blocks_video" DROP COLUMN "button_url";
  ALTER TABLE "_pages_v_blocks_video" DROP COLUMN "featured_layout";
  ALTER TABLE "_pages_v_blocks_video" DROP COLUMN "video_side";
  ALTER TABLE "_pages_v_blocks_video" DROP COLUMN "intro";
  ALTER TABLE "_pages_v_blocks_video" DROP COLUMN "button_label";
  ALTER TABLE "_pages_v_blocks_video" DROP COLUMN "button_type";
  ALTER TABLE "_pages_v_blocks_video" DROP COLUMN "button_page_id";
  ALTER TABLE "_pages_v_blocks_video" DROP COLUMN "button_built_in";
  ALTER TABLE "_pages_v_blocks_video" DROP COLUMN "button_url";
  DROP TYPE "public"."enum_pages_blocks_video_featured_layout";
  DROP TYPE "public"."enum_pages_blocks_video_video_side";
  DROP TYPE "public"."enum_pages_blocks_video_button_type";
  DROP TYPE "public"."enum_pages_blocks_video_button_built_in";
  DROP TYPE "public"."enum__pages_v_blocks_video_featured_layout";
  DROP TYPE "public"."enum__pages_v_blocks_video_video_side";
  DROP TYPE "public"."enum__pages_v_blocks_video_button_type";
  DROP TYPE "public"."enum__pages_v_blocks_video_button_built_in";`)
}
