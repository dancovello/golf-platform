import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_scorecard_style" AS ENUM('classic', 'vertical', 'teeSelector');
  CREATE TABLE "pages_blocks_scorecard" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"style" "enum_pages_blocks_scorecard_style" DEFAULT 'classic' NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar NOT NULL,
  	"course_id" uuid NOT NULL,
  	"download_id" uuid,
  	"link_to_guide" boolean,
  	"note" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "pages_blocks_scorecard" ADD CONSTRAINT "pages_blocks_scorecard_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_scorecard" ADD CONSTRAINT "pages_blocks_scorecard_download_id_documents_id_fk" FOREIGN KEY ("download_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_scorecard" ADD CONSTRAINT "pages_blocks_scorecard_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_scorecard_order_idx" ON "pages_blocks_scorecard" USING btree ("_order");
  CREATE INDEX "pages_blocks_scorecard_parent_id_idx" ON "pages_blocks_scorecard" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_scorecard_path_idx" ON "pages_blocks_scorecard" USING btree ("_path");
  CREATE INDEX "pages_blocks_scorecard_course_idx" ON "pages_blocks_scorecard" USING btree ("course_id");
  CREATE INDEX "pages_blocks_scorecard_download_idx" ON "pages_blocks_scorecard" USING btree ("download_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_scorecard" CASCADE;
  DROP TYPE "public"."enum_pages_blocks_scorecard_style";`)
}
