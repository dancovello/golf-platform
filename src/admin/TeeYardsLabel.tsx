'use client'

import { FieldLabel, useFormFields } from '@payloadcms/ui'

import { teeName, teeSlots, type TeeColour, type TeePlayers } from '@/collections/courseTees'

type Props = { path?: string; required?: boolean }

/**
 * A hole's yards box is labelled with the tee it belongs to ("Women's red yards"), not its
 * storage slot. Tees keep their slot when reordered, so the label follows the right tee.
 */
export const TeeYardsLabel = ({ path, required }: Props) => {
  const slot = Number(/yards(\d+)$/.exec(path ?? '')?.[1] ?? 0)
  const label = useFormFields(([fields]) => {
    const count = Number(fields.tees?.value ?? 0)
    const tees = Array.from({ length: count }, (_, i) => ({
      colour: fields[`tees.${i}.colour`]?.value as TeeColour,
      name: fields[`tees.${i}.name`]?.value as string | undefined,
      players: fields[`tees.${i}.players`]?.value as TeePlayers | undefined,
      winter: fields[`tees.${i}.winter`]?.value as boolean | undefined,
      slot: fields[`tees.${i}.slot`]?.value as number | undefined,
    }))
    const at = teeSlots(tees).indexOf(slot)
    const tee = tees[at]
    return tee?.colour ? `${teeName(tee)} yards` : `Tee ${slot} yards`
  })
  return <FieldLabel label={label} path={path} required={required} />
}
