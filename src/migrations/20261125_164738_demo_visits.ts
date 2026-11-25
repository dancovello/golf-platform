import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "demo_visits" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"club_id" varchar NOT NULL,
  	"visited_at" timestamp(3) with time zone NOT NULL,
  	"page" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE INDEX "demo_visits_club_id_idx" ON "demo_visits" USING btree ("club_id");
  CREATE INDEX "demo_visits_visited_at_idx" ON "demo_visits" USING btree ("visited_at");
  CREATE INDEX "demo_visits_updated_at_idx" ON "demo_visits" USING btree ("updated_at");
  CREATE INDEX "demo_visits_created_at_idx" ON "demo_visits" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "demo_visits" CASCADE;`)
}
