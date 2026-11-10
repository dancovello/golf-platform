'use client'

import { useMemo, useState } from 'react'

import { ArrowRight, Expand } from '../components/Icons'
import { Viewer, type ViewerItem } from './Viewer'

export type GalleryItem = ViewerItem & {
  album: string | null
  width: number | null
  height: number | null
}

const PAGE = 12

/**
 * Where a row ends when `count` photos sit `across` to a row: full rows, but a short last row
 * is evened out with the row above it (7 across 4 is 4 + 3, 6 is 3 + 3, 5 is 3 + 2), so a photo
 * is never alone and every photo keeps the same size. Returns the sizes of the rows.
 */
export const rowSizes = (count: number, across: number): number[] => {
  if (count <= across) return [count]
  const full = Math.floor(count / across)
  const rest = count % across
  const rows = Array<number>(full).fill(across)
  if (rest === 0) return rows
  if (across <= 2) return [...rows, rest]
  const both = across + rest
  rows.pop()
  return [...rows, Math.ceil(both / 2), Math.floor(both / 2)]
}

/** The photo numbers (from 1) after which a row ends, ignoring the last row. */
const breaksFor = (count: number, across: number): Set<number> => {
  const ends = new Set<number>()
  let sum = 0
  for (const size of rowSizes(count, across).slice(0, -1)) ends.add((sum += size))
  return ends
}

/**
 * Gallery (docs/design/11): A Masonry (natural shapes, album filters), B Grid (1:1, 12 at a time
 * with "Load more"), C Viewer (on the page). In A and B every photo is a button that opens the
 * full-screen viewer at that photo.
 */
export const GalleryView = ({
  items,
  style,
  heading,
}: {
  items: GalleryItem[]
  style: 'masonry' | 'grid' | 'viewer'
  heading: string
}) => {
  const [album, setAlbum] = useState<string | null>(null)
  const [shown, setShown] = useState(PAGE)
  const [open, setOpen] = useState<number | null>(null)
  const [inline, setInline] = useState(0)

  const albums = useMemo(
    () => [...new Set(items.map((i) => i.album).filter((a): a is string => Boolean(a)))],
    [items],
  )
  const filtered = album ? items.filter((i) => i.album === album) : items
  const visible = style === 'grid' ? filtered.slice(0, shown) : filtered

  if (style === 'viewer') {
    return <Viewer items={items} index={inline} onIndex={setInline} label={heading} />
  }

  return (
    <>
      {style === 'masonry' && albums.length > 0 ? (
        <div className="gl-filters" role="group" aria-label="Albums">
          {[null, ...albums].map((a) => (
            <button
              key={a ?? 'all'}
              type="button"
              className={`gl-filter t-label-s${album === a ? ' is-active' : ''}`}
              aria-pressed={album === a}
              onClick={() => setAlbum(a)}
            >
              {a ?? 'All'}
            </button>
          ))}
        </div>
      ) : null}
      <ul className={`gl-${style}${style === 'grid' && visible.length <= 2 ? ' gl-few' : ''}`}>
        {visible.flatMap((item, i) => [
          <li key={`${item.src}-${i}`}>
            <button
              type="button"
              className="gl-item"
              onClick={() => setOpen(i)}
              aria-label={`Open photo: ${item.alt}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- sized copies via srcset from R2 */}
              <img
                src={item.src}
                srcSet={item.srcSet ?? undefined}
                sizes={
                  style === 'grid'
                    ? '(max-width: 767px) 50vw, 300px'
                    : '(max-width: 767px) 100vw, 400px'
                }
                alt={item.alt}
                loading="lazy"
                width={item.width ?? undefined}
                height={item.height ?? undefined}
                style={{ objectPosition: item.position }}
              />
              <span className="gl-expand" aria-hidden="true">
                <Expand />
              </span>
            </button>
          </li>,
          ...(style === 'grid'
            ? (
                [
                  ['gl-break-wide', 4],
                  ['gl-break-mid', 3],
                ] as const
              ).flatMap(([cls, across]) =>
                breaksFor(visible.length, across).has(i + 1)
                  ? [<li key={`${cls}-${i}`} className={`gl-break ${cls}`} aria-hidden="true" />]
                  : [],
              )
            : []),
        ])}
      </ul>
      {style === 'grid' && filtered.length > PAGE ? (
        <div className="gl-more">
          <p className="t-label-s" aria-live="polite">
            Showing {visible.length} of {filtered.length}
          </p>
          {visible.length < filtered.length ? (
            <button
              type="button"
              className="btn btn-outline t-label-button"
              onClick={() => setShown(shown + PAGE)}
            >
              Load more <ArrowRight />
            </button>
          ) : null}
        </div>
      ) : null}
      {open !== null ? (
        <Viewer
          items={visible}
          index={open}
          onIndex={setOpen}
          onClose={() => setOpen(null)}
          label={heading}
        />
      ) : null}
    </>
  )
}
