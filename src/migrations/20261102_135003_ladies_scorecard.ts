import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "courses_tees" ADD COLUMN "rating_women" numeric;
  ALTER TABLE "courses_tees" ADD COLUMN "slope_women" numeric;
  ALTER TABLE "courses_holes" ADD COLUMN "ladies_par" numeric;
  ALTER TABLE "courses_holes" ADD COLUMN "ladies_stroke_index" numeric;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "courses_tees" DROP COLUMN "rating_women";
  ALTER TABLE "courses_tees" DROP COLUMN "slope_women";
  ALTER TABLE "courses_holes" DROP COLUMN "ladies_par";
  ALTER TABLE "courses_holes" DROP COLUMN "ladies_stroke_index";`)
}
