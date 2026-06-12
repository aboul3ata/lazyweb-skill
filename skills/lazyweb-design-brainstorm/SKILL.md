---
name: lazyweb-design-brainstorm
route: 'Creative, unconventional, cross-category design ideas'
description: |
  Cross-pollination design brainstorm. Deliberately searches outside the obvious category
  to find novel patterns that could be applied in unexpected ways. The "zig when everyone
  zags" skill — finds inspiration from domains nobody in your space is looking at.
  Trigger on: "brainstorm design ideas", "creative alternatives for", "design exploration",
  "what if we tried", "unconventional approach to", "fresh ideas for",
  "think outside the box", "surprise me".
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

# Lazyweb Design Brainstorm

## CRITICAL: Output Behavior

**This skill produces FILES, not a plan.** Regardless of whether you are in plan mode
or not, ALWAYS:

1. Write the HTML report to `.lazyweb/design-brainstorm/{topic}-{date}/report.html`
2. Embed Lazyweb references directly with their returned `imageUrl`/`image_url`; save only current-state and web-captured screenshots under `.lazyweb/design-brainstorm/{topic}-{date}/references/`
3. Do NOT create `report.md` or any other Markdown report artifact
4. Do NOT write brainstorm content into a plan file
5. After saving, show the user a summary of ideas and tell them where the files are
6. Ask the user if the brainstorm looks good
7. If in plan mode, exit plan mode after the user confirms
8. Suggest next steps: "You can now prototype the top ideas, ask `/lazyweb`
   for deeper design research on a specific idea, or start building."

---

Find novel design patterns by deliberately looking OUTSIDE the obvious category.
If everyone in fintech copies each other's dashboards, look at how gaming apps
handle data visualization. If every productivity app has the same onboarding,
look at how social apps hook new users.

The point is cross-pollination, not conformity.

## Ground the search (run first)

Before searching, ground the work in what the user is building, and avoid guessing when a wrong guess wastes a search:

1. **Detect context.** Run `lazyweb-context-detect` (on `PATH` when installed by setup; otherwise `~/.lazyweb/repos/lazyweb-skill/bin/lazyweb-context-detect`). It prints the project, platform (mobile/desktop), and stack. Use it to keep ideas applicable to the user's platform even while you search outside their category.
2. **Clarify only what's missing.** If it reports `platform=unknown`, or you can't tell the product/problem from the request, ask the user ONE short clarifying question to pin down the product, the platform, and what they're trying to spark. Skip anything the context already answered.
3. **Search from multiple angles.** Cast 3-5 `lazyweb_search` queries across deliberately different categories (the cross-pollination move) and read each result's `visionDescription` before using it. Add `high_design_bar: true` only when the live schema exposes it and the user asks for high-design-bar, premium, best-designed, or stronger visual-quality examples.
4. **Obey the response metadata.** Never repeat an identical query — results are deterministic; page deeper with `offset` and follow `pagination.next_offset`. On `no_matches`/`low_coverage` warnings, pivot to a different category or mechanism instead of rephrasing the same concept (style adjectives like "dark"/"minimal" are not searchable facets; judge style from the images). On `company_not_in_library`, use a suggested company or drop the filter.

## When to Use This

- User wants fresh/creative design ideas
- User is tired of seeing the same patterns in their category
- User asks "what if we did something different" or "brainstorm ideas"
- User wants to differentiate their design from competitors

## When NOT to Use This

- User wants to understand standard patterns -> route to `lazyweb-design-research`
- User wants quick visual references -> route to `lazyweb-quick-references`
- User has an existing design and wants improvements -> route to `lazyweb-design-improve`

## Lazyweb MCP Setup

Use the hosted Lazyweb MCP tools at `https://www.lazyweb.com/mcp` for all Lazyweb database access.

Required MCP tools:
- `lazyweb_search` — text search over mobile and desktop screenshots
- `lazyweb_find_similar` — more results like a returned Lazyweb `imageUrl` or image payload
- `lazyweb_compare_image` — visual search from `image_base64` + `mime_type` or `image_url`
- `lazyweb_health` — connectivity check

