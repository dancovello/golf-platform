# Step 2.1 spike findings

**Date:** 2026-10-10 · **Code:** branch `spike/2.1-multi-tenant` (throwaway, not merged) · **Plan:** [step-2-tenants-accounts-isolation.md](step-2-tenants-accounts-isolation.md)

## Summary
**The official multi-tenant plugin works for us, with one club per editor enforced by the database.** We don't need hand-rolled access control.

The experiment found **three real problems** that the build must fix:
- a bug in my own code;
- a cross-club leak in a Payload built-in;
- record numbers that reveal other clubs exist.

All three have proven fixes. For two-factor login, **`payload-totp`** (free, MIT licence) is the right choice, with two additions we build ourselves.

---

## 1. One club per editor: works ✅
- Each account stores **one** club. The database itself rejects:
  - an editor with no club;
  - a super-admin with a club;
  - any change to an account's type or club after creation.
- The plugin expects a *list* of clubs per user. We hand it a one-item list built from that single club, so it never needs a second one.
- **Proven by tests**, including raw database commands that bypass the app entirely.

## 2. Isolation results
**Test suite:** 28 checks, all passing. They cover two test clubs, an editor in each, and a super-admin.

- **Data layer.** Editor A gets zero club B records across pages, club settings, the clubs list and the users list. Super-admins are invisible to editors.
- **Escalation attempts all fail.** Editor A can't:
  - make themselves super-admin;
  - move to club B;
  - create accounts;
  - edit, create or delete anything in club B.
- **API over real web requests.** Club B's page, club B's editor and the super-admin all return **404 Not Found**, identical to a record that doesn't exist. Filtering by club B's ID returns an empty list. Anonymous visitors are refused everything.
- **Admin screens as editor A:**
  - only Users, Pages and Club Settings appear;
  - the Clubs list returns 404;
  - typing club B's page address shows "could not be found";
  - no club B name, email or record appears anywhere on any screen;
  - the club switcher doesn't appear for a one-club editor.
- **The tests really depend on the plugin.** With the plugin's filter switched off, 5 isolation tests failed immediately (a "mutation test").

## 3. Problems found, and their fixes

| # | Problem | Severity | Fix (proven in the spike) |
|---|---|---|---|
| 1 | **My code called itself forever** when an anonymous request listed accounts, crashing the server (out of memory). The plugin silently *replaces* our access rules with wrapped versions, and my override called the replaced version. | High (crash on demand) | Keep a frozen copy of our original rules and call that. A test covers the anonymous case. |
| 2 | **Payload's "someone is editing this page" records are readable by every logged-in user, across clubs**, including who is editing (their email). Payload doesn't let us change the rules on that built-in collection. | High (cross-club leak) | Document locking is **switched off**, so the collection doesn't exist at all. A test fails if it ever comes back. Trade-off: no "X is editing this" warning between two editors at the same club. |
| 3 | **Record numbers count across the whole platform** (club 17, pages 32 and 35…), which tells editors that other clubs and pages exist. This breaks the "can't discover other clubs exist" rule. | Medium (existence leak) | Use **random IDs (UUIDs)** for every record. Cheap now, painful once real data exists. |
| 4 | Deleting a club would have left its pages and accounts **without a club** rather than refusing. | Medium | Database refuses to delete a club that still has accounts or content; club content can never be club-less. |
| 5 | Test users were missing a marker that real logins have, so the plugin's filter might not have run in tests. | Test reliability | Test users now carry the same marker as a real login. |
| 6 | Editors can see the account-type menu (the "Super-admin" option label) on their own account page. | Low (no club data) | Hide the account-type and club fields from editors. |

## 4. Two-factor login

| | `payload-totp` (recommended) | `payload-auth` (Better Auth) |
|---|---|---|
| Cost | Free, MIT | Free, MIT |
| What it is | Adds authenticator-app codes to Payload's existing login | Replaces Payload's whole login system |
| Size | Small, 3 standard dependencies | Large, about 10 dependencies |
| Fit | Keeps the account work above unchanged | Would mean redoing and re-proving the account model |
| Maintenance | One maintainer, updated last week, 0 open issues | Team, 23 open issues |

**Why `payload-totp`:**
- **Enforced on the server.** It wraps every access rule, so a stolen password alone can't reach anything, through the screens or the API.
- **"Force setup" option.** Every account must set up two-factor before doing anything, which matches your "required for everyone" rule.
- **Limits code-guessing**, using the same lockout as passwords.

**Gaps we must fill ourselves:**
1. **Secrets are stored unencrypted** in the database. We add encryption, with a key kept in Vercel's settings, so a leaked database backup doesn't reveal anyone's two-factor secret.
2. **No backup codes.** The plugin doesn't have them. Lost-phone recovery would be:
   - the super-admin resets an editor's two-factor from the admin screen, and the editor sets it up again;
   - a super-admin's own reset is done from the command line, needing your approval on production.

**Conditions:**
- **API keys stay switched off.** The plugin lets API keys skip two-factor.
- **The version is pinned, and each update gets reviewed.** It has a single maintainer, so if it's ever abandoned we'll replace it with our own version on the same standard library (`otpauth`).

## 5. Changes to the step 2 plan
- **Add:** random IDs (UUIDs) for every record (finding 3).
- **Add:** document locking off, with a guard test (finding 2).
- **Change:** drop backup codes; recovery is by super-admin reset (needs Dan's OK, see below).
- **Add:** encrypt two-factor secrets at rest.
- **For the devops / security review:**
  - two-factor secret encryption and where its key lives;
  - the plugin's single maintainer;
  - the less-powerful database account for the app (from step 1).

## Questions for Dan
1. **Backup codes:** the free plugin doesn't have them. Is "the super-admin resets a lost phone" enough for v1? The alternative is building backup codes ourselves (about one extra small PR).
2. **"X is editing this page" warnings:** OK to go without them in v1 to close the leak? They could come back later if Payload fixes the built-in rules.
