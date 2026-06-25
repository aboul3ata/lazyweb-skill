---
name: lazyweb-paywall-cta
route: "Rewrite one paywall CTA"
router-terms: paywall cta, primary cta, cta copy, cta button, button copy, paywall button, rewrite cta, stress-test cta, stress test cta, cta text, call to action
description: |
  Critique and rewrite a paywall primary CTA (and adjacent microcopy) by
  reading the target screen, diagnosing CTA-level conversion friction, and
  producing ranked CTA candidates backed by Lazyweb's paywall CTA corpus,
  real before/after A/B observations, and divergent mechanism examples. Use
  when the user wants to evaluate, rewrite, or stress-test a paywall CTA —
  not a full paywall redesign.
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

# Paywall CTA Optimization

Rewrite or stress-test a paywall primary CTA with mechanism-backed
alternatives, not generic copy advice.

## CRITICAL: Output Behavior

**This skill produces a hosted report, not a plan.** Regardless of whether you
are in plan mode or not, ALWAYS:

1. Author the report content as `.lazyweb/paywall-cta/{topic}-{date}/work/report-data.json` (structured content, NOT HTML)
2. Embed Lazyweb references directly with their returned `imageUrl` / `image_url`; save only the current-state screenshot under `.lazyweb/paywall-cta/{topic}-{date}/references/`
3. Do NOT create `report.html`, `report.md`, or any other report artifact by hand — the server renders the report
4. Do NOT write the CTA content into a plan file
5. Render and host the report with `lazyweb_render_report` (see "Render and host the report" below) — this single call IS the deliverable; producing the report and hosting it are the same action, so there is nothing to skip
6. After the render call returns, summarize the top recommended CTA + 3-5 ranked alternatives and give the user the shareable link (the report lives only at that URL)
7. Ask the user which direction looks right
8. If in plan mode, exit plan mode after the user confirms
9. Suggest next steps: "Ship the strongest candidate as an A/B test against the
   current CTA, or ask `/lazyweb-optimize-paywall` for a full paywall
   redesign, or `/lazyweb-ab-test-research` for deeper experiment mining."

## When to Use This

- User wants to rewrite, evaluate, or stress-test ONE paywall CTA
- User has the paywall screenshot, the current CTA copy, and a clear
  conversion goal (paid start, trial start, plan select, upgrade, win-back)
- User asks "is this CTA right?" or "give me 5 better CTAs" or
  "what should this button say?"

## When NOT to Use This

- Full paywall redesign / layout / pricing rework → route to `lazyweb-optimize-paywall`
- Onboarding / signup / non-paywall CTAs → route to `lazyweb-deep-design-research` or `lazyweb-lite-design-research`
- "Find me A/B experiments about pricing copy" → route to `lazyweb-ab-test-research`

## Lazyweb MCP Setup

Use hosted Lazyweb MCP tools at `https://www.lazyweb.com/mcp` for
database-backed evidence. First list the available tools and run
`lazyweb_health`.

Required public tools:
- `lazyweb_health` — verify Lazyweb MCP connectivity
- `lazyweb_paywall_cta_research` — the core retrieval for this skill. Returns the CTA framework SOP plus the corpus slice, divergent examples, convention stats, brand-own references, and the broad pool of CTA-changed A/B observations the agent curates into "Strongest Matches."
- `lazyweb_search_ab_tests` — mobile-only broader paywall A/B evidence when the user asks "what experiments have shipped on this?"
- `lazyweb_search` — visual paywall references and convention examples
- `lazyweb_request_image_upload` / `lazyweb_resolve_image_upload` — presigned upload of the local paywall screenshot (authed by the MCP session; no `~/.lazyweb` token), yielding a public `image_url`
- `lazyweb_compare_image` — visual similarity over the user's paywall image (pass the uploaded `image_url`)
- `lazyweb_render_report` — render + host the finished report from `report_data` + reference images, returns the shareable link (the deliverable; see "Render and host the report" below)

**Search discipline:** never repeat an identical `lazyweb_search` query — results are deterministic; page deeper with `offset` and follow `pagination.next_offset`. On `no_matches`/`low_coverage` warnings, use the closest result or note the coverage gap — don't rephrase the same concept in a loop. On `company_not_in_library`, use a suggested company or drop the filter.

**Pass `skill: "paywall-cta"` on every call.** Include `"skill": "paywall-cta"` in the arguments of each `lazyweb_*` tool call — for example `{"query": "pricing page", "limit": 30, "skill": "paywall-cta"}`. This is optional analytics metadata Lazyweb uses to understand which skills are used; never drop or change a real argument for it.

**Also pass `version: "<x.y.z>"` on every call.** Read `~/.lazyweb/VERSION` once per session at skill start (e.g. `cat "$HOME/.lazyweb/VERSION" 2>/dev/null || echo 0.0.0`); fall back to `"0.0.0"` if the file is missing or unreadable — never block on this. Include `"version": "<that-value>"` in the arguments of every `lazyweb_*` tool call alongside the existing `skill` arg — for example `{"query": "pricing page", "limit": 30, "skill": "paywall-cta", "version": "0.4.5"}`. Optional analytics metadata Lazyweb uses to track which skill-pack versions are running; never drop or change a real argument for it.

