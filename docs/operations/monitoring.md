# Error alerts and uptime monitoring (build step 6)

Two things tell you the platform has a problem before a club phones you:

- **Error alerts (Sentry):** an email when something breaks in the website or admin.
- **Uptime check:** an email when the site stops answering at all. It runs from outside our app, so it still works if everything is down.

Both are free at our size. The code is ready; it switches on once the Sentry key is in Vercel.

## What gets sent to Sentry

Server errors only. Nothing runs in visitors' browsers, so club sites load no extra script and need no cookie consent.

Each report holds the error, where in the code it happened, and the page's address **without** anything after the `?`. It never includes cookies, form contents, accounts or IP addresses, and anything that looks like an email address is replaced with `[email]` (`src/monitoring/sentry.ts`, tested in `tests/unit/sentry-scrub.spec.ts`).

Sentry is listed in Schedule 3 of the data processing agreement (version `2026-10-20-draft`, so clubs are asked to accept again) and in the privacy policy's "who we share it with".

## Your checklist (about 15 minutes, no card needed)

### Sentry

1. Sign up at sentry.io on the free **Developer** plan.
2. When it asks you to create an organisation, set **Data Storage Location** to **EU (Germany)**. This can't be changed later.
3. Create a project: platform **Next.js**, alert frequency **"Alert me on every new issue"**. Name it `golf-platform`.
4. Copy the **DSN** (Settings → Projects → golf-platform → Client Keys). It looks like `https://…@o….ingest.de.sentry.io/…`.
5. In Vercel → golf-platform → Settings → Environment Variables, add **`SENTRY_DSN`** with that value for **Production** and **Staging**.
6. It switches on with the next release, or a manual redeploy.

### Uptime check

Sentry's free plan includes one uptime monitor, which runs from Sentry's servers, not ours:

1. Sentry → **Uptime** (under Insights, or Alerts → Create alert → Uptime monitor).
2. URL: production's `/health` address (e.g. `https://<production address>/health`). Interval: every 5 minutes.
3. Alert to your email.

Staging is behind the Vercel login, so it can't be checked from outside. Its release job already checks `/health` after every release.

**Why not Better Stack, as planned?** Its free tier says "free for personal projects". UptimeRobot's free plan was limited to non-commercial use in 2024, and it's unclear whether that changed. One check on production is enough while no club is live. **Before several clubs are live**, choose a paid uptime plan (roughly £5–£20 a month) that can check each club's home page.

## When an alert arrives

- **Sentry email:** open it. The report shows the error and the page. If it's new or keeps happening, paste the link into a Claude Code chat in this project and ask for a fix (plan first, as usual).
- **Uptime email:** check the production address in a browser. If it's down, check Vercel's status page and the latest release in GitHub Actions. `docs/operations/restore-runbook.md` covers rolling back.
