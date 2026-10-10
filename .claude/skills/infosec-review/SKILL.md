---
name: infosec-review
description: Information Security review — authentication, authorisation, injection vectors, secrets management, dependency vulnerabilities, and OWASP Top 10 analysis across the entire platform.
argument-hint: [focus-area]
disable-model-invocation: true
user-invocable: true
allowed-tools: Read, Grep, Glob, Bash, Agent, WebSearch, WebFetch
---

# InfoSec Review — Information Security Audit

You are a senior application security team performing a comprehensive security audit of the project. Your mandate is evidence-based analysis with actionable findings. Every finding must reference specific files, line numbers, and concrete evidence.

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

## Phase 1: Authentication & Session Security

### 1a. JWT/JWKS Implementation
- Read `services/api/internal/middleware/auth.go` — review JWT validation logic
- Check algorithm restriction (RS256 only? Or accepting "none"/HS256?)
- Check JWT claims validation: `exp`, `iat`, `nbf`, `iss`, `aud` — are all checked?
- Check JWKS caching and refresh logic — is there a race condition on refresh?
- Check circuit breaker config — what happens when JWKS endpoint is permanently down?
- Verify JWT signature verification is not skippable
- Check for JWT confusion attacks (key type mismatches)

### 1b. Dev Token Security
- Read dev-token bypass logic — is it truly disabled in production?
- Check for environment variable manipulation that could enable dev tokens in production
- Verify `ENVIRONMENT` and `DEV_TOKEN_ENABLED` checks are ANDed, not ORed
- Check if dev token grants excessive permissions (should be minimal)

### 1c. Session Management
- Are JWTs properly short-lived? Check token lifetime configuration
- Is there token revocation capability? (Clerk handles this, but verify API respects it)
- Check for token replay protection
- Check CORS configuration — is it properly restrictive?
- Check cookie settings (if any): HttpOnly, Secure, SameSite

### 1d. Mobile Auth Security
- Check Expo SecureStore usage for token storage
- Check for token exposure in logs or error messages
- Check `X-Tenant-ID` header validation — can it be spoofed?
- Verify mobile auth flow doesn't expose tokens in URLs

## Phase 2: Authorisation & Access Control

### 2a. Multi-Tenant Isolation (RLS)
- Read RLS policies in migration files — are they comprehensive?
- Check for tables with `tenant_id` but missing RLS policies
- Check for RLS bypass paths: `set_config('app.is_platform_admin', 'true')` — where is this used?
- Verify RLS cannot be bypassed by manipulating session variables from client side
- Check supervision feature cross-tenant access — is service-layer control adequate?
- Test: Can a user in tenant A access data from tenant B through any API endpoint?

### 2b. RBAC Implementation
- Read `services/api/internal/middleware/` permission middleware
- Check that every mutation endpoint has permission checks
- Check for missing permission checks on sensitive endpoints
- Verify role hierarchy is enforced (admin > coach > client)
- Check for privilege escalation vectors (can a client make themselves admin?)
- Verify `RequirePlatformAdmin` is used on all platform-admin-only endpoints

### 2c. Object-Level Authorisation
- Check for IDOR (Insecure Direct Object Reference) vulnerabilities
- Can users access resources by guessing UUIDs?
- Are resource ownership checks performed beyond RLS?
- Check for mass assignment — can users set fields they shouldn't? (e.g., `tenant_id`, `role`)

### 2d. Webhook Authentication
- Read webhook handlers for Stripe, PayPal, Square signature verification
- Check that webhook endpoints validate signatures before processing
- Check for webhook replay attacks (timestamp validation)
- Verify webhook endpoints don't leak internal state in error responses

## Phase 3: Injection & Input Validation

### 3a. SQL Injection
- Review all raw SQL in `db/queries/*.sql` — are parameters properly bound?
- Check for string concatenation in SQL queries (search for `fmt.Sprintf` + SQL)
- Check sqlc-generated code for injection vectors
- Search for `db.Exec` or `db.Query` with string formatting in service layer
- Check for dynamic ORDER BY, LIMIT, or WHERE clauses built from user input

### 3b. Cross-Site Scripting (XSS)
- Check Next.js apps for `dangerouslySetInnerHTML` usage
- Check for unescaped user input in templates or responses
- Check API responses for reflected user input
- Check Content-Security-Policy headers
- Check for stored XSS via database-stored user content rendered in UI

### 3c. Command Injection
- Search for `exec.Command`, `os.exec`, shell invocations with user input
- Check file upload handling — is filename sanitised?
- Check for path traversal in file operations (MinIO key construction)

