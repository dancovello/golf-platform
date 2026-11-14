import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { video } from '../../src/blocks/video/config'
import type { VideoBlock } from '../../src/payload-types'
import { blockContextFrom, type BlockContext, type BlockData } from '../../src/site/blocks/resolve'
import { BrandedVideo } from '../../src/site/blocks/BrandedVideo'
import { Video } from '../../src/site/blocks/Video'

const picture = {
  url: '/poster.jpg',
  srcSet: null,
  position: '50% 50%',
  width: 1600,
  height: 900,
  mimeType: 'image/jpeg',
  alt: '',
}
const film = { ...picture, url: '/films/clubhouse.mp4', mimeType: 'video/mp4' }
const data = { media: {}, pages: {}, documents: {}, staff: {}, courses: {} } as unknown as BlockData
const ctx: BlockContext = {
  ...blockContextFrom(data),
  media: (value) => (value === 'film' ? film : value === 'photo' ? picture : null) as never,
}
const html = (videos: unknown[]) =>
  renderToStaticMarkup(
    createElement(Video, {
      block: {
        id: 'b1',
        blockType: 'video',
        style: 'featured',
        heading: 'Our clubhouse',
        videos,
      } as VideoBlock,
      ctx,
      base: '',
    }),
  )

describe('Video block: an uploaded file', () => {
  it('shows the club’s picture first, with no YouTube or Vimeo frame', () => {
    const out = html([{ id: 'v1', file: 'film', poster: 'photo', title: 'Clubhouse tour' }])
    expect(out).toContain('Play video: Clubhouse tour')
    expect(out).not.toContain('<iframe')
    expect(out).not.toContain('youtube')
  })

  it('needs no address when a file is chosen, and is skipped if the file is not a video', () => {
    expect(html([{ id: 'v1', file: 'film', poster: 'photo', title: 'A' }])).toContain('vd-item')
    expect(html([{ id: 'v1', file: 'photo', poster: 'photo', title: 'A' }])).toBe('')
  })

  it('still plays a YouTube address when there is no file', () => {
    const out = html([
      { id: 'v1', url: 'https://youtu.be/dQw4w9WgXcQ', poster: 'photo', title: 'Fly-through' },
    ])
    expect(out).toContain('Play video: Fly-through')
  })

  it('the editor needs a file or a valid address', () => {
    const fields = (
      video.config.fields.find((f) => 'name' in f && f.name === 'videos') as never as {
        fields: { name?: string; validate?: (v: unknown, o: unknown) => unknown }[]
      }
    ).fields
    const url = fields.find((f) => f.name === 'url')!
    expect(url.validate!('', { siblingData: { file: 'film' } })).toBe(true)
    expect(url.validate!('', { siblingData: {} })).not.toBe(true)
    expect(url.validate!('https://example.com/x.mp4', { siblingData: {} })).not.toBe(true)
  })
})

describe('the club’s own player', () => {
  const out = renderToStaticMarkup(
    createElement(BrandedVideo, {
      src: '/films/clubhouse.mp4',
      poster: '/poster.jpg',
      title: 'Tour',
    }),
  )

  it('plays only the file from the club’s own storage, with nothing from another site', () => {
    expect(out).toContain('src="/films/clubhouse.mp4"')
    expect(out).not.toMatch(/youtube|vimeo|<iframe|<script/i)
  })

  it('has real controls with names: play, seek, mute, full screen', () => {
    for (const name of ['Play', 'Seek', 'Mute', 'Full screen'])
      expect(out).toContain(`aria-label="${name}"`)
  })
})
