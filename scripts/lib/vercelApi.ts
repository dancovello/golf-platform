/**
 * The three things a production release needs from Vercel after the build, asked of Vercel's
 * own web API directly: which version is live, and make a version live.
 *
 * Why not the `vercel` command-line tool: `vercel promote` and `vercel inspect` first ask
 * Vercel "which user am I?" (GET /v2/user). The release's token is not a personal user token, so
 * that answers 404 "User not found" and both commands fail, while `vercel deploy` (which skips
 * that lookup when VERCEL_ORG_ID and VERCEL_PROJECT_ID are set) works. This failed the first
 * production release to use the staged switch-on (10 Nov 2026, run 42993025986). The requests
 * below are the same ones the tool makes once it has got past that lookup.
 */
export type VercelAccess = {
  token: string
  /** VERCEL_ORG_ID. A team id starts "team_"; for a personal account no team is sent. */
  orgId: string
  projectId: string
  fetch?: typeof fetch
}

export class VercelApiError extends Error {}

const API = 'https://api.vercel.com'

const call = async (access: VercelAccess, method: 'GET' | 'POST', path: string) => {
  const team = access.orgId.startsWith('team_') ? `?teamId=${encodeURIComponent(access.orgId)}` : ''
  let response: Response
  try {
    response = await (access.fetch ?? fetch)(`${API}${path}${team}`, {
      method,
      headers: { authorization: `Bearer ${access.token}`, 'content-type': 'application/json' },
      body: method === 'POST' ? '{}' : undefined,
      signal: AbortSignal.timeout(30_000),
    })
  } catch (error) {
    throw new VercelApiError(`${method} ${path}: no answer from Vercel (${String(error)})`)
  }
  const text = await response.text()
  let body: Record<string, unknown> = {}
  try {
    body = text ? JSON.parse(text) : {}
  } catch {
    // Not JSON: the start of the text is used in the message below.
  }
  if (!response.ok) {
    const reason = (body.error as { message?: string } | undefined)?.message ?? text.slice(0, 200)
    // Never the token: only the method, the path, the status and Vercel's own words.
    throw new VercelApiError(`${method} ${path} answered ${response.status}: ${reason}`)
  }
  return body
}

/** The deployment an address or id points at (the same lookup the command-line tool makes). */
export const deploymentFor = async (access: VercelAccess, hostOrId: string) => {
  const body = await call(access, 'GET', `/v13/deployments/${encodeURIComponent(hostOrId)}`)
  if (typeof body.id !== 'string') throw new VercelApiError(`No deployment found for ${hostOrId}`)
  return { id: body.id, url: String(body.url ?? '') }
}

const hostOf = (address: string) => (address.includes('://') ? new URL(address).host : address)

/** The id of the version the live address serves right now. */
export const liveDeploymentId = async (access: VercelAccess, liveAddress: string) =>
  (await deploymentFor(access, hostOf(liveAddress))).id

/** Makes a version live on the production address (the same request as `vercel promote`). */
export const promoteDeployment = async (access: VercelAccess, deploymentId: string) => {
  await call(
    access,
    'POST',
    `/v10/projects/${encodeURIComponent(access.projectId)}/promote/${encodeURIComponent(deploymentId)}`,
  )
}

/**
 * Read-only proof that this token can do what a release needs: see the project, and find the
 * version the live address serves. Run before a release changes anything
 * (scripts/vercel-access-check.ts).
 */
export const checkAccess = async (access: VercelAccess, liveAddress?: string) => {
  const project = await call(access, 'GET', `/v9/projects/${encodeURIComponent(access.projectId)}`)
  if (typeof project.id !== 'string') throw new VercelApiError('Vercel did not return the project')
  const live = liveAddress ? await liveDeploymentId(access, liveAddress) : undefined
  return { project: String(project.name ?? project.id), live }
}
