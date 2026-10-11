import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * The website's own database account, `golf_app`: read and write data, nothing more.
 * It can't create, change or drop tables, or create accounts. Database changes are applied by
 * the release process with the owner account (docs/plans/step-3-backups-migrations-production.md).
 *
 * On Neon, create the account with SQL (not the dashboard), so it is NOT a member of
 * neon_superuser:  CREATE ROLE golf_app WITH LOGIN PASSWORD '...';
 * Locally and in CI it's created here without a password (it can't log in).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'golf_app') THEN
      CREATE ROLE golf_app NOLOGIN;
    END IF;

    -- Refuse to continue if golf_app is a super-account. Neon makes dashboard-created roles
    -- members of neon_superuser, which can read and write everything and create accounts.
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'neon_superuser')
       AND pg_has_role('golf_app', 'neon_superuser', 'MEMBER') THEN
      RAISE EXCEPTION 'golf_app is a member of neon_superuser. Delete it and recreate it with SQL: CREATE ROLE golf_app WITH LOGIN PASSWORD ...';
    END IF;

    IF EXISTS (
      SELECT 1 FROM pg_roles
      WHERE rolname = 'golf_app' AND (rolsuper OR rolcreaterole OR rolcreatedb OR rolbypassrls)
    ) THEN
      RAISE EXCEPTION 'golf_app has admin powers (superuser, create role/database or bypass RLS); it must be a plain account';
    END IF;
  END
  $$;

  GRANT USAGE ON SCHEMA public TO golf_app;
  GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO golf_app;
  GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO golf_app;

  -- Tables and sequences made by future migrations (run as this same owner) get the same rights.
  ALTER DEFAULT PRIVILEGES FOR ROLE CURRENT_USER IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO golf_app;
  ALTER DEFAULT PRIVILEGES FOR ROLE CURRENT_USER IN SCHEMA public
    GRANT USAGE, SELECT ON SEQUENCES TO golf_app;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER DEFAULT PRIVILEGES FOR ROLE CURRENT_USER IN SCHEMA public
    REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLES FROM golf_app;
  ALTER DEFAULT PRIVILEGES FOR ROLE CURRENT_USER IN SCHEMA public
    REVOKE USAGE, SELECT ON SEQUENCES FROM golf_app;
  REVOKE SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public FROM golf_app;
  REVOKE USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public FROM golf_app;
  REVOKE USAGE ON SCHEMA public FROM golf_app;`)
}
