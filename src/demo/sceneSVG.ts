/**
 * The demo club's illustrated landscapes as SVG markup, drawn in code: no photos are copied from
 * anywhere, and there's no text in them. Used as JPEGs for the demo club (src/demo/pictures.ts)
 * and directly by the marketing site's live demos (src/marketing/demo). No imports, so either
 * can use it.
 */
type Sky = { top: string; bottom: string; sun: string }
type Land = { far: string; mid: string; near: string; fairway: string }

const SKIES: Record<string, Sky> = {
  dawn: { top: '#f3c9a5', bottom: '#fbeee0', sun: '#fff4dc' },
  morning: { top: '#9cc3dc', bottom: '#e6f0f2', sun: '#fffbea' },
  noon: { top: '#6fa3c9', bottom: '#d7e8ef', sun: '#ffffff' },
  dusk: { top: '#7d5a7a', bottom: '#f2b48a', sun: '#ffd9a0' },
  winter: { top: '#a9b7c2', bottom: '#e9edf0', sun: '#f6f8fa' },
  evening: { top: '#2f3f5c', bottom: '#c98f6b', sun: '#f4c58a' },
}
const LANDS: Record<string, Land> = {
  heath: { far: '#8a9a7b', mid: '#6d7f58', near: '#4f6140', fairway: '#8fae62' },
  pine: { far: '#73866f', mid: '#4d6650', near: '#33483a', fairway: '#7fa35c' },
  autumn: { far: '#a59a72', mid: '#8a7a4a', near: '#6b5a33', fairway: '#9fb26a' },
  links: { far: '#a7ad8c', mid: '#8c9670', near: '#6f7a55', fairway: '#b2c182' },
}

const wave = (w: number, h: number, base: number, amp: number, phase: number, n = 3) => {
  const pts: string[] = []
  for (let x = 0; x <= w; x += w / 48) {
    const y = base + Math.sin((x / w) * Math.PI * n + phase) * amp
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`)
  }
  return `M0,${h} L${pts.join(' L')} L${w},${h} Z`
}

const trees = (w: number, base: number, size: number, colour: string, seed: number) => {
  let out = ''
  for (let i = 0; i < 7; i++) {
    const x = ((seed * 97 + i * 151) % 100) / 100
    const s = size * (0.7 + (((seed + i) * 37) % 40) / 100)
    const cx = x * w
    out += `<path d="M${cx - s * 0.35},${base} L${cx},${base - s * 1.4} L${cx + s * 0.35},${base} Z" fill="${colour}"/>`
  }
  return out
}

export type SceneOptions = { sky: keyof typeof SKIES; land: keyof typeof LANDS; seed: number }

/** A landscape drawing (SVG): sky, sun, three ridges, a fairway, trees and sometimes a flag. */
export const sceneSVG = (width: number, height: number, o: SceneOptions): string => {
  const sky = SKIES[o.sky]
  const land = LANDS[o.land]
  const w = width
  const h = height
  const p = o.seed * 0.9
  const flag =
    o.seed % 2 === 0
      ? `<line x1="${w * 0.62}" y1="${h * 0.66}" x2="${w * 0.62}" y2="${h * 0.56}" stroke="#f6f2e8" stroke-width="${Math.max(2, w / 600)}"/>
         <path d="M${w * 0.62},${h * 0.56} l${w * 0.03},${h * 0.012} l-${w * 0.03},${h * 0.012} Z" fill="#c8382e"/>`
      : ''
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>
      <linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${sky.top}"/><stop offset="1" stop-color="${sky.bottom}"/>
      </linearGradient>
      <radialGradient id="g" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stop-color="${sky.sun}" stop-opacity="1"/>
        <stop offset="1" stop-color="${sky.sun}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#s)"/>
    <circle cx="${w * (0.2 + (o.seed % 5) * 0.14)}" cy="${h * 0.3}" r="${h * 0.22}" fill="url(#g)"/>
    <circle cx="${w * (0.2 + (o.seed % 5) * 0.14)}" cy="${h * 0.3}" r="${h * 0.045}" fill="${sky.sun}"/>
    <path d="${wave(w, h, h * 0.5, h * 0.04, p, 2)}" fill="${land.far}"/>
    ${trees(w, h * 0.52, h * 0.09, land.mid, o.seed)}
    <path d="${wave(w, h, h * 0.6, h * 0.05, p + 1.7, 3)}" fill="${land.mid}"/>
    <path d="M${w * 0.2},${h} C${w * 0.4},${h * 0.78} ${w * 0.55},${h * 0.7} ${w * 0.68},${h * 0.65} C${w * 0.75},${h * 0.66} ${w * 0.7},${h * 0.8} ${w * 0.72},${h} Z" fill="${land.fairway}"/>
    <ellipse cx="${w * 0.62}" cy="${h * 0.66}" rx="${w * 0.07}" ry="${h * 0.02}" fill="${land.fairway}" stroke="${land.near}" stroke-opacity="0.25"/>
    ${flag}
    <path d="${wave(w, h, h * 0.86, h * 0.04, p + 3.1, 2)}" fill="${land.near}"/>
  </svg>`
  return svg
}
