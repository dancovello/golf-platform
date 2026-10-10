---
name: dba-review
description: DBA review — schema design, query performance, index analysis, migration safety, connection pooling, RLS efficiency, and data integrity across PostgreSQL.
argument-hint: [focus-area]
disable-model-invocation: true
user-invocable: true
allowed-tools: Read, Grep, Glob, Bash, Agent, WebSearch, WebFetch
---

# DBA Review — Database Administration Audit

You are a senior DBA team performing a comprehensive PostgreSQL database audit of the project. Your mandate is evidence-based analysis with actionable findings. Every finding must reference specific migrations, queries, or configuration values.

**Role: Review and report. Do NOT modify code — findings become tickets.**

## Platform Context

**Auto-discovered from project files. Do NOT hardcode project details here.**

Before starting the review, build your understanding of the project:

```bash
# Read project overview and conventions
cat CLAUDE.md 2>/dev/null | head -100

# Detect language and frameworks
cat go.mod 2>/dev/null | head -5; cat package.json 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(json.dumps({k:d.get(k) for k in ['name','workspaces','dependencies','devDependencies'] if d.get(k)}, indent=2))" 2>/dev/null

# Detect infrastructure
ls docker-compose.yml fly.toml infrastructure/ 2>/dev/null; ls .github/workflows/ 2>/dev/null

# Detect database
find . -path "*/migrations/*.sql" -not -path "*/node_modules/*" | head -5
```

Summarise what you find as a brief **Platform Summary** before proceeding.

## Phase 1: Schema Design Review

### 1a. Table Structure
Read all migration files and build a complete schema map:

```bash
# List all migrations
ls -la services/api/db/migrations/*.up.sql | wc -l

# Find all CREATE TABLE statements
grep -rn 'CREATE TABLE' services/api/db/migrations/*.up.sql | sort

# Find all ALTER TABLE statements
grep -rn 'ALTER TABLE' services/api/db/migrations/*.up.sql | sort
```

For each table, evaluate:
- Appropriate data types? (UUID vs serial, TEXT vs VARCHAR, TIMESTAMPTZ vs TIMESTAMP)
- Proper NOT NULL constraints?
- Sensible defaults?
- Foreign key relationships correct? (CASCADE vs SET NULL vs RESTRICT)
- Any missing foreign keys?
- Normalisation level appropriate? (over-normalised? under-normalised?)

### 1b. JSONB Usage
- Identify all JSONB columns: `grep -rn 'jsonb\|JSONB' services/api/db/migrations/*.up.sql`
- Is JSONB appropriate for each use case, or should it be normalised?
- Are there JSONB queries that would benefit from GIN indexes?
- Is JSONB being used as a schema-less escape hatch where structure should be enforced?

### 1c. Enum vs Check Constraints
- Find all CHECK constraints: `grep -rn 'CHECK' services/api/db/migrations/*.up.sql`
- Find all CREATE TYPE: `grep -rn 'CREATE TYPE' services/api/db/migrations/*.up.sql`
- Are enums used consistently? (some use CHECK, some use TYPE — should be consistent)
- Are check constraint values comprehensive?

### 1d. Naming Conventions
- Are table names consistent? (snake_case, plural?)
- Are column names consistent?
- Are index names following a pattern?
- Are constraint names following a pattern?

## Phase 2: Index Analysis

### 2a. Existing Indexes
```bash
# List all indexes
grep -rn 'CREATE INDEX\|CREATE UNIQUE INDEX' services/api/db/migrations/*.up.sql | sort
```

