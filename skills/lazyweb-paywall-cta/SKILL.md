---
name: lazyweb-paywall-cta
route: "Rewrite one paywall CTA"
router-terms: paywall cta, primary cta, cta copy, cta button, button copy, paywall button, rewrite cta, stress-test cta, stress test cta, cta text, call to action
description: |
  Critique and rewrite a paywall primary CTA (and adjacent microcopy) by
  reading the target screen, diagnosing CTA-level conversion friction, and
  producing ranked CTA candidates backed by Lazyweb's paywall CTA corpus,
  real before/after A/B observations, and divergent mechanism examples. Use
  when the user wants to evaluate, rewrite, or stress-test a paywall CTA —
  not a full paywall redesign.
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

# Paywall CTA Optimization

Rewrite or stress-test a paywall primary CTA with mechanism-backed
alternatives, not generic copy advice.

## CRITICAL: Output Behavior

**This skill produces FILES, not a plan.** Regardless of whether you are in plan
mode or not, ALWAYS:

1. Write the HTML report to `.lazyweb/paywall-cta/{topic}-{date}/report.html`
2. Embed Lazyweb references directly with returned `imageUrl` / `image_url`;
   save only the current-state screenshot under
   `.lazyweb/paywall-cta/{topic}-{date}/references/`
3. Do NOT create `report.md` or any other Markdown report artifact
4. Do NOT write the CTA content into a plan file
5. After saving, summarize the top recommended CTA + 3-5 ranked alternatives and
   tell the user where the report is
6. Ask the user which direction looks right
7. If in plan mode, exit plan mode after the user confirms
8. Suggest next steps: "Ship the strongest candidate as an A/B test against the
   current CTA, or ask `/lazyweb-optimize-paywall` for a full paywall
   redesign, or `/lazyweb-ab-test-research` for deeper experiment mining."

## When to Use This

- User wants to rewrite, evaluate, or stress-test ONE paywall CTA
- User has the paywall screenshot, the current CTA copy, and a clear
  conversion goal (paid start, trial start, plan select, upgrade, win-back)
- User asks "is this CTA right?" or "give me 5 better CTAs" or
  "what should this button say?"

## When NOT to Use This

- Full paywall redesign / layout / pricing rework → route to `lazyweb-optimize-paywall`
- Onboarding / signup / non-paywall CTAs → route to `lazyweb-deep-design-research` or `lazyweb-lite-design-research`
- "Find me A/B experiments about pricing copy" → route to `lazyweb-ab-test-research`

## Lazyweb MCP Setup

Use hosted Lazyweb MCP tools at `https://www.lazyweb.com/mcp` for
database-backed evidence. First list the available tools and run
`lazyweb_health`.

Required public tools:
- `lazyweb_health` — verify Lazyweb MCP connectivity
- `lazyweb_paywall_cta_research` — the core retrieval for this skill. Returns the CTA framework SOP plus the corpus slice, divergent examples, convention stats, brand-own references, and the broad pool of CTA-changed A/B observations the agent curates into "Strongest Matches."
- `lazyweb_search_ab_tests` — mobile-only broader paywall A/B evidence when the user asks "what experiments have shipped on this?"
- `lazyweb_search` — visual paywall references and convention examples
- `lazyweb_compare_image` — visual similarity over the user's paywall image

**Search discipline:** never repeat an identical `lazyweb_search` query — results are deterministic; page deeper with `offset` and follow `pagination.next_offset`. On `no_matches`/`low_coverage` warnings, use the closest result or note the coverage gap — don't rephrase the same concept in a loop. On `company_not_in_library`, use a suggested company or drop the filter.

**Pass `skill: "paywall-cta"` on every call.** Include `"skill": "paywall-cta"` in the arguments of each `lazyweb_*` tool call — for example `{"query": "pricing page", "limit": 30, "skill": "paywall-cta"}`. This is optional analytics metadata Lazyweb uses to understand which skills are used; never drop or change a real argument for it.

**Also pass `version: "<x.y.z>"` on every call.** Read `~/.lazyweb/VERSION` once per session at skill start (e.g. `cat "$HOME/.lazyweb/VERSION" 2>/dev/null || echo 0.0.0`); fall back to `"0.0.0"` if the file is missing or unreadable — never block on this. Include `"version": "<that-value>"` in the arguments of every `lazyweb_*` tool call alongside the existing `skill` arg — for example `{"query": "pricing page", "limit": 30, "skill": "paywall-cta", "version": "0.4.5"}`. Optional analytics metadata Lazyweb uses to track which skill-pack versions are running; never drop or change a real argument for it.

If Lazyweb MCP is not installed or auth fails, tell the user: "Lazyweb MCP is
not installed. Run `curl -fsSL https://www.lazyweb.com/install.sh | bash`,
reload this client, then rerun this skill." Continue with web research only if
the user wants a degraded fallback.

