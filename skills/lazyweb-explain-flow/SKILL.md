---
name: lazyweb-explain-flow
route: "Explain how something works with a hosted flow diagram"
router-terms: explain with a diagram, walk me through how X works, diagram why this failed, failure trace, trace what happened, show how the pieces fit, visualize how it works, explain this flow
description: |
  EXPLAIN how something works with a hosted, tappable flow diagram — a walkthrough,
  a failure trace, an answer to "how does X work?", a hypothetical. Saves via
  lazyweb_explain_flow to insert-only storage, hosted at /explainer/<id>/.
  Trigger on: "explain this with a diagram", "walk me through how X works",
  "diagram why this failed", "show me how the pieces fit", "trace what happened".
allowed-tools:
  - Bash
  - Read
  - Grep
  - Glob
  - Agent
---

# Lazyweb — Explain a Flow

Host an **explanatory diagram**: a sectioned flow-view page, stored insert-only —
every call hosts a new standalone page that never collides with anything else.

## MCP Setup

Use the hosted Lazyweb MCP tools at `https://www.lazyweb.com/mcp`.

Required tools:
- `lazyweb_health` — verify connectivity when the MCP surface is uncertain
- `lazyweb_explain_flow` — save the explanatory diagram (returns `explainer_id` + `explainer_url`)

If Lazyweb MCP is missing — or `lazyweb_explain_flow` isn't in the tool list — tell
the user to run `curl -fsSL https://www.lazyweb.com/install.sh | bash`, reload, rerun.

### MCP plan responses

Inspect every data-bearing tool result before applying its normal schema:

- `MCP_PRO_REQUIRED`: relay the server message and returned intent-bound
  `upgrade_url` to the user, then stop. Do not retry another data tool or fall
  back to web/manual output.
- `FREE_REPORT_DAILY_LIMIT`: relay the server message and returned intent-bound
  `upgrade_url` to the user, then stop. Do not retry another data tool or fall
  back to web/manual output.
- Successful `status: "locked_preview"`: relay `display_to_user` verbatim (or
  the returned MCP text if that is all the client exposes), including the
  preview and upgrade links. It is terminal: do not poll, retry another data
  tool, reconstruct output, or fall back.

## Steps

1. **Understand what needs explaining.** A question ("how does search work?"), a
   failure ("why did this report ignore the intent?"), a walkthrough, a comparison.
   Ground it in the real code/logs — read the handlers, don't invent.
2. **Build the explanatory diagram** in the sectioned flow-view schema
   (sections, actors, nodes/edges with `note`s and real `data` payloads,
   `bidirectional` on round trips; an explanation earns its keep with REAL
   content, not boxes). Data snippets meet an exactness bar: actual payloads
   from the code/logs, `…` only to redact secrets (never to shorten content), and
   a sliced array keeps its first item(s) full-shape with the omission count in
   the `note`.
   Shape it for the QUESTION: order sections as the narrative, name the section
   titles as claims (e.g. "Where the run died — no model call"), put the "so what"
   in each node's `note`.
3. **Save it:** `lazyweb_explain_flow({ title, summary, product?, diagram })` →
   share the returned `explainer_url`.

## When NOT to use
- Proposing changes the user should Accept/Decline → `/lazyweb-propose-ui-changes`.

## Notes
- Explainers are point-in-time and cheap — make as many as the conversation needs;
  they never collide with each other.
