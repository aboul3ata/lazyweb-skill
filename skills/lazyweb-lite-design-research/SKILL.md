---
name: lazyweb-lite-design-research
route: "Lite UI examples / refs, no report"
router-terms: examples, references, screenshots, show me, inspiration, ui references
description: |
  Find app screenshots and UI references quickly. Embeds Lazyweb results by
  storage-backed URL and groups them by pattern. Use when the user wants to see examples of a specific
  screen, UI element, or flow without a full research report.
  Trigger on: "show me examples of", "how do other apps do", "design inspiration for",
  "UI reference for", "what does X's app look like", "find screenshots of",
  "show me how", "references for".
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

# Lazyweb Lite Design Research

Find real app screenshots fast, embed Lazyweb images by URL, and group by pattern.
Lighter than deep design research — no competitive analysis, no anti-patterns. Just find → group → show.

## CRITICAL: Output Behavior

**This skill produces a hosted report, not a plan.** Regardless of whether you are in plan mode
or not, ALWAYS:

1. Author the report content as `.lazyweb/lite-design-research/{topic}-{date}/work/report-data.json` (structured content, NOT HTML)
2. Embed Lazyweb references directly with their returned `imageUrl`/`image_url`; save only current-state and web-captured screenshots under `.lazyweb/lite-design-research/{topic}-{date}/references/`
3. Do NOT create `report.md`, `report.html`, or any other report artifact by hand — the server renders the report
4. Do NOT write research content into a plan file
5. Render and host the report with `lazyweb_render_report` (see "Render and host the report" below) — this single call IS the deliverable; producing the report and hosting it are the same action, so there is nothing to skip
6. After the render call returns, show the user a concise summary of the patterns found and the shareable link (the report lives only at that URL)
7. Ask the user if the references look good
8. If in plan mode, exit plan mode after the user confirms
9. Suggest next steps: "You can now use these references to inform your design,
   ask `/lazyweb` for deeper design research, or start building."

## Render and host the report (the single deliverable)

The report is rendered and hosted **server-side**. Author the report content as
`work/report-data.json` (schema below), then call `lazyweb_render_report` ONCE.
That call fills the Lazyweb report template on the server, validates it, hosts it
at `https://www.lazyweb.com/report/lazyweb/{id}/`, and returns the shareable
link. There is no local `report.html`, no separate publish step, and no token to
read — producing the report and hosting it are the same action, so a finished
report is always a hosted report.

Call it once `work/report-data.json` and every `references/` image exist. The
report dir is `$REPORT_DIR = .lazyweb/lite-design-research/{topic-slug}-{YYYY-MM-DD}`.

Arguments:
- `report_data`: the parsed `work/report-data.json` object (see "Author report-data.json" below).
- `assets`: every file in `$REPORT_DIR/references/` as `{ "name": <filename>, "b64": <base64 of the bytes> }` — the locally-saved screenshots the report points at via `references/{name}`. Lazyweb references embedded by absolute imageUrl are NOT assets.
- `report_skill`: `"lite-design-research"`.
- `idempotency_key`: the report dir slug, e.g. `lite-design-research/{topic-slug}-{YYYY-MM-DD}`. Send the SAME value on every call for this report so a retry returns the same link.
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

All strings are RAW — the server does every bit of HTML-attribute and JS-string
escaping (quotes, `<`, apostrophes in company names). Never pre-escape. A missing
or invalid required field comes back from `lazyweb_render_report` as
`{ ok:false, code:"REPORT_RENDER_ERROR", detail:"missing <field>" }` — fix that
field in `report-data.json` and call once more; do not browse-load, screenshot,
or vision-inspect anything, the server validates the report.

**Image `src` values:** use the absolute Lazyweb `imageUrl`/`image_url` URL for
Lazyweb references; use a relative `references/{filename}` path for locally saved
current-state and web-captured screenshots (each uploaded as an `asset` in the
render call). Never use `file://` URLs or absolute local paths (`/Users/...`,
`C:\...`).

