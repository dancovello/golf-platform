import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import type { VideoBlock } from '../../src/payload-types'
import { blockContextFrom, type BlockContext, type BlockData } from '../../src/site/blocks/resolve'
import { Video } from '../../src/site/blocks/Video'

const poster = {
  id: 'm1',
  url: '/poster.jpg',
  srcSet: null,
  position: '50% 50%',
  width: 1600,
  height: 900,
  mimeType: 'image/jpeg',
}
const data = { media: {}, pages: {}, documents: {}, staff: {}, courses: {} } as unknown as BlockData
const ctx: BlockContext = {
  ...blockContextFrom(data),
  media: () => poster as never,
  link: (value) =>
    value && (value as { label?: string }).label
      ? { label: (value as { label: string }).label, link: { kind: 'page', slug: 'tour' } }
      : null,
}

const block = (extra: Partial<VideoBlock>): VideoBlock =>
  ({
    id: 'b1',
    blockType: 'video',
    style: 'featured',
    heading: 'Fly over the course',
    intro: 'Eighteen holes in two minutes.',
    button: { label: 'Book a tour', type: 'page' },
    videos: [
      { id: 'v1', url: 'https://youtu.be/dQw4w9WgXcQ', poster: 'm1', title: 'The fly-through' },
    ],
    ...extra,
  }) as VideoBlock

const html = (b: VideoBlock) =>
  renderToStaticMarkup(createElement(Video, { block: b, ctx, base: '' }))

describe('Video style A layouts', () => {
  it('standard: heading and description above, video, then the button; full-width container', () => {
    const out = html(block({ featuredLayout: 'standard' }))
    expect(out).toContain('vd-featured-block')
    expect(out).not.toContain('vd-split')
    expect(out).not.toContain('is-centred')
    expect(out).toContain('Eighteen holes in two minutes.')
    expect(out.indexOf('vd-featured"')).toBeLessThan(out.indexOf('Book a tour'))
  })

  it('an existing block with no layout chosen is the standard layout', () => {
    expect(html(block({ featuredLayout: undefined }))).toContain('vd-featured-block')
  })

  it('full width: heading, description and button are centred above the video', () => {
    const out = html(block({ featuredLayout: 'wide' }))
    expect(out).toContain('vd-wide')
    expect(out).toContain('blk-header is-centred')
    expect(out.indexOf('Book a tour')).toBeLessThan(out.indexOf('vd-featured"'))
  })

  it('half and half: the video side can be left or right, and there is no page container', () => {
    const left = html(block({ featuredLayout: 'split', videoSide: 'left' }))
    expect(left).toContain('vd-split')
    expect(left).not.toContain('is-right')
    expect(left).not.toContain('blk-container')
    expect(left).toContain('Book a tour')
    expect(html(block({ featuredLayout: 'split', videoSide: 'right' }))).toContain(
      'vd-split is-right',
    )
  })

  it('leaves out the description and button when they are empty, and never shows "Watch on"', () => {
    const out = html(
      block({ featuredLayout: 'wide', intro: '', button: { type: 'page' } as never }),
    )
    expect(out).not.toContain('vd-intro')
    expect(out).not.toContain('vd-button')
    expect(out).not.toMatch(/Watch on/i)
  })
})
