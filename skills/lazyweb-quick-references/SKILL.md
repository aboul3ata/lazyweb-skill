---
name: lazyweb-quick-references
route: "Quick UI examples / screenshots / references, no report"
description: |
  Find app screenshots and UI references quickly. Embeds Lazyweb results by
  storage-backed URL and groups them by pattern. Use when the user wants to see examples of a specific
  screen, UI element, or flow without a full research report.
  Trigger on: "show me examples of", "how do other apps do", "design inspiration for",
  "UI reference for", "what does X's app look like", "find screenshots of",
  "show me how", "references for".
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

# Lazyweb Quick References

Find real app screenshots fast, embed Lazyweb images by URL, and group by pattern.
Lighter than design-research — no competitive analysis, no anti-patterns. Just find → group → show.

## CRITICAL: Output Behavior

**This skill produces FILES, not a plan.** Regardless of whether you are in plan mode
or not, ALWAYS:

1. Write the HTML report to `.lazyweb/quick-references/{topic}-{date}/report.html`
2. Embed Lazyweb references directly with their returned `imageUrl`/`image_url`; save only current-state and web-captured screenshots under `.lazyweb/quick-references/{topic}-{date}/references/`
3. Do NOT create `report.md` or any other Markdown report artifact
4. Do NOT write research content into a plan file
5. Publish a shareable link (see "Publish a Shareable Link" below) — automatic, non-blocking
6. After saving, show the user a summary, where the files are, and the shareable
   link if publishing succeeded
7. Ask the user if the references look good
8. If in plan mode, exit plan mode after the user confirms
9. Suggest next steps: "You can now use these references to inform your design,
   ask `/lazyweb` for deeper design research, or start building."

## Publish a Shareable Link (always, right after writing report.html)

Every report is auto-published to lazyweb.com so the user can share it with
teammates. Run this with `$REPORT_DIR` set to `.lazyweb/quick-references/{topic}-{date}`:

```bash
IDEMPOTENCY_KEY="${REPORT_DIR#.lazyweb/}"   # stable per-report key (e.g. quick-references/{topic}-{date}); send the SAME value every attempt so retries dedupe to one link
LAZYWEB_TOKEN=$(cat "$HOME/.lazyweb/lazyweb_mcp_token" 2>/dev/null || true)
if [ -n "$LAZYWEB_TOKEN" ]; then
  # Tier 1 - local install: direct POST (idempotency_key dedupes a re-run)
  python3 - "$REPORT_DIR" "$LAZYWEB_TOKEN" "quick-references" "$IDEMPOTENCY_KEY" <<'PUBLISH_EOF'
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
  2. Otherwise call `lazyweb_publish_report` with: `html` = the contents of `report.html`; `assets` = each `references/` file as `{"name": <filename>, "b64": <base64 of the bytes>}`; `report_skill` = "quick-references"; `idempotency_key` = the value printed after `idempotency_key=`.
  3. On `{ ok: true, url }` -> show "Shareable link: {url} (unlisted - anyone with the link can view)".
  4. On `{ ok: false }` -> tell the user publishing failed and why (the `error` field); the report is saved locally. If `code` is `REPORT_VALIDATION_ERROR` and `detail` names missing assets, fix and call ONCE more; otherwise do not retry.
  Unlike Tier 1, do NOT stay silent on a Tier-2 failure - a hosted user has no local file to fall back on, so they need the link or the reason.

### Hosting-safe HTML (the template already complies — keep it that way)

The hosted copy is served byte-for-byte, so the report must only use:
- inline CSS and inline `<script>` — never an external `<script src=...>`
- images via the absolute `imageUrl`/`image_url` URLs Lazyweb returns, or
  relative `references/{filename}` paths for locally saved screenshots
- no `file://` URLs and no absolute local paths (`/Users/...`, `C:\...`)

## Ground the search (run first)

Before searching, ground the work in what the user is building, and avoid guessing when a wrong guess wastes a search:

1. **Detect context.** Run `lazyweb-context-detect` (on `PATH` when installed by setup; otherwise `~/.lazyweb/repos/lazyweb-skill/bin/lazyweb-context-detect`). It prints the project, platform (mobile/desktop), and stack. Use it to bias the `platform` filter and to caption references accurately.
2. **Clarify only what's missing.** If it reports `platform=unknown`, or you can't tell the product/screen from the request, ask the user ONE short clarifying question to pin down product/screen, mobile vs desktop, and the specific outcome. Skip anything the context already answered; don't interrogate when the request is already clear.
3. **Search from multiple angles.** Cast 3-5 `lazyweb_search` queries with different wordings and filters (by screen, by competitor `company`, by `category`, by `platform`) instead of one, and read each result's `visionDescription` before using it.
4. **Obey the response metadata.** Never repeat an identical query — results are deterministic; page deeper with `offset` and follow `pagination.next_offset`. On `no_matches`/`low_coverage` warnings, use the closest result, strip the query to its core 2-6 word UI pattern, or tell the user the pattern is not covered — don't rephrase the same concept in a loop (style adjectives like "dark"/"minimal" are not searchable facets; judge style from the images). On `company_not_in_library`, use a suggested company or drop the filter. Building a whole app or page? Run one search per screen/section, not one broad query.

