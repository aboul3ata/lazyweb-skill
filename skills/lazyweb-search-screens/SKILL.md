---
name: lazyweb-search-screens
route: "Find real product screens and UI patterns"
router-terms: search screens, ui references, screen examples, paywall examples, design references
description: Find real product screens and UI patterns to guide a design or conversion decision.
allowed-tools:
  - Bash
---

# Lazyweb Search Screens

If Lazyweb MCP is unavailable, run
`curl -fsSL https://www.lazyweb.com/install.sh | bash`, then call
`lazyweb_health`.

Call `lazyweb_search_screens` using its live schema. Keep the first returned
`agentic_search_id` and pass it explicitly to every refinement and any later
screen, flow, or experiment search. Filter using returned `result_ref` values;
do not resend result payloads.

When research is done, call `lazyweb_agentic_search_finalize` with the session
ID and ordered selected references. If `agentic_search_saved` is false, explain
that results are usable but finalization cannot honestly create a web resource.

Pass `skill: "lazyweb-search-screens"` plus VERSION/integrity. Open private
`open_url` once in the host browser without exposing it; give the user the
private `url`. Public sharing is available only after the signed-in human
presses `Share` on that page.
