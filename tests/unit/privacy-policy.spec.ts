/**
 * The privacy policy template (src/site/privacy). Drawn with every feature off and every
 * feature on, it must never show a raw placeholder, must leave out every unused feature
 * completely, and must keep its section numbers in order.
 */
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import {
  isGAMeasurementID,
  PLATFORM_NAME,
  POLICY_LAST_UPDATED,
  policyFacts,
  type PolicyFacts,
  type PrivacySettings,
  RETENTION,
} from '@/site/privacy/policy'
import { PrivacyPolicy } from '@/site/privacy/PrivacyPolicy'

const noPrivacy: PrivacySettings = {
  legalName: null,
  email: null,
  newsletterProvider: null,
  gaMeasurementId: null,
  additionalInfo: null,
}

const club = {
  name: 'Oakwood Golf Club',
  phone: '01234 567890',
  email: 'office@oakwood.example',
  address: 'Oakwood Lane\nGuildford\nGU1 1AA',
  privacy: noPrivacy,
}

const words = (text: string) => ({
  root: { children: [{ type: 'paragraph', children: [{ type: 'text', text }] }] },
})

const draw = (facts: PolicyFacts, additional?: string) => {
  const html = renderToStaticMarkup(
    createElement(PrivacyPolicy, {
      facts,
      platformName: PLATFORM_NAME,
      lastUpdated: POLICY_LAST_UPDATED,
      additional: additional ? createElement('p', null, additional) : undefined,
    }),
  )
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
  const headings = [...html.matchAll(/<h2[^>]*>(.*?)<\/h2>/g)].map((m) =>
    m[1]!.replace(/<!-- -->/g, ''),
  )
  return { html, text, headings }
}

const allOn = (): PolicyFacts => ({
  ...policyFacts({
    ...club,
    privacy: {
      legalName: 'Oakwood Golf Club Limited',
      email: 'privacy@oakwood.example',
      newsletterProvider: 'Mailchimp',
      gaMeasurementId: 'G-AB12CD34EF',
      additionalInfo: words('We use CCTV in the car park.'),
    },
  }),
  // Not built yet, so policyFacts never turns these on; the template must still handle them.
  features: { newsletter: true, accounts: true, bookings: true, payments: true, ga: true },
})

