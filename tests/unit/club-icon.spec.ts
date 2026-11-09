import { describe, expect, it } from 'vitest'

import { clubIcon } from '@/site/clubIcon'
import type { ResolvedSite } from '@/site/resolveSite'

const siteWith = (logo: { url: string } | null) =>
  ({ club: { logoOnLight: logo } }) as unknown as ResolvedSite

describe('club tab icon', () => {
  it("is the club's own logo when it has one", () => {
    expect(clubIcon(siteWith({ url: 'https://photos.example/logo.png' }))).toEqual({
      icons: { icon: 'https://photos.example/logo.png' },
    })
  })

  it('is left to the root layout (a neutral icon) when the club has no logo', () => {
    expect(clubIcon(siteWith(null))).toEqual({})
  })
})
