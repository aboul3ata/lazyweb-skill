---
name: lazyweb-ab-test-research
route: "A/B tests, experiments, pricing/monetization strategy"
description: |
  Research growth, monetization, onboarding, checkout, paywall, cancellation,
  pricing, activation, or other product A/B tests using Lazyweb experiment
  evidence. Use when the user asks for A/B tests, experiments, test ideas,
  growth hypotheses, or PM strategy based on what other apps have tried.
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

# Lazyweb A/B Test Research

Use Lazyweb experiment evidence to answer growth PM questions. The public
gateway and the richer backend/internal MCP surfaces are not identical, so start
from the live tool schema before choosing how to retrieve evidence.

## MCP Setup

Use hosted Lazyweb MCP tools for all database-backed evidence. First list the
available tools and run `lazyweb_health`.

- `lazyweb_health` — verify Lazyweb MCP connectivity.
- `lazyweb_ab_test_research` — current public gateway for A/B Test Agent research, included free.
- `lazyweb_search` — pull visual design references to pair with experiment evidence.
- `lazyweb_compare_image` / `lazyweb_find_similar` — visual reference retrieval when the target screen or adjacent examples would clarify the recommendation.
- `lazyweb_list_categories` / `lazyweb_list_collections` — public browsing helpers.

**Pass `skill: "ab-test-research"` on every call.** Include `"skill": "ab-test-research"` in the arguments of each `lazyweb_*` tool call — for example `{"query": "pricing page", "limit": 30, "skill": "ab-test-research"}`. This is optional analytics metadata Lazyweb uses to understand which skills are used; never drop or change a real argument for it.

**Also pass `version: "<x.y.z>"` on every call.** Read `~/.lazyweb/VERSION` once per session at skill start (e.g. `cat "$HOME/.lazyweb/VERSION" 2>/dev/null || echo 0.0.0`); fall back to `"0.0.0"` if the file is missing or unreadable — never block on this. Include `"version": "<that-value>"` in the arguments of every `lazyweb_*` tool call alongside the existing `skill` arg — for example `{"query": "pricing page", "limit": 30, "skill": "ab-test-research", "version": "0.4.5"}`. Optional analytics metadata Lazyweb uses to track which skill-pack versions are running; never drop or change a real argument for it.

If Lazyweb MCP is not installed or auth fails, tell the user: "Lazyweb MCP is
not installed. Run `curl -fsSL https://www.lazyweb.com/install.sh | bash`,
reload this client, then rerun this skill." Then continue with general web
research only if the user wants a degraded fallback.

Current public `lazyweb_ab_test_research` arguments:

```json
{
  "target_screen_description": "trial reminder onboarding paywall",
  "product": "Example App",
  "category": "Health & Fitness",
  "conversion_goal": "trial start rate",
  "constraints": "keep annual plan visible",
  "operation": "research",
  "experiment_ids": ["exp_123"],
  "include_images": true,
  "target_image_url": "https://example.com/screen.png",
  "limit": 25,
  "analysis_experiment_limit": 10,
  "visual_inspection_budget": 0
}
```

The public A/B wrapper is included free. If `lazyweb_ab_test_research` is
available, call it directly and use the returned experiment evidence. If the
tool is unavailable or returns no matching experiments, say that experiment
evidence was unavailable for this query, then continue with Lazyweb visual
references when useful.

`category` is the public gateway's industry filter. `product` is context for
the user's target product and should not be treated as a Lazyweb company filter;
do not retry exact product/company spellings or trust a zero-result response
when warnings indicate a product/company filter was applied. If the product is
useful context, include it, but make the retrieval query screen-pattern plus
industry led.

### Backend/Internal Experiment Tools

Some backend or internal MCP surfaces expose these richer generic experiment
tools. Use them only when the current tool list includes them:

- `lazyweb_find_experiments` — retrieve generic `_experiments` evidence.
- `lazyweb_recent_experiments` — retrieve the latest 10, 25, or 50 `_experiments` rows.
- `list_companies_by_categories` — turn category names into company IDs.

`_experiments` is a limited screenshot-diff evidence set. It is generic across
screens and categories, not paywall-only. Treat learning text as directional
hypotheses, not statistically measured lift.

Full `lazyweb_find_experiments` filter matrix:

