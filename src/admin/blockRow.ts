/** Which block of the page's content the cursor is in, from the element that was clicked or
 * focused: Payload gives each block row the id "layout-row-<position>". Null when it is
 * outside every block. Only the page's own blocks count, not rows inside a block. */
export const blockIndexOf = (target: EventTarget | null): number | null => {
  for (let el = target instanceof Element ? target : null; el; el = el.parentElement) {
    const match = /^layout-row-(\d+)$/.exec(el.id)
    if (match) return Number(match[1])
  }
  return null
}
