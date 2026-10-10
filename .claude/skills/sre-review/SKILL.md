---
name: sre-review
description: SRE Engineering review — scaling analysis, load testing, resiliency audit, telemetry review, and alerting assessment across the entire platform.
argument-hint: [focus-area]
disable-model-invocation: true
user-invocable: true
allowed-tools: Read, Grep, Glob, Bash, Agent, WebSearch, WebFetch
---

# SRE Review — Site Reliability Engineering Audit

You are a senior SRE team performing a comprehensive reliability, scalability, and operability audit of the project. Your mandate is evidence-based analysis with actionable findings. Every finding must reference specific files, line numbers, metrics, or configuration values.

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

## Phase 1: Scaling Bottleneck Analysis

Identify every scaling bottleneck in the system. For each, estimate the breaking point.

### 1a. Database Layer
- Read `services/api/internal/config/config.go` for pool config (DB_MAX_CONNS, DB_MIN_CONNS)
- Read `services/api/cmd/server/main.go` for pool setup and any connection lifecycle hooks
- Check for N+1 query patterns: search for loops that call `queries.*` inside `for` blocks in `internal/service/*.go`
- Check for missing database indexes: read migration files for tables with `tenant_id` and verify composite indexes exist
- Check for expensive queries: look for `SELECT *`, missing `LIMIT`, full table scans in `db/queries/*.sql`
- Check for long-running transactions: search for `withTx` blocks that do external calls (HTTP, S3) inside transactions
- Check if RLS `set_config` calls add measurable overhead per request
- Estimate: How many concurrent users before the connection pool saturates? (factor in RLS setup per request)

### 1b. API Layer
- Check for blocking operations on the request path (file uploads, webhook dispatches, email sends)
- Search for synchronous external calls (Clerk API, payment gateways, MinIO) on hot paths
- Review rate limiting config in `internal/middleware/ratelimit.go` — is it per-instance or distributed?
- Check if the API is stateless (can it horizontally scale on Fly.io?)
- Look for in-memory caches or singletons that break with multiple instances
- Check graceful shutdown handling in `main.go`
- Estimate: How many requests/second can a single Fly.io instance handle? What's the horizontal scaling story?

### 1c. External Dependencies
- **Clerk JWKS**: Check circuit breaker config (trip threshold, recovery time, cache TTL)
- **MinIO/S3**: Check if uploads are streamed or buffered in memory
- **Payment webhooks**: Check if webhook processing is synchronous or queued
- **Email/notifications**: Check worker architecture — is it in-process or separate?
- For each dependency: What happens when it's down? Is there a fallback? A timeout? A circuit breaker?

### 1d. Frontend Scaling
- Check if Next.js apps have ISR/SSG or are fully SSR
- Check bundle sizes and code splitting
- Check if API calls from frontend have proper pagination limits

Present as:

| Bottleneck | Component | Current Limit | Breaking Point Estimate | Mitigation |
|-----------|-----------|---------------|------------------------|------------|

## Phase 2: Load Testing Framework

Design and implement a practical load testing approach for this codebase.

### 2a. Assess Existing Load Tests
- Search for any existing load/stress test files (`*load*`, `*stress*`, `*bench*`, `*perf*`)
- Review existing Go benchmarks in `internal/handler/benchmark_test.go`
- Check if there are any k6, artillery, vegeta, or similar load test configs

### 2b. Design Load Test Scenarios
Based on the codebase analysis, define the critical load test scenarios:

1. **Auth flow under load** — concurrent JWT validations with JWKS refresh
2. **Multi-tenant isolation under load** — concurrent requests across N tenants (RLS overhead)
3. **CRUD hotspots** — sessions, invoices, clients (highest traffic endpoints)
4. **File upload concurrency** — simultaneous uploads to MinIO
5. **Webhook storm** — burst of Stripe/PayPal webhooks
6. **Public form submission** — rate-limited endpoint under DDoS-like traffic
7. **Database connection pool saturation** — more concurrent requests than pool connections

For each scenario, specify:
- Target endpoint(s)
- Ramp pattern (users, duration, think time)
- Success criteria (p99 latency, error rate, throughput)
- What it measures

### 2c. Create Load Test Script
Create a practical load testing script using a tool available in the ecosystem. Prefer:
1. **Go benchmark tests** (already in codebase) — extend `benchmark_test.go`
2. **k6** (JavaScript, widely available) — create `scripts/load-test.js`
3. **vegeta** (Go CLI, simple) — create `scripts/load-test.sh`

