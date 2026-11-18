import { expect, test } from './fixtures'

// QA-20, QA-21, QA-06: the longest words and button labels an editor can enter must stay inside
// a phone screen, and the cookie banner must not cover more than 40% of the smallest one.
const LONG = 'Supercalifragilisticexpialidoc-and-more-1234567890'
const L40 = 'Book a lesson with our head professional'
const link = (label: string) => ({ label, type: 'url', url: 'https://example.com' })

test('long words and 40-character labels stay inside a phone screen; the banner is compact', async ({
  editorPage,
  world: w,
  page,
}) => {
  const first = async (collection: string) =>
    (
      (await (await editorPage.request.get(`/api/${collection}?limit=1&depth=0`)).json()) as {
        docs: { id: string }[]
      }
    ).docs[0]!.id
  const staff = await first('staff')
  const image = await first('media')
  const slug = `phone-long-text-${Date.now()}`
  const layout = [
    ...['grid', 'directory', 'featured'].map((style) => ({
      blockType: 'team',
      style,
      heading: LONG,
      featured: staff,
      people: [staff],
      action: link(L40),
      viewAll: link('The whole team and everyone in it'),
    })),
    ...['centred', 'withContact', 'searchTopics'].map((style) => ({
      blockType: 'faq',
      style,
      heading: LONG,
      items: [{ question: LONG, answer: `${LONG} ${LONG}`, topic: 'Topic' }],
      cardHeading: LONG.slice(0, 38),
      contactLink: link(L40),
    })),
    ...['split', 'collage', 'keyFacts'].map((style) => ({
      blockType: 'twoColumn',
      style,
      image,
      insetImage: image,
      heading: LONG,
      body: LONG,
      button: link(L40),
      link: link(L40),
      facts: [{ label: 'Facts', value: 'Value' }],
    })),
  ]
  const created = await editorPage.request.post('/api/pages', {
    data: { title: 'Long text', slug, tenant: w.clubA.id, _status: 'published', layout },
  })
  expect(created.ok(), await created.text()).toBe(true)
  await editorPage.request.patch(`/api/club-settings/${w.settingsA.id}`, {
    data: { privacy: { gaMeasurementId: 'G-TEST123456' } },
  })
  try {
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 568 })
      await page.goto(`http://club-a.localhost:3100/${slug}`)
      await page.getByTestId('cookie-banner').waitFor()

      const tooWide = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth
        return Array.from(document.querySelectorAll('main .blk-heading, main .btn, main summary'))
          .filter((e) => e.getBoundingClientRect().right > vw + 1)
          .map((e) => `${e.tagName}.${e.className} "${(e.textContent ?? '').slice(0, 30)}"`)
      })
      expect(tooWide, `wider than a ${width}px screen`).toEqual([])
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
        `page scrolls sideways at ${width}px`,
      ).toBeLessThanOrEqual(width)

      const banner = await page.getByTestId('cookie-banner').boundingBox()
      expect(banner!.height / 568, `cookie banner at ${width}px`).toBeLessThanOrEqual(0.4)
    }
  } finally {
    await editorPage.request.patch(`/api/club-settings/${w.settingsA.id}`, {
      data: { privacy: { gaMeasurementId: null } },
    })
    await editorPage.request.delete(`/api/pages?where[slug][equals]=${slug}`)
  }
})