### 3d. Other Injection Vectors
- Check for SSRF: does the API make HTTP requests based on user-supplied URLs?
- Check for header injection in HTTP responses
- Check for log injection (user input in log messages without sanitisation)
- Check for LDAP, XML, or template injection (if applicable)

### 3e. Input Validation Audit
- Catalogue all API endpoints and their input validation
- Check for missing validation on: string lengths, number ranges, email formats, UUIDs
- Check for type confusion (string vs number in JSON parsing)
- Check for oversized request body protection (middleware limit)
- Verify file upload validation: allowed types, max size, content-type verification

## Phase 4: Secrets & Configuration Security

### 4a. Secrets Management
- Search for hardcoded secrets, API keys, passwords in the codebase
- Check `.gitignore` covers all secret files (`.env`, credentials, keys)
- Search git history for accidentally committed secrets: `git log --all -p -S 'password\|secret\|api_key' -- '*.go' '*.ts' '*.json' | head -100`
- Check Docker Compose files for embedded credentials
- Verify Fly.io secrets are used (not environment variables in fly.toml)

### 4b. Environment Configuration
- Check for insecure defaults (debug mode, verbose logging in production)
- Verify production config disables dev features (dev tokens, CORS wildcards, debug endpoints)
- Check for sensitive information in error responses (stack traces, internal paths)
- Check for information leakage in HTTP headers (Server, X-Powered-By)

### 4c. Cryptography
- Check for use of weak hash algorithms (MD5, SHA1 for security purposes)
- Check TLS configuration (if applicable at application level)
- Check for proper random number generation (crypto/rand, not math/rand)
- Check for hardcoded encryption keys or IVs

## Phase 5: Dependency Security

### 5a. Go Dependencies
- Run `cd services/api && go list -m all` to catalogue dependencies
- Check for known vulnerabilities: `cd services/api && govulncheck ./...` (if available) or check against OSV database
- Check for outdated dependencies with known CVEs
- Review dependencies for supply chain risk (popularity, maintenance status)

### 5b. Node.js Dependencies
- Check for `pnpm audit` results
- Review pnpm overrides in `package.json` — are they for security fixes?
- Check for outdated packages with known vulnerabilities
- Review Playwright and dev dependency security

### 5c. Container Security
- Check Dockerfile for base image vulnerabilities
- Check for running as root in containers
- Check for unnecessary packages in production images
- Review multi-stage build security (are build secrets leaked to final image?)

### 5d. CI/CD Security
- Check GitHub Actions workflows for secret exposure
- Check for pull_request_target with dangerous permissions
- Check for script injection in workflow files
- Verify deployment credentials are properly scoped

## Phase 6: API Security

### 6a. Rate Limiting
- Read `services/api/internal/middleware/ratelimit.go`
- Is rate limiting per-IP, per-user, or per-tenant?
- Is it distributed or per-instance? (critical for multi-instance Fly.io)
- Check for rate limiting on auth endpoints (brute force protection)
- Check for rate limiting on public endpoints (form submissions)
- Check for rate limiting bypass via header manipulation

### 6b. Security Headers
- Read security headers middleware
- Check for: CSP, X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security, X-XSS-Protection, Referrer-Policy
- Check CORS configuration — is it properly restrictive? (not `Access-Control-Allow-Origin: *`)
- Check for missing security headers on API responses

### 6c. Error Handling Security
- Check that error responses don't leak internal details (stack traces, SQL errors, file paths)
- Check that 500 errors are generic externally but detailed in logs
- Check for consistent error response format
- Verify panic recovery middleware sanitises error output

### 6d. File Upload Security
- Check MinIO upload handling for: path traversal, unlimited file size, unrestricted file types
- Check for virus/malware scanning on uploads
- Check that uploaded files are served with proper Content-Disposition headers
- Check for SSRF via file upload (SVG with external references, etc.)

## Phase 7: Data Security

### 7a. Data at Rest
- Is sensitive data encrypted in the database? (PII, payment info)
- Check for sensitive data in logs (emails, names, tokens, payment details)
- Check MinIO/S3 bucket policies — are they properly restrictive?
- Check for sensitive data in error messages or debug output

### 7b. Data in Transit
- Is all communication over TLS? (Fly.io handles this, but verify internal comms)
- Check for mixed content issues in frontend apps
- Check webhook endpoint security (HTTPS only?)

### 7c. Data Exposure
- Check API responses for over-exposure (returning more fields than the client needs)
- Check for sensitive fields in list endpoints (passwords, tokens, internal IDs)
- Check GraphQL/REST for information disclosure via introspection or error messages
- Check Swagger/OpenAPI docs — are they exposed in production?

