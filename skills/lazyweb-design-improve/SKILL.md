---
name: lazyweb-design-improve
route: "Improve or critique an existing screen or design"
description: |
  Capture a screenshot of the user's current design, find similar screens in Lazyweb,
  and generate concrete improvement ideas backed by real references. Use when the user
  has an existing design and wants feedback or improvement suggestions.
  Trigger on: "improve this design", "how can I make this better", "critique my design",
  "design feedback", "what should I change", "make this look better",
  "compare my design to", "design review".
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

# Lazyweb Design Improve

## CRITICAL: Output Behavior

**This skill produces FILES, not a plan.** Regardless of whether you are in plan mode
or not, ALWAYS:

1. Write the HTML report to `.lazyweb/design-improve/{screen}-{date}/report.html`
2. Embed Lazyweb references directly with their returned `imageUrl`/`image_url`; save only current-state and web-captured screenshots under `.lazyweb/design-improve/{screen}-{date}/references/`
3. Do NOT create `report.md` or any other Markdown report artifact
4. Do NOT write improvement content into a plan file
5. After saving, show the user a summary of improvement ideas and tell them where the files are
6. Ask the user if the improvements look good
7. If in plan mode, exit plan mode after the user confirms
8. Suggest next steps: "You can now implement these improvements, ask
   `/lazyweb` for more creative ideas, or start building."

---

Capture the current state of a design, find similar screens from the best apps,
and generate 1-5 concrete improvement ideas — each tied to a real reference.

## Ground the search (run first)

Before searching, ground the work in what the user is building, and avoid guessing when a wrong guess wastes a search:

1. **Detect context.** Run `lazyweb-context-detect` (on `PATH` when installed by setup; otherwise `~/.lazyweb/repos/lazyweb-skill/bin/lazyweb-context-detect`). It prints the project, platform (mobile/desktop), and stack. Use it to bias the `platform` filter and to caption references accurately. (You will also capture the current screen below; context-detect grounds the surrounding product.)
2. **Clarify only what's missing.** If it reports `platform=unknown`, or you can't tell the product/screen from the request, ask the user ONE short clarifying question to pin down product/screen, mobile vs desktop, and the specific outcome. Skip anything the context already answered; don't interrogate when the request is already clear.
3. **Search from multiple angles.** Cast 3-5 `lazyweb_search` queries with different wordings and filters (by screen, by competitor `company`, by `category`, by `platform`, and by `high_design_bar` only when exposed) instead of one, and read each result's `visionDescription` before using it.
4. **Obey the response metadata.** Never repeat an identical query — results are deterministic; page deeper with `offset` and follow `pagination.next_offset`. On `no_matches`/`low_coverage` warnings, use the closest result, strip the query to its core 2-6 word UI pattern, or tell the user the pattern is not covered — don't rephrase the same concept in a loop (style adjectives like "dark"/"minimal" are not searchable facets; judge style from the images). On `company_not_in_library`, use a suggested company or drop the filter.

## When to Use This

- User has an existing screen/page and wants to make it better
- User asks "how can I improve this" or "what's wrong with my design"
- User wants to compare their design against competitors

## When NOT to Use This

- User hasn't built anything yet and wants research -> route to `lazyweb-design-research`
- User wants to see examples of a specific screen type -> route to `lazyweb-quick-references`
- User wants creative/unconventional ideas -> route to `lazyweb-design-brainstorm`

## Lazyweb MCP Setup

Use the hosted Lazyweb MCP tools at `https://www.lazyweb.com/mcp` for all Lazyweb database access.

Required current public MCP tools:
- `lazyweb_search` — text search over mobile and desktop screenshots
- `lazyweb_find_similar` — more results like a returned Lazyweb `imageUrl` or image payload
- `lazyweb_compare_image` — visual search from `image_base64` + `mime_type` or `image_url`
- `lazyweb_ab_test_research` — public paid A/B Test Agent wrapper when growth experiment evidence is needed
- `lazyweb_health` — connectivity check

**Pass `skill: "design-improve"` on every call.** Include `"skill": "design-improve"` in the arguments of each `lazyweb_*` tool call — for example `{"query": "pricing page", "limit": 30, "skill": "design-improve"}`. This is optional analytics metadata Lazyweb uses to understand which skills are used; never drop or change a real argument for it.

