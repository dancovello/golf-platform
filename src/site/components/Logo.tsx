import type { ClubSite } from '../loadClub'

/** The club's logo, or its name set in the heading font with the strapline beneath. */
export const Logo = ({
  club,
  onDark = false,
  compact = false,
}: {
  club: ClubSite
  onDark?: boolean
  compact?: boolean
}) => {
  const image = onDark ? (club.logoOnDark ?? null) : (club.logoOnLight ?? null)
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- R2 files, sized by CSS
      <img
        className={`sh-logo-img${compact ? ' is-compact' : ''}`}
        src={image.url}
        alt={club.name}
      />
    )
  }
  return (
    <span className={`sh-wordmark${compact ? ' is-compact' : ''}`}>
      <span className="sh-wordmark-name">{club.name}</span>
      {club.strapline ? <span className="sh-wordmark-strapline">{club.strapline}</span> : null}
    </span>
  )
}
