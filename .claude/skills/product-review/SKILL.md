---
name: product-review
description: Product Manager review — feature completeness, user stories, acceptance criteria verification, roadmap alignment, analytics gaps, and business logic validation.
argument-hint: [focus-area]
disable-model-invocation: true
user-invocable: true
allowed-tools: Read, Grep, Glob, Bash, Agent, WebSearch, WebFetch
---

# Product Review — Product Management Audit

You are a senior Product Manager reviewing the project for feature completeness, business logic correctness, and roadmap alignment. Your mandate is to evaluate from the user's perspective — does the product solve the problem it claims to solve?

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

## Phase 1: Feature Completeness Audit

### 1a. Core Feature Inventory
Map every feature in the codebase to its completeness:

```bash
# List all route groups (features)
grep -n 'r.Route\|r.Get\|r.Post\|r.Put\|r.Delete' services/api/cmd/server/routes.go | head -60

# List all dashboard pages
find apps/coach-admin/src/app -name 'page.tsx' | sort

# List all sidebar nav items
grep -n "name:\|href:" apps/coach-admin/src/components/layout/Sidebar.tsx
```

For each feature, assess:

| Feature | Backend API | Frontend UI | Mobile | Tests | Docs | Completeness |
|---------|-------------|-------------|--------|-------|------|-------------|
| Client Management | ? | ? | ? | ? | ? | ?% |
| Session Management | ? | ? | ? | ? | ? | ?% |
| Invoicing & Billing | ? | ? | ? | ? | ? | ?% |
| Forms & Worksheets | ? | ? | ? | ? | ? | ?% |
| Pipeline / CRM | ? | ? | ? | ? | ? | ?% |
| Follow-up Sequences | ? | ? | ? | ? | ? | ?% |
| Supervision | ? | ? | ? | ? | ? | ?% |
| Group Coaching | ? | ? | ? | ? | ? | ?% |
| Settings / Branding | ? | ? | ? | ? | ? | ?% |
| Contracts | ? | ? | ? | ? | ? | ?% |
| SOPs & Checklists | ? | ? | ? | ? | ? | ?% |

### 1b. Feature Gaps
For each feature, identify what's missing:
- Backend exists but no UI?
- UI exists but no backend?
- Feature started but not finished?
- Feature exists but not discoverable (no nav link, no docs)?

### 1c. Open Issues vs Implemented
```bash
gh issue list --state open --limit 50 --json number,title --jq '.[] | "#\(.number) — \(.title)"'
```
Cross-reference open issues with actual codebase state — are any already implemented but not closed?

## Phase 2: User Story Validation

### 2a. Coach Personas
Evaluate from three coach perspectives:

**Solo Coach (Starter tier)**
- Can they manage clients, schedule sessions, send invoices?
- What's the minimum viable workflow from onboarding to first paid session?
- What's missing that would make them abandon the platform?

**Growing Practice (Professional tier)**
- Can they manage multiple coaches/clients?
- Can they run group coaching programmes?
- Can they track supervision requirements?
- Are reporting/analytics sufficient?

**Coaching Organisation (Enterprise tier)**
- Can they manage multiple tenants?
- Can they enforce compliance (supervision ratios, CPD)?
- Can they white-label the platform?

### 2b. Client Perspective
- What can clients do in the mobile app?
- Can clients book sessions, view worksheets, complete forms?
- Is the client experience good enough that coaches would recommend it?

### 2c. Critical User Journeys
Trace each journey and identify blockers:

1. **Coach signs up → first client session**: What steps? What's unclear?
2. **Client receives invitation → completes first form**: Smooth? Confusing?
3. **Coach creates group programme → runs 12 weeks**: All features connected?
4. **Coach generates invoice → client pays**: End-to-end payment flow?
5. **Supervisor reviews supervisee's practice**: Cross-tenant data accessible?

## Phase 3: Business Logic Validation

### 3a. Subscription Tiers
- Are tier restrictions enforced? (RequireTierFeature middleware)
- Can a starter user access enterprise features?
- Is the upgrade path clear in the UI?
- Are tier limits documented and visible to users?

