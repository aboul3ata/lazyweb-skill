---
name: lazyweb-update-flowchart
route: "Update a saved flow chart to match the current code (direct upsert)"
router-terms: update the flow chart, update the flowchart, refresh the flowchart, the chart is stale, sync the flow chart with the code, bring the diagram up to date, refresh the diagram, chart out of date, resync the flow chart
description: |
  UPDATE a product's saved Lazyweb flow chart to match the current code: look at
  the existing chart, pull the code diffs since it was last updated, and upsert the
  chart in place (stable id + URL) with the real changes. A DIRECT update — no
  proposal / Accept-Decline overlay. This is what the "Update this chart" banner on
  a /flowchart/<id>/ page copies to your clipboard.
  Trigger on: "update the flow chart", "refresh the flowchart", "the chart is stale",
  "sync the flow chart with the code", "bring the diagram up to date".
allowed-tools:
  - Bash
  - Read
  - Grep
  - Glob
  - Agent
---

# Lazyweb — Update Flow Chart

Bring a product's **existing** canonical flow chart back in sync with the code. Use
this when the chart already exists (the `/flowchart/<id>/` page shows an "Update this
chart" banner) and the code has moved on. It updates the SAME chart in place — same
`flowchart_id`, same URL — it does not create a new one and does not open a proposal.

> New chart from scratch? Use `/lazyweb-generate-flowchart` instead. Want the change
> reviewed Accept/Decline first? Use `/lazyweb-propose-ui-changes`. This skill is the
> fast path: just refresh the chart.

## MCP Setup

Use the hosted Lazyweb MCP tools at `https://www.lazyweb.com/mcp`.

Required tools:
- `lazyweb_health` — verify connectivity when the MCP surface is uncertain
- `lazyweb_get_flowchart` — read the current chart (by `product` or `flowchart_id`)
- `lazyweb_save_flowchart` — upsert the updated chart in place

If Lazyweb MCP is missing, tell the user to run
`curl -fsSL https://www.lazyweb.com/install.sh | bash`, then reload and rerun.

## Steps (in this order)

1. **Look at the current chart FIRST.** `lazyweb_get_flowchart({ product })` (or
   `{ flowchart_id }`). Read its sections / nodes / edges so you know what it
   currently claims, and note each node's `source` field — the files it was built
   from. Keep the returned `flowchart_id` and the chart's last-updated time.
2. **Pull the latest code + diffs.** In the product's repo: `git fetch`, then review
   what changed since the chart was last updated — `git log --since="<updatedAt>"
   --oneline` (report how many commits) — and read the diffs for the cited `source`
   files and the handlers behind each step. Identify new / removed / changed steps,
   endpoints, payloads, or async shapes (a sync call that became poll/stream/webhook,
   a new pipeline stage, a dropped step, a changed request/response).
3. **Update the chart in place.** Rebuild ONLY the sections / nodes / edges that
   actually changed, from the REAL current code — real request/response payloads,
   specific PM-useful `note`s, `bidirectional` on true round trips, correct async
   archetype (see the lazyweb-generate-flowchart conventions). **Keep node `id`s
   stable** where a step is unchanged (so any pinned proposals still resolve). Save
   with `lazyweb_save_flowchart({ product, diagram })` — same `product`, so it
   UPSERTS this same chart.
4. **Report.** A short summary: N commits since last update, and what changed in the
   chart. Share the (unchanged) `flowchart_url`.

## Notes
- Unchanged? Say so — if `git log` since the last update shows nothing that touches
  the flow, tell the user the chart is already current and don't re-save.
- One chart per product: re-saving updates in place; it never duplicates.
- This is deliberately NOT a proposal — the user asked to just refresh the chart. If
  the change is large or contentious, offer `/lazyweb-propose-ui-changes` instead.
