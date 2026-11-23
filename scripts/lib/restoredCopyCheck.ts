/**
 * The read-only check for a restored copy of the database (docs/operations/restore-runbook.md,
 * section 4). It only reads: the caller runs it inside a read-only transaction
 * (`runReadOnly`), so it cannot change, delete or wipe anything, on any database.
 *
 * What it proves: the restored data is sound, meaning every club-owned record belongs to a
 * club that exists, every editor belongs to exactly one club, and the database's own security
 * rules are still there. What it does not prove: that the app's access rules stop one club
 * reading another's data. The tenant-isolation suite does that in CI, on its own test clubs.
 */
import { sql } from '@payloadcms/db-postgres'

import { clubOwnedCollections } from '../../src/tenancy'

type Row = Record<string, unknown>
export type Db = {
  execute: (query: ReturnType<typeof sql>) => Promise<{ rows: Row[] }>
}
type RunnableDb = Db & { transaction: <T>(fn: (tx: Db) => Promise<T>) => Promise<T> }

export type CheckResult = { name: string; ok: boolean; detail: string }
export type ClubSummary = { club: string; domain: string; counts: Record<string, number> }
export type CheckReport = { checks: CheckResult[]; clubs: ClubSummary[]; ok: boolean }

/** A collection's table name: "club-settings" is the table club_settings. */
export const tableOf = (slug: string) => slug.replace(/-/g, '_')

const clubTables = Object.keys(clubOwnedCollections).map(tableOf)
const globalTables = Object.entries(clubOwnedCollections)
  .filter(([, options]) => (options as { isGlobal?: boolean }).isGlobal)
  .map(([slug]) => tableOf(slug))

const count = (row: Row | undefined) => Number(row?.n ?? 0)
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

/** Runs `fn` inside a transaction that refuses every write. */
export const runReadOnly = <T>(db: RunnableDb, fn: (tx: Db) => Promise<T>): Promise<T> =>
  db.transaction(async (tx) => {
    await tx.execute(sql`SET TRANSACTION READ ONLY`)
    return fn(tx)
  })