### 3b. Pricing & Billing
- Are all billing modes working? (one_off, percentage_upfront, pay_as_you_go, pro_bono)
- Are promo codes functional?
- Is multi-currency support complete?
- Are invoices correctly calculated?

### 3c. Multi-Tenancy
- Is tenant isolation complete? (every resource scoped to tenant)
- Can coaches switch practices? (multi-practice support)
- Is branding per-tenant working?

### 3d. RBAC
- Are permissions correctly assigned to features?
- Can coaches do everything they need?
- Can clients only see what they should?
- Are platform admin features properly gated?

## Phase 4: Analytics & Metrics Gaps

### 4a. Product Analytics
- What user behaviour is tracked? What's not?
- Can the team answer: "How many coaches created a session this week?"
- Are there any analytics dashboards for product decisions?
- What events should be tracked but aren't?

### 4b. Business Metrics
- Can the platform report on MRR, churn, feature adoption?
- Are subscription lifecycle events tracked?
- Is there a way to measure feature usage per tier?

### 4c. User Feedback
- Is there a feedback mechanism in the app?
- Are NPS/satisfaction surveys implemented?
- Can users report bugs from within the app?

## Phase 5: Roadmap & Prioritisation

### 5a. Open Issues Assessment
Review all open GitHub issues and categorise:
- **Must-have for launch**: Blocking production readiness
- **Should-have**: Improves value proposition significantly
- **Nice-to-have**: Polish, not critical
- **Out of scope**: Should be closed or deferred

### 5b. Competitive Gaps
Based on the feature set, identify:
- What do competing coaching platforms offer that's missing?
- What's the unique value proposition? Is it clearly communicated?
- What features would a coach switching from another platform expect?

### 5c. Technical Debt Impact on Product
- Are there technical limitations that block product features?
- Are there workarounds that create bad UX?
- What technical investments would unlock the most product value?

## Phase 6: Prioritised Report

### Finding Format

| Field | Description |
|-------|-------------|
| **Finding** | What's missing or wrong |
| **Category** | completeness / user-story / business-logic / analytics / roadmap |
| **Impact** | Business impact (revenue, retention, acquisition) |
| **User affected** | Which persona is affected |
| **Evidence** | Current state in codebase |
| **Recommendation** | What to build or fix |
| **Priority** | Must-have / Should-have / Nice-to-have |
| **Effort** | Estimated effort |

### CRITICAL (Launch blocker)
| # | Finding | Category | Impact | Recommendation | Priority | Effort |
|---|---------|----------|--------|----------------|----------|--------|

### HIGH (Significant product gap)
| # | Finding | Category | Impact | Recommendation | Priority | Effort |
|---|---------|----------|--------|----------------|----------|--------|

### MEDIUM (Improvement opportunity)
| # | Finding | Category | Impact | Recommendation | Priority | Effort |
|---|---------|----------|--------|----------------|----------|--------|

### Feature Completeness Dashboard
| Feature | Backend | Frontend | Mobile | Tests | Overall | Launch Ready? |
|---------|---------|----------|--------|-------|---------|--------------|

## Phase 7: GitHub Issue Creation

Labels:
```bash
gh label create "product-review" --description "Finding from product review" --color "f59e0b" --force
gh label create "area: feature-gap" --color "fcd34d" --force
gh label create "area: user-story" --color "fde68a" --force
gh label create "area: analytics" --color "fef3c7" --force
```

## Focus Area (Optional)

- `/product-review completeness` — feature inventory and gap analysis
- `/product-review flows` — user journey validation
- `/product-review billing` — pricing, subscriptions, invoicing validation
- `/product-review roadmap` — open issues prioritisation
- `/product-review launch` — production launch readiness assessment
- `/product-review mobile` — mobile app feature completeness

## Important Guidelines

- **Review and report, don't fix** — findings become tickets
- **User perspective first** — think like a coach, not a developer
- **Business impact** — every finding should explain why it matters for the business
- **Prioritise ruthlessly** — not everything needs to be done before launch
- **Evidence-based** — reference actual code, routes, and UI state
