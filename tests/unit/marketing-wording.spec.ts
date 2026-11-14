import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { BANNED } from '../../src/marketing/bannedWording'

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
      if (file.endsWith('bannedWording.ts')) continue // the list itself spells the wording out
      const text = readFileSync(file, 'utf8')
      for (const pattern of BANNED) {
        const match = text.match(pattern)
        if (match) found.push(`${file}: “${match[0]}”`)
      }
    }
    expect(found).toEqual([])
  })
})
