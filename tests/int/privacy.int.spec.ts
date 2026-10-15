/**
 * Club Settings → Privacy & legal, and the footer email and address the policy needs.
 * Each club's privacy details reach only its own website.
 */
import { beforeAll, describe, expect, it } from 'vitest'

import { loadClubBySlug } from '@/site/loadClub'
import { policyFacts } from '@/site/privacy/policy'

import { seedWorld, type World } from './helpers/seed'

let w: World

beforeAll(async () => {
  w = await seedWorld()
})

const errorPaths = (e: unknown) =>
  ((e as { data?: { errors?: { path: string }[] } }).data?.errors ?? []).map((x) => x.path)

const save = (id: string, data: Record<string, unknown>, user = w.editorA) =>
  w.payload.update({
    collection: 'club-settings',
    id,
    data: data as never,
    overrideAccess: false,
    user,
  })

const words = (text: string) => ({
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: [
      {
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        textFormat: 0,
        children: [
          { type: 'text', text, format: 0, detail: 0, mode: 'normal', style: '', version: 1 },
        ],
      },
    ],
  },
})

describe('privacy settings', () => {
  it("an editor fills in their club's privacy details and the website reads them", async () => {
    await save(w.settingsA.id, {
      privacy: {
        legalName: 'Test Club A Limited',
        email: 'privacy@club-a.example',
        newsletterProvider: 'Mailchimp',
        gaMeasurementId: 'G-AB12CD34EF',
        additionalInfo: words('We use CCTV in the car park.'),
      },
    })
    const club = await loadClubBySlug('test-club-a')
    expect(club?.privacy).toMatchObject({
      legalName: 'Test Club A Limited',
      email: 'privacy@club-a.example',
      newsletterProvider: 'Mailchimp',
      gaMeasurementId: 'G-AB12CD34EF',
    })
    const facts = policyFacts({
      name: club!.name,
      phone: club!.header.phone,
      email: club!.footer.email,
      address: club!.footer.address,
      privacy: club!.privacy,
    })
    expect(facts.features).toMatchObject({ newsletter: true, ga: true })
    expect(facts.additionalInfo).not.toBeNull()
  })

  it("club A's privacy details never reach club B's website", async () => {
    const clubB = await loadClubBySlug('test-club-b')
    expect(clubB?.privacy).toEqual({
      legalName: null,
      email: null,
      newsletterProvider: null,
      gaMeasurementId: null,
      additionalInfo: null,
    })
    expect(JSON.stringify(clubB)).not.toMatch(/Club A|club-a|AB12CD34EF|CCTV/)
  })

  it("an editor can't change another club's privacy details", async () => {
    await expect(
      save(w.settingsB.id, { privacy: { gaMeasurementId: 'G-ZZZZ9999' } }),
    ).rejects.toThrow()
    const clubB = await loadClubBySlug('test-club-b')
    expect(clubB?.privacy.gaMeasurementId).toBeNull()
  })

  it('refuses a Google Analytics ID in the wrong shape', async () => {
    for (const bad of ['UA-1234-1', 'G-ab"><script>', 'GTM-ABC123']) {
      const e = await save(w.settingsA.id, { privacy: { gaMeasurementId: bad } }).catch((x) => x)
      expect(errorPaths(e), bad).toContain('privacy.gaMeasurementId')
    }
  })

  it("refuses a link in the additional information to another club's page", async () => {
    const linked = {
      root: {
        ...words('').root,
        children: [
          {
            ...words('').root.children[0],
            children: [
              {
                type: 'link',
                version: 3,
                direction: 'ltr',
                format: '',
                indent: 0,
                fields: {
                  linkType: 'internal',
                  newTab: false,
                  doc: { relationTo: 'pages', value: w.pageB.id },
                },
                children: [
                  {
                    type: 'text',
                    text: 'See here',
                    format: 0,
                    detail: 0,
                    mode: 'normal',
                    style: '',
                    version: 1,
                  },
                ],
              },
            ],
          },
        ],
      },
    }
    const e = await save(w.settingsA.id, { privacy: { additionalInfo: linked } }).catch((x) => x)
    expect(errorPaths(e)).toContain('privacy.additionalInfo')
  })
})

describe('the footer email and address are required', () => {
  it('refuses a save that empties them', async () => {
    const e = await save(w.settingsA.id, { footer: { email: '', address: '  ' } }).catch((x) => x)
    expect(errorPaths(e)).toEqual(expect.arrayContaining(['footer.email', 'footer.address']))
  })

  it('still checks the email is an email', async () => {
    const e = await save(w.settingsA.id, { footer: { email: 'not-an-email' } }).catch((x) => x)
    expect(errorPaths(e)).toContain('footer.email')
  })

  it("doesn't stop a new club being created with blank settings", async () => {
    const club = await w.payload.create({ collection: 'tenants', data: { name: 'Brand New' } })
    const site = await loadClubBySlug(club.slug!)
    expect(site?.footer.email).toBeNull()
    expect(site?.footer.address).toBeNull()
  })
})
