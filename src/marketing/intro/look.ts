/**
 * The golf ball intro's look and timing (brief: intro animation, Figma "marketing animation").
 * Dan tunes these on /dev/intro; the homepage intro reads the same values.
 */
export type BallLook = {
  /** Height of the light above the ball, in degrees (0 = level with it, 90 = straight above). */
  lightElevation: number
  /** Brightness of the thin line of light around the top edge. */
  rimIntensity: number
  /** How tight that line is. Higher = thinner. */
  rimTightness: number
  /** Brightness of the light catching the dimple edges. */
  dimpleIntensity: number
  /** How sharp the dimple highlights are. Higher = smaller, crisper glints. */
  dimpleSharpness: number
  /** How dark the dimples' shadowed sides are (0 = no shadow). */
  dimpleShadow: number
  /** Dimple size: 1 = neighbours touch; lower leaves a flat ring between them. */
  dimpleSize: number
  /** Dimple depth, as a multiple of the depth in the ball file. */
  dimpleDepth: number
  /** How far down the ball the light reaches before it dissolves (0 = top edge only, 1 = all). */
  reach: number
  /** Soft halo behind the top of the ball (0 = none). */
  glow: number
  /** Light colour, from neutral white (0) to cool blue-white (1). */
  coolness: number
  /** Ball diameter as a share of the screen width, on wide screens. */
  sizeDesktop: number
  /** Ball diameter as a share of the screen width, on phones. */
  sizeMobile: number
  /** Top edge of the ball as a share of the screen height, on wide screens. */
  top: number
  /** Top edge of the ball as a share of the screen height, on phones. */
  topMobile: number
  /** Tilt of the spin axis, in degrees. */
  tilt: number
  /** Idle spin, in degrees a second. */
  idleSpeed: number
  /** Spin at the end of the reveal, as a multiple of the idle spin. */
  revealSpeedUp: number
  /** Length of the reveal, in milliseconds. */
  revealMs: number
}

export const DEFAULT_LOOK: BallLook = {
  // Tuned by Dan on /dev/intro, 27 Oct 2026.
  lightElevation: 32,
  rimIntensity: 3,
  rimTightness: 6,
  dimpleIntensity: 1.1,
  dimpleSharpness: 27,
  dimpleShadow: 0.15,
  dimpleSize: 0.88,
  dimpleDepth: 1,
  reach: 0.34,
  glow: 0.39,
  coolness: 0.48,
  sizeDesktop: 0.66,
  sizeMobile: 0.93,
  top: 0.29,
  topMobile: 0.52,
  tilt: 0,
  idleSpeed: 23,
  revealSpeedUp: 7,
  revealMs: 1000,
}

type Control = {
  key: keyof BallLook
  label: string
  min: number
  max: number
  step: number
  group: 'Light' | 'Dimples' | 'Layout' | 'Motion'
}

/** The sliders on the tuning page. */
export const LOOK_CONTROLS: Control[] = [
  { key: 'lightElevation', label: 'Light height', min: 0, max: 80, step: 1, group: 'Light' },
  { key: 'rimIntensity', label: 'Edge brightness', min: 0, max: 6, step: 0.05, group: 'Light' },
  { key: 'rimTightness', label: 'Edge thinness', min: 1, max: 12, step: 0.5, group: 'Light' },
  { key: 'reach', label: 'Reach down the ball', min: 0, max: 1, step: 0.01, group: 'Light' },
  { key: 'glow', label: 'Halo', min: 0, max: 1, step: 0.01, group: 'Light' },
  { key: 'coolness', label: 'Coolness', min: 0, max: 1, step: 0.01, group: 'Light' },
  {
    key: 'dimpleIntensity',
    label: 'Dimple brightness',
    min: 0,
    max: 3,
    step: 0.05,
    group: 'Dimples',
  },
  {
    key: 'dimpleSharpness',
    label: 'Dimple sharpness',
    min: 4,
    max: 120,
    step: 1,
    group: 'Dimples',
  },
  { key: 'dimpleShadow', label: 'Dimple shadow', min: 0, max: 1, step: 0.01, group: 'Dimples' },
  { key: 'dimpleSize', label: 'Dimple size', min: 0.6, max: 1, step: 0.01, group: 'Dimples' },
  { key: 'dimpleDepth', label: 'Dimple depth', min: 0.3, max: 3, step: 0.05, group: 'Dimples' },
  { key: 'sizeDesktop', label: 'Size (desktop)', min: 0.3, max: 0.8, step: 0.01, group: 'Layout' },
  { key: 'sizeMobile', label: 'Size (phone)', min: 0.5, max: 1.4, step: 0.01, group: 'Layout' },
  { key: 'top', label: 'Top edge (desktop)', min: 0.1, max: 0.6, step: 0.01, group: 'Layout' },
  {
    key: 'topMobile',
    label: 'Top edge (phone)',
    min: 0.1,
    max: 0.8,
    step: 0.01,
    group: 'Layout',
  },
  { key: 'tilt', label: 'Axis tilt', min: 0, max: 30, step: 1, group: 'Motion' },
  { key: 'idleSpeed', label: 'Idle spin (°/s)', min: 5, max: 90, step: 1, group: 'Motion' },
  { key: 'revealSpeedUp', label: 'Reveal speed-up', min: 1, max: 10, step: 0.5, group: 'Motion' },
  { key: 'revealMs', label: 'Reveal length (ms)', min: 400, max: 2500, step: 50, group: 'Motion' },
]

/** Screens narrower than this use the phone size. */
export const PHONE_MAX_WIDTH = 767
