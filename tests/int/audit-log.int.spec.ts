/**
 * The audit log (src/audit, audit fix plan step 12, finding M6): who did what, and when.
 * Super-admin read-only, written only by trusted server code, kept 12 months.
 */
import { sql } from '@payloadcms/db-postgres'
import * as Sentry from '@sentry/nextjs'
import type { Payload, PayloadRequest } from 'payload'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { createPasswordLink, inviteEditor } from '@/accounts/passwordLinks'
import { auditWhenOk } from '@/auth/superAdminTwoFactor'
import { resetTwoFactor } from '@/auth/resetTwoFactor'
import { recordAudit } from '@/audit/record'
import { deleteOldAuditEntries } from '@/privacy/cleanUp'

import { createEditor, PASSWORD, seedWorld, type World } from './helpers/seed'

vi.mock('@sentry/nextjs', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@sentry/nextjs')>()),
  captureMessage: vi.fn(),
  flush: vi.fn(async () => true),
}))

let w: World
let p: Payload

beforeAll(async () => {
  w = await seedWorld()
  p = w.payload
})

beforeEach(async () => {
  await p.delete({ collection: 'audit-log', where: { id: { exists: true } } })
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
  vi.mocked(Sentry.captureMessage).mockClear()
})

const entries = async (action?: string) =>
  (
    await p.find({
      collection: 'audit-log',
      where: action ? { action: { equals: action } } : { id: { exists: true } },
      sort: 'createdAt',
      limit: 100,
      pagination: false,
      overrideAccess: true,
    })
  ).docs

describe('who can see and change the log', () => {
  it('club editors can’t read, create, change or delete entries; nobody changes or deletes one', async () => {
    await recordAudit(p, {
      action: 'club-created',
      actor: w.superAdmin,
      target: 'Seen by nobody else',
    })
    const [entry] = await entries()
    expect(entry).toBeDefined()

    const asEditor = { overrideAccess: false as const, user: w.editorA }
    await expect(p.find({ collection: 'audit-log', ...asEditor })).rejects.toThrow()
    await expect(
      p.findByID({ collection: 'audit-log', id: entry!.id, ...asEditor }),
    ).rejects.toThrow()
    await expect(
      p.create({ collection: 'audit-log', data: { action: 'sign-in' }, ...asEditor }),
    ).rejects.toThrow()
    await expect(
      p.update({ collection: 'audit-log', id: entry!.id, data: { target: 'x' }, ...asEditor }),
    ).rejects.toThrow()
    await expect(
      p.delete({ collection: 'audit-log', id: entry!.id, ...asEditor }),
    ).rejects.toThrow()

    // The super-admin reads it, but can't add to it, change it or delete from it either.
    const asSuper = { overrideAccess: false as const, user: w.superAdmin }
    const seen = await p.find({ collection: 'audit-log', ...asSuper })
    expect(seen.totalDocs).toBe(1)
    await expect(
      p.create({ collection: 'audit-log', data: { action: 'sign-in' }, ...asSuper }),
    ).rejects.toThrow()
    await expect(
      p.update({ collection: 'audit-log', id: entry!.id, data: { target: 'x' }, ...asSuper }),
    ).rejects.toThrow()
    await expect(p.delete({ collection: 'audit-log', id: entry!.id, ...asSuper })).rejects.toThrow()
    expect((await entries())[0]!.target).toBe('Seen by nobody else')
  })
})

