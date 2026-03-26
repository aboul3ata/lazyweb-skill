---
name: lazyweb-design-improve
description: |
  Capture a screenshot of the user's current design, find similar screens in Lazyweb,
  and generate concrete improvement ideas backed by real references. Use when the user
  has an existing design and wants feedback or improvement suggestions.
  Trigger on: "improve this design", "how can I make this better", "critique my design",
  "design feedback", "what should I change", "make this look better",
  "compare my design to", "design review".
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

# Lazyweb Design Improve

## CRITICAL: Output Behavior

**This skill produces FILES, not a plan.** Regardless of whether you are in plan mode
or not, ALWAYS:

1. Write the report to `.lazyweb/design-improve/{screen}-{date}/report.md`
2. Write the HTML to `.lazyweb/design-improve/{screen}-{date}/report.html`
3. Download references to `.lazyweb/design-improve/{screen}-{date}/references/`
4. Do NOT write improvement content into a plan file
5. After saving, show the user a summary of improvement ideas and tell them where the files are
6. Ask the user if the improvements look good
7. If in plan mode, exit plan mode after the user confirms
8. Suggest next steps: "You can now implement these improvements, run
   `/lazyweb-design-brainstorm` for more creative ideas, or start building."

---

Capture the current state of a design, find similar screens from the best apps,
and generate 1-5 concrete improvement ideas — each tied to a real reference.

## When to Use This

- User has an existing screen/page and wants to make it better
- User asks "how can I improve this" or "what's wrong with my design"
- User wants to compare their design against competitors

## When NOT to Use This

- User hasn't built anything yet and wants research → use `/lazyweb-design-research`
- User wants to see examples of a specific screen type → use `/lazyweb-quick-references`
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

### 1. Capture the Current Design

Get a screenshot of what the user currently has. Try these approaches in order:

**For web apps (if a dev server is running or URL is available):**
- Use preview tools (preview_start + preview_screenshot) if available
- Use headless browser tools if available
- Navigate to the URL and screenshot it

**For mobile apps:**
- Ask the user to upload a screenshot or provide a file path

**For mockups/designs:**
- Ask the user to provide the image file path

Save the screenshot as `current.png` in the output directory.

If no screenshot can be captured, ask the user to provide one. Don't proceed without a visual of the current state.

### 2. Find Similar Screens in Lazyweb

Use image comparison to find visually similar screens:

```bash
$LAZYWEB_CLI compare <path-to-current-screenshot> --limit 30 --json
```

Also do text searches for the screen type with multiple angles:

```bash
$LAZYWEB_CLI search "<description of the screen>" --limit 30 --json
$LAZYWEB_CLI search "<alternative description>" --limit 30 --json
$LAZYWEB_CLI search "<specific component>" --limit 30 --json
```

If you know the category, filter: `--category "<category>"`

**Explore generously.** Run 3-5 searches to find the best references. More raw material
means better improvement ideas.

**HIGH BAR FOR REFERENCES:** Each Lazyweb result includes a `visionDescription` field —
a text description of what's actually in the screenshot. Read it.

**Rules for attaching references:**
1. Read `visionDescription` before using ANY screenshot
2. The screenshot MUST directly illustrate the improvement you're suggesting
3. If `visionDescription` doesn't match your improvement idea — DO NOT USE IT
4. A report with 3 perfectly-matched references beats 10 loosely-related ones
5. Better to have NO image than a mismatched one — describe the idea with an ASCII sketch instead
6. Never guess what's in a screenshot — use `visionDescription` for captions

Mismatched references destroy user trust faster than anything else.

### 3. Web Research (REQUIRED for balance)

**Always supplement with web research**, especially for desktop/web designs.

- Search for "[screen type] best design examples [current year]"
- Search for "[competitor] [screen type] design"
- Search for "best [screen type] UX"

**Use the browse tool** (if available) to capture screenshots of best-in-class desktop/web
examples. Save them to the references folder.