const placeholders = /\{\{|\}\}|\[IF|\[END\]|\{retention|undefined|null|\[object/

describe('privacy policy, every feature off', () => {
  const { html, text, headings } = draw(policyFacts(club))

  it('shows no placeholder text', () => {
    expect(text).not.toMatch(placeholders)
  })

  it('says nothing about bookings, accounts, payments, Google, newsletters or a cookie banner', () => {
    for (const word of [
      /booking/i,
      /account/i,
      /stripe/i,
      /payment/i,
      /card/i,
      /google/i,
      /newsletter/i,
      /banner/i,
      /cookie settings/i,
      /logged in/i,
      /junior/i,
    ]) {
      expect(text, String(word)).not.toMatch(word)
    }
  })

  it('has one main heading and twelve sections numbered in order (no additional information)', () => {
    expect(html.match(/<h1/g)).toHaveLength(1)
    expect(headings).toHaveLength(12)
    headings.forEach((h, i) => expect(h.startsWith(`${i + 1}. `), h).toBe(true))
    expect(headings.at(-1)).toBe('12. Contact us')
    expect(text).not.toMatch(/Additional information/)
  })

  it('says nothing about analytics, because none runs without Google Analytics', () => {
    expect(text).not.toMatch(/vercel|analytics|pages viewed/i)
    expect(text).toContain('Visit the website (server logs)')
  })

  it('names the platform and keeps the shared retention periods', () => {
    expect(text).toContain(`platform provided by ${PLATFORM_NAME}`)
    expect(text).toContain(RETENTION.enquiries)
    expect(text).toContain(RETENTION.serverLogs)
    expect(text).not.toContain(RETENTION.ga)
  })

  it('uses the fallbacks: club name, footer email, phone shown', () => {
    expect(text).toContain('Oakwood Golf Club, Oakwood Lane, Guildford, GU1 1AA, is responsible')
    expect(html).toContain('href="mailto:office@oakwood.example"')
    expect(text).toContain('Phone: 01234 567890')
  })

  it('gives every table proper column and row headings', () => {
    expect(html.match(/<table/g)).toHaveLength(2)
    expect(html.match(/<th scope="col"/g)).toHaveLength(6)
    expect(html).toContain('<th scope="row">')
  })
})

describe('privacy policy, every feature on', () => {
  const { text, headings } = draw(allOn(), 'We use CCTV in the car park.')

  it('shows no placeholder text', () => {
    expect(text).not.toMatch(placeholders)
  })

  it('includes every optional part', () => {
    for (const phrase of [
      'Sign up to our newsletter',
      'We use Mailchimp to manage the list',
      'Create or use a member account',
      'Make a booking',
      'Pay online or give a card guarantee',
      'Pages viewed, device and browser type',
      'Consent (Google Analytics, only if you accept analytics cookies)',
      'independent controller',
      'such as keeping you logged in or holding a booking slot while you pay',
      'Cookie settings',
      'Mailchimp, to send our newsletter',
      'Stripe, to process payments',
      'Google, for analytics, only if you consent',
      RETENTION.newsletter,
      RETENTION.accounts,
      RETENTION.bookings,
      RETENTION.ga,
      'Junior members under 13',
      'We use CCTV in the car park.',
    ]) {
      expect(text, phrase).toContain(phrase)
    }
  })

  it('uses the legal name and privacy email, and numbers thirteen sections', () => {
    expect(text).toContain('Oakwood Golf Club Limited, Oakwood Lane')
    expect(text).toContain('privacy@oakwood.example')
    expect(text).not.toContain('office@oakwood.example')
    expect(headings).toHaveLength(13)
    headings.forEach((h, i) => expect(h.startsWith(`${i + 1}. `), h).toBe(true))
    expect(headings[11]).toBe('12. Additional information')
    expect(headings[12]).toBe('13. Contact us')
  })
})

describe('privacy policy facts', () => {
  it('hides the phone line when there is no phone', () => {
    const { text } = draw(policyFacts({ ...club, phone: null }))
    expect(text).not.toContain('Phone:')
  })

  it('leaves out the address and email lines until the club adds them', () => {
    const { text } = draw(policyFacts({ ...club, email: null, address: null }))
    expect(text).not.toMatch(placeholders)
    expect(text).toContain('Oakwood Golf Club is responsible')
    expect(text).toContain('contact us using the details below')
    expect(text).not.toContain('Email:')
  })

  it('treats an emptied "Additional information" box as empty', () => {
    const facts = policyFacts({ ...club, privacy: { ...noPrivacy, additionalInfo: words('  ') } })
    expect(facts.additionalInfo).toBeNull()
  })

  it('turns the newsletter on from the newsletter service, and never the unbuilt features', () => {
    const facts = policyFacts({
      ...club,
      privacy: { ...noPrivacy, newsletterProvider: 'Mailchimp' },
    })
    expect(facts.features).toEqual({
      newsletter: true,
      accounts: false,
      bookings: false,
      payments: false,
      ga: false,
    })
  })

  it('falls back to a general newsletter description', () => {
    expect(policyFacts(club).newsletterProvider).toBe('our email marketing provider')
  })

  it('accepts only real Google Analytics 4 IDs', () => {
    expect(isGAMeasurementID('G-AB12CD34EF')).toBe(true)
    expect(isGAMeasurementID('G-1234')).toBe(true)
    for (const bad of ['UA-12345-1', 'G-', 'g-ab12cd', 'G-AB12"><script>', 'GTM-ABC123', 42]) {
      expect(isGAMeasurementID(bad), String(bad)).toBe(false)
    }
  })
})
