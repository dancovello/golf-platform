import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_membership_tiers_availability_status" AS ENUM('none', 'open', 'waiting', 'full');
  CREATE TYPE "public"."enum_pages_blocks_scorecard_allowance" AS ENUM('100', '95', '85');
  CREATE TYPE "public"."enum__pages_v_blocks_membership_tiers_availability_status" AS ENUM('none', 'open', 'waiting', 'full');
  CREATE TYPE "public"."enum__pages_v_blocks_scorecard_allowance" AS ENUM('100', '95', '85');
  ALTER TABLE "pages_blocks_membership_tiers" ADD COLUMN "joining_fee" varchar;
  ALTER TABLE "pages_blocks_membership_tiers" ADD COLUMN "payment_note" varchar;
  ALTER TABLE "pages_blocks_membership_tiers" ADD COLUMN "availability_status" "enum_pages_blocks_membership_tiers_availability_status" DEFAULT 'none';
  ALTER TABLE "pages_blocks_scorecard" ADD COLUMN "handicap_table" boolean DEFAULT false;
  ALTER TABLE "pages_blocks_scorecard" ADD COLUMN "allowance" "enum_pages_blocks_scorecard_allowance" DEFAULT '100';
  ALTER TABLE "_pages_v_blocks_membership_tiers" ADD COLUMN "joining_fee" varchar;
  ALTER TABLE "_pages_v_blocks_membership_tiers" ADD COLUMN "payment_note" varchar;
  ALTER TABLE "_pages_v_blocks_membership_tiers" ADD COLUMN "availability_status" "enum__pages_v_blocks_membership_tiers_availability_status" DEFAULT 'none';
  ALTER TABLE "_pages_v_blocks_scorecard" ADD COLUMN "handicap_table" boolean DEFAULT false;
  ALTER TABLE "_pages_v_blocks_scorecard" ADD COLUMN "allowance" "enum__pages_v_blocks_scorecard_allowance" DEFAULT '100';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_membership_tiers" DROP COLUMN "joining_fee";
  ALTER TABLE "pages_blocks_membership_tiers" DROP COLUMN "payment_note";
  ALTER TABLE "pages_blocks_membership_tiers" DROP COLUMN "availability_status";
  ALTER TABLE "pages_blocks_scorecard" DROP COLUMN "handicap_table";
  ALTER TABLE "pages_blocks_scorecard" DROP COLUMN "allowance";
  ALTER TABLE "_pages_v_blocks_membership_tiers" DROP COLUMN "joining_fee";
  ALTER TABLE "_pages_v_blocks_membership_tiers" DROP COLUMN "payment_note";
  ALTER TABLE "_pages_v_blocks_membership_tiers" DROP COLUMN "availability_status";
  ALTER TABLE "_pages_v_blocks_scorecard" DROP COLUMN "handicap_table";
  ALTER TABLE "_pages_v_blocks_scorecard" DROP COLUMN "allowance";
  DROP TYPE "public"."enum_pages_blocks_membership_tiers_availability_status";
  DROP TYPE "public"."enum_pages_blocks_scorecard_allowance";
  DROP TYPE "public"."enum__pages_v_blocks_membership_tiers_availability_status";
  DROP TYPE "public"."enum__pages_v_blocks_scorecard_allowance";`)
}
