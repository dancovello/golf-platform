import { ChevronLeft, ChevronRight } from '../components/Icons'

/** Page numbers to show: first, last, and the current one with its neighbours; gaps as "…". */
const pageList = (page: number, pages: number): (number | '…')[] => {
  const wanted = new Set([1, pages, page - 1, page, page + 1].filter((n) => n >= 1 && n <= pages))
  const sorted = [...wanted].sort((a, b) => a - b)
  const out: (number | '…')[] = []
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) out.push('…')
    out.push(n)
  })
  return out
}

/** Figma "Pagination": numbered on desktop (44px targets), "Page n of m" on phones. */
export const Pagination = ({
  page,
  pages,
  href,
}: {
  page: number
  pages: number
  href: (page: number) => string
}) =>
  pages <= 1 ? null : (
    <nav className="pagination" aria-label="Pagination">
      {page > 1 ? (
        <a className="pagination-step t-label-button" href={href(page - 1)} rel="prev">
          <ChevronLeft size={18} /> <span className="pagination-word">Previous</span>
        </a>
      ) : (
        <span className="pagination-step is-disabled t-label-button" aria-hidden="true">
          <ChevronLeft size={18} /> <span className="pagination-word">Previous</span>
        </span>
      )}
      <ol className="pagination-pages t-body-s">
        {pageList(page, pages).map((n, i) =>
          n === '…' ? (
            <li key={`gap-${i}`} aria-hidden="true">
              …
            </li>
          ) : (
            <li key={n}>
              <a
                href={href(n)}
                aria-current={n === page ? 'page' : undefined}
                aria-label={`Page ${n}`}
              >
                {n}
              </a>
            </li>
          ),
        )}
      </ol>
      <span className="pagination-count t-body-s">
        Page {page} of {pages}
      </span>
      {page < pages ? (
        <a className="pagination-step t-label-button" href={href(page + 1)} rel="next">
          <span className="pagination-word">Next</span> <ChevronRight size={18} />
        </a>
      ) : (
        <span className="pagination-step is-disabled t-label-button" aria-hidden="true">
          <span className="pagination-word">Next</span> <ChevronRight size={18} />
        </span>
      )}
    </nav>
  )
