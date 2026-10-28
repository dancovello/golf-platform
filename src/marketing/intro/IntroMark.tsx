import { BRAND } from '@/brand'

import logoMark from '../site/assets/wordmark-mark.svg'

import type { IntroMark as Mark } from './mark'

/**
 * The space above the golf ball (marketing.css, .mk-intro-mark): the logo, a message in the
 * homepage headline style, or nothing. It sits inside the ball's layer, so it appears and fades
 * out with the ball. It is decoration (the layer is hidden from screen readers; the page's own
 * headline and nav carry the content), and a paragraph rather than a heading so the page keeps
 * its one real H1.
 */
export const IntroMark = ({ mark }: { mark: Mark }) => {
  if (mark.kind === 'none') return null
  return (
    <div className="mk-intro-mark" data-kind={mark.kind}>
      {mark.kind === 'message' ? (
        <p className="mk-display-xl mk-intro-message">{mark.message}</p>
      ) : (
        // A stand-in until the company logo exists: the nav's wordmark, scaled up. The real logo
        // replaces this markup (an <img> of the logo file) and keeps the same wrapper.
        <span className="mk-intro-logo">
          {/* eslint-disable-next-line @next/next/no-img-element -- the Figma mark */}
          <img src={logoMark.src} alt="" />
          <span>{BRAND.name}</span>
        </span>
      )}
    </div>
  )
}