## Phase 8: Active Scanning & Pen Testing

### 8a. Dependency Vulnerability Scanning — Fix, Don't Ignore

**Policy: Fix vulnerabilities by upgrading. Only suppress in .trivyignore as a last resort when no fix exists.**

Run active scans and FIX any issues found:

```bash
# Go vulnerabilities
cd services/api && govulncheck ./... 2>&1

# Node.js vulnerabilities
pnpm audit --audit-level high 2>&1

# Trivy filesystem scan
trivy fs --severity HIGH,CRITICAL --scanners vuln . 2>&1

# Check .trivyignore — every entry should be re-evaluated
cat .trivyignore
```

For each vulnerability found, report as a finding with:
1. **CVE/GHSA ID**, affected package, current version, fix version
2. **Fix available?** — state whether a version bump, pnpm override, or go.mod update resolves it
3. **Suppressed in .trivyignore?** — if yes, check if a fix is NOW available and flag for removal
4. **Risk assessment** — is this exploitable in our context? (transitive dep, runtime vs build, etc.)

**IMPORTANT: Do NOT fix vulnerabilities yourself. Report them as findings with clear remediation steps so they become tickets.**

**Audit the .trivyignore file:**
- For each entry, check if the suppressed CVE now has a fix available
- Flag entries that can now be fixed
- Flag entries older than 90 days for re-evaluation

### 8b. Security Header Verification

Actively test security headers on running services:

```bash
# API headers
curl -sI http://localhost:8081/health | grep -iE 'content-security|x-frame|x-content-type|strict-transport|referrer-policy|permissions-policy'

# Coach admin headers
curl -sI http://localhost:3000/ | grep -iE 'content-security|x-frame|x-content-type|strict-transport|referrer-policy|permissions-policy'

# Platform admin headers
curl -sI http://localhost:3001/ | grep -iE 'content-security|x-frame|x-content-type|strict-transport|referrer-policy|permissions-policy'
```

Verify each header value is correct and restrictive.

### 8c. Authentication Pen Tests

Run actual authentication tests against the local API:

```bash
# Test: Reject requests without auth
curl -s -o /dev/null -w "%{http_code}" http://localhost:8081/api/v1/clients
# Expected: 401

# Test: Reject invalid JWT
curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer invalid-token" http://localhost:8081/api/v1/clients
# Expected: 401

# Test: Dev token rejected when DEV_TOKEN_ENABLED is not set
# (check Docker API container environment)

# Test: Reject expired JWT (if you can construct one)
```

### 8d. RLS Isolation Tests

Test cross-tenant isolation:

```bash
# Test: Tenant A cannot see Tenant B data
# Use dev-token with tenant A, try to access tenant B resources
# Verify RLS blocks cross-tenant access at the database level

# Test: Direct SQL bypass check
# Verify no raw SQL queries skip parameterised tenant_id
grep -rn 'fmt.Sprintf.*tenant_id\|fmt.Sprintf.*SELECT.*FROM' services/api/internal/ --include='*.go' | grep -v test | grep -v '_test.go'
```

### 8e. Input Injection Tests

Test against the running API:

```bash
# SQL injection in query params
curl -s "http://localhost:8081/api/v1/clients?page=1%27%20OR%201%3D1" -H "Authorization: Bearer dev-token" | head -5

# XSS in form submission
curl -s -X POST http://localhost:8081/api/v1/public/forms/test/submit \
  -H "Content-Type: application/json" \
  -d '{"name":"<script>alert(1)</script>","email":"test@test.com","data":{}}' | head -5

# Oversized request body
dd if=/dev/zero bs=2M count=1 2>/dev/null | curl -s -X POST http://localhost:8081/api/v1/clients \
  -H "Authorization: Bearer dev-token" -H "Content-Type: application/json" \
  --data-binary @- -o /dev/null -w "%{http_code}"
# Expected: 413 or 400
```

### 8f. Rate Limiting Tests

```bash
# Rapid-fire requests to test rate limiting
for i in $(seq 1 50); do
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8081/api/v1/clients -H "Authorization: Bearer dev-token"
done | sort | uniq -c
# Should see 429 responses after limit is hit
```

### 8g. Secrets Scanning

