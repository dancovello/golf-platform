import type { CollectionBeforeValidateHook, CollectionConfig, Field, Validate } from 'payload'
import { APIError, ValidationError } from 'payload'
import { email as emailFormat, textarea as textareaRules } from 'payload/shared'

import { isSuperAdmin, loggedIn, superAdminOnly } from '../access/roles'
import { clubHasAccepted } from '../agreement/acceptance'
import { privacyRichText } from '../blocks/richText/lexical'
import { isSafeURL, linkField } from '../fields/link'
import { isGAMeasurementID } from '../site/privacy/policy'
import { checkSameClub } from '../site/sameClub'
import { BRAND_INPUTS, type Brand, contrastProblems, DEFAULT_BRAND, isHex } from '../theme/colour'
import { DEFAULT_FONT_SET, FONT_SETS } from '../theme/fontSets'
import { ENQUIRY_PURPOSES } from './enquiryPurposes'
import { idOf } from '../blocks/types'

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
  admin: {
    description: `${colourHelp[name]} Choose one of the suggested shades, or type your own six-digit colour code, e.g. ${DEFAULT_BRAND[name]}.`,
    components: { Field: '/admin/ColourField#ColourField' },
  },
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

/**
 * Required whenever the settings are saved, but not when they're first made blank alongside a
 * new club (src/collections/Tenants.ts). Not a database rule, so clubs saved before this
 * existed still load; the website leaves out a missing line until it's filled in.
 */
const neededOnSave =
  (message: string, rules: Validate): Validate =>
  (value, options) =>
    options.operation !== 'create' && !(typeof value === 'string' && value.trim())
      ? message
      : rules(value, options)

/**
 * A club's editors can't save its settings until the club has accepted the current data
 * processing agreement (src/agreement). The public website isn't affected, and the
 * super-admin can still set a club up before it has accepted.
 */
