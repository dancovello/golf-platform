'use client'

import Script from 'next/script'
import { useEffect, useRef, useState } from 'react'

type TurnstileAPI = {
  render: (el: HTMLElement, options: Record<string, unknown>) => string
  reset: (id: string) => void
  remove: (id: string) => void
}
declare global {
  interface Window {
    turnstile?: TurnstileAPI
  }
}

/**
 * Cloudflare's "are you a person?" check (src/site/contact/turnstile.ts). Most visitors never
 * see it; it only asks for a click when unsure. Its answer goes in the hidden `turnstile` field
 * of the form `formID`. While the page stays open Cloudflare renews the answer before it
 * expires (5 minutes). An answer works once, so a new `restartKey` starts the check again.
 */
export const TurnstileCheck = ({
  siteKey,
  action,
  formID,
  restartKey,
}: {
  siteKey: string
  action: string
  formID: string
  restartKey: number | null
}) => {
  const box = useRef<HTMLDivElement>(null)
  const widget = useRef<string | null>(null)
  const [token, setToken] = useState('')
  const [loaded, setLoaded] = useState(
    () => typeof window !== 'undefined' && Boolean(window.turnstile),
  )

  useEffect(() => {
    if (!loaded || !box.current || !window.turnstile) return
    const id = window.turnstile.render(box.current, {
      sitekey: siteKey,
      action,
      appearance: 'interaction-only',
      callback: (t: string) => setToken(t),
      'expired-callback': () => setToken(''),
      'error-callback': () => setToken(''),
    })
    widget.current = id
    return () => {
      widget.current = null
      window.turnstile?.remove(id)
    }
  }, [loaded, siteKey, action])

  useEffect(() => {
    if (restartKey === null || !widget.current) return
    setToken('')
    window.turnstile?.reset(widget.current)
  }, [restartKey])

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={() => setLoaded(true)}
      />
      <div ref={box} className="cf-turnstile-box" />
      <input type="hidden" name="turnstile" form={formID} value={token} />
    </>
  )
}
