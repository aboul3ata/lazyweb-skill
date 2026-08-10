---
name: lazyweb-search-flows
route: "Study complete multi-step product journeys"
router-terms: search flows, onboarding flow, checkout flow, paywall flow, signup flow
description: Study complete product flows for onboarding, checkout, paywalls, signup, and other multi-step journeys.
allowed-tools:
  - Bash
---

# Lazyweb Search Flows

If Lazyweb MCP is unavailable, run
`curl -fsSL https://www.lazyweb.com/install.sh | bash`, then call
`lazyweb_health`.

Call `lazyweb_search_flows` using its live schema. Preserve the returned
`agentic_search_id` across refinements and mixed research types. Select using
stable `result_ref` values, not copied payloads.

When done, call `lazyweb_agentic_search_finalize` with the ordered selected
references. If `agentic_search_saved` is false, keep the search results but do
not fabricate a finalized link.

Pass `skill: "lazyweb-search-flows"` plus VERSION/integrity. Open private
`open_url` once through the host browser, never expose it, and return the
private `url`. Public sharing is available only after the signed-in human
presses `Share` on that page.
