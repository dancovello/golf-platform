import type { CollectionBeforeValidateHook, CollectionConfig, Field } from 'payload'
import { ValidationError } from 'payload'

import { loggedIn, superAdminOnly } from '../access/roles'
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
  hooks: { beforeValidate: [checkBrandContrast] },
  fields: [
    { name: 'clubName', label: 'Club name shown on the website', type: 'text', required: true },
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
          options: Object.entries(FONT_SETS).map(([value, set]) => ({ value, label: set.label })),
        },
      ],
    },
  ],
}
