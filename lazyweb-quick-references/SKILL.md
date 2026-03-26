---
name: lazyweb-quick-references
description: |
  Find app screenshots and UI references quickly. Downloads results locally and
  groups them by pattern. Use when the user wants to see examples of a specific
  screen, UI element, or flow without a full research report.
  Trigger on: "show me examples of", "how do other apps do", "design inspiration for",
  "UI reference for", "what does X's app look like", "find screenshots of",
  "show me how", "references for".
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

# Lazyweb Quick References

Find real app screenshots fast, download them locally, and group by pattern.
Lighter than design-research — no competitive analysis, no anti-patterns. Just find → group → show.

## CRITICAL: Output Behavior

**This skill produces FILES, not a plan.** Regardless of whether you are in plan mode
or not, ALWAYS:

1. Write the report to `.lazyweb/quick-references/{topic}-{date}/report.md`
2. Write the HTML to `.lazyweb/quick-references/{topic}-{date}/report.html`
3. Download references to `.lazyweb/quick-references/{topic}-{date}/references/`
4. Do NOT write research content into a plan file
5. After saving, show the user a summary and tell them where the files are
6. Ask the user if the references look good
7. If in plan mode, exit plan mode after the user confirms
8. Suggest next steps: "You can now use these references to inform your design,
   run `/lazyweb-design-research` for deeper analysis, or start building."

## When to Use This

- User wants to see a specific type of screen ("show me pricing pages")
- User wants visual references for what they're building
- User asks "what does X look like" or "how do other apps do Y"

## When NOT to Use This

- User wants deep analysis, competitive research, or best practices → use `/lazyweb-design-research`
- User has an existing design and wants feedback → use `/lazyweb-design-improve`
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
Then proceed with web research only.

**If auth fails (401/403):**
Tell the user: "Your Lazyweb subscription may have expired. Visit https://lazyweb.com/
to renew, then run `lazyweb auth <your-user-id>` to re-authenticate."

## Workflow

### 1. Capture Current State (if applicable)

If the user is looking for references for a specific page or app they're building
(not a general topic), capture the current state:

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

This grounds the collection — the reader sees what they have before seeing the references.

### 2. Search Lazyweb

Run 2-4 searches with different angles:

```bash
$LAZYWEB_CLI search "<query>" --limit 30 --json
$LAZYWEB_CLI search "<alternative framing>" --limit 30 --json
$LAZYWEB_CLI search "<more specific variant>" --limit 30 --json
```

**Query tips:**
- Think in concrete UI elements: "pricing page with toggle", "dark mode settings", "onboarding with progress bar"
- Use `--category` for domain filtering: "Health & Fitness", "Finance", "Productivity"
- Use `--company` to find specific apps: `--company "stripe"`
- Use `--fields high_design_bar` to filter for quality

**Assess quality:** `matchCount` 2/3+ = strong. 1/3 = weak. `similarity` > 0.4 = good.

**Explore generously.** Don't stop at one search. Try 2-4 different phrasings to
cast a wide net. More raw material = better grouping.

**HIGH BAR FOR REFERENCES:** Each Lazyweb result includes a `visionDescription` field —
a text description of what's actually in the screenshot. Read it.

**Rules for attaching references:**
1. Read `visionDescription` before using ANY screenshot
2. The screenshot MUST directly illustrate the pattern you're grouping it under
3. If `visionDescription` doesn't match — DO NOT USE IT
4. Better to have fewer, perfectly-matched references than many loose ones
5. Never guess what's in a screenshot — use `visionDescription` for captions
6. If there's no visionDescription, skip the screenshot

Mismatched references destroy user trust faster than anything else.

### 3. Supplement with Web Research

**Always supplement**, especially for desktop/web requests. Lazyweb is primarily mobile.

- Use the browse tool (if available) to capture screenshots of desktop/web examples
- Search for "[screen type] design examples [current year]"

**Platform balance:** If the user is building for desktop/web, aim for at least 50%
desktop/web references. Cross-platform inspiration is great (mobile → web transfers
well) but the collection should reflect their target platform.

### 4. Download References

```bash
REPORT_DIR="$(pwd)/.lazyweb/quick-references/{topic-slug}-{YYYY-MM-DD}"
mkdir -p "$REPORT_DIR/references"
```

Download all results, cap at 30 images:
```bash
curl -sL "{imageUrl}" -o "$REPORT_DIR/references/{company}-{screen}.png"
```

For web screenshots:
```bash
$B goto <url>
$B screenshot "$REPORT_DIR/references/{company}-{screen}.png"
```

### 5. Write Reference Document

Write to `.lazyweb/quick-references/{topic-slug}-{YYYY-MM-DD}/report.md`

**Reverse pyramid:** Lead with the patterns (the answer), then show the evidence.

```markdown
# Quick References: {Topic}

## TL;DR
{1 sentence — what the collection shows and the dominant pattern}

## Current State
{Include ONLY if a current state screenshot was captured in step 1. Otherwise omit this section.}
![Current State](references/current-state.png)
*{Brief description of what we're looking at}*

## Patterns
{What the best examples have in common — the key takeaway.
Put this FIRST so the user gets the answer immediately.}

## References

### Pattern A: {Name}
![Company Screen](references/company-screen.png)
*{Company} — {What this screen shows, 1 line} [{Lazyweb|Web}]*

![Company2 Screen](references/company2-screen.png)
*{Company2} — {What this screen shows} [{Lazyweb|Web}]*

{What these have in common — 1-2 sentences}

### Pattern B: {Name}
...
```

Group screenshots by visual or functional pattern. Don't just list them — show what connects them.
Label each reference `[Lazyweb]` or `[Web]` for provenance.

**ASCII mockups:** When describing patterns or suggesting how references apply to the user's
project, include rough ASCII wireframe sketches. Keep them simple — box-drawing characters,
just enough to communicate the layout idea. Example:

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

These sketches help the user visualize how a pattern could apply to their work
without needing to open a design tool. They don't need to be pixel-perfect — just communicative.

### 6. Generate HTML Report

After writing report.md, generate a `report.html` alongside it for visual preview.
The HTML report should:
- Be a self-contained single HTML file with inline CSS (no external dependencies)
- Use clean, readable styling: system fonts, max-width 900px, comfortable line-height
- Reference images using RELATIVE paths (`references/filename.png`)
- Style images with rounded corners, subtle shadow, max-width that fits the layout
- Use a light blue callout box for the TL;DR section
- Open the HTML file in the user's browser: `open "$REPORT_DIR/report.html"`

Tell the user where the report was saved.

### 7. Follow-up Strategies

- **"More like this"** → `$LAZYWEB_CLI similar <screenshot-id> --limit 10 --json`
- **"Same company"** → `$LAZYWEB_CLI search "<query>" --company "<name>" --json`
- **"Different style"** → Rephrase query emphasizing the desired difference
- **"What about competitors?"** → Search for the same screen across different companies
