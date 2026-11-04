import {
  ADMIN_BRAND_NAME,
  ADMIN_PANEL,
  MARK_BOX,
  MARK_PATHS,
  WORDMARK_BOX,
  WORDMARK_GREY,
  WORDMARK_PATHS,
  WORDMARK_SQUARES,
} from './adminBrand'

/**
 * The big logo: on the sign-in screen and other signed-out screens (Dan, 2026-11-04). Drawn on a
 * dark panel because the wordmark is light grey and would vanish on the admin's white page.
 */
export const AdminLogo = () => (
  <div
    className="admin-logo"
    style={{ background: ADMIN_PANEL, borderRadius: 12, padding: '20px 28px', maxWidth: 360 }}
  >
    <svg
      role="img"
      aria-label={ADMIN_BRAND_NAME}
      viewBox={`0 0 ${WORDMARK_BOX.width} ${WORDMARK_BOX.height}`}
      style={{ display: 'block', width: '100%', height: 'auto' }}
    >
      {WORDMARK_PATHS.map((d) => (
        <path key={d} d={d} fill={WORDMARK_GREY} />
      ))}
      {WORDMARK_SQUARES.map((s) => (
        <rect key={s.x} x={s.x} y={s.y} width={s.size} height={s.size} fill={s.fill} />
      ))}
    </svg>
  </div>
)

/** The small mark: top of the sidebar once signed in. */
export const AdminIcon = () => (
  <div
    className="admin-icon"
    style={{ background: ADMIN_PANEL, borderRadius: 6, padding: 6, width: 36, height: 36 }}
  >
    <svg
      role="img"
      aria-label={ADMIN_BRAND_NAME}
      viewBox={`0 0 ${MARK_BOX.width} ${MARK_BOX.height}`}
      style={{ display: 'block', width: '100%', height: '100%' }}
    >
      {MARK_PATHS.map((d) => (
        <path key={d} d={d} fill={WORDMARK_GREY} />
      ))}
    </svg>
  </div>
)
