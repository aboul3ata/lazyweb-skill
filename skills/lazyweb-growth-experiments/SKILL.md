---
name: lazyweb-growth-experiments
route: "Growth and monetization experiment evidence"
router-terms: growth experiment, a/b test, experiment evidence, pricing experiment, family plan, plan mix, trial, paywall, monetization, lifecycle, conversion
description: |
  Research growth, conversion, pricing, trial, paywall, lifecycle, and
  monetization changes with real Lazyweb control/variant evidence. Use when a
  coding agent must decide what to test, understand what other products changed,
  evaluate a new plan or offer, or turn an existing screen into a ranked,
  evidence-backed implementation handoff.
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

# Lazyweb Growth Experiment

Use `lazyweb_search_ab_tests` first. Use `lazyweb_search` only as secondary
visual-pattern evidence when the experiment corpus has a genuine coverage gap.
Do not treat a screenshot pattern as an experiment result.

## Connect

Use Lazyweb MCP at `https://www.lazyweb.com/mcp`. If the tool surface is
uncertain, call `lazyweb_health`. If it is missing, tell the user to run:

```bash
curl -fsSL https://www.lazyweb.com/install.sh | bash
```

Read `~/.lazyweb/VERSION` and `~/.lazyweb/INTEGRITY` once. Pass
`skill: "lazyweb-growth-experiments"`, `version`, and the opaque `integrity`
value on every Lazyweb call; omit `integrity` when the file is absent.

Inspect access outcomes before reading evidence. For `MCP_PRO_REQUIRED` or
`FREE_REPORT_DAILY_LIMIT`, show the server message and `upgrade_url`, then stop.
For `status: "locked_preview"`, show `display_to_user`, then stop. Do not route
around an access outcome with another data tool.

## Research

1. Describe the current screen, the behavioral mechanism to change, the target
   metric, material constraints, and one guardrail. Do not start with a visual
   preference.
2. Call `lazyweb_search_ab_tests` with:

```json
{
  "operation": "research",
  "target_screen_description": "<screen + current behavior + proposed mechanism>",
  "conversion_goal": "<one primary outcome>",
  "constraints": "<audience, funnel, offer, platform, and non-negotiables>",
  "include_images": false,
  "interesting_learning": false,
  "limit": 8,
  "analysis_experiment_limit": 4,
  "visual_inspection_budget": 0,
  "skill": "lazyweb-growth-experiments",
  "version": "<installed version>"
}
```

Add `category` only when business mechanics differ materially by industry.
Add `high_design_bar: true` only after mechanism relevance is proven and design
quality matters. Set `interesting_learning: true` only when the user explicitly
asks for uncommon or surprising ideas.

Omit an unknown `product` on the first broad probe. An unresolved product can
become an empty company filter; keep product context in
`target_screen_description` and `constraints` instead. Never read zero results
as proof that no company tested the idea.

## Filter

Read `dataset_caveat`, `evidence.count`, `warnings`, and `filters_applied`
before the recommendations. Then inspect each candidate's:

- `experiment_id`; `company.company_name`, `company.category`, and subcategory
- `platform`, `what_changed`, `learning`, and `evidence_confidence`
- `control.vision_description`, `variant.vision_description`, and both
  `created_at` values
- `control.image_url` and `variant.image_url` when present

Rank mechanism match first, then funnel/screen match, audience and economics,
category, and visual quality. Reject records whose `what_changed` does not test
the proposed mechanism, whose `platform` conflicts with the target, or whose
control/variant descriptions do not support the claimed change. Trace every
recommendation back to its `experiment_id`; recommendations are synthesis, not
an independent evidence source.

Treat the corpus as hypotheses, not statistically measured lift. A learning
that names an outcome is not a lift estimate unless the record contains the
measurement. `evidence_confidence` rates the screenshot-diff interpretation; it
does not upgrade missing causal data. Label single-source or cross-category
evidence as directional.

## Look Further

- Zero count or filter warning: remove an unresolved product/company filter,
  then an unnecessary category, then shorten the description to the mechanism.
- Relevant but thin: increase `limit` or try one adjacent mechanism. Do not
  broaden several dimensions at once.
- Noisy: tighten `constraints` and manually enforce the returned `platform`.
- Direct evidence absent: call `lazyweb_search` with a concrete 2-6 word UI
  pattern, the target platform, `limit: 3`, and `maxPerCompany: 1`. Inspect
  `coverage`, `warnings`, company/category/platform, description, and
  `imageUrl`/`image_url`. Report prevalence only; never present these references
  as A/B wins.

## Inspect Images

After selecting evidence, call `lazyweb_search_ab_tests` with
`operation: "grab"`, the selected `experiment_ids`, and `include_images: true`.
Verify every returned `experiment_id` is one you requested; discard mismatches.
If grab does not return the selected record, use its already-returned image URLs
when available or state that visual proof could not be verified.

Inspect both control and variant before using a record. Only download images
selected for the final handoff and only when a durable local artifact is needed;
otherwise open or embed the returned signed URLs. Never construct a URL from
`path`, and never download only one side of a before/after pair.

## Hand Off

Give the coding agent a short ranked list. Lead with one recommendation and say
what to skip. For each hypothesis include the exact change, target metric,
guardrail, mechanism, evidence count, experiment IDs, company/category/platform,
control and variant proof, confidence, and caveat. Keep every claim beside its
visual evidence and quantify the matched corpus. If direct evidence is absent,
say so and keep the proposal explicitly exploratory.
