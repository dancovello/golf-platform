# Security audit: uploads and media

- **Date:** 22 October 2026
- **Commit reviewed:** `b45c7cf` (top of the stacked PRs #145–#155, branch `docs/pentest-scope-review-list`)
- **Reviewer:** Claude Code, acting as an application security reviewer new to this codebase
- **Job 8 of the security programme.** Read and report only: nothing in the app was changed.

## Summary

**Nothing urgent. No club can see, replace or delete another club's files.** I tried every way I could find for one club to reach another club's files: crafted upload links, pointing a record at another club's folder, replacing or deleting files, and the code that turns photos into web addresses. Each one is blocked, mostly in two places (our own code and the upload library's).

Two small findings, both **low**:

| # | Finding | Severity | Where |
|---|---|---|---|
| 1 | Published photos keep hidden details from the phone or camera: where the photo was taken, when, the device, and sometimes the owner's name | Low (privacy) | `src/collections/Media.ts:42-77` (no processing of the original); used at `src/site/blocks/media.ts:95`, `src/site/blocks/Hero.tsx:33` |
| 2 | No limit on upload links: one editor account can push any number of 50 MB files into the public bucket | Low | `src/security/rateLimitInventory.ts:132`, `src/media/uploadGuards.ts:22-63` |

Each finding has a test that proves it in `tests/int/audit-uploads.int.spec.ts`. The tests are marked `it.fails`, so they pass while the problem exists and don't block merging. When a fix lands, change `it.fails` to `it` in the same pull request.

## What I read

- `src/media/folders.ts`, `measure.ts`, `storage.ts`, `uploadGuards.ts`
- `src/collections/Media.ts`, `src/collections/Documents.ts`, `src/marketing/collections/MarketingMedia.ts`
- `src/payload.config.ts` (the s3Storage and guard set-up)
- `src/site/blocks/media.ts`, plus the other two places that build file addresses: `src/site/loadClub.ts:526-552` and `src/site/blocks/resolve.ts:280-305`
- `src/privacy/cleanUp.ts` (the nightly removal of unused uploads)
- `src/access/roles.ts`, `src/marketing/access.ts`, `src/tenancy.ts`
- The upload library code itself, version 3.90.2: `@payloadcms/storage-s3` (`generateSignedURL.js`), `@payloadcms/plugin-cloud-storage` (key building, the before/after change and delete hooks, `getFilePrefix`), and Payload core (`clientUploadReceipt.js`, `sanitizeUploadData.js`, `addDataAndFileToRequest.js`, `getFileFromClientUpload.js`, the create and update operations)
- Tests: `tests/int/media.int.spec.ts`, `tests/e2e/media-upload.spec.ts`
- Checklist: `docs/operations/security-checks.md` item 5 (uploads), and the club-separation questions in item 1. The project's `infosec-review` skill is written for a different stack (Go, RLS), so I used its method (evidence, file and line) but not its file list.

## Findings

### 1. Published photos keep hidden details from the phone (low, privacy)

**What's wrong.** Phones and cameras hide extra details inside each photo: the GPS position where it was taken, the date and time, the make and model, and sometimes the owner's name. The site makes smaller copies of each photo, and those copies are clean. But the **original file is published exactly as uploaded**, and its public address is used on the site: as the main picture in the hero, gallery, cards and logo strip (`src/site/blocks/Hero.tsx:33`, `Gallery.tsx:14`, `parts.tsx:22`, `CtaCardGrid.tsx:55`). For a browser upload, the file goes straight from the editor's browser to storage, so nothing on our side ever touches it.

**How someone would use it.** Anyone can save a photo from a club's site and read its details with a free tool. A staff headshot taken at home, or a photo of a junior member, can reveal a home address and the name on the phone. No attack skill is needed. This is personal data published by accident. `docs/architecture/decisions.md` says the bucket holds "public website images, not personal data", and this finding breaks that promise.

**Proof.** `tests/int/audit-uploads.int.spec.ts` → "the published original has no location or owner details". It uploads a JPEG carrying a GPS position and an owner name, then reads the public original back. The owner name and GPS block are still there. A companion check confirms the 640px copy is clean.

