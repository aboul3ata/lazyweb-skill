---
name: lazyweb-generate-flowchart
route: "Map how a product's agent/app talks to its backend as a flow chart"
router-terms: flow chart, flowchart, architecture diagram, map how X talks to its backend, diagram the agent-backend flow, canonical flow chart, system flow diagram, how our app talks to the backend, sequence of calls, map the backend flow
description: |
  Generate a canonical FLOW CHART of how a product's agent/app and its backend
  talk, in the Lazyweb metrics-tab style (per-capability sections, optional
  Initialization, sync one-round-trip vs async — poll / stream / webhook / queue —
  on an actor-colored spine), and SAVE it as the product's static flow chart. Run
  this FIRST — before any proposal — so proposals annotate a stable, shared chart.
  Trigger on: "generate a flow chart", "map how X talks to its backend",
  "create the architecture/flow diagram", "flow chart for my product",
  "diagram the agent<->backend flow", "make the canonical flow chart".
allowed-tools:
  - Bash
  - Read
  - Grep
  - Glob
  - AskUserQuestion
  - Agent
---

# Lazyweb — Generate Flow Chart

Produce the **canonical flow chart** for a product and save it, so proposals
(`/lazyweb-propose-ui-changes`) can be made *against a stable chart*. The output
uses the same **sectioned** shape the Lazyweb metrics tab uses, so any product's
chart lands looking like ours — without hardcoding Lazyweb's content.

Saved via the Lazyweb MCP: `lazyweb_save_flowchart({ product, diagram })` →
returns `{ flowchart_id, flowchart_url }`. Re-running for the same `product`
UPDATES that one chart in place (stable id + URL); it is not duplicated.

## Matter of fact — never for explaining

The canonical chart is the **system of record**: a matter-of-fact map of the
product's **current state**, derived from the real code, shown on the user's
Architecture dashboard. It is NOT a communication device.

- **Never** use this skill (or `lazyweb_save_flowchart`) to explain a concept,
  answer a question, trace a failure, teach, or illustrate a hypothetical. A
  diagram shaped around a question is an *explanation*, and saving it here
  **overwrites the one canonical chart** (same product upserts in place) or
  hijacks the user's dashboard (latest chart wins).
- Explanations go through **`/lazyweb-explain-flow`** (`lazyweb_explain_flow`) —
  separate insert-only storage at `/explainer/<id>/`; it cannot collide with the
  canonical chart. You may copy the canonical chart as a starting point there.
- Litmus test: *would this diagram be identical no matter what question the user
  just asked?* If no, it's an explanation — wrong skill.
- Content here states what IS: real sections, real payloads, real timings. No
  emphasis added for a narrative, no "what went wrong" sections, no hypotheticals.

## MCP Setup

Use the hosted Lazyweb MCP tools at `https://www.lazyweb.com/mcp`.

Required tools:
- `lazyweb_health` — verify connectivity when the MCP surface is uncertain
- `lazyweb_save_flowchart` — persist the finished chart (returns `flowchart_id` + `flowchart_url`)
- `lazyweb_get_flowchart` — fetch a saved chart back (by `flowchart_id` or `product`)

If Lazyweb MCP is missing — or `lazyweb_save_flowchart` isn't in the tool list —
tell the user to run:

```bash
curl -fsSL https://www.lazyweb.com/install.sh | bash
```

Then reload the client and rerun the skill.

## The model (the convention that makes charts consistent)
A product ⇄ backend story breaks into **sections**, stacked top→bottom — one per
capability ("skill").

- **Initialization is optional.** Include a first section for a one-time
  connect/handshake (auth, capabilities, tool list, session) *only if the product
  actually has one*. MCP servers and stateful/session APIs do; a stateless
  REST/GraphQL backend usually doesn't — start at the first real skill instead of
  inventing a handshake.

