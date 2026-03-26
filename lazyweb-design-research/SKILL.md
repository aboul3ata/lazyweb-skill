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

## CRITICAL: Output Behavior

**This skill produces FILES, not a plan.** Regardless of whether you are in plan mode
or not, ALWAYS:

1. Write the report to `.lazyweb/design-research/{topic}-{date}/report.md`
2. Write the HTML to `.lazyweb/design-research/{topic}-{date}/report.html`
3. Download references to `.lazyweb/design-research/{topic}-{date}/references/`
4. Do NOT write research content into a plan file
5. After saving, show the user a summary of findings and tell them where the files are
6. Ask the user if the research looks good
7. If in plan mode, exit plan mode after the user confirms — the research is done
8. Suggest next steps: "You can now use this research to inform your implementation,
   run `/lazyweb-design-improve` on your current design, or start building."

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

Before searching, verify the CLI is authenticated: `$LAZYWEB_CLI health`

**If the CLI is not found or not configured:**
Tell the user: "Lazyweb CLI is not installed. You can get it at https://lazyweb.com/ —
you'll need a subscription to access the screenshot database. Once purchased, run
`lazyweb auth <your-user-id>` to authenticate."
Then proceed with web research only — the skill still works, just without Lazyweb's database.

**If auth fails (401/403):**
Tell the user: "Your Lazyweb subscription may have expired. Visit https://lazyweb.com/
to renew, then run `lazyweb auth <your-user-id>` to re-authenticate."

## Workflow

### 1. Understand the Research Question

Before searching, clarify:
- What specific screen, flow, or feature are they researching?
- What's their product? (app type, platform, audience)
- Mobile or desktop/web patterns needed?

### 2. Capture Current State (if applicable)

If the user is researching a specific page or app they're building (not a general topic),
capture the current state:

- **Running dev server or URL available:** Use preview/browse tools to screenshot it
- **Mobile app:** Ask user to provide a screenshot
- **No specific page:** Skip this step

Save as `$REPORT_DIR/references/current-state.png` and include it in the report
after the TL;DR as:

```markdown
## Current State
![Current State](references/current-state.png)
*{Brief description of what we're looking at}*
```

This grounds the entire report — the reader sees where we are before seeing where we could go.

### 3. Identify Competitors and Adjacent Companies

Think about two groups:
- **Direct competitors** — apps that solve the same problem
- **Adjacent companies with great design** — apps in related spaces known for excellent UX (e.g., researching a fintech app? Look at Stripe, Linear, Notion for general design quality)

### 4. Search Lazyweb

Run multiple searches with different angles:

```bash
# Search by screen type
$LAZYWEB_CLI search "<specific screen/component>" --limit 30 --json

# Search by competitor
$LAZYWEB_CLI search "<screen type>" --company "<competitor>" --json

# Search with category filter
$LAZYWEB_CLI search "<screen type>" --category "<category>" --json

# Search a specific platform
$LAZYWEB_CLI search "<screen type>" --platform desktop --limit 30 --json
$LAZYWEB_CLI search "<screen type>" --platform mobile --limit 30 --json

# Try alternative framings — explore widely
$LAZYWEB_CLI search "<different description of same thing>" --limit 30 --json
$LAZYWEB_CLI search "<even more specific variant>" --limit 30 --json
```

**Platform routing:** Lazyweb has both mobile app screenshots and desktop/web site screenshots.
- `--platform mobile` — mobile app screenshots only
- `--platform desktop` — desktop/web site screenshots only
- `--platform all` (default) — search both, results grouped desktop-first then mobile
- A mac app, SaaS dashboard, or web product → use `--platform desktop`
- An iPhone/Android app → use `--platform mobile`
- General research or cross-platform → omit (searches both)

Each result includes a `platform` field ("mobile" or "desktop") so you know the source.
Desktop results also include a `pageUrl` field with the original site URL.

**Assess quality:** `matchCount` 2/3 or 3/3 = strong. 1/3 = weak. `similarity` > 0.4 = good.

**Explore generously.** Run 3-5 searches minimum with different query angles. Cast a wide
net — you can filter later. Don't stop at the first search.

**HIGH BAR FOR REFERENCES:** Each Lazyweb result includes a `visionDescription` field —
a text description of what's actually in the screenshot. Read it.

**Rules for attaching references to the report:**
1. Read `visionDescription` before using ANY screenshot
2. The screenshot MUST directly illustrate the point you're making
3. If `visionDescription` doesn't match your suggestion — DO NOT USE IT
4. A report with 3 perfectly-matched references beats 10 loosely-related ones
5. Better to have NO image than a mismatched one — describe the idea in text instead
6. Never guess what's in a screenshot. If there's no visionDescription, skip it.
7. Use `visionDescription` to write accurate captions — don't invent descriptions

