import { describe, expect, it } from 'vitest'

import {
  checkAccess,
  deploymentFor,
  liveDeploymentId,
  promoteDeployment,
  VercelApiError,
  type VercelAccess,
} from '../../scripts/lib/vercelApi'

// The release talks to Vercel's web API directly, not through `vercel promote` / `vercel inspect`,
// which first ask "which user am I?" and fail for the release's token (10 Nov 2026).

type Seen = { url: string; method: string; auth: string | null; body: unknown }

const fakeVercel = (answer: (url: string, method: string) => Response) => {
  const seen: Seen[] = []
  const fetchFake = (async (url: string, init: RequestInit) => {
    seen.push({
      url,
      method: init.method ?? 'GET',
      auth: new Headers(init.headers).get('authorization'),
      body: init.body,
    })
    return answer(url, init.method ?? 'GET')
  }) as unknown as typeof fetch
  const access: VercelAccess = {
    token: 'secret-token',
    orgId: 'team_abc',
    projectId: 'prj_123',
    fetch: fetchFake,
  }
  return { access, seen }
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })

describe('which version is live', () => {
  it('looks the live address up as a deployment, in the team, with the token', async () => {
    const { access, seen } = fakeVercel(() => json({ id: 'dpl_old', url: 'old.vercel.app' }))
    expect(await liveDeploymentId(access, 'https://app.a1engine.co')).toBe('dpl_old')
    expect(seen).toHaveLength(1)
    expect(seen[0]!.url).toBe(
      'https://api.vercel.com/v13/deployments/app.a1engine.co?teamId=team_abc',
    )
    expect(seen[0]!.method).toBe('GET')
    expect(seen[0]!.auth).toBe('Bearer secret-token')
  })

  it('never asks who the user is (the lookup that failed)', async () => {
    const { access, seen } = fakeVercel(() => json({ id: 'dpl_x' }))
    await liveDeploymentId(access, 'https://app.a1engine.co')
    await promoteDeployment(access, 'dpl_x')
    await checkAccess(access, 'https://app.a1engine.co')
    expect(seen.some((s) => s.url.includes('/v2/user'))).toBe(false)
  })

  it('finds a deployment from its private address host', async () => {
    const { access, seen } = fakeVercel(() => json({ id: 'dpl_new', url: 'x' }))
    expect((await deploymentFor(access, 'golf-platform-abc-team.vercel.app')).id).toBe('dpl_new')
    expect(seen[0]!.url).toContain('/v13/deployments/golf-platform-abc-team.vercel.app?teamId=')
  })

  it('sends no team for a personal account', async () => {
    const { access, seen } = fakeVercel(() => json({ id: 'dpl_a' }))
    await liveDeploymentId({ ...access, orgId: 'user_xyz' }, 'app.a1engine.co')
    expect(seen[0]!.url).toBe('https://api.vercel.com/v13/deployments/app.a1engine.co')
  })
})

describe('switching a version on', () => {
  it('asks Vercel to promote that deployment in the project', async () => {
    const { access, seen } = fakeVercel(() => json({}, 201))
    await promoteDeployment(access, 'dpl_new')
    expect(seen[0]).toMatchObject({
      url: 'https://api.vercel.com/v10/projects/prj_123/promote/dpl_new?teamId=team_abc',
      method: 'POST',
      auth: 'Bearer secret-token',
      body: '{}',
    })
  })

  it("fails with Vercel's own words, and never the token", async () => {
    const { access } = fakeVercel(() => json({ error: { message: 'Not authorized' } }, 403))
    const error = await promoteDeployment(access, 'dpl_new').catch((e) => e)
    expect(error).toBeInstanceOf(VercelApiError)
    expect(error.message).toContain('403')
    expect(error.message).toContain('Not authorized')
    expect(error.message).not.toContain('secret-token')
  })

  it('reports an answer that is not JSON', async () => {
    const { access } = fakeVercel(() => new Response('<html>Bad gateway</html>', { status: 502 }))
    await expect(promoteDeployment(access, 'dpl_new')).rejects.toThrow(/502.*Bad gateway/)
  })

  it('reports no answer at all', async () => {
    const access: VercelAccess = {
      token: 't',
      orgId: 'team_abc',
      projectId: 'p',
      fetch: (async () => {
        throw new Error('network down')
      }) as unknown as typeof fetch,
    }
    await expect(promoteDeployment(access, 'dpl')).rejects.toThrow(/no answer from Vercel/)
  })
})

describe('the read-only access check', () => {
  it('passes when the project and the live version can be read', async () => {
    const { access } = fakeVercel((url) =>
      url.includes('/v9/projects/')
        ? json({ id: 'prj_123', name: 'golf-platform' })
        : json({ id: 'dpl_old' }),
    )
    expect(await checkAccess(access, 'https://app.a1engine.co')).toEqual({
      project: 'golf-platform',
      live: 'dpl_old',
    })
  })

  it('without a live address (staging) only reads the project', async () => {
    const { access, seen } = fakeVercel(() => json({ id: 'prj_123', name: 'golf-platform' }))
    expect((await checkAccess(access)).live).toBeUndefined()
    expect(seen).toHaveLength(1)
  })

  it('fails when the token cannot see the project, and changes nothing', async () => {
    const { access, seen } = fakeVercel(() => json({ error: { message: 'User not found.' } }, 404))
    await expect(checkAccess(access, 'https://app.a1engine.co')).rejects.toThrow(
      /404.*User not found/,
    )
    expect(seen.every((s) => s.method === 'GET')).toBe(true)
  })
})
