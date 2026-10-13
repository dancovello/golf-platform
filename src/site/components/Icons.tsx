// Line icons from the Figma "Shared components" page (24px grid, 1.25 stroke).
type IconProps = { size?: number }
const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.25,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false,
})

export const ArrowRight = ({ size = 20 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M4 12h16M14 6l6 6-6 6" />
  </svg>
)
export const Menu = ({ size = 24 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M4 8h16M4 16h16" />
  </svg>
)
export const Close = ({ size = 24 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
)
export const ChevronRight = ({ size = 20 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M9 6l6 6-6 6" />
  </svg>
)
export const ChevronLeft = ({ size = 20 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M15 6l-6 6 6 6" />
  </svg>
)
export const ChevronDown = ({ size = 16 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M6 9l6 6 6-6" />
  </svg>
)
export const Phone = ({ size = 16 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a1 1 0 01-1 1A16 16 0 014 5a1 1 0 011-1z" />
  </svg>
)
export const Mail = ({ size = 16 }: IconProps) => (
  <svg {...base(size)}>
    <rect x="3" y="5" width="18" height="14" rx="1" />
    <path d="M3 7l9 6 9-6" />
  </svg>
)
export const Pin = ({ size = 16 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
)
export const Expand = ({ size = 16 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" />
  </svg>
)
