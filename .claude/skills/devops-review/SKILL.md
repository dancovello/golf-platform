---
name: devops-review
description: DevOps review — CI/CD pipeline analysis, deployment strategy, infrastructure-as-code, container security, environment management, and operational excellence across the entire platform.
argument-hint: [focus-area]
disable-model-invocation: true
user-invocable: true
allowed-tools: Read, Grep, Glob, Bash, Agent, WebSearch, WebFetch
---

# DevOps Review — CI/CD & Infrastructure Audit

You are a senior DevOps engineering team performing a comprehensive CI/CD, deployment, and infrastructure audit of the project. Your mandate is evidence-based analysis with actionable findings. Every finding must reference specific files, line numbers, and concrete evidence.

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

## Phase 1: CI/CD Pipeline Analysis

### 1a. Pipeline Inventory
Read all workflow files in `.github/workflows/`:
- Catalogue every workflow: name, trigger, jobs, duration estimate
- Map the deployment flow: push → CI → deploy (which environments, in what order?)
- Check for workflow dependencies and reusable workflows
- Identify workflow duplication (same steps repeated across files)

| Workflow | Trigger | Jobs | Est. Duration | Purpose |
|----------|---------|------|---------------|---------|
| ci.yml | PR, push | ? | ? | ? |
| deploy-beta.yml | push to main | ? | ? | ? |
| ... | ... | ... | ... | ... |

### 1b. CI Quality Gates
For each quality gate, check if it's implemented:
- [ ] Go linting (golangci-lint)
- [ ] Go build
- [ ] Go unit tests with race detector
- [ ] Go integration tests
- [ ] TypeScript type checking (tsc --noEmit)
- [ ] Frontend linting (ESLint)
- [ ] Frontend build
- [ ] Shared package build + tests
- [ ] E2E tests (Playwright)
- [ ] Security scanning (Trivy, govulncheck, pnpm audit)
- [ ] Docker image build
- [ ] Migration safety check
- [ ] API spec validation

### 1c. CI Performance
- Estimate total CI duration for a typical PR
- Identify the slowest jobs and steps
- Check for unnecessary sequential steps that could be parallelised
- Check caching: Go modules, pnpm store, Next.js cache, Playwright browsers, Docker layers
- Check for resource waste: jobs that run but aren't needed for certain change types

### 1d. CI Reliability
- Check for flaky test handling (retries, test isolation)
- Check for timing-dependent CI steps
- Check for external dependencies in CI (network calls, external services)
- Check for CI-specific test configuration (timeouts, parallelism)

## Phase 2: Deployment Strategy

### 2a. Deployment Process
- Read Fly.io configuration files (`fly.toml`, `fly.beta.toml` across all apps)
- Map the deployment process for each environment (beta, production)
- Check for blue-green or canary deployment support
- Check rollback procedures — how quickly can a bad deploy be reverted?
- Check for deployment locks (preventing concurrent deploys)

### 2b. Database Migrations on Deploy
- Check release command in `fly.toml` — does it run migrations?
- What happens if a migration fails mid-deploy?
- Are migrations backward-compatible? (can old code run against new schema?)
- Is there a migration rollback strategy?
- Check for data migration handling (separate from schema migrations?)

### 2c. Zero-Downtime Deployment
- Check Fly.io health check configuration (grace period, interval, timeout)
- Check for connection draining on shutdown
- Check graceful shutdown handling in Go API (`main.go`)
- Are there breaking API changes deployed without versioning?
- Check for long-running requests during deploy (file uploads, webhooks)

### 2d. Environment Promotion
- How does code move from beta → production?
- Is there a staging environment between beta and production?
- Are environment configurations (secrets, env vars) managed consistently?
- Check for environment-specific code paths or feature flags

## Phase 3: Infrastructure Configuration

### 3a. Docker Compose (Local Dev)
- Read `infrastructure/docker/docker-compose.yml`
- Check for proper service dependencies and health checks
- Check resource limits (memory, CPU) on containers
- Check volume mounts for data persistence
- Check networking configuration
- Check for development-only vs production-parity settings
- Check log rotation configuration

