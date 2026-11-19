import type { StaticImageData } from 'next/image'

import heathland640 from './photos/heathland-640.webp'
import heathland1024 from './photos/heathland-1024.webp'
import lakeside640 from './photos/lakeside-640.webp'
import lakeside1024 from './photos/lakeside-1024.webp'
import links640 from './photos/links-640.webp'
import links1024 from './photos/links-1024.webp'
import parkland640 from './photos/parkland-640.webp'
import parkland1024 from './photos/parkland-1024.webp'

/**
 * The marketing site's demo pictures: free-to-use Unsplash photos Dan chose (19 Nov 2026), so
 * the mockups never show an image with an unclear licence. Photographers' names and the full
 * set are in docs/marketing-site/unsplash-photos/. Saved as WebP, 1024 wide at most (the same
 * cap as uploaded photos), next to the code, so a demo never depends on the database. Imported
 * (not put in /public) so they get built-in addresses the site's routing leaves alone.
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
    sizes: [heathland640, heathland1024],
  },
  links: {
    alt: 'Demo club: a links course above the estuary',
    position: '50% 60%',
    sizes: [links640, links1024],
  },
  lakeside: {
    alt: 'Demo club: a green and bunker among pines, beside a lake',
    position: '50% 65%',
    sizes: [lakeside640, lakeside1024],
  },
  parkland: {
    alt: 'Demo club: a parkland green and bunker below the clubhouse',
    position: '50% 55%',
    sizes: [parkland640, parkland1024],
  },
}

export const isDemoPhotoKey = (key: string): key is DemoPhotoKey => key in DEMO_PHOTOS