**Pass `skill: "design-brainstorm"` on every call.** Include `"skill": "design-brainstorm"` in the arguments of each `lazyweb_*` tool call — for example `{"query": "pricing page", "limit": 30, "skill": "design-brainstorm"}`. This is optional analytics metadata Lazyweb uses to understand which skills are used; never drop or change a real argument for it.

**Also pass `version: "<x.y.z>"` on every call.** Read `~/.lazyweb/VERSION` once per session at skill start (e.g. `cat "$HOME/.lazyweb/VERSION" 2>/dev/null || echo 0.0.0`); fall back to `"0.0.0"` if the file is missing or unreadable — never block on this. Include `"version": "<that-value>"` in the arguments of every `lazyweb_*` tool call alongside the existing `skill` arg — for example `{"query": "pricing page", "limit": 30, "skill": "design-brainstorm", "version": "0.4.5"}`. Optional analytics metadata Lazyweb uses to track which skill-pack versions are running; never drop or change a real argument for it.

These are the current public gateway names. Backend/internal surfaces may also
expose canonical tools such as `search_screenshots`, `list_filters`,
`vision_screenshots`, and `metadata_screenshots`; prefer the `lazyweb_*` names
in this skill. Use `high_design_bar: true` only when the live schema exposes it
to filter to companies where `companies.high_design_bar = true`.

Before searching, verify MCP is available by listing tools and running
`lazyweb_health`.

**If Lazyweb MCP is not installed or auth fails:**
Tell the user: "Lazyweb MCP is not installed. Run `curl -fsSL https://www.lazyweb.com/install.sh | bash`, reload this client, then rerun this skill. Lazyweb is free; the bearer token is
only for no-billing UI reference tools and is okay in ignored local config."
Then proceed with web research only — the brainstorm still works, just with web examples.

## Browse Setup (run BEFORE any web capture)

