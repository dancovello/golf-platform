import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Two limits on the website's own database account, golf_app (migrations audit, findings 4 and
 * 5, 23 Oct 2026). No tables or columns change.
 *
 * 1. golf_app may read the list of applied database changes but not change it, so a taken-over
 *    website can't mark a future security fix as "already applied".
 * 2. Only the account that owns the accounts table (the owner account the release and Dan's
 *    scripts use) may create a super-admin. The website can still create editors (invites).
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  REVOKE INSERT, UPDATE, DELETE ON "payload_migrations" FROM golf_app;

  CREATE FUNCTION "users_super_admin_owner_only"() RETURNS trigger AS $$
  BEGIN
    IF NEW."role" = 'super-admin' AND current_user <> (
      SELECT tableowner FROM pg_tables WHERE schemaname = TG_TABLE_SCHEMA AND tablename = TG_TABLE_NAME
    ) THEN
      RAISE EXCEPTION 'Only the database owner account can create a super-admin';
    END IF;
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;
  CREATE TRIGGER "users_super_admin_owner_only" BEFORE INSERT ON "users"
    FOR EACH ROW EXECUTE FUNCTION "users_super_admin_owner_only"();`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DROP TRIGGER IF EXISTS "users_super_admin_owner_only" ON "users";
  DROP FUNCTION IF EXISTS "users_super_admin_owner_only"();
  GRANT INSERT, UPDATE, DELETE ON "payload_migrations" TO golf_app;`)
}
