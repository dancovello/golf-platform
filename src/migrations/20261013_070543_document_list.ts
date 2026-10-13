import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_document_list_style" AS ENUM('grouped', 'cards', 'table');
  CREATE TYPE "public"."enum_pages_blocks_document_list_view_all_type" AS ENUM('page', 'url');
  CREATE TABLE "pages_blocks_document_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"style" "enum_pages_blocks_document_list_style" DEFAULT 'grouped' NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar NOT NULL,
  	"view_all_label" varchar,
  	"view_all_type" "enum_pages_blocks_document_list_view_all_type" DEFAULT 'page',
  	"view_all_page_id" uuid,
  	"view_all_url" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"documents_id" uuid
  );
  
  ALTER TABLE "pages_blocks_document_list" ADD CONSTRAINT "pages_blocks_document_list_view_all_page_id_pages_id_fk" FOREIGN KEY ("view_all_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_document_list" ADD CONSTRAINT "pages_blocks_document_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_documents_fk" FOREIGN KEY ("documents_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_document_list_order_idx" ON "pages_blocks_document_list" USING btree ("_order");
  CREATE INDEX "pages_blocks_document_list_parent_id_idx" ON "pages_blocks_document_list" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_document_list_path_idx" ON "pages_blocks_document_list" USING btree ("_path");
  CREATE INDEX "pages_blocks_document_list_view_all_view_all_page_idx" ON "pages_blocks_document_list" USING btree ("view_all_page_id");
  CREATE INDEX "pages_rels_order_idx" ON "pages_rels" USING btree ("order");
  CREATE INDEX "pages_rels_parent_idx" ON "pages_rels" USING btree ("parent_id");
  CREATE INDEX "pages_rels_path_idx" ON "pages_rels" USING btree ("path");
  CREATE INDEX "pages_rels_documents_id_idx" ON "pages_rels" USING btree ("documents_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_document_list" CASCADE;
  DROP TABLE "pages_rels" CASCADE;
  DROP TYPE "public"."enum_pages_blocks_document_list_style";
  DROP TYPE "public"."enum_pages_blocks_document_list_view_all_type";`)
}
