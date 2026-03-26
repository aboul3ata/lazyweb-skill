---
name: lazyweb-design-research
description: |
  Deep design research combining Lazyweb's screenshot database with web research.
  Produces a structured research report with downloaded reference screenshots.
  Use when the user needs competitive analysis, best practices research, or wants
  to understand how the best apps handle a specific design problem.
  Trigger on: "best practices for", "how should I design", "what do top apps do",
  "competitive analysis for", "design research on", "what works well for",
  "research how others do".
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
  - Grep
  - WebSearch
  - AskUserQuestion
  - Agent
---

# Lazyweb Design Research

Structured design research that identifies competitors, gathers real app screenshots,
and produces a report with downloaded visual references.

## When to Use This

- User wants to understand a design space before building
- User needs competitive analysis for a feature
- User asks "what are best practices for X"
- User wants to see how the best apps solve a specific problem

## When NOT to Use This

- User just wants to see a few screenshots quickly → use `/lazyweb-quick-references`
- User has an existing design and wants improvement ideas → use `/lazyweb-design-improve`
- User wants creative/unconventional ideas → use `/lazyweb-design-brainstorm`

## CLI Setup

Determine the CLI command. Check in order:
1. `LAZYWEB_CLI` environment variable (if set, use it)
2. `lazyweb` on PATH (try `which lazyweb`)
3. Fall back to `bun run ~/Dropbox/cli-lazyweb/src/index.ts`

Before searching, verify the backend: `$LAZYWEB_CLI health`
If down, tell the user and proceed with web research only.

## Workflow

### 1. Understand the Research Question

Before searching, clarify:
- What specific screen, flow, or feature are they researching?
- What's their product? (app type, platform, audience)
- Mobile or desktop/web patterns needed?

### 2. Identify Competitors and Adjacent Companies

Think about two groups:
- **Direct competitors** — apps that solve the same problem
- **Adjacent companies with great design** — apps in related spaces known for excellent UX (e.g., researching a fintech app? Look at Stripe, Linear, Notion for general design quality)

### 3. Search Lazyweb

Run multiple searches with different angles:

```bash
# Search by screen type
$LAZYWEB_CLI search "<specific screen/component>" --limit 20 --json

# Search by competitor
$LAZYWEB_CLI search "<screen type>" --company "<competitor>" --json

# Search with category filter
$LAZYWEB_CLI search "<screen type>" --category "<category>" --json

# Try alternative framings
$LAZYWEB_CLI search "<different description of same thing>" --limit 20 --json
```

**Assess quality:** `matchCount` 2/3 or 3/3 = strong. 1/3 = weak. `similarity` > 0.4 = good.

### 4. Supplement with Web Research

For gaps — especially desktop/web designs, recent apps, or niche categories:
- Search for "[screen type] design patterns [current year]"
- Search for "[competitor] [feature] UX"
- Look for curated design galleries and blog analyses

### 5. Download References

Determine the absolute path for this report's directory:
```bash
REPORT_DIR="$(pwd)/.lazyweb/design-research/{topic-slug}-{YYYY-MM-DD}"
mkdir -p "$REPORT_DIR/references"
```

For each strong Lazyweb result, download the image:
```bash
curl -sL "{imageUrl}" -o "$REPORT_DIR/references/{company}-{screen-slug}.png"
```

Cap at 20 images total. Name files descriptively: `stripe-pricing-page.png`, `linear-onboarding-step1.png`.

For web-found examples, use the browse tool or screenshot tools if available to capture them. If not available, describe them in the report and note they couldn't be captured locally.

Use relative paths for image references in the report:
`![Alt](references/company-screen.png)`

### 6. Write the Report

Write to `.lazyweb/design-research/{topic-slug}-{YYYY-MM-DD}/report.md`

**Skip sections that don't apply.** A narrow question doesn't need all 7 sections. Only include sections where you have real findings.

```markdown
# Design Research: {Topic}

## TL;DR
{2-3 sentences. The most important finding. What should the user take away?}

## Examples
{Screenshot gallery — the visual centerpiece of the report.
Each with company name, inline image, and 1-line description.}

![Stripe Pricing](references/stripe-pricing-page.png)
*Stripe — Toggle between monthly/annual, social proof above pricing tiers*

![Linear Onboarding](references/linear-onboarding.png)
*Linear — Single question per screen, progress bar, minimal UI*

## Findings
{What the research reveals about this problem space.
Key observations, not just descriptions of screenshots.}

## Patterns
{Common denominators — things the best examples share.
These are the "table stakes" for this design problem.}

## Anti-Patterns
{What to avoid. Things that feel dated, confusing, or broken.
Specific examples from the research, not generic advice.}

## Unique Angles
{The standout approaches. NOT the common pattern — the thing that
ONE company does that made you stop and look twice. The X100 detail.
Could be a micro-interaction, an unusual layout, a clever copy choice.}

## Recommendations / Next Steps
{Actionable guidance tied to the user's specific context.
What should they do with this research?}

## Sources
{Compact list. Lazyweb screenshots are cited inline above.
Web sources listed here.}
```

### 7. Generate HTML Report

After writing report.md, generate a `report.html` alongside it for visual preview.
The HTML report should:
- Be a self-contained single HTML file with inline CSS (no external dependencies)
- Use clean, readable styling: system fonts, max-width 900px, comfortable line-height
- Reference images using RELATIVE paths (`references/filename.png`) — HTML files loaded
  in a browser resolve relative paths correctly from their own directory
- Style images with rounded corners, subtle shadow, max-width that fits the layout
- Use a light blue callout box for the TL;DR section
- Include proper semantic HTML (h1, h2, h3, p, ul, ol, table)
- Make tables clean with light borders and header background
- Open the HTML file in the user's browser: `open "$REPORT_DIR/report.html"`

**IMPORTANT:** The markdown report.md should ALSO use relative paths (`references/filename.png`).
The HTML is the primary visual preview — markdown is for reading/editing in editors.

Tell the user where the report was saved. Mention they may want to add `.lazyweb/` to `.gitignore`.

## Quality Calibration

- Lazyweb screenshots are evidence — you can see what a real app looks like
- Web articles are opinions — filter for quality
- Your synthesis is interpretation — label it as such
- Don't over-index on weak Lazyweb results (matchCount 1/3, similarity < 0.3)
- When the corpus is weak for a topic, say so. Don't pad with irrelevant results.
