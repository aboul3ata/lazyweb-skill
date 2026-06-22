---
name: lazyweb-optimize-paywall
route: "Optimize paywall conversion"
router-terms: paywall, paywall design, paywall redesign, optimize paywall, improve paywall, critique paywall, conversion rate, paid conversion, trial start, annual plan, upgrade screen
description: |
  Optimize a mobile or web paywall by reading the target screen, diagnosing
  conversion friction, and producing a slot-diverse portfolio of falsifiable
  redesign hypotheses backed by Lazyweb paywall references, experiment evidence,
  conventions, and divergent design moves — rendered into the same dark report
  the internal pipeline produces. Use when the user wants to redesign, improve,
  critique, or optimize a paywall screen for paid conversion.
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

Optimize a paywall with an evidence-backed, slot-diverse portfolio of conversion
hypotheses — not generic component advice.

## CRITICAL: how this skill works (read first)

**You do NOT hand-write the report HTML.** The deterministic parts — the
Confidence × Upside × Boldness scoring, the top-1-per-slot selection, and the
dark "Hallow" report rendering — run **server-side**, reusing the internal
paywall pipeline so the output is identical to it. **Your job is the creative
front-half:** read the paywall, gather evidence, diagnose frictions, draft a
portfolio of candidate hypotheses, then orchestrate three MCP calls. Concretely:

1. **Ground + read** the target paywall (capture/located screenshot).
2. **Gather evidence** — `lazyweb_search` (references) + `lazyweb_search_ab_tests`
   (real A/B experiments with control/variant screenshots + curated learnings).
3. **Diagnose** 4-6 conversion frictions on THIS paywall.
4. **Draft a portfolio** of **12-16 candidate hypotheses (3-4 per slot)** across
   the four slots, each grounded in a friction + (where possible) a cited
   experiment.
5. **Score** them: call `lazyweb_paywall_score(recommendations, frictions)` →
   it returns the **top-1-per-slot WINNERS** (the 4 to mock up) + every scored
   candidate.
6. **Generate one mockup per winner** via the async mockup pair
   (`lazyweb_start_mockup` → `lazyweb_get_mockup`), EDIT mode off the current
   screenshot.
7. **Render + host**: call `lazyweb_render_report(report_skill="optimize-paywall",
   report_data=…)` with the structured `report_data` below → it returns the
   hosted report URL. **That URL is the deliverable.**

Do NOT author `report.html`, a `report.md`, embedded CSS/JS, or a build script —
the server renderer owns all of that now. After you get the URL, summarize the
portfolio (one line per slot, naming the lead) and give the user the URL.

The work dir convention is `$WORK = .lazyweb/optimize-paywall/{topic-slug}-{YYYY-MM-DD}`;
save the current screenshot + the generated mockups under `$WORK/references/`.

## Lazyweb MCP Setup

Use hosted Lazyweb MCP tools at `https://www.lazyweb.com/mcp`. First list the
tools and run `lazyweb_health`. Required tools:

- `lazyweb_health` — verify connectivity.
- `lazyweb_search` — paywall references + convention examples (use `visionDescription`).
- `lazyweb_search_ab_tests` — **mobile A/B experiment evidence**: control/variant
  screenshots + the curated `learning`. This is the evidence that grounds the
  before/after card and the candidates' `winning_move_verbatim`.
- `lazyweb_paywall_score` — server-side C/U/B stack-rank; returns the 4 winners + all scored candidates.
- `lazyweb_start_mockup` + `lazyweb_get_mockup` — async paywall mockup generation
  (the sync `lazyweb_generate_mockup` times out through the gateway; use the pair).
- `lazyweb_render_report` — server-renders + hosts the report from `report_data`
  (pass `report_skill="optimize-paywall"`).
- `lazyweb_compare_image` / `lazyweb_find_similar` / `lazyweb_get_flows` — optional.

**Pass `skill: "optimize-paywall"` and `version: "<x.y.z>"` on every call** (read
`~/.lazyweb/VERSION`, fall back `"0.0.0"`). Optional analytics; never drop a real arg.

If the MCP is missing/auth fails, tell the user to run
`curl -fsSL https://www.lazyweb.com/install.sh | bash`, reload, and rerun.

## Ground the paywall

1. Capture or read the target paywall. Prefer a real screenshot or URL over
   prose. Save it to `$WORK/references/current-state.png` — it becomes the
   "Current" column.
