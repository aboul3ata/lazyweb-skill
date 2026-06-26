---
name: lazyweb-design
route: "Optimize, improve, or design any product screen — routes on objective"
router-terms: paywall, pricing page, landing page, signup screen, onboarding, dashboard, optimize paywall, improve design, critique screen, redesign screen, conversion rate, paid conversion, trial start, annual plan, upgrade screen, design a new screen, new paywall from scratch, design from scratch, create a screen, no design yet
description: |
  Optimize, improve, or design any product screen — routes on objective. The
  user-facing umbrella for product-screen work, mobile or web (paywall, pricing,
  landing, signup, onboarding, dashboard, settings, …). Pick the `objective`
  INTENT-FIRST, not by whether an image exists: `optimize` (move a conversion
  metric on an EXISTING screen) and `improve` (raise design quality of an
  EXISTING screen) both require a screenshot — captured on the user's behalf;
  `create` (a NEW screen from scratch) routes to the internal
  lazyweb-design-create backend. For optimize, the server runs the
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

This skill handles **any product screen**, not
just paywalls. Classify the **user's intent FIRST**, then act — never pick by
whether an image happens to be available:

| `objective` | User intent | What happens |
|---|---|---|
| **optimize** (default) | Move a **metric** (conversion) on an **existing** screen | Run the flow below (Steps 1–3): capture → `lazyweb_generate_report` → poll. **Screenshot required.** |
| **improve** | Make an **existing** screen better per a **stated intent** (not a metric) | Same flow, intent-driven framing. **Screenshot + `intent="<what to improve>"` required.** |
| **create** | Design a **new** screen **from scratch** (none exists) | **Redirect to `lazyweb-design-create`** (the internal greenfield backend). Does NOT use `lazyweb_generate_report`. No screenshot. |

**Grounding is enforced by the intent; it does not select it.** For `optimize`/
`improve` you MUST have a screenshot of the current screen — get it in this order:

1. **Capture it yourself** on the user's behalf (dev-server / preview / browser
   tools). This is the default, not a fallback.
2. **Ask the user to upload** one only if you cannot capture it.
3. **Stop with a clear reason** if neither works — tell the user *what's needed*
   (a screenshot of the screen, or switch to `create` to start from scratch).
   Never run an ungrounded optimize/improve, and never silently fall back to
   `create` just because no image was supplied.

**For `objective=create`:** do NOT run Steps 1–3 and do NOT call
`lazyweb_generate_report`. Hand off to the internal
greenfield backend (`lazyweb-design-create`; needs no current screen) by
**fetching it over MCP**: `lazyweb_get_workflows { operation:"fetch", workflow:"lazyweb-design-create" }`. It is intentionally not installed as a
local slash command, so always fetch it — do not rely on a local
`lazyweb-design-create` skill being present. Pass the screen_type, the
conversion goal, and any brand/design-system context you have. The helper
(`--objective create`) and the MCP (`objective:"create"`) also return this
redirect as a backstop. `create` is the value name on the wire.

The rest of this skill is the **optimize / improve** pipeline.

## CRITICAL: how this skill works (read first)

**The entire report is generated server-side in ONE call.** You do NOT diagnose
frictions, draft hypotheses, pick evidence, synthesize, generate mockups, assemble
`report_data`, or render the report. All of that — labelling the screen, retrieving
structural-twin experiments, diagnosing frictions, synthesizing the slot-diverse
portfolio with mechanism-bound evidence, generating one mockup per winner, the
dark "Hallow" report rendering, and hosting — runs **server-side** inside
`lazyweb_generate_report`, reusing the internal paywall pipeline so the output is
identical to the internal product. The model that writes the hypotheses is the
internal model, not you.

**The ONLY thing you must do is capture the screenshot** — that's irreducibly
client-side (you have the dev-server / preview / browser access; the server does
not). Everything after that is a single async call plus a poll. **Your job:**

1. **Ground** the target screen — capture a real screenshot on the user's behalf
   and resolve it to an `image_url` (presign upload) or `image_base64`. This is the
   only client-side step.
2. **Generate** — call `lazyweb_generate_report({ image_url (or
   image_base64+mime_type), objective, product, conversion_goal, intent (improve),
   platform, screen_type, product_brief, skill, version })`. It returns
   `{ job_id, status:"pending", poll_with:"lazyweb_get_report", eta_seconds }`. The
   SERVER then runs the WHOLE pipeline (label → retrieve → diagnose → synthesize →
   generate mockups → render → host).
