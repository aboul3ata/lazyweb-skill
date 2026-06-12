---
name: lazyweb-paywall-optimization
route: "Paywall redesign or conversion optimization"
description: |
  Optimize a mobile or web paywall by reading the target screen, diagnosing
  conversion friction, and producing 2-4 falsifiable redesign hypotheses backed
  by Lazyweb paywall references, experiment evidence, conventions, and divergent
  design moves. Use when the user wants to redesign, improve, critique, or
  optimize a paywall screen for paid conversion.
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

# Paywall Optimization

Optimize a paywall with evidence-backed conversion hypotheses, not generic
component advice.

## CRITICAL: Output Behavior

**This skill produces FILES, not a plan.** Regardless of whether you are in plan mode
or not, ALWAYS:

1. Write the HTML report to `.lazyweb/paywall-optimization/{topic}-{date}/report.html`
2. Embed Lazyweb references directly with returned `imageUrl`/`image_url`; save only current-state and web-captured screenshots under `.lazyweb/paywall-optimization/{topic}-{date}/references/`
3. Do NOT create `report.md` or any other Markdown report artifact
4. Do NOT write optimization content into a plan file
5. Publish a shareable link (see "Publish a Shareable Link" below) — automatic, non-blocking
6. After saving, summarize the 2-4 hypotheses, tell the user where the report is,
   and include the shareable link if publishing succeeded
7. Ask the user if the paywall direction looks good
8. If in plan mode, exit plan mode after the user confirms
9. Suggest next steps: "You can now implement the strongest hypothesis, ask
   `/lazyweb-ab-test-research` for deeper experiment mining, or ask `/lazyweb`
   for adjacent design references."

## Publish a Shareable Link (always, right after writing report.html)

Every report is auto-published to lazyweb.com so the user can share it with
teammates. Run this with `$REPORT_DIR` set to `.lazyweb/paywall-optimization/{topic}-{date}`:

```bash
IDEMPOTENCY_KEY="${REPORT_DIR#.lazyweb/}"   # stable per-report key (e.g. paywall-optimization/{topic}-{date}); send the SAME value every attempt so retries dedupe to one link
LAZYWEB_TOKEN=$(cat "$HOME/.lazyweb/lazyweb_mcp_token" 2>/dev/null || true)
if [ -n "$LAZYWEB_TOKEN" ]; then
  # Tier 1 - local install: direct POST (idempotency_key dedupes a re-run)
  python3 - "$REPORT_DIR" "$LAZYWEB_TOKEN" "paywall-optimization" "$IDEMPOTENCY_KEY" <<'PUBLISH_EOF'
import base64, json, pathlib, sys, urllib.error, urllib.request
report_dir, token, skill, idem = pathlib.Path(sys.argv[1]), sys.argv[2], sys.argv[3], sys.argv[4]
version_file = pathlib.Path.home() / ".lazyweb" / "VERSION"
version = version_file.read_text().strip() if version_file.exists() else "0.0.0"
html = (report_dir / "report.html").read_text(encoding="utf-8")
refs = report_dir / "references"
assets = [
    {"name": p.name, "b64": base64.b64encode(p.read_bytes()).decode()}
    for p in (sorted(refs.iterdir()) if refs.is_dir() else [])
    if p.is_file()
]
body = json.dumps({"skill": skill, "version": version, "html": html, "assets": assets, "idempotency_key": idem}).encode()
req = urllib.request.Request(
    "https://www.lazyweb.com/api/reports",
    data=body,
    headers={"Content-Type": "application/json", "Authorization": f"Bearer {token}"},
)
try:
    resp = json.loads(urllib.request.urlopen(req, timeout=90).read())
    print(f"SHAREABLE_URL: {resp['url']}")
except urllib.error.HTTPError as exc:
    print(f"PUBLISH_FAILED: {exc.code} {exc.read().decode()[:500]}")
except Exception as exc:
    print(f"PUBLISH_SKIPPED: {exc}")
PUBLISH_EOF
else
  # Tier 2 - no local token (hosted/cloud agent): publish via the MCP tool (see below)
  echo "PUBLISH_VIA_MCP_TOOL idempotency_key=$IDEMPOTENCY_KEY report_dir=$REPORT_DIR"
fi
```

