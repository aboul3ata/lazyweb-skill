---
name: lazyweb-optimize-paywall
route: "Optimize paywall conversion"
router-terms: paywall, paywall design, paywall redesign, optimize paywall, improve paywall, critique paywall, conversion rate, paid conversion, trial start, annual plan, upgrade screen
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

# Optimize Paywall

Optimize a paywall with evidence-backed conversion hypotheses, not generic
component advice.

## CRITICAL: Output Behavior

**This skill produces a self-contained Lazyweb HTML report you write yourself,
not a plan and not a server-rendered page.** It must still follow the shared
Lazyweb report contract from `AGENTS.md`; local HTML is only the delivery
mechanism. Regardless of whether you are in plan mode or not, ALWAYS:

1. Do the evidence work (read the paywall, search Lazyweb, mine experiments,
   form 2-4 hypotheses) per the workflow sections below.
2. Generate one mockup per hypothesis (the "Generate the mockups" ladder below)
   and save the references the report will point at.
3. Author the report by **writing the HTML file yourself** to
   `$REPORT_DIR/report.html` — a shared Lazyweb evidence report with the shared
   Agent Instructions block first, shared report furniture, component CSS in a
   `<style>` block, and carousel + lightbox JS before `</body>`
   (see "Write the shared Lazyweb report" below). There is no server render step.
4. Do NOT write optimization content into a plan file, a `report.md`, or a
   `report-data.json`. The deliverable is the `report.html` you author.
5. Open the finished report: `open "$REPORT_DIR/report.html"` (skip `open` in a
   headless/CI/no-GUI environment and just print the absolute path).
6. Summarize the 2-4 hypotheses, name the strongest one, and surface the path to
   `report.html`.
7. Ask the user if the paywall direction looks good.
8. If in plan mode, exit plan mode after the user confirms.
9. Suggest next steps: "You can now implement the strongest hypothesis, ask
   `/lazyweb-ab-test-research` for deeper experiment mining, or ask `/lazyweb`
   for adjacent design references."

The report dir convention is `$REPORT_DIR = .lazyweb/optimize-paywall/{topic-slug}-{YYYY-MM-DD}`.
Create `$REPORT_DIR/references/` for the screenshots and generated mockups the
report embeds. There is no `work/` dir and no `report-data.json`.

## Write the shared Lazyweb report (the single deliverable)

You author `$REPORT_DIR/report.html` directly — a single Lazyweb HTML
document with every image inlined (so the file is genuinely self-contained) and
the carousel + lightbox scripts embedded. You own the template now; there is no
`lazyweb_render_report` call, no server-side template, and no hosted URL. The
finished `report.html` IS the report.

### Shared report furniture compliance (required)

This section overrides any older Hallow-specific wording or dark-theme examples
below. The report must use the shared Lazyweb report furniture from `AGENTS.md`:

- Section #1 is the light-blue Agent Instructions copy block.
- Define and use the shared tokens `--ink:#1f2328; --mut:#57606a;
  --line:#d0d7de; --soft:#eef4fb; --accent:#0969da`.
- Use `.deck` for evidence carousels where all references are visible, with
  scroll-snap and prev/next buttons.
- Use `.legend` plus ranked `.rec` cards for the opinionated decision; the #1
  recommendation must be `.rec.lead`.
- Use `.ebadge` and `.corpus` for honest evidence labels and prevalence counts.
- Use `.mock` for CSS fallback mock-frames.

You may reuse the paywall-specific carousel, bbox, diagnosis, and prioritization
components below, but only after the Agent Instructions block and only in a way
that preserves the shared light report tokens and furniture.

**Inline every image as a `data:` URI.** Fetch each Lazyweb `imageUrl`/`image_url`
and each locally-saved screenshot/mockup, base64-encode the bytes, and embed it
as `src="data:image/png;base64,…"`. Never point an `<img>` at a `file://` URL, an
absolute local path, an `http(s)` URL, or a bare `references/…` relative path —
those break the moment the file is moved or the signed URL expires. A tiny
helper makes this one line per image:

```bash
b64_data_uri() {  # usage: b64_data_uri <path-or-url>  → prints a data: URI
  local src="$1" mime="image/png" tmp
  case "$src" in
    data:*) printf '%s' "$src"; return 0;;
    http://*|https://*)
      tmp="$(mktemp)"; curl -fsSL "$src" -o "$tmp" || { rm -f "$tmp"; return 1; }
      src="$tmp";;
  esac
  case "$src" in *.jpg|*.jpeg) mime="image/jpeg";; *.webp) mime="image/webp";; esac
  printf 'data:%s;base64,%s' "$mime" "$(base64 -w0 "$src" 2>/dev/null || base64 "$src" | tr -d '\n')"
  [ -n "$tmp" ] && rm -f "$tmp"
}
```

**Escape every dynamic string you drop into HTML.** Hypothesis titles, claims,
company names, and `alt` text can contain `&`, `<`, `>`, `"`, or apostrophes —
escape them (`&` → `&amp;`, `<` → `&lt;`, `>` → `&gt;`, `"` → `&quot;`) before
interpolating into a tag or attribute. The embedded JS expects valid HTML; an
unescaped quote in an `alt` breaks the slide.

### Document skeleton

Emit exactly this shape (the DOM class names are load-bearing — the embedded JS
drives them, so do not rename, restructure, or drop them):

```html
<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>Paywall Design Recommendation</title>
<style>/* shared Lazyweb tokens + adapted component CSS + .bbox CSS from "Embedded CSS" below */</style>
</head><body>
<!-- 1. AGENT INSTRUCTIONS COPY BLOCK (.ai-block / light-blue shared block) -->
<h1>Paywall Design Recommendation</h1>

<!-- 2. TOP CARD: 3-column carousel (current | mockup | hypothesis) -->
<!-- 3. EVIDENCE CARD: annotated before/after carousel -->
<!-- 4. DIAGNOSIS CARD -->
<!-- 5. PRIORITIZATION CARD -->
<!-- 6. FOOTER -->

<!-- lightbox overlay + scripts -->
<div id="lightbox" class="lightbox hidden" aria-hidden="true"><button class="lightbox-close">&times;</button><button class="lightbox-prev">&larr;</button><img class="lightbox-image" alt="" /><button class="lightbox-next">&rarr;</button></div>
<script>/* paste the verbatim _CAROUSEL_JS block from "Embedded JS" below */</script>
<script>/* paste the verbatim _LIGHTBOX_JS block from "Embedded JS" below */</script>
</body></html>
```

Section order is fixed: **Agent Instructions copy block → title → top
3-column carousel → evidence → diagnosis → prioritization → footer → lightbox +
scripts.**

### 1. Top card — 3-column hypothesis carousel (required)

One `data-carousel-group="top"` card holding a `top-row` with three columns. The
three columns share ONE set of controls; the carousel JS advances all three
`.design-carousel`s in the group in lockstep, so the current-state image stays
put while the mockup and hypothesis text swap per slide.

- **Column 1 — `.paywall-col`** (static): the current paywall screenshot.
- **Column 2 — `.mockup-col`**: a `.design-carousel` with one
  `.design-slide.mockup-slide` per hypothesis; slide `i==0` also gets `active`.
  Each slide holds its per-hypothesis heading and the generated mockup image.
- **Column 3 — `.hypothesis-col`**: a `.design-carousel` with one
  `.design-slide.hypothesis-slide` per hypothesis (slide 0 `active`), each with a
  `.hypothesis-title` (≤3-word title) and a `.hypothesis-subheader` (the full
  "Making X should Y because Z" sentence). Order the slides strongest-first — the
  carousel order carries the prioritization.

Then ONE shared `.design-controls` block (only when there is more than one
hypothesis) with a `.design-prev` button, a `.design-dots` strip of
`.design-dot` spans (each `data-idx="N"`, slide 0 `active`), and a `.design-next`
button.

