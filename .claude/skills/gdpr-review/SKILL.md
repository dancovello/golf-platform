---
name: gdpr-review
description: GDPR & data privacy review — data inventory, lawful basis assessment, consent management, data subject rights, retention policies, cross-border transfers, and privacy-by-design analysis.
argument-hint: [focus-area]
disable-model-invocation: true
user-invocable: true
allowed-tools: Read, Grep, Glob, Bash, Agent, WebSearch, WebFetch
---

# GDPR Review — Data Privacy & Protection Audit

You are a senior data privacy team performing a comprehensive GDPR and data protection audit of the project. Your mandate is evidence-based analysis with actionable findings. Every finding must reference specific files, line numbers, and concrete evidence.

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

## Phase 1: Personal Data Inventory

### 1a. Data Mapping
Read all database migration files and map every table/column that contains personal data:

| Table | Column | Data Type | PII Category | Special Category? | Lawful Basis | Retention |
|-------|--------|-----------|-------------|-------------------|-------------|-----------|
| users | email | string | Contact | No | Contract | ? |
| users | first_name | string | Identity | No | Contract | ? |
| clients | notes | text | Health/Wellbeing | Possibly | Consent? | ? |
| sessions | session_notes | text | Health/Wellbeing | Possibly | Consent? | ? |
| invoices | ... | ... | Financial | No | Legal obligation | ? |

Fill in ALL tables with personal data from the actual schema.

### 1b. Data Flow Mapping
Trace how personal data flows through the system:
1. **Collection points**: Where does PII enter the system? (signup, forms, coach input, webhooks)
2. **Processing points**: Where is PII used? (API handlers, services, background workers)
3. **Storage points**: Where is PII stored? (PostgreSQL, MinIO, logs, Clerk)
4. **Sharing points**: Where is PII sent externally? (Clerk, payment gateways, email)
5. **Deletion points**: Where is PII deleted? (manual, automated, cascade)

### 1c. Sub-Processor Inventory
| Sub-Processor | Data Shared | Purpose | DPA in Place? | Location | Transfer Mechanism |
|--------------|------------|---------|---------------|----------|-------------------|
| Clerk | Email, name, auth data | Authentication | ? | US | ? |
| Stripe | Email, payment details | Payment processing | ? | US | ? |
| PayPal | Email, payment details | Payment processing | ? | US | ? |
| Square | Email, payment details | Payment processing | ? | US | ? |
| Fly.io | All application data | Hosting | ? | ? | ? |
| Neon | All database data | Database hosting | ? | ? | ? |

### 1d. Special Category Data Assessment
Coaching platforms often process health-related data (Article 9):
- Search for fields that could contain health/mental wellbeing data
- Check `session_notes`, `client_notes`, `worksheet_responses`, `form_submissions`
- Is there explicit consent for processing special category data?
- Are there additional safeguards for this data?

## Phase 2: Lawful Basis Assessment

### 2a. Processing Activities
For each processing activity, verify the lawful basis:

| Processing Activity | Lawful Basis | Evidence | Adequate? |
|-------------------|-------------|----------|-----------|
| User registration | Contract (Art. 6(1)(b)) | ? | ? |
| Session management | Contract | ? | ? |
| Payment processing | Contract + Legal obligation | ? | ? |
| Email notifications | Legitimate interest / Consent | ? | ? |
| Analytics/metrics | Legitimate interest | ? | ? |
| Marketing emails | Consent (opt-in) | ? | ? |
| Coaching notes storage | Contract + Consent (special cat.) | ? | ? |

### 2b. Consent Management
- Is there a consent mechanism in the codebase? Search for consent-related fields/tables
- Are consent records stored with timestamp, scope, and method of collection?
- Can consent be withdrawn? Is there a mechanism for this?
- Is consent granular (per-purpose) or blanket?
- Check for pre-ticked boxes or implied consent (not GDPR compliant)

### 2c. Legitimate Interest Assessment
- For processing based on legitimate interest, is there a documented LIA (Legitimate Interest Assessment)?
- Is there a balancing test between the controller's interest and data subject's rights?

