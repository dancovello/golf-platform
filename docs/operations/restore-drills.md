# Restore drills

Every drill is recorded here (procedure: [restore-runbook.md](restore-runbook.md)). Repeated every 3 months and after any change to the backup setup. The first drill happens in step 3.6, before any real club data exists.

| Date | Who | Method | Restore point | Started | Restored | Checked | Counts match | Rules held | Isolation suite | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-23 | Dan + Claude | 1. Neon branch copy of production | Current state (20:58 UTC) | 20:58:19 | 20:58:27 (8 s) | 20:58:49 | Yes (4 clubs, 3 users, 57 pages, 4 club settings) | Yes, both | Could not run (see finding 1) | The Neon tool copies the current state only; a copy from a chosen past moment was proven in method 2. Copy deleted; production counts unchanged afterwards. |
| 2026-11-23 | Dan + Claude | 2. Neon snapshot, taken from production history | 20:03 UTC (one hour earlier) | 21:03:36 | 21:03:53 (17 s) | 21:04:26 | Yes: 3 clubs, 2 users, 27 pages, 3 club settings, which is production minus the A1 Demo Club and a test user, both created after 20:03 | Yes, both | Not run | Proves Neon can rewind to a past moment. Copy deleted; the test snapshot expires itself on 2026-11-24. |
| 2026-11-23 | Dan + Claude | 3. Nightly off-site copy from Cloudflare R2 | Backup `production_2026-11-17T1100Z-nightly` | 21:38:26 | 21:39:35 (about 1 min 10 s to decrypt and load) | 21:39:48 | Yes: 2 clubs, 2 users, 26 pages, 2 club settings, which is right for 17 Nov (Cottrell came on 19 Nov, the demo club on 23 Nov) | Yes, both | Not run | Checksum matched; key matched `ops/backup-recipient.txt`. Decrypted only on Dan's Mac with FileVault on; key, dump, downloads and the temporary Neon copy deleted afterwards. |

## Findings from the 2026-11-23 drill

1. **The isolation suite cannot check a restored copy.** `pnpm test:isolation` wipes every record in the database first, refuses any database not named `golf_test`, and uses a test encryption key, so it fails on production's encrypted data. On the first try it deleted pages and club settings from the copy before stopping. Never run it on production. The runbook step 4.3 now uses `pnpm check-restored-copy` instead: a read-only check built on 2026-11-23 (scripts/check-restored-copy.ts) and proven on a fresh copy of production, where all 43 checks passed. Use it in every future drill.
2. **Neon history is 6 hours and there are no scheduled snapshots.** Production is on the free plan. The 7-day history and 14-day daily snapshots in the original plan need the Neon Launch upgrade (under discussion on 2026-11-23). Until then the nightly R2 copy is the only way back further than 6 hours. Rerun methods 1 and 2 after the upgrade.
3. **The backup key was hard to find.** The password manager entry had a line break inside the key line, and a first copy was not a valid key. Dan has added a note for next time. The runbook now says what a valid key looks like and how to check it.
4. **The oldest backup in R2 was downloaded, not the newest.** Dan's note: the list shows the oldest first. The runbook now says so. It did not affect the result.
5. **The drill needed tools that were not installed** (`age`, `pg_restore`). They are now on Dan's Mac through Homebrew.
6. **Not yet proven:** restoring photos and documents from the media backup (runbook section 7), and a restore of the production branch itself (a real-incident step, never run in a drill).
