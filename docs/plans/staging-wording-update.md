# Plan: update the saved marketing pages on staging to the new wording

Approved by Dan (option B), 28 Oct 2026. Follows PRs #206 (wording Part A) and #210 (Part B). **The script is built (`pnpm update-marketing-wording`) and rehearsed on a throwaway local database; it has not been run on staging.**

## How to run it (Dan)

1. Merge #206, then #210, then the script PR, and let staging release.
2. In the project folder, run `pnpm update-marketing-wording`.
3. Paste the **staging** database connection string when asked (hidden; use the website's limited `golf_app` account, not the owner account), then type the word it asks for.
4. Read the list. **Press Enter at the last question to stop (dry run, nothing written)**, or type `update` to make the changes.
5. Send me the output if anything looks odd. Anything listed as "CHECK BY HAND" is edited in the admin.

**Rehearsal result (local copy of the old pages):** 23 changes on 4 pages written; a hand-reworded line was left alone and listed; a published page with an unpublished edit (Trust) and the 3 draft legal pages were skipped; each updated page kept its old version and stayed published; the Week 1 to 4 block was removed from Switching; a second run changed nothing.

## The problem

Marketing pages live in the database. The starter copy in the code only fills in a page when it is first added, and leaves existing pages alone. So after #206 and #210 reach staging, the code is right but the pages already saved there still say "Get your free homepage", "No setup fee", "Four weeks" and show the Week 1 to 4 cards. Launch gate item 11 stays open until they are fixed.

I can't see staging's content. I'm assuming it holds the pages as first added, with whatever you have edited since.

## Options

| | What | Good | Bad |
|---|---|---|---|
| **A. By hand in the admin** | You edit about 9 pages, roughly 25 pieces of text, and delete the Week cards block | No new code | Slow, easy to miss one, and nothing checks it afterwards |
| **B. A one-off script (recommended)** | `pnpm update-marketing-wording`, built the same way as the existing `update-builder-page` script | Safe by design (below), checks itself, repeatable for production later | One small PR to review |

## How the script (option B) keeps your edits safe

1. **Asks which database** (hidden), shows its name, and makes you type it. Same guard as the existing scripts. Production needs your explicit approval and I will not point it there.
2. **Dry run first, and it writes nothing.** It lists every change it would make: page, block, old text, new text.
3. **Exact matches only.** It replaces a piece of text only if it is *exactly* the old starter text. Anything you have reworded is left alone and listed as "edited by hand, check this one".
4. **Skips pages with unpublished changes.** If a page has a newer draft than its published version, the script leaves that page alone and tells you, so it can't overwrite work in progress.
5. **Removes the Week 1 to 4 cards block from the Switching page** only if it is there, and tells you.
6. **Asks you to type "update"** before it writes anything. Each page is saved as a new version, so the old version stays in the page's history (the last 50 are kept) and **Restore** in the admin undoes it.
7. **Checks itself.** After writing, it re-reads every marketing page and prints any banned phrase still left, so a missed one shows up as a list, not a surprise.
8. **Safe to run twice.** The second run finds nothing to change.

It uses the website's limited database account (read and write data only), never the owner account, and the connection string is typed into a hidden prompt, so it never appears in the repo or in this chat.

## Steps and who does them

| # | Step | Who |
|---|---|---|
| 1 | Review and merge #206, then #210. Merging to `main` releases to staging, which also applies the two small migrations | You |
| 2 | I write the script and its unit test (old text becomes new, edited text is untouched, drafts are skipped, running twice changes nothing) as a small PR. The checks you know: typecheck, lint, tests | Me |
| 3 | Merge the script PR | You |
| 4 | Run the **dry run** against staging and read the list. Paste it to me if anything looks odd | You (the staging connection string is a secret, so you run it) |
| 5 | Run it for real: type "update". Fix anything it lists as "edited by hand" in the admin | You, with me on any wording |
| 6 | Look at the six pages on staging; I can re-run the accessibility and wording checks against staging pages' text if you give me nothing secret, otherwise you eyeball them | You |

Steps 4 and 5 can be one sitting of about ten minutes.

## Not in this plan

- **Production.** The marketing pages may not exist there yet. When the production release is approved, the same script gets a read-only dry run first, and only with your explicit go-ahead.
- Any wording beyond what #206 and #210 already approved.

## What could go wrong, and what covers it

| Risk | Cover |
|---|---|
| A page you edited gets overwritten | Exact-match rule, drafts skipped, version history, Restore |
| The script is pointed at the wrong database | Hidden prompt plus typing the database name; production needs your approval; dry run writes nothing |
| A phrase is missed | The self-check lists leftovers; the unit test covers every old line from the starter copy |
| Staging is behind the code (migration not applied) | Step 1 comes first; the script stops if the page fields aren't there |

## What I need from you

1. Option B, or would you rather edit by hand (option A)?
2. Is it fine for the script PR to wait until #206 and #210 are merged, so it builds on `main`? (If you would rather I start now, I'll branch from #210.)