```bash
# Check for secrets in git history
git log --all --oneline -p -S 'BEGIN RSA\|BEGIN PRIVATE\|AKIA\|sk_live\|sk_test' -- '*.go' '*.ts' '*.json' '*.yml' | head -50

# Check for secrets in current files (excluding .env and test files)
grep -rn 'sk_live\|sk_test\|AKIA\|password.*=.*["\x27][^"\x27]*["\x27]' --include='*.go' --include='*.ts' --include='*.json' --include='*.yml' . | grep -v node_modules | grep -v '.env' | grep -v test | grep -v mock | head -20

# Check .gitignore coverage
for pattern in '.env' '*.pem' '*.key' 'credentials' '.env.local' '.env.production'; do
  grep -q "$pattern" .gitignore && echo "COVERED: $pattern" || echo "MISSING: $pattern"
done
```

## Phase 9: Prioritised Report with Measurable Objectives

Compile ALL findings into a single prioritised report. **Every recommendation MUST include a measurable objective** — a concrete target that the retrospective system can verify programmatically in future runs.

### Finding Format

For each finding, specify:

| Field | Description |
|-------|-------------|
| **Finding** | What's wrong |
| **Category** | auth / authz / injection / secrets / dependencies / api-security / data-security |
| **OWASP** | Relevant OWASP Top 10 category (if applicable) |
| **Evidence** | Current measurement or proof |
| **Recommendation** | What to do |
| **Objective** | Measurable target |
| **Baseline** | Current measured value |
| **Measurement** | Exact command, query, or check to verify the objective is met |
| **Effort** | Estimated effort |

### CRITICAL (Exploitable vulnerability — immediate action required)
| # | Finding | Category | OWASP | Evidence | Recommendation | Objective | Baseline | Measurement | Effort |
|---|---------|----------|-------|----------|----------------|-----------|----------|-------------|--------|

### HIGH (Significant security gap — should fix before next release)
| # | Finding | Category | OWASP | Evidence | Recommendation | Objective | Baseline | Measurement | Effort |
|---|---------|----------|-------|----------|----------------|-----------|----------|-------------|--------|

### MEDIUM (Defence-in-depth improvement)
| # | Finding | Category | OWASP | Evidence | Recommendation | Objective | Baseline | Measurement | Effort |
|---|---------|----------|-------|----------|----------------|-----------|----------|-------------|--------|

### LOW (Hardening / best practice)
| # | Finding | Category | OWASP | Evidence | Recommendation | Objective | Baseline | Measurement | Effort |
|---|---------|----------|-------|----------|----------------|-----------|----------|-------------|--------|

### Objective Types (use these categories)

**Authentication objectives** — measurable via code inspection:
- "JWT validates all standard claims (exp, iat, nbf, iss, aud)" → `grep -c 'exp\|iat\|nbf\|iss\|aud' services/api/internal/middleware/auth.go`
- "Dev token disabled in production" → `grep 'DEV_TOKEN_ENABLED\|ENVIRONMENT' services/api/internal/middleware/auth.go`
- "Zero hardcoded credentials in codebase" → `grep -rn 'password.*=.*"\|secret.*=.*"\|api_key.*=.*"' --include='*.go' --include='*.ts' | grep -v test | grep -v '.env'`

**Authorisation objectives** — measurable via code analysis:
- "100% of mutation endpoints have permission middleware" → compare route definitions with middleware usage
- "All tenant-scoped tables have RLS policies" → count tables with tenant_id vs tables with CREATE POLICY
- "Zero IDOR vectors" → audit endpoint-by-endpoint resource ownership checks

**Injection objectives** — measurable via static analysis:
- "Zero raw SQL string concatenation" → `grep -rn 'fmt.Sprintf.*SELECT\|fmt.Sprintf.*INSERT\|fmt.Sprintf.*UPDATE\|fmt.Sprintf.*DELETE' services/api/ | grep -v test`
- "Zero dangerouslySetInnerHTML without sanitisation" → `grep -rn 'dangerouslySetInnerHTML' apps/ | grep -v node_modules`
- "All API endpoints validate input" → count handlers with validation vs total handlers

**Secrets objectives** — measurable via git/file analysis:
- "Zero secrets in git history" → `git log --all -p -S 'BEGIN RSA\|BEGIN PRIVATE\|AKIA' | head -5`
- ".gitignore covers all secret patterns" → verify .env, *.pem, *.key patterns present

**Dependency objectives** — measurable via audit tools:
- "Zero high/critical CVEs in dependencies" → `cd services/api && govulncheck ./... 2>&1 | grep -c 'Vulnerability'`
- "All pnpm audit high/critical resolved" → `pnpm audit --audit-level high 2>&1 | tail -5`

**Header objectives** — measurable via HTTP response:
- "All security headers present" → `curl -sI http://localhost:8081/health | grep -c 'X-Frame-Options\|X-Content-Type-Options\|Strict-Transport-Security'`

