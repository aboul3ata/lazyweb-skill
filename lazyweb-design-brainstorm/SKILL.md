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

Before searching, verify the CLI is authenticated: `$LAZYWEB_CLI health`

**If the CLI is not found or not configured:**
Tell the user: "Lazyweb CLI is not installed. You can get it at https://lazyweb.com/ —
you'll need a subscription to access the screenshot database. Once purchased, run
`lazyweb auth <your-user-id>` to authenticate."
Then proceed with web research only — the brainstorm still works, just with web examples.

**If auth fails (401/403):**
Tell the user: "Your Lazyweb subscription may have expired. Visit https://lazyweb.com/
to renew, then run `lazyweb auth <your-user-id>` to re-authenticate."

## Workflow

### 1. Understand What They're Building

Clarify:
- What's the product? (app type, audience, core value prop)
- What specific screen or flow needs fresh thinking?
- What's the "obvious" approach they want to avoid?
- **Mobile or desktop/web?** This determines the reference balance.

### 2. Capture Current State (if applicable)

If the user is brainstorming for a specific page or app they're building,
capture the current state:

- **Running dev server or URL available:** Use preview/browse tools to screenshot it
- **Mobile app:** Ask user to provide a screenshot
- **No specific page yet:** Skip this step

Save as `$REPORT_DIR/references/current-state.png` and include it in the report
after the TL;DR as:

```markdown
## Current State
![Current State](references/current-state.png)
*{Brief description of what we're looking at}*
```

This grounds the brainstorm — the reader sees where we are before seeing where we could go.

### 3. Map the Obvious Category

First, understand what everyone in the user's space does. Quick search in the obvious category:

```bash
$LAZYWEB_CLI search "<screen type>" --category "<their category>" --limit 10 --json
```

This establishes the baseline — the "zig" that everyone does.

### 4. Search Outside the Category

Now deliberately search in UNRELATED categories for the same screen type.
The more different the category, the more novel the inspiration.

**Category cross-pollination examples:**
- Building a **finance** app? Search in Gaming, Entertainment, Music, Social
- Building a **productivity** tool? Search in Fitness, Food & Drink, Travel, Music
- Building an **e-commerce** app? Search in Education, Health, Social Networking
- Building a **health** app? Search in Gaming, Entertainment, Finance

```bash
# Search for the SAME screen type in DIFFERENT categories
$LAZYWEB_CLI search "<screen type>" --category "Gaming" --limit 15 --json
$LAZYWEB_CLI search "<screen type>" --category "Entertainment" --limit 15 --json
$LAZYWEB_CLI search "<screen type>" --category "Social Networking" --limit 15 --json
```

Also try searching for the underlying FUNCTION rather than the screen name:
- Instead of "dashboard" → search "data visualization with gamification"
- Instead of "onboarding" → search "first-time experience with tutorial"
- Instead of "settings" → search "personalization with preferences"

**Explore generously.** Run 4-6 searches across different categories. Cast a very wide
net — you can filter later. More raw material = better cross-pollination.

### 5. Web Research (REQUIRED for balance)

Lazyweb provides great mobile references for cross-pollination. But the brainstorm
also needs desktop/web examples — especially if the user's product is for web.

**Always search the web** for unconventional takes:
- "unconventional [screen type] design"
- "[different industry] approach to [problem]"
- "creative [screen type] examples [current year]"
- "[award-winning site] [screen type]" — Awwwards, FWA, CSS Design Awards winners

**Use the browse tool** (if available) to capture screenshots of standout web examples.
Desktop/web examples are often the most novel cross-pollination sources because they
have more design freedom than mobile.

**Platform balance:** Even for a mobile product, include 2-3 desktop/web examples.
Patterns transfer across platforms — a novel web layout can inspire a fresh mobile
approach and vice versa. Aim for a healthy mix.

### 6. Download References

```bash
REPORT_DIR="$(pwd)/.lazyweb/design-brainstorm/{topic-slug}-{YYYY-MM-DD}"
mkdir -p "$REPORT_DIR/references"
```

Download results (cap 30):
```bash
curl -sL "{imageUrl}" -o "$REPORT_DIR/references/{company}-{screen}.png"
```

For web screenshots:
```bash
$B goto <url>
$B screenshot "$REPORT_DIR/references/{company}-{screen}.png"
```

### 7. Identify Transferable Patterns

For each cross-category result, ask:
- What pattern is this app using? (not what it looks like, but what it DOES)
- Why does this work in its original context?
- Could this same pattern work in the user's context? How would it need to adapt?
- What makes this a genuine "zag" vs just a random thing from another app?

**Guardrail:** Not everything novel is useful. A gaming leaderboard in a banking app
might be terrible. Filter for ideas where the UNDERLYING PATTERN transfers, even if
the surface aesthetic doesn't.

### 8. Write Brainstorm Document

Write to `.lazyweb/design-brainstorm/{topic-slug}-{YYYY-MM-DD}/report.md`

**Reverse pyramid:** Lead with the action (which ideas to prototype), then the ideas,
then the analysis. The reader should know what to do in the first 30 seconds.

```markdown
# Design Brainstorm: {Topic}

## TL;DR
{The most provocative transferable idea — 1-2 sentences}

## Current State
{Include ONLY if a current state screenshot was captured in step 2. Otherwise omit this section.}
![Current State](references/current-state.png)
*{Brief description of what we're looking at}*

## Which Ideas to Prototype
{ACTION FIRST. Rank ideas by feasibility × novelty. Best brainstorm ideas are
HIGH novelty AND HIGH feasibility — not just weird for weird's sake.}

| Idea | Novelty | Feasibility | Verdict |
|------|---------|-------------|---------|
| {idea} | High/Med/Low | High/Med/Low | Prototype / Explore / Skip |

## The Obvious Approach
{What everyone in this category does — the "zig."
Brief, with 1-2 example screenshots from the user's category.}

![Typical Example](references/typical-category-app.png)
*{Company} — the standard approach in {category} [{Lazyweb|Web}]*

## Cross-Pollination Ideas

### From {Source Category}: {Company}
![Reference](references/company-screen.png)
*{Company} — {What they do} [{Lazyweb|Web}]*

**The Pattern:** {What's the underlying design pattern, abstracted from the specific app}
**Applied Here:** {How this could work in the user's product — be specific}
**Why It's a Zag:** {What makes this different from what everyone else in the category does}
**Sketch:** {ASCII wireframe showing how this idea would look in the user's product}

**ASCII mockups:** For each cross-pollination idea, include a rough ASCII wireframe sketch
showing how the pattern would look applied to the user's product. Keep them simple —
box-drawing characters, just enough to communicate the layout idea. Example:

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

These sketches help the user visualize the idea without needing to open a design tool.
They don't need to be pixel-perfect — just communicative.

### From {Source Category}: {Company}
...

## Wild Cards
{1-2 ideas that are genuinely unconventional. Might not work but worth
considering. Flag the risk alongside the upside.}
```

Label each reference `[Lazyweb]` or `[Web]` so the user knows where it came from.

### 9. Generate HTML Report

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

## Brainstorm Mindset

- The goal is NOVELTY WITH PURPOSE — not random weirdness
- Every idea should have a "why this could work here" explanation
- If an idea is high novelty but low feasibility, flag it as a Wild Card
- The best brainstorms find 1-2 genuinely transferable patterns, not 10 forced ones
- It's OK to say "I didn't find strong cross-pollination opportunities for this screen type" — that's more honest than padding with irrelevant ideas