## Phase 3: Data Subject Rights (Articles 15-22)

### 3a. Right of Access (Art. 15)
- Is there an endpoint or mechanism for data subject access requests (DSARs)?
- Can a user export all their personal data?
- Search for export/download functionality in the codebase
- Check: Can a coach export all data about a specific client?
- Is the response provided within 30 days? (process, not just technical)

### 3b. Right to Rectification (Art. 16)
- Can users update their personal data through the UI?
- Are there fields that users cannot update but should be able to?
- Do updates propagate to all storage locations (DB, Clerk, logs)?

### 3c. Right to Erasure (Art. 17)
- Is there a data deletion mechanism?
- Search for delete/remove/purge/anonymise functions
- Check cascade deletes in migrations — does deleting a user remove all their data?
- What about data in: logs (Loki), backups, MinIO uploads, Clerk, payment providers?
- Are there retention obligations that prevent deletion? (invoices, tax records)
- Check for soft delete vs hard delete patterns

### 3d. Right to Data Portability (Art. 20)
- Can users export their data in a machine-readable format (JSON, CSV)?
- Is there an export endpoint in the API?
- Does the export include all personal data (not just profile)?

### 3e. Right to Restriction of Processing (Art. 18)
- Can processing be restricted for specific data subjects?
- Is there a mechanism to flag accounts as "restricted"?

### 3f. Right to Object (Art. 21)
- Can users object to specific processing activities?
- Is there a mechanism for objections (especially for legitimate interest processing)?

### 3g. Automated Decision-Making (Art. 22)
- Is there any automated decision-making or profiling?
- If so, are data subjects informed and given the right to contest?

## Phase 4: Privacy by Design & Default (Article 25)

### 4a. Data Minimisation
- Are only necessary fields collected? Check for over-collection
- Are there fields stored "just in case" that aren't actually used?
- Check API responses: do they return more data than the client needs?
- Check logging: is PII logged? (search for email, name, token in log statements)

### 4b. Purpose Limitation
- Is data used only for the purpose it was collected?
- Check for secondary use of personal data (analytics, marketing)
- Are there clear data processing purposes documented in the code?

### 4c. Storage Limitation
- Is there a data retention policy implemented in code?
- Check for automated data cleanup/archival
- Search for TTL, retention, expiry, archive, cleanup patterns
- Are there database records kept indefinitely that should expire?

### 4d. Pseudonymisation & Anonymisation
- Check the supervision feature's anonymisation (`SHA256 hash → "Client A"`)
- Is PII pseudonymised where the identity isn't needed?
- Are analytics/metrics anonymised?
- Check log output for PII exposure

### 4e. Access Controls (Data Minimisation for Access)
- Does RLS enforce need-to-know access?
- Can coaches only see their own clients' data?
- Can platform admins see all tenant data? Should they?
- Are there audit logs for who accessed what data?

## Phase 5: Data Breach Preparedness (Articles 33-34)

### 5a. Breach Detection
- Are there security event logs that would detect a breach?
- Check for login failure monitoring, unusual access patterns
- Is there alerting for security events? (check Prometheus alert rules)
- Can you detect: mass data export, unusual API patterns, failed auth spikes?

### 5b. Breach Response
- Is there a breach notification mechanism?
- Can the system identify affected data subjects in case of a breach?
- Are there data breach response procedures documented?
- Can the system be quickly locked down? (disable API access, rotate keys)

### 5c. Breach Logging
- Are access logs comprehensive enough for forensic analysis?
- Check log retention — are logs kept long enough for breach investigation (72 hours minimum)?
- Are logs tamper-proof?

## Phase 6: Cross-Border Data Transfers (Chapter V)

### 6a. Transfer Mechanisms
- Where is data stored geographically? Check Fly.io regions, Neon regions
- Are there EU → US transfers? (Clerk is US-based)
- What transfer mechanisms are in place? (SCCs, adequacy decisions, DPF)
- Check for data residency options in the platform

### 6b. Transfer Impact Assessment
- For each sub-processor in a non-adequate country, is there a TIA?
- Are supplementary measures in place? (encryption, pseudonymisation)

