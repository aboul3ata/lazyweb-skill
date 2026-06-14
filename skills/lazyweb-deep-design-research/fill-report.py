#!/usr/bin/env python3
"""Lazyweb design-research report filler (v3.5 fast path).

Builds report.html from the render-tested template + a report-data.json the
agent authors. The agent never reads the template and never writes fill code:
content in, finished report out. Pure stdlib.

Usage:
  fill-report.py --data report-data.json --template report-template.html \
                 --out report.html

report-data.json (all strings are RAW — this script does the escaping):
{
  "topic": "Figma Pricing — Converting Starter Teams to Professional",
  "goal": "One-sentence target outcome.",
  "rec_intro": {"what": "What the recommended bet changes",
                 "why": "why it wins (rendered bold)"},
  "control": {"src": "references/current-state.png", "alt": "accurate alt"},
  "corpus_banner": null | "Evidence-basis caveat sentence (thin corpus only)",
  "handoff": {"report_path": "/abs/path/report.html", "task": "...",
               "recs": ["imperative 1", "imperative 2", "imperative 3"],
               "index_on": "...", "dont_index": "...", "dive": "...",
               "evidence_basis": "N Lazyweb references + M web captures · DATE"},
  "bets": [   // recommended FIRST; 2-4 entries
    {"name": "Bet name", "slug": "bet-slug", "recommended": true,
     "img": "references/prototype-bet-slug.png", "alt": "accurate alt",
     "what": "8-14 words", "why": "8-14 words",
     "deck": [ // 2-3 refs; put prevalence/whitespace count in first `detail`
       {"src": "https://...", "alt": "vd alt", "source": "Lazyweb",
        "company": "Acme", "detail": "exact UI detail. 0 of 19 do this."}],
     "build_prompt": "full hypothesis + evidence + skip condition + brief"}],
  "inspo": null | {   // null/omitted -> section omitted entirely
    "map_h": 640, "x_left": "...", "x_right": "...",
    "y_top": "...", "y_bottom": "...",
    "clusters": [{"x": 24, "y": 22, "label": "Cluster name"}],
    "points": [{"x": 20, "y": 30, "src": "https://...", "alt": "vd alt",
                 "source": "provenance", "mob": false}]}
}

Exit codes: 0 written; 1 invalid/missing data (message names the field).
"""
import argparse
import html
import json
import pathlib
import sys


def esc(s):
    return html.escape(str(s if s is not None else ""), quote=True)


def jesc(s):
    return (
        str(s if s is not None else "")
        .replace("\\", "\\\\")
        .replace("'", "\\'")
        .replace("\n", "\\n")
        .replace("\r", "\\r")
        .replace("\u2028", "\\u2028")
        .replace("\u2029", "\\u2029")
        .replace("<", "\\u003c")
    )


def die(msg):
    print(f"FILL_FAILED: {msg}", file=sys.stderr)
    sys.exit(1)


def need(d, key, ctx):
    if key not in d or d[key] in (None, ""):
        die(f"missing {ctx}.{key}")
    return d[key]


def deck_html(deck):
    figs = []
    for ref in deck:
        figs.append(
            f'<figure class="shot-web"><img src="{esc(ref["src"])}" alt="{esc(ref["alt"])}" '
            f'loading="lazy" onerror="this.closest(\'figure\').classList.add(\'img-missing\')">'
            f'<figcaption class="cap"><span class="src">[{esc(ref.get("source", "Lazyweb"))}]</span> '
            f'<b>{esc(ref.get("company", ""))}</b> — {esc(ref.get("detail", ""))}</figcaption></figure>'
        )
    nav = ""
    if len(deck) > 2:
        nav = (
            '<div class="deck-nav">'
            '<button type="button" aria-label="Previous" onclick="var d=this.closest(\'.deck-nav\').previousElementSibling,'
            "f=d.querySelector('figure');d.scrollBy({left:-((f?f.offsetWidth:240)+12),behavior:'smooth'})\">&#9664;</button>"
            '<button type="button" aria-label="Next" onclick="var d=this.closest(\'.deck-nav\').previousElementSibling,'
            "f=d.querySelector('figure');d.scrollBy({left:(f?f.offsetWidth:240)+12,behavior:'smooth'})\">&#9654;</button></div>"
        )
    return f'<div class="deck mini">{"".join(figs)}</div>{nav}'


def bet_html(bet, idx):
    rec = ' is-recommended' if bet.get("recommended") else ""
    flag = ' <span class="rec-flag">Recommended option</span>' if bet.get("recommended") else ""
    return f"""      <article class="prototype-option{rec}" id="bet-{idx + 1}">
        <h3>{esc(bet["name"])}{flag}</h3>
        <figure class="proto-full"><img class="prototype-img" src="{esc(bet["img"])}" alt="{esc(bet["alt"])}" loading="lazy" onclick="window.__zoom&&__zoom(this)"></figure>
        <ul class="opt-points">
          <li><b>What:</b> {esc(bet["what"])}</li>
          <li><b>Why:</b> {esc(bet["why"])}</li>
        </ul>
        {deck_html(bet.get("deck", []))}
        <details class="build-prompt"><summary>Agent prompt</summary><p>{esc(bet.get("build_prompt", ""))}</p></details>
      </article>"""


