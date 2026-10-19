import { MAX_QUERY } from '@/search/words'

import { Search } from '../components/Icons'

/**
 * Figma "Search/Field", Compact: a small search box that opens the results page (the 404 page;
 * the header panel comes with its own). A plain form, so it works without JavaScript.
 */
export const CompactSearch = ({
  base,
  id,
  className = '',
}: {
  base: string
  id: string
  className?: string
}) => (
  <form
    className={`srch-compact ${className}`}
    role="search"
    action={`${base}/search`}
    method="get"
  >
    <Search size={16} />
    <label className="srch-visually-hidden" htmlFor={id}>
      Search the site
    </label>
    <input
      id={id}
      className="t-body-s"
      type="search"
      name="q"
      placeholder="Search the site"
      maxLength={MAX_QUERY}
      autoComplete="off"
      enterKeyHint="search"
    />
    <button className="srch-visually-hidden" type="submit">
      Search
    </button>
  </form>
)
