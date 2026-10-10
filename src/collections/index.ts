import type { CollectionConfig } from 'payload'

import { Users } from './Users'

// Every collection must be listed here. tests/int/access.int.spec.ts checks that each
// one defines its own create, read, update and delete access functions.
export const collections: CollectionConfig[] = [Users]
