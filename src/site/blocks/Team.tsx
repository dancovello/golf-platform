import { STAFF_DEPARTMENTS } from '@/collections/staffDepartments'
import type { TeamBlock } from '@/payload-types'

import { Button } from '../components/Button'
import { ArrowRight } from '../components/Icons'
import { Paragraphs, TextLink } from './parts'
import { ProtectedEmail } from './ProtectedEmail'
import type { BlockContext, SitePerson } from './resolve'
import { TeamGrid } from './TeamGrid'
import { ContactLinks, Portrait } from './teamShared'

/** A compact row: avatar, name and role (directory and the featured side list). */
const PersonRow = ({ person, children }: { person: SitePerson; children?: React.ReactNode }) => (
  <li className="team-row">
    <Portrait person={person} shape="avatar" />
    <div className="team-row-text">
      <p className="t-data-sans team-row-name">{person.name}</p>
      <p className="t-body-s team-row-role">{person.role}</p>
      {children}
    </div>
  </li>
)

/**
 * Team / Staff (docs/design/11), three styles: A Grid (portraits; a bio opens a profile),
 * B Directory (who to contact, grouped by department, with direct phone and email) and
 * C Featured (one lead person with bio and actions, the rest listed beside them).
 * People come from the club's Team & staff list; anyone not found is left out.
 */
export const Team = ({
  block,
  ctx,
  base,
}: {
  block: TeamBlock
  ctx: BlockContext
  base: string
}) => {
  const style = block.style ?? 'grid'
  const people = (block.people ?? [])
    .map((p) => ctx.person(p))
    .filter((p): p is SitePerson => p !== null)
  const action = ctx.link(block.action)

  const heading = (
    <div>
      {block.eyebrow ? <p className="t-eyebrow blk-eyebrow">{block.eyebrow}</p> : null}
      <h2 className="t-heading-l blk-heading">{block.heading}</h2>
    </div>
  )

  if (style === 'directory') {
    if (people.length === 0) return null
    const groups = STAFF_DEPARTMENTS.map((d) => ({
      ...d,
      people: people.filter((p) => p.department === d.value),
    })).filter((g) => g.people.length > 0)
    return (
      <section className="blk team team-directory on-subtle">
        <div className="blk-container">
          <div className="blk-header">
            {heading}
            {action ? (
              <Button label={action.label} link={action.link} base={base} style="outline" arrow />
            ) : null}
          </div>
          {groups.map((g) => (
            <div key={g.value} className="team-department">
              <h3 className="t-heading-m team-department-name">{g.label}</h3>
              <ul className="team-department-people">
                {g.people.map((p) => (
                  <PersonRow key={p.id} person={p}>
                    <ContactLinks person={p} />
                  </PersonRow>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (style === 'featured') {
    const lead = ctx.person(block.featured)
    if (!lead) return null
    const others = people.filter((p) => p.id !== lead.id).slice(0, 4)
    const email = lead.email
    const viewAll = ctx.link(block.viewAll)
    return (
      <section className="blk team team-featured">
        <div className="blk-container">
          <div className="blk-header">{heading}</div>
          <div className="team-featured-layout">
            <div className="team-featured-main">
              <Portrait person={lead} shape="card" sizes="(max-width: 1023px) 100vw, 360px" />
              <div className="team-featured-text">
                <p className="t-data-label team-featured-tag">{lead.role}</p>
                <h3 className="t-heading-l">{lead.name}</h3>
                <div className="team-bio">
                  <Paragraphs text={lead.bio} className="t-body-l" />
                </div>
                {action || email ? (
                  <div className="team-featured-actions">
                    {action ? (
                      <Button
                        label={action.label}
                        link={action.link}
                        base={base}
                        style="solid"
                        arrow
                      />
                    ) : null}
                    {email ? (
                      <ProtectedEmail
                        user={email.user}
                        domain={email.domain}
                        className="btn btn-link t-label-button"
                      >
                        Email {lead.name.trim().split(/\s+/)[0]} <ArrowRight />
                      </ProtectedEmail>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
            {others.length > 0 || viewAll ? (
              <div className="team-featured-side">
                <ul className="team-side-list">
                  {others.map((p) => (
                    <PersonRow key={p.id} person={p} />
                  ))}
                </ul>
                <TextLink link={viewAll} base={base} />
              </div>
            ) : null}
          </div>
        </div>
      </section>
    )
  }

  if (people.length === 0) return null
  return (
    <section className="blk team team-grid-block">
      <div className="blk-container">
        <div className="blk-header">{heading}</div>
        <TeamGrid people={people} />
      </div>
    </section>
  )
}