2. Ask one concise question only if the product, platform, conversion goal, or
   target screen is missing and cannot be inferred.
3. Read the paywall and note: components (header, hero, benefits, pricing, CTAs,
   trust signals, FAQ, close/skip); layout pattern; strategic moves (anchoring,
   trial framing, urgency, social proof, risk reversal, tier framing); offer
   (trial vs none, single vs multi-tier, intro vs flat, annual vs monthly
   emphasis); user state (cold first session, warm feature wall, post-onboarding,
   checkout, cancellation save, upgrade moment).

## Evidence workflow

1. **References** — 3-5 `lazyweb_search` queries for paywalls matching the
   category, user state, conversion goal, and layout. Read `visionDescription`.
2. **Experiments** — `lazyweb_search_ab_tests` with the **category as the
   industry filter** plus the conversion goal, constraints, and the target
   description. Include the product name only as target context (NOT as an exact
   `company`/`product` filter — that over-filters to zero). Each returned
   experiment has a control screenshot, a variant screenshot, and a curated
   `learning`. **Label the ones you'll use `R1`, `R2`, …** — these become the
   `experiments` map + the candidates' `evidence_ref`. Treat learnings as
   directional (screenshot-diff, not measured lift). If the corpus returns no
   on-context experiment, say so and proceed on reference grounding.
3. Optional: `lazyweb_compare_image` (structural twins), `lazyweb_get_flows`
   (sequencing), divergent `lazyweb_search` outside the category for the bold/
   contrarian slots.

**Search discipline:** never repeat an identical query (results are
deterministic — page with `offset`). On `no_matches`/`low_coverage`, take the
closest result or note the gap; don't loop.

## Diagnose the frictions (Pass 1 — required, before any hypothesis)

List **4-6 conversion frictions** on THIS paywall. Each is an object:

```json
{"id":"F1","summary":"<the problem, one sentence>","type":"friction|anti_pull|misframing","severity":"high|medium|low","location":"<component>","visible_evidence":"<what on the screen shows it>"}
```

Also name 1-2 genuine **strengths** as `severity:"none"` rows. Do not invent a
problem to fill a row. These frictions are what every hypothesis must attack
(via `addresses_friction`), and severity feeds the server's scoring.

## Draft the portfolio (Pass 2 — 12-16 candidates, 3-4 per slot)

Emit **12-16 candidate hypotheses total, 3-4 per slot**, across FOUR slots. The
server's stack-rank picks the **top-1 per slot** for the final 4; the rest show
up in the prioritization table as alternates you considered. Within a slot, each
pick must test a **fundamentally different** change from its slot siblings; across
slots, the four slot characters must stay distinct.

- **SLOT 1 — `safe_bet`**: High confidence, modest UI change (`copy_tweak` or a
  small `component_swap`), modest expected upside. Evidence-backed (cite an `R#`).
  The optimization a PM ships Monday morning. Low boldness by design.
- **SLOT 2 — `high_value_bet`**: High confidence + larger structural change + big
  upside potential. Evidence backs the mechanism (cite an `R#`). The thing you'd
  run with 2 weeks of dev instead of 1 day. Mid-to-high boldness.
- **SLOT 3 — `bold_swing`**: Lower confidence base, structural change, VERY high
  upside ceiling. The 2× play — could win big or fail loudly. NOT what a generic
  best-practices summary would propose; may lean on a divergent/trending move
  rather than direct A/B evidence. Justify in `boldness_rationale`.
- **SLOT 4 — `contrarian`**: Either (a) a move <20% of peer paywalls ship —
  explain why convention is wrong for THIS paywall — OR (b) attack a problem the
  friction list didn't name (you think it's the real issue). Counter-convention
  is the point. Highest boldness.

Each candidate is an object with EXACTLY these fields:

