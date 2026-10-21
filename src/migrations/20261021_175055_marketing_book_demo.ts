import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "mk_demo_intro_expect" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "mk_demo_intro" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"subhead" varchar,
  	"email_lead" varchar DEFAULT 'Rather email?',
  	"block_name" varchar
  );
  
  CREATE TABLE "_mk_demo_intro_v_expect" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_mk_demo_intro_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"subhead" varchar,
  	"email_lead" varchar DEFAULT 'Rather email?',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "mk_founder" ADD COLUMN "message" varchar;
  ALTER TABLE "_mk_founder_v" ADD COLUMN "message" varchar;
  ALTER TABLE "mk_demo_intro_expect" ADD CONSTRAINT "mk_demo_intro_expect_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."mk_demo_intro"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "mk_demo_intro" ADD CONSTRAINT "mk_demo_intro_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."marketing_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_mk_demo_intro_v_expect" ADD CONSTRAINT "_mk_demo_intro_v_expect_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_mk_demo_intro_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_mk_demo_intro_v" ADD CONSTRAINT "_mk_demo_intro_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_marketing_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "mk_demo_intro_expect_order_idx" ON "mk_demo_intro_expect" USING btree ("_order");
  CREATE INDEX "mk_demo_intro_expect_parent_id_idx" ON "mk_demo_intro_expect" USING btree ("_parent_id");
  CREATE INDEX "mk_demo_intro_order_idx" ON "mk_demo_intro" USING btree ("_order");
  CREATE INDEX "mk_demo_intro_parent_id_idx" ON "mk_demo_intro" USING btree ("_parent_id");
  CREATE INDEX "mk_demo_intro_path_idx" ON "mk_demo_intro" USING btree ("_path");
  CREATE INDEX "_mk_demo_intro_v_expect_order_idx" ON "_mk_demo_intro_v_expect" USING btree ("_order");
  CREATE INDEX "_mk_demo_intro_v_expect_parent_id_idx" ON "_mk_demo_intro_v_expect" USING btree ("_parent_id");
  CREATE INDEX "_mk_demo_intro_v_order_idx" ON "_mk_demo_intro_v" USING btree ("_order");
  CREATE INDEX "_mk_demo_intro_v_parent_id_idx" ON "_mk_demo_intro_v" USING btree ("_parent_id");
  CREATE INDEX "_mk_demo_intro_v_path_idx" ON "_mk_demo_intro_v" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "mk_demo_intro_expect" CASCADE;
  DROP TABLE "mk_demo_intro" CASCADE;
  DROP TABLE "_mk_demo_intro_v_expect" CASCADE;
  DROP TABLE "_mk_demo_intro_v" CASCADE;
  ALTER TABLE "mk_founder" DROP COLUMN "message";
  ALTER TABLE "_mk_founder_v" DROP COLUMN "message";`)
}