**Exactly one tier runs - never both.**

- Tier 1 `SHAREABLE_URL:` - include the link: "Shareable link: {url} (unlisted - anyone with the link can view)".
- Tier 1 `PUBLISH_FAILED: 400 ...` - the body names what is unhostable (e.g. `missing_assets`). Fix the report and re-run the publish ONCE.
- Tier 1 `PUBLISH_SKIPPED:` - say nothing; the local report stands (the user has the file).
- Tier 2 `PUBLISH_VIA_MCP_TOOL ...` - you have no local token (hosted session), so publish with the Lazyweb MCP tool instead:
  1. Size-check first: if `report.html` plus the `references/` files together exceed ~7MB, do NOT call the tool - tell the user the report was too large to publish from a hosted session (it is saved locally) and stop.
  2. Otherwise call `lazyweb_publish_report` with: `html` = the contents of `report.html`; `assets` = each `references/` file as `{"name": <filename>, "b64": <base64 of the bytes>}`; `report_skill` = "paywall-optimization"; `idempotency_key` = the value printed after `idempotency_key=`.
  3. On `{ ok: true, url }` -> show "Shareable link: {url} (unlisted - anyone with the link can view)".
  4. On `{ ok: false }` -> tell the user publishing failed and why (the `error` field); the report is saved locally. If `code` is `REPORT_VALIDATION_ERROR` and `detail` names missing assets, fix and call ONCE more; otherwise do not retry.
  Unlike Tier 1, do NOT stay silent on a Tier-2 failure - a hosted user has no local file to fall back on, so they need the link or the reason.

### Hosting-safe HTML (the template already complies — keep it that way)

The hosted copy is served byte-for-byte, so the report must only use:
- inline CSS and inline `<script>` — never an external `<script src=...>`
- images via the absolute `imageUrl`/`image_url` URLs Lazyweb returns, or
  relative `references/{filename}` paths for locally saved screenshots
- no `file://` URLs and no absolute local paths (`/Users/...`, `C:\...`)

## When to Use This

- User wants to improve, redesign, optimize, critique, or evaluate a paywall
- User has a paywall screenshot, URL, product brief, or current paywall copy
- User asks how to increase paid conversion, trial starts, annual-plan share, or checkout continuation from a paywall
- User asks for concrete paywall redesign hypotheses, not just a broad A/B test corpus search

## When NOT to Use This

- User asks only for A/B test examples, experiment IDs, or monetization research -> route to `lazyweb-ab-test-research`
- User wants generic pricing-page references outside an app paywall -> route to `lazyweb-design-research` or `lazyweb-quick-references`
- User wants creative UI ideas unrelated to conversion -> route to `lazyweb-design-brainstorm`

## Lazyweb MCP Setup

Use hosted Lazyweb MCP tools at `https://www.lazyweb.com/mcp` for database-backed evidence. First list the available tools and run `lazyweb_health`.

Required public tools:
- `lazyweb_health` - verify Lazyweb MCP connectivity
- `lazyweb_ab_test_research` - retrieve and synthesize paywall/conversion experiment evidence
- `lazyweb_search` - find paywall references and convention examples
- `lazyweb_compare_image` - find visually similar screens when the target paywall image is available as `image_base64` + `mime_type` or `image_url`
- `lazyweb_find_similar` - expand from a strong Lazyweb result by passing its returned `imageUrl`
- `lazyweb_get_flows` - optional ordered paywall, checkout, upgrade, or onboarding journeys

**Pass `skill: "paywall-optimization"` on every call.** Include `"skill": "paywall-optimization"` in the arguments of each `lazyweb_*` tool call — for example `{"query": "pricing page", "limit": 30, "skill": "paywall-optimization"}`. This is optional analytics metadata Lazyweb uses to understand which skills are used; never drop or change a real argument for it.

