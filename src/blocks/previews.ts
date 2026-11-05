/**
 * The little pictures in the "Add block" list: a simple wireframe of each block, drawn here
 * (no image files to host, nothing to load) and handed to Payload as image data. 3:2, as
 * Payload's block list expects. Grey shapes stand for photos and text; the green is the
 * club's brand colour.
 */

const BG = '#f3f4f6'
const PANEL = '#ffffff'
const PHOTO = '#cfd5dc'
const TEXT = '#b8c0c9'
const DARK = '#8b95a1'
const BRAND = '#3d7a5a'

type Fill = string

const rect = (x: number, y: number, w: number, h: number, fill: Fill, r = 4) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}"/>`

/** A photo placeholder: a grey panel with a hill and a sun. */
const photo = (x: number, y: number, w: number, h: number, fill: Fill = PHOTO) =>
  rect(x, y, w, h, fill) +
  `<circle cx="${x + w * 0.75}" cy="${y + h * 0.3}" r="${Math.min(w, h) * 0.08}" fill="#fff" opacity=".7"/>` +
  `<path d="M${x} ${y + h} L${x + w * 0.35} ${y + h * 0.45} L${x + w * 0.6} ${y + h * 0.75} L${x + w * 0.8} ${y + h * 0.55} L${x + w} ${y + h * 0.85} L${x + w} ${y + h} Z" fill="#fff" opacity=".45"/>`

/** Lines of text, the last one shorter. */
const lines = (x: number, y: number, w: number, count: number, fill: Fill = TEXT, gap = 16) =>
  Array.from({ length: count }, (_, i) =>
    rect(x, y + i * gap, i === count - 1 ? w * 0.6 : w, 7, fill, 3),
  ).join('')

const heading = (x: number, y: number, w: number, fill: Fill = DARK) => rect(x, y, w, 12, fill, 4)

const button = (x: number, y: number, w = 90) => rect(x, y, w, 26, BRAND, 13)

