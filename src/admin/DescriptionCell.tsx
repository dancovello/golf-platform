'use client'

import type { DefaultCellComponentProps } from 'payload'

/** The photo library's Description column: the description, or a marker when there's none. */
export const DescriptionCell = ({ cellData }: DefaultCellComponentProps) =>
  typeof cellData === 'string' && cellData.trim() ? (
    <span>{cellData}</span>
  ) : (
    <span className="needs-description">Needs description</span>
  )
