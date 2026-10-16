'use client'

import { useState, useSyncExternalStore } from 'react'

import { ArrowRight } from '../components/Icons'

const noSubscribe = () => () => {}

/**
 * "Share" on an article (Figma "News post"): the phone's own share sheet where there is one,
 * otherwise the address is copied and the button says so. Needs JavaScript, so it only
 * appears once the page is running.
 */
export const ShareLink = ({ title }: { title: string }) => {
  const [copied, setCopied] = useState(false)
  const inBrowser = useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  )
  if (!inBrowser) return null

  const share = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title, url })
      } catch {
        // Closing the share sheet is not an error.
      }
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch {
      window.prompt('Copy this link', url)
    }
  }

  return (
    <button type="button" className="btn btn-link t-label-button news-link" onClick={share}>
      <span aria-live="polite">{copied ? 'Link copied' : 'Share'}</span> <ArrowRight />
    </button>
  )
}