**Also pass `version: "<x.y.z>"` on every call.** Read `~/.lazyweb/VERSION` once per session at skill start (e.g. `cat "$HOME/.lazyweb/VERSION" 2>/dev/null || echo 0.0.0`); fall back to `"0.0.0"` if the file is missing or unreadable — never block on this. Include `"version": "<that-value>"` in the arguments of every `lazyweb_*` tool call alongside the existing `skill` arg — for example `{"query": "pricing page", "limit": 30, "skill": "paywall-optimization", "version": "0.4.5"}`. Optional analytics metadata Lazyweb uses to track which skill-pack versions are running; never drop or change a real argument for it.

If Lazyweb MCP is not installed or auth fails, tell the user: "Lazyweb MCP is
not installed. Run `curl -fsSL https://www.lazyweb.com/install.sh | bash`,
reload this client, then rerun this skill." Continue with web research only if
the user wants a degraded fallback.

The public A/B wrapper is included free. If `lazyweb_ab_test_research` is
available, call it directly and use the returned experiment evidence. If the
tool is unavailable or returns no matching experiments, clearly label the report
as reference-grounded but not experiment-backed, then continue with Lazyweb
visual references.

## Ground the Paywall

Before searching, establish the target:

1. Run `lazyweb-context-detect` when available to infer project, platform, and stack.
2. Capture or read the target paywall. Prefer an actual screenshot or URL over prose. If the target is a local app, capture the current screen. If the target is remote, use the provided image or URL.
3. Ask one concise question only when the product, platform, conversion goal, or target screen is missing and cannot be inferred.

Read the paywall first. Identify:
- Components present: header, hero, benefits, pricing, CTAs, trust signals, FAQ, footer, close/skip affordance
- Layout pattern: full-screen, bottom sheet, single-column stack, comparison grid, plan cards, checkout step, interstitial
- Strategic moves: anchoring, trial framing, urgency, social proof, risk reversal, tier framing, locked-feature framing
- Offer: trial vs no trial, single vs multi-tier, intro price vs flat price, annual vs monthly emphasis
- User state: cold first session, warm feature wall, post-onboarding, checkout continuation, cancellation save, or upgrade moment

## Evidence Workflow

Use multiple evidence angles:

1. **Visual references (grounding).** Run 3-5 `lazyweb_search` queries for paywalls matching the product category, user state, conversion goal, and layout. Read `visionDescription` before using a result. These references ground the redesign — they show the conventions THIS paywall should or should not adopt.
2. **Experiment evidence (validation).** Call `lazyweb_ab_test_research` with the category as the industry filter, plus conversion goal, constraints, and target paywall description or image URL. Include the product name only as target context, not as an exact company filter. Use the tool to **validate or challenge** a hypothesis you already formed from reading THIS paywall — not as the starting point. Treat learnings as directional (screenshot-diff, not measured lift). If the corpus has no on-context experiment, say so and proceed on reference + convention grounding.
3. **Visual similarity.** If the target image is available and `lazyweb_compare_image` is exposed, retrieve structurally similar paywalls.
4. **Flows.** If the question depends on sequencing, call `lazyweb_get_flows` for paywall, checkout, onboarding, upgrade, or cancellation journeys.
5. **Divergent moves.** Search outside the obvious category when the user asks for bolder options. Extract the mechanism, not the literal design.

Use `high_design_bar: true` only when the live schema exposes it and the user asks for premium, stronger, high-design-bar, best-designed, or visually stronger examples.

**Search discipline:** never repeat an identical `lazyweb_search` query — results are deterministic; page deeper with `offset` and follow `pagination.next_offset`. On `no_matches`/`low_coverage` warnings, use the closest result or note the coverage gap — don't rephrase the same concept in a loop. On `company_not_in_library`, use a suggested company or drop the filter.

## Hypothesis grounding (required)

Every hypothesis must be anchored to the TARGET paywall's own read — the specific conventions it is missing or mis-using, and a named friction on *this* screen — not to the experiment corpus. Experiment evidence may support a hypothesis, but the hypothesis originates from "what is wrong or under-leveraged on THIS paywall," established in "Read the paywall first" above.

## Optimization Framework

The unit of analysis is a hypothesis, not a component list.

