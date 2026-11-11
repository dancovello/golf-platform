/**
 * The deploy part of a release (audit fix plan, step 4). Pure decision logic with the real
 * work (Vercel, the network) passed in, so tests can play out every way it can go wrong.
 *
 * Production ("staged"):
 *   1. note which version is live now, so it can be put back
 *   2. build the new version WITHOUT giving it the live address (visitors stay on the old one)
 *   3. check the new version on its own private address; if it fails, stop: nothing changed
 *   4. switch the live address to it
 *   5. check the live address; if it fails, put the previous version back
 * Staging has no staged switch (Vercel gives the staging address to a new deployment at once),
 * so it only builds and checks, as before.
 */
export type ReleaseSteps = {
  /** Builds the new version and returns its own private address. `staged`: keep the live address. */
  deploy: (staged: boolean) => Promise<string>
  /** Whether that private address can use its database. */
  checkDeployment: (url: string) => Promise<boolean>
  /** The version live right now (an address or id), or undefined if it can't be found out. */
  currentLive: () => Promise<string | undefined>
  /** Makes the live address serve that version. */
  promote: (url: string) => Promise<void>
  /** Whether the live address can use its database. */
  checkLive: () => Promise<boolean>
  /** Puts a previous version back on the live address. */
  rollback: (to: string) => Promise<void>
  log: (message: string) => void
}

export type ReleaseResult = { url: string; promoted: boolean }

export class ReleaseFailed extends Error {}

export const safeRelease = async (
  steps: ReleaseSteps,
  { staged }: { staged: boolean },
): Promise<ReleaseResult> => {
  const previous = staged ? await steps.currentLive() : undefined
  if (staged) {
    steps.log(
      previous
        ? `Live version now: ${previous}`
        : 'Could not find out which version is live, so an automatic rollback is not possible.',
    )
  }

  const url = await steps.deploy(staged)
  steps.log(`Built the new version: ${url}`)

  if (!(await steps.checkDeployment(url))) {
    throw new ReleaseFailed(
      staged
        ? 'The new version could not use its database. It was NOT switched on: visitors are still on the previous version.'
        : 'The new version could not use its database. See docs/operations/restore-runbook.md.',
    )
  }
  steps.log('The new version passed its check.')
  if (!staged) return { url, promoted: false }

  await steps.promote(url)
  steps.log('Switched the live address to the new version.')
  if (await steps.checkLive()) {
    steps.log('The live address passed its check.')
    return { url, promoted: true }
  }

  if (!previous) {
    throw new ReleaseFailed(
      'The live address failed its check after the switch and the previous version is unknown. Put the previous version back by hand: docs/operations/incident-plan.md, section 2.',
    )
  }
  steps.log('The live address failed its check. Putting the previous version back.')
  await steps.rollback(previous)
  const recovered = await steps.checkLive()
  throw new ReleaseFailed(
    recovered
      ? 'The new version failed its check once live, so the previous version was put back automatically. Visitors are on the previous version.'
      : 'The new version failed its check once live and putting the previous version back did not fix it. Act now: docs/operations/incident-plan.md.',
  )
}
