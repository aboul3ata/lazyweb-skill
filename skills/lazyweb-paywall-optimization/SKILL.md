---
name: lazyweb-paywall-optimization
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
5. After saving, summarize the 2-4 hypotheses and tell the user where the report is
6. Ask the user if the paywall direction looks good
7. If in plan mode, exit plan mode after the user confirms
8. Suggest next steps: "You can now implement the strongest hypothesis, ask
   `/lazyweb-ab-test-research` for deeper experiment mining, or ask `/lazyweb`
   for adjacent design references."

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
- `lazyweb_ab_test_research` - retrieve and synthesize paywall/conversion experiment evidence when paid access is available
- `lazyweb_search` - find paywall references and convention examples
- `lazyweb_compare_image` - find visually similar screens when the target paywall image is available as `image_base64` + `mime_type` or `image_url`
- `lazyweb_find_similar` - expand from a strong Lazyweb result by passing its returned `imageUrl`
- `lazyweb_get_flows` - optional ordered paywall, checkout, upgrade, or onboarding journeys

If Lazyweb MCP is not installed or auth fails, tell the user: "Lazyweb MCP is
not installed. Run `curl -fsSL https://www.lazyweb.com/install.sh | bash`,
reload this client, then rerun this skill." Continue with web research only if
the user wants a degraded fallback.

The public A/B wrapper is paid. If `lazyweb_ab_test_research` returns
`ab_test_subscription_required`, include the returned paid-access details, then
continue with free Lazyweb visual references and clearly label the report as
reference-grounded but not experiment-backed.

### Locked-evidence rendering (when paid access is missing)

When `lazyweb_ab_test_research` returns `ab_test_subscription_required` — OR when
no Pro entitlement is available — **still emit the full HTML report**. Do NOT
skip sections or refuse to write the file. Instead, render a locked placeholder
(`.locked-ref`, defined in HTML / styling below) in EVERY image slot **except**
the user's Current paywall screenshot. That means:

- **Unblurred (1 image only):** the Current/target paywall under "Target
  paywall read" — this is the user's own screen, never gate it.
- **Locked (every other image):** all Lazyweb reference deck figures, every
  hypothesis card evidence carousel, all control/variant `.flip` pairs, every
  `.rec-proof` proof image, every evidence-summary card. Replace the `<img>`
  with a `<a class="locked-ref" href="https://www.lazyweb.com/monetization"
  target="_blank" rel="noopener">` block, sized to the SAME dimensions as the
  Current screenshot (or the natural container slot it would occupy).
- The locked tile shows a centered lock icon + "Upgrade to Lazyweb Pro to
  unlock this skill" caption and links to
  `https://www.lazyweb.com/monetization` on click.
- Captions, deck navigation, prevalence chips, and verdict badges still render
  underneath the locked tile. Hypotheses, recommendations, and prose still
  render in full — only the evidence VISUALS are blurred-locked.

When in locked-evidence mode, prepend the report (right after Agent
Instructions) with a `.lock-banner` strip explaining the state in one line and
linking to the same upgrade URL.

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
2. **Experiment evidence (validation).** Call `lazyweb_ab_test_research` with the product, category, conversion goal, constraints, and target paywall description or image URL. Use it to **validate or challenge** a hypothesis you already formed from reading THIS paywall — not as the starting point. Treat learnings as directional (screenshot-diff, not measured lift). If the corpus has no on-context experiment, say so and proceed on reference + convention grounding.
3. **Visual similarity.** If the target image is available and `lazyweb_compare_image` is exposed, retrieve structurally similar paywalls.
4. **Flows.** If the question depends on sequencing, call `lazyweb_get_flows` for paywall, checkout, onboarding, upgrade, or cancellation journeys.
5. **Divergent moves.** Search outside the obvious category when the user asks for bolder options. Extract the mechanism, not the literal design.

