import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "club_settings" ADD COLUMN "privacy_legal_name" varchar;
  ALTER TABLE "club_settings" ADD COLUMN "privacy_email" varchar;
  ALTER TABLE "club_settings" ADD COLUMN "privacy_newsletter_provider" varchar;
  ALTER TABLE "club_settings" ADD COLUMN "privacy_ga_measurement_id" varchar;
  ALTER TABLE "club_settings" ADD COLUMN "privacy_additional_info" jsonb;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "club_settings" DROP COLUMN "privacy_legal_name";
  ALTER TABLE "club_settings" DROP COLUMN "privacy_email";
  ALTER TABLE "club_settings" DROP COLUMN "privacy_newsletter_provider";
  ALTER TABLE "club_settings" DROP COLUMN "privacy_ga_measurement_id";
  ALTER TABLE "club_settings" DROP COLUMN "privacy_additional_info";`)
}
