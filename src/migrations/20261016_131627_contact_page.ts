import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_club_settings_contact_purposes_purpose" AS ENUM('general', 'visitor', 'membership', 'events', 'lessons', 'feedback');
  CREATE TYPE "public"."enum_club_settings_contact_purposes_next_link_type" AS ENUM('page', 'url');
  CREATE TYPE "public"."enum_enquiries_status" AS ENUM('new', 'handled');
  CREATE TYPE "public"."enum_enquiries_purpose" AS ENUM('general', 'visitor', 'membership', 'events', 'lessons', 'feedback');
  CREATE TABLE "club_settings_contact_purposes" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"purpose" "enum_club_settings_contact_purposes_purpose" NOT NULL,
  	"replier" varchar,
  	"inbox" varchar,
  	"next_link_label" varchar,
  	"next_link_type" "enum_club_settings_contact_purposes_next_link_type" DEFAULT 'page',
  	"next_link_page_id" uuid,
  	"next_link_url" varchar
  );
  
  CREATE TABLE "club_settings_contact_membership_types" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL
  );
  
  CREATE TABLE "enquiries" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"tenant_id" uuid NOT NULL,
  	"status" "enum_enquiries_status" DEFAULT 'new' NOT NULL,
  	"reference" varchar NOT NULL,
  	"purpose" "enum_enquiries_purpose" NOT NULL,
  	"name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"phone" varchar,
  	"membership_type" varchar,
  	"preferred_date" timestamp(3) with time zone,
  	"group_size" numeric,
  	"message" varchar NOT NULL,
  	"newsletter" boolean DEFAULT false,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "club_settings" ADD COLUMN "contact_intro" varchar DEFAULT 'Choose what it’s about and it goes straight to the right person. We reply within one working day.';
  ALTER TABLE "club_settings" ADD COLUMN "contact_reply_days" numeric DEFAULT 1 NOT NULL;
  ALTER TABLE "club_settings" ADD COLUMN "contact_office_hours" varchar;
  ALTER TABLE "club_settings" ADD COLUMN "contact_aside_title" varchar DEFAULT 'Tee times and lessons';
  ALTER TABLE "club_settings" ADD COLUMN "contact_aside_text" varchar;
  ALTER TABLE "club_settings_contact_purposes" ADD CONSTRAINT "club_settings_contact_purposes_next_link_page_id_pages_id_fk" FOREIGN KEY ("next_link_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "club_settings_contact_purposes" ADD CONSTRAINT "club_settings_contact_purposes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."club_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "club_settings_contact_membership_types" ADD CONSTRAINT "club_settings_contact_membership_types_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."club_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
  CREATE INDEX "club_settings_contact_purposes_order_idx" ON "club_settings_contact_purposes" USING btree ("_order");
  CREATE INDEX "club_settings_contact_purposes_parent_id_idx" ON "club_settings_contact_purposes" USING btree ("_parent_id");
  CREATE INDEX "club_settings_contact_purposes_next_link_next_link_page_idx" ON "club_settings_contact_purposes" USING btree ("next_link_page_id");
  CREATE INDEX "club_settings_contact_membership_types_order_idx" ON "club_settings_contact_membership_types" USING btree ("_order");
  CREATE INDEX "club_settings_contact_membership_types_parent_id_idx" ON "club_settings_contact_membership_types" USING btree ("_parent_id");
  CREATE INDEX "enquiries_tenant_idx" ON "enquiries" USING btree ("tenant_id");
  CREATE INDEX "enquiries_reference_idx" ON "enquiries" USING btree ("reference");
  CREATE INDEX "enquiries_updated_at_idx" ON "enquiries" USING btree ("updated_at");
  CREATE INDEX "enquiries_created_at_idx" ON "enquiries" USING btree ("created_at");`)

  // Hand-edited above: enquiries.tenant_id NOT NULL and ON DELETE restrict (every message
  // belongs to a club, and a club with messages can't be deleted).
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "club_settings_contact_purposes" CASCADE;
  DROP TABLE "club_settings_contact_membership_types" CASCADE;
  DROP TABLE "enquiries" CASCADE;
  ALTER TABLE "club_settings" DROP COLUMN "contact_intro";
  ALTER TABLE "club_settings" DROP COLUMN "contact_reply_days";
  ALTER TABLE "club_settings" DROP COLUMN "contact_office_hours";
  ALTER TABLE "club_settings" DROP COLUMN "contact_aside_title";
  ALTER TABLE "club_settings" DROP COLUMN "contact_aside_text";
  DROP TYPE "public"."enum_club_settings_contact_purposes_purpose";
  DROP TYPE "public"."enum_club_settings_contact_purposes_next_link_type";
  DROP TYPE "public"."enum_enquiries_status";
  DROP TYPE "public"."enum_enquiries_purpose";`)
}
