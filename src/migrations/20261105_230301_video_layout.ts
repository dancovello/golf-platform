import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_video_layout" AS ENUM('auto', 'grid', 'carousel');
  CREATE TYPE "public"."enum__pages_v_blocks_video_layout" AS ENUM('auto', 'grid', 'carousel');
  ALTER TABLE "pages_blocks_video" ADD COLUMN "layout" "enum_pages_blocks_video_layout" DEFAULT 'auto';
  ALTER TABLE "_pages_v_blocks_video" ADD COLUMN "layout" "enum__pages_v_blocks_video_layout" DEFAULT 'auto';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_video" DROP COLUMN "layout";
  ALTER TABLE "_pages_v_blocks_video" DROP COLUMN "layout";
  DROP TYPE "public"."enum_pages_blocks_video_layout";
  DROP TYPE "public"."enum__pages_v_blocks_video_layout";`)
}
