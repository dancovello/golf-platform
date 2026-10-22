# Live isolation canary

**Added:** 22 October 2026 (job 9) · **Code:** `src/canary/`, `src/app/(frontend)/cron/canary/route.ts` · **Status: built, not switched on.** Switching it on touches production and needs Dan's approval.

## What it does

Two hidden clubs live on production: **canary A** and **canary B**. Every hour, Vercel's scheduler calls `/cron/canary`. The route:
1. signs in **over the real web address**, as canary A's editor, with a password only like any club editor;
2. tries to reach canary B's records:
   - by ID;
   - by filtering on canary B;
   - by listing;
   - by searching for a marker word only canary B's records contain;
   - through the club preview addresses, which must not answer on production;
3. if any attempt gets something, raises a **Sentry alert** straight away (level "fatal"). It also raises one if the canary can't run, so silence never means "skipped".

It runs inside the app, as a Vercel cron job, so it uses no GitHub Actions minutes. It counts as about 720 small requests a month.

## Why the canary clubs can never appear anywhere public

- **No web address.** The clubs collection refuses a web address for any club whose slug starts with `canary-`, so a club domain can never reach them (test: "can never be given a web address").
- **No preview on production.** `/preview/<club>` only exists where `SITE_PREVIEW=on` (staging). The canary itself checks this every hour.
- **No sitemap, robots or search entries outside their own site,** which can't be reached.
- They do appear to the **super-admin** in the admin, labelled "(hidden test club)". That's admin-only.

## Where the canary's credentials live

- **Canary A's editor** has a long random password, made by the setup script and shown once.
- It's stored in **Vercel → Production environment variables** as `CANARY_EDITOR_EMAIL` and `CANARY_EDITOR_PASSWORD`, marked **Sensitive**, and in the password manager. Nowhere else, and never in the repo.
- The account is an ordinary club editor of a club with no real content, so the password reaches nothing of value.
- If production is behind Vercel's login, the route uses Vercel's own `VERCEL_AUTOMATION_BYPASS_SECRET` (Vercel sets it when Protection Bypass for Automation is on) to reach the site the way a visitor would.

## Switching it on (Dan; production, so needs your go-ahead)

1. **Create the canary clubs** on production: `pnpm create-canary-clubs`, choosing the production database (the owner connection string) when it asks. Give canary A's editor an email inbox you control. It prints the password once.
2. **In Vercel**, Production environment only: set `CANARY_EDITOR_EMAIL` and `CANARY_EDITOR_PASSWORD` (Sensitive). `CRON_SECRET` and `SENTRY_DSN` must already be set; the Sentry one is still on your pending list.
3. **Redeploy production** (a normal release). The hourly cron starts by itself.
4. **Check the first run:** Vercel → project → Logs, filtered to `/cron/canary`. It should answer `{"ok":true,...}`.

**Testing it on staging first:** Vercel only runs cron jobs on production. On staging, open `/cron/canary` with the header `Authorization: Bearer <CRON_SECRET>`, after creating canary clubs on the staging database. On staging the preview check is expected to report, because previews are open there.

## If it alerts

Treat it as a possible data breach: one club's editor reached another club's data on production.
1. Read the alert: it names each attempt that got through.
2. Reproduce it on staging with the same attempt, and write a failing isolation test.
3. Fix it, and ask the devops contact whether clubs need to be told (UK GDPR: a reportable breach must reach the ICO within 72 hours).