describe('what gets recorded', () => {
  it('a password sign-in: who, which club, and only that', async () => {
    await p.login({
      collection: 'users',
      data: { email: 'editor-a@example.com', password: PASSWORD },
    })
    const [entry] = await entries('sign-in')
    expect(entry).toMatchObject({
      actorEmail: 'editor-a@example.com',
      actorRole: 'editor',
      clubId: w.clubA.id,
      target: 'editor-a@example.com',
    })
    expect(JSON.stringify(entry)).not.toContain(PASSWORD)
  })

  it('accounts created and removed, with who did it (a super-admin, or "system" for a script)', async () => {
    const made = await p.create({
      collection: 'users',
      data: {
        email: 'audit-new@example.com',
        password: PASSWORD,
        role: 'editor',
        tenant: w.clubA.id,
      },
      context: { allowAccountCreation: true },
      overrideAccess: true,
      user: w.superAdmin,
    })
    await p.delete({ collection: 'users', id: made.id, overrideAccess: true, user: w.superAdmin })
    const script = await createEditor(p, 'audit-script@example.com', w.clubB.id)
    const [created, removed, scripted] = [
      (await entries('account-created')).find((e) => e.target === 'audit-new@example.com'),
      (await entries('account-removed')).find((e) => e.target === 'audit-new@example.com'),
      (await entries('account-created')).find((e) => e.target === 'audit-script@example.com'),
    ]
    expect(created).toMatchObject({
      actorRole: 'super-admin',
      clubId: w.clubA.id,
      detail: 'editor',
    })
    expect(removed).toMatchObject({ actorRole: 'super-admin', clubId: w.clubA.id })
    expect(scripted).toMatchObject({ actorRole: 'system', clubId: w.clubB.id })
    expect(script.id).toBeTruthy()
  })

  it('a changed email and a changed password', async () => {
    const editor = await createEditor(p, 'audit-change@example.com', w.clubA.id)
    await p.update({
      collection: 'users',
      id: editor.id,
      data: { email: 'audit-changed@example.com' },
      overrideAccess: true,
      user: w.superAdmin,
    })
    await p.update({
      collection: 'users',
      id: editor.id,
      data: { password: 'a-new-long-password-1' },
      overrideAccess: true,
      user: editor,
    })
    expect(await entries('account-email-changed')).toMatchObject([
      {
        target: 'audit-changed@example.com',
        detail: 'was audit-change@example.com',
        actorRole: 'super-admin',
      },
    ])
    const [changed] = await entries('password-changed')
    // The editor changed their own password: the actor is the account, the target is its address now.
    expect(changed).toMatchObject({ actorRole: 'editor', target: 'audit-changed@example.com' })
    expect(JSON.stringify(await entries())).not.toContain('a-new-long-password')
  })

  it('a password set from an emailed link', async () => {
    const editor = await createEditor(p, 'audit-reset@example.com', w.clubA.id)
    const token = await p.forgotPassword({
      collection: 'users',
      data: { email: 'audit-reset@example.com' },
      disableEmail: true,
      context: { passwordLinkByAdmin: true },
    })
    await p.resetPassword({
      collection: 'users',
      data: { token, password: 'another-long-password-2' },
      overrideAccess: true,
    })
    expect(await entries('password-reset')).toMatchObject([
      { target: 'audit-reset@example.com', clubId: w.clubA.id },
    ])
    expect(editor.id).toBeTruthy()
  })

  it('links and invitations made by a super-admin, and a two-factor reset', async () => {
    const editor = await createEditor(p, 'audit-link@example.com', w.clubA.id)
    const req = { user: w.superAdmin } as unknown as PayloadRequest
    await createPasswordLink(p, { userID: editor.id, serverURL: 'http://localhost', req })
    await inviteEditor(p, {
      email: 'audit-invited@example.com',
      tenant: w.clubB.id,
      serverURL: 'http://localhost',
      req,
    })
    await resetTwoFactor(p, editor.id, w.superAdmin)
    expect(await entries('password-link-issued')).toMatchObject([
      { target: 'audit-link@example.com', actorRole: 'super-admin', clubName: w.clubA.name },
    ])
    expect(await entries('editor-invited')).toMatchObject([
      { target: 'audit-invited@example.com', clubId: w.clubB.id },
    ])
    expect(await entries('two-factor-reset')).toMatchObject([
      { target: 'audit-link@example.com', actorRole: 'super-admin' },
    ])
  })

  it('clubs created, changed (what changed) and deleted', async () => {
    const club = await p.create({
      collection: 'tenants',
      data: { name: 'Audit Test Club' },
      overrideAccess: true,
      user: w.superAdmin,
    })
    await p.update({
      collection: 'tenants',
      id: club.id,
      data: { domains: [{ hostname: 'audit-test-club.example.com' }] },
      overrideAccess: true,
      user: w.superAdmin,
    })
    // Nothing recorded when nothing the log cares about changes.
    await p.update({
      collection: 'tenants',
      id: club.id,
      data: {},
      overrideAccess: true,
      user: w.superAdmin,
    })
    await p.update({
      collection: 'tenants',
      id: club.id,
      data: { domains: [] },
      overrideAccess: true,
      user: w.superAdmin,
    })
    await p.delete({ collection: 'tenants', id: club.id, overrideAccess: true, user: w.superAdmin })

    expect(await entries('club-created')).toMatchObject([
      { target: 'Audit Test Club', clubId: club.id },
    ])
    const changed = await entries('club-changed')
    expect(changed.map((c) => c.detail)).toEqual([
      'web addresses: none → audit-test-club.example.com',
      'web addresses: audit-test-club.example.com → none',
    ])
    expect(await entries('club-deleted')).toMatchObject([
      { target: 'Audit Test Club', clubId: club.id, actorRole: 'super-admin' },
    ])
  })
})

