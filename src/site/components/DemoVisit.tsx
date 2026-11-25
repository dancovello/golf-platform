'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

import { noteDemoVisit } from '../demoVisitActions'

/**
 * On a prospect demo, tells the server each time a page opens, so Dan can see the link was
 * used (src/site/demoVisits.ts). Sends only the page address. Draws nothing.
 */
export const DemoVisit = ({ address }: { address: string }) => {
  const pathname = usePathname()
  useEffect(() => {
    void noteDemoVisit(address, pathname)
  }, [address, pathname])
  return null
}
