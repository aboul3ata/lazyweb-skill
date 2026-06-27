---
name: lazyweb-quick-search
route: "Quick MCP search before design"
router-terms: quick search, search lazyweb, preflight, quick check, search before designing, industry references, ui references, design references, examples, see examples, reference screenshots, competitive analysis, what do top apps do, how do other apps, design research, look up references, best practice examples
description: |
  Use the Lazyweb search MCP tool directly for quick industry references before
  designing or changing UI. Does not generate a report. Use when the agent needs
  a lightweight best-practice check from real app screenshots, wants to inspect
  search coverage, or should grab a few references before building.
  Trigger on: "quick search", "search Lazyweb", "use lazyweb_search",
  "quick industry references", "check examples before designing",
  "look up UI references first".
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

# Lazyweb Quick Search

Use Lazyweb MCP search as a fast design preflight. This skill does not write a
report, publish HTML, or produce a deck. It runs the smallest useful
`lazyweb_search`, reads the returned screenshots and metadata, then gives the
builder concrete UI takeaways with image links.

> **Use this ONLY for an explicit reference / examples lookup.** This is NOT the
> default for design work and NOT a way to produce a report. If the user wants to
> **redesign, optimize, improve, or critique a screen — or produce a report** —
> use **`lazyweb-design`** instead. `lazyweb-design` runs the one-call,
> server-side `lazyweb_generate_report`, which does its own searching and hosts a
> full report; you do not search here first and hand the results off to build one.
> Reach for quick-search only when the user explicitly asks for a quick reference
> lookup or a few examples and does NOT want a report.

## When to Use This

- When the user **explicitly** asks for a few references / examples and does NOT
  want a report
- When the user explicitly asks for a "quick search" or to use `lazyweb_search`
- When the user asks to inspect search coverage for a UI pattern

## When NOT to Use This

- Any design / redesign / optimize / improve / critique / build work, or
  producing a report → **`lazyweb-design`** (the default; one-call server-side
  `lazyweb_generate_report`)
- Full competitive analysis, ranked recommendations, or visual prototypes →
  `lazyweb-design`
- Existing UI critique or before/after recommendations →
  `lazyweb-design` (objective improve)
- Paywall conversion redesign →
  `lazyweb-design` (objective optimize)
- Sign-up conversion redesign →
  `lazyweb-design` (objective optimize)
- As a search step to gather references BEFORE building a report —
  `lazyweb-design` searches server-side itself; don't preflight here for it

## MCP Setup

Use the hosted Lazyweb MCP tools at `https://www.lazyweb.com/mcp`.

Required tools:
- `lazyweb_health` — verify connectivity when the MCP surface is uncertain
- `lazyweb_search` — search mobile screenshots and desktop captures by text
- `lazyweb_list_categories` — discover supported company categories before
  using a category filter

If Lazyweb MCP is missing, tell the user to run:

```bash
curl -fsSL https://www.lazyweb.com/install.sh | bash
```

Then reload the client and rerun the skill.

**Pass `skill: "quick-search"` on every Lazyweb call.** Include
`"skill": "quick-search"` in each `lazyweb_*` call. It is logging-only
metadata; never change a real search argument to satisfy it.

**Also pass `version: "<x.y.z>"` on every Lazyweb call.** Read
`~/.lazyweb/VERSION` once per session:

```bash
cat "$HOME/.lazyweb/VERSION" 2>/dev/null || echo 0.0.0
```

Use `"0.0.0"` if missing. Never block on the version read.

**Also pass `integrity` verbatim on every Lazyweb call.** Read it once per
session:

```bash
cat "$HOME/.lazyweb/INTEGRITY" 2>/dev/null
```

Pass that exact string as the `integrity` arg on every `lazyweb_*` call. It is an
opaque install fingerprint — copy it verbatim; do NOT interpolate, edit, parse,
or reconstruct it. **If the file is absent, OMIT the `integrity` field entirely —
never invent one.** This is the field that tells Lazyweb your pack is current.

## Search Protocol

### 1. Pick the platform first

Choose `platform` before querying:

- `mobile` — native app screens, mobile onboarding, paywalls, settings, tabs,
  permission prompts, bottom sheets, mobile checkout
- `desktop` — websites, landing pages, dashboards, web pricing, desktop
  checkout, SaaS settings
- `all` — only when the user genuinely wants both surfaces or the platform is
  unknown

Avoid `all` by habit. In the current backend, `all` searches mobile and desktop
in parallel and splits the requested `limit` across them, with desktop shown
first. A `limit: 6` all-platform search usually means about three desktop and
three mobile results, not six of each.

### 2. Start with a tiny probe

Run one small query first:

```json
{
  "query": "onboarding quiz",
  "platform": "mobile",
  "limit": 3,
  "maxPerCompany": 1,
  "skill": "quick-search",
  "version": "<from ~/.lazyweb/VERSION>"
}
```

