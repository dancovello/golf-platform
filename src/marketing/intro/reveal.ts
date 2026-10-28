import { easeEnter } from './easing'

/** The page content arrives over the last 40% of the reveal (brief: "starting around 60%"). */
export const CONTENT_START = 0.6
export const CONTENT_RISE_PX = 24

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

/**
 * Where everything is at a point in the reveal (progress 0 to 1, in time): how fast the ball
 * spins (as a multiple of idle), how visible the ball and the scroll cue are, and how far the
 * page content has arrived (0 = hidden and 24px low, 1 = in place).
 */
export const revealFrame = (progress: number, speedUp: number) => {
  const eased = easeEnter(clamp01(progress))
  return {
    speed: 1 + (speedUp - 1) * eased,
    ball: 1 - eased,
    cue: 1 - clamp01(progress * 4),
    content: easeEnter(clamp01((progress - CONTENT_START) / (1 - CONTENT_START))),
  }
}
