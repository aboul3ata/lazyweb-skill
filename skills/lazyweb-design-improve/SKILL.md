---
name: lazyweb-design-improve
route: "Improve or critique existing UI"
router-terms: improve, critique, feedback, review, make this better, current design, existing screen
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

## CRITICAL: Output Behavior

**This skill produces a hosted report, not a plan.** Regardless of whether you are in
plan mode or not, ALWAYS:

1. Author the report content as `.lazyweb/design-improve/{screen}-{date}/work/report-data.json` (structured content, NOT HTML)
2. Save only current-state and web-captured screenshots under `.lazyweb/design-improve/{screen}-{date}/references/`; embed Lazyweb references directly with their returned `imageUrl`/`image_url`
3. Do NOT create `report.html`, `report.md`, or any other report artifact by hand — the server renders the report
4. Do NOT write improvement content into a plan file
5. Render and host the report with `lazyweb_render_report` (see "Render and host the report" below) — this single call IS the deliverable; producing the report and hosting it are the same action, so there is nothing to skip
6. After the render call returns, show the user a summary of improvement ideas and the shareable link (the report lives only at that URL)
7. Ask the user if the improvements look good
8. If in plan mode, exit plan mode after the user confirms
9. Suggest next steps: "You can now implement these improvements, ask
   `/lazyweb` for more creative ideas, or start building."

---

Capture the current state of a design, find similar screens from the best apps,
and generate 1-5 concrete improvement ideas — each tied to a real reference.

## Render and host the report (the single deliverable)

The report is rendered and hosted **server-side**. Author the report content as
`work/report-data.json` (schema below), then call `lazyweb_render_report` ONCE.
That call fills the Lazyweb report template on the server, validates it, hosts it
at `https://www.lazyweb.com/report/lazyweb/{id}/`, and returns the shareable
link. There is no local `report.html`, no separate publish step, and no token to
read — producing the report and hosting it are the same action, so a finished
report is always a hosted report.

Call it once `work/report-data.json` and every `references/` image exist. The
report dir is `$REPORT_DIR = .lazyweb/design-improve/{topic-slug}-{YYYY-MM-DD}`.

