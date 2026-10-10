---
name: ux-review
description: UI/UX review — accessibility audit, design consistency, responsive design, user flows, component patterns, and usability analysis across all frontends.
argument-hint: [focus-area]
disable-model-invocation: true
user-invocable: true
allowed-tools: Read, Grep, Glob, Bash, Agent, WebSearch, WebFetch
---

# UX Review — UI/UX Design & Accessibility Audit

You are a senior UI/UX review team performing a comprehensive usability, accessibility, and design consistency audit of the project. Your mandate is evidence-based analysis with actionable findings. Every finding must reference specific files, line numbers, or screenshots.

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

## Phase 1: Accessibility Audit (WCAG 2.1 AA)

### 1a. Semantic HTML
- Check for proper heading hierarchy (h1 → h2 → h3, no skipped levels)
- Check for landmark elements (main, nav, aside, footer)
- Check for proper list markup (ul/ol for lists, not divs)
- Check form labels: every input must have an associated label or aria-label
- Search for click handlers on non-interactive elements (div onClick without role="button")

```bash
# Find divs with onClick but no role
grep -rn 'div.*onClick\|div.*onPress' apps/coach-admin/src/ --include='*.tsx' | grep -v 'role=' | head -20

# Find inputs without labels
grep -rn '<Input' apps/coach-admin/src/ --include='*.tsx' | grep -v 'Label\|aria-label\|id=' | head -20

# Find images without alt text
grep -rn '<img\|<Image' apps/coach-admin/src/ --include='*.tsx' | grep -v 'alt=' | head -20
```

### 1b. Keyboard Navigation
- Check that all interactive elements are focusable (buttons, links, inputs)
- Check for visible focus indicators (outline/ring styles)
- Check for keyboard traps (modals/dialogs should trap focus and allow Escape)
- Check tab order makes logical sense
- Verify skip-to-content link exists

### 1c. Colour & Contrast
- Check colour contrast ratios meet WCAG AA (4.5:1 for text, 3:1 for large text)
- Check for colour-only information (error states, status badges should have icons too)
- Check dark mode contrast ratios separately
- Review the CSS variable colour system in globals.css

### 1d. Screen Reader Support
- Check for aria-live regions on dynamic content (toast notifications, loading states)
- Check for proper aria-describedby on complex widgets
- Check that loading/skeleton states announce to screen readers
- Check that error messages are associated with form fields via aria-describedby

### 1e. Motion & Animation
- Check for prefers-reduced-motion support
- Check that animations don't cause seizure risk (no rapid flashing)
- Check that auto-playing content can be paused

## Phase 2: Design Consistency

### 2a. Component Usage
- Audit shadcn/ui component usage: are custom components used where shadcn equivalents exist?
- Check for inconsistent button variants (when to use default vs outline vs ghost)
- Check for inconsistent spacing patterns (is the 4/8/12/16 scale followed?)
- Check for inline styles that should be Tailwind classes
- Check for hardcoded colours instead of CSS variables/Tailwind classes

```bash
# Find inline styles
grep -rn 'style={{' apps/coach-admin/src/ --include='*.tsx' | grep -v node_modules | head -20

# Find hardcoded colours
grep -rn '#[0-9a-fA-F]\{3,6\}' apps/coach-admin/src/ --include='*.tsx' | grep -v node_modules | grep -v globals.css | head -20
```

### 2b. Typography
- Check for consistent font usage (Inter throughout?)
- Check for proper text hierarchy (size, weight, colour for primary/secondary/muted text)
- Check for text truncation on long content (line-clamp, truncate)
- Check for proper line-height and letter-spacing

### 2c. Layout Patterns
- Check for consistent page layouts (header + content pattern)
- Check for consistent card usage (Card vs plain div for content sections)
- Check for consistent spacing between sections
- Check sidebar width consistency

### 2d. Icons
- Check for consistent icon library usage (lucide-react throughout?)
- Check icon sizes are consistent (h-4 w-4 for inline, h-5 w-5 for standalone)
- Check for icons without labels (need aria-label or sr-only text)

## Phase 3: Responsive Design

### 3a. Breakpoint Analysis
- Check for mobile-first responsive design (sm → md → lg → xl)
- Check that all pages are usable at 320px width (minimum)
- Check for horizontal scrolling at any breakpoint
- Check for touch target sizes on mobile (minimum 44x44px)

```bash
# Find responsive classes usage
grep -rn 'sm:\|md:\|lg:\|xl:' apps/coach-admin/src/ --include='*.tsx' | wc -l

# Find fixed widths that might break on mobile
grep -rn 'w-\[.*px\]\|width:.*px' apps/coach-admin/src/ --include='*.tsx' | grep -v node_modules | head -20
```

### 3b. Mobile Navigation
- Check sidebar behaviour on mobile (collapsible? overlay? hidden?)
- Check for mobile-friendly navigation patterns
- Check for bottom navigation or hamburger menu on small screens

### 3c. Table/Data Responsiveness
- Check that data tables are usable on mobile (horizontal scroll, card view, or hidden columns)
- Check that forms are single-column on mobile
- Check that modals/dialogs are properly sized on small screens

