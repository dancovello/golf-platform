import logo from './assets/a1-engine-logo.png'
import { ADMIN_BRAND_NAME, ADMIN_GREEN } from './adminBrand'

/** The logo's shape, width over height. */
const RATIO = 1010 / 224

/**
 * The big logo: on the sign-in screen and the other signed-out screens (Dan, 2026-11-04). The
 * picture is light grey, so it sits on the dark green strip that src/app/(payload)/custom.scss
 * draws across the top of those screens.
 */
export const AdminLogo = () => (
  // eslint-disable-next-line @next/next/no-img-element -- a fixed picture inside the admin
  <img
    className="admin-logo"
    src={logo.src}
    alt={ADMIN_BRAND_NAME}
    width={260}
    height={Math.round(260 / RATIO)}
    style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
  />
)

/**
 * The small mark at the top of the sidebar: just the "A1" at the start of the logo, on the dark
 * green. The picture is 24px tall, and the box shows only its first 25px (the "A1").
 */
export const AdminIcon = () => (
  <div
    className="admin-icon"
    style={{ background: ADMIN_GREEN, borderRadius: 6, padding: 6, width: 36, height: 36 }}
  >
    <div style={{ width: 25, height: 24, overflow: 'hidden' }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- a fixed picture inside the admin */}
      <img
        src={logo.src}
        alt={ADMIN_BRAND_NAME}
        width={Math.round(24 * RATIO)}
        height={24}
        style={{ display: 'block', maxWidth: 'none', height: 24, width: 'auto' }}
      />
    </div>
  </div>
)
