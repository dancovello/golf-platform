import type { Metadata } from 'next'

import type { ResolvedSite } from '@/site/resolveSite'

/**
 * The tab icon: the club's own logo, from the photo storage the security policy already allows.
 * Without one on the page, browsers ask for /favicon.ico by themselves, which doesn't exist on
 * these addresses (on the platform's own address it is forwarded to another address, which the
 * security policy then reports as a blocked image). Pages without a logo get the neutral icon
 * from the root layout instead.
 */
export const clubIcon = (site: ResolvedSite): Metadata =>
  site.club.logoOnLight?.url ? { icons: { icon: site.club.logoOnLight.url } } : {}
