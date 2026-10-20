import { randomUUID } from 'node:crypto'

import type { CollectionBeforeOperationHook, Field } from 'payload'

/** Folder pattern "<root>/<random ID>". The database checks the same format. */
export const folderPattern = (root: string) =>
  new RegExp(`^${root}/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`)

/**
 * Every stored file gets its own random folder, so its address can't be guessed. Shared by the
 * upload collections (photos, documents):
 * - `assignFolder` sets it before Payload picks the file name, so the name is only compared
 *   with files in that folder (filenameCompoundIndex: ['filename', 'prefix']);
 * - `prefixField` stores it, never changeable, unique, format-checked.
 */
export const uploadFolder = (root: string) => {
  const newPrefix = () => `${root}/${randomUUID()}`
  const pattern = folderPattern(root)
  const assignFolder: CollectionBeforeOperationHook = ({ args, operation }) => {
    if (operation === 'create') {
      const data = (args.data ?? {}) as { prefix?: string }
      args.data = { ...data, prefix: data.prefix ?? newPrefix() } as typeof args.data
    }
    return args
  }
  const prefixField: Field = {
    // Set when the file is added and never changed, so no one can point their record at
    // another club's file. The database also requires it to be unique.
    name: 'prefix',
    type: 'text',
    unique: true,
    defaultValue: newPrefix,
    access: { update: () => false },
    admin: { hidden: true },
    validate: (value: unknown) =>
      typeof value === 'string' && pattern.test(value) ? true : 'Invalid file folder.',
  }
  return { assignFolder, prefixField }
}
