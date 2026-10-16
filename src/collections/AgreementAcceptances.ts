import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'

import { isSuperAdmin, loggedIn } from '../access/roles'
import { AGREEMENT_VERSION } from '../agreement/text'

/** Who accepted, which version and when come from the server, never from the form. */
const stampAcceptance: CollectionBeforeChangeHook = ({ data, operation, req }) => {
  if (operation !== 'create') return data
  return {
    ...data,
    version: AGREEMENT_VERSION,
    acceptedBy: req.user && !isSuperAdmin(req.user) ? req.user.id : null,
    acceptedAt: new Date().toISOString(),
  }
}

// Club-owned (src/tenancy.ts). A permanent record of each club accepting the data
// processing agreement (src/agreement/text.ts). Nobody can change or delete a record, the
// super-admin included, so it stands as evidence.
export const AgreementAcceptances: CollectionConfig = {
  slug: 'agreement-acceptances',
  labels: { singular: 'Data processing agreement', plural: 'Data processing agreement' },
  lockDocuments: false,
  admin: {
    useAsTitle: 'fullName',
    defaultColumns: ['fullName', 'jobTitle', 'version', 'acceptedAt'],
    description:
      'The agreement between your club and the website provider about looking after personal information. Someone with authority to act for the club accepts it once; you’ll be asked again if it changes.',
  },
  access: {
    // Only a club's own editors accept for it: the super-admin is the other party.
    create: ({ req: { user } }) => Boolean(user) && !isSuperAdmin(user),
    read: loggedIn,
    update: () => false,
    delete: () => false,
  },
  hooks: { beforeChange: [stampAcceptance] },
  fields: [
    {
      name: 'agreementText',
      type: 'ui',
      admin: { components: { Field: '/admin/AgreementText#AgreementText' } },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'fullName',
          label: 'Your full name',
          type: 'text',
          required: true,
          maxLength: 100,
        },
        {
          name: 'jobTitle',
          label: 'Your role at the club',
          type: 'text',
          required: true,
          maxLength: 100,
          admin: { description: 'e.g. Club Secretary, General Manager' },
        },
      ],
    },
    {
      name: 'authorised',
      label: 'I confirm I have authority to accept this agreement on behalf of the club.',
      type: 'checkbox',
      required: true,
      validate: (value: unknown) =>
        value === true ? true : 'Tick to confirm you can accept this for the club.',
    },
    {
      name: 'version',
      label: 'Agreement version',
      type: 'text',
      admin: { readOnly: true, condition: (data) => Boolean(data?.id) },
    },
    {
      name: 'acceptedBy',
      label: 'Accepted by account',
      type: 'relationship',
      relationTo: 'users',
      admin: { readOnly: true, condition: (data) => Boolean(data?.id) },
    },
    {
      name: 'acceptedAt',
      label: 'Accepted on',
      type: 'date',
      admin: {
        readOnly: true,
        condition: (data) => Boolean(data?.id),
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
  ],
}
