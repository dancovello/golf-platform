// Every place that skips Payload's access rules must be listed, with its reason, in
// src/security/override-allowlist.ts (job 2, 21 Oct grilling). Reads the source; runs nothing.
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

import { OVERRIDE_ALLOWLIST } from '@/security/override-allowlist'

import { accessSkips, type AccessSkip } from '../shared/sourceScan'

const key = (file: string, fn: string) => `${file} › ${fn}`

const countByFunction = (skips: AccessSkip[]) => {
  const counts = new Map<string, number>()
  for (const s of skips) counts.set(key(s.file, s.fn), (counts.get(key(s.file, s.fn)) ?? 0) + 1)
  return counts
}

const skipsIn = (code: string) =>
  accessSkips([
    {
      file: 'src/example.ts',
      tree: ts.createSourceFile('example.ts', code, ts.ScriptTarget.Latest, true),
    },
  ])

describe('every access-rule skip is on the allowlist', () => {
  const found = countByFunction(accessSkips())
  const listed = new Map(OVERRIDE_ALLOWLIST.map((e) => [key(e.file, e.fn), e]))

  it('no function skips the rules without being listed (or more often than listed)', () => {
    const problems = [...found]
      .filter(([k, n]) => (listed.get(k)?.uses ?? 0) !== n)
      .map(([k, n]) => `${k}: skips the rules ${n} time(s), listed ${listed.get(k)?.uses ?? 0}`)
    expect(problems, 'Add or update its entry in src/security/override-allowlist.ts').toEqual([])
  })

  it('every entry still exists', () => {
    const stale = [...listed.keys()].filter((k) => !found.has(k))
    expect(stale, 'Remove these from src/security/override-allowlist.ts').toEqual([])
  })

  it('every entry says which club it reaches and why', () => {
    const vague = OVERRIDE_ALLOWLIST.filter((e) => e.club.trim().length < 10 || e.why.length < 10)
    expect(vague.map((e) => key(e.file, e.fn))).toEqual([])
  })

  it('lists each function once', () => {
    expect(listed.size).toBe(OVERRIDE_ALLOWLIST.length)
  })
})

describe('the scanner itself', () => {
  it('finds overrideAccess: true, and calls that leave it unset', () => {
    const skips = skipsIn(`
      const loadA = async () => payload.find({ collection: 'pages', overrideAccess: true })
      async function loadB() { return payload.count({ collection: 'news' }) }
      const loadC = () => payload.findGlobal({ slug: 'marketing-settings', overrideAccess: flag })
      const safe = () => payload.find({ collection: 'pages', overrideAccess: false, user })
    `)
    expect(skips.map((s) => [s.fn, s.how])).toEqual([
      ['loadA', 'true'],
      ['loadB', 'not set (default)'],
      ['loadC', 'flag'],
    ])
  })

  it('names unnamed hooks by the property they sit in', () => {
    const skips = skipsIn(`export const C = { hooks: { afterChange: [async () => {
      await req.payload.create({ collection: 'x', data: {}, overrideAccess: true })
    }] } }`)
    expect(skips.map((s) => s.fn)).toEqual(['afterChange'])
  })
})
