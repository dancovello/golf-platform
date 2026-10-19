import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "media" ADD COLUMN "sizes_w3200_url" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_w3200_width" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_w3200_height" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_w3200_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_w3200_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_w3200_filename" varchar;
  CREATE INDEX "media_sizes_w3200_sizes_w3200_filename_idx" ON "media" USING btree ("sizes_w3200_filename");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "media_sizes_w3200_sizes_w3200_filename_idx";
  ALTER TABLE "media" DROP COLUMN "sizes_w3200_url";
  ALTER TABLE "media" DROP COLUMN "sizes_w3200_width";
  ALTER TABLE "media" DROP COLUMN "sizes_w3200_height";
  ALTER TABLE "media" DROP COLUMN "sizes_w3200_mime_type";
  ALTER TABLE "media" DROP COLUMN "sizes_w3200_filesize";
  ALTER TABLE "media" DROP COLUMN "sizes_w3200_filename";`)
}
