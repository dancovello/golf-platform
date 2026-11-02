import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "marketing_settings" ADD COLUMN "branding_logo_id" uuid;
  ALTER TABLE "marketing_settings" ADD COLUMN "branding_icon_id" uuid;
  ALTER TABLE "marketing_settings" ADD COLUMN "site_footer_tagline" varchar DEFAULT 'Golf club websites your team can update in minutes. Tee-time booking coming next.';
  ALTER TABLE "marketing_settings" ADD COLUMN "site_description" varchar;
  ALTER TABLE "marketing_settings" ADD COLUMN "site_share_image_id" uuid;
  ALTER TABLE "marketing_settings" ADD COLUMN "contact_phone" varchar;
  ALTER TABLE "marketing_settings" ADD COLUMN "contact_registered_name" varchar;
  ALTER TABLE "marketing_settings" ADD COLUMN "contact_company_number" varchar;
  ALTER TABLE "marketing_settings" ADD COLUMN "contact_vat_number" varchar;
  ALTER TABLE "marketing_settings" ADD COLUMN "contact_registered_address" varchar;
  ALTER TABLE "marketing_settings" ADD COLUMN "social_linkedin" varchar;
  ALTER TABLE "marketing_settings" ADD COLUMN "social_instagram" varchar;
  ALTER TABLE "marketing_settings" ADD COLUMN "social_x" varchar;
  ALTER TABLE "marketing_settings" ADD COLUMN "social_youtube" varchar;
  ALTER TABLE "marketing_settings" ADD COLUMN "social_facebook" varchar;
  ALTER TABLE "marketing_settings" ADD CONSTRAINT "marketing_settings_branding_logo_id_marketing_media_id_fk" FOREIGN KEY ("branding_logo_id") REFERENCES "public"."marketing_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "marketing_settings" ADD CONSTRAINT "marketing_settings_branding_icon_id_marketing_media_id_fk" FOREIGN KEY ("branding_icon_id") REFERENCES "public"."marketing_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "marketing_settings" ADD CONSTRAINT "marketing_settings_site_share_image_id_marketing_media_id_fk" FOREIGN KEY ("site_share_image_id") REFERENCES "public"."marketing_media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "marketing_settings_branding_branding_logo_idx" ON "marketing_settings" USING btree ("branding_logo_id");
  CREATE INDEX "marketing_settings_branding_branding_icon_idx" ON "marketing_settings" USING btree ("branding_icon_id");
  CREATE INDEX "marketing_settings_site_site_share_image_idx" ON "marketing_settings" USING btree ("site_share_image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "marketing_settings" DROP CONSTRAINT "marketing_settings_branding_logo_id_marketing_media_id_fk";
  
  ALTER TABLE "marketing_settings" DROP CONSTRAINT "marketing_settings_branding_icon_id_marketing_media_id_fk";
  
  ALTER TABLE "marketing_settings" DROP CONSTRAINT "marketing_settings_site_share_image_id_marketing_media_id_fk";
  
  DROP INDEX "marketing_settings_branding_branding_logo_idx";
  DROP INDEX "marketing_settings_branding_branding_icon_idx";
  DROP INDEX "marketing_settings_site_site_share_image_idx";
  ALTER TABLE "marketing_settings" DROP COLUMN "branding_logo_id";
  ALTER TABLE "marketing_settings" DROP COLUMN "branding_icon_id";
  ALTER TABLE "marketing_settings" DROP COLUMN "site_footer_tagline";
  ALTER TABLE "marketing_settings" DROP COLUMN "site_description";
  ALTER TABLE "marketing_settings" DROP COLUMN "site_share_image_id";
  ALTER TABLE "marketing_settings" DROP COLUMN "contact_phone";
  ALTER TABLE "marketing_settings" DROP COLUMN "contact_registered_name";
  ALTER TABLE "marketing_settings" DROP COLUMN "contact_company_number";
  ALTER TABLE "marketing_settings" DROP COLUMN "contact_vat_number";
  ALTER TABLE "marketing_settings" DROP COLUMN "contact_registered_address";
  ALTER TABLE "marketing_settings" DROP COLUMN "social_linkedin";
  ALTER TABLE "marketing_settings" DROP COLUMN "social_instagram";
  ALTER TABLE "marketing_settings" DROP COLUMN "social_x";
  ALTER TABLE "marketing_settings" DROP COLUMN "social_youtube";
  ALTER TABLE "marketing_settings" DROP COLUMN "social_facebook";`)
}