```html
<div class="card" data-carousel-group="top">
<div class="top-row">
  <div class="paywall-col">
    <h3 class="col-heading">Current</h3>
    <img class="lightbox-img" src="data:image/png;base64,…" alt="Current paywall" />
  </div>
  <div class="mockup-col">
    <div class="design-carousel">
      <div class="design-slide mockup-slide active">
        <h3 class="col-heading mockup-heading">Hypothesis #1</h3>
        <img class="lightbox-img" src="data:image/png;base64,…" alt="Mockup 1" />
      </div>
      <div class="design-slide mockup-slide">
        <h3 class="col-heading mockup-heading">Hypothesis #2</h3>
        <img class="lightbox-img" src="data:image/png;base64,…" alt="Mockup 2" />
      </div>
    </div>
  </div>
  <div class="hypothesis-col">
    <div class="design-carousel">
      <div class="design-slide hypothesis-slide active">
        <div class="hypothesis-title">Locked-tier grid</div>
        <div class="hypothesis-subheader">Making … should … because ….</div>
      </div>
      <div class="design-slide hypothesis-slide">
        <div class="hypothesis-title">Trial reminder</div>
        <div class="hypothesis-subheader">Making … should … because ….</div>
      </div>
    </div>
  </div>
</div>
<div class="design-controls">
  <button class="design-btn design-prev">← Previous</button>
  <div class="design-dots">
    <span class="design-dot active" data-idx="0"></span>
    <span class="design-dot" data-idx="1"></span>
  </div>
  <button class="design-btn design-next">Next →</button>
</div>
</div>
```

When a mockup falls back to a CSS mock-frame (ladder rung c), put the `.mock`
frame inside the `.mockup-slide` in place of the `<img>`. Never leave a slide
empty and never emit ASCII art.

### 2. Evidence card — annotated before/after carousel with bbox overlays (required)

