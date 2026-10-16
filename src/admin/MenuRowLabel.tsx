'use client'

import { useRowLabel } from '@payloadcms/ui'

/** Collapsed menu items and footer columns show their own text, not "Menu item 01". */
export const MenuRowLabel = () => {
  const { data, rowNumber } = useRowLabel<{ label?: string }>()
  return <span>{data?.label?.trim() || `Menu item ${(rowNumber ?? 0) + 1}`}</span>
}

export const ColumnRowLabel = () => {
  const { data, rowNumber } = useRowLabel<{ heading?: string }>()
  return <span>{data?.heading?.trim() || `Column ${(rowNumber ?? 0) + 1}`}</span>
}
