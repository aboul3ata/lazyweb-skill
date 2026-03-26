---
name: lazyweb-design-brainstorm
description: |
  Cross-pollination design brainstorm. Deliberately searches outside the obvious category
  to find novel patterns that could be applied in unexpected ways. The "zig when everyone
  zags" skill — finds inspiration from domains nobody in your space is looking at.
  Trigger on: "brainstorm design ideas", "creative alternatives for", "design exploration",
  "what if we tried", "unconventional approach to", "fresh ideas for",
  "think outside the box", "surprise me".
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

# Lazyweb Design Brainstorm

Find novel design patterns by deliberately looking OUTSIDE the obvious category.
If everyone in fintech copies each other's dashboards, look at how gaming apps
handle data visualization. If every productivity app has the same onboarding,
look at how social apps hook new users.

The point is cross-pollination, not conformity.

## When to Use This

- User wants fresh/creative design ideas
- User is tired of seeing the same patterns in their category
- User asks "what if we did something different" or "brainstorm ideas"
- User wants to differentiate their design from competitors

## When NOT to Use This

- User wants to understand standard patterns → use `/lazyweb-design-research`
- User wants quick visual references → use `/lazyweb-quick-references`
- User has an existing design and wants improvements → use `/lazyweb-design-improve`

## CLI Setup

Determine the CLI command. Check in order:
1. `LAZYWEB_CLI` environment variable (if set, use it)
2. `lazyweb` on PATH (try `which lazyweb`)
3. Fall back to `bun run ~/Dropbox/cli-lazyweb/src/index.ts`

Before searching, verify the backend: `$LAZYWEB_CLI health`

## Workflow

### 1. Understand What They're Building

Clarify:
- What's the product? (app type, audience, core value prop)
- What specific screen or flow needs fresh thinking?
- What's the "obvious" approach they want to avoid?

### 2. Map the Obvious Category

First, understand what everyone in the user's space does. Quick search in the obvious category:

```bash
$LAZYWEB_CLI search "<screen type>" --category "<their category>" --limit 10 --json
```

This establishes the baseline — the "zig" that everyone does.

### 3. Search Outside the Category

Now deliberately search in UNRELATED categories for the same screen type.
The more different the category, the more novel the inspiration.

**Category cross-pollination examples:**
- Building a **finance** app? Search in Gaming, Entertainment, Music, Social
- Building a **productivity** tool? Search in Fitness, Food & Drink, Travel, Music
- Building an **e-commerce** app? Search in Education, Health, Social Networking
- Building a **health** app? Search in Gaming, Entertainment, Finance

```bash
# Search for the SAME screen type in DIFFERENT categories
$LAZYWEB_CLI search "<screen type>" --category "Gaming" --limit 10 --json
$LAZYWEB_CLI search "<screen type>" --category "Entertainment" --limit 10 --json
$LAZYWEB_CLI search "<screen type>" --category "Social Networking" --limit 10 --json
```

Also try searching for the underlying FUNCTION rather than the screen name:
- Instead of "dashboard" → search "data visualization with gamification"
- Instead of "onboarding" → search "first-time experience with tutorial"
- Instead of "settings" → search "personalization with preferences"

### 4. Supplement with Web Research

Search for unconventional takes:
- "unconventional [screen type] design"
- "[different industry] approach to [problem]"
- "creative [screen type] examples"

### 5. Download References

Determine the absolute path for this report's directory:
```bash
REPORT_DIR="$(pwd)/.lazyweb/design-brainstorm/{topic-slug}-{YYYY-MM-DD}"
mkdir -p "$REPORT_DIR/references"
```

Download results (cap 20):
```bash
curl -sL "{imageUrl}" -o "$REPORT_DIR/references/{company}-{screen}.png"
```

Use relative paths for image references in the report:
`![Alt](references/company-screen.png)`

### 6. Identify Transferable Patterns

For each cross-category result, ask:
- What pattern is this app using? (not what it looks like, but what it DOES)
- Why does this work in its original context?
- Could this same pattern work in the user's context? How would it need to adapt?
- What makes this a genuine "zag" vs just a random thing from another app?

**Guardrail:** Not everything novel is useful. A gaming leaderboard in a banking app
might be terrible. Filter for ideas where the UNDERLYING PATTERN transfers, even if
the surface aesthetic doesn't.

### 7. Write Brainstorm Document

Write to `.lazyweb/design-brainstorm/{topic-slug}-{YYYY-MM-DD}/report.md`

```markdown
# Design Brainstorm: {Topic}

## TL;DR
{The most provocative transferable idea — 1-2 sentences}

## The Obvious Approach
{What everyone in this category does — the "zig."
Brief, with 1-2 example screenshots from the user's category.}

![Typical Example](references/typical-category-app.png)
*{Company} — the standard approach in {category}*

## Cross-Pollination Ideas

### From {Source Category}: {Company}
![Reference](references/company-screen.png)
*{Company} — {What they do}*

**The Pattern:** {What's the underlying design pattern, abstracted from the specific app}
**Applied Here:** {How this could work in the user's product — be specific}
**Why It's a Zag:** {What makes this different from what everyone else in the category does}

### From {Source Category}: {Company}
...

## Wild Cards
{1-2 ideas that are genuinely unconventional. Might not work but worth
considering. Flag the risk alongside the upside.}

## Which Ideas to Prototype
{Rank ideas by feasibility × novelty. Best brainstorm ideas are
HIGH novelty AND HIGH feasibility — not just weird for weird's sake.}

| Idea | Novelty | Feasibility | Verdict |
|------|---------|-------------|---------|
| {idea} | High/Med/Low | High/Med/Low | Prototype / Explore / Skip |
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

**IMPORTANT:** The markdown report.md should ALSO use relative paths (`references/filename.png`).
The HTML is the primary visual preview — markdown is for reading/editing in editors.

Tell the user where the report was saved.

## Brainstorm Mindset

- The goal is NOVELTY WITH PURPOSE — not random weirdness
- Every idea should have a "why this could work here" explanation
- If an idea is high novelty but low feasibility, flag it as a Wild Card
- The best brainstorms find 1-2 genuinely transferable patterns, not 10 forced ones
- It's OK to say "I didn't find strong cross-pollination opportunities for this screen type" — that's more honest than padding with irrelevant ideas
