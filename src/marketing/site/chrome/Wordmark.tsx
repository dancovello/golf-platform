import { BRAND } from '@/brand'

import mark from '../assets/wordmark-mark.svg'

/**
 * Marketing/Wordmark (174:1816): a placeholder until the company has a name and logo. The mark's
 * centre ("Hole") is where the intro's golf ball lands, so it carries `data-hole` (phase 7).
 */
export const Wordmark = () => (
  <a className="mk-wordmark" href="/" aria-label={`${BRAND.name}, home`}>
    {/* eslint-disable-next-line @next/next/no-img-element -- the Figma mark, 22px */}
    <img src={mark.src} width={22} height={22} alt="" data-hole />
    <span>{BRAND.name}</span>
  </a>
)
