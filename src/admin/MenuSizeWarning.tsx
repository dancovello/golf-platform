'use client'

import { useConfig, useFormFields } from '@payloadcms/ui'
import type { UIFieldClientProps } from 'payload'
import { useEffect, useState } from 'react'

import { idOf } from '@/blocks/types'

/** Drop-downs show 3 columns of 6 at most before they get unwieldy (spec 17). */
export const MENU_DROPDOWN_LIMIT = 18

/**
 * Inside each menu item in Club Settings: a warning when its drop-down has more than 18 links,
 * asking the editor to split the section up. Only a warning; the menu still saves and works.
 */
export const MenuSizeWarning = ({ path }: UIFieldClientProps) => {
  const row = path.slice(0, path.lastIndexOf('.'))
  const { config } = useConfig()
  const kind = useFormFields(([f]) => f[`${row}.kind`]?.value)
  const page = useFormFields(([f]) => idOf(f[`${row}.page`]?.value))
  const extra = useFormFields(([f]) => Number(f[`${row}.extraLinks`]?.value ?? 0))
  const chosen = useFormFields(([f]) => {
    let count = 0
    for (let g = 0; g < Number(f[`${row}.groups`]?.value ?? 0); g++)
      count += Number(f[`${row}.groups.${g}.links`]?.value ?? 0)
    return count
  })
  const [fetched, setFetched] = useState<{ page: string; count: number } | null>(null)

  useEffect(() => {
    if (kind !== 'children' || !page) return
    const query = new URLSearchParams({
      'where[parent][equals]': page,
      'where[hideFromMenu][not_equals]': 'true',
      'where[_status][equals]': 'published',
      limit: '0',
      depth: '0',
    })
    const controller = new AbortController()
    fetch(`${config.routes.api}/pages?${query}`, {
      credentials: 'include',
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((body: { totalDocs?: number } | null) =>
        setFetched({ page, count: body?.totalDocs ?? 0 }),
      )
      .catch(() => {})
    return () => controller.abort()
  }, [kind, page, config.routes.api])

  const childPages = fetched && fetched.page === page ? fetched.count : 0
  const links = kind === 'children' ? childPages + extra : kind === 'manual' ? chosen : 0
  if (links <= MENU_DROPDOWN_LIMIT) return null
  return (
    <div
      role="note"
      style={{
        margin: '0 0 1rem',
        padding: '0.75rem 1rem',
        border: '1px solid var(--theme-warning-500)',
        background: 'var(--theme-warning-100)',
        borderRadius: 4,
      }}
    >
      <strong>This drop-down has {links} links.</strong> Drop-downs show up to {MENU_DROPDOWN_LIMIT}{' '}
      neatly. Consider splitting this section into two menu items, or moving some pages under
      another section.
    </div>
  )
}
