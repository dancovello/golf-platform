import { Fragment } from 'react'

import { wordMatcher } from '@/search/words'

/**
 * Text with the searched words set in a heavier weight (spec §5: weight, not colour alone).
 * Used on the server and in the header panel.
 */
export const Highlight = ({ text, words }: { text: string; words: string[] }) => {
  if (words.length === 0) return <>{text}</>
  const pattern = wordMatcher(words, 'giu')
  const parts: { text: string; hit: boolean }[] = []
  let last = 0
  for (const match of text.matchAll(pattern)) {
    // The match starts with the character before the word (or nothing at the very start).
    const start = (match.index ?? 0) + match[1].length
    const end = (match.index ?? 0) + match[0].length
    if (start > last) parts.push({ text: text.slice(last, start), hit: false })
    parts.push({ text: text.slice(start, end), hit: true })
    last = end
  }
  if (last < text.length) parts.push({ text: text.slice(last), hit: false })
  return (
    <>
      {parts.map((p, i) =>
        p.hit ? (
          <strong key={i} className="srch-hit">
            {p.text}
          </strong>
        ) : (
          <Fragment key={i}>{p.text}</Fragment>
        ),
      )}
    </>
  )
}
