# Restore runbook

**Who:** the devops contact. Claude can follow it too, with Dan's approval.
**When:** for real if production data is lost or damaged. As a **drill** every 3 months, and after any change to the backup setup (docs/plans/step-3-backups-migrations-production.md).
**Targets (Dan, 2026-10-11):** at most **24 hours** of data lost in the worst case, and back up within **4 hours**.

> **Golden rules**
> 1. **Restore into a copy first.** Never overwrite production until the copy has been checked.
> 2. **Production data stays inside Neon or the encrypted backup bucket.** Never put it on a laptop, in staging, or in a PR preview. The off-site drill loads it into a temporary database inside Neon, which is deleted at the end.
> 3. **Write down the times** (started, restored, checked). They prove the 4-hour target.

---

## 0. Before you start
- Access needed: Neon (`golf-production` project), Vercel, GitHub, and the password manager entries "Golf production: …" and "Golf backups: …".
- Decide **what moment to restore to**. For a bad release, that's just before the release (the release workflow creates a backup point named `before-release-<date>`). For accidental deletion, it's just before the deletion.
- **For a real incident:** tell Dan before touching production.

## 1. Point-in-time restore (fastest: any second in the last 7 days)
1. Neon → `golf-production` → **Backup & Restore** → **Restore from history**.
2. **First, make a copy:** choose **Create branch from a point in time** (not "Restore"). Name it `restore-check-<date>` and pick the moment.
3. Check the copy (section 4).
4. **Drill:** delete the `restore-check-…` branch, then go to section 5.
5. **Real incident, copy checked:** back on **Restore from history**, restore the **production branch itself** to the same moment. Neon keeps the pre-restore state automatically as `production_old_<timestamp>`; don't delete it until Dan says so. The app reconnects by itself, with no settings to change.

## 2. Restore from a Neon snapshot (named daily restore points, 14 days)
1. Neon → `golf-production` → **Backup & Restore** → **Snapshots**.
2. Pick the snapshot → **Restore to new branch**, named `restore-check-<date>`.
3. Check it (section 4).
4. **Drill:** delete the branch. **Real incident:** follow Neon's prompt to restore the snapshot to the production branch, or point the app at the restored branch. Agree which one with Dan first.

## 3. Restore from the nightly off-site copy (Cloudflare R2: survives problems with Neon itself)
Backups are made nightly at 02:30 UTC, and before every release (named `…-pre-release`). They're kept for 7 days (a lifecycle rule in Cloudflare on `golf-platform-backups`, prefixes `production/` and `staging/`).

> **Stated exception to golden rule 2:** the off-site copy is encrypted, so it must be decrypted somewhere to restore it. That's **the devops contact's own computer**, which must have full-disk encryption turned on, and only for the length of the drill. Delete every decrypted file at the end (step 6).

**One-time setup on that computer:** `brew install age libpq`, then add the Postgres tools to the PATH with `echo 'export PATH="$(brew --prefix libpq)/bin:$PATH"' >> ~/.zshrc` and open a new Terminal.

1. **Download the backup.** Cloudflare dashboard → **R2** → `golf-platform-backups` → `production/` → pick the file (e.g. `2026-11-02T0230Z-nightly.dump.age`) → **Download**. Also download its `.sha256` file.
2. **Check it isn't damaged.** In Terminal, in the download folder:
   ```bash
   shasum -a 256 2026-11-02T0230Z-nightly.dump.age
   ```
   The result must match the contents of the `.sha256` file.
3. **Get the unlock key.** Copy the whole "Golf backups: age private key" entry from the password manager into a file:
   ```bash
   pbpaste > golf-key.txt
   ```
4. **Decrypt:**
   ```bash
   age --decrypt -i golf-key.txt -o restore.dump 2026-11-02T0230Z-nightly.dump.age
   ```
5. **Load it into an empty, temporary database inside Neon.** Neon → `golf-production` → **Databases** → **New database** named `restore_check` (owner `neondb_owner`) → **Connect** → choose database `restore_check`, **untick Connection pooling**, copy the string, then run:
   ```bash
   pg_restore --no-owner --no-privileges --dbname "PASTE-CONNECTION-STRING" restore.dump
   ```
   Check the copy (section 4), using database `restore_check`.
