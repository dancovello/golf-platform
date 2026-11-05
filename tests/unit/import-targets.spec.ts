import { describe, expect, it } from 'vitest'

import { databaseServer, parseEnvText, sharedSettings } from '../../scripts/lib/importTargets'

const staging = {
  DATABASE_URL:
    'postgres://neondb_owner:secret@ep-wandering-base-abc123-pooler.c-2.eu-west-2.aws.neon.tech/neondb',
  MEDIA_S3_BUCKET: 'golf-platform-media-staging',
  MEDIA_PUBLIC_URL: 'https://pub-aaa.r2.dev',
}
const production = {
  DATABASE_URL:
    'postgres://golf_app:secret@ep-quiet-river-xyz789-pooler.c-2.eu-west-2.aws.neon.tech/neondb',
  MEDIA_S3_BUCKET: 'golf-platform-media-production',
  MEDIA_PUBLIC_URL: 'https://pub-bbb.r2.dev/',
}

describe('club import: staging and production stay apart', () => {
  it('accepts two separate environments', () => {
    expect(sharedSettings(staging, production)).toEqual([])
  })

  it('refuses a production file that holds staging’s database, even with another role', () => {
    const wrong = {
      ...production,
      DATABASE_URL:
        'postgres://golf_app:other@ep-wandering-base-abc123-pooler.c-2.eu-west-2.aws.neon.tech/neondb',
    }
    const problems = sharedSettings(staging, wrong)
    expect(problems).toHaveLength(1)
    expect(problems[0]).toMatch(/same database server/)
    expect(problems[0]).toContain('ep-wandering-base-abc123.c-2.eu-west-2.aws.neon.tech')
  })

  it('treats Neon’s pooled and direct addresses as the same server', () => {
    const direct = {
      ...production,
      DATABASE_URL:
        'postgres://golf_app:x@ep-wandering-base-abc123.c-2.eu-west-2.aws.neon.tech/neondb',
    }
    expect(sharedSettings(staging, direct).join(' ')).toMatch(/same database server/)
    expect(databaseServer(staging.DATABASE_URL)).toBe(databaseServer(direct.DATABASE_URL))
  })

  it('refuses a shared photo bucket or public photo address', () => {
    const problems = sharedSettings(staging, {
      ...production,
      MEDIA_S3_BUCKET: staging.MEDIA_S3_BUCKET,
      MEDIA_PUBLIC_URL: `${staging.MEDIA_PUBLIC_URL}/`,
    })
    expect(problems.join(' ')).toMatch(/same photo bucket/)
    expect(problems.join(' ')).toMatch(/same public photo address/)
  })

  it('never puts a password or key in what it says', () => {
    const problems = sharedSettings(staging, {
      ...production,
      DATABASE_URL: staging.DATABASE_URL,
      MEDIA_S3_ACCESS_KEY_ID: 'AKIA-SECRET',
    })
    expect(problems.join(' ')).not.toMatch(/secret|AKIA/)
  })

  it('does not guess when an address is missing or not an address', () => {
    expect(databaseServer(undefined)).toBeNull()
    expect(databaseServer('not a url')).toBeNull()
    expect(sharedSettings({}, {})).toEqual([])
  })

  it('reads NAME=value lines, skipping comments and removing quotes', () => {
    expect(parseEnvText('# note\nA=1\nB="two"\n C = \'three\' \nbad line\n')).toEqual({
      A: '1',
      B: 'two',
      C: 'three',
    })
  })
})