See **`../_shared/browse-setup.md`** (relative to this skill's directory) for the canonical browse/web-capture setup. Follow it as written.

## Workflow

### 1. Understand What They're Building

Clarify:
- What's the product? (app type, audience, core value prop)
- What specific screen or flow needs fresh thinking?
- What's the "obvious" approach they want to avoid?
- **Mobile or desktop/web?** This determines the reference balance.

### 2. Capture Current State (if applicable)

If the user is brainstorming for a specific page or app they're building,
capture the current state:

- **Running dev server or URL available:** Use preview/browse tools to screenshot it
- **Mobile app:** Ask user to provide a screenshot
- **No specific page yet:** Skip this step

Save as `$REPORT_DIR/references/current-state.png` and include it in the HTML report
after the TL;DR using this structure:

```html
<section>
  <h2>Current State</h2>
  <figure>
    <img src="references/current-state.png" alt="Current State">
    <figcaption>{Brief description of what we're looking at}</figcaption>
  </figure>
</section>
```

This grounds the brainstorm — the reader sees where we are before seeing where we could go.

### 3. Map the Obvious Category

First, understand what everyone in the user's space does. Quick search in the obvious category:

```json
{"query":"<screen type>","category":"<their category>","limit":10}
{"query":"<screen type>","category":"<their category>","platform":"desktop","limit":10}
```

This establishes the baseline — the "zig" that everyone does.

### 4. Search Outside the Category

Now deliberately search in UNRELATED categories for the same screen type.
The more different the category, the more novel the inspiration.

**Category cross-pollination examples:**
- Building a **finance** app? Search in Gaming, Entertainment, Music, Social
- Building a **productivity** tool? Search in Fitness, Food & Drink, Travel, Music
- Building an **e-commerce** app? Search in Education, Health, Social Networking
- Building a **health** app? Search in Gaming, Entertainment, Finance

```json
{"query":"<screen type>","category":"Gaming","limit":15}
{"query":"<screen type>","category":"Entertainment","limit":15}
{"query":"<screen type>","category":"Social Networking","platform":"desktop","limit":15}
```

**Platform routing:** Lazyweb has both mobile app screenshots and desktop/web site screenshots.
- `--platform mobile` — mobile app screenshots only
- `--platform desktop` — desktop/web site screenshots only
- `--platform all` (default) — search both, results grouped desktop-first then mobile
- A mac app, SaaS dashboard, or web product → use `--platform desktop`
- An iPhone/Android app → use `--platform mobile`
- General research or cross-platform → omit (searches both)

Each result includes a `platform` field ("mobile" or "desktop") so you know the source.
Desktop results also include a `pageUrl` field with the original site URL.

Also try searching for the underlying FUNCTION rather than the screen name:
- Instead of "dashboard" → search "data visualization with gamification"
- Instead of "onboarding" → search "first-time experience with tutorial"
- Instead of "settings" → search "personalization with preferences"

**Explore generously.** Run 4-6 searches across different categories. Cast a very wide
net — you can filter later. More raw material = better cross-pollination.

**HIGH BAR FOR REFERENCES:** Each Lazyweb result includes a `visionDescription` field —
a text description of what's actually in the screenshot. Read it.

**Rules for attaching references to the brainstorm:**
1. Read `visionDescription` before using ANY screenshot
2. The screenshot MUST directly illustrate the cross-pollination idea you're proposing
3. If `visionDescription` doesn't match your idea — DO NOT USE IT
4. A brainstorm idea with no image but a populated HTML/CSS mock-frame (Report essentials -> C) beats one with a mismatched screenshot. Never use ASCII art.
5. Never guess what's in a screenshot — use `visionDescription` for captions
6. If there's no visionDescription, skip the screenshot

Mismatched references destroy user trust faster than anything else.

### 5. Search Connected Inspiration Libraries

Check if `~/.lazyweb/libraries.json` exists and has connected libraries:

```bash
cat ~/.lazyweb/libraries.json 2>/dev/null
```

If libraries are configured, search each one using the browse tool. For brainstorms,
search BOTH the obvious category AND unrelated categories in each library:

1. Navigate to the library's search URL: `$LB goto "{searchUrl}"`
2. Take a snapshot to understand the page: `$LB snapshot -i`
3. Search for the cross-pollination query: `$LB fill @eN "{query}"`
4. Submit and wait for results: `$LB press Enter` then `$LB snapshot -i`
5. Browse through results — look for the unexpected, the novel, the "wait, that's interesting"
6. Screenshot the standout results: `$LB screenshot "$REPORT_DIR/references/{library}-{company}-{screen}.png"`
7. Note what makes each one a genuine "zag"

**Brainstorm-specific**: Libraries like Mobbin and Savee have category filters. Use them
to deliberately search outside the user's category — that's the whole point of this skill.

**If the library session has expired** (login wall, redirect to sign-in):
- Tell the user: "Your {library} session has expired. Reconnect that inspiration source manually before relying on it."
- Skip this library and continue with other sources.

Label all library-sourced references: `[Mobbin]`, `[Savee]`, etc.

### 6. Web Research + Live Screenshot Capture (REQUIRED)

Lazyweb gives you curated screenshots. But brainstorms need the UNEXPECTED — Awwwards
winners, experimental sites, award-winning designs nobody in the user's space is looking at.

**Step A — Find unconventional URLs via WebSearch:**
- "unconventional [screen type] design"
- "[different industry] approach to [problem]"
- "creative [screen type] examples [current year]"
- "[award-winning site] [screen type]" — Awwwards, FWA, CSS Design Awards winners

Collect 3-8 URLs of standout, unconventional examples.

**Step B — Capture live screenshots from those URLs:**
```bash
if [ -x "$LB" ]; then
  $LB goto "https://awwwards-winner.com/page"
  $LB screenshot "$REPORT_DIR/references/awwwards-winner-page.png"
fi
```

If the browse tool is not available, describe web examples in the report without images.

**This is especially important for brainstorms.** Web captures of unconventional sites
are often the most novel cross-pollination sources because desktop/web has more design
freedom than mobile.

**Platform balance:** Also deliberately search the OTHER platform for cross-pollination.
A novel web layout can inspire a fresh mobile approach and vice versa.

### 7. Download References

```bash
REPORT_DIR="$(pwd)/.lazyweb/design-brainstorm/{topic-slug}-{YYYY-MM-DD}"
mkdir -p "$REPORT_DIR/references"
```

Do not download Lazyweb database images. Use the `imageUrl`/`image_url` returned by Lazyweb
directly in the HTML report. Supabase storage-backed image URLs are signed for
365 days and intended for report embedding; if a selected Lazyweb result has no returned image URL, omit the
image and rely on `visionDescription` plus text.

For web-captured examples:
```bash
if [ -x "$LB" ]; then
  $LB goto "https://example.com"
  $LB screenshot "$REPORT_DIR/references/{company}-{screen}.png"
fi
```

### 8. Identify Transferable Patterns

For each cross-category result, ask:
- What pattern is this app using? (not what it looks like, but what it DOES)
- Why does this work in its original context?
- Could this same pattern work in the user's context? How would it need to adapt?
- What makes this a genuine "zag" vs just a random thing from another app?

**Guardrail:** Not everything novel is useful. A gaming leaderboard in a banking app
might be terrible. Filter for ideas where the UNDERLYING PATTERN transfers, even if
the surface aesthetic doesn't.

### 9. Write HTML Brainstorm Report

Write directly to `.lazyweb/design-brainstorm/{topic-slug}-{YYYY-MM-DD}/report.html`.
Do not create a Markdown version.

**Reverse pyramid:** Lead with the action (which ideas to prototype), then the ideas,
then the analysis. The reader should know what to do in the first 30 seconds.

Use this content outline, rendered as semantic HTML:

```text
# Design Brainstorm: {Topic}

## Agent Instructions
{Report section #1. Emit the copy-pastable downstream-agent handoff exactly as defined in "Report essentials" below — one human sentence, then the AGENT HANDOFF block.}

## Current State
{Include ONLY if a current state screenshot was captured in step 2. Otherwise omit this section.}
![Current State](references/current-state.png)
*{Brief description of what we're looking at}*

## Which Ideas to Prototype
{ACTION FIRST. Rank ideas by feasibility × novelty. Best brainstorm ideas are
HIGH novelty AND HIGH feasibility — not just weird for weird's sake.}

| Idea | Novelty | Feasibility | Verdict |
|------|---------|-------------|---------|
| {idea} | High/Med/Low | High/Med/Low | Prototype / Explore / Skip |

## The Obvious Approach
{What everyone in this category does — the "zig."
Brief, with 1-2 example screenshots from the user's category.}

![Typical Example]({Lazyweb imageUrl or local web-capture path})
*{Company} — the standard approach in {category} [{Lazyweb|Web}]*

## Cross-Pollination Ideas

### From {Source Category}: {Company}
![Reference]({Lazyweb imageUrl or local web-capture path})
*{Company} — {What they do} [{Lazyweb|Web}]*

**The Pattern:** {What's the underlying design pattern, abstracted from the specific app}
**Applied Here:** {How this could work in the user's product — be specific}
**Why It's a Zag:** {What makes this different from what everyone else in the category does}
**Mockup:** {Generated image or HTML/CSS mock-frame of the idea in the user's product — never ASCII art; see Report essentials → C}

**Mockups:** For each cross-pollination idea, show how the pattern would look applied to the user's product with a generated image (if an image tool is available) or an HTML/CSS mock-frame — never ASCII art. See "Report essentials → C. Mockups" below.

### From {Source Category}: {Company}
...

## Wild Cards
{1-2 ideas that are genuinely unconventional. Might not work but worth
considering. Flag the risk alongside the upside.}
```

Label each reference `[Lazyweb]` or `[Web]` so the user knows where it came from.

### Report essentials (apply to the report you write)

Three rules keep every Lazyweb report consistent. Follow them exactly.

#### A. Agent Instructions — report section #1

The report opens with an **Agent Instructions** callout: one plain human sentence, then a copy-pastable block written FOR A DOWNSTREAM CODING AGENT (not the human reader). Emit exactly this structure:

```html
<section id="agent-instructions" class="agent-instructions">
  <div class="ai-head"><span class="ai-badge">FOR THE CODING AGENT</span>
    <button class="ai-copy" type="button" onclick="
      var sec=this.closest('.agent-instructions'); var txt=sec.querySelector('.ai-block').innerText;
      var done=function(ok){this.textContent=ok?'Copied':'Press Cmd/Ctrl+C';setTimeout(function(){this.textContent='Copy';}.bind(this),1500);}.bind(this);
      if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(txt).then(function(){done(true);},function(){done(false);});}
      else{var r=document.createRange();r.selectNodeContents(sec.querySelector('.ai-block'));var s=getSelection();s.removeAllRanges();s.addRange(r);try{document.execCommand('copy');done(true);}catch(e){done(false);}}">Copy</button>
  </div>
  <p class="ai-human">{one human sentence: the single most important thing to do}</p>
  <pre class="ai-block">{COPY BLOCK — fill the braces from this report}</pre>
</section>
```

Copy-block text (keep these exact labels; fill `{REPORT_PATH}` with the absolute path of the report.html you wrote):

```
LAZYWEB REPORT — AGENT HANDOFF
Use the report at {REPORT_PATH} as a starting point for {TASK}.

TOP RECOMMENDATIONS (do first):
1. {rec 1, one imperative line}
2. {rec 2}
3. {rec 3}

INDEX ON: {1-3 well-evidenced signals/patterns from this report}
DO NOT OVER-INDEX ON: {weak-evidence / single-source / aesthetic-only / non-transferable items}
DIVE FURTHER: {next Lazyweb skill or MCP tool} — {why}

Evidence basis: {Lazyweb screenshots | web captures} · {DATE}
```

For THIS skill, `{TASK}` = "exploring a differentiated {screen} direction using the cross-category patterns below", and `DIVE FURTHER` → "`/lazyweb-design-research` to validate the chosen direction against in-category norms before building". For brainstorm, also keep the "Which Ideas to Prototype" feasibility×novelty table near the top.

#### B. Conciseness & "show, don't tell"

Write the report to be skimmed — no length target, let the evidence set the length:
- **Lead with value** — Agent Instructions and the prototype-ranking table come first.
- **Show, don't tell** — make the case with VISUAL evidence (the cross-category reference screenshots via Lazyweb `imageUrl`, and a mock-frame of the idea applied), not paragraphs.
- **Index the "why" on evidence, not adjectives** — each idea points to the specific cross-category reference it transfers from.
- Cut throat-clearing and restatement; use tables/bullets where they read faster.

#### C. Mockups — never ASCII art

To show how a transferred pattern would look: if an image-generation tool is available to you, generate a mockup asset, save it to `references/mock-{slug}.png`, and embed it with a caption. Otherwise render an HTML/CSS **mock-frame** (a styled `<div>` wireframe). Never use ASCII/box-drawing art. Mobile mock-frame for app screens, desktop for web/SaaS.

```html
<figure class="mock mobile"><div class="frame"><div class="notch"></div><div class="body">
  <div class="box">Header / value prop</div>
  <div class="row"><div class="box">Item A</div><div class="box">Item B</div></div>
  <div class="box tall">Content / hero</div><div class="box cta">Primary CTA</div>
</div></div><figcaption class="cap">Mock-frame — {what this proposes}</figcaption></figure>

<figure class="mock desktop"><div class="frame"><div class="bar"><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="url">example.com</span></div><div class="body">
  <div class="row"><div class="box">Logo</div><div class="box">Nav</div><div class="box">Sign in</div></div>
  <div class="row"><div class="box">Feature</div><div class="box">Feature</div><div class="box">Feature</div></div>
  <div class="box cta">Primary CTA</div>
</div></div><figcaption class="cap">Mock-frame — {what this proposes}</figcaption></figure>
```

#### D. Shared CSS (include in the report `<style>`)

```css
:root{--ink:#1f2328;--mut:#57606a;--line:#d0d7de;--soft:#eef4fb;--accent:#0969da}
.agent-instructions{background:var(--soft);border-left:4px solid var(--accent);border-radius:8px;padding:14px 16px;margin:18px 0}
.ai-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:8px}
.ai-badge{font-size:11px;font-weight:700;letter-spacing:.04em;color:#0a3b78}
.ai-copy{font:600 12px/1 inherit;cursor:pointer;border:1px solid var(--accent);color:var(--accent);background:#fff;border-radius:6px;padding:5px 11px}
.ai-copy:hover{background:var(--accent);color:#fff}
.ai-human{margin:0 0 10px;font-size:15px}
.ai-block{white-space:pre-wrap;word-break:break-word;background:#fff;border:1px solid var(--line);border-radius:6px;padding:12px 13px;margin:0;font:13px/1.5 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;color:var(--ink);user-select:all}
.mock{margin:14px 0;font-family:inherit}
.mock .frame{border:1px solid var(--line);border-radius:14px;background:#fff;box-shadow:0 1px 4px rgba(31,35,40,.06);overflow:hidden}
.mock.mobile .frame{max-width:300px;border-radius:26px;border:8px solid #1f2328}
.mock.desktop .frame{max-width:760px}
.mock .bar{display:flex;align-items:center;gap:6px;padding:7px 10px;background:#f6f8fa;border-bottom:1px solid var(--line);font-size:12px;color:var(--mut)}
.mock .dot{width:9px;height:9px;border-radius:50%;background:#d0d7de}
.mock .url{flex:1;text-align:center;background:#fff;border:1px solid var(--line);border-radius:5px;padding:2px 8px;font-size:11px;color:var(--mut)}
.mock .notch{width:46%;height:16px;margin:6px auto 0;background:#1f2328;border-radius:0 0 12px 12px}
.mock .body{padding:14px;display:flex;flex-direction:column;gap:10px}
.mock .box{background:var(--soft);border:1px dashed #b9c7d6;border-radius:8px;min-height:34px;display:flex;align-items:center;justify-content:center;color:#4a5a6a;font-size:12px;text-align:center;padding:8px}
.mock .box.tall{min-height:120px}.mock .box.cta{background:var(--accent);border:0;color:#fff;font-weight:600;min-height:40px}
.mock .row{display:flex;gap:10px}.mock .row>.box{flex:1}
.mock .cap{font-size:12px;color:var(--mut);margin-top:6px;text-align:center}
```

### 10. HTML Requirements

The `report.html` file should:
- Be a single HTML file with inline CSS (no external CSS/JS dependencies; one small inline `onclick` copy handler is allowed for the Agent Instructions block)
- Include the Report essentials shared CSS (section D) in `<style>`; use clean, readable styling: system fonts, max-width 900px, comfortable line-height
- Use absolute Lazyweb `imageUrl`/`image_url` values for Lazyweb references
- Use relative paths (`references/filename.png`) only for current-state and web-captured screenshots saved locally
- Style images with rounded corners, subtle shadow, max-width that fits the layout
- Make the Agent Instructions block (section A) the FIRST section, styled as the light-blue callout
- Make tables clean with light borders and header background
- Open the HTML file in the user's browser: `open "$REPORT_DIR/report.html"`

Tell the user where the report was saved.

## Brainstorm Mindset

- The goal is NOVELTY WITH PURPOSE — not random weirdness
- Every idea should have a "why this could work here" explanation
- If an idea is high novelty but low feasibility, flag it as a Wild Card
- The best brainstorms find 1-2 genuinely transferable patterns, not 10 forced ones
- It's OK to say "I didn't find strong cross-pollination opportunities for this screen type" — that's more honest than padding with irrelevant ideas

## Operating principles & evidence components (REQUIRED - overrides convenience)

The canonical operating principles and the reusable evidence/report components (`.deck` carousel, `.legend` + `.rec` cards, `.ebadge`/`.corpus` honesty labels, `.flip` control/variant, `.mock` mock-frame) live in **`../_shared/operating-principles.md`** (relative to this skill's directory). Read that file and apply it verbatim — it is the single source of truth shared by every report-producing Lazyweb skill. Do not re-inline or fork it here.
