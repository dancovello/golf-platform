import sharp from 'sharp'

/**
 * Placeholder pictures for the demo club, drawn in code: no photos are copied from anywhere,
 * and there's no text in them (servers may have no fonts). Each is a simple illustrated
 * landscape or a portrait silhouette, varied by time of day so pages don't look identical.
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

/** A landscape JPEG: sky, sun, three ridges, a fairway, trees and sometimes a flag. */
export const scene = async (width: number, height: number, o: SceneOptions) => {
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
  return sharp(Buffer.from(svg)).jpeg({ quality: 82 }).toBuffer()
}

/** A head-and-shoulders silhouette on a soft background, for team members. */
export const portrait = async (background: string, figure: string, size = 900) => {
  const s = size
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${Math.round(s * 1.25)}">
    <rect width="100%" height="100%" fill="${background}"/>
    <circle cx="${s / 2}" cy="${s * 0.5}" r="${s * 0.17}" fill="${figure}"/>
    <path d="M${s * 0.16},${s * 1.25} C${s * 0.18},${s * 0.86} ${s * 0.82},${s * 0.86} ${s * 0.84},${s * 1.25} Z" fill="${figure}"/>
  </svg>`
  return sharp(Buffer.from(svg)).jpeg({ quality: 82 }).toBuffer()
}

/** A small, valid one-page PDF (built in code), for the documents. */
export const demoPDF = () => {
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] >>',
  ]
  let body = '%PDF-1.4\n'
  const offsets: number[] = []
  objects.forEach((o, i) => {
    offsets.push(Buffer.byteLength(body))
    body += `${i + 1} 0 obj\n${o}\nendobj\n`
  })
  const xref = Buffer.byteLength(body)
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  body += offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  return Buffer.from(body)
}
