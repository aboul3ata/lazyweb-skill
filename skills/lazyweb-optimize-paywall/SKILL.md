---
name: lazyweb-optimize-paywall
route: "Optimize paywall conversion"
router-terms: paywall, paywall design, paywall redesign, optimize paywall, improve paywall, critique paywall, conversion rate, paid conversion, trial start, annual plan, upgrade screen
description: |
  Optimize a mobile or web paywall. From just the current screenshot, the server
  runs the internal generation pipeline — labels the screen, retrieves structural
  experiment twins, diagnoses conversion frictions, and synthesizes a slot-diverse
  portfolio of falsifiable hypotheses each bound to a real A/B experiment — then
  renders the same dark report the internal pipeline produces. The skill captures
  the screen, generates one mockup per winner, and hosts the report. Use when the
  user wants to redesign, improve, critique, or optimize a paywall for conversion.
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
  - Grep
  - AskUserQuestion
---

# Optimize Paywall

Optimize a paywall with an evidence-backed, slot-diverse portfolio of conversion
hypotheses — not generic component advice.

## CRITICAL: how this skill works (read first)

**You do NOT diagnose frictions, draft hypotheses, pick evidence, or write the
report.** All of that — friction diagnosis, the structural-twin retrieval, the
mechanism-matched evidence binding, the Confidence × Upside × Boldness scoring,
and the dark "Hallow" report rendering — runs **server-side**, reusing the
internal paywall pipeline (`_agent_synthesize`) so the output is identical to the
internal product. The model that writes the hypotheses is the internal model, not
you. **Your job is small and mechanical:**

1. **Ground** the target paywall (capture / locate a real screenshot).
2. **Synthesize** — call `lazyweb_start_paywall_synthesize` with the screenshot +
   product + conversion goal, then poll `lazyweb_get_paywall_synthesize` until
   `done` (~60-150s — it runs several LLM calls). You get back a `synthesis_id`
   and the 4 slot **winners**, each with a `slot`, `hypothesis_title`, and a
   ready-to-use `mockup_prompt`.
3. **Mock up each winner** — one mockup per winner via the async mockup pair
   (`lazyweb_start_mockup` → `lazyweb_get_mockup`), EDIT mode off the current
   screenshot, using the winner's `mockup_prompt`.
4. **Render + host** — call `lazyweb_render_report(report_skill="optimize-paywall",
   report_data={ synthesis_id, target_image, mockups, product })`. The server
   reloads the synthesis and renders the full report. **That URL is the deliverable.**

Do NOT hand-write frictions, candidate hypotheses, `evidence_ref`s,
`experiment_verdicts`, `user_labels`, or the report HTML/CSS — the server owns all
of it. Do NOT call `lazyweb_paywall_retrieve` or `lazyweb_paywall_score` yourself;
`synthesize` already does retrieval + scoring internally. After you get the URL,
summarize the 4 winners (one line per slot) and give the user the URL.

The work dir convention is `$WORK = .lazyweb/optimize-paywall/{topic-slug}-{YYYY-MM-DD}`;
save the current screenshot + the generated mockups under `$WORK/references/`.

## Lazyweb MCP Setup

Use hosted Lazyweb MCP tools at `https://www.lazyweb.com/mcp`. First list the
tools and run `lazyweb_health`. Required tools:

- `lazyweb_health` — verify connectivity.
- `lazyweb_start_paywall_synthesize` + `lazyweb_get_paywall_synthesize` — **THE
  core call (async).** Start runs the full internal generation pipeline from the
  screenshot (label → retrieve twins → diagnose frictions → synthesize the
  slot-diverse portfolio with mechanism-bound evidence → stack-rank top-1 per
  slot). Poll get until `done`. Result: `{ synthesis_id, winners:[{slot,
  hypothesis_title, mockup_prompt, change_scope, evidence_company}] }`.
- `lazyweb_start_mockup` + `lazyweb_get_mockup` — async paywall mockup generation
  (the sync `lazyweb_generate_mockup` times out through the gateway; use the pair).
- `lazyweb_render_report` — server-renders + hosts the report (pass
  `report_skill="optimize-paywall"` and `report_data.synthesis_id`).

**Pass `skill: "optimize-paywall"` and `version: "<x.y.z>"` on every call** (read
`~/.lazyweb/VERSION`, fall back `"0.0.0"`). Optional analytics; never drop a real arg.

If the MCP is missing/auth fails, tell the user to run
`curl -fsSL https://www.lazyweb.com/install.sh | bash`, reload, and rerun.

## Step 1 — Ground the paywall

1. Capture or read the target paywall. Prefer a real screenshot or URL over prose.
   Save it to `$WORK/references/current-state.png` — it becomes the "Current"
   column and the input to synthesis. **Keep the file path** — the helper script
   (Step 2) reads and base64-encodes it in code. Do NOT inline the base64 into a
   tool call yourself: a large blob gets corrupted in the agent's output ("does
   not represent a valid image" / "invalid base64-encoded value") and is
   size-hostile through the gateway. `$SKILL_DIR` below = the directory holding
   this SKILL.md (where `optimize_paywall.py` ships).
2. Ask one concise question only if the **product**, **conversion goal**, or
   target screen is missing and cannot be inferred. You do NOT need to analyze the
   paywall yourself — the server labels it.

## Step 2 — Synthesize (the server does the thinking)