```json
{
  "query": "trial reminder onboarding upsell",
  "company": "Example App",
  "category": "Health & Fitness",
  "screen_type": "onboarding upsell",
  "platform": "mobile",
  "company_ids": [123, 456],
  "canonical_ids": [789],
  "since_iso": "2026-06-01T00:00:00Z",
  "limit": 50,
  "app_store_rank_max": 50,
  "app_store_overall_rank_max": 50,
  "app_store_category_rank_max": 25,
  "high_design_bar": true
}
```

Full `lazyweb_recent_experiments` filter matrix:

```json
{
  "limit": 25,
  "company": "Example App",
  "category": "Health & Fitness",
  "platform": "mobile",
  "company_ids": [123, 456],
  "app_store_rank_max": 50,
  "app_store_overall_rank_max": 50,
  "app_store_category_rank_max": 25,
  "high_design_bar": true
}
```

Backend/internal `lazyweb_ab_test_research` may also expose
`interesting_learning` and `high_design_bar`. Leave `interesting_learning` as
`false` by default. Set it to `true` only when the user explicitly asks for
uncommon, surprising, or contrarian learnings; clearly label those as limited
evidence. Do not pass `interesting_learning` or `high_design_bar` to the public
gateway unless the live tool schema includes those fields.

Do not route through legacy paywall-specific research tools. If a paywall appears
in the evidence, treat it as one screen type among many.

## Workflow

1. **Ground the product question.** Identify product/app, category, screen or
   flow, platform, target metric, and constraints.

2. **Choose the available evidence path.**
   - If the current MCP surface only exposes the public gateway, call
     `lazyweb_ab_test_research`.
   - If `lazyweb_find_experiments` is exposed, retrieve generic experiment rows
     with the strongest filters available.
   - If the user asks for recent/latest tests and `lazyweb_recent_experiments` is
     exposed, use that tool with a limit of `10`, `25`, or `50`.
   - If `list_companies_by_categories` is exposed and the category is known, call
     it first and pass the returned `company_ids` into
     `lazyweb_find_experiments`.

Public gateway example:

```json
{
  "target_screen_description": "trial reminder onboarding upsell",
  "product": "Example App",
  "category": "Health & Fitness",
  "conversion_goal": "trial start rate",
  "limit": 25,
  "analysis_experiment_limit": 10
}
```

Backend/internal retrieval example:

```json
{
  "query": "trial reminder onboarding upsell",
  "category": "Health & Fitness",
  "screen_type": "onboarding upsell",
  "company_ids": [123, 456],
  "limit": 30
}
```

Use minimal filters for popular apps or broad best-practice questions. On the
public gateway, prefer screen-pattern plus `category` for industry context; keep
`product` as target context only, not as an exact company filter. Use richer
filters only on backend/internal surfaces whose live schema exposes them.

When the user asks for high-design-bar companies, premium examples,
best-designed apps, or stronger taste filtering, add this only to tools whose
live schema exposes it:

```json
{"high_design_bar": true}
```

This filters to companies where `companies.high_design_bar = true` on the
backend/internal surfaces that support it.

For "recent", "latest", or "what changed lately" requests, call
`lazyweb_recent_experiments` when it is exposed, with `limit` set to `10`, `25`,
or `50`:

```json
{"limit": 25}
```

For ranked App Store slices, add rank filters:

```json
{
  "category": "Health & Fitness",
  "app_store_overall_rank_max": 50,
  "app_store_category_rank_max": 25,
  "limit": 25
}
```

3. **Supplement with design references.** Call `lazyweb_search` for the same
   screen or flow when visual examples would make the recommendation clearer.
   Read `visionDescription` before relying on any screenshot, and embed returned
   optimized `imageUrl` values directly instead of downloading Lazyweb images locally.
   Never repeat an identical query — page deeper with `offset` and follow
   `pagination.next_offset`; on `no_matches`/`low_coverage` warnings use the
   closest result or note the gap instead of rephrasing in a loop, and on
   `company_not_in_library` use a suggested company or drop the filter.

4. **Synthesize like a growth PM.** Answer with:
   - Relevant observed experiments and what changed.
   - Likely hypothesis behind each change.
   - Target metric and guardrail metric.
   - Recommended test sequence.
   - Evidence strength and gaps.
   - Where the user should not overgeneralize.

