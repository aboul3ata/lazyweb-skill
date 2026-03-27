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
$LAZYWEB_CLI search "<more specific variant>" --platform desktop --limit 30 --json
```

**Query tips:**
- Think in concrete UI elements: "pricing page with toggle", "dark mode settings", "onboarding with progress bar"
- Use `--category` for domain filtering: "Health & Fitness", "Finance", "Productivity"
- Use `--company` to find specific apps: `--company "stripe"`
- Use `--fields high_design_bar` to filter for quality

**Platform routing:** Lazyweb has both mobile app screenshots and desktop/web site screenshots.
- `--platform mobile` — mobile app screenshots only
- `--platform desktop` — desktop/web site screenshots only
- `--platform all` (default) — search both, results grouped desktop-first then mobile
- A mac app, SaaS dashboard, or web product → use `--platform desktop`
- An iPhone/Android app → use `--platform mobile`
- General research or cross-platform → omit (searches both)

Each result includes a `platform` field ("mobile" or "desktop") so you know the source.
Desktop results also include a `pageUrl` field with the original site URL.

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

### 3. Search Connected Inspiration Libraries

Check if `~/.lazyweb/libraries.json` exists and has connected libraries:

```bash
cat ~/.lazyweb/libraries.json 2>/dev/null
```

If libraries are configured, search each one using the browse tool. For each library:

1. Navigate to the library's search URL: `$LB goto "{searchUrl}"`
2. Take a snapshot to understand the page: `$LB snapshot -i`
3. Search for the topic: `$LB fill @eN "{query}"`
4. Submit and wait for results: `$LB press Enter` then `$LB snapshot -i`
5. Browse through results — screenshot the most relevant ones
6. Save to: `$LB screenshot "$REPORT_DIR/references/{library}-{company}-{screen}.png"`

**Keep it fast**: This is the quick-references skill. Don't deep-dive into every result.
Grab the best 3-5 screenshots per library and move on.

**If the library session has expired** (login wall, redirect to sign-in):
- Tell the user: "Your {library} session has expired. Run `/lazyweb-add-inspo-source` to reconnect."
- Skip this library and continue with other sources.

Label all library-sourced references: `[Mobbin]`, `[Savee]`, etc.

### 4. Web Research + Live Screenshot Capture

**Always supplement** Lazyweb with live web captures for the most current examples.

**Step A — Find URLs via WebSearch:**
- Search for "[screen type] design examples [current year]"
- Search for "[competitor] [screen type]"
Collect 2-5 interesting URLs.

**Step B — Capture live screenshots:**
```bash
if [ -x "$LB" ]; then
  $LB goto "https://example.com/page"
  $LB screenshot "$REPORT_DIR/references/example-page.png"
fi
```

If the browse tool is not available, describe web examples in the report without images.

**Platform balance:** Aim for at least 50% same-platform references.

### 5. Download References

```bash
REPORT_DIR="$(pwd)/.lazyweb/quick-references/{topic-slug}-{YYYY-MM-DD}"
mkdir -p "$REPORT_DIR/references"
```

Download Lazyweb results, cap at 30 images:
```bash
curl -sL "{imageUrl}" -o "$REPORT_DIR/references/{company}-{screen}.png"
```

For web-captured examples:
```bash
if [ -x "$LB" ]; then
  $LB goto "https://example.com"
  $LB screenshot "$REPORT_DIR/references/{company}-{screen}.png"
fi
```

### 6. Write Reference Document

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

### 7. Generate HTML Report

After writing report.md, generate a `report.html` alongside it for visual preview.
The HTML report should:
- Be a self-contained single HTML file with inline CSS (no external dependencies)
- Use clean, readable styling: system fonts, max-width 900px, comfortable line-height
- Reference images using RELATIVE paths (`references/filename.png`)
- Style images with rounded corners, subtle shadow, max-width that fits the layout
- Use a light blue callout box for the TL;DR section
- Open the HTML file in the user's browser: `open "$REPORT_DIR/report.html"`

Tell the user where the report was saved.

### 8. Follow-up Strategies

- **"More like this"** → `$LAZYWEB_CLI similar <screenshot-id> --limit 10 --json`
- **"Same company"** → `$LAZYWEB_CLI search "<query>" --company "<name>" --json`
- **"Different style"** → Rephrase query emphasizing the desired difference
- **"What about competitors?"** → Search for the same screen across different companies
