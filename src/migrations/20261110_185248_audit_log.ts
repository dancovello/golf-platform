import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_audit_log_action" AS ENUM('sign-in', 'two-factor-code-accepted', 'two-factor-set-up', 'two-factor-removed', 'two-factor-reset', 'account-created', 'account-removed', 'account-email-changed', 'password-changed', 'password-reset', 'password-link-issued', 'editor-invited', 'club-created', 'club-changed', 'club-deleted', 'demo-club-built', 'marketing-starter-added', 'content-deleted');
  CREATE TABLE "audit_log" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"action" "enum_audit_log_action" NOT NULL,
  	"actor_role" varchar,
  	"actor_email" varchar,
  	"actor_id" varchar,
  	"club_name" varchar,
  	"club_id" varchar,
  	"target" varchar,
  	"detail" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE INDEX "audit_log_action_idx" ON "audit_log" USING btree ("action");
  CREATE INDEX "audit_log_actor_role_idx" ON "audit_log" USING btree ("actor_role");
  CREATE INDEX "audit_log_club_id_idx" ON "audit_log" USING btree ("club_id");
  CREATE INDEX "audit_log_updated_at_idx" ON "audit_log" USING btree ("updated_at");
  CREATE INDEX "audit_log_created_at_idx" ON "audit_log" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "audit_log" CASCADE;
  DROP TYPE "public"."enum_audit_log_action";`)
}