A good hypothesis takes this form:

> Making [specific change] should [specific conversion outcome] because [specific mechanism].

Good:
"Replacing the flat plan list with a comparison grid that highlights what is
locked at the monthly tier should lift annual-plan share because users see what
they lose by choosing monthly."

Bad:
"Improve the pricing UX."
"Add social proof to enhance conversion."

Propose 2-4 hypotheses. Each one must:
- Name the specific conversion metric it should move
- Describe the concrete screen change well enough to implement
- Address a named conversion friction
- Cite experiment evidence or visual/convention evidence
- Be meaningfully different from the other hypotheses
- Be falsifiable

Hard rules:
- Do not recommend a convention the user's paywall already uses unless the recommendation changes how it is used.
- Do not propose unmotivated visual polish.
- Do not write two hypotheses with the same mechanism.
- Do not claim measured lift unless the Lazyweb evidence explicitly provides it.
- Treat experiment learning text as directional unless the tool returns validated performance data.
- **Anti-hybrid checksum.** Before writing each hypothesis, confirm it answers "what would you change about THIS paywall, and why" — not "what did experiment X test." If a hypothesis reads as a summary of an experiment rather than a change to the target screen, rewrite it. The report is a paywall redesign, not an experiment digest.

## HTML Report Contract

Create a polished, scannable, LIGHT-themed HTML report (matching `lazyweb-design-research`), in this section order — the hypotheses lead; evidence supports them, it does not lead:

