import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_courses_tees_colour" ADD VALUE 'black';
  CREATE TABLE "courses_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "courses_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" uuid
  );
  
  ALTER TABLE "courses_tees" ADD COLUMN "name" varchar;
  ALTER TABLE "courses_holes" ADD COLUMN "yards_black" numeric;
  ALTER TABLE "courses_holes" ADD COLUMN "plan_id" uuid;
  ALTER TABLE "courses_holes" ADD COLUMN "description" varchar;
  ALTER TABLE "courses_holes" ADD COLUMN "note_tee" varchar;
  ALTER TABLE "courses_holes" ADD COLUMN "note_approach" varchar;
  ALTER TABLE "courses_holes" ADD COLUMN "note_green" varchar;
  ALTER TABLE "courses" ADD COLUMN "tip_from" varchar;
  ALTER TABLE "courses_texts" ADD CONSTRAINT "courses_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_rels" ADD CONSTRAINT "courses_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_rels" ADD CONSTRAINT "courses_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "courses_texts_order_parent" ON "courses_texts" USING btree ("order","parent_id");
  CREATE INDEX "courses_rels_order_idx" ON "courses_rels" USING btree ("order");
  CREATE INDEX "courses_rels_parent_idx" ON "courses_rels" USING btree ("parent_id");
  CREATE INDEX "courses_rels_path_idx" ON "courses_rels" USING btree ("path");
  CREATE INDEX "courses_rels_media_id_idx" ON "courses_rels" USING btree ("media_id");
  ALTER TABLE "courses_holes" ADD CONSTRAINT "courses_holes_plan_id_media_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "courses_holes_plan_idx" ON "courses_holes" USING btree ("plan_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "courses_texts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "courses_texts" CASCADE;
  DROP TABLE "courses_rels" CASCADE;
  ALTER TABLE "courses_holes" DROP CONSTRAINT "courses_holes_plan_id_media_id_fk";
  
  ALTER TABLE "courses_tees" ALTER COLUMN "colour" SET DATA TYPE text;
  DROP TYPE "public"."enum_courses_tees_colour";
  CREATE TYPE "public"."enum_courses_tees_colour" AS ENUM('white', 'yellow', 'red', 'blue');
  ALTER TABLE "courses_tees" ALTER COLUMN "colour" SET DATA TYPE "public"."enum_courses_tees_colour" USING "colour"::"public"."enum_courses_tees_colour";
  DROP INDEX "courses_holes_plan_idx";
  ALTER TABLE "courses_tees" DROP COLUMN "name";
  ALTER TABLE "courses_holes" DROP COLUMN "yards_black";
  ALTER TABLE "courses_holes" DROP COLUMN "plan_id";
  ALTER TABLE "courses_holes" DROP COLUMN "description";
  ALTER TABLE "courses_holes" DROP COLUMN "note_tee";
  ALTER TABLE "courses_holes" DROP COLUMN "note_approach";
  ALTER TABLE "courses_holes" DROP COLUMN "note_green";
  ALTER TABLE "courses" DROP COLUMN "tip_from";`)
}
