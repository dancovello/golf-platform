'use client'

import { useEffect, useState } from 'react'

/**
 * A search query typed a letter at a time, held, then cleared and typed again. Shows the whole
 * query at once for visitors who prefer reduced motion. Decorative: its card is hidden from
 * screen readers.
 */
export const TypedQuery = ({ text }: { text: string }) => {
  const [shown, setShown] = useState(text.length)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let count = 0
    let timer: ReturnType<typeof setTimeout>
    const tick = () => {
      count = count > text.length + 30 ? 0 : count + 1
      setShown(Math.min(count, text.length))
      // Letters every 90ms; then the full query holds for about three seconds.
      timer = setTimeout(tick, count === 0 ? 600 : 90)
    }
    tick()
    return () => clearTimeout(timer)
  }, [text])

  return (
    <span className="mk-sc-query">
      {text.slice(0, shown)}
      <span className="mk-sc-caret" />
    </span>
  )
}