def inspo_html(inspo):
    if not inspo:
        return ""
    clusters = "".join(
        f'<span class="cluster-label" style="--x:{float(c["x"])}%;--y:{float(c["y"])}%">{esc(c["label"])}</span>'
        for c in inspo.get("clusters", [])
    )
    points = "".join(
        f'<button class="inspo-point{" mob" if pt.get("mob") else ""}" type="button" '
        f'style="--x:{float(pt["x"])}%;--y:{float(pt["y"])}%" data-source="{esc(pt.get("source", ""))}" '
        f'onclick="window.__zoom&&__zoom(this.querySelector(\'img\'))">'
        f'<img class="inspo-img" src="{esc(pt["src"])}" alt="{esc(pt["alt"])}" loading="lazy"></button>'
        for pt in inspo.get("points", [])
    )
    return f"""
<section id="inspo" class="inspo">
  <h2>Inspo</h2>
  <div class="inspo-map" style="--map-h:{int(inspo.get("map_h", 640))}px;--x-left:'{esc(inspo["x_left"])}';--x-right:'{esc(inspo["x_right"])}';--y-top:'{esc(inspo["y_top"])}';--y-bottom:'{esc(inspo["y_bottom"])}'">
    <span class="inspo-axes" aria-hidden="true"></span>
    {clusters}
    {points}
  </div>
</section>
"""


