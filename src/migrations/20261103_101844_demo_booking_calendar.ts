import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_demo_bookings_status" AS ENUM('booked', 'done', 'cancelled');
  CREATE TYPE "public"."enum_marketing_settings_demo_calls_hours_weekday" AS ENUM('mon', 'tue', 'wed', 'thu', 'fri');
  CREATE TABLE "demo_bookings" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"status" "enum_demo_bookings_status" DEFAULT 'booked' NOT NULL,
  	"date" varchar NOT NULL,
  	"time" varchar NOT NULL,
  	"slot_key" varchar,
  	"name" varchar NOT NULL,
  	"role" varchar,
  	"club" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"alert_sent_at" timestamp(3) with time zone,
  	"confirmation_sent_at" timestamp(3) with time zone,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "marketing_settings_demo_calls_hours" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"weekday" "enum_marketing_settings_demo_calls_hours_weekday" NOT NULL,
  	"from" varchar NOT NULL,
  	"to" varchar NOT NULL
  );
  
  ALTER TABLE "marketing_settings" ADD COLUMN "demo_calls_slot_minutes" numeric DEFAULT 30 NOT NULL;
  ALTER TABLE "marketing_settings" ADD COLUMN "demo_calls_days_ahead" numeric DEFAULT 21 NOT NULL;
  ALTER TABLE "marketing_settings" ADD COLUMN "demo_calls_notice_hours" numeric DEFAULT 24 NOT NULL;
  ALTER TABLE "marketing_settings" ADD COLUMN "demo_calls_video_link" varchar;
  ALTER TABLE "marketing_settings_demo_calls_hours" ADD CONSTRAINT "marketing_settings_demo_calls_hours_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."marketing_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "demo_bookings_slot_key_idx" ON "demo_bookings" USING btree ("slot_key");
  CREATE INDEX "demo_bookings_updated_at_idx" ON "demo_bookings" USING btree ("updated_at");
  CREATE INDEX "demo_bookings_created_at_idx" ON "demo_bookings" USING btree ("created_at");
  CREATE INDEX "marketing_settings_demo_calls_hours_order_idx" ON "marketing_settings_demo_calls_hours" USING btree ("_order");
  CREATE INDEX "marketing_settings_demo_calls_hours_parent_id_idx" ON "marketing_settings_demo_calls_hours" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "demo_bookings" CASCADE;
  DROP TABLE "marketing_settings_demo_calls_hours" CASCADE;
  ALTER TABLE "marketing_settings" DROP COLUMN "demo_calls_slot_minutes";
  ALTER TABLE "marketing_settings" DROP COLUMN "demo_calls_days_ahead";
  ALTER TABLE "marketing_settings" DROP COLUMN "demo_calls_notice_hours";
  ALTER TABLE "marketing_settings" DROP COLUMN "demo_calls_video_link";
  DROP TYPE "public"."enum_demo_bookings_status";
  DROP TYPE "public"."enum_marketing_settings_demo_calls_hours_weekday";`)
}
