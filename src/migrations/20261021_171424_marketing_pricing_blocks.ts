import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "mk_pricing_coming_next" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar
  );
  
  CREATE TABLE "mk_pricing_included" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "mk_pricing" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar DEFAULT 'Build your plan',
  	"terms" varchar DEFAULT 'Billed monthly · {term}-month minimum, then rolling',
  	"courses_text" varchar DEFAULT 'Each course gets its own guide, scorecard and hole-by-hole pages.',
  	"footnote" varchar DEFAULT 'Prices exclude VAT. No setup fee. {notice} days’ notice after the first {term} months.',
  	"block_name" varchar
  );
  
  CREATE TABLE "mk_faq_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );
  
  CREATE TABLE "mk_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_mk_pricing_v_coming_next" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"title" varchar,
  	"body" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_mk_pricing_v_included" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_mk_pricing_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"title" varchar DEFAULT 'Build your plan',
  	"terms" varchar DEFAULT 'Billed monthly · {term}-month minimum, then rolling',
  	"courses_text" varchar DEFAULT 'Each course gets its own guide, scorecard and hole-by-hole pages.',
  	"footnote" varchar DEFAULT 'Prices exclude VAT. No setup fee. {notice} days’ notice after the first {term} months.',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_mk_faq_v_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_mk_faq_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"title" varchar,
  	"body" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "mk_pricing_coming_next" ADD CONSTRAINT "mk_pricing_coming_next_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."mk_pricing"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "mk_pricing_included" ADD CONSTRAINT "mk_pricing_included_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."mk_pricing"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "mk_pricing" ADD CONSTRAINT "mk_pricing_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."marketing_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "mk_faq_items" ADD CONSTRAINT "mk_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."mk_faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "mk_faq" ADD CONSTRAINT "mk_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."marketing_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_mk_pricing_v_coming_next" ADD CONSTRAINT "_mk_pricing_v_coming_next_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_mk_pricing_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_mk_pricing_v_included" ADD CONSTRAINT "_mk_pricing_v_included_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_mk_pricing_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_mk_pricing_v" ADD CONSTRAINT "_mk_pricing_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_marketing_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_mk_faq_v_items" ADD CONSTRAINT "_mk_faq_v_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_mk_faq_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_mk_faq_v" ADD CONSTRAINT "_mk_faq_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_marketing_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "mk_pricing_coming_next_order_idx" ON "mk_pricing_coming_next" USING btree ("_order");
  CREATE INDEX "mk_pricing_coming_next_parent_id_idx" ON "mk_pricing_coming_next" USING btree ("_parent_id");
  CREATE INDEX "mk_pricing_included_order_idx" ON "mk_pricing_included" USING btree ("_order");
  CREATE INDEX "mk_pricing_included_parent_id_idx" ON "mk_pricing_included" USING btree ("_parent_id");
  CREATE INDEX "mk_pricing_order_idx" ON "mk_pricing" USING btree ("_order");
  CREATE INDEX "mk_pricing_parent_id_idx" ON "mk_pricing" USING btree ("_parent_id");
  CREATE INDEX "mk_pricing_path_idx" ON "mk_pricing" USING btree ("_path");
  CREATE INDEX "mk_faq_items_order_idx" ON "mk_faq_items" USING btree ("_order");
  CREATE INDEX "mk_faq_items_parent_id_idx" ON "mk_faq_items" USING btree ("_parent_id");
  CREATE INDEX "mk_faq_order_idx" ON "mk_faq" USING btree ("_order");
  CREATE INDEX "mk_faq_parent_id_idx" ON "mk_faq" USING btree ("_parent_id");
  CREATE INDEX "mk_faq_path_idx" ON "mk_faq" USING btree ("_path");
  CREATE INDEX "_mk_pricing_v_coming_next_order_idx" ON "_mk_pricing_v_coming_next" USING btree ("_order");
  CREATE INDEX "_mk_pricing_v_coming_next_parent_id_idx" ON "_mk_pricing_v_coming_next" USING btree ("_parent_id");
  CREATE INDEX "_mk_pricing_v_included_order_idx" ON "_mk_pricing_v_included" USING btree ("_order");
  CREATE INDEX "_mk_pricing_v_included_parent_id_idx" ON "_mk_pricing_v_included" USING btree ("_parent_id");
  CREATE INDEX "_mk_pricing_v_order_idx" ON "_mk_pricing_v" USING btree ("_order");
  CREATE INDEX "_mk_pricing_v_parent_id_idx" ON "_mk_pricing_v" USING btree ("_parent_id");
  CREATE INDEX "_mk_pricing_v_path_idx" ON "_mk_pricing_v" USING btree ("_path");
  CREATE INDEX "_mk_faq_v_items_order_idx" ON "_mk_faq_v_items" USING btree ("_order");
  CREATE INDEX "_mk_faq_v_items_parent_id_idx" ON "_mk_faq_v_items" USING btree ("_parent_id");
  CREATE INDEX "_mk_faq_v_order_idx" ON "_mk_faq_v" USING btree ("_order");
  CREATE INDEX "_mk_faq_v_parent_id_idx" ON "_mk_faq_v" USING btree ("_parent_id");
  CREATE INDEX "_mk_faq_v_path_idx" ON "_mk_faq_v" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "mk_pricing_coming_next" CASCADE;
  DROP TABLE "mk_pricing_included" CASCADE;
  DROP TABLE "mk_pricing" CASCADE;
  DROP TABLE "mk_faq_items" CASCADE;
  DROP TABLE "mk_faq" CASCADE;
  DROP TABLE "_mk_pricing_v_coming_next" CASCADE;
  DROP TABLE "_mk_pricing_v_included" CASCADE;
  DROP TABLE "_mk_pricing_v" CASCADE;
  DROP TABLE "_mk_faq_v_items" CASCADE;
  DROP TABLE "_mk_faq_v" CASCADE;`)
}
