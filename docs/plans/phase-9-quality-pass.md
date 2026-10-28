# Phase 9: quality pass and launch gate

Approved by Dan, 28 Oct 2026 (from `docs/plans/marketing-site-plan.md`, phase 9). Branch `feat/marketing-quality-pass`.

## What gets built, in plain English

| Job | What I do | What Dan gets |
|---|---|---|
| Accessibility on every page | One new browser test visits every published marketing page at phone, tablet and desktop width and fails on any problem the automatic checker (axe, WCAG 2.2 AA) can find | A CI check that blocks a bad page |
| Keyboard-only pass | The same test presses Tab through each page: every stop must show a visible focus mark, nothing may trap the keyboard, and links and buttons must all be reachable | A CI check, plus the log below |
| 400% zoom | The test loads each page at 1280 px wide zoomed to 400% (a 320 px screen): no sideways scrolling, nothing cut off, axe still clean | A CI check, plus the log below |
| Tablet screenshots | Screenshots of every page at 768 and 1024 px wide, saved as a CI download (tablet isn't designed, so these are for Dan's eyes, not an automatic pass/fail) | A folder of pictures to review |
| Speed on a mid-range phone | A Lighthouse run with phone settings and a 4x slower processor on the key pages, from my computer. It is a stand-in, not a real phone: I'll say so in the log | Numbers in `docs/operations/performance.md` |
| Claims register | Every row checked against the code or tests. Rows I can prove get a test or a pointer; the rest are listed for Dan to answer | An updated register and a short list of questions |
| Security check | Needs a separate chat by design. I'll update the prompt's "last run" line only after Dan has run it | Dan runs `docs/operations/security-checks.md` |
| Launch gate | Each item in the hand-off's launch gate gets a status and evidence, ready to walk through with Dan | `docs/marketing-site/launch-gate.md` |

## What I will not do

- Claim a manual screen-reader test passed. Automatic checks catch only part of the problems, so the accessibility statement keeps its wording "designed to meet" until Dan has a real screen-reader pass.
- Change page copy, designs or prices. Anything the checks find that needs a design call goes to Dan as a question.
- Touch production, add dependencies, or change the database.

## Order

1. PR 1: the new test, the fixes it forces, and the quality log (`docs/marketing-site/phase-9-quality-log.md`).
2. PR 2 (if needed): claims register updates, launch gate document, speed numbers.

No new dependencies (axe and Playwright are already installed). No migration.
