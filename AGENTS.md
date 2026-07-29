# Lazyweb skill pack — agent guidance

## Lazyweb report principles (governs any agent building a Lazyweb report)

Every Lazyweb skill produces an HTML report. Whatever the skill, the report must embody these four principles — they are the product, not a style preference.

1. **Show, don't tell.** Prove every claim with a real visual reference or data, never prose alone. Each assertion (pattern, anti-pattern, idea, hypothesis, "what's working", convention check, recommendation, or A/B learning) carries the screenshot(s)/experiment that demonstrate it, sitting *with* the claim. Quantify prevalence ("5 of 9 references") instead of asserting it ("near-universal"). Never render a proposed layout as ASCII/box-drawing `<pre>` art — use an HTML/CSS prototype, mock-frame, or generated image.

2. **Be opinionated; carry the decision.** Take a clear ranked stance and lead with a single recommended path, marked as such in the human-visible body (not only in the machine handoff block). Tell the user what to do first and what to skip, with a one-line reason each. Never hand over an undifferentiated menu of co-equal options and make the reader choose.

3. **Maximize confidence with evidence.** Back each recommendation with what worked for OTHER apps (real screenshots) PLUS supporting data — prevalence across the corpus, and A/B experiment learnings for growth/monetization screens. When experiment data is unavailable, say so and fall back to a stated prevalence count; never ship a recommendation with no visual and no number behind it.

4. **Be truth-seeking.** Never overclaim. Label evidence strength honestly (measured vs directional vs single-source/off-category) on each claim, and flag a weak, thin, single-source, or context-mismatched corpus up front. Tag any brand inferred from a URL/vision description as unverified. Never fabricate a reference, a metric, or a company name. The machine-readable handoff and the human-facing body must agree about confidence.

Shared report furniture (use the existing tokens `--ink:#1f2328; --mut:#57606a; --line:#d0d7de; --soft:#eef4fb; --accent:#0969da`): the light-blue Agent Instructions copy block is always section #1; reuse the shared `.deck` (evidence carousel — all references visible, scroll-snaps with ◀ ▶ prev/next buttons), `.legend` + `.rec` cards (opinionated ranked pick: a decision legend over big-proof recommendation cards, #1 = `.rec.lead`), `.ebadge`/`.corpus` (honest evidence labels), and `.mock` (mock-frame) components so every skill renders proof, decisions, and honesty the same way. One sanctioned substitution: `lazyweb-deep-design-research` (report v3) renders its decision as a side-by-side `.compare` (Control × Recommended in height-locked frames, with a ◀ ▶ variant switcher on the right frame) over an `.option-deck` of bet cards — no `.legend` table and no `.ebadge` chips there; ranking is carried by order + a `Recommended` flag, and evidence counts by plain words inside the evidence-deck captions — each card shows only two 8-14-word bolded What/Why bullets. It renders no patterns/`.pat` section — evidence lives in the bet decks and the clustered inspo map. Same decision/honesty semantics, quieter chrome. (It still reuses the shared `.deck`, `.prev`, `.corpus`, `.flip`, and `.mock` components.)

---

CSS gotcha (applies to every skill's CSS contract): `font:700 10px/1 inherit` is INVALID — `inherit` is not a legal font-family inside the `font` shorthand, so browsers drop the whole declaration and chips/badges render at body size. Write longhands instead (`font-weight:700;font-size:10px;line-height:1`); font-family inherits by default.

These principles live in each skill's report contract. When editing a skill, keep its local component rules internally consistent. For `lazyweb-deep-design-research`, keep the report v3 side-by-side compare, option deck, and inspo map components in sync with this file; for the other skills, keep their existing shared evidence components in sync.

## Agent learnings

- Treat an explicitly supplied skill name as exact. Do not silently normalize an apparent typo or change singular/plural naming; ask before changing the requested identifier.
