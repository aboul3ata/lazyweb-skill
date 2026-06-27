---
name: lazyweb-design-create
route: "INTERNAL — create/greenfield backend for lazyweb-design"
router-terms: create, greenfield, new screen from scratch, design from scratch
description: |
  INTERNAL create / greenfield backend. NOT a user-facing slash command — it is
  reached via `/lazyweb-design` with `objective=create`, which redirects here for
  designing a NEW product screen from scratch (no existing screen to ground on).
  Combines Lazyweb's screenshot database with web research and produces a
  prototype-first HTML report with side-by-side prototypes and a clustered inspo
  map. Do not route users here directly; route them to `/lazyweb-design` and let
  the create objective hand off to this backend.
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

# Lazyweb Deep Design Research

Evidence-backed design research that reads the user's current screen, names its
frictions, forms 2-4 genuinely divergent redesign bets, and renders a visual-first
HTML report where the recommended prototype sits side by side with the control.

People learn by seeing. Every claim in the report is carried by a large, legible
visual; nothing important hides behind a click. Chrome stays quiet: no chip
clutter, no legend tables, no explanatory paragraphs next to the proof.

## CRITICAL: Output Behavior

**This skill produces FILES, not a plan.** Regardless of whether you are in plan mode
or not, ALWAYS:

1. Author the report content as `.lazyweb/deep-design-research/{topic}-{date}/work/report-data.json` (structured content, NOT HTML)
2. Embed Lazyweb references directly with their returned `imageUrl`/`image_url`; save only current-state and web-captured screenshots under `.lazyweb/deep-design-research/{topic}-{date}/references/`
3. Do NOT create `report.md`, `report.html`, or any other report artifact by hand — the server renders the report
4. Do NOT write research content into a plan file
5. Render and host the report with `lazyweb_render_report` (see "Render and host the report" below) — this single call IS the deliverable; producing the report and hosting it are the same action, so there is nothing to skip
6. After the render call returns, show the user a concise summary, the recommended bet, and the shareable link (the report lives only at that URL)
7. Ask the user if the research looks good
8. If in plan mode, exit plan mode after the user confirms - the research is done
9. Suggest next steps: "You can now use this research to inform your implementation,
   ask `/lazyweb` to improve your current design, or start building."

The visible report is: **Agent Instructions**, **Goal**, **Recommendation**,
and optional **Inspo** — in that order. Do not produce
the older busy structure with key examples, findings, sources, broad
recommendation lists, or long prose analysis sections.

The Recommendation is built like `lazyweb-design`'s hypothesis
engine, with screenshot evidence taking the role experiment evidence plays
there: read the control, name its specific frictions, form 2-4 falsifiable and
structurally divergent bets (Safe bet / Bold bet / Wild card — a thinking
discipline, not visible chips), prototype each as a generated image, and carry
the decision. When a current page or screenshot exists, render `Control` and
the recommended prototype **side by side in equal, height-locked frames** with
a ◀ ▶ variant switcher on the right frame so the user can flip through the
other bets in place; runner-up bets also appear in a snap carousel of
same-size cards. Prefer generated bitmap prototype images over hand-coded HTML
mockups when image generation is available; use HTML/CSS only as a fallback or
when the user asks for implementation-ready code. Generate prototype images in
parallel at medium effort by default, or low effort when the user asks for
speed/exploration.

## Render and host the report (the single deliverable)

The report is rendered and hosted **server-side**. You author the report
content as `work/report-data.json`, then call `lazyweb_render_report` ONCE.
That call fills the canonical template on the server, validates it, hosts it at
`https://www.lazyweb.com/report/lazyweb/{id}/`, and returns the shareable link.
There is no local `report.html` to write, no separate publish step, and no
token to read — producing the report and hosting it are the same action, so a
finished report is always a shared report.

Call it once `work/report-data.json` and every `references/` image exist. The
report dir is `$REPORT_DIR = .lazyweb/deep-design-research/{topic-slug}-{YYYY-MM-DD}`.

Arguments:
- `report_data`: the parsed `work/report-data.json` object (see "Author report-data.json" below).
- `assets`: every file in `$REPORT_DIR/references/` as `{ "name": <filename>, "b64": <base64 of the bytes> }` — the control screenshot and each generated prototype image the report points at via `references/{name}`. Lazyweb references embedded by absolute `imageUrl` are NOT assets; only locally saved files. (Note: migrating these render assets off inline base64 to the presigned upload flow is Phase 2 — out of scope here; keep `assets:[{b64}]` as-is.)
- `report_skill`: `"deep-design-research"`.
- `idempotency_key`: the report dir slug, e.g. `deep-design-research/{topic-slug}-{YYYY-MM-DD}`. Send the SAME value on every call for this report so a retry returns the same link instead of a duplicate.
- `version`: the value you read from `~/.lazyweb/VERSION` at skill start.

Handle the result:
- `{ ok: true, url }` — the report is live. Show "Shareable link: {url} (unlisted - anyone with the link can view)", then `open "{url}"` in the user's browser (skip `open` in a headless/CI/no-GUI environment and just print the link).
- `{ ok: false, code: "REPORT_RENDER_ERROR", detail }` — `detail` names the missing or invalid `report_data` field (e.g. `missing data.topic`, `bets must have 2-4 entries`). Fix that field in `work/report-data.json` and call ONCE more.
- `{ ok: false, code: "REPORT_TOO_LARGE" }` — the embedded screenshots are too large. Reduce their number/size and retry once.
- any other `{ ok: false }` — tell the user hosting failed and why (the `error` field). There is no local copy, so they need the link or the reason.

The server fills a fixed, render-tested template and rejects an incomplete
`report_data` (missing fields → `REPORT_RENDER_ERROR`), so a partial or skeleton
report can never be hosted — that replaces the old client-side contract gate.
Never hand-render HTML or fall back to a local file.

### Image references in report-data.json

You never write HTML — you only choose image `src` values in `report-data.json`:
- Lazyweb references: the absolute `imageUrl`/`image_url` URL Lazyweb returns.
- Locally saved screenshots (current-state, web captures, generated prototypes): a relative `references/{filename}` path, with that file uploaded as an `asset` in the render call.
- Never use `file://` URLs or absolute local paths (`/Users/...`, `C:\...`).

## When to Use This

- User wants to understand a design space before building
- User needs competitive analysis for a feature
- User asks "what are best practices for X"
- User wants to see how the best apps solve a specific problem

## When NOT to Use This

- User just wants to see a few screenshots quickly -> route to `lazyweb-quick-search`
- User has an existing design and wants to optimize or improve it -> route to `lazyweb-design` (objective `optimize` or `improve`)

## Lazyweb MCP Setup

Use the hosted Lazyweb MCP tools at `https://www.lazyweb.com/mcp` for all Lazyweb database access.

Required MCP tools:
- `lazyweb_search` - text search over mobile and desktop screenshots
- `lazyweb_find_similar` - more results like a returned Lazyweb `imageUrl` or image payload
- `lazyweb_compare_image` - visual search from an `image_url` (the control reaches it via the presigned upload flow; see "Send the control via presigned upload")
- `lazyweb_request_image_upload` / `lazyweb_resolve_image_upload` - presigned upload for the control screenshot: request a `{ upload_url, key }`, PUT the bytes, resolve to an `image_url` (spec: `specs/image-upload-architecture.md`)
- `lazyweb_health` - connectivity check
- `lazyweb_render_report` - render + host the finished report from `report_data` + reference images, returns the shareable link (the deliverable; see "Render and host the report" above)

Optional MCP tools:
- `lazyweb_search_ab_tests` - mobile-only supporting experiment evidence for pricing, paywall, checkout, onboarding, and other growth/monetization screens when the live schema exposes it

