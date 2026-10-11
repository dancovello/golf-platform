# Step 2 plan: clubs, account types and the tenant-isolation suite

**Status:** approved by Dan on 2026-10-10, with the answers recorded at the end. Nothing here is built yet.
**Goal:** a club's editor can see and change only their own club's content, and cannot tell other clubs exist. Automated tests prove it on every change and block the merge if it ever stops being true.

This builds on doc 04 §4–§5 and `docs/architecture/decisions.md` (account-type rules agreed on 2026-10-10).

---

## What you'll be able to do at the end

1. Log in to staging as **super-admin**, with a password **and** a code from a free authenticator app on your phone.
2. Create a club (e.g. "Test Club A") and edit its basic settings.
3. Create an **editor** for that club, and give them a one-time link to set their own password.
4. Log in as that editor, set up their authenticator app on first login, and see only Test Club A: its pages and its settings. There are no other clubs, no club switcher, and no other clubs' users anywhere.
5. Look at a pull request and see a required **tenant-isolation** check that is real, not a placeholder.

**Not in step 2:** club domains and public pages (step 4), images and media (they need Cloudflare R2), branding colours and blocks (step 5), and sending emails (no email provider chosen yet).

---

## What gets built

### Clubs (`tenants`)
- A **Clubs** list. Only the super-admin can create, rename or delete a club.
- An editor can read **only their own club's record**, and the Clubs list is hidden from editors' menus.

### The two account types (`users`)
These follow the rules you set:
- **Each account has a type, super-admin or editor, set once when the account is created and never changeable**, by anyone, through the screens or the API.
- **The database itself refuses** a super-admin with a club, an editor with no club, or an editor with more than one club. This holds even if application code has a bug.
- **Super-admins are created only by a command-line script.** The script:
  - asks for the email, password and database address on screen, so nothing ends up in files or command history;
  - shows which database it's about to change, and makes you type its name to confirm;
  - is never to be run against production without your explicit approval.
- **Editors are created only by the super-admin**, in the admin screens, always attached to exactly one club.
- **Everyone must use two-factor login** (a free authenticator app), super-admins and editors alike. An account can't reach the admin screens until it's set up.
- **Lost phone:** each account gets one-time backup codes when two-factor is set up. If an editor loses both, the super-admin can reset their two-factor so they set it up again. A super-admin's two-factor can only be reset from the command line, with your approval for production.
- **Passwords:** at least 12 characters, and an account locks for 10 minutes after 5 wrong attempts.
- Payload's built-in **"create first user" screen is replaced** with a page saying accounts are created by a platform administrator. (The route behind it is already blocked from step 1.)

### Two club-owned collections, to prove isolation on
- **Pages:** title and URL slug only for now. Blocks come in step 5.
  - The slug is unique **within a club**, so two clubs can both have `/membership`. A clash in one club never reveals another club's page.
- **Club Settings:** one record per club, holding just the club's display name for now. This is the "per-club global" pattern from the decisions log. Colours, logo and fonts arrive in step 5.

### Multi-tenant plugin
- Use Payload's official multi-tenant plugin, which keeps lists, dropdowns and per-club settings scoped to one club.
- Every collection still keeps its own explicit access rules (default deny), checked by the existing guard test.
- GraphQL stays switched off.

### The tenant-isolation test suite (the core of step 2)
Two test clubs, **A** and **B**, each with an editor, plus one super-admin. It runs on every pull request as a **required** check named `tenant-isolation`. The tests are in three layers:

1. **Data layer:** for every collection, editor A gets **zero** of club B's records when listing, searching, counting, reading by ID, updating or deleting.
2. **API layer (over real HTTP):** the same checks against the running app's addresses.
   - Asking for club B's page by its exact ID returns **exactly the same response as asking for a page that doesn't exist**. Editor A can't even confirm that the ID is taken.
3. **Admin-screen layer (a real browser, using Playwright):** editor A logs in and the suite checks every screen they can reach:
   - lists, dropdowns and the club switcher;
   - the users list;
   - Payload's internal records ("someone is editing this page" locks, saved preferences);
   - typing club B's page address straight into the browser.

   No club B name, ID or record may appear anywhere.

**Escalation tests (your condition 5).** Editor A tries to:
- make themselves super-admin;
- move themselves to club B;
- create another account;
- edit club B's settings;
- read the Clubs list.

Every attempt must fail, or the build fails.

**Guard tests:**
- A new collection that's missing an access rule fails the build (already in place).
- A new club-owned collection that isn't registered with the isolation suite also fails the build. Nobody can add one and forget to test it.

---

## How the work is split: one small PR each, in this order

| # | PR | What you'll see |
|---|---|---|
| 2.1 | **Spike** (throwaway branch, not merged) | A short written finding, before any real build (see below) |
| 2.2 | Clubs, account types, database rules, super-admin script, escalation tests | Super-admin can log in on staging (no 2FA yet: **staging only**, and staging stays behind the Vercel login) |
| 2.3 | Plugin, Pages and Club Settings, data- and API-layer isolation tests; `tenant-isolation` becomes a real **required** check | Two test clubs on staging |
| 2.4 | Admin-screen isolation tests (Playwright in CI) | Browser-based isolation checks on every PR |
| 2.5 | Two-factor login for every account, plus backup codes and super-admin reset for editors | You set up your authenticator app; a test editor does the same |
| 2.6 | Editor invite link (one-time "set your password" link, copied by the super-admin) | You can invite a test editor end to end |

### 2.1 The spike: what it must answer before anything is built
1. **One club per editor.** The plugin is designed for users who can belong to *several* clubs. Can it work with exactly one, with the database enforcing that? There are two candidate designs; the spike tries both and picks the one where the database rule is simplest and the tests pass.
2. **Leaks the plugin doesn't close by itself.** The spike checks the club switcher, the users list, Payload's internal collections, error messages and "not found" responses for anything that reveals another club.
3. **Two-factor login.** Payload has no built-in two-factor login, so the spike reviews two options:
   - `payload-totp`: a small community plugin, recently updated, with **one maintainer**;
   - `payload-auth`: a fuller login system built on Better Auth, much bigger.

   Both are free, open-source (MIT licence) code that runs inside our app, with no paid service (Dan's requirement). I'll read each one's source code and recommend one. If neither is good enough, the fallback is a small two-factor feature of our own, built on a standard free library.

If the spike finds a leak the plugin can't close, I'll stop and explain before switching to hand-rolled access control (as agreed in the decisions log).

---

## Checks on every PR in step 2
Typecheck, lint, tests, build, secret scan and dependency scan. From 2.3 onwards the **tenant-isolation** check is real and required. Each PR ends with the usual plain-English summary.

## What needs your devops contact or a security reviewer
- **2.2 and 2.5:** the account-type database rules, login lockout and two-factor approach. You asked for this account design to be checked before launch.
- **2.3–2.4:** whether the isolation suite covers enough. This is an application-security question, so it fits the independent security review / pen test (doc 04 §7) better than devops.
- **Neon:** create a less powerful database account for the app to use, instead of `neondb_owner`. This must happen before step 3 / real data.

## Dan's answers (2026-10-10)
1. **Two-factor option:** recommend one after the spike; it must be **free**, with no paid service. Final pick to go past the devops contact.
2. **Inviting editors:** yes, a one-time "set your password" link copied by the super-admin, until an email provider is chosen.
3. **Two-factor for editors:** **required** for everyone, not optional.
