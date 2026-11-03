import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

// Wording the 21 Oct evening decision removed (docs/marketing-site/HANDOFF.md §3 and §9, launch
// gate item 11). Setup is a paid one-off fee agreed with each club, the example homepage is shown
// in the demo and never called free, and there is no fixed switching timeline.
const BANNED = [
  /free homepage/i,
  /rebuilt free/i,
  /rebuild your homepage[^.]*\bfree\b/i,
  /no setup fee/i,
  /four weeks/i,
  /send it straight to you/i,
  /\bweek [1-4]\b/i,
  // The request form and its emails promised a date; none is promised now.
  /promised by/i,
  /on its way/i,
]

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return sourceFiles(path)
    return /\.(ts|tsx)$/.test(name) ? [path] : []
  })

describe('marketing wording', () => {
  it('has none of the wording the 21 Oct decision removed', () => {
    const found: string[] = []
    for (const file of sourceFiles('src/marketing')) {
      const text = readFileSync(file, 'utf8')
      for (const pattern of BANNED) {
        const match = text.match(pattern)
        if (match) found.push(`${file}: “${match[0]}”`)
      }
    }
    expect(found).toEqual([])
  })
})