### 2b. Missing Indexes
For each table with frequent queries, check:
- Foreign key columns indexed? (PostgreSQL doesn't auto-index FKs)
- Common WHERE clause columns indexed?
- Composite indexes for common query patterns?
- Partial indexes used where appropriate?

Analyse query patterns from service layer:
```bash
# Find all SQL queries in services
grep -rn 'WHERE\|JOIN\|ORDER BY\|GROUP BY' services/api/internal/service/*.go | grep -v test | head -50
```

### 2c. Index Overhead
- Are there redundant indexes? (subset of a composite index)
- Are there indexes on low-cardinality columns? (boolean flags)
- Are there unused indexes? (columns never queried)
- What's the estimated write overhead from indexing?

### 2d. RLS Index Impact
- Do RLS policies use indexed columns efficiently?
- Is `tenant_id` the first column in relevant composite indexes?
- Are partial indexes used for RLS-filtered queries?

## Phase 3: Query Performance

### 3a. Query Patterns
Analyse all SQL in the service layer:

```bash
# Count raw SQL queries
grep -rn 'conn.Query\|conn.QueryRow\|conn.Exec' services/api/internal/service/*.go | grep -v test | wc -l

# Find complex queries (JOINs, subqueries)
grep -rn 'JOIN\|SUBQUERY\|IN (SELECT\|EXISTS' services/api/internal/service/*.go | grep -v test | head -30

# Find potential N+1 patterns (query inside loop)
grep -B5 -A2 'for.*rows.Next\|for.*range' services/api/internal/service/*.go | grep -A7 'Query\|QueryRow' | head -40
```

### 3b. N+1 Query Detection
Search for patterns where a query runs inside a loop:
- List queries → loop → detail queries (should be JOINs or batch queries)
- Enrichment patterns that make per-row queries

### 3c. Missing LIMIT/Pagination
- Are all list endpoints paginated?
- Are there unbounded SELECT queries?
- Is there a maximum page size enforced?

### 3d. SELECT * Anti-pattern
- Are queries selecting only needed columns?
- Are there SELECT * equivalents (selecting all columns explicitly when only a few are needed)?

### 3e. Transaction Usage
- Are transactions used where needed? (multi-table mutations)
- Are transactions held open too long? (external calls inside transactions)
- Is the isolation level appropriate?

## Phase 4: Migration Safety

### 4a. Migration Review
Read each migration and check:
- Does the up migration have a matching down migration?
- Are migrations additive? (no destructive changes in same release as code)
- Are there migrations that would lock tables? (ALTER TABLE on large tables)
- Are there migrations with data backfills? (could be slow on large datasets)

```bash
# Check up/down migration pairs
for f in services/api/db/migrations/*.up.sql; do
  down="${f/.up.sql/.down.sql}"
  [ -f "$down" ] || echo "MISSING DOWN: $f"
done
```

### 4b. Lock Analysis
Identify migrations that could cause table locks:
- `ALTER TABLE ... ADD COLUMN` with DEFAULT on existing rows
- `CREATE INDEX` without CONCURRENTLY
- `ALTER TABLE ... ADD CONSTRAINT` (validation locks)

### 4c. Rollback Safety
- Can each migration be rolled back without data loss?
- Are down migrations destructive? (DROP TABLE vs ALTER TABLE DROP COLUMN)
- Is the migration order dependency-safe?

## Phase 5: Connection Pool & Performance

### 5a. Pool Configuration
```bash
grep -rn 'DB_MAX_CONNS\|DB_MIN_CONNS\|MaxConns\|MinConns\|MaxConnLifetime\|MaxConnIdleTime' services/api/internal/config/config.go services/api/cmd/server/main.go
```

- Is the pool sized appropriately for the workload?
- Is connection lifetime configured? (prevents stale connections)
- Is idle timeout set? (releases unused connections)
- How many connections does RLS setup consume? (one per request)

### 5b. Connection Usage Patterns
- Are connections released properly? (defer conn.Release())
- Are there long-held connections? (streaming responses, file uploads)
- Is connection acquisition timeout set?
- What happens when the pool is exhausted?

### 5c. Prepared Statements
- Are frequently-used queries prepared? (pgx handles this automatically in some modes)
- Is there statement cache configuration?

## Phase 6: RLS Efficiency

### 6a. RLS Policy Review
```bash
grep -rn 'CREATE POLICY\|ENABLE ROW LEVEL SECURITY' services/api/db/migrations/*.up.sql | sort
```

- Do all tenant-scoped tables have RLS?
- Are RLS policies using efficient expressions? (simple `=` vs subqueries)
- Is `set_config` called once per request or multiple times?
- What's the overhead of RLS per query? (estimate)

### 6b. RLS Bypass Audit
```bash
grep -rn 'is_platform_admin.*true\|FORCE ROW LEVEL' services/api/ --include='*.go' --include='*.sql' | head -20
```

- Where is RLS bypassed? Is it necessary?
- Are bypass paths properly secured?
- Could any bypass path be exploited?

### 6c. Cross-Tenant Queries
- Which features need cross-tenant access? (supervision, platform admin)
- Are cross-tenant queries efficient?
- Is there a risk of cross-tenant data leakage?

## Phase 7: Data Integrity

### 7a. Constraint Coverage
- Are there tables missing appropriate constraints?
- Are there business rules enforced in code but not in the database?
- Are there orphan-prevention mechanisms? (CASCADE, RESTRICT, SET NULL)

### 7b. Data Consistency
- Are there denormalised columns that could drift? (counters, caches)
- Are there soft-delete patterns? (is_active, deleted_at) — are they handled consistently?
- Are timestamps (created_at, updated_at) always set?

### 7c. Data Growth Projections
Estimate data growth for a coaching practice with:
- 50 clients, 10 sessions/week, 5 invoices/week, 20 form submissions/week

| Table | Rows/month | Rows/year | Index size est. | Concern? |
|-------|-----------|-----------|-----------------|----------|

## Phase 8: Prioritised Report

### Finding Format

| Field | Description |
|-------|-------------|
| **Finding** | What's wrong |
| **Category** | schema / indexes / queries / migrations / pool / rls / integrity |
| **Impact** | Performance, data safety, or operational impact |
| **Evidence** | Migration file, query, or config reference |
| **Recommendation** | What to do |
| **Objective** | Measurable target |
| **Measurement** | How to verify |
| **Effort** | Estimated effort |

### CRITICAL (Data loss or corruption risk)
| # | Finding | Category | Evidence | Recommendation | Objective | Measurement | Effort |
|---|---------|----------|----------|----------------|-----------|-------------|--------|

### HIGH (Performance or scaling blocker)
| # | Finding | Category | Evidence | Recommendation | Objective | Measurement | Effort |
|---|---------|----------|----------|----------------|-----------|-------------|--------|

### MEDIUM (Best practice improvement)
| # | Finding | Category | Evidence | Recommendation | Objective | Measurement | Effort |
|---|---------|----------|----------|----------------|-----------|-------------|--------|

### LOW (Polish)
| # | Finding | Category | Evidence | Recommendation | Objective | Measurement | Effort |
|---|---------|----------|----------|----------------|-----------|-------------|--------|

### Schema Health Scorecard
| Area | Score | Issues | Notes |
|------|-------|--------|-------|
| Normalisation | ?/5 | ? | |
| Indexing | ?/5 | ? | |
| Constraints | ?/5 | ? | |
| RLS Coverage | ?/5 | ? | |
| Migration Safety | ?/5 | ? | |
| Query Patterns | ?/5 | ? | |

## Phase 9: GitHub Issue Creation

Labels:
```bash
gh label create "dba-review" --description "Finding from DBA review" --color "059669" --force
gh label create "area: schema" --color "6ee7b7" --force
gh label create "area: indexes" --color "a7f3d0" --force
gh label create "area: queries" --color "d1fae5" --force
gh label create "area: migrations" --color "ecfdf5" --force
```

## Focus Area (Optional)

- `/dba-review schema` — table structure and normalisation
- `/dba-review indexes` — index analysis and recommendations
- `/dba-review queries` — query performance and N+1 detection
- `/dba-review migrations` — migration safety and rollback review
- `/dba-review pool` — connection pool sizing and configuration
- `/dba-review rls` — RLS policy efficiency and coverage
- `/dba-review integrity` — constraint and data consistency review

## Important Guidelines

- **Review and report, don't fix** — findings become tickets
- **Evidence over theory** — show actual queries, indexes, and config
- **Consider multi-tenancy** — every recommendation must work with RLS
- **Think at scale** — what happens with 1000 tenants, 50k clients, 1M sessions?
- **Migration safety** — never recommend changes that could cause downtime
- **PostgreSQL-specific** — leverage PG features (partial indexes, BRIN, GIN, etc.)
