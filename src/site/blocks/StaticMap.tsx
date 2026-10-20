/**
 * The token-built map (Figma "Static Map"): land, woodland, roads and a pin drawn in the
 * club's own colours, so it re-themes per club and needs no map provider. Decorative only:
 * the address next to it carries the information, and the interactive map is one click away.
 * `pinX` (0–1) moves the pin across, e.g. right of centre when a card floats on the left.
 */
export const StaticMap = ({ label, pinX = 0.5 }: { label: string | null; pinX?: number }) => {
  const W = 1200
  const H = 640
  const px = Math.round(W * pinX)
  const py = Math.round(H * 0.5)
  return (
    <svg
      className="map-svg"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <rect width={W} height={H} fill="var(--color-surface-subtle)" />
      {/* Woodland and club land */}
      <rect
        x={60}
        y={40}
        width={260}
        height={300}
        rx={130}
        fill="color-mix(in srgb, var(--color-surface-brand) 18%, var(--color-surface-subtle))"
      />
      <rect
        x={px - 220}
        y={py - 190}
        width={440}
        height={380}
        rx={190}
        fill="color-mix(in srgb, var(--color-surface-brand) 22%, var(--color-surface-subtle))"
      />
      <rect
        x={px + 290}
        y={py + 20}
        width={380}
        height={300}
        rx={150}
        fill="color-mix(in srgb, var(--color-surface-brand) 18%, var(--color-surface-subtle))"
      />
      {/* Fairways */}
      <rect
        x={px - 150}
        y={py - 90}
        width={300}
        height={44}
        rx={22}
        fill="color-mix(in srgb, var(--color-surface-brand) 45%, var(--color-surface-subtle))"
      />
      <rect
        x={px - 150}
        y={py + 50}
        width={300}
        height={44}
        rx={22}
        fill="color-mix(in srgb, var(--color-surface-brand) 45%, var(--color-surface-subtle))"
      />
      {/* Roads */}
      <g stroke="var(--color-surface-raised)" strokeWidth={14}>
        <line x1={0} y1={150} x2={W} y2={150} />
        <line x1={0} y1={H - 70} x2={W} y2={H - 70} />
        <line x1={px - 280} y1={0} x2={px - 280} y2={H} />
        <line x1={px + 300} y1={0} x2={px + 300} y2={H} />
        <line x1={px - 280} y1={py + 10} x2={px} y2={py + 10} />
      </g>
      <line
        x1={0}
        y1={H - 40}
        x2={W}
        y2={H - 40}
        stroke="var(--color-text-secondary)"
        strokeWidth={2}
      />
      {/* Pin and label */}
      <circle cx={px} cy={py + 10} r={22} fill="var(--color-action-accent)" />
      <g
        transform={`translate(${px - 9} ${py - 2})`}
        fill="none"
        stroke="var(--color-action-on-accent)"
        strokeWidth={2}
      >
        <path d="M9 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11z" transform="scale(0.85)" />
      </g>
      {label ? (
        <g transform={`translate(${px + 32} ${py - 6})`}>
          <rect
            width={Math.max(120, label.length * 10 + 28)}
            height={34}
            rx={2}
            fill="var(--color-surface-raised)"
          />
          <text
            x={14}
            y={22}
            fontSize={15}
            fill="var(--color-text-primary)"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            {label}
          </text>
        </g>
      ) : null}
    </svg>
  )
}
