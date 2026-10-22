# Spike: Postgres row-level security for club data (job 9, 22 Oct 2026)

**Question:** could the database itself refuse cross-club reads and writes (row-level security, RLS), as a second line behind Payload's access rules, with Payload and Neon's connection pooling?

## Answer: no, not now. Revisit if Payload adds a hook that runs on each request's database connection.

**Why not:**
1. **RLS needs to know the club for every query.** That means a setting on the database connection (`SET LOCAL app.club_id = …`) before each query, inside a transaction. Payload's Postgres adapter runs most reads straight on the pool, outside any transaction, and has no hook to run a statement first. Doing it means patching the adapter, and re-checking that patch on every Payload upgrade.
2. **Neon's pooled connections (PgBouncer, transaction mode)** share one database session between many requests. A plain `SET` would leak one request's club to the next. Only `SET LOCAL` inside a transaction is safe, which brings us back to point 1.
3. **Most club data isn't in tables that know their club.** Payload stores blocks, arrays and page history in child tables (`pages_blocks_hero`, `_pages_v_…`) keyed by their parent's ID, with no club column. Policies there would need a join to the parent for every row, which is slow and easy to miss when a new block adds a table. Every new block would need a new policy and a test for it.
4. **Several legitimate paths cross clubs on purpose:**
   - the super-admin;
   - the nightly clean-up;
   - finding a club from its web address;
   - search building.

   Each would need a "bypass" setting, which is the same kind of exception `overrideAccess` already is, now in two places.

**What we have instead:**
- default-deny access rules on every collection, checked on the running config (job 2);
- an allowlist of every place that skips them;
- the isolation manifest;
- randomised isolation tests: 500 steps per change, 10,000 nightly;
- the live canary on production;
- a database account that can't change the schema.

**When to look again:**
- if Payload adds per-request connection hooks or built-in tenant scoping at the database layer;
- or if the platform moves to one database (or schema) per club, which would give the same guarantee more simply.
