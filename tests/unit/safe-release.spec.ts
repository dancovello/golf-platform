import { describe, expect, it } from 'vitest'

import { ReleaseFailed, type ReleaseSteps, safeRelease } from '../../scripts/lib/safeRelease'

// The deploy part of a release (audit fix plan, step 4): every way it can go right or wrong.

const fake = (over: Partial<ReleaseSteps> = {}) => {
  const calls: string[] = []
  const steps: ReleaseSteps = {
    deploy: async (staged) => {
      calls.push(`deploy staged=${staged}`)
      return 'https://new.example'
    },
    checkDeployment: async () => {
      calls.push('check new')
      return true
    },
    currentLive: async () => {
      calls.push('note live')
      return 'dpl_old'
    },
    promote: async (url) => {
      calls.push(`promote ${url}`)
    },
    checkLive: async () => {
      calls.push('check live')
      return true
    },
    rollback: async (to) => {
      calls.push(`rollback ${to}`)
    },
    log: () => {},
    ...over,
  }
  return { steps, calls }
}

describe('a production release', () => {
  it('builds without the live address, checks, switches, checks again', async () => {
    const { steps, calls } = fake()
    const result = await safeRelease(steps, { staged: true })
    expect(result).toEqual({ url: 'https://new.example', promoted: true })
    expect(calls).toEqual([
      'note live',
      'deploy staged=true',
      'check new',
      'promote https://new.example',
      'check live',
    ])
  })

  it('never switches a version that fails its check', async () => {
    const { steps, calls } = fake({ checkDeployment: async () => false })
    await expect(safeRelease(steps, { staged: true })).rejects.toThrow(/NOT switched on/)
    expect(calls.some((c) => c.startsWith('promote'))).toBe(false)
    expect(calls.some((c) => c.startsWith('rollback'))).toBe(false)
  })

  it('puts the previous version back when the live address fails after the switch', async () => {
    let live = 0
    const { steps, calls } = fake({
      checkLive: async () => ++live > 1, // fails once switched, passes after the rollback
    })
    await expect(safeRelease(steps, { staged: true })).rejects.toThrow(/put back automatically/)
    expect(calls).toContain('rollback dpl_old')
    expect(calls.indexOf('promote https://new.example')).toBeLessThan(
      calls.indexOf('rollback dpl_old'),
    )
  })

  it('says so loudly when the rollback does not fix it either', async () => {
    const { steps } = fake({ checkLive: async () => false })
    await expect(safeRelease(steps, { staged: true })).rejects.toThrow(/Act now/)
  })

  it('asks for a manual rollback when the live version could not be found out', async () => {
    const { steps, calls } = fake({
      currentLive: async () => undefined,
      checkLive: async () => false,
    })
    await expect(safeRelease(steps, { staged: true })).rejects.toThrow(/by hand/)
    expect(calls.some((c) => c.startsWith('rollback'))).toBe(false)
  })

  it('still switches when the live version is unknown but everything passes', async () => {
    const { steps } = fake({ currentLive: async () => undefined })
    expect((await safeRelease(steps, { staged: true })).promoted).toBe(true)
  })

  it('failures are ReleaseFailed, with plain-English text', async () => {
    const { steps } = fake({ checkDeployment: async () => false })
    await expect(safeRelease(steps, { staged: true })).rejects.toBeInstanceOf(ReleaseFailed)
  })
})

describe('when the switch-on itself is refused (10 Nov 2026)', () => {
  it('says the new version is built and checked, still not live, and how to finish by hand', async () => {
    const { steps } = fake({
      promote: async () => {
        throw new Error('POST /v10/projects/p/promote/d answered 404: User not found')
      },
    })
    const error = await safeRelease(steps, { staged: true }).catch((e) => e)
    expect(error).toBeInstanceOf(ReleaseFailed)
    expect(error.message).toContain('https://new.example')
    expect(error.message).toContain('User not found')
    expect(error.message).toContain('still on the previous version')
    expect(error.message).toContain('Promote to Production')
  })

  it('does not roll back, because nothing was switched on', async () => {
    const { steps, calls } = fake({
      promote: async () => {
        throw new Error('refused')
      },
    })
    await safeRelease(steps, { staged: true }).catch(() => {})
    expect(calls.some((c) => c.startsWith('rollback'))).toBe(false)
  })
})

describe('a staging release', () => {
  it('builds and checks, with no switch and no rollback', async () => {
    const { steps, calls } = fake()
    const result = await safeRelease(steps, { staged: false })
    expect(result.promoted).toBe(false)
    expect(calls).toEqual(['deploy staged=false', 'check new'])
  })

  it('fails when the new version cannot use its database', async () => {
    const { steps } = fake({ checkDeployment: async () => false })
    await expect(safeRelease(steps, { staged: false })).rejects.toThrow(
      /could not use its database/,
    )
  })
})
