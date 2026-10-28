import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_mk_feature_showcase_items_feature" AS ENUM('courseStatus', 'events', 'search', 'greenFees');
  CREATE TYPE "public"."enum__mk_feature_showcase_v_items_feature" AS ENUM('courseStatus', 'events', 'search', 'greenFees');
  CREATE TABLE "mk_feature_showcase_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"feature" "enum_mk_feature_showcase_items_feature",
  	"title" varchar,
  	"body" varchar
  );
  
  CREATE TABLE "mk_feature_showcase" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "_mk_feature_showcase_v_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"feature" "enum__mk_feature_showcase_v_items_feature",
  	"title" varchar,
  	"body" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_mk_feature_showcase_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "mk_feature_showcase_items" ADD CONSTRAINT "mk_feature_showcase_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."mk_feature_showcase"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "mk_feature_showcase" ADD CONSTRAINT "mk_feature_showcase_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."marketing_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_mk_feature_showcase_v_items" ADD CONSTRAINT "_mk_feature_showcase_v_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_mk_feature_showcase_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_mk_feature_showcase_v" ADD CONSTRAINT "_mk_feature_showcase_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_marketing_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "mk_feature_showcase_items_order_idx" ON "mk_feature_showcase_items" USING btree ("_order");
  CREATE INDEX "mk_feature_showcase_items_parent_id_idx" ON "mk_feature_showcase_items" USING btree ("_parent_id");
  CREATE INDEX "mk_feature_showcase_order_idx" ON "mk_feature_showcase" USING btree ("_order");
  CREATE INDEX "mk_feature_showcase_parent_id_idx" ON "mk_feature_showcase" USING btree ("_parent_id");
  CREATE INDEX "mk_feature_showcase_path_idx" ON "mk_feature_showcase" USING btree ("_path");
  CREATE INDEX "_mk_feature_showcase_v_items_order_idx" ON "_mk_feature_showcase_v_items" USING btree ("_order");
  CREATE INDEX "_mk_feature_showcase_v_items_parent_id_idx" ON "_mk_feature_showcase_v_items" USING btree ("_parent_id");
  CREATE INDEX "_mk_feature_showcase_v_order_idx" ON "_mk_feature_showcase_v" USING btree ("_order");
  CREATE INDEX "_mk_feature_showcase_v_parent_id_idx" ON "_mk_feature_showcase_v" USING btree ("_parent_id");
  CREATE INDEX "_mk_feature_showcase_v_path_idx" ON "_mk_feature_showcase_v" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "mk_feature_showcase_items" CASCADE;
  DROP TABLE "mk_feature_showcase" CASCADE;
  DROP TABLE "_mk_feature_showcase_v_items" CASCADE;
  DROP TABLE "_mk_feature_showcase_v" CASCADE;
  DROP TYPE "public"."enum_mk_feature_showcase_items_feature";
  DROP TYPE "public"."enum__mk_feature_showcase_v_items_feature";`)
}
