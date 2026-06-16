---
name: lazyweb-design-brainstorm
route: 'Creative cross-category ideas'
router-terms: brainstorm, creative, fresh, unconventional, exploration, ideas, different
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

**This skill produces a HOSTED REPORT, not a plan.** Regardless of whether you are in plan mode
or not, ALWAYS:

1. Author the report content as `.lazyweb/design-brainstorm/{topic}-{date}/work/report-data.json` (structured content, NOT HTML)
2. Embed Lazyweb references directly with their returned `imageUrl`/`image_url`; save only current-state, web-captured, and generated mockup screenshots under `.lazyweb/design-brainstorm/{topic}-{date}/references/`
3. Do NOT create `report.html`, `report.md`, or any other report artifact by hand — the server renders the report
4. Do NOT write brainstorm content into a plan file
5. Render and host the report with `lazyweb_render_report` (see "Render and host the report" below) — this single call IS the deliverable; producing the report and hosting it are the same action, so there is nothing to skip
6. After the render call returns, show the user a summary of ideas and the shareable link (the report lives only at that URL)
7. Ask the user if the brainstorm looks good
8. If in plan mode, exit plan mode after the user confirms
9. Suggest next steps: "You can now prototype the top ideas, ask `/lazyweb`
   for deeper design research on a specific idea, or start building."

## Render and host the report (the single deliverable)

The report is rendered and hosted **server-side**. Author the report content as
`work/report-data.json` (schema below), then call `lazyweb_render_report` ONCE.
That call fills the Lazyweb report template on the server, validates it, hosts it
at `https://www.lazyweb.com/report/lazyweb/{id}/`, and returns the shareable
link. There is no local `report.html`, no separate publish step, and no token to
read — producing the report and hosting it are the same action, so a finished
report is always a hosted report.

Call it once `work/report-data.json` and every `references/` image exist. The
report dir is `$REPORT_DIR = .lazyweb/design-brainstorm/{topic-slug}-{YYYY-MM-DD}`.

Arguments:
- `report_data`: the parsed `work/report-data.json` object (see "Author report-data.json" below).
- `assets`: every file in `$REPORT_DIR/references/` as `{ "name": <filename>, "b64": <base64 of the bytes> }` — the locally-saved screenshots the report points at via `references/{name}`. Lazyweb references embedded by absolute imageUrl are NOT assets.
- `report_skill`: `"design-brainstorm"`.
- `idempotency_key`: the report dir slug, e.g. `design-brainstorm/{topic-slug}-{YYYY-MM-DD}`. Send the SAME value on every call for this report so a retry returns the same link.
- `version`: the value you read from `~/.lazyweb/VERSION` at skill start.

Handle the result:
- `{ ok: true, url }` — show "Shareable link: {url} (unlisted - anyone with the link can view)", then `open "{url}"` (skip `open` in a headless/CI/no-GUI environment and just print the link).
- `{ ok: false, code: "REPORT_RENDER_ERROR", detail }` — `detail` names the missing or invalid `report_data` field; fix it in `work/report-data.json` and call ONCE more.
- `{ ok: false, code: "REPORT_TOO_LARGE" }` — reduce the number/size of embedded screenshots and retry once.
- any other `{ ok: false }` — tell the user hosting failed and why (the `error` field); there is no local copy.

The server fills a fixed, validated template and rejects incomplete report_data,
so a partial report can never be hosted. Never hand-render HTML or fall back to a
local file.

### Author report-data.json (the report content)

