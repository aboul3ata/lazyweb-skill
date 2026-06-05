---
name: lazyweb-flows
description: |
  Show real multi-screen user flows from the best apps — onboarding, checkout, paywalls,
  sign-up — as ordered sequences of screenshots, not single screens. Use when the user
  wants to see how an app moves a user THROUGH a flow step by step, or to study a
  competitor's flow. Backed by the Lazyweb flows gateway (lazyweb_get_flows).
  Trigger on: "show me the onboarding flow", "how does X's checkout flow work",
  "signup flow examples", "paywall flow", "step-by-step flow", "user journey for".
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
  - Grep
  - AskUserQuestion
  - Agent
---

# Lazyweb Flows

Real, ordered multi-screen flows from production apps. Where `/lazyweb-quick-references`
shows individual screens, this shows the *sequence* — step 1 → step 2 → step 3 — so the
user can see how a flow actually moves.

## CRITICAL: Output Behavior

**This skill produces FILES, not a plan.** Regardless of plan mode, ALWAYS:

1. Write the HTML report to `.lazyweb/flows/{topic}-{date}/report.html`
2. Download step screenshots to `.lazyweb/flows/{topic}-{date}/references/`
3. Do NOT create `report.md` or write flow content into a plan file
4. After saving, show a summary and where the files are; ask if it looks good
5. If in plan mode, exit plan mode after the user confirms

## Ground the search (run first)

1. **Detect context.** Run `lazyweb-context-detect` (on `PATH` when installed as a
   plugin; otherwise `<plugin-root>/bin/lazyweb-context-detect`) to learn the user's
   platform and product, so you fetch flows for the right kind of app.
2. **Clarify only what's missing.** If the flow type (onboarding, checkout, paywall,
   sign-up…) or the company is unclear, ask ONE AskUserQuestion. Skip what context answered.

## Fetch flows

Call the `lazyweb_get_flows` MCP tool:

```json
{"query": "<flow type, e.g. onboarding>", "company": "<optional company>", "limit": 8}
```

- `query` — the kind of flow (onboarding, checkout, paywall, sign-up, upgrade…).
- `company` — optional, to study one app's flow specifically.
- `limit` — max flows to return (default 8).

Each returned flow has `flowName`, `company`, and ordered `steps[]`, where each step has
an image and a short label. Read step order carefully — the sequence is the point.

**If `lazyweb_get_flows` is not available** (older install, or the flows gateway is not
deployed yet): tell the user "Flows aren't available on this install yet — they ship with
a Lazyweb update." Then fall back to `/lazyweb-quick-references` for the individual screens
of that flow, and continue. Do not fail the skill.

## Download and report

1. Determine the report dir:
   ```bash
   REPORT_DIR="$(pwd)/.lazyweb/flows/{topic-slug}-{YYYY-MM-DD}"
   mkdir -p "$REPORT_DIR/references"
   ```
2. For each flow, download its step images in order, naming them so the order is obvious:
   `{company}-{flow}-step-01.png`, `-step-02.png`, … (`curl -sL "{stepImageUrl}" -o ...`).
3. Write `report.html` (self-contained, inline CSS). Render each flow as a horizontal,
   numbered strip of its steps so the sequence reads left to right:

   ```
   {Company} — {Flow name}
   [1]──▶[2]──▶[3]──▶[4]
   ```

   Caption each step with its label. Group by company. Lead with a 2-3 sentence TL;DR of
   what the strongest flows do well (pacing, number of steps, where they ask for commitment).
4. `open "$REPORT_DIR/report.html"`. Tell the user where it saved; suggest adding
   `.lazyweb/` to `.gitignore`.

## Quality bar

- Preserve step order exactly. A flow shown out of order is worse than no flow.
- A report with 3 complete, correctly-ordered flows beats 10 partial ones.
- Note step counts and where each flow asks for sign-up/payment — that pacing is the
  insight the user is after.