## Phase 7: Technical Measures (Article 32)

### 7a. Encryption
- Is data encrypted at rest? (database, file storage)
- Is data encrypted in transit? (TLS everywhere?)
- Are encryption keys properly managed?
- Check for sensitive data stored in plain text

### 7b. Access Logging & Audit Trail
- Is there an audit trail for data access?
- Check for audit log tables or middleware
- Are admin actions logged?
- Can you reconstruct who accessed what data and when?

### 7c. Backup & Recovery
- Are backups encrypted?
- Are backups included in data deletion processes?
- Is there a tested recovery procedure?
- Check backup retention periods

## Phase 8: Prioritised Report with Measurable Objectives

Compile ALL findings into a single prioritised report. **Every recommendation MUST include a measurable objective** — a concrete target that the retrospective system can verify programmatically in future runs.

### Finding Format

For each finding, specify:

| Field | Description |
|-------|-------------|
| **Finding** | What's wrong |
| **Category** | data-inventory / lawful-basis / subject-rights / privacy-by-design / breach-prep / transfers / technical |
| **GDPR Article** | Relevant GDPR article(s) |
| **Evidence** | Current measurement or proof |
| **Recommendation** | What to do |
| **Objective** | Measurable target |
| **Baseline** | Current measured value |
| **Measurement** | Exact command, query, or check to verify the objective is met |
| **Effort** | Estimated effort |

### CRITICAL (GDPR violation risk — regulatory action possible)
| # | Finding | Category | GDPR Art. | Evidence | Recommendation | Objective | Baseline | Measurement | Effort |
|---|---------|----------|-----------|----------|----------------|-----------|----------|-------------|--------|

### HIGH (Significant compliance gap)
| # | Finding | Category | GDPR Art. | Evidence | Recommendation | Objective | Baseline | Measurement | Effort |
|---|---------|----------|-----------|----------|----------------|-----------|----------|-------------|--------|

### MEDIUM (Improves compliance posture)
| # | Finding | Category | GDPR Art. | Evidence | Recommendation | Objective | Baseline | Measurement | Effort |
|---|---------|----------|-----------|----------|----------------|-----------|----------|-------------|--------|

### LOW (Best practice / defence-in-depth)
| # | Finding | Category | GDPR Art. | Evidence | Recommendation | Objective | Baseline | Measurement | Effort |
|---|---------|----------|-----------|----------|----------------|-----------|----------|-------------|--------|

### Objective Types (use these categories)

**Data inventory objectives** — measurable via schema analysis:
- "100% of PII columns documented in data inventory" → count PII columns vs documented columns
- "All tables with personal data have retention policy" → `grep -c 'retention\|expires\|ttl\|cleanup' services/api/db/migrations/*.sql`

**Subject rights objectives** — measurable via API/code inspection:
- "Data export endpoint exists and covers all PII" → `grep -rn 'export\|download\|dsar' services/api/internal/handler/`
- "Hard delete removes data from all storage" → trace delete cascade through migrations
- "User can update all their personal fields" → compare editable fields vs stored PII

**Privacy-by-design objectives** — measurable via code analysis:
- "Zero PII in log output" → `grep -rn 'slog.*email\|slog.*name\|slog.*phone' services/api/internal/ | grep -v test`
- "All API responses return only necessary fields" → compare response types with DB schema
- "Data retention implemented for N/N data categories" → check for TTL/cleanup mechanisms

**Consent objectives** — measurable via schema/code:
- "Consent records stored with timestamp and scope" → check for consent table/fields in migrations
- "Consent withdrawal mechanism exists" → check for withdraw/revoke consent endpoints

**Breach preparedness objectives** — measurable via config:
- "Security events logged and alerted" → check Prometheus alert rules for auth failures
- "Access logs retained for >= 72 hours" → check Loki retention config
- "All admin actions audited" → check for audit middleware on admin endpoints

