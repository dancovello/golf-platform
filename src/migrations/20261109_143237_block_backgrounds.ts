import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_rich_text_background" AS ENUM('canvas', 'subtle', 'brand');
  CREATE TYPE "public"."enum_pages_blocks_gallery_background" AS ENUM('brand', 'plain');
  CREATE TYPE "public"."enum__pages_v_blocks_rich_text_background" AS ENUM('canvas', 'subtle', 'brand');
  CREATE TYPE "public"."enum__pages_v_blocks_gallery_background" AS ENUM('brand', 'plain');
  ALTER TABLE "pages_blocks_rich_text" ADD COLUMN "background" "enum_pages_blocks_rich_text_background";
  ALTER TABLE "pages_blocks_gallery" ADD COLUMN "background" "enum_pages_blocks_gallery_background" DEFAULT 'brand';
  ALTER TABLE "pages_blocks_logo_strip" ADD COLUMN "still" boolean DEFAULT false;
  ALTER TABLE "_pages_v_blocks_rich_text" ADD COLUMN "background" "enum__pages_v_blocks_rich_text_background";
  ALTER TABLE "_pages_v_blocks_gallery" ADD COLUMN "background" "enum__pages_v_blocks_gallery_background" DEFAULT 'brand';
  ALTER TABLE "_pages_v_blocks_logo_strip" ADD COLUMN "still" boolean DEFAULT false;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_rich_text" DROP COLUMN "background";
  ALTER TABLE "pages_blocks_gallery" DROP COLUMN "background";
  ALTER TABLE "pages_blocks_logo_strip" DROP COLUMN "still";
  ALTER TABLE "_pages_v_blocks_rich_text" DROP COLUMN "background";
  ALTER TABLE "_pages_v_blocks_gallery" DROP COLUMN "background";
  ALTER TABLE "_pages_v_blocks_logo_strip" DROP COLUMN "still";
  DROP TYPE "public"."enum_pages_blocks_rich_text_background";
  DROP TYPE "public"."enum_pages_blocks_gallery_background";
  DROP TYPE "public"."enum__pages_v_blocks_rich_text_background";
  DROP TYPE "public"."enum__pages_v_blocks_gallery_background";`)
}
