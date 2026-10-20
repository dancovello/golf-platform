import type { MapBlock as MapBlockData } from '@/payload-types'

import { ArrowRight, Clock, Mail, Phone } from '../components/Icons'
import type { ClubSite } from '../loadClub'
import { MapFrame } from './MapFrame'
import { StaticMap } from './StaticMap'
import { NEW_TAB } from '../components/links'

const MODE_NAMES: Record<string, string> = {
  car: 'By car',
  train: 'By train',
  air: 'By air',
  bus: 'By bus',
  walk: 'By bike or on foot',
}

/**
 * Map / Location (docs/design/11), three styles: A Split (map beside address and contact),
 * B Full-width (wide map, floating card), C Getting here (route cards above a map strip).
 * Address, phone, email and hours come from Club Settings; "Get directions" opens Google
 * Maps at the club's position; the interactive map loads only on request.
 */
export const MapBlock = ({ block, club }: { block: MapBlockData; club: ClubSite }) => {
  const style = block.style ?? 'split'
  const { latitude: lat, longitude: lon, mapLabel, what3words } = club.location
  const hasPosition = lat !== null && lon !== null
  const directions = hasPosition
    ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`
    : club.footer.directions
  const embed = hasPosition
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.012},${lat - 0.006},${lon + 0.012},${lat + 0.006}&layer=mapnik&marker=${lat},${lon}`
    : null
  const phone = club.header.phone
  const hours = club.footer.hours[0]
  const address = club.footer.address
  const mapTitle = `Map showing ${club.name}${address ? ` at ${address.replace(/\n/g, ', ')}` : ''}`

  const contact = (
    <ul className="map-contact t-body-s">
      {phone ? (
        <li>
          <Phone /> <a href={`tel:${phone.replace(/[^+0-9]/g, '')}`}>{phone}</a>
        </li>
      ) : null}
      {club.footer.email && style === 'split' ? (
        <li>
          <Mail /> <a href={`mailto:${club.footer.email}`}>{club.footer.email}</a>
        </li>
      ) : null}
      {hours ? (
        <li>
          <Clock /> {hours.place} {hours.times}
        </li>
      ) : null}
    </ul>
  )

  const directionsButton = (variant: 'outline' | 'accent') =>
    directions ? (
      <a
        className={`btn btn-${variant} t-label-button map-directions`}
        href={directions}
        {...NEW_TAB}
      >
        Get directions <ArrowRight />
      </a>
    ) : null

  const heading = (
    <>
      {block.eyebrow ? <p className="t-eyebrow blk-eyebrow">{block.eyebrow}</p> : null}
      <h2
        className={`${style === 'fullBleed' ? 't-heading-m' : 't-heading-l'} blk-heading map-heading`}
      >
        {block.heading}
      </h2>
    </>
  )

  if (style === 'fullBleed') {
    return (
      <section className="map map-full">
        <MapFrame embedURL={embed} title={mapTitle} className="map-full-frame">
          <StaticMap label={mapLabel} pinX={0.6} />
        </MapFrame>
        <div className="map-full-card-wrap">
          <div className="map-card">
            {heading}
            {address ? (
              <p className="t-body-s map-address">{address.replace(/\n/g, ', ')}</p>
            ) : null}
            {contact}
            {directionsButton('accent')}
          </div>
        </div>
      </section>
    )
  }

  if (style === 'gettingHere') {
    const routes = block.routes ?? []
    return (
      <section className="blk map map-here on-subtle">
        <div className="blk-container">
          <div className="blk-header">
            <div>{heading}</div>
            {directions ? (
              <a className="btn btn-outline t-label-button" href={directions} {...NEW_TAB}>
                Get directions <ArrowRight />
              </a>
            ) : null}
          </div>
          {routes.length > 0 ? (
            <ul className={`map-routes cols-${Math.min(routes.length, 3)}`}>
              {routes.map((r, i) => (
                <li key={i} className="map-route">
                  <h3 className="t-heading-m">{MODE_NAMES[r.mode] ?? r.mode}</h3>
                  <p className="t-body-s map-route-text">{r.directions}</p>
                  {r.distance ? (
                    <p className="t-label-s map-route-distance">
                      <Clock /> {r.distance}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
          <MapFrame embedURL={embed} title={mapTitle} className="map-strip">
            <StaticMap label={mapLabel} />
          </MapFrame>
        </div>
      </section>
    )
  }

  return (
    <section className="blk map map-split">
      <div className="blk-container map-split-grid">
        <MapFrame embedURL={embed} title={mapTitle} className="map-split-frame">
          <StaticMap label={mapLabel} />
        </MapFrame>
        <div className="map-info">
          {heading}
          {address ? <p className="t-body-m map-address map-address-lines">{address}</p> : null}
          {contact}
          <div className="map-actions">
            {directionsButton('outline')}
            {what3words ? (
              <a
                className="btn btn-link t-label-button"
                href={`https://what3words.com/${what3words}`}
                {...NEW_TAB}
              >
                what3words <ArrowRight />
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
