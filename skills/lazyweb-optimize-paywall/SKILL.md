---
name: lazyweb-optimize-paywall
route: "Optimize paywall conversion"
router-terms: paywall, paywall design, paywall redesign, optimize paywall, improve paywall, critique paywall, conversion rate, paid conversion, trial start, annual plan, upgrade screen
description: |
  Optimize a mobile or web paywall by reading the target screen, diagnosing
  conversion friction, and producing 2-4 falsifiable redesign hypotheses backed
  by Lazyweb paywall references, experiment evidence, conventions, and divergent
  design moves. Use when the user wants to redesign, improve, critique, or
  optimize a paywall screen for paid conversion.
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

# Optimize Paywall

Optimize a paywall with evidence-backed conversion hypotheses, not generic
component advice.

## CRITICAL: Output Behavior

**This skill produces a hosted report, not a plan.** Regardless of whether you are
in plan mode or not, ALWAYS:

1. Author the report content as `.lazyweb/optimize-paywall/{topic}-{date}/work/report-data.json` (structured content, NOT HTML)
2. Embed Lazyweb references directly with their returned `imageUrl`/`image_url`; save only current-state and web-captured screenshots under `.lazyweb/optimize-paywall/{topic}-{date}/references/`
3. Do NOT create `report.md`, `report.html`, or any other report artifact by hand — the server renders the report
4. Do NOT write optimization content into a plan file
5. Render and host the report with `lazyweb_render_report` (see "Render and host the report" below) — this single call IS the deliverable; producing the report and hosting it are the same action, so there is nothing to skip
6. After the render call returns, summarize the 2-4 hypotheses, name the strongest one, and surface the shareable link (the report lives only at that URL)
7. Ask the user if the paywall direction looks good
8. If in plan mode, exit plan mode after the user confirms
9. Suggest next steps: "You can now implement the strongest hypothesis, ask
   `/lazyweb-ab-test-research` for deeper experiment mining, or ask `/lazyweb`
   for adjacent design references."

## Render and host the report (the single deliverable)

The report is rendered and hosted **server-side**. Author the report content as
`work/report-data.json` (schema below), then call `lazyweb_render_report` ONCE.
That call fills the Lazyweb report template on the server, validates it, hosts it
at `https://www.lazyweb.com/report/lazyweb/{id}/`, and returns the shareable
link. There is no local `report.html`, no separate publish step, and no token to
read — producing the report and hosting it are the same action, so a finished
report is always a hosted report.

Call it once `work/report-data.json` and every `references/` image exist. The
report dir is `$REPORT_DIR = .lazyweb/optimize-paywall/{topic-slug}-{YYYY-MM-DD}`.

Arguments:
- `report_data`: the parsed `work/report-data.json` object (see "Author report-data.json" below).
- `assets`: every file in `$REPORT_DIR/references/` as `{ "name": <filename>, "b64": <base64 of the bytes> }` — the locally-saved screenshots the report points at via `references/{name}`. Lazyweb references embedded by absolute imageUrl are NOT assets.
- `report_skill`: `"optimize-paywall"`.
- `idempotency_key`: the report dir slug, e.g. `optimize-paywall/{topic-slug}-{YYYY-MM-DD}`. Send the SAME value on every call for this report so a retry returns the same link.
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
escaping (quotes, `<`, apostrophes in company/claim text). Never pre-escape. A
missing or invalid required field comes back from `lazyweb_render_report` as
`{ ok:false, code:"REPORT_RENDER_ERROR", detail:"missing <field>" }` — fix that
field in `report-data.json` and call once more. Do not browse-load, screenshot,
or vision-inspect anything; the server validates the report.

Image `src` rules:
- Lazyweb references: the absolute `imageUrl`/`image_url` URL Lazyweb returns.
- Locally saved screenshots (current-state, web captures): a relative
  `references/{filename}` path, with that file uploaded as an `asset` in the
  render call.
- Never use `file://` URLs or absolute local paths (`/Users/...`, `C:\...`).

