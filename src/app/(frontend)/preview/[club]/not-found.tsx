import { headers } from 'next/headers'

import { PageNotFound } from '@/site/components/PageNotFound'
import { loadClubBySlug } from '@/site/loadClub'
import { sitePreviewEnabled } from '@/site/preview'

import { ClubShell } from './ClubShell'

/**
 * A missing page on a club's site: the club's own header, footer and links (the address comes
 * from src/proxy.ts). If the club itself doesn't exist, or previews are off, a plain message
 * that says nothing about which clubs exist.
 */
export default async function ClubNotFound() {
  const path = (await headers()).get('x-pathname') ?? ''
  const slug = /^\/preview\/([a-z0-9-]+)/.exec(path)?.[1]
  const club = slug && sitePreviewEnabled() ? await loadClubBySlug(slug) : null
  if (!club) {
    return (
      <main style={{ padding: '96px 24px', fontFamily: 'system-ui, sans-serif' }}>
        <h1>Page not found</h1>
      </main>
    )
  }
  const base = `/preview/${club.slug}`
  return (
    <ClubShell club={club} currentPath={path}>
      <PageNotFound club={club} base={base} />
    </ClubShell>
  )
}
