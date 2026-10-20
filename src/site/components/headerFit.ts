/**
 * Switches a computer-width header to the phone header (logo, Book, menu button) when its row
 * doesn't fit: a long menu, long labels or a wide logo. It goes by what's actually there, so
 * six short items can stay a full menu while four long ones switch.
 *
 * Runs as a small inline script straight after the header (SiteHeader), before the page is
 * first drawn, so the broken row never flashes up. It sets data-compact on the header and the
 * CSS (header.css) does the rest; without JavaScript the header falls back to the 1024px rule.
 *
 * The full row stays laid out, invisibly, while the phone header shows, so it can be measured
 * again whenever the window, fonts or logo change size. Labels never wrap (header.css), so a
 * row that doesn't fit overflows instead of growing taller, and that overflow is what's checked.
 *
 * Inlined with toString(), so it must use nothing from outside the function.
 */
export function fitHeader(header: HTMLElement | null) {
  const row = header?.querySelector<HTMLElement>('.sh-desktop .sh-row')
  if (!header || !row) return
  const wide = window.matchMedia('(min-width: 1024px)')
  const check = () => {
    // Below 1024px the CSS already shows the phone header, and the row isn't laid out.
    const compact = wide.matches && row.scrollWidth > row.clientWidth + 1
    if (header.dataset.compact !== String(compact)) header.dataset.compact = String(compact)
  }
  check()
  if (typeof ResizeObserver === 'function') {
    const observer = new ResizeObserver(check)
    observer.observe(row)
    // Each part of the row, as each can grow: the menu once its font loads, the logo once its
    // picture does.
    row.querySelectorAll(':scope > *, .sh-cell-end > *, .sh-appbar-left > *').forEach((el) => {
      observer.observe(el)
    })
  }
  wide.addEventListener('change', check)
}

/** The script SiteHeader puts straight after the header. */
export const fitHeaderScript = (headerId: string) =>
  `(${fitHeader.toString()})(document.getElementById(${JSON.stringify(headerId)}))`
