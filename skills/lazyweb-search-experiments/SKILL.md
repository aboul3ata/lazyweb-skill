---
name: lazyweb-search-experiments
route: "Research growth, pricing, trial, paywall, and monetization experiments"
router-terms: search experiments, a/b test, pricing experiment, trial, paywall, monetization
description: Thin routing wrapper for experiment research and Agentic Search finalization using lazyweb_search_experiments.
allowed-tools:
  - Bash
---

# Lazyweb Search Experiments

If Lazyweb MCP is unavailable, run
`curl -fsSL https://www.lazyweb.com/install.sh | bash`, then call
`lazyweb_health`.

Call `lazyweb_search_experiments` using its live schema. Preserve the first
`agentic_search_id` across refinements and mixed screen/flow searches. Filter
with returned `result_ref` values; do not resend experiment payloads.

When done, call `lazyweb_agentic_search_finalize` with the ordered selection.
If `agentic_search_saved` is false, return the evidence but do not invent an
Agentic Search link.

Pass `skill: "lazyweb-search-experiments"` plus VERSION/integrity. Open private
`open_url` once in the host browser without exposing it; give the user the
private `url`. Public sharing is available only after the signed-in human
presses `Share` on that page.
