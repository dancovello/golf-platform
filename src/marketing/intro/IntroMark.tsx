import { BUILT_IN_LOGO, type LogoImage } from '../branding'

import type { IntroMark as Mark } from './mark'

/**
 * The space above the golf ball (marketing.css, .mk-intro-mark): the logo, a message in the
 * homepage headline style, or nothing. It sits inside the ball's layer, so it appears and fades
 * out with the ball. It is decoration (the layer is hidden from screen readers; the page's own
 * headline and nav carry the content), and a paragraph rather than a heading so the page keeps
 * its one real H1.
 */
export const IntroMark = ({ mark, logo = BUILT_IN_LOGO }: { mark: Mark; logo?: LogoImage }) => {
  if (mark.kind === 'none') return null
  return (
    <div className="mk-intro-mark" data-kind={mark.kind}>
      {mark.kind === 'message' ? (
        <p className="mk-display-xl mk-intro-message">{mark.message}</p>
      ) : (
        <span className="mk-intro-logo">
          {/* eslint-disable-next-line @next/next/no-img-element -- the logo, from R2 or the build */}
          <img src={logo.src} alt="" style={{ aspectRatio: logo.ratio }} />
        </span>
      )}
    </div>
  )
}
