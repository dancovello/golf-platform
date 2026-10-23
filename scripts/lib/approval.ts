/**
 * Whether one of Dan's approvals on a pull request still counts: it must have been given after
 * the latest push (migrations audit, finding 2). Otherwise one approval for one change would
 * also approve anything pushed later. Pure: the GitHub data is passed in.
 *
 * "The latest push" is when GitHub first ran a workflow for the pull request's current commit.
 * That time is set by GitHub, unlike a commit's own date, which whoever makes it can choose.
 */
export type ApprovalInput = {
  /** When workflows first ran for the current commit (any of them). */
  runTimes: string[]
  /** The label's "labeled" events: who added it and when. */
  labelEvents: { actor: string; at: string }[]
  /** Comments: who wrote them, when, and what they say. */
  comments?: { author: string; at: string; body: string }[]
  /** Whether the label is on the pull request now. */
  labelPresent: boolean
  owner: string
  /** When set, a comment starting with this (from the owner, after the push) is also needed. */
  commentPrefix?: string
}

export const approvedSincePush = (input: ApprovalInput): { approved: boolean; reason: string } => {
  if (!input.labelPresent) return { approved: false, reason: 'the label is not on it' }
  const times = input.runTimes.map((t) => Date.parse(t)).filter(Number.isFinite)
  if (times.length === 0) return { approved: false, reason: 'the latest push time is unknown' }
  const pushedAt = Math.min(...times)
  const labelled = input.labelEvents.some(
    (e) => e.actor === input.owner && Date.parse(e.at) > pushedAt,
  )
  if (!labelled) return { approved: false, reason: 'the label was added before the latest push' }
  if (input.commentPrefix) {
    const prefix = input.commentPrefix.toLowerCase()
    const written = (input.comments ?? []).some(
      (c) =>
        c.author === input.owner &&
        Date.parse(c.at) > pushedAt &&
        c.body.trim().toLowerCase().startsWith(prefix),
    )
    if (!written) {
      return { approved: false, reason: 'no written reason from the owner since the latest push' }
    }
  }
  return { approved: true, reason: 'approved since the latest push' }
}
