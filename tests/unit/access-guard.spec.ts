// Checks the collection configs exactly as written, before Payload loads them.
// Payload fills in default (permissive) access functions at startup, so this file
// must never import the Payload config.
import type { CollectionConfig } from 'payload'
import { describe, expect, it } from 'vitest'

import { collections } from '@/collections'
import { globals } from '@/globals'

const OPERATIONS = ['create', 'read', 'update', 'delete'] as const

const missingAccess = (collection: CollectionConfig) =>
  OPERATIONS.filter((operation) => typeof collection.access?.[operation] !== 'function')

describe('every collection defines its own access functions (default deny)', () => {
  it.each(collections.map((c) => [c.slug, c] as const))(
    '%s defines create, read, update and delete',
    (_slug, collection) => {
      expect(missingAccess(collection)).toEqual([])
    },
  )

  it('the guard catches a collection with a missing access function', () => {
    const leaky: CollectionConfig = {
      slug: 'leaky',
      access: { create: () => false, read: () => false, update: () => false },
      fields: [],
    }
    expect(missingAccess(leaky)).toEqual(['delete'])
  })
})

describe('every settings screen (global) defines its own read and update access', () => {
  it.each(globals.map((g) => [g.slug, g] as const))(
    '%s defines read and update',
    (_slug, global) => {
      expect(typeof global.access?.read).toBe('function')
      expect(typeof global.access?.update).toBe('function')
    },
  )
})
