import type { MarketingRoleTabsBlock } from '@/payload-types'

import { FeatureVisual } from '../builder/FeatureShowcase'
import { RoleTabsClient } from './RoleTabsClient'

/**
 * Marketing/Role Tabs (351:2029): benefits by role. The tabs switch the panel; each panel is an
 * outcome headline, three points and one of the club site's real features, drawn with the same
 * pictures as the feature showcase (so the two always agree with what the site does).
 */
export const RoleTabs = ({ block }: { block: MarketingRoleTabsBlock }) => (
  <RoleTabsClient
    roles={block.roles.map((role) => ({
      id: role.id ?? role.tab,
      tab: role.tab,
      eyebrow: role.eyebrow,
      headline: role.headline,
      points: (role.points ?? []).map((p) => p.text),
    }))}
  >
    {block.roles.map((role) => (
      <FeatureVisual key={role.id ?? role.tab} feature={role.visual} />
    ))}
  </RoleTabsClient>
)