1. **Agent Instructions** (section #1 — see Report essentials below).
2. **Target paywall read:** screenshot/mock-frame, components, layout, offer, user state, and current friction.
3. **2-4 hypothesis cards:** title, hypothesis sentence ("Making [change] should [outcome] because [mechanism]"), expected metric, implementation changes, supporting evidence, and risk. Each card MUST embed a `.deck` snap-carousel of the 1-3 Lazyweb reference screenshots that prove its supporting evidence, inline under the evidence line (never a "see Section 5" pointer), plus an `.ebadge` strength label. This is the core — it comes before the evidence summary.
4. **Convention check** as a 3-column table: Already has · Missing · Unusual.
5. **Evidence summary** (AFTER the hypotheses): visual references, experiment evidence used, similar screens, flow context. Each reference card shows company/product, screen context, why it matters, and source ([Lazyweb] / [Web] / target product).
6. **Divergent options:** optional bolder mechanisms that transfer from adjacent categories.
7. **Prioritization:** rank hypotheses by expected impact, implementation effort, evidence strength, and brand/product fit.

A hypothesis card may include one HTML/CSS **mock-frame** (mobile/desktop) when no screenshot illustrates the proposed change — never ASCII art.

### Report essentials

#### A. Agent Instructions — report section #1

One plain human sentence, then a copy-pastable block written FOR A DOWNSTREAM CODING AGENT:

```html
<section id="agent-instructions" class="agent-instructions">
  <div class="ai-head"><span class="ai-badge">FOR THE CODING AGENT</span>
    <button class="ai-copy" type="button" onclick="
      var sec=this.closest('.agent-instructions'); var txt=sec.querySelector('.ai-block').innerText;
      var done=function(ok){this.textContent=ok?'Copied':'Press Cmd/Ctrl+C';setTimeout(function(){this.textContent='Copy';}.bind(this),1500);}.bind(this);
      if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(txt).then(function(){done(true);},function(){done(false);});}
      else{var r=document.createRange();r.selectNodeContents(sec.querySelector('.ai-block'));var s=getSelection();s.removeAllRanges();s.addRange(r);try{document.execCommand('copy');done(true);}catch(e){done(false);}}">Copy</button>
  </div>
  <p class="ai-human">{one human sentence: the strongest hypothesis to ship first}</p>
  <pre class="ai-block">{COPY BLOCK — fill from this report}</pre>
</section>
```

Copy-block text (keep these exact labels; fill `{REPORT_PATH}` with the absolute path of the report.html you wrote):

```
LAZYWEB REPORT — AGENT HANDOFF
Use the report at {REPORT_PATH} as a starting point for {TASK}.

TOP RECOMMENDATIONS (do first):
1. {hypothesis 1, one imperative line}
2. {hypothesis 2}
3. {hypothesis 3}

INDEX ON: {the frictions on THIS paywall the strongest hypotheses attack}
DO NOT OVER-INDEX ON: {directional-not-measured experiment learnings, off-category references}
DIVE FURTHER: {next Lazyweb skill or MCP tool} — {why}

Evidence basis: {Lazyweb paywall references + A/B experiments} · {DATE}
```

For THIS skill, `{TASK}` = "redesigning THIS paywall to lift {goal}, starting from the strongest hypothesis below", and `DIVE FURTHER` → "`/lazyweb-ab-test-research` to validate a hypothesis against the experiment corpus, or `/lazyweb-design-research` for adjacent paywall conventions".

#### B. Conciseness & "show, don't tell"

No length target. Lead with value (Agent Instructions + the strongest hypothesis). Show, don't tell — make the case with paywall reference screenshots (Lazyweb `imageUrl`) and, where relevant, A/B control/variant images or a mock-frame, not paragraphs. Index each hypothesis on the named friction + the specific reference/experiment that supports it.

#### C. HTML / styling (LIGHT theme)

Single HTML file, inline CSS (no external deps; the one inline `onclick` copy handler is allowed). White background, system fonts, `max-width:900px`, light borders, `#f6f8fa` table headers, semantic HTML. Include the shared CSS below in `<style>`; Agent Instructions is the first section styled as the light-blue callout. Open in the browser: `open "$REPORT_DIR/report.html"`.

```css
:root{--ink:#1f2328;--mut:#57606a;--line:#d0d7de;--soft:#eef4fb;--accent:#0969da}
body{font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;color:var(--ink);background:#fff;max-width:900px;margin:0 auto;padding:40px 22px}
table{border-collapse:collapse;width:100%;font-size:14px}th,td{border:1px solid var(--line);padding:7px 9px}th{background:#f6f8fa;text-align:left}
.agent-instructions{background:var(--soft);border-left:4px solid var(--accent);border-radius:8px;padding:14px 16px;margin:18px 0}
.ai-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:8px}
.ai-badge{font-size:11px;font-weight:700;letter-spacing:.04em;color:#0a3b78}
.ai-copy{font:600 12px/1 inherit;cursor:pointer;border:1px solid var(--accent);color:var(--accent);background:#fff;border-radius:6px;padding:5px 11px}.ai-copy:hover{background:var(--accent);color:#fff}
.ai-human{margin:0 0 10px;font-size:15px}
.ai-block{white-space:pre-wrap;word-break:break-word;background:#fff;border:1px solid var(--line);border-radius:6px;padding:12px 13px;margin:0;font:13px/1.5 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;color:var(--ink);user-select:all}
.mock{margin:14px 0}.mock .frame{border:1px solid var(--line);border-radius:14px;background:#fff;overflow:hidden}.mock.mobile .frame{max-width:300px;border-radius:26px;border:8px solid #1f2328}.mock.desktop .frame{max-width:760px}
.mock .body{padding:14px;display:flex;flex-direction:column;gap:10px}.mock .box{background:var(--soft);border:1px dashed #b9c7d6;border-radius:8px;min-height:34px;display:flex;align-items:center;justify-content:center;color:#4a5a6a;font-size:12px;padding:8px}.mock .box.cta{background:var(--accent);border:0;color:#fff;font-weight:600}.mock .row{display:flex;gap:10px}.mock .row>.box{flex:1}.mock .cap{font-size:12px;color:var(--mut);margin-top:6px;text-align:center}
```

## Operating principles & evidence components (REQUIRED - overrides convenience)

The canonical operating principles and the reusable evidence/report components (`.deck` carousel, `.legend` + `.rec` cards, `.ebadge`/`.corpus` honesty labels, `.flip` control/variant, `.mock` mock-frame) live in **`../_shared/operating-principles.md`** (relative to this skill's directory). Read that file and apply it verbatim — it is the single source of truth shared by every report-producing Lazyweb skill. Do not re-inline or fork it here.
