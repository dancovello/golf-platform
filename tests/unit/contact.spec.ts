import { describe, expect, it } from 'vitest'

import { referencePrefix } from '@/site/contact/reference'
import { formatReplyDate, replyByDate, ukToday } from '@/site/contact/replyBy'
import { EMPTY_VALUES, validateContact } from '@/site/contact/validate'

const replyBy = (iso: string, days: number) => formatReplyDate(replyByDate(new Date(iso), days))

describe('the date a club promises to reply by', () => {
  it('counts working days, skipping the weekend', () => {
    expect(replyBy('2026-10-14T09:00:00Z', 1)).toBe('Thursday 15 October') // Wednesday
    expect(replyBy('2026-10-16T09:00:00Z', 1)).toBe('Monday 19 October') // Friday
    expect(replyBy('2026-10-17T09:00:00Z', 1)).toBe('Monday 19 October') // Saturday
    expect(replyBy('2026-10-16T09:00:00Z', 3)).toBe('Wednesday 21 October')
  })

  it('uses the UK date, not the server’s', () => {
    // 23:30 UTC on a Friday is already Saturday in London (summer time).
    expect(ukToday(new Date('2026-07-17T23:30:00Z'))).toBe('2026-07-18')
    expect(replyBy('2026-07-17T23:30:00Z', 1)).toBe('Monday 20 July')
  })
})

describe('enquiry references', () => {
  it('start with the club’s initials, leaving out "Golf"', () => {
    expect(referencePrefix('Heathcote Golf Club')).toBe('HC')
    expect(referencePrefix('Saltmarsh Links')).toBe('SL')
    expect(referencePrefix('The Royal St. George’s Golf Club')).toBe('RSG')
    expect(referencePrefix('   ')).toBe('CL')
  })
})

describe('the Contact form’s rules', () => {
  const rules = { membershipTypes: [], today: '2026-10-16' }
  it('asks for a name, an email address and a message', () => {
    expect(validateContact(EMPTY_VALUES, rules)).toEqual({
      name: 'Tell us your name',
      email: 'Enter your email address',
      message: 'Tell us how we can help',
    })
  })

  it('asks membership enquiries which membership, typed when the club lists none', () => {
    const v = { ...EMPTY_VALUES, purpose: 'membership' as const }
    expect(validateContact(v, rules).membershipType).toBe(
      'Tell us which membership you’re interested in',
    )
  })

  it('accepts a UK phone number but not letters', () => {
    const v = { ...EMPTY_VALUES, name: 'A', email: 'a@example.com', message: 'Hi' }
    expect(validateContact({ ...v, phone: '07700 900123' }, rules)).toEqual({})
    expect(validateContact({ ...v, phone: '+44 (0)1932 704500' }, rules)).toEqual({})
    expect(validateContact({ ...v, phone: 'call me' }, rules).phone).toMatch(/numbers only/)
  })
})