The CTA wrapper is included free. If `lazyweb_paywall_cta_research` is
available, call it directly and use the returned CTA evidence. If the tool is
unavailable or returns no matching examples, clearly label the coverage gap and
continue with `lazyweb_search` / `lazyweb_compare_image` visual references.

## Read the paywall first

Before searching, establish the target:

1. Run `lazyweb-context-detect` when available to infer project, platform, and stack.
2. Capture or read the target paywall. Prefer an actual screenshot. **Always
   capture / record the verbatim current primary CTA copy** — paraphrasing it
   loses information the corpus needs.
3. Identify:
   - **Primary goal**: first paid conversion vs trial start vs plan select vs win-back
   - **User state**: cold (first session) vs warm (engaged, gated) vs upgrade moment
   - **Offer**: trial vs no-trial, single vs multi-tier, intro price vs flat
   - **What's actually being sold**: is the paid TIER named on the screen
     (Premium, Plus, Pro, Go+)? Is a paid benefit named (ad-free, offline,
     unlimited)? If neither, the CTA must reference a generic paid-tier word,
     never the brand name when the brand is already free.
4. Ask ONE concise question only when the screen goal, plan structure, or
   user state is missing and cannot be inferred.

## Evidence Workflow

Call `lazyweb_paywall_cta_research` ONCE with the full context. It returns
all evidence the skill needs in a single payload:

- `process_sop` — the encoded CTA framework
- `evidence_examples` — Jaccard-ranked corpus rows (text-similar to current CTA)
- `divergent_examples` — creative outliers (most UNlike the current CTA)
- `creative_long_tail_phrases` — compact singleton list for mechanism scan
- `cta_experiments` — broad pool of real before/after CTA A/B observations
- `brand_own_examples` — CTAs from the user's OWN brand (voice reference, NOT to recommend)
- `conventions` — top phrases, bigrams, per-flow top phrases
- `images` — signed-URL gallery

Use the corpus as a **mechanism library**, not a text catalog:
- `top_exact_phrases` / `top_bigrams` — median copy the LLM already knows. Sanity check only; never recommend as discoveries.
- `divergent_examples` / `creative_long_tail_phrases` — **departures** that encode hypotheses. Identify the mechanism, decide if it transfers, reformulate in this product's voice.
- `cta_experiments` — curate ~10 Strongest Matches by IDEA (not lexical overlap). AFTER must be interesting. The 10 picks must be DIVERGENT from each other.

When the user asks for broader paywall A/B evidence (mechanism context outside
CTA-only copy), call `lazyweb_search_ab_tests`. Treat learnings as
directional, not measured lift.

## Critique framework

Combine the screen read with corpus evidence:

- **Alignment with peer convention**: conventional / adjacent / differentiated
- **Clarity of action**: high / medium / low — is the action obvious at a glance?
- **Specificity of value**: high / medium / low — does the CTA convey what the user gets?
- **Offer match**: matches / partial / mismatch — implying trial when there isn't one is mismatch
- **Score**: 0.0–1.0 overall fitness
- **Strengths** (1-3, specific): what the current CTA does well and why
- **Weaknesses** (1-3, actionable): concrete problems

## Propose alternatives — hypothesis-driven

Each candidate CTA must be:
- **Mechanism-led** — names the mechanism it bets on (outcome framing, price anchor, pain reframe, activity-led, benefit noun, urgency, branded-tier verb)
- **Tier-honest** — references the paid TIER or benefit, never "Try [free brand] free"
- **Falsifiable** — paired with the specific weakness in the current CTA it attacks
- **Distinct** — no two candidates share a mechanism

Output 3-5 candidates, ranked by Confidence × Impact × Differentiation
(same anchored rubric the paywall report uses) with a Total score.

Hard rules:
- Do not recommend a CTA the user is already running unless you redefine its mechanism.
- Do not propose unmotivated emoji or punctuation flourishes.
- Do not claim measured lift unless the experiment evidence explicitly provides it.
- Treat experiment learning text as directional unless the tool returns validated performance data.

## HTML Report Contract

Create a polished, scannable, LIGHT-themed HTML report in this section order:

1. **Agent Instructions** (section #1 — see Report essentials).
2. **Read the paywall:** screenshot of the user's Current paywall, verbatim current CTA, components, user state, offer, named friction on the CTA.
3. **Current CTA critique table:** alignment / clarity / specificity / offer-match / score / strengths / weaknesses.
4. **Ranked CTA candidates (3-5):** title (the candidate copy), mechanism, expected metric, when-it-works condition, supporting evidence (mini `.deck` of 1-2 corpus rows OR experiment before/after pair), and a `.ebadge` strength label. Sort by Total score desc.
5. **Strongest Matches table** (~10 curated `cta_experiments` rows): BEFORE → AFTER, company, 1-sentence learning_summary, "why it matters to THIS CTA".
6. **Best CTA Directions To Test:** 5 abstracted patterns the matches converge on, each with a WHEN-IT-WORKS condition.
7. **Top Recommendation:** pick ONE candidate to test first, with the A/B sentence ("Replacing `<current>` with `<candidate>` should lift `<metric>` because `<mechanism>`").
8. **Convention check** as a 3-column table: Already uses · Missing · Unusual.
9. **Evidence summary** (AFTER hypotheses): the corpus rows, divergent examples, experiment cards used as evidence.

A candidate card may include an inline `.mock-cta` block (the candidate text
rendered as a primary button) — never ASCII art.

### Report essentials

#### A. Agent Instructions — report section #1

One plain human sentence, then a copy-pastable block written FOR A DOWNSTREAM
CODING AGENT:

```html
<section id="agent-instructions" class="agent-instructions">
  <div class="ai-head"><span class="ai-badge">FOR THE CODING AGENT</span>
    <button class="ai-copy" type="button" onclick="
      var sec=this.closest('.agent-instructions'); var txt=sec.querySelector('.ai-block').innerText;
      var done=function(ok){this.textContent=ok?'Copied':'Press Cmd/Ctrl+C';setTimeout(function(){this.textContent='Copy';}.bind(this),1500);}.bind(this);
      if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(txt).then(function(){done(true);},function(){done(false);});}
      else{var r=document.createRange();r.selectNodeContents(sec.querySelector('.ai-block'));var s=getSelection();s.removeAllRanges();s.addRange(r);try{document.execCommand('copy');done(true);}catch(e){done(false);}}">Copy</button>
  </div>
  <p class="ai-human">{one human sentence: the strongest CTA to ship first + why}</p>
  <pre class="ai-block">{COPY BLOCK — fill from this report}</pre>
</section>
```

Copy-block text (keep these exact labels; fill `{REPORT_PATH}` with the absolute path of the report.html you wrote):

```
LAZYWEB CTA REPORT — AGENT HANDOFF
Use the report at {REPORT_PATH} to rewrite the paywall CTA.

CURRENT CTA: "{current_cta_verbatim}"
SHIP THIS NEXT: "{top_recommended_cta}"
MECHANISM: {one-line mechanism}
WHY THIS BEATS CURRENT: {one line tying mechanism to the current CTA's weakness}

RUNNERS-UP (rank order):
1. "{candidate 2 copy}" — {mechanism}
2. "{candidate 3 copy}" — {mechanism}
3. "{candidate 4 copy}" — {mechanism}

A/B FRAMING:
Replacing "{current}" with "{top_recommended}" should lift {metric} because {mechanism}.

DO NOT OVER-INDEX ON: median corpus phrases, brand-name CTAs when the brand is already free, generic verbs without an offer/benefit referent.
DIVE FURTHER: `/lazyweb-optimize-paywall` for a full paywall redesign, `/lazyweb-ab-test-research` for deeper experiment mining.

Evidence basis: {Lazyweb paywall CTA corpus + curated A/B observations} · {DATE}
```

#### B. Conciseness & "show, don't tell"

No length target. Lead with value (Agent Instructions + the top recommended CTA). Show, don't tell — make the case with corpus screenshots, before/after A/B pairs, or a `.mock-cta` rendering of the candidate, not paragraphs. Index each candidate on the mechanism + specific corpus / experiment row that supports it.

#### C. HTML / styling (LIGHT theme)

Single HTML file, inline CSS (no external deps; the one inline `onclick` copy
handler is allowed). White background, system fonts, `max-width:900px`, light
borders, `#f6f8fa` table headers, semantic HTML. Include the shared CSS below
in `<style>`; Agent Instructions is the first section styled as the light-blue
callout. Open in the browser: `open "$REPORT_DIR/report.html"`.

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
/* Mock CTA button for rendering candidate copy */
.mock-cta{display:inline-block;background:var(--accent);color:#fff;font:700 14px/1.1 inherit;border-radius:8px;padding:12px 24px;margin:6px 0}
.mock-cta.secondary{background:#fff;color:var(--accent);border:1.5px solid var(--accent)}
/* Standard evidence components reused from optimize-paywall skill: .deck, .pat, .prev, .tag, .verdict, .ebadge, .corpus, .flip — include the CSS block from lazyweb-optimize-paywall SKILL.md verbatim in <style>. */
.lw-foot{margin-top:34px;padding-top:14px;border-top:1px solid var(--line);text-align:center;font-size:13px;color:var(--mut)}
```

### Report footer (REQUIRED — the very last element of the report)

End every report with this footer:

```html
<footer class="lw-foot">Powered by <a href="https://www.lazyweb.com">Lazyweb</a> — turn your agent into a design researcher… for free!</footer>
```
