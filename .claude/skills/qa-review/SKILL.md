---
name: qa-review
description: Expert QA Engineering team that audits testing frameworks, coverage, bug patterns, and critical paths across the entire codebase. Reports prioritised findings and optionally creates GitHub issues.
argument-hint: [focus-area]
disable-model-invocation: true
user-invocable: true
allowed-tools: Read, Grep, Glob, Bash, Agent, WebSearch
---

# QA Review — Expert Quality Engineering Audit

You are an expert Quality Engineering team performing a comprehensive QA audit of the NeuroCoach platform. Your mandate is thorough, evidence-based analysis — not surface-level observations. Every finding must reference specific files, line numbers, and concrete evidence.

## Phase 1: Testing Framework Inventory

Catalogue every testing framework and tool in use across the monorepo:

### Go API (`services/api/`)
- Run `make test-unit` and `make test-coverage` to get current unit test coverage
- Identify test file locations and patterns (`*_test.go`)
- Check for integration tests using testcontainers (`internal/integration/`)
- Review test helpers and mocks in `internal/testutil/`
- Check for race condition testing (`make test-race`)

### Frontend — Shared Package (`packages/shared/`)
- Run `pnpm --filter @neurocoach/shared test -- --coverage` for Jest coverage
- Review test patterns and utilities

### Frontend — E2E (`apps/coach-admin/`, `apps/platform-admin/`)
- Count and catalogue Playwright test files and test cases
- Review test fixtures, page objects, and helpers
- Check for flaky test patterns (retries, arbitrary waits, timing-dependent assertions)

### Mobile (`apps/mobile/`)
- Check for any test infrastructure

Report the inventory as a table: Framework | Location | Test Count | Coverage % | Notes

## Phase 2: Bug Retrospective

Analyse git history to understand where bugs have been introduced and fixed:

```bash
# Find all bug fix commits
git log --oneline --all --grep="fix:" --grep="bug" --grep="Fix" --since="6 months ago" | head -60

# For each significant fix, identify the files changed
git log --all --grep="fix:" --name-only --since="6 months ago" | head -200
```

Build a **Bug Hotspot Analysis**:
1. Which files/directories have the most bug fixes?
2. Which features or domains are most bug-prone?
3. Are there patterns? (e.g., bugs in areas with low test coverage, bugs in complex business logic, bugs from missing edge cases)
4. Were any bugs introduced by previous "fix" commits (fix chains)?
5. Could any of these bugs have been caught by better tests?

Present findings as: File/Area | Bug Count | Pattern | Could Tests Have Caught It? | Recommendation

## Phase 3: Coverage Analysis (80% Mandate)

### Go API Coverage
```bash
cd services/api && make test-coverage 2>&1
```
- Parse the coverage output to identify per-package coverage percentages
- Flag any package below 80% coverage
- Identify completely untested packages
- List the top 10 uncovered functions/methods by importance

### Shared Package Coverage
```bash
cd packages/shared && pnpm test -- --coverage 2>&1
```
- Report overall and per-file coverage
- Flag files below 80%

### Coverage Gap Priority
Rank uncovered code by risk:
1. **Critical**: Auth, multi-tenancy/RLS, payment processing, webhook handling, data mutations
2. **High**: RBAC/permissions, client provisioning, session management, billing calculations
3. **Medium**: CRUD operations, pagination, filtering, search
4. **Low**: Formatting utilities, UI helpers, config parsing

## Phase 4: Critical Path Verification

Verify that these critical paths have adequate test coverage (both unit and integration/E2E):

| Critical Path | Expected Coverage | Check Method |
|---|---|---|
| JWT validation & JWKS refresh | Unit + integration | Grep for auth middleware tests |
| Tenant RLS isolation | Integration (testcontainers) | Check cross-tenant data leak tests |
| Payment gateway (Stripe/PayPal/Square) | Unit (mocked) | Check gateway mock coverage |
| Webhook signature verification | Unit | Check webhook handler tests |
| Client provisioning (invite → signup → link) | Integration + E2E | Check provisioning flow tests |
| RBAC permission checks | Unit + E2E | Check middleware + E2E permission tests |
| Subscription tier limits | Unit | Check TierLimits and enforcement tests |
| Invoice generation & payment tracking | Unit + E2E | Check billing flow tests |
| Multi-practice client switching | E2E | Check practice switching tests |
| Supervision cross-tenant queries | Unit/integration | Check supervision service tests |
| File upload (MinIO) | Integration | Check upload handler tests |
| Email/notification dispatch | Unit (mocked) | Check worker tests |

For each path: Tested? | Coverage Level | Gaps Found | Risk if Untested

## Phase 5: Advanced QA Analysis

### 5a. Flaky Test Detection
- Search for `setTimeout`, `waitFor`, `sleep`, arbitrary delays in tests
- Check Playwright tests for `waitForTimeout` or `page.waitForTimeout` calls
- Look for tests that depend on execution order or shared state
- Check for tests that access network/external services without mocking

### 5b. Test Isolation
- Are tests independent? Check for shared mutable state between tests
- Do integration tests properly clean up (truncate tables, reset state)?
- Are test databases isolated per test or shared?

### 5c. Test Data Management
- Are there test fixtures/factories?
- Is test data deterministic or random?
- Are there seed scripts for local/CI testing?

### 5d. Error Boundary Coverage
- Are error paths tested (not just happy paths)?
- Are API error responses validated in E2E tests?
- Are domain error types (`*APIError`, `ErrXxx` sentinels) tested?

### 5e. API Contract Testing
- Are API response shapes validated against OpenAPI spec?
- Do E2E tests check response status codes AND bodies?
- Are breaking API changes detected?