3. **Poll** — `lazyweb_get_report({ job_id, skill, version })` every ~10s until
   `status:"done"` (~3-4 min). Result `{ id, url, degraded, failures }`. Give the
   user the `url` — **that hosted report URL is the deliverable.**

Do NOT hand-write frictions, candidate hypotheses, `evidence_ref`s,
`experiment_verdicts`, `user_labels`, or the report HTML/CSS — the server owns all
of it. **`lazyweb_generate_report` is the ONLY supported call on this path** — it runs
labelling, retrieval, diagnosis, synthesis, mockup generation, rendering, and hosting
server-side. Do NOT try to run synthesis, mockup generation, or rendering yourself.
After you get the URL, give it to the user (and mention any degraded slot from
`failures`).

The work dir convention is `$WORK = .lazyweb/lazyweb-design/{topic-slug}-{YYYY-MM-DD}`;
save the current screenshot under `$WORK/references/`.

## Lazyweb MCP Setup

Use hosted Lazyweb MCP tools at `https://www.lazyweb.com/mcp`. First list the
tools and run `lazyweb_health`. Required tools:

- `lazyweb_health` — verify connectivity.
- `lazyweb_request_image_upload` + `lazyweb_resolve_image_upload` — **the image
  input path (presigned upload over MCP auth).** `request` mints a short-TTL
  presigned PUT; you `curl` the file straight to storage with NO Lazyweb
  credential; `resolve` returns a stable `image_url` you pass to
  `lazyweb_generate_report`. Authed by the existing MCP session, so it works for
  OAuth connector *and* static-token connections. See Step 1.
- `lazyweb_generate_report` + `lazyweb_get_report` — **THE core call (async,
  one-shot).** `generate_report` kicks off the ENTIRE server-side pipeline from the
  screenshot (label → retrieve twins → diagnose frictions → synthesize the
  slot-diverse portfolio with mechanism-bound evidence → generate one mockup per
  winner → render + host the dark report) and returns `{ job_id,
  status:"pending", poll_with:"lazyweb_get_report", eta_seconds }`. Poll
  `lazyweb_get_report({ job_id })` until `status:"done"` (~3-4 min). Result:
  `{ id, url, degraded, failures }` — `url` is the hosted deliverable. The agent
  does NOT synthesize, generate mockups, assemble `report_data`, or render. See
  Steps 2–3.

**Pass `skill: "lazyweb-design"` and `version: "<x.y.z>"` on every call**
(`lazyweb_generate_report`, `lazyweb_get_report`, image-upload, health — read
`~/.lazyweb/VERSION`, fall back `"0.0.0"`). Optional analytics; never drop a real arg.

If the **MCP itself** is missing or its auth fails (e.g. `lazyweb_health` errors),
tell the user to run `curl -fsSL https://www.lazyweb.com/install.sh | bash`,
reload, and rerun. If instead a tool is refused as **OUT OF DATE** (the result has
`code: "skill_deprecated"` / `action_required: "upgrade"` / `do_not_fallback: true`,
or says your skill pack is below the required version), that is a **HARD STOP**: do
NOT proceed in a degraded, web-only, or fabricated-report mode — STOP and have the
user run `/lazyweb-update` (or the install command above), reload, and retry.
With the presign upload flow (Step 1), image input is
authenticated by the **MCP session itself** — if the MCP is healthy, upload works,
by construction. You can also pass the screenshot directly as `image_base64` +
`mime_type` to `lazyweb_generate_report` if you skip the upload.

## Step 1 — Ground the target screen (the only client-side step)

1. Capture or read the target screen. Prefer a real screenshot or URL over prose.
   Save it to `$WORK/references/current-state.png` — it becomes the "Current"
   column and the input to the server pipeline. **Keep the file path.** This is the
   one thing only the agent can do; everything after Step 2 happens server-side.

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
   d. Pass that `image_url` to `lazyweb_generate_report` in Step 2. (Or skip a–c and
      pass `image_base64` + `mime_type` directly to `lazyweb_generate_report`.)

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
   and grounds every friction + hypothesis in it. Pass it as `product_brief` to
   `lazyweb_generate_report` (Step 2). Skipping it is the difference between
   fable-grade and generic output.