**Pass `skill: "lazyweb-design-create"` on every Lazyweb call.** Include `"skill": "lazyweb-design-create"` in the arguments of each `lazyweb_*` tool call - for example `{"query": "pricing page", "limit": 30, "skill": "lazyweb-design-create"}`. This is optional analytics metadata; never drop or change a real argument for it. (Keep `report_skill="deep-design-research"` on `lazyweb_render_report` — that backend/report tag stays legacy; only the analytics `skill` slug moves to `lazyweb-design-create`.)

**Also pass `version: "<x.y.z>"` on every call.** Read `~/.lazyweb/VERSION` once per session at skill start (e.g. `cat "$HOME/.lazyweb/VERSION" 2>/dev/null || echo 0.0.0`); fall back to `"0.0.0"` if the file is missing or unreadable — never block on this. Include `"version": "<that-value>"` in the arguments of every `lazyweb_*` tool call alongside the existing `skill` arg — for example `{"query": "pricing page", "limit": 30, "skill": "lazyweb-design-create", "version": "0.4.5"}`. Optional analytics metadata Lazyweb uses to track which skill-pack versions are running; never drop or change a real argument for it.

**Also pass `integrity` verbatim on every call.** Read it once per session at skill start (`cat "$HOME/.lazyweb/INTEGRITY" 2>/dev/null`). Pass that exact string as the `integrity` arg on every `lazyweb_*` tool call — it is an opaque install fingerprint; copy it verbatim and do NOT interpolate, edit, parse, or reconstruct it. **If the file is absent, OMIT the `integrity` field entirely — never invent one.** This is the field that tells Lazyweb your pack is current.

These are the current public gateway names. Backend/internal surfaces may also
expose canonical tools such as `search_screenshots`, `list_filters`,
`vision_screenshots`, and `metadata_screenshots`; prefer the `lazyweb_*` names
in this skill. Use `high_design_bar: true` only when the live tool schema exposes
it and the user asks for high-design-bar companies, premium examples,
best-designed apps, or stronger visual-quality filtering. That filter is backed
by `companies.high_design_bar = true`.

Before searching, verify MCP is available by listing tools and running
`lazyweb_health`.

**If a Lazyweb tool is refused as OUT OF DATE** — the result has `code: "skill_deprecated"` / `action_required: "upgrade"` / `do_not_fallback: true`, or says your skill pack is below the required version — this is a **HARD STOP, not a fallback case**. Do NOT proceed in web-research-only or any degraded mode; that output is deprecated and ungrounded. STOP the task, tell the user they must upgrade, and have them run `/lazyweb-update` (or `curl -fsSL https://www.lazyweb.com/install.sh | bash`), reload the client, and retry. The design tools are now unified under `/lazyweb-design`.

**If Lazyweb MCP is genuinely not installed or auth fails** (a connection/auth error — NOT a version refusal):
Tell the user: "Lazyweb MCP is not installed. Run `curl -fsSL https://www.lazyweb.com/install.sh | bash`, reload this client, then rerun this skill. Lazyweb is free; the bearer token is only for no-billing UI reference tools and is okay in ignored local config."
Then proceed with web research only - the skill still works, just without Lazyweb's database.

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

Immediately after `BROWSE_READY`, set a real viewport — the daemon's default
window can be arbitrarily small and silently produces unusable captures:

```bash
$LB viewport 1440x900
```

Use `$LB screenshot --viewport <path>` for viewport-window shots; the default
`screenshot` is full-page.

If `NO_BROWSE`: Web screenshot capture is unavailable. Lazyweb results still work -
just describe web examples in text without screenshots. To enable web captures,
run: `cd ~/.lazyweb/repos/lazyweb-skill/browse && ./setup`

## Workflow

### 0. Ground the search

Before searching, ground the work in what the user is building:

1. Run `lazyweb-context-detect` (on `PATH` when installed by setup; otherwise `~/.lazyweb/repos/lazyweb-skill/bin/lazyweb-context-detect`). Use its project/platform/stack output to bias the `platform` filter and captions.
2. Clarify only what cannot be inferred. If platform is unknown, or the product/screen/outcome is unclear, ask the user ONE short clarifying question to pin down product/screen, mobile vs desktop, and the specific outcome.

### 1. Understand the research question

Pin down:
- The specific screen, flow, or feature
- The product type, audience, and platform
- The design outcome the recommendation should improve

### 2. Capture current state (if applicable)

If the user is researching a specific page or app they are building, capture the current state:

- Running dev server or URL available: use preview/browse tools to screenshot it
- Mobile app: ask the user to provide a screenshot
- General topic only: skip this step

Define the report directory FIRST (steps 2-7 write into it):

```bash
REPORT_DIR="$(pwd)/.lazyweb/deep-design-research/{topic-slug}-{YYYY-MM-DD}"
mkdir -p "$REPORT_DIR/references" "$REPORT_DIR/work"
```

Save as `$REPORT_DIR/references/current-state.png`. This image becomes `Control`
in the side-by-side Recommendation comparison. Do not create a separate visible
"Current State" section.

### 3. Read the control (required when a current state exists)

Before any searching or ideation, read the control the way
`lazyweb-design` reads a paywall. Identify:

- **Components present:** header, hero, value prop, proof, pricing, CTAs, trust
  signals, navigation, FAQ, footer — whatever the screen type implies
- **Layout pattern:** single-column stack, hero + grid, comparison layout,
  dashboard shell, feed, wizard, etc.
- **Strategic moves:** what the screen is *trying* to do — anchoring, social
  proof, demonstration, urgency, curiosity, authority, personalization
- **Audience and user state:** who lands here and how warm they are
- **Named frictions:** 2-5 specific, observable weaknesses of THIS screen
  ("proof arrives below the fold", "CTA copy is generic", "hero asserts value
  without showing the product"). Every later hypothesis must attack one of
  these by name.

If there is no current state (greenfield research), substitute a baseline read:
the convention set the category expects, and which conventions the user's
product can or cannot honor. Hypotheses then attack gaps between that baseline
and the strongest references.

### 4. Identify competitors and adjacent companies

Think about two groups:
- Direct competitors - apps that solve the same problem
- Adjacent companies with great design - apps in related spaces known for excellent UX

### 5. Search Lazyweb (go deep — the corpus is the product)

**Fast path (default): run the evidence script, not agent gatherers.**
A deterministic fetcher ships next to this skill: `fetch-evidence.py` (python3
stdlib only). Build the full Pass A + Pass B query plan as JSON first, then run
it once — all queries fire in parallel (capped at 6 in-flight, 20s timeouts,
one Retry-After-honoring retry on 429/5xx):

```bash
cat > "$REPORT_DIR/work/query-plan.json" <<'PLAN'
{"skill":"lazyweb-design-create","version":"<from ~/.lazyweb/VERSION>","queries":[
 {"id":"a1","pass":"A","tool":"lazyweb_search","args":{"query":"<screen/component>","platform":"desktop","limit":15}},
 {"id":"b1","pass":"B","tool":"lazyweb_search","args":{"query":"<underlying function>","platform":"desktop","limit":15}}
]}
PLAN
python3 "{skill-base-dir}/fetch-evidence.py"   --plan "$REPORT_DIR/work/query-plan.json"   --out  "$REPORT_DIR/work/evidence.json" || echo "FETCH_FALLBACK"
```

On success, `work/evidence.json` holds merged, same-company-deduped references
(imageUrl + visionDescription verbatim) plus a `coverage_summary`, and
`work/evidence-summary.json` holds a compact no-URL digest. Then:

1. **One selection + clustering pass** (you, the main agent): READ ONLY
   `evidence-summary.json` (indices + truncated descriptions — a fraction of
   the tokens), select 12-20 references and form the 2-4 clusters, then pull
   just the selected indices' full records from `evidence.json` for
   embedding. You may view at most the top ~10 candidate images before the
   final pick — never the whole corpus.
2. **One bounded top-up round — ALSO through the script, never via raw MCP
   tool calls** (the v3.4 timed run lost 12 minutes to MCP token dumps here).
   Write a second small plan and run `fetch-evidence.py` again to
   `work/evidence-topup.json`:
   - `lazyweb_find_similar` on the 2-3 strongest results, passing each
     reference's `imageUrl` string as `image_url`, `"limit": 5`;
   - `lazyweb_compare_image` is OMITTED from the fast path (measured: low
     yield). Only the agent-fallback path may use it, sending the control via
     the presigned image-upload flow (request -> PUT -> resolve -> `image_url`;
     see "Send the control via presigned upload" below, spec:
     `specs/image-upload-architecture.md`) — never inline base64.
   Read ONLY the script's stderr verdict line (`TOPUP_SATURATED:` /
   `TOPUP: N attachable`) and `evidence-topup-summary.json` — never the raw
   top-up file (its signed URLs are payload-hostile). Expect description-less
   near-dupes more often than not: budget at most 2 vision-verifications,
   and treat an empty yield as saturation confirmation (your corpus was
   already complete), not failure. When search_ab_tests returns 0
   references, its prose learnings are in the queries' `analysis` fields.
