import { DEMO_CLUBS } from './clubs'
import { DemoHero } from './DemoHero'
import { TenantMorphSwitcher } from './TenantMorphSwitcher'

/**
 * Marketing/Tenant Morph (176:2177): one live hero block, re-skinned per demo club. The three
 * frames are drawn on the server; TenantMorphSwitcher shows one at a time.
 */
export const TenantMorph = () => (
  <TenantMorphSwitcher
    clubs={DEMO_CLUBS.map((club) => ({ name: club.name, style: club.style, swatch: club.swatch }))}
  >
    {DEMO_CLUBS.map((club) => (
      <DemoHero key={club.id} club={club} />
    ))}
  </TenantMorphSwitcher>
)
