# Golf Club Website Platform — Engineering Skills, Operations and Claude Code Workflow

## 1. Project context

We are building a repeatable website platform for golf clubs.

Each club needs:
- A public-facing website built from reusable templates and components.
- A CMS where authorised club staff can manage website content, images, branding and site settings.
- Brand configuration, including logos and colours.
- Secure separation between clubs so users can only access data and settings they are authorised to access.
- A repeatable onboarding and deployment process so new clubs can be added quickly.

The product components have been designed in Figma. Product context and a launch implementation roadmap already exist in a separate Claude Project. The founder is experienced in product design and product ownership but is not a software developer.

The aim is to use Claude Code as a development assistant, supported by reviewed skills, automated tests, security controls, deployment checks and independent monitoring.

## 2. Important working principles

- Treat the existing product requirements, roadmap and Figma designs as sources of truth.
- Do not invent product requirements or silently change approved decisions.
- Explain technical choices in plain English, including trade-offs, costs, risks and maintenance implications.
- Prefer a secure, maintainable and straightforward architecture over unnecessary complexity.
- Do not assume that a skill guarantees correctness or security. Skills provide instructions; tools and automated checks provide execution and evidence.
- Do not deploy to production, change production infrastructure, expose secrets or run destructive commands without explicit approval.
- Never claim a test, scan or deployment succeeded unless it was actually run and its result was checked.
- Review third-party skills and their permissions, dependencies and source before installing them. Pin versions where practical.
- Do not place credentials or production secrets in repository files or skill source code.

## 3. Claude Code context and repository structure

Claude Code does not automatically inherit all conversations, project instructions or uploaded reference files from a separate Claude Project. Transfer the durable product context into this repository.

Suggested structure:

```text
golf-platform/
├── CLAUDE.md
├── README.md
├── docs/
│   ├── product/
│   │   ├── product-vision.md
│   │   ├── requirements.md
│   │   └── roadmap.md
│   ├── design/
│   │   ├── design-system.md
│   │   └── figma-reference.md
│   ├── architecture/
│   │   └── decisions.md
│   ├── security/
│   │   └── security-requirements.md
│   └── delivery/
│       └── definition-of-done.md
└── .claude/
    └── skills/
```

This is a suggested structure. Adapt it to the actual framework and repository.

Keep `CLAUDE.md` concise. Use it for persistent instructions and links to more detailed documents. Transfer important product decisions and requirements from the existing Claude Project into the relevant Markdown documents; do not copy every conversation verbatim.

Record Figma links in `docs/design/figma-reference.md` and document relevant design tokens, component behaviour, responsive rules, typography, spacing and interaction states in `docs/design/design-system.md`. A Figma URL alone does not guarantee Claude Code can inspect the design. Configure an appropriate Figma integration if direct inspection is needed.

## 4. Candidate Claude Code skills and tools

These are candidates to evaluate, not guaranteed endorsements. Before installation, inspect each repository's current README, skill names, installation instructions, maintenance status, permissions and dependencies. Repository structures and commands may change.

### 4.1 DevOps, infrastructure, SRE and architecture review

Repository: https://github.com/carlgra/claude-skills

Relevant workflows reported in the collection include:
- `/devops-review`
- `/sre-review`
- `/architecture-review`
- `/dba-review`
- `/review`

Potential use:
- Review deployment and rollback plans.
- Review infrastructure design and environment separation.
- Consider uptime, resilience, recovery and operational risks.
- Review database architecture and migration plans.
- Review code changes at task level.

To inspect the repository:

```bash
git clone https://github.com/carlgra/claude-skills.git /tmp/carlgra-claude-skills
```

After inspecting the README and repository structure, copy only the relevant skill directories into `.claude/skills/`. Do not blindly overwrite existing project skills.

### 4.2 Security guidance

Anthropic Claude Code security-guidance plugin:
https://github.com/anthropics/claude-code/tree/main/plugins/security-guidance

The documented installation command is:

```text
/plugin install security-guidance@claude-plugins-official
```

Verify that the plugin is available in the current Claude Code installation and follow the current official instructions.

Use security guidance during development to help identify risky patterns. It does not replace automated security scanning, penetration testing or expert review.

### 4.3 Broader security and code review

Repository: https://github.com/jojojobring/claude-skills

Reported relevant skills include:
- `full-review`
- `owasp-security`

Potential use:
- Whole-project review at milestones.
- Security-focused review of web application changes.
- Review of code quality, architecture, performance and bugs.

Inspect the current repository instructions before copying skills:

```bash
git clone https://github.com/jojojobring/claude-skills.git /tmp/jojojobring-claude-skills
```

Copy only the selected, reviewed skill directories into `.claude/skills/`.