Arguments:
- `report_data`: the parsed `work/report-data.json` object (see "Author report-data.json" below).
- `assets`: every file in `$REPORT_DIR/references/` as `{ "name": <filename>, "b64": <base64 of the bytes> }` — the locally-saved screenshots the report points at via `references/{name}`. Lazyweb references embedded by absolute imageUrl are NOT assets.
- `report_skill`: `"design-improve"`.
- `idempotency_key`: the report dir slug, e.g. `design-improve/{topic-slug}-{YYYY-MM-DD}`. Send the SAME value on every call for this report so a retry returns the same link.
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
render-tested template from it and hosts the result (see "Render and host the
report" above). You never read or write the template, never write fill/render
code, and never open a local report file — the deliverable is the hosted URL.

All strings are RAW — the server does every bit of HTML-attribute and JS-string
escaping (quotes, `<`, apostrophes). Never pre-escape. Image `src` values:
absolute Lazyweb `imageUrl`/`image_url` for Lazyweb references; a relative
`references/{filename}` path for locally-saved current-state, web-capture, and
generated screenshots (each uploaded as an `asset` in the render call). Never use
`file://` URLs or absolute local paths. A missing or invalid required field comes
back from `lazyweb_render_report` as `{ ok:false, code:"REPORT_RENDER_ERROR",
detail:"missing <field>" }` — fix that field in `report-data.json` and call once
more; do not browse-load, screenshot, or vision-inspect anything (the server
validates the report).

```json
{
  "topic": "<report title>",
  "agent_instructions": {
    "human": "<one human sentence: the single most important thing to do>",
    "task": "<what the downstream coding agent is building; fills {TASK} in the handoff>",
    "recs": ["<imperative rec 1>", "<rec 2>", "<rec 3>"],          // >=1 required
    "index_on": "<1-3 well-evidenced signals>",                    // optional
    "dont_index": "<weak-evidence / non-transferable items>",      // optional
    "dive": "<next Lazyweb skill or MCP tool — why>",              // optional
    "evidence_basis": "<Lazyweb screenshots | web captures · DATE>" // optional
  },
  "current_state": null | { "src": "references/current-state.png", "alt": "<alt>", "desc": "<one line>" },  // optional
  "patterns": [   // pattern / recommendation cards. Required UNLESS experiments[] is present.
    { "verdict": "Build this" | "Optional" | "Skip",
      "strength": "Strong"|"Moderate"|"Thin",          // optional badge
      "prevalence": "5 of 9 references",                 // optional count
      "claim": "<one-line claim>",                       // required
      "deck": [ {"src":"<absolute imageUrl OR references/<file>>","alt":"<alt>","source":"Lazyweb"|"Web","company":"<name>","detail":"<key detail>"} ] }
  ],
  "experiments": [   // ab-test-research ONLY. Required if patterns is absent. Rendered as control-vs-variant pairs.
    { "title":"<experiment name>", "change":"<what changed>",
      "control": {"src":"<img>","alt":"<alt>","label":"Control — ..."},
      "variant": {"src":"<img>","alt":"<alt>","label":"Variant — ..."},
      "facts": [ {"k":"Primary metric","v":"paid conversion"}, {"k":"Lift","v":"+18% (p<0.05)"} ],
      "outcome": "Shipped — +18% paid conversion" }
  ],
  "more_refs": null | [ {"src","alt","source","company","detail"} ]   // optional extra references deck
}
```

Rules: at least one of `patterns`/`experiments` must be non-empty. For THIS
skill always use `patterns` (no experiments) — image `src` = the absolute
Lazyweb `imageUrl` for Lazyweb references, a relative `references/<file>` path
for locally-saved current-state and web-capture screenshots.

**Map this skill's content onto the schema:**
- `topic` = "Design Improvement: {Screen/Feature}".
- `agent_instructions` = the downstream-agent handoff. `human` = the single
  highest-impact change in one sentence; `task` = "revising the {screen} to
  close the gaps found against best-in-class references"; `recs` = the
  improvement ideas as imperative lines (highest-impact first); `index_on` =
  the well-evidenced patterns; `dont_index` = weak-evidence / single-source /
  aesthetic-only / non-transferable items; `dive` = "`/lazyweb-ab-test-research`
  if this is a growth/monetization screen, or `/lazyweb-deep-design-research`
  for deeper competitive grounding"; `evidence_basis` = "{Lazyweb screenshots |
  web captures} · {DATE}".
- `current_state` = the user screen being improved (usually present) — save it
  as `references/current-state.png` and reference it here with a one-line
  `desc`. Set `null` only if no current screen exists.
- `patterns[]` = the improvement recommendations, highest-impact first. Each:
  `verdict` ("Build this" / "Optional" / "Skip"), optional `strength`
  (Strong/Moderate/Thin) and `prevalence` count ("seen in 5 of 9 references"),
  a one-line `claim` (what to change and why), and a `deck` of 2-4 real
  references that prove it (caption `detail` = the exact UI detail from
  `visionDescription`; `source` = "Lazyweb" or "Web"; `company` = the brand).
  The proof sits WITH the claim. Better NO image than a mismatched one.
- `more_refs` = an optional gallery of all remaining references used (company,
  source, detail), or `null`.

## Ground the search (run first)

Before searching, ground the work in what the user is building, and avoid guessing when a wrong guess wastes a search:

1. **Detect context.** Run `lazyweb-context-detect` (on `PATH` when installed by setup; otherwise `~/.lazyweb/repos/lazyweb-skill/bin/lazyweb-context-detect`). It prints the project, platform (mobile/desktop), and stack. Use it to bias the `platform` filter and to caption references accurately. (You will also capture the current screen below; context-detect grounds the surrounding product.)
2. **Clarify only what's missing.** If it reports `platform=unknown`, or you can't tell the product/screen from the request, ask the user ONE short clarifying question to pin down product/screen, mobile vs desktop, and the specific outcome. Skip anything the context already answered; don't interrogate when the request is already clear.
3. **Search from multiple angles.** Cast 3-5 `lazyweb_search` queries with different wordings and filters (by screen, by competitor `company`, by `category`, by `platform`, and by `high_design_bar` only when exposed) instead of one, and read each result's `visionDescription` before using it.
4. **Obey the response metadata.** Never repeat an identical query — results are deterministic; page deeper with `offset` and follow `pagination.next_offset`. On `no_matches`/`low_coverage` warnings, use the closest result, strip the query to its core 2-6 word UI pattern, or tell the user the pattern is not covered — don't rephrase the same concept in a loop (style adjectives like "dark"/"minimal" are not searchable facets; judge style from the images). On `company_not_in_library`, use a suggested company or drop the filter.

## When to Use This

- User has an existing screen/page and wants to make it better
- User asks "how can I improve this" or "what's wrong with my design"
- User wants to compare their design against competitors

## When NOT to Use This

- User hasn't built anything yet and wants research -> route to `lazyweb-deep-design-research`
- User wants to see examples of a specific screen type -> route to `lazyweb-lite-design-research`
- User wants creative/unconventional ideas -> route to `lazyweb-design-brainstorm`

## Lazyweb MCP Setup

Use the hosted Lazyweb MCP tools at `https://www.lazyweb.com/mcp` for all Lazyweb database access.

Required current public MCP tools:
- `lazyweb_search` — text search over mobile and desktop screenshots
- `lazyweb_find_similar` — more results like a returned Lazyweb `imageUrl` or image payload
- `lazyweb_compare_image` — visual search from `image_base64` + `mime_type` or `image_url`
- `lazyweb_render_report` — render + host the finished report from `report_data` + reference images, returns the shareable link (the deliverable; see "Render and host the report" above)
- `lazyweb_search_ab_tests` — public mobile-only A/B Test Agent wrapper when growth experiment evidence is needed
- `lazyweb_health` — connectivity check

**Pass `skill: "design-improve"` on every call.** Include `"skill": "design-improve"` in the arguments of each `lazyweb_*` tool call — for example `{"query": "pricing page", "limit": 30, "skill": "design-improve"}`. This is optional analytics metadata Lazyweb uses to understand which skills are used; never drop or change a real argument for it.

**Also pass `version: "<x.y.z>"` on every call.** Read `~/.lazyweb/VERSION` once per session at skill start (e.g. `cat "$HOME/.lazyweb/VERSION" 2>/dev/null || echo 0.0.0`); fall back to `"0.0.0"` if the file is missing or unreadable — never block on this. Include `"version": "<that-value>"` in the arguments of every `lazyweb_*` tool call alongside the existing `skill` arg — for example `{"query": "pricing page", "limit": 30, "skill": "design-improve", "version": "0.4.5"}`. Optional analytics metadata Lazyweb uses to track which skill-pack versions are running; never drop or change a real argument for it.

Some backend/internal MCP surfaces may also expose `lazyweb_find_experiments`,
`lazyweb_recent_experiments`, `list_companies_by_categories`, canonical tools
such as `search_screenshots`, `list_filters`, `vision_screenshots`, and
`metadata_screenshots`, or `high_design_bar` filters. Use those only when the
live tool list and schema expose them. Prefer the public `lazyweb_*` gateway
names in this skill.

Before searching, verify MCP is available by listing tools and running
`lazyweb_health`.

**If Lazyweb MCP is not installed or auth fails:**
Tell the user: "Lazyweb MCP is not installed. Run `curl -fsSL https://www.lazyweb.com/install.sh | bash`, reload this client, then rerun this skill. Lazyweb is free; the bearer token is
only for no-billing UI reference tools and is okay in ignored local config."
Then proceed with web research only — the skill still works, just without Lazyweb's database.

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

Save the screenshot as `references/current-state.png` in the report directory
(`$REPORT_DIR`); this becomes `current_state.src` in `report-data.json`.

If no screenshot can be captured, ask the user to provide one. Don't proceed without a visual of the current state.

### 2. Find Similar Screens in Lazyweb

Use image comparison to find visually similar screens. Read the local screenshot
bytes, base64 encode them, detect the MIME type, then call `lazyweb_compare_image`:

```json
{"image_base64":"<base64 file bytes>","mime_type":"image/png","limit":30}
```

Also do text searches for the screen type with multiple angles:

```json
{"query":"<description of the screen>","limit":30}
{"query":"<alternative description>","platform":"desktop","limit":30}
{"query":"<specific component>","limit":30}
```

If you know the category, include `"category":"<category>"`.

**Platform routing:** Lazyweb has both mobile app screenshots and desktop/web site screenshots.
- `--platform mobile` — mobile app screenshots only
- `--platform desktop` — desktop/web site screenshots only
- `--platform all` (default) — search both, results grouped desktop-first then mobile
- A mac app, SaaS dashboard, or web product → use `--platform desktop`
- An iPhone/Android app → use `--platform mobile`
- General research or cross-platform → omit (searches both)

Each result includes a `platform` field ("mobile" or "desktop") so you know the source.
Desktop results also include a `pageUrl` field with the original site URL.

**Explore generously.** Run 3-5 searches to find the best references. More raw material
means better improvement ideas.

**HIGH BAR FOR REFERENCES:** Each Lazyweb result includes a `visionDescription` field —
a text description of what's actually in the screenshot. Read it.

**Rules for attaching references:**
1. Read `visionDescription` before using ANY screenshot
2. The screenshot MUST directly illustrate the improvement you're suggesting
3. If `visionDescription` doesn't match your improvement idea — DO NOT USE IT
4. A report with 3 perfectly-matched references beats 10 loosely-related ones
5. Better to have NO image than a mismatched one — give the idea a one-line `claim` and an empty/short `deck` rather than attaching an off-point screenshot.
6. Never guess what's in a screenshot — use `visionDescription` for captions

Mismatched references destroy user trust faster than anything else.

### 3. Pull Experiment Evidence

When the user is optimizing a growth, monetization, onboarding, checkout, paywall,
activation, or cancellation screen, first inspect the live Lazyweb tool list. If
only the current public gateway is exposed, call `lazyweb_search_ab_tests` with
the target screen, product/category context, conversion goal, and constraints.
If backend/internal tools are exposed, call `lazyweb_find_experiments` with the
same screen/category filters, and use `lazyweb_recent_experiments` for
latest/recent tests. If the user asks for high-design-bar or premium examples,
include `"high_design_bar": true` only on tools whose live schema supports it.

Treat `_experiments` as limited screenshot-diff evidence: use it to strengthen or
weaken each recommendation, but do not claim measured lift unless the evidence says
so directly.

### 4. Search Connected Inspiration Libraries

Check if `~/.lazyweb/libraries.json` exists and has connected libraries:

```bash
cat ~/.lazyweb/libraries.json 2>/dev/null
```

If libraries are configured, search each one using the browse tool. For each library:

1. Navigate to the library's search URL: `$LB goto "{searchUrl}"`
2. Take a snapshot to understand the page: `$LB snapshot -i`
3. Search for the same screen type the user is improving: `$LB fill @eN "{query}"`
4. Submit and wait for results: `$LB press Enter` then `$LB snapshot -i`
5. Browse through results — click into ones that look like strong alternatives to the current design
6. Screenshot the best results: `$LB screenshot "$REPORT_DIR/references/{library}-{company}-{screen}.png"`
7. Note what's in each screenshot for accurate captions

**Quality bar**: Only use screenshots that directly illustrate an improvement idea.
A reference from Mobbin that doesn't clearly show a better approach than the current
design is useless — skip it.

**If the library session has expired** (login wall, redirect to sign-in):
- Tell the user: "Your {library} session has expired. Reconnect that inspiration source manually before relying on it."
- Skip this library and continue with other sources.

Label all library-sourced references: `[Mobbin]`, `[Savee]`, etc.

### 5. Web Research + Live Screenshot Capture (REQUIRED)

**Always supplement** with live competitor screenshots and recent examples.

**Step A — Find competitor URLs via WebSearch:**
- Search for "[screen type] best design examples [current year]"
- Search for "[competitor] [screen type] design"
- Search for "best [screen type] UX"
Collect 3-5 URLs of best-in-class examples.

**Step B — Capture live screenshots:**
```bash
if [ -x "$LB" ]; then
  $LB goto "https://competitor.com/page"
  $LB screenshot "$REPORT_DIR/references/competitor-page.png"
fi
```

If no browse tool is available, describe web examples in the report without images.

**Platform balance:** Aim for at least 50% same-platform references.

### 6. Prepare Image References

```bash
REPORT_DIR="$(pwd)/.lazyweb/design-improve/{screen-slug}-{YYYY-MM-DD}"
mkdir -p "$REPORT_DIR/references" "$REPORT_DIR/work"
```

Copy the current screenshot:
```bash
cp <current-screenshot> "$REPORT_DIR/references/current-state.png"
```

Do not download Lazyweb database images. Use the `imageUrl`/`image_url` returned by Lazyweb
directly as the image `src` in `report-data.json`. Supabase storage-backed image URLs are signed for
365 days and intended for report embedding; if a selected Lazyweb result has no returned image URL, omit the
image and rely on `visionDescription` plus text.

For web screenshots:
```bash
if [ -x "$LB" ]; then
  $LB goto "https://example.com"
  $LB screenshot "$REPORT_DIR/references/{company}-{screen}.png"
fi
```

**Keep `references/` clean:** the render call uploads every file in
`references/` as an asset. Only files actually referenced by `report-data.json`
belong there (current-state and web captures); working files live in
`$REPORT_DIR/work/`, which is never uploaded.

### 7. Analyze and Generate Ideas

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

### 8. Author the report content (report-data.json)

Write `$REPORT_DIR/work/report-data.json` per the schema in "Author
report-data.json" above. You author the report as **content** — the server
renders and hosts it. Do not hand-write `report.html` or a Markdown version.

**Reverse pyramid:** lead with what to do, then show the evidence. Order
`patterns[]` highest-impact first; mark the top idea `"verdict": "Build this"`.

Fill the schema from this skill's content:
- `topic` = "Design Improvement: {Screen/Feature}".
- `agent_instructions` carries the downstream-agent handoff (`human`, `task`,
  `recs`, and the optional `index_on` / `dont_index` / `dive` /
  `evidence_basis`). `task` = "revising the {screen} to close the gaps found
  against best-in-class references"; `dive` = "`/lazyweb-ab-test-research` if
  this is a growth/monetization screen, or `/lazyweb-deep-design-research` for
  deeper competitive grounding".
- `current_state` = the screen being improved (`references/current-state.png`)
  with a one-line `desc`; `null` only when no current screen exists.
- `patterns[]` = the improvement ideas. Each carries a one-line `claim` (what
  to change and why), a `verdict`, optional `strength` and `prevalence`, and a
  `deck` of 2-4 real references that prove it. The proof sits WITH the claim —
  caption `detail` comes from each reference's `visionDescription`, `source` is
  "Lazyweb" or "Web", `company` is the brand. Better NO image than a mismatched
  one.
- `more_refs` = the remaining references used as a closing gallery, or `null`.

Each pattern's `deck` is the "show, don't tell" evidence: every idea points to
the specific reference(s) that inspired it. Quantify prevalence with a shown
count in `prevalence` ("seen in 5 of 9 references"), never an adjective alone.
Tag a brand inferred from a URL/vision description in its `detail` ("brand
inferred — verify").

## Important Caveats

- Not every reference is relevant. A high similarity score doesn't mean the pattern applies to the user's context. Use judgment.
- "Improve" doesn't mean "copy the most popular pattern." Sometimes the user's current approach is intentionally different — ask before suggesting radical changes.
- Focus improvement ideas on things that would have the highest impact with the least effort. Lead with the quick wins.


## Operating principles (REQUIRED - overrides convenience)

These four rules govern the content you author into `report-data.json`. The
server renders the proof decks, verdict badges, evidence labels, and corpus
banner from that content — your job is to give it honest, evidence-backed
fields. A report that breaks these rules is non-conforming even if every field
is present.

**1. Show, don't tell — every claim carries its proof.**
Every improvement idea (`patterns[]` entry) must carry the real screenshot(s)
that demonstrate it in its `deck` — the proof travels WITH the claim, never as
a prose pointer to another section. Give each idea 2-4 references in its `deck`
so the reader can step through the proof. Prevalence words ("most",
"near-universal", "dominant") must be backed by a shown count in `prevalence`
("5 of 9 references"), never an adjective alone.

**2. Be opinionated; carry the decision.**
Order `patterns[]` highest-impact first and mark the top idea
`"verdict": "Build this"` — the decision lives in the human-visible body, not
only in the agent handoff. Tag every other idea `"Optional"` or `"Skip"`. No
ties among top picks; no flat undifferentiated menu. A `"Skip"` idea still
carries its `deck` so the skip decision is shown, not just asserted.

**3. Maximize confidence with evidence + data.**
Back each idea with what worked for OTHER apps (real screenshots in `deck`)
PLUS supporting data: a `prevalence` count across the corpus ("seen in N of M
examples") and, where the screen is growth/monetization, A/B experiment
evidence via `lazyweb_search_ab_tests`. If no experiment data exists, say so in
the `claim`/`detail` ("no experiment data found — design-prevalence-based") and
let the prevalence count be the directional signal. Never ship an idea with
neither a visual nor a number behind it.

**4. Be truth-seeking — never overclaim.**
Label evidence strength honestly via each idea's `strength`
(Strong/Moderate/Thin) and the wording of its `claim`/`detail`: measured (real
lift number) vs directional (visual prevalence, no lift) vs single-source /
off-category. Forbid comparative-performance verbs ("outperforms",
"underperforms") unless a measurement backs them. When the corpus is
single-source, thin, or context-mismatched, say so plainly in the lead idea's
`claim` and in `agent_instructions.dont_index`. Tag any reference whose brand
was inferred from a URL/vision description in its `detail` ("brand inferred —
verify"). Back absence claims with evidence-of-search (queries run × screens
reviewed + the closest near-miss). Never invent a reference, a metric, or a
company name.