5. **Be honest about weak evidence.** If the A/B wrapper is unavailable, or the
   backend/internal retrieval tools return few or weak matches, say that
   directly and fall back to general best practices only after labeling them as
   inference.

## Output Shape

For a quick strategy question, answer in chat. For anything the user will act on,
write a durable HTML report to `.lazyweb/ab-test-research/{topic}-{date}/report.html`.
**The report must center the actual experiments** — control vs variant, what changed,
and the learning — not just a synthesized opinion.

## Publish a Shareable Link (whenever an HTML report was written)

Every report is auto-published to lazyweb.com so the user can share it with
teammates. Right after writing `report.html`, run this with `$REPORT_DIR` set
to `.lazyweb/ab-test-research/{topic}-{date}`:

```bash
IDEMPOTENCY_KEY="${REPORT_DIR#.lazyweb/}"   # stable per-report key (e.g. ab-test-research/{topic}-{date}); send the SAME value every attempt so retries dedupe to one link
LAZYWEB_TOKEN=$(cat "$HOME/.lazyweb/lazyweb_mcp_token" 2>/dev/null || true)
if [ -n "$LAZYWEB_TOKEN" ]; then
  # Tier 1 - local install: direct POST (idempotency_key dedupes a re-run)
  python3 - "$REPORT_DIR" "$LAZYWEB_TOKEN" "ab-test-research" "$IDEMPOTENCY_KEY" <<'PUBLISH_EOF'
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
  2. Otherwise call `lazyweb_publish_report` with: `html` = the contents of `report.html`; `assets` = each `references/` file as `{"name": <filename>, "b64": <base64 of the bytes>}`; `report_skill` = "ab-test-research"; `idempotency_key` = the value printed after `idempotency_key=`.
  3. On `{ ok: true, url }` -> show "Shareable link: {url} (unlisted - anyone with the link can view)".
  4. On `{ ok: false }` -> tell the user publishing failed and why (the `error` field); the report is saved locally. If `code` is `REPORT_VALIDATION_ERROR` and `detail` names missing assets, fix and call ONCE more; otherwise do not retry.
  Unlike Tier 1, do NOT stay silent on a Tier-2 failure - a hosted user has no local file to fall back on, so they need the link or the reason.

### Hosting-safe HTML (the template already complies — keep it that way)

The hosted copy is served byte-for-byte, so the report must only use:
- inline CSS and inline `<script>` — never an external `<script src=...>`
- images via the absolute optimized `imageUrl`/`image_url` URLs Lazyweb returns, or
  relative `references/{filename}` paths for locally saved screenshots
- no `file://` URLs and no absolute local paths (`/Users/...`, `C:\...`)

### Fields `lazyweb_ab_test_research` (operation `research`) returns by default

Per experiment in `evidence.experiments[]` (no flags needed):
- `company.company_name`, `company.category`, `company.subcategory`, `company.app_store_ranking`
- `control.{imageUrl, image_url, path, vision_description}` and `variant.{imageUrl, image_url, path, vision_description}`
- `what_changed` (text: the concrete control→variant diff), `learning` (text: directional hypothesis + why), `evidence_confidence`, `platform`, `experiment_id`, `target_screen_description`

Top level: `recommendations[]` (each cites an `experiment_id` + `target_metric` + `guardrail_metric` + `confidence`), `strong_points`, `weak_points`, `dataset_caveat`.

Experiment images are returned as optimized URLs. Use `control.imageUrl` or
`control.image_url`, and `variant.imageUrl` or `variant.image_url`, directly.
Some adjacent experiment objects may expose aliases such as `control_image_url`,
`controlImageUrl`, `variant_image_url`, or `variantImageUrl`; use those directly
when present. Supabase storage-backed URLs are signed for 365 days. Do not use
screenshot IDs, and do not construct storage URLs from raw `path` values. If an
image URL is missing, drop that `<img>` and keep the `vision_description`.
`company_name` is a crawl seed — you may clean an obvious slug but never invent
a brand; flag any `/figma/` or `!`-prefixed path as a non-production capture in
the caption.

(Visual refs from `lazyweb_search` also embed via their returned
`imageUrl`/`image_url` fields.)