The script should:
- Be runnable against local Docker stack (`localhost:8081`)
- Support configurable concurrency levels (10, 50, 100, 500 users)
- Test the scenarios defined above
- Output clear results: requests/sec, p50/p95/p99 latency, error rate
- Include a dev-token auth header for authenticated endpoints
- NOT require external services or accounts to run

### 2d. Create Scaling Report Template
Create a markdown template at `docs/scaling-report.md` that captures:
- Test date, environment, configuration
- Results per scenario (table format)
- Identified bottlenecks
- Comparison with previous runs (if available)

## Phase 3: Resiliency Audit

### 3a. Failure Mode Analysis
For each component, document what happens when it fails:

| Component | Failure Mode | Detection Time | Impact | Recovery | Graceful Degradation? |
|-----------|-------------|----------------|--------|----------|----------------------|
| PostgreSQL | Connection refused | ? | ? | ? | ? |
| PostgreSQL | Slow queries (>5s) | ? | ? | ? | ? |
| Clerk JWKS | Endpoint unreachable | ? | ? | ? | ? |
| Clerk JWKS | Returns invalid keys | ? | ? | ? | ? |
| MinIO/S3 | Unavailable | ? | ? | ? | ? |
| Stripe webhook | Delayed delivery | ? | ? | ? | ? |
| Fly.io instance | OOM kill | ? | ? | ? | ? |
| DNS | Resolution failure | ? | ? | ? | ? |

Fill in each cell with evidence from the code.

### 3b. Circuit Breakers & Timeouts
- Inventory ALL timeouts in the codebase (HTTP client timeouts, DB timeouts, context deadlines)
- Inventory ALL circuit breakers (JWKS has one — are there others?)
- Check for retry logic and whether it has backoff + jitter
- Check for request context propagation (are DB queries cancelled when client disconnects?)

### 3c. Health Checks
- Review health check endpoints (`/health`, `/health/ready`)
- Do they check downstream dependencies (DB, MinIO)?
- Are they used by Fly.io for instance health? Check `fly.toml` health check config
- Is there a readiness vs liveness distinction?

### 3d. Data Integrity
- Check for idempotency on mutation endpoints (especially payment webhooks)
- Check for race conditions on concurrent writes (optimistic locking? serializable transactions?)
- Check for orphaned data cleanup (failed uploads, partial transactions)
- Review cascade delete behavior in migrations

### 3e. Deployment Resiliency
- Check Fly.io config: how many instances? Auto-scaling? Health check grace period?
- Is there a release command for migrations? What happens if migration fails mid-deploy?
- Check for backward-compatible migrations (can old code run against new schema?)
- Zero-downtime deployment: are there breaking API changes without versioning?

## Phase 4: Telemetry & Observability Review

### 4a. Metrics Inventory
- Read `internal/middleware/metrics.go` — catalogue all Prometheus metrics
- Are business metrics tracked? (signups, sessions created, invoices paid, etc.)
- Are there custom metrics for critical paths? (auth failures, RLS violations, webhook failures)
- Check metric cardinality — are labels bounded? (unbounded labels = Prometheus OOM)
- Are database query durations tracked?

### 4b. Logging Review
- Check structured logging consistency (slog throughout?)
- Are log levels used consistently? (ERROR for actual errors, not expected conditions)
- Are sensitive fields redacted? (tokens, emails, PII in logs)
- Check log volume — which endpoints/services generate the most log lines?
- Is there request ID correlation across log entries?
- Review Alloy config (`observability/alloy.river`) — is it parsing logs correctly?

### 4c. Tracing
- Is distributed tracing implemented? (OpenTelemetry, Jaeger, etc.)
- Can a request be traced from frontend → API → database?
- Are trace IDs propagated in error responses?

### 4d. Dashboards
- Check Grafana provisioning (`observability/grafana/`) for existing dashboards
- Are there dashboards for: API health, database performance, business metrics, error rates?
- Are there dashboard gaps?

### 4e. Missing Telemetry
Identify what SHOULD be instrumented but isn't:

| What | Why It Matters | Recommended Metric/Log |
|------|---------------|----------------------|

## Phase 5: Alerting Assessment

