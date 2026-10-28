import type { Payload } from 'payload'

/**
 * The page tree above the Pages list (plan part E): every page of one club, under its parent
 * page, in the same order the drop-downs use (position number, then A–Z). Built only from the
 * club's own pages; a parent that isn't one of them puts the page at the top level.
 */

export type PageStatus = 'published' | 'draft' | 'changed'

export type TreePage = {
  id: string
  title: string
  slug: string
  parentID: string | null
  position: number | null
  hidden: boolean
  /** published; draft (never published, visitors can't see it); changed (published, with
   * unpublished edits waiting). */
  status: PageStatus
}

export type TreeNode = TreePage & { children: TreeNode[] }

const byMenuOrder = (a: TreePage, b: TreePage) => {
  if (a.slug === 'home') return -1
  if (b.slug === 'home') return 1
  if (a.position !== null && b.position !== null && a.position !== b.position) {
    return a.position - b.position
  }
  if (a.position !== null && b.position === null) return -1
  if (a.position === null && b.position !== null) return 1
  return a.title.localeCompare(b.title, 'en-GB')
}

export const buildTree = (pages: TreePage[]): TreeNode[] => {
  const ids = new Set(pages.map((p) => p.id))
  const childrenOf = new Map<string | null, TreePage[]>()
  for (const page of pages) {
    const parent = page.parentID && ids.has(page.parentID) ? page.parentID : null
    childrenOf.set(parent, [...(childrenOf.get(parent) ?? []), page])
  }
  // `seen` guards against a loop (pages can't be saved that way, but never hang if one exists).
  const seen = new Set<string>()
  const grow = (parent: string | null): TreeNode[] =>
    (childrenOf.get(parent) ?? [])
      .filter((p) => !seen.has(p.id) && seen.add(p.id))
      .sort(byMenuOrder)
      .map((p) => ({ ...p, children: grow(p.id) }))
  return grow(null)
}

const idOf = (value: unknown): string | null => {
  if (!value) return null
  if (typeof value === 'object') return String((value as { id: unknown }).id)
  return String(value)
}

export const loadPageTree = async (payload: Payload, tenantID: string): Promise<TreeNode[]> => {
  const query = (draft: boolean) =>
    payload.find({
      collection: 'pages',
      where: { tenant: { equals: tenantID } },
      select: {
        title: true,
        slug: true,
        parent: true,
        menuPosition: true,
        hideFromMenu: true,
        _status: true,
      },
      draft,
      pagination: false,
      depth: 0,
      overrideAccess: true,
    })
  // The saved page (what visitors see once published) and its latest draft, if newer.
  const [saved, latest] = await Promise.all([query(false), query(true)])
  const latestStatus = new Map(latest.docs.map((d) => [String(d.id), d._status]))
  return buildTree(
    saved.docs.map((d) => {
      const published = d._status === 'published'
      return {
        id: String(d.id),
        title: String(d.title ?? 'Untitled'),
        slug: typeof d.slug === 'string' ? d.slug : '',
        parentID: idOf(d.parent),
        position: typeof d.menuPosition === 'number' ? d.menuPosition : null,
        hidden: Boolean(d.hideFromMenu),
        status: !published
          ? 'draft'
          : latestStatus.get(String(d.id)) === 'draft'
            ? 'changed'
            : 'published',
      }
    }),
  )
}
