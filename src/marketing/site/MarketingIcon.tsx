import {
  ArrowRight,
  Check,
  ChevronRight,
  Close,
  Clock,
  Download,
  FileIcon,
  Info,
  Mail,
  Menu,
  Phone,
  Pin,
  Search,
} from '@/site/components/Icons'

import type { FeatureIcon } from '../icons'
import calendar from './assets/calendar.svg'
import flag from './assets/flag.svg'
import lock from './assets/lock.svg'
import minus from './assets/minus.svg'
import players from './assets/players.svg'
import plus from './assets/plus.svg'
import sun from './assets/sun.svg'

/**
 * A line icon from the Figma shared set, in the current text colour. Icons the club sites
 * already draw are reused (src/site/components/Icons.tsx, the same Figma set); the rest are the
 * Figma files themselves, used as a mask so they take the current colour without being edited.
 */
const DRAWN = {
  check: Check,
  clock: Clock,
  mail: Mail,
  phone: Phone,
  pin: Pin,
  search: Search,
  file: FileIcon,
  download: Download,
  info: Info,
  'arrow-right': ArrowRight,
  'chevron-right': ChevronRight,
  menu: Menu,
  close: Close,
} as const

const FILES = { calendar, flag, lock, players, sun, plus, minus } as const

export type MarketingIconName =
  FeatureIcon | 'arrow-right' | 'chevron-right' | 'plus' | 'minus' | 'menu' | 'close'

export const MarketingIcon = ({ name, size }: { name: MarketingIconName; size: number }) => {
  if (name in DRAWN) {
    const Drawn = DRAWN[name as keyof typeof DRAWN]
    return <Drawn size={size} />
  }
  const file = FILES[name as keyof typeof FILES]
  return (
    <span
      aria-hidden="true"
      className="mk-icon-mask"
      style={{ width: size, height: size, maskImage: `url(${file.src})` }}
    />
  )
}