```json
{
  "slot": "safe_bet | high_value_bet | bold_swing | contrarian",
  "hypothesis_title": "<=3 words, <=22 chars, Title Case",
  "addresses_friction": "F#",
  "evidence_ref": "<R# you cited, or empty for a slot-4 pick with no A/B winner>",
  "evidence_company": "<company verbatim from that R#, or empty>",
  "winning_move_verbatim": "<direct quote (<=200 chars) from that experiment's learning, or empty>",
  "data_lenses": ["missing_pattern" | "consensus_movement" | "trending" | "divergent"],
  "how_we_apply_it": "<ONE sentence (<=140 chars): the concrete visual move on THIS paywall>",
  "hypothesis": "Making [change] should [conversion outcome] because [mechanism]. (<=180 chars)",
  "boldness_rationale": "<one sentence; REQUIRED for bold_swing + contrarian: why it departs from convention/current UI>",
  "change_scope": "copy_tweak | component_swap | section_restructure | full_redesign",
  "mockup_prompt": "A redesigned paywall mockup for [PRODUCT]: <build-spec: composition, EXACT quoted copy, measured brand hexes/type, what moves to make room, 1-2 Do-not lines. 4-8 sentences.>"
}
```

Hard rules — drop any pick that fails:
- 3-4 picks per slot; 12-16 total. Each carries its `slot`.
- Each pick targets a friction with severity > `none`.
- If `evidence_ref` is set, `winning_move_verbatim` is a direct quote from that
  `R#`'s learning. Each cited `R#` is used by a DIFFERENT pick where possible.
- `data_lenses` lists only the lenses that genuinely apply (empty is fine).
- Describe the actual visual move in plain language — no taxonomy keys, no
  platitudes ("two side-by-side plan cards", not "comparison_tiers_grid").
- Distinct slot characters: a second `safe_bet` is invalid; a `contrarian` that
  isn't actually counter-convention is invalid. Better 3 strong picks in a slot
  than 4 with a forced weak one.
- **Anti-hybrid checksum:** each hypothesis answers "what would you change about
  THIS paywall, and why" — not "what did experiment X test." The report is a
  paywall redesign, not an experiment digest.

You may also draft `experiment_verdicts` — one row per experiment you pulled,
`apply` (it shaped a hypothesis) or `skip` (why not) — for the Referenced-data
table. Optional but recommended:

```json
{"ref":"R1","verdict":"apply|skip","evidence_company":"<company>","winning_move":"<short>","applied_as":"<hypothesis_title if applied>","how_we_apply_it":"<one line if applied>","skip_reason":"<one line if skipped>"}
```

## Score the portfolio (which 4 to mock up)

Call **`lazyweb_paywall_score`** with `{recommendations: [your 12-16 candidates], frictions: [your frictions], report_skill: "optimize-paywall"}`.
It returns:
- `selected`: the **4 winners** (top-1 per slot), each with `slot`, `hypothesis_title`,
  `mockup_prompt`, `change_scope`, `rank`, `score`. **These are the only 4 you mock up.**
- `candidates`: every candidate scored on Confidence/Upside/Boldness/Total (the
  server renders these into the prioritization table — you don't need to re-send
  them, but keep your `recommendations` for the render call).

## Generate one mockup per winner (async — ENFORCED LADDER)

For EACH of the 4 `selected` winners, generate a mockup that is an EDIT of the
CURRENT screenshot (so it keeps the real brand/layout/dimensions), conditioned on
the winner's `mockup_prompt` prefixed with the **ENFORCED PREAMBLE** below.

- **All hosts (Codex, Claude Code, etc.)** → use the async pair. Do NOT call
  `lazyweb_generate_mockup` (it times out through the gateway). Start all 4 up
  front so they run in parallel: `lazyweb_start_mockup` with `prompt` =
  `ENFORCED PREAMBLE + winner.mockup_prompt`, the current screen as `image_base64`
  (+ `mime_type`), and **omit `size`** (EDIT mode defaults to `auto`, which
  matches the input's aspect ratio so the mockup is the same shape/size as the
  current screen). Then poll `lazyweb_get_mockup` for each `job_id` every ~5s
  (budget ~170s) until `done`. Use the returned **`image_url`** (a signed URL) as
  this winner's mockup in `report_data.mockups` — NOT the base64 (four base64
  mockups overflow the gateway request-size limit; the renderer fetches the URL
  server-side). You may also save `image_base64` to
  `$WORK/references/mock-<slot>.png` for the user's local copy.
- **Fallback** — only if a mockup truly can't be generated
  (`MOCKUP_IMAGE_KEY_MISSING` / `MOCKUP_DAILY_LIMIT`, an `error` status, or still
  `pending` after ~170s): omit that one slot's key from the `mockups` map. The
  server renders a "(no mockup)" placeholder for it and the rest of the report is
  unaffected. Never block the whole report on one missing mockup; never use ASCII
  art. A mix (3 real + 1 placeholder) is fine.

