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
  - Glob
  - Grep
  - WebSearch
  - AskUserQuestion
  - Agent
---

# Lazyweb Research

Deep product and design research that combines Lazyweb's real app screenshot database
with web research to answer design questions with grounded evidence.

## When to Use This vs lazyweb-search

- **lazyweb-search**: User wants to see specific screenshots ("show me Stripe's pricing page")
- **lazyweb-research**: User wants to answer a design question ("what's the best way to design a pricing page" or "do competitive analysis on onboarding flows in fitness apps")

## Research Workflow

When the user asks a design question, follow this approach:

### 1. Understand What They're Actually Building

Before searching, understand the context:
- What is the user building? (app type, platform, audience)
- What specific screen or flow are they designing?
- Are they looking for mobile or desktop/web patterns?
- Are they in exploration mode (open to ideas) or validation mode (have a design, want to compare)?

### 2. Search Lazyweb for Real Examples

Use the Lazyweb CLI to find relevant real-world screenshots:

```bash
bun run ~/Dropbox/cli-lazyweb/src/index.ts search "<query>" --limit 10 --json
```

**Query construction tips:**
- Start with the specific screen/component: "pricing page", "onboarding flow", "settings screen"
- Add context: "with dark mode", "with bottom navigation", "with social proof"
- If the domain matters, use `--category`: "Health & Fitness", "Finance", "Productivity"
- Request metadata when you need to filter by quality: `--fields high_design_bar,business_model`

Assess result quality using `matchCount` and `similarity` (see lazyweb-search skill for details).
If Lazyweb results are weak for this query, acknowledge it honestly and lean more on web research.

### 3. Supplement with Web Research

Lazyweb's database won't have everything — especially desktop/web designs, brand-new apps,
or niche categories. Use WebSearch to fill gaps:

- Search for "[screen type] design patterns [current year]"
- Search for "[competitor name] [feature] design"
- Search for "best [screen type] examples" to find curated lists and design blogs
- Look at design-focused sites: Mobbin, Dribbble, Behance references in articles

When you find interesting examples via web search, describe what you see — the user can't
see the webpage, so paint the picture with words.

### 4. Synthesize Patterns

This is the most valuable part. After gathering evidence from both Lazyweb and the web:

**Identify what the best apps have in common:**
- What UI patterns repeat across the top results?
- What information hierarchy do they use? (What's shown first, second, third?)
- What interaction patterns are consistent?

**Identify where they differ:**
- Where do approaches diverge? Why?
- Does the difference correlate with audience, business model, or platform?

**Extract actionable principles:**
- "The top pricing pages all lead with social proof before showing prices"
- "Every high-rated onboarding flow uses progressive disclosure — never more than one question per screen"
- "Dark mode implementations that feel premium use near-black (#1a1a1a) not pure black (#000)"

### 5. Connect to Their Specific Context

Don't just report findings — apply them:
- "Given that you're building a [X], the pattern from [Company Y] is most relevant because..."
- "Your audience is [type] — they'll expect [pattern] based on what [similar apps] do"
- "I'd avoid [Company Z]'s approach here because [reason specific to the user's context]"

## Competitive Analysis Mode

When the user wants competitive analysis for a specific feature:

1. **Identify competitors** — Ask or infer who the relevant competitors are
2. **Search Lazyweb by company** — `--company "competitor-name"` for each
3. **Search Lazyweb by feature** — Search for the specific screen/flow across all companies
4. **Web research** — Search for "[competitor] [feature] review" and "[competitor] UX analysis"
5. **Build a comparison** — What does each competitor do? Where do they converge? Where do they diverge? What's the opportunity?

## Quality Calibration

**Be honest about what you know vs. what you're inferring.**
- Lazyweb screenshots are evidence — you can see what a real app looks like
- Web articles are opinions — useful but filter for quality
- Your own design knowledge is synthesis — clearly label recommendations as your interpretation

**Don't over-index on weak Lazyweb results.** If a query returns results with low
similarity scores and matchCount of 1/3, those results are noise — don't build your
analysis on them. Say "Lazyweb didn't have strong matches for this specific pattern"
and lean on web research and your own knowledge.

**Do cite your sources.** When you reference a specific Lazyweb screenshot, include the
company name and image URL. When you reference a web source, include the URL.