### 5a. Current Alerts
- Read `observability/alert_rules.yml` — catalogue all alert rules
- Are alert thresholds appropriate? (evidence-based, not arbitrary)
- Are there alerts for: service down, high error rate, high latency, DB pool exhaustion, disk usage?

### 5b. Alert Gaps
Identify missing alerts that an SRE team would expect:

| Missing Alert | Condition | Severity | Why It Matters |
|--------------|-----------|----------|---------------|
| DB connection pool exhaustion | pool_active > 0.8 * max_conns | critical | Requests start failing |
| Memory usage high | container_memory > 80% | warning | OOM kill imminent |
| Certificate expiry | cert_expiry < 7d | warning | HTTPS will break |
| Webhook processing delay | webhook_age > 5m | warning | Payment state drift |
| etc. | | | |

### 5c. Alerting Infrastructure
- Is Alertmanager configured? (check `prometheus.yml` — alertmanagers section)
- Where do alerts go? (Slack, PagerDuty, email?)
- Is there an on-call rotation?
- Are there runbooks for each alert?

### 5d. Create Alert Rules
For each gap identified, write the actual Prometheus alert rule that should be added to `alert_rules.yml`. Use the existing format and metric names from the codebase.

## Phase 6: Supportability Review

### 6a. Operational Runbooks
- Are there runbooks for common operational tasks? (DB migration rollback, cache clear, user lockout, etc.)
- Can an on-call engineer diagnose issues using existing tooling?
- What's the MTTR (mean time to recovery) for common failure modes?

### 6b. Debugging Capabilities
- Can you get a thread/goroutine dump from a running instance?
- Is pprof enabled? Check for `/debug/pprof` routes
- Can you query the database from a running instance? (fly ssh)
- Are there admin endpoints for operational tasks?

### 6c. Dependency Visibility
- Is there a dependency map? (what calls what)
- Are third-party SLA/uptime guarantees documented?
- Is there a status page for dependencies? (Clerk, Fly.io, Neon/Postgres)

## Phase 7: Prioritised Report with Measurable SLOs

Compile ALL findings into a single prioritised report. **Every recommendation MUST include a measurable SLO/objective** — a concrete target that the retrospective system can verify programmatically in future runs.

### Finding Format

For each finding, specify:

| Field | Description |
|-------|-------------|
| **Finding** | What's wrong |
| **Category** | scaling / resiliency / observability / alerting / supportability |
| **Evidence** | Current measurement or proof |
| **Recommendation** | What to do |
| **SLO/Objective** | Measurable target |
| **Baseline** | Current measured value |
| **Measurement** | Exact command, query, or check to verify the objective is met |
| **Effort** | Estimated effort |

### CRITICAL (Production incident risk)
| # | Finding | Category | Evidence | Recommendation | SLO/Objective | Baseline | Measurement | Effort |
|---|---------|----------|----------|----------------|---------------|----------|-------------|--------|

### HIGH (Scaling blocker or operability gap)
| # | Finding | Category | Evidence | Recommendation | SLO/Objective | Baseline | Measurement | Effort |
|---|---------|----------|----------|----------------|---------------|----------|-------------|--------|

### MEDIUM (Improves reliability)
| # | Finding | Category | Evidence | Recommendation | SLO/Objective | Baseline | Measurement | Effort |
|---|---------|----------|----------|----------------|---------------|----------|-------------|--------|

### LOW (Best practice / polish)
| # | Finding | Category | Evidence | Recommendation | SLO/Objective | Baseline | Measurement | Effort |
|---|---------|----------|----------|----------------|---------------|----------|-------------|--------|

### SLO/Objective Types (use these categories)

**Latency SLOs** — measurable via load tests or metrics:
- "API p99 latency <= 500ms at 100 concurrent users" → `k6 run --vus 100 scripts/load-test.js | grep p99`
- "Health check responds in <= 50ms" → `curl -w '%{time_total}' -s http://localhost:8081/health`

**Availability SLOs** — measurable via uptime or error rate:
- "Error rate < 0.1% under normal load" → `promql: sum(rate(http_requests_total{status=~"5.."}[1h])) / sum(rate(http_requests_total[1h]))`
- "Zero downtime during deploy" → check Fly.io deploy logs for connection resets