If Lazyweb MCP is not installed or auth fails, tell the user: "Lazyweb MCP is
not installed. Run `curl -fsSL https://www.lazyweb.com/install.sh | bash`,
reload this client, then rerun this skill." Continue with web research only if
the user wants a degraded fallback.

The CTA wrapper is included free. If `lazyweb_paywall_cta_research` is
available, call it directly and use the returned CTA evidence. If the tool is
unavailable or returns no matching examples, clearly label the coverage gap and
continue with `lazyweb_search` / `lazyweb_compare_image` visual references.

## Read the paywall first

Before searching, establish the target:

1. Run `lazyweb-context-detect` when available to infer project, platform, and stack.
2. Capture or read the target paywall. Prefer an actual screenshot saved to
   `$REPORT_DIR/references/current-state.png`. **Always capture / record the
   verbatim current primary CTA copy** — paraphrasing it loses information the
   corpus needs.
3. **Upload the screenshot, then send it by `image_url` — never inline base64.**
   `lazyweb_compare_image` accepts a public `image_url`, and an LLM corrupts a
   full-res screenshot if it tries to emit the bytes as `image_base64`. Use the
   presigned upload flow (spec: [`specs/image-upload-architecture.md`](../../specs/image-upload-architecture.md)),
   which is authed by the MCP session — no `~/.lazyweb` token required:
   1. Determine the screenshot `mime_type` (`image/png` | `image/jpeg` | `image/webp`).
   2. `lazyweb_request_image_upload({ mime_type })` → `{ upload_url, key }`.
   3. PUT the bytes with NO credentials (the presigned URL is the auth):
      ```
      curl -fsS -X PUT -H "content-type: <mime>" \
        --data-binary @"$REPORT_DIR/references/current-state.png" "<upload_url>"
      ```
   4. `lazyweb_resolve_image_upload({ key })` → `{ image_url }`.
   5. Pass that `image_url` to `lazyweb_compare_image` (e.g.
      `{"image_url": "<image_url>", "skill": "paywall-cta", "version": "<x.y.z>"}`).
   (Render-asset uploads in `lazyweb_render_report` still use the `assets:[{b64}]`
   path — migrating those is Phase 2, out of scope here.)
4. Identify:
   - **Primary goal**: first paid conversion vs trial start vs plan select vs win-back
   - **User state**: cold (first session) vs warm (engaged, gated) vs upgrade moment
   - **Offer**: trial vs no-trial, single vs multi-tier, intro price vs flat
   - **What's actually being sold**: is the paid TIER named on the screen
     (Premium, Plus, Pro, Go+)? Is a paid benefit named (ad-free, offline,
     unlimited)? If neither, the CTA must reference a generic paid-tier word,
     never the brand name when the brand is already free.
5. Ask ONE concise question only when the screen goal, plan structure, or
   user state is missing and cannot be inferred.

## Evidence Workflow

Call `lazyweb_paywall_cta_research` ONCE with the full context. It returns
all evidence the skill needs in a single payload:

- `process_sop` — the encoded CTA framework
- `evidence_examples` — Jaccard-ranked corpus rows (text-similar to current CTA)
- `divergent_examples` — creative outliers (most UNlike the current CTA)
- `creative_long_tail_phrases` — compact singleton list for mechanism scan
- `cta_experiments` — broad pool of real before/after CTA A/B observations
- `brand_own_examples` — CTAs from the user's OWN brand (voice reference, NOT to recommend)
- `conventions` — top phrases, bigrams, per-flow top phrases
- `images` — signed-URL gallery

Use the corpus as a **mechanism library**, not a text catalog:
- `top_exact_phrases` / `top_bigrams` — median copy the LLM already knows. Sanity check only; never recommend as discoveries.
- `divergent_examples` / `creative_long_tail_phrases` — **departures** that encode hypotheses. Identify the mechanism, decide if it transfers, reformulate in this product's voice.
- `cta_experiments` — curate ~10 Strongest Matches by IDEA (not lexical overlap). AFTER must be interesting. The 10 picks must be DIVERGENT from each other.

When the user asks for broader paywall A/B evidence (mechanism context outside
CTA-only copy), call `lazyweb_search_ab_tests`. Treat learnings as
directional, not measured lift.

## Critique framework

Combine the screen read with corpus evidence:

- **Alignment with peer convention**: conventional / adjacent / differentiated
- **Clarity of action**: high / medium / low — is the action obvious at a glance?
- **Specificity of value**: high / medium / low — does the CTA convey what the user gets?
- **Offer match**: matches / partial / mismatch — implying trial when there isn't one is mismatch
- **Score**: 0.0–1.0 overall fitness
- **Strengths** (1-3, specific): what the current CTA does well and why
- **Weaknesses** (1-3, actionable): concrete problems

## Propose alternatives — hypothesis-driven

Each candidate CTA must be:
- **Mechanism-led** — names the mechanism it bets on (outcome framing, price anchor, pain reframe, activity-led, benefit noun, urgency, branded-tier verb)
- **Tier-honest** — references the paid TIER or benefit, never "Try [free brand] free"
- **Falsifiable** — paired with the specific weakness in the current CTA it attacks
- **Distinct** — no two candidates share a mechanism

