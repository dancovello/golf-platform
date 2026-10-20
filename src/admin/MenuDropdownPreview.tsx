'use client'

import { useConfig, useFormFields } from '@payloadcms/ui'
import type { UIFieldClientProps } from 'payload'
import { type ReactNode, useEffect, useState } from 'react'

import { idOf } from '@/blocks/types'
import { COLUMN_LINK_LIMIT, MENU_DROPDOWN_LIMIT } from '@/site/menuLimits'

type Page = { id: string; title: string; parent?: unknown; _status?: string }

/**
 * Inside a menu item set to "Opens a drop-down of pages": what visitors will see, from the
 * pages chosen and their child pages, so editors don't have to save and look. Follows the
 * website's rules (src/site/loadClub.ts): published pages only, "Leave out of drop-downs"
 * respected, "Position" order then A–Z. Shown here only; it saves nothing.
 */
export const MenuDropdownPreview = ({ path }: UIFieldClientProps) => {
  const row = path.slice(0, path.lastIndexOf('.'))
  const { config } = useConfig()
  const ids = useFormFields(([f]) => {
    const count = Number(f[`${row}.sections`]?.value ?? 0)
    return Array.from({ length: count }, (_, i) => idOf(f[`${row}.sections.${i}.page`]?.value))
      .filter((id): id is string => Boolean(id))
      .join(',')
  })
  const [found, setFound] = useState<{ ids: string; chosen: Page[]; kids: Page[] } | null>(null)

  useEffect(() => {
    if (!ids) return
    const controller = new AbortController()
    const get = (params: Record<string, string>) =>
      fetch(`${config.routes.api}/pages?${new URLSearchParams({ depth: '0', ...params })}`, {
        credentials: 'include',
        signal: controller.signal,
      })
        .then((r) => (r.ok ? r.json() : { docs: [] }))
        .then((body: { docs?: Page[] }) => body.docs ?? [])
    Promise.all([
      get({
        'where[id][in]': ids,
        limit: '3',
        'select[title]': 'true',
        'select[_status]': 'true',
      }),
      get({
        'where[parent][in]': ids,
        'where[hideFromMenu][not_equals]': 'true',
        'where[_status][equals]': 'published',
        sort: 'menuPosition,title',
        limit: '200',
        'select[title]': 'true',
        'select[parent]': 'true',
      }),
    ])
      .then(([chosen, kids]) => setFound({ ids, chosen, kids }))
      .catch(() => {})
    return () => controller.abort()
  }, [ids, config.routes.api])

  const box = (children: ReactNode) => (
    <div
      role="note"
      style={{
        margin: '0 0 1.5rem',
        padding: '1rem',
        border: '1px solid var(--theme-elevation-150)',
        borderRadius: 4,
        background: 'var(--theme-elevation-50)',
      }}
    >
      <p style={{ margin: '0 0 0.75rem', fontWeight: 600 }}>What visitors will see</p>
      {children}
    </div>
  )
  if (!ids) return box(<p style={{ margin: 0 }}>Choose a page above.</p>)
  if (!found || found.ids !== ids) return box(<p style={{ margin: 0 }}>Loading…</p>)

  // In the order chosen; pages not yet published don't appear on the website.
  const order = ids.split(',')
  const pages = order.flatMap((id) => found.chosen.find((p) => String(p.id) === id) ?? [])
  const shown = pages.filter((p) => p._status === 'published')
  const hidden = pages.filter((p) => p._status !== 'published')
  const kidsOf = (id: string) => found.kids.filter((k) => idOf(k.parent) === id)
  const note = (text: string) => (
    <p style={{ margin: '0.75rem 0 0', color: 'var(--theme-elevation-600)' }}>{text}</p>
  )
  const notPublished =
    hidden.length > 0
      ? note(`Not on the website until published: ${hidden.map((p) => `“${p.title}”`).join(', ')}.`)
      : null
  const list = (items: string[]) => (
    <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
      {items.map((t, i) => (
        <li key={i}>{t}</li>
      ))}
    </ul>
  )

  if (shown.length === 0)
    return box(
      <>
        {note('Nothing yet.')}
        {notPublished}
      </>,
    )

  if (shown.length === 1) {
    const page = shown[0]!
    const kids = kidsOf(String(page.id))
    return box(
      <>
        <p style={{ margin: '0 0 0.5rem', fontWeight: 600 }}>{page.title}</p>
        {kids.length < 2
          ? note(
              `“${page.title}” has fewer than two child pages, so this menu item simply goes to it. To list pages here, choose “${page.title}” as their “Parent page”.`,
            )
          : list(kids.map((k) => k.title))}
        {kids.length > MENU_DROPDOWN_LIMIT
          ? note(
              `That’s ${kids.length} pages; drop-downs show up to ${MENU_DROPDOWN_LIMIT} neatly. Consider adding a second page above, so they split into columns.`,
            )
          : null}
        {notPublished}
      </>,
    )
  }

  return box(
    <>
      <div style={{ display: 'grid', gridAutoFlow: 'column', gridAutoColumns: '1fr', gap: '1rem' }}>
        {shown.map((page) => {
          const kids = kidsOf(String(page.id))
          return (
            <div key={page.id} style={{ minWidth: 0 }}>
              <p style={{ margin: '0 0 0.5rem', fontWeight: 600, textTransform: 'uppercase' }}>
                {page.title}
              </p>
              {kids.length === 0
                ? note('No child pages yet.')
                : list([
                    ...kids.slice(0, COLUMN_LINK_LIMIT).map((k) => k.title),
                    ...(kids.length > COLUMN_LINK_LIMIT ? [`All ${page.title} pages →`] : []),
                  ])}
            </div>
          )
        })}
      </div>
      {notPublished}
      {note('To change what’s listed under a page, set “Parent page” on each page.')}
    </>,
  )
}