### Content outline (semantic HTML, LIGHT theme)

```text
# A/B Test Research: {Flow / Question}

## Agent Instructions            (section #1 — see Report essentials below)

## Recommendations               (ranked TABLE: Recommendation · Target metric · Guardrail · Confidence · Rests on exp_id(s).
                                  Rows map to recommendations[]; every row cites the experiment_id(s) it rests on.)

## The A/B tests   ← REQUIRED, the centerpiece
{One card per experiment from evidence.experiments[] (see card markup below).
 Show control vs variant images + what_changed + learning + confidence.
 Render dataset_caveat ONCE, directly under this heading. The exp ids here match the
 "Rests on" column above so a reader can jump from a recommendation to its evidence.}

## Strong / Weak points          (short bullets straight from strong_points[] / weak_points[])

## Where not to overgeneralize   (the corpus is mobile-subscription-centric; learnings are
                                  directional screenshot-diff signals, not measured lift)

## References (optional)         (only if lazyweb_search refs were pulled; `.deck` snap-carousel, scroll-snaps with ◀ ▶ prev/next buttons)
```

### "The A/B tests" card (per experiment)

```html
<section id="ab-tests">
  <h2>The A/B tests</h2>
  <p class="caveat">{dataset_caveat verbatim}</p>

  <article class="exp">
    <header class="exp-h"><span class="exp-co">{company.company_name}</span>
      <span class="exp-meta">{category} › {subcategory} · Rank #{app_store_ranking} · {platform}</span>
      <span class="exp-id">exp {experiment_id}</span></header>
    <p class="exp-target">Target screen: {target_screen_description}</p>
    <div class="flip">
      <figure><img src="{control.imageUrl or control.image_url}" alt="Control — {company}" loading="lazy"
        onerror="this.closest('figure').classList.add('img-missing')">
        <figcaption>Control<span class="vd">{control.vision_description}</span></figcaption></figure>
      <figure><img src="{variant.imageUrl or variant.image_url}" alt="Variant — {company}" loading="lazy"
        onerror="this.closest('figure').classList.add('img-missing')">
        <figcaption>Variant<span class="vd">{variant.vision_description}</span></figcaption></figure>
    </div>
    <dl class="exp-facts"><dt>What changed</dt><dd>{what_changed}</dd>
      <dt>Learning</dt><dd>{learning}</dd><dt>Confidence</dt><dd>{evidence_confidence}</dd></dl>
  </article>
  <!-- repeat <article class="exp"> per experiment -->
</section>
```

### Report essentials (apply to the report you write)

#### A. Agent Instructions — report section #1

The report opens with an **Agent Instructions** callout: one plain human sentence, then a copy-pastable block written FOR A DOWNSTREAM CODING AGENT. Emit exactly this structure:

```html
<section id="agent-instructions" class="agent-instructions">
  <div class="ai-head"><span class="ai-badge">FOR THE CODING AGENT</span>
    <button class="ai-copy" type="button" onclick="
      var sec=this.closest('.agent-instructions'); var txt=sec.querySelector('.ai-block').innerText;
      var done=function(ok){this.textContent=ok?'Copied':'Press Cmd/Ctrl+C';setTimeout(function(){this.textContent='Copy';}.bind(this),1500);}.bind(this);
      if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(txt).then(function(){done(true);},function(){done(false);});}
      else{var r=document.createRange();r.selectNodeContents(sec.querySelector('.ai-block'));var s=getSelection();s.removeAllRanges();s.addRange(r);try{document.execCommand('copy');done(true);}catch(e){done(false);}}">Copy</button>
  </div>
  <p class="ai-human">{one human sentence: the single most important test to run first}</p>
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

INDEX ON: {1-3 best-evidenced experiment learnings}
DO NOT OVER-INDEX ON: {directional-not-measured learnings, off-category experiments, single-experiment signals}
DIVE FURTHER: {next Lazyweb skill or MCP tool} — {why}

Evidence basis: A/B experiments (screenshot-diff) · {DATE}
```

For THIS skill, `{TASK}` = "prioritizing and shipping {flow} experiments grounded in what comparable apps have already tested", and `DIVE FURTHER` → "`/lazyweb-paywall-optimization` to turn a paywall learning into a falsifiable redesign, or `lazyweb_ab_test_research operation=grab` with the cited experiment_id(s)".