Output 3-5 candidates, ranked by Confidence × Impact × Differentiation
(same anchored rubric the paywall report uses) with a Total score.

Hard rules:
- Do not recommend a CTA the user is already running unless you redefine its mechanism.
- Do not propose unmotivated emoji or punctuation flourishes.
- Do not claim measured lift unless the experiment evidence explicitly provides it.
- Treat experiment learning text as directional unless the tool returns validated performance data.

## Render and host the report (the single deliverable)

The report is rendered and hosted **server-side**. Author the report content as
`work/report-data.json` (schema below), then call `lazyweb_render_report` ONCE.
That call fills the Lazyweb report template on the server, validates it, hosts it
at `https://www.lazyweb.com/report/lazyweb/{id}/`, and returns the shareable
link. There is no local `report.html`, no separate publish step, and no token to
read — producing the report and hosting it are the same action, so a finished
report is always a hosted report.

Call it once `work/report-data.json` and every `references/` image exist. The
report dir is `$REPORT_DIR = .lazyweb/paywall-cta/{topic-slug}-{YYYY-MM-DD}`.

Arguments:
- `report_data`: the parsed `work/report-data.json` object (see "Author report-data.json" below).
- `assets`: every file in `$REPORT_DIR/references/` as `{ "name": <filename>, "b64": <base64 of the bytes> }` — the locally-saved screenshots the report points at via `references/{name}`. Lazyweb references embedded by absolute imageUrl are NOT assets.
- `report_skill`: `"paywall-cta"`.
- `idempotency_key`: the report dir slug, e.g. `paywall-cta/{topic-slug}-{YYYY-MM-DD}`. Send the SAME value on every call for this report so a retry returns the same link.
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
`$REPORT_DIR/work/report-data.json`; the server fills the Lazyweb report
template from it and hosts the result (see "Render and host the report" above).
You never read or write the template, never write fill/render code, and never
open a local report file — the deliverable is the hosted URL.

All strings are RAW — the server does every bit of HTML-attribute and JS-string
escaping (quotes, `<`, apostrophes in CTA copy and bet names). Never pre-escape.
A missing or invalid required field comes back from `lazyweb_render_report` as
`{ ok:false, code:"REPORT_RENDER_ERROR", detail:"missing <field>" }` — fix that
field in `report-data.json` and call once more.

The full `report-data.json` schema (the server fills the Lazyweb template from
this):

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

Rules: at least one of `patterns` / `experiments` must be non-empty. Image
`src` = the absolute Lazyweb `imageUrl` for Lazyweb references; a relative
`references/<file>` path for locally-saved current-state / web-capture /
generated screenshots (each uploaded as an asset in the render call). Never use
`file://` URLs or absolute local paths (`/Users/...`, `C:\...`).

#### Map this skill's report onto the schema

This skill uses `patterns[]` (not `experiments[]` — that shape is for
`ab-test-research`):

- `topic` — the report title, e.g. `Paywall CTA — {product}`.
- `agent_instructions` — the agent handoff. `human` = the single human sentence
  naming the strongest CTA to ship first + why. `task` = "rewrite the paywall
  CTA" (fills `{TASK}` in the handoff). `recs` = the ranked CTA candidates as
  imperative lines (recommended first, e.g. `Ship "Start my 7-day trial" — names
  the offer the current CTA hides`). `index_on` = the well-evidenced signals
  (the specific current-CTA weakness the top candidate attacks). `dont_index` =
  median corpus phrases, brand-name CTAs when the brand is already free, generic
  verbs without an offer/benefit referent. `dive` = "`/lazyweb-optimize-paywall`
  for a full paywall redesign; `/lazyweb-ab-test-research` for deeper experiment
  mining". `evidence_basis` = "Lazyweb paywall CTA corpus + curated A/B
  observations · {DATE}".
- `current_state` — the current paywall CTA screen: `src` =
  `references/current-state.png`, `desc` = the verbatim current CTA + named
  friction on it.
- `patterns[]` — the proposed CTA alternatives, ranked, recommended first.
  Each pattern is one candidate CTA: `claim` = the candidate copy itself plus
  its one-line mechanism ("`Start my free trial` — names the offer the current
  CTA hides"); `verdict` = `Build this` for the top recommendation, `Optional`
  for runners-up, `Skip` for any candidate you list as explicitly rejected;
  `strength` = the candidate's evidence strength badge; `prevalence` = the
  convention count when one supports it; `deck` = the proof for that candidate —
  1-2 corpus rows (Lazyweb `imageUrl`) and/or a before/after A/B observation,
  each `detail` carrying the mechanism or measured/directional learning.
- `more_refs` — optional extra deck for the curated "Strongest Matches" A/B
  observations and divergent corpus rows you want shown as supporting evidence
  but did not attach to a specific candidate.

Keep candidates mechanism-led, tier-honest, falsifiable, and distinct per the
"Propose alternatives" rules above; never claim measured lift unless the
experiment evidence explicitly provides it.
