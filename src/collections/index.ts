import type { CollectionConfig } from 'payload'

import { ClubSettings } from './ClubSettings'
import { Courses } from './Courses'
import { CourseStatus } from './CourseStatus'
import { Documents } from './Documents'
import { Media } from './Media'
import { News } from './News'
import { Pages } from './Pages'
import { Staff } from './Staff'
import { Tenants } from './Tenants'
import { Users } from './Users'

// Every collection must be listed here. tests/unit/access-guard.spec.ts checks that each
// one defines its own create, read, update and delete access functions, and
// tests/unit/tenancy-guard.spec.ts that each is either club-owned or platform-level.
export const collections: CollectionConfig[] = [
  Users,
  Tenants,
  Pages,
  ClubSettings,
  Media,
  Documents,
  Staff,
  Courses,
  CourseStatus,
  News,
]
