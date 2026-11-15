import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_rate_table_tabs_sections" ADD COLUMN "valid_from" timestamp(3) with time zone;
  ALTER TABLE "pages_blocks_rate_table_tabs_sections" ADD COLUMN "valid_until" timestamp(3) with time zone;
  ALTER TABLE "pages_blocks_rate_table" ADD COLUMN "show_upcoming" boolean DEFAULT false;
  ALTER TABLE "_pages_v_blocks_rate_table_tabs_sections" ADD COLUMN "valid_from" timestamp(3) with time zone;
  ALTER TABLE "_pages_v_blocks_rate_table_tabs_sections" ADD COLUMN "valid_until" timestamp(3) with time zone;
  ALTER TABLE "_pages_v_blocks_rate_table" ADD COLUMN "show_upcoming" boolean DEFAULT false;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_rate_table_tabs_sections" DROP COLUMN "valid_from";
  ALTER TABLE "pages_blocks_rate_table_tabs_sections" DROP COLUMN "valid_until";
  ALTER TABLE "pages_blocks_rate_table" DROP COLUMN "show_upcoming";
  ALTER TABLE "_pages_v_blocks_rate_table_tabs_sections" DROP COLUMN "valid_from";
  ALTER TABLE "_pages_v_blocks_rate_table_tabs_sections" DROP COLUMN "valid_until";
  ALTER TABLE "_pages_v_blocks_rate_table" DROP COLUMN "show_upcoming";`)
}
