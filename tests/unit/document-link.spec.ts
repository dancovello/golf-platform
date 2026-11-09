import { describe, expect, it } from 'vitest'

import { collectRefs } from '../../src/blocks/shared'
import { linksToPage } from '../../src/fields/link'
import { blockContextFrom, type BlockData } from '../../src/site/blocks/resolve'
import { isExternal, linkTarget } from '../../src/site/components/links'

const doc = {
  id: '7',
  title: 'Application form',
  category: 'forms',
  url: '/media/documents/form.pdf',
  type: 'PDF',
  size: '120 KB',
  lastReviewed: null,
}
const data = {
  media: {},
  pages: { '3': 'about' },
  documents: { '7': doc },
  staff: {},
  courses: {},
  courseStatus: null,
} as unknown as BlockData
const ctx = blockContextFrom(data)

describe('a link that goes to a document', () => {
  it('is not mistaken for a link to a page', () => {
    expect(linksToPage('document')).toBe(false)
    expect(linksToPage('page')).toBe(true)
    expect(linksToPage(undefined)).toBe(true)
  })

  it('resolves to the file, opened in a new tab', () => {
    const link = ctx.link({ label: 'Apply', type: 'document', document: '7' })
    expect(link).toEqual({
      label: 'Apply',
      link: { kind: 'url', href: '/media/documents/form.pdf', file: true },
    })
    expect(isExternal(link!.link)).toBe(true)
    expect(linkTarget(link!.link)).toMatchObject({ target: '_blank' })
  })

  it('is dropped when the document is not this club’s (or is gone)', () => {
    expect(ctx.link({ label: 'Apply', type: 'document', document: '99' })).toBeNull()
    expect(ctx.link({ label: 'Apply', type: 'document' })).toBeNull()
    expect(ctx.link({ label: 'Apply', type: 'document', document: '__proto__' })).toBeNull()
  })

  it('leaves page, built-in and web links as they were', () => {
    expect(ctx.link({ label: 'About', type: 'page', page: '3' })?.link).toEqual({
      kind: 'page',
      slug: 'about',
    })
    expect(ctx.link({ label: 'Web', type: 'url', url: 'https://example.com' })?.link).toEqual({
      kind: 'url',
      href: 'https://example.com',
    })
  })

  it('is collected for the same-club check, and a page link is not', () => {
    const refs = collectRefs({ link: { type: 'document', document: '7', page: '3' } }, 'layout.0', {
      links: ['link'],
    })
    expect(refs).toEqual([{ collection: 'documents', id: '7', path: 'layout.0.link.document' }])
    const page = collectRefs({ link: { type: 'page', page: '3' } }, 'layout.0', { links: ['link'] })
    expect(page).toEqual([{ collection: 'pages', id: '3', path: 'layout.0.link.page' }])
  })
})
