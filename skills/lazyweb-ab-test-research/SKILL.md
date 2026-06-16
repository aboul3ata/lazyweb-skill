---
name: lazyweb-ab-test-research
route: "A/B tests and monetization"
router-terms: a/b, a/b test, ab test, a-b test, experiment, test idea, test ideas, test examples, experiment examples, monetization research, lifecycle
description: |
  Research mobile growth, monetization, onboarding, checkout, paywall,
  cancellation, pricing, activation, or other product A/B tests using Lazyweb experiment
  evidence. Use when the user asks for A/B tests, experiments, test ideas,
  growth hypotheses, or PM strategy based on what other apps have tried.
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

# Lazyweb A/B Test Research

Use Lazyweb mobile-only experiment evidence to answer growth PM questions. The public
gateway and the richer backend/internal MCP surfaces are not identical, so start
from the live tool schema before choosing how to retrieve evidence.

## MCP Setup

Use hosted Lazyweb MCP tools for all database-backed evidence. First list the
available tools and run `lazyweb_health`.

- `lazyweb_health` — verify Lazyweb MCP connectivity.
- `lazyweb_search_ab_tests` — current public mobile-only gateway for A/B Test Agent research, included free.
- `lazyweb_search` — pull visual design references to pair with experiment evidence.
- `lazyweb_compare_image` / `lazyweb_find_similar` — visual reference retrieval when the target screen or adjacent examples would clarify the recommendation.
- `lazyweb_list_categories` — public category browsing helper.
- `lazyweb_render_report` — render + host the finished report from `report_data` + reference images, returns the shareable link (the deliverable; see "Render and host the report" below).

**Pass `skill: "ab-test-research"` on every call.** Include `"skill": "ab-test-research"` in the arguments of each `lazyweb_*` tool call — for example `{"query": "pricing page", "limit": 30, "skill": "ab-test-research"}`. This is optional analytics metadata Lazyweb uses to understand which skills are used; never drop or change a real argument for it.

**Also pass `version: "<x.y.z>"` on every call.** Read `~/.lazyweb/VERSION` once per session at skill start (e.g. `cat "$HOME/.lazyweb/VERSION" 2>/dev/null || echo 0.0.0`); fall back to `"0.0.0"` if the file is missing or unreadable — never block on this. Include `"version": "<that-value>"` in the arguments of every `lazyweb_*` tool call alongside the existing `skill` arg — for example `{"query": "pricing page", "limit": 30, "skill": "ab-test-research", "version": "0.4.5"}`. Optional analytics metadata Lazyweb uses to track which skill-pack versions are running; never drop or change a real argument for it.

If Lazyweb MCP is not installed or auth fails, tell the user: "Lazyweb MCP is
not installed. Run `curl -fsSL https://www.lazyweb.com/install.sh | bash`,
reload this client, then rerun this skill." Then continue with general web
research only if the user wants a degraded fallback.

Current public `lazyweb_search_ab_tests` arguments:

```json
{
  "target_screen_description": "trial reminder onboarding paywall",
  "product": "Example App",
  "category": "Health & Fitness",
  "conversion_goal": "trial start rate",
  "constraints": "keep annual plan visible",
  "operation": "research",
  "experiment_ids": ["exp_123"],
  "include_images": true,
  "target_image_url": "https://example.com/screen.png",
  "limit": 25,
  "analysis_experiment_limit": 10,
  "visual_inspection_budget": 0,
  "interesting_learning": false,
  "high_design_bar": false
}
```

The public A/B wrapper is included free. If `lazyweb_search_ab_tests` is
available, call it directly and use the returned experiment evidence. If the
tool is unavailable or returns no matching experiments, say that experiment
evidence was unavailable for this query, then continue with Lazyweb visual
references when useful.

`category` is the public gateway's industry filter. `product` is forwarded as
target context for the user's app, not as a reason to force exact company
matching; do not retry exact product/company spellings or trust a zero-result
response when warnings indicate a product/company filter was applied. If the
product is useful context, include it, but make the retrieval query
screen-pattern plus industry led.

### Backend/Internal Experiment Tools

Some backend or internal MCP surfaces expose these richer generic experiment
tools. Use them only when the current tool list includes them:

- `lazyweb_find_experiments` — retrieve generic `_experiments` evidence.
- `lazyweb_recent_experiments` — retrieve the latest 10, 25, or 50 `_experiments` rows.
- `list_companies_by_categories` — turn category names into company IDs.

`_experiments` is a limited screenshot-diff evidence set. It is generic across
screens and categories, not paywall-only. Treat learning text as directional
hypotheses, not statistically measured lift.

Full `lazyweb_find_experiments` filter matrix:

```json
{
  "query": "trial reminder onboarding upsell",
  "company": "Example App",
  "category": "Health & Fitness",
  "screen_type": "onboarding upsell",
  "platform": "mobile",
  "company_ids": [123, 456],
  "canonical_ids": [789],
  "since_iso": "2026-06-01T00:00:00Z",
  "limit": 50,
  "app_store_rank_max": 50,
  "app_store_overall_rank_max": 50,
  "app_store_category_rank_max": 25,
  "high_design_bar": true
}
```

Full `lazyweb_recent_experiments` filter matrix:

```json
{
  "limit": 25,
  "company": "Example App",
  "category": "Health & Fitness",
  "platform": "mobile",
  "company_ids": [123, 456],
  "app_store_rank_max": 50,
  "app_store_overall_rank_max": 50,
  "app_store_category_rank_max": 25,
  "high_design_bar": true
}
```

`lazyweb_search_ab_tests` exposes `interesting_learning` and
`high_design_bar`. Leave `interesting_learning` as `false` by default. Set it
to `true` only when the user explicitly asks for uncommon, surprising, or
contrarian learnings; clearly label those as limited evidence. Set
`high_design_bar` only when the user asks for premium, stronger,
high-design-bar, or best-designed examples.

Do not route through legacy paywall-specific research tools. If a paywall appears
in the evidence, treat it as one screen type among many.

## Workflow

1. **Ground the product question.** Identify product/app, category, screen or
   flow, platform, target metric, and constraints.

2. **Choose the available evidence path.**
   - If the current MCP surface only exposes the public gateway, call
     `lazyweb_search_ab_tests`.
   - If `lazyweb_find_experiments` is exposed, retrieve generic experiment rows
     with the strongest filters available.
   - If the user asks for recent/latest tests and `lazyweb_recent_experiments` is
     exposed, use that tool with a limit of `10`, `25`, or `50`.
   - If `list_companies_by_categories` is exposed and the category is known, call
     it first and pass the returned `company_ids` into
     `lazyweb_find_experiments`.

Public gateway example:

```json
{
  "target_screen_description": "trial reminder onboarding upsell",
  "product": "Example App",
  "category": "Health & Fitness",
  "conversion_goal": "trial start rate",
  "limit": 25,
  "analysis_experiment_limit": 10
}
```

Backend/internal retrieval example:

```json
{
  "query": "trial reminder onboarding upsell",
  "category": "Health & Fitness",
  "screen_type": "onboarding upsell",
  "company_ids": [123, 456],
  "limit": 30
}
```

Use minimal filters for popular apps or broad best-practice questions. On the
public gateway, prefer screen-pattern plus `category` for industry context; keep
`product` as target context only, not as an exact company filter. Use richer
filters only on backend/internal surfaces whose live schema exposes them.

When the user asks for high-design-bar companies, premium examples,
best-designed apps, or stronger taste filtering, add this only to tools whose
live schema exposes it:

```json
{"high_design_bar": true}
```

This filters to companies where `companies.high_design_bar = true` on the
backend/internal surfaces that support it.

For "recent", "latest", or "what changed lately" requests, call
`lazyweb_recent_experiments` when it is exposed, with `limit` set to `10`, `25`,
or `50`:

```json
{"limit": 25}
```

For ranked App Store slices, add rank filters:

```json
{
  "category": "Health & Fitness",
  "app_store_overall_rank_max": 50,
  "app_store_category_rank_max": 25,
  "limit": 25
}
```

3. **Supplement with design references.** Call `lazyweb_search` for the same
   screen or flow when visual examples would make the recommendation clearer.
   Read `visionDescription` before relying on any screenshot, and embed returned
   optimized `imageUrl` values directly instead of downloading Lazyweb images locally.
   Never repeat an identical query — page deeper with `offset` and follow
   `pagination.next_offset`; on `no_matches`/`low_coverage` warnings use the
   closest result or note the gap instead of rephrasing in a loop, and on
   `company_not_in_library` use a suggested company or drop the filter.

