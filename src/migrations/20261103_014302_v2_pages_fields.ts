import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "mk_club_morph" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"note" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_mk_club_morph_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"note" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "mk_request" ADD COLUMN "form_sent_body" varchar DEFAULT 'We’ll be in touch. We’ll email {email} to arrange your demo.';
  ALTER TABLE "mk_request" ADD COLUMN "alt_title" varchar;
  ALTER TABLE "mk_request" ADD COLUMN "alt_label" varchar;
  ALTER TABLE "mk_request" ADD COLUMN "alt_href" varchar;
  ALTER TABLE "mk_demo_intro" ADD COLUMN "alt_title" varchar;
  ALTER TABLE "mk_demo_intro" ADD COLUMN "alt_body" varchar;
  ALTER TABLE "mk_demo_intro" ADD COLUMN "alt_label" varchar;
  ALTER TABLE "mk_demo_intro" ADD COLUMN "alt_href" varchar;
  ALTER TABLE "_mk_request_v" ADD COLUMN "form_sent_body" varchar DEFAULT 'We’ll be in touch. We’ll email {email} to arrange your demo.';
  ALTER TABLE "_mk_request_v" ADD COLUMN "alt_title" varchar;
  ALTER TABLE "_mk_request_v" ADD COLUMN "alt_label" varchar;
  ALTER TABLE "_mk_request_v" ADD COLUMN "alt_href" varchar;
  ALTER TABLE "_mk_demo_intro_v" ADD COLUMN "alt_title" varchar;
  ALTER TABLE "_mk_demo_intro_v" ADD COLUMN "alt_body" varchar;
  ALTER TABLE "_mk_demo_intro_v" ADD COLUMN "alt_label" varchar;
  ALTER TABLE "_mk_demo_intro_v" ADD COLUMN "alt_href" varchar;
  ALTER TABLE "mk_club_morph" ADD CONSTRAINT "mk_club_morph_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."marketing_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_mk_club_morph_v" ADD CONSTRAINT "_mk_club_morph_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_marketing_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "mk_club_morph_order_idx" ON "mk_club_morph" USING btree ("_order");
  CREATE INDEX "mk_club_morph_parent_id_idx" ON "mk_club_morph" USING btree ("_parent_id");
  CREATE INDEX "mk_club_morph_path_idx" ON "mk_club_morph" USING btree ("_path");
  CREATE INDEX "_mk_club_morph_v_order_idx" ON "_mk_club_morph_v" USING btree ("_order");
  CREATE INDEX "_mk_club_morph_v_parent_id_idx" ON "_mk_club_morph_v" USING btree ("_parent_id");
  CREATE INDEX "_mk_club_morph_v_path_idx" ON "_mk_club_morph_v" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "mk_club_morph" CASCADE;
  DROP TABLE "_mk_club_morph_v" CASCADE;
  ALTER TABLE "mk_request" DROP COLUMN "form_sent_body";
  ALTER TABLE "mk_request" DROP COLUMN "alt_title";
  ALTER TABLE "mk_request" DROP COLUMN "alt_label";
  ALTER TABLE "mk_request" DROP COLUMN "alt_href";
  ALTER TABLE "mk_demo_intro" DROP COLUMN "alt_title";
  ALTER TABLE "mk_demo_intro" DROP COLUMN "alt_body";
  ALTER TABLE "mk_demo_intro" DROP COLUMN "alt_label";
  ALTER TABLE "mk_demo_intro" DROP COLUMN "alt_href";
  ALTER TABLE "_mk_request_v" DROP COLUMN "form_sent_body";
  ALTER TABLE "_mk_request_v" DROP COLUMN "alt_title";
  ALTER TABLE "_mk_request_v" DROP COLUMN "alt_label";
  ALTER TABLE "_mk_request_v" DROP COLUMN "alt_href";
  ALTER TABLE "_mk_demo_intro_v" DROP COLUMN "alt_title";
  ALTER TABLE "_mk_demo_intro_v" DROP COLUMN "alt_body";
  ALTER TABLE "_mk_demo_intro_v" DROP COLUMN "alt_label";
  ALTER TABLE "_mk_demo_intro_v" DROP COLUMN "alt_href";`)
}