### 4.4 QA and testing skills

Repository: https://github.com/petrkindlmann/qa-skills

Reported areas include:
- Playwright browser automation.
- Test strategy.
- API testing.
- Accessibility testing.
- Visual regression.
- Performance testing.
- Synthetic monitoring.
- Release readiness.

Inspect the current README and skill list before installing. The repository has been associated with the following installation command, but verify its current syntax and available skill names:

```bash
npx skills add petrkindlmann/qa-skills
```

Prefer installing only the skills needed for the current stage.

### 4.5 Browser automation engine

Playwright documentation: https://playwright.dev/

Playwright is a test runner, not just a Claude Code skill. Claude can write and maintain tests, while Playwright executes browser tests and provides evidence about whether user journeys work.

Use it to test:
- Responsive layouts.
- Navigation and key public pages.
- CMS login and publishing flows.
- Branding changes from CMS to public website.
- Form behaviour and validation.
- Tenant access restrictions using at least two test clubs.
- Browser console errors and broken critical journeys.

### 4.6 Observability skills

Grafana skills repository: https://github.com/grafana/skills

Reported areas include Grafana, Prometheus, Loki, Tempo, metrics, dashboards and observability workflows.

Installation command reported by the project:

```bash
npx skills add grafana/skills
```

Verify the current installation instructions before use. These skills are more useful once the hosting and application architecture justify deeper observability. They do not themselves provide an always-running monitoring service.

### 4.7 TLS monitoring skill/plugin

TLS Radar Claude plugin:
https://github.com/TLS-Radar/tlsradar-claude-plugin

Reported commands include:

```text
/tls-scan example.com
/tls-monitor add example.com
/tls-monitor list
```

Verify the current repository documentation, commands and whether monitoring runs continuously or depends on a configured service. Use this as a supplementary check, not as a replacement for managed certificate issuance and renewal by the hosting platform.

### 4.8 Uptime Kuma

Uptime Kuma is an open-source uptime monitoring application:
https://github.com/louislam/uptime-kuma

Potential use:
- Monitor each public golf-club website.
- Monitor critical API endpoints.
- Track response time and availability.
- Send notifications when monitors fail.
- Perform certificate-expiry checks where supported by the configured monitor type.

Uptime Kuma is an application/service, not a Claude Code skill. It must be deployed and configured to keep monitoring while Claude Code is closed.

A community Claude Code skill for Uptime Kuma was found, but the referenced repository was reported as archived in June 2026. Do not depend on that archived integration without checking its status, security and compatibility. It is acceptable to configure Uptime Kuma manually or use its supported interfaces after reviewing its current documentation.

### 4.9 Official security review for GitHub pull requests

Anthropic repository: https://github.com/anthropics/claude-code-security-review

This is a GitHub Action for AI-assisted security reviews of code changes, not a simple local skill. It requires configuration and an API key. Evaluate it after local checks and pull requests are established. Follow the project's current security guidance, especially for untrusted pull requests and prompt-injection risk.

## 5. Operational capabilities inspired by managed reliability platforms

The goal is not to recreate a managed service. Build up selected operational capabilities using independent tools and clear procedures.

### 5.1 External uptime monitoring

Start with Uptime Kuma or a comparable uptime-monitoring service.

Configure checks for:
- Every public club website.
- Critical API endpoints.
- CMS availability, where a safe health endpoint is available.
- Important infrastructure endpoints where appropriate.

Use sensible retries and thresholds to reduce false alerts. Keep monitoring independent of the application being monitored where possible.

### 5.2 SSL/TLS certificate monitoring

- Prefer managed HTTPS certificate issuance and renewal through the hosting provider or an established certificate automation service.
- Monitor certificate expiry and renewal failures independently.
- Test HTTPS redirects and certificate validity.
- Monitor domain registration expiry separately; a valid certificate does not prevent a domain from expiring.
- Do not assume a certificate-monitoring skill automatically renews certificates or runs continuously.

Let's Encrypt: https://letsencrypt.org/

### 5.3 Synthetic monitoring

Use Playwright or a suitable scheduled browser-testing service to check critical user journeys periodically.

Examples:
- Public homepage loads.
- A representative content page loads.
- Important navigation and external booking links work.
- A safe test form behaves correctly.
- A staging CMS user can log in, edit a page and publish it.
- Branding changes are reflected on the correct tenant's website.

Use dedicated test accounts and non-production data. Do not run destructive tests against real club content.

### 5.4 Application errors and performance

Start with the hosting provider's logs and metrics. Add an error-tracking and performance-monitoring service if needed. Grafana/Prometheus/Loki/Tempo may be suitable for more advanced observability, depending on the chosen architecture.