**Capacity SLOs** — measurable via config or load tests:
- "DB connection pool supports 100 concurrent requests" → load test with 100 VUs, zero pool exhaustion errors
- "API handles 500 req/s per instance" → `vegeta attack -rate=500 -duration=30s | vegeta report`

**Resiliency SLOs** — measurable via code inspection or chaos tests:
- "All external calls have timeout <= 10s" → `grep -rn 'Timeout\|context.WithTimeout' services/api/ | grep -v test`
- "Circuit breaker on N/N external dependencies" → count breakers vs deps
- "Graceful shutdown completes within 30s" → check signal handler + drain logic

**Observability SLOs** — measurable via config inspection:
- "Alert fires within 5m of threshold breach" → check Prometheus `for:` duration on all rules
- "All error responses logged with request_id" → `grep -c 'request_id' <log sample>`
- "N/N critical paths have Prometheus metrics" → count instrumented handlers

**Operational SLOs** — measurable via process checks:
- "MTTR < 15 minutes for DB connection issues" → verify runbook exists + health check detects in <1m
- "All alerts have runbooks" → count alerts vs runbook entries

### Scaling Capacity Summary
| Resource | Current Config | Estimated Limit | SLO Target | Measurement | Notes |
|----------|---------------|-----------------|------------|-------------|-------|

### Resiliency Scorecard
| Component | Health Check | Circuit Breaker | Timeout | Retry | Graceful Degradation | SLO | Score |
|-----------|------------|-----------------|---------|-------|---------------------|-----|-------|

### Telemetry Coverage
| Area | Metrics | Logging | Tracing | Alerting | SLO | Score |
|------|---------|---------|---------|----------|-----|-------|

## Phase 8: Implementation Roadmap

Create a phased implementation plan:

### Sprint 1: Quick Wins (1-2 days each)
- Missing alerts
- Timeout/circuit breaker gaps
- Logging improvements

### Sprint 2: Load Testing (3-5 days)
- Create load test framework
- Run baseline tests
- Document results

### Sprint 3: Resiliency (1-2 weeks)
- Connection pool tuning
- Graceful degradation patterns
- Health check improvements

### Sprint 4: Scale Preparation (2-4 weeks)
- Horizontal scaling blockers
- Database optimization
- Caching layer (if needed)

## Phase 9: GitHub Issue Creation

After presenting the report, ask the user:

> "Would you like me to create GitHub issues for these findings? Options:
> 1. Create all issues
> 2. Create only Critical + High issues
> 3. Create specific issues by number
> 4. Skip issue creation"

When creating issues, use labels:
```bash
gh label create "sre-review" --description "Finding from SRE reliability audit" --color "0d1117" --force
gh label create "area: scaling" --color "d4c5f9" --force
gh label create "area: resiliency" --color "c5def5" --force
gh label create "area: observability" --color "bfd4f2" --force
gh label create "area: alerting" --color "f9d0c4" --force
gh label create "area: load-testing" --color "e99695" --force
gh label create "area: supportability" --color "c2e0c6" --force
```

## Focus Area (Optional)

If the caller provided `$ARGUMENTS`, narrow focus:
- `/sre-review scaling` — focus on bottlenecks and capacity planning
- `/sre-review resiliency` — focus on failure modes and circuit breakers
- `/sre-review observability` — focus on metrics, logging, tracing, dashboards
- `/sre-review alerting` — focus on alert rules and gaps
- `/sre-review load-test` — focus on designing and creating load tests
- `/sre-review database` — focus on DB scaling, queries, pool, indexes
- `/sre-review deploy` — focus on deployment pipeline, rollbacks, zero-downtime

## Important Guidelines

- **Measure, don't guess**: Run actual commands, read actual configs, count actual metrics
- **Be specific**: "Connection pool of 25 will saturate at ~25 concurrent requests with RLS overhead" not "pool might be too small"
- **Think in failure modes**: For each component, ask "what happens when this breaks?"
- **Consider multi-tenancy**: Every scaling estimate must account for RLS overhead and tenant isolation
- **Fly.io context**: This runs on Fly.io, not Kubernetes. Recommendations must be Fly-compatible
- **Existing stack**: Don't recommend replacing Prometheus/Loki/Grafana — improve what's there
- **Actionable output**: Every finding needs a concrete next step, not just "consider improving"
- **Create real artifacts**: Load test scripts, alert rules, and runbooks should be working code, not pseudocode
