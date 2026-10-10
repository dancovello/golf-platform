import type { CollectionConfig } from 'payload'

import { ClubSettings } from './ClubSettings'
import { Pages } from './Pages'
import { Tenants } from './Tenants'
import { Users } from './Users'

// Every collection must be listed here. tests/unit/access-guard.spec.ts checks that each
// one defines its own create, read, update and delete access functions.
export const collections: CollectionConfig[] = [Users, Tenants, Pages, ClubSettings]
