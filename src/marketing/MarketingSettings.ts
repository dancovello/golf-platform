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
      name: 'requests',
      label: 'Requests',
      type: 'group',
      admin: {
        description:
          'Where requests from the website are emailed. Without an address they are still saved under Homepage requests.',
      },
      fields: [
        {
          name: 'inbox',
          label: 'Email requests to',
          type: 'email',
          admin: { description: 'Replying to a request’s email answers the club directly.' },
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
      // Marketing/Founder Card (264:8707): photo, name, role, a one-sentence promise and a
      // direct phone or calendar link. Defaults are the Figma wording.
      name: 'founder',
      label: 'Founder card',
      type: 'group',
      fields: [
        {
          name: 'name',
          label: 'Name',
          type: 'text',
          required: true,
          defaultValue: 'Dan',
          maxLength: 60,
        },
        {
          name: 'role',
          label: 'About you (one or two sentences)',
          type: 'textarea',
          maxLength: 300,
          validate: maxWords(40),
          defaultValue:
            'Senior product designer with more than eight years delivering and scaling sports platforms. I designed every block, and I build and run this one from Cardiff.',
        },
        {
          name: 'message',
          label: 'Your promise (one sentence)',
          type: 'textarea',
          maxLength: 200,
          validate: maxWords(25),
          defaultValue: 'You’ll deal with me from the first call to launch day, and after it.',
        },
        {
          name: 'photo',
          label: 'Photo (optional; your initial shows until then)',
          type: 'upload',
          relationTo: 'marketing-media',
        },
        {
          type: 'row',
          fields: [
            {
              name: 'phone',
              label: 'Phone (optional, shows “Call …”)',
              type: 'text',
              maxLength: 30,
              validate: (value: unknown) =>
                !value || (typeof value === 'string' && /^\+?[0-9 ()-]{6,30}$/.test(value))
                  ? true
                  : 'Digits, spaces and brackets only.',
            },
            {
              name: 'calendarLink',
              label: 'Calendar link (optional)',
              type: 'text',
              maxLength: 300,
              admin: { description: 'Without one, “Book a call” goes to the Book a demo page.' },
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
