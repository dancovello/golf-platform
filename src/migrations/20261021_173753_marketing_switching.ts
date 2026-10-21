import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_homepage_requests_status" AS ENUM('new', 'sent', 'closed');
  CREATE TABLE "mk_request_points" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "mk_request" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"subhead" varchar,
  	"form_title" varchar DEFAULT 'Your club',
  	"form_intro" varchar,
  	"form_button" varchar DEFAULT 'Rebuild my homepage',
  	"form_footnote" varchar DEFAULT 'We build it from your current site. Nothing on your live site changes.',
  	"form_sent_title" varchar DEFAULT 'On its way.',
  	"block_name" varchar
  );
  
  CREATE TABLE "mk_demo_ex" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT 'Example',
  	"caption" varchar DEFAULT 'A demo club rebuilt on our blocks. Same domain, same club, new site.',
  	"block_name" varchar
  );
  
  CREATE TABLE "mk_weeks_weeks" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"title" varchar,
  	"body" varchar
  );
  
  CREATE TABLE "mk_weeks" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "_mk_request_v_points" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_mk_request_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"subhead" varchar,
  	"form_title" varchar DEFAULT 'Your club',
  	"form_intro" varchar,
  	"form_button" varchar DEFAULT 'Rebuild my homepage',
  	"form_footnote" varchar DEFAULT 'We build it from your current site. Nothing on your live site changes.',
  	"form_sent_title" varchar DEFAULT 'On its way.',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_mk_demo_ex_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"eyebrow" varchar DEFAULT 'Example',
  	"caption" varchar DEFAULT 'A demo club rebuilt on our blocks. Same domain, same club, new site.',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_mk_weeks_v_weeks" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"label" varchar,
  	"title" varchar,
  	"body" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_mk_weeks_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_requests" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"status" "enum_homepage_requests_status" DEFAULT 'new' NOT NULL,
  	"due_by" timestamp(3) with time zone NOT NULL,
  	"club_name" varchar NOT NULL,
  	"website" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"alert_sent_at" timestamp(3) with time zone,
  	"confirmation_sent_at" timestamp(3) with time zone,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "marketing_settings" ADD COLUMN "requests_inbox" varchar;
  ALTER TABLE "mk_request_points" ADD CONSTRAINT "mk_request_points_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."mk_request"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "mk_request" ADD CONSTRAINT "mk_request_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."marketing_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "mk_demo_ex" ADD CONSTRAINT "mk_demo_ex_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."marketing_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "mk_weeks_weeks" ADD CONSTRAINT "mk_weeks_weeks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."mk_weeks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "mk_weeks" ADD CONSTRAINT "mk_weeks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."marketing_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_mk_request_v_points" ADD CONSTRAINT "_mk_request_v_points_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_mk_request_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_mk_request_v" ADD CONSTRAINT "_mk_request_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_marketing_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_mk_demo_ex_v" ADD CONSTRAINT "_mk_demo_ex_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_marketing_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_mk_weeks_v_weeks" ADD CONSTRAINT "_mk_weeks_v_weeks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_mk_weeks_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_mk_weeks_v" ADD CONSTRAINT "_mk_weeks_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_marketing_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "mk_request_points_order_idx" ON "mk_request_points" USING btree ("_order");
  CREATE INDEX "mk_request_points_parent_id_idx" ON "mk_request_points" USING btree ("_parent_id");
  CREATE INDEX "mk_request_order_idx" ON "mk_request" USING btree ("_order");
  CREATE INDEX "mk_request_parent_id_idx" ON "mk_request" USING btree ("_parent_id");
  CREATE INDEX "mk_request_path_idx" ON "mk_request" USING btree ("_path");
  CREATE INDEX "mk_demo_ex_order_idx" ON "mk_demo_ex" USING btree ("_order");
  CREATE INDEX "mk_demo_ex_parent_id_idx" ON "mk_demo_ex" USING btree ("_parent_id");
  CREATE INDEX "mk_demo_ex_path_idx" ON "mk_demo_ex" USING btree ("_path");
  CREATE INDEX "mk_weeks_weeks_order_idx" ON "mk_weeks_weeks" USING btree ("_order");
  CREATE INDEX "mk_weeks_weeks_parent_id_idx" ON "mk_weeks_weeks" USING btree ("_parent_id");
  CREATE INDEX "mk_weeks_order_idx" ON "mk_weeks" USING btree ("_order");
  CREATE INDEX "mk_weeks_parent_id_idx" ON "mk_weeks" USING btree ("_parent_id");
  CREATE INDEX "mk_weeks_path_idx" ON "mk_weeks" USING btree ("_path");
  CREATE INDEX "_mk_request_v_points_order_idx" ON "_mk_request_v_points" USING btree ("_order");
  CREATE INDEX "_mk_request_v_points_parent_id_idx" ON "_mk_request_v_points" USING btree ("_parent_id");
  CREATE INDEX "_mk_request_v_order_idx" ON "_mk_request_v" USING btree ("_order");
  CREATE INDEX "_mk_request_v_parent_id_idx" ON "_mk_request_v" USING btree ("_parent_id");
  CREATE INDEX "_mk_request_v_path_idx" ON "_mk_request_v" USING btree ("_path");
  CREATE INDEX "_mk_demo_ex_v_order_idx" ON "_mk_demo_ex_v" USING btree ("_order");
  CREATE INDEX "_mk_demo_ex_v_parent_id_idx" ON "_mk_demo_ex_v" USING btree ("_parent_id");
  CREATE INDEX "_mk_demo_ex_v_path_idx" ON "_mk_demo_ex_v" USING btree ("_path");
  CREATE INDEX "_mk_weeks_v_weeks_order_idx" ON "_mk_weeks_v_weeks" USING btree ("_order");
  CREATE INDEX "_mk_weeks_v_weeks_parent_id_idx" ON "_mk_weeks_v_weeks" USING btree ("_parent_id");
  CREATE INDEX "_mk_weeks_v_order_idx" ON "_mk_weeks_v" USING btree ("_order");
  CREATE INDEX "_mk_weeks_v_parent_id_idx" ON "_mk_weeks_v" USING btree ("_parent_id");
  CREATE INDEX "_mk_weeks_v_path_idx" ON "_mk_weeks_v" USING btree ("_path");
  CREATE INDEX "homepage_requests_updated_at_idx" ON "homepage_requests" USING btree ("updated_at");
  CREATE INDEX "homepage_requests_created_at_idx" ON "homepage_requests" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "mk_request_points" CASCADE;
  DROP TABLE "mk_request" CASCADE;
  DROP TABLE "mk_demo_ex" CASCADE;
  DROP TABLE "mk_weeks_weeks" CASCADE;
  DROP TABLE "mk_weeks" CASCADE;
  DROP TABLE "_mk_request_v_points" CASCADE;
  DROP TABLE "_mk_request_v" CASCADE;
  DROP TABLE "_mk_demo_ex_v" CASCADE;
  DROP TABLE "_mk_weeks_v_weeks" CASCADE;
  DROP TABLE "_mk_weeks_v" CASCADE;
  DROP TABLE "homepage_requests" CASCADE;
  ALTER TABLE "marketing_settings" DROP COLUMN "requests_inbox";
  DROP TYPE "public"."enum_homepage_requests_status";`)
}
