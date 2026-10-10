---
name: architecture-review
description: Architecture & design review — evaluates system design, API contracts, data modelling, separation of concerns, dependency management, and technical debt across the entire platform.
argument-hint: [focus-area]
disable-model-invocation: true
user-invocable: true
allowed-tools: Read, Grep, Glob, Bash, Agent, WebSearch, WebFetch
---

# Architecture & Design Review — System Design Audit

You are a senior software architecture team performing a comprehensive design review of the project. Your mandate is evidence-based analysis with actionable findings. Every finding must reference specific files, line numbers, and concrete evidence.

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

## Phase 1: Layered Architecture Assessment

### 1a. API Layer Separation
- Read `services/api/internal/handler/` — do handlers contain business logic? (they should only parse requests and write responses)
- Read `services/api/internal/service/` — do services contain HTTP concerns? (they should only contain business logic)
- Read `services/api/internal/repository/` — is DB access properly encapsulated?
- Check `services/api/internal/handler/interfaces.go` — are service interfaces well-defined?
- Look for layer violations: handlers calling repository directly, services writing HTTP responses, domain types leaking HTTP details
- Verify dependency direction: handler → service → repository (never the reverse)

### 1b. Domain Model Quality
- Read `services/api/internal/domain/` — are domain entities well-defined?
- Check for anaemic domain models (entities with no behaviour, all logic in services)
- Check for god objects (entities with too many fields or responsibilities)
- Are domain errors (`*APIError`, `ErrXxx` sentinels) consistent and well-typed?
- Is pagination (`Pagination`, `PaginatedResponse[T]`) used consistently?
- Are value objects used where appropriate (money, email, tenant ID)?

### 1c. Middleware Architecture
- Read `services/api/internal/middleware/` — catalogue all middleware
- Is middleware composable and single-responsibility?
- Are cross-cutting concerns (auth, logging, metrics, recovery) properly layered?
- Check middleware ordering in router setup (`cmd/server/main.go`) — is it correct?
- Are there middleware that should be split or combined?

## Phase 2: API Design Review

### 2a. REST API Conventions
- Read `services/api/internal/handler/routes.go` or router setup for all routes
- Check for consistent URL patterns (plurals, nesting depth, resource naming)
- Check HTTP method usage (GET for reads, POST for creates, PUT/PATCH for updates, DELETE)
- Check response envelope consistency (do all endpoints use the same response structure?)
- Check error response format consistency across all handlers
- Verify OpenAPI spec (`services/api/docs/`) matches actual implementation

### 2b. API Versioning
- Is there API versioning? (path-based `/v1/`, header-based, query param?)
- Are breaking changes tracked or guarded?
- Is there a deprecation strategy?
- Are frontend clients pinned to specific API versions?

### 2c. API Contract Safety
- Check request validation: are all inputs validated? (required fields, types, ranges)
- Check response serialisation: are nullable fields handled consistently?
- Check pagination: is there a maximum page size to prevent abuse?
- Check file upload limits: size, type validation
- Are API types shared via the generated `@neurocoach/shared` package?

### 2d. Endpoint Complexity
- Identify endpoints that do too much (multiple mutations, complex orchestration)
- Check for endpoints that should be split into separate resources
- Look for CRUD endpoints missing standard operations (e.g., list without pagination, create without validation)

## Phase 3: Data Model & Schema Review

### 3a. Database Schema Analysis
- Read migration files in `services/api/db/migrations/` — catalogue all tables
- Check for proper normalisation (no repeated data, proper foreign keys)
- Check for denormalisation that's intentional vs accidental
- Verify all foreign keys have appropriate ON DELETE behaviour (CASCADE, SET NULL, RESTRICT)
- Check for missing indexes on columns used in WHERE/JOIN/ORDER BY clauses
- Verify composite indexes match query patterns in `db/queries/*.sql`

