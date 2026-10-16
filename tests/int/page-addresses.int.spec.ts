import { beforeAll, describe, expect, it } from 'vitest'

import { seedWorld, type World } from './helpers/seed'

let w: World

beforeAll(async () => {
  w = await seedWorld()
})

const publish = (data: Record<string, unknown>) =>
  w.payload.create({
    collection: 'pages',
    data: { _status: 'published', tenant: w.clubA.id, ...data } as never,
    overrideAccess: true,
  })

const messageOf = async (fn: () => Promise<unknown>) => {
  try {
    await fn()
  } catch (error) {
    return JSON.stringify((error as { data?: unknown }).data ?? (error as Error).message)
  }
  return null
}

describe('page addresses', () => {
  it('refuses spaces, capitals and other characters', async () => {
    for (const slug of ['Green Fees', 'green_fees', 'green--fees', '-green', 'green/fees']) {
      expect(await messageOf(() => publish({ title: 'Green fees', slug })), slug).toContain(
        'Lower-case letters, numbers and dashes only',
      )
    }
  })

  it("refuses the addresses of the site's own pages", async () => {
    for (const slug of ['news', 'events', 'contact', 'privacy']) {
      expect(await messageOf(() => publish({ title: 'Clash', slug })), slug).toContain(
        'already used by your site',
      )
    }
  })

  it('accepts a normal address, and "home"', async () => {
    expect((await publish({ title: 'Green fees', slug: 'green-fees-2026' })).slug).toBe(
      'green-fees-2026',
    )
    const home = await publish({ title: 'Welcome', slug: 'home', tenant: w.clubB.id })
    expect(home.slug).toBe('home')
  })

  it('makes the address from the title when published without one', async () => {
    const page = await publish({ title: 'Visitors & Green Fees' })
    expect(page.slug).toBe('visitors-green-fees')
  })

  it('leaves a draft without an address alone', async () => {
    const draft = await w.payload.create({
      collection: 'pages',
      draft: true,
      data: { _status: 'draft', title: 'Vis', tenant: w.clubA.id } as never,
      overrideAccess: true,
    })
    expect(draft.slug ?? null).toBeNull()
  })
})