Monitor:
- Server errors and failed requests.
- Response time and availability.
- Database errors and resource usage.
- Failed background jobs.
- Deployment-related error spikes.
- CMS publishing failures.

Do not collect unnecessary personal data in logs. Redact credentials, tokens and sensitive user information.

### 5.5 Incident response

Create a simple runbook that describes:
1. How an alert is acknowledged.
2. How to determine whether one club or the whole platform is affected.
3. Where to inspect logs and recent deployments.
4. How to roll back safely.
5. Who approves production changes.
6. How to verify recovery.
7. How to document the incident and prevent recurrence.

Claude Code can help analyse relevant logs and propose fixes. Production changes should require explicit approval, especially while the operational process is immature.

## 6. Security and website foundations

Use these as requirements to implement and test, not as a list of skills to install.

### Multi-tenant security

- Enforce authorisation on the server and at the appropriate data-access layer.
- Treat every club as a separate tenant.
- Prevent one club's users from reading or modifying another club's content, branding, media, users or settings.
- Test direct URL/API manipulation and cross-tenant access.
- Use least-privilege access for platform administrators and club users.
- Include tenant-isolation tests in automated regression tests.

### Authentication and authorisation

- Prefer a maintained authentication provider or framework over custom authentication.
- Secure sessions and cookies.
- Implement account recovery and password-reset protections.
- Use role-based permissions for club owners, editors and platform administrators.
- Validate permissions on the server, not only in the UI.
- Rate-limit sensitive endpoints where appropriate.

### Data and application security

- Validate input and safely render user-generated content.
- Protect file uploads and media handling.
- Use secure database access policies.
- Keep secrets in an appropriate secret manager or protected environment configuration.
- Scan dependencies and secrets.
- Keep dependencies patched.
- Establish a documented vulnerability and incident response process.

Reference: OWASP Application Security Verification Standard:
https://owasp.org/www-project-application-security-verification-standard/

### Backups and recovery

- Automate database and media backups.
- Define retention and access restrictions.
- Document restoration steps.
- Test restoration before launch and periodically thereafter.
- Confirm that a backup can be restored, not merely that a backup job completed.

## 7. Code review strategy

Use two levels of review.

### Task-level review

Run after each meaningful feature or pull request.

Check:
- Acceptance criteria are met.
- The implementation follows the Figma/design requirements.
- Tests cover the changed behaviour.
- Existing functionality has not regressed.
- Permissions and tenant boundaries remain intact.
- Errors, validation and edge cases are handled.
- The code is understandable and maintainable.

Use one general review workflow as the default and add specialist security, database or infrastructure reviews where appropriate.

### Whole-project review

Run at major milestones and before launch.

Check:
- Architecture and maintainability.
- Tenant isolation and authorisation.
- Database schema and migration strategy.
- Dependency and secret risks.
- Performance and accessibility.
- Deployment, rollback and recovery.
- Monitoring, alerting and operational readiness.
- Test coverage and known limitations.

AI reviews are not proof of security. Combine them with automated tests, static analysis, dependency scanning and independent human review for high-risk areas.

## 8. Non-AI tools and automated checks

Use these tools to provide repeatable checks that do not depend on a Claude session.

| Need | Candidate |
|---|---|
| Version control and pull requests | GitHub — https://github.com/ |
| Dependency alerts and updates | Dependabot — https://docs.github.com/en/code-security/dependabot |
| Static application security analysis | CodeQL — https://codeql.github.com/ |
| Secret scanning | GitHub secret scanning — https://docs.github.com/en/code-security/secret-scanning |
| Browser testing | Playwright — https://playwright.dev/ |
| Uptime monitoring | Uptime Kuma — https://github.com/louislam/uptime-kuma |
| TLS certificates | Let's Encrypt and the chosen hosting provider — https://letsencrypt.org/ |
| Deeper observability | Grafana — https://github.com/grafana/skills |

Choose tools that fit the selected hosting and application stack. Do not introduce every tool at once.

## 9. Architecture decision to make before implementation

Compare two main options.

### Option A: Shared multi-tenant platform

One application and CMS serves all clubs. Each club has its own content, branding, settings and users, with server-side tenant isolation.

Advantages:
- One codebase to update.
- Faster onboarding.
- Lower operational overhead as the number of clubs grows.
- Consistent releases and templates.

Trade-offs:
- Tenant isolation must be designed and tested carefully.
- A platform-wide issue may affect multiple clubs.
- Database and permission design need particular care.

### Option B: Separate deployments per club

Each club gets a separate application deployment, potentially with its own database and infrastructure.

Advantages:
- Greater deployment isolation when properly configured.
- More flexibility for customer-specific requirements.