### 3b. Multi-Tenancy Schema
- Verify all tenant-scoped tables have `tenant_id` column
- Check RLS policies are defined for all tenant-scoped tables
- Look for tables that should be tenant-scoped but aren't
- Check for cross-tenant query patterns and whether they're properly authorised
- Review the `supervision_relationships` table (no RLS by design) — is the service-layer access control adequate?

### 3c. sqlc Query Patterns
- Read `services/api/db/queries/*.sql` — check for query quality
- Look for SELECT * (should select specific columns)
- Check for N+1 patterns (queries that should be JOINs or batch operations)
- Check for missing LIMIT on list queries
- Verify query naming conventions are consistent
- Check that mutations use RETURNING clauses where appropriate

### 3d. Migration Safety
- Check for irreversible migrations (data loss in down migration)
- Check for migrations that lock tables for extended periods (large ALTER TABLE)
- Verify each migration has a corresponding down migration
- Check for data migrations mixed with schema migrations

## Phase 4: Dependency & Module Architecture

### 4a. Go Module Structure
- Read `services/api/go.mod` — check for outdated or unnecessary dependencies
- Check for dependency conflicts or version pinning issues
- Are dependencies well-chosen? (standard library vs third-party trade-offs)
- Check for vendored vs module dependencies

### 4b. Package Coupling
- Map import relationships between internal packages
- Check for circular dependencies or tight coupling
- Are packages cohesive? (does each package have a single, clear responsibility?)
- Check for utility packages that have become dumping grounds
- Is the `internal/` directory structure logical and navigable?

### 4c. Frontend Architecture
- Check Next.js app structure: are route groups used effectively?
- Check component organisation: page components vs shared components vs UI primitives
- Check for prop drilling vs proper state management
- Review Zustand store design in mobile app — are stores properly scoped?
- Check `@neurocoach/shared` package — is the boundary between shared and app-specific code clear?