**Platform balance:** If the user's design is for desktop/web, you MUST include desktop/web
references — don't only show mobile Lazyweb results. Cross-platform inspiration is
valuable (mobile patterns often translate to web beautifully), but the references should
reflect the user's target platform. Aim for at least 50% same-platform references.

### 4. Download References

```bash
REPORT_DIR="$(pwd)/.lazyweb/design-improve/{screen-slug}-{YYYY-MM-DD}"
mkdir -p "$REPORT_DIR/references"
```

Copy the current screenshot:
```bash
cp <current-screenshot> "$REPORT_DIR/references/current.png"
```

Download Lazyweb results (cap 30):
```bash
curl -sL "{imageUrl}" -o "$REPORT_DIR/references/{company}-{screen}.png"
```

For web screenshots:
```bash
$B goto <url>
$B screenshot "$REPORT_DIR/references/{company}-{screen}.png"
```

### 5. Analyze and Generate Ideas

Look at the current design alongside the references. Consider:
- What's the user's product context? (audience, platform, goals)
- What are the references doing that the current design isn't?
- What IS the current design doing well? (don't just criticize)
- What patterns from the references would actually fit this product?

**Key principle:** References are inspiration, not templates. Don't suggest copying a
reference exactly. Identify the PATTERN or IDEA from the reference and explain how it
could be adapted to the user's specific context.

**Be careful with references from very different contexts.** A gaming app's onboarding
won't necessarily work for a finance app. Flag context differences.

Generate 1-5 concrete improvement ideas. Each must be:
- Specific (not "make it cleaner" — what exactly should change?)
- Tied to a reference (which screenshot inspired this idea?)
- Actionable (the user should be able to implement it)

### 6. Write Improvement Report

Write to `.lazyweb/design-improve/{screen-slug}-{YYYY-MM-DD}/report.md`

**Reverse pyramid:** Lead with what to do, then show the evidence.

```markdown
# Design Improvement: {Screen/Feature}

## TL;DR
{The single biggest opportunity — 1-2 sentences}

## Current State
![Current Design](references/current.png)
*{Brief description of what we're looking at}*

## Improvement Ideas

### 1. {Idea Title} ⭐ (highest impact)
{Clear description of what to change and why}

**Inspired by:**
![Reference](references/stripe-pricing.png)
*{Company} — {What they do that inspired this idea} [{Lazyweb|Web}]*

**Why this works:** {What makes this pattern effective in the reference,
and why it would work for the user's product}

**Sketch:**
{ASCII wireframe showing what the improvement would look like}

### 2. {Idea Title}
...

### 3. {Idea Title}
...

## What's Working
{Be specific about what's good. Developers need to know what NOT to change.
List 2-4 concrete things that are done well.}

## All References
{Gallery of all reference screenshots used, with company, source, and context}
```

Label each reference `[Lazyweb]` or `[Web]` for provenance.

**ASCII mockups:** For each improvement idea, include a rough ASCII wireframe sketch
showing what the change would look like. Keep them simple — box-drawing characters,
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

These sketches help the user visualize the improvement without needing to open a
design tool. They don't need to be pixel-perfect — just communicative.

### 7. Generate HTML Report

After writing report.md, generate a `report.html` alongside it for visual preview.
The HTML report should:
- Be a self-contained single HTML file with inline CSS (no external dependencies)
- Use clean, readable styling: system fonts, max-width 900px, comfortable line-height
- Reference images using RELATIVE paths (`references/filename.png`)
- Style images with rounded corners, subtle shadow, max-width that fits the layout
- Use a light blue callout box for the TL;DR section
- Make tables clean with light borders and header background
- Open the HTML file in the user's browser: `open "$REPORT_DIR/report.html"`

Tell the user where the report was saved.

## Important Caveats

- Not every reference is relevant. A high similarity score doesn't mean the pattern applies to the user's context. Use judgment.
- "Improve" doesn't mean "copy the most popular pattern." Sometimes the user's current approach is intentionally different — ask before suggesting radical changes.
- Focus improvement ideas on things that would have the highest impact with the least effort. Lead with the quick wins.