**Also pass `version: "<x.y.z>"` on every call.** Read `~/.lazyweb/VERSION` once per session at skill start (e.g. `cat "$HOME/.lazyweb/VERSION" 2>/dev/null || echo 0.0.0`); fall back to `"0.0.0"` if the file is missing or unreadable — never block on this. Include `"version": "<that-value>"` in the arguments of every `lazyweb_*` tool call alongside the existing `skill` arg — for example `{"query": "pricing page", "limit": 30, "skill": "design-improve", "version": "0.4.5"}`. Optional analytics metadata Lazyweb uses to track which skill-pack versions are running; never drop or change a real argument for it.

Some backend/internal MCP surfaces may also expose `lazyweb_find_experiments`,
`lazyweb_recent_experiments`, `list_companies_by_categories`, canonical tools
such as `search_screenshots`, `list_filters`, `vision_screenshots`, and
`metadata_screenshots`, or `high_design_bar` filters. Use those only when the
live tool list and schema expose them. Prefer the public `lazyweb_*` gateway
names in this skill.

Before searching, verify MCP is available by listing tools and running
`lazyweb_health`.

**If Lazyweb MCP is not installed or auth fails:**
Tell the user: "Lazyweb MCP is not installed. Run `curl -fsSL https://www.lazyweb.com/install.sh | bash`, reload this client, then rerun this skill. Lazyweb is free; the bearer token is
only for no-billing UI reference tools and is okay in ignored local config."
Then proceed with web research only — the skill still works, just without Lazyweb's database.

## Browse Setup (run BEFORE any web capture)