STANDARD report-data.json schema (the server fills the Lazyweb template from this; ALL strings RAW — the server escapes):

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
  "more_refs": null
}
```

Field rules:
- `topic` (required): the report title.
- `agent_instructions` (required): `human`, `task`, and `recs` (>=1 imperative line) are required; `index_on`, `dont_index`, `dive`, `evidence_basis` are optional. For THIS skill, `task` = "building {screen/component} using these grouped real-app references as a visual baseline", and `dive` → "`/lazyweb-deep-design-research` for full competitive analysis + recommendations, or `lazyweb_find_similar` on the closest reference".
- `current_state` (optional): `null` unless a current screen was captured in step 1, otherwise `{ "src": "references/current-state.png", "alt": "<alt>", "desc": "<one line>" }`.
- `patterns` (required for this skill): the grouped reference patterns. Each card = a `verdict` (`"Build this"` | `"Optional"` | `"Skip"`), an optional `strength` badge (`"Strong"` | `"Moderate"` | `"Thin"`), an optional `prevalence` count, a required one-line `claim`, and a `deck[]` of the real proof screenshots. Each deck entry: `src` (absolute Lazyweb `imageUrl`, or `references/<file>` for a locally saved shot), `alt`, `source` (`"Lazyweb"` | `"Web"` | etc.), `company`, and a `detail` key-fact caption.
- `more_refs` (optional): `null`, or an extra `deck` of strong references that don't map to a named pattern — each entry `{src, alt, source, company, detail}`. The `patterns` cards already carry their own proof decks; use `more_refs` only for unattached references.

At least one `patterns` entry must be present. Map the skill's existing report sections onto the schema: the Agent Instructions block → `agent_instructions`; the optional Current State section → `current_state`; the Patterns cards (verdict + claim + deck of proof screenshots) → `patterns[]`; the optional "More references" deck → `more_refs`. (This skill has no experiments.)

## Ground the search (run first)

Before searching, ground the work in what the user is building, and avoid guessing when a wrong guess wastes a search:

1. **Detect context.** Run `lazyweb-context-detect` (on `PATH` when installed by setup; otherwise `~/.lazyweb/repos/lazyweb-skill/bin/lazyweb-context-detect`). It prints the project, platform (mobile/desktop), and stack. Use it to bias the `platform` filter and to caption references accurately.
2. **Clarify only what's missing.** If it reports `platform=unknown`, or you can't tell the product/screen from the request, ask the user ONE short clarifying question to pin down product/screen, mobile vs desktop, and the specific outcome. Skip anything the context already answered; don't interrogate when the request is already clear.
3. **Search from multiple angles.** Cast 3-5 `lazyweb_search` queries with different wordings and filters (by screen, by competitor `company`, by `category`, by `platform`) instead of one, and read each result's `visionDescription` before using it.
4. **Obey the response metadata.** Never repeat an identical query — results are deterministic; page deeper with `offset` and follow `pagination.next_offset`. On `no_matches`/`low_coverage` warnings, use the closest result, strip the query to its core 2-6 word UI pattern, or tell the user the pattern is not covered — don't rephrase the same concept in a loop (style adjectives like "dark"/"minimal" are not searchable facets; judge style from the images). On `company_not_in_library`, use a suggested company or drop the filter. Building a whole app or page? Run one search per screen/section, not one broad query.

## When to Use This

- User wants to see a specific type of screen ("show me pricing pages")
- User wants visual references for what they're building
- User asks "what does X look like" or "how do other apps do Y"

## When NOT to Use This

- User wants deep analysis, competitive research, or best practices -> route to `lazyweb-deep-design-research`
- User has an existing design and wants feedback -> route to `lazyweb-design-improve`
- User wants creative/unconventional ideas -> route to `lazyweb-design-brainstorm`

## Lazyweb MCP Setup

Use the hosted Lazyweb MCP tools at `https://www.lazyweb.com/mcp` for all Lazyweb database access.

Required MCP tools:
- `lazyweb_search` — text search over mobile and desktop screenshots
- `lazyweb_find_similar` — more results like a returned Lazyweb `imageUrl` or image payload
- `lazyweb_compare_image` — visual search from `image_base64` + `mime_type` or `image_url`
- `lazyweb_health` — connectivity check
- `lazyweb_render_report` — render + host the finished report from `report_data` + reference images, returns the shareable link (the deliverable; see "Render and host the report" above)

