---
name: lazyweb-optimize-sign-up
route: 'Optimize sign-up conversion'
router-terms: signup, sign-up, sign up, registration, account creation, create account, email capture, signup completion, registration screen, signup screen
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

# Optimize Sign Up

Optimize a sign-up screen with evidence-backed completion hypotheses, not
generic form advice.

## CRITICAL: Output Behavior

This skill produces a hosted HTML report via the `signup_design_run`
background worker — NOT a local file. The worker handles rendering and
mockup generation on the server side; this skill is the agent-side glue
that kicks the run off, polls, and surfaces the result.

All current sign-up workflow runs are free. The report has 3-4 hypothesis
cards with AI-generated mockups of the user's sign-up screen modified per
the hypothesis, plus real A/B experiment evidence and Lazyweb references
when matching evidence is available.

## When to Use This

- User wants to improve, redesign, optimize, critique, or evaluate a
  sign-up / registration / account-creation screen
- User has a sign-up screenshot, URL, product brief, or current copy
- User asks how to increase signup completion rate, email capture, or
  onboarding entry
- User asks for concrete signup-screen redesign hypotheses

## When NOT to Use This

- User is asking about a paywall (post-signup, paid conversion) →
  `lazyweb-optimize-paywall`
- User wants just CTA button copy on a sign-up screen → still use this
  skill if the question is whole-screen optimization; route to
  `lazyweb-paywall-cta` is wrong (CTA skill is paywall-specific)
- User wants only A/B test examples on signup → `lazyweb-ab-test-research`
- User wants generic form best practices outside an app sign-up screen
  → `lazyweb-deep-design-research`

## Lazyweb MCP Setup

Use hosted Lazyweb MCP tools at `https://www.lazyweb.com/mcp` for
database-backed evidence + the run pipeline. First list available tools
and run `lazyweb_health`.

Required public tools:
- `lazyweb_health` — verify Lazyweb MCP connectivity
- `signup_design_run` — kick off the full pipeline; returns
  `run_id` + initial `status='queued'`. Takes `image_b64` + `context`
  (product, plan, conversion_goal, etc.). For iteration, also takes
  `parent_run_id` + sparse `feedback`
- `signup_design_check_status` — poll with `run_id`; returns `status`,
  `tier`, and (when complete) `report_url` + `recommendations`
- `lazyweb_search` — find sign-up references and convention examples
- `lazyweb_compare_image` — find visually similar sign-up screens when the
  target image is available
- `lazyweb_search_ab_tests` — mobile-only broader A/B evidence (signup
  experiments, lifecycle, activation)

**Search discipline:** never repeat an identical `lazyweb_search` query — results are deterministic; page deeper with `offset` and follow `pagination.next_offset`. On `no_matches`/`low_coverage` warnings, use the closest result or note the coverage gap — don't rephrase the same concept in a loop. On `company_not_in_library`, use a suggested company or drop the filter.

**Pass `skill: "optimize-sign-up"` on every call.** Include `"skill": "optimize-sign-up"` in the arguments of each `lazyweb_*` tool call — for example `{"query": "pricing page", "limit": 30, "skill": "optimize-sign-up"}`. This is optional analytics metadata Lazyweb uses to understand which skills are used; never drop or change a real argument for it.

**Also pass `version: "<x.y.z>"` on every call.** Read `~/.lazyweb/VERSION` once per session at skill start (e.g. `cat "$HOME/.lazyweb/VERSION" 2>/dev/null || echo 0.0.0`); fall back to `"0.0.0"` if the file is missing or unreadable — never block on this. Include `"version": "<that-value>"` in the arguments of every `lazyweb_*` tool call alongside the existing `skill` arg — for example `{"query": "pricing page", "limit": 30, "skill": "optimize-sign-up", "version": "0.4.5"}`. Optional analytics metadata Lazyweb uses to track which skill-pack versions are running; never drop or change a real argument for it.

If Lazyweb MCP is not installed or auth fails, tell the user: "Lazyweb MCP
is not installed. Run `curl -fsSL https://www.lazyweb.com/install.sh | bash`,
reload this client, then rerun this skill."

### Free behavior on the run tool

`signup_design_run` queues fresh runs and iterations without a paid tier
check. Some backend responses may still include a legacy `tier` field for
worker compatibility; do not treat that field as an access or billing gate.
Use `signup_design_check_status` to poll until the hosted `report_url` is
ready, then surface the report to the user.

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

If iteration fails, report the returned backend error as an operational
failure or invalid `parent_run_id`; do not describe it as a paywall or Pro
upgrade requirement.

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
3. Offer iteration — "Want me to push #1 further, or kill any of these?"

## What NOT to do

- Do NOT render your own HTML report for signup. The worker handles it.
  The `report_url` IS the deliverable.
- Do NOT call `signup_design_run` without first reading the user's screen
  context — the `context` payload drives retrieval quality.
- Do NOT render alternate local mockups to replace the hosted report. The
  worker-generated `report_url` is the source of truth for this skill.
- Do NOT call both `signup_design_run` and `x_paywall_design_research`
  for the same intent. Sign-up is sign-up; paywall is paywall. Wrong
  skill for the wrong screen returns wrong evidence.

## Tool budget guidance

A typical fresh signup run uses one `signup_design_run` call + 1-3
`signup_design_check_status` polls. Don't poll more frequently than ~15s.
If the run hasn't completed after ~3 minutes, surface the status to the
user ("still running, this is unusual — usually 60-120s") and continue
polling; don't assume failure.
