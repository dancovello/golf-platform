'use client'

import { useEffect, useRef, type CSSProperties } from 'react'

import type { BallScene } from './ballScene'
import { INTRO_SEEN_KEY } from './gateScript'
import { DEFAULT_LOOK as LOOK } from './look'
import { CONTENT_START, revealFrame } from './reveal'

// Keys that would scroll the page: held back while the intro plays, so the page stays put.
const SCROLL_KEYS = new Set([' ', 'Spacebar', 'ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'End'])
const MODIFIER_KEYS = new Set(['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'])
// How long the ball takes to appear once its 3D code has loaded.
const BALL_FADE_IN_MS = 600

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

/** Shows the page: takes the intro's marks off <html> (marketing.css then shows everything). */
const endIntro = (html: HTMLElement) => {
  html.removeAttribute('data-intro')
  html.removeAttribute('data-intro-started')
  html.style.removeProperty('--mk-intro-content-ms')
}

// When the intro is taken down, the page is shown a moment later rather than at once, so that
// if React starts the intro again straight away (it does this in development, and can when a
// page re-mounts), the intro carries on instead of ending before it began.
let pendingEnd: number | undefined

/**
 * The homepage golf ball intro (plan phase 7). Present on the homepage only, and active only
 * when the script in the page's <head> chose to play it (src/marketing/intro/gateScript.ts),
 * which it marks with <html data-intro="play">.
 *
 * The ball spins slowly over the site green. The first scroll, swipe, key press or click
 * starts a one-second reveal: the spin speeds up, the ball fades, and the nav and page rise
 * into place behind it (marketing.css, data-intro="reveal"). Then the intro removes itself and
 * the page scrolls as normal. If the 3D graphics can't start, the page is revealed at once.
 */
export const HomeIntro = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ballRef = useRef<HTMLDivElement>(null)
  const cueRef = useRef<HTMLButtonElement>(null)
  const revealRef = useRef<() => void>(() => {})

  useEffect(() => {
    const html = document.documentElement
    window.clearTimeout(pendingEnd)
    pendingEnd = undefined
    const state = html.getAttribute('data-intro')
    if (state !== 'play') {
      // Taken down part-way through a reveal: just show the page.
      if (state) endIntro(html)
      return
    }
    html.setAttribute('data-intro-started', '')
    html.style.setProperty('--mk-intro-content-ms', `${(1 - CONTENT_START) * LOOK.revealMs}ms`)
    try {
      window.sessionStorage.setItem(INTRO_SEEN_KEY, '1')
    } catch {
      // Not remembered: the intro may play again this session. Harmless.
    }

    let phase: 'idle' | 'revealing' | 'done' = 'idle'
    let scene: BallScene | null = null
    let request = 0

    // Stops the intro's animation, listeners and 3D scene.
    const stop = () => {
      phase = 'done'
      cancelAnimationFrame(request)
      removeListeners()
      scene?.dispose()
      scene = null
    }
    // The reveal has finished (or can't run): show the page.
    const finish = () => {
      if (phase === 'done') return
      stop()
      endIntro(html)
    }

    const reveal = () => {
      if (phase !== 'idle') return
      phase = 'revealing'
      const ball = ballRef.current
      // Per-frame values from here: no CSS easing on top of them.
      if (ball) ball.style.transition = 'none'
      // Browsers slow animation right down in background tabs and on busy devices. Whatever
      // happens to the frames, the page is shown when the reveal's time is up.
      window.setTimeout(finish, LOOK.revealMs + 100)
      const start = performance.now()
      const step = (now: number) => {
        const progress = clamp01((now - start) / LOOK.revealMs)
        const frame = revealFrame(progress, LOOK.revealSpeedUp)
        scene?.setSpeedMultiplier(frame.speed)
        if (ball) ball.style.opacity = String(Math.min(frame.ball, Number(ball.style.opacity || 0)))
        if (cueRef.current) cueRef.current.style.opacity = String(frame.cue)
        // The nav and page rise in by CSS transition over the last part of the reveal.
        if (progress >= CONTENT_START && html.getAttribute('data-intro') === 'play') {
          html.setAttribute('data-intro', 'reveal')
        }
        if (progress < 1) request = requestAnimationFrame(step)
        else finish()
      }
      request = requestAnimationFrame(step)
    }
    revealRef.current = reveal

    // The page stays at the top while the intro is up; the first attempt to move starts the
    // reveal instead. Never longer than the reveal itself (about a second).
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      reveal()
    }
    const onTouchMove = (event: TouchEvent) => {
      event.preventDefault()
      reveal()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (MODIFIER_KEYS.has(event.key) || event.metaKey || event.ctrlKey) return
      if (SCROLL_KEYS.has(event.key)) event.preventDefault()
      reveal()
    }
    const onPointerDown = () => reveal()
    // Dragging the scroll bar can't be held back; treat it as the first scroll.
    const onScroll = () => {
      if (window.scrollY > 0) reveal()
    }
    const options = { passive: false, capture: true } as const
    window.addEventListener('wheel', onWheel, options)
    window.addEventListener('touchmove', onTouchMove, options)
    window.addEventListener('keydown', onKeyDown, true)
    window.addEventListener('pointerdown', onPointerDown, true)
    window.addEventListener('scroll', onScroll, { passive: true })
    function removeListeners() {
      window.removeEventListener('wheel', onWheel, options)
      window.removeEventListener('touchmove', onTouchMove, options)
      window.removeEventListener('keydown', onKeyDown, true)
      window.removeEventListener('pointerdown', onPointerDown, true)
      window.removeEventListener('scroll', onScroll)
    }

    // The browser brought the visitor back part-way down the page: no intro.
    if (window.scrollY > 0) {
      finish()
      return
    }

    const canvas = canvasRef.current
    if (canvas) {
      // The site's colours are defined on <body class="mk">.
      const background = getComputedStyle(document.body)
        .getPropertyValue('--mk-surface-canvas')
        .trim()
      import('./ballScene')
        .then(({ createBallScene }) => createBallScene(canvas, LOOK, background))
        .then((started) => {
          if (phase === 'done') return started.dispose()
          scene = started
          if (phase === 'idle' && ballRef.current) ballRef.current.style.opacity = '1'
        })
        .catch((error: unknown) => {
          // No 3D graphics after all: show the page straight away.
          console.error('Golf ball intro: could not start the 3D scene', error)
          reveal()
        })
    }

    return () => {
      if (phase === 'done') return
      stop()
      pendingEnd = window.setTimeout(() => endIntro(html), 0)
    }
  }, [])

  const style = {
    '--mk-intro-glow': LOOK.glow,
    '--mk-intro-size-desktop': LOOK.sizeDesktop,
    '--mk-intro-size-mobile': LOOK.sizeMobile,
    '--mk-intro-top-desktop': LOOK.top,
    '--mk-intro-top-mobile': LOOK.topMobile,
    '--mk-intro-ball-fade': `${BALL_FADE_IN_MS}ms`,
  } as CSSProperties

  return (
    <div className="mk-intro" style={style}>
      <div className="mk-intro-ball" ref={ballRef} aria-hidden="true">
        <div className="mk-intro-glow" />
        <canvas className="mk-intro-canvas" ref={canvasRef} />
      </div>
      <button
        type="button"
        className="mk-intro-cue"
        ref={cueRef}
        aria-label="Scroll to skip the intro"
        onClick={() => revealRef.current()}
      >
        <span className="mk-intro-cue-mouse" aria-hidden="true" />
        Scroll
      </button>
    </div>
  )
}
