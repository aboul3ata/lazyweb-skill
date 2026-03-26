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

Before searching, verify the backend: `$LAZYWEB_CLI health`

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
$LAZYWEB_CLI compare <path-to-current-screenshot> --limit 20 --json
```

Also do a text search for the screen type:

```bash
$LAZYWEB_CLI search "<description of the screen>" --limit 20 --json
```

If you know the category, filter: `--category "<category>"`

### 3. Supplement with Web Research

Search for best-in-class examples of this screen type:
- "[screen type] best design examples [current year]"
- "[competitor] [screen type] design"

### 4. Download References

Determine the absolute path for this report's directory:
```bash
REPORT_DIR="$(pwd)/.lazyweb/design-improve/{screen-slug}-{YYYY-MM-DD}"
mkdir -p "$REPORT_DIR/references"
```

Copy the current screenshot:
```bash
cp <current-screenshot> "$REPORT_DIR/references/current.png"
```

Download Lazyweb results (cap 20):
```bash
curl -sL "{imageUrl}" -o "$REPORT_DIR/references/{company}-{screen}.png"
```

**IMPORTANT:** When writing image references in the report, always use ABSOLUTE paths
so they render in any markdown viewer (VS Code, GitHub, etc.):
`![Alt]($REPORT_DIR/references/company-screen.png)` — NOT relative `references/` paths.

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

```markdown
# Design Improvement: {Screen/Feature}

## TL;DR
{The single biggest opportunity — 1-2 sentences}

## Current State
![Current Design](/absolute/path/to/references/current.png)

## What's Working
{Be specific about what's good. Developers need to know what NOT to change.
List 2-4 concrete things that are done well.}

## Improvement Ideas

### 1. {Idea Title}
{Clear description of what to change and why}

**Inspired by:**
![Reference](/absolute/path/to/references/stripe-pricing.png)
*{Company} — {What they do that inspired this idea}*

**Why this works:** {What makes this pattern effective in the reference,
and why it would work for the user's product}

### 2. {Idea Title}
...

### 3. {Idea Title}
...

## References
{Gallery of all reference screenshots used, with company and context}
```

Tell the user where the report was saved.

## Important Caveats

- Not every reference is relevant. A high similarity score doesn't mean the pattern applies to the user's context. Use judgment.
- "Improve" doesn't mean "copy the most popular pattern." Sometimes the user's current approach is intentionally different — ask before suggesting radical changes.
- Focus improvement ideas on things that would have the highest impact with the least effort. Lead with the quick wins.
