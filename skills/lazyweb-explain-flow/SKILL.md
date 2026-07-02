---
name: lazyweb-explain-flow
route: "Explain how something works with a hosted flow diagram (never touches the canonical chart)"
router-terms: explain with a diagram, explain using the flowchart, walk me through how X works, diagram why this failed, failure trace, trace what happened, show how the pieces fit, visualize how it works, explain this flow
description: |
  EXPLAIN how something works with a hosted, tappable flow diagram — a walkthrough,
  a failure trace, an answer to "how does X work?", a hypothetical — WITHOUT
  touching the product's canonical flow chart. Saves via lazyweb_explain_flow to
  separate insert-only storage, hosted at /explainer/<id>/. Use THIS (never the
  generate/save-flowchart path) whenever the goal is explanation rather than
  recording the product's current state.
  Trigger on: "explain this with a diagram", "walk me through how X works",
  "diagram why this failed", "explain using the flowchart", "show me how the
  pieces fit", "trace what happened".
allowed-tools:
  - Bash
  - Read
  - Grep
  - Glob
  - Agent
---

# Lazyweb — Explain a Flow

Host an **explanatory diagram**: same sectioned flow-view shape and viewer as the
canonical chart, but stored separately and insert-only — it can **never overwrite
or outrank** the product's canonical flow chart or its Architecture dashboard.

> **Hard rule:** an explanation NEVER goes through `lazyweb_save_flowchart`. That
> tool is the system of record (one chart per product, upserted in place, shown on
> the user's dashboard); saving an explanation there overwrites or hijacks it.
> Explanations go through `lazyweb_explain_flow`, full stop.

## MCP Setup

Use the hosted Lazyweb MCP tools at `https://www.lazyweb.com/mcp`.

Required tools:
- `lazyweb_health` — verify connectivity when the MCP surface is uncertain
- `lazyweb_explain_flow` — save the explanatory diagram (returns `explainer_id` + `explainer_url`)
- `lazyweb_get_flowchart` — optionally fetch the canonical chart as a starting reference

If Lazyweb MCP is missing — or `lazyweb_explain_flow` isn't in the tool list — tell
the user to run `curl -fsSL https://www.lazyweb.com/install.sh | bash`, reload, rerun.

## Steps

1. **Understand what needs explaining.** A question ("how does search work?"), a
   failure ("why did this report ignore the intent?"), a walkthrough, a comparison.
   Ground it in the real code/logs — read the handlers, don't invent.
2. **Optionally start from the canonical chart.** `lazyweb_get_flowchart({ product })`
   gives you the product's real structure — copy and reshape it freely for the
   explanation (highlight the relevant path, drop irrelevant sections, add the
   failure step). You are editing a COPY; never re-save it through save_flowchart.
3. **Build the explanatory diagram** in the same schema as the canonical chart
   (sections, actors, nodes/edges with `note`s and real `data` payloads,
   `bidirectional` on round trips — the lazyweb-generate-flowchart conventions all
   apply; an explanation earns its keep with REAL content, not boxes).
   Shape it for the QUESTION: order sections as the narrative, name the section
   titles as claims (e.g. "Where the run died — no model call"), put the "so what"
   in each node's `note`.
4. **Save it:** `lazyweb_explain_flow({ title, summary, product?, diagram })` →
   share the returned `explainer_url`. The canonical chart is untouched.

## When NOT to use
- Recording the product's actual current architecture → `/lazyweb-generate-flowchart`
  (canonical, matter-of-fact, one per product).
- Refreshing the canonical chart after code changes → `/lazyweb-update-flowchart`.
- Proposing changes the user should Accept/Decline → `/lazyweb-propose-ui-changes`.

## Notes
- Explainers are point-in-time and cheap — make as many as the conversation needs;
  they never collide with each other or with anything canonical.
- If an explanation reveals the canonical chart is WRONG about the current state,
  say so and offer `/lazyweb-update-flowchart` as a separate follow-up — don't fold
  the correction into the explainer.
