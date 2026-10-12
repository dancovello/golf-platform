import type { CollectionBeforeValidateHook, CollectionConfig, Field } from 'payload'
import { ValidationError } from 'payload'

import { loggedIn, superAdminOnly } from '../access/roles'
import { linkField } from '../fields/link'
import { checkSameClub } from '../site/sameClub'
import { BRAND_INPUTS, type Brand, contrastProblems, DEFAULT_BRAND, isHex } from '../theme/colour'
import { DEFAULT_FONT_SET, FONT_SETS } from '../theme/fontSets'

const colourHelp: Record<keyof Brand, string> = {
  primary: 'Brand bands, headers and solid buttons.',
  secondary: 'A softer supporting colour, mixed into subtle backgrounds and eyebrow text.',
  accent: 'The main call-to-action colour. Used sparingly.',
  light: 'The page background. Usually a near-white.',
  dark: 'Body text and headings. Usually a near-black.',
}

const colourField = (name: keyof Brand): Field => ({
  name,
  type: 'text',
  required: true,
  defaultValue: DEFAULT_BRAND[name],
  admin: { description: `${colourHelp[name]} Six-digit colour code, e.g. ${DEFAULT_BRAND[name]}.` },
  validate: (value: unknown) =>
    isHex(value) ? true : 'Enter a six-digit colour code like #1B2A22.',
})

const logoField = (name: string, label: string, description: string): Field => ({
  name,
  label,
  type: 'upload',
  relationTo: 'media',
  // Images only; the same-club check (src/site/sameClub.ts) refuses another club's file.
  filterOptions: { mimeType: { in: ['image/png', 'image/webp', 'image/avif', 'image/jpeg'] } },
  admin: { description },
})

/** Doc 08 rule 4: refuse colours that would make text hard to read, and say which. */
const checkBrandContrast: CollectionBeforeValidateHook = ({ collection, data, originalDoc }) => {
  const branding = { ...originalDoc?.branding, ...data?.branding } as Partial<Brand>
  const brand = Object.fromEntries(
    BRAND_INPUTS.map((key) => [key, branding[key] ?? DEFAULT_BRAND[key]]),
  ) as Brand
  if (!BRAND_INPUTS.every((key) => isHex(brand[key]))) return data // field validation explains
  const problems = contrastProblems(brand)
  if (problems.length > 0) {
    throw new ValidationError({
      collection: collection.slug,
      errors: problems.map((p) => ({
        path: `branding.${p.field}`,
        message: `${p.pair} would be hard to read (contrast ${p.ratio}:1, needs at least 4.5:1).`,
      })),
    })
  }
  return data
}

// One record per club (src/tenancy.ts, plugin "global" mode). Never a real Payload global,
// which would be shared by every club.
export const ClubSettings: CollectionConfig = {
  slug: 'club-settings',
  labels: { singular: 'Club Settings', plural: 'Club Settings' },
  lockDocuments: false,
  admin: { useAsTitle: 'clubName' },
  // Created and removed with the club by the super-admin; editors only update their own.
  access: { create: superAdminOnly, read: loggedIn, update: loggedIn, delete: superAdminOnly },
  hooks: { beforeValidate: [checkBrandContrast, checkSameClub] },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Branding',
          fields: [
            {
              name: 'clubName',
              label: 'Club name shown on the website',
              type: 'text',
              required: true,
            },
            {
              name: 'branding',
              type: 'group',
              label: 'Branding',
              admin: {
                description:
                  'Five colours set the whole site. Every block works out its own shades from these, and colours that would make text hard to read are refused.',
              },
              fields: [
                {
                  type: 'row',
                  fields: BRAND_INPUTS.map(colourField),
                },
                {
                  name: 'fontSet',
                  label: 'Font set',
                  type: 'select',
                  required: true,
                  defaultValue: DEFAULT_FONT_SET,
                  options: Object.entries(FONT_SETS).map(([value, set]) => ({
                    value,
                    label: set.label,
                  })),
                },
                {
                  type: 'row',
                  fields: [
                    logoField(
                      'logoOnLight',
                      'Logo for light backgrounds',
                      'Shown on the page background. A dark logo, PNG or WebP with a transparent background.',
                    ),
                    logoField(
                      'logoOnDark',
                      'Logo for dark backgrounds',
                      'Shown over photos and on the brand colour. A light logo. Falls back to the club name in the heading font.',
                    ),
                  ],
                },
                {
                  name: 'strapline',
                  label: 'Line under the club name',
                  type: 'text',
                  maxLength: 40,
                  admin: { description: 'Used when there is no logo, e.g. "Golf Club · 1926".' },
                },
              ],
            },
          ],
        },
        {
          label: 'Header and menu',
          fields: [
            {
              name: 'header',
              type: 'group',
              label: false,
              fields: [
                {
                  name: 'style',
                  label: 'Header style',
                  type: 'select',
                  required: true,
                  defaultValue: 'classic',
                  options: [
                    {
                      label: 'A · Classic: menu left, logo centred, booking button right',
                      value: 'classic',
                    },
                    {
                      label: 'B · Transparent: sits over the hero photo, turns solid as you scroll',
                      value: 'transparent',
                    },
                    { label: 'C · App bar: compact single bar, always visible', value: 'appBar' },
                  ],
                },
                {
                  ...linkField({ name: 'booking', label: 'Booking button', required: false }),
                  admin: {
                    description:
                      'The "Book a tee time" button on every page. Usually your booking provider’s web address. Leave the text empty to hide the button.',
                  },
                },
                {
                  name: 'phone',
                  label: 'Phone number',
                  type: 'text',
                  maxLength: 30,
                  admin: { description: 'Shown in header style A and in the mobile menu.' },
                  validate: (value: unknown) =>
                    !value || (typeof value === 'string' && /^\+?[0-9 ()-]{6,30}$/.test(value))
                      ? true
                      : 'Digits, spaces and brackets only.',
                },
                {
                  name: 'menu',
                  label: 'Menu',
                  type: 'array',
                  maxRows: 6,
                  labels: { singular: 'Menu item', plural: 'Menu items' },
                  admin: {
                    description:
                      'Up to 6 items. An item with link groups opens a drop-down menu instead of going straight to a page.',
                    initCollapsed: true,
                  },
                  fields: [
                    { name: 'label', label: 'Text', type: 'text', required: true, maxLength: 24 },
                    linkField({
                      name: 'link',
                      label: 'Goes to (when it has no link groups)',
                      withLabel: false,
                      required: false,
                    }),
                    {
                      name: 'groups',
                      label: 'Link groups',
                      type: 'array',
                      maxRows: 3,
                      labels: { singular: 'Group', plural: 'Groups' },
                      fields: [
                        {
                          name: 'heading',
                          label: 'Heading',
                          type: 'text',
                          required: true,
                          maxLength: 30,
                        },
                        {
                          name: 'links',
                          label: 'Links',
                          type: 'array',
                          minRows: 1,
                          maxRows: 8,
                          fields: [linkField({ name: 'link', label: 'Link' })],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