### 3b. Fly.io Configuration
- Read all `fly.toml` files across apps and services
- Check instance sizing (CPU, memory) — is it appropriate for the workload?
- Check auto-scaling configuration (min/max instances)
- Check for health check configuration completeness
- Check internal networking between Fly.io apps
- Check for TLS/SSL configuration
- Check for volume attachments (persistent storage)

### 3c. Observability Infrastructure
- Read observability stack configuration (`infrastructure/docker/` or `observability/`)
- Check Prometheus scrape configuration
- Check Loki log collection and retention
- Check Alloy collector configuration
- Check Grafana provisioning (dashboards, datasources)
- Is observability deployed in production or only local?

### 3d. Database Infrastructure
- Check PostgreSQL configuration (local Docker and production Neon)
- Check connection pooling configuration
- Check backup strategy (Neon handles this, but verify)
- Check for database monitoring

## Phase 4: Build & Artifact Management

### 4a. Docker Image Strategy
- Read Dockerfiles for all services
- Check for multi-stage builds (separate build and runtime stages)
- Check base image choices (Alpine vs Debian, specific versions vs latest)
- Check for unnecessary files in images (.dockerignore review)
- Check image size — is it optimised?
- Check for security: non-root user, minimal packages, no secrets baked in

### 4b. Build Caching
- Check Docker layer caching strategy
- Check Turborepo caching (remote cache enabled?)
- Check Go module caching in CI
- Check pnpm store caching in CI
- Check Next.js build caching

### 4c. Artifact Versioning
- How are deployments versioned? (git SHA, semantic version, timestamp?)
- Can you determine which code version is running in any environment?
- Is there an artifact registry? (Docker images, npm packages)
- Check for build reproducibility

## Phase 5: Environment Management

### 5a. Environment Parity
- Compare beta and production configurations
- Are there differences that could cause "works in beta, breaks in prod"?
- Check for hardcoded environment-specific values
- Check for feature flags or environment-conditional code

### 5b. Secrets Management
- How are secrets managed for each environment? (Fly.io secrets, GitHub secrets)
- Are secrets rotated regularly?
- Can secrets be rotated without downtime?
- Check for secrets in: fly.toml, docker-compose.yml, .env files committed to repo
- Check GitHub Actions secrets usage — are they properly scoped?

### 5c. Configuration Management
- Is configuration managed as code? (environment variables, fly.toml)
- Are there configuration drift risks between environments?
- Check for runtime configuration vs build-time configuration
- Is there a configuration validation step?

## Phase 6: Operational Excellence

### 6a. Runbooks & Documentation
- Check for operational runbooks (deployment, rollback, incident response)
- Is there documentation for: setting up local dev, deploying, troubleshooting?
- Check for scripts in `scripts/` directory — are they documented?
- Is the pre-push script (`scripts/pre-push.sh`) comprehensive?

### 6b. Monitoring & Alerting (DevOps Perspective)
- Are deployment events tracked? (deploy start, success, failure)
- Are there alerts for: failed deploys, slow deploys, rollback triggers?
- Check for deployment metrics (frequency, lead time, MTTR, change failure rate — DORA metrics)
- Is there a deployment dashboard?

### 6c. Incident Management
- Is there an incident response process?
- Can the system be quickly diagnosed? (logs, metrics, health checks)
- Check for debugging tools: pprof, trace endpoints, admin APIs
- Is there a status page or incident communication channel?

### 6d. Disaster Recovery
- What's the backup strategy? (database, file storage, configuration)
- What's the RPO (Recovery Point Objective)?
- What's the RTO (Recovery Time Objective)?
- Is there a tested disaster recovery procedure?
- Can the system be rebuilt from scratch? (infrastructure as code)

## Phase 7: Developer Experience

### 7a. Local Development
- How long does initial setup take? (clone → running system)
- Check `pnpm install` + `docker compose up` workflow
- Are there seed data scripts for local development?
- Check for hot-reload support across all services
- Is the local environment representative of production?

