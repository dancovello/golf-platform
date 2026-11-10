import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_two_column_button_type" AS ENUM('page', 'builtIn', 'url', 'document');
  CREATE TYPE "public"."enum_pages_blocks_two_column_button_built_in" AS ENUM('news', 'events', 'contact', 'privacy');
  CREATE TYPE "public"."enum__pages_v_blocks_two_column_button_type" AS ENUM('page', 'builtIn', 'url', 'document');
  CREATE TYPE "public"."enum__pages_v_blocks_two_column_button_built_in" AS ENUM('news', 'events', 'contact', 'privacy');
  ALTER TABLE "pages_blocks_two_column" ADD COLUMN "button_label" varchar;
  ALTER TABLE "pages_blocks_two_column" ADD COLUMN "button_type" "enum_pages_blocks_two_column_button_type" DEFAULT 'page';
  ALTER TABLE "pages_blocks_two_column" ADD COLUMN "button_page_id" uuid;
  ALTER TABLE "pages_blocks_two_column" ADD COLUMN "button_document_id" uuid;
  ALTER TABLE "pages_blocks_two_column" ADD COLUMN "button_built_in" "enum_pages_blocks_two_column_button_built_in";
  ALTER TABLE "pages_blocks_two_column" ADD COLUMN "button_url" varchar;
  ALTER TABLE "_pages_v_blocks_two_column" ADD COLUMN "button_label" varchar;
  ALTER TABLE "_pages_v_blocks_two_column" ADD COLUMN "button_type" "enum__pages_v_blocks_two_column_button_type" DEFAULT 'page';
  ALTER TABLE "_pages_v_blocks_two_column" ADD COLUMN "button_page_id" uuid;
  ALTER TABLE "_pages_v_blocks_two_column" ADD COLUMN "button_document_id" uuid;
  ALTER TABLE "_pages_v_blocks_two_column" ADD COLUMN "button_built_in" "enum__pages_v_blocks_two_column_button_built_in";
  ALTER TABLE "_pages_v_blocks_two_column" ADD COLUMN "button_url" varchar;
  ALTER TABLE "pages_blocks_two_column" ADD CONSTRAINT "pages_blocks_two_column_button_page_id_pages_id_fk" FOREIGN KEY ("button_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_two_column" ADD CONSTRAINT "pages_blocks_two_column_button_document_id_documents_id_fk" FOREIGN KEY ("button_document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_two_column" ADD CONSTRAINT "_pages_v_blocks_two_column_button_page_id_pages_id_fk" FOREIGN KEY ("button_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_two_column" ADD CONSTRAINT "_pages_v_blocks_two_column_button_document_id_documents_id_fk" FOREIGN KEY ("button_document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "pages_blocks_two_column_button_button_page_idx" ON "pages_blocks_two_column" USING btree ("button_page_id");
  CREATE INDEX "pages_blocks_two_column_button_button_document_idx" ON "pages_blocks_two_column" USING btree ("button_document_id");
  CREATE INDEX "_pages_v_blocks_two_column_button_button_page_idx" ON "_pages_v_blocks_two_column" USING btree ("button_page_id");
  CREATE INDEX "_pages_v_blocks_two_column_button_button_document_idx" ON "_pages_v_blocks_two_column" USING btree ("button_document_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_two_column" DROP CONSTRAINT "pages_blocks_two_column_button_page_id_pages_id_fk";
  
  ALTER TABLE "pages_blocks_two_column" DROP CONSTRAINT "pages_blocks_two_column_button_document_id_documents_id_fk";
  
  ALTER TABLE "_pages_v_blocks_two_column" DROP CONSTRAINT "_pages_v_blocks_two_column_button_page_id_pages_id_fk";
  
  ALTER TABLE "_pages_v_blocks_two_column" DROP CONSTRAINT "_pages_v_blocks_two_column_button_document_id_documents_id_fk";
  
  DROP INDEX "pages_blocks_two_column_button_button_page_idx";
  DROP INDEX "pages_blocks_two_column_button_button_document_idx";
  DROP INDEX "_pages_v_blocks_two_column_button_button_page_idx";
  DROP INDEX "_pages_v_blocks_two_column_button_button_document_idx";
  ALTER TABLE "pages_blocks_two_column" DROP COLUMN "button_label";
  ALTER TABLE "pages_blocks_two_column" DROP COLUMN "button_type";
  ALTER TABLE "pages_blocks_two_column" DROP COLUMN "button_page_id";
  ALTER TABLE "pages_blocks_two_column" DROP COLUMN "button_document_id";
  ALTER TABLE "pages_blocks_two_column" DROP COLUMN "button_built_in";
  ALTER TABLE "pages_blocks_two_column" DROP COLUMN "button_url";
  ALTER TABLE "_pages_v_blocks_two_column" DROP COLUMN "button_label";
  ALTER TABLE "_pages_v_blocks_two_column" DROP COLUMN "button_type";
  ALTER TABLE "_pages_v_blocks_two_column" DROP COLUMN "button_page_id";
  ALTER TABLE "_pages_v_blocks_two_column" DROP COLUMN "button_document_id";
  ALTER TABLE "_pages_v_blocks_two_column" DROP COLUMN "button_built_in";
  ALTER TABLE "_pages_v_blocks_two_column" DROP COLUMN "button_url";
  DROP TYPE "public"."enum_pages_blocks_two_column_button_type";
  DROP TYPE "public"."enum_pages_blocks_two_column_button_built_in";
  DROP TYPE "public"."enum__pages_v_blocks_two_column_button_type";
  DROP TYPE "public"."enum__pages_v_blocks_two_column_button_built_in";`)
}
