---
name: lazyweb-optimize-paywall
route: "Optimize, improve, or design a product screen"
router-terms: paywall, pricing page, landing page, signup screen, onboarding, dashboard, optimize paywall, improve design, critique screen, redesign screen, conversion rate, paid conversion, trial start, annual plan, upgrade screen, design a new screen, new paywall from scratch, design from scratch, create a screen, no design yet
description: |
  Optimize, improve, or design any product screen — mobile or web (paywall,
  pricing, landing, signup, onboarding, dashboard, settings, …; "paywall" in the
  name is legacy). Pick the `objective` INTENT-FIRST, not by whether an image
  exists: `optimize` (move a conversion metric on an EXISTING screen) and
  `improve` (raise design quality of an EXISTING screen) both require a
  screenshot — captured on the user's behalf; `create` (a NEW screen from
  scratch) routes to deep-design-research. For optimize, the server runs the
  internal pipeline — labels the screen, retrieves structural experiment twins,
  diagnoses frictions, synthesizes a slot-diverse portfolio of falsifiable
  hypotheses bound to real A/B experiments — then renders the dark report; the
  skill captures the screen, generates one mockup per winner, and hosts it. Use
  when the user wants to redesign, improve, critique, optimize, or design a
  product screen for conversion or quality.
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

## Objectives — pick INTENT-FIRST (read first)

This skill (legacy name `optimize-paywall`) handles **any product screen**, not
just paywalls. Classify the **user's intent FIRST**, then act — never pick by
whether an image happens to be available:

| `objective` | User intent | What happens |
|---|---|---|
| **optimize** (default) | Move a **metric** (conversion) on an **existing** screen | Run the pipeline below (Steps 1–4). **Screenshot required.** |
| **improve** | Make an **existing** screen better per a **stated intent** (not a metric) | Same pipeline, intent-driven framing. **Screenshot + `--intent "<what to improve>"` required.** |
| **create** | Design a **new** screen **from scratch** (none exists) | **Redirect to `lazyweb-deep-design-research`** (greenfield). No screenshot. |

**Grounding is enforced by the intent; it does not select it.** For `optimize`/
`improve` you MUST have a screenshot of the current screen — get it in this order:

1. **Capture it yourself** on the user's behalf (dev-server / preview / browser
   tools). This is the default, not a fallback.
2. **Ask the user to upload** one only if you cannot capture it.
3. **Stop with a clear reason** if neither works — tell the user *what's needed*
   (a screenshot of the screen, or switch to `create` to start from scratch).
   Never run an ungrounded optimize/improve, and never silently fall back to
   `create` just because no image was supplied.

**For `objective=create`:** do NOT run Steps 1–4. Hand off to
`lazyweb-deep-design-research` (its greenfield branch needs no current screen) —
fetch it via `lazyweb_get_workflows { operation:"fetch", workflow:"lazyweb-deep-design-research" }`
or invoke the `/lazyweb-deep-design-research` skill — passing the screen_type, the
conversion goal, and any brand/design-system context you have. The helper
(`--objective create`) and the MCP (`objective:"create"`) also return this
redirect as a backstop. `create` is the value name on the wire.

The rest of this skill is the **optimize / improve** pipeline.

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
- `lazyweb_request_image_upload` + `lazyweb_resolve_image_upload` — **the image
  input path (presigned upload over MCP auth).** `request` mints a short-TTL
  presigned PUT; you `curl` the file straight to storage with NO Lazyweb
  credential; `resolve` returns a stable `image_url` you pass to synthesize /
  start_mockup. Authed by the existing MCP session, so it works for OAuth
  connector *and* static-token connections. See Step 1.
- `lazyweb_start_paywall_synthesize` + `lazyweb_get_paywall_synthesize` — **THE
  core call (async).** Start runs the full internal generation pipeline from the
  screenshot (label → retrieve twins → diagnose frictions → synthesize the
  slot-diverse portfolio with mechanism-bound evidence → stack-rank top-1 per
  slot). Poll get until `done`. Result: `{ synthesis_id, winners:[{slot,
  hypothesis_title, mockup_prompt, change_scope, evidence_company}] }`. Pass the
  current screen as `image_url` (from `resolve_image_upload`).