See **`../_shared/browse-setup.md`** (relative to this skill's directory) for the canonical browse/web-capture setup. Follow it as written.

## Workflow

### 1. Capture the Current Design

Get a screenshot of what the user currently has. Try these approaches in order:

**For web apps (if a dev server is running or URL is available):**
- Use preview tools (preview_start + preview_screenshot) if available
- Use headless browser tools if available
- Navigate to the URL and screenshot it

**For mobile apps:**
- Ask the user to upload a screenshot or provide a file path

**For mockups/designs:**
- Ask the user to provide the image file path

Save the screenshot as `current.png` in the output directory.

If no screenshot can be captured, ask the user to provide one. Don't proceed without a visual of the current state.

### 2. Find Similar Screens in Lazyweb

Use image comparison to find visually similar screens. Read the local screenshot
bytes, base64 encode them, detect the MIME type, then call `lazyweb_compare_image`:

```json
{"image_base64":"<base64 file bytes>","mime_type":"image/png","limit":30}
```

Also do text searches for the screen type with multiple angles:

```json
{"query":"<description of the screen>","limit":30}
{"query":"<alternative description>","platform":"desktop","limit":30}
{"query":"<specific component>","limit":30}
```

If you know the category, include `"category":"<category>"`.

**Platform routing:** Lazyweb has both mobile app screenshots and desktop/web site screenshots.
- `--platform mobile` — mobile app screenshots only
- `--platform desktop` — desktop/web site screenshots only
- `--platform all` (default) — search both, results grouped desktop-first then mobile
- A mac app, SaaS dashboard, or web product → use `--platform desktop`
- An iPhone/Android app → use `--platform mobile`
- General research or cross-platform → omit (searches both)

Each result includes a `platform` field ("mobile" or "desktop") so you know the source.
Desktop results also include a `pageUrl` field with the original site URL.

**Explore generously.** Run 3-5 searches to find the best references. More raw material
means better improvement ideas.

**HIGH BAR FOR REFERENCES:** Each Lazyweb result includes a `visionDescription` field —
a text description of what's actually in the screenshot. Read it.

**Rules for attaching references:**
1. Read `visionDescription` before using ANY screenshot
2. The screenshot MUST directly illustrate the improvement you're suggesting
3. If `visionDescription` doesn't match your improvement idea — DO NOT USE IT
4. A report with 3 perfectly-matched references beats 10 loosely-related ones
5. Better to have NO image than a mismatched one — describe the idea in one sentence plus an HTML/CSS mock-frame (Report essentials -> C). Never use ASCII art.
6. Never guess what's in a screenshot — use `visionDescription` for captions

Mismatched references destroy user trust faster than anything else.

### 3. Pull Experiment Evidence

When the user is optimizing a growth, monetization, onboarding, checkout, paywall,
activation, or cancellation screen, first inspect the live Lazyweb tool list. If
only the current public gateway is exposed, call `lazyweb_ab_test_research` with
the target screen, product/category context, conversion goal, and constraints.
If backend/internal tools are exposed, call `lazyweb_find_experiments` with the
same screen/category filters, and use `lazyweb_recent_experiments` for
latest/recent tests. If the user asks for high-design-bar or premium examples,
include `"high_design_bar": true` only on tools whose live schema supports it.

Treat `_experiments` as limited screenshot-diff evidence: use it to strengthen or
weaken each recommendation, but do not claim measured lift unless the evidence says
so directly.

### 4. Search Connected Inspiration Libraries

Check if `~/.lazyweb/libraries.json` exists and has connected libraries:

```bash
cat ~/.lazyweb/libraries.json 2>/dev/null
```

If libraries are configured, search each one using the browse tool. For each library:

1. Navigate to the library's search URL: `$LB goto "{searchUrl}"`
2. Take a snapshot to understand the page: `$LB snapshot -i`
3. Search for the same screen type the user is improving: `$LB fill @eN "{query}"`
4. Submit and wait for results: `$LB press Enter` then `$LB snapshot -i`
5. Browse through results — click into ones that look like strong alternatives to the current design
6. Screenshot the best results: `$LB screenshot "$REPORT_DIR/references/{library}-{company}-{screen}.png"`
7. Note what's in each screenshot for accurate captions

**Quality bar**: Only use screenshots that directly illustrate an improvement idea.
A reference from Mobbin that doesn't clearly show a better approach than the current
design is useless — skip it.

**If the library session has expired** (login wall, redirect to sign-in):
- Tell the user: "Your {library} session has expired. Reconnect that inspiration source manually before relying on it."
- Skip this library and continue with other sources.

Label all library-sourced references: `[Mobbin]`, `[Savee]`, etc.

### 5. Web Research + Live Screenshot Capture (REQUIRED)

**Always supplement** with live competitor screenshots and recent examples.

**Step A — Find competitor URLs via WebSearch:**
- Search for "[screen type] best design examples [current year]"
- Search for "[competitor] [screen type] design"
- Search for "best [screen type] UX"
Collect 3-5 URLs of best-in-class examples.

**Step B — Capture live screenshots:**
```bash
if [ -x "$LB" ]; then
  $LB goto "https://competitor.com/page"
  $LB screenshot "$REPORT_DIR/references/competitor-page.png"
fi
```

If no browse tool is available, describe web examples in the report without images.

**Platform balance:** Aim for at least 50% same-platform references.

### 6. Prepare Image References

```bash
REPORT_DIR="$(pwd)/.lazyweb/design-improve/{screen-slug}-{YYYY-MM-DD}"
mkdir -p "$REPORT_DIR/references"
```

Copy the current screenshot:
```bash
cp <current-screenshot> "$REPORT_DIR/references/current.png"
```

Do not download Lazyweb database images. Use the `imageUrl`/`image_url` returned by Lazyweb
directly in the HTML report. Supabase storage-backed image URLs are signed for
365 days and intended for report embedding; if a selected Lazyweb result has no returned image URL, omit the
image and rely on `visionDescription` plus text.

For web screenshots:
```bash
if [ -x "$LB" ]; then
  $LB goto "https://example.com"
  $LB screenshot "$REPORT_DIR/references/{company}-{screen}.png"
fi
```

### 7. Analyze and Generate Ideas

Look at the current design alongside the references. Consider:
- What's the user's product context? (audience, platform, goals)
- What are the references doing that the current design isn't?
- What IS the current design doing well? (don't just criticize)
- What patterns from the references would actually fit this product?

**Key principle:** References are inspiration, not templates. Don't suggest copying a
reference exactly. Identify the PATTERN or IDEA from the reference and explain how it
could be adapted to the user's specific context.

**Be careful with references from very different contexts.** A gaming app's onboarding
won't necessarily work for a finance app. Flag context differences.

Generate 1-5 concrete improvement ideas. Each must be:
- Specific (not "make it cleaner" — what exactly should change?)
- Tied to a reference (which screenshot inspired this idea?)
- Actionable (the user should be able to implement it)

### 8. Write HTML Improvement Report

Write directly to `.lazyweb/design-improve/{screen-slug}-{YYYY-MM-DD}/report.html`.
Do not create a Markdown version.

**Reverse pyramid:** Lead with what to do, then show the evidence.

Use this content outline, rendered as semantic HTML:

```text
# Design Improvement: {Screen/Feature}

## Agent Instructions
{Report section #1. Emit the copy-pastable downstream-agent handoff exactly as defined in "Report essentials" below — one human sentence, then the AGENT HANDOFF block.}

## Current State
![Current Design](references/current.png)
*{Brief description of what we're looking at}*

## Improvement Ideas

### 1. {Idea Title} ⭐ (highest impact)
{Clear description of what to change and why}

**Inspired by:**
![Reference]({Lazyweb imageUrl or local web-capture path})
*{Company} — {What they do that inspired this idea} [{Lazyweb|Web}]*

**Why this works:** {What makes this pattern effective in the reference,
and why it would work for the user's product}

**Mockup:**
{Generated image or HTML/CSS mock-frame of the improvement — never ASCII art; see Report essentials → C}

### 2. {Idea Title}
...

### 3. {Idea Title}
...

## What's Working
{Be specific about what's good. Developers need to know what NOT to change.
List 2-4 concrete things that are done well.}

## All References
{Gallery of all reference screenshots used, with company, source, and context}
```

Label each reference `[Lazyweb]` or `[Web]` for provenance.

**Mockups:** For each improvement idea, show the proposed change with a generated image (if an image tool is available) or an HTML/CSS mock-frame — never ASCII art. See "Report essentials → C. Mockups" below.

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

For THIS skill, `{TASK}` = "revising the {screen} to close the gaps found against best-in-class references", and `DIVE FURTHER` → "`/lazyweb-ab-test-research` if this is a growth/monetization screen, or `/lazyweb-design-research` for deeper competitive grounding".

#### B. Conciseness & "show, don't tell"

Write the report to be skimmed — no length target, let the evidence set the length:
- **Lead with value** — Agent Instructions and the highest-impact improvement come first.
- **Show, don't tell** — make the case with VISUAL evidence (the current screenshot, embedded reference screenshots via Lazyweb `imageUrl`, and a mock-frame of the change), not paragraphs.
- **Index the "why" on evidence, not adjectives** — each idea points to the specific reference that inspired it.
- Cut throat-clearing and restatement; use tables/bullets where they read faster.

#### C. Mockups — never ASCII art

To show a proposed change: if an image-generation tool is available to you, generate a mockup asset, save it to `references/mock-{slug}.png`, and embed it with a caption. Otherwise render an HTML/CSS **mock-frame** (a styled `<div>` wireframe). Never use ASCII/box-drawing art. Mobile mock-frame for app screens, desktop for web/SaaS.

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

### 9. HTML Requirements

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

## Important Caveats

- Not every reference is relevant. A high similarity score doesn't mean the pattern applies to the user's context. Use judgment.
- "Improve" doesn't mean "copy the most popular pattern." Sometimes the user's current approach is intentionally different — ask before suggesting radical changes.
- Focus improvement ideas on things that would have the highest impact with the least effort. Lead with the quick wins.

## Operating principles & evidence components (REQUIRED - overrides convenience)

The canonical operating principles and the reusable evidence/report components (`.deck` carousel, `.legend` + `.rec` cards, `.ebadge`/`.corpus` honesty labels, `.flip` control/variant, `.mock` mock-frame) live in **`../_shared/operating-principles.md`** (relative to this skill's directory). Read that file and apply it verbatim — it is the single source of truth shared by every report-producing Lazyweb skill. Do not re-inline or fork it here.