The STANDARD `report-data.json` schema (the server fills the Lazyweb template
from this):

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
  "current_state": null | { "src": "references/current-state.png", "alt": "<alt>", "desc": "<one line>" },
  "patterns": [
    { "verdict": "Build this" | "Optional" | "Skip",
      "strength": "Strong" | "Moderate" | "Thin",
      "prevalence": "5 of 9 references",
      "claim": "<one-line claim>",
      "deck": [ {"src":"<absolute imageUrl OR references/<file>>","alt":"<alt>","source":"Lazyweb"|"Web","company":"<name>","detail":"<key detail>"} ] }
  ],
  "more_refs": null | [ {"src","alt","source","company","detail"} ]
}
```

Field rules:
- `agent_instructions.recs` requires `>=1` entry; `index_on`, `dont_index`,
  `dive`, and `evidence_basis` are optional. `current_state` and `more_refs` are
  optional (`null` omits them).
- `patterns` is required and must be non-empty: at least one pattern card.

Per-skill content mapping for THIS skill:
- `topic` → the paywall report title (e.g. "Paywall optimization — {product}").
- `agent_instructions.task` → "redesigning THIS paywall to lift {goal}, starting
  from the strongest hypothesis below"; `agent_instructions.dive` →
  "`/lazyweb-ab-test-research` to validate a hypothesis against the experiment
  corpus, or `/lazyweb-deep-design-research` for adjacent paywall conventions".
- `current_state` → the current paywall screen read (the screenshot you saved at
  `references/current-state.png` plus a one-line description of its components,
  layout, offer, user state, and current friction).
- `patterns[]` → the paywall optimization recommendations: one card per
  hypothesis. `verdict` carries the opinionated call (`Build this` / `Optional` /
  `Skip`), `strength`/`prevalence` carry the evidence badge and count, `claim`
  is the hypothesis sentence ("Making [change] should [outcome] because
  [mechanism]"), and `deck[]` is the 1-3 Lazyweb reference screenshots that prove
  the supporting evidence (each `detail` = the exact UI move from
  `visionDescription`). Order the cards by expected impact — the strongest
  hypothesis first — so the order carries the prioritization. This skill has NO
  `experiments[]`: experiment evidence supports a hypothesis but renders inside
  the pattern card's claim/deck, it is not a separate control-vs-variant section.
- `more_refs` → optional extra paywall references not tied to a single
  hypothesis (the broader evidence summary), or `null`.

## When to Use This

- User wants to improve, redesign, optimize, critique, or evaluate a paywall
- User has a paywall screenshot, URL, product brief, or current paywall copy
- User asks how to increase paid conversion, trial starts, annual-plan share, or checkout continuation from a paywall
- User asks for concrete paywall redesign hypotheses, not just a broad A/B test corpus search

## When NOT to Use This

- User asks only for A/B test examples, experiment IDs, or monetization research -> route to `lazyweb-ab-test-research`
- User wants generic pricing-page references outside an app paywall -> route to `lazyweb-deep-design-research` or `lazyweb-lite-design-research`
- User wants creative UI ideas unrelated to conversion -> route to `lazyweb-design-brainstorm`

## Lazyweb MCP Setup

Use hosted Lazyweb MCP tools at `https://www.lazyweb.com/mcp` for database-backed evidence. First list the available tools and run `lazyweb_health`.

Required public tools:
- `lazyweb_health` - verify Lazyweb MCP connectivity
- `lazyweb_search_ab_tests` - retrieve and synthesize mobile-only paywall/conversion experiment evidence
- `lazyweb_search` - find paywall references and convention examples
- `lazyweb_compare_image` - find visually similar screens when the target paywall image is available as `image_base64` + `mime_type` or `image_url`
- `lazyweb_find_similar` - expand from a strong Lazyweb result by passing its returned `imageUrl`
- `lazyweb_get_flows` - optional ordered paywall, checkout, upgrade, or onboarding journeys
- `lazyweb_render_report` - render + host the finished report from `report_data` + reference images, returns the shareable link (the deliverable; see "Render and host the report" above)

**Pass `skill: "optimize-paywall"` on every call.** Include `"skill": "optimize-paywall"` in the arguments of each `lazyweb_*` tool call — for example `{"query": "pricing page", "limit": 30, "skill": "optimize-paywall"}`. This is optional analytics metadata Lazyweb uses to understand which skills are used; never drop or change a real argument for it.

**Also pass `version: "<x.y.z>"` on every call.** Read `~/.lazyweb/VERSION` once per session at skill start (e.g. `cat "$HOME/.lazyweb/VERSION" 2>/dev/null || echo 0.0.0`); fall back to `"0.0.0"` if the file is missing or unreadable — never block on this. Include `"version": "<that-value>"` in the arguments of every `lazyweb_*` tool call alongside the existing `skill` arg — for example `{"query": "pricing page", "limit": 30, "skill": "optimize-paywall", "version": "0.4.5"}`. Optional analytics metadata Lazyweb uses to track which skill-pack versions are running; never drop or change a real argument for it.

If Lazyweb MCP is not installed or auth fails, tell the user: "Lazyweb MCP is
not installed. Run `curl -fsSL https://www.lazyweb.com/install.sh | bash`,
reload this client, then rerun this skill." Continue with web research only if
the user wants a degraded fallback.

