import type { ClubSite } from '../loadClub'
import { ArrowRight } from './Icons'
import { linkTarget, siteHref } from './links'

/** The accent "Book a tee time" button (Figma Button / Accent). */
export const BookButton = ({
  club,
  base,
  short = false,
  arrow = true,
  className = '',
}: {
  club: ClubSite
  base: string
  short?: boolean
  arrow?: boolean
  className?: string
}) => {
  const booking = club.header.booking
  if (!booking) return null
  return (
    <a
      className={`sh-book t-label-button ${className}`}
      href={siteHref(base, booking.link)}
      {...linkTarget(booking.link)}
    >
      {short ? (
        'Book'
      ) : (
        <>
          <span className="sh-book-full">{booking.label}</span>
          {/* Shown instead of the full label where the desktop header is tight (header.css). */}
          <span className="sh-book-short">Book</span>
        </>
      )}
      {arrow ? <ArrowRight size={20} /> : null}
    </a>
  )
}
