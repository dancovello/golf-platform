import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_hole_grid_style" AS ENUM('cards', 'carousel', 'guide');
  CREATE TYPE "public"."enum_courses_tees_colour" AS ENUM('white', 'yellow', 'red', 'blue');
  CREATE TABLE "pages_blocks_hole_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"style" "enum_pages_blocks_hole_grid_style" DEFAULT 'cards' NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar NOT NULL,
  	"course_id" uuid NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "courses_tees" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"colour" "enum_courses_tees_colour" NOT NULL,
  	"rating" numeric,
  	"slope" numeric
  );
  
  CREATE TABLE "courses_holes" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"par" numeric NOT NULL,
  	"stroke_index" numeric,
  	"yards_white" numeric,
  	"yards_yellow" numeric,
  	"yards_red" numeric,
  	"yards_blue" numeric,
  	"image_id" uuid,
  	"tip" varchar
  );
  
  CREATE TABLE "courses" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"tenant_id" uuid NOT NULL,
  	"name" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "pages_blocks_hole_grid" ADD CONSTRAINT "pages_blocks_hole_grid_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_hole_grid" ADD CONSTRAINT "pages_blocks_hole_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_tees" ADD CONSTRAINT "courses_tees_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_holes" ADD CONSTRAINT "courses_holes_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "courses_holes" ADD CONSTRAINT "courses_holes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses" ADD CONSTRAINT "courses_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
  CREATE INDEX "pages_blocks_hole_grid_order_idx" ON "pages_blocks_hole_grid" USING btree ("_order");
  CREATE INDEX "pages_blocks_hole_grid_parent_id_idx" ON "pages_blocks_hole_grid" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_hole_grid_path_idx" ON "pages_blocks_hole_grid" USING btree ("_path");
  CREATE INDEX "pages_blocks_hole_grid_course_idx" ON "pages_blocks_hole_grid" USING btree ("course_id");
  CREATE INDEX "courses_tees_order_idx" ON "courses_tees" USING btree ("_order");
  CREATE INDEX "courses_tees_parent_id_idx" ON "courses_tees" USING btree ("_parent_id");
  CREATE INDEX "courses_holes_order_idx" ON "courses_holes" USING btree ("_order");
  CREATE INDEX "courses_holes_parent_id_idx" ON "courses_holes" USING btree ("_parent_id");
  CREATE INDEX "courses_holes_image_idx" ON "courses_holes" USING btree ("image_id");
  CREATE INDEX "courses_tenant_idx" ON "courses" USING btree ("tenant_id");
  CREATE INDEX "courses_updated_at_idx" ON "courses" USING btree ("updated_at");
  CREATE INDEX "courses_created_at_idx" ON "courses" USING btree ("created_at");`)

  // Hand-edited above: courses.tenant_id NOT NULL and ON DELETE restrict. Every course
  // belongs to a club, and a club can't be deleted while it has courses.
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_hole_grid" CASCADE;
  DROP TABLE "courses_tees" CASCADE;
  DROP TABLE "courses_holes" CASCADE;
  DROP TABLE "courses" CASCADE;
  DROP TYPE "public"."enum_pages_blocks_hole_grid_style";
  DROP TYPE "public"."enum_courses_tees_colour";`)
}