Read every returned `visionDescription`, `companyName`, `category`, `platform`,
`similarity`, `matchCount`, and `imageUrl`. If at least two of three are
visually on-target, page or expand. If the probe is adjacent, fix the query
before increasing `limit`.

### 3. Query the UI pattern, not the style

Best queries are 2-6 words naming a concrete UI pattern:

- Good: `onboarding quiz`, `usage based pricing table`,
  `empty state project list`, `mobile permission prompt`,
  `settings notification toggles`
- Weak: `beautiful modern app`, `minimal dark design`, `premium dashboard`,
  `best UX`

The backend embeds and reranks around screenshot content and metadata. Style
adjectives such as dark, minimal, premium, playful, and editorial are not
reliable search facets. Search the screen mechanism first, then judge style by
looking at the returned images.

### 4. Read response metadata before changing anything

Always inspect:

- `coverage.strength` and `coverage.top_similarity`
- `warnings`
- `pagination.next_offset`
- `suggestions.company`
- `company_resolved`

If coverage is `strong` or `moderate`, use the results. If coverage is `weak`,
keep only clearly relevant screenshots and say the corpus is adjacent. If there
are no matches, do not retry the same wording; shorten to the core UI pattern
or switch category/platform.

Never repeat an identical query. Results are deterministic. Use
`offset: pagination.next_offset` to page deeper.

### 5. Use company filters narrowly

Use `company` only when the user names a specific reference product or when you
need that product's exact pattern.

The MCP gateway resolves `company` against `companies.company_name` before
searching. It tries case-insensitive exact matches, hyphen/space variants, and
prefix suggestions. If unresolved, the backend ignores the company filter and
returns `company_not_in_library` plus closest suggestions. In that case, pick a
suggested company or drop the company filter. Do not keep retrying spellings of
the same brand.

Use `company` with a pattern query:

```json
{
  "query": "paywall benefits list",
  "company": "Duolingo",
  "platform": "mobile",
  "limit": 3,
  "skill": "quick-search",
  "version": "<from ~/.lazyweb/VERSION>"
}
```

Do not use company as a broad corpus scraper. Filtered generic searches with
high limits are treated as enumeration-like behavior by the backend.

### 6. Use category filters only after checking categories

Call `lazyweb_list_categories` when:

- the user names an industry and you need an exact supported category value
- a broad search returns mixed industries
- `coverage` is weak and the category could remove noise

Do not use `category` when the screen pattern is cross-industry, such as
pricing tables, empty states, settings, search, dashboards, or onboarding
welcome screens. Category filters reduce recall because they match the
company's category, not a screen-level tag.

Use category like this only after confirming the exact category string:

```json
{
  "query": "habit tracker streak screen",
  "category": "Health & Fitness",
  "platform": "mobile",
  "limit": 6,
  "maxPerCompany": 1,
  "skill": "quick-search",
  "version": "<from ~/.lazyweb/VERSION>"
}
```

When internal tools expose `list_companies_by_categories`, use it only to learn
which companies are inside a category before choosing a `company` filter. If the
live tool list does not show it, use `lazyweb_list_categories` and proceed.

### 7. Expand only after relevance is proven

After a good probe:

- increase `limit` to 8-12 for a broader scan
- keep `maxPerCompany: 1` for pattern diversity
- use `offset` for page two
- run one alternate query only if it names a different mechanism

Examples:

```json
{"query":"onboarding quiz","platform":"mobile","limit":10,"maxPerCompany":1,"skill":"quick-search","version":"<version>"}
{"query":"onboarding question flow","platform":"mobile","limit":10,"maxPerCompany":1,"skill":"quick-search","version":"<version>"}
{"query":"onboarding quiz","platform":"mobile","limit":10,"offset":10,"maxPerCompany":1,"skill":"quick-search","version":"<version>"}
```

These are different moves: broader first page, different UI mechanism, and
deeper page. Do not run all three unless the design task needs it.

## Reading Results Safely

Use the returned fields to decide whether a screenshot is strong design
evidence:

- Prefer results that are both high in the returned ranking and visually
  on-target for the UI question.
- `matchCount`, when present, is an opaque confidence hint. Higher is usually
  better, but do not explain or infer the internal scoring method from it.
- `similarity` is useful within one response but not a universal quality score.
- `visionDescription` tells you why a result may have matched; read it before
  using the screenshot as evidence.
- `maxPerCompany: 1` is good for variety. Raise it only when the user asks for
  multiple examples from the same company.

## Output Format

Return a short, useful handoff. Include:

- Search calls made: query, platform, filters, limit
- Coverage: `coverage.strength`, top similarity, and warnings
- Best references: company, screen, why it matters, image URL
- Design takeaways: 3-5 concrete patterns to apply now
- Gaps: anything the corpus did not cover

Do not write a report file. Do not publish. Do not present the result as a
complete competitive analysis.

## Escalation

Escalate to `lazyweb-design` when the user needs ranked
recommendations, prototypes, or a shareable artifact.

Escalate to `lazyweb-design` when the user wants grouped
screenshots in a visual report.
