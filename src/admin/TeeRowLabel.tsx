'use client'

import { useRowLabel } from '@payloadcms/ui'

import { teeName, type TeeColour, type TeePlayers } from '@/collections/courseTees'

/** A collapsed tee shows its own name ("Women's red", "Winter yellow"), not "Tee 03". */
export const TeeRowLabel = () => {
  const { data, rowNumber } = useRowLabel<{
    colour?: TeeColour
    name?: string | null
    players?: TeePlayers | null
    winter?: boolean | null
  }>()
  const name = data?.colour ? teeName({ ...data, colour: data.colour }) : null
  return <span>{name ?? `Tee ${(rowNumber ?? 0) + 1}`}</span>
}
