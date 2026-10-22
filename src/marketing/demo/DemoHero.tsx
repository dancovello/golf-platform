import { Hero } from '@/site/blocks/Hero'

import { type DemoClub, demoClubSite, demoContext } from './clubs'
import { DemoFrame } from './DemoFrame'

/** A demo club's home page hero: the real Hero block, in that club's style and colours. */
export const DemoHero = ({ club }: { club: DemoClub }) => (
  <DemoFrame club={club} label={`${club.name}’s home page`} height={880}>
    <Hero block={club.hero} ctx={demoContext()} club={demoClubSite(club)} base="" />
  </DemoFrame>
)
