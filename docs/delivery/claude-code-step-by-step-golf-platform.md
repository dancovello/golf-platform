# Step-by-Step Guide to Using Claude Code for the Golf Club Platform

This guide covers what to prepare before using Claude Code, how to set up the project, and a sensible order for building and checking the golf-club website and CMS platform.

## 1. Prepare your materials first

Gather the information you already have so Claude Code can work from a reliable product brief:

- **Product vision:** what the platform does, who it serves, and the value it provides to golf clubs.
- **Requirements:** public website features, CMS features, roles and permissions, and club-specific branding.
- **Launch roadmap:** the implementation roadmap you have already prepared.
- **Figma designs:** links to the relevant files, pages, and components.
- **Existing Claude Project context:** move important instructions and decisions into files in the project repository. Claude Code does not automatically inherit your Claude Project's conversation history, project instructions, or uploaded files.

Do not worry about making every document perfect before starting. The aim is to give Claude Code enough context to identify gaps and ask useful questions.

## 2. Create a private GitHub repository

Create a **private** repository for the project on GitHub. This gives you version history and a place to review changes before they are merged or deployed.

Before committing anything, check that you have not included passwords, API keys, access tokens, production credentials, or other secrets. Add a suitable `.gitignore` file.

If you already have a repository cloned to your computer, use that existing folder rather than creating a second repository.

## 3. Install Claude Code and sign in

Follow the current official setup instructions for your operating system:

- [Claude Code getting started guide](https://docs.anthropic.com/en/docs/claude-code/getting-started)
- [Your first day in Claude Code](https://support.claude.com/en/articles/14552382-your-first-day-in-claude-code)

For a native installation, the official guide currently provides these commands:

**macOS/Linux**
```bash
curl -fsSL https://claude.ai/install.sh | bash
```

**Windows PowerShell**
```powershell
irm https://claude.ai/install.ps1 | iex
```

Follow the official instructions to sign in. Then check the installation:

```bash
claude --version
```

Use the installation method recommended in the official documentation for your system. On Windows, follow its guidance for PowerShell, Git for Windows/Git Bash, or WSL.

## 4. Create a clear project folder structure

A starting structure could look like this:

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
│   ├── delivery/
│   │   └── definition-of-done.md
│   └── golf-platform-claude-code-guide.md
└── .claude/
    └── skills/
```

Save the previously created **Golf Club Platform — Claude Code Guide** Markdown file into `docs/golf-platform-claude-code-guide.md`. Move your roadmap and other existing documents into the appropriate folders, renaming them clearly if needed.

You do not need to create every file immediately. This is a proposed structure, not a requirement to fill every folder on day one.

## 5. Make the initial Git commit

Open a terminal in the project folder. If this is a new local folder that is not already a Git repository, you can run:

```bash
git init
git add .
git status
```

Inspect the files listed by `git status`. **Do not commit if secrets, credentials, private customer data, or files you did not intend to share are included.** Add them to `.gitignore` and remove them from the staging area if necessary.

Once the staged files are safe:

```bash
git commit -m "Initial project documentation"
```

If you cloned an existing GitHub repository, do not run `git init` again. Check `git status` first and follow your existing repository workflow.

## 6. Start Claude Code in the project folder

In your terminal, change to the project folder and start Claude Code:

```bash
cd path/to/golf-platform
claude
```

Replace `path/to/golf-platform` with the actual path to your folder.

For the first session, ask Claude Code to **inspect and plan only**. Do not ask it to build the entire platform immediately.

### First prompt to use

Copy and adapt this prompt:

> I am the product designer and product owner for a productised website and CMS platform for golf clubs. I understand software concepts but cannot code.
>
> Read `CLAUDE.md` and all relevant files in `docs/`. Review the product vision, requirements, roadmap, design references, and the Golf Club Platform Claude Code guide.
>
> For this first task, work in read-only planning mode. Do not edit files, install packages, run migrations, create cloud resources, or deploy anything.
>
> 1. Summarise your understanding of the product and its users.
> 2. List missing information, contradictions, and decisions I need to make.
> 3. Compare a shared multi-tenant application with separate deployments for each golf club. Explain the trade-offs in plain English, including cost, maintenance, security, and future scaling.
> 4. Recommend a provisional technology stack and hosting approach, explaining why and identifying important costs or vendor dependencies.
> 5. Identify the major security and operational risks, especially tenant isolation, authentication, permissions, backups, deployment and recovery.
> 6. Turn my roadmap into small, testable milestones, with acceptance criteria for each.
> 7. Tell me what should be independently reviewed by an experienced developer or security specialist before launch.
>
> Ask me the most important questions before recommending irreversible decisions. Clearly distinguish facts from assumptions. Do not claim that you have tested or verified anything unless you actually have.

Read the response carefully. Ask follow-up questions until you understand the architecture and its trade-offs well enough to approve it.

## 7. Connect Figma to Claude Code

Figma has an official Model Context Protocol (MCP) integration that can help Claude Code inspect design context such as components, variables, and layout information.

Start with the official instructions:

- [Figma: Set up Claude Code and the MCP server](https://help.figma.com/hc/en-us/articles/39888612464151-Claude-Code-and-Figma-Set-up-the-MCP-server)

The plugin installation command may be:

```text
/plugin install figma@claude-plugins-official
```

Follow the current Figma and Claude Code instructions, restart if required, and complete the authorisation flow. Verify that the connection works rather than assuming it does.

Then test it with **one representative Figma component or page**. Ask Claude Code to describe the design details it can actually access and compare those details with your intended implementation. Do not begin by asking it to recreate the whole Figma file.

## 8. Add a small set of reviewed skills and tools

Skills provide reusable instructions and workflows; they do not replace actual tests, security controls, hosting services, or monitoring. Inspect each repository's README, source, permissions, dependencies, and current installation instructions before adding anything.

Possible candidates to evaluate include:

- **Anthropic security guidance plugin:** [Claude Code security guidance](https://github.com/anthropics/claude-code/tree/main/plugins/security-guidance). Check the current official installation instructions; a possible command is `/plugin install security-guidance@claude-plugins-official`.
- **QA skills:** [petrkindlmann/qa-skills](https://github.com/petrkindlmann/qa-skills), a candidate for test strategy, browser testing, accessibility, visual regression, and release readiness. Verify the repository and current install instructions before use.
- **Review and operations skills:** [carlgra/claude-skills](https://github.com/carlgra/claude-skills), a candidate to inspect for code review, architecture, DevOps, and reliability workflows.
- **Playwright:** [playwright.dev](https://playwright.dev/), an automated browser-testing tool, not just a Claude skill.
- **Grafana skills:** [grafana/skills](https://github.com/grafana/skills), worth evaluating if you choose Grafana-based observability.

These are candidates, not endorsements or guarantees. Start with a small set, and do not install a large bundle of unreviewed skills. Exact repository contents and commands can change.

## 9. Create and review `CLAUDE.md`

Run `/init` in Claude Code to generate a starting `CLAUDE.md` if appropriate. Treat its output as a draft that you must review.

Keep this file concise. It should tell Claude Code:

- What the product is and where the detailed requirements live.
- Which documents it must read before significant work.
- To plan first and explain important decisions in plain English.
- To keep changes small and testable.
- To run relevant tests, linting, and type checks when available.
- To never expose secrets or put credentials in source control.
- To enforce server-side tenant isolation and authorisation.
- To never claim a test passed unless it actually ran and passed.
- To avoid production changes, deployments, destructive operations, or paid cloud-resource creation without your explicit approval.

Put detailed requirements in `docs/` rather than making `CLAUDE.md` enormous.

## 10. Approve the architecture before implementation

Before building features, get a written proposal for the application architecture, database, authentication, hosting, deployment workflow, backups, monitoring, and testing approach.

A **shared multi-tenant application** may be a sensible starting point because the platform is intended to serve many clubs using a common product. However, approve it only after comparing the costs and risks against separate deployments.

Tenant isolation is a critical requirement. A logged-in user from Club A must not be able to view or change Club B's pages, users, images, branding, settings, or other data. This needs to be enforced in server-side authorisation and data access—not merely by hiding controls in the interface—and verified with automated tests.

Use established authentication and managed hosting/TLS capabilities where appropriate rather than building your own authentication or certificate-renewal system without a compelling reason.

## 11. Build one complete vertical slice

Do not build every page and feature at once. Start with one small end-to-end workflow, for example:

1. Create a golf club in the platform.
2. Configure its logo and brand colours.
3. Render a public website using the shared template.
4. Sign in as an authorised club editor.
5. Edit a page and publish the change.
6. Verify that a second club cannot access the first club's data or settings.
7. Run automated tests and review the result against Figma.

This proves that the core architecture works before you invest in lots of templates and CMS features.

## 12. Use the same controlled workflow for every feature

For each task:

1. **Plan:** Ask Claude Code to inspect the relevant files and propose a small implementation plan.
2. **Approve:** Review the plan and ask questions about risks or assumptions.
3. **Implement:** Ask it to make only the agreed changes.
4. **Test:** Run the relevant unit, integration, browser, lint, and type checks available in the project.
5. **Review:** Ask for a code review and security-focused review. Treat AI reviews as additional checks, not independent proof that code is safe.
6. **Compare:** Check the interface against Figma, including responsive layouts, accessibility, and realistic content.
7. **Commit:** Review the diff and commit a small, understandable change.
8. **Record:** Update documentation and the roadmap if a decision or requirement changed.

Anthropic's workflow guidance is useful background: [Claude Code best practices](https://www.anthropic.com/engineering/claude-code-best-practices).

## 13. Add production operations as the site becomes runnable

Monitoring and operational services need to run independently of Claude Code. Claude Code can help configure them, but it is not itself an always-on monitoring system.

Before inviting paying clubs, establish:

- **Managed HTTPS/TLS:** Confirm certificates are issued and renewed automatically, and alert on failures.
- **Uptime monitoring:** For example, [Uptime Kuma](https://github.com/louislam/uptime-kuma) or a managed monitoring provider. Configure checks and alerts outside the development environment.
- **Browser-based smoke tests:** Use [Playwright](https://playwright.dev/) for critical journeys such as sign-in, editing, publishing, and public page rendering.
- **Error and performance monitoring:** Capture application errors and slow requests.
- **Backups and recovery:** Automate backups, then test that you can restore them.
- **Safe releases:** Use staging, automated checks, a documented rollback process, and restricted production access.
- **Security checks:** Dependency scanning, secret scanning, static analysis, access-control tests, and an appropriate independent review.
- **Incident response:** Write down how you will detect, investigate, communicate, and recover from an outage or security incident.

Consider deeper observability tooling such as Grafana when the scale and needs of the platform justify it. Avoid adding operational complexity just to have more tools.

## 14. Get an independent review before launch

Before real customers and their data depend on the platform, arrange an experienced developer or security specialist to review at least:

- Tenant isolation and access-control boundaries.
- Authentication, sessions, account recovery, and administrator permissions.
- Database access patterns, migrations, and data exposure risks.
- Secrets and environment configuration.
- Deployment permissions, backups, restoration, and rollback.
- Monitoring, alerting, incident response, and operational ownership.

AI-generated reviews are useful but are not a substitute for this independent assessment.

## Checklist

### Preparation

- [ ] Gather product vision, requirements, roadmap, and Figma links.
- [ ] Move important Claude Project context into project documents.
- [ ] Create a private GitHub repository.
- [ ] Check that no secrets or private customer data are included.

### Project setup

- [ ] Install Claude Code and sign in.
- [ ] Create the initial folder structure.
- [ ] Save the Claude Code guide and existing project documents.
- [ ] Make a safe initial Git commit.
- [ ] Start Claude Code from the project folder.
- [ ] Run a read-only planning session.
- [ ] Connect Figma and test it on one component.
- [ ] Create and review `CLAUDE.md`.
- [ ] Evaluate and install only a small set of reviewed skills.

### Development

- [ ] Approve the architecture and hosting approach.
- [ ] Define tenant isolation and security acceptance tests.
- [ ] Build one end-to-end vertical slice.
- [ ] Set up automated tests and code-quality checks.
- [ ] Use the plan–implement–test–review–commit workflow for each feature.

### Launch readiness

- [ ] Configure managed HTTPS and verify renewal.
- [ ] Configure independent uptime and error monitoring.
- [ ] Add browser-based smoke tests.
- [ ] Automate backups and test restoration.
- [ ] Document deployment and rollback procedures.
- [ ] Complete an independent security and architecture review.
- [ ] Test the critical workflows before onboarding paying clubs.

## The most important principle

**Use Claude Code as a development assistant, not as your only safety net.** Give it clear product context, make architectural decisions deliberately, work in small increments, verify the changes, and use independent automated services and human review for production security and reliability.
