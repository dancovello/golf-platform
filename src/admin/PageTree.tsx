import { getTenantFromCookie } from '@payloadcms/plugin-multi-tenant/utilities'
import { headers } from 'next/headers'
import Link from 'next/link'
import type { ServerProps } from 'payload'

import { editorTenantID, isSuperAdmin } from '../access/roles'

import { loadPageTree, type PageStatus, type TreeNode } from './pageTreeData'

const STATUS: Record<PageStatus, { label: string; colour: string }> = {
  published: { label: 'Published', colour: 'var(--theme-success-500)' },
  changed: { label: 'Published, with unpublished changes', colour: 'var(--theme-warning-500)' },
  draft: { label: 'Draft: visitors can’t see it', colour: 'var(--theme-elevation-500)' },
}

const Branch = ({ nodes, top = false }: { nodes: TreeNode[]; top?: boolean }) => (
  <ul
    style={{
      listStyle: 'none',
      margin: 0,
      paddingLeft: top ? 0 : '1.5rem',
      borderLeft: top ? 'none' : '1px solid var(--theme-elevation-150)',
      display: 'grid',
      gap: '0.35rem',
    }}
  >
    {nodes.map((page) => (
      <li key={page.id}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'baseline' }}>
          <Link href={`/admin/collections/pages/${page.id}`}>{page.title}</Link>
          <span style={{ color: 'var(--theme-elevation-500)', fontSize: '0.875em' }}>
            {page.slug ? `/${page.slug === 'home' ? '' : page.slug}` : 'no address yet'}
          </span>
          <span style={{ fontSize: '0.875em', color: STATUS[page.status].colour }}>
            · {STATUS[page.status].label}
          </span>
          {page.hidden ? (
            <span style={{ fontSize: '0.875em', color: 'var(--theme-elevation-500)' }}>
              · left out of drop-downs
            </span>
          ) : null}
        </div>
        {page.children.length > 0 ? (
          <div style={{ marginTop: '0.35rem' }}>
            <Branch nodes={page.children} />
          </div>
        ) : null}
      </li>
    ))}
  </ul>
)

/**
 * Above the Pages list: the club's pages as a tree, under their parent pages (plan part E,
 * from Dan's dashboard review). To move a page, open it and change "Parent page".
 */
export const PageTree = async ({ payload, user }: ServerProps) => {
  if (!user) return null
  const tenantID = isSuperAdmin(user)
    ? (getTenantFromCookie(await headers(), 'text') as string | null)
    : editorTenantID(user)
  if (!tenantID) {
    return (
      <p style={{ margin: '0 0 1.5rem' }}>
        Pick a club in the club selector to see its pages as a tree.
      </p>
    )
  }
  const tree = await loadPageTree(payload, tenantID)
  if (tree.length === 0) return null
  return (
    <details open style={{ margin: '0 0 2rem' }}>
      <summary style={{ cursor: 'pointer', fontWeight: 600, marginBottom: '0.75rem' }}>
        Your pages, as they sit on the site
      </summary>
      <p style={{ margin: '0 0 1rem', color: 'var(--theme-elevation-500)' }}>
        To move a page, open it and change “Parent page”. Drop-downs list a page’s child pages in
        this order.
      </p>
      <Branch nodes={tree} top />
    </details>
  )
}
