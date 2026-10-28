import { describe, expect, it } from 'vitest'

import { maxWords } from '@/marketing/fields'

// Word limits on marketing copy (src/marketing/fields.ts).

describe('word limits', () => {
  const three = maxWords(3)
  it('count words, not separators', () => {
    expect(three('01 · Club colours', {} as never)).toBe(true)
    expect(three('One two three four', {} as never)).toMatch(/3 words/)
  })
  it('an empty optional field is fine; a required one is not', () => {
    expect(three('', {} as never)).toBe(true)
    expect(maxWords(3, true)('  ', {} as never)).toBe('This is required.')
  })
})
