# Incident plan: when something goes wrong

**Written:** 10 November 2026 (audit fix plan, step 10) · **For:** Dan, and anyone Dan asks for help · **Length:** one page on purpose. It points to the detailed notes; it doesn't repeat them.

An **incident** is anything that stops clubs' websites working, loses or leaks data, or lets someone in who shouldn't be. If you are not sure, treat it as one.

## 1. How you find out

| Signal | Where it arrives | What it means |
|---|---|---|
| Uptime email | Sentry (monitor "Production health") | The site isn't answering |
| "Database check failed" in Sentry | Sentry email, hourly check | Club sites can't reach the database |
| "ISOLATION CANARY" in Sentry | Sentry email | A test club reached another club's data. **Treat as a data leak** |
| New error in Sentry | Sentry email | Something broke; may be small |
| "Emergency super-admin account signed in" in Sentry | Sentry email | The offline emergency account was used (only once it exists and `EMERGENCY_ADMIN_EMAIL` is set). If it wasn't you, treat it as a break-in |
| "Release to … failed", "Media backup failed" | GitHub issue and email | A release or a backup did not finish |
| A club or visitor tells you | Email or phone | Believe them until proved otherwise |

Details: `docs/operations/monitoring.md`, `docs/operations/canary.md`.

## 2. First ten minutes: stop it getting worse

Write down the time first (what you saw, when). Then:

1. **Site down or broken after a release:** put the previous version back. Vercel → the project → **Deployments** → the last good Production deployment → **⋯ → Promote to Production** (or "Instant Rollback"). The database isn't rolled back by this; if the release changed the database, read `docs/operations/restore-runbook.md` before restoring anything.
2. **Suspected break-in or leaked key:** change the key that may be exposed, in this order of likelihood:
   - GitHub secrets (Settings → Environments → `release-production`): replace the value at its source (Neon, Cloudflare, Vercel), then re-save it.
   - The website's database password (`golf_app`): do **not** press "Reset password" in Neon without updating `DATABASE_URL` in Vercel at the same moment, or the live site stops.
   - `PAYLOAD_SECRET`: changing it signs everyone out. Do it in Vercel, then redeploy.
   - Lock or remove the affected account (Admin → Accounts), then send a fresh password link.
3. **A club's data seen by another club:** this is the worst case. Take the site down if you have to (Vercel → Deployments → Promote the last version from before the change), keep every log, and go to section 4 at once.
4. **Database lost or damaged:** `docs/operations/restore-runbook.md`. Restore into a copy first. Targets: at most 24 hours of data lost, back within 4 hours.
5. **Photos or documents gone:** `docs/operations/restore-runbook.md`, section 7 (the nightly second copy, and the 7-day "set aside" folder).

## 3. Locked out of the admin

- **Lost phone, no two-factor code:** `pnpm reset-two-factor` (run by whoever has production access, with Dan's go-ahead). It clears the secret so you set it up again at the next sign-in.
- **Forgot the password:** the "Forgot password?" link works only where email is set up (it is, on production). Otherwise a new link needs another super-admin or a script.
- **No other super-admin:** `pnpm create-super-admin` is the only way to make one (needs production access, and Dan's explicit go-ahead). **Today there is one super-admin account, so a lost account means a script and a person with production access.** An offline second account would remove that risk: see the open decision at the bottom.

## 4. Telling people

- **Clubs are told by Dan**, never by a developer or by Claude. Say plainly what happened, what you know, what you're doing and when you'll next update.
- **If personal data may have been exposed** (visitors' names, emails or messages, or editors' accounts): this is a "personal data breach" in law. Dan, as the clubs' processor under the data processing agreement, tells each affected club **without delay**, so the club can decide whether to report it. A club reports to the ICO within 72 hours of becoming aware, if there is a risk to people. Get advice from a person who knows this area; this plan can't give it.
- **Check the audit log** (admin → Platform → Audit log): sign-ins, account and password changes, two-factor resets and deleted club content, with who and when, kept 12 months. It answers "who did this?".
- Keep a short written record (time, what happened, who was told, what was done). The data processing agreement and the privacy policy both promise care of this data.

## 5. Afterwards

1. Check the site and a few club pages by hand; check the isolation canary is quiet.
2. Write what happened in `docs/architecture/decisions.md` (what, why, the fix), and open an issue for anything left.
3. If a restore was needed, add it to `docs/operations/restore-drills.md` as a real use.
4. If a key was exposed, confirm the old one is revoked, not just replaced.

## Who can do what

| Job | Who |
|---|---|
| Decide, tell clubs, approve anything on production | Dan |
| Rollback in Vercel, restore from a backup | Dan (the devops contact helps) |
| Read logs and Sentry, find the cause, prepare a fix | Claude Code, in a chat in this project |
| Anything on production data (scripts, restores) | Only with Dan's explicit go-ahead in that session |

## Open decision (Dan)

**An emergency second super-admin account, kept offline.** Today a lost super-admin account (phone gone and recovery impossible) needs a script run with production access. A second super-admin whose details are written down and stored offline (not in the password manager the first account lives in) would let you get back in alone. Trade-off: it is a second way in, so it needs its own two-factor and a strong password, and it's only used in an emergency. Not created yet.