#### B. Conciseness & "show, don't tell"

No length target — let the evidence set the length. Lead with value (Agent Instructions + the ranked Recommendations table). Show, don't tell: the centerpiece is the real control/variant screenshots, not prose. Index every recommendation on a named `experiment_id` + its `learning`, never generic growth-speak. If you must illustrate a proposed variant layout that no screenshot shows, use the mock-frame component (mobile/desktop) — never ASCII art.

#### C. HTML requirements (LIGHT theme — match `lazyweb-design-research`)

- Single HTML file, inline CSS (no external CSS/JS dependencies; the one inline `onclick` copy handler above is allowed).
- **Light/white design — do NOT use a dark/black theme.** System fonts, `max-width:900px`, white background, comfortable line-height, light borders, `#f6f8fa` table headers.
- Use the shared design tokens and include the CSS below in `<style>`.
- Agent Instructions is the first section, styled as the light-blue callout. The "A/B tests" section is required whenever ≥1 experiment is returned and sits right after Recommendations.
- `dataset_caveat` appears once. Use returned experiment image URL fields directly; degrade gracefully via the `onerror` hook.
- Open in the browser: `open "$REPORT_DIR/report.html"`.

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
#ab-tests .caveat{font-size:13px;color:var(--mut);background:#fff8e6;border:1px solid #f0e0b0;border-radius:6px;padding:8px 11px;margin:8px 0 16px}
.exp{border:1px solid var(--line);border-radius:10px;padding:14px 16px;margin:14px 0;background:#fff}
.exp-h{display:flex;flex-wrap:wrap;gap:8px;align-items:baseline}.exp-co{font-weight:700}.exp-meta{color:var(--mut);font-size:13px;flex:1}
.exp-id{font:12px ui-monospace,Menlo,monospace;color:var(--mut);background:#f6f8fa;border-radius:5px;padding:1px 7px}
.exp-target{font-size:13px;color:var(--mut);margin:6px 0 10px}
.exp-pair{display:grid;grid-template-columns:1fr 1fr;gap:12px}@media(max-width:600px){.exp-pair{grid-template-columns:1fr}}
.exp-pair img{width:100%;height:auto;max-height:580px;object-fit:contain;border:1px solid var(--line);border-radius:8px;background:#fafbfc}
.exp-pair figcaption{font-size:12px;font-weight:600;margin-top:5px}.exp-pair .vd{display:block;font-weight:400;color:var(--mut);font-size:11.5px;margin-top:2px}
.exp-pair figure.img-missing img{display:none}
.exp-pair figure.img-missing figcaption::after{content:" — image unavailable; see description";color:#cf222e;font-weight:400}
.exp-facts{display:grid;grid-template-columns:max-content 1fr;gap:4px 12px;margin:12px 0 0;font-size:14px}.exp-facts dt{font-weight:600;color:var(--mut)}
.mock{margin:14px 0}.mock .frame{border:1px solid var(--line);border-radius:14px;background:#fff;overflow:hidden}.mock.mobile .frame{max-width:300px;border-radius:26px;border:8px solid #1f2328}.mock.desktop .frame{max-width:760px}
.mock .body{padding:14px;display:flex;flex-direction:column;gap:10px}.mock .box{background:var(--soft);border:1px dashed #b9c7d6;border-radius:8px;min-height:34px;display:flex;align-items:center;justify-content:center;color:#4a5a6a;font-size:12px;padding:8px}.mock .box.cta{background:var(--accent);border:0;color:#fff;font-weight:600}.mock .row{display:flex;gap:10px}.mock .row>.box{flex:1}.mock .cap{font-size:12px;color:var(--mut);margin-top:6px;text-align:center}
```

## Operating principles & evidence components (REQUIRED - overrides convenience)

The canonical operating principles and the reusable evidence/report components (`.deck` carousel, `.legend` + `.rec` cards, `.ebadge`/`.corpus` honesty labels, `.flip` control/variant, `.mock` mock-frame) live in **`../_shared/operating-principles.md`** (relative to this skill's directory). Read that file and apply it verbatim — it is the single source of truth shared by every report-producing Lazyweb skill. Do not re-inline or fork it here.