### GDPR Compliance Scorecard
| Area | GDPR Articles | Current State | Compliance Level | Objective | Score |
|------|--------------|--------------|-----------------|-----------|-------|
| Data Inventory | 30 | ? | ? | ? | ?/5 |
| Lawful Basis | 6, 9 | ? | ? | ? | ?/5 |
| Subject Rights | 15-22 | ? | ? | ? | ?/5 |
| Privacy by Design | 25 | ? | ? | ? | ?/5 |
| Breach Preparedness | 33-34 | ? | ? | ? | ?/5 |
| Cross-Border Transfers | 44-49 | ? | ? | ? | ?/5 |
| Technical Measures | 32 | ? | ? | ? | ?/5 |
| Documentation | 5(2), 24 | ? | ? | ? | ?/5 |

### Data Subject Rights Implementation
| Right | GDPR Art. | Implemented? | Endpoint/Mechanism | Gaps |
|-------|-----------|-------------|-------------------|------|
| Access | 15 | ? | ? | ? |
| Rectification | 16 | ? | ? | ? |
| Erasure | 17 | ? | ? | ? |
| Portability | 20 | ? | ? | ? |
| Restriction | 18 | ? | ? | ? |
| Object | 21 | ? | ? | ? |
| Automated Decisions | 22 | ? | ? | ? |

## Phase 9: Implementation Roadmap

### Sprint 1: Critical Compliance (immediate)
- Data inventory documentation
- Consent mechanism (if missing)
- PII in logs remediation

### Sprint 2: Subject Rights (1-2 weeks)
- Data export endpoint (DSAR)
- Data deletion endpoint (right to erasure)
- Retention policy implementation

### Sprint 3: Privacy Engineering (2-4 weeks)
- Audit trail implementation
- Data minimisation in API responses
- Pseudonymisation improvements

### Sprint 4: Documentation & Process (1-2 weeks)
- Privacy policy alignment with code
- Data Processing Agreement template
- Breach response procedure
- Records of processing activities (Art. 30)

## Phase 10: GitHub Issue Creation

After presenting the report, ask the user:

> "Would you like me to create GitHub issues for these findings? Options:
> 1. Create all issues
> 2. Create only Critical + High issues
> 3. Create specific issues by number
> 4. Skip issue creation"

When creating issues, use labels:
```bash
gh label create "gdpr-review" --description "Finding from GDPR & data privacy audit" --color "7c3aed" --force
gh label create "area: data-inventory" --color "c4b5fd" --force
gh label create "area: subject-rights" --color "a78bfa" --force
gh label create "area: consent" --color "8b5cf6" --force
gh label create "area: privacy-by-design" --color "7c3aed" --force
gh label create "area: data-retention" --color "6d28d9" --force
gh label create "area: breach-prep" --color "5b21b6" --force
gh label create "area: transfers" --color "4c1d95" --force
```

## Focus Area (Optional)

If the caller provided `$ARGUMENTS`, narrow focus:
- `/gdpr-review data-inventory` — focus on personal data mapping and classification
- `/gdpr-review subject-rights` — focus on data subject rights implementation
- `/gdpr-review consent` — focus on consent management
- `/gdpr-review retention` — focus on data retention and deletion
- `/gdpr-review transfers` — focus on cross-border data transfers
- `/gdpr-review breach` — focus on breach preparedness
- `/gdpr-review logs` — focus on PII in logs and audit trails
- `/gdpr-review special-category` — focus on health/wellbeing data (Article 9)

## Important Guidelines

- **Evidence over theory**: Reference actual database columns, API endpoints, and code patterns
- **Be specific**: "Table X column Y contains PII without retention policy" not "data retention might be missing"
- **Consider the coaching context**: Coaching notes may contain special category data (health/wellbeing) — this has higher GDPR requirements
- **Multi-tenancy matters**: Each tenant is a separate data controller — the platform must support per-tenant privacy settings
- **Don't assume compliance**: Verify each claim against actual code and configuration
- **Practical recommendations**: Focus on what can be implemented in the codebase, not just policy documents
- **UK GDPR**: Consider UK GDPR requirements alongside EU GDPR (post-Brexit, largely identical but separate regime)
- **Actionable output**: Every finding needs a concrete next step, not just "consider improving"
