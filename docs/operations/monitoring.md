# Error alerts and uptime monitoring (build step 6)

Two things tell you the platform has a problem before a club phones you:

- **Error alerts (Sentry):** an email when something breaks in the website or admin.
- **Uptime check:** an email when the site stops answering at all. It runs from outside our app, so it still works if everything is down.

Both are free at our size. **Both are set up and running (4 Nov 2026).** The Sentry key is in Vercel for Staging and Production, and the uptime check watches production.

## What gets sent to Sentry

Server errors only. Nothing runs in visitors' browsers, so club sites load no extra script and need no cookie consent.

Each report holds the error, where in the code it happened, and the page's address **without** anything after the `?`. It never includes cookies, form contents, accounts or IP addresses, and anything that looks like an email address is replaced with `[email]` (`src/monitoring/sentry.ts`, tested in `tests/unit/sentry-scrub.spec.ts`).

Sentry is listed in Schedule 3 of the data processing agreement (version `2026-10-20-draft`, so clubs are asked to accept again) and in the privacy policy's "who we share it with".

## What is set up (done 4 Nov 2026)

- **Sentry organisation `a1-engine-27`**, on the free **Developer** plan, stored in **Germany** (`de.sentry.io`). The 14-day Business trial that comes with a new account ends on the free plan by itself. One project, `golf-platform` (Next.js), under the team `a1-engine`.
- **`SENTRY_DSN`** is set in Vercel for **Staging and Production**. It is a connection key, not a password, but it stays in Vercel and out of the repo. Each report is tagged with Vercel's environment name (`VERCEL_ENV`), so production errors can be filtered from the rest. Staging may show as `preview` rather than `staging`; this hasn't been checked.
- **Error email:** the alert "Email me about every new issue" emails the project's members whenever a new kind of error first appears. Sentry's two default alerts ("high priority issues" and "pull requests are ready") are still there.
- **Tested 4 Nov:** two fake errors sent from a local script reached the project, and the alert email arrived. A real error from the live site has not been seen yet, so the first one is the proof that Vercel's servers report.
- **Uptime check:** the monitor "Production health (app.a1engine.co)" fetches `https://app.a1engine.co/health` every 5 minutes. It counts as down after 3 failed checks in a row. It is connected to the same email alert, but that has not been tested with a real outage. It is Sentry's one free uptime monitor.

### If you ever need to redo it

1. Sign up at sentry.io on the free **Developer** plan. Decline any card or Business trial offer.
2. Create the organisation with **Data Storage Location** set to **EU (Germany)**. This can't be changed later.
3. Create a Next.js project called `golf-platform`.
4. Copy its DSN (Settings → Projects → golf-platform → Client Keys) into Vercel as **`SENTRY_DSN`** for Staging and Production, then redeploy both. A variable only takes effect on a new deployment.
5. Alerts → add an email alert for every new issue, and connect the uptime monitor to it (Sentry doesn't email about uptime unless an alert is attached).

### Uptime: why `app.a1engine.co` and why Sentry

The check uses the admin address, `app.a1engine.co/health`, because the main address `a1engine.co/health` gives a 404. The old `.vercel.app` address sits behind Vercel's login, so an outside check would have reported the site as down all the time.

**Why not Better Stack, as planned?** Its free tier says "free for personal projects". UptimeRobot's free plan was limited to non-commercial use in 2024, and it's unclear whether that changed. One check on production is enough while no club is live. **Before several clubs are live**, choose a paid uptime plan (roughly £5–£20 a month) that can check each club's home page.

## When an alert arrives

- **Sentry email:** open it. The report shows the error and the page. If it's new or keeps happening, paste the link into a Claude Code chat in this project and ask for a fix (plan first, as usual).
- **Uptime email:** check the production address in a browser. If it's down, check Vercel's status page and the latest release in GitHub Actions. `docs/operations/restore-runbook.md` covers rolling back.
