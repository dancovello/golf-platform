# Prospect demos

How we show a club its new website before it has signed up: a public link anyone can open, with no account. Built for emailing a homepage (or a whole site) to a club.

## What a demo is

- A club in the platform with **Public demo** switched on (Platform → Clubs → the club).
- Its address is `https://<the company's domain>/demo/<short name>-<random ending>`, for example `/demo/cottrell-park-x7k2m9pq`. The random ending is made when the demo is switched on. Without it, nobody can open the demo, so one club's link never reveals another's.
- It also works on the platform's own address, with the same path.
- A slim strip fixed to the bottom of every page says **"Demo - expires in 12 days"**, then "Demo - expires today" on the last day.
- A demo is just a club, so it can be a one-page homepage or a full site. It uses the same pages, menu, branding and blocks a live club does.

## Rules every demo follows

| Rule | How it is enforced |
|---|---|
| **30 days, then it stops** | `demoExpiresAt` is set 30 days after switch-on. After it, the link shows "This demo has expired" and nothing about the club. Checked on every request, so there is nothing to clean up. To extend one, edit **Demo expires** in the admin. Content is never deleted. |
| **Never indexed** | Every demo page is `noindex` in the page and in the `X-Robots-Tag` header, and demos are in no sitemap (`src/proxy.ts`, `src/site/resolveSite.ts`). |
| **Contact form sends nothing** | The Contact page shows "This is a demo" instead of the form, and the form's save step refuses a demo club as well (`src/site/contact/submit.ts`). Nothing is stored or emailed. |
| **No editor accounts** | A demo club can't have an editor account, and a club with one can't become a demo (`src/access/accountCreation.ts`, `src/collections/Tenants.ts`). |
| **No web address** | A demo club can't have a web address. Switching the demo off comes first (see "Going live"). |
| **Not the canary clubs** | The hidden `canary-` clubs can never be demos. |
| **Not on a club's own domain** | `/demo/…` returns 404 on any club's domain. |
| **Tenant isolation** | One link opens one club. It must match both the club's short name and its random ending. Covered by `tests/int/prospect-demo.int.spec.ts` and `tests/e2e/prospect-demo.spec.ts`, which is part of the tenant-isolation CI job. |

## Making a demo

1. Build the club's content (a homepage, or the full import: `docs/operations/club-import.md`).
2. In the admin, open the club (Platform → Clubs) and tick **Public demo**, then save. The link ending and the expiry date appear.
3. The link is `/demo/<short name>-<ending>`. Open it yourself first and check it on desktop and phone.
4. Email the link. Only people with it can find it.

> Until the staging-to-production "promote" tool exists, a demo can only be made on the environment where the club is built. Don't build a club straight onto production without Dan's approval.

## Going live: checklist

**Do these in order when a club signs up.** The first step matters for search engines.

1. **Switch Public demo OFF** on the club, then save. This clears the link ending and expiry, so the old demo link stops working for good.
2. **Add the club's web address** (`docs/operations/connect-club-domain.md`).
3. **Check the live site is allowed into search engines.** On its own domain, on production, pages are indexable (`indexable` in `src/site/resolveSite.ts`). Demo pages always have `noindex`, and live pages don't, because they are served by a different route. Open the live site and check that `view-source` has no `noindex`, and `/robots.txt` and `/sitemap.xml` are the club's own. A test covers this (`tests/int/prospect-demo.int.spec.ts`: "is indexable on its own web address once it has gone live").
4. Create the club's editor account(s). These can only be made once the demo is off.
5. Tell the club the old demo link has stopped, in case they shared it.

## If something is wrong

- **A demo link says "not found":** the ending or short name is wrong, the demo is off, or the club isn't a demo. Check the club in the admin.
- **A demo link says "expired":** extend **Demo expires** in the admin.
- **Someone shared a link they shouldn't have:** switch Public demo off, then on again. The new ending makes the old link dead.
