import type { CollectionConfig } from 'payload'

import { clubContentCreate, loggedIn } from '../access/roles'
import { imageField } from '../blocks/shared'
import { checkStaffSameClub } from '../site/sameClub'
import { STAFF_DEPARTMENTS } from './staffDepartments'
import { clubBannerField } from '../tenancy'
import { searchHooks } from '../search/hooks'

const PHONE = /^\+?[0-9 ()-]{6,30}$/

// Club-owned (src/tenancy.ts): the club is required and editors only see their own team.
// Shown on the website only through a Team block on a page.
export const Staff: CollectionConfig = {
  slug: 'staff',
  labels: { singular: 'Team member', plural: 'Team & staff' },
  lockDocuments: false,
  admin: {
    group: 'Club information',
    useAsTitle: 'name',
    defaultColumns: ['name', 'role', 'department', 'updatedAt'],
    description: 'People shown by Team blocks. A missing photo shows their initials instead.',
  },
  access: { create: clubContentCreate, read: loggedIn, update: loggedIn, delete: loggedIn },
  hooks: { beforeValidate: [checkStaffSameClub], ...searchHooks },
  fields: [
    clubBannerField,
    {
      type: 'row',
      fields: [
        { name: 'name', label: 'Name', type: 'text', required: true, maxLength: 60 },
        {
          name: 'role',
          label: 'Role',
          type: 'text',
          required: true,
          maxLength: 60,
          admin: { description: 'e.g. "Head Professional"' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'department',
          label: 'Department',
          type: 'select',
          required: true,
          defaultValue: 'golf',
          options: [...STAFF_DEPARTMENTS],
        },
        {
          name: 'qualification',
          label: 'Qualification (optional)',
          type: 'text',
          maxLength: 24,
          admin: { description: 'A short tag, e.g. "PGA Advanced" or "BIGGA".' },
        },
      ],
    },
    imageField('photo', 'Photo (optional)', false, {
      admin: {
        description: 'Portrait, ideally 4:5 with the same background for everyone.',
      },
    }),
    {
      name: 'bio',
      label: 'Short bio (optional)',
      type: 'textarea',
      maxLength: 600,
      admin: { description: 'A few sentences. Leave a blank line between paragraphs.' },
    },
    {
      type: 'row',
      fields: [
        { name: 'email', label: 'Email (optional)', type: 'email' },
        {
          name: 'phone',
          label: 'Direct phone (optional)',
          type: 'text',
          maxLength: 30,
          validate: (value: unknown) =>
            !value || (typeof value === 'string' && PHONE.test(value))
              ? true
              : 'Digits, spaces and brackets only.',
        },
      ],
    },
  ],
}