A second independent `data-carousel-group="evidence"` card. One
`.design-slide.evidence-slide` per hypothesis that has corpus evidence (slide 0
`active`). Each slide has a `.col-heading.slide-heading` ("Evidence for
Hypothesis N"), then an `.evidence-body` split into the `.evidence-imgpair`
(before/after columns) and the `.evidence-text`.

Each before/after image lives in a `.ba-col` and is wrapped in a `.ba-imgwrap`
so a `.bbox` overlay can be absolutely positioned over it (see "Annotated
learnings + bbox overlays" below for how to compute the rect). The
`.evidence-text` carries the annotated learning, NOT a raw changelog:

- `.recommendation-title` — "[hypothesis title] in [Company] app".
- `.delta` — the curated `learning` (from `lazyweb_search_ab_tests`) or
  `visionDescription` (from `lazyweb_search`). Never paste a raw `what_changed`.
- optional `.lift-cause-label` + `.lift-cause` — "How we apply it" on this paywall.

```html
<div class="card" data-carousel-group="evidence">
<div class="design-carousel">
  <div class="design-slide evidence-slide active">
    <h3 class="col-heading slide-heading">Evidence for Hypothesis 1</h3>
    <div class="evidence-body">
      <div class="evidence-imgpair">
        <div class="ba-col">
          <div class="ba-imgwrap">
            <img class="lightbox-img" src="data:image/png;base64,…" alt="control" loading="lazy" />
            <div class="bbox ann-active" data-ann="0" data-label="1" style="left:8.00%;top:54.00%;width:84.00%;height:12.00%;"></div>
          </div>
          <div class="ba-label-below">Before</div>
        </div>
        <div class="ba-col">
          <div class="ba-imgwrap">
            <img class="lightbox-img" src="data:image/png;base64,…" alt="experiment" loading="lazy" />
            <div class="bbox ann-active" data-ann="0" data-label="1" style="left:8.00%;top:50.00%;width:84.00%;height:18.00%;"></div>
          </div>
          <div class="ba-label-below">After</div>
        </div>
      </div>
      <div class="evidence-text">
        <div class="recommendation-title">Locked-tier grid in Acme app</div>
        <div class="delta">The curated annotated learning sentence…</div>
        <div class="lift-cause-label">How we apply it</div>
        <div class="lift-cause">On this paywall we …</div>
      </div>
    </div>
  </div>
</div>
<div class="design-controls">
  <button class="design-btn design-prev">← Previous</button>
  <div class="design-dots"><span class="design-dot active" data-idx="0"></span></div>
  <button class="design-btn design-next">Next →</button>
</div>
</div>
```

The `.bbox` overlay is given the `ann-active` class statically so the highlight
is visible on load (the experiment-report bbox JS that toggles it per-row is not
embedded here; the box should simply show). `style` positions it as a percentage
of the wrapping image — `left`/`top`/`width`/`height` — so it scales with the
image. Omit the whole evidence card if no hypothesis has corpus evidence.

### 3. Diagnosis card

A `.card` titled with a `.col-heading` and a `.diagnosis-list` of `.diag-row`s —
your pre-hypothesis problem read of THIS paywall. Each row carries a severity
class (`sev-high` / `sev-medium` / `sev-low` / `sev-none`), a `.diag-head`
(badge + type + optional "→ Hypothesis #N"), a `.diag-summary`, and optional
`.diag-meta` (location / evidence). Use `sev-none` (green) rows for genuine
strengths — name what the paywall already does well; do not invent a problem to
fill a row.

### 4. Prioritization card

A `.card` with a `.basic-table` (`is-selected` highlights the chosen
hypotheses): rank, hypothesis title + text, and a one-line assessment of why it
made (or didn't make) the cut. This is where the ordering decision is shown in
the body, not just implied by carousel order.

### 5. Footer

Append a small muted footer paragraph:
`<p class="muted">Powered by Lazyweb — turn your agent into a design researcher… for free!</p>`

### Embedded CSS — adapt into the `<style>` block

Use this block as component CSS for the paywall-specific DOM and JS below, but
adapt its page-level palette to the shared Lazyweb tokens from "Shared report
furniture compliance" above. Do not ship a dark-theme report.

```css
:root { color-scheme: dark; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  max-width: 1320px; margin: 2em auto; padding: 0 1.5em;
  line-height: 1.6; background: #161616; color: #e6e6e6;
}
a { color: #8ab4f8; }
h1 { margin-top: 0; }
h2, h3, h4 { color: #fafafa; }
.muted { color: #9a9a9a; }
code { background: #2a2a2a; padding: 1px 6px; border-radius: 3px; color: #f0e0c0; font-size: .92em; }
.card {
  border: 1px solid #303030; border-radius: 10px;
  padding: 1.25em 1.5em; margin: 1.25em 0; background: #1f1f1f;
}
.col-heading {
  margin: 0 0 .75em; color: #fafafa; font-size: 1.25em; font-weight: 600;
}
.slide-heading {
  margin: 0 0 1em;
}

/* Top row — 3 columns: current paywall | mockup carousel | hypothesis text */
.top-row { display: flex; gap: 2em; align-items: flex-start; margin: 1em 0; }
.top-row .paywall-col { flex: 0 0 300px; }
.top-row .paywall-col img {
  width: 100%; height: auto; border: 1px solid #303030; border-radius: 8px;
  cursor: zoom-in;
}
.top-row .mockup-col { flex: 0 0 300px; }
.top-row .mockup-col .mockup-slide img {
  width: 100%; height: auto; border: 1px solid #303030; border-radius: 8px;
  cursor: zoom-in;
}
/* Iteration: New / Prior toggle inside a single slide. Image stays full size;
   user flips between versions via the tab strip above. Only renders when this
   hypothesis has a prior version to compare against. */
.mockup-toggle {
  display: inline-flex; gap: 0; margin: .65em 0 0; padding: 2px;
  background: #1a1a1a; border: 1px solid #303030; border-radius: 6px;
}
.mockup-toggle-btn {
  background: transparent; color: #999; border: 0; padding: 4px 10px;
  font: inherit; font-size: .78em; font-weight: 600; letter-spacing: .03em;
  text-transform: uppercase; border-radius: 4px; cursor: pointer;
  transition: background .12s, color .12s;
}
.mockup-toggle-btn:hover { color: #fafafa; }
.mockup-toggle-btn.active {
  background: #2a3a55; color: #cfdeff; cursor: default;
}
.mockup-toggle-btn.active[data-target="prior"] {
  background: #3a3025; color: #f0d9b0;
}
.mockup-view-wrapper { position: relative; }
.mockup-view.hidden { display: none; }
/* Per-version feedback caption shown below the toggle. Small, muted, swaps
   on tab click. Reserves no height when empty so the layout doesn't jump. */
.mockup-feedback-caption {
  margin: .55em 0 0; font-size: .82em; color: #aaa; line-height: 1.45;
  font-style: italic; max-width: 100%; word-wrap: break-word;
}
.mockup-feedback-caption.hidden { display: none; }
.top-row .hypothesis-col { flex: 1; min-width: 0; padding-top: .5em; }
.top-row .hypothesis-slide .hypothesis-title {
  font-size: 1.55em; font-weight: 700; color: #fafafa; margin-bottom: .65em;
  line-height: 1.2; letter-spacing: -.01em;
  /* Allow wrapping; never clip with ellipsis. */
  word-break: break-word; overflow-wrap: anywhere;
}
.top-row .hypothesis-slide .hypothesis-subheader {
  font-size: 1em; color: #cccccc; line-height: 1.55;
}
.top-row .hypothesis-slide .hypothesis-subheader code {
  font-size: .9em; background: #232323; color: #f0e0c0;
  padding: 2px 6px; border-radius: 3px;
}

/* Per-hypothesis "carried from prior" tag, shown above the title on a card
   whose hypothesis traces back to a prior run's hypothesis. */
.prior-tag {
  display: inline-block; font-size: .72em; font-weight: 600; letter-spacing: .03em;
  text-transform: uppercase; color: #f0e0c0; background: #2a2410;
  border: 1px solid #5a4a20; border-radius: 3px;
  padding: 2px 6px; margin-bottom: .55em;
}
.prior-tag.unchanged { color: #b8e0b8; background: #102a10; border-color: #2a5a2a; }

/* Peer-cohort benchmark — ranked component prevalence with has/missing flag */
.bench-chart { margin-top: .5em; }
.bench-row {
  display: grid;
  grid-template-columns: 220px 1fr 52px 130px;
  gap: 1em; align-items: center; margin: .35em 0; font-size: .92em;
}
.bench-row.off .bench-label { color: #c9c9c9; }
.bench-row.on .bench-label { color: #e6e6e6; }
.bench-track {
  height: 9px; background: #232323; border-radius: 4px; overflow: hidden;
}
.bench-fill { height: 100%; border-radius: 3px; }
.bench-fill.on { background: #7a9cf0; }
.bench-fill.off { background: #6a6a6a; }
.bench-pct {
  color: #fafafa; text-align: right; font-variant-numeric: tabular-nums;
  font-size: .9em;
}
.bench-indicator { text-align: right; }
.bench-flag {
  display: inline-block; padding: .15em .65em; border-radius: 999px;
  font-size: .75em; font-weight: 600; text-transform: uppercase;
  letter-spacing: .04em; white-space: nowrap;
}
.bench-flag.on  { background: #1f2e1f; color: #7fc77f; border: 1px solid #2c4a2c; }
.bench-flag.off { background: #2a2218; color: #d8a85f; border: 1px solid #3e2f1c; }
.bench-missing-inline {
  color: #d8a85f; font-weight: 600;
}

/* Winning-strategies chart — count-first layout with trigger keywords */
.strat-chart { margin-top: .5em; }
.strat-row {
  display: grid;
  grid-template-columns: 1fr 80px 140px;
  gap: 1em; align-items: center;
  margin: .55em 0; padding: .35em 0;
  border-top: 1px solid #232323;
}
.strat-row:first-child { border-top: none; }
.strat-row.muted { opacity: .42; }
.strat-label { color: #fafafa; font-weight: 600; font-size: .98em; }
.strat-triggers {
  color: #9a9a9a; font-size: .82em; font-style: italic;
  margin-top: .15em;
}
.strat-count {
  font-variant-numeric: tabular-nums; text-align: right;
}
.strat-count .strat-count-big {
  color: #fafafa; font-size: 1.05em; font-weight: 600;
}
.strat-count .strat-count-of {
  color: #8a8a8a; font-size: .82em;
}
.strat-count .strat-pct {
  display: block; color: #8a8a8a; font-size: .78em; margin-top: .1em;
}
.strat-row .bench-indicator { text-align: right; }

/* Trends chart — diverging bar around a center axis. Stripped of pills,
 * descriptions, and unit jargon: just label / bar / number. Compact rows
 * so the whole pattern reads at a glance. */
.trend-chart { margin-top: .75em; }
/* 4-column grid: label, bar axis, number, optional flag. The 4th column is
 * reserved in EVERY row so the components chart's "on your paywall" pill and
 * the strategies chart's flagless rows share an identical column layout —
 * keeping the center axes and number columns aligned ACROSS the two charts.
 * Strategy rows simply leave the 4th cell empty. */
.trend-row {
  display: grid;
  grid-template-columns: 200px 1fr 60px 145px;
  gap: 1.2em; align-items: center;
  margin: .25em 0; padding: .2em 0;
}
.trend-label { color: #e6e6e6; font-size: .92em; font-weight: 500; }
/* The bar track: a wide rectangle with a crisp center axis line. */
.trend-bar-axis {
  position: relative; height: 14px;
  background-image: linear-gradient(
    to right,
    transparent calc(50% - 1px),
    #6a6a6a calc(50% - 1px),
    #6a6a6a calc(50% + 1px),
    transparent calc(50% + 1px)
  );
}
.trend-bar {
  position: absolute; top: 2px; height: 10px; border-radius: 2px;
}
.trend-bar.pos { left: 50%; background: #5d9c5d; }
.trend-bar.neg { right: 50%; background: #b87a3d; }
.trend-num {
  font-variant-numeric: tabular-nums; text-align: right;
  font-size: .85em; font-weight: 600; color: #aaaaaa;
}
.trend-num.pos { color: #7fc77f; }
.trend-num.neg { color: #d8a85f; }

/* Mockup column heading is per-slide ("Hypothesis #X") — no purple accent */
.top-row .mockup-col .mockup-heading {
  margin: 0 0 .75em;
  color: #fafafa;
}

/* Carousel — slides hidden by default, only active shown */
.design-carousel .design-slide { display: none; }
.design-carousel .design-slide.active { display: block; }
.design-controls {
  display: flex; align-items: center; justify-content: space-between;
  gap: 1em; margin-top: 1.5em; padding-top: 1em;
  border-top: 1px solid #2a2a2a;
}
.design-btn {
  background: #2a2a2a; color: #fafafa; border: 1px solid #404040;
  border-radius: 6px; padding: .45em 1em; cursor: pointer; font-size: .92em;
  font-family: inherit;
}
.design-btn:hover { background: #3a3a3a; }
.design-btn:disabled { opacity: .35; cursor: default; }
.design-dots { display: flex; gap: .45em; align-items: center; }
.design-dot {
  width: 9px; height: 9px; border-radius: 50%;
  background: #404040; cursor: pointer; transition: background 0.15s;
}
.design-dot:hover { background: #555; }
.design-dot.active { background: #7a9cf0; }

/* Evidence card — corpus before/after carousel */
.evidence-slide .evidence-body { display: flex; gap: 2em; align-items: flex-start; }
.evidence-slide .evidence-imgpair { flex: 0 0 auto; display: flex; gap: 1em; }
.evidence-slide .evidence-imgpair .ba-col {
  display: flex; flex-direction: column; align-items: center; width: 220px;
}
.evidence-slide .evidence-imgpair .ba-col img {
  width: 220px; max-width: 220px; height: auto; border: 1px solid #303030;
  border-radius: 8px; background: #0a0a0a; margin: 0; cursor: zoom-in;
}
.evidence-slide .evidence-imgpair .ba-label-below {
  margin-top: .6em; font-size: .75em; color: #9a9a9a;
  text-transform: uppercase; letter-spacing: .08em; font-weight: 600; text-align: center;
}
.evidence-slide .evidence-text { flex: 1; min-width: 0; padding-top: .5em; }
.evidence-slide .evidence-text .recommendation-title {
  font-size: 1.15em; font-weight: 600; color: #fafafa;
  margin: 0 0 .85em; line-height: 1.3;
}
.evidence-slide .evidence-text .delta {
  font-size: 1em; color: #e6e6e6; line-height: 1.55; margin-bottom: .85em;
}
.evidence-slide .evidence-text .lift-cause {
  font-size: .92em; color: #cccccc; line-height: 1.5;
}
.evidence-slide .evidence-text .lift-cause-label {
  font-size: .72em; color: #9a9a9a; text-transform: uppercase; letter-spacing: .08em;
  margin-bottom: .25em; font-weight: 600;
}

/* ========== Prioritization logic — plain tables, info-dense ==========
   Top: a single table of the final selected hypotheses. Below: tabs per
   source showing ALL hypotheses that source proposed, with selected rows
   highlighted. Stripped of ornament — readable density, not visual flair. */
.priority-intro {
  font-size: .9em; color: #9c9c9c; margin: 0 0 1.4em; line-height: 1.55;
}
.priority-intro strong { color: #fafafa; font-weight: 600; }

.priority-section-label {
  font-size: .78em; font-weight: 700; letter-spacing: .12em;
  text-transform: uppercase; color: #d8b66f;
  margin: 1.6em 0 .65em;
}

.basic-table {
  width: 100%; border-collapse: collapse; font-size: .9em;
  margin-bottom: 1em;
}
.basic-table th {
  text-align: left; font-weight: 600; font-size: .78em;
  text-transform: uppercase; letter-spacing: .07em; color: #888;
  border-bottom: 1px solid #333; padding: .6em .9em;
}
.basic-table td {
  padding: .85em .9em; border-bottom: 1px solid #1f1f1f;
  vertical-align: top; color: #c8c8c8; line-height: 1.55;
}
.basic-table tr:last-child td { border-bottom: none; }
.basic-table tr.is-selected td { background: rgba(216, 182, 111, .05); }
.basic-table tr.is-selected td:first-child {
  border-left: 3px solid #d8b66f;
  padding-left: calc(.9em - 3px);
}
.basic-table tr.is-rejected td { color: #7a7a7a; }

.basic-table .col-rank {
  width: 3em; font-variant-numeric: tabular-nums; font-weight: 600;
  color: #d8b66f; white-space: nowrap;
}
.basic-table tr.is-rejected .col-rank { color: #555; font-weight: 400; }
.basic-table .col-hyp { width: 42%; }
.basic-table .col-assess { width: 50%; }
.basic-table .hyp-title {
  font-weight: 600; color: #fafafa; font-size: 1em; margin-bottom: .3em;
}
.basic-table tr.is-rejected .hyp-title { color: #b0b0b0; font-weight: 500; }
.basic-table .hyp-text { color: #b8b8b8; font-size: .92em; }
.basic-table tr.is-rejected .hyp-text { color: #777; }
.basic-table .assess-reject {
  font-style: italic; color: #888; font-size: .9em;
}
/* Evidence-tab row anatomy: company [R#] header, winning-move atom, and
   (for applied rows) an "Applied as:" callout that surfaces the
   hypothesis that was derived from this experiment. */
.basic-table .ev-ref {
  color: #888; font-weight: 400; font-size: .9em; margin-left: .35em;
}
.basic-table .ev-move {
  color: #b8b8b8; font-size: .9em; margin-top: .2em; line-height: 1.45;
}
.basic-table tr.is-rejected .ev-move { color: #777; }
.basic-table .ev-applied-hyp {
  margin-top: .55em; padding-top: .55em;
  border-top: 1px dashed #2a2a2a; font-size: .9em;
}
.basic-table .ev-applied-label {
  color: #d8b66f; font-weight: 600; font-size: .78em;
  text-transform: uppercase; letter-spacing: .06em;
}
.basic-table .ev-applied-title {
  color: #fafafa; font-weight: 600; margin-left: .35em;
}

/* Tabs for the per-source view (legacy; kept for any audit/rerender
   that still emits tabs) */
.priority-tabs .tab-bar {
  display: flex; gap: 0; border-bottom: 1px solid #333;
  margin-bottom: .8em;
}
.priority-tabs .tab-btn {
  background: transparent; border: 0; color: #888; cursor: pointer;
  padding: .7em 1.2em; font-size: .9em; font-weight: 500;
  border-bottom: 2px solid transparent;
  font-family: inherit;
  transition: color .15s, border-color .15s;
}
.priority-tabs .tab-btn:hover { color: #d8d8d8; }
.priority-tabs .tab-btn.active {
  color: #fafafa; border-bottom-color: #d8b66f;
}
.priority-tabs .tab-btn .tab-n {
  margin-left: .4em; color: #666; font-size: .85em;
  font-variant-numeric: tabular-nums;
}
.priority-tabs .tab-panel { display: none; }
.priority-tabs .tab-panel.active { display: block; }

/* Unified input-data table — collapsible <details>, only relevant rows
   rendered (the LLM already graded out the rest). Columns:
   # | Datapoint | Category | Assessment. */
.unified-details {
  margin: .2em 0;
}
.unified-summary {
  cursor: pointer; padding: .55em .2em; font-size: .92em;
  color: #d8d8d8; user-select: none; list-style: none;
}
.unified-summary::before {
  content: '▸';
  display: inline-block; margin-right: .55em;
  color: #888; transition: transform .15s;
}
.unified-details[open] > .unified-summary::before {
  transform: rotate(90deg);
}
.unified-summary:hover { color: #fafafa; }
.unified-summary .muted { margin-left: .3em; font-size: .9em; }
.unified-table { margin-top: .6em; }
.unified-table .col-data { width: 38%; }
.unified-table .col-cat {
  width: 11em; color: #b8b8b8; font-size: .9em; white-space: nowrap;
}
.unified-table .col-assess { width: auto; }
.unified-table tr.is-relevant td:first-child {
  border-left: 3px solid #6ec07a;
  padding-left: calc(.9em - 3px);
}

/* Relevant / All toggle above the Referenced-data table. Mirrors the
   stack-rank category-filter pill look so the two filter affordances read
   as the same language. Default-active = Relevant (the datapoints the LLM
   actually used); "All" reveals the rows it graded out so the full
   evaluated set can be audited. */
.unified-toggle {
  display: flex; gap: .4em; flex-wrap: wrap; margin: .7em 0 .2em;
}
.unified-toggle-btn {
  background: transparent; border: 1px solid #444; color: #b8b8b8;
  cursor: pointer; padding: .35em .9em; font-size: .82em;
  font-family: inherit; border-radius: 4px; font-weight: 500;
  transition: border-color .15s, color .15s, background .15s;
}
.unified-toggle-btn:hover { color: #fafafa; border-color: #666; }
.unified-toggle-btn.active {
  color: #1a1a1a; background: #d8b66f; border-color: #d8b66f;
}
.unified-toggle-btn .toggle-n {
  font-variant-numeric: tabular-nums; opacity: .7; margin-left: .15em;
}
.unified-toggle-btn.active .toggle-n { opacity: .85; }

/* Stack-rank table — # | Hypothesis | per-axis scores… | Total | Proposed?
   Compact numeric columns, monospace digits, no collapsibility. */
.stack-rank-table .col-data { width: auto; }
.stack-rank-table .col-score {
  width: 5em; text-align: right; white-space: nowrap;
  font-variant-numeric: tabular-nums; color: #b8b8b8; font-size: .9em;
}
.stack-rank-table .col-total {
  color: #fafafa; font-weight: 600;
  border-left: 1px solid #2a2a2a;
}
.stack-rank-table .col-proposed {
  width: 6em; text-align: center; white-space: nowrap;
  font-size: .92em;
}
.stack-rank-table .col-proposed .rel-yes { color: #6ec07a; }
.stack-rank-table .col-proposed .rel-no { color: #888; }
/* Proposed rows get a subtle row tint instead of a stark left border —
   the ✅ Yes in the Proposed column already says "this made the cut";
   doubling it with a hard green stripe adds noise without info. */
.stack-rank-table tr.is-relevant td { background: rgba(255, 255, 255, .025); }
/* Hypothesis cell: neutral title, slightly-muted description */
.stack-rank-table .rank-title { color: #fafafa; }
.stack-rank-table .rank-desc { color: #b8b8b8; }
/* Category column — small uppercase tag in muted gray. The Category
   *text* names the slot; no need to also color-code it (the user can
   read it). Filter buttons are where category lives visually. */
.stack-rank-table .col-slot {
  width: 9em; white-space: nowrap; font-size: .78em;
  color: #888; text-transform: uppercase; letter-spacing: .06em;
  font-weight: 600;
}
/* Proposed column — make ❌ visually quieter than ✅ so the eye lands
   on the four picks without a wall of red competing for attention. */
.stack-rank-table .col-proposed .rel-yes { color: #c8c8c8; }
.stack-rank-table .col-proposed .rel-no  { color: #555; }
/* Category filter buttons above the stack-rank table — left-aligned,
   single gold active state. "All" reset sits at the right end so the
   category options appear first in scan order. */
.stack-rank-filters {
  display: flex; gap: .4em; flex-wrap: wrap; margin: .4em 0 .8em;
}
.cat-filter-btn {
  background: transparent; border: 1px solid #444; color: #b8b8b8;
  cursor: pointer; padding: .35em .9em; font-size: .82em;
  font-family: inherit; border-radius: 4px; font-weight: 500;
  transition: border-color .15s, color .15s, background .15s;
}
.cat-filter-btn:hover { color: #fafafa; border-color: #666; }
.cat-filter-btn.active {
  color: #1a1a1a; background: #d8b66f; border-color: #d8b66f;
}
/* "Show all" reset — peer button sitting tight with the category
   pills (no auto-margin orphaning it). Quieter treatment than the 4
   categories: dashed border instead of solid, muted text. A small left
   margin gives breathing room from the category cluster so it reads as
   "related but distinct" without floating away into white space. */
.cat-all-link {
  background: transparent; border: 1px dashed #444; color: #888;
  cursor: pointer; padding: .35em .9em; font-size: .82em;
  font-family: inherit; font-weight: 500; border-radius: 4px;
  margin-left: .6em;
  transition: border-color .15s, color .15s, background .15s;
}
.cat-all-link:hover {
  color: #fafafa; border-color: #666;
}
.cat-all-link.active {
  color: #1a1a1a; background: #d8b66f; border-color: #d8b66f;
  border-style: solid;
}

/* ========== Diagnosis card — the model's pre-hypothesis problem read ==========
   One row per diagnosed problem: a head line (severity badge · type tag · id ·
   optional "→ Hypothesis #N" link), the problem summary, then muted
   location / evidence meta. The left border is tinted by severity so the
   high-severity problems are findable at a glance; `none` rows are strengths
   and render green. */
.diagnosis-list { margin-top: .5em; }
.diag-row {
  border-left: 3px solid #6a6a6a;
  border-top: 1px solid #232323;
  padding: .75em 0 .75em 1em; margin: 0;
}
.diag-row:first-child { border-top: none; }
.diag-row.sev-high   { border-left-color: #d06a6a; }
.diag-row.sev-medium { border-left-color: #d8a85f; }
.diag-row.sev-low    { border-left-color: #7a9cf0; }
.diag-row.sev-none   { border-left-color: #5d9c5d; }
.diag-head {
  display: flex; flex-wrap: wrap; align-items: center; gap: .55em;
  margin-bottom: .4em;
}
.diag-sev {
  display: inline-block; padding: .12em .65em; border-radius: 999px;
  font-size: .72em; font-weight: 700; text-transform: uppercase;
  letter-spacing: .05em; white-space: nowrap;
  border: 1px solid #444; color: #c9c9c9; background: #232323;
}
.diag-sev.sev-high   { background: #2e1d1d; color: #e08585; border-color: #4a2c2c; }
.diag-sev.sev-medium { background: #2a2218; color: #d8a85f; border-color: #3e2f1c; }
.diag-sev.sev-low    { background: #1d2330; color: #8ab0f0; border-color: #2c3650; }
.diag-sev.sev-none   { background: #1f2e1f; color: #7fc77f; border-color: #2c4a2c; }
.diag-type {
  font-size: .78em; color: #9a9a9a; text-transform: uppercase;
  letter-spacing: .05em; font-weight: 600;
}
.diag-id {
  font-size: .78em; color: #777; font-variant-numeric: tabular-nums;
}
.diag-applied {
  font-size: .8em; color: #d8b66f; font-weight: 600; margin-left: auto;
}
.diag-summary {
  color: #fafafa; font-size: .98em; line-height: 1.5; margin-bottom: .4em;
}
.diag-meta {
  display: flex; flex-direction: column; gap: .3em;
  font-size: .86em; color: #aaaaaa; line-height: 1.5;
}
.diag-meta-label {
  text-transform: uppercase; letter-spacing: .06em; font-size: .82em;
  color: #777; font-weight: 600; margin-right: .35em;
}

/* Other inspiration grid — cards with screenshots, click to lightbox */
.divergent-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1em; margin-top: .75em;
}
.divergent-card {
  background: #181818; border: 1px solid #303030; border-radius: 8px;
  overflow: hidden; display: flex; flex-direction: column;
}
.divergent-imgwrap {
  background: #0a0a0a;
  display: flex; align-items: center; justify-content: center;
  height: 280px; overflow: hidden;
}
.divergent-imgwrap img {
  max-width: 100%; max-height: 280px; width: auto; height: auto;
  object-fit: contain; border-radius: 0; border: 0; margin: 0;
}
.divergent-meta { padding: .85em 1em; }
.divergent-card .pattern { font-size: .92em; color: #fafafa; margin-bottom: .4em; line-height: 1.4; }
.divergent-card .pattern-list {
  margin: 0 0 .4em; padding-left: 1.1em;
  font-size: .9em; color: #fafafa; line-height: 1.4;
}
.divergent-card .pattern-list li { margin-bottom: .25em; }
.divergent-card .companies { font-size: .75em; color: #9a9a9a; text-transform: uppercase; letter-spacing: .04em; }

.data-subsection { margin: 1.5em 0 1em; }
.data-subsection h4 {
  margin: 0 0 .35em; font-size: 1.05em; font-weight: 600; color: #fafafa;
}
.data-subsection .data-sub { color: #9a9a9a; font-size: .88em; margin-bottom: .85em; }

/* Lightbox (reused) */
.lightbox-img { cursor: zoom-in; transition: filter 0.15s; }
.lightbox-img:hover { filter: brightness(1.08); }
.lightbox {
  position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,0.92);
  display: flex; align-items: center; justify-content: center; padding: 2.5em 4em; cursor: zoom-out;
}
.lightbox.hidden { display: none; }
.lightbox-image {
  max-width: 100%; max-height: 100%; width: auto; height: auto; object-fit: contain;
  border-radius: 6px; background: #0a0a0a; cursor: default;
}
.lightbox-close, .lightbox-prev, .lightbox-next {
  position: absolute; background: rgba(40,40,40,0.9); color: #fafafa;
  border: 1px solid #555; border-radius: 50%; width: 44px; height: 44px;
  font-size: 1.5em; line-height: 0; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.lightbox-close { top: 1.25em; right: 1.25em; }
.lightbox-prev { left: 1em; top: 50%; transform: translateY(-50%); }
.lightbox-next { right: 1em; top: 50%; transform: translateY(-50%); }

/* ===========================================================================
   MOBILE / RESPONSIVE  —  additive only. Everything below is gated on a
   max-width media query (or has no effect on mouse input), so the desktop
   layout at >= 761px renders identically to before. Goals:
     1. reflow every multi-column block into one tap-friendly column
     2. enlarge touch targets to ~44px so taps actually register
     3. keep all UI visible — no horizontal scroll, no pinch-zoom needed
   =========================================================================== */

/* Remove the 300ms tap delay + double-tap-zoom on interactive elements.
   touch-action only affects touch input, so mouse/desktop is unchanged. */
.design-btn, .design-dot,
.lightbox-img, .lightbox-close, .lightbox-prev, .lightbox-next,
.top-row .paywall-col img, .top-row .mockup-col .mockup-slide img,
.evidence-slide .evidence-imgpair .ba-col img, .divergent-imgwrap img {
  touch-action: manipulation;
}

@media (max-width: 760px) {
  body {
    margin: 1em auto; padding: 0 1em; line-height: 1.55;
    overflow-x: hidden;          /* clip any stray sub-pixel overflow */
    overflow-wrap: break-word;   /* long tokens/URLs wrap instead of widening */
  }
  h1 { font-size: 1.5em; }
  .card { padding: 1.05em 1em; margin: 1em 0; }
  .col-heading { font-size: 1.15em; }

  /* Top row: stack current / mockup / hypothesis into one column. The first
     two are portrait phone screenshots — show them full width, centered, and
     capped so they don't tower past the first screen. */
  .top-row { flex-direction: column; gap: 1.35em; }
  .top-row .paywall-col,
  .top-row .mockup-col { flex: none; width: 100%; }
  .top-row .paywall-col img,
  .top-row .mockup-col .mockup-slide img {
    width: auto; max-width: 100%; max-height: 72vh;
    display: block; margin: 0 auto;
  }
  .top-row .hypothesis-col { padding-top: .25em; }
  .top-row .hypothesis-slide .hypothesis-title { font-size: 1.3em; }

  /* Peer benchmark: label on its own line, then bar | pct | flag below.
     Row children are: label, track, pct, indicator. */
  .bench-row {
    grid-template-columns: 1fr auto auto;
    gap: .45em .7em; margin: .6em 0;
  }
  .bench-label { grid-column: 1 / -1; }
  .bench-track { align-self: center; }

  /* Strategy rows (unused in this report, kept for parity). */
  .strat-row { grid-template-columns: 1fr auto; gap: .4em .7em; }

  /* Consensus-movement: keep the diverging bar inline — it IS the chart —
     just tighten the label gutter so it fits a phone. */
  .trend-row { grid-template-columns: 92px 1fr 38px; gap: .65em; }
  .trend-row.with-flag {
    grid-template-columns: 92px 1fr 38px;
    gap: .45em .65em;
  }
  /* Mobile: flag drops below the bar row so it doesn't squeeze the chart. */
  .trend-row.with-flag .bench-indicator {
    grid-column: 1 / -1; justify-self: start; padding-left: 92px;
  }
  .trend-label { font-size: .84em; }

  /* Evidence before/after: stack image pair above the text, but keep the two
     shots side-by-side so the before->after comparison stays readable. */
  .evidence-slide .evidence-body { flex-direction: column; gap: 1.15em; }
  .evidence-slide .evidence-imgpair { flex: 1 1 auto; gap: .6em; }
  .evidence-slide .evidence-imgpair .ba-col { width: auto; flex: 1 1 0; min-width: 0; }
  .evidence-slide .evidence-imgpair .ba-col img { width: 100%; max-width: 100%; }

  /* Inspiration grid: single column, shorter image wells. */
  .divergent-grid { grid-template-columns: 1fr; gap: .85em; }
  .divergent-imgwrap { height: 230px; }
  .divergent-imgwrap img { max-height: 230px; }

  /* Diagnosis: when the head line wraps, let the hypothesis link sit inline
     with the badges instead of being shoved to the far right. */
  .diag-applied { margin-left: 0; }

  /* Tables don't shrink gracefully — the Prioritization table has 8
     columns and the Referenced Data table 4 wide ones. On mobile they
     blow past viewport width. Wrap each in a horizontal scroller and
     tighten cell padding so more fits before scroll kicks in. */
  .stack-rank-wrap, .unified-table-wrap {
    overflow-x: auto; -webkit-overflow-scrolling: touch;
    margin: 0 -1em; padding: 0 1em;  /* edge-to-edge scroll on phone */
  }
  /* When the unified table sits inside <details>, the wrap might not
     exist — apply the scroll to the <details> too as a fallback. */
  .unified-details {
    overflow-x: auto; -webkit-overflow-scrolling: touch;
  }
  .basic-table { font-size: .82em; }
  .basic-table th, .basic-table td { padding: .55em .55em; }
  .stack-rank-table { min-width: 640px; }   /* preserve column legibility */
  .unified-table    { min-width: 540px; }
  /* Filter buttons can crowd on phones — let them wrap freely. */
  .stack-rank-filters, .unified-toggle { gap: .35em; }
  .cat-filter-btn, .cat-all-link, .unified-toggle-btn {
    padding: .4em .75em; font-size: .8em; min-height: 36px;
  }

  /* ---- Tap targets ---- */
  .design-controls { gap: .5em; margin-top: 1.1em; }
  .design-btn {
    padding: .65em 1.1em; font-size: 1em;
    min-height: 44px; min-width: 64px;
  }
  /* The 9px dots are far too small to tap. Keep the visible dot small/round
     but overlay a 44px transparent hit area (a pseudo-element forwards taps
     to its host, so the dot's existing click handler fires). */
  .design-dots { gap: .5em; }
  .design-dot { position: relative; width: 11px; height: 11px; }
  .design-dot::after {
    content: ""; position: absolute; top: 50%; left: 50%;
    width: 44px; height: 44px; transform: translate(-50%, -50%);
  }

  /* Lightbox: shrink the chrome so the zoomed image is actually big on a
     phone; keep the 44px round controls reachable. */
  .lightbox { padding: 3.25em .55em; }
  .lightbox-close { top: .55em; right: .55em; }
  .lightbox-prev { left: .35em; }
  .lightbox-next { right: .35em; }
}
```

Plus this `.bbox` overlay treatment (the "bounding box around the reference
image, dim outside it" effect) — append it inside the SAME `<style>` block:

```css
.ba-imgwrap { position: relative; display: block; line-height: 0; }
.ba-imgwrap img { display: block; }
.bbox {
  position: absolute; box-sizing: border-box;
  border: 2px solid #ff8c2a;
  background: rgba(255, 140, 42, 0.10);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.55);
  border-radius: 3px;
  pointer-events: none;
  opacity: 0; transition: opacity .15s ease;
}
.bbox.ann-active { opacity: 1; }
.bbox::after {
  content: attr(data-label);
  position: absolute; top: -1px; left: -1px;
  background: #ff8c2a; color: #1a1a1a;
  font: 600 10px/1 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  padding: 2px 5px; border-radius: 2px 0 3px 0;
  letter-spacing: .04em;
}
```

### Embedded JS — paste VERBATIM before `</body>`

First the carousel driver (drives every `[data-carousel-group]`, its
`.design-slide.active`, `.design-dot`, and prev/next):

```js

(function(){
  // INDEPENDENT carousel groups. Each [data-carousel-group] container holds:
  //   - one or more .design-carousel content areas (synced WITHIN the group)
  //   - one .carousel-controls with its own prev/next/dots
  // Different groups advance independently of each other.
  document.querySelectorAll('[data-carousel-group]').forEach(function(group){
    var carousels = group.querySelectorAll('.design-carousel');
    var dots = group.querySelectorAll('.design-dot');
    var prevBtn = group.querySelector('.design-prev');
    var nextBtn = group.querySelector('.design-next');
    if (carousels.length === 0) return;
    // Slide count = max slides across carousels in the group (they should all
    // have the same length; if not, we treat the max as canonical).
    var total = 0;
    carousels.forEach(function(c){
      var n = c.querySelectorAll('.design-slide').length;
      if (n > total) total = n;
    });
    if (total === 0) return;
    var current = 0;

    function show(idx, scrollIntoView){
      if (idx < 0) idx = 0;
      if (idx >= total) idx = total - 1;
      var prevIdx = current;
      current = idx;
      carousels.forEach(function(c){
        var slides = c.querySelectorAll('.design-slide');
        slides.forEach(function(s, i){ s.classList.toggle('active', i === idx); });
      });
      dots.forEach(function(d, i){ d.classList.toggle('active', i === idx); });
      if (prevBtn) prevBtn.disabled = (idx === 0);
      if (nextBtn) nextBtn.disabled = (idx === total - 1);
      group.dataset.current = String(idx);
      // On mobile the top-row stacks vertically, so the swapped slide
      // content lives well ABOVE the controls. Without auto-scroll the
      // user taps Next at the bottom of a tall card and sees nothing
      // change. Scroll the group's top into view so the new slide is
      // visible. Only triggered by explicit user actions (click/swipe/
      // keyboard), not the initial show(0).
      if (scrollIntoView && prevIdx !== idx && window.matchMedia('(max-width: 760px)').matches) {
        var rect = group.getBoundingClientRect();
        // Only scroll if the group's top is above the viewport.
        if (rect.top < 0) {
          group.scrollIntoView({behavior: 'smooth', block: 'start'});
        }
      }
    }

    if (prevBtn) prevBtn.addEventListener('click', function(e){ e.stopPropagation(); show(current - 1, true); });
    if (nextBtn) nextBtn.addEventListener('click', function(e){ e.stopPropagation(); show(current + 1, true); });
    dots.forEach(function(d){
      d.addEventListener('click', function(e){
        e.stopPropagation();
        var idx = parseInt(d.dataset.idx || '0', 10);
        show(idx, true);
      });
    });
    show(0, false);
  });

  // Keyboard arrows control the carousel group focused most recently. We track
  // focus by remembering the last-clicked group; default to the FIRST group.
  var lastFocusedGroup = document.querySelector('[data-carousel-group]');
  document.querySelectorAll('[data-carousel-group]').forEach(function(group){
    group.addEventListener('click', function(){ lastFocusedGroup = group; });
  });
  document.addEventListener('keydown', function(e){
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    var lb = document.getElementById('lightbox');
    if (lb && !lb.classList.contains('hidden')) return;
    if (!lastFocusedGroup) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      var prev = lastFocusedGroup.querySelector('.design-prev');
      if (prev && !prev.disabled) prev.click();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      var next = lastFocusedGroup.querySelector('.design-next');
      if (next && !next.disabled) next.click();
    }
  });

  // Touch swipe — advance the carousel group under the finger. Reuses the
  // existing prev/next buttons. Passive + never preventDefault, so vertical
  // scrolling is untouched; a horizontal-intent threshold keeps plain taps
  // from registering as swipes.
  document.querySelectorAll('[data-carousel-group]').forEach(function(group){
    var x0 = 0, y0 = 0, tracking = false;
    group.addEventListener('touchstart', function(e){
      if (e.touches.length !== 1) { tracking = false; return; }
      x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; tracking = true;
    }, {passive: true});
    group.addEventListener('touchend', function(e){
      if (!tracking) return;
      tracking = false;
      var t = e.changedTouches[0];
      var dx = t.clientX - x0, dy = t.clientY - y0;
      if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy) * 1.8) return;
      var btn = group.querySelector(dx < 0 ? '.design-next' : '.design-prev');
      if (btn && !btn.disabled) btn.click();
    }, {passive: true});
  });

  // Iteration toggle — version-chain switch (v1 / v2 / … / v(current)),
  // scoped per slide. Each [data-toggle="version-chain"] strip has N
  // buttons; clicking one shows the matching .mockup-view AND
  // .mockup-feedback-caption siblings and hides the others. The same
  // selector also matches the legacy [data-toggle="prior-vs-new"] from
  // pre-multi-version reports for backward compat.
  document.querySelectorAll(
    '[data-toggle="version-chain"], [data-toggle="prior-vs-new"]'
  ).forEach(function(strip){
    var slide = strip.closest('.mockup-slide');
    if (!slide) return;
    strip.querySelectorAll('.mockup-toggle-btn').forEach(function(btn){
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        var target = btn.dataset.target;
        strip.querySelectorAll('.mockup-toggle-btn').forEach(function(b){
          b.classList.toggle('active', b.dataset.target === target);
        });
        slide.querySelectorAll('.mockup-view').forEach(function(v){
          v.classList.toggle('hidden', v.dataset.view !== target);
        });
        slide.querySelectorAll('.mockup-feedback-caption').forEach(function(c){
          c.classList.toggle('hidden', c.dataset.caption !== target);
        });
      });
    });
  });
})();

```

Then the lightbox driver (zooms any `.lightbox-img` in the active slide):

```js

(function(){
  var lb = document.getElementById('lightbox');
  if (!lb) return;
  var lbImg = lb.querySelector('.lightbox-image');
  var lbClose = lb.querySelector('.lightbox-close');
  var lbPrev = lb.querySelector('.lightbox-prev');
  var lbNext = lb.querySelector('.lightbox-next');
  // Only collect lightbox-eligible images that are currently visible.
  function collectVisible() {
    var imgs = Array.prototype.slice.call(document.querySelectorAll('.lightbox-img'));
    return imgs.filter(function(img){
      // Skip if inside a hidden carousel slide
      var slide = img.closest('.design-slide');
      if (slide && !slide.classList.contains('active')) return false;
      return img.offsetParent !== null;
    });
  }
  var images = []; var current = -1;
  function show(idx){
    if (images.length === 0) return;
    if (idx < 0) idx = images.length - 1;
    if (idx >= images.length) idx = 0;
    current = idx;
    lbImg.setAttribute('src', images[idx].getAttribute('src'));
    lbImg.setAttribute('alt', images[idx].getAttribute('alt') || '');
    var multi = images.length > 1;
    lbPrev.style.display = multi ? '' : 'none';
    lbNext.style.display = multi ? '' : 'none';
  }
  function open(img){
    images = collectVisible();
    var idx = images.indexOf(img);
    if (idx < 0) idx = 0;
    show(idx);
    lb.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
  function close(){
    lb.classList.add('hidden');
    document.body.style.overflow = '';
    current = -1;
  }
  document.querySelectorAll('.lightbox-img').forEach(function(img){
    img.addEventListener('click', function(e){ e.stopPropagation(); open(img); });
  });
  lbPrev.addEventListener('click', function(e){ e.stopPropagation(); show(current - 1); });
  lbNext.addEventListener('click', function(e){ e.stopPropagation(); show(current + 1); });
  lbClose.addEventListener('click', function(e){ e.stopPropagation(); close(); });
  lb.addEventListener('click', function(e){ if (e.target === lb) close(); });
  lbImg.addEventListener('click', function(e){ e.stopPropagation(); });
  document.addEventListener('keydown', function(e){
    if (lb.classList.contains('hidden')) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(current - 1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); show(current + 1); }
    else if (e.key === 'Escape') { e.preventDefault(); close(); }
  });
})();

```

Both go in their own `<script>` tags, carousel first, after the
`<div id="lightbox" …>` overlay markup and before `</body>`.

## When to Use This

- User wants to improve, redesign, optimize, critique, or evaluate a paywall
- User has a paywall screenshot, URL, product brief, or current paywall copy
- User asks how to increase paid conversion, trial starts, annual-plan share, or checkout continuation from a paywall
- User asks for concrete paywall redesign hypotheses, not just a broad A/B test corpus search

## When NOT to Use This

- User asks only for A/B test examples, experiment IDs, or monetization research -> route to `lazyweb-ab-test-research`
- User wants generic pricing-page references outside an app paywall -> route to `lazyweb-deep-design-research` or `lazyweb-lite-design-research`
- User wants creative UI ideas unrelated to conversion -> route to `lazyweb-design-brainstorm`

## Lazyweb MCP Setup

Use hosted Lazyweb MCP tools at `https://www.lazyweb.com/mcp` for database-backed evidence. First list the available tools and run `lazyweb_health`.

Required public tools:
- `lazyweb_health` - verify Lazyweb MCP connectivity
- `lazyweb_search_ab_tests` - retrieve and synthesize mobile-only paywall/conversion experiment evidence (use its curated `learning` field as the annotated evidence)
- `lazyweb_search` - find paywall references and convention examples (use its `visionDescription` as the annotated evidence)
- `lazyweb_compare_image` - find visually similar screens when the target paywall image is available as `image_base64` + `mime_type` or `image_url`
- `lazyweb_find_similar` - expand from a strong Lazyweb result by passing its returned `imageUrl`
- `lazyweb_get_flows` - optional ordered paywall, checkout, upgrade, or onboarding journeys
- `lazyweb_generate_mockup` - server-side paywall mockup generation (Lazyweb's image key) for non-Codex clients; see the image-gen ladder in "Generate the mockups" below

**Pass `skill: "optimize-paywall"` on every call.** Include `"skill": "optimize-paywall"` in the arguments of each `lazyweb_*` tool call — for example `{"query": "pricing page", "limit": 30, "skill": "optimize-paywall"}`. This is optional analytics metadata Lazyweb uses to understand which skills are used; never drop or change a real argument for it.

**Also pass `version: "<x.y.z>"` on every call.** Read `~/.lazyweb/VERSION` once per session at skill start (e.g. `cat "$HOME/.lazyweb/VERSION" 2>/dev/null || echo 0.0.0`); fall back to `"0.0.0"` if the file is missing or unreadable — never block on this. Include `"version": "<that-value>"` in the arguments of every `lazyweb_*` tool call alongside the existing `skill` arg — for example `{"query": "pricing page", "limit": 30, "skill": "optimize-paywall", "version": "0.4.5"}`. Optional analytics metadata Lazyweb uses to track which skill-pack versions are running; never drop or change a real argument for it.

If Lazyweb MCP is not installed or auth fails, tell the user: "Lazyweb MCP is
not installed. Run `curl -fsSL https://www.lazyweb.com/install.sh | bash`,
reload this client, then rerun this skill." Continue with web research only if
the user wants a degraded fallback.

The public A/B wrapper is included free. If `lazyweb_search_ab_tests` is
available, call it directly and use the returned experiment evidence. If the
tool is unavailable or returns no matching experiments, clearly label the report
as reference-grounded but not experiment-backed, then continue with Lazyweb
visual references.

## Ground the Paywall

Before searching, establish the target:

1. Run `lazyweb-context-detect` when available to infer project, platform, and stack.
2. Capture or read the target paywall. Prefer an actual screenshot or URL over prose. If the target is a local app, capture the current screen. If the target is remote, use the provided image or URL. Save it to `$REPORT_DIR/references/current-state.png` — it becomes the Current column in the top card.
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
2. **Experiment evidence (validation).** Call `lazyweb_search_ab_tests` for mobile-only A/B evidence with the category as the industry filter, plus conversion goal, constraints, and target paywall description or image URL. Include the product name only as target context, not as an exact company filter. Use the tool to **validate or challenge** a hypothesis you already formed from reading THIS paywall — not as the starting point. Treat learnings as directional (screenshot-diff, not measured lift). If the corpus has no on-context experiment, say so and proceed on reference + convention grounding.
3. **Visual similarity.** If the target image is available and `lazyweb_compare_image` is exposed, retrieve structurally similar paywalls.
4. **Flows.** If the question depends on sequencing, call `lazyweb_get_flows` for paywall, checkout, onboarding, upgrade, or cancellation journeys.
5. **Divergent moves.** Search outside the obvious category when the user asks for bolder options. Extract the mechanism, not the literal design.

Use `high_design_bar: true` only when the live schema exposes it and the user asks for premium, stronger, high-design-bar, best-designed, or visually stronger examples.

**Search discipline:** never repeat an identical `lazyweb_search` query — results are deterministic; page deeper with `offset` and follow `pagination.next_offset`. On `no_matches`/`low_coverage` warnings, use the closest result or note the coverage gap — don't rephrase the same concept in a loop. On `company_not_in_library`, use a suggested company or drop the filter.

## Annotated learnings + bbox overlays (required)

The evidence in each hypothesis is the CURATED ANNOTATED LEARNING, never a raw
changelog. Use the `learning` field returned by `lazyweb_search_ab_tests` and the
`visionDescription` returned by `lazyweb_search` as the evidence text in the
`.delta`. Do NOT paste raw `what_changed` strings, raw experiment diffs, or
unfiltered changelog prose — those are the inputs the curated learning was
distilled from, not the evidence to show.

For EACH reference / evidence image you put in the report (the before/after
shots in the evidence card, and any reference you want to spotlight), draw a
`.bbox` overlay highlighting the region the learning is about — a bounding box
around the relevant part of the screen, with everything outside it visually
dimmed (the `.bbox` CSS produces the highlighted rect; the dark page does the
"dim outside" read). The Lazyweb MCP does NOT return bbox coordinates, so YOU,
the vision-capable agent, must estimate them by looking at the image:

1. Open/inspect the image and find the UI region the curated learning describes
   (e.g. the CTA button, the plan grid, the trial toggle).
2. Express the box as percentages of the image's own width and height:
   `left%`, `top%` for the top-left corner, then `width%`, `height%`.
3. Emit it as `style="left:L%;top:T%;width:W%;height:H%;"` on a
   `<div class="bbox ann-active" data-ann="0" data-label="1" style="…"></div>`
   inside that image's `.ba-imgwrap`.

Keep the box snug around the region of interest, not the whole screen. If a
learning genuinely spans the full screen, a near-full-frame box is fine, but
prefer the tightest box that contains the change. One box per image is the
default; if a learning touches two regions, emit two `.bbox` divs with
incrementing `data-label` ("1", "2", …).

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

## Generate the mockups (one per hypothesis — ENFORCED LADDER)

Generate exactly one mockup per hypothesis and place it in that hypothesis's
`.mockup-col` slide. Follow this ladder in order; there are no other tiers:

**(a) If you ARE Codex** → generate the mockup with your built-in `image_gen`
tool (gpt-image-2, on the user's own auth). Attach the current paywall
screenshot as the reference image so the mockup keeps the product's brand,
layout, and dimensions, and apply the hypothesis's `mockup_prompt` build-spec.
Save the result to `$REPORT_DIR/references/mock-<slug>.png`.

**(b) If you are NOT Codex** → call the Lazyweb MCP tool
`lazyweb_generate_mockup` (server-side, on Lazyweb's image key). Pass `prompt`
(the `mockup_prompt` build-spec) plus the CURRENT screen as `image_base64` (and
its `mime_type`) as the reference image. Save the returned `image_base64` to
`$REPORT_DIR/references/mock-<slug>.png`. Pass `skill` and `version` like every
other Lazyweb call.

**(c) Only if `lazyweb_generate_mockup` returns `MOCKUP_IMAGE_KEY_MISSING` or
`MOCKUP_DAILY_LIMIT`** → fall back to a CSS `.mock` mock-frame: a small
hand-built HTML/CSS approximation of the change rendered inside the
`.mockup-slide`, styled to read like THIS product (brand hexes, type, layout).
Never fall back to ASCII art, and never skip the mockup entirely.

Each rung's mockup goes into the matching `.mockup-slide` (rung a/b as an
`<img>` with an inlined `data:` URI; rung c as the `.mock` frame markup).

### `mockup_prompt` build-spec discipline (required)

Write a disciplined `mockup_prompt` for each hypothesis — the build-spec is what
makes the generated mockup look like a real edit of THIS paywall rather than a
generic stock screen. Each `mockup_prompt` is 4-8 sentences and MUST cover:

- **Composition** — what the screen looks like after the change, top to bottom,
  and what stays put.
- **EXACT quoted copy** — the literal headline/benefit/CTA strings, in quotes,
  so the model renders the real words, not lorem.
- **Measured brand hexes and type** — the actual background/brand/CTA hex codes
  and the font family/weight/size hierarchy read off the current paywall.
- **What moves to make room** — name the element(s) that shrink, collapse, or
  relocate so the new content fits without crowding and WITHOUT shrinking the
  primary CTA below its current size/prominence.
- **1-2 "Do not" lines** — e.g. "Do not change the brand colors", "Do not shrink
  the subscribe button", "Do not add elements not described here."

Keep the change locality-scoped to what the hypothesis actually touches: a copy
tweak edits only the named text; a single-component swap restyles one component;
a section restructure may reflow one section; a full redesign may restructure the
layout while preserving brand identity and aspect ratio. In every case the
primary CTA must stay at least as large and as visually dominant as on the
baseline — make room by collapsing other content, never by miniaturizing the CTA.

## Operating principles (REQUIRED — overrides convenience)

These four rules apply to every report you write and override convenience. A report that breaks them is non-conforming, even if every section is present.

**1. Show, don't tell — every claim carries its proof.**
Any assertion — a pattern, anti-pattern, idea, hypothesis, "what's working" item, convention check, recommendation, or A/B learning — must carry the real screenshot(s) or experiment that demonstrate it, embedded in a deck the reader can step through. Put the supporting references in that hypothesis's evidence `.design-slide` so the embedded carousel walks the reader through the proof; never reduce the proof to a bare prose list. Prevalence words ("most", "near-universal", "dominant") must be backed by a shown count ("5 of 9 references"), never an adjective alone.

**2. Be opinionated; carry the decision.**
Lead with ONE strongest hypothesis — make it the FIRST (`active`) slide in the top carousel and `is-selected` rank #1 in the prioritization table — so the decision shows in the human-visible body, not only in the handoff. Give every other hypothesis an explicit assessment in the prioritization table (build / optional / skip); a skipped idea still carries the reference that justifies skipping it. No ties among top picks; no flat undifferentiated menu.

**3. Maximize confidence with evidence + data.**
Back each hypothesis with what worked for OTHER apps (real screenshots in its evidence slide, with the curated annotated learning and a bbox overlay) PLUS supporting data: a prevalence count across the corpus ("seen in N of M examples") and, where the screen is growth/monetization, A/B experiment evidence via `lazyweb_search_ab_tests`. If no experiment data exists, say so in the hypothesis subheader ("no experiment data found — design-prevalence-based") and lean on the prevalence count as the directional signal. Never let a hypothesis render with neither a visual nor a number behind it.

**4. Be truth-seeking — never overclaim.**
Label evidence strength honestly: **Strong** (real lift number) vs **Moderate** (screenshot-diff / visual prevalence, no lift) vs **Thin** (single-source / off-category). Forbid comparative-performance verbs ("outperforms", "underperforms") unless a measurement backs them. Tag any reference whose brand was inferred from a URL/vision-description ("brand inferred — verify"). State absence claims with evidence-of-search (queries run × screens reviewed + the closest near-miss). Never invent a reference, a metric, a company name, or a bbox region you did not actually see in the image.

Every embedded screenshot must be a real screenshot the report genuinely points at — a Lazyweb image you inlined or a locally-saved `references/{file}` you inlined. Never invent an image, and never assert a claim with neither a visual nor a number behind it. You own legibility, cropping cues (the bbox overlay), the carousels, and the lightbox — pick honest references and write accurate `delta`/`alt` text from each reference's curated `learning` / `visionDescription`.

## Report footer

End `report.html` with the Lazyweb footer paragraph
(`<p class="muted">Powered by Lazyweb — turn your agent into a design researcher… for free!</p>`)
just before the lightbox markup, so every report carries it.
