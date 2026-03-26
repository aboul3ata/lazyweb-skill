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

Before searching, verify the backend: `$LAZYWEB_CLI health`
If down, tell the user and fall back to web research only.

## Workflow

### 1. Search Lazyweb

Run 1-3 searches with different angles:

```bash
$LAZYWEB_CLI search "<query>" --limit 20 --json
$LAZYWEB_CLI search "<alternative framing>" --limit 20 --json
```

**Query tips:**
- Think in concrete UI elements: "pricing page with toggle", "dark mode settings", "onboarding with progress bar"
- Use `--category` for domain filtering: "Health & Fitness", "Finance", "Productivity"
- Use `--company` to find specific apps: `--company "stripe"`
- Use `--fields high_design_bar` to filter for quality

**Assess quality:** `matchCount` 2/3+ = strong. 1/3 = weak. `similarity` > 0.4 = good.

**Route mobile vs desktop:** Lazyweb is primarily mobile screenshots. For desktop/web
requests, supplement with web research.

### 2. Download References

Determine the absolute path for this report's directory:
```bash
REPORT_DIR="$(pwd)/.lazyweb/quick-references/{topic-slug}-{YYYY-MM-DD}"
mkdir -p "$REPORT_DIR/references"
```

Download all results, cap at 20 images:
```bash
curl -sL "{imageUrl}" -o "$REPORT_DIR/references/{company}-{screen}.png"
```

Use relative paths for image references in the report:
`![Alt](references/company-screen.png)`

### 3. Write Reference Document

Write to `.lazyweb/quick-references/{topic-slug}-{YYYY-MM-DD}/report.md`

```markdown
# Quick References: {Topic}

## TL;DR
{1 sentence — what the collection shows}

## References

### Pattern A: {Name}
![Company Screen](references/company-screen.png)
*{Company} — {What this screen shows, 1 line}*

![Company2 Screen](references/company2-screen.png)
*{Company2} — {What this screen shows}*

{What these have in common — 1-2 sentences}

### Pattern B: {Name}
...

## Patterns
{Summary of what the best examples share — the takeaway}
```

Group screenshots by visual or functional pattern. Don't just list them — show what connects them.

### 4. Follow-up Strategies

- **"More like this"** → `$LAZYWEB_CLI similar <screenshot-id> --limit 10 --json`
- **"Same company"** → `$LAZYWEB_CLI search "<query>" --company "<name>" --json`
- **"Different style"** → Rephrase query emphasizing the desired difference
- **"What about competitors?"** → Search for the same screen across different companies

### 5. Generate HTML Report

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

Tell the user where the report was saved.
