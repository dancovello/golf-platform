import { beforeEach, describe, expect, it } from 'vitest'

import { passage, searchWords, wordMatcher } from '@/search/words'
import {
  SEARCHES_PER_MINUTE,
  allowSearch,
  forgetSearchVisitors,
  visitorKey,
} from '@/search/rateLimit'
import { blockWords, opening, tidy } from '@/search/text'
import type { Block } from 'payload'

describe('search words', () => {
  it('keeps letters and numbers only, lower case, at most eight words', () => {
    expect(searchWords('Green-fees: £65?')).toEqual(['green', 'fees', '65'])
    expect(searchWords('a b c d e f g h i j')).toHaveLength(8)
    expect(searchWords("'; DROP TABLE pages; --")).toEqual(['drop', 'table', 'pages'])
  })

  it('match words that start the same way, ignoring endings', () => {
    expect('Buggies all year').toMatch(wordMatcher(['buggy']))
    expect('Membership').toMatch(wordMatcher(['memb']))
    expect('Remembering').not.toMatch(wordMatcher(['memb']))
  })
})

describe('page passages', () => {
  const body = 'Membership\nFull membership has a waiting list of about six months.\nJuniors'
  it('picks the line with the searched words, preferring sentences to headings', () => {
    expect(passage(body, ['membership'])).toBe(
      'Full membership has a waiting list of about six months.',
    )
  })

  it('cuts long lines around the first match', () => {
    const long = `${'Words before. '.repeat(20)}Twilight golf starts at 3pm. ${'After. '.repeat(30)}`
    const out = passage(long, ['twilight']) ?? ''
    expect(out).toContain('Twilight golf')
    expect(out.length).toBeLessThanOrEqual(170)
    expect(out.startsWith('… ')).toBe(true)
  })

  it('gives nothing when no line matches', () => {
    expect(passage(body, ['parking'])).toBeNull()
  })
})

describe('words from blocks', () => {
  const blocks: Block[] = [
    {
      slug: 'card',
      fields: [
        { name: 'heading', type: 'text' },
        { name: 'style', type: 'select', options: ['a', 'b'] },
        {
          name: 'button',
          type: 'group',
          fields: [
            { name: 'label', type: 'text' },
            { name: 'url', type: 'text' },
          ],
        },
        { name: 'rows', type: 'array', fields: [{ name: 'item', type: 'textarea' }] },
      ],
    },
  ]

  it('keeps what visitors read and skips settings and addresses', () => {
    const text = tidy(
      blockWords(blocks, [
        {
          blockType: 'card',
          heading: 'Twilight golf',
          style: 'b',
          button: { label: 'Book now', url: 'https://example.com/secret' },
          rows: [{ item: 'From 3pm' }],
        },
        { blockType: 'unknown', heading: 'Ignored' },
      ]),
    )
    expect(text).toBe('Twilight golf\nBook now\nFrom 3pm')
  })

  it('cuts an opening at a word', () => {
    expect(opening('one two three four', 12)).toBe('one two…')
  })
})

describe('search rate limit', () => {
  beforeEach(() => forgetSearchVisitors())

  it('allows a generous number of searches a minute, then refuses', () => {
    const now = 1_000_000
    for (let i = 0; i < SEARCHES_PER_MINUTE; i++) expect(allowSearch('1.2.3.4', now)).toBe(true)
    expect(allowSearch('1.2.3.4', now)).toBe(false)
    // Someone else is unaffected, and the first visitor can search again a minute later.
    expect(allowSearch('5.6.7.8', now)).toBe(true)
    expect(allowSearch('1.2.3.4', now + 60_001)).toBe(true)
  })

  it('identifies the visitor by the address the host saw', () => {
    expect(visitorKey(new Headers({ 'x-forwarded-for': '9.9.9.9, 10.0.0.1' }))).toBe('9.9.9.9')
    expect(visitorKey(new Headers({ 'x-real-ip': '8.8.8.8' }))).toBe('8.8.8.8')
    expect(visitorKey(new Headers())).toBe('unknown')
  })

  it('ignores a made-up cf-connecting-ip until the site is behind Cloudflare', () => {
    const forged = new Headers({ 'cf-connecting-ip': '6.6.6.6', 'x-real-ip': '8.8.8.8' })
    expect(visitorKey(forged, undefined)).toBe('8.8.8.8')
    expect(visitorKey(new Headers({ 'cf-connecting-ip': '6.6.6.6' }), undefined)).toBe('unknown')
    expect(visitorKey(forged, 'cloudflare')).toBe('6.6.6.6')
  })
})
