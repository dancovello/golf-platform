import sharp from 'sharp'

import { sceneSVG, type SceneOptions } from './sceneSVG'

/**
 * Placeholder pictures for the demo club, drawn in code: no photos are copied from anywhere,
 * and there's no text in them (servers may have no fonts). Each is a simple illustrated
 * landscape or a portrait silhouette, varied by time of day so pages don't look identical.
 */

export type { SceneOptions }

/** A landscape JPEG: sky, sun, three ridges, a fairway, trees and sometimes a flag. */
export const scene = async (width: number, height: number, o: SceneOptions) =>
  sharp(Buffer.from(sceneSVG(width, height, o)))
    .jpeg({ quality: 82 })
    .toBuffer()

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
