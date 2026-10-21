import type { CSSProperties } from 'react'

import type { PreviewData } from '@/marketing/demo/previews'

/**
 * Figma Preview/Course Status, News Post, Green Fees, Hole Guide: a picture of one of a club's
 * live blocks, in the demo club's colours. Inert and hidden from screen readers: the text
 * around it carries the meaning.
 */
export const PreviewCard = ({ preview, theme }: { preview: PreviewData; theme: CSSProperties }) => (
  <div className="club-theme mk-moment-preview" style={theme} inert aria-hidden="true">
    <p className="mk-preview-title">{preview.title}</p>
    <p className="mk-preview-status">
      <span className="mk-preview-dot" aria-hidden="true" />
      <span>{preview.status}</span>
      <span className="mk-preview-when">{preview.when}</span>
    </p>
    <dl>
      {preview.rows.map(([term, value]) => (
        <div key={term}>
          <dt>{term}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  </div>
)
