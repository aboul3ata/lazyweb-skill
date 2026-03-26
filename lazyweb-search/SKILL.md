---
name: lazyweb-search
description: |
  Search Lazyweb's design inspiration database for app screenshots, UI patterns, and
  visual references. Use when the user asks for design inspiration, UI examples, or
  wants to see how other apps handle a specific screen/flow. Supports text search,
  image comparison, and finding similar screenshots.
  Trigger on: "show me examples of", "how do other apps do", "design inspiration for",
  "UI reference for", "what does X's app look like", "find screenshots of".
allowed-tools:
  - Bash
  - Read
  - Glob
  - Grep
  - WebSearch
  - AskUserQuestion
  - Agent
---

# Lazyweb Search

Search Lazyweb's database of real app screenshots for design inspiration and UI references.

## Prerequisites

The Lazyweb backend must be running locally:
```bash
cd ~/Dropbox/cli-lazybackend && bun run src/index.ts &
```

The CLI lives at `~/Dropbox/cli-lazyweb/src/index.ts`.

## CLI Reference

```bash
# Text search — find screenshots matching a description
bun run ~/Dropbox/cli-lazyweb/src/index.ts search "<query>" --limit N --json

# Image comparison — find screenshots visually similar to a local image
bun run ~/Dropbox/cli-lazyweb/src/index.ts compare <image-path> --limit N --json

# Similar — find screenshots similar to one you already found
bun run ~/Dropbox/cli-lazyweb/src/index.ts similar <screenshot-id> --limit N --json

# Filter by category or company
bun run ~/Dropbox/cli-lazyweb/src/index.ts search "<query>" --category "Productivity" --company "linear" --json

# Rich metadata (opt-in to save tokens by default)
bun run ~/Dropbox/cli-lazyweb/src/index.ts search "<query>" --fields business_model,high_design_bar,tags --json
```

Always use `--json` when invoking programmatically. The JSON output includes:
- `screenshotId`, `screenshotName`, `companyName`, `category`
- `imageUrl` — signed URL (expires in 1 hour, use promptly)
- `similarity` — cosine similarity score (0-1)
- `matchCount` — how many of 3 embedding providers agreed (1/3, 2/3, or 3/3)

## How to Search Well

**Think in concrete UI elements, not abstract feelings.**
- Bad: "a beautiful modern app"
- Good: "pricing page with toggle between monthly and annual plans"
- Good: "dark mode settings screen with toggle switches"
- Good: "onboarding flow with progress indicator and illustrations"

**Route between mobile and desktop intentionally.** Lazyweb's database is predominantly
mobile app screenshots. When the user asks about a desktop or web product (e.g., "mac
screenshot tool", "SaaS dashboard", "web analytics"), acknowledge this and supplement
with web research. When the user asks about a mobile app, Lazyweb is your primary source.

**Use category filters when you know the domain.** Available categories include:
Business, Education, Entertainment, Finance, Food & Drink, Games, Health & Fitness,
Lifestyle, Music, News, Photo & Video, Productivity, Shopping, Social Networking,
Sports, Travel, Utilities, Weather, and more. Use `--category` to narrow results.

## Assessing Result Quality

Results include `matchCount` and `similarity` — use these to gauge confidence:

**Strong results** (trust and present to user):
- `matchCount` of 2/3 or 3/3 — multiple embedding models agree this is relevant
- `similarity` above 0.5 — strong semantic match

**Weak results** (use with caveats or supplement):
- All results have `matchCount` of 1/3 — only one model thought this was relevant
- `similarity` below 0.3 — weak semantic match
- Results are from unrelated categories (user asked about fitness, got finance)

**When results are weak**, do not present them as strong matches. Instead:
1. Tell the user what you found and that relevance is limited
2. Try rephrasing the query — be more specific about the UI element, not the concept
3. Try breaking a complex query into simpler parts (search for the screen type separately from the style)
4. Supplement with web research for the specific use case

## Follow-up Strategies

When the user wants to go deeper after initial results:

- **"More like this"** → Use `similar <screenshot-id>` on the best result
- **"Same company"** → Re-search with `--company <name>`
- **"Different style"** → Rephrase query emphasizing the desired aesthetic difference
- **"What about competitors?"** → Search for the same screen type across different companies
- **"Can you find the actual flow?"** → Search for sequential screens: "onboarding step 1", "onboarding step 2", etc.

## Presenting Results to the User

When showing Lazyweb results to the user:
- Show the image URL so they can see the screenshot
- Name the company and what the screen shows
- If multiple results, highlight what's common across them (patterns)
- If the user is building something, connect the reference to their specific use case
- Don't just dump a list — synthesize what you see across the results

## When NOT to Use Lazyweb

- User is asking about a specific website's current design → use web browsing instead
- User wants to see their own app's screenshots → not in Lazyweb
- User is asking about design principles without needing visual references → just answer from knowledge
- User needs desktop/web app references → Lazyweb is primarily mobile; supplement with web research
