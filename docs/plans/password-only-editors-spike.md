# Spike: two-factor for super-admins only (job 3, 22 Oct 2026)

**Question:** can `payload-totp` 3.0.6 require two-factor for super-admins and leave it optional for club editors?

**Answer: not by itself.** Its only switch is `forceSetup`, a yes/no for every account in the collection (`node_modules/payload-totp/dist/types.d.ts`). It's used in four places:
- **The access wrapper** (`totpAccess.js`): an account with two-factor set up gets nothing until its code is entered, *whatever `forceSetup` says*. With `forceSetup: true`, an account without two-factor also gets nothing. With `false`, it gets its normal access.
- **The admin redirect** (`components/Provider`): sends accounts without two-factor to the set-up screen only when `forceSetup` is on.
- **The account page:** shows "Set up" and "Remove" buttons only when `forceSetup` is off.
- **`/api/remove-totp`:** refuses while `forceSetup` is on; otherwise lets an account switch off its own two-factor with a valid code.

**So:** `forceSetup: false`, plus our own plugin (`src/auth/superAdminTwoFactor.ts`, after payload-totp) that adds the super-admin rule back in those same places:
1. Every collection and settings access rule refuses a super-admin who hasn't entered their code. The one exception is reading their own account, which the code screens need.
2. The admin wrapper is swapped for `src/admin/SuperAdminTwoFactorProvider.tsx`. It sends a super-admin without two-factor to the set-up screen, then hands over to payload-totp's own wrapper.
3. `/api/remove-totp` refuses super-admins.

**Club editors who already have two-factor keep it.** The plugin still asks for their code (rule 1 above), and they can switch it off themselves from their account page with a valid code. Recommendation: keep it (no data change, nothing to migrate). Clearing it for everyone would need a one-off script on production. It adds nothing, because editors who want password-only can switch it off themselves.

**One helper for "fully signed in"**, `isFullyAuthenticated(user)` in `src/auth/fullyAuthenticated.ts`, replaces the 13 places that compared `_strategy` to `'totp'` (the brief said 14; one had already gone). `tests/unit/fully-authenticated.spec.ts` fails if any other file reads `_strategy`.
