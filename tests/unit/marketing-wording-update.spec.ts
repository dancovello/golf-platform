import { describe, expect, it } from 'vitest'

import { STARTER_PAGES } from '@/marketing/starter/pages'
import {
  findLeftovers,
  planPageUpdate,
  REMOVED_BLOCK,
  REPLACEMENTS,
  replaceWording,
} from '@/marketing/starter/wordingUpdate'

// The one-off update of already-saved marketing pages (docs/plans/staging-wording-update.md).

const starterJson = JSON.stringify(STARTER_PAGES)

describe('the replacement list', () => {
  it('only produces text the starter copy now has, and the old text is gone from it', () => {
    for (const [from, to] of REPLACEMENTS) {
      expect(starterJson, `new text: ${to}`).toContain(JSON.stringify(to).slice(1, -1))
      expect(starterJson, `old text: ${from}`).not.toContain(JSON.stringify(from).slice(1, -1))
    }
  })

  it('turns an old copy of every starter page into exactly the current starter copy', () => {
    const backwards = new Map(REPLACEMENTS.map(([from, to]) => [to, from]))
    const unwind = (value: unknown): unknown => {
      if (typeof value === 'string') return backwards.get(value) ?? value
      if (Array.isArray(value)) return value.map(unwind)
      if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, unwind(v)]))
      }
      return value
    }
    for (const page of STARTER_PAGES) {
      let oldLayout = unwind(page.layout) as unknown[]
      // The Switching page also had the Week 1 to 4 block, just before the FAQ.
      if (page.slug === 'switching') {
        const at = oldLayout.findIndex((b) => (b as { blockType: string }).blockType === 'mkFaq')
        oldLayout = [
          ...oldLayout.slice(0, at),
          { blockType: REMOVED_BLOCK, weeks: [{ label: 'Week 1', title: 'Gather' }] },
          ...oldLayout.slice(at),
        ]
      }
      const result = planPageUpdate({
        slug: page.slug,
        layout: oldLayout,
        metaDescription: unwind(page.description) as string,
      })
      expect(result.layout, page.slug).toEqual(page.layout)
      expect(result.metaDescription, page.slug).toBe(page.description)
      expect(result.leftovers, page.slug).toEqual([])
    }
  })
})

describe('updating a saved page', () => {
  const saved = [
    {
      blockType: 'mkCtaBand',
      title: 'See your club on it.',
      secondary: { label: 'Get your free homepage', href: '/switching' },
    },
  ]

  it('changes exact old text and reports where', () => {
    const result = planPageUpdate({ slug: 'home', layout: saved })
    expect(result.changes).toEqual([
      {
        path: 'layout[0].secondary.label',
        from: 'Get your free homepage',
        to: 'See how switching works',
      },
    ])
    expect(result.layout).toEqual([
      { ...saved[0], secondary: { label: 'See how switching works', href: '/switching' } },
    ])
  })

  it('does nothing the second time', () => {
    const once = planPageUpdate({ slug: 'home', layout: saved })
    const twice = planPageUpdate({ slug: 'home', layout: once.layout })
    expect(twice.changes).toEqual([])
    expect(twice.layout).toEqual(once.layout)
  })

  it('leaves reworded text alone, and lists it if it still uses a retired phrase', () => {
    const reworded = [
      { blockType: 'mkHeader', subhead: 'Your free homepage, built by us.' },
      { blockType: 'mkHeader', subhead: 'Something we wrote ourselves.' },
    ]
    const result = planPageUpdate({ slug: 'home', layout: reworded })
    expect(result.changes).toEqual([])
    expect(result.layout).toEqual(reworded)
    expect(result.leftovers).toEqual([
      { path: 'layout[0].subhead', text: 'Your free homepage, built by us.' },
    ])
  })

  it('removes the Week 1 to 4 block from Switching only', () => {
    const layout = [{ blockType: 'mkHeader' }, { blockType: REMOVED_BLOCK, weeks: [] }]
    const switching = planPageUpdate({ slug: 'switching', layout })
    expect(switching.layout).toEqual([{ blockType: 'mkHeader' }])
    expect(switching.changes).toHaveLength(1)
    expect(planPageUpdate({ slug: 'pricing', layout }).layout).toEqual(layout)
  })

  it('also updates the page description', () => {
    const result = planPageUpdate({
      slug: 'home',
      layout: [],
      metaDescription:
        'Golf club websites your team can update in minutes. See a demo club, then book a demo or get your homepage rebuilt free.',
    })
    expect(result.metaDescription).toBe(
      'Golf club websites your team can update in minutes. See a demo club, then book a demo.',
    )
    expect(result.changes[0]?.path).toBe('meta.description')
  })

  it('does not change values that are not text', () => {
    const value = { a: 1, b: null, c: [true, 'x'] }
    expect(replaceWording(value).value).toEqual(value)
    expect(findLeftovers(value)).toEqual([])
  })
})
