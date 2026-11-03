import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "totp_attempts" ADD COLUMN "code_hash" varchar;
  ALTER TABLE "totp_attempts" ADD COLUMN "code_expires" timestamp(3) with time zone;
  ALTER TABLE "totp_attempts" ADD COLUMN "code_sent_at" timestamp(3) with time zone;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "totp_attempts" DROP COLUMN "code_hash";
  ALTER TABLE "totp_attempts" DROP COLUMN "code_expires";
  ALTER TABLE "totp_attempts" DROP COLUMN "code_sent_at";`)
}
