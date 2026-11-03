/**
 * Pointing at a block in the admin's live preview: when you work in a block in the page
 * editor, the preview beside it scrolls to that block and outlines it.
 *
 * The editor (src/admin/BlockHighlighter.tsx) tells the preview which block (its position on
 * the page, from 0) with a message; the preview (src/site/components/BlockHighlight.tsx) finds
 * the block by the invisible marker that follows each block in the preview only
 * (RenderBlocks `live`). Markers go after the blocks, not around them, so the preview's layout
 * is exactly the live site's: the styles that treat the first block specially still apply.
 */
export const HIGHLIGHT_MESSAGE = 'golf-highlight-block'

export type HighlightMessage = { type: typeof HIGHLIGHT_MESSAGE; index: number | null }

export const isHighlightMessage = (data: unknown): data is HighlightMessage => {
  if (!data || typeof data !== 'object') return false
  const m = data as Record<string, unknown>
  return (
    m.type === HIGHLIGHT_MESSAGE &&
    (m.index === null || (typeof m.index === 'number' && Number.isInteger(m.index) && m.index >= 0))
  )
}

/** The attribute on the marker after block number `i`. */
export const MARKER_ATTRIBUTE = 'data-block-end'

/** The elements a block drew: everything between the previous block's marker (or the start)
 * and this block's own marker. Empty if the block drew nothing, or there is no such block. */
export const blockElements = (root: ParentNode, index: number): Element[] => {
  const end = root.querySelector(`template[${MARKER_ATTRIBUTE}="${index}"]`)
  if (!end) return []
  const previous =
    index > 0 ? root.querySelector(`template[${MARKER_ATTRIBUTE}="${index - 1}"]`) : null
  const found: Element[] = []
  let el = previous ? previous.nextElementSibling : (end.parentElement?.firstElementChild ?? null)
  while (el && el !== end) {
    if (!(el instanceof HTMLTemplateElement) && !el.classList.contains('visually-hidden')) {
      found.push(el)
    }
    el = el.nextElementSibling
  }
  return found
}