describe('two-factor endpoints', () => {
  const ok = (status: number) =>
    auditWhenOk(
      { path: '/x', method: 'post', handler: async () => new Response('{}', { status }) },
      'two-factor-code-accepted',
    )
  const req = () => ({ payload: p, user: w.superAdmin }) as unknown as PayloadRequest

  it('records the code being accepted, and nothing for a refused one', async () => {
    expect((await ok(400).handler(req())).status).toBe(400)
    expect(await entries('two-factor-code-accepted')).toHaveLength(0)
    expect((await ok(200).handler(req())).status).toBe(200)
    expect(await entries('two-factor-code-accepted')).toMatchObject([{ actorRole: 'super-admin' }])
  })
})

describe('the emergency account', () => {
  it('signing in as it sends a fatal alert to Sentry, and ordinary accounts do not', async () => {
    vi.stubEnv('SENTRY_DSN', 'https://key@o1.ingest.de.sentry.io/1')
    vi.stubEnv('EMERGENCY_ADMIN_EMAIL', 'Editor-B@example.com')
    await p.login({
      collection: 'users',
      data: { email: 'editor-a@example.com', password: PASSWORD },
    })
    expect(Sentry.captureMessage).not.toHaveBeenCalled()
    await p.login({
      collection: 'users',
      data: { email: 'editor-b@example.com', password: PASSWORD },
    })
    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      'Emergency super-admin account signed in',
      'fatal',
    )
  })

  it('does nothing while no emergency account is set', async () => {
    vi.stubEnv('SENTRY_DSN', 'https://key@o1.ingest.de.sentry.io/1')
    await p.login({
      collection: 'users',
      data: { email: 'editor-b@example.com', password: PASSWORD },
    })
    expect(Sentry.captureMessage).not.toHaveBeenCalled()
  })
})

describe('the log itself', () => {
  it('keeps each entry to one short line of plain text', async () => {
    await recordAudit(p, {
      action: 'content-deleted',
      actor: w.editorA,
      target: `Line one\nline two${String.fromCharCode(0x2028)}${'x'.repeat(400)}`,
      detail: '   ',
    })
    const [entry] = await entries()
    expect(entry!.target).not.toMatch(/[\n\u2028]/)
    expect(entry!.target!.length).toBeLessThanOrEqual(200)
    expect(entry!.detail ?? null).toBeNull()
  })

  it('can never stop the action it describes: a failure is logged and the call still returns', async () => {
    vi.spyOn(p, 'create').mockRejectedValueOnce(new Error('database is down'))
    const logged = vi.spyOn(p.logger, 'error').mockImplementation(() => undefined as never)
    await expect(recordAudit(p, { action: 'sign-in', actor: w.editorA })).resolves.toBeUndefined()
    expect(logged).toHaveBeenCalled()
    expect(await entries()).toHaveLength(0)
  })

  it('is deleted 12 months after it was made, and not before', async () => {
    const NOW = new Date('2026-11-10T12:00:00Z')
    await recordAudit(p, { action: 'sign-in', actor: w.editorA, target: 'old' })
    await recordAudit(p, { action: 'sign-in', actor: w.editorA, target: 'recent' })
    const [old, recent] = await entries()
    await p.db.drizzle.execute(
      sql`UPDATE audit_log SET created_at = '2025-11-09T12:00:00Z' WHERE id = ${old!.id}`,
    )
    await p.db.drizzle.execute(
      sql`UPDATE audit_log SET created_at = '2025-11-11T12:00:00Z' WHERE id = ${recent!.id}`,
    )
    expect(await deleteOldAuditEntries(p, NOW)).toBe(1)
    expect((await entries()).map((e) => e.target)).toEqual(['recent'])
  })
})
