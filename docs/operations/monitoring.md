# Error alerts and uptime monitoring (build step 6)

Two things tell you the platform has a problem before a club phones you:

- **Error alerts (Sentry):** an email when something breaks in the website or admin.
- **Uptime check:** an email when the site stops answering at all. It runs from outside our app, so it still works if everything is down.

Both are free at our size. The code is ready; it switches on once the Sentry key is in Vercel.

## What gets sent to Sentry

Server errors only. Nothing runs in visitors' browsers, so club sites load no extra script and need no cookie consent.

Each report holds the error, where in the code it happened, and the page's address **without** anything after the `?`. It never includes cookies, form contents, accounts or IP addresses, and anything that looks like an email address is replaced with `[email]` (`src/monitoring/sentry.ts`, tested in `tests/unit/sentry-scrub.spec.ts`).

Sentry is listed in Schedule 3 of the data processing agreement (version `2026-10-20-draft`, so clubs are asked to accept again) and in the privacy policy's "who we share it with".

## Your checklist (about 10 minutes, no card needed)

### Sentry

1. Sign up at sentry.io on the free **Developer** plan.
2. When it asks you to create an organisation, set **Data Storage Location** to **EU (Germany)**. This can't be changed later.
3. Create a project: platform **Next.js**, alert frequency **"Alert me on every new issue"**. Name it `golf-platform`.
4. Copy the **DSN** (Settings → Projects → golf-platform → Client Keys). It looks like `https://…@o….ingest.de.sentry.io/…`.
5. In Vercel → golf-platform → Settings → Environment Variables, add **`SENTRY_DSN`** with that value for **Production** and **Staging**.
6. It switches on with the next release, or a manual redeploy.

### Uptime check: wait until the platform has its own domain

**Don't set this up yet.** Production's `.vercel.app` address is behind Vercel's login, so an outside check would get "not allowed" and report the site as down all the time (checked 2026-10-20). Until the platform has its own domain, the release job checks `/health` after every release instead. Staging stays behind the login for good, so it's never checked from outside.

Once the platform's own domain is connected, set up Sentry's one free uptime monitor. It runs from Sentry's servers, not ours:

1. Sentry → **Monitors** → **Add Monitor** → **Uptime Monitor**.
2. **URL:** production's `/health` on the platform's domain, e.g. `https://<platform domain>/health`. **Method:** GET. **Interval:** 5 minutes. Leave the other settings as they are (it counts as down after 3 failed checks in a row).
3. **Add an alert for it.** Sentry doesn't email about uptime unless you create one: Alerts → **Create Alert** → **Uptime Monitor** → choose the monitor → action **Send a notification to** your email.

**Why not Better Stack, as planned?** Its free tier says "free for personal projects". UptimeRobot's free plan was limited to non-commercial use in 2024, and it's unclear whether that changed. One check on production is enough while no club is live. **Before several clubs are live**, choose a paid uptime plan (roughly £5–£20 a month) that can check each club's home page.

## When an alert arrives

- **Sentry email:** open it. The report shows the error and the page. If it's new or keeps happening, paste the link into a Claude Code chat in this project and ask for a fix (plan first, as usual).
- **Uptime email:** check the production address in a browser. If it's down, check Vercel's status page and the latest release in GitHub Actions. `docs/operations/restore-runbook.md` covers rolling back.
