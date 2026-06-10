---
name: lazyweb-signup-optimization
description: |
  Optimize a sign-up / registration screen by reading the target screen,
  diagnosing signup friction, and producing 2-4 falsifiable redesign
  hypotheses backed by Lazyweb sign-up references, experiment evidence,
  conventions, and divergent design moves. Use when the user wants to
  redesign, improve, critique, or optimize a sign-up screen for signup
  completion rate (account creation, email capture, onboarding entry).
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

# Sign-up Optimization

Optimize a sign-up screen with evidence-backed completion hypotheses, not
generic form advice.

## CRITICAL: Output Behavior

This skill produces a hosted HTML report via the `signup_design_run`
background worker — NOT a local file. The worker handles rendering,
mockup generation (paid), or locked-mode lockdown (free) on the server
side; this skill is the agent-side glue that kicks the run off, polls,
and surfaces the result.

For Pro users: the report has 3-4 hypothesis cards with AI-generated
mockups of the user's sign-up screen modified per the hypothesis, plus
real A/B experiment evidence and Lazyweb references.

For free users: same report structure, but the mockup imagery is
ghosted-real (pre-blurred server-side — original pixels unrecoverable)
with `Unlock this variant` / `Unlock this A/B test evidence` captions
and `Get access` buttons linking to `lazyweb.com/monetization` with
per-skill UTM attribution. The user's own sign-up screen stays visible
unblurred at the top.

## When to Use This

- User wants to improve, redesign, optimize, critique, or evaluate a
  sign-up / registration / account-creation screen
- User has a sign-up screenshot, URL, product brief, or current copy
- User asks how to increase signup completion rate, email capture, or
  onboarding entry
- User asks for concrete signup-screen redesign hypotheses

## When NOT to Use This

- User is asking about a paywall (post-signup, paid conversion) →
  `lazyweb-paywall-optimization`
- User wants just CTA button copy on a sign-up screen → still use this
  skill if the question is whole-screen optimization; route to
  `lazyweb-paywall-cta` is wrong (CTA skill is paywall-specific)
- User wants only A/B test examples on signup → `lazyweb-ab-test-research`
- User wants generic form best practices outside an app sign-up screen
  → `lazyweb-design-research`

## Lazyweb MCP Setup

Use hosted Lazyweb MCP tools at `https://www.lazyweb.com/mcp` for
database-backed evidence + the run pipeline. First list available tools
and run `lazyweb_health`.

Required public tools:
- `lazyweb_health` — verify Lazyweb MCP connectivity
- `signup_design_run` — kick off the full pipeline (paid or free); returns
  `run_id` + initial `status='queued'`. Takes `image_b64` + `context`
  (product, plan, conversion_goal, etc.). For iteration, also takes
  `parent_run_id` + sparse `feedback` (Pro-only — free users 402 on
  iteration with `feature=signup_design_iteration`)
- `signup_design_check_status` — poll with `run_id`; returns `status`,
  `tier`, and (when complete) `report_url` + `recommendations`
- `lazyweb_search` — find sign-up references and convention examples
- `lazyweb_compare_image` — find visually similar sign-up screens when the
  target image is available
- `lazyweb_ab_test_research` — paid; broader A/B evidence (signup
  experiments, lifecycle, activation)

**Pass `skill: "signup-optimization"` on every call.** Include `"skill": "signup-optimization"` in the arguments of each `lazyweb_*` tool call — for example `{"query": "pricing page", "limit": 30, "skill": "signup-optimization"}`. This is optional analytics metadata Lazyweb uses to understand which skills are used; never drop or change a real argument for it.

If Lazyweb MCP is not installed or auth fails, tell the user: "Lazyweb MCP
is not installed. Run `curl -fsSL https://www.lazyweb.com/install.sh | bash`,
reload this client, then rerun this skill."

### Free vs Pro behavior on the run tool

`signup_design_run` ALWAYS queues the run successfully on fresh runs (no
`parent_run_id`). The response carries `tier: 'pro'` or `tier: 'free'`.

- **`tier: 'pro'`** — full pipeline runs in ~60-120s. The report has real
  gpt-image-2 mockups for each hypothesis + real A/B evidence.
- **`tier: 'free'`** — pipeline still runs but skips mockup gen (~30-60s
  faster, $0.15-0.20 cheaper for us per run). The worker post-processes
  the HTML through the lockdown pass before upload, so the stored
  `report_url` serves the locked variant. Original paid imagery never
  reaches the free client.

**Iteration** (`parent_run_id` set) is Pro-only. Free callers iterating
get HTTP 402 with `feature: 'signup_design_iteration'`. Tell the user
they can iterate after upgrading; the locked v1 report from their fresh
run carries the same upgrade CTAs.

DO NOT abort the skill on `tier: 'free'`. The locked report is the
intended free-tier output — it's specifically designed to convert.
Surface the `report_url` to the user; click attribution carries
`utm_source=lazyweb-signup-design`, `utm_campaign=free-to-pro`.

## Ground the Sign-up Screen

Before kicking off the run, establish the target:

1. Run `lazyweb-context-detect` when available to infer project, platform,
   stack.