**Also affected (not tested):** videos (phones record the location in MP4 files) and documents (Word and PDF files carry the author's name and sometimes the organisation's name).

**Proposed fix (needs Dan's approval, then its own draft PR):** make Payload re-save every original photo, which drops the hidden details. Payload already does this when a collection sets a processing option on the original. Setting `resizeOptions: { width: 6000, withoutEnlargement: true }` on Media and Marketing Media would make Payload re-save every original as the same format. It would also turn photos the right way up, and Payload then replaces the browser-uploaded original with the cleaned copy. Photos already uploaded would need a one-off clean-up script. Videos and documents need a separate, smaller decision (for example, a note in the admin asking editors to remove location from videos). That fix PR must then turn the `it.fails` test into a normal `it`.

### 2. No limit on upload links (low)

**What's wrong.** Any signed-in editor can ask for an upload link (`POST /api/storage-s3-generate-signed-url`) as often as they like. Each link lets them put one file of up to 50 MB into the public bucket. A file that never becomes a photo record stays public until the nightly clean-up removes it a day later, and that clean-up runs **on production only** (`src/privacy/cleanUp.ts:150`). On staging these files are never removed. The rate-limit list records this endpoint as "Needs a signed-in account; no separate limit" (`src/security/rateLimitInventory.ts:132`).

**How someone would use it.** Someone with an editor account, or a stolen editor password, could fill the bucket with thousands of large files to run up storage costs, or use it as free hosting for files on the media domain. The files can only be served as image, video, PDF or Word types, and their addresses are random. The risk is cost and nuisance, not access to other clubs.

**Proof.** `tests/int/audit-uploads.int.spec.ts` → "an editor cannot get 150 upload links in a row". It calls the real endpoint (with our guard around it) 150 times as club A's editor, and all 150 links were issued.

**Proposed fix (needs approval, its own draft PR):** add the endpoint to the existing shared-database rate limit (`src/security/rateLimit.ts`). For example, 100 links per editor per hour, which is well above a large bulk upload, and refuse with "Too many uploads, try again later". Update the rate-limit list entry to match.

## Checked and fine

These are the club-separation questions first, then the other upload checks on the checklist.

| Question | Why it's fine (evidence) |
|---|---|
| Can a signed upload link write over another club's file? | No, for three separate reasons. (1) Our guard chooses a new random folder for every link, whatever the browser asks for (`src/media/uploadGuards.ts:53-57`). (2) The library adds a second random folder and cleans every part of the address, dropping `..` (`plugin-cloud-storage/dist/utilities/resolveSignedURLKey.js`, `sanitizePrefix.js`). (3) The link only creates a new file and can never replace one (`IfNoneMatch: '*'` in `storage-s3/dist/generateSignedURL.js`). Covered by `tests/e2e/media-upload.spec.ts` "a crafted upload request cannot reach club B's file". |
| Can an editor take a link or receipt issued for someone else, or invent one? | No. After the upload, Payload only accepts the file with a signed receipt that names the user, the collection, the file name and the folder, and that expires in 6 hours (`payload/dist/uploads/clientUploadReceipt.js`). The S3 adapter requires one (`storage-s3/dist/adapter.js:9`), and the collection is taken from the address, never from the request (`addDataAndFileToRequest.js:60-90`). |
| Can an editor point their photo record at club B's file? | No. The folder is locked after creation (`src/media/folders.ts:33`), unique in the database (`:31`) and must match the random-folder format (`:35-36`). The file name, address, sizes and Payload's own folder key are all thrown away when sent by an editor (`payload/dist/uploads/sanitizeUploadData.js:61-85`). Covered by `tests/int/media.int.spec.ts` "an editor cannot point a file at club B's folder". |
| Could deleting or replacing my own file delete club B's? | No. Deletion uses only the record's own stored folder and names (`plugin-cloud-storage/dist/hooks/afterDelete.js`), and editors can't change those (above). Covered by "deleting club A's file removes only club A's file". |
| Can an editor get upload links for the company website's photos? | No. Before issuing a link, Payload checks the user may create or update that collection (`payload/dist/uploads/assertClientUploadAccess.js`), and Marketing Media is super-admin only (`src/marketing/access.ts:9-14`). |
| Can a club's page show another club's photo or document? | No. All three places that turn IDs into addresses filter by the club: `src/site/blocks/media.ts:73`, `src/site/loadClub.ts:531`, `src/site/blocks/resolve.ts:284`. |
| Does a file name reveal that another club exists? | No. Every stored name starts with a random code (`src/media/uploadGuards.ts:6-7, 55, 67-76`) and names only need to be unique within their own folder (`filenameCompoundIndex`). Covered by "the same file name in two clubs never clashes". |
| Could the nightly clean-up delete a live file? | No. It only removes files in the platform's random-folder format whose folder no photo or document record points at, once they're a day old, with a 200-file brake (`src/privacy/cleanUp.ts:97-142`). Browser uploads sit one folder deeper (the library's key), but the clean-up compares only the first two parts, which match the record. |
| File types | Upload links are only issued for each collection's allowed types (`src/media/uploadGuards.ts:33-49`), which have no SVG and no HTML. Payload then downloads the whole file and checks its real contents. Because each collection has an allowed list, the content requirement is `'full'` (`payload/dist/uploads/getFileContentRequirement.js`). Covered by "checks what a file really is" and "refuses SVG files". |
| File size | 50 MB, checked before the link is issued, and the size is part of the signed link so storage enforces it too (`generateSignedURL.js`). |
| Unguessable addresses, bucket can't be listed | Random UUID folder per file (`src/media/folders.ts:17`). Listing is refused (`tests/int/media.int.spec.ts` "the storage itself cannot be listed"). |
| Photo measuring (`src/media/measure.ts`) | It only ever fetches addresses Payload built from the media domain, so an editor can't supply one. It stores only two colour codes, on a record the club filter already found (`:116-131`). The values are checked as colours before use (`src/site/loadClub.ts:548`). |
| Storage keys and secrets | Read from environment variables only, never logged or sent to the browser (`src/media/storage.ts`). Tests refuse to run against anything but the local stand-in (`tests/shared/media.ts:8-10`). |

## Already known, not raised again

- **A file that fails Payload's content check stays in the bucket until the clean-up runs** (decisions.md, line 86). Finding 2 widens this slightly: on staging the clean-up never runs, so such files stay forever.
- **No `X-Content-Type-Options: nosniff` header and no "download, don't open" header on the media domain** until step 4 moves to a custom domain (decisions.md, lines 82 and 86). PDFs open in the browser from the media domain. That domain has no cookies, so this is acceptable for now. Step 4 should add both headers.

## Not checked

- **R2 itself.** All tests ran against the local SeaweedFS stand-in. I didn't check that R2 honours "only create, never replace" (`If-None-Match`) the same way. It doesn't change the result here, because every link already points at a brand-new random address.
- **Replacing the file on an existing photo through the browser.** From reading the code I suspect this could leave the record pointing at the old folder while the new file sits in a new one, and the clean-up would then remove the new file. That would be a broken photo, not a security problem. I didn't test it, because it needs the full browser flow. Worth a quick check in the admin.
- **Cloudflare caching after deletion.** Once step 4 puts the media domain behind Cloudflare, a deleted file may stay cached for a while. Not testable until then.

## Checks run for this report

- `tests/int/audit-uploads.int.spec.ts`: 3 passed, 2 expected failures (the two findings). I also ran it once with `it.fails` switched off and read the two failures: the original still had the owner name and GPS block, and 150 of 150 links were issued.
- `corepack pnpm typecheck` ✅, ESLint and Prettier on the new test file ✅, `tests/unit` ✅ (167 passed).
- I didn't run the full `corepack pnpm test` suite. Three other audit sessions share the same local test database right now, and one of my runs failed while seeding because of that clash. The single file passed on the next run.