3. **Detect platform + screen_type** from the screenshot (routes the evidence):
   - `platform`: `mobile` (tall portrait phone screenshot) or `web` (wide
     desktop/browser page).
   - `screen_type`: the screen archetype. Monetization screens — `paywall`
     (in-app subscription offer) · `pricing` (web plans page) · `landing`
     (marketing homepage/hero) · `signup` (account-creation / lead-capture) —
     carry A/B-tested evidence. **Any other product screen is also supported**:
     `onboarding` · `checkout` · `cancellation` · `settings` · `home_feed` ·
     `profile` · `browse_search` (and anything else → `out_of_vocab`). The server
     re-infers the type from the screenshot and scopes like-screen evidence
     accordingly, so pass your best guess and don't stop — the engine never
     declines a real product UI screen. Only stop if the image isn't a product
     screen at all (e.g. a logo, a chart, a photo).
   Mobile paywalls behave exactly as before (`platform:"mobile"`,
   `screen_type:"paywall"`); pass both to `lazyweb_generate_report` in Step 2. For
   `web`, evidence is single-snapshot **learnings** (observed patterns, not
   A/B-tested), so the report frames hypotheses as "worth testing," not measured
   lifts.

## Step 2 — Generate the report (ONE call; the server does everything)

Call **`lazyweb_generate_report`** with the resolved `image_url` (or `image_base64`
+ `mime_type`) and the routing context. This single call runs the ENTIRE pipeline
server-side — label → retrieve structural twins → diagnose frictions → synthesize
the slot-diverse portfolio with mechanism-bound evidence → generate one mockup per
winner → render the dark report → host it. **You do not synthesize, generate
mockups, assemble `report_data`, or render.**

```
lazyweb_generate_report({
  image_url: "<image_url from Step 1 resolve_image_upload>",   // OR image_base64 + mime_type
  objective: "optimize",                 // optimize | improve  (create does NOT use this tool)
  intent: "<what to improve>",           // REQUIRED for objective:"improve" (no metric goal)
  product: "<product/company name; excluded from corpus so it isn't benchmarked vs itself>",
  conversion_goal: "<e.g. annual-plan share / trial starts>",
  platform: "<mobile|web>",
  screen_type: "<paywall|pricing|landing|signup|onboarding|settings|…>",
  product_brief: "<who the user is; free vs paid + why upgrade; where this sits in the flow; the wedge>",
  skill: "lazyweb-design",
  version: "<x.y.z>"
})
```

It returns immediately with `{ job_id, status:"pending",
poll_with:"lazyweb_get_report", eta_seconds }`. Keep the `job_id` for Step 3.

If the call is refused as **OUT OF DATE** (`code:"skill_deprecated"` /
`do_not_fallback:true`), that is a **HARD STOP** — see the gate handling above; do
NOT hand-assemble a report. On a bad image or a server error, surface it and stop;
never fabricate a substitute report.

## Step 3 — Poll for the hosted report

Poll **`lazyweb_get_report({ job_id, skill:"lazyweb-design", version:"<x.y.z>" })`**
every ~10s until `status:"done"` (typically ~3-4 min — the server is labelling,
retrieving, diagnosing, synthesizing, generating 4 mockups, and rendering). Be
patient; that latency is the internal pipeline doing real work — don't time out
early.

The done result is `{ id, url, degraded, failures }`:
- `url` — the hosted report. **That URL is the deliverable** — give it to the user.
- `degraded` / `failures` — if `degraded` is true, the server rendered a "(no
  mockup)" placeholder for any slot whose mockup couldn't be generated; mention any
  such slot named in `failures`. The rest of the report is unaffected.

## After the report is done

1. Give the user the report URL.
2. If `degraded`, note which slot(s) shipped without a mockup (from `failures`).
3. Suggest next steps: implement a recommendation, or ask `/lazyweb-ab-test-research`
   to mine the experiment corpus deeper.

## Operating principles

- **The server owns the thinking — and now the whole pipeline.** Frictions,
  hypotheses, evidence binding, scoring, momentum, mockups, and the report look all
  come from the internal pipeline via `lazyweb_generate_report`. Do not second-guess,
  re-implement, or supplement them by hand-orchestrating synthesize → mockups →
  render — that's exactly what made earlier versions worse.
- **Generation is slow by design** (~3-4 min, many LLM + image calls). Poll
  patiently, don't time out early.
- **Don't fabricate a fallback report.** If `lazyweb_generate_report` /
  `lazyweb_get_report` errors, surface the error — never hand-assemble a substitute
  report, which would not match the internal output.
