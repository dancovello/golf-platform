'use server'

import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import { CLUB_HOST_HEADER } from './resolveSite'
import { recordDemoVisit } from './demoVisits'

/**
 * Called by a prospect demo page once it has opened in a browser (src/site/components/
 * DemoVisit.tsx). Demos live only on the platform's own address, so a call through a club's
 * address is ignored. It never fails out loud: a visit that can't be saved is simply not
 * counted, and the visitor never notices.
 */
export async function noteDemoVisit(address: string, pathname: string): Promise<void> {
  try {
    if ((await headers()).get(CLUB_HOST_HEADER)) return
    await recordDemoVisit(await getPayload({ config }), address, pathname)
  } catch {
    // Not counting one visit is better than showing a visitor an error.
  }
}
