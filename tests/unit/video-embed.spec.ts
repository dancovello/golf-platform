import { describe, expect, it } from 'vitest'

import { parseVideoURL, quietEmbedURL, validateVideoURL } from '@/blocks/video/embed'

const ID = 'aqz-KE-bpKQ'

describe('video addresses', () => {
  it.each([
    `https://www.youtube.com/watch?v=${ID}`,
    `https://youtube.com/watch?v=${ID}&feature=share`,
    `https://m.youtube.com/watch?v=${ID}`,
    `https://youtu.be/${ID}`,
    `https://www.youtube.com/embed/${ID}`,
    `https://www.youtube.com/shorts/${ID}`,
    `https://www.youtube-nocookie.com/embed/${ID}`,
    `  https://youtu.be/${ID}  `,
  ])('reads %s as a YouTube video', (url) => {
    const v = parseVideoURL(url)
    expect(v?.provider).toBe('youtube')
    expect(v?.id).toBe(ID)
    expect(v?.embedURL).toMatch(new RegExp(`^https://www\\.youtube-nocookie\\.com/embed/${ID}\\?`))
    expect(v?.watchURL).toBe(`https://www.youtube.com/watch?v=${ID}`)
  })

  it('keeps a start time, as seconds', () => {
    expect(parseVideoURL(`https://www.youtube.com/watch?v=${ID}&t=36s`)?.embedURL).toContain(
      'start=36',
    )
    expect(parseVideoURL(`https://youtu.be/${ID}?t=1m30s`)?.embedURL).toContain('start=90')
    expect(parseVideoURL(`https://youtu.be/${ID}?t=abc`)?.embedURL).not.toContain('start=')
  })

  it('reads Vimeo addresses, including unlisted videos', () => {
    expect(parseVideoURL('https://vimeo.com/76979871')?.embedURL).toBe(
      'https://player.vimeo.com/video/76979871?autoplay=1&dnt=1',
    )
    expect(parseVideoURL('https://player.vimeo.com/video/76979871')?.provider).toBe('vimeo')
    const unlisted = parseVideoURL('https://vimeo.com/76979871/abcdef1234')
    expect(unlisted?.embedURL).toContain('h=abcdef1234')
    expect(unlisted?.watchURL).toBe('https://vimeo.com/76979871/abcdef1234')
  })

  it('always plays from YouTube’s no-cookie address or Vimeo’s player, built from the ID', () => {
    const urls = [`https://www.youtube.com/watch?v=${ID}`, 'https://vimeo.com/76979871'].map(
      (u) => new URL(parseVideoURL(u)!.embedURL).origin,
    )
    expect(urls).toEqual(['https://www.youtube-nocookie.com', 'https://player.vimeo.com'])
  })

  it.each([
    '',
    'not a url',
    'javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'ftp://www.youtube.com/watch?v=aqz-KE-bpKQ',
    'https://evil.example/watch?v=aqz-KE-bpKQ',
    'https://youtube.com.evil.example/watch?v=aqz-KE-bpKQ',
    'https://www.youtube.com.evil.example/embed/aqz-KE-bpKQ',
    'https://evil.example/https://www.youtube.com/watch?v=aqz-KE-bpKQ',
    'https://user:pass@www.youtube.com/watch?v=aqz-KE-bpKQ',
    'https://www.youtube.com:8443/watch?v=aqz-KE-bpKQ',
    'https://www.youtube.com/user/BEARWOODLAKES',
    'https://www.youtube.com/watch?v=short',
    'https://www.youtube.com/watch?v=aqz-KE-bpKQ"onload="x',
    'https://youtu.be/aqz-KE-bpKQ/../../x',
    'https://vimeo.com/channels/staffpicks',
    'https://vimeo.com/abc',
    'https://player.vimeo.com/foo/76979871',
    'https://www.youtube.com/playlist?list=PL123',
  ])('refuses %s', (url) => {
    expect(parseVideoURL(url)).toBeNull()
  })

  it('refuses things that are not text', () => {
    expect(parseVideoURL(undefined)).toBeNull()
    expect(parseVideoURL(42)).toBeNull()
    expect(parseVideoURL({ href: `https://youtu.be/${ID}` })).toBeNull()
  })

  it('gives the editor a plain message when an address is refused', () => {
    expect(validateVideoURL(`https://youtu.be/${ID}`)).toBe(true)
    expect(validateVideoURL('https://example.com/video')).toMatch(/YouTube or Vimeo/)
  })
})

describe('quietEmbedURL', () => {
  it('switches off YouTube’s controls and extras without changing the host or video', () => {
    const quiet = new URL(quietEmbedURL(parseVideoURL(`https://youtu.be/${ID}`)!.embedURL))
    expect(quiet.origin).toBe('https://www.youtube-nocookie.com')
    expect(quiet.pathname).toBe(`/embed/${ID}`)
    expect(quiet.searchParams.get('controls')).toBe('0')
    expect(quiet.searchParams.get('modestbranding')).toBe('1')
    expect(quiet.searchParams.get('autoplay')).toBe('1')
  })
  it('hides Vimeo’s title and byline', () => {
    const quiet = new URL(quietEmbedURL('https://player.vimeo.com/video/76979871?autoplay=1&dnt=1'))
    expect(quiet.searchParams.get('title')).toBe('0')
    expect(quiet.searchParams.get('dnt')).toBe('1')
  })
})
