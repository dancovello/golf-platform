import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "marketing_settings" ALTER COLUMN "founder_role" SET DEFAULT 'Senior product designer with more than eight years delivering and scaling sports platforms. I designed every block, and I build and run this one from Cardiff.';
  ALTER TABLE "marketing_settings" ALTER COLUMN "founder_message" SET DEFAULT 'You’ll deal with me from the first call to launch day, and after it.';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "marketing_settings" ALTER COLUMN "founder_role" DROP DEFAULT;
  ALTER TABLE "marketing_settings" ALTER COLUMN "founder_message" DROP DEFAULT;`)
}