2. Capture or read the target sign-up screen. Prefer an actual screenshot
   or URL over prose. If the target is a local app, capture the current
   screen. If remote, use the provided image or URL.
3. Ask one concise question only when the product, platform, signup goal,
   or target screen is missing and cannot be inferred.

Read the sign-up screen first. Identify:
- **Components present**: logo / hero / value props / form fields / social
  auth / primary CTA / secondary action / legal / login link / trust
  signals
- **Form mechanics**: email-only vs email+password vs social-first vs
  passwordless / magic link / phone / SSO; required field count;
  single-step vs multi-step
- **Strategic moves**: value-prop framing, trust signals, social proof,
  reduce-friction patterns (Google one-tap, Apple sign-in), progressive
  profiling
- **User state**: cold (landing page → signup) vs warm (in-app gate)
  vs returning (re-entry) vs invited (referral, magic link)

## Run the Pipeline

```
signup_design_run({
  image_b64: <user's sign-up screenshot, base64>,
  context: {
    product: "...",
    product_canonical_name: "...",
    category: "...",
    conversion_goal: "signup completion rate" | "email capture rate" | ...,
    constraints: "...",     // brand colors must stay, no phone field, etc.
    design_problem: "..."   // optional — what you think the friction is
  }
})
→ { run_id, status: 'queued', tier: 'pro' | 'free' }
```

Tell the user one short line ("Working on it — takes about a minute") and
call `signup_design_check_status` with the `run_id` on your next turn.

```
signup_design_check_status({ run_id })
→ { status: 'queued' | 'running' | 'complete' | 'failed',
    tier: 'pro' | 'free',
    report_url: <signed URL when complete>,
    recommendations: [...]                // each: hypothesis_title, hypothesis,
                                          //   mockup_file (storage key)
}
```

Loop until `status === 'complete'`. Surface the `report_url` as a clickable
link, speak the top picks (hypothesis_title + one-line why), and tell the
user where to find the full report.

### Iteration

When the user reacts to a report you have shared (e.g., "kill #2", "make
them bolder", "the first one is great but the rest feel safe"), call
`signup_design_run` AGAIN with `parent_run_id` = the prior `run_id` from
your tool history + a sparse `feedback` object:

```
signup_design_run({
  parent_run_id: <prior run_id>,
  feedback: {
    global_direction_notes: "make them bolder",   // optional cross-cutting
    hypothesis_feedback: [
      { prior_hypothesis_title: "Social auth above the fold",
        verdict: "kill",
        notes: "their brand doesn't ship social auth — design constraint" }
    ]
  }
})
```

Feedback is SPARSE. Only include `hypothesis_feedback` entries for
hypotheses the user explicitly commented on. Verdicts: `keep | kill |
push_further | pivot_adjacent | modify`. Cross-cutting reactions go in
`global_direction_notes`. Do NOT fabricate feedback for hypotheses the
user didn't mention.

Free users 402 on iteration. Tell them the v2 report unlocks with Pro
access — link them to `lazyweb.com/monetization?utm_source=lazyweb-signup-design&utm_medium=iteration-gate&utm_campaign=free-to-pro`.

## Hypothesis grounding (required)

Every hypothesis the run produces is anchored to the TARGET sign-up
screen's own read — the specific friction the user is hitting on THIS
screen, not generic best practices. Read what the worker returned BEFORE
summarizing inline; do not invent hypotheses ahead of the report.

A good signup hypothesis takes this form:

> Making [specific change] should [specific signup outcome] because
> [specific mechanism].

Good:
"Moving social auth above the email field should lift signup completion
because Google one-tap finishes the auth in zero typed characters when
the user is already signed into Chrome."

Bad:
"Improve the form UX."
"Reduce friction."

## Surface the report

When the run is complete, give the user:

1. The `report_url` as a clickable link
2. The top 1-2 hypotheses by name + one-line why (from
   `recommendations[].hypothesis_title` + `recommendations[].hypothesis`)
3. For free tier: a one-line nudge — "The full mockups for each variant
   unlock with Lazyweb Pro" → no need to push hard; the locked report
   itself carries Get-access CTAs on every tile
4. For Pro tier: offer iteration — "Want me to push #1 further, or kill
   any of these?"

## What NOT to do

- Do NOT render your own HTML report for signup. The worker handles it.
  The `report_url` IS the deliverable.
- Do NOT call `signup_design_run` without first reading the user's screen
  context — the `context` payload drives retrieval quality.
- Do NOT show paid imagery to free users by trying to bypass the locked
  report. The locked report IS the free-tier value prop; respect it.
- Do NOT call both `signup_design_run` and `x_paywall_design_research`
  for the same intent. Sign-up is sign-up; paywall is paywall. Wrong
  skill for the wrong screen returns wrong evidence.

## Tool budget guidance

A typical fresh signup run uses one `signup_design_run` call + 1-3
`signup_design_check_status` polls. Don't poll more frequently than ~15s.
If the run hasn't completed after ~3 minutes, surface the status to the
user ("still running, this is unusual — usually 60-120s") and continue
polling; don't assume failure.