The public A/B wrapper is included free. If `lazyweb_search_ab_tests` is
available, call it directly and use the returned experiment evidence. If the
tool is unavailable or returns no matching experiments, clearly label the report
as reference-grounded but not experiment-backed, then continue with Lazyweb
visual references.

## Ground the Paywall

Before searching, establish the target:

1. Run `lazyweb-context-detect` when available to infer project, platform, and stack.
2. Capture or read the target paywall. Prefer an actual screenshot or URL over prose. If the target is a local app, capture the current screen. If the target is remote, use the provided image or URL.
3. Ask one concise question only when the product, platform, conversion goal, or target screen is missing and cannot be inferred.

Read the paywall first. Identify:
- Components present: header, hero, benefits, pricing, CTAs, trust signals, FAQ, footer, close/skip affordance
- Layout pattern: full-screen, bottom sheet, single-column stack, comparison grid, plan cards, checkout step, interstitial
- Strategic moves: anchoring, trial framing, urgency, social proof, risk reversal, tier framing, locked-feature framing
- Offer: trial vs no trial, single vs multi-tier, intro price vs flat price, annual vs monthly emphasis
- User state: cold first session, warm feature wall, post-onboarding, checkout continuation, cancellation save, or upgrade moment

## Evidence Workflow

Use multiple evidence angles:

1. **Visual references (grounding).** Run 3-5 `lazyweb_search` queries for paywalls matching the product category, user state, conversion goal, and layout. Read `visionDescription` before using a result. These references ground the redesign — they show the conventions THIS paywall should or should not adopt.
2. **Experiment evidence (validation).** Call `lazyweb_search_ab_tests` for mobile-only A/B evidence with the category as the industry filter, plus conversion goal, constraints, and target paywall description or image URL. Include the product name only as target context, not as an exact company filter. Use the tool to **validate or challenge** a hypothesis you already formed from reading THIS paywall — not as the starting point. Treat learnings as directional (screenshot-diff, not measured lift). If the corpus has no on-context experiment, say so and proceed on reference + convention grounding.
3. **Visual similarity.** If the target image is available and `lazyweb_compare_image` is exposed, retrieve structurally similar paywalls.
4. **Flows.** If the question depends on sequencing, call `lazyweb_get_flows` for paywall, checkout, onboarding, upgrade, or cancellation journeys.
5. **Divergent moves.** Search outside the obvious category when the user asks for bolder options. Extract the mechanism, not the literal design.

Use `high_design_bar: true` only when the live schema exposes it and the user asks for premium, stronger, high-design-bar, best-designed, or visually stronger examples.

**Search discipline:** never repeat an identical `lazyweb_search` query — results are deterministic; page deeper with `offset` and follow `pagination.next_offset`. On `no_matches`/`low_coverage` warnings, use the closest result or note the coverage gap — don't rephrase the same concept in a loop. On `company_not_in_library`, use a suggested company or drop the filter.

## Hypothesis grounding (required)

Every hypothesis must be anchored to the TARGET paywall's own read — the specific conventions it is missing or mis-using, and a named friction on *this* screen — not to the experiment corpus. Experiment evidence may support a hypothesis, but the hypothesis originates from "what is wrong or under-leveraged on THIS paywall," established in "Read the paywall first" above.

## Optimization Framework

The unit of analysis is a hypothesis, not a component list.

A good hypothesis takes this form:

> Making [specific change] should [specific conversion outcome] because [specific mechanism].

Good:
"Replacing the flat plan list with a comparison grid that highlights what is
locked at the monthly tier should lift annual-plan share because users see what
they lose by choosing monthly."

Bad:
"Improve the pricing UX."
"Add social proof to enhance conversion."

Propose 2-4 hypotheses. Each one must:
- Name the specific conversion metric it should move
- Describe the concrete screen change well enough to implement
- Address a named conversion friction
- Cite experiment evidence or visual/convention evidence
- Be meaningfully different from the other hypotheses
- Be falsifiable

Hard rules:
- Do not recommend a convention the user's paywall already uses unless the recommendation changes how it is used.
- Do not propose unmotivated visual polish.
- Do not write two hypotheses with the same mechanism.
- Do not claim measured lift unless the Lazyweb evidence explicitly provides it.
- Treat experiment learning text as directional unless the tool returns validated performance data.
- **Anti-hybrid checksum.** Before writing each hypothesis, confirm it answers "what would you change about THIS paywall, and why" — not "what did experiment X test." If a hypothesis reads as a summary of an experiment rather than a change to the target screen, rewrite it. The report is a paywall redesign, not an experiment digest.