### 4d. Monorepo Health
- Check Turborepo configuration (`turbo.json`) for proper task dependencies
- Check for workspace dependency leaks (app importing from another app's internals)
- Is the shared package the only cross-app dependency?
- Check build times and whether they're optimised

## Phase 5: Design Pattern Assessment

### 5a. Patterns in Use
Identify and evaluate design patterns used across the codebase:
- **Repository pattern** (sqlc-generated) — is it used consistently?
- **Service layer** — is business logic properly encapsulated?
- **Middleware chain** — is it composable and testable?
- **Gateway abstraction** (payment providers) — is the abstraction appropriate?
- **Circuit breaker** (JWKS) — should it be applied elsewhere?
- **Worker pattern** (notifications, reminders) — is it robust?

### 5b. Missing Patterns
Identify where patterns would improve the codebase:
- Event sourcing or domain events for audit trails?
- CQRS for read-heavy endpoints?
- Saga pattern for multi-step operations?
- Strategy pattern for variant business logic?
- Builder pattern for complex object construction?
- Only recommend patterns that solve concrete problems found in the code.

### 5c. Anti-Patterns
Search for common anti-patterns:
- **God handlers** — handlers with >200 lines
- **Service bloat** — services with >15 methods
- **Shotgun surgery** — changes that require touching many files
- **Feature envy** — code that uses more of another package's data than its own
- **Primitive obsession** — using strings/ints where domain types would be safer

## Phase 6: Technical Debt Inventory

### 6a. Code Smells
- Search for TODO, FIXME, HACK, WORKAROUND comments
- Check for dead code (unused functions, unreachable branches)
- Check for duplicated code (similar functions across handlers/services)
- Check for overly complex functions (cyclomatic complexity)
- Look for inconsistent error handling patterns

### 6b. Dependency Debt
- Check for deprecated dependencies (`npm outdated`, `go list -u -m all`)
- Check for security vulnerabilities in dependencies
- Check for dependencies that could be replaced with standard library

### 6c. Schema Debt
- Check for unused columns or tables
- Check for columns that should have constraints but don't
- Check for inconsistent naming conventions (snake_case everywhere?)
- Check for missing audit columns (created_at, updated_at on all tables?)

## Phase 7: Scalability Architecture

### 7a. Horizontal Scaling Readiness
- Is the API stateless? (can it run on multiple Fly.io instances?)
- Check for in-memory state that would break with multiple instances
- Check for file system dependencies that assume single instance
- Is session state managed externally (JWT — good) or in-process (bad)?

### 7b. Data Access Patterns
- Are hot paths optimised? (caching, connection pooling, query efficiency)
- Check for read-after-write consistency requirements
- Check for eventual consistency opportunities
- Is there a caching strategy? (should there be?)

### 7c. Event-Driven Readiness
- Is the system prepared for async processing? (webhooks, notifications)
- Are there operations that should be async but are synchronous?
- Is there a message queue need? (or is the current worker pattern sufficient?)

## Phase 8: Prioritised Report with Measurable Objectives

Compile ALL findings into a single prioritised report. **Every recommendation MUST include a measurable objective** — a concrete target that the retrospective system can verify programmatically in future runs.

### Finding Format

For each finding, specify:

| Field | Description |
|-------|-------------|
| **Finding** | What's wrong |
| **Category** | layering / api-design / data-model / dependencies / patterns / tech-debt / scalability |
| **Evidence** | Current measurement or proof |
| **Recommendation** | What to do |
| **Objective** | Measurable target |
| **Baseline** | Current measured value |
| **Measurement** | Exact command, query, or check to verify the objective is met |
| **Effort** | Estimated effort |

### CRITICAL (Architectural risk — hard to fix later)
| # | Finding | Category | Evidence | Recommendation | Objective | Baseline | Measurement | Effort |
|---|---------|----------|----------|----------------|-----------|----------|-------------|--------|

### HIGH (Design debt — significant quality/maintainability impact)
| # | Finding | Category | Evidence | Recommendation | Objective | Baseline | Measurement | Effort |
|---|---------|----------|----------|----------------|-----------|----------|-------------|--------|

### MEDIUM (Improves design quality)
| # | Finding | Category | Evidence | Recommendation | Objective | Baseline | Measurement | Effort |
|---|---------|----------|----------|----------------|-----------|----------|-------------|--------|

### LOW (Best practice / polish)
| # | Finding | Category | Evidence | Recommendation | Objective | Baseline | Measurement | Effort |
|---|---------|----------|----------|----------------|-----------|----------|-------------|--------|

### Objective Types (use these categories)

**Structural objectives** — measurable via code analysis:
- "Zero layer violations (handler→repository direct calls)" → `grep -rn 'repository\.' services/api/internal/handler/ | grep -v test`
- "All handlers < 200 lines" → `wc -l services/api/internal/handler/*.go | sort -rn | head`
- "All services < 15 public methods" → `grep -c 'func.*Service)' services/api/internal/service/*.go`

**API design objectives** — measurable via spec or code:
- "100% of endpoints documented in OpenAPI spec" → `diff <(grep -r 'r.Get\|r.Post\|r.Put\|r.Delete\|r.Patch' services/api/internal/handler/routes.go) <(grep 'path:' services/api/docs/swagger.yaml)`
- "All list endpoints have max page size <= 100" → `grep -A5 'PageSize' services/api/internal/domain/pagination.go`
- "All request inputs validated" → count handlers with validation vs total handlers

**Schema objectives** — measurable via migration files:
- "All tenant-scoped tables have RLS policies" → count tables with `tenant_id` vs tables with `CREATE POLICY`
- "All foreign keys have ON DELETE clause" → `grep -c 'REFERENCES.*ON DELETE' services/api/db/migrations/*.up.sql`
- "All tables have created_at, updated_at columns" → check migration files

**Dependency objectives** — measurable via dependency tools:
- "Zero deprecated dependencies" → `cd services/api && go list -u -m all 2>/dev/null | grep -c '\[.*\]'`
- "Package coupling score < threshold" → count cross-package imports

**Debt objectives** — measurable via code search:
- "Zero TODO/FIXME items in production code" → `grep -rc 'TODO\|FIXME\|HACK' services/api/internal/ --include='*.go' | grep -v test | grep -v ':0$'`
- "Zero duplicated code blocks > 10 lines" → static analysis tool output

### Architecture Scorecard
| Area | Current State | Target State | Objective | Measurement | Score |
|------|--------------|-------------|-----------|-------------|-------|
| Layer Separation | ? | Clean | ? | ? | ?/5 |
| API Design | ? | RESTful | ? | ? | ?/5 |
| Data Model | ? | Normalised | ? | ? | ?/5 |
| Dependencies | ? | Minimal | ? | ? | ?/5 |
| Patterns | ? | Consistent | ? | ? | ?/5 |
| Tech Debt | ? | Managed | ? | ? | ?/5 |
| Scale Readiness | ? | Horizontal | ? | ? | ?/5 |

### Dependency Map
Create a text-based dependency map showing the relationships between major components:
```
Frontend Apps → Shared Package → API Types
                                    ↑
Mobile App → Shared Package ────────┘

API: Handler → Service → Repository → PostgreSQL
       ↓          ↓
   Middleware   Gateway → Stripe/PayPal/Square
       ↓          ↓
     Auth      Worker → Notifications
```

## Phase 9: Implementation Roadmap

### Sprint 1: Quick Wins (1-2 days each)
- Layer violations
- Missing validations
- API inconsistencies

### Sprint 2: Design Improvements (3-5 days)
- Domain model enrichment
- API contract hardening
- Query optimisation

### Sprint 3: Technical Debt (1-2 weeks)
- Dependency updates
- Code deduplication
- Schema improvements

### Sprint 4: Architecture Evolution (2-4 weeks)
- Horizontal scaling preparation
- Event-driven patterns (if needed)
- Caching strategy (if needed)

## Phase 10: GitHub Issue Creation

After presenting the report, ask the user:

> "Would you like me to create GitHub issues for these findings? Options:
> 1. Create all issues
> 2. Create only Critical + High issues
> 3. Create specific issues by number
> 4. Skip issue creation"

When creating issues, use labels:
```bash
gh label create "architecture-review" --description "Finding from architecture & design audit" --color "1a1a2e" --force
gh label create "area: layering" --color "e2e8f0" --force
gh label create "area: api-design" --color "c4b5fd" --force
gh label create "area: data-model" --color "a5b4fc" --force
gh label create "area: dependencies" --color "93c5fd" --force
gh label create "area: patterns" --color "86efac" --force
gh label create "area: tech-debt" --color "fcd34d" --force
```

## Focus Area (Optional)

If the caller provided `$ARGUMENTS`, narrow focus:
- `/architecture-review api` — focus on Go API architecture and layering
- `/architecture-review data` — focus on data model and schema design
- `/architecture-review frontend` — focus on frontend architecture and component design
- `/architecture-review dependencies` — focus on dependency management and module structure
- `/architecture-review patterns` — focus on design patterns and anti-patterns
- `/architecture-review debt` — focus on technical debt inventory
- `/architecture-review scale` — focus on horizontal scaling readiness

## Important Guidelines

- **Measure, don't guess**: Run actual commands, read actual code, count actual violations
- **Be specific**: "Handler X at line Y calls repository directly" not "some handlers might violate layering"
- **Respect existing patterns**: Recommendations should fit within the established Go + Chi + sqlc + pgx architecture
- **Don't over-architect**: Only recommend patterns that solve concrete problems found in the code
- **Consider multi-tenancy**: Every design recommendation must account for RLS and tenant isolation
- **Fly.io context**: This runs on Fly.io, not Kubernetes. Recommendations must be Fly-compatible
- **Actionable output**: Every finding needs a concrete next step, not just "consider improving"