**Run the helper script** `optimize_paywall.py` (it reads the screenshot file,
base64-encodes it **in code**, calls `lazyweb_start_paywall_synthesize`, and polls
`lazyweb_get_paywall_synthesize` for you — so the image bytes never pass through
your output, where they'd be corrupted or hit the gateway size limit):

```
python "$SKILL_DIR/optimize_paywall.py" synthesize \
  --image "$WORK/references/current-state.png" \
  --product "<product/company name; excluded from corpus so it isn't benchmarked vs itself>" \
  --conversion-goal "<e.g. annual-plan share / trial starts>" \
  --plan-structure "<e.g. monthly $6.99 / annual $59.99>" \
  [--category <cat>] [--constraints "<...>"] [--divergence auto|low|med|high] \
  --out "$WORK/synthesis.json"
```

It prints (and writes to `--out`) `{ synthesis_id, winners:[{slot,
hypothesis_title, change_scope, evidence_company, mockup_prompt}] }`.
`synthesis_id` goes to render; each of the 4 `winners` carries a ready
`mockup_prompt`. The script needs `LAZYWEB_MCP_TOKEN` (or
`~/.lazyweb/lazyweb_mcp_token`); if your Python has no CA bundle, set
`SSL_CERT_FILE` to one (e.g. `python3 -c 'import certifi;print(certifi.where())'`).

The script exits non-zero with a clear message on a bad image or a server
`status:"error"` — surface it and stop (don't hand-write a report).

(Already-hosted screenshot? Passing `image_url` directly to
`lazyweb_start_paywall_synthesize` also works. Never hand-pass `image_base64` —
that is the fragile path this script exists to replace.)

## Step 3 — Generate one mockup per winner (async)

For EACH of the 4 winners, generate a mockup that is an EDIT of the CURRENT
screenshot (keeps the real brand/layout/dimensions), conditioned on the winner's
`mockup_prompt` prefixed with the **ENFORCED PREAMBLE** below.

- **If you ARE Codex** → use built-in `image_gen` (gpt-image-2) with the current
  screenshot as the reference image.
- **Otherwise (Claude Code, etc.)** → run the helper script once per winner — it
  posts the current screenshot **byte-perfectly** in EDIT mode (`image_base64`
  built from the file in code, `size` omitted) and polls `lazyweb_get_mockup` for
  you. Do NOT call `lazyweb_generate_mockup` (times out) and do NOT hand-pass
  `image_base64`. Run the 4 in parallel (background them):
  ```
  python "$SKILL_DIR/optimize_paywall.py" mockup \
    --image "$WORK/references/current-state.png" \
    --prompt "<ENFORCED PREAMBLE + winner.mockup_prompt>" \
    --out "$WORK/mock-<slot>.json" &
  ```
  Each prints `{ image_url }` (a signed URL) — use that as the winner's mockup,
  NOT base64 (four base64 mockups overflow the gateway request-size limit; the
  renderer fetches the URL server-side).
- **Fallback** — only if a mockup truly can't be generated
  (`MOCKUP_IMAGE_KEY_MISSING` / `MOCKUP_DAILY_LIMIT`, an `error` status, or still
  `pending` after ~180s): omit that one slot's key from the `mockups` map. The
  server renders a "(no mockup)" placeholder for it; the rest of the report is
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

## Step 4 — Render + host the report

Call **`lazyweb_render_report`** with `report_skill="optimize-paywall"` and:

```json
{
  "synthesis_id": "<from lazyweb_get_paywall_synthesize>",
  "target_image": "data:image/png;base64,…   (the current paywall screenshot)",
  "mockups": { "safe_bet":"<image_url>", "high_value_bet":"…", "bold_swing":"…", "contrarian":"…" },
  "product": "<the product name, e.g. Reddit>"
}
```

Notes:
- `synthesis_id` is the ONLY source of the frictions, hypotheses, evidence,
  prioritization, and momentum — the server reloads the stored synthesis and
  renders it. You do not pass `recommendations`/`frictions`/`experiments`/
  `user_labels`; they live in the synthesis.
- `mockups` is keyed by each winner's `slot`; each value is the **`image_url`**
  from `lazyweb_get_mockup`. Omit a slot only if its mockup couldn't be generated.
- `target_image` is the current screenshot as a base64 `data:` URI (one image is
  fine through the gateway).
- Pass a stable `idempotency_key` (e.g. `"optimize-paywall/{topic}-{date}"`) so a
  re-render dedupes to the same URL.
- On a `400` with `code:"render_field_missing"`, the `detail` names the bad field
  (e.g. `synthesis_id`) — fix it and retry ONCE. If the synthesis expired, re-run
  Step 2.

The response `{ ok, id, url }` carries the hosted report URL. **That URL is the
deliverable.**

## After rendering

1. Give the user the report URL.
2. Summarize the 4 winners: one line per slot (Safe bet / High-value bet / Bold
   swing / Contrarian), naming each winner's `hypothesis_title` and its
   `evidence_company` (when present).
3. Suggest next steps: implement a winner, or ask `/lazyweb-ab-test-research` to
   mine the experiment corpus deeper.

## Operating principles

- **The server owns the thinking.** Frictions, hypotheses, evidence binding,
  scoring, momentum, and look all come from the internal pipeline via
  `synthesize`. Do not second-guess, re-implement, or supplement them by
  hand-writing report_data — that's exactly what made earlier versions worse.
- **Synthesis is slow by design** (~60-150s, several LLM calls). That latency is
  the internal pipeline doing real work; poll patiently, don't time out early.
- **Don't fabricate a fallback report.** If `synthesize` errors, surface the
  error — never hand-assemble a substitute report, which would not match the
  internal output.
