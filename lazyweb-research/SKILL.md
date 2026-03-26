---
name: lazyweb-research
description: |
  Product and design research combining Lazyweb's screenshot database with web research.
  Use when the user asks design questions like "what are best practices for X", "how should
  I design Y", "what do the best apps do for Z", or needs competitive analysis for a
  feature they're building. Goes beyond just finding screenshots — synthesizes patterns
  and delivers actionable design guidance.
  Trigger on: "best practices for", "how should I design", "what do top apps do",
  "competitive analysis for", "design research on", "what works well for".
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

# Lazyweb Research

Deep product and design research that combines Lazyweb's real app screenshot database
with web research to answer design questions with grounded evidence.

## Lazyweb First — Always

Lazyweb is your PRIMARY evidence source. Every research session should search Lazyweb
BEFORE doing any web research. Web research supplements Lazyweb — not the other way around.

If the backend is down (health check fails), note it and fall back to web research only.
But never skip Lazyweb just because web research is easier.

## CLI Setup

Determine the CLI command. Check in order:
1. `LAZYWEB_CLI` environment variable (if set, use it)
2. `lazyweb` on PATH (try `which lazyweb`)
3. Fall back to `bun run ~/Dropbox/cli-lazyweb/src/index.ts`

Store the resolved command and use it for all searches in this session.

## When to Use This vs lazyweb-search

- **lazyweb-search**: User wants to see specific screenshots ("show me Stripe's pricing page")
- **lazyweb-research**: User wants to answer a design question ("what's the best way to design a pricing page" or "do competitive analysis on onboarding flows in fitness apps")

## Research Workflow

### Step 1: Health Check

Before searching, verify the backend is running:

```bash
$LAZYWEB_CLI health
```

If the backend is down, tell the user and proceed with web research only. Don't fail silently.

### Step 2: Understand What They're Actually Building

Before searching, understand the context:
- What is the user building? (app type, platform, audience)
- What specific screen or flow are they designing?
- Are they looking for mobile or desktop/web patterns?
- Are they in exploration mode (open to ideas) or validation mode (have a design, want to compare)?

### Step 3: Search Lazyweb

Run at least 1 search, strongly prefer 2+ with different query angles:

```bash
$LAZYWEB_CLI search "<specific screen/component>" --limit 10 --json
$LAZYWEB_CLI search "<alternative framing or adjacent pattern>" --limit 10 --json
```

**Query construction:**
- Think in concrete UI elements, not abstract feelings
- Bad: "a beautiful modern app" → Good: "pricing page with toggle between monthly and annual plans"
- Start with the specific screen/component: "pricing page", "onboarding flow", "settings screen"
- Add context: "with dark mode", "with bottom navigation", "with social proof"
- Use `--category` when you know the domain: "Health & Fitness", "Finance", "Productivity"
- Use `--company` for competitive analysis: `--company "stripe"`
- Request metadata for quality filtering: `--fields high_design_bar,business_model`

**Assess result quality:**
- `matchCount` of 2/3 or 3/3 = strong results (trust these)
- `matchCount` of 1/3 = weak results (use with caveats)
- `similarity` above 0.4 = strong semantic match
- `similarity` below 0.3 = weak match
- Results from unrelated categories = likely noise

### Step 4: Show Lazyweb Results

Present Lazyweb results with their image URLs immediately. Don't wait for web research.
Group by relevance and call out what you see in the screenshots.

For each strong result, show:
- Company name and screen description
- The image URL (so the user can see the actual screenshot)
- What's notable about this specific example

### Step 5: Supplement with Web Research (for gaps only)

Lazyweb's database is primarily mobile apps. Supplement with web research when:
- The query is about desktop/web designs
- Lazyweb results were weak (low similarity, low matchCount)
- The user needs very recent examples not yet in the database
- The category is niche

Search for:
- "[screen type] design patterns [current year]"
- "[competitor name] [feature] design"
- "best [screen type] examples"

When describing web findings, summarize the insight — don't dump URLs inline.

### Step 6: Synthesize Patterns

After gathering evidence from Lazyweb (primary) and web research (supplementary):

**Identify what the best apps have in common:**
- What UI patterns repeat across the top results?
- What information hierarchy do they use?
- What interaction patterns are consistent?

**Identify where they differ and why:**
- Does the difference correlate with audience, business model, or platform?

**Extract actionable principles:**
- "The top pricing pages all lead with social proof before showing prices"
- "Every high-rated onboarding flow uses progressive disclosure"
- Tie principles to specific Lazyweb screenshots as evidence

### Step 7: Connect to Their Specific Context

Don't just report findings — apply them:
- "Given that you're building a [X], the pattern from [Company Y] is most relevant because..."
- "Your audience is [type] — they'll expect [pattern] based on what [similar apps] do"

## Visual Examples — The Whole Point

Every research output MUST include visual examples from Lazyweb. This is non-negotiable.

1. Show 3-5 Lazyweb screenshot image URLs as the centerpiece of your research
2. Group screenshots by pattern: "These 3 apps all use [pattern]"
3. Call out specific visual details visible in the screenshots
4. If Lazyweb results were weak, say so explicitly — but still show what you found

Research without visuals is just an opinion piece. The screenshots ARE the evidence.

## Presenting Results

**Priority order:**
1. Visual examples from Lazyweb (image URLs rendered as images)
2. Pattern analysis and recommendations in your own words
3. Compact "Sources" section at the very bottom

DO NOT scatter web URLs throughout the output. When referencing web research,
describe the insight without the URL. Put all web source URLs in a compact
"Sources" section at the end.

Lazyweb image URLs are the exception — always show these prominently because
they ARE the content the user is looking for.

## Competitive Analysis Mode

When the user wants competitive analysis for a specific feature:

1. **Identify competitors** — Ask or infer who the relevant competitors are
2. **Search Lazyweb by company** — `--company "competitor-name"` for each
3. **Search Lazyweb by feature** — Search for the specific screen/flow across all companies
4. **Web research for gaps** — "[competitor] [feature] review" and "[competitor] UX analysis"
5. **Build a comparison** — What does each competitor do? Where do they converge? Where do they diverge? What's the opportunity?

## Quality Calibration

**Be honest about what you know vs. what you're inferring.**
- Lazyweb screenshots are evidence — you can see what a real app looks like
- Web articles are opinions — useful but filter for quality
- Your own design knowledge is synthesis — label recommendations as your interpretation

**Don't over-index on weak Lazyweb results.** If results have low similarity and
matchCount of 1/3, they're noise. Say "Lazyweb didn't have strong matches for this
specific pattern" and lean on web research and your own knowledge.

## Saving Research Output

After completing research, save a standalone document:

1. Create `.lazyweb/research/` in the project directory if it doesn't exist
2. Write the research to `.lazyweb/research/{topic-slug}-{YYYY-MM-DD}.md`
3. The document should contain:
   - Research question
   - Visual examples section (Lazyweb screenshots with image URLs)
   - Pattern analysis
   - Actionable recommendations
   - Sources at the bottom (compact)
4. Tell the user: "Research saved to `.lazyweb/research/{filename}`. You may want to add `.lazyweb/` to your .gitignore."

Note: Image URLs are signed and expire after 1 hour. The saved document captures
the research findings; screenshots may need to be re-fetched later.