6. **Clean up, every time:**
   ```bash
   rm -f golf-key.txt restore.dump *.dump.age *.sha256
   ```
   Also delete the `restore_check` database in Neon (Databases → ⋯ → Delete), and empty the computer's Trash.

## 4. Checking a restored copy
Do all of these against the **copy**, not production:
1. **Record counts:** in the Neon SQL editor on the copy, run:
   ```sql
   SELECT 'tenants' AS t, count(*) FROM tenants
   UNION ALL SELECT 'users', count(*) FROM users
   UNION ALL SELECT 'pages', count(*) FROM pages
   UNION ALL SELECT 'club_settings', count(*) FROM club_settings;
   ```
   Compare with the same query on production (for a drill), or with what you expect (for an incident).
2. **The database rules survived:** these must all **fail** on the copy:
   ```sql
   INSERT INTO users (email, role) VALUES ('rule-check@example.com', 'editor');   -- editor with no club
   INSERT INTO pages (title, slug) VALUES ('rule-check', 'rule-check');            -- page with no club
   ```
3. **The app works against it:** ask Claude to run the tenant-isolation suite against the copy's connection string (it uses its own two test clubs and removes them afterwards). It must pass. *How Claude runs this safely against a copy is set up in step 3.4.*
4. **Real incident only: re-apply account changes made after the restore point.** A restore puts every account back exactly as it was at that moment. Anyone removed since then can sign in again, and passwords or two-factor codes that were reset since then work again. Before reopening the admin:
   - list every editor removed, and every password or two-factor reset, between the restore point and now (from your notes, the "password changed" emails, and Sentry or Vercel logs);
   - remove those accounts again, and send fresh password links (and reset two-factor) for the reset ones;
   - if the restore was because of a suspected break-in, reset every account's password and two-factor, not only those.
5. Write the result in `docs/operations/restore-drills.md`.

## 5. Recording a drill
Add a row to `docs/operations/restore-drills.md`:

| Date | Who | Method | Restore point | Started | Restored | Checked | Counts match | Rules held | Isolation suite | Notes |
|---|---|---|---|---|---|---|---|---|---|---|

## 6. If restore doesn't work
- Try the next method down (point-in-time, then snapshot, then off-site copy).
- Neon support: from the Neon console (paid plan).
- Tell Dan what's lost and the expected recovery time. Clubs are told by Dan, not by the devops contact or Claude.

## 7. Photos, videos and documents (the second copy)
The database holds only each file's record; the files are in Cloudflare R2. Every night at 03:00 UTC (`.github/workflows/media-backup.yml`) a second copy of the live bucket `golf-platform-media-production` is made in `golf-platform-backups`:

- **`media/production/<same path as the live bucket>`**: every file, kept for as long as it exists in the live bucket.
- **`media/removed/<same path>`**: a file that has gone from the live bucket is moved here, and a lifecycle rule deletes it 7 days later. This is where to look first for a file removed by mistake.

If more than 200 files look removed in a night, or the live bucket looks empty, the job stops and opens a GitHub issue ("Media backup failed") rather than set anything aside. Check the live bucket (and which token the job used) before anything else.

**One file removed by mistake.** Needs a Cloudflare R2 token with Object Read & Write on both buckets, made for this job and deleted after (the devops contact's, not stored anywhere):

```bash
aws s3 cp "s3://golf-platform-backups/media/removed/<path>" "s3://golf-platform-media-production/<path>" --endpoint-url "$R2_ENDPOINT"
```

**Everything lost (the live bucket deleted or emptied).** Recreate the bucket with the same name and public settings, then copy the second copy back:

```bash
aws s3 sync "s3://golf-platform-backups/media/production/" "s3://golf-platform-media-production/" --endpoint-url "$R2_ENDPOINT"
```

If R2 refuses the copy between buckets, do it in two steps: `aws s3 sync` the backup into a local folder on the devops contact's encrypted computer, then `aws s3 sync` that folder up to the live bucket, and delete the local folder. Files are not encrypted in the second copy (they are public on the website anyway), but still: delete the local folder at the end.

**Then check:** open a few pages with photos on the live site, and a document link. Photos uploaded since 03:00 UTC are not in the copy; editors can add them again.

**Drill:** restore one file from `media/removed/` and one from `media/production/` into a spare bucket, and record the result in `restore-drills.md` (first time: step 6 of the audit fix plan). Not yet proven against real R2: whether the copy between buckets is accepted.