COPY_BTN = """<button class="ai-copy" type="button" onclick="
      var sec=this.closest('.agent-instructions'); var txt=sec.querySelector('.ai-block').innerText;
      var done=function(ok){this.textContent=ok?'Copied':'Press Cmd/Ctrl+C';setTimeout(function(){this.textContent='Copy';}.bind(this),1500);}.bind(this);
      if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(txt).then(function(){done(true);},function(){done(false);});}
      else{var r=document.createRange();r.selectNodeContents(sec.querySelector('.ai-block'));var s=getSelection();s.removeAllRanges();s.addRange(r);try{document.execCommand('copy');done(true);}catch(e){done(false);}}">Copy</button>"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", required=True)
    ap.add_argument("--template", required=True)
    ap.add_argument("--out", required=True)
    opts = ap.parse_args()

    try:
        data = json.loads(pathlib.Path(opts.data).read_text())
    except (OSError, ValueError) as exc:
        die(f"cannot read data: {exc}")
    tpl = pathlib.Path(opts.template).read_text()

    topic = need(data, "topic", "data")
    goal = need(data, "goal", "data")
    intro = need(data, "rec_intro", "data")
    control = need(data, "control", "data")
    handoff = need(data, "handoff", "data")
    bets = need(data, "bets", "data")
    if not (2 <= len(bets) <= 4):
        die(f"bets must have 2-4 entries, got {len(bets)}")
    if not bets[0].get("recommended"):
        die("bets[0] must be the recommended bet")
    for i, b in enumerate(bets):
        for k in ("name", "slug", "img", "alt", "what", "why"):
            need(b, k, f"bets[{i}]")
    recs = handoff.get("recs", [])
    if len(recs) < 2:
        die("handoff.recs needs at least 2 imperative lines")

    # head + style come verbatim from the render-tested template
    head_style = tpl[tpl.index("<style>"):tpl.index("</style>") + 8]

    corpus = ""
    if data.get("corpus_banner"):
        corpus = (f'\n<div class="corpus"><span>&#9888;</span><p style="margin:0">'
                  f'<b>Evidence basis:</b> {esc(data["corpus_banner"])}</p></div>\n')

    rec_lines = "\n".join(f"{i + 1}. {r}" for i, r in enumerate(recs))
    handoff_text = (
        f"LAZYWEB REPORT — AGENT HANDOFF\n"
        f"Use the report at {handoff.get('report_path', opts.out)} as a starting point for {need(handoff, 'task', 'handoff')}.\n\n"
        f"TOP RECOMMENDATIONS (do first):\n{rec_lines}\n\n"
        f"INDEX ON: {handoff.get('index_on', '')}\n"
        f"DO NOT OVER-INDEX ON: {handoff.get('dont_index', '')}\n"
        f"DIVE FURTHER: {handoff.get('dive', '')}\n\n"
        f"Evidence basis: {handoff.get('evidence_basis', '')}"
    )

    vars_js = ",\n  ".join(
        f"{{n:'{jesc(('Recommended — ' if b.get('recommended') else '') + b['name'])}',"
        f"s:'{jesc(b['img'])}',a:'{jesc(b['alt'])}'}}"
        for b in bets
    )
    bets_html = "\n".join(bet_html(b, i) for i, b in enumerate(bets))
    rec0 = bets[0]

    out_html = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Design Research: {esc(topic)}</title>
{head_style}
</head>
<body>
<main>
<h1>Design Research: {esc(topic)}</h1>

<section id="agent-instructions" class="agent-instructions">
  <div class="ai-head"><span class="ai-badge">FOR THE CODING AGENT</span>
    {COPY_BTN}
  </div>
  <p class="ai-human">{esc(recs[0])}</p>
  <pre class="ai-block">{esc(handoff_text)}</pre>
</section>
{corpus}
<section id="goal" class="goal">
  <h2>Goal</h2>
  <p>{esc(goal)}</p>
</section>

<section id="recommendation" class="recommendation">
  <h2>Recommendation</h2>
  <p class="rec-intro">{esc(need(intro, "what", "rec_intro"))} — <b>{esc(need(intro, "why", "rec_intro"))}</b></p>
  <div class="compare">
    <figure class="cmp control">
      <figcaption>Control</figcaption>
      <div class="cmp-frame"><img src="{esc(control["src"])}" alt="{esc(control["alt"])}" onclick="window.__zoom&&__zoom(this)"></div>
    </figure>
    <figure class="cmp is-recommended">
      <figcaption><span id="vname">Recommended — {esc(rec0["name"])}</span>
        <span class="vnav"><button type="button" aria-label="Previous variant" onclick="window.__vstep&&__vstep(-1)">&#9664;</button><button type="button" aria-label="Next variant" onclick="window.__vstep&&__vstep(1)">&#9654;</button></span>
      </figcaption>
      <div class="cmp-frame"><img id="vimg" src="{esc(rec0["img"])}" alt="{esc(rec0["alt"])}" onclick="window.__zoom&&__zoom(this)"></div>
    </figure>
  </div>

  <h3 class="why-h">The &ldquo;why&rdquo; behind the recommendations</h3>
  <div class="deckwrap">
    <div class="option-deck">
{bets_html}
    </div>
    <div class="deck-nav">
      <button type="button" aria-label="Previous" onclick="var d=this.closest('.deckwrap').querySelector('.option-deck'),f=d.querySelector('article');d.scrollBy({{left:-((f?f.offsetWidth:560)+16),behavior:'smooth'}})">&#9664;</button>
      <button type="button" aria-label="Next" onclick="var d=this.closest('.deckwrap').querySelector('.option-deck'),f=d.querySelector('article');d.scrollBy({{left:(f?f.offsetWidth:560)+16,behavior:'smooth'}})">&#9654;</button>
    </div>
  </div>
</section>
{inspo_html(data.get("inspo"))}
<footer class="lw-foot">Powered by <a href="https://www.lazyweb.com">Lazyweb</a> &mdash; turn your agent into a design researcher... for free!</footer>
</main>

<div id="lb" aria-hidden="true"><button type="button" class="x" aria-label="Close">×</button><img alt="Expanded image"></div>
<div class="scalebar" role="group" aria-label="Report scale">
  <button type="button" data-s="s">S</button><button type="button" data-s="" aria-pressed="true">M</button><button type="button" data-s="l">L</button>
</div>
<script>
document.body.classList.add('has-js');
var _lb=document.getElementById('lb'),_i=_lb&&_lb.querySelector('img');
window.__zoom=function(g){{if(!_lb)return false;_i.src=g.currentSrc||g.src;_lb.classList.add('open');_lb.setAttribute('aria-hidden','false');return false;}};
if(_lb)_lb.addEventListener('click',function(){{_lb.classList.remove('open');_lb.setAttribute('aria-hidden','true');_i.removeAttribute('src');}});
var _vars=[
  {vars_js}
],_vi=0;
window.__vstep=function(d){{_vi=(_vi+d+_vars.length)%_vars.length;var v=_vars[_vi],img=document.getElementById('vimg');img.src=v.s;img.alt=v.a;document.getElementById('vname').textContent=v.n;}};
document.querySelectorAll('.scalebar button').forEach(function(b){{b.addEventListener('click',function(){{
  if(b.dataset.s)document.documentElement.setAttribute('data-scale',b.dataset.s);else document.documentElement.removeAttribute('data-scale');
  document.querySelectorAll('.scalebar button').forEach(function(x){{x.setAttribute('aria-pressed',x===b)}});}});}});
</script>
</body>
</html>
"""
    out_path = pathlib.Path(opts.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(out_html)
    print(f"FILL_OK: {out_path} ({len(out_html)} bytes, {len(bets)} bets, "
          f"inspo={'yes' if data.get('inspo') else 'omitted'})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