3. **Coverage honesty:** if `coverage_summary` shows failed or low_coverage
   queries — even when the script exits 0 — carry that into the report's
   `.corpus` banner when the selected corpus lands under 8 references or a
   whole pass came back thin.

**Agent fallback (REQUIRED to keep working — do not remove):** when the script
exits non-zero, prints FETCH_FALLBACK, emits invalid JSON, or python3 is
missing, gather via the Lazyweb MCP tools yourself instead: run the same
Pass A/Pass B plan as batched agent tool calls — three roles (median mapper /
edge hunter / web + control) dispatched as parallel subagents when the host
has an Agent tool, sequential phases otherwise. Gatherer prompts MUST state:
(a) the output directory already exists — use the Write tool only, never
Bash/mkdir; (b) copy each returned `imageUrl` string VERBATIM — a reference
without it cannot be embedded; (c) expansion results lacking a
`visionDescription` are kept (top ≤5) as `pending_vision` entries for the main
agent to vision-verify after the merge.

**Text before image (hard rule, applies to every gatherer):** select and rank
references from TEXT — `visionDescription`, captions, `coverage`, `warnings`,
similarity scores — before fetching or viewing ANY image. An image may be
viewed only after its text fields qualify it for the report (or when
vision-verifying an agent-described result). Viewing images first is the
single biggest avoidable token-and-time cost in this phase.

**Search discipline:** never repeat an identical query; results are deterministic.
Page deeper with `offset` and follow the response's `pagination.next_offset`.
Read `coverage` and `warnings` on every response. On `no_matches`/`low_coverage`,
use the closest result, strip the query to its core 2-6 word UI pattern, or note
the coverage gap in the report. On `company_not_in_library`, use a suggested
company or drop the filter.

Keep a running search log at `$REPORT_DIR/work/search-log.json` — append every
query with its filters/offset as you run it (gatherers append to their own
`work/gatherer-{n}.json`; the merge step consolidates). This is what makes a
crashed run resumable and is the ground truth for "never repeat an identical
query".

Run **6-10 searches minimum**, split into two mandatory passes:

**Pass A — map the median (2-4 searches).** The in-category baseline: what
everyone in the user's space does. This is what the Safe bet completes and
what the Bold bet must NOT resemble.

```json
{"query":"<specific screen/component>","limit":15}
{"query":"<screen type>","company":"<competitor>","limit":15}
{"query":"<screen type>","category":"<category>","limit":15}
{"query":"<different description of same thing>","limit":15}
```

**Pass B — hunt the edges (4-6 searches, REQUIRED — never skip).** Deliberately
search OUTSIDE the obvious category and BELOW the screen-name level. This pass
exists to feed the Bold and Wild-card bets; a corpus that only contains the
median can only produce median recommendations.

```json
{"query":"<the underlying FUNCTION, not the screen name — 'data visualization with gamification' not 'dashboard'>","limit":15}
{"query":"<same screen type>","category":"<deliberately unrelated category: Gaming, Entertainment, Music, Editorial...>","limit":15}
{"query":"<the persuasion mechanism itself, e.g. 'live activity feed', 'interactive product demo'>","limit":15}
{"query":"<a second unrelated category doing the same job>","limit":15}
```

Cross-pollination routing: finance → look at Gaming/Entertainment/Music;
productivity → Fitness/Travel/Social; e-commerce → Education/Health;
developer tools → Editorial/Games. The more distant the category, the more
novel the transferable mechanism. Yield ranking from live runs:
**function-level and mechanism-level queries find the most usable outliers;**
screen-type + unrelated-category is the weakest shape (often low coverage) —
run it last and drop it first when budget-constrained. While reading Pass B results, collect
**outliers**: references that do something structurally unlike everything in
Pass A. Outliers are the raw material of the Bold and Wild-card bets — note
for each one the mechanism (what it DOES, not what it looks like), why it
works in its home context, and what would have to adapt to transfer.

Then **expand with `lazyweb_find_similar`** on the 2-3 strongest results
(highest similarity + best `visionDescription` fit) to pull in their visual
neighbors. This is how the corpus gets from "three or four screenshots" to a
real reference set.