4. **Synthesize like a growth PM.** Answer with:
   - Relevant observed experiments and what changed.
   - Likely hypothesis behind each change.
   - Target metric and guardrail metric.
   - Recommended test sequence.
   - Evidence strength and gaps.
   - Where the user should not overgeneralize.

5. **Be honest about weak evidence.** If the A/B wrapper is unavailable, or the
   backend/internal retrieval tools return few or weak matches, say that
   directly and fall back to general best practices only after labeling them as
   inference.

## CRITICAL: Output Behavior

For a quick strategy question, answer in chat. For anything the user will act on,
the deliverable is a **hosted report**. Regardless of plan mode, ALWAYS:

1. Author the report content as `$REPORT_DIR/work/report-data.json` (structured
   content per the schema below — NOT `report.html`).
2. Embed Lazyweb references directly by their returned `imageUrl`/`image_url`;
   save only locally-captured screenshots (current-state, web captures,
   generated mock-frames) under `$REPORT_DIR/references/`.
3. Do NOT hand-write `report.html`, `report.md`, or any other report artifact —
   the server renders the report from `report-data.json`.
4. Render and host the report with `lazyweb_render_report` (see "Render and host
   the report" below) — this single call IS the deliverable; producing the
   report and hosting it are the same action, so there is nothing to skip.
5. After the render call returns, surface the shareable link and a concise
   summary that centers the actual experiments — control vs variant, what
   changed, and the learning — not just a synthesized opinion.

**The report must center the actual experiments** — control vs variant, what
changed, and the learning. Experiments are the centerpiece; recommendations are
distilled from them.

## Render and host the report (the single deliverable)

The report is rendered and hosted **server-side**. Author the report content as
`work/report-data.json` (schema below), then call `lazyweb_render_report` ONCE.
That call fills the Lazyweb report template on the server, validates it, hosts it
at `https://www.lazyweb.com/report/lazyweb/{id}/`, and returns the shareable
link. There is no local `report.html`, no separate publish step, and no token to
read — producing the report and hosting it are the same action, so a finished
report is always a hosted report.

Call it once `work/report-data.json` and every `references/` image exist. The
report dir is `$REPORT_DIR = .lazyweb/ab-test-research/{topic-slug}-{YYYY-MM-DD}`.

Arguments:
- `report_data`: the parsed `work/report-data.json` object (see "Author report-data.json" below).
- `assets`: every file in `$REPORT_DIR/references/` as `{ "name": <filename>, "b64": <base64 of the bytes> }` — the locally-saved screenshots the report points at via `references/{name}`. Lazyweb references embedded by absolute imageUrl are NOT assets.
- `report_skill`: `"ab-test-research"`.
- `idempotency_key`: the report dir slug, e.g. `ab-test-research/{topic-slug}-{YYYY-MM-DD}`. Send the SAME value on every call for this report so a retry returns the same link.
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
the report" above). You never read or write the template, never write fill/render
code, and never open a local report file — the deliverable is the hosted URL.

**All strings are RAW** — the server does every bit of HTML-attribute and
JS-string escaping (quotes, `<`, apostrophes in company names). Never pre-escape.

**Image `src` rules.** Lazyweb references: the absolute `imageUrl`/`image_url`
URL Lazyweb returns (signed for 365 days; never download them, never construct
URLs from raw `path` values). Locally saved screenshots (current-state, web
captures, generated mock-frames): a relative `references/{filename}` path, with
that file uploaded as an `asset` in the render call. Never use `file://` URLs or
absolute local paths (`/Users/...`, `C:\...`). If an experiment image URL is
missing, drop that image `src` and keep the vision-description text.

A missing or invalid required field comes back from `lazyweb_render_report` as
`{ ok:false, code:"REPORT_RENDER_ERROR", detail:"missing <field>" }` — fix that
field in `report-data.json` and call once more. Do not browse-load, screenshot,
or vision-inspect anything; the server validates the report.

STANDARD report-data.json schema:

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

Field notes:
- `topic` (required) — the report title, e.g. "A/B Test Research: {flow / question}".
- `agent_instructions` (required) — the copy-pastable downstream-agent handoff. `human` is one plain sentence (the single most important test to run first); `task` fills `{TASK}` and for THIS skill = "prioritizing and shipping {flow} experiments grounded in what comparable apps have already tested"; `recs` is the ranked imperative list (>=1 required, each indexed on a named experiment learning, never generic growth-speak); `index_on` names the 1-3 best-evidenced experiment learnings; `dont_index` names directional-not-measured learnings, off-category experiments, and single-experiment signals; `dive` → "`/lazyweb-optimize-paywall` to turn a paywall learning into a falsifiable redesign, or `lazyweb_search_ab_tests operation=grab` with the cited experiment_id(s)"; `evidence_basis` = "A/B experiments (screenshot-diff) · {DATE}".
- `current_state` — `null` unless the user is researching a specific screen they captured; then `{ "src": "references/current-state.png", "alt": "<alt>", "desc": "<one line>" }`.
- `experiments` (required if `patterns` is absent) — **the centerpiece.** One entry per experiment from `evidence.experiments[]`, rendered as control-vs-variant pairs. `title` = experiment name; `change` = the concrete control→variant diff (from `what_changed`); `control`/`variant` carry the optimized image `src` + `alt` + a `label` ("Control — …" / "Variant — …"); `facts[]` is the metric/lift/guardrail/confidence list (`{ "k": "Primary metric", "v": "paid conversion" }`, `{ "k": "Lift", "v": "+18% (p<0.05)" }`, `{ "k": "Guardrail", "v": "refund rate flat" }`); `outcome` is the one-line result + learning. Synthesize a variant label from `what_changed` and tag it "agent-described" when `vision_description` is empty.
- `patterns` (optional here; required only if `experiments` is empty) — recommendation cards distilled FROM the experiments. `verdict` ∈ "Build this" | "Optional" | "Skip" (required); `strength` ∈ "Strong" | "Moderate" | "Thin" (optional badge); `prevalence` an optional count; `claim` the one-line claim (required); `deck[]` the 2-4 real references that back it (each `{src, alt, source, company, detail}`). Every claim carries its proof.
- `more_refs` — `null`, or an extra references deck `[{src, alt, source, company, detail}]` from supplementary `lazyweb_search` visual refs.
- **At least one of `patterns` / `experiments` must be non-empty.** The report leads with Experiments.

The report leads with the Experiments — `evidence.experiments[]` mapped onto
`experiments[]`. The corpus is mobile-subscription-centric and learnings are
directional screenshot-diff signals (not measured lift) unless the tool returns
a real lift number; carry that honesty in the `agent_instructions` and in each
experiment's `facts`/`outcome` wording. `company_name` is a crawl seed — clean an
obvious slug but never invent a brand; flag any `/figma/` or `!`-prefixed path as
a non-production capture in the alt/label.

### Fields `lazyweb_search_ab_tests` (operation `research`) returns by default

Per experiment in `evidence.experiments[]` (no flags needed):
- `company.company_name`, `company.category`, `company.subcategory`, `company.app_store_ranking`
- `control.{imageUrl, image_url, path, vision_description}` and `variant.{imageUrl, image_url, path, vision_description}`
- `what_changed` (text: the concrete control→variant diff), `learning` (text: directional hypothesis + why), `evidence_confidence`, `platform`, `experiment_id`, `target_screen_description`

Top level: `recommendations[]` (each cites an `experiment_id` + `target_metric` + `guardrail_metric` + `confidence`), `strong_points`, `weak_points`, `dataset_caveat`.

Experiment images are returned as optimized URLs. Use `control.imageUrl` or
`control.image_url`, and `variant.imageUrl` or `variant.image_url`, directly as
the `src` of the experiment's `control`/`variant` in `report-data.json`.
Some adjacent experiment objects may expose aliases such as `control_image_url`,
`controlImageUrl`, `variant_image_url`, or `variantImageUrl`; use those directly
when present. Supabase storage-backed URLs are signed for 365 days. Do not use
screenshot IDs, and do not construct storage URLs from raw `path` values. If an
image URL is missing, drop that image `src` and keep the `vision_description` in
the label/alt. `company_name` is a crawl seed — you may clean an obvious slug but
never invent a brand; flag any `/figma/` or `!`-prefixed path as a non-production
capture in the alt/label.

(Visual refs from `lazyweb_search` also embed via their returned
`imageUrl`/`image_url` fields — feed them to `more_refs[]` or a pattern `deck`.)

### Map the tool output onto report-data.json

The render template is fixed and validated server-side — you only choose the
structured content. Map the `lazyweb_search_ab_tests` output as follows:

- **`evidence.experiments[]` → `experiments[]`** (the centerpiece, the report
  leads with it). For each experiment: `title` from the experiment name /
  `target_screen_description`; `change` from `what_changed`; `control.src` /
  `variant.src` from the optimized image URLs above with `label` "Control — …" /
  "Variant — …" (synthesize the variant label from `what_changed` and tag it
  "agent-described" when `vision_description` is empty); `facts[]` carrying
  Primary metric, Lift, Guardrail, and Confidence (`evidence_confidence`);
  `outcome` the one-line result + learning. Fold `dataset_caveat` honesty into
  the `outcome`/`facts` wording and the `agent_instructions`.
- **`recommendations[]` → `patterns[]`** (optional here — distilled FROM the
  experiments). Each rec becomes a card with `verdict` ("Build this" / "Optional"
  / "Skip"), `strength`/`prevalence`, a one-line `claim`, and a `deck[]` of the
  real references that back it (cite the `experiment_id` learning in `detail`).
- **`recommendations` + `strong_points` + `weak_points` + `dataset_caveat` →
  `agent_instructions`** — `recs[]` from the ranked recommendations (each
  imperative line indexed on a named experiment learning), `index_on` from the
  best-evidenced learnings, `dont_index` from off-category / single-experiment /
  directional-only signals.
- Supplementary `lazyweb_search` visual refs → `more_refs[]` or a pattern `deck`.

## Operating principles & evidence components (REQUIRED - overrides convenience)

## Operating principles (apply to every report you write)

These four rules override convenience. A report that breaks them is non-conforming, even if every section is present.

These rules govern the **content** you author in `report-data.json`; the server
owns all layout and styling. A report whose content breaks them is
non-conforming, even if every field is present.

**1. Show, don't tell — every claim carries its proof.**
Any assertion — a pattern, recommendation, or A/B learning — must carry the real
experiment or screenshot that demonstrates it: an experiment in `experiments[]`,
or a pattern card whose `deck[]` holds the references that exhibit it. Never a
claim with no image behind it. Prevalence words ("most", "near-universal",
"dominant") must be backed by a shown count ("5 of 9 references") in `prevalence`
or a deck `detail`, never an adjective alone.

**2. Be opinionated; carry the decision.**
Lead with ONE recommended path. In `agent_instructions.recs[]` the first rec is
the lead pick; in `patterns[]` the strongest card carries `verdict: "Build this"`
and weaker options are tagged "Optional" / "Skip" with the one-line condition in
the `claim`. No ties among top picks; no flat undifferentiated menu.

**3. Maximize confidence with evidence + data.**
Back each recommendation with what worked for OTHER apps (real experiments /
screenshots) PLUS supporting data: a prevalence count across the corpus, and the
A/B experiment evidence itself in `experiments[]`. If no experiment data exists,
say so explicitly in the rec/claim ("no experiment data found — recommendation is
design-prevalence-based") and substitute the prevalence count as the directional
signal. Never let a recommendation render with neither a visual nor a number
behind it.

**4. Be truth-seeking — never overclaim.**
Label evidence strength honestly in plain words inside `facts`, `outcome`,
`strength`, `claim`, and `agent_instructions`: **Measured** (real lift number) vs
**Directional** (screenshot-diff / visual prevalence, no lift) vs
**Single-source / Off-category**. Forbid comparative-performance verbs
("outperforms", "underperforms") unless a measurement backs them. When evidence
is single-source, thin, or context-mismatched, carry that into the
`agent_instructions` (`dont_index`, `evidence_basis`). Tag any reference whose
brand was inferred from a URL/vision-description ("brand inferred — verify").
Never invent a reference, a metric, or a company name.

The server renders these content rules into the fixed Lazyweb template —
control-vs-variant experiment pairs, pattern cards with proof decks, the
agent-instructions handoff, the corpus/evidence honesty, and the footer are all
produced for you. You author the structured data; you never hand-write the HTML,
CSS, carousels, lightbox, or footer.