### 7b. Development Workflow
- Check branch strategy (trunk-based, feature branches, release branches)
- Check PR review requirements (approvals, CI passing)
- Check for automated code quality tools (linters, formatters, type checkers)
- Check for pre-commit or pre-push hooks
- Is there a development contribution guide?

### 7c. Debugging & Troubleshooting
- Can developers debug production issues from local? (log access, metric access)
- Are there tools for database debugging? (psql access, query logging)
- Can developers replay production traffic locally?
- Check for development-specific endpoints or tools

## Phase 8: Prioritised Report with Measurable Objectives

Compile ALL findings into a single prioritised report. **Every recommendation MUST include a measurable objective** — a concrete target that the retrospective system can verify programmatically in future runs.

### Finding Format

For each finding, specify:

| Field | Description |
|-------|-------------|
| **Finding** | What's wrong |
| **Category** | ci-cd / deployment / infrastructure / builds / environments / operations / dx |
| **Evidence** | Current measurement or proof |
| **Recommendation** | What to do |
| **Objective** | Measurable target |
| **Baseline** | Current measured value |
| **Measurement** | Exact command, query, or check to verify the objective is met |
| **Effort** | Estimated effort |

### CRITICAL (Pipeline broken or deployment risk)
| # | Finding | Category | Evidence | Recommendation | Objective | Baseline | Measurement | Effort |
|---|---------|----------|----------|----------------|-----------|----------|-------------|--------|

### HIGH (Significant operational gap)
| # | Finding | Category | Evidence | Recommendation | Objective | Baseline | Measurement | Effort |
|---|---------|----------|----------|----------------|-----------|----------|-------------|--------|

### MEDIUM (Improves reliability / efficiency)
| # | Finding | Category | Evidence | Recommendation | Objective | Baseline | Measurement | Effort |
|---|---------|----------|----------|----------------|-----------|----------|-------------|--------|

### LOW (Best practice / polish)
| # | Finding | Category | Evidence | Recommendation | Objective | Baseline | Measurement | Effort |
|---|---------|----------|----------|----------------|-----------|----------|-------------|--------|

### Objective Types (use these categories)

**CI/CD objectives** — measurable via workflow analysis:
- "CI pipeline completes in < 10 minutes" → `gh run list --limit 10 --json databaseId,conclusion,createdAt,updatedAt | jq '[.[] | {duration: ((.updatedAt | fromdateiso8601) - (.createdAt | fromdateiso8601))}] | .[].duration'`
- "All quality gates pass before merge" → check branch protection rules
- "Zero flaky CI failures in 30 days" → `gh run list --limit 50 --json conclusion | jq '[.[] | select(.conclusion=="failure")] | length'`

**Deployment objectives** — measurable via deploy history:
- "Zero-downtime deployments" → check Fly.io deploy logs for connection resets
- "Rollback completes in < 5 minutes" → test rollback procedure and measure
- "Deploy frequency >= 1/day" → `gh run list --workflow deploy-beta.yml --limit 30 --json createdAt | jq 'length'` (count deploys in 30 days)

**Infrastructure objectives** — measurable via config inspection:
- "All Dockerfiles use multi-stage builds" → `grep -l 'FROM.*AS' **/Dockerfile`
- "All containers run as non-root" → `grep -c 'USER\|--chown' **/Dockerfile`
- "All Fly.io apps have health checks" → `grep -l 'http_checks\|tcp_checks' **/fly.toml`

**Build objectives** — measurable via build output:
- "Docker image size < 100MB" → `docker images --format '{{.Repository}} {{.Size}}' | grep neurocoach`
- "Go binary size < 30MB" → `ls -la services/api/bin/`
- "Turborepo cache hit rate > 80%" → check Turbo output for cache hits

**Operations objectives** — measurable via process checks:
- "Runbook exists for every alert" → count alerts vs runbook entries
- "All secrets rotatable without downtime" → verify rotation procedure for each secret
- "RTO < 1 hour" → test recovery procedure

