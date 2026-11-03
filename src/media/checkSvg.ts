import DOMPurify from 'dompurify'
import { JSDOM } from 'jsdom'
import type { CollectionBeforeChangeHook } from 'payload'

/** The largest SVG a club can upload. Logos and icons are a few KB; this stops a huge file. */
export const MAX_SVG_BYTES = 1024 * 1024

const SVG_NS = 'http://www.w3.org/2000/svg'
const OK_NAMESPACES = new Set([
  'http://www.w3.org/2000/xmlns/',
  'http://www.w3.org/1999/xlink',
  'http://www.w3.org/XML/1998/namespace',
])
const NOT_ALLOWED =
  'This SVG contains scripts, links or other content that isn’t allowed. Export it again as a plain SVG (in Illustrator choose “SVG 1.1” and “Presentation Attributes”; in Figma use Export → SVG).'

const purify = DOMPurify(new JSDOM('').window as unknown as Window & typeof globalThis)

// Only links to another part of the same drawing (gradients, symbols). A link to a web
// address could make every visitor's browser fetch it, which tracks who views the page.
purify.addHook('uponSanitizeAttribute', (_node, data) => {
  if (
    (data.attrName === 'href' || data.attrName === 'xlink:href') &&
    !data.attrValue.startsWith('#')
  ) {
    data.keepAttr = false
    data.forceKeepAttr = false
  }
})

/**
 * Checks that an SVG is plain artwork: shapes, paths, gradients and text. Anything that could
 * run code or reach outside the drawing (scripts, event handlers like onload, embedded web
 * pages, links to other addresses, animations that set links) is a reason to refuse the file,
 * not to quietly edit it: the file stored is then exactly the file that was checked.
 * Returns what's wrong in plain English, or null if the file is safe.
 */
export const svgProblem = (file: Buffer): string | null => {
  if (file.length > MAX_SVG_BYTES)
    return 'This SVG is over 1 MB. Logos and icons are normally far smaller.'
  const text = file.toString('utf8')
  if (!/<svg[\s>]/i.test(text)) return 'This doesn’t look like an SVG file.'
  if (/<!ENTITY/i.test(text))
    return 'This SVG uses features that can’t be checked. Export it again as a plain SVG.'
  // Stylesheets inside the SVG may style it, but not load anything or point at other addresses.
  for (const style of text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) {
    if (/@import|url\(\s*(?!['"]?#)/i.test(style[1])) {
      return 'This SVG’s styling links to another address. Export it again as a plain SVG.'
    }
  }
  if (/url\(\s*['"]?(?!#)/i.test(text.replace(/<style[\s\S]*?<\/style>/gi, ''))) {
    return 'This SVG links to another address. Export it again as a plain SVG.'
  }
  // Read it the way a browser reads an SVG file: strict XML. An HTML-style parse can see a
  // different document from the browser, so a file could pass the check yet run code.
  let doc: Document
  try {
    doc = new JSDOM(text, { contentType: 'image/svg+xml' }).window.document
  } catch {
    return 'This SVG is damaged or not valid. Export it again as a plain SVG.'
  }
  const root = doc.documentElement
  if (root.localName !== 'svg' || root.namespaceURI !== SVG_NS) {
    return 'This doesn’t look like an SVG file.'
  }
  const everything = [root, ...Array.from(root.querySelectorAll('*'))]
  const odd = everything.some(
    (el) =>
      el.namespaceURI !== SVG_NS ||
      Array.from(el.attributes).some((a) => a.namespaceURI && !OK_NAMESPACES.has(a.namespaceURI)),
  )
  const hasOddNodes = (node: Node): boolean =>
    Array.from(node.childNodes).some(
      (n) => n.nodeType === 4 || n.nodeType === 7 || (n.nodeType === 1 && hasOddNodes(n)),
    )
  if (odd || hasOddNodes(root)) return NOT_ALLOWED
  purify.sanitize(root, { USE_PROFILES: { svg: true, svgFilters: true }, RETURN_DOM: true })
  const removed = purify.removed.filter(
    (r) =>
      ('element' in r &&
        r.element.nodeType === 1 &&
        !/^(body|head|html)$/i.test(r.element.nodeName)) ||
      'attribute' in r,
  )
  if (removed.length > 0) return NOT_ALLOWED
  return null
}

/** Media: refuses an unsafe SVG. Runs on server uploads and on browser uploads, whose file
 * Payload downloads from storage to read before the record is saved. */
export const checkSvgUpload: CollectionBeforeChangeHook = ({ data, req }) => {
  const file = req.file
  // Judged by what the file contains, not only the type the browser reported.
  const looksLikeSvg = file?.data && /<svg[\s>]/i.test(file.data.subarray(0, 4096).toString('utf8'))
  if (file?.data && (file.mimetype === 'image/svg+xml' || looksLikeSvg)) {
    if (file.mimetype !== 'image/svg+xml') throw new Error('This file isn’t what it claims to be.')
    const problem = svgProblem(file.data)
    if (problem) throw new Error(problem)
  }
  return data
}
