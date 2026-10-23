import { describe, expect, it } from 'vitest'

import { askedFor } from '@/search/intents'
import { passage, searchWords, wordMatcher } from '@/search/words'
import { hashVisitor, visitorKey } from '@/security/rateLimit'
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

describe('rate limits: who the visitor is (counting: tests/int/rate-limit.int.spec.ts)', () => {
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

  it('never keeps the address itself: a keyed hash that changes every day', () => {
    const day = new Date('2026-10-22T10:00:00Z')
    const key = hashVisitor('203.0.113.7', day, 'secret')
    expect(key).toMatch(/^[0-9a-f]{32}$/)
    expect(key).not.toContain('203')
    expect(hashVisitor('203.0.113.7', new Date('2026-10-22T23:00:00Z'), 'secret')).toBe(key)
    expect(hashVisitor('203.0.113.7', new Date('2026-10-23T00:00:00Z'), 'secret')).not.toBe(key)
    expect(hashVisitor('203.0.113.7', day, 'another secret')).not.toBe(key)
  })
})

describe('what a search is asking for (smart answers)', () => {
  const kinds = (q: string) => [...askedFor(q)].sort()

  it('recognises the five kinds of question', () => {
    expect(kinds('is the course open')).toEqual(['status'])
    expect(kinds('buggies')).toEqual(['status'])
    expect(kinds('opening hours')).toEqual(['hours'])
    expect(kinds('when does the bar open')).toEqual(['hours'])
    expect(kinds('green fees')).toEqual(['fees'])
    expect(kinds('how much')).toEqual(['fees'])
    expect(kinds('next competition')).toEqual(['event'])
  })

  it('asks for nothing in particular for a plain search', () => {
    expect(kinds('membership')).toEqual([])
    expect(kinds('juniors')).toEqual([])
  })

  it('notices when a search fits more than one kind (which then gets no answer)', () => {
    expect(kinds('course open hours').length).toBeGreaterThan(1)
  })
})