When a current-state screenshot exists, also run `lazyweb_compare_image` with
it via the presigned image-upload flow (see "Send the control via presigned
upload" below; spec: `specs/image-upload-architecture.md`) and fold the top
structural matches into the reference set — visual similarity from the control
itself is the strongest grounding move available. Pass the resolved
`image_url` to `lazyweb_compare_image`; never inline a full-res screenshot as
`image_base64`.

#### Send the control via presigned upload

The control screenshot is uploaded once and referenced by URL — large base64
sent inline through chat gets corrupted by the LLM. Use the Phase 0 MCP
upload tools (spec: `specs/image-upload-architecture.md`):

1. Determine the `mime_type` of `$REPORT_DIR/references/current-state.png`
   (`image/png`, `image/jpeg`, or `image/webp`).
2. `lazyweb_request_image_upload({ mime_type })` -> `{ upload_url, key }`
   (authed by the MCP session; no `~/.lazyweb` token needed).
3. PUT the bytes with NO credentials:
   `curl -fsS -X PUT -H "content-type: <mime>" --data-binary @"$REPORT_DIR/references/current-state.png" "<upload_url>"`
4. `lazyweb_resolve_image_upload({ key })` -> `{ image_url }`.
5. Call `lazyweb_compare_image({ image_url, skill, version })` with that
   `image_url` and fold the top structural matches into the reference set.

`lazyweb_compare_image` and `lazyweb_find_similar` results often come back
without a `visionDescription` and sometimes with null/near-duplicate metadata.
Handle them explicitly:
- A result with no `visionDescription` is usable ONLY if you view the image
  yourself (vision) and write the caption from what you actually see — tag it
  "agent-described". Never attach it unviewed.
- Skip entries with null `siteId`/`pageUrl` AND no description.
- Dedupe same-company near-duplicates: keep at most one screen per company per
  cluster unless the duplicates demonstrate different patterns.

Keep `limit` at 15 (10-20 band): larger results overflow many hosts' tool-result cap,
forcing a dump-to-file + re-read round trip that costs more time than a second
page. Page with `offset` when you genuinely need more. The control reaches
`lazyweb_compare_image` through the presigned upload flow above (request -> PUT
-> resolve -> `image_url`), so there is no inline base64 to crop or downscale —
upload the full-resolution `current-state.png` and let the server work from the
hosted asset.

Platform routing:
- SaaS, web, desktop app, admin surface, or marketing page -> use `platform: "desktop"`
- iPhone/Android app -> use `platform: "mobile"`
- General research or cross-platform -> omit platform and judge returned images

Assess quality:
- `matchCount` 2/3 or 3/3 = strong
- `matchCount` 1/3 = weak
- `similarity` > 0.4 = good

**Selection target: 12-20 references** for a normal run (floor: 8 before the
report can claim a healthy corpus; if fewer survive screening, add a `.corpus`
thin-evidence banner and say so). Relevance is the only bar — more *relevant*
references is strictly better; padding with loose matches is worse than fewer.

Rules for attaching references to the report:
1. Read `visionDescription` before using ANY screenshot.
2. The screenshot MUST directly illustrate the point it supports.
3. If `visionDescription` does not match your suggestion, do not use it.
4. Never guess what is in a screenshot. If there is no `visionDescription`, skip it
   (or vision-verify it yourself per the rule above).
5. Use `visionDescription` to write accurate captions and `alt` text.

Mismatched references destroy user trust faster than anything else.

### 6. Search connected inspiration libraries

Check if `~/.lazyweb/libraries.json` exists and has connected libraries:

```bash
cat ~/.lazyweb/libraries.json 2>/dev/null
```

If libraries are configured, search each one using the browse tool. For each library:

1. Navigate to the library search URL: `$LB goto "{searchUrl}"`
2. Snapshot the page: `$LB snapshot -i`
3. Search for the research query: `$LB fill @eN "{query}"`
4. Submit and wait: `$LB press Enter` then `$LB snapshot -i`
5. Screenshot only the most relevant results: `$LB screenshot "$REPORT_DIR/references/{library}-{company}-{screen}.png"`
6. Label all library-sourced references in the report with `[Mobbin]`, `[Savee]`, etc.

If a library session has expired, tell the user and skip it. Do not block the run.

### 7. Web research and live screenshot capture

Lazyweb gives curated screenshots. Web captures give the latest competitor state.
Do both unless MCP is unavailable and the user wants a web-only fallback.

Find URLs via WebSearch — cover both the median and the edges:
- Search for "[topic] UX best practices [current year]"
- Search for "[competitor name] [screen type]"
- Search for "best [screen type] examples"
- Search for "unconventional [screen type] design" and
  "creative [screen type] examples [current year]" — Awwwards / FWA /
  CSS Design Awards winners and experimental sites are often the strongest
  Bold/Wild-card seeds, because nobody in the user's category is looking at
  them

Collect 3-8 URLs. For the most useful ones, capture viewport screenshots into
`work/` first; move (or trim) a capture into `references/` only once the
report actually embeds it:

```bash
if [ -x "$LB" ]; then
  $LB goto "https://example.com/pricing"
  $LB screenshot "$REPORT_DIR/work/example-pricing-page.png"
fi
```

If browse capture is unavailable, include web evidence only when you can describe
it accurately from a reliable source. Do not invent a screenshot.

Inspect every capture before using it. If a capture is defective (cookie/email
modal covering the page, blank below the fold, half-loaded), dismiss the modal
via browse and recapture, or trim a copy to the loaded region. Never present a
broken capture as evidence; keep originals in `$REPORT_DIR/work/`, not
`references/`.

### 8. Experiment evidence (growth/monetization screens only)

For landing pages, pricing, paywalls, checkout, onboarding, referral, and other
growth/monetization screens, call `lazyweb_search_ab_tests` when available to
validate or challenge a bet you already formed from reading the control. Treat
learnings as directional unless the tool returns measured lift. If the tool is
unavailable or returns no on-context experiments, say so in the relevant card
("design-prevalence signal") — never imply measured lift.

Run it THROUGH `fetch-evidence.py` (add it as an entry in the top-up plan —
the script speaks generic tools/call) so the response lands in a file instead
of a tool-result dump; even capped calls (`include_images: false`,
`analysis_experiment_limit: 8`) have returned 98KB, past most hosts' caps.

Context traps with this tool:
- **Discard off-context experiments** (wrong platform or screen type, e.g.
  mobile paywall tests for a web landing page) instead of citing them.
- The tool's own `confidence` field grades corpus retrieval, not evidence
  strength — your evidence wording comes from the honesty taxonomy, never from
  that field.
- Use `category` as the industry filter. Do not pass the user's product name as
  a company filter; treat `product` as target context only, and check the
  response `warnings` for silently-applied filters before trusting a zero-result
  answer.

### 9. Cluster the corpus and prepare references

`$REPORT_DIR` was created in step 2 (create it now with the same `mkdir` if
step 2 was skipped).

Group the selected references into **2-4 named clusters of similar approaches**
("Proof-wall heroes", "Product-demo-first", "Editorial minimal", "Data-dense
operator"). Clusters drive both the Inspo map (cluster labels over neighboring
points) and the bets (each bet should draw mainly on one cluster). A cluster
needs 2+ members; singletons are outliers — usable as a Wild-card seed or a
pattern, but not a cluster.

Do not download Lazyweb database images. Use the returned `imageUrl`/`image_url`
directly in HTML. Supabase storage-backed image URLs are signed for 365 days and
intended for report embedding. If a selected Lazyweb result has no returned image
URL, omit the image and rely on `visionDescription` plus text.

For web-captured examples, save descriptive filenames such as
`stripe-pricing-page.png` or `linear-onboarding-step1.png`.

**Keep `references/` clean:** the render call uploads every file in
`references/` as an asset. Only files actually referenced by `report-data.json`
belong there; working files (full-page originals, base64 payloads, untrimmed
captures, search logs) live in `$REPORT_DIR/work/`, which is never uploaded.

## Hypothesis Engine (the core of the Recommendation)

The unit of analysis is a falsifiable bet, not a component list and not a theme.
This mirrors `lazyweb-design`, with the screenshot corpus playing
the role of the experiment corpus — and it **indexes on creativity**: the value
of this report over a competent designer's first instinct is the bets a median
competitor would never generate. A set of three reasonable suggestions is a
failed run, even if every section renders perfectly.

A good hypothesis takes this form:

> Making [specific change] should [specific outcome] because [specific mechanism].

Good: "Replacing the testimonial-quote hero with a numbers-first proof wall
(subscriber count, named outcomes, logos) should lift email signups because
this audience buys evidence of results, not promises."
Bad: "Improve the hero." / "Make it more premium."

### Grounding (required)

Every hypothesis must be anchored to a **named friction from the control read**
(step 3) — not to a reference you happened to like. References and prevalence
support a hypothesis; they never originate it. **Anti-hybrid checksum:** before
writing each bet, confirm it answers "what would you change about THIS screen,
and why" — not "what does reference X look like". If a bet reads as a
description of someone else's screenshot, rewrite it.

### Creativity engine (mandatory ideation pass — run BEFORE choosing bets)

LLMs and corpora both regress to the mode: left alone, every "option" becomes
a tasteful rearrangement of the category median. This pass exists to fight
that. Do it in working notes, before committing to bets:

1. **Name the dominant convention set** from Pass A — the 3-5 moves everyone
   in this category makes ("testimonial hero", "3-column feature grid",
   "logos + CTA"). This is the median you must beat, not the menu you pick
   from.
2. **Overgenerate: draft 8-12 candidate moves**, forcing coverage of these
   operators (at least one candidate per operator):
   - **Inversion** — do the opposite of a dominant convention (everyone
     claims value in copy → remove the copy and show only the product;
     everyone gates content → give the best content away on the landing page).
   - **Format transplant** — rebuild the page as a different artifact: a live
     feed, an interactive demo, a terminal, a letter from the founder, a
     quiz, a gallery, a receipt, a game. The page stops being "a landing
     page that describes X" and becomes "X itself".
   - **Cross-category mechanism transfer** — take an outlier from Pass B,
     extract what it DOES (not what it looks like), and apply it here.
   - **Extremify** — find the category's most timid version of a promising
     idea and push it to its logical extreme (one testimonial → a wall of
     400; one stat → the entire hero is the live number).
   - **Constraint flip** — delete a "required" element entirely (no hero, no
     nav, no pricing table, no sign-up form) and design what fills the void.
3. **Score each candidate** on novelty-in-category (would any Pass A
   reference do this?) × mechanism fit (is there a real reason it converts
   HERE?). Discard weird-for-weird's-sake (high novelty, no mechanism) and
   median-with-makeup (mechanism, no novelty).
4. The Bold and Wild-card slots MUST be filled from the surviving
   high-novelty candidates. If none survive, the corpus is the problem — go
   back to Pass B and the unconventional web search, don't ship three
   reasonable bets.

### Bet archetypes (forced divergence — a thinking tool, not visible chips)

Produce 2-4 bets and assign each exactly one archetype. The archetypes exist to
force divergence during ideation; they are NOT rendered as chips in the report —
the option card's one-to-two-sentence description carries the idea in plain
words.

- **Safe bet** — completes the highest-prevalence conventions the control is
  missing or mis-using. Low risk, evidence-rich, ships fastest. Cite the
  prevalence count ("7 of 14 references do X; control does not"). This is the
  ONLY bet allowed to sound reasonable on first read.
- **Bold bet** — **breaks or inverts a dominant category convention**, or
  restructures the page around a model no direct competitor uses. NOT "the
  strongest cluster's strategy" — that is the median of the best, and it
  belongs in the Safe bet. **Prevalence ceiling:** if more than ~20% of the
  in-category corpus already does it, it is not bold — relabel it Safe and
  ideate again. Apply the ceiling to the bet's actual structural move at the
  granularity the bet specifies (e.g. "renders a FULL issue as the page", not
  the broader "shows content previews"), and state that slice explicitly in
  the evidence line so the count is checkable. Evidence for a Bold bet is
  **mechanism proof** (outlier or
  cross-category references showing the mechanism working), plus the
  in-category absence stated as the opportunity ("0 of 14 in-category
  references do this — whitespace, not risk-free").
- **Wild card** — a full cross-category or format transplant from the
  creativity engine: the kind of move that makes the reader pause. Cite the
  off-category source honestly in the description ("single source, outside
  this category") and name the risk. Grounded novelty means the MECHANISM has
  proof somewhere real — it does not mean the move is common anywhere.

A normal run ships one Safe bet, one Bold bet, and a Wild card (optionally a
second Bold with a different mechanism). Never ship two bets with the same
persuasion mechanism, regardless of archetype.

### Anti-collapse rules (the reason options used to look the same)

- Each bet must differ from every other bet on **at least two** of: page
  strategy, persuasion mechanism, information architecture, trust source, and
  primary component set.
- Reject bets that only vary palette, typography, density, theme, or tone.
- Reject a bet that recommends a convention the control already uses unless it
  changes how that convention is used — verify against the step-3 control read.
- **The reasonableness test:** read the three bets cold. If every one of them
  sounds obviously sensible — if nothing makes you pause — the set has
  collapsed to the median. Regenerate the Bold and Wild slots from the
  creativity engine. A good set has exactly one bet that reads "of course",
  one that reads "that's a real swing", and one that reads "wait — really?"
  (and survives the mechanism question). The test grades the MOVE, not the
  proof: strong evidence never makes a wild move "too reasonable" — attach
  maximum proof to the wildest bets, never under-evidence one to keep it
  sounding daring.
- **The planning-meeting test (Bold/Wild):** would the move survive a median
  competitor's planning meeting *without anyone calling it risky*? If yes, it
  is not bold. "Add social proof", "clarify the value prop", "restructure the
  hero" sail through unchallenged — they fail. "Delete the signup form above
  the fold" gets someone saying "wait, is that safe?" — it passes.
- Pre-imagegen self-check: if all prompts could plausibly produce the same
  hero/form/card layout with different colors, rewrite them before generating.
- Each bet should draw mainly on a *different* slice of the corpus (Safe ←
  Pass A median, Bold ← outliers/edges, Wild ← cross-category). If two bets
  cite the same three references, they are probably one bet.

### Each bet must carry (in the working notes)

1. Its archetype (Safe / Bold / Wild card)
2. The hypothesis sentence ("Making X should Y because Z")
3. The named control friction it attacks
4. Evidence, matched to the archetype: a Safe bet cites prevalence ("7 of 14
   do X"); a Bold/Wild bet cites **mechanism proof** (the outlier or
   cross-category references where the mechanism demonstrably works) plus the
   in-category absence as the opportunity ("0 of 14 in-category references do
   this"), backed by evidence-of-search. Each bet embeds the 2-3 references
   that prove its claim (+ experiment learning when step 8 found one)
5. A one-line skip condition (when this bet is the wrong move)
6. A detailed `.build-prompt` specific enough that another agent could
   implement it: audience, tone, layout, hierarchy, components, copy strategy,
   visual rules, references to borrow from and to avoid, and the outcome it
   optimizes

In the rendered option card, only items 2-3 surface, as a two-bullet
`.opt-points` list under the title — `<b>What:</b>` and `<b>Why:</b>`, each
**8-14 words maximum**, lead-ins bolded. No Proof bullet, no Skip-if bullet,
no chips, no paragraph prose. Evidence (item 4) renders as the mini deck
itself — put the prevalence/whitespace count in the deck's first figcaption
("0 of 17 pricing pages do this"). The skip condition (item 5) lives inside
the collapsed `.build-prompt`, and the handoff block's DO-NOT-OVER-INDEX-ON
line.

### Pick the winner

Rank the bets by expected impact, evidence strength, implementation effort, and
brand/product fit — but beware the structural bias: evidence VOLUME favors the
Safe bet by construction (the median always has more references). Do not let
reference count alone crown the winner; weigh the mechanism argument and the
upside for THIS screen. It is fine — often right — for the Bold bet to win.
Exactly one is `Recommended` — it loads first in the
side-by-side slot next to Control (the ◀ ▶ switcher cycles the others) and
leads the options carousel. Ranking is conveyed by order and the `Recommended`
caption — no legend table, no rank chips. No ties, no "it depends" hedging in
the visible body; the runner-ups exist so the user can choose taste/risk, not
because the agent refused to decide.

### Hypothesis-to-prototype workflow

1. Draft the bets per the rules above, then write each bet's `.build-prompt`.
2. Feed the prompts into image generation **in parallel** and save outputs as
   `$REPORT_DIR/references/prototype-{bet-slug}.png`. Generate prototypes at
   roughly one to one-and-a-half viewport heights (16:10 to 16:15) — a
   prototype is a screen, not a full long-scroll page.
3. The recommended bet's prototype loads in the compare slot beside Control
   (with the variant switcher cycling the other bets' prototypes); every bet
   also renders in the options carousel.

### Fast parallel image generation

Image prototypes are the slowest part of this skill. Optimize for getting the
report in front of the user quickly:

- Build all image prompts first, then launch all prototype generations in
  parallel. Do not generate prototype images sequentially unless the host only
  supports one job at a time.
- Default prototype/image agents to **medium effort**. Use **low effort** when
  the user asks for speed, quick exploration, or rough directions. Use high
  effort only when the user explicitly asks for production-grade fidelity or a
  final design artifact.
- Render the report as soon as the first usable image set is available. If some
  non-default options are still generating, include prompt-ready placeholder
  cards and update/regenerate later rather than blocking the whole report.
- Normal skill execution must not run full `npm test`, full browser QA, or eval
  comparisons. Those are development/eval checks, not user-facing report steps.

Provider priority order — **image generation first, HTML last**:

1. Native host image generation tool.
2. **OpenAI Images API** (`gpt-image-*` via `generate-prototypes.py` below) —
   the primary working route in practice.
3. Codex CLI / external image APIs (Nano Banana, Gemini) when the probe finds
   them capable of emitting bitmaps (Codex CLI currently cannot — the probe
   records its health for when that changes).
4. **Rasterized HTML prototype (last resort):** hand-build each bet as a
   standalone HTML/CSS page (using the bet's `.build-prompt` as the spec),
   load it with the browse binary, and screenshot it to
   `references/prototype-{bet-slug}.png`. Still a real, legible prototype —
   and the HTML is implementation-ready, which is its compensating advantage.
5. If neither an image provider nor browse exists, render the recommended
   bet's layout as a live `.mock` mock-frame in the compare's right slot, and
   ship the option deck as prompt-ready `.prototype-option` cards with images
   marked `not generated` and the structured `.build-prompt` visible/copyable.
   The compare's right slot must never be empty when a control exists.

**Capability probe + generation: use `generate-prototypes.py`** (ships next
to this skill, python3 stdlib). Never improvise the probe or API calls.

```bash
# probe (cached at ~/.lazyweb/imagegen-capability.json; busts on >7 days,
# skill-version change, or a pre-v3.4 cache; --force to re-probe manually)
python3 "{skill-base-dir}/generate-prototypes.py" probe   --native <ok|dead: is a host image tool callable?>   --skill-version "$(cat ~/.lazyweb/VERSION 2>/dev/null || echo 0.0.0)"

# generate — one image per bet, IN PARALLEL (cap 3), de-branded retry on
# policy refusal, per-bet status for targeted HTML fallback
python3 "{skill-base-dir}/generate-prototypes.py" generate   --bets "$REPORT_DIR/work/bets.json"   --out-dir "$REPORT_DIR/references"   --status "$REPORT_DIR/work/proto-status.json"
```

`bets.json`: `[{"slug":"...","prompt":"...","debranded_prompt":"..."}]` — the
prompt is the bet's image brief (template below); `debranded_prompt` is the
same brief with brand names replaced by category descriptions, used
automatically if the branded prompt is policy-refused. The OpenAI key is read
from `OPENAI_API_KEY` or `~/.lazyweb/openai_api_key` (chmod 600) — never
commit, echo, or log it. The script discovers the newest `gpt-image-*` model
dynamically (`gpt-image-2` today) — never hardcode a model name.

Read `work/proto-status.json` after generation: bets with `"status":"ok"`
have real generated prototypes; bets with `"status":"failed"` fall back to a
rasterized-HTML prototype FOR THAT BET ONLY (mixed-route reports are
sanctioned — the compare slot must never be empty). If the probe reports the
openai route dead and no other image route is live, all bets take route 4.
Tell the user which route was used.

Image prompt template:

```text
CONTROL
Attachment label: CONTROL
Describe the current page/screenshot and the current conversion goal.

WHAT TO IMPROVE
The named friction this bet attacks, for example proof arrives too late,
the CTA is generic, or the page asserts value without showing the product.

HOW TO IMPROVE
The bet's hypothesis, persuasion mechanism, information architecture,
primary components, and trust source. This section must make the option
structurally different from the other options. For Bold/Wild bets, EXPLICITLY
forbid the generic landing-page skeleton in the prompt ("do NOT render a
standard hero + 3-column features + CTA layout") and describe the
unconventional structure concretely, section by section — image generators
regress to the median exactly the way ideation does, and a bold hypothesis
rendered as a generic page reads as a safe bet in the report.

INSPIRATION
Attachment label: INSPO A - {reference name}
What to borrow: {specific layout/component/trust move}
What not to borrow: {specific mismatch}

Attachment label: INSPO B - {reference name}
What to borrow: {specific layout/component/trust move}
What not to borrow: {specific mismatch}

ATTACHMENTS
Upload/attach CONTROL plus INSPO A and INSPO B when the provider supports image
inputs. If attachment upload is unavailable, include their image URLs and visible
captions in the prompt.
```

### Prototype fidelity rules

Choose fidelity from request specificity:

- **High fidelity** - the user provides a current screenshot/URL or enough
  product context plus specific screen, outcome, and style constraints. Render a
  polished prototype with realistic layout, hierarchy, copy blocks, controls, and
  visual treatment.
- **Medium fidelity** - the screen and outcome are clear, but current-state or
  brand context is thin. Render a credible layout with real section names,
  content placeholders, and the recommended interaction model.
- **Low fidelity** - the request is broad, exploratory, or vague. Render a clean
  structural prototype that communicates hierarchy and flow without pretending to
  know the brand/product details.

Choose fidelity before building the prototype. Do not burden the visible report
with fidelity rationale.

## Report v3 Contract

Author the report content as `.lazyweb/deep-design-research/{topic-slug}-{YYYY-MM-DD}/work/report-data.json`;
the server renders and hosts it. Do not hand-write `report.html` or a Markdown version.

The report should make the recommendation faster to parse than prose ever
could. Lead with the answer, keep copy minimal, and let large legible visuals
carry the argument. The layout principle is **visual-first**: wide canvas
(`max-width:min(1480px,95vw)`), big images, generous vertical space for
evidence, minimal chrome. The user should never squint, click, or scroll
sideways to see the proof — and never wade through chips, tables, or
explanation paragraphs to reach it.

### Desktop screenshot window rule (applies to EVERY desktop screenshot)

Long-scroll pages are never rendered at full height anywhere in the report.
Every desktop/web screenshot — compare frames, option-card prototypes, deck
figures, inspo thumbnails AND their hover expansions — shows a
**viewport window**: a crop from one to one-and-a-half viewport heights
(aspect ratio between 16:10 and 16:15), cropped from the top unless the
evidence sits lower, in which case shift the window (`object-position` /
`--pos`) to contain it. The lightbox (explicit click) is the only place a full
page may appear. Mobile/portrait screenshots are exempt from the windowing —
they show the whole screen in compare frames, option cards, and decks
(resting inspo thumbnails may show a top-anchored portrait window;
hover/expansion reveals the whole screen). This rule exists because a
6000px-tall figure makes everything around it unreadable.

### Visible section order

```text
# Design Research: {Topic}

## Agent Instructions
{Light-blue copy block for the downstream coding agent — section #1.}

## Goal
{One short sentence restating the target outcome.}

## Recommendation
{What+why intro line (why bolded); side-by-side Control × Recommended with a ◀ ▶ variant switcher; "The 'why' behind the recommendations" title; options carousel with two bolded What/Why bullets per card. No legend table.}

## Inspo
{Optional clustered 2x2 reference map, 8-16 points. Omit below 8 comparable references.}

```

Do not render visible standalone sections named `Recommendations / Next Steps`,
`Key Examples`, `Patterns`, `Anti-Patterns`, `Unique Angles`, `Findings`, or
`Sources`. Provenance belongs in image `alt` text, `data-source` attributes,
the machine handoff block, and the compact footer. When the corpus is thin,
single-source, or context-mismatched, put a one-line `.corpus` banner directly
after Agent Instructions.

### Agent Instructions — report section #1

One plain human sentence, then a copy-pastable block written FOR A DOWNSTREAM
CODING AGENT:

```html
<section id="agent-instructions" class="agent-instructions">
  <div class="ai-head"><span class="ai-badge">FOR THE CODING AGENT</span>
    <button class="ai-copy" type="button" onclick="
      var sec=this.closest('.agent-instructions'); var txt=sec.querySelector('.ai-block').innerText;
      var done=function(ok){this.textContent=ok?'Copied':'Press Cmd/Ctrl+C';setTimeout(function(){this.textContent='Copy';}.bind(this),1500);}.bind(this);
      if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(txt).then(function(){done(true);},function(){done(false);});}
      else{var r=document.createRange();r.selectNodeContents(sec.querySelector('.ai-block'));var s=getSelection();s.removeAllRanges();s.addRange(r);try{document.execCommand('copy');done(true);}catch(e){done(false);}}">Copy</button>
  </div>
  <p class="ai-human">{one human sentence: the recommended bet, stated as the thing to build first}</p>
  <pre class="ai-block">LAZYWEB REPORT — AGENT HANDOFF
Use this report as a starting point for {TASK}.

TOP RECOMMENDATIONS (do first):
1. {recommended bet, one imperative line}
2. {runner-up bet}
3. {runner-up bet}

INDEX ON: {the control frictions the recommended bet attacks}
DO NOT OVER-INDEX ON: {directional-not-measured signals, off-category references}
DIVE FURTHER: {next Lazyweb skill or MCP tool} — {why}

Evidence basis: {N Lazyweb references + M web captures (+ experiments if used)} · {DATE}</pre>
</section>
```

### Recommendation section

The recommendation is the product of the report. Layout, top to bottom — and
nothing else (no legend table, no ranking chips):

1. **Intro line** (`.rec-intro`): one-two sentences directly under the
   `Recommendation` heading stating WHAT the recommended bet changes and WHY
   it should win — with the why in `<b>bold</b>`. Example: "Make the best
   breakdown the landing page itself, with the email ask arriving mid-read —
   <b>because the content is the only proof this newsletter has, and a reader
   who is 40% through an issue has already been converted by the product, not
   the pitch.</b>"
2. **Side-by-side compare** (`.compare`): Control on the left, the recommended
   prototype on the right, in two equal columns with **identical height-locked
   frames** (same `aspect-ratio`, `object-fit:cover` from the top for desktop;
   `.compare.mobileset` shows whole portrait screens at a shared fixed height).
   Matching frames are what make side-by-side work — never let one column
   render taller than the other. Stack only below 880px viewport width.
   **The crop must show the recommended bet's decisive evidence**: if the
   change lives below a 16:10 fold, either set `object-position` on both
   frames to the decisive region or use the shared `.compare.tall` (16:15,
   ≈1.5 viewports) variant — both frames always keep the same ratio.
   The right frame's caption row holds the bet name plus **◀ ▶ variant
   switcher buttons** (`.vnav`) that swap the right image through ALL the
   bets' prototypes in place — the user flips variants without leaving the
   comparison. With JS disabled the recommended prototype shows. The caption
   reads `Recommended — {bet name}` for the winner and just `{bet name}` for
   the others as they cycle. If there is no control (greenfield research),
   omit the compare grid entirely: the recommended prototype renders
   full-width in its place, keeping the caption + variant switcher.
3. **Section title** (`.why-h`): an `<h3>` reading `The "why" behind the
   recommendations` between the compare and the options carousel, so the
   carousel reads as the reasoning section, not a second gallery.
4. **Options carousel** (`.option-deck`): every bet (recommended first) as a
   same-size `.prototype-option` card in a horizontal snap scroller with ◀ ▶
   nav. The recommended card's title carries a `.rec-flag` pill reading
   `Recommended option`. Each card: title, the FULL prototype image uncropped
   (`.proto-full` — natural height capped, `object-fit:contain`), then exactly
   two `.opt-points` bullets — **`<b>What:</b>` and `<b>Why:</b>`, each 8-14
   words max**. Example: "<b>What:</b> Live uptime + compliance dashboard
   replaces the marketing band." / "<b>Why:</b> Demonstrated reliability
   converts platform engineers; claims don't." Then a mini evidence `.deck`
   of 2-3 references (prevalence/whitespace count goes in the FIRST
   figcaption, e.g. "0 of 17 pricing pages do this"; add a `.deck-nav` when
   more than two cards are present), and the collapsed `.build-prompt`
   (which carries the full hypothesis sentence, evidence detail, and the
   skip condition). **No Proof or Skip-if bullets, no archetype chips, no
   evidence badges** — two short bolded bullets are the only visible text.

When image generation is unavailable and a layout must still be shown, render
an HTML/CSS `.mock` mock-frame (mobile or desktop) inside the option card —
never ASCII art. When step 8 returned experiment evidence with control/variant
images, render the pair with the shared `.flip` two-up grid inside the bet's
evidence area.

Keep chrome quiet: thin borders, no heavy shadows or nested cards. Counts like
"8 selected references" live in deck figcaptions, hidden metadata, or the
handoff block — never as standalone metric chips or extra bullets.

### Optional Inspo section

Include `Inspo` only when at least **8 comparable references** can be
positioned meaningfully. It is a clustered 2x2 map for browsing real designs —
a place to *look*, not a diagram. Aim for 10-16 points; plotting the whole
selected corpus is encouraged when the axes hold.

Rules:
- Derive the x/y axes from the corpus, for example `restrained -> assertive`,
  `serious -> playful`, `familiar -> novel`, `low density -> high density`, or
  `utility-led -> emotion-led`. If no honest axes exist, omit the section.
- Plot each reference once using `.inspo-point` with an `.inspo-img` thumbnail.
  Points are decently sized (≈180-220px wide at default scale) — visible
  designs, not dots.
- Place the 2-4 cluster labels from step 9 (`.cluster-label`) over their
  member groups. Position cluster members near each other; the clusters ARE
  the insight of the map.
- **Hover/focus enlarges the design in place** (≈520px) — still as a viewport
  window per the desktop window rule, never the full long-scroll page. Portrait
  references (tag the point `.mob`) show the whole phone screen on hover.
  Click/tap opens the full-size image in the lightbox. Keyboard focus must
  trigger the same expansion.
- Every visible point is image-only: no company names, captions, or labels
  inside the tile. Accurate `alt` text and `data-source` carry provenance.
- Size the map to its population by setting `--map-h` inline on `.inspo-map`:
  ≈ 520px for 8-10 points, up to ≈ 760px for 14-16. Do not let a sparse map
  dwarf the patterns section below it — when in doubt, smaller map, bigger
  patterns.
- Keep point anchors inside roughly 12%-88% on both axes so resting thumbnails
  and hover expansions stay within the map (the CSS also clamps as a backstop).
- If there are fewer than 8 meaningful comparable references, omit `Inspo`
  and do not mention the omission in the report body.

### Report rescale + lightbox (required interactions)

- Fixed `.scalebar` (bottom-right): three buttons `S / M / L` setting
  `data-scale` on `<html>`. All image-bearing components size through the
  `--s` CSS variable so the whole report rescales: compare width, option
  cards, inspo map + points, pattern figures. Default `M` (`--s:1`); `S` is
  `.78`, `L` is `1.25`. JS-optional — without JS the report renders at `M`.
- A single `#lb` lightbox at the end of `<body>`: clicking any inspo point,
  pattern figure, compare frame, or prototype image opens the full image —
  this is the one place a full-height page is allowed.
  JS-optional enhancement; every image is already legible inline without it.
- The compare variant switcher (`__vstep`) is JS too; with JS off the
  recommended prototype renders statically.

### Evidence and confidence

- Every claim in the visible body must have nearby evidence: a prototype
  decision, an image-only map point, or a deck card.
- Quantify prevalence ("7 of 14 selected references") instead of asserting it
  ("near-universal"). Counts always refer to the selected corpus.
- For growth/monetization screens, use `lazyweb_search_ab_tests` when available.
  If no experiment data is found, say "design-prevalence signal" in the relevant
  sentence instead of implying measured lift.
- Evidence strength is carried **in plain words inside the description
  sentences** ("directional — 7 of 14 references", "single source, outside
  this category", "measured: +12% in one experiment") — not as badge chips.
- Never fabricate a reference, metric, company name, or screenshot content.

### Author report-data.json (the report content)

You author the report as **content**, not HTML. Write
`$REPORT_DIR/work/report-data.json`; the server fills the canonical,
render-tested template from it and hosts the result (see "Render and host the
report" above). You never read or write the template, never write fill/render
code, and never open a local report file — the deliverable is the hosted URL.

The full `report-data.json` schema (topic, goal, rec_intro {what, why}, control,
optional corpus_banner, handoff block, 2-4 bets with deck refs and
build_prompts, inspo map or null) is documented in the filler's docstring:

```bash
head -60 "{skill-base-dir}/fill-report.py"
```

Rules for `report-data.json`:

- All strings are RAW — the server does every bit of HTML-attribute and
  JS-string escaping (quotes, `<`, apostrophes in bet names). Never pre-escape.
- The recommended bet is `bets[0]` with `"recommended": true`; prevalence or
  whitespace counts go in the FIRST deck entry's `detail`.
- Image `src` values: absolute Lazyweb `imageUrl`/`image_url` for Lazyweb
  references; relative `references/{filename}` for locally saved current-state,
  web-capture, and generated prototype images (each uploaded as an `asset` in
  the render call).
- Every generated prototype carries accurate `alt` text and a `build_prompt`
  with the exact implementation brief, because generated images may mangle text.
- `"inspo": null` omits the section (fewer than 8 comparable references).
- Omit `handoff.report_path` — there is no local report file in this flow; the
  server defaults the handoff text to "this report".
- A missing or invalid required field comes back from `lazyweb_render_report`
  as `{ ok:false, code:"REPORT_RENDER_ERROR", detail:"missing <field>" }` — fix
  that field in `report-data.json` and call once more. Do not browse-load,
  screenshot, or vision-inspect anything; the server validates the report.

## Operating principles & evidence components (REQUIRED - overrides convenience)

These four rules override convenience. A report that breaks them is
non-conforming, even if every section is present.

**1. Show, don't tell — every claim carries its proof.**
Any assertion — a pattern, anti-pattern, bet, "what's working" item, or
recommendation — must render the real screenshot(s) that demonstrate it,
*beside the claim*, never a scroll away. When more than one reference backs a
claim, render them as a `.deck` snap-carousel (all references visible,
scroll-snaps with ◀ ▶ prev/next buttons; a mini deck whose 2 cards are both
fully visible may omit the nav), never a bullet list or a cross-reference to
another section. Prevalence words ("most", "near-universal",
"dominant") must be backed by a shown count ("7 of 14 references"), never an
adjective alone. Never render a proposed layout as ASCII/box-drawing `<pre>`
art — use a generated image or an HTML/CSS mock-frame.

**2. Be opinionated; carry the decision.**
Lead with ONE recommended bet, marked in the human-visible body (it loads in
the side-by-side slot and leads the options carousel with a `Recommended`
flag), not only in the handoff block. Every runner-up's description states in
plain words when to prefer it and when to skip it. No ties among top picks; no
flat undifferentiated menu of co-equal options — order IS the ranking.

**3. Maximize confidence with evidence.**
Back each bet with what worked for OTHER apps (real screenshots) PLUS
supporting data, matched to the bet's nature: prevalence counts back Safe
bets; Bold/Wild bets are backed by mechanism proof from outlier or
cross-category references plus the stated in-category absence ("0 of 14
in-category references do this"), with evidence-of-search behind the absence.
For growth/monetization screens add experiment learnings via
`lazyweb_search_ab_tests` when available; when unavailable, say so. Never
ship a bet with no visual and no number behind it — but the number for a
creative bet may legitimately be the whitespace count, not a prevalence count.
Low in-category prevalence is not weak evidence for a Bold bet; it is the point.

**4. Be truth-seeking — never overclaim.**
Carry evidence strength in plain words inside deck figcaptions and the
collapsed `.build-prompt` — **measured** (real lift number) vs **directional**
(visual prevalence, no lift) vs **single source / outside this category** —
never as badge chips or extra card bullets.
Forbid comparative-performance verbs ("outperforms", "converts better") unless
a measurement backs them. Put a one-line `.corpus` banner right after Agent
Instructions when evidence is single-source, thin (<8 selected references), or
context-mismatched. Tag any brand inferred from a URL/vision description
("brand inferred - verify"). Show absence claims ("no reference does X") with
evidence-of-search: queries run × screens reviewed plus the closest near-miss.
Never invent a reference, a metric, or a company name. The handoff block and
the human-visible body must agree about confidence.

Every embedded screenshot must be legible inline at the default scale — never
require a click to understand it, never a tiny thumbnail-as-proof. Desktop
screenshots always follow the viewport-window rule; the lightbox and hover
expansion are enhancements, not the only way to see the evidence.

## Comparison Eval Contract

When validating a report re-architecture, create eval artifacts under
`.lazyweb/eval-deep-design-research-v3-{YYYY-MM-DD}/` and keep any old-skill copy
outside `skills/` so it is never installed or routed as a visible mode.

Use this fixed prompt for the old/new comparison:

> Research an upsell pricing page for a desktop SaaS product converting free users to paid without feeling pushy. Recommend the page structure and evidence-backed patterns.

Save:
- `old-skill/SKILL.md` - copy of the old instructions
- `old/report.html` - old report output
- `new/report.html` - new report output
- `compare.html` - side-by-side scorecard and links
- `metrics.json` - machine-readable timings, tool-call counts, reference counts, and blind review scores

Instrument both runs as well as the host allows:
- Total elapsed time and old-vs-new delta
- Per-step timing: context detection, Lazyweb search, web research/capture,
  synthesis, prototype/report writing, and final handoff
- Tool-call count by tool name, including Lazyweb MCP, web search,
  browser/capture, shell, and agent calls
- Design-reference count: total references found, references selected,
  references shown per bet, and references placed in the map

For quality, ask another agent in a fresh context to review only the original
prompt and anonymized report files labeled `Report A` and `Report B`. The judge
scores each report 1-5 on:
- Easy to parse
- Sharp recommendation
- Divergence between options
- Actionable design improvement
- Trust in process/evidence
- Evidence-to-recommendation fit

Require short citations to visible report elements for every score. Reveal
old/new only after scoring and include the winner plus reasoning in `compare.html`.

## Quality Calibration

- Lazyweb screenshots are evidence - use what is visibly in them.
- Web articles are opinions - filter for quality.
- Synthesis is interpretation - label it honestly.
- Do not over-index on weak Lazyweb results (`matchCount` 1/3, similarity < 0.3).
- When the corpus is weak, add the `.corpus` banner and avoid padding.
- 14 relevant references beat 20 loose ones; 8 relevant references beat 14
  loose ones. Relevance is the bar, then volume.
- A mislabeled cluster is worse than no map.
- Three reasonable bets is a failed run. The Safe bet earns trust; the Bold
  and Wild bets earn the report its existence. Novelty must always carry a
  mechanism ("why this converts HERE") — weird-for-weird's-sake is as much a
  failure as median-with-makeup.
