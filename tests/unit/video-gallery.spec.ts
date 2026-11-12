import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { VideoGallery } from '../../src/site/blocks/VideoGallery'
import type { VideoItem } from '../../src/site/blocks/VideoPlayer'

const item = (i: number): VideoItem => ({
  id: `v${i}`,
  title: `Hole ${i}`,
  caption: null,
  provider: 'youtube',
  embedURL: `https://www.youtube-nocookie.com/embed/ABCDEFGHIJ${i}`,
  poster: { src: `/p${i}.jpg`, srcSet: null, position: '50% 50%' },
  width: 1600,
  height: 900,
})
const html = (n: number, layout: 'auto' | 'grid' | 'carousel') =>
  renderToStaticMarkup(
    createElement(VideoGallery, {
      items: Array.from({ length: n }, (_, i) => item(i + 1)),
      layout,
    }),
  )

describe('the video gallery', () => {
  it('automatic: up to 3 videos are a grid on wide screens, more are a carousel', () => {
    expect(html(3, 'auto')).toContain('vd-wide-grid vd-across-3 vd-few')
    expect(html(2, 'auto')).toContain('vd-wide-grid vd-across-2 vd-few')
    expect(html(4, 'auto')).toContain('vd-wide-carousel vd-across-3')
    expect(html(4, 'auto')).not.toContain('vd-few')
  })

  it('"always" choices stay as chosen', () => {
    expect(html(3, 'grid')).toContain('vd-layout-grid vd-wide-grid')
    expect(html(8, 'grid')).toContain('vd-layout-grid vd-wide-grid')
    expect(html(3, 'carousel')).toContain('vd-layout-carousel vd-wide-carousel')
  })

  it('loads nothing from the video site until a picture is pressed, and has no "Watch on" link', () => {
    const out = html(3, 'auto')
    expect(out).not.toContain('<iframe')
    expect(out).not.toContain('youtube')
    expect(out).not.toMatch(/Watch on/i)
    expect(out).toContain('aria-label="Play video: Hole 1"')
    expect(out).toContain('aria-haspopup="dialog"')
  })

  it('has a single video without carousel controls', () => {
    expect(html(1, 'auto')).not.toContain('carctl')
  })
})