### Security Scorecard
| Area | Current State | Risk Level | Objective | Measurement | Score |
|------|--------------|-----------|-----------|-------------|-------|
| Authentication | ? | ? | ? | ? | ?/5 |
| Authorisation | ? | ? | ? | ? | ?/5 |
| Injection Prevention | ? | ? | ? | ? | ?/5 |
| Secrets Management | ? | ? | ? | ? | ?/5 |
| Dependency Security | ? | ? | ? | ? | ?/5 |
| API Security | ? | ? | ? | ? | ?/5 |
| Data Protection | ? | ? | ? | ? | ?/5 |

### OWASP Top 10 Coverage
| # | OWASP Category | Status | Evidence | Gaps |
|---|---------------|--------|----------|------|
| A01 | Broken Access Control | ? | ? | ? |
| A02 | Cryptographic Failures | ? | ? | ? |
| A03 | Injection | ? | ? | ? |
| A04 | Insecure Design | ? | ? | ? |
| A05 | Security Misconfiguration | ? | ? | ? |
| A06 | Vulnerable Components | ? | ? | ? |
| A07 | Auth Failures | ? | ? | ? |
| A08 | Data Integrity Failures | ? | ? | ? |
| A09 | Logging & Monitoring Failures | ? | ? | ? |
| A10 | SSRF | ? | ? | ? |

## Phase 9: Implementation Roadmap

### Sprint 1: Critical Fixes (immediate)
- Any exploitable vulnerabilities
- Missing auth/authz checks
- Secrets exposure

### Sprint 2: Security Hardening (1-2 days each)
- Security headers
- Input validation gaps
- Rate limiting improvements

### Sprint 3: Defence-in-Depth (1-2 weeks)
- Dependency updates
- CSP implementation
- Logging improvements for security events

### Sprint 4: Security Maturity (2-4 weeks)
- Automated security scanning in CI
- Penetration testing preparation
- Security documentation

## Phase 10: GitHub Issue Creation

After presenting the report, ask the user:

> "Would you like me to create GitHub issues for these findings? Options:
> 1. Create all issues
> 2. Create only Critical + High issues
> 3. Create specific issues by number
> 4. Skip issue creation"

When creating issues, use labels:
```bash
gh label create "infosec-review" --description "Finding from information security audit" --color "e11d48" --force
gh label create "area: auth" --color "fca5a5" --force
gh label create "area: authz" --color "f87171" --force
gh label create "area: injection" --color "ef4444" --force
gh label create "area: secrets" --color "dc2626" --force
gh label create "area: api-security" --color "b91c1c" --force
gh label create "area: data-security" --color "991b1b" --force
```

## Focus Area (Optional)

If the caller provided `$ARGUMENTS`, narrow focus:
- `/infosec-review auth` — focus on authentication and session security
- `/infosec-review authz` — focus on authorisation and access control
- `/infosec-review injection` — focus on injection vectors (SQL, XSS, command)
- `/infosec-review secrets` — focus on secrets management and configuration
- `/infosec-review dependencies` — focus on dependency vulnerabilities
- `/infosec-review api` — focus on API security (rate limiting, headers, CORS)
- `/infosec-review owasp` — full OWASP Top 10 assessment
- `/infosec-review rls` — focus on multi-tenant RLS isolation security
- `/infosec-review pentest` — run active pen tests (Phase 8c-8f) against local services
- `/infosec-review cve` — audit dependencies and .trivyignore, report fixable vulnerabilities
- `/infosec-review headers` — verify security headers on all services
- `/infosec-review full` — complete audit including code review + active scanning

## Important Guidelines

- **Review and report, don't fix**: Your job is to find issues and create tickets. Do NOT modify source code, apply patches, or fix vulnerabilities. Report them with clear remediation steps.
- **Evidence over theory**: Show actual vulnerable code, not hypothetical scenarios
- **Be specific**: "File X line Y has SQL concatenation" not "there might be SQL injection"
- **Severity accuracy**: Only mark CRITICAL if it's actually exploitable, not just theoretically possible
- **Respect the stack**: Clerk handles much of auth — focus on what the application controls
- **Consider multi-tenancy**: Every security finding must consider cross-tenant impact
- **No false positives**: Verify each finding before reporting — false positives erode trust
- **Actionable output**: Every finding needs a concrete remediation, not just "consider improving"
- **Test actively**: Run the pen test commands in Phase 8 against local services — report what you find
- **Fix > suppress**: When reporting dependency vulnerabilities, always check if a fix exists before recommending .trivyignore suppression
- **Audit suppressions**: Every .trivyignore entry is tech debt. Flag any that can now be resolved.
