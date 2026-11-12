import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_course_tour_style" AS ENUM('story', 'split', 'journey');
  CREATE TYPE "public"."enum__pages_v_blocks_course_tour_style" AS ENUM('story', 'split', 'journey');
  CREATE TABLE "pages_blocks_course_tour" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"style" "enum_pages_blocks_course_tour_style" DEFAULT 'story',
  	"heading" varchar DEFAULT 'Course tour',
  	"course_id" uuid,
  	"scorecard_page_id" uuid,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_course_tour" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"style" "enum__pages_v_blocks_course_tour_style" DEFAULT 'story',
  	"heading" varchar DEFAULT 'Course tour',
  	"course_id" uuid,
  	"scorecard_page_id" uuid,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "pages_blocks_course_tour" ADD CONSTRAINT "pages_blocks_course_tour_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_course_tour" ADD CONSTRAINT "pages_blocks_course_tour_scorecard_page_id_pages_id_fk" FOREIGN KEY ("scorecard_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_course_tour" ADD CONSTRAINT "pages_blocks_course_tour_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_course_tour" ADD CONSTRAINT "_pages_v_blocks_course_tour_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_course_tour" ADD CONSTRAINT "_pages_v_blocks_course_tour_scorecard_page_id_pages_id_fk" FOREIGN KEY ("scorecard_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_course_tour" ADD CONSTRAINT "_pages_v_blocks_course_tour_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_course_tour_order_idx" ON "pages_blocks_course_tour" USING btree ("_order");
  CREATE INDEX "pages_blocks_course_tour_parent_id_idx" ON "pages_blocks_course_tour" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_course_tour_path_idx" ON "pages_blocks_course_tour" USING btree ("_path");
  CREATE INDEX "pages_blocks_course_tour_course_idx" ON "pages_blocks_course_tour" USING btree ("course_id");
  CREATE INDEX "pages_blocks_course_tour_scorecard_page_idx" ON "pages_blocks_course_tour" USING btree ("scorecard_page_id");
  CREATE INDEX "_pages_v_blocks_course_tour_order_idx" ON "_pages_v_blocks_course_tour" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_course_tour_parent_id_idx" ON "_pages_v_blocks_course_tour" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_course_tour_path_idx" ON "_pages_v_blocks_course_tour" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_course_tour_course_idx" ON "_pages_v_blocks_course_tour" USING btree ("course_id");
  CREATE INDEX "_pages_v_blocks_course_tour_scorecard_page_idx" ON "_pages_v_blocks_course_tour" USING btree ("scorecard_page_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_course_tour" CASCADE;
  DROP TABLE "_pages_v_blocks_course_tour" CASCADE;
  DROP TYPE "public"."enum_pages_blocks_course_tour_style";
  DROP TYPE "public"."enum__pages_v_blocks_course_tour_style";`)
}
