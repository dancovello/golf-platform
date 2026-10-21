/**
 * The company website's content (plan phase 1.2): super-admin only, invisible to club editors,
 * and only published pages ever reach visitors.
 */
import type { Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import { publishedMarketingPage } from '@/marketing/content'
import { rt } from '@/demo/richText'

import { pngFile } from '../shared/media'
import { seedWorld, type World } from './helpers/seed'

let w: World
let p: Payload

const page = (slug: string, status: 'published' | 'draft', extra: Record<string, unknown> = {}) =>
  p.create({
    collection: 'marketing-pages',
    draft: status === 'draft',
    data: {
      _status: status,
      title: `Page ${slug}`,
      slug,
      layout: [{ blockType: 'mkSectionHeader', title: `Headline for ${slug}` }],
      ...extra,
    } as never,
  })

beforeAll(async () => {
  w = await seedWorld()
  p = w.payload
})

/** True when the call is refused (Payload throws Forbidden for denied access). */
const refused = async (fn: () => Promise<unknown>) => {
  try {
    await fn()
    return false
  } catch (error) {
    return (error as { status?: number }).status === 403
  }
}

describe('club editors can’t reach the company website’s content', () => {
  it('pages: no read, create, update or delete', async () => {
    const doc = await page('editor-check', 'published')
    const asEditor = { overrideAccess: false as const, user: w.editorA }
    expect(await refused(() => p.find({ collection: 'marketing-pages', ...asEditor }))).toBe(true)
    expect(
      await refused(() => p.findByID({ collection: 'marketing-pages', id: doc.id, ...asEditor })),
    ).toBe(true)
    expect(
      await refused(() =>
        p.create({
          collection: 'marketing-pages',
          data: { title: 'Sneaky', slug: 'sneaky', _status: 'published' } as never,
          ...asEditor,
        }),
      ),
    ).toBe(true)
    expect(
      await refused(() =>
        p.update({
          collection: 'marketing-pages',
          id: doc.id,
          data: { title: 'Changed' },
          ...asEditor,
        }),
      ),
    ).toBe(true)
    expect(
      await refused(() => p.delete({ collection: 'marketing-pages', id: doc.id, ...asEditor })),
    ).toBe(true)
  })

  it('photos and settings: no read or change', async () => {
    const asEditor = { overrideAccess: false as const, user: w.editorA }
    expect(await refused(() => p.find({ collection: 'marketing-media', ...asEditor }))).toBe(true)
    expect(
      await refused(() =>
        p.create({
          collection: 'marketing-media',
          data: { alt: 'Sneaky' } as never,
          file: pngFile('sneaky.png'),
          ...asEditor,
        }),
      ),
    ).toBe(true)
    expect(await refused(() => p.findGlobal({ slug: 'marketing-settings', ...asEditor }))).toBe(
      true,
    )
    expect(
      await refused(() =>
        p.updateGlobal({
          slug: 'marketing-settings',
          data: { pricing: { monthlyPrice: 1 } } as never,
          ...asEditor,
        }),
      ),
    ).toBe(true)
  })
})

describe('the super-admin manages it', () => {
  it('creates pages and photos, and changes the settings', async () => {
    const asAdmin = { overrideAccess: false as const, user: w.superAdmin }
    const created = await p.create({
      collection: 'marketing-pages',
      data: { title: 'Admin page', slug: 'admin-page', _status: 'published' } as never,
      ...asAdmin,
    })
    expect(created.slug).toBe('admin-page')
    const photo = await p.create({
      collection: 'marketing-media',
      data: { alt: 'Demo club: a heathland fairway' } as never,
      file: pngFile('fairway.png'),
      ...asAdmin,
    })
    expect(photo.prefix).toMatch(/^marketing-media\//)
    const settings = await p.findGlobal({ slug: 'marketing-settings', ...asAdmin })
    expect(settings.pricing?.monthlyPrice).toBe(149)
    expect(settings.pricing?.vatLabel).toBe('+ VAT')
    const updated = await p.updateGlobal({
      slug: 'marketing-settings',
      data: { pricing: { ...settings.pricing, vatLabel: 'plus VAT' } } as never,
      ...asAdmin,
    })
    expect(updated.pricing?.vatLabel).toBe('plus VAT')
  })

  it('every marketing photo needs a description', async () => {
    await expect(
      p.create({ collection: 'marketing-media', data: {} as never, file: pngFile('no-alt.png') }),
    ).rejects.toThrow()
  })

  it('headlines keep to the word limits', async () => {
    await expect(
      p.create({
        collection: 'marketing-pages',
        data: {
          _status: 'published',
          title: 'Too long',
          slug: 'too-long',
          layout: [
            { blockType: 'mkSectionHeader', title: 'One two three four five six seven eight nine' },
          ],
        } as never,
      }),
    ).rejects.toMatchObject({
      data: { errors: [expect.objectContaining({ message: expect.stringContaining('8 words') })] },
    })
  })

  it('two pages can’t share an address', async () => {
    await page('shared-address', 'published')
    await expect(page('shared-address', 'published')).rejects.toThrow()
  })
})

describe('visitors only ever see published pages', () => {
  it('a published page is found at its address; the home page at "/"', async () => {
    await page('home', 'published')
    await page('pricing-test', 'published')
    expect((await publishedMarketingPage([]))?.slug).toBe('home')
    expect((await publishedMarketingPage(['pricing-test']))?.slug).toBe('pricing-test')
    // "/home" isn't an address, and nothing is nested.
    expect(await publishedMarketingPage(['home'])).toBeNull()
    expect(await publishedMarketingPage(['pricing-test', 'more'])).toBeNull()
  })

  it('a draft page is never shown', async () => {
    await page('draft-only', 'draft')
    expect(await publishedMarketingPage(['draft-only'])).toBeNull()
  })

  it('a published page’s unpublished changes stay hidden', async () => {
    const doc = await page('changing', 'published')
    await p.update({
      collection: 'marketing-pages',
      id: doc.id,
      draft: true,
      data: { title: 'Unpublished new name', _status: 'draft' } as never,
    })
    expect((await publishedMarketingPage(['changing']))?.title).toBe('Page changing')
  })

  it('links inside text resolve to marketing page addresses', async () => {
    const target = await page('link-target', 'published')
    await page('with-link', 'published', {
      layout: [
        {
          blockType: 'mkRichText',
          content: rt.doc(
            rt.p({
              ...rt.pageLink('see pricing', target.id),
              fields: {
                linkType: 'internal',
                newTab: false,
                doc: { relationTo: 'marketing-pages', value: target.id },
              },
            }),
          ),
        },
      ],
    })
    const found = await publishedMarketingPage(['with-link'])
    const block = found?.layout?.[0] as { content: unknown }
    expect(JSON.stringify(block.content)).toContain('"slug":"link-target"')
  })
})