export const runChecks = async (db: Db): Promise<CheckReport> => {
  const checks: CheckResult[] = []
  const add = (name: string, ok: boolean, detail: string) => checks.push({ name, ok, detail })

  // 1. Every club-owned table has a club column that cannot be empty.
  const columns = await db.execute(sql`
    SELECT table_name, is_nullable FROM information_schema.columns
    WHERE table_schema = 'public' AND column_name = 'tenant_id'`)
  const nullable = new Map(columns.rows.map((r) => [String(r.table_name), r.is_nullable === 'YES']))
  for (const table of clubTables) {
    const has = nullable.has(table)
    add(
      `${table}: club column present and required`,
      has && nullable.get(table) === false,
      !has ? 'no club column at all' : nullable.get(table) ? 'club column can be empty' : 'yes',
    )
  }

  // 2. Every club-owned table is linked to the clubs table by a database foreign key.
  const links = await db.execute(sql`
    SELECT c.conrelid::regclass::text AS table_name
    FROM pg_constraint c
    WHERE c.contype = 'f' AND c.confrelid = 'public.tenants'::regclass`)
  const linked = new Set(links.rows.map((r) => String(r.table_name).replace(/"/g, '')))
  for (const table of clubTables) {
    add(
      `${table}: linked to the clubs table`,
      linked.has(table),
      linked.has(table) ? 'yes' : 'no database link to the clubs table',
    )
  }

  // 3. No record without a club, or belonging to a club that no longer exists.
  for (const table of clubTables) {
    if (nullable.get(table) === undefined) continue
    const result = await db.execute(sql`
      SELECT count(*) AS n FROM ${sql.identifier(table)} t
      LEFT JOIN tenants c ON c.id = t.tenant_id WHERE c.id IS NULL`)
    const orphans = count(result.rows[0])
    add(
      `${table}: every record belongs to a real club`,
      orphans === 0,
      orphans === 0 ? 'yes' : `${plural(orphans, 'record')} with no club or a missing club`,
    )
  }

  // 4. Accounts: editors have exactly one club, super-admins none, and the rules exist.
  const editors = await db.execute(sql`
    SELECT count(*) AS n FROM users u LEFT JOIN tenants c ON c.id = u.tenant_id
    WHERE u.role = 'editor' AND c.id IS NULL`)
  add(
    'accounts: every editor belongs to a real club',
    count(editors.rows[0]) === 0,
    count(editors.rows[0]) === 0
      ? 'yes'
      : `${plural(count(editors.rows[0]), 'editor')} without a club`,
  )
  const admins = await db.execute(sql`
    SELECT count(*) AS n FROM users WHERE role = 'super-admin' AND tenant_id IS NOT NULL`)
  add(
    'accounts: no super-admin is tied to a club',
    count(admins.rows[0]) === 0,
    count(admins.rows[0]) === 0
      ? 'yes'
      : `${plural(count(admins.rows[0]), 'super-admin')} tied to a club`,
  )
  const roles = await db.execute(sql`
    SELECT count(*) AS n FROM users WHERE role NOT IN ('editor', 'super-admin')`)
  add(
    'accounts: only the two account types exist',
    count(roles.rows[0]) === 0,
    count(roles.rows[0]) === 0
      ? 'yes'
      : `${plural(count(roles.rows[0]), 'account')} of another type`,
  )
  const rules = await db.execute(sql`
    SELECT
      (SELECT count(*) FROM pg_constraint WHERE conname = 'users_role_tenant_check') AS rule,
      (SELECT count(*) FROM pg_trigger WHERE tgname LIKE 'users_role_tenant_immutable%'
         AND NOT tgisinternal) AS lock`)
  add(
    'database rule: an account is an editor with a club, or a super-admin without one',
    count({ n: rules.rows[0]?.rule }) === 1,
    count({ n: rules.rows[0]?.rule }) === 1 ? 'present' : 'MISSING',
  )
  add(
    "database rule: an account's type and club can never change",
    count({ n: rules.rows[0]?.lock }) >= 1,
    count({ n: rules.rows[0]?.lock }) >= 1 ? 'present' : 'MISSING',
  )

  // 5. Club-wide records (club settings, course status): one per club at most.
  for (const table of globalTables) {
    const result = await db.execute(sql`
      SELECT count(*) AS n FROM (
        SELECT tenant_id FROM ${sql.identifier(table)} GROUP BY tenant_id HAVING count(*) > 1
      ) dup`)
    add(
      `${table}: at most one record per club`,
      count(result.rows[0]) === 0,
      count(result.rows[0]) === 0
        ? 'yes'
        : `${plural(count(result.rows[0]), 'club')} with more than one`,
    )
  }

  // What is in the copy, club by club, to check the restore point looks right.
  const tenants = await db.execute(sql`
    SELECT t.id, t.name,
      (SELECT d.hostname FROM tenants_domains d WHERE d._parent_id = t.id
         ORDER BY d._order LIMIT 1) AS domain
    FROM tenants t ORDER BY t.created_at`)
  const clubs: ClubSummary[] = tenants.rows.map((t) => ({
    club: String(t.name),
    domain: t.domain ? String(t.domain) : 'no web address',
    counts: {},
  }))
  const idToIndex = new Map(tenants.rows.map((t, i) => [String(t.id), i]))
  for (const table of clubTables) {
    if (nullable.get(table) === undefined) continue
    const perClub = await db.execute(sql`
      SELECT tenant_id, count(*) AS n FROM ${sql.identifier(table)} GROUP BY tenant_id`)
    for (const club of clubs) club.counts[table] = 0
    for (const row of perClub.rows) {
      const index = idToIndex.get(String(row.tenant_id))
      if (index !== undefined) clubs[index]!.counts[table] = Number(row.n)
    }
  }

  return { checks, clubs, ok: checks.every((c) => c.ok) }
}

export const formatReport = (report: CheckReport): string => {
  const lines: string[] = ['What is in this copy, club by club:', '']
  for (const club of report.clubs) {
    const parts = Object.entries(club.counts)
      .filter(([, n]) => n > 0)
      .map(([table, n]) => `${n} ${table.replace(/_/g, ' ')}`)
    lines.push(`  ${club.club} (${club.domain}): ${parts.join(', ') || 'no records'}`)
  }
  lines.push('', 'Checks:', '')
  for (const check of report.checks) {
    lines.push(
      `  ${check.ok ? 'PASS' : 'FAIL'}  ${check.name}${check.ok ? '' : `: ${check.detail}`}`,
    )
  }
  const failed = report.checks.filter((c) => !c.ok).length
  lines.push(
    '',
    failed === 0
      ? `All ${report.checks.length} checks passed.`
      : `${failed} of ${report.checks.length} checks FAILED. Do not use this copy.`,
  )
  return lines.join('\n')
}
