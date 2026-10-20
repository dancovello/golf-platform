# Security checks: how to run one

Use this when you want a security check of the platform. Run it in a **new Claude Code chat** in this project. It's written so that chat needs nothing from earlier conversations.

**When:** before the first real club goes live, then once a month, and after any big change to sign-in, accounts, forms, uploads or the database.

The last full check was on **19 October 2026**. Its fixes are in dancovello/golf-platform#103 and #102.

## How to run it

1. Open a new chat in the `golf-platform` project.
2. Paste the prompt below, as it is.
3. The chat only **reads and reports**. It doesn't change code. When the report arrives, choose which findings to fix. Each fix then follows the usual flow: a plan first, then one branch and PR per fix.

## The prompt to paste

```text
Run a full security check of the golf-platform, as a senior application security reviewer.
I'm Dan, the product owner. I'm not a developer, so write the report in plain English.

Rules for this chat:
- Read and report only. Do not edit files, commit, push, open PRs or change any settings.
- Never touch production. You may read code, run the local test suite, and run local
  scanners. Do not send attack traffic to staging or any live site.
- Do not print or copy any secret, key or password you come across. Report where it is.
- Only claim a check passed if you ran it and read the result.

First read CLAUDE.md, docs/architecture/04-infrastructure-architecture-and-guardrails.md
(sections 5, 7 and 8) and docs/architecture/decisions.md. They explain what the platform
promises. Then use the project's infosec-review skill for the method, the owasp-security skill
as the checklist, and the gdpr-review skill for the personal-data part.

Check at least these, giving file and line evidence for each finding:

1. Club separation: can a club editor see, change, or even find out about another club's
   data through the admin, the REST or GraphQL API, live preview, page versions, search,
   uploads, the demo-club button, or any custom endpoint? Does every collection have
   create/read/update/delete access rules that deny by default?
2. Accounts: super-admin vs club editor kept separate; two-factor can't be skipped;
   invite and password-reset links (single use, expiry, never built from the request's
   own address); rate limits on sign-in and reset; account creation only via trusted scripts.
3. Public forms and search: contact form (spam checks, Turnstile, rate limits, what is stored),
   site search (rate limit, can it leak drafts or other clubs' content).
4. Content from editors: rich text, links, colours, fonts, embeds. Can an editor inject
   script or styles that run on visitors' browsers? (Doc 04 says no per-club custom code.)
5. Uploads: file type and size checks, content checks, signed upload links, unguessable
   file names, served from a separate domain.
6. Browser security headers and cookies (secure, httpOnly, sameSite), and the missing
   content security policy: how big a gap is it now?
7. Secrets and configuration: anything sensitive in the repo, in logs, in error messages
   or sent to the browser; environment variable handling.
8. Database: the website uses the limited golf_app account; migrations can't run from Vercel;
   release and backup workflows don't expose credentials.
9. Dependencies: run `corepack pnpm audit --audit-level high` and report anything high or critical.
10. GitHub Actions: workflow permissions, pinned actions, untrusted input in scripts,
    secrets available to pull requests from forks (the repo is public).
11. Personal data: what is collected, how long it's kept, whether the privacy policy
    (src/site/privacy/) matches what the code actually does, including retention promises.

Also run the local checks and report the results: `corepack pnpm typecheck`,
`corepack pnpm test` (this includes the club-separation tests; needs `docker compose up -d`).

Report format:
- A short summary first: is anything urgent?
- Then a numbered table: finding · severity (critical / high / medium / low) · where (file:line)
  · what could happen, in plain English · suggested fix · effort (small / medium / large).
- Then "Checked and fine": what you looked at and found no problem with.
- Then "Not checked": anything you couldn't check and why.
Save the report as docs/operations/security-check-YYYY-MM-DD.md (today's date) and tell me
it's there. That file is the only thing you may write.
```

## After the check

- Fix critical and high findings before the next production release.
- Medium and low findings go on the to-do list with a date.
- Add a line to the log below.

## Log

| Date | Run by | Report | Critical / high found | All fixed? |
|---|---|---|---|---|
| 2026-10-19 | Dan (Claude Code chat) | not saved as a file | see #103 | yes (#102, #103) |