- `lazyweb_start_mockup` + `lazyweb_get_mockup` — async paywall mockup generation
  (the sync `lazyweb_generate_mockup` times out through the gateway; use the pair).
- `lazyweb_render_report` — server-renders + hosts the report (pass
  `report_skill="optimize-paywall"` and `report_data.synthesis_id`).

**Pass `skill: "optimize-paywall"` and `version: "<x.y.z>"` on every call** (read
`~/.lazyweb/VERSION`, fall back `"0.0.0"`). Optional analytics; never drop a real arg.

If the **MCP itself** is missing or its auth fails (e.g. `lazyweb_health` errors),
tell the user to run `curl -fsSL https://www.lazyweb.com/install.sh | bash`,
reload, and rerun. With the presign upload flow (Step 1), image input is
authenticated by the **MCP session itself** — if the MCP is healthy, upload works,
by construction. The legacy helper-script token (`~/.lazyweb/lazyweb_mcp_token`) is
no longer on the image-input path; it only matters for the optional token-script
fallback (see Step 2).

## Step 1 — Ground the paywall

1. Capture or read the target paywall. Prefer a real screenshot or URL over prose.
   Save it to `$WORK/references/current-state.png` — it becomes the "Current"
   column and the input to synthesis. **Keep the file path.**

   **Upload it via the presign flow → get a stable `image_url`** (the primary
   image-input path; the bytes never pass through your output). The reason the
   bytes can't go inline is **size, not just corruption**: a full-resolution
   screenshot is hundreds of KB to several MB of base64 — far too large for an
   agent to emit reliably as a tool argument, and big inline blobs can 502 the
   gateway. The presign flow moves the bytes out-of-band over `curl`, authed by
   your existing MCP session (no `~/.lazyweb` token needed). Spec:
   [`specs/image-upload-architecture.md`](../../specs/image-upload-architecture.md).

   ```bash
   IMG="$WORK/references/current-state.png"
   # mime: image/png | image/jpeg | image/webp (match the file)
   MIME="image/png"
   ```
   **First, confirm the upload tools exist.** If `lazyweb_request_image_upload` /
   `lazyweb_resolve_image_upload` are NOT in your available tools, your client is on a
   tool list cached from before they shipped (common for an already-connected MCP/OAuth
   connector — the server serves the tools fresh, but a plain app restart doesn't
   refresh the connector's manifest). Do NOT limp through with inline base64 or a
   hard-shrunk image. **STOP and tell the user, verbatim intent:** "The image-upload
   tools aren't in your client yet. Reconnect the Lazyweb connector (your client's
   connector settings → Lazyweb → disconnect + reconnect) and run `lazyweb-update`,
   then rerun — they shipped recently and your client cached the old tool list (a new
   chat/restart alone may not refresh it)." This is the correct outcome — a clear,
   actionable stop, not a degraded report.
   a. `lazyweb_request_image_upload({ mime_type: "<MIME>" })` → `{ upload_url, key }`.
   b. PUT the bytes with **NO credentials** (the presigned URL is the auth):
      ```bash
      curl -fsS -X PUT -H "content-type: $MIME" --data-binary @"$IMG" "<upload_url>"
      ```
   c. `lazyweb_resolve_image_upload({ key: "<key>" })` → `{ image_url }`.
   d. Use that `image_url` as the current screen for synthesis (Step 2) and as the
      EDIT base for each mockup (Step 3). One upload feeds all of them.

   `$SKILL_DIR` below = the directory holding this SKILL.md (where
   `optimize_paywall.py` ships). The helper now accepts `--image-url "<image_url>"`
   so it can reuse the already-uploaded screenshot instead of re-reading the file.
   (Already have a hosted screenshot URL? Skip a–c and pass it straight through.)