**Pass `skill: "lite-design-research"` on every call.** Include `"skill": "lite-design-research"` in the arguments of each `lazyweb_*` tool call — for example `{"query": "pricing page", "limit": 30, "skill": "lite-design-research"}`. This is optional analytics metadata Lazyweb uses to understand which skills are used; never drop or change a real argument for it.

**Also pass `version: "<x.y.z>"` on every call.** Read `~/.lazyweb/VERSION` once per session at skill start (e.g. `cat "$HOME/.lazyweb/VERSION" 2>/dev/null || echo 0.0.0`); fall back to `"0.0.0"` if the file is missing or unreadable — never block on this. Include `"version": "<that-value>"` in the arguments of every `lazyweb_*` tool call alongside the existing `skill` arg — for example `{"query": "pricing page", "limit": 30, "skill": "lite-design-research", "version": "0.4.5"}`. Optional analytics metadata Lazyweb uses to track which skill-pack versions are running; never drop or change a real argument for it.

These are the current public gateway names. Backend/internal surfaces may also
expose canonical tools such as `search_screenshots`, `list_filters`,
`vision_screenshots`, and `metadata_screenshots`; prefer the `lazyweb_*` names
in this skill. Use `high_design_bar: true` only when the live tool schema exposes
it and the user asks for high-design-bar companies, premium examples,
best-designed apps, or stronger visual-quality filtering. That filter is backed
by `companies.high_design_bar = true`.

Before searching, verify MCP is available by listing tools and running
`lazyweb_health`.

**If Lazyweb MCP is not installed or auth fails:**
Tell the user: "Lazyweb MCP is not installed. Run `curl -fsSL https://www.lazyweb.com/install.sh | bash`, reload this client, then rerun this skill. Lazyweb is free; the bearer token is
only for no-billing UI reference tools and is okay in ignored local config."
Then proceed with web research only.

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

### 1. Capture Current State (if applicable)

If the user is looking for references for a specific page or app they're building
(not a general topic), capture the current state:

- **Running dev server or URL available:** Use preview/browse tools to screenshot it
- **Mobile app:** Ask user to provide a screenshot
- **No specific page:** Skip this step

Save as `$REPORT_DIR/references/current-state.png` and set the `current_state`
field in `report-data.json` to `{ "src": "references/current-state.png", "alt":
"<alt>", "desc": "<one line of what we're looking at>" }` (and upload the file as
an `asset` in the render call). Leave `current_state` as `null` when no current
screen was captured.

This grounds the collection — the reader sees what they have before seeing the references.

### 2. Search Lazyweb

Call `lazyweb_search` 2-4 times with different angles:

```json
{"query":"<query>","limit":30}
{"query":"<alternative framing>","limit":30}
{"query":"<more specific variant>","platform":"desktop","limit":30}
```

**Query tips:**
- Think in concrete UI elements: "pricing page with toggle", "dark mode settings", "onboarding with progress bar"
- Use `--category` for domain filtering: "Health & Fitness", "Finance", "Productivity"
- Use `--company` to find specific apps: `--company "stripe"`
- Use `high_design_bar: true` to filter for quality only when the live schema exposes it

**Platform routing:** Lazyweb has both mobile app screenshots and desktop/web site screenshots.
- `--platform mobile` — mobile app screenshots only
- `--platform desktop` — desktop/web site screenshots only
- `--platform all` (default) — search both, results grouped desktop-first then mobile
- A mac app, SaaS dashboard, or web product → use `--platform desktop`
- An iPhone/Android app → use `--platform mobile`
- General research or cross-platform → omit (searches both)

Each result includes a `platform` field ("mobile" or "desktop") so you know the source.
Desktop results also include a `pageUrl` field with the original site URL.

**Assess quality:** `matchCount` 2/3+ = strong. 1/3 = weak. `similarity` > 0.4 = good.

**Explore generously.** Don't stop at one search. Try 2-4 different phrasings to
cast a wide net. More raw material = better grouping.

