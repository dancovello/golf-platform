import { Mail, Phone } from '../components/Icons'
import { Photo } from './parts'
import { ProtectedEmail } from './ProtectedEmail'
import type { SitePerson } from './resolve'

/** "James Morrison" → "JM". */
export const initials = (name: string) => {
  const words = name.trim().split(/\s+/).filter(Boolean)
  const first = words[0]?.[0] ?? ''
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? '') : ''
  return (first + last).toUpperCase()
}

/**
 * Figma "Portrait": Card (4:5, grid and featured) or Avatar (56 circle). With no photo the
 * person's initials are shown instead, so a missing photo never breaks the layout.
 */
export const Portrait = ({
  person,
  shape,
  sizes = '56px',
}: {
  person: SitePerson
  shape: 'card' | 'avatar'
  sizes?: string
}) => (
  <div className={`team-portrait is-${shape}`}>
    {person.photo ? (
      <Photo image={person.photo} sizes={sizes} alt="" />
    ) : (
      <span className={shape === 'card' ? 't-display-xl' : 't-data-sans'} aria-hidden="true">
        {initials(person.name)}
      </span>
    )}
  </div>
)

export const telHref = (phone: string) => `tel:${phone.replace(/[^+0-9]/g, '')}`

/** Direct phone and email, each with its icon. */
export const ContactLinks = ({
  person,
  className = '',
}: {
  person: SitePerson
  className?: string
}) => {
  const email = person.email
  if (!person.phone && !email) return null
  return (
    <ul className={`team-contacts ${className}`}>
      {person.phone ? (
        <li>
          <Phone />
          <a href={telHref(person.phone)}>{person.phone}</a>
        </li>
      ) : null}
      {email ? (
        <li>
          <Mail />
          <ProtectedEmail user={email.user} domain={email.domain} />
        </li>
      ) : null}
    </ul>
  )
}
