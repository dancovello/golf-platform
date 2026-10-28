import type { StaticImageData } from 'next/image'

import heathland640 from './photos/heathland-640.webp'
import heathland1200 from './photos/heathland-1200.webp'
import heathland1600 from './photos/heathland-1600.webp'
import lakeside640 from './photos/lakeside-640.webp'
import lakeside1200 from './photos/lakeside-1200.webp'
import lakeside1500 from './photos/lakeside-1500.webp'
import links640 from './photos/links-640.webp'
import links1200 from './photos/links-1200.webp'
import links1600 from './photos/links-1600.webp'
import links2000 from './photos/links-2000.webp'
import parkland640 from './photos/parkland-640.webp'
import parkland1200 from './photos/parkland-1200.webp'

/**
 * The marketing site's demo pictures: real golf course photos, from the club Photos library on
 * staging (Dan, 28 Oct). Resized copies live next to the code, so a demo never depends on the
 * database. Imported (not put in /public) so they get built-in addresses the site's routing
 * leaves alone. Image licences are unconfirmed (open question N5): clear them before production.
 */
export type DemoPhotoKey = 'heathland' | 'links' | 'lakeside' | 'parkland'

type DemoPhoto = {
  alt: string
  /** CSS object-position: keeps the interesting part in view when the photo is cropped. */
  position: string
  /** Smallest first; the largest is the one used as the plain `src`. */
  sizes: StaticImageData[]
}

export const DEMO_PHOTOS: Record<DemoPhotoKey, DemoPhoto> = {
  heathland: {
    alt: 'Demo club: a fairway through pines and heather',
    position: '50% 55%',
    sizes: [heathland640, heathland1200, heathland1600],
  },
  links: {
    alt: 'Demo club: a links course above the estuary',
    position: '50% 60%',
    sizes: [links640, links1200, links1600, links2000],
  },
  lakeside: {
    alt: 'Demo club: a green and bunker among pines, beside a lake',
    position: '50% 65%',
    sizes: [lakeside640, lakeside1200, lakeside1500],
  },
  parkland: {
    alt: 'Demo club: a parkland green and bunker below the clubhouse',
    position: '50% 55%',
    sizes: [parkland640, parkland1200],
  },
}

export const isDemoPhotoKey = (key: string): key is DemoPhotoKey => key in DEMO_PHOTOS
