'use client'

import { type ReactNode, useSyncExternalStore } from 'react'

const noSubscribe = () => () => {}

/**
 * An email link that never appears whole in the page's HTML, to limit scraping (Figma Team /
 * B note). The server sends the two halves separately; the "@" is drawn by CSS
 * (.protected-at) and the mailto link is only added once the page is running in a browser.
 */
export const ProtectedEmail = ({
  user,
  domain,
  className = '',
  children,
}: {
  user: string
  domain: string
  className?: string
  /** Shown instead of the address, e.g. "Email James". */
  children?: ReactNode
}) => {
  // True only in the browser, so the server's HTML never carries the whole address.
  const inBrowser = useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  )
  return (
    <a className={className} href={inBrowser ? `mailto:${user}@${domain}` : undefined}>
      {children ?? (
        <span className="protected-email">
          {user}
          <span className="protected-at" />
          {domain}
        </span>
      )}
    </a>
  )
}