## Report content contract

The server renders a polished, scannable, LIGHT-themed report from your
`report-data.json` — the hypotheses lead; evidence supports them, it does not
lead. You only author the structured content; map the report onto the schema
fields ("Author report-data.json" above) like this:

1. **Agent Instructions** → `agent_instructions`: one plain `human` sentence (the
   strongest hypothesis to ship first) plus the handoff fields (`task`, `recs`,
   `index_on`, `dont_index`, `dive`, `evidence_basis`). `recs` are the 2-4
   hypotheses as imperative one-liners, strongest first. `index_on` = the
   frictions on THIS paywall the strongest hypotheses attack; `dont_index` =
   directional-not-measured experiment learnings and off-category references.
2. **Target paywall read** → `current_state`: the saved current-state screenshot
   plus a one-line `desc` of its components, layout, offer, user state, and
   current friction.
3. **2-4 hypothesis cards** → `patterns[]`, the core, ordered by expected impact
   (strongest first — order carries the prioritization). Each card's `claim` is
   the hypothesis sentence ("Making [change] should [outcome] because
   [mechanism]"); `verdict` carries the opinionated call; `strength`/`prevalence`
   carry the evidence badge and count; `deck[]` is the 1-3 Lazyweb reference
   screenshots that prove its supporting evidence (each `detail` = the exact UI
   move from `visionDescription`).
4. **Evidence summary** → optional `more_refs`: extra visual references not tied
   to a single hypothesis (company/product, screen context, why it matters,
   source), or `null`.

The server owns the template, the layout, the styling, the carousels, the copy
button, and the footer — never hand-build any of it. Experiment evidence and
convention checks live INSIDE a pattern card's `claim`/`deck`, not as separate
hand-rendered sections. If a proposed change has no illustrating screenshot,
describe it in the `claim` and lean on the closest reference in the `deck` — the
server renders no ASCII art and no hand-coded mock-frames.

## Operating principles (REQUIRED — overrides convenience)

These four rules apply to every report you write and override convenience. A report that breaks them is non-conforming, even if every section is present.

**1. Show, don't tell — every claim carries its proof.**
Any assertion — a pattern, anti-pattern, idea, hypothesis, "what's working" item, convention check, recommendation, or A/B learning — must carry the real screenshot(s) or experiment that demonstrate it: put them in that pattern's `deck[]`, never as a bare prose list. The server renders multi-reference decks as a snap-carousel so the reader can step through the proof. Prevalence words ("most", "near-universal", "dominant") must be backed by a shown count (`prevalence: "5 of 9 references"`), never an adjective alone.

**2. Be opinionated; carry the decision.**
Lead with ONE strongest hypothesis — make it `patterns[0]` with `verdict: "Build this"` and name it in `agent_instructions.human` — so the decision shows in the human-visible body, not only in the handoff `recs`. Give every other pattern a `verdict` (`Build this` / `Optional` / `Skip`); a `Skip` card still carries the reference that justifies the skip in its `deck[]`. No ties among top picks; no flat undifferentiated menu.

**3. Maximize confidence with evidence + data.**
Back each hypothesis with what worked for OTHER apps (real screenshots in `deck[]`) PLUS supporting data: a `prevalence` count across the corpus ("seen in N of M examples") and, where the screen is growth/monetization, A/B experiment evidence via `lazyweb_search_ab_tests`. If no experiment data exists, say so in the `claim` ("no experiment data found — design-prevalence-based") and lean on the `prevalence` count as the directional signal. Never let a pattern render with neither a visual nor a number behind it.

**4. Be truth-seeking — never overclaim.**
Label evidence strength honestly with `strength` on every pattern: **Strong** (real lift number) vs **Moderate** (screenshot-diff / visual prevalence, no lift) vs **Thin** (single-source / off-category). Forbid comparative-performance verbs ("outperforms", "underperforms") unless a measurement backs them. Tag any reference whose brand was inferred from a URL/vision-description ("brand inferred — verify") in its `detail`. State absence claims with evidence-of-search (queries run × screens reviewed + the closest near-miss). Never invent a reference, a metric, or a company name.

Every embedded screenshot must be a real screenshot the report genuinely points at — a Lazyweb `imageUrl` or a locally saved `references/{file}`. Never invent an image, and never assert a claim with neither a visual nor a number behind it. The server handles legibility, cropping, carousels, and lightboxing — your job is to pick honest references and write accurate `detail`/`alt` text from each reference's `visionDescription`.

## Report footer

The server appends the Lazyweb footer ("Powered by Lazyweb — turn your agent into a design researcher… for free!") to every hosted report. Do not author it yourself.