2. **Author a short product brief — the single highest-signal input.** This is what
   makes the diagnosis specific to THIS product instead of generic corpus advice. In
   ~3–6 sentences cover: **who the user is** and why they're on this screen; **where
   it sits in the flow** (what came before, what's after); the **free vs paid
   boundary** — what paying actually unlocks vs the free tier, and why someone
   upgrades; and the product's **wedge vs alternatives**. Use what the user told you
   plus what you know about the product; ask ONE concise question only if the
   product, conversion goal, or the free-vs-paid story is missing and you can't infer
   it. You do NOT need to analyze the *screenshot* — the server labels the pixels —
   but you DO provide this product knowledge: the server treats it as **authoritative**
   and grounds every friction + hypothesis in it. Pass it via `--product-brief`
   (inline, or `@path/to/brief.md`). Skipping it is the difference between fable-grade
   and generic output.
3. **Detect platform + screen_type** from the screenshot (routes the evidence):
   - `platform`: `mobile` (tall portrait phone screenshot) or `web` (wide
     desktop/browser page).
   - `screen_type`: `paywall` (in-app subscription offer) · `pricing` (web
     plans/pricing page) · `landing` (marketing homepage/hero) · `signup`
     (account-creation / lead-capture). If it's none of these, tell the user this
     skill optimizes paywall/pricing/landing/signup and stop.
   Mobile paywalls behave exactly as before (`--platform mobile`,
   `--screen-type paywall`); pass both to the helper in Step 2. For `web`, evidence
   is single-snapshot **learnings** (observed patterns, not A/B-tested), so the
   report frames hypotheses as "worth testing," not measured lifts.

## Step 2 — Synthesize (the server does the thinking)

Now that the screen is a short `image_url` (not bytes), there are **two equivalent
ways** to run synthesis; pick by what's available:

- **Direct MCP (cleanest, no token, no script).** Call
  `lazyweb_start_paywall_synthesize({ image_url, platform, screen_type, product,
  conversion_goal, plan_structure, product_brief, objective, … })` from your own
  authenticated MCP session, then poll `lazyweb_get_paywall_synthesize({ job_id })`
  until `done`. Nothing here needs `~/.lazyweb` — the `image_url` is already public
  and your MCP session is the auth.
- **Helper script (convenience for the polling loop).** `optimize_paywall.py`
  forwards your `--image-url` to the same tool and does the poll for you. Note the
  script opens its *own* MCP connection, so it still needs a bearer token for *that
  connection* (independent of the image); if you have no token, use the direct-MCP
  path above.

**Helper invocation** — pass the **`image_url` from Step 1** (the bytes already
live in storage from the presign upload, so they never touch your output or the
gateway):

```
python "$SKILL_DIR/optimize_paywall.py" synthesize \
  --image-url "<image_url from Step 1 resolve_image_upload>" \
  --product "<product/company name; excluded from corpus so it isn't benchmarked vs itself>" \
  --conversion-goal "<e.g. annual-plan share / trial starts>" \
  --plan-structure "<e.g. monthly $6.99 / annual $59.99>" \
  --product-brief "<who the user is; free vs paid + why upgrade; where this sits in the flow; the wedge>" \
  --platform <mobile|web> --screen-type <paywall|pricing|landing|signup> \
  [--objective optimize|improve] [--intent "<what to improve>"]   # default optimize; improve REQUIRES --intent (no metric goal); a NEW screen from scratch uses create (see Objectives) \
  [--category <cat>] [--constraints "<...>"] [--divergence auto|low|med|high] \
  --out "$WORK/synthesis.json"
```

It prints (and writes to `--out`) `{ synthesis_id, winners:[{slot,
hypothesis_title, change_scope, evidence_company, mockup_prompt}] }`.
`synthesis_id` goes to render; each of the 4 `winners` carries a ready
`mockup_prompt`. With `--image-url` the helper passes the URL straight through to
`lazyweb_start_paywall_synthesize` over your MCP session — **no `~/.lazyweb` token
is involved** in the image-input path.

The script exits non-zero with a clear message on a bad image-url or a server
`status:"error"` — surface those and stop (don't hand-write a report).

### Image input — presign is the primary path (token-upload is legacy)

Image input runs through the **Step 1 presign flow**
(`request_image_upload` → `curl` PUT → `resolve_image_upload` → `image_url`),
authenticated by your existing MCP session. Because that auth rides the MCP
session, **the old missing-token problem effectively goes away for upload**: it
works identically for OAuth-connector users (who never had a token file) and
static-token users. There is no degraded-report branch and no inline-base64
fallback to manage — just pass the resolved `image_url`. Spec:
[`specs/image-upload-architecture.md`](../../specs/image-upload-architecture.md).

**Fallback (legacy, optional).** The helper still supports `--image <file>`, which
base64-encodes the screenshot **in code** and POSTs it to lazybackend using a
static bearer token (`LAZYWEB_MCP_TOKEN` or `~/.lazyweb/lazyweb_mcp_token`; set
`SSL_CERT_FILE` if your Python has no CA bundle). Use it only if presign is
unavailable. If you go this route and the token is missing (e.g. an OAuth-connector
machine that never ran `install.sh`), don't limp through with a hard-shrunk inline
image — prefer the presign flow above, or STOP and tell the user plainly: *"Run
`curl -fsSL https://www.lazyweb.com/install.sh | bash` to provision the token, or
just use the presign upload."*

## Step 3 — Generate one mockup per winner (async)

For EACH of the 4 winners, generate a mockup that is an EDIT of the CURRENT
screenshot (keeps the real brand/layout/dimensions), conditioned on the winner's
`mockup_prompt` prefixed with the **ENFORCED PREAMBLE** below.

- **If you ARE Codex** → use built-in `image_gen` (gpt-image-2) with the current
  screenshot as the reference image.
- **Otherwise (Claude Code, etc.)** → run the helper script once per winner — pass
  the **`image_url` from Step 1** as the EDIT base (`--image-url`, `size` omitted so
  the mockup matches the input aspect ratio) and it polls `lazyweb_get_mockup` for
  you. Do NOT call `lazyweb_generate_mockup` (times out) and do NOT hand-pass
  `image_base64`. Run the 4 in parallel (background them):
  ```
  python "$SKILL_DIR/optimize_paywall.py" mockup \
    --image-url "<image_url from Step 1 resolve_image_upload>" \
    --prompt "<ENFORCED PREAMBLE + winner.mockup_prompt>" \
    --out "$WORK/mock-<slot>.json" &
  ```
  Each prints `{ image_url }` (a signed URL) — use that as the winner's mockup,
  NOT base64 (four base64 mockups overflow the gateway request-size limit; the
  renderer fetches the URL server-side).
- **Fallback** — if a mockup truly can't be generated
  (`MOCKUP_IMAGE_KEY_MISSING` / `MOCKUP_DAILY_LIMIT`, an `error` status, or still
  `pending` after ~180s): omit that one slot's key from the `mockups` map. The
  server renders a "(no mockup)" placeholder for it; the rest of the report is
  unaffected. Never block the whole report on one missing mockup; never use ASCII
  art. A mix (3 real + 1 placeholder) is fine.
- **Image base** — use the Step 1 `image_url` as the EDIT base (same upload that
  fed synthesis). Do NOT hand-emit an `image_base64` EDIT base for
  `lazyweb_start_mockup` — a usable mockup base far exceeds the ~5K-char emit limit
  and would corrupt the same way synthesize does. With the presign flow there's no
  missing-token stop here; if presign is genuinely unavailable, see Step 2's legacy
  fallback.

### ENFORCED PREAMBLE — prepend to every winner's `mockup_prompt`

The opening noun and constraint (2) carry `[mobile]` / `[web]` tagged wording —
**keep the clause matching the `platform` you detected in Step 1 and delete the
other tag's text** (e.g. on `web`, keep the `[web]` wording and drop the `[mobile]`
wording). Everything else is identical for both platforms.

> ENFORCED CONSTRAINTS — the output is a redesigned mockup of the baseline screen —
> [mobile] a mobile app paywall · [web] a web pricing/landing/signup page — based on
> the baseline image. (1) EXACT VISUAL STYLE PRESERVATION: match the baseline's
> background color, brand palette, typography (family/weight/size hierarchy),
> border-radius, icon/illustration style, and overall feel — it must look like
> the same product. (2) DIMENSION + ASPECT PRESERVATION: keep the baseline's
> aspect ratio and outer framing in the same proportions, adding no new outer
> margins — [mobile] preserve the status-bar / safe-area insets; [web] keep the top
> navigation bar flush to the top edge and preserve the full page width / browser
> chrome. (3) PRIMARY CTA PROMINENCE LOCK: the dominant purchase/subscribe button stays
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
  fine through the gateway). Migrating this render-asset input off base64 to the
  presigned `image_url` is **Phase 2** (out of scope here) — keep the `data:` URI
  for now. You already have the bytes locally at `$WORK/references/current-state.png`.
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
