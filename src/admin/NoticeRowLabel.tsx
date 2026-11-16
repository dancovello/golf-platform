'use client'

import { useRowLabel } from '@payloadcms/ui'

/** A collapsed planned notice shows its words, not "Notice 01". */
export const NoticeRowLabel = () => {
  const { data, rowNumber } = useRowLabel<{ message?: string; appliesTo?: string }>()
  const text = [data?.appliesTo?.trim(), data?.message?.trim()].filter(Boolean).join(': ')
  return <span>{text || `Notice ${(rowNumber ?? 0) + 1}`}</span>
}
