// Who is fully signed in (decisions.md, 22 Oct: password-only club editors), and the rule that
// only src/auth/fullyAuthenticated.ts reads how someone signed in.
import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { isFullyAuthenticated, isSuperAdminWithCode } from '@/auth/fullyAuthenticated'
import { sessionTooOld } from '@/auth/sessionLimit'

import { ROOT, sourceFiles } from '../shared/sourceScan'

const editor = { id: 'e', role: 'editor', tenant: 't' }
const superAdmin = { id: 's', role: 'super-admin', tenant: null }

describe('isFullyAuthenticated', () => {
  it('a password-only club editor is signed in once their password is accepted', () => {
    expect(isFullyAuthenticated({ ...editor, hasTotp: false, _strategy: 'local-jwt' })).toBe(true)
  })

  it('an editor who set two-factor up still needs their code', () => {
    expect(isFullyAuthenticated({ ...editor, hasTotp: true, _strategy: 'local-jwt' })).toBe(false)
    expect(isFullyAuthenticated({ ...editor, hasTotp: true, _strategy: 'totp' })).toBe(true)
  })

  it('a super-admin always needs their code, set up or not', () => {
    expect(isFullyAuthenticated({ ...superAdmin, hasTotp: true, _strategy: 'local-jwt' })).toBe(
      false,
    )
    expect(isFullyAuthenticated({ ...superAdmin, hasTotp: false, _strategy: 'local-jwt' })).toBe(
      false,
    )
    expect(isFullyAuthenticated({ ...superAdmin, hasTotp: true, _strategy: 'totp' })).toBe(true)
    expect(isSuperAdminWithCode({ ...superAdmin, hasTotp: true, _strategy: 'totp' })).toBe(true)
    expect(isSuperAdminWithCode({ ...editor, _strategy: 'totp' })).toBe(false)
  })

  it('nobody, an unknown way of signing in, or no marker at all is not signed in', () => {
    expect(isFullyAuthenticated(null)).toBe(false)
    expect(isFullyAuthenticated({ ...editor })).toBe(false)
    expect(isFullyAuthenticated({ ...editor, _strategy: 'api-key' })).toBe(false)
  })
})

describe('only one file reads how someone signed in', () => {
  it('no file but src/auth/fullyAuthenticated.ts mentions _strategy', () => {
    const allowed = new Set(['src/auth/fullyAuthenticated.ts', 'src/payload-types.ts'])
    const offenders = sourceFiles()
      .filter(({ file }) => !allowed.has(file))
      .filter(({ file }) => fs.readFileSync(path.join(ROOT, file), 'utf8').includes('_strategy'))
      .map(({ file }) => file)
    expect(offenders, 'Use isFullyAuthenticated() or isSuperAdminWithCode() instead').toEqual([])
  })
})

describe('editor sessions end after 8 hours', () => {
  const now = new Date('2026-10-22T18:00:00Z')
  it('a session from this morning is fine; one from more than 8 hours ago is too old', () => {
    expect(sessionTooOld({ createdAt: '2026-10-22T10:30:00Z' }, now)).toBe(false)
    expect(sessionTooOld({ createdAt: '2026-10-22T09:59:00Z' }, now)).toBe(true)
  })
})