You author the report as **content**, not HTML. Write
`$REPORT_DIR/work/report-data.json`; the server fills the canonical,
render-tested Lazyweb template from it and hosts the result (see "Render and host
the report" above). You never read or write the template, never write
fill/render code, and never open a local report file — the deliverable is the
hosted URL.

Map this skill's report sections onto the schema:
- The **"Agent Instructions"** handoff (the copy-pastable downstream-agent block) → `agent_instructions` (`human`, `task`, `recs[]`, optional `index_on`/`dont_index`/`dive`/`evidence_basis`). For THIS skill, `task` = "exploring a differentiated {screen} direction using the cross-category patterns below", and `dive` → "`/lazyweb-deep-design-research` to validate the chosen direction against in-category norms before building".
- The **"Current State"** screenshot (step 2, if captured) → `current_state` (`src` = `references/current-state.png`, `alt`, `desc`); set `null` when no current state exists.
- Each **brainstormed direction / cross-pollination idea** (the "Which Ideas to Prototype" ranking, "The Obvious Approach", "Cross-Pollination Ideas", and "Wild Cards") → a `patterns[]` card: `verdict` ("Build this" | "Optional" | "Skip" — map Prototype→Build this, Explore→Optional, Skip→Skip; Wild Cards are usually "Optional"), optional `strength`/`prevalence`, the one-line `claim` (the applied-here pattern), and a `deck[]` of the real cross-category references that prove it (each `src` + `alt` + `source` "Lazyweb"|"Web" + `company` + `detail` from `visionDescription`). This skill has no experiments — leave `experiments` absent and keep `patterns` non-empty.
- Any extra references that do not anchor a specific idea → optional `more_refs[]` (or `null`).

STANDARD `report-data.json` schema (the server fills the Lazyweb template from this; ALL strings RAW — the server escapes):

```json
{
  "topic": "<report title>",
  "agent_instructions": {
    "human": "<one human sentence: the single most important thing to do>",
    "task": "<what the downstream coding agent is building; fills {TASK} in the handoff>",
    "recs": ["<imperative rec 1>", "<rec 2>", "<rec 3>"],
    "index_on": "<1-3 well-evidenced signals>",
    "dont_index": "<weak-evidence / non-transferable items>",
    "dive": "<next Lazyweb skill or MCP tool — why>",
    "evidence_basis": "<Lazyweb screenshots | web captures · DATE>"
  },
  "current_state": null,
  "patterns": [
    { "verdict": "Build this",
      "strength": "Strong",
      "prevalence": "5 of 9 references",
      "claim": "<one-line claim>",
      "deck": [ {"src":"<absolute imageUrl OR references/<file>>","alt":"<alt>","source":"Lazyweb","company":"<name>","detail":"<key detail>"} ] }
  ],
  "experiments": [
    { "title":"<experiment name>", "change":"<what changed>",
      "control": {"src":"<img>","alt":"<alt>","label":"Control — ..."},
      "variant": {"src":"<img>","alt":"<alt>","label":"Variant — ..."},
      "facts": [ {"k":"Primary metric","v":"paid conversion"}, {"k":"Lift","v":"+18% (p<0.05)"} ],
      "outcome": "Shipped — +18% paid conversion" }
  ],
  "more_refs": null
}
```

Rules for `report-data.json`:
- `topic` and at least one non-empty `agent_instructions.recs` entry are required; for this skill `patterns` must be non-empty (`experiments` is omitted — this skill never produces A/B tests).
- All strings are RAW — the server does every bit of HTML-attribute and JS-string escaping (quotes, `<`, apostrophes in company names). Never pre-escape.
- Image `src` values: absolute Lazyweb `imageUrl`/`image_url` for Lazyweb references; relative `references/{filename}` for locally saved current-state, web-capture, and generated mockup images (each uploaded as an `asset` in the render call). Never use `file://` URLs or absolute local paths.
- `"current_state": null` and `"more_refs": null` omit those optional sections.
- A missing or invalid required field comes back from `lazyweb_render_report` as `{ ok:false, code:"REPORT_RENDER_ERROR", detail:"missing <field>" }` — fix that field in `report-data.json` and call once more. Do not browse-load, screenshot, or vision-inspect anything; the server validates the report.

---

Find novel design patterns by deliberately looking OUTSIDE the obvious category.
If everyone in fintech copies each other's dashboards, look at how gaming apps
handle data visualization. If every productivity app has the same onboarding,
look at how social apps hook new users.

The point is cross-pollination, not conformity.

## Ground the search (run first)

Before searching, ground the work in what the user is building, and avoid guessing when a wrong guess wastes a search:

1. **Detect context.** Run `lazyweb-context-detect` (on `PATH` when installed by setup; otherwise `~/.lazyweb/repos/lazyweb-skill/bin/lazyweb-context-detect`). It prints the project, platform (mobile/desktop), and stack. Use it to keep ideas applicable to the user's platform even while you search outside their category.
2. **Clarify only what's missing.** If it reports `platform=unknown`, or you can't tell the product/problem from the request, ask the user ONE short clarifying question to pin down the product, the platform, and what they're trying to spark. Skip anything the context already answered.
3. **Search from multiple angles.** Cast 3-5 `lazyweb_search` queries across deliberately different categories (the cross-pollination move) and read each result's `visionDescription` before using it. Add `high_design_bar: true` only when the live schema exposes it and the user asks for high-design-bar, premium, best-designed, or stronger visual-quality examples.
4. **Obey the response metadata.** Never repeat an identical query — results are deterministic; page deeper with `offset` and follow `pagination.next_offset`. On `no_matches`/`low_coverage` warnings, pivot to a different category or mechanism instead of rephrasing the same concept (style adjectives like "dark"/"minimal" are not searchable facets; judge style from the images). On `company_not_in_library`, use a suggested company or drop the filter.

## When to Use This

- User wants fresh/creative design ideas
- User is tired of seeing the same patterns in their category
- User asks "what if we did something different" or "brainstorm ideas"
- User wants to differentiate their design from competitors

## When NOT to Use This

- User wants to understand standard patterns -> route to `lazyweb-deep-design-research`
- User wants quick visual references -> route to `lazyweb-lite-design-research`
- User has an existing design and wants improvements -> route to `lazyweb-design-improve`

## Lazyweb MCP Setup

Use the hosted Lazyweb MCP tools at `https://www.lazyweb.com/mcp` for all Lazyweb database access.

Required MCP tools:
- `lazyweb_search` — text search over mobile and desktop screenshots
- `lazyweb_find_similar` — more results like a returned Lazyweb `imageUrl` or image payload
- `lazyweb_compare_image` — visual search from `image_base64` + `mime_type` or `image_url`
- `lazyweb_health` — connectivity check
- `lazyweb_render_report` — render + host the finished report from `report_data` + reference images, returns the shareable link (the deliverable; see "Render and host the report" above)

**Pass `skill: "design-brainstorm"` on every call.** Include `"skill": "design-brainstorm"` in the arguments of each `lazyweb_*` tool call — for example `{"query": "pricing page", "limit": 30, "skill": "design-brainstorm"}`. This is optional analytics metadata Lazyweb uses to understand which skills are used; never drop or change a real argument for it.

**Also pass `version: "<x.y.z>"` on every call.** Read `~/.lazyweb/VERSION` once per session at skill start (e.g. `cat "$HOME/.lazyweb/VERSION" 2>/dev/null || echo 0.0.0`); fall back to `"0.0.0"` if the file is missing or unreadable — never block on this. Include `"version": "<that-value>"` in the arguments of every `lazyweb_*` tool call alongside the existing `skill` arg — for example `{"query": "pricing page", "limit": 30, "skill": "design-brainstorm", "version": "0.4.5"}`. Optional analytics metadata Lazyweb uses to track which skill-pack versions are running; never drop or change a real argument for it.

These are the current public gateway names. Backend/internal surfaces may also
expose canonical tools such as `search_screenshots`, `list_filters`,
`vision_screenshots`, and `metadata_screenshots`; prefer the `lazyweb_*` names
in this skill. Use `high_design_bar: true` only when the live schema exposes it
to filter to companies where `companies.high_design_bar = true`.

Before searching, verify MCP is available by listing tools and running
`lazyweb_health`.

**If Lazyweb MCP is not installed or auth fails:**
Tell the user: "Lazyweb MCP is not installed. Run `curl -fsSL https://www.lazyweb.com/install.sh | bash`, reload this client, then rerun this skill. Lazyweb is free; the bearer token is
only for no-billing UI reference tools and is okay in ignored local config."
Then proceed with web research only — the brainstorm still works, just with web examples.

## Browse Setup (run BEFORE any web capture)

```bash
LB=""
# Check the standalone Lazyweb checkout first
for _P in "$(pwd)/.lazyweb/repos/lazyweb-skill/browse/dist/browse" ~/.lazyweb/repos/lazyweb-skill/browse/dist/browse; do
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
run: `cd ~/.lazyweb/repos/lazyweb-skill/browse && ./setup`

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

Save as `$REPORT_DIR/references/current-state.png` and reference it in
`report-data.json` via the `current_state` field (`src: "references/current-state.png"`,
plus `alt` and a one-line `desc`). The server renders it after the agent handoff.

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
4. A brainstorm idea backed only by a generated mockup image (saved under `references/`) beats one with a mismatched screenshot. Never use ASCII art.
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
- Tell the user: "Your {library} session has expired. Reconnect that inspiration source manually before relying on it."
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
mkdir -p "$REPORT_DIR/references" "$REPORT_DIR/work"
```

Do not download Lazyweb database images. Use the `imageUrl`/`image_url` returned by Lazyweb
directly as the `src` in `report-data.json`. Supabase storage-backed image URLs are signed for
365 days and intended for report embedding; if a selected Lazyweb result has no returned image URL, omit the
image and rely on `visionDescription` plus text. Keep `references/` clean — the
render call uploads every file there as an asset, so only files actually
referenced by `report-data.json` belong in it; working files live in `$REPORT_DIR/work/`.

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

### 9. Author the Brainstorm report-data.json

Author `$REPORT_DIR/work/report-data.json` per the schema in "Author
report-data.json" above. Do not hand-write `report.html` or a Markdown version —
the server renders and hosts the report.

**Reverse pyramid:** Lead with the action (which ideas to prototype), then the
ideas, then the analysis. The agent handoff and the recommended ideas come first;
let the cross-category screenshots carry the argument.

Map the brainstorm onto the schema's fields:
- `agent_instructions` — the copy-pastable downstream-agent handoff: `human` (one
  sentence), `task` ("exploring a differentiated {screen} direction using the
  cross-category patterns below"), `recs[]` (the ideas to prototype first, ranked
  by feasibility × novelty), `index_on` (the well-evidenced cross-category
  patterns), `dont_index` (weak-evidence / single-source / aesthetic-only /
  non-transferable items), `dive` ("`/lazyweb-deep-design-research` to validate
  the chosen direction against in-category norms before building"),
  `evidence_basis`.
- `current_state` — the step-2 screenshot if captured, else `null`.
- `patterns[]` — one card per direction. Include "The Obvious Approach" (the
  category "zig", `verdict: "Skip"` or `"Optional"`, deck of 1-2 in-category
  examples), each "Cross-Pollination Idea" (the applied-here pattern as `claim`,
  `verdict` mapped from Prototype→"Build this" / Explore→"Optional" / Skip→"Skip",
  and a `deck[]` of the real cross-category references that prove it), and any
  "Wild Cards" (usually `verdict: "Optional"`, flag the risk in the `claim`). The
  best brainstorm ideas are HIGH novelty AND HIGH feasibility — not weird for
  weird's sake; rank them in `agent_instructions.recs` and by card order.
- `more_refs` — any extra references that do not anchor a specific idea, else `null`.

Each deck entry's `source` ("Lazyweb" | "Web") tells the user where the reference
came from; `company` + `detail` (from `visionDescription`) caption it. Mockups of
how a transferred pattern would look (generated image saved to
`references/mock-{slug}.png`, or skipped if no image tool is available) belong in
the relevant pattern's deck as a `references/{file}` entry — never ASCII art.

## Brainstorm Mindset

- The goal is NOVELTY WITH PURPOSE — not random weirdness
- Every idea should have a "why this could work here" explanation
- If an idea is high novelty but low feasibility, flag it as a Wild Card
- The best brainstorms find 1-2 genuinely transferable patterns, not 10 forced ones
- It's OK to say "I didn't find strong cross-pollination opportunities for this screen type" — that's more honest than padding with irrelevant ideas


## Operating principles (apply to every report you author)

These four rules override convenience. A report that breaks them is
non-conforming, even if every field is present. They govern the *content* you
put in `report-data.json`; the server owns how that content is rendered (decks,
verdict badges, evidence labels, corpus banner, control/variant grids).

**1. Show, don't tell — every claim carries its proof.**
Any assertion — a pattern, idea, "applied-here" transfer, or recommendation —
must be backed by the real screenshot(s) that demonstrate it: put them in that
`patterns[]` card's `deck[]`, never as prose alone. Prevalence words ("most",
"near-universal", "dominant") must be backed by a shown count (set `prevalence`
to "5 of 9 references"), never an adjective alone.

**2. Be opinionated; carry the decision.**
Lead with ONE ranked recommended direction — first in
`agent_instructions.recs` and first in `patterns[]` order. Give every direction
a `verdict` (Build this / Optional / Skip); no ties among top picks, no flat
undifferentiated menu. A "Skip" card still carries its evidence in the `deck[]`
so the skip decision is shown, not just asserted.

**3. Maximize confidence with evidence.**
Back each direction with what worked for OTHER apps (real screenshots in the
`deck[]`) plus a prevalence count where one exists (set `prevalence`). This skill
produces no A/B experiments, so recommendations are design-prevalence-based; say
so honestly rather than implying measured lift. Never let a card render with
neither a visual nor a number behind it.

**4. Be truth-seeking — never overclaim.**
Label evidence strength honestly via each card's `strength` ("Strong" /
"Moderate" / "Thin") and keep the wording directional — this skill has no
measured lift. Forbid comparative-performance verbs ("outperforms",
"underperforms"). When the corpus is single-source, thin, or context-mismatched,
say so in `agent_instructions` (`index_on` / `dont_index`). Tag any reference
whose brand was inferred from a URL/vision-description ("brand inferred — verify")
in its `detail`. Never invent a reference, a metric, or a company name. Never
describe a proposed layout as ASCII/box-drawing art — use a generated mockup
image or rely on the reference screenshots.
