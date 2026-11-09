/**
 * Team style C: moves the person in `slot` to the lead spot (index 0) and the person who was
 * leading takes that slot, so the list keeps its order and the pressed button keeps focus.
 */
export const swapLead = (order: string[], slot: number): string[] => {
  if (slot <= 0 || slot >= order.length) return order
  const next = [...order]
  const lead = next[0] as string
  next[0] = next[slot] as string
  next[slot] = lead
  return next
}