### 5f. Security-Sensitive Path Coverage
- SQL injection vectors tested?
- XSS prevention tested?
- CORS configuration tested?
- Rate limiting tested?
- File upload validation tested (type, size)?

### 5g. Performance & Load
- Any performance benchmarks (`Benchmark*` functions in Go)?
- Are there tests for pagination with large datasets?
- Database query performance (N+1 detection)?

## Phase 6: Prioritised Report with Measurable Objectives

Compile ALL findings into a single prioritised report. **Every recommendation MUST include a measurable objective** — a concrete SLO, target metric, or verifiable condition that the retrospective system can check programmatically in future runs.

### Finding Format

For each finding, specify:

| Field | Description |
|-------|-------------|
| **Finding** | What's wrong |
| **Area** | Component/file affected |
| **Evidence** | Current measurement or proof |
| **Recommendation** | What to do |
| **Objective** | Measurable target (SLO/SLA/metric) |
| **Baseline** | Current measured value |
| **Measurement** | Exact command or check to verify the objective is met |

### CRITICAL (Must fix — production risk)
| # | Finding | Area | Evidence | Recommendation | Objective | Baseline | Measurement |
|---|---------|------|----------|----------------|-----------|----------|-------------|

### HIGH (Should fix — significant quality gap)
| # | Finding | Area | Evidence | Recommendation | Objective | Baseline | Measurement |
|---|---------|------|----------|----------------|-----------|----------|-------------|

### MEDIUM (Improve — strengthens quality)
| # | Finding | Area | Evidence | Recommendation | Objective | Baseline | Measurement |
|---|---------|------|----------|----------------|-----------|----------|-------------|

### LOW (Nice to have — polish)
| # | Finding | Area | Evidence | Recommendation | Objective | Baseline | Measurement |
|---|---------|------|----------|----------------|-----------|----------|-------------|

### Objective Types (use these categories)

**Coverage objectives** — measurable via test commands:
- "Package X test coverage >= 80%" → `go test -cover ./internal/middleware/ | grep coverage`
- "Zero untested critical paths" → `grep -c 'func Test' <file>`

**Reliability objectives** — measurable via config or code inspection:
- "All external calls have timeout <= 10s" → `grep -r 'Timeout' services/api/ | grep -v test`
- "Circuit breaker on every external dependency" → count circuit breakers vs external deps

**Quality objectives** — measurable via lint/analysis:
- "Zero flaky test patterns (no waitForTimeout calls)" → `grep -rc 'waitForTimeout' apps/`
- "All E2E tests pass on 3 consecutive runs" → run test suite 3x

**Process objectives** — measurable via git history:
- "Zero bug-fix commits in area X for 30 days" → `git log --grep='fix:' --since='30 days' -- <path>`
- "No test-skipping annotations added" → `grep -rc 'test.skip\|t.Skip' <path>`

### Coverage Summary
| Component | Current % | Target % | Gap | Measurement Command | Priority |
|-----------|-----------|----------|-----|--------------------|---------|

### Bug Hotspot Summary
| Area | Bug Count (6mo) | Test Coverage | Target | Action Needed |
|------|-----------------|---------------|--------|---------------|

## Phase 7: GitHub Issue Creation

After presenting the report, ask the user:

> "Would you like me to create GitHub issues for these findings? I'll create one issue per finding (or group related findings), tagged with:
> - `qa-review` (source tag on all issues)
> - Severity label: `priority: critical`, `priority: high`, `priority: medium`, or `priority: low`
> - Area label: `area: testing`, `area: coverage`, `area: security`, `area: flaky-tests`, `area: api`, `area: frontend`, `area: mobile`, `area: infrastructure`
> - `type: test` or `type: bug` as appropriate
>
> Options:
> 1. Create all issues
> 2. Create only Critical + High issues
> 3. Create specific issues (I'll list the numbers)
> 4. Skip issue creation"

When creating issues, use this format:
```bash
gh issue create --title "<concise finding title>" --body "<detailed description with evidence, file references, and recommended fix>" --label "qa-review,priority: <severity>,area: <area>,type: test"
```

Note: Create labels first if they don't exist:
```bash
gh label create "qa-review" --description "Finding from QA review audit" --color "7057ff" --force
gh label create "priority: critical" --color "b60205" --force
gh label create "priority: high" --color "d93f0b" --force
gh label create "priority: medium" --color "fbca04" --force
gh label create "priority: low" --color "0e8a16" --force
gh label create "area: testing" --color "1d76db" --force
gh label create "area: coverage" --color "5319e7" --force
gh label create "area: security" --color "e11d48" --force
gh label create "area: flaky-tests" --color "f97316" --force
gh label create "type: test" --color "0075ca" --force
```

## Focus Area (Optional)

If the caller provided an argument via `$ARGUMENTS`, narrow the focus to that area while still providing the full framework context. For example:
- `/qa-review go` — focus on Go API testing
- `/qa-review security` — focus on security-sensitive paths
- `/qa-review coverage` — focus purely on coverage gaps
- `/qa-review e2e` — focus on E2E test quality
- `/qa-review billing` — focus on billing/payment critical paths

## Important Guidelines

- **Be specific**: Reference exact file paths and line numbers
- **Be evidence-based**: Show actual coverage numbers, actual git history, actual test gaps
- **Don't guess**: If you can't determine something, say so and explain what would be needed
- **Respect the codebase**: The project has established patterns — recommendations should fit within them
- **Prioritise ruthlessly**: Not everything needs fixing. Focus on what reduces production risk the most
- **Run actual commands**: Don't estimate coverage — measure it. Don't guess at bug history — query it.
