'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import type { BallScene } from './ballScene'
import { easeEnter } from './easing'
import { DEFAULT_LOOK, LOOK_CONTROLS, type BallLook } from './look'

const STORAGE_KEY = 'mk-intro-lab-look'
const GROUPS = ['Light', 'Dimples', 'Layout', 'Motion'] as const
// The page content arrives over the last 40% of the reveal (brief: "starting around 60%").
const CONTENT_START = 0.6
const CONTENT_RISE_PX = 24

const loadSaved = (): BallLook => {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved) return { ...DEFAULT_LOOK, ...(JSON.parse(saved) as Partial<BallLook>) }
  } catch {
    // Storage blocked or unreadable: start from the defaults.
  }
  return DEFAULT_LOOK
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

/**
 * The light-tuning page for the homepage golf ball intro (/dev/intro, super-admin only).
 * Sliders change the ball live; "Play reveal" (or scrolling, swiping or pressing Down over the
 * stage) runs the reveal the homepage will use. "Copy settings" copies the values to paste
 * back to Claude.
 */
export const IntroLab = () => {
  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ballLayerRef = useRef<HTMLDivElement>(null)
  const cueRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLElement>(null)
  const sceneRef = useRef<BallScene | null>(null)
  const revealFrame = useRef(0)

  // Rendered only in the browser (IntroLabLoader), so saved values can be read straight away.
  const [look, setLook] = useState<BallLook>(loadSaved)
  const lookRef = useRef(look)
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading')
  const [phase, setPhase] = useState<'idle' | 'revealing' | 'done'>('idle')
  const phaseRef = useRef(phase)
  const [panelOpen, setPanelOpen] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  useEffect(() => {
    lookRef.current = look
    sceneRef.current?.setLook(look)
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(look))
    } catch {
      // Not saved; the sliders still work.
    }
    const stage = stageRef.current
    if (stage) {
      stage.style.setProperty('--mk-intro-glow', String(look.glow))
      stage.style.setProperty('--mk-intro-size-desktop', String(look.sizeDesktop))
      stage.style.setProperty('--mk-intro-size-mobile', String(look.sizeMobile))
      stage.style.setProperty('--mk-intro-top-desktop', String(look.top))
      stage.style.setProperty('--mk-intro-top-mobile', String(look.topMobile))
    }
  }, [look])

  // Start the 3D scene once the page is showing. three loads only now.
  useEffect(() => {
    let cancelled = false
    const canvas = canvasRef.current
    const stage = stageRef.current
    if (!canvas || !stage) return
    const background = getComputedStyle(stage).getPropertyValue('--mk-surface-canvas').trim()
    import('./ballScene')
      .then(({ createBallScene }) => createBallScene(canvas, lookRef.current, background))
      .then((scene) => {
        if (cancelled) return scene.dispose()
        sceneRef.current = scene
        setStatus('ready')
      })
      .catch((error: unknown) => {
        console.error('Golf ball intro: could not start the 3D scene', error)
        if (!cancelled) setStatus('failed')
      })
    return () => {
      cancelled = true
      sceneRef.current?.dispose()
      sceneRef.current = null
    }
  }, [])

  const paint = useCallback((progress: number) => {
    const eased = easeEnter(progress)
    const { revealSpeedUp } = lookRef.current
    sceneRef.current?.setSpeedMultiplier(1 + (revealSpeedUp - 1) * eased)
    if (ballLayerRef.current) ballLayerRef.current.style.opacity = String(1 - eased)
    if (cueRef.current) cueRef.current.style.opacity = String(1 - clamp01(progress * 4))
    const content = easeEnter(clamp01((progress - CONTENT_START) / (1 - CONTENT_START)))
    if (contentRef.current) {
      contentRef.current.style.opacity = String(content)
      contentRef.current.style.transform = `translateY(${(1 - content) * CONTENT_RISE_PX}px)`
    }
  }, [])

  const play = useCallback(() => {
    if (phaseRef.current !== 'idle') return
    phaseRef.current = 'revealing'
    setPhase('revealing')
    const start = performance.now()
    const step = (now: number) => {
      const progress = clamp01((now - start) / lookRef.current.revealMs)
      paint(progress)
      if (progress < 1) {
        revealFrame.current = requestAnimationFrame(step)
      } else {
        phaseRef.current = 'done'
        setPhase('done')
      }
    }
    revealFrame.current = requestAnimationFrame(step)
  }, [paint])

  const reset = useCallback(() => {
    cancelAnimationFrame(revealFrame.current)
    paint(0)
    phaseRef.current = 'idle'
    setPhase('idle')
  }, [paint])

  useEffect(() => () => cancelAnimationFrame(revealFrame.current), [])

  // Like the homepage: the first scroll, swipe or Down key over the stage starts the reveal.
  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const outsidePanel = (target: EventTarget | null) =>
      !(target instanceof Node && panelRef.current?.contains(target))
    const onWheel = (event: WheelEvent) => {
      if (event.deltaY > 0 && outsidePanel(event.target)) play()
    }
    let touchY: number | null = null
    const onTouchStart = (event: TouchEvent) => {
      touchY = outsidePanel(event.target) ? (event.touches[0]?.clientY ?? null) : null
    }
    const onTouchMove = (event: TouchEvent) => {
      const y = event.touches[0]?.clientY
      if (touchY !== null && y !== undefined && touchY - y > 10) play()
    }
    const onKey = (event: KeyboardEvent) => {
      if (!outsidePanel(event.target)) return
      if (['ArrowDown', 'PageDown', ' ', 'Spacebar'].includes(event.key)) play()
    }
    stage.addEventListener('wheel', onWheel, { passive: true })
    stage.addEventListener('touchstart', onTouchStart, { passive: true })
    stage.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('keydown', onKey)
    return () => {
      stage.removeEventListener('wheel', onWheel)
      stage.removeEventListener('touchstart', onTouchStart)
      stage.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('keydown', onKey)
    }
  }, [play])

  const copySettings = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(look, null, 2))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copy these settings:', JSON.stringify(look))
    }
  }

  return (
    <div className="mk-intro-lab" ref={stageRef}>
      <div className="mk-intro-content" ref={contentRef} aria-hidden="true">
        <p className="mk-intro-content-nav">Brandname</p>
        <p className="mk-display-xl mk-intro-content-title">
          Your club is better than your website.
        </p>
        <p className="mk-intro-content-body">
          A golf club website your team can update in minutes, and that still looks professional
          when they’re done.
        </p>
      </div>

      <div className="mk-intro-ball" ref={ballLayerRef} aria-hidden="true">
        <div className="mk-intro-glow" />
        <canvas className="mk-intro-canvas" ref={canvasRef} />
      </div>

      <div className="mk-intro-cue" ref={cueRef} aria-hidden="true">
        <span className="mk-intro-cue-mouse" />
        Scroll
      </div>

      {status !== 'ready' ? (
        <p className="mk-intro-status" role="status">
          {status === 'loading'
            ? 'Loading the ball…'
            : 'This browser couldn’t start 3D graphics. The homepage will show a still image here.'}
        </p>
      ) : null}

      <aside
        className="mk-intro-panel"
        ref={panelRef}
        data-open={panelOpen}
        aria-label="Ball settings"
      >
        <div className="mk-intro-panel-head">
          <h1 className="mk-intro-panel-title">Golf ball intro</h1>
          <button
            type="button"
            className="mk-intro-button mk-intro-button--quiet"
            aria-expanded={panelOpen}
            onClick={() => setPanelOpen((open) => !open)}
          >
            {panelOpen ? 'Hide' : 'Settings'}
          </button>
        </div>
        {panelOpen ? (
          <>
            <div className="mk-intro-actions">
              <button
                type="button"
                className="mk-intro-button"
                onClick={phase === 'idle' ? play : reset}
                disabled={phase === 'revealing'}
              >
                {phase === 'idle' ? 'Play reveal' : 'Show ball again'}
              </button>
              <button type="button" className="mk-intro-button" onClick={copySettings}>
                {copied ? 'Copied' : 'Copy settings'}
              </button>
              <button
                type="button"
                className="mk-intro-button mk-intro-button--quiet"
                onClick={() => setLook(DEFAULT_LOOK)}
              >
                Reset
              </button>
            </div>
            {GROUPS.map((group) => (
              <fieldset key={group} className="mk-intro-group">
                <legend className="mk-intro-group-name">{group}</legend>
                {LOOK_CONTROLS.filter((control) => control.group === group).map((control) => {
                  const id = `mk-intro-${control.key}`
                  return (
                    <div key={control.key} className="mk-intro-control">
                      <label htmlFor={id}>{control.label}</label>
                      <output htmlFor={id}>{look[control.key]}</output>
                      <input
                        id={id}
                        type="range"
                        min={control.min}
                        max={control.max}
                        step={control.step}
                        value={look[control.key]}
                        onChange={(event) =>
                          setLook((current) => ({
                            ...current,
                            [control.key]: Number(event.target.value),
                          }))
                        }
                      />
                    </div>
                  )
                })}
              </fieldset>
            ))}
            <p className="mk-intro-hint">
              Scroll, swipe or press ↓ over the ball to try the reveal as visitors will.
            </p>
          </>
        ) : null}
      </aside>
    </div>
  )
}