## When to Use This

- User wants to see a specific type of screen ("show me pricing pages")
- User wants visual references for what they're building
- User asks "what does X look like" or "how do other apps do Y"

## When NOT to Use This

- User wants deep analysis, competitive research, or best practices -> route to `lazyweb-design-research`
- User has an existing design and wants feedback -> route to `lazyweb-design-improve`
- User wants creative/unconventional ideas -> route to `lazyweb-design-brainstorm`

## Lazyweb MCP Setup

Use the hosted Lazyweb MCP tools at `https://www.lazyweb.com/mcp` for all Lazyweb database access.

Required MCP tools:
- `lazyweb_search` — text search over mobile and desktop screenshots
- `lazyweb_find_similar` — more results like a returned Lazyweb `imageUrl` or image payload
- `lazyweb_compare_image` — visual search from `image_base64` + `mime_type` or `image_url`
- `lazyweb_health` — connectivity check

**Pass `skill: "quick-references"` on every call.** Include `"skill": "quick-references"` in the arguments of each `lazyweb_*` tool call — for example `{"query": "pricing page", "limit": 30, "skill": "quick-references"}`. This is optional analytics metadata Lazyweb uses to understand which skills are used; never drop or change a real argument for it.

**Also pass `version: "<x.y.z>"` on every call.** Read `~/.lazyweb/VERSION` once per session at skill start (e.g. `cat "$HOME/.lazyweb/VERSION" 2>/dev/null || echo 0.0.0`); fall back to `"0.0.0"` if the file is missing or unreadable — never block on this. Include `"version": "<that-value>"` in the arguments of every `lazyweb_*` tool call alongside the existing `skill` arg — for example `{"query": "pricing page", "limit": 30, "skill": "quick-references", "version": "0.4.5"}`. Optional analytics metadata Lazyweb uses to track which skill-pack versions are running; never drop or change a real argument for it.

These are the current public gateway names. Backend/internal surfaces may also
expose canonical tools such as `search_screenshots`, `list_filters`,
`vision_screenshots`, and `metadata_screenshots`; prefer the `lazyweb_*` names
in this skill. Use `high_design_bar: true` only when the live tool schema exposes
it and the user asks for high-design-bar companies, premium examples,
best-designed apps, or stronger visual-quality filtering. That filter is backed
by `companies.high_design_bar = true`.

Before searching, verify MCP is available by listing tools and running
`lazyweb_health`.

**If Lazyweb MCP is not installed or auth fails:**
Tell the user: "Lazyweb MCP is not installed. Run `curl -fsSL https://www.lazyweb.com/install.sh | bash`, reload this client, then rerun this skill. Lazyweb is free; the bearer token is
only for no-billing UI reference tools and is okay in ignored local config."
Then proceed with web research only.

## Browse Setup (run BEFORE any web capture)

