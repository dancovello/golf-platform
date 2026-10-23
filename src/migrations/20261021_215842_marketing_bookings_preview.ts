import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_mk_booking_demo_demo" AS ENUM('teeSheet', 'clubSettings', 'facilities');
  CREATE TYPE "public"."enum__mk_booking_demo_v_demo" AS ENUM('teeSheet', 'clubSettings', 'facilities');
  CREATE TABLE "mk_booking_demo" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"demo" "enum_mk_booking_demo_demo" DEFAULT 'teeSheet',
  	"show_label" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "_mk_booking_demo_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"demo" "enum__mk_booking_demo_v_demo" DEFAULT 'teeSheet',
  	"show_label" boolean DEFAULT false,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "mk_booking_demo" ADD CONSTRAINT "mk_booking_demo_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."marketing_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_mk_booking_demo_v" ADD CONSTRAINT "_mk_booking_demo_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_marketing_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "mk_booking_demo_order_idx" ON "mk_booking_demo" USING btree ("_order");
  CREATE INDEX "mk_booking_demo_parent_id_idx" ON "mk_booking_demo" USING btree ("_parent_id");
  CREATE INDEX "mk_booking_demo_path_idx" ON "mk_booking_demo" USING btree ("_path");
  CREATE INDEX "_mk_booking_demo_v_order_idx" ON "_mk_booking_demo_v" USING btree ("_order");
  CREATE INDEX "_mk_booking_demo_v_parent_id_idx" ON "_mk_booking_demo_v" USING btree ("_parent_id");
  CREATE INDEX "_mk_booking_demo_v_path_idx" ON "_mk_booking_demo_v" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "mk_booking_demo" CASCADE;
  DROP TABLE "_mk_booking_demo_v" CASCADE;
  DROP TYPE "public"."enum_mk_booking_demo_demo";
  DROP TYPE "public"."enum__mk_booking_demo_v_demo";`)
}
