'use client'

import { useRowLabel } from '@payloadcms/ui'

/** A collapsed results table shows its title and size: "Division 1 · 24 rows". */
export const ResultTableLabel = () => {
  const { data, rowNumber } = useRowLabel<{ title?: string; rows?: unknown[] }>()
  const rows = data?.rows?.length ?? 0
  const title = data?.title?.trim() || `Table ${(rowNumber ?? 0) + 1}`
  return <span>{rows ? `${title} · ${rows} ${rows === 1 ? 'row' : 'rows'}` : title}</span>
}