const requireAgreement: CollectionBeforeValidateHook = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (operation !== 'update' || !req.user || isSuperAdmin(req.user)) return data
  const tenant = originalDoc?.tenant
  const tenantID = typeof tenant === 'object' && tenant ? String(tenant.id) : String(tenant ?? '')
  if (!tenantID || !(await clubHasAccepted(req.payload, tenantID, req))) {
    throw new APIError(
      'Your club needs to accept the data processing agreement before these settings can be saved. Open “Data processing agreement” in the menu to read and accept it.',
      403,
      null,
      true,
    )
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
  hooks: { beforeValidate: [requireAgreement, checkBrandContrast, checkSameClub] },
  fields: [
    {
      name: 'agreementNotice',
      type: 'ui',
      admin: { components: { Field: '/admin/AgreementNotice#AgreementNotice' } },
    },
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
                  name: 'palettes',
                  type: 'ui',
                  admin: { components: { Field: '/admin/ColourField#PalettePicker' } },
                },
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
                  admin: {
                    description: 'Shown in the header (style A), the mobile menu and the footer.',
                  },
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
                      'Up to 6 items, left to right; drag to reorder. Each is a link, or opens a drop-down: either the child pages of one of your pages (kept up to date for you) or links you choose.',
                    initCollapsed: true,
                    components: { RowLabel: '/admin/MenuRowLabel#MenuRowLabel' },
                  },
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        {
                          name: 'label',
                          label: 'Text',
                          type: 'text',
                          required: true,
                          maxLength: 24,
                        },
                        {
                          name: 'kind',
                          label: 'What it does',
                          type: 'select',
                          options: [
                            { label: 'Goes to a page or link', value: 'link' },
                            { label: 'Drop-down: a page’s child pages', value: 'children' },
                            { label: 'Drop-down: links I choose', value: 'manual' },
                          ],
                          admin: {
                            description:
                              'Blank on items saved before this choice existed: they keep working as before.',
                          },
                        },
                      ],
                    },
                    {
                      ...linkField({
                        name: 'link',
                        label: 'Goes to',
                        withLabel: false,
                        required: false,
                      }),
                      admin: {
                        condition: (_data, row) =>
                          row?.kind !== 'manual' && row?.kind !== 'children',
                      },
                    },
                    {
                      name: 'page',
                      label: 'Page whose child pages to show',
                      type: 'relationship',
                      relationTo: 'pages',
                      filterOptions: ({ data }) =>
                        data?.tenant ? { tenant: { equals: idOf(data.tenant) } } : true,
                      admin: {
                        condition: (_data, row) => row?.kind === 'children',
                        description:
                          'Its child pages (set on each page, under "Parent page") make up the drop-down, in their "Position" order.',
                      },
                      validate: (
                        value: unknown,
                        { siblingData }: { siblingData: { kind?: string } },
                      ) => (siblingData?.kind !== 'children' || value ? true : 'Choose a page.'),
                    },
                    {
                      name: 'includeParent',
                      label: 'Show that page itself at the top of the drop-down',
                      type: 'checkbox',
                      defaultValue: true,
                      admin: { condition: (_data, row) => row?.kind === 'children' },
                    },
                    {
                      name: 'extraLinks',
                      label: 'Extra links at the end (optional)',
                      type: 'array',
                      maxRows: 4,
                      labels: { singular: 'Extra link', plural: 'Extra links' },
                      admin: {
                        condition: (_data, row) => row?.kind === 'children',
                        description: 'e.g. your booking site, or News, Events or Contact.',
                      },
                      fields: [linkField({ name: 'link', label: 'Link' })],
                    },
                    {
                      name: 'groups',
                      label: 'Link groups',
                      type: 'array',
                      maxRows: 3,
                      labels: { singular: 'Group', plural: 'Groups' },
                      admin: {
                        condition: (_data, row) =>
                          row?.kind === 'manual' || (!row?.kind && (row?.groups?.length ?? 0) > 0),
                        description: 'Up to 3 groups side by side, each with its own heading.',
                      },
                      fields: [
                        {
                          name: 'heading',
                          label: 'Heading (optional)',
                          type: 'text',
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
        {
          label: 'Footer',
          fields: [
            {
              name: 'footer',
              type: 'group',
              label: false,
              fields: [
                {
                  name: 'style',
                  label: 'Footer style',
                  type: 'select',
                  required: true,
                  defaultValue: 'brandColumns',
                  options: [
                    {
                      label:
                        'A · Brand columns: on the brand colour, logo, links, hours and contact',
                      value: 'brandColumns',
                    },
                    {
                      label: 'B · Light columns: on the page background, up to two link columns',
                      value: 'lightColumns',
                    },
                    {
                      label:
                        'C · Editorial: large club name, hours, contact, social and two buttons',
                      value: 'editorial',
                    },
                  ],
                },
                {
                  name: 'about',
                  label: 'Short description',
                  type: 'textarea',
                  maxLength: 160,
                  admin: {
                    description:
                      'One or two lines under the logo (styles A and B), e.g. "Heathland golf since 1926, twenty minutes from Heathrow."',
                  },
                },
                {
                  name: 'linkColumns',
                  label: 'Link columns',
                  type: 'array',
                  maxRows: 3,
                  labels: { singular: 'Column', plural: 'Columns' },
                  admin: {
                    description:
                      'Up to 3 columns, each with its own heading, in every footer style. A column can list a page’s child pages (kept up to date, like the menu) or links you choose.',
                    initCollapsed: true,
                    components: { RowLabel: '/admin/MenuRowLabel#ColumnRowLabel' },
                  },
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        {
                          name: 'heading',
                          label: 'Heading',
                          type: 'text',
                          required: true,
                          maxLength: 30,
                        },
                        {
                          name: 'source',
                          label: 'Links',
                          type: 'select',
                          defaultValue: 'manual',
                          options: [
                            { label: 'Links I choose', value: 'manual' },
                            { label: 'A page’s child pages', value: 'children' },
                          ],
                        },
                      ],
                    },
                    {
                      name: 'page',
                      label: 'Page whose child pages to list',
                      type: 'relationship',
                      relationTo: 'pages',
                      filterOptions: ({ data }) =>
                        data?.tenant ? { tenant: { equals: idOf(data.tenant) } } : true,
                      admin: {
                        condition: (_data, row) => row?.source === 'children',
                        description:
                          'e.g. "Visitors" lists every page under Visitors, so the column matches that menu drop-down.',
                      },
                      validate: (
                        value: unknown,
                        { siblingData }: { siblingData: { source?: string } },
                      ) => (siblingData?.source !== 'children' || value ? true : 'Choose a page.'),
                    },
                    {
                      name: 'links',
                      label: 'Links',
                      type: 'array',
                      maxRows: 8,
                      admin: { condition: (_data, row) => row?.source !== 'children' },
                      validate: (
                        value: unknown,
                        { siblingData }: { siblingData: { source?: string } },
                      ) =>
                        siblingData?.source === 'children' ||
                        (Array.isArray(value) && value.length > 0)
                          ? true
                          : 'Add at least one link.',
                      fields: [linkField({ name: 'link', label: 'Link' })],
                    },
                  ],
                },
                {
                  name: 'hours',
                  label: 'Opening hours',
                  type: 'array',
                  maxRows: 6,
                  labels: { singular: 'Row', plural: 'Rows' },
                  admin: { initCollapsed: true },
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        {
                          name: 'place',
                          label: 'What',
                          type: 'text',
                          required: true,
                          maxLength: 30,
                          admin: { description: 'e.g. Clubhouse' },
                        },
                        {
                          name: 'times',
                          label: 'Hours',
                          type: 'text',
                          required: true,
                          maxLength: 30,
                          admin: { description: 'e.g. 7am – 9pm' },
                        },
                      ],
                    },
                  ],
                },
                linkField({
                  name: 'hoursLink',
                  label: 'Link under the hours (optional)',
                  required: false,
                }),
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'email',
                      label: 'Email address',
                      type: 'email',
                      admin: {
                        description: 'Shown in the footer and the privacy policy. Required.',
                      },
                      validate: neededOnSave(
                        'Add the club’s email address. The privacy policy needs it.',
                        emailFormat as Validate,
                      ),
                    },
                    {
                      name: 'directions',
                      label: 'Directions link',
                      type: 'text',
                      admin: { description: 'e.g. a Google Maps link. Optional.' },
                      validate: (value: unknown) =>
                        !value || isSafeURL(value)
                          ? true
                          : 'Use a full web address starting with https://.',
                    },
                  ],
                },
                {
                  name: 'address',
                  label: 'Address',
                  type: 'textarea',
                  maxLength: 200,
                  admin: {
                    description: 'Shown in the footer and the privacy policy. Required.',
                  },
                  validate: neededOnSave(
                    'Add the club’s postal address. The privacy policy needs it.',
                    textareaRules as Validate,
                  ),
                },
                {
                  name: 'social',
                  label: 'Social media',
                  type: 'array',
                  maxRows: 6,
                  admin: { description: 'Shown in style C.', initCollapsed: true },
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        {
                          name: 'network',
                          label: 'Network',
                          type: 'select',
                          required: true,
                          options: [
                            'Instagram',
                            'Facebook',
                            'X',
                            'YouTube',
                            'LinkedIn',
                            'TikTok',
                          ].map((n) => ({ label: n, value: n.toLowerCase() })),
                        },
                        {
                          name: 'url',
                          label: 'Web address',
                          type: 'text',
                          required: true,
                          validate: (value: unknown) =>
                            typeof value === 'string' && /^https:\/\/\S+$/.test(value.trim())
                              ? true
                              : 'Use a full web address starting with https://.',
                        },
                      ],
                    },
                  ],
                },
                linkField({
                  name: 'secondaryButton',
                  label: 'Second button (style C, optional)',
                  required: false,
                }),
                {
                  name: 'legalLinks',
                  label: 'Bottom row links',
                  type: 'array',
                  maxRows: 6,
                  admin: {
                    description:
                      'e.g. Terms, Accessibility. The privacy policy link is added for you, and “Cookie settings” too if you use Google Analytics.',
                    initCollapsed: true,
                  },
                  fields: [linkField({ name: 'link', label: 'Link' })],
                },
              ],
            },
          ],
        },
        {
          label: 'Announcement',
          fields: [
            {
              name: 'announcement',
              type: 'group',
              label: false,
              admin: {
                description:
                  'A short notice above the header on every page, between its start and end dates.',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'style',
                      label: 'Style',
                      type: 'select',
                      required: true,
                      defaultValue: 'classic',
                      options: [
                        { label: 'A · Classic: one centred line', value: 'classic' },
                        { label: 'B · Rotator: up to three notices in turn', value: 'rotator' },
                        {
                          label: 'C · Utility: notice left, course status and phone right',
                          value: 'utility',
                        },
                      ],
                    },
                    {
                      name: 'tone',
                      label: 'Colour',
                      type: 'select',
                      required: true,
                      defaultValue: 'brand',
                      options: [
                        { label: 'Brand colour', value: 'brand' },
                        { label: 'Accent (urgent; style A only)', value: 'accent' },
                        { label: 'Subtle', value: 'subtle' },
                      ],
                    },
                    {
                      name: 'showStatus',
                      label: 'Show course status (style C)',
                      type: 'checkbox',
                      defaultValue: true,
                    },
                  ],
                },
                {
                  name: 'items',
                  label: 'Notices',
                  type: 'array',
                  maxRows: 3,
                  labels: { singular: 'Notice', plural: 'Notices' },
                  admin: {
                    description:
                      'Only notices between their start and end dates are shown. Styles A and C show the first one.',
                  },
                  fields: [
                    {
                      name: 'message',
                      label: 'Message',
                      type: 'textarea',
                      required: true,
                      maxLength: 240,
                      admin: { description: 'Up to 100 characters fits on one line.' },
                    },
                    {
                      type: 'row',
                      fields: [
                        {
                          name: 'tag',
                          label: 'Tag (style B)',
                          type: 'select',
                          defaultValue: 'notice',
                          options: [
                            { label: 'Notice', value: 'notice' },
                            { label: 'Event', value: 'event' },
                            { label: 'Course', value: 'course' },
                            { label: 'Offer', value: 'offer' },
                          ],
                        },
                        {
                          name: 'startsAt',
                          label: 'Show from (optional)',
                          type: 'date',
                          admin: {
                            date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMM yyyy' },
                          },
                        },
                        {
                          name: 'expiresAt',
                          label: 'Show until',
                          type: 'date',
                          required: true,
                          admin: {
                            date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMM yyyy' },
                            description: 'Hidden automatically after this day.',
                          },
                        },
                      ],
                    },
                    linkField({ name: 'link', label: 'Link (optional)', required: false }),
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Contact page',
          description:
            'Your website has a Contact page at /contact. Messages are saved under Enquiries. The phone, email and address beside the form come from the Header and Footer tabs.',
          fields: [
            {
              name: 'contact',
              type: 'group',
              label: false,
              fields: [
                {
                  name: 'intro',
                  label: 'Introduction',
                  type: 'textarea',
                  maxLength: 200,
                  defaultValue:
                    'Choose what it’s about and it goes straight to the right person. We reply within one working day.',
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'replyDays',
                      label: 'Working days to reply',
                      type: 'number',
                      required: true,
                      defaultValue: 1,
                      min: 1,
                      max: 10,
                      admin: {
                        description:
                          'After sending, visitors are told the date they’ll hear back by (weekends skipped).',
                      },
                    },
                    {
                      name: 'officeHours',
                      label: 'Office hours (optional)',
                      type: 'text',
                      maxLength: 80,
                      admin: { description: 'e.g. Mon–Fri 8:00–17:00 · Sat 8:00–12:00' },
                    },
                  ],
                },
                {
                  name: 'purposes',
                  label: 'Who replies',
                  type: 'array',
                  maxRows: ENQUIRY_PURPOSES.length,
                  labels: { singular: 'Topic', plural: 'Topics' },
                  admin: {
                    description:
                      'Every topic is always on the form, and new messages are emailed to your footer email address. Add a topic here to send its messages somewhere else, name who replies, or show a button after sending.',
                  },
                  validate: (value: unknown) => {
                    const purposes = Array.isArray(value)
                      ? value.map((row) => (row as { purpose?: unknown }).purpose)
                      : []
                    return new Set(purposes).size === purposes.length
                      ? true
                      : 'Each topic can only be listed once.'
                  },
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        {
                          name: 'purpose',
                          label: 'Topic',
                          type: 'select',
                          required: true,
                          options: [...ENQUIRY_PURPOSES],
                        },
                        {
                          name: 'replier',
                          label: 'Who replies',
                          type: 'text',
                          maxLength: 80,
                          admin: {
                            description:
                              'e.g. "Sarah Cole, our membership secretary". Blank: "Someone from the club".',
                          },
                        },
                        {
                          name: 'inbox',
                          label: 'Email new messages to',
                          type: 'email',
                          admin: { description: 'Blank: the footer email address.' },
                        },
                      ],
                    },
                    linkField({
                      name: 'nextLink',
                      label: 'Button after sending (optional)',
                      required: false,
                    }),
                  ],
                },
                {
                  name: 'membershipTypes',
                  label: 'Membership types',
                  type: 'array',
                  maxRows: 12,
                  labels: { singular: 'Membership type', plural: 'Membership types' },
                  admin: {
                    description:
                      'The choices for "Membership type" on membership enquiries. Leave empty to let people type it.',
                  },
                  fields: [
                    { name: 'label', label: 'Name', type: 'text', required: true, maxLength: 40 },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'asideTitle',
                      label: 'Side note heading',
                      type: 'text',
                      maxLength: 40,
                      defaultValue: 'Tee times and lessons',
                    },
                    {
                      name: 'asideText',
                      label: 'Side note (optional)',
                      type: 'textarea',
                      maxLength: 160,
                      admin: {
                        description:
                          'A short note under the contact details, with your booking button, e.g. "The pro shop is quickest for anything today: 01932 704 520, 7am–7pm." Blank hides it.',
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Privacy & legal',
          description:
            'Every club’s website has a privacy policy at /privacy, written for you from these details and the features you use. You don’t have to fill anything in here: blank boxes use your club name and footer email instead.',
          fields: [
            {
              name: 'privacy',
              type: 'group',
              label: false,
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'legalName',
                      label: 'Legal name (optional)',
                      type: 'text',
                      maxLength: 120,
                      admin: {
                        description:
                          'The club’s registered name if it differs from the name above, e.g. "Example Golf Club Limited". Leave blank to use the club name.',
                      },
                    },
                    {
                      name: 'email',
                      label: 'Privacy email (optional)',
                      type: 'email',
                      admin: {
                        description:
                          'Where people send requests about their personal information. Leave blank to use the footer email.',
                      },
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'newsletterProvider',
                      label: 'Newsletter service (optional)',
                      type: 'text',
                      maxLength: 60,
                      admin: {
                        description:
                          'If you send a newsletter, the service you use, e.g. "Mailchimp". Filling this in adds a newsletter section to the policy.',
                      },
                    },
                    {
                      name: 'gaMeasurementId',
                      label: 'Google Analytics ID (optional)',
                      type: 'text',
                      maxLength: 20,
                      admin: {
                        description:
                          'Starts with G-, e.g. G-AB12CD34EF. Filling this in adds a cookie banner, and Google Analytics only runs for visitors who accept it.',
                      },
                      validate: (value: unknown) =>
                        !value || isGAMeasurementID(value)
                          ? true
                          : 'A Google Analytics ID looks like G-AB12CD34EF (G, a dash, then capital letters and numbers).',
                    },
                  ],
                },
                {
                  name: 'additionalInfo',
                  label: 'Additional information (optional)',
                  type: 'richText',
                  editor: privacyRichText,
                  admin: {
                    description:
                      'Anything extra the club needs to tell people, e.g. CCTV in the car park. Shown as its own section near the end of the policy. Leave blank to leave the section out.',
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'Location',
          fields: [
            {
              name: 'location',
              type: 'group',
              label: false,
              admin: {
                description:
                  'Used by the Map block. The address, phone, email and opening hours come from the Footer tab and the header phone.',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'latitude',
                      label: 'Latitude',
                      type: 'number',
                      min: 49,
                      max: 61,
                      admin: {
                        description:
                          'e.g. 51.3920 (right-click the clubhouse in Google Maps to copy it).',
                      },
                    },
                    {
                      name: 'longitude',
                      label: 'Longitude',
                      type: 'number',
                      min: -9,
                      max: 2,
                      admin: { description: 'e.g. -0.6120' },
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'mapLabel',
                      label: 'Map pin label',
                      type: 'text',
                      maxLength: 30,
                      admin: { description: 'e.g. "Clubhouse & car park"' },
                    },
                    {
                      name: 'what3words',
                      label: 'what3words (optional)',
                      type: 'text',
                      maxLength: 60,
                      admin: { description: 'e.g. filled.count.soap' },
                      validate: (value: unknown) =>
                        !value ||
                        (typeof value === 'string' && /^[a-z]+\.[a-z]+\.[a-z]+$/.test(value.trim()))
                          ? true
                          : 'Three words separated by dots, e.g. filled.count.soap',
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