### ENFORCED PREAMBLE — prepend to every winner's `mockup_prompt`

> ENFORCED CONSTRAINTS — the output is a redesigned paywall mockup based on the
> baseline image. (1) EXACT VISUAL STYLE PRESERVATION: match the baseline's
> background color, brand palette, typography (family/weight/size hierarchy),
> border-radius, icon/illustration style, and overall feel — it must look like
> the same product. (2) DIMENSION + ASPECT PRESERVATION: keep the baseline's
> aspect ratio and status-bar / safe-area insets in the same proportions.
> (3) PRIMARY CTA PROMINENCE LOCK: the dominant purchase/subscribe button stays
> AT LEAST as large and as visually dominant as in the baseline — you may move
> it, never shrink it; if the change needs room, collapse other content rather
> than miniaturizing the CTA. (4) CHANGE SCOPE — apply the change at the
> `change_scope` named for this winner (copy_tweak = change only the named text;
> component_swap = restyle/replace one component; section_restructure = reflow one
> section; full_redesign = restructure the layout while preserving brand identity
> + aspect ratio). === CHANGE TO APPLY === {the winner's mockup_prompt}

## Render + host the report

Call **`lazyweb_render_report`** with `report_skill="optimize-paywall"` and a
`report_data` object built as follows (every image is a `data:` URI or an https
URL — the server inlines them):

```json
{
  "target_image": "data:image/png;base64,…   (the current paywall screenshot)",
  "frictions": [ …your Pass-1 frictions… ],
  "recommendations": [ …ALL 12-16 candidates you drafted… ],
  "experiments": {
    "R1": {"company_name":"…","design_delta_summary":"<the curated learning>","control_signed_url":"<control image URL>","experiment_signed_url":"<variant image URL>"},
    "R2": { … }
  },
  "experiment_verdicts": [ …optional… ],
  "mockups": { "safe_bet":"<image_url from get_mockup>", "high_value_bet":"…", "bold_swing":"…", "contrarian":"…" }
}
```

Notes:
- `mockups` is keyed by the WINNER's `slot` (one per selected winner), and each
  value is the **`image_url`** from `lazyweb_get_mockup` (a signed URL — the
  renderer fetches it). Do NOT inline mockup base64 here; four base64 mockups
  overflow the gateway request-size limit. `target_image` stays a base64 `data:`
  URI (one image is fine). Omit a slot only if its mockup couldn't be generated.
- `experiments` is keyed by the `evidence_ref` (`R#`) your winning candidates
  cite; `control_signed_url`/`experiment_signed_url` are the before/after images
  from `lazyweb_search_ab_tests` (the server fetches + inlines them). Include at
  least the experiments the 4 winners cite so the before/after Evidence card
  renders.
- Pass a stable `idempotency_key` (e.g. `"optimize-paywall/{topic}-{date}"`) so a
  re-render dedupes to the same URL.
- On a `400` with `code:"render_field_missing"`/`render_field_invalid`, the
  `detail` names the bad field — fix it in `report_data` and retry ONCE.

The response `{ ok, id, url }` carries the hosted report URL. **Open/print it for
the user** — that URL is the deliverable.

## After rendering

1. Give the user the report URL.
2. Summarize the portfolio: one line per slot (Safe bet / High-value bet / Bold
   swing / Contrarian), naming the **lead** (the highest-Total winner).
3. Suggest next steps: implement the lead hypothesis, or ask
   `/lazyweb-ab-test-research` to mine the experiment corpus deeper.

## Operating principles

- **Evidence-grounded, not generic.** Every candidate ties to a named friction
  and, where possible, a cited experiment with a real `winning_move_verbatim`.
  Never invent a company, a metric, or an experiment.
- **Truth-seeking.** Treat experiment learnings as directional (screenshot-diff),
  never as measured lift, unless the tool returns a measured number. If no
  on-context experiment exists, say so and lean on reference + convention
  grounding.
- **Slot diversity is the point.** Four variations of the same move is a failure
  even if each is individually fine. Make the four slots genuinely different in
  mechanism and boldness.
- **The server owns scoring + look.** Don't second-guess or re-implement the
  ranking; send honest candidates + frictions and let `lazyweb_paywall_score`
  rank them.
