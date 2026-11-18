'use client'

import { type ReactNode, useEffect } from 'react'

/**
 * Gives names to a few of Payload's own admin controls that screen readers announce as just
 * "checkbox" or "button" (system test QA-05). Payload draws them without a name, so this adds
 * one as they appear. It only ever adds a missing name or hides a duplicate tab stop; it never
 * changes what a control does. Renders its children untouched.
 */

const text = (el: Element | null | undefined) => el?.textContent?.replace(/\s+/g, ' ').trim() ?? ''

const nameOf = (el: HTMLElement): string => {
  if (el.matches('input[type="checkbox"]')) {
    const row = el.closest('tr')
    if (el.closest('thead')) return 'Select all rows'
    const cell = row?.querySelector('td:not(:first-child)')
    const label = text(cell)
    return label ? `Select ${label}` : 'Select row'
  }
  if (el.matches('.clickable-arrow--left')) return 'Previous'
  if (el.matches('.clickable-arrow--right')) return 'Next'
  if (el.matches('.popup-button')) return 'More actions'
  if (el.matches('input.rs__input, input[role="combobox"]')) {
    const field = el.closest('.field-type')
    return text(field?.querySelector('label')) || 'Choose an option'
  }
  return ''
}

const SELECTORS = [
  'input[type="checkbox"]',
  '.clickable-arrow',
  '.popup-button',
  'input.rs__input',
  'input[role="combobox"]',
].join(',')

const hasName = (el: HTMLElement) =>
  Boolean(
    el.getAttribute('aria-label')?.trim() ||
    el.getAttribute('aria-labelledby') ||
    text(el) ||
    (el instanceof HTMLInputElement && el.labels && el.labels.length > 0),
  )

const fix = (root: ParentNode) => {
  root.querySelectorAll<HTMLElement>(SELECTORS).forEach((el) => {
    if (hasName(el)) return
    const name = nameOf(el)
    if (name) el.setAttribute('aria-label', name)
  })
  // Hidden from screen readers but still a tab stop: take it out of the tab order.
  root
    .querySelectorAll<HTMLElement>('button[aria-hidden="true"]:not([tabindex="-1"])')
    .forEach((el) => el.setAttribute('tabindex', '-1'))
}

export const AccessibilityFixes = ({ children }: { children?: ReactNode }) => {
  useEffect(() => {
    let queued = false
    const run = () => {
      queued = false
      fix(document)
    }
    const observer = new MutationObserver(() => {
      if (queued) return
      queued = true
      window.requestAnimationFrame(run)
    })
    run()
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])
  return <>{children}</>
}