- **Each skill is sync or async.** Pick the shape that matches how THIS product
  really behaves — don't force everything into the poll+pipeline mold:
  - **Synchronous** — one round trip (request → response). A short left→right spine.
  - **Async · poll** — request → **job/ticket id**, caller **polls** in a loop, a
    **background pipeline** (a band of steps) runs until the result is ready.
    (Spine + pipeline band + `branch`/`return`.)
  - **Async · stream / SSE / websocket** — request opens a channel and the server
    **pushes** events/chunks over time. Model the open + a `loop:true` "receives
    events" step. No ticket, no poll.
  - **Async · webhook / callback** — request returns an immediate ack; the backend
    **calls back** later at a registered URL. Model the ack + a `return` edge from
    the backend to a "callback received" step. No poll loop.
  - **Async · fire-and-forget / queue** — request enqueues work and returns;
    nothing comes back to the caller (or it's read elsewhere). A `branch` into a
    pipeline band with **no** `return`.

Use the PRODUCT'S real actors, skills, and async shape — this taxonomy is a menu to
choose from, not a mold to force everything into.

## Diagram schema (what you save)
```jsonc
{
  "title": "How <product> talks to its backend",
  "source": "<product name>",
  "actors": [                                   // lanes; drive legend + card colors.
                                                // Use the product's REAL tiers — these
                                                // are only examples. A web app might be
                                                // browser / API / DB; a mobile app might
                                                // be app / GraphQL / service; an MCP tool
                                                // might be agent / MCP / worker.
    { "id": "client",  "label": "<client / app / agent>",   "color": "#245bff" },
    { "id": "api",     "label": "<API / service layer>",    "color": "#ff6b00" },
    { "id": "backend", "label": "<worker / DB / 3rd-party>", "color": "#15803d" }
  ],
  "sections": [
    { "title": "Initialization" },
    { "title": "<sync skill, e.g. Search>" },
    { "title": "<async skill, e.g. Generate report>",
      "builderLabel": "<backend> · running the pipeline · ~N min" }
  ],
  "nodes": [
    // Each node: short label + short sub (a couple words / a timing — it clips if long),
    // a `note` (specific, PM-useful: what it does + why + failure/latency), and for a
    // step that TRANSFORMS content, real `data: { input, output }` pulled from the code.
    { "id": "s_ask",  "actor": "client", "section": 1, "col": 0, "label": "Search",
      "sub": "one call", "note": "The client sends a UI query + filters to find reference screens." },
    { "id": "s_ans",  "actor": "api",    "section": 1, "col": 1, "label": "Ranked results",
      "sub": "~2s", "note": "Embeddings + ranked DB lookups; returns matches with signed image URLs, deduped.",
      "data": { "output": { "results": [ { "id": 1024, "company": "Peloton", "similarity": 0.74 } ] } } },
    { "id": "a_poll", "actor": "client", "section": 2, "col": 2, "label": "Poll", "sub": "every ~10s",
      "loop": true, "loopLabel": "every ~10s", "note": "Polls until the job is done; the result is deferred because the work outlasts one request. State the product's REAL reason here." },
    // PIPELINE band: row:1, bcol = order. Belongs to the async section. Give steps I/O too.
    { "id": "p1", "actor": "backend", "section": 2, "row": 1, "bcol": 0, "label": "Synthesize", "sub": "~30s",
      "note": "Turns the brief into ranked hypotheses. A failed slot is dropped, not fatal.",
      "data": { "input": { "brief": "…" }, "output": { "hypotheses": 6 } } }
  ],
  "edges": [
    // A message. Plain-English `label`; the real method name lives in `data`/`note`.
    // `bidirectional: true` (or supplying request+response) => a double-headed arrow.
    { "id": "e_search", "from": "s_ask", "to": "s_ans", "kind": "forward", "label": "find references",
      "bidirectional": true, "note": "One round trip: query in, ranked matches out (result is JSON text).",
      "data": { "request": { "method": "tools/call", "params": { "name": "lazyweb_search", "arguments": { "query": "mobile paywall", "limit": 20 } } },
                "response": { "ok": true, "results": [ { "id": 1024, "similarity": 0.74 } ] } } },
    { "id": "e_call",   "from": "a_ask", "to": "a_tkt", "kind": "forward", "label": "ask for a report", "bidirectional": true },
    { "id": "e_poll",   "from": "a_tkt", "to": "a_poll","kind": "forward", "label": "start polling" },
    { "id": "e_get",    "from": "a_poll","to": "a_done","kind": "forward", "label": "is it ready?", "bidirectional": true },
    { "id": "e_branch", "from": "a_tkt", "to": "builder","kind": "branch", "label": "starts pipeline" },
    { "id": "e_return", "from": "builder","to": "a_done","kind": "return", "label": "returns result" }
  ]
}
```

## Make it useful (this is what separates a good chart from a shape)
Written for a PM who thinks in systems but not syntax — so:
- **Show real content in/out.** Every message gets `data: { request, response }`; every
  step that transforms content gets `data: { input, output }`. Pull the **actual**
  shapes from the codebase (grep the handlers) — never invent generic payloads.
- **Keep values real and complete — do NOT collapse a field to an ellipsis.** Storing
  `"instructions": "# Welcome to Lazyweb …"` throws the content away: there is nothing
  left to read. The viewer already **clamps long blocks to ~10 lines with a "Show more"
  toggle**, so paste the *actual* value (trim a genuinely enormous blob to a
  representative slice, but never lop it to `…`). The only legitimate use of `…` is to
  **redact a secret** (e.g. `"Authorization": "Bearer 3f9c…"`), never to shorten real content.
- **`bidirectional: true`** on any true request→response message (→ double-headed
  arrow). Leave one-way signals single.
- **`note` on every node/edge** — specific and grounded: what it does, **why it works
  this way** (the *real* tradeoff for THIS product — why async, why a cache, why a
  queue — grounded in the actual code, not a reason borrowed from another product),
  failure behavior, and rough **latency/cost**. Plain English; explain any jargon.
  Never "a step in the flow".
- **Keep on-card `sub` short** (a couple words or a timing). The detail goes in
  `note` (shown when the box is tapped) — long subs get truncated on the card.
- **Plain-English `label`s**; the real method/endpoint name lives in `data`/`note`.

### Layout rules (so it renders like ours — don't hand-place pixels)
- **Sections stack** top→bottom in `sections[]` order; put Initialization first *if
  the product has one* (skip it entirely for stateless APIs).
- Within a section, **spine** steps read left→right by `col` (0,1,2,…); alternate
  actors (caller, server, caller, …) — the accent color comes from `actor`.
- **Async · poll:** add a **poll** step with `loop:true`, a **pipeline band**
  (`row:1`, `bcol` in order), a `branch` edge from the ticket step into the band
  (`to` the first pipeline step or `"builder"`), and a `return` edge from the band
  (`from` the last pipeline step or `"builder"`) to the deliver step. Set the
  section's `builderLabel`. *(Branch/return auto-snap to the band's border.)*
