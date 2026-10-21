import type { GlobalConfig } from 'payload'

import { MARKETING_GROUP, hiddenFromEditors, marketingAccess } from './access'
import { maxWords } from './fields'

/**
 * Every number and fact the marketing site states, in one place (hand-off §5). Nothing on the
 * site is written into the code; each value has a row in docs/marketing-site/claims-register.md.
 * The company name, email and domain are in src/brand.ts.
 */
export const MarketingSettings: GlobalConfig = {
  slug: 'marketing-settings',
  label: 'Settings',
  // Document locking stays off everywhere: its records are readable across clubs.
  lockDocuments: false,
  admin: { group: MARKETING_GROUP, hidden: hiddenFromEditors },
  access: { read: marketingAccess.read, update: marketingAccess.update },
  fields: [
    {
      name: 'pricing',
      label: 'Pricing',
      type: 'group',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'monthlyPrice',
              label: 'Price a month (£)',
              type: 'number',
              required: true,
              min: 0,
              defaultValue: 149,
            },
            {
              name: 'vatLabel',
              label: 'VAT wording',
              type: 'text',
              required: true,
              maxLength: 20,
              defaultValue: '+ VAT',
              admin: { description: 'Shown next to every price. Open question Q2.' },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'minimumTermMonths',
              label: 'Minimum term (months)',
              type: 'number',
              required: true,
              min: 0,
              defaultValue: 12,
            },
            {
              name: 'noticeDays',
              label: 'Notice afterwards (days)',
              type: 'number',
              required: true,
              min: 0,
              defaultValue: 90,
            },
          ],
        },
        {
          name: 'secondCoursePrice',
          label: 'Second course, a month (£, optional)',
          type: 'number',
          min: 0,
          admin: {
            description: 'Empty: the calculator hides the second course. Open question Q3.',
          },
        },
      ],
    },
    {
      name: 'trust',
      label: 'Trust and security',
      type: 'group',
      fields: [
        {
          name: 'restoreWindowDays',
          label: 'Restore to any point in the last … days (optional)',
          type: 'number',
          min: 1,
          admin: {
            description:
              'Empty: the claim isn’t shown. Only fill in once the Neon plan gives it (Q6).',
          },
        },
      ],
    },
    {
      name: 'founder',
      label: 'Founder card',
      type: 'group',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'name',
              label: 'Name',
              type: 'text',
              required: true,
              defaultValue: 'Dan',
              maxLength: 60,
            },
            { name: 'role', label: 'Role', type: 'text', maxLength: 80 },
          ],
        },
        {
          name: 'message',
          label: 'In your words (under 60 words)',
          type: 'textarea',
          maxLength: 500,
          validate: maxWords(60),
        },
        { name: 'photo', label: 'Photo (optional)', type: 'upload', relationTo: 'marketing-media' },
        {
          type: 'row',
          fields: [
            { name: 'phone', label: 'Phone (optional)', type: 'text', maxLength: 30 },
            {
              name: 'calendarLink',
              label: 'Calendar link (optional)',
              type: 'text',
              maxLength: 300,
              validate: (value: unknown) =>
                !value || (typeof value === 'string' && value.startsWith('https://'))
                  ? true
                  : 'Use a full web address starting with https://.',
            },
          ],
        },
      ],
    },
  ],
}