Mismatched references destroy user trust faster than anything else.

### 5. Web Research (REQUIRED — not optional)

Lazyweb covers both mobile and desktop screenshots, but most design research also needs
recent trends and expert analysis. **Always do web research alongside Lazyweb**, even
when Lazyweb results are good.

For analysis and expert opinion:
- Search for "[topic] UX best practices"
- Search for "[topic] design patterns analysis"

**Use the browse tool** (if available) to capture additional screenshots of live sites.
Save them to the references folder alongside Lazyweb screenshots.

**Platform balance rule:** Use `--platform desktop` or `--platform mobile` to match the
user's target platform. If the user's product is desktop/web, aim for at least 50%
desktop/web references. If mobile, focus on mobile but still include 2-3 desktop
examples for broader context. Cross-pollination between mobile and desktop is valuable —
mobile patterns often work great on web and vice versa — but the report should reflect
the user's target platform.

### 6. Download References

Determine the absolute path for this report's directory:
```bash
REPORT_DIR="$(pwd)/.lazyweb/design-research/{topic-slug}-{YYYY-MM-DD}"
mkdir -p "$REPORT_DIR/references"
```

For each strong Lazyweb result, download the image:
```bash
curl -sL "{imageUrl}" -o "$REPORT_DIR/references/{company}-{screen-slug}.png"
```

For web-found examples, use the browse tool to screenshot them:
```bash
$B goto <url>
$B screenshot "$REPORT_DIR/references/{company}-{screen-slug}.png"
```

Cap at 30 images total. Name files descriptively: `stripe-pricing-page.png`, `linear-onboarding-step1.png`.

Label each reference with its source in the report: `[Lazyweb]` or `[Web]` so the
user knows the provenance.

### 7. Write the Report

Write to `.lazyweb/design-research/{topic-slug}-{YYYY-MM-DD}/report.md`

**Reverse pyramid structure:** Lead with action, back into analysis. The reader should
get the answer in the first 30 seconds, then optionally dive deeper.

**Skip sections that don't apply.** A narrow question doesn't need all sections. Only include sections where you have real findings.

```markdown
# Design Research: {Topic}

## TL;DR
{2-3 sentences. The single most important finding and what to do about it.}

## Current State
{Include ONLY if a current state screenshot was captured in step 2. Otherwise omit this section.}
![Current State](references/current-state.png)
*{Brief description of what we're looking at}*

## Recommendations / Next Steps
{What to implement, in priority order. Each recommendation tied to evidence below.
This is the ACTION section — specific, implementable guidance.}

1. **{Recommendation}** — {Why, with reference to evidence}
2. **{Recommendation}** — {Why}
3. **{Recommendation}** — {Why}

**ASCII mockups:** For each recommendation, include a rough ASCII wireframe sketch
showing the proposed change. Keep them simple — box-drawing characters, just enough
to communicate the layout idea. Example:

```
┌─────────────────────────────┐
│  Logo            [Sign In]  │
├─────────────────────────────┤
│                             │
│   ┌─────┐ ┌─────┐ ┌─────┐  │
│   │ img │ │ img │ │ img │  │
│   └──┬──┘ └──┬──┘ └──┬──┘  │
│   Plan A   Plan B   Plan C  │
│                             │
│   [Get Started →]           │
└─────────────────────────────┘
```

These sketches help the user visualize the recommendation without needing to
open a design tool. They don't need to be pixel-perfect — just communicative.

## Key Examples
{The visual centerpiece. Screenshot gallery with company, source, and 1-line insight.
Mix of Lazyweb and web-captured screenshots. Label each source.}

![Stripe Pricing](references/stripe-pricing-page.png)
*Stripe — Toggle between monthly/annual, social proof above pricing tiers [Web]*

![Linear Onboarding](references/linear-onboarding.png)
*Linear — Single question per screen, progress bar, minimal UI [Lazyweb]*

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

## Findings
{Deeper analysis of the research. How we arrived at the recommendations above.
What the research reveals about this problem space.}

## Sources
{Compact list. Lazyweb screenshots are cited inline above.
Web sources listed here with URLs.}
```

### 8. Generate HTML Report

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

Tell the user where the report was saved. Mention they may want to add `.lazyweb/` to `.gitignore`.

## Quality Calibration

- Lazyweb screenshots are evidence — you can see what a real app looks like
- Web articles are opinions — filter for quality
- Your synthesis is interpretation — label it as such
- Don't over-index on weak Lazyweb results (matchCount 1/3, similarity < 0.3)
- When the corpus is weak for a topic, say so. Don't pad with irrelevant results.
- A report with 5 strong references beats 20 weak ones