See **`../_shared/browse-setup.md`** (relative to this skill's directory) for the canonical browse/web-capture setup. Follow it as written.

## Workflow

### 1. Capture Current State (if applicable)

If the user is looking for references for a specific page or app they're building
(not a general topic), capture the current state:

- **Running dev server or URL available:** Use preview/browse tools to screenshot it
- **Mobile app:** Ask user to provide a screenshot
- **No specific page:** Skip this step

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

This grounds the collection — the reader sees what they have before seeing the references.

### 2. Search Lazyweb

Call `lazyweb_search` 2-4 times with different angles:

```json
{"query":"<query>","limit":30}
{"query":"<alternative framing>","limit":30}
{"query":"<more specific variant>","platform":"desktop","limit":30}
```

**Query tips:**
- Think in concrete UI elements: "pricing page with toggle", "dark mode settings", "onboarding with progress bar"
- Use `--category` for domain filtering: "Health & Fitness", "Finance", "Productivity"
- Use `--company` to find specific apps: `--company "stripe"`
- Use `high_design_bar: true` to filter for quality only when the live schema exposes it

**Platform routing:** Lazyweb has both mobile app screenshots and desktop/web site screenshots.
- `--platform mobile` — mobile app screenshots only
- `--platform desktop` — desktop/web site screenshots only
- `--platform all` (default) — search both, results grouped desktop-first then mobile
- A mac app, SaaS dashboard, or web product → use `--platform desktop`
- An iPhone/Android app → use `--platform mobile`
- General research or cross-platform → omit (searches both)

Each result includes a `platform` field ("mobile" or "desktop") so you know the source.
Desktop results also include a `pageUrl` field with the original site URL.

**Assess quality:** `matchCount` 2/3+ = strong. 1/3 = weak. `similarity` > 0.4 = good.

**Explore generously.** Don't stop at one search. Try 2-4 different phrasings to
cast a wide net. More raw material = better grouping.

**HIGH BAR FOR REFERENCES:** Each Lazyweb result includes a `visionDescription` field —
a text description of what's actually in the screenshot. Read it.

**Rules for attaching references:**
1. Read `visionDescription` before using ANY screenshot
2. The screenshot MUST directly illustrate the pattern you're grouping it under
3. If `visionDescription` doesn't match — DO NOT USE IT
4. Better to have fewer, perfectly-matched references than many loose ones
5. Never guess what's in a screenshot — use `visionDescription` for captions
6. If there's no visionDescription, skip the screenshot

Mismatched references destroy user trust faster than anything else.

### 3. Search Connected Inspiration Libraries

Check if `~/.lazyweb/libraries.json` exists and has connected libraries:

```bash
cat ~/.lazyweb/libraries.json 2>/dev/null
```

If libraries are configured, search each one using the browse tool. For each library:

1. Navigate to the library's search URL: `$LB goto "{searchUrl}"`
2. Take a snapshot to understand the page: `$LB snapshot -i`
3. Search for the topic: `$LB fill @eN "{query}"`
4. Submit and wait for results: `$LB press Enter` then `$LB snapshot -i`
5. Browse through results — screenshot the most relevant ones
6. Save to: `$LB screenshot "$REPORT_DIR/references/{library}-{company}-{screen}.png"`

**Keep it fast**: This is the quick-references skill. Don't deep-dive into every result.
Grab the best 3-5 screenshots per library and move on.

**If the library session has expired** (login wall, redirect to sign-in):
- Tell the user: "Your {library} session has expired. Reconnect that inspiration source manually before relying on it."
- Skip this library and continue with other sources.

Label all library-sourced references: `[Mobbin]`, `[Savee]`, etc.

### 4. Web Research + Live Screenshot Capture

**Always supplement** Lazyweb with live web captures for the most current examples.

**Step A — Find URLs via WebSearch:**
- Search for "[screen type] design examples [current year]"
- Search for "[competitor] [screen type]"
Collect 2-5 interesting URLs.

**Step B — Capture live screenshots:**
```bash
if [ -x "$LB" ]; then
  $LB goto "https://example.com/page"
  $LB screenshot "$REPORT_DIR/references/example-page.png"
fi
```

If the browse tool is not available, describe web examples in the report without images.

**Platform balance:** Aim for at least 50% same-platform references.

### 5. Download References

```bash
REPORT_DIR="$(pwd)/.lazyweb/quick-references/{topic-slug}-{YYYY-MM-DD}"
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

### 6. Write HTML Reference Report

Write directly to `.lazyweb/quick-references/{topic-slug}-{YYYY-MM-DD}/report.html`.
Do not create a Markdown version.

**Reverse pyramid:** Lead with the patterns (the answer), then show the evidence.

**Reference presentation contract:** Do not stack every reference as full-width
figures down the page. Each pattern should use a `.deck` snap-carousel that lays every reference out at a glance (scroll-snaps with ◀ ▶ prev/next buttons) without losing the analysis. Each slide/card must include:
- Company/product name, source label (`[Lazyweb]`, `[Web]`, `[Mobbin]`, etc.),
  and URL when available
- A one-line "why this is here" caption tying the reference to the pattern
- The key visual detail to borrow or avoid

For desktop/web landing-page screenshots, never render long full-page captures at
natural height. Show them in a desktop viewport frame instead: use a 16:10 or
1440x900-style crop with `overflow: hidden`, `object-fit: cover`, and
`object-position: top`. Make that above-the-fold crop large and legible enough to understand on its own — do NOT add "open full image/page" links or any click-to-view.
For live web captures, prefer viewport screenshots over full-page screenshots.
Mobile/portrait screenshots must be shown WHOLE (object-fit: contain, no cropping), at a size large enough to read; cap height only to keep one shot from dominating.

Use this content outline, rendered as semantic HTML:

```text
# Quick References: {Topic}

## Agent Instructions
{Report section #1. Emit the copy-pastable downstream-agent handoff exactly as defined in "Report essentials" below — one human sentence, then the AGENT HANDOFF block.}

## Current State
{Include ONLY if a current state screenshot was captured in step 1. Otherwise omit this section.}
![Current State](references/current-state.png)
*{Brief description of what we're looking at}*

## Patterns
{Render as `.pat` cards (see "Operating principles & evidence components"): each = verdict `.tag` (Build this / Optional / Skip) + `.ebadge` strength + `.prev` count + one-line claim + a `.deck` snap-carousel of the real screenshots that prove it. Lead with the ranked recommended path; quantify any absence claim inline ("0 of 159 screens reviewed").}

## More references (optional)
{The `.pat` cards above already carry their `.deck` snap-carousel of proof — do not repeat them. Use this section ONLY for strong references that don't map to a named pattern, rendered as a single `.deck` of real `<img>` thumbnails captioned company + key detail. NEVER emit prose "Slide 1/2/3" bullet lists — references are real images in a `.deck`.}
```

Group screenshots by visual or functional pattern. Don't just list them — show what connects them.
Label each reference `[Lazyweb]` or `[Web]` for provenance.

**Mockups:** If you suggest how a pattern applies to the user's project, show it with a generated image (if an image tool is available) or an HTML/CSS mock-frame — never ASCII art. See "Report essentials → C. Mockups" below.

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

For THIS skill, `{TASK}` = "building {screen/component} using these grouped real-app references as a visual baseline", and `DIVE FURTHER` → "`/lazyweb-design-research` for full competitive analysis + recommendations, or `lazyweb_find_similar` on the closest reference".

#### B. Conciseness & "show, don't tell"

Write the report to be skimmed — no length target, let the evidence set the length:
- **Lead with value** — Agent Instructions and the dominant pattern come first.
- **Show, don't tell** — make the case with VISUAL evidence (embedded real-app screenshots via Lazyweb `imageUrl`, and where relevant a mock-frame), not paragraphs.
- **Index the "why" on evidence, not adjectives** — each pattern points to specific visual references.
- Cut throat-clearing and restatement; use tables/bullets where they read faster.

#### C. Mockups — never ASCII art

To show a proposed layout: if an image-generation tool is available to you, generate a mockup asset, save it to `references/mock-{slug}.png`, and embed it with a caption. Otherwise render an HTML/CSS **mock-frame** (a styled `<div>` wireframe). Never use ASCII/box-drawing art. Mobile mock-frame for app screens, desktop for web/SaaS.

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

### 7. HTML Requirements

The `report.html` file should:
- Be a single HTML file with inline CSS (no external CSS/JS dependencies; one small inline `onclick` copy handler is allowed for the Agent Instructions block)
- Include the Report essentials shared CSS (section D) in `<style>`; use clean, readable styling: system fonts, max-width 900px, comfortable line-height
- Use absolute Lazyweb `imageUrl`/`image_url` values for Lazyweb references
- Use relative paths (`references/filename.png`) only for current-state and web-captured screenshots saved locally
- Use per-pattern `.deck` snap-carousels (every reference visible, scroll-snaps with ◀ ▶ prev/next buttons) instead of long vertical image stacks
- Crop desktop/web landing-page screenshots into a fixed desktop viewport frame; do not show very long page captures at full height in the report body
- Style images with rounded corners, subtle shadow, max-width that fits the layout, and height constraints that prevent zoomed-in or oversized visuals
- Make the Agent Instructions block (section A) the FIRST section, styled as the light-blue callout
- Open the HTML file in the user's browser: `open "$REPORT_DIR/report.html"`

Tell the user where the report was saved.

### 8. Follow-up Strategies

- **"More like this"** → call `lazyweb_find_similar` with `{"image_url":"<returned Lazyweb imageUrl>","limit":10}`
- **"Same company"** → call `lazyweb_search` with `{"query":"<query>","company":"<name>","limit":30}`
- **"Different style"** → Rephrase query emphasizing the desired difference
- **"What about competitors?"** → Search for the same screen across different companies
- **"Higher design bar"** → call `lazyweb_search` with `{"high_design_bar":true}` only when exposed

## Operating principles & evidence components (REQUIRED - overrides convenience)

The canonical operating principles and the reusable evidence/report components (`.deck` carousel, `.legend` + `.rec` cards, `.ebadge`/`.corpus` honesty labels, `.flip` control/variant, `.mock` mock-frame) live in **`../_shared/operating-principles.md`** (relative to this skill's directory). Read that file and apply it verbatim — it is the single source of truth shared by every report-producing Lazyweb skill. Do not re-inline or fork it here.
