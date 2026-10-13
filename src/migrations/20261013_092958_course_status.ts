import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_course_status_style" AS ENUM('board', 'band', 'widget');
  CREATE TYPE "public"."enum_pages_blocks_course_status_status_page_type" AS ENUM('page', 'url');
  CREATE TYPE "public"."enum_course_status_facilities_state" AS ENUM('open', 'restricted', 'closed');
  CREATE TYPE "public"."enum_course_status_state" AS ENUM('open', 'restricted', 'closed');
  CREATE TABLE "pages_blocks_course_status" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"style" "enum_pages_blocks_course_status_style" DEFAULT 'board' NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"status_page_type" "enum_pages_blocks_course_status_status_page_type" DEFAULT 'page',
  	"status_page_page_id" uuid,
  	"status_page_url" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "course_status_facilities" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"state" "enum_course_status_facilities_state" DEFAULT 'open' NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "course_status" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"tenant_id" uuid NOT NULL,
  	"state" "enum_course_status_state" DEFAULT 'open' NOT NULL,
  	"reason" varchar,
  	"changed_by" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "pages_blocks_course_status" ADD CONSTRAINT "pages_blocks_course_status_status_page_page_id_pages_id_fk" FOREIGN KEY ("status_page_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_course_status" ADD CONSTRAINT "pages_blocks_course_status_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "course_status_facilities" ADD CONSTRAINT "course_status_facilities_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."course_status"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "course_status" ADD CONSTRAINT "course_status_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
  CREATE INDEX "pages_blocks_course_status_order_idx" ON "pages_blocks_course_status" USING btree ("_order");
  CREATE INDEX "pages_blocks_course_status_parent_id_idx" ON "pages_blocks_course_status" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_course_status_path_idx" ON "pages_blocks_course_status" USING btree ("_path");
  CREATE INDEX "pages_blocks_course_status_status_page_status_page_page_idx" ON "pages_blocks_course_status" USING btree ("status_page_page_id");
  CREATE INDEX "course_status_facilities_order_idx" ON "course_status_facilities" USING btree ("_order");
  CREATE INDEX "course_status_facilities_parent_id_idx" ON "course_status_facilities" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "course_status_tenant_idx" ON "course_status" USING btree ("tenant_id");
  CREATE INDEX "course_status_updated_at_idx" ON "course_status" USING btree ("updated_at");
  CREATE INDEX "course_status_created_at_idx" ON "course_status" USING btree ("created_at");`)

  // Hand-written (and edited above: tenant_id NOT NULL, ON DELETE restrict). Every club has
  // exactly one Course status (unique index above); new clubs get theirs when created
  // (src/collections/Tenants.ts), and clubs that already exist get one here.
  await db.execute(sql`
  INSERT INTO "course_status" ("tenant_id", "state")
  SELECT "id", 'open' FROM "tenants"
  WHERE "id" NOT IN (SELECT "tenant_id" FROM "course_status");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_course_status" CASCADE;
  DROP TABLE "course_status_facilities" CASCADE;
  DROP TABLE "course_status" CASCADE;
  DROP TYPE "public"."enum_pages_blocks_course_status_style";
  DROP TYPE "public"."enum_pages_blocks_course_status_status_page_type";
  DROP TYPE "public"."enum_course_status_facilities_state";
  DROP TYPE "public"."enum_course_status_state";`)
}
