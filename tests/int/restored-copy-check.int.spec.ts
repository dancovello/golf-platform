/**
 * The read-only check for restored copies (scripts/check-restored-copy.ts). It must pass on
 * healthy data, fail when a record has no club, and never be able to write.
 */
import { sql } from '@payloadcms/db-postgres'
import type { Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import { clubOwnedCollections } from '@/tenancy'

import {
  type Db,
  formatReport,
  runChecks,
  runReadOnly,
  tableOf,
} from '../../scripts/lib/restoredCopyCheck'
import { seedWorld } from './helpers/seed'

type RunnableDb = Parameters<typeof runReadOnly>[0]

let payload: Payload
let db: RunnableDb

beforeAll(async () => {
  await seedWorld()
  const { getTestPayload } = await import('./helpers/seed')
  payload = await getTestPayload()
  db = payload.db.drizzle as unknown as RunnableDb
})

class Rollback extends Error {}

describe('check-restored-copy', () => {
  it('passes on healthy data, and reports every club-owned table', async () => {
    const report = await runReadOnly(db, runChecks)
    expect(report.checks.filter((c) => !c.ok)).toEqual([])
    expect(report.ok).toBe(true)
    for (const slug of Object.keys(clubOwnedCollections)) {
      expect(report.checks.some((c) => c.name.startsWith(`${tableOf(slug)}:`))).toBe(true)
    }
    expect(report.clubs.map((c) => c.club)).toEqual(
      expect.arrayContaining(['Test Club A', 'Test Club B']),
    )
    expect(formatReport(report)).toContain('checks passed')
  })

  it('fails when a record has no club', async () => {
    let failed: string[] = []
    await db
      .transaction(async (tx: Db) => {
        // Breaks the rules inside a transaction that is rolled back afterwards.
        await tx.execute(sql`ALTER TABLE pages ALTER COLUMN tenant_id DROP NOT NULL`)
        await tx.execute(
          sql`ALTER TABLE pages DROP CONSTRAINT IF EXISTS pages_tenant_id_tenants_id_fk`,
        )
        await tx.execute(sql`INSERT INTO pages (title, slug) VALUES ('stray', 'stray-no-club')`)
        const report = await runChecks(tx)
        failed = report.checks.filter((c) => !c.ok).map((c) => c.name)
        throw new Rollback()
      })
      .catch((error) => {
        if (!(error instanceof Rollback)) throw error
      })
    expect(failed).toEqual(
      expect.arrayContaining([
        'pages: club column present and required',
        'pages: every record belongs to a real club',
      ]),
    )
    // Rolled back: the real table is untouched.
    const report = await runReadOnly(db, runChecks)
    expect(report.ok).toBe(true)
  })

  it('fails when an editor has no club', async () => {
    let failed: string[] = []
    await db
      .transaction(async (tx: Db) => {
        await tx.execute(sql`ALTER TABLE users DROP CONSTRAINT users_role_tenant_check`)
        await tx.execute(sql`ALTER TABLE users DISABLE TRIGGER USER`)
        await tx.execute(sql`UPDATE users SET tenant_id = NULL WHERE role = 'editor'`)
        const report = await runChecks(tx)
        failed = report.checks.filter((c) => !c.ok).map((c) => c.name)
        throw new Rollback()
      })
      .catch((error) => {
        if (!(error instanceof Rollback)) throw error
      })
    expect(failed).toEqual(
      expect.arrayContaining([
        'accounts: every editor belongs to a real club',
        'database rule: an account is an editor with a club, or a super-admin without one',
      ]),
    )
  })

  it('cannot write: every change inside the read-only run is refused', async () => {
    const countPages = (tx: Db) =>
      tx.execute(sql`SELECT count(*) AS n FROM pages`).then((r) => Number(r.rows[0]?.n))
    // Drizzle wraps the database's message; the real reason is in `cause`.
    const refusal = async (fn: (tx: Db) => Promise<unknown>) => {
      try {
        await runReadOnly(db, fn)
      } catch (error) {
        return String((error as { cause?: unknown }).cause ?? error)
      }
      return 'was allowed'
    }
    const before = await runReadOnly(db, countPages)
    expect(await refusal((tx) => tx.execute(sql`DELETE FROM pages`))).toMatch(/read-only/i)
    expect(await refusal((tx) => tx.execute(sql`UPDATE tenants SET name = 'changed'`))).toMatch(
      /read-only/i,
    )
    expect(await runReadOnly(db, countPages)).toBe(before)
  })
})
