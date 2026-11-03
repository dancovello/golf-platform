import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_mk_live_demo_demo" ADD VALUE 'blockSwitcher';
  ALTER TYPE "public"."enum__mk_live_demo_v_demo" ADD VALUE 'blockSwitcher';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "mk_live_demo" ALTER COLUMN "demo" SET DATA TYPE text;
  ALTER TABLE "mk_live_demo" ALTER COLUMN "demo" SET DEFAULT 'tokenDial'::text;
  DROP TYPE "public"."enum_mk_live_demo_demo";
  CREATE TYPE "public"."enum_mk_live_demo_demo" AS ENUM('tokenDial', 'courseGuide', 'courseStatus');
  ALTER TABLE "mk_live_demo" ALTER COLUMN "demo" SET DEFAULT 'tokenDial'::"public"."enum_mk_live_demo_demo";
  ALTER TABLE "mk_live_demo" ALTER COLUMN "demo" SET DATA TYPE "public"."enum_mk_live_demo_demo" USING "demo"::"public"."enum_mk_live_demo_demo";
  ALTER TABLE "_mk_live_demo_v" ALTER COLUMN "demo" SET DATA TYPE text;
  ALTER TABLE "_mk_live_demo_v" ALTER COLUMN "demo" SET DEFAULT 'tokenDial'::text;
  DROP TYPE "public"."enum__mk_live_demo_v_demo";
  CREATE TYPE "public"."enum__mk_live_demo_v_demo" AS ENUM('tokenDial', 'courseGuide', 'courseStatus');
  ALTER TABLE "_mk_live_demo_v" ALTER COLUMN "demo" SET DEFAULT 'tokenDial'::"public"."enum__mk_live_demo_v_demo";
  ALTER TABLE "_mk_live_demo_v" ALTER COLUMN "demo" SET DATA TYPE "public"."enum__mk_live_demo_v_demo" USING "demo"::"public"."enum__mk_live_demo_v_demo";`)
}
