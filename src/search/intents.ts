import { searchWords } from './words'

// No server imports, so the rules can be tested on their own (tests/unit/search.spec.ts).

export type AnswerKind = 'fees' | 'status' | 'hours' | 'person' | 'event'

// ---------- What a search is asking for ----------

const has = (text: string, phrases: string[]) =>
  phrases.some((p) => new RegExp(`(^| )${p}( |$)`).test(text))

/** The kinds of answer a search's words ask for (spec §4). */
export const askedFor = (q: string): Set<AnswerKind> => {
  const words = searchWords(q)
  const text = words.join(' ')
  const found = new Set<AnswerKind>()
  if (
    has(text, ['course status', 'frost', 'frosty', 'buggy', 'buggies', 'trolley', 'trolleys']) ||
    (has(text, ['course']) && has(text, ['open', 'closed', 'shut', 'playable']))
  ) {
    found.add('status')
  }
  if (
    has(text, ['opening hours', 'opening times', 'hours', 'when does', 'what time']) ||
    (has(text, ['bar', 'shop', 'restaurant', 'clubhouse', 'office']) &&
      has(text, ['open', 'opens', 'close', 'closes']))
  ) {
    found.add('hours')
  }
  if (has(text, ['fee', 'fees', 'price', 'prices', 'cost', 'costs', 'how much', 'rates'])) {
    found.add('fees')
  }
  if (
    has(text, [
      'next event',
      'next comp',
      'next competition',
      'next medal',
      'whats on',
      'what s on',
      'medal',
    ])
  ) {
    found.add('event')
  }
  return found
}

/** Words that say what kind of thing is wanted rather than which one ("twilight green fees"). */
export const GENERIC = new Set([
  'green',
  'fee',
  'fees',
  'price',
  'prices',
  'rate',
  'rates',
  'cost',
  'costs',
  'how',
  'much',
  'golf',
  'round',
  'the',
  'for',
  'and',
  'what',
  'is',
])