Trade-offs:
- More deployment, upgrade, backup and monitoring overhead.
- Greater potential for configuration drift.
- Higher operational costs as the number of clubs increases.

Consider a hybrid model later if larger customers need additional isolation.

Investigate the shared multi-tenant model first because rapid onboarding and reusable templates are core goals. Do not commit to an architecture until the requirements, security implications, hosting options and costs have been reviewed.

## 10. Implementation roadmap

### Milestone 1: Technical discovery
- Transfer product context into repository documentation.
- Review Figma references and roadmap.
- Compare tenancy models.
- Choose and document the proposed technology stack and hosting architecture.
- Record open questions and decisions.

### Milestone 2: Development foundation
- Establish Git and repository conventions.
- Create `CLAUDE.md`.
- Set up development environment and dependency management.
- Add formatting, linting, type checking and initial automated tests.
- Configure pull-request checks.

### Milestone 3: Infrastructure foundation
- Establish development and staging environments.
- Configure database and migrations.
- Configure protected secrets and environment variables.
- Configure HTTPS and automated certificate renewal.
- Set up deployment, rollback, backups and recovery procedures.
- Add external uptime checks and alert notifications.

### Milestone 4: Core CMS
- Authentication and account recovery.
- User roles and permissions.
- Tenant creation and isolation.
- Brand configuration.
- Content management and publishing.

### Milestone 5: Public website
- Implement reusable components from Figma.
- Implement page templates and responsive layouts.
- Connect CMS content to public pages.
- Verify branding and publishing end to end.

### Milestone 6: Launch readiness
- Run automated regression tests.
- Complete security and whole-project reviews.
- Test tenant isolation using multiple test clubs.
- Verify accessibility and performance.
- Test backups and restoration.
- Verify alerts and incident procedures.
- Document customer onboarding and routine maintenance.

## 11. Definition of done

A feature is not complete merely because its UI exists.

For each task:
- Acceptance criteria are documented and met.
- Relevant automated tests have been run.
- Linting and type checking pass where configured.
- Security and tenant-boundary implications have been reviewed.
- The implementation has been compared with the design specification.
- Documentation is updated where necessary.
- Actual test results and unresolved risks are reported.

Before launch:
- A club administrator can configure branding, edit content and publish a page.
- Changes appear on the correct public website.
- Another club cannot access that tenant's data or settings.
- HTTPS, backups, monitoring and alert delivery are verified.
- Recovery procedures have been tested.
- Critical known defects and security issues are resolved or explicitly assessed and accepted.

## 12. First Claude Code task

Use this prompt after placing the product documentation in the repository:

> Review the product documentation and Figma references in this repository. Do not write code yet.
>
> I am a product designer and product owner, not a developer. Explain technical decisions in plain English, including trade-offs, costs, risks and maintenance implications.
>
> 1. Summarise your understanding of the product and requirements.
> 2. Identify missing decisions and conflicting requirements.
> 3. Compare a shared multi-tenant platform with separate deployments per golf club.
> 4. Recommend a technology stack and hosting approach, explaining alternatives.
> 5. Explain how authentication, tenant isolation, branding, content publishing, backups, monitoring, SSL and deployments will work.
> 6. Propose a phased implementation plan with dependencies and acceptance criteria.
> 7. Identify decisions that require human technical or security review.
>
> Do not assume the architecture has already been chosen. Do not provision infrastructure or make production changes. Present the proposal for approval before proceeding.

## 13. Installation and security notes

- Treat the repository URLs and commands in this document as starting points. Verify the current README and installation syntax before use.
- Inspect skill source and dependencies before running them.
- Prefer project-level installation for skills intended to be versioned with this application.
- Keep the initial skill set small: DevOps/review, security and QA first.
- Add uptime monitoring and certificate checks as part of the infrastructure milestone.
- Add deeper observability when justified by the hosting architecture and operational needs.
- Require explicit approval for production changes.
- Have an experienced developer or security specialist review the tenancy architecture and production security before onboarding paying customers.

## 14. Recommended starting shortlist

Start with:
1. Carl gra Claude skills: https://github.com/carlgra/claude-skills
2. QA skills: https://github.com/petrkindlmann/qa-skills
3. Anthropic security guidance: https://github.com/anthropics/claude-code/tree/main/plugins/security-guidance
4. GitHub and automated pull-request checks: https://github.com/
5. Uptime Kuma: https://github.com/louislam/uptime-kuma
6. Let's Encrypt and hosting-provider certificate automation: https://letsencrypt.org/

Add Grafana skills and broader whole-project review workflows as the platform grows.

The guiding principle is to use Claude Code to help build and maintain the platform, while independent monitoring services and automated tests continuously check that it works.