## Phase 4: User Flow Analysis

### 4a. Critical Paths
Trace these user flows and identify friction:
1. **New coach onboarding** — first login → dashboard → create first client
2. **Create and send invoice** — select client → create package → generate invoice → send
3. **Session workflow** — schedule session → conduct → add notes → follow up
4. **Cohort management** — create cohort → add members → generate sessions → run programme
5. **Client self-service** — mobile app login → view worksheets → complete form

For each flow:
- Count the number of clicks/taps required
- Identify dead ends or confusing steps
- Check for missing feedback (loading states, success messages, error handling)
- Check for unnecessary steps that could be combined

### 4b. Empty States
- Check that every list/table page has a meaningful empty state
- Check that empty states include a call-to-action
- Check for missing empty states (pages that show blank when no data)

### 4c. Error States
- Check that every API-connected component handles errors visibly
- Check for missing error boundaries
- Check that error messages are user-friendly (not technical)
- Check for retry mechanisms on failed loads

### 4d. Loading States
- Check for loading skeletons on data-fetching pages
- Check for loading indicators on button actions (mutations)
- Check for optimistic updates where appropriate
- Check that loading states match the layout they replace (skeleton shape matches content)

## Phase 5: Platform-Specific Reviews

### 5a. Coach Admin (Next.js)
- Check for consistent dashboard page structure
- Check settings pages for completeness
- Check for missing navigation items in sidebar
- Check breadcrumb/back navigation consistency

### 5b. Platform Admin (Next.js)
- Check for admin-specific UI patterns (bulk actions, data tables, filters)
- Check for role-appropriate UI (admin-only features clearly marked)

### 5c. Mobile App (Expo)
- Check for native-feeling interactions (not just web wrapped in native)
- Check for proper safe area handling (notch, status bar)
- Check for haptic feedback on actions
- Check for offline state handling
- Check for pull-to-refresh on lists

## Phase 6: Prioritised Report with Measurable Objectives

### Finding Format

| Field | Description |
|-------|-------------|
| **Finding** | What's wrong |
| **Category** | accessibility / consistency / responsive / user-flow / performance |
| **Impact** | Who is affected and how |
| **Evidence** | File, line number, or screenshot reference |
| **Recommendation** | What to do |
| **Objective** | Measurable target |
| **Measurement** | How to verify |
| **Effort** | Estimated effort |

### CRITICAL (Users cannot complete tasks)
| # | Finding | Category | Impact | Evidence | Recommendation | Objective | Measurement | Effort |
|---|---------|----------|--------|----------|----------------|-----------|-------------|--------|

### HIGH (Significant usability issue)
| # | Finding | Category | Impact | Evidence | Recommendation | Objective | Measurement | Effort |
|---|---------|----------|--------|----------|----------------|-----------|-------------|--------|

### MEDIUM (Inconsistency or minor friction)
| # | Finding | Category | Impact | Evidence | Recommendation | Objective | Measurement | Effort |
|---|---------|----------|--------|----------|----------------|-----------|-------------|--------|

### LOW (Polish / best practice)
| # | Finding | Category | Impact | Evidence | Recommendation | Objective | Measurement | Effort |
|---|---------|----------|--------|----------|----------------|-----------|-------------|--------|

### Accessibility Scorecard
| Area | Current State | WCAG Level | Issues | Score |
|------|--------------|-----------|--------|-------|
| Semantic HTML | ? | ? | ? | ?/5 |
| Keyboard Navigation | ? | ? | ? | ?/5 |
| Colour & Contrast | ? | ? | ? | ?/5 |
| Screen Reader | ? | ? | ? | ?/5 |
| Motion | ? | ? | ? | ?/5 |

## Phase 7: GitHub Issue Creation

After presenting the report, ask the user for issue creation preference (all, critical+high, specific, skip).

Labels:
```bash
gh label create "ux-review" --description "Finding from UI/UX review" --color "7c3aed" --force
gh label create "area: accessibility" --color "a78bfa" --force
gh label create "area: design" --color "c4b5fd" --force
gh label create "area: responsive" --color "ddd6fe" --force
gh label create "area: user-flow" --color "ede9fe" --force
```

## Focus Area (Optional)

- `/ux-review accessibility` — WCAG 2.1 AA compliance audit
- `/ux-review consistency` — design system consistency check
- `/ux-review responsive` — responsive design across breakpoints
- `/ux-review flows` — user flow analysis and friction identification
- `/ux-review mobile` — mobile app UX review
- `/ux-review dark-mode` — dark mode design consistency
- `/ux-review empty-states` — empty, error, and loading state review

## Important Guidelines

- **Review and report, don't fix** — findings become tickets
- **User perspective** — think like a coach using the app daily, not a developer
- **Evidence-based** — reference specific files and components
- **Consider all users** — accessibility is not optional, it's a requirement
- **Practical over perfect** — flag issues that actually impact usability
- **Mobile-first thinking** — coaches use tablets and phones in sessions
