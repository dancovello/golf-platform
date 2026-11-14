import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_video_videos" ADD COLUMN "file_id" uuid;
  ALTER TABLE "_pages_v_blocks_video_videos" ADD COLUMN "file_id" uuid;
  ALTER TABLE "pages_blocks_video_videos" ADD CONSTRAINT "pages_blocks_video_videos_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_video_videos" ADD CONSTRAINT "_pages_v_blocks_video_videos_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "pages_blocks_video_videos_file_idx" ON "pages_blocks_video_videos" USING btree ("file_id");
  CREATE INDEX "_pages_v_blocks_video_videos_file_idx" ON "_pages_v_blocks_video_videos" USING btree ("file_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_video_videos" DROP CONSTRAINT "pages_blocks_video_videos_file_id_media_id_fk";
  
  ALTER TABLE "_pages_v_blocks_video_videos" DROP CONSTRAINT "_pages_v_blocks_video_videos_file_id_media_id_fk";
  
  DROP INDEX "pages_blocks_video_videos_file_idx";
  DROP INDEX "_pages_v_blocks_video_videos_file_idx";
  ALTER TABLE "pages_blocks_video_videos" DROP COLUMN "file_id";
  ALTER TABLE "_pages_v_blocks_video_videos" DROP COLUMN "file_id";`)
}
