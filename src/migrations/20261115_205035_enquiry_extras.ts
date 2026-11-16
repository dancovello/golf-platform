import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_club_settings_contact_purposes_extra_fields" AS ENUM('course', 'organisation', 'caddies', 'buggies', 'trolleys', 'hireClubs', 'catering', 'heardFrom');
  CREATE TABLE "club_settings_contact_purposes_extra_fields" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "enum_club_settings_contact_purposes_extra_fields",
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
  );
  
  ALTER TABLE "enquiries" ADD COLUMN "course" varchar;
  ALTER TABLE "enquiries" ADD COLUMN "organisation" varchar;
  ALTER TABLE "enquiries" ADD COLUMN "caddies" numeric;
  ALTER TABLE "enquiries" ADD COLUMN "buggies" numeric;
  ALTER TABLE "enquiries" ADD COLUMN "trolleys" numeric;
  ALTER TABLE "enquiries" ADD COLUMN "hire_clubs" numeric;
  ALTER TABLE "enquiries" ADD COLUMN "catering" varchar;
  ALTER TABLE "enquiries" ADD COLUMN "heard_from" varchar;
  ALTER TABLE "club_settings_contact_purposes_extra_fields" ADD CONSTRAINT "club_settings_contact_purposes_extra_fields_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."club_settings_contact_purposes"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "club_settings_contact_purposes_extra_fields_order_idx" ON "club_settings_contact_purposes_extra_fields" USING btree ("order");
  CREATE INDEX "club_settings_contact_purposes_extra_fields_parent_idx" ON "club_settings_contact_purposes_extra_fields" USING btree ("parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "club_settings_contact_purposes_extra_fields" CASCADE;
  ALTER TABLE "enquiries" DROP COLUMN "course";
  ALTER TABLE "enquiries" DROP COLUMN "organisation";
  ALTER TABLE "enquiries" DROP COLUMN "caddies";
  ALTER TABLE "enquiries" DROP COLUMN "buggies";
  ALTER TABLE "enquiries" DROP COLUMN "trolleys";
  ALTER TABLE "enquiries" DROP COLUMN "hire_clubs";
  ALTER TABLE "enquiries" DROP COLUMN "catering";
  ALTER TABLE "enquiries" DROP COLUMN "heard_from";
  DROP TYPE "public"."enum_club_settings_contact_purposes_extra_fields";`)
}
