import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_course_record_style" AS ENUM('board', 'card', 'split');
  CREATE TYPE "public"."enum__pages_v_blocks_course_record_style" AS ENUM('board', 'card', 'split');
  CREATE TABLE "pages_blocks_course_record" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"style" "enum_pages_blocks_course_record_style" DEFAULT 'board',
  	"eyebrow" varchar,
  	"holder_name" varchar,
  	"score" numeric,
  	"under_par" numeric,
  	"year" numeric,
  	"course_detail" varchar,
  	"description" varchar,
  	"photo_id" uuid,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_course_record" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"style" "enum__pages_v_blocks_course_record_style" DEFAULT 'board',
  	"eyebrow" varchar,
  	"holder_name" varchar,
  	"score" numeric,
  	"under_par" numeric,
  	"year" numeric,
  	"course_detail" varchar,
  	"description" varchar,
  	"photo_id" uuid,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "pages_blocks_course_record" ADD CONSTRAINT "pages_blocks_course_record_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_course_record" ADD CONSTRAINT "pages_blocks_course_record_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_course_record" ADD CONSTRAINT "_pages_v_blocks_course_record_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_course_record" ADD CONSTRAINT "_pages_v_blocks_course_record_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_course_record_order_idx" ON "pages_blocks_course_record" USING btree ("_order");
  CREATE INDEX "pages_blocks_course_record_parent_id_idx" ON "pages_blocks_course_record" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_course_record_path_idx" ON "pages_blocks_course_record" USING btree ("_path");
  CREATE INDEX "pages_blocks_course_record_photo_idx" ON "pages_blocks_course_record" USING btree ("photo_id");
  CREATE INDEX "_pages_v_blocks_course_record_order_idx" ON "_pages_v_blocks_course_record" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_course_record_parent_id_idx" ON "_pages_v_blocks_course_record" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_course_record_path_idx" ON "_pages_v_blocks_course_record" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_course_record_photo_idx" ON "_pages_v_blocks_course_record" USING btree ("photo_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_course_record" CASCADE;
  DROP TABLE "_pages_v_blocks_course_record" CASCADE;
  DROP TYPE "public"."enum_pages_blocks_course_record_style";
  DROP TYPE "public"."enum__pages_v_blocks_course_record_style";`)
}
