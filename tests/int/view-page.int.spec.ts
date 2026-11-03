import type { PayloadRequest } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import { viewPageURL } from '@/site/livePreview'

import { seedWorld, type World } from './helpers/seed'

let w: World
beforeAll(async () => {
  w = await seedWorld()
}, 120_000)

const req = () =>
  ({
    payload: w.payload,
    headers: new Headers({ host: 'localhost:3000' }),
  }) as unknown as PayloadRequest

const options = () => ({ locale: 'en', req: req(), token: null })

describe('the page screen’s "View page" button', () => {
  it('opens the club’s preview of the page, drafts included', async () => {
    const url = await viewPageURL(
      { tenant: w.clubA.id, slug: 'membership', _status: 'draft' },
      options(),
    )
    expect(url).toBe(`http://localhost:3000/preview/${w.clubA.slug}/membership?live=1`)
  })

  it('opens the club’s home page for the home page', async () => {
    const url = await viewPageURL(
      { tenant: w.clubA.id, slug: 'home', _status: 'published' },
      options(),
    )
    expect(url).toBe(`http://localhost:3000/preview/${w.clubA.slug}?live=1`)
  })

  it('has nothing to open before the page has an address', async () => {
    expect(await viewPageURL({ tenant: w.clubA.id }, options())).toBeNull()
  })
})
