'use client'

import { Children, type ReactNode, useState } from 'react'

import { PillTabs } from '../controls/interactive'
import { MarketingIcon } from '../MarketingIcon'

type Role = { id: string; tab: string; eyebrow: string; headline: string; points: string[] }

/**
 * The tabs and panels of Role Tabs. One panel shows at a time; the arrow keys move between tabs
 * (PillTabs). The pictures are drawn on the server and handed in as children, one per role, and
 * are hidden from screen readers: the points carry the meaning.
 */
export const RoleTabsClient = ({ roles, children }: { roles: Role[]; children: ReactNode }) => {
  const visuals = Children.toArray(children)
  const [active, setActive] = useState(0)
  return (
    <div className="mk-roles">
      <PillTabs label="Roles" tabs={roles.map((r) => r.tab)} onChange={setActive} />
      {roles.map((role, i) => (
        <section
          key={role.id}
          className="mk-roles-panel"
          aria-label={role.tab}
          hidden={i !== active}
        >
          <div className="mk-roles-copy">
            <p className="mk-roles-eyebrow">{role.eyebrow}</p>
            <h3 className="mk-roles-headline">{role.headline}</h3>
            <ul className="mk-roles-points">
              {role.points.map((point) => (
                <li key={point}>
                  <span className="mk-roles-tick">
                    <MarketingIcon name="check" size={20} />
                  </span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mk-roles-visual" aria-hidden="true">
            {visuals[i]}
          </div>
        </section>
      ))}
    </div>
  )
}
