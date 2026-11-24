'use client'

import { useRowLabel } from '@payloadcms/ui'

/** A collapsed results row reads like the website: "1. J. Smith · 42". */
export const ResultRowLabel = () => {
  const { data, rowNumber } = useRowLabel<{ position?: string; name?: string; score?: string }>()
  const position = data?.position?.trim() || String((rowNumber ?? 0) + 1)
  const text = [data?.name?.trim(), data?.score?.trim()].filter(Boolean).join(' · ')
  return <span>{text ? `${position}. ${text}` : `Row ${(rowNumber ?? 0) + 1}`}</span>
}