**DX objectives** — measurable via setup time:
- "New developer setup < 15 minutes" → test from clean clone
- "Pre-push script passes in < 2 minutes" → `time bash scripts/pre-push.sh`
- "Hot reload works for all services" → verify file change → response time

### DevOps Scorecard
| Area | Current State | Target State | Objective | Measurement | Score |
|------|--------------|-------------|-----------|-------------|-------|
| CI Pipeline | ? | Fast & reliable | ? | ? | ?/5 |
| Deployment | ? | Zero-downtime | ? | ? | ?/5 |
| Infrastructure | ? | Codified | ? | ? | ?/5 |
| Build System | ? | Cached & fast | ? | ? | ?/5 |
| Environments | ? | Consistent | ? | ? | ?/5 |
| Operations | ? | Documented | ? | ? | ?/5 |
| Developer Experience | ? | Frictionless | ? | ? | ?/5 |

### DORA Metrics Assessment
| Metric | Current Estimate | Target | Measurement |
|--------|-----------------|--------|-------------|
| Deployment Frequency | ? | Daily | `gh run list --workflow deploy-beta.yml --limit 30` |
| Lead Time for Changes | ? | < 1 day | Time from commit to production |
| Change Failure Rate | ? | < 5% | Failed deploys / total deploys |
| Mean Time to Recovery | ? | < 1 hour | Time from incident to resolution |

## Phase 9: Implementation Roadmap

### Sprint 1: Quick Wins (1-2 days each)
- CI caching improvements
- Dockerfile optimisation
- Missing health checks

### Sprint 2: Pipeline Hardening (3-5 days)
- Parallelise CI jobs
- Add missing quality gates
- Improve deployment automation

### Sprint 3: Operational Excellence (1-2 weeks)
- Runbook creation
- Monitoring and alerting for deployments
- Secret rotation procedures

### Sprint 4: Infrastructure Maturity (2-4 weeks)
- Environment parity improvements
- Disaster recovery testing
- Developer experience improvements

## Phase 10: GitHub Issue Creation

After presenting the report, ask the user:

> "Would you like me to create GitHub issues for these findings? Options:
> 1. Create all issues
> 2. Create only Critical + High issues
> 3. Create specific issues by number
> 4. Skip issue creation"

When creating issues, use labels:
```bash
gh label create "devops-review" --description "Finding from DevOps & CI/CD audit" --color "0ea5e9" --force
gh label create "area: ci-cd" --color "7dd3fc" --force
gh label create "area: deployment" --color "38bdf8" --force
gh label create "area: infrastructure" --color "0284c7" --force
gh label create "area: builds" --color "0369a1" --force
gh label create "area: environments" --color "075985" --force
gh label create "area: operations" --color "0c4a6e" --force
gh label create "area: dx" --color "164e63" --force
```

## Focus Area (Optional)

If the caller provided `$ARGUMENTS`, narrow focus:
- `/devops-review ci` — focus on CI/CD pipeline analysis
- `/devops-review deploy` — focus on deployment strategy and zero-downtime
- `/devops-review docker` — focus on Docker and container configuration
- `/devops-review infrastructure` — focus on Fly.io and infrastructure config
- `/devops-review environments` — focus on environment management and parity
- `/devops-review operations` — focus on runbooks, monitoring, and incident response
- `/devops-review dx` — focus on developer experience and local development
- `/devops-review dora` — focus on DORA metrics assessment

## Important Guidelines

- **Measure, don't guess**: Run actual commands, read actual configs, time actual pipelines
- **Be specific**: "CI step X takes 3m42s and could be cached" not "CI could be faster"
- **Fly.io context**: This runs on Fly.io, not Kubernetes. Recommendations must be Fly-compatible
- **Monorepo awareness**: Consider Turborepo caching, workspace dependencies, and selective builds
- **Existing tools**: Don't recommend replacing GitHub Actions or Fly.io — improve what's there
- **Security conscious**: Flag any security issues in CI/CD (secret exposure, unsafe workflows)
- **Actionable output**: Every finding needs a concrete next step, not just "consider improving"
- **DX matters**: Developer experience improvements have compound value — don't dismiss them as low priority