- **Other async shapes:** *stream* → one `loop:true` "receives events" step, no band,
  no ticket; *webhook* → a `return` edge from the backend to a "callback received"
  step, no poll loop; *queue* → a `branch` into a band with **no** `return`.
- **Two-lane messages**: two edges between the same two nodes → give them `lane:-1`
  and `lane:1` so they stack.
- Keep labels short (they wrap to 2 lines). Keep 2–4 actors.

## Steps
1. **Learn the product from the real code.** Read the handlers/docs (or ask 1–2
   questions) to identify: the real actors/tiers, **whether there's an
   initialization/handshake at all**, each skill and its **real shape** (sync, or
   which async kind — poll / stream / webhook / queue), and — importantly — the
   **actual request/response and input/output shapes** each step passes. `grep` the
   endpoint/tool handlers for the payloads.
2. **Build the diagram** in the schema above — one section per skill (plus init only
   if it exists), with a `note` and real `data` on each step/message and
   `bidirectional` on true round trips (see "Make it useful"). Don't overfit to
   Lazyweb; use the product's real names, real payloads, and its real async shape.
   Same *structure* as our chart, not the same words.
3. **Save it:** `lazyweb_save_flowchart({ product, diagram })`. Share the returned
   `flowchart_url` so the user can view it, and keep the `flowchart_id`.
4. **Hand off:** proposals are made against this chart — see
   `/lazyweb-propose-ui-changes`, which takes the `flowchart_id`.

## Notes
- Regenerate/save again when the product's real flow changes; proposals pin to a
  chart version so stale ones can be re-anchored.
- One flow chart per product is the norm; keep node `id`s stable across versions.
