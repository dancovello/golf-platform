/**
 * Access rules on the Payload config exactly as it runs: after plugins and Payload itself have
 * added their own collections (job 2, 21 Oct grilling). tests/unit/access-guard.spec.ts checks
 * our own collections before Payload fills in defaults; this checks everything that's there
 * once it has.
 */
import { describe, expect, it } from 'vitest'

import { collections } from '@/collections'
import { globals } from '@/globals'
import config from '@/payload.config'

const OPERATIONS = ['create', 'read', 'update', 'delete'] as const
type Op = (typeof OPERATIONS)[number]

/** A club editor whose two-factor code has been entered: the most an editor can be. */
const editor = {
  id: '11111111-1111-4111-8111-111111111111',
  collection: 'users',
  role: 'editor',
  tenant: '22222222-2222-4222-8222-222222222222',
  hasTotp: true,
  _strategy: 'totp',
}

/**
 * Collections Payload or a plugin adds, which we don't write. Each says what a signed-in club
 * editor may do with it. A new one fails this test until it's reviewed and listed here.
 */
const PAYLOAD_OWN: Record<
  string,
  { editor: Record<Op, 'refused' | 'own records only'> | 'not reachable'; why: string }
> = {
  'payload-preferences': {
    editor: {
      create: 'own records only',
      read: 'own records only',
      update: 'own records only',
      delete: 'own records only',
    },
    why: 'Admin screen settings (column choices etc.), one set per account',
  },
  'payload-jobs': {
    editor: { create: 'refused', read: 'refused', update: 'refused', delete: 'refused' },
    why: 'The background job queue (nightly clean-up)',
  },
  'payload-kv': {
    editor: { create: 'refused', read: 'refused', update: 'refused', delete: 'refused' },
    why: 'Payload’s internal key-value store',
  },
  'totp-attempts': {
    editor: { create: 'refused', read: 'refused', update: 'refused', delete: 'refused' },
    why: 'payload-totp’s count of wrong codes',
  },
  'payload-migrations': {
    editor: 'not reachable',
    why: 'Which database migrations have run. Its access rules allow everything, so it must have no web address at all: server code only',
  },
}

const call = async (fn: unknown) =>
  (fn as (args: unknown) => unknown)({
    req: {
      user: editor,
      payload: { config: await config },
      headers: new Headers(),
      context: {},
    },
    data: {},
  })

describe('every collection in the running config has reviewed access rules', () => {
  it('each one is either ours (checked by access-guard) or a reviewed Payload one', async () => {
    const ours = new Set(collections.map((c) => c.slug))
    const unknown = (await config).collections
      .map((c) => c.slug)
      .filter((slug) => !ours.has(slug as never) && !(slug in PAYLOAD_OWN))
    expect(unknown, 'Review it and add it to PAYLOAD_OWN, with an isolation test').toEqual([])
  })

  it('no reviewed Payload collection has gone missing (the list stays accurate)', async () => {
    const slugs: string[] = (await config).collections.map((c) => c.slug)
    expect(Object.keys(PAYLOAD_OWN).filter((slug) => !slugs.includes(slug))).toEqual([])
  })

  it.each(Object.entries(PAYLOAD_OWN))(
    '%s does only what is listed for a club editor',
    async (slug, rule) => {
      const collection = (await config).collections.find((c) => c.slug === slug)!
      if (rule.editor === 'not reachable') {
        // No REST endpoints and no admin screen: nothing outside the server can touch it.
        expect(collection.endpoints).toBe(false)
        expect(collection.admin?.hidden).toBeTruthy()
        return
      }
      for (const op of OPERATIONS) {
        const result = await call(collection.access[op])
        if (rule.editor[op] === 'refused') {
          expect(result, `${slug}.${op}`).toBe(false)
        } else if (op === 'create') {
          // Payload sets the account on a new preference itself; there's no where clause.
          expect(result, `${slug}.${op}`).toBe(true)
        } else {
          expect(JSON.stringify(result), `${slug}.${op}`).toContain(editor.id)
        }
      }
    },
  )

  it('every settings screen (global) in the running config is one of ours', async () => {
    const ours = globals.map((g) => g.slug)
    expect((await config).globals.map((g) => g.slug).filter((s) => !ours.includes(s))).toEqual([])
  })

  it("a club editor's access to our own collections is never a plain yes", async () => {
    // Every rule either refuses, or limits the editor to their own club/account.
    const yes: string[] = []
    for (const c of (await config).collections) {
      if (!collections.some((o) => o.slug === c.slug)) continue
      // Version history too, where there is one (access audit, A2).
      const ops = c.versions ? [...OPERATIONS, 'readVersions' as const] : OPERATIONS
      for (const op of ops) if ((await call(c.access[op])) === true) yes.push(`${c.slug}.${op}`)
    }
    expect(yes).toEqual([])
  })

  it('pasting a photo from a web address is off everywhere', async () => {
    const on = (await config).collections.filter((c) => c.upload && c.upload.pasteURL)
    expect(on.map((c) => c.slug)).toEqual([])
  })
})
