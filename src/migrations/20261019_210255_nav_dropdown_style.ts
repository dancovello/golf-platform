import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_club_settings_header_dropdown" AS ENUM('panel', 'panelTile');
  ALTER TABLE "club_settings" ADD COLUMN "header_dropdown" "enum_club_settings_header_dropdown" DEFAULT 'panel' NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "club_settings" DROP COLUMN "header_dropdown";
  DROP TYPE "public"."enum_club_settings_header_dropdown";`)
}
