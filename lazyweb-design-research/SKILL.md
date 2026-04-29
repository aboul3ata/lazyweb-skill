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

## Lazyweb MCP Setup

Use the hosted Lazyweb MCP tools for all Lazyweb database access.

Required MCP tools:
- `lazyweb_search` — text search over mobile and desktop screenshots
- `lazyweb_find_similar` — more results like a known Lazyweb screenshot ID
- `lazyweb_compare_image` — visual search from `image_base64` + `mime_type` or `image_url`
- `lazyweb_health` — connectivity check

Before searching, verify MCP is available by listing tools and running
`lazyweb_health`.

**If Lazyweb MCP is not installed or auth fails:**
Tell the user: "Lazyweb MCP is not installed. Enable the global Lazyweb plugin or
get the free one-line install prompt at https://lazyweb.com/#pricing, paste it
into this agent, then rerun this skill."
Then proceed with web research only — the skill still works, just without Lazyweb's database.

## Browse Setup (run BEFORE any web capture)

```bash
LB=""
# Check lazyweb-skill browse first
for _P in "$(pwd)/.claude/skills/lazyweb-skill/browse/dist/browse" ~/.claude/skills/lazyweb-skill/browse/dist/browse; do
  [ -x "$_P" ] && LB="$_P" && break
done
# Fall back to gstack browse
if [ -z "$LB" ]; then
  _ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
  [ -n "$_ROOT" ] && [ -x "$_ROOT/.claude/skills/gstack/browse/dist/browse" ] && LB="$_ROOT/.claude/skills/gstack/browse/dist/browse"
  [ -z "$LB" ] && [ -x ~/.claude/skills/gstack/browse/dist/browse ] && LB=~/.claude/skills/gstack/browse/dist/browse
fi
[ -x "$LB" ] && echo "BROWSE_READY: $LB" || echo "NO_BROWSE"
```

If `NO_BROWSE`: Web screenshot capture is unavailable. Lazyweb results still work —
just describe web examples in text without screenshots. To enable web captures,
run: `cd ~/.claude/skills/lazyweb-skill/browse && ./setup`

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

Call `lazyweb_search` multiple times with different angles:

```json
{"query":"<specific screen/component>","limit":30}
{"query":"<screen type>","company":"<competitor>","limit":30}
{"query":"<screen type>","category":"<category>","limit":30}
{"query":"<screen type>","platform":"desktop","limit":30}
{"query":"<screen type>","platform":"mobile","limit":30}
{"query":"<different description of same thing>","limit":30}
{"query":"<even more specific variant>","limit":30}
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

### 5. Search Connected Inspiration Libraries

Check if `~/.lazyweb/libraries.json` exists and has connected libraries:

```bash
cat ~/.lazyweb/libraries.json 2>/dev/null
```

If libraries are configured, search each one using the browse tool. For each library:

1. Navigate to the library's search URL: `$LB goto "{searchUrl}"`
2. Take a snapshot to understand the page: `$LB snapshot -i`
3. Find the search input and type the research query: `$LB fill @eN "{query}"`
4. Submit and wait for results: `$LB press Enter` then `$LB snapshot -i`
5. Browse through results — click into the most relevant ones
6. Screenshot the best results: `$LB screenshot "$REPORT_DIR/references/{library}-{company}-{screen}.png"`
7. Note what's in each screenshot for accurate captions

**Quality bar**: Same as Lazyweb — only use screenshots that directly illustrate a point
in the report. A mismatched reference from Mobbin is just as bad as a mismatched one
from Lazyweb.

**If the library session has expired** (login wall, redirect to sign-in):
- Tell the user: "Your {library} session has expired. Run `/lazyweb-add-inspo-source` to reconnect."
- Skip this library and continue with the rest — don't block the research.

Label all library-sourced references in the report with the library name: `[Mobbin]`, `[Savee]`, etc.

### 6. Web Research + Live Screenshot Capture (REQUIRED)

Lazyweb covers both mobile and desktop, but most research also needs recent trends,
expert analysis, and live examples from competitors. **Always do web research alongside
Lazyweb**, even when Lazyweb results are good.

**Step A — Find interesting URLs via WebSearch:**
- Search for "[topic] UX best practices [current year]"
- Search for "[topic] design patterns analysis"
- Search for "[competitor name] [screen type]"
- Search for "best [screen type] examples"

Collect 3-8 interesting URLs from the search results.

**Step B — Capture live screenshots from those URLs:**
For each interesting URL found in step A, visit the page and screenshot it.
Save directly to the report's references folder.

```bash
if [ -x "$LB" ]; then
  $LB goto "https://example.com/pricing"
  $LB screenshot "$REPORT_DIR/references/example-pricing-page.png"
fi
```

If the browse tool is not available, use `curl` to download any publicly accessible
screenshot URLs you find, or describe the page in the report without an image.

**This is not optional.** The report should have a MIX of Lazyweb database screenshots
AND live web captures. Lazyweb gives you curated, clean screenshots. Web captures give
you the latest, most current state of competitor sites.

**Platform balance rule:** Use `--platform desktop` or `--platform mobile` to match the
user's target platform. Aim for at least 50% same-platform references.

### 7. Download References

Determine the absolute path for this report's directory:
```bash
REPORT_DIR="$(pwd)/.lazyweb/design-research/{topic-slug}-{YYYY-MM-DD}"
mkdir -p "$REPORT_DIR/references"
```

For each strong Lazyweb result, download the image:
```bash
curl -sL "{imageUrl}" -o "$REPORT_DIR/references/{company}-{screen-slug}.png"
```

For web-captured examples (from step 5B):
```bash
if [ -x "$LB" ]; then
  $LB goto "https://example.com"
  $LB screenshot "$REPORT_DIR/references/{company}-{screen-slug}.png"
fi
```

Cap at 30 images total. Name files descriptively: `stripe-pricing-page.png`, `linear-onboarding-step1.png`.

Label each reference with its source in the report: `[Lazyweb]` or `[Web]` so the
user knows the provenance.

### 8. Write the Report

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

### 9. Generate HTML Report

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