**HIGH BAR FOR REFERENCES:** Each Lazyweb result includes a `visionDescription` field —
a text description of what's actually in the screenshot. Read it.

**Rules for attaching references:**
1. Read `visionDescription` before using ANY screenshot
2. The screenshot MUST directly illustrate the pattern you're grouping it under
3. If `visionDescription` doesn't match — DO NOT USE IT
4. Better to have fewer, perfectly-matched references than many loose ones
5. Never guess what's in a screenshot — use `visionDescription` for captions
6. If there's no visionDescription, skip the screenshot

Mismatched references destroy user trust faster than anything else.

### 3. Search Connected Inspiration Libraries

Check if `~/.lazyweb/libraries.json` exists and has connected libraries:

```bash
cat ~/.lazyweb/libraries.json 2>/dev/null
```

If libraries are configured, search each one using the browse tool. For each library:

1. Navigate to the library's search URL: `$LB goto "{searchUrl}"`
2. Take a snapshot to understand the page: `$LB snapshot -i`
3. Search for the topic: `$LB fill @eN "{query}"`
4. Submit and wait for results: `$LB press Enter` then `$LB snapshot -i`
5. Browse through results — screenshot the most relevant ones
6. Save to: `$LB screenshot "$REPORT_DIR/references/{library}-{company}-{screen}.png"`

**Keep it fast**: This is the lite design research skill. Don't deep-dive into every result.
Grab the best 3-5 screenshots per library and move on.

**If the library session has expired** (login wall, redirect to sign-in):
- Tell the user: "Your {library} session has expired. Reconnect that inspiration source manually before relying on it."
- Skip this library and continue with other sources.

Label all library-sourced references: `[Mobbin]`, `[Savee]`, etc.

### 4. Web Research + Live Screenshot Capture

**Always supplement** Lazyweb with live web captures for the most current examples.

**Step A — Find URLs via WebSearch:**
- Search for "[screen type] design examples [current year]"
- Search for "[competitor] [screen type]"
Collect 2-5 interesting URLs.

**Step B — Capture live screenshots:**
```bash
if [ -x "$LB" ]; then
  $LB goto "https://example.com/page"
  $LB screenshot "$REPORT_DIR/references/example-page.png"
fi
```

If the browse tool is not available, describe web examples in the report without images.

**Platform balance:** Aim for at least 50% same-platform references.

### 5. Download References

```bash
REPORT_DIR="$(pwd)/.lazyweb/lite-design-research/{topic-slug}-{YYYY-MM-DD}"
mkdir -p "$REPORT_DIR/references" "$REPORT_DIR/work"
```

Do not download Lazyweb database images. Use the `imageUrl`/`image_url` returned by Lazyweb
directly as the deck entry `src` in `report-data.json`. Supabase storage-backed image URLs are signed for
365 days and intended for report embedding; if a selected Lazyweb result has no returned image URL, omit the
image and rely on `visionDescription` plus text.

For web-captured examples:
```bash
if [ -x "$LB" ]; then
  $LB goto "https://example.com"
  $LB screenshot "$REPORT_DIR/references/{company}-{screen}.png"
fi
```

### 6. Author the report content (report-data.json)

Author `$REPORT_DIR/work/report-data.json` per the STANDARD schema in "Author
report-data.json" above. Do NOT write `report.html` or a Markdown version — the
server renders the report from this structured data; you only choose content and
image `src` values.

**Reverse pyramid:** Lead with the patterns (the answer); the proof screenshots
in each pattern's `deck` carry the evidence.

**Group references by pattern, not as a flat list.** Each `patterns[]` card is one
visual/functional pattern: a `verdict` (`Build this` / `Optional` / `Skip`), an
optional `strength` and `prevalence`, a one-line `claim`, and a `deck[]` of the
real screenshots that prove it. Don't just list brand names — show what connects
the references. For each deck entry, fill `company`, `source` (`Lazyweb` / `Web` /
`Mobbin` / etc.), and a one-line `detail` that ties the reference to the pattern
and names the key visual detail to borrow or avoid. The server handles the
snap-carousel layout, desktop-viewport cropping, and whole-screen mobile
rendering — you do not write any HTML or CSS for it.

