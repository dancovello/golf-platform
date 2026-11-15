import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_courses_tees_players" AS ENUM('both', 'men', 'women');
  ALTER TYPE "public"."enum_courses_tees_colour" ADD VALUE 'green';
  ALTER TYPE "public"."enum_courses_tees_colour" ADD VALUE 'gold';
  ALTER TYPE "public"."enum_courses_tees_colour" ADD VALUE 'orange';
  ALTER TYPE "public"."enum_courses_tees_colour" ADD VALUE 'purple';
  ALTER TYPE "public"."enum_courses_tees_colour" ADD VALUE 'silver';
  ALTER TABLE "courses_tees" ADD COLUMN "players" "enum_courses_tees_players" DEFAULT 'both';
  ALTER TABLE "courses_tees" ADD COLUMN "winter" boolean DEFAULT false;
  ALTER TABLE "courses_tees" ADD COLUMN "slot" numeric;
  ALTER TABLE "courses_holes" ADD COLUMN "yards1" numeric;
  ALTER TABLE "courses_holes" ADD COLUMN "yards2" numeric;
  ALTER TABLE "courses_holes" ADD COLUMN "yards3" numeric;
  ALTER TABLE "courses_holes" ADD COLUMN "yards4" numeric;
  ALTER TABLE "courses_holes" ADD COLUMN "yards5" numeric;
  ALTER TABLE "courses_holes" ADD COLUMN "yards6" numeric;
  ALTER TABLE "courses_holes" ADD COLUMN "yards7" numeric;
  ALTER TABLE "courses_holes" ADD COLUMN "yards8" numeric;`)
  // Copy existing yards into the new tee slots (G1, 15 Nov 2026). Each existing tee keeps its
  // place in the list as its slot, and each hole's yards move from the tee's colour column into
  // that slot. The old colour columns are left as they were, so nothing is deleted.
  await db.execute(sql`
  UPDATE "courses_tees" SET "slot" = "_order" WHERE "_order" BETWEEN 1 AND 8;`)
  for (const slot of [1, 2, 3, 4, 5, 6, 7, 8]) {
    await db.execute(
      sql.raw(`
  UPDATE "courses_holes" h SET "yards${slot}" = CASE t."colour"::text
      WHEN 'white' THEN h."yards_white"
      WHEN 'yellow' THEN h."yards_yellow"
      WHEN 'red' THEN h."yards_red"
      WHEN 'blue' THEN h."yards_blue"
      WHEN 'black' THEN h."yards_black"
    END
  FROM "courses_tees" t
  WHERE t."_parent_id" = h."_parent_id" AND t."slot" = ${slot};`),
    )
  }
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "courses_tees" ALTER COLUMN "colour" SET DATA TYPE text;
  DROP TYPE "public"."enum_courses_tees_colour";
  CREATE TYPE "public"."enum_courses_tees_colour" AS ENUM('white', 'yellow', 'red', 'blue', 'black');
  ALTER TABLE "courses_tees" ALTER COLUMN "colour" SET DATA TYPE "public"."enum_courses_tees_colour" USING "colour"::"public"."enum_courses_tees_colour";
  ALTER TABLE "courses_tees" DROP COLUMN "players";
  ALTER TABLE "courses_tees" DROP COLUMN "winter";
  ALTER TABLE "courses_tees" DROP COLUMN "slot";
  ALTER TABLE "courses_holes" DROP COLUMN "yards1";
  ALTER TABLE "courses_holes" DROP COLUMN "yards2";
  ALTER TABLE "courses_holes" DROP COLUMN "yards3";
  ALTER TABLE "courses_holes" DROP COLUMN "yards4";
  ALTER TABLE "courses_holes" DROP COLUMN "yards5";
  ALTER TABLE "courses_holes" DROP COLUMN "yards6";
  ALTER TABLE "courses_holes" DROP COLUMN "yards7";
  ALTER TABLE "courses_holes" DROP COLUMN "yards8";
  DROP TYPE "public"."enum_courses_tees_players";`)
}
