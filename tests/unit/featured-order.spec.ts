import { describe, expect, it } from 'vitest'

import { swapLead } from '../../src/site/blocks/featuredOrder'

describe('swapLead: pressing someone in the featured team list', () => {
  it('brings them to the lead spot and puts the lead in their place', () => {
    expect(swapLead(['a', 'b', 'c', 'd'], 2)).toEqual(['c', 'b', 'a', 'd'])
  })
  it('keeps the list in order when the same person is brought back', () => {
    const once = swapLead(['a', 'b', 'c'], 1)
    expect(once).toEqual(['b', 'a', 'c'])
    expect(swapLead(once, 1)).toEqual(['a', 'b', 'c'])
  })
  it('ignores the lead spot and slots that do not exist', () => {
    const order = ['a', 'b']
    expect(swapLead(order, 0)).toBe(order)
    expect(swapLead(order, 5)).toBe(order)
  })
})