Map the report's sections onto the schema fields:

- **Agent Instructions** → `agent_instructions`. One human sentence in `human`,
  then `task`, `recs[]` (>=1 imperative line), and optional `index_on`,
  `dont_index`, `dive`, `evidence_basis`. The server renders the copy-pastable
  downstream-agent handoff from these fields — you do not write the handoff block
  yourself. For THIS skill, `task` = "building {screen/component} using these
  grouped real-app references as a visual baseline", and `dive` →
  "`/lazyweb-deep-design-research` for full competitive analysis +
  recommendations, or `lazyweb_find_similar` on the closest reference".
- **Current State** → `current_state` (only if a current screen was captured in
  step 1; otherwise `null`).
- **Patterns** → `patterns[]` (required; at least one).
- **More references** → `more_refs` (optional; only strong references that don't
  map to a named pattern).

**Conciseness & "show, don't tell":** lead with value (Agent Instructions and the
dominant pattern come first); make the case with VISUAL evidence (the deck
screenshots), not paragraphs; index the "why" on evidence, not adjectives. Back
prevalence words ("most", "dominant") with a shown `prevalence` count, never an
adjective alone.

### 7. Render and host (the deliverable)

Once `work/report-data.json` and every `references/` image exist, call
`lazyweb_render_report` exactly once per "Render and host the report" above. That
single call renders, validates, and hosts the report and returns the shareable
link; there is no `report.html` to write or open. Surface the link to the user.

### 8. Follow-up Strategies

- **"More like this"** → call `lazyweb_find_similar` with `{"image_url":"<returned Lazyweb imageUrl>","limit":10}`
- **"Same company"** → call `lazyweb_search` with `{"query":"<query>","company":"<name>","limit":30}`
- **"Different style"** → Rephrase query emphasizing the desired difference
- **"What about competitors?"** → Search for the same screen across different companies
- **"Higher design bar"** → call `lazyweb_search` with `{"high_design_bar":true}` only when exposed


## Operating principles (REQUIRED - overrides convenience)

These four rules override convenience. They govern the CONTENT you author in
`report-data.json`; the server owns all layout, CSS, carousels, and the footer.
A report that breaks them is non-conforming, even if every field is present.

**1. Show, don't tell — every claim carries its proof.**
Every pattern `claim` must be backed by the real screenshot(s) in its `deck`.
Never assert a pattern with no deck entries. Prevalence words ("most",
"near-universal", "dominant") must be backed by a shown count in the `prevalence`
field or the deck `detail` ("5 of 9 references"), never an adjective alone. The
server renders the deck as a snap-carousel beside the claim — you only supply the
references.

**2. Be opinionated; carry the decision.**
Lead with the strongest pattern first (`patterns[0]`), and set each card's
`verdict` honestly — `Build this` for the table-stakes / recommended move,
`Optional` for situational ones, `Skip` for anti-patterns. No flat
undifferentiated menu; order IS the ranking. A `Skip` card still carries its deck
so the skip decision is shown by the screenshot, not just asserted.

**3. Maximize confidence with evidence + data.**
Back each pattern with what worked for OTHER apps (the real screenshots in its
deck) PLUS a count: set `prevalence` ("seen in N of M references") and an honest
`strength` (`Strong` / `Moderate` / `Thin`). Never let a pattern stand with
neither a visual nor a number behind it.

**4. Be truth-seeking — never overclaim.**
Set `strength` honestly: `Strong` for a well-evidenced pattern, `Thin` for a
single-source or off-category one. Forbid comparative-performance verbs
("outperforms", "underperforms") in any `claim` or `detail` — this skill has no
measured lift. When evidence is single-source, thin, or context-mismatched, say
so in `agent_instructions.evidence_basis` and `dont_index`. Tag any reference
whose brand was inferred from a URL/vision-description in its `detail` ("brand
inferred — verify"). State absence claims with evidence-of-search ("0 of 159
screens reviewed"). Never invent a reference, a metric, or a company name. Read
each result's `visionDescription` before attaching it, and write the deck `detail`
and `alt` from what the screenshot actually shows.
