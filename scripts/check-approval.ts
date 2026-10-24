/**
 * Prints "true" if Dan's approval on this pull request was given after the latest push, else
 * "false" (scripts/lib/approval.ts). Used by CI for the approved-destructive-migration label and
 * by the security review for security-finding-dismissed.
 *
 *   node scripts/check-approval.ts <label> [comment prefix]
 *
 * Needs GH_TOKEN (actions: read, pull-requests: read), GITHUB_REPOSITORY, PR, HEAD_SHA, OWNER.
 */
import { approvedSincePush } from './lib/approval.ts'

const [label, commentPrefix] = process.argv.slice(2)
const { GH_TOKEN, GITHUB_REPOSITORY: repo, PR: pr, HEAD_SHA: sha, OWNER: owner } = process.env
if (!label || !GH_TOKEN || !repo || !pr || !sha || !owner) {
  console.error('Missing a label or one of GH_TOKEN, GITHUB_REPOSITORY, PR, HEAD_SHA, OWNER.')
  process.exit(1)
}

const api = async <T>(path: string): Promise<T[]> => {
  const all: T[] = []
  for (let page = 1; page <= 10; page++) {
    const response = await fetch(
      `https://api.github.com/repos/${repo}/${path}${path.includes('?') ? '&' : '?'}per_page=100&page=${page}`,
      {
        headers: { Authorization: `Bearer ${GH_TOKEN}`, Accept: 'application/vnd.github+json' },
      },
    )
    if (!response.ok) throw new Error(`GitHub answered ${response.status} for ${path}`)
    const body = (await response.json()) as T[] | { workflow_runs: T[] }
    const items = Array.isArray(body) ? body : body.workflow_runs
    all.push(...items)
    if (items.length < 100) break
  }
  return all
}

const runs = await api<{ created_at: string }>(`actions/runs?head_sha=${sha}`)
const events = await api<{
  event: string
  actor?: { login: string }
  label?: { name: string }
  created_at: string
}>(`issues/${pr}/events`)
const issue = await fetch(`https://api.github.com/repos/${repo}/issues/${pr}`, {
  headers: { Authorization: `Bearer ${GH_TOKEN}`, Accept: 'application/vnd.github+json' },
}).then((r) => r.json() as Promise<{ labels: { name: string }[] }>)
const comments = commentPrefix
  ? await api<{ user: { login: string }; created_at: string; body: string }>(
      `issues/${pr}/comments`,
    )
  : []

const result = approvedSincePush({
  runTimes: runs.map((r) => r.created_at),
  labelEvents: events
    .filter((e) => e.event === 'labeled' && e.label?.name === label)
    .map((e) => ({ actor: e.actor?.login ?? '', at: e.created_at })),
  comments: comments.map((c) => ({ author: c.user.login, at: c.created_at, body: c.body })),
  labelPresent: issue.labels.some((l) => l.name === label),
  owner,
  commentPrefix,
})
console.error(`${label}: ${result.reason}`)
console.log(result.approved ? 'true' : 'false')