const panel = (x: number, y: number, w: number, h: number) =>
  rect(x, y, w, h, PANEL, 6) +
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="none" stroke="#e1e4e8"/>`

const pictures: Record<string, string> = {
  hero:
    photo(30, 30, 540, 340) +
    rect(30, 30, 540, 340, '#000', 6).replace('fill="#000"', 'fill="#000" opacity=".25"') +
    heading(60, 250, 240, '#fff') +
    rect(60, 276, 180, 8, '#fff', 3) +
    button(60, 304, 110),

  ctaCardGrid: [0, 1, 2]
    .map(
      (i) =>
        panel(30 + i * 185, 60, 170, 280) +
        photo(40 + i * 185, 70, 150, 110) +
        heading(40 + i * 185, 200, 100) +
        lines(40 + i * 185, 226, 150, 3) +
        rect(40 + i * 185, 300, 70, 8, BRAND, 3),
    )
    .join(''),

  twoColumn:
    photo(30, 60, 260, 280) +
    heading(325, 90, 150) +
    lines(325, 126, 245, 6) +
    button(325, 250, 100),

  richText:
    heading(60, 60, 260) +
    lines(60, 100, 480, 5) +
    heading(60, 200, 180) +
    lines(60, 240, 480, 4) +
    lines(60, 320, 300, 1),

  rateTable:
    panel(30, 50, 540, 300) +
    rect(30, 50, 540, 40, BRAND, 6) +
    [0, 1, 2, 3, 4]
      .map(
        (i) =>
          rect(50, 108 + i * 48, 160, 8, TEXT, 3) +
          rect(380, 108 + i * 48, 60, 8, DARK, 3) +
          rect(480, 108 + i * 48, 60, 8, DARK, 3) +
          (i < 4
            ? `<line x1="40" x2="560" y1="${130 + i * 48}" y2="${130 + i * 48}" stroke="#e8ebee"/>`
            : ''),
      )
      .join(''),

  gallery:
    photo(30, 40, 270, 190) +
    photo(310, 40, 125, 90) +
    photo(445, 40, 125, 90) +
    photo(310, 140, 125, 90) +
    photo(445, 140, 125, 90) +
    photo(30, 240, 170, 120) +
    photo(210, 240, 170, 120) +
    photo(390, 240, 180, 120),

  documentList: [0, 1, 2, 3, 4]
    .map(
      (i) =>
        panel(40, 40 + i * 62, 520, 50) +
        rect(56, 54 + i * 62, 22, 22, BRAND, 3) +
        rect(94, 56 + i * 62, 200 + (i % 3) * 40, 8, DARK, 3) +
        rect(94, 72 + i * 62, 110, 6, TEXT, 3) +
        rect(500, 58 + i * 62, 40, 14, PHOTO, 7),
    )
    .join(''),

  map:
    rect(30, 40, 540, 320, '#dfe7df', 6) +
    '<path d="M30 250 Q150 190 260 230 T570 160" stroke="#fff" stroke-width="14" fill="none"/>' +
    '<path d="M200 40 L260 360" stroke="#fff" stroke-width="10" fill="none"/>' +
    `<path d="M345 150 a28 28 0 1 1 56 0 c0 22 -28 56 -28 56 s-28 -34 -28 -56z" fill="${BRAND}"/>` +
    '<circle cx="373" cy="150" r="10" fill="#fff"/>' +
    panel(50, 60, 170, 100) +
    heading(64, 76, 90) +
    lines(64, 104, 140, 3),

  video:
    photo(90, 50, 420, 236) +
    `<circle cx="300" cy="168" r="34" fill="${BRAND}"/>` +
    '<path d="M288 150 L288 186 L318 168 Z" fill="#fff"/>' +
    heading(90, 312, 200) +
    rect(90, 336, 140, 7, TEXT, 3),

  pullQuote:
    `<text x="60" y="190" font-family="Georgia,serif" font-size="150" fill="${BRAND}" opacity=".35">“</text>` +
    heading(130, 130, 380) +
    heading(130, 160, 320) +
    heading(130, 190, 240) +
    rect(130, 250, 120, 8, TEXT, 3) +
    rect(130, 268, 80, 6, PHOTO, 3),

  timeline:
    `<line x1="300" x2="300" y1="40" y2="360" stroke="${PHOTO}" stroke-width="4"/>` +
    [0, 1, 2, 3]
      .map((i) => {
        const left = i % 2 === 0
        const x = left ? 60 : 330
        return (
          `<circle cx="300" cy="${70 + i * 90}" r="9" fill="${BRAND}"/>` +
          rect(x, 52 + i * 90, 100, 10, BRAND, 4) +
          lines(x, 72 + i * 90, 200, 2)
        )
      })
      .join(''),

  logoStrip:
    heading(210, 80, 180) +
    [0, 1, 2, 3, 4]
      .map(
        (i) =>
          rect(40 + i * 108, 170, 92, 60, PANEL, 6) +
          rect(52 + i * 108, 192, 68, 16, i % 2 ? PHOTO : TEXT, 8),
      )
      .join(''),

  faq:
    heading(60, 50, 220) +
    [0, 1, 2, 3, 4]
      .map(
        (i) =>
          panel(60, 90 + i * 54, 480, 44) +
          rect(78, 108 + i * 54, 200 + ((i * 37) % 100), 8, i === 0 ? BRAND : DARK, 3) +
          rect(508, 106 + i * 54, 14, 12, PHOTO, 3),
      )
      .join(''),

  team: [0, 1, 2, 3]
    .map(
      (i) =>
        `<circle cx="${90 + i * 140}" cy="150" r="46" fill="${PHOTO}"/>` +
        `<circle cx="${90 + i * 140}" cy="138" r="14" fill="#fff" opacity=".6"/>` +
        `<path d="M${64 + i * 140} 186 q26 -28 52 0" fill="#fff" opacity=".6"/>` +
        heading(48 + i * 140, 226, 84) +
        rect(58 + i * 140, 250, 64, 7, TEXT, 3),
    )
    .join(''),

  membership: [0, 1, 2]
    .map(
      (i) =>
        panel(30 + i * 185, 50, 170, 300) +
        (i === 1
          ? rect(30 + i * 185, 50, 170, 36, BRAND, 6)
          : rect(30 + i * 185, 50, 170, 36, DARK, 6)) +
        rect(50 + i * 185, 112, 80, 20, i === 1 ? BRAND : DARK, 4) +
        lines(50 + i * 185, 160, 130, 5, TEXT, 22) +
        button(50 + i * 185, 304, 130),
    )
    .join(''),

  holeGrid: [0, 1, 2, 3, 4, 5, 6, 7]
    .map((i) => {
      const x = 30 + (i % 4) * 138
      const y = 50 + Math.floor(i / 4) * 160
      return (
        panel(x, y, 126, 146) +
        photo(x + 8, y + 8, 110, 70) +
        `<circle cx="${x + 24}" cy="${y + 100}" r="12" fill="${BRAND}"/>` +
        rect(x + 44, y + 94, 56, 8, DARK, 3) +
        rect(x + 16, y + 120, 90, 6, TEXT, 3)
      )
    })
    .join(''),

  scorecard:
    panel(30, 70, 540, 260) +
    rect(30, 70, 540, 34, BRAND, 6) +
    [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => rect(120 + i * 48, 82, 30, 10, '#fff', 3)).join('') +
    [0, 1, 2, 3]
      .map(
        (r) =>
          [0, 1, 2, 3, 4, 5, 6, 7, 8]
            .map((i) => rect(120 + i * 48, 126 + r * 48, 30, 8, r === 3 ? DARK : TEXT, 3))
            .join('') + rect(46, 126 + r * 48, 54, 8, DARK, 3),
      )
      .join(''),

  courseStatus:
    panel(60, 100, 480, 200) +
    `<circle cx="130" cy="200" r="34" fill="${BRAND}"/>` +
    '<path d="M114 200 l12 12 l22 -24" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
    heading(190, 168, 190, BRAND) +
    lines(190, 202, 320, 3) +
    rect(190, 262, 140, 8, PHOTO, 3),

  courseRecord:
    panel(60, 90, 480, 220) +
    rect(84, 114, 150, 10, DARK, 3) +
    `<text x="84" y="214" font-family="Georgia,serif" font-size="82" font-weight="700" fill="${BRAND}">62</text>` +
    lines(84, 240, 210, 2) +
    lines(330, 120, 190, 6, TEXT, 26) +
    rect(330, 130, 90, 8, DARK, 3),

  newsFeed: [0, 1, 2]
    .map(
      (i) =>
        panel(30 + i * 185, 60, 170, 280) +
        photo(40 + i * 185, 70, 150, 100) +
        rect(40 + i * 185, 186, 50, 14, BRAND, 7) +
        heading(40 + i * 185, 214, 140) +
        lines(40 + i * 185, 240, 150, 3) +
        rect(40 + i * 185, 310, 60, 6, TEXT, 3),
    )
    .join(''),

  eventsFeed: [0, 1, 2, 3]
    .map(
      (i) =>
        panel(40, 40 + i * 78, 520, 66) +
        rect(54, 50 + i * 78, 46, 46, BRAND, 6) +
        rect(66, 62 + i * 78, 22, 8, '#fff', 3) +
        rect(62, 78 + i * 78, 30, 8, '#fff', 3) +
        rect(116, 56 + i * 78, 180 + (i % 2) * 60, 9, DARK, 3) +
        rect(116, 76 + i * 78, 120, 7, TEXT, 3) +
        rect(480, 62 + i * 78, 64, 20, PHOTO, 10),
    )
    .join(''),
}

/** The wireframe for a block as an image address Payload can show, or none for an unknown block. */
export const blockPreview = (slug: string): { url: string; alt: string } | undefined => {
  const art = pictures[slug]
  if (!art) return undefined
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400">` +
    `<rect width="600" height="400" fill="${BG}"/>${art}</svg>`
  return {
    url: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
    alt: 'A wireframe of what this block looks like',
  }
}
