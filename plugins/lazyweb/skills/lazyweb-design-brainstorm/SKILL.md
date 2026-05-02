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

## CRITICAL: Output Behavior

**This skill produces FILES, not a plan.** Regardless of whether you are in plan mode
or not, ALWAYS:

1. Write the report to `.lazyweb/design-brainstorm/{topic}-{date}/report.md`
2. Write the HTML to `.lazyweb/design-brainstorm/{topic}-{date}/report.html`
3. Download references to `.lazyweb/design-brainstorm/{topic}-{date}/references/`
4. Do NOT write brainstorm content into a plan file
5. After saving, show the user a summary of ideas and tell them where the files are
6. Ask the user if the brainstorm looks good
7. If in plan mode, exit plan mode after the user confirms
8. Suggest next steps: "You can now prototype the top ideas, run `/lazyweb-design-research`
   for deeper analysis on a specific idea, or start building."

---

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

## Lazyweb MCP Setup

Use the hosted Lazyweb MCP tools at `https://www.lazyweb.com/mcp` for all Lazyweb database access.

Required MCP tools:
- `lazyweb_search` — text search over mobile and desktop screenshots
- `lazyweb_find_similar` — more results like a known Lazyweb screenshot ID
- `lazyweb_compare_image` — visual search from `image_base64` + `mime_type` or `image_url`
- `lazyweb_health` — connectivity check

These are stable public compatibility aliases. The server may also expose canonical
tools such as `search_screenshots`, `list_filters`, `vision_screenshots`, and
`metadata_screenshots`; prefer the `lazyweb_*` names in this skill.

Before searching, verify MCP is available by listing tools and running
`lazyweb_health`.

**If Lazyweb MCP is not installed or auth fails:**
Tell the user: "Lazyweb MCP is not installed. Enable the global Lazyweb plugin or
get the free setup instructions at https://www.lazyweb.com/mcp-install, paste
them into this agent, then rerun this skill. Lazyweb is free; the bearer token is
only for no-billing UI reference tools and is okay in ignored local config."
Then proceed with web research only — the brainstorm still works, just with web examples.

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

```json
{"query":"<screen type>","category":"<their category>","limit":10}
{"query":"<screen type>","category":"<their category>","platform":"desktop","limit":10}
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

```json
{"query":"<screen type>","category":"Gaming","limit":15}
{"query":"<screen type>","category":"Entertainment","limit":15}
{"query":"<screen type>","category":"Social Networking","platform":"desktop","limit":15}
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

Also try searching for the underlying FUNCTION rather than the screen name:
- Instead of "dashboard" → search "data visualization with gamification"
- Instead of "onboarding" → search "first-time experience with tutorial"
- Instead of "settings" → search "personalization with preferences"

**Explore generously.** Run 4-6 searches across different categories. Cast a very wide
net — you can filter later. More raw material = better cross-pollination.

**HIGH BAR FOR REFERENCES:** Each Lazyweb result includes a `visionDescription` field —
a text description of what's actually in the screenshot. Read it.

**Rules for attaching references to the brainstorm:**
1. Read `visionDescription` before using ANY screenshot
2. The screenshot MUST directly illustrate the cross-pollination idea you're proposing
3. If `visionDescription` doesn't match your idea — DO NOT USE IT
4. A brainstorm idea with no image but a great ASCII sketch beats one with a mismatched screenshot
5. Never guess what's in a screenshot — use `visionDescription` for captions
6. If there's no visionDescription, skip the screenshot

Mismatched references destroy user trust faster than anything else.

### 5. Search Connected Inspiration Libraries

Check if `~/.lazyweb/libraries.json` exists and has connected libraries:

```bash
cat ~/.lazyweb/libraries.json 2>/dev/null
```

If libraries are configured, search each one using the browse tool. For brainstorms,
search BOTH the obvious category AND unrelated categories in each library:

1. Navigate to the library's search URL: `$LB goto "{searchUrl}"`
2. Take a snapshot to understand the page: `$LB snapshot -i`
3. Search for the cross-pollination query: `$LB fill @eN "{query}"`
4. Submit and wait for results: `$LB press Enter` then `$LB snapshot -i`
5. Browse through results — look for the unexpected, the novel, the "wait, that's interesting"
6. Screenshot the standout results: `$LB screenshot "$REPORT_DIR/references/{library}-{company}-{screen}.png"`
7. Note what makes each one a genuine "zag"

**Brainstorm-specific**: Libraries like Mobbin and Savee have category filters. Use them
to deliberately search outside the user's category — that's the whole point of this skill.

**If the library session has expired** (login wall, redirect to sign-in):
- Tell the user: "Your {library} session has expired. Run `/lazyweb-add-inspo-source` to reconnect."
- Skip this library and continue with other sources.

Label all library-sourced references: `[Mobbin]`, `[Savee]`, etc.

### 6. Web Research + Live Screenshot Capture (REQUIRED)

Lazyweb gives you curated screenshots. But brainstorms need the UNEXPECTED — Awwwards
winners, experimental sites, award-winning designs nobody in the user's space is looking at.

**Step A — Find unconventional URLs via WebSearch:**
- "unconventional [screen type] design"
- "[different industry] approach to [problem]"
- "creative [screen type] examples [current year]"
- "[award-winning site] [screen type]" — Awwwards, FWA, CSS Design Awards winners

Collect 3-8 URLs of standout, unconventional examples.

**Step B — Capture live screenshots from those URLs:**
```bash
if [ -x "$LB" ]; then
  $LB goto "https://awwwards-winner.com/page"
  $LB screenshot "$REPORT_DIR/references/awwwards-winner-page.png"
fi
```

If the browse tool is not available, describe web examples in the report without images.

**This is especially important for brainstorms.** Web captures of unconventional sites
are often the most novel cross-pollination sources because desktop/web has more design
freedom than mobile.

**Platform balance:** Also deliberately search the OTHER platform for cross-pollination.
A novel web layout can inspire a fresh mobile approach and vice versa.

### 7. Download References

```bash
REPORT_DIR="$(pwd)/.lazyweb/design-brainstorm/{topic-slug}-{YYYY-MM-DD}"
mkdir -p "$REPORT_DIR/references"
```

Download Lazyweb results (cap 30):
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

### 8. Identify Transferable Patterns

For each cross-category result, ask:
- What pattern is this app using? (not what it looks like, but what it DOES)
- Why does this work in its original context?
- Could this same pattern work in the user's context? How would it need to adapt?
- What makes this a genuine "zag" vs just a random thing from another app?

**Guardrail:** Not everything novel is useful. A gaming leaderboard in a banking app
might be terrible. Filter for ideas where the UNDERLYING PATTERN transfers, even if
the surface aesthetic doesn't.

### 9. Write Brainstorm Document

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

### 10. Generate HTML Report

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
