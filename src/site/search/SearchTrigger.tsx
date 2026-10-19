'use client'

import { Search } from '../components/Icons'
import { openSearch } from './events'

/**
 * The header's search button. A link to the results page, so it works before the page's script
 * has loaded; once it has, it opens the search panel instead.
 */
export const SearchTrigger = ({ base, className = '' }: { base: string; className?: string }) => (
  <a
    className={`sh-search ${className}`}
    href={`${base}/search`}
    aria-haspopup="dialog"
    aria-keyshortcuts="/"
    onClick={(e) => {
      e.preventDefault()
      openSearch()
    }}
  >
    <Search size={20} />
    <span className="srch-visually-hidden">Search</span>
  </a>
)