Use `high_design_bar: true` only when the live schema exposes it and the user asks for premium, stronger, high-design-bar, best-designed, or visually stronger examples.

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
/* Locked-evidence tile + banner — render when paid access is missing. */
.lock-banner{display:flex;align-items:center;gap:10px;background:linear-gradient(135deg,#0d1117 0%,#1f2933 100%);color:#fff;border-radius:10px;padding:12px 16px;margin:14px 0;text-decoration:none}
.lock-banner .lb-ico{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,.12);flex:0 0 30px}
.lock-banner .lb-txt{font-size:13.5px;line-height:1.4;flex:1}.lock-banner .lb-txt b{color:#7dc4ff}
.lock-banner .lb-cta{font:700 12px/1 inherit;color:#0d1117;background:#7dc4ff;border-radius:6px;padding:8px 12px;white-space:nowrap}
.lock-banner:hover .lb-cta{background:#a4d6ff}
.locked-ref{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;height:100%;min-height:200px;background:#0d1117;border:1px solid var(--line);border-radius:10px;overflow:hidden;text-decoration:none;color:#fff;cursor:pointer;padding:24px 18px;text-align:center;box-sizing:border-box}
.locked-ref-blur{position:absolute;inset:0;background:repeating-linear-gradient(135deg,#1f2328 0,#1f2328 8px,#2a3138 8px,#2a3138 16px,#384149 16px,#384149 24px,#2a3138 24px,#2a3138 32px);filter:blur(10px) saturate(.55);opacity:.55;z-index:0}
.locked-ref-lock{position:relative;z-index:1;display:flex;align-items:center;justify-content:center;width:56px;height:56px;border-radius:50%;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);margin-bottom:10px;backdrop-filter:blur(6px)}
.locked-ref-cta{position:relative;z-index:1;font:700 13px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#fff;letter-spacing:.01em;text-shadow:0 1px 4px rgba(0,0,0,.4);max-width:230px;margin:0 0 4px}
.locked-ref-sub{position:relative;z-index:1;font:500 11px/1.4 inherit;color:#a7c5e3;letter-spacing:.02em}
.locked-ref:hover .locked-ref-cta{color:#7dc4ff}
.locked-ref:hover .locked-ref-lock{background:rgba(125,196,255,.18);border-color:rgba(125,196,255,.4)}
/* Make locked tiles inherit the host frame's aspect — deck figure, flip card, rec-proof. */
.deck>figure.locked-figure{aspect-ratio:9/16;padding:0;background:#0d1117}
.deck>figure.locked-figure .locked-ref{border:0;border-radius:0;min-height:100%}
.flip>figure.locked-figure .locked-ref{aspect-ratio:9/16}
.rec-proof.locked-proof{padding:0}
.rec-proof.locked-proof .locked-ref{min-height:100%;border:0;border-radius:0}
```


## Operating principles & evidence components (REQUIRED - overrides convenience)

## Operating principles (apply to every report you write)

These four rules override convenience. A report that breaks them is non-conforming, even if every section is present.

**1. Show, don't tell — every claim carries its proof.**
Any assertion — a pattern, anti-pattern, idea, hypothesis, "what's working" item, convention check, recommendation, or A/B learning — must render the real screenshot(s) or experiment that demonstrate it, *beside the claim*, never a scroll away. When more than one reference backs a claim, render them as a **`.deck` snap-carousel** — a horizontally-scrolling strip that snaps card-to-card with ◀ ▶ prev/next buttons — so the reader can step through the proof, never hidden behind a prose list or a "see Section 5" pointer. Prevalence words ("most", "near-universal", "dominant") must be backed by a shown count ("5 of 9 references"), never an adjective alone.

**2. Be opinionated; carry the decision.**
Lead with ONE ranked recommended path, marked as the lead pick (`.lead` ribbon) in the *human-visible body* — not only in the agent copy block. Tag every other option Do / Explore / Skip (or P0/P1/P2) with a one-line "skip if". No ties among top picks; no flat undifferentiated menu. The "Skip" rows must link to the evidence (e.g. the anti-pattern screenshot) so the skip decision is shown, not just asserted.

**3. Maximize confidence with evidence + data.**
Back each recommendation with what worked for OTHER apps (real screenshots) PLUS supporting data: a prevalence count across the corpus ("seen in N of M examples") and, where the screen is growth/monetization, A/B experiment evidence via `lazyweb_ab_test_research`. If no experiment data exists, say so explicitly ("no experiment data found — recommendation is design-prevalence-based") and substitute the prevalence count as the directional signal. Never let a recommendation render with neither a visual nor a number behind it.

**4. Be truth-seeking — never overclaim.**
Label evidence strength honestly with an `.ebadge` on every claim/card/rec: **Measured** (real lift number) vs **Directional** (screenshot-diff / visual prevalence, no lift) vs **Single-source / Off-category**. Forbid comparative-performance verbs ("outperforms", "underperforms") unless a measurement backs them. Put a one-line corpus-strength banner (`.corpus`) right after Agent Instructions when evidence is single-source, thin, or context-mismatched. Tag any reference whose brand was inferred from a URL/vision-description ("brand inferred — verify"). Show absence claims with evidence-of-search (queries run × screens reviewed + the closest near-miss). Never invent a reference, a metric, or a company name. **Never use ASCII/box-drawing `<pre>` art for a layout — render the `.mock` mock-frame or a generated image.**

### Evidence components (render claims with these — never prose alone)

Put the CSS below in the report `<style>` and adapt the markup per claim. Reuse the existing tokens (`--ink:#1f2328; --mut:#57606a; --line:#d0d7de; --soft:#eef4fb; --accent:#0969da`).

- **Patterns, Anti-Patterns (use `.tag.avoid`), Unique Angles, "What's working", Convention-check Missing/Unusual cells, hypothesis "supporting evidence", brainstorm "Applied here"** -> render as `.pat` cards: name + verdict `.tag` + `.prev` count ("seen in N of M references") + one-line claim + a `.deck` snap-carousel of 2-4 real screenshots that exhibit it (caption = company + the exact UI detail from `visionDescription`). The proof sits WITH the claim, never a scroll away. Show the pattern; don't just list brand names.
- **The decision section** (design-research "What to build first", quick-references "Recommended path", brainstorm "Which ideas to prototype", design-improve idea order, ab-test "Recommendations", paywall "Prioritization") -> render a **Decision legend** (`.legend`, one `.legend-row` per rec in rank order — the whole ranking graspable in one glance) ABOVE a `.recs` stack of **recommendation cards** (`.rec`; the #1 card is `.rec.lead` with the START-HERE hero + browser-chrome frame). Each card carries a BIG inline-legible proof (desktop 16:10 above-the-fold crop / mobile whole-screen via `.recs.mobileset`) — never a tiny click-into thumbnail — plus a `.verdict` (Do/Explore/Skip), an `.ebadge` evidence label, a prevalence count, and a labeled `.skiprow`. NO table; exactly one lead; no ties.
- **Honesty** -> put a `.corpus` banner right after Agent Instructions (basis / breadth / count / confidence); put an `.ebadge` (Measured | Directional | Single-source-or-off-category) on every claim, card, and recommendation. Never echo a raw "high"; never use "outperforms/underperforms" without a measured lift; tag crawl-seed/URL-inferred brands "brand inferred - verify".
- **Control vs variant (A/B)** -> use the `.flip` two-up grid (stacks on narrow screens; scroll-snaps with ◀ ▶ prev/next buttons); if `vision_description` is empty, synthesize the caption from `what_changed` and tag it "agent-described".

Every embedded screenshot must be FULLY VISIBLE and legible inline — never require a click to view, never a tiny thumbnail-as-proof, never a weird letterboxed ratio. Mobile/portrait shots: show the WHOLE screen (default `.deck` figure, no crop). Desktop/long-scroll pages: tag the figure `.shot-web` to crop to above-the-fold (16:10 from the top) at a size large enough to understand on its own. No "open full image" links. A report that asserts a claim with neither a visual nor a number behind it — or that hides its proof behind a click or a sliver crop — is non-conforming.

```css
.deckwrap{margin:8px 0}
.deck{display:flex;gap:12px;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;padding:4px 2px 10px;scrollbar-width:thin}
.deck>figure{flex:0 0 86%;max-width:320px;scroll-snap-align:center;margin:0;border:1px solid var(--line);border-radius:10px;overflow:hidden;background:#fff}
@media(min-width:620px){.deck>figure{flex-basis:46%}}
.deck.web>figure,.deck>figure.shot-web{flex-basis:92%;max-width:560px}
@media(min-width:620px){.deck.web>figure,.deck>figure.shot-web{flex-basis:60%}}
.deck-nav{display:flex;gap:6px;justify-content:flex-end;margin-top:2px}
.deck-nav button{cursor:pointer;border:1px solid var(--line);background:#fff;color:var(--ink);border-radius:6px;width:34px;height:28px;font-size:13px;line-height:1}
.deck-nav button:hover{background:var(--soft);border-color:var(--accent);color:var(--accent)}
.deck>figure>img{display:block;width:100%;height:auto;max-height:620px;object-fit:contain;background:#fafbfc}
.deck>figure.shot-web>img{aspect-ratio:16/10;max-height:none;object-fit:cover;object-position:top}
.deck>figure.tall>img{object-fit:contain}
.deck>figure.img-missing>img{display:none}
.deck>figure.img-missing figcaption::after{content:' — image unavailable; see description';color:#cf222e}
.deck .cap{font-size:12px;color:var(--mut);padding:7px 9px;line-height:1.4}
.deck .cap b{color:var(--ink)}
.deck .src{font-size:10.5px;font-weight:700;letter-spacing:.03em;color:var(--accent)}
.deck-hint{font-size:11.5px;color:var(--mut);margin:-2px 0 6px}
.pat{border:1px solid var(--line);border-radius:12px;padding:14px 16px;margin:14px 0;background:#fff}
.pat-h{display:flex;flex-wrap:wrap;align-items:baseline;gap:8px;margin-bottom:4px}
.pat-h h3{margin:0;font-size:16px}
.pat-claim{color:var(--mut);font-size:14px;margin:2px 0 10px}
.prev{font:600 11.5px/1 inherit;color:#0a3b78;background:var(--soft);border-radius:20px;padding:4px 10px}
.tag{font:700 10.5px/1 inherit;letter-spacing:.03em;border-radius:5px;padding:3px 7px}
.tag.strong{color:#0a5d2a;background:#e6f4ea;border:1px solid #b7e0c4}
.tag.directional{color:#8a5a00;background:#fff8e6;border:1px solid #f0e0b0}
.tag.weak{color:#6e7781;background:#f6f8fa;border:1px solid var(--line)}
.tag.avoid{color:#a40e26;background:#fdeef0;border:1px solid #f5c2c7}
:root{
  --ink:#1f2328; --mut:#57606a; --line:#d0d7de; --soft:#eef4fb; --accent:#0969da;
  --do-fg:#0a5d2a; --do-bg:#e6f4ea; --do-bd:#b7e0c4;
  --ex-fg:#8a5a00; --ex-bg:#fff8e6; --ex-bd:#f0e0b0;
  --sk-fg:#6e7781; --sk-bg:#f6f8fa; --sk-bd:#e3e7eb;
  --single-fg:#a40e26; --single-bg:#fdeef0; --single-bd:#f5c2c7;
}

/* ===== GRAFT 1 — DECISION LEGEND (whole ranking at a glance; degrades to anchors) ===== */
.legend{border:1px solid var(--line);background:#fff;border-radius:12px;padding:6px;margin:0 0 26px;overflow:hidden}
.legend-row{display:grid;grid-template-columns:34px minmax(0,1fr) auto auto;align-items:center;gap:12px;padding:9px 10px;border-radius:8px;text-decoration:none;color:inherit}
.legend-row + .legend-row{border-top:1px solid #eef1f4}
.legend-row:hover{background:var(--soft)}
.legend-row.is-lead{background:linear-gradient(0deg,#fff,var(--soft))}
.lg-rank{font:800 14px/1 inherit;text-align:center;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;background:var(--mut)}
.legend-row.is-lead .lg-rank{background:var(--accent)}
.lg-rank.r2{background:#3f6896}.lg-rank.r3{background:#6b7787}.lg-rank.r4{background:#8c96a1}
.lg-name{font-weight:650;min-width:0}
.lg-name .lg-why{display:block;font-weight:400;color:var(--mut);font-size:12px;line-height:1.35;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lg-ev{font:700 10px/1 inherit;color:var(--mut);white-space:nowrap;letter-spacing:.02em}

/* ===== shared verdict chip + evidence badge (reused everywhere) ===== */
.verdict{font:700 10.5px/1 inherit;border-radius:6px;padding:5px 9px;white-space:nowrap;letter-spacing:.03em;text-transform:uppercase;border:1px solid transparent;display:inline-flex;align-items:center;gap:5px}
.verdict .ico{font-size:10px;line-height:1}
.verdict.do{color:var(--do-fg);background:var(--do-bg);border-color:var(--do-bd)}
.verdict.explore{color:var(--ex-fg);background:var(--ex-bg);border-color:var(--ex-bd)}
.verdict.skip{color:var(--sk-fg);background:var(--sk-bg);border-color:var(--sk-bd)}
.ebadge{font:700 10px/1 inherit;letter-spacing:.02em;border-radius:20px;padding:5px 9px;display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
.ebadge .dot{width:7px;height:7px;border-radius:50%;display:inline-block}
.ebadge.strong{color:var(--do-fg);background:var(--do-bg);border:1px solid var(--do-bd)}.ebadge.strong .dot{background:var(--do-fg)}
.ebadge.directional{color:var(--ex-fg);background:var(--ex-bg);border:1px solid var(--ex-bd)}.ebadge.directional .dot{background:var(--ex-fg)}
.ebadge.single{color:var(--single-fg);background:var(--single-bg);border:1px solid var(--single-bd)}.ebadge.single .dot{background:var(--single-fg)}
.caveat-inline{font:700 9.5px/1 inherit;color:var(--ex-fg);background:var(--ex-bg);border:1px solid var(--ex-bd);border-radius:5px;padding:3px 6px;margin-left:2px;white-space:nowrap}

/* ===== RECOMMENDATION CARDS (replaces .ranked table) ===== */
.recs{display:flex;flex-direction:column;gap:16px}
.rec{position:relative;display:grid;grid-template-columns:minmax(0,1.18fr) minmax(0,1fr);background:#fff;border:1px solid var(--line);border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(31,35,40,.05)}

/* GRAFT 2 — LEAD HERO treatment for #1 (replaces .lead callout) */
.rec.lead{border:2px solid var(--accent);box-shadow:0 6px 22px rgba(9,105,218,.14);background:linear-gradient(0deg,#fff,var(--soft));margin-top:11px;grid-template-columns:minmax(0,1.32fr) minmax(0,1fr)}
.rec.lead::before{content:'\2605 RECOMMENDED PATH \2014 START HERE';position:absolute;z-index:4;top:-11px;left:18px;background:var(--accent);color:#fff;font:700 10px/1 inherit;letter-spacing:.05em;border-radius:10px;padding:6px 11px;box-shadow:0 2px 6px rgba(9,105,218,.35)}

/* proof side */
.rec-proof{position:relative;background:#0d1117;min-width:0;line-height:0}
.rec-proof .frame{display:block;height:100%;width:100%;border-right:1px solid var(--line);position:relative}
.browserbar{display:flex;align-items:center;gap:6px;height:30px;padding:0 11px;background:#f6f8fa;border-bottom:1px solid var(--line);position:absolute;top:0;left:0;right:0;z-index:2;line-height:1}
.browserbar i{width:9px;height:9px;border-radius:50%;background:#d0d7de;display:block}
.browserbar i:nth-child(1){background:#ff5f57}.browserbar i:nth-child(2){background:#febc2e}.browserbar i:nth-child(3){background:#28c840}
.browserbar .url{margin-left:8px;font:600 10.5px/1 ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--mut);background:#fff;border:1px solid var(--line);border-radius:20px;padding:5px 12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0}
/* desktop proof: 16:10 above-the-fold crop — plain <img>, legible with JS off */
.rec-proof img{display:block;width:100%;height:100%;aspect-ratio:16/10;object-fit:cover;object-position:top;background:#161b22}
.rec.lead .rec-proof img{aspect-ratio:16/9}
.rank-badge{position:absolute;z-index:3;left:12px;bottom:12px;display:flex;align-items:center;gap:7px;background:rgba(13,17,23,.84);color:#fff;border:1px solid rgba(255,255,255,.18);border-radius:999px;padding:5px 12px 5px 7px;backdrop-filter:blur(3px);line-height:1}
.rank-badge .num{display:flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:#fff;color:#0d1117;font:800 13px/1 inherit}
.rec.lead .rank-badge .num{background:var(--accent);color:#fff}
.rank-badge .lbl{font:700 10.5px/1 inherit;letter-spacing:.05em;text-transform:uppercase;color:#e6edf3}
.proof-verdict{position:absolute;z-index:3;left:12px;top:42px}
.proof-verdict .verdict{box-shadow:0 1px 6px rgba(0,0,0,.25)}
.proof-src{position:absolute;z-index:3;right:12px;bottom:12px;background:rgba(255,255,255,.92);color:var(--mut);border:1px solid var(--line);border-radius:6px;padding:4px 8px;font:700 10px/1.3 inherit;letter-spacing:.02em}
.proof-src b{color:var(--ink)}
/* GRAFT 3 — honest crop tag */
.crop-tag{position:absolute;z-index:3;right:12px;top:42px;font:700 9.5px/1 inherit;letter-spacing:.03em;color:#fff;background:rgba(31,35,40,.78);border-radius:5px;padding:4px 7px}
/* GRAFT 4 (JS-optional) — Expand button, hidden until .has-js; proof already legible without it */
.zoombtn{display:none;position:absolute;z-index:3;right:12px;top:38px;border:1px solid rgba(255,255,255,.35);background:rgba(13,17,23,.7);color:#fff;border-radius:6px;padding:4px 8px;font:700 10px/1 inherit;letter-spacing:.02em;cursor:pointer}
.has-js .zoombtn{display:inline-block}
.has-js .crop-tag{right:74px}
/* image-missing fallback */
.rec-proof.img-missing img{display:none}
.rec-proof.img-missing .frame{display:flex;align-items:center;justify-content:center;aspect-ratio:16/10;background:repeating-linear-gradient(45deg,#161b22,#161b22 12px,#1b212a 12px,#1b212a 24px);color:#9aa4af;font:600 12px/1.5 inherit;text-align:center;padding:18px}
.rec-proof .fallback{display:none}
.rec-proof.img-missing .fallback{display:block}
.rec-proof.img-missing .browserbar{display:none}

/* decision side */
.rec-body{padding:16px 18px 15px;display:flex;flex-direction:column;min-width:0}
.rec.lead .rec-body{padding-top:18px}
.rec-body h3{margin:0 0 5px;font-size:17px;line-height:1.25;letter-spacing:-.01em}
.rec.lead .rec-body h3{font-size:19px}
.rec-what{margin:0 0 12px;color:var(--mut);font-size:13.5px;line-height:1.5}
.rec-what b{color:var(--ink)}
.rec-what code{background:var(--soft);border:1px solid #cfe2fb;border-radius:4px;padding:1px 5px;font-size:12px}
.chips{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:10px}
.ev-note{font-size:12px;color:var(--mut);margin:-2px 0 11px}
.ev-note b{color:var(--ink)}
/* GRAFT 2d — labeled SKIP-IF row, bottom-pinned so cards align */
.skiprow{margin-top:auto;padding-top:11px;border-top:1px dashed var(--line);display:flex;gap:8px;align-items:baseline}
.rec.lead .skiprow{border-top-color:#bcd6f5}
.skiprow .lbl{font:700 9.5px/1 inherit;letter-spacing:.04em;text-transform:uppercase;color:var(--single-fg);background:var(--single-bg);border:1px solid var(--single-bd);border-radius:5px;padding:4px 7px;white-space:nowrap;flex:0 0 auto}
.skiprow .txt{font-size:12.5px;color:var(--mut);line-height:1.45}
.skiprow .txt b{color:var(--ink);font-weight:700}

/* responsive: stack proof above decision; collapse legend evidence col */
@media(max-width:720px){
  .rec, .rec.lead{grid-template-columns:1fr}
  .rec-proof .frame{border-right:0;border-bottom:1px solid var(--line)}
  .legend-row{grid-template-columns:30px minmax(0,1fr) auto;gap:9px}
  .lg-ev{display:none}
  .lg-name .lg-why{white-space:normal}
}

/* ===== MOBILE-PROOF VARIANT — portrait shown WHOLE (contain), capped, uniform ===== */
.recs.mobileset .rec-proof{background:#0d1117;display:flex;align-items:center;justify-content:center;padding:16px 14px}
.recs.mobileset .rec-proof .frame{width:auto;height:auto;border:0;border-right:0;display:flex;align-items:center;justify-content:center}
.recs.mobileset .rec-proof img{width:auto;height:auto;max-height:300px;max-width:100%;aspect-ratio:auto;object-fit:contain;border:1px solid #30363d;border-radius:16px;box-shadow:0 4px 16px rgba(0,0,0,.4)}
.recs.mobileset .rec.lead .rec-proof img{max-height:320px}
.recs.mobileset .rank-badge{left:20px;bottom:20px}
.recs.mobileset .proof-src{right:20px;bottom:20px}
.recs.mobileset .proof-verdict{left:20px;top:20px}
.recs.mobileset .rec-proof.img-missing .frame{aspect-ratio:9/16;width:170px;max-height:300px}

/* ===== JS-OPTIONAL lightbox (inert without JS: display:none, no src) ===== */
#lb{display:none;position:fixed;inset:0;z-index:50;background:rgba(13,17,23,.86);align-items:center;justify-content:center;padding:28px}
#lb.open{display:flex}
#lb img{max-width:96vw;max-height:92vh;border-radius:10px;box-shadow:0 12px 40px rgba(0,0,0,.55);background:#161b22}
#lb .x{position:absolute;top:18px;right:22px;color:#fff;font:700 26px/1 inherit;cursor:pointer;background:none;border:0}
.corpus{display:flex;gap:8px;align-items:flex-start;font-size:13px;color:#8a5a00;background:#fff8e6;border:1px solid #f0e0b0;border-radius:8px;padding:9px 12px;margin:14px 0}
.corpus b{color:var(--ink)}
.ebadge{font:700 10.5px/1 inherit;letter-spacing:.02em;border-radius:20px;padding:5px 9px;display:inline-flex;align-items:center;gap:6px}
.ebadge.measured{color:#0a5d2a;background:#e6f4ea;border:1px solid #b7e0c4}
.ebadge.directional{color:#8a5a00;background:#fff8e6;border:1px solid #f0e0b0}
.ebadge.single{color:#a40e26;background:#fdeef0;border:1px solid #f5c2c7}
.caveat-inline{font:700 10px/1 inherit;color:#8a5a00;background:#fff8e6;border:1px solid #f0e0b0;border-radius:5px;padding:2px 6px;margin-left:6px}
.flip{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding-bottom:8px}
@media(max-width:560px){.flip{grid-template-columns:1fr}}
.flip>figure{margin:0}
.flip>figure>img{width:100%;height:auto;max-height:580px;object-fit:contain;border:1px solid var(--line);border-radius:8px;background:#fafbfc}
.flip figcaption{font:600 12px/1.4 inherit;margin-top:5px}
.flip .side{display:inline-block;font:700 10px/1 inherit;letter-spacing:.04em;border-radius:5px;padding:3px 7px;margin-right:6px}
.flip .side.c{color:#6e7781;background:#f6f8fa}
.flip .side.v{color:#0a5d2a;background:#e6f4ea}
.flip .vd{display:block;font-weight:400;color:var(--mut);font-size:11.5px;margin-top:3px}
.flip figure.img-missing>img{display:none}
.flip figure.img-missing figcaption::after{content:' — image unavailable; see description';color:#cf222e;font-weight:400}
.rec-thumb{display:flex;gap:6px}
.rec-thumb img{height:104px;width:auto;border:1px solid var(--line);border-radius:6px;background:#fafbfc}
```

**Markup patterns:**

<!-- Patterns with evidence carousel (.deck + .pat) -->
```html
<div class="pat">
  <div class="pat-h">
    <h3>Code visible in the hero</h3>
    <span class="tag strong">Strong</span>
    <span class="prev">seen in 5 of 9 references</span>
  </div>
  <p class="pat-claim">Table stakes: the best developer-API pages put a runnable code/trace block in the first fold instead of an illustration.</p>

  <div class="deckwrap">
    <div class="deck">
      <figure><img src="{imageUrl}" alt="Composio" loading="lazy" onerror="this.closest('figure').classList.add('img-missing')">
        <figcaption class="cap"><span class="src">[Lazyweb]</span> <b>Composio</b> &mdash; curl snippet + inline run metrics in the hero.</figcaption></figure>
      <figure><img src="{imageUrl}" alt="Surge" loading="lazy" onerror="this.closest('figure').classList.add('img-missing')">
        <figcaption class="cap"><span class="src">[Lazyweb]</span> <b>Surge</b> &mdash; one-line command framed as the value prop.</figcaption></figure>
      <figure><img src="{imageUrl}" alt="Pulumi" loading="lazy" onerror="this.closest('figure').classList.add('img-missing')">
        <figcaption class="cap"><span class="src">[Lazyweb]</span> <b>Pulumi</b> &mdash; code tabs above the fold.</figcaption></figure>
    </div>
    <div class="deck-nav">
      <button type="button" aria-label="Previous" onclick="var d=this.closest('.deck-nav').previousElementSibling,f=d.querySelector('figure');d.scrollBy({left:-((f?f.offsetWidth:300)+12),behavior:'smooth'})">&#9664;</button>
      <button type="button" aria-label="Next" onclick="var d=this.closest('.deck-nav').previousElementSibling,f=d.querySelector('figure');d.scrollBy({left:(f?f.offsetWidth:300)+12,behavior:'smooth'})">&#9654;</button>
    </div>
  </div>
</div>
```

<!-- Opinionated ranked pick — Decision legend + recommendation cards (big legible proof; replaces the .ranked table) -->
Emit a `.legend` (one `.legend-row` per rec, in rank order — the whole ranking at a glance) ABOVE a `.recs` stack of `.rec` cards. The #1 card is `class="rec lead"` (START-HERE tab + browser-chrome bar). Desktop proof = 16:10 above-the-fold crop; for a MOBILE/portrait proof wrap the stack in `class="recs mobileset"` and omit `.browserbar`/`.crop-tag` (whole phone screen shown). Proof is a plain `<img>` — legible with JS off; the `⤢ Expand`/zoom is pure enhancement.
```html
<nav class="legend" aria-label="Ranking summary">
  <a class="legend-row is-lead" href="#m1"><span class="lg-rank">1</span><span class="lg-name">Runnable code/SDK block in the hero<span class="lg-why">code is the product shot — strongest dev-tool signal</span></span><span class="verdict do"><span class="ico">✓</span> Do first</span><span class="lg-ev">STRONG · 5/9</span></a>
  <a class="legend-row" href="#m2"><span class="lg-rank r2">2</span><span class="lg-name">3-step “how it works” grid<span class="lg-why">Send → Track → Deliver, each with a proof</span></span><span class="verdict do"><span class="ico">✓</span> Do</span><span class="lg-ev">STRONG · 5/9</span></a>
  <a class="legend-row" href="#m3"><span class="lg-rank r3">3</span><span class="lg-name">Logos + one trust metric, high<span class="lg-why">recognizable brands; one emails-sent stat</span></span><span class="verdict explore"><span class="ico">◐</span> Explore</span><span class="lg-ev">DIRECTIONAL · 4/9</span></a>
</nav>

<div class="recs">
  <article class="rec lead" id="m1">
    <div class="rec-proof">
      <a class="frame" href="{source_url}" target="_blank" rel="noopener">
        <span class="browserbar"><i></i><i></i><i></i><span class="url">{display_domain}</span></span>
        <img src="{imageUrl}" alt="{what the above-the-fold crop shows}" loading="lazy" onclick="if(window.__zoom)return window.__zoom(this);" onerror="this.closest('.rec-proof').classList.add('img-missing')">
        <span class="fallback">Proof image unavailable — {one-line description of the reference}.</span>
      </a>
      <span class="rank-badge"><span class="num">1</span><span class="lbl">Do next</span></span>
      <span class="proof-verdict"><span class="verdict do"><span class="ico">✓</span> Do first</span></span>
      <span class="crop-tag">DESKTOP · 16:10 above-the-fold</span>
      <button type="button" class="zoombtn" aria-label="Expand proof" onclick="window.__zoom && window.__zoom(this.parentNode.querySelector('img'))">⤢ Expand</button>
      <span class="proof-src">Proof · <b>{Company}</b></span>
    </div>
    <div class="rec-body">
      <h3>{recommendation title}</h3>
      <p class="rec-what">{one–two sentence why, with <b>key terms</b> and inline <code>code</code> where useful}</p>
      <div class="chips"><span class="ebadge strong"><span class="dot"></span> Strong evidence</span></div>
      <p class="ev-note">{pattern} seen in <b>5 of 9</b> references reviewed; no measured lift in-corpus.</p>
      <div class="skiprow"><span class="lbl">Skip if</span><span class="txt">{the one-line condition under which this move is wrong}.</span></div>
    </div>
  </article>
  <!-- repeat <article class="rec" id="m2">…</article> per rank (no `lead`; START-HERE tab + browserbar are #1-only). Skip rows still SHOW their proof so the skip is demonstrated, not asserted. -->
</div>

<!-- MOBILE/portrait proof: <div class="recs mobileset"> … same cards, omit .browserbar + .crop-tag (whole screen shown, contain). -->
<!-- Place once at end of <body>; JS-OPTIONAL (proof already legible without it): -->
<div id="lb" aria-hidden="true"><button type="button" class="x" aria-label="Close">×</button><img alt="Expanded proof"></div>
<script>document.body.classList.add('has-js');var _lb=document.getElementById('lb'),_i=_lb&&_lb.querySelector('img');window.__zoom=function(g){if(!_lb)return false;_i.src=g.currentSrc||g.src;_lb.classList.add('open');return false;};if(_lb)_lb.addEventListener('click',function(){_lb.classList.remove('open');_i.removeAttribute('src');});</script>
```

<!-- Evidence-strength badge + corpus banner (.ebadge / .corpus) -->
```html
<div class="corpus"><span>&#9888;</span><p style="margin:0"><b>Evidence basis:</b> 9 Lazyweb screenshots, no live web captures this run, similarity 0.4&ndash;0.6 &mdash; treat prevalence claims as <b>directional</b>, not measured.</p></div>

<!-- per-claim / per-rec badge -->
<span class="ebadge directional">Directional &middot; 5/9 refs &middot; no outcome data</span>
<span class="ebadge measured">Measured &middot; exp 3/3 &middot; sim 0.55</span>
<span class="ebadge single">Single-experiment &middot; off-category</span>

<!-- crawl-seed / inferred-brand caveat on a deck card -->
<figcaption class="cap"><span class="src">[Lazyweb]</span> <b>SendGrid</b> <span class="caveat-inline">brand inferred from URL/vision &mdash; verify</span> &mdash; enterprise tier hero.</figcaption>
```

<!-- Control / variant (.flip) -->
```html
<div class="flip">
  <figure><img src="{control.imageUrl or control.image_url}" alt="Control" loading="lazy" onerror="this.closest('figure').classList.add('img-missing')">
    <figcaption><span class="side c">CONTROL</span><span class="vd">{control.vision_description}</span></figcaption></figure>
  <figure><img src="{variant.imageUrl or variant.image_url}" alt="Variant" loading="lazy" onerror="this.closest('figure').classList.add('img-missing')">
    <figcaption><span class="side v">VARIANT</span><span class="vd">{variant.vision_description OR, if empty: a description synthesized from what_changed} <span class="caveat-inline">agent-described</span></span></figcaption></figure>
</div>

<!-- inline proof pair inside a ranked recommendation row -->
<td class="rec-thumb"><a href="#exp-fae32674"><img src="{control.imageUrl or control.image_url}" alt="control"><img src="{variant.imageUrl or variant.image_url}" alt="variant"></a></td>
```

<!-- Locked-evidence rendering (paid access missing) — drop in wherever an evidence/hypothesis image would go.
     The .locked-ref tile fills its container (deck figure / .flip card / .rec-proof frame), so dimensions
     automatically match the slot that would have held a real screenshot. The UNBLURRED "Current" paywall
     img above the report uses a normal <img>; every other reference / experiment / hypothesis card uses
     the locked tile below.  Click any tile → https://www.lazyweb.com/monetization -->
```html
<!-- One-line banner immediately after Agent Instructions when in locked mode -->
<a class="lock-banner" href="https://www.lazyweb.com/monetization" target="_blank" rel="noopener">
  <span class="lb-ico" aria-hidden="true">
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
  </span>
  <span class="lb-txt"><b>Lazyweb Pro is locked.</b> The hypotheses and the prose below are intact, but every evidence screenshot is hidden until you upgrade. Your current paywall stays visible at the top.</span>
  <span class="lb-cta">Upgrade →</span>
</a>

<!-- Locked deck figure (replaces a real reference <img> inside a .deck) -->
<figure class="locked-figure">
  <a class="locked-ref" href="https://www.lazyweb.com/monetization" target="_blank" rel="noopener" aria-label="Upgrade to Lazyweb Pro to unlock this evidence">
    <span class="locked-ref-blur" aria-hidden="true"></span>
    <span class="locked-ref-lock" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
    </span>
    <p class="locked-ref-cta">Upgrade to Lazyweb Pro to unlock this skill</p>
    <span class="locked-ref-sub">Tap to upgrade</span>
  </a>
  <figcaption class="cap"><span class="src">[Lazyweb]</span> <b>Reference locked</b> — upgrade to view this evidence.</figcaption>
</figure>

<!-- Locked control/variant pair (replaces both <img> tags inside a .flip) -->
<div class="flip">
  <figure class="locked-figure">
    <a class="locked-ref" href="https://www.lazyweb.com/monetization" target="_blank" rel="noopener" aria-label="Upgrade to unlock control screenshot">
      <span class="locked-ref-blur" aria-hidden="true"></span>
      <span class="locked-ref-lock" aria-hidden="true"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg></span>
      <p class="locked-ref-cta">Upgrade to Lazyweb Pro to unlock this skill</p>
    </a>
    <figcaption><span class="side c">CONTROL</span><span class="vd">{control.vision_description}</span></figcaption>
  </figure>
  <figure class="locked-figure">
    <a class="locked-ref" href="https://www.lazyweb.com/monetization" target="_blank" rel="noopener" aria-label="Upgrade to unlock variant screenshot">
      <span class="locked-ref-blur" aria-hidden="true"></span>
      <span class="locked-ref-lock" aria-hidden="true"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg></span>
      <p class="locked-ref-cta">Upgrade to Lazyweb Pro to unlock this skill</p>
    </a>
    <figcaption><span class="side v">VARIANT</span><span class="vd">{variant.vision_description}</span></figcaption>
  </figure>
</div>

<!-- Locked .rec-proof inside a recommendation card -->
<div class="rec-proof locked-proof">
  <a class="frame locked-ref" href="https://www.lazyweb.com/monetization" target="_blank" rel="noopener" aria-label="Upgrade to unlock proof imagery">
    <span class="locked-ref-blur" aria-hidden="true"></span>
    <span class="locked-ref-lock" aria-hidden="true"><svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg></span>
    <p class="locked-ref-cta">Upgrade to Lazyweb Pro to unlock this skill</p>
    <span class="locked-ref-sub">Tap to upgrade</span>
  </a>
</div>
```

**Rules when paid access is missing** (drop the locked tile EVERY place the report would otherwise embed an evidence image; the Current paywall is the single exception):
- Render the `.lock-banner` once, right after Agent Instructions.
- Every `.deck > figure` → use `<figure class="locked-figure">` with the `.locked-ref` tile inside it.
- Every `.flip` control/variant pair → both figures use `.locked-ref`.
- Every `.rec-proof` → wrap with `.rec-proof.locked-proof` and put the `.locked-ref` in the `.frame`.
- Evidence-summary cards, divergent-option proofs, anti-pattern thumbnails → same `.locked-ref` substitution.
- Keep ALL captions, prevalence chips (`.prev`), verdict badges (`.verdict`), evidence badges (`.ebadge`), hypothesis prose, and convention tables EXACTLY as they would render under paid access.
- The user's Current paywall screenshot (the single "Target paywall read" image) is the ONLY real image — render it from the `target_image_url` the user supplied.
- Every locked tile must link to `https://www.lazyweb.com/monetization`.

### Report footer (REQUIRED — the very last element of the report)

End every report with this footer (add the CSS to `<style>`):

```html
<footer class="lw-foot">Powered by <a href="https://www.lazyweb.com">Lazyweb</a> — turn your agent into a design researcher… for free!</footer>
```

```css
.lw-foot{margin-top:34px;padding-top:14px;border-top:1px solid var(--line);text-align:center;font-size:13px;color:var(--mut)}
```
