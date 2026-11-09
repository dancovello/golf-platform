'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

type Choice = 'accepted' | 'rejected'

/** The footer's "Cookie settings" button asks the banner to open with this event. */
export const OPEN_COOKIE_SETTINGS = 'club:open-cookie-settings'

const read = (key: string): Choice | null => {
  try {
    const v = window.localStorage.getItem(key)
    return v === 'accepted' || v === 'rejected' ? v : null
  } catch {
    return null
  }
}

const write = (key: string, choice: Choice) => {
  try {
    window.localStorage.setItem(key, choice)
  } catch {
    // Storage blocked: the choice lasts for this page only, and the banner asks again next time.
  }
}

/** Google Analytics' own cookies, removed when a visitor changes their mind. */
const clearGACookies = () => {
  const host = window.location.hostname
  const domains = ['', host, `.${host}`, `.${host.split('.').slice(-2).join('.')}`]
  for (const c of document.cookie.split(';')) {
    const name = c.split('=')[0]?.trim()
    if (!name || !(name === '_ga' || name.startsWith('_ga_') || name === '_gid')) continue
    for (const d of domains) {
      document.cookie = `${name}=; Max-Age=0; path=/${d ? `; domain=${d}` : ''}`
    }
  }
}

/**
 * The company site's golf ball intro marks <html data-intro>. The banner waits until the intro
 * has finished (or given up) so it never sits on top of the animation. Club sites have no such
 * mark, so for them this runs the callback straight away. Returns a way to stop waiting.
 */
const whenIntroIsOver = (run: () => void) => {
  const html = document.documentElement
  if (!html.hasAttribute('data-intro')) {
    run()
    return () => {}
  }
  const watcher = new MutationObserver(() => {
    if (html.hasAttribute('data-intro')) return
    watcher.disconnect()
    run()
  })
  watcher.observe(html, { attributes: true, attributeFilter: ['data-intro'] })
  return () => watcher.disconnect()
}

/** Adds Google Analytics to the page. Only ever called after the visitor accepts. */
const loadGA = (id: string) => {
  if (document.getElementById('club-ga')) return
  const w = window as unknown as { dataLayer: unknown[]; gtag: (...args: unknown[]) => void }
  w.dataLayer = w.dataLayer || []
  w.gtag = function gtag() {
    // gtag reads the `arguments` object itself, not an array.
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer.push(arguments)
  }
  w.gtag('js', new Date())
  w.gtag('config', id, { anonymize_ip: true })
  const script = document.createElement('script')
  script.id = 'club-ga'
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`
  document.head.appendChild(script)
}

/**
 * The cookie banner, on every page of a club that has a Google Analytics ID. Nothing from
 * Google loads until the visitor accepts. Accept and Reject are equally easy, and the
 * footer's "Cookie settings" button reopens the banner to change the choice.
 */
export const CookieConsent = ({
  gaID,
  storageKey,
  privacyHref,
}: {
  gaID: string
  /** Per club, because every club shares one address on staging. */
  storageKey: string
  privacyHref: string
}) => {
  const [open, setOpen] = useState(false)
  const heading = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    const choice = read(storageKey)
    let stopWaiting = () => {}
    if (choice === 'accepted') loadGA(gaID)
    // Shown after the page has loaded (and after the intro, on the company site), so the
    // server-drawn page never includes it.
    else if (choice === null) stopWaiting = whenIntroIsOver(() => setOpen(true))
    const reopen = () => setOpen(true)
    window.addEventListener(OPEN_COOKIE_SETTINGS, reopen)
    return () => {
      stopWaiting()
      window.removeEventListener(OPEN_COOKIE_SETTINGS, reopen)
    }
  }, [gaID, storageKey])

  useEffect(() => {
    if (open && read(storageKey) !== null) heading.current?.focus()
  }, [open, storageKey])

  const choose = useCallback(
    (choice: Choice) => {
      const before = read(storageKey)
      write(storageKey, choice)
      setOpen(false)
      if (choice === 'accepted') {
        loadGA(gaID)
      } else if (before === 'accepted') {
        // Google's script can't be unloaded, so start the page afresh without it.
        clearGACookies()
        window.location.reload()
      }
    },
    [gaID, storageKey],
  )

  if (!open) return null
  return (
    <section className="cc" aria-labelledby="cc-heading" data-testid="cookie-banner">
      <h2 id="cc-heading" className="t-heading-m cc-heading" tabIndex={-1} ref={heading}>
        Cookies
      </h2>
      <p className="t-body-s cc-text">
        We’d like to use Google Analytics cookies to understand how visitors use this site. They
        only run if you accept. Read more in our <a href={privacyHref}>privacy policy</a>.
      </p>
      <div className="cc-buttons">
        <button
          type="button"
          className="t-label-button cc-button"
          onClick={() => choose('accepted')}
        >
          Accept analytics cookies
        </button>
        <button
          type="button"
          className="t-label-button cc-button"
          onClick={() => choose('rejected')}
        >
          Reject analytics cookies
        </button>
      </div>
    </section>
  )
}

/** The footer's "Cookie settings" link: a button, because it opens the banner, not a page. */
export const CookieSettingsButton = ({ className }: { className?: string }) => (
  <button
    type="button"
    className={className}
    onClick={() => window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS))}
  >
    Cookie settings
  </button>
)
