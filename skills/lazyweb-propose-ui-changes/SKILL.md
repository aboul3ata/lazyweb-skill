---
name: lazyweb-propose-ui-changes
route: "Propose reviewable UI/flow changes on a diagram (Accept/Decline)"
router-terms: propose changes, suggest UI changes for review, review my suggestions, let me review your suggestions, annotate this flow, annotate this diagram, create a proposal, review and approve these changes, approve or reject changes, hosted proposal, explain this architecture visually
description: |
  Propose UI/flow changes (or explain context) on a STRUCTURED DIAGRAM that the
  user reviews and Accepts/Declines on a hosted lazyweb.com page, then apply the
  accepted ones. Use when the user wants a reviewable set of proposed changes to
  a product's UI, architecture, or flow — anything where you'd otherwise list
  suggestions in chat and want the user to approve/reject each before you act.
  Trigger on: "propose changes", "suggest UI changes for review", "let me
  review your suggestions", "annotate this flow/diagram", "create a proposal",
  "review and approve these changes", "explain this architecture/flow visually".
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
  - Grep
  - AskUserQuestion
  - Agent
---

# Lazyweb — Propose UI Changes

Propose changes **against a structured diagram you build from the real code**:
you supply the current diagram, annotate its elements, and supply a **proposed**
version; the user opens a `lazyweb.com/proposal/<id>/` page, **toggles Current ↔
Proposed** to see before/after, and **Accepts / Declines** each suggestion; then
you apply the accepted ones.

This skill drives these Lazyweb MCP tools:
- `lazyweb_health` — verify MCP connectivity when the surface is uncertain.
- `lazyweb_propose_ui_changes` — store a proposal (current + proposed + annotations), get a review URL.
- `lazyweb_get_proposal_decision` — poll the user's accept/decline verdicts.

> **Prerequisite:** the Lazyweb MCP must be connected and current. If
> `lazyweb_propose_ui_changes` isn't in the tool list, the skill pack/MCP is out
> of date — tell the user to update (`curl -fsSL https://www.lazyweb.com/install.sh | sh`)
> and restart their client.

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

## When to use
- The user wants to see and approve/reject a batch of changes **before** you make them.
- You want to explain how a system/flow works by annotating a diagram they can click.
- Changes span several places and a chat list would be hard to review.

## When NOT to use
- A single trivial edit you can just make — don't ceremony it into a proposal.
- Pure design-from-screenshots work — use `lazyweb_generate_report` / the design skills.

## The data you build

A proposal = **`diagram`** (the current state, nodes + edges each with a stable
`id`, built from the REAL code) + **`proposed`** (a full copy of that diagram
with your changes applied) + **`annotations`** (one per suggestion, targeting
node/edge `id`s). The viewer shows Current from `diagram` and Proposed from
`proposed`, and lists the annotations to Accept/Decline.

```jsonc
{
  "diagram": { /* the CURRENT sectioned diagram: actors, sections, nodes, edges —
                  each element with a stable id, grounded in the real code. */ },
  "title": "Speed up repeat reports",
  "summary": "Three changes to cut latency.",
  "proposed": { /* the SAME sectioned diagram, edited: add/remove/modify nodes+edges.
                   Keep unchanged ids stable so Current↔Proposed line up. */ },
  "annotations": [
    { "target": "a_tkt",            // a node OR edge id IN THE DIAGRAM
      "kind": "change",             // change | add | remove | highlight | note
      "title": "Cache identical re-runs",
      "detail": "Return a cached result when the input hash is unchanged.",
      "before": "always rebuilds",  // optional
      "after": "instant on cache hit" },
    { "target": "a_poll", "kind": "add", "title": "Send progress, not just pending" }
  ]
}
```

**`kind`** sets the badge color/label: `change` (orange), `add` (green),
`remove` (red), `highlight` (purple), `note` (blue). Defaults to `note`.

## Steps

1. **Build the current diagram from the real code.** Sections, actors, nodes and
   edges with stable `id`s, `note`s, and real `data` payloads — never invented
   structure. Proposals **target these ids**.

2. **Author the annotations.** One per suggestion, each `target`ing a diagram
   node/edge `id`. Clear `title` + `detail`; add `before`/`after` for concrete
   changes; pick the right `kind`.

3. **Build `proposed`.** Copy the diagram and apply the changes you're
   proposing — add/remove/modify nodes and edges — **keeping unchanged ids stable**
   so the Current↔Proposed toggle aligns. This is the "after" the user previews.

4. **Submit.** `lazyweb_propose_ui_changes({ diagram, title, summary,
   proposed, annotations })` → `{ proposal_id, proposal_url, ... }`. On `ok:false`,
   surface `error`/`detail`; fix any `unknownTargets` (ids not in the diagram).

5. **Share the link.** Give the user the `proposal_url`: they toggle **Current ↔
   Proposed** and Accept/Decline each suggestion there. Don't paste the proposal
   back into chat — the page is the review surface.

6. **Get decisions.** When they're done (or after a wait), poll
   `lazyweb_get_proposal_decision(proposal_id)` until `status` is `completed`
   (~20–30s between polls; don't hammer).

7. **Apply.** Make the change for every `accepted` suggestion; skip `declined`.
   Confirm what you applied vs skipped.

## Notes
- The review page is unlisted (UUID-gated) — share the URL only with the reviewer.
- Decisions are scoped to the submitting user.
- Keep diagrams + proposals product-agnostic and target strictly by `id`; that's what
  makes this reproducible across products.
