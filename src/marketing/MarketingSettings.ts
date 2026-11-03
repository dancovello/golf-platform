import type { GlobalConfig } from 'payload'

import { TIME, WEEKDAYS } from './booking/availability'
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
      // The logo and tab icon. Uploads are PNG, WebP or JPEG (no SVG: it can carry code). Until
      // a logo is uploaded, the A1.Studios logo built into the site is used.
      name: 'branding',
      label: 'Logo and icon',
      type: 'group',
      fields: [
        {
          name: 'logo',
          label: 'Logo (optional)',
          type: 'upload',
          relationTo: 'marketing-media',
          admin: {
            description:
              'Shown in the menu, the footer and the homepage animation. Use a transparent PNG or WebP at least 800px wide, in light colours: it sits on the dark green. Empty: the built-in A1.Studios logo.',
          },
        },
        {
          name: 'icon',
          label: 'Browser tab icon (optional)',
          type: 'upload',
          relationTo: 'marketing-media',
          admin: {
            description: 'A square PNG, at least 512px. Empty: the browser’s default icon.',
          },
        },
      ],
    },
    {
      name: 'site',
      label: 'Footer and search results',
      type: 'group',
      fields: [
        {
          name: 'footerTagline',
          label: 'Footer line',
          type: 'textarea',
          maxLength: 200,
          defaultValue:
            'Golf club websites your team can update in minutes. Tee-time booking coming next.',
        },
        {
          name: 'description',
          label: 'Default description for search results and sharing',
          type: 'textarea',
          maxLength: 300,
          admin: {
            description:
              'Used on any page that has no description of its own. Aim for under 160 characters.',
          },
        },
        {
          name: 'shareImage',
          label: 'Sharing picture (optional)',
          type: 'upload',
          relationTo: 'marketing-media',
          admin: {
            description:
              'Shown when a link is shared on social media or messages. 1200 × 630 works best.',
          },
        },
      ],
    },
    {
      name: 'contact',
      label: 'Contact and company details',
      type: 'group',
      admin: { description: 'Shown in the footer. Anything left empty is simply not shown.' },
      fields: [
        {
          name: 'phone',
          label: 'Phone',
          type: 'text',
          maxLength: 30,
          validate: (value: unknown) =>
            !value || (typeof value === 'string' && /^\+?[0-9 ()-]{6,30}$/.test(value))
              ? true
              : 'Digits, spaces and brackets only.',
        },
        {
          name: 'registeredName',
          label: 'Registered company name',
          type: 'text',
          maxLength: 120,
        },
        {
          type: 'row',
          fields: [
            { name: 'companyNumber', label: 'Company number', type: 'text', maxLength: 20 },
            { name: 'vatNumber', label: 'VAT number', type: 'text', maxLength: 20 },
          ],
        },
        {
          name: 'registeredAddress',
          label: 'Registered address',
          type: 'textarea',
          maxLength: 300,
        },
      ],
    },
    {
      name: 'social',
      label: 'Social links',
      type: 'group',
      admin: { description: 'Full web addresses. Empty ones are not shown in the footer.' },
      fields: [
        ['linkedin', 'LinkedIn'],
        ['instagram', 'Instagram'],
        ['x', 'X'],
        ['youtube', 'YouTube'],
        ['facebook', 'Facebook'],
      ].map(([name, label]) => ({
        name,
        label,
        type: 'text' as const,
        maxLength: 300,
        validate: (value: unknown) =>
          !value || (typeof value === 'string' && value.startsWith('https://'))
            ? true
            : 'Use a full web address starting with https://.',
      })),
    },
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
          'Where requests from the website are emailed. Without an address they are still saved under Demo requests.',
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
      // The Book a demo calendar (Q4, decided 3 Nov 2026: our own, not Cal.com). Visitors pick
      // from these hours; booked times drop off. Without any hours the page offers email.
      name: 'demoCalls',
      label: 'Demo calls',
      type: 'group',
      admin: {
        description:
          'When visitors can book a demo on the Book a demo page, in UK time. Add the hours you are free each weekday; with none, the page offers email instead. Booked times are under Demo bookings.',
      },
      fields: [
        {
          name: 'hours',
          label: 'Hours you are free',
          type: 'array',
          admin: { description: 'One row per block, e.g. Tuesday 10:00 to 12:00. Weekdays only.' },
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'weekday',
                  label: 'Day',
                  type: 'select',
                  required: true,
                  options: WEEKDAYS.map((value) => ({
                    value,
                    label: {
                      mon: 'Monday',
                      tue: 'Tuesday',
                      wed: 'Wednesday',
                      thu: 'Thursday',
                      fri: 'Friday',
                    }[value],
                  })),
                },
                {
                  name: 'from',
                  label: 'From (24-hour, e.g. 10:00)',
                  type: 'text',
                  required: true,
                  validate: (value: unknown) =>
                    typeof value === 'string' && TIME.test(value)
                      ? true
                      : 'Use 24-hour time, like 10:00.',
                },
                {
                  name: 'to',
                  label: 'To (e.g. 12:00)',
                  type: 'text',
                  required: true,
                  validate: (
                    value: unknown,
                    { siblingData }: { siblingData?: { from?: string } },
                  ) =>
                    typeof value !== 'string' || !TIME.test(value)
                      ? 'Use 24-hour time, like 12:00.'
                      : siblingData?.from && value <= siblingData.from
                        ? 'This must be later than the start.'
                        : true,
                },
              ],
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'slotMinutes',
              label: 'Minutes per slot',
              type: 'number',
              required: true,
              min: 15,
              max: 240,
              defaultValue: 30,
              admin: { description: 'Sets how far apart times are. Never shown to visitors.' },
            },
            {
              name: 'daysAhead',
              label: 'Days ahead that can be booked',
              type: 'number',
              required: true,
              min: 1,
              max: 90,
              defaultValue: 21,
            },
            {
              name: 'noticeHours',
              label: 'Least notice (hours)',
              type: 'number',
              required: true,
              min: 0,
              max: 336,
              defaultValue: 24,
            },
          ],
        },
        {
          name: 'videoLink',
          label: 'Video call link (optional)',
          type: 'text',
          maxLength: 300,
          admin: {
            description:
              'Your Google Meet or Zoom room, put in the confirmation email. Once Google is connected, each booking gets its own Meet link instead and this is the backup. Empty: the email says you will send the link.',
          },
          validate: (value: unknown) =>
            !value || (typeof value === 'string' && value.startsWith('https://'))
              ? true
              : 'Use a full web address starting with https://.',
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
