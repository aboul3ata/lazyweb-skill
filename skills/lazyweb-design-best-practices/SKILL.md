---
name: lazyweb-design-best-practices
route: "Design craft best practices"
router-terms: best practices, best skill, best way, what's the best, the best designers, design craft, design best practices for
description: |
  Lazyweb's curated router to the best design skills in the world — used as
  context, never installed. 19 design aspects (web animation, frontend
  quality, landing pages, typography, color, design systems, accessibility,
  UX writing, mobile, dashboards, icons/SVG, 3D/WebGL, email, forms, data
  tables, responsive layout, brand identity, video, Figma-to-code) each have
  a ranked, evidence-backed list of the top community-rated skills with
  direct pointers to their instruction files, plus a skeptic-verified
  hidden-gems list.
  Match the user's design task to a section, fetch the winning skill's
  SKILL.md from its pointer URL, and follow it while doing the task.
  Trigger on: "design best practices for", "what's the best skill for",
  "do this the way the best designers would", "I'm trying to do <design
  thing>, what's the best way".
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
  - Grep
  - WebSearch
  - WebFetch
  - AskUserQuestion
  - Agent
---

# Lazyweb Design Best Practices

There are hundreds of design skills in the world. This file is Lazyweb's
trusted, researched answer to "which one should my agent use for X?" — built
from a live review sweep of skills.sh, GitHub, design Twitter/X, Reddit, and
Hacker News.

**Researched: 2026-06-11.** Every skill below was verified by fetching its
actual repo and instruction file — nothing here is from memory. Install
counts and stars are as displayed on skills.sh/GitHub on that date.

## How to use this file

1. **Match the user's design task** to one or more topic sections below.
2. **Fetch the #1 pick's instruction file.** Prefer the Lazyweb MCP tool so the
   fetch runs against the user's Lazyweb account: call `lazyweb_fetch_best_practice`
   with `url` = the pick's raw SKILL.md URL (the one in its `fetch` backticks),
   `topic` = the section's design aspect (e.g. `web-animation`), `slug` = the
   pick's name (e.g. `emil-design-eng`), and `skill` = `"design-best-practices"`.
   It returns `{ ok, content }` — read `content` in full. **If the Lazyweb MCP
   isn't available** (the tool isn't in your tool list) or it returns
   `ok:false`, fetch the raw `url` directly with WebFetch instead. Either way,
   that fetched text IS the skill — apply its rules, heuristics, and workflow as
   your operating best practices while doing the user's actual task. **Never
   install anything**; you are borrowing the expertise, not the plumbing (ignore
   frontmatter, tool wiring, and local scripts you can't honor).
3. Pull in a #2/#3 pick when its `best for` matches the task better, or
   layer it (several topics below are explicitly "stack two skills").
4. **Cite provenance** in your summary: which fetched skill drove which
   decisions, with its URL.
5. **If a pointer 404s**, search the repo for the moved file before giving
   up; if the repo is gone, drop to the next pick and say so. Never
   paraphrase a skill you could not actually read.
6. **If the topic is missing or this file is older than ~90 days**, run the
   Refresh protocol at the bottom for that topic and tell the user the
   routing table was re-researched.

When the task is about *screen-level UI evidence* — what real apps' paywalls,
onboarding, sign-up, pricing, or checkout screens look like, or A/B test
data — route to the sibling Lazyweb modes instead (`/lazyweb-deep-design-research`,
`/lazyweb-lite-design-research`, `/lazyweb-optimize-paywall`,
`/lazyweb-optimize-sign-up`, `/lazyweb-ab-test-research`): verify
connectivity with `lazyweb_health` first, and pass
`"skill": "design-best-practices"` plus `"version"` (from
`cat "$HOME/.lazyweb/VERSION" 2>/dev/null || echo 0.0.0`) in every
`lazyweb_*` call — optional analytics metadata; never drop a real argument
for it. If Lazyweb MCP is missing or auth fails, tell the user: "Lazyweb MCP
is not installed. Run `curl -fsSL https://www.lazyweb.com/install.sh | bash`,
reload this client, then rerun this skill," and continue with the fetched
skills below.

---

## For web animation & motion use these

**tl;dr**
- Animate only `transform` and `opacity`, ease-out for every entrance (never ease-in), keep durations 100-300ms, and always honor `prefers-reduced-motion`.
- Decide IF something should animate by how often it's used — frequent interactions get instant feedback (e.g. `scale(0.97)` press), rare moments can afford choreography.
- Choreograph multi-element sequences (stagger, motion personality) before writing any code; don't tune elements one-by-one.

**Best specific skills**
1. **emilkowalski/skill (emil-design-eng)** — fetch `https://raw.githubusercontent.com/emilkowalski/skill/main/skills/emil-design-eng/SKILL.md` — best for taste-driven micro-interaction polish and reviewing/fixing existing UI animations (easing, duration, what should animate at all). The author wrote the course the rest of the ecosystem copies; concrete checkable rules, not vibes. Evidence: 88.9K installs (top of skills.sh Design & UI), 2.3K stars, announced by @emilkowalski on X, mirrored on 6+ registries. Strength: strong. ← default pick
2. **LottieFiles/motion-design-skill** — fetch `https://raw.githubusercontent.com/LottieFiles/motion-design-skill/main/skills/motion-design/SKILL.md` — best for framework-agnostic motion direction: choreography, motion personality, multi-element sequencing before any code. Evidence: 2.4K installs, 240 stars, vendor-maintained, works across CSS/Framer Motion/GSAP/Lottie. Strength: strong.
3. **vercel-labs/open-agents (web-animation-design)** — fetch `https://raw.githubusercontent.com/vercel-labs/open-agents/main/.agents/skills/web-animation-design/SKILL.md` — best for proactive animation Q&A and structured before/after audits with the broadest trigger coverage (GSAP/React Spring/scroll/springs). Evidence: Vercel-curated, 5.6K-star repo, but only 141 per-skill installs. Strength: directional.
4. **199-biotechnologies/motion-dev-animations-skill** — fetch `https://raw.githubusercontent.com/199-biotechnologies/motion-dev-animations-skill/main/SKILL.md` — best for writing actual Motion.dev/Framer Motion implementation code (scroll reveals, gestures, springs, layout/exit animations). The free alternative to Motion.dev's paywalled official skill. Evidence: 22 stars, no registry traction. Strength: single-source.

*Skip:* the circulated "emil-anim" gists (superseded by Emil's official skill); jezweb/claude-skills motion (registry listings look stale — no motion SKILL.md in the current tree).

*Corpus note:* hard install/star numbers are solid; genuine third-party review threads are scarce — ranking leans on installs, provenance, and direct file inspection.

---

## For general frontend / UI design quality (avoiding "AI slop") use these

**tl;dr**
- Commit to an explicit aesthetic direction (typography, color system, one signature element) BEFORE writing any code — never start from the AI defaults (Inter, purple gradients, card grids, cream+serif+terracotta).
- Work in two passes: generate with creative direction first, then run a rule-based compliance audit (accessibility, keyboard, forms, performance) as a separate quality gate before shipping.
- Match the design system to the product type — a fintech dashboard and a wellness app should not share a palette or type scale.

**Best specific skills**
1. **anthropics/skills — frontend-design** — fetch `https://raw.githubusercontent.com/anthropics/skills/main/skills/frontend-design/SKILL.md` — best for creative direction when generating new UI: it names the default AI design clusters and forces a committed, brief-specific direction before any code. Evidence: 531.9K installs (skills.sh #2 overall), 149K-star official repo, featured in 5+ independent 2026 roundups (Snyk, Composio, Firecrawl). Strength: strong. ← default pick
2. **nextlevelbuilder/ui-ux-pro-max** — fetch `https://raw.githubusercontent.com/nextlevelbuilder/ui-ux-pro-max-skill/main/.claude/skills/ui-ux-pro-max/SKILL.md` — best for auto-generating a complete, product-type-matched design system (style + palette + type + UX rules) with pre-delivery anti-pattern checks. Evidence: 211.5K installs, ~90K stars, called the most popular community design skill in 2026 roundups; organic review threads thin. Strength: strong.
3. **vercel-labs/agent-skills — web-design-guidelines** — fetch `https://raw.githubusercontent.com/vercel-labs/agent-skills/main/skills/web-design-guidelines/SKILL.md` — best for auditing existing UI code against 100+ interaction/accessibility/polish rules reported as file:line findings (quality gate, not generation). It fetches Vercel's live guidelines on every run, so it never goes stale. Evidence: ~383K installs, Vercel-official, recommended alongside frontend-design in multiple guides. Strength: strong.

*Skip:* anthropics canvas-design (poster/art canvases, not product UI); obra/superpowers (great engineering-workflow pack, zero design-quality content).

---

## For landing pages & marketing sites use these

**tl;dr**
- One page, one message, one CTA — match the headline to the traffic source, remove navigation where possible, and make the complete argument on a single page.
- Give the hero a deliberate visual identity (distinctive type + signature element) so it can't be mistaken for a template — visuals and conversion copy are two separate jobs; do both, in that order.
- Audit the built page against accessibility/UX rules before shipping; conversion structure (trust signals, objection handling) is a checklist, not a vibe.

**Best specific skills**
1. **anthropics/skills — frontend-design** — fetch `https://raw.githubusercontent.com/anthropics/skills/main/skills/frontend-design/SKILL.md` — best for the hero section and overall visual identity without the generic AI look. Evidence: 531.8K installs; praised on X specifically for landing pages ("without this, every Claude landing page looks the same"). Strength: strong. ← default pick, pair with #2
2. **coreyhaines31/marketingskills — copywriting** — fetch `https://raw.githubusercontent.com/coreyhaines31/marketingskills/main/skills/copywriting/SKILL.md` — best for conversion copy layout: headline, subheadline, CTAs, social proof, with page-type-specific frameworks ("single message, single CTA; match headline to traffic source"). Evidence: 124.0K installs (repo total 281.9K), built by a known SaaS marketer, featured in 2026 marketing-skill roundups. Strength: strong.
3. **coreyhaines31/marketingskills — cro** — fetch `https://raw.githubusercontent.com/coreyhaines31/marketingskills/main/skills/cro/SKILL.md` — best for conversion-rate diagnosis of page structure: value-prop clarity, trust signals, distraction removal, A/B test ideas. Strength: directional.
4. **vercel-labs/agent-skills — web-design-guidelines** — fetch `https://raw.githubusercontent.com/vercel-labs/agent-skills/main/skills/web-design-guidelines/SKILL.md` — best for the pre-ship audit of the built page (accessibility/UX correctness). Evidence: 383.1K installs. Strength: strong.

*Skip:* inferen-sh landing-page-design (promo wrapper for a paid CLI, little actual guidance); one-off landing-page SKILL.md repos with no registry presence or reviews.

---

## For typography use these

**tl;dr**
- Pair ONE distinctive display font with ONE refined body font, cap at 2 families, and never default to Inter/Roboto/Arial.
- Serve variable fonts with `display=swap` (fewer requests, full weight flexibility) and build text on a real modular type scale, not ad-hoc sizes.
- Typography exists to honor content: set hierarchy with size/weight/spacing before reaching for color or decoration.

**Best specific skills**
1. **anthropics/skills — frontend-design** (typography section) — fetch `https://raw.githubusercontent.com/anthropics/skills/main/skills/frontend-design/SKILL.md` — best for distinctive font selection and pairing on new UI ("avoid generic fonts like Arial and Inter… pair a distinctive display font with a refined body font"). Evidence: 531.9K installs. Strength: strong. ← default pick
2. **petekp/claude-code-setup — typography** — fetch `https://raw.githubusercontent.com/petekp/claude-code-setup/main/skills/typography/SKILL.md` — best for deep typography-only system work: type scales, fluid type, variable fonts, font loading, RTL/CJK. Bringhurst-grounded with 7 reference files. Evidence: repo active (June 2026) but ~6 installs — the only verified skill treating typography as the whole job. Strength: single-source. (Repo was renamed from petekp/claude-skills; older links 404.)
3. **sliday/google-fonts-skill** — fetch `https://raw.githubusercontent.com/sliday/google-fonts-skill/main/SKILL.md` — best for picking concrete Google Fonts pairings and generating the CSS/Tailwind/embed code (1,923-font database, mood search, 8 modular scales). Strength: single-source.
4. **vercel-labs/agent-skills — web-design-guidelines** — best for auditing existing code for typography/readability violations (see pointer above). Strength: strong.

*Skip:* davepoon typography-selector (thin Google-Fonts wrapper — sliday does the same job with a real database); "Typography Expert" directory listings with no fetchable repo.

---

## For color & theming use these

**tl;dr**
- Build color ramps in OKLCH (perceptually uniform), and structure tokens in three tiers — primitive → semantic → component — so dark mode is a token swap, never a color inversion.
- Name tokens by purpose, not appearance (`bg-surface`, not `gray-100`), and plan dark mode from day one — retrofitting is much harder.
- Treat contrast as a hard gate: WCAG AA 4.5:1 body / 3:1 large text minimum (use APCA when you want the stricter modern standard), verified programmatically, not by eye.

**Best specific skills**
1. **meodai/skill.color-expert** — fetch `https://raw.githubusercontent.com/meodai/skill.color-expert/main/SKILL.md` — best for color science: accessible palettes, OKLCH ramps, APCA/WCAG contrast decisions. Deepest verified color corpus (~113 reference docs), actively maintained (pushed 2026-06-10), author maintains the well-known color-names project. Evidence: 485 stars, tops GitHub color-skill search. Strength: strong. ← default pick
2. **wshobson/agents — visual-design-foundations** — fetch `https://raw.githubusercontent.com/wshobson/agents/main/plugins/ui-design/skills/visual-design-foundations/SKILL.md` — best for end-to-end foundations: semantic color tokens + a working dark-mode CSS-variable strategy (`[data-theme]` swap) inside a full design-system pass. Evidence: 8.7K installs, 36.6K-star parent repo. Strength: strong.
3. **ilikescience/design-tokens-skill** — fetch `https://raw.githubusercontent.com/ilikescience/design-tokens-skill/main/SKILL.md` — best for DTCG-spec token plumbing: `.tokens.json` validation, color-space objects, theme resolvers, Terrazzo/Figma pipelines. Author (Matthew Ström) writes prominently on design tokens. Evidence: 12 stars, registry-listed; the only verified skill targeting the W3C DTCG spec directly. Strength: single-source.

*Skip:* anthropics theme-factory (styles slide/doc artifacts with preset palettes — does not build app token systems or contrast-checked palettes); ui-ux-pro-max for this topic specifically (kitchen-sink lookup table, weak on dark-mode token architecture).

---

## For design systems & component libraries (shadcn/Tailwind) use these

**tl;dr**
- Use semantic tokens over raw values everywhere (`bg-primary` and `text-muted-foreground`, never hex or raw Tailwind scales), `gap-*` over `space-y-*`, and built-in component variants before any custom CSS.
- In an existing shadcn project, read the real component APIs and `components.json` instead of guessing; on greenfield, generate the full system first and persist it as a `MASTER.md` source of truth.
- On Tailwind v4, wire theming as variables in `:root`/`.dark` mapped through `@theme inline` — most "broken dark mode" reports trace to skipping that exact pattern.

**Best specific skills**
1. **shadcn-ui/ui — shadcn skill** — fetch `https://raw.githubusercontent.com/shadcn-ui/ui/main/skills/shadcn/SKILL.md` — best for enforcing component-library consistency in an existing shadcn/Tailwind project: correct component APIs, semantic tokens, composition rules (FieldGroup+Field forms). First-party and project-aware. Evidence: 186.0K installs, ships in the 116K-star shadcn repo, documented at ui.shadcn.com/docs/skills. Strength: strong. ← default pick for existing projects
2. **nextlevelbuilder/ui-ux-pro-max** — pointer above — best for generating a complete NEW design system when none exists: its v2 generator reasons from product type to a full system and can persist a `design-system/MASTER.md` source of truth. Evidence: 90.4K stars, top-5 in 4+ independent 2026 roundups. Strength: strong. ← default pick for greenfield
3. **arvindrk/extract-design-system** — fetch `https://raw.githubusercontent.com/arvindrk/extract-design-system/main/skills/extract-design-system/SKILL.md` — best for extracting tokens (colors, type, spacing, radius, shadows) from an existing live site via Playwright to bootstrap a tokenized system matching a real brand. Honest guardrails in the file itself. Evidence: 123.1K registry installs but only 54 stars — popularity may be registry-inflated. Strength: directional.
4. **secondsky/claude-skills — tailwind-v4-shadcn** — fetch `https://raw.githubusercontent.com/secondsky/claude-skills/main/plugins/tailwind-v4-shadcn/skills/tailwind-v4-shadcn/SKILL.md` — best for wiring Tailwind v4 token/theme architecture correctly and debugging broken theming (the exact variable → `@theme inline` → base styles → dark mode pattern plus the five known setup errors). Evidence: 167 stars, graded 'A' on skillsdirectory. Strength: directional.

*Skip:* frontend-design for this topic (one-shot aesthetic direction, no token governance or consistency rules); mattbx/shadcn-skills (8 stars, no traction).

---

## For accessibility use these

**tl;dr**
- Treat accessible code as the baseline on every UI edit, not an audit afterthought — WCAG 2.2 AA across all four POUR principles is the floor, not the stretch goal.
- Automate with axe-core/Lighthouse, but never call it done without keyboard-only navigation and a real screen reader pass (VoiceOver/NVDA) — automated tools catch a minority of issues.
- Don't guess ARIA patterns from memory; pull the documented pattern for the specific widget (and on large sites, audit ~20 representative template pages instead of crawling everything).

**Best specific skills**
1. **addyosmani/web-quality-skills — accessibility** — fetch `https://raw.githubusercontent.com/addyosmani/web-quality-skills/main/skills/accessibility/SKILL.md` — best for general-purpose WCAG 2.2 audit-and-fix with copy-paste ARIA/keyboard/contrast patterns covering all four POUR principles. Evidence: 2.2K-star repo, multiple registries, cited in Snyk's UI/UX skills roundup, Chrome-team-adjacent author. Strength: strong. ← default pick
2. **Community-Access/accessibility-agents** — repo `https://github.com/Community-Access/accessibility-agents` (browse the repo; skills live in subdirectories) — best for team-scale WCAG 2.2 AA enforcement: 79 agents + 18 skills including document (DOCX/PDF/PPTX) accessibility and an MCP scanner for CI. Built by actual assistive-technology users (Taylor Arndt, Jeff Bishop), v5.4.0 May 2026. Strength: directional — the depth pick, not the default.
3. **joedevon/a11y-skills — a11y-code-review** — fetch `https://raw.githubusercontent.com/joedevon/a11y-skills/main/a11y-code-review/SKILL.md` — best for an always-on accessible-code baseline that triggers on every UI edit, not just explicit audit requests ("accessible code is the baseline, not an add-on"). Author co-founded Global Accessibility Awareness Day — unmatched domain authority, but ~no usage signal. Strength: single-source.
4. **snapsynapse/skill-a11y-audit** — repo `https://github.com/snapsynapse/skill-a11y-audit` (SKILL.md at `a11y-audit/SKILL.md`) — best for auditing large live sites efficiently via template-aware page sampling (~20 representative pages instead of 700). Strength: single-source.

*Skip:* mindrally accessibility-a11y (anonymous mega-pack, registry SEO only); CrazyDubya accessibility-auditor (bulk AI-generated dump).

---

## For UX writing & microcopy use these

**tl;dr**
- Every error message must answer three questions: what happened, why, and how to fix it — anything less is decoration.
- Write button labels as verb+object ("Save changes", not "OK"/"Submit"), and treat empty states as onboarding moments, not dead ends.
- Don't apply marketing-copy frameworks to product UI — persuasion copy and microcopy are different jobs; inside the product, clarity beats cleverness every time.

**Best specific skills**
1. **pbakaus/impeccable — clarify** — fetch `https://raw.githubusercontent.com/pbakaus/impeccable/main/.claude/skills/impeccable/reference/clarify.md` — best for fixing unclear labels, error messages, and CTA copy in an existing UI as part of a design-quality pass. Evidence: 37.5K stars, pushed 2026-06-11, 156.3K installs, covered by Firecrawl/Composio/Snyk roundups. Strength: strong. ← default pick
2. **content-designer/ux-writing-skill** — fetch `https://raw.githubusercontent.com/content-designer/ux-writing-skill/main/SKILL.md` — best for writing new microcopy end-to-end with systematic standards: voice/tone charts, fillable templates for errors, empty states, onboarding. The only dedicated, maintained UX-writing SKILL.md found. Evidence: 108 stars, 714 installs, v1.6.0 Mar 2026. Strength: directional.
3. **szilu/ux-designer-skill** — fetch `https://raw.githubusercontent.com/szilu/ux-designer-skill/main/SKILL.md` — best for a lightweight single-skill UX generalist with a dedicated microcopy reference, without pulling in an 18-skill pack. Evidence: 20 stars, no registry rank. Strength: single-source.

*Skip:* coreyhaines31 copywriting for this topic (explicitly scoped to marketing pages, not UI microcopy — it IS the right pick for landing pages above).

---

## For mobile app design (iOS/Android) use these

**tl;dr**
- Follow the platform, don't invent: HIG on iOS, Material 3 on Android — native navigation patterns, no hamburger menus on iOS, no hardcoded fonts.
- Hit the universal floor on every screen: 44×44pt (Apple) / 48×48dp (Material) touch targets (extend hit areas beyond visual bounds if needed), safe areas, swipe-back, Dynamic Type.
- Design for each platform separately rather than shipping one compromise UI to both.

**Best specific skills**
1. **ehmo/platform-design-skills** — fetch `https://raw.githubusercontent.com/ehmo/platform-design-skills/main/skills/ios/SKILL.md` (Android variant alongside it in the repo) — best for enforcing HIG / Material 3 / WCAG conventions on iOS and Android screens: 450+ distilled per-platform rules incl. iPadOS/watchOS/visionOS, with checklists and anti-patterns. Evidence: 390 stars, multi-registry, surfaced in the HN "Claude Skills are awesome" thread. Strength: strong. ← default pick
2. **nextlevelbuilder/ui-ux-pro-max** — pointer above — best for end-to-end mobile-first UI generation (design system + touch/gesture rules) across React Native, Flutter, SwiftUI. Evidence: ~211.4K installs, 90.4K stars; mobile rules verified real. Strength: strong.
3. **wshobson/agents — mobile-ios-design / mobile-android-design** — fetch `https://raw.githubusercontent.com/wshobson/agents/main/plugins/ui-design/skills/mobile-ios-design/SKILL.md` — best for implementing native-feeling screens in code: SwiftUI patterns, NavigationStack, SF Symbols, semantic colors, Material 3 components. Evidence: 36.6K-star repo, actively pushed; per-skill signal weaker. Strength: directional.

*Skip:* sleekdotdesign sleek-design-mobile-apps (~199K installs but it's a REST wrapper for a paid platform requiring an API key); awesome-skills/mobile-app-design (dormant, shallower duplicate of ehmo's pack).

For what real mobile apps' screens actually look like (evidence, not rules), pair with `/lazyweb-lite-design-research` or `/lazyweb-deep-design-research`. For exact Apple HIG measurements or Liquid Glass implementation, see `HIGAgentSkills` and `claude-code-apple-skills` under Hidden gems.

---

## For dashboards & data visualization use these

**tl;dr**
- Pick chart encodings by the perceptual hierarchy: position beats length beats angle beats area beats color (Cleveland-McGill) — so bars over pies, dot plots over heatmap shades when precision matters.
- For 1000+ data points, aggregate or sample and provide drill-down for detail — never render everything.
- Get chart correctness and visual polish from separate passes: choose the right chart and encoding first, style the dashboard second.

**Best specific skills**
1. **nextlevelbuilder/ui-ux-pro-max** — pointer above — best for end-to-end design system + chart/dashboard guidance: the only widely-installed skill explicitly encoding dashboard/admin product types (Data-Dense Dashboard, Executive Dashboard, Real-Time Monitoring) and 25 chart types. Evidence: 211.5K installs, Snyk roundup. Strength: strong. ← default pick
2. **ntcoding/claude-skillz — data-visualization** — fetch `https://raw.githubusercontent.com/ntcoding/claude-skillz/main/data-visualization/SKILL.md` — best for chart-selection and perceptual-encoding correctness: Cleveland-McGill hierarchy, layout algorithms (dagre, d3-force, ELK.js), performance-by-data-scale rules. Strength: directional.
3. **anthropics/skills — frontend-design** — pointer above — best for visual polish layered on top ("structure is information… should encode something true about the content, not decorate it"). No dataviz brain of its own. Strength: strong.
4. **mhattingpete/dashboard-creator** — fetch `https://raw.githubusercontent.com/mhattingpete/claude-skills-marketplace/main/visual-documentation-plugin/skills/dashboard-creator/SKILL.md` — best for quick self-contained HTML KPI dashboards (no JS framework) for reports and internal monitoring. Too shallow for production admin UIs. Strength: single-source.

*Skip:* aggregator-only "Data Visualization Expert" listings with no traceable repo; directory skills with self-reported, unverifiable trust numbers.

---

## For icons, illustration & SVG use these

**tl;dr**
- Lock one shared geometry across the whole icon set: identical viewBox on every icon, identical root stroke attributes, consistent padding, max 2 decimal places of coordinate precision, and `currentColor` exclusively so icons inherit text color.
- Never mix outline and solid icon styles within one section, and never use emoji as icons — pick one library (Lucide as default; Heroicons for Tailwind, Phosphor for weight variants) with explicit named imports so tree-shaking survives.
- Size by context: 16-20px inline with text, 32px in feature cards, 40-48px in heroes; for logos/marks add `role="img"` + `<title>`/`<desc>` and verify legibility at 100px minimum on light AND dark backgrounds.

**Best specific skills**
1. **better-auth/better-icons** — fetch `https://raw.githubusercontent.com/better-auth/better-icons/main/skills/SKILL.md` — best for pulling real, existing icons (200+ Iconify libraries, 200k+ icons) instead of letting the agent hand-draw inconsistent SVGs. Removes the biggest agent failure mode in iconography. Evidence: 1,080 stars, updated 2026-06-11, established better-auth org, 5+ registries. Strength: strong. ← default pick
2. **jezweb/claude-skills — icon-set-generator** — fetch `https://raw.githubusercontent.com/jezweb/claude-skills/main/plugins/design-assets/skills/icon-set-generator/SKILL.md` — best for generating a bespoke cohesive custom icon SET when no library fits the brand: shared style spec enforced across every SVG plus an HTML preview deliverable. Evidence: 850-star repo, active. Strength: strong.
3. **icon-design (jezweb, via majiayu000/claude-skill-registry mirror)** — fetch `https://raw.githubusercontent.com/majiayu000/claude-skill-registry/main/skills/data/icon-design/SKILL.md` — best for semantic icon SELECTION and in-code wiring rules (concept→icon mapping, sizing, theming, tree-shaking). The canonical file moved, so this is a verified mirror — treat provenance as directional. Strength: directional.
4. **rknall/claude-skills — svg-logo-designer** — fetch `https://raw.githubusercontent.com/rknall/claude-skills/main/svg-logo-designer/SKILL.md` — best for one-off logo/brand-mark SVGs: forces multi-concept exploration, monochrome/reversed variants, min-size legibility checks. Strength: directional.

*Skip:* mass auto-generated "svg-icon-generator" template repos; routing-stub SVG skills with no actual rules.

*Corpus note:* no well-adopted skill exists for ILLUSTRATION style consistency (spot/hero illustration systems) — that gap is open; the picks above cover icons and marks.

---

## For 3D, WebGL & shaders use these

**tl;dr**
- Never call setState inside `useFrame` (that's 60 re-renders/sec) — mutate refs directly and use transient subscriptions for continuous values; re-renders are the #1 react-three-fiber performance killer.
- In shaders avoid branching (use `mix`/`step` instead of if/else), group uniforms into vectors, precalculate static math in JS; for new shader work prefer the WebGPU entry point (`import from 'three/webgpu'`, r171+) with TSL node materials over raw GLSL.
- For 3D hero moments keep three layers strictly separated — Three.js rendering, GSAP scroll timelines, React UI overlay — never let two libraries animate the same property, and always kill tweens and dispose GPU resources on unmount.

**Best specific skills**
1. **dgreenheck/webgpu-claude-skill (webgpu-threejs-tsl)** — fetch `https://raw.githubusercontent.com/dgreenheck/webgpu-claude-skill/main/skills/webgpu-threejs-tsl/SKILL.md` — best for modern shader effects: WebGPU renderer, TSL node materials, GPU compute particles, post-processing. Deepest and most current artifact in the niche, by a well-known three.js educator. Evidence: 992 stars, 6 docs + 5 examples + 2 templates, independently covered. Strength: strong. ← default pick
2. **EnzeD/r3f-skills** — fetch `https://raw.githubusercontent.com/EnzeD/r3f-skills/main/skills/r3f-shaders/SKILL.md` — best for building react-three-fiber product-site scenes end to end: 11 modular skills (fundamentals, materials, lighting, shaders, physics) built to correct stale R3F patterns in LLM training data. Evidence: promoted by Nicolas Zullo on X, multi-registry. Strength: strong.
3. **emalorenzo/three-agent-skills** — fetch `https://raw.githubusercontent.com/emalorenzo/three-agent-skills/main/skills/r3f-best-practices/SKILL.md` — best for performance guardrails layered on any 3D build: 100+ prioritized Three.js rules, 60+ R3F rules (disposal, render-loop hygiene, re-render prevention). Evidence: featured in Snyk's 3D-skills roundup. Strength: strong.
4. **freshtechbro/claudedesignskills — web3d-integration-patterns** — fetch `https://raw.githubusercontent.com/freshtechbro/claudedesignskills/main/.claude/skills/web3d-integration-patterns/SKILL.md` — best for the product-site framing specifically: wiring Three.js/R3F into scroll-driven GSAP timelines and React overlays without animation conflicts or leaks. Strength: single-source.

*Skip:* intro-level generic Three.js skills with near-zero traction; CAD/game-focused packs when the job is a product site.

*Corpus note:* unusually healthy niche. No skill covers shader-driven brand aesthetics (grain/dither/liquid hero looks) as design guidance — open gap.

---

## For HTML email design use these

**tl;dr**
- Build at 600px max width with table/MJML hybrid layouts — never flexbox, grid, rem units, SVG, or WebP — and ship minified HTML to stay under Gmail's 102KB clip threshold.
- For dark mode: both `color-scheme` and `supported-color-schemes` metas set to "light dark", `prefers-color-scheme` overrides in a NON-inlined style block with `!important`, and `#121212`/`#F1F1F1` instead of pure black/white to prevent jarring forced inversion in Apple Mail.
- Treat Outlook as the floor: VML/ghost-table fallbacks for background images, bulletproof VML buttons, web fonts hidden from Outlook via MSO conditionals with an Arial fallback, alt text on every image, plain-text version always populated.

**Best specific skills**
1. **framix-team/skill-email-html-mjml** — fetch `https://raw.githubusercontent.com/framix-team/skill-email-html-mjml/master/email-html-mjml/SKILL.md` (note: `master` branch — `main` 404s) — best for production cross-client email from scratch: the only skill encoding the truly niche failure modes (whitespace-triggered inline-block stacking, VML positioning, 102KB clipping) as hard rules, with a complete copy-paste dark-mode pattern. Evidence: 48 stars, Feb 2026, surfaced via 3 independent routes; deepest verified content in the niche. Strength: strong. ← default pick
2. **resend/resend-skills — react-email** — fetch `https://raw.githubusercontent.com/resend/resend-skills/main/skills/react-email/SKILL.md` — best for React/TypeScript codebases wanting component-based emails with client-quirk guardrails baked into the framework. Evidence: official Resend skill, 6.0K installs, backed by the 19.3K-star react-email project. Weaker on dark mode (tells you to avoid it). Strength: strong.
3. **resend/resend-skills — email-best-practices** — fetch `https://raw.githubusercontent.com/resend/resend-skills/main/skills/email-best-practices/SKILL.md` — best for the non-rendering half: deliverability (SPF/DKIM/DMARC), accessibility, compliance. Pair with a rendering skill. Strength: directional.
4. **inference-sh/skills — email-design** — fetch `https://raw.githubusercontent.com/inference-sh/skills/main/guides/design/email-design/SKILL.md` — best for marketing-email heuristics: layout patterns, bulletproof buttons, 40/60 image-text ratio for spam filters. Silent on dark mode. Strength: directional.

*Skip:* thin react-email rewraps inside grab-bag mega-repos; 0-star single-commit duplicates.

*Corpus note:* dark mode is the weakest-covered subtopic ecosystem-wide; only the Framix skill has a complete pattern, and nothing covers Gmail Android's partial forced recoloring.

---

## For form design & input UX use these

**tl;dr**
- Validate on blur, not per keystroke; render errors inline below the offending field, auto-focus the first invalid field on submit, and add a top error summary with anchor links when there are multiple.
- Wire every input for autofill and the right keyboard: correct `type` + `inputmode`, meaningful `name` + `autocomplete`, clickable labels, spellcheck off for emails/codes, never block paste; keep submit enabled until the request starts, then show a spinner.
- Multi-step and checkout flows get a step indicator with back navigation, auto-saved drafts on long forms, an unsaved-changes warning, and error messages that state cause + how to fix with a recovery path — never just "Invalid input".

**Best specific skills**
1. **vercel-labs/agent-skills — web-design-guidelines** (Forms section) — pointer above — best for auditing form/input code against the densest maintained form rule list (inline errors, focus management, paste, autofill, unsaved-changes), fetched live so it never goes stale. Evidence: 383K installs. Strength: strong. ← default pick
2. **nextlevelbuilder/ui-ux-pro-max** — pointer above — best for generative form/flow design when building from scratch: the only high-adoption skill with explicit multi-step-flow and error-recovery rules (auto-save drafts, error summary anchors, timeout retry). Strength: strong.
3. **danielmeppiel/form-builder** — fetch `https://raw.githubusercontent.com/danielmeppiel/form-builder/main/SKILL.md` — best for the implementation layer once designed: React Hook Form + Zod scaffolding, validation schemas, multi-step state, worked examples. Evidence: 2 stars — the only dedicated form-niche skill found. Strength: single-source.

*Skip:* "Form Builder" registry skills that generate fillable PDFs (name collision, wrong domain).

*Corpus note:* no skill is dedicated purely to form design UX — the best form guidance lives inside the two big general UI skills.

---

## For data tables & complex grids use these

**tl;dr**
- Tier the implementation: semantic `<table>` for simple static data, TanStack Table once you need sorting/filtering/pagination, a virtualized data grid only past ~1,000 rows — and switch sorting/filtering to server-side at that scale.
- Fix the chrome and make state shareable: search/filters above the table aligned left, bulk/primary actions above aligned right, and filter+sort state in the URL so any view survives reload and can be linked.
- Make grids accessible by contract: `aria-sort` on the sorted `<th>` with the sort control as a real button, `scope` on every header, `role="grid"` + arrow keys only when cells are actually interactive, and context-aware row-action labels ("Edit Jane Smith", not "Edit").

**Best specific skills**
1. **openstatusHQ/data-table-filters** — fetch `https://raw.githubusercontent.com/openstatusHQ/data-table-filters/main/skills/SKILL.md` — best for building a production filterable table in React (shadcn + TanStack): faceted filters, virtualized infinite scroll, URL-persisted state with documented SSR hydration. Ships working infrastructure, not prose. Evidence: ~2,045 stars, pushed 2026-06-05, backed by openstatus's known live demo. Strength: strong. ← default pick
2. **supabase/supabase — studio-ui-patterns** — fetch `https://raw.githubusercontent.com/supabase/supabase/master/.claude/skills/studio-ui-patterns/SKILL.md` — best for admin CRUD page conventions: a production team's actual three-tier table doctrine plus concrete layout rules, battle-tested in Supabase Studio. Strength: directional.
3. **Community-Access/accessibility-agents — tables-data-specialist** — fetch `https://raw.githubusercontent.com/Community-Access/accessibility-agents/main/codex-skills/tables-data-specialist/SKILL.md` — best for auditing table/grid accessibility: the most specific table-a11y checklist found anywhere in skill form. Pair as a review pass. Strength: directional.

*Skip:* the jezweb tanstack-table skill that directories still list — deleted upstream, its path 404s today; marketplace listings with no traceable source repo.

*Corpus note:* nothing covers density tokens (compact/comfortable row heights) explicitly — open gap.

---

## For responsive & modern CSS layout use these

**tl;dr**
- Build mobile-first with `min-width` queries only, defaulting to the 640/768/1024/1280/1536px stops — but place actual breakpoints where the content breaks, not at device widths.
- Prefer layouts that need zero media queries: `repeat(auto-fit, minmax(280px, 1fr))` for card grids, and container queries (`container-type: inline-size` + `@container`) so components adapt to their container, not the viewport.
- Make type and spacing fluid with `clamp(min, preferred, max)`, keep touch targets at 44×44px minimum on mobile, and test the full 320px-1536px range plus safe-area insets.

**Best specific skills**
1. **wshobson/agents — responsive-design** — fetch `https://raw.githubusercontent.com/wshobson/agents/main/plugins/ui-design/skills/responsive-design/SKILL.md` — best as the default: the only widely-adopted skill targeting exactly this niche (container queries, clamp() fluid type, grid auto-fit, breakpoint strategy, adaptive navigation). Evidence: 12.8K installs, 36.6K-star parent repo. Strength: strong. ← default pick
2. **lotfb86/web-design-skills — 02-responsive-design** — fetch `https://raw.githubusercontent.com/lotfb86/web-design-skills/main/02-responsive-design/SKILL.md` — best for exact numeric recipes: explicit breakpoint table, clamp() formulas, grid-vs-flex decision tree, srcset/picture, 320-1536px testing checklist. Zero traction but the most concrete values found. Strength: single-source.
3. **anthropics/skills — frontend-design** — pointer above — best for a responsiveness quality floor inside a broader design pass; no container-query or breakpoint instruction of its own. Strength: strong.

*Skip:* Vercel web-design-guidelines for this niche specifically (its live ruleset has almost no responsive-layout rules); marketplace-only "Modern CSS Specialist" listings with no verifiable source.

*Corpus note:* no skill covers subgrid in depth — open gap.

---

## For brand identity use these

**tl;dr**
- Allocate brand colors by role with a 60/30/10 split (primary/secondary/accent) and lock logo clearspace to the logo's own height on all sides.
- Write voice as a "We Are / We Are Not" contrast table plus one Single Rule sentence every piece of copy is tested against; keep voice constant and flex only tone (formality, energy, technical depth) per context.
- Ground the brand in a customer definition before any aesthetics, then encode exact hex values and a two-font pairing (display ≥24pt, body with named fallbacks) so agents can apply the brand deterministically.

**Best specific skills**
1. **travisjneuman/.claude — brand-identity** — fetch `https://raw.githubusercontent.com/travisjneuman/.claude/master/skills/brand-identity/SKILL.md` — best for generating a complete brand identity from scratch: the only verified skill covering strategy → logo direction → 60/30/10 color → typography → voice in one file. Evidence: 63 stars, active June 2026. Strength: directional. ← default pick for creating a brand
2. **anthropics/skills — brand-guidelines** — fetch `https://raw.githubusercontent.com/anthropics/skills/main/skills/brand-guidelines/SKILL.md` — best as the canonical TEMPLATE for packaging an EXISTING brand as an agent skill. Caveat: it hardcodes Anthropic's own brand — copy the schema, substitute your tokens. Evidence: 54.5K installs, official. Strength: strong. ← default pick for applying a brand
3. **doodledood/claude-code-plugins — define-brand-guidelines** — fetch `https://raw.githubusercontent.com/doodledood/claude-code-plugins/main/claude-plugins/solo-dev/skills/define-brand-guidelines/SKILL.md` — best for customer-grounded VERBAL brand: hard prerequisite on a customer definition, 9 guided questions, draft → sample-copy stress-test → finalize. Best process design in the corpus. Strength: directional.
4. **anthropics/knowledge-work-plugins — brand-voice-enforcement** — fetch `https://raw.githubusercontent.com/anthropics/knowledge-work-plugins/main/partner-built/brand-voice/skills/brand-voice-enforcement/SKILL.md` — best for enforcing an already-defined voice across day-to-day content with audience-aware tone flexing. Evidence: official Anthropic repo, 20.3K stars. Strength: strong.

*Skip:* verbatim mirrors of Anthropic's brand skill with Anthropic's hex hardcoded — use upstream and substitute.

*Corpus note:* logo direction is the thinnest slice — principles only, no generation skill with traction. Also see `hue` under Hidden gems for brand→design-system automation.

---

## For programmatic video & motion graphics use these

**tl;dr**
- Drive all motion from `useCurrentFrame()` + `interpolate()`/`spring()` — CSS transitions/animations are FORBIDDEN in rendered video because they don't render deterministically frame-by-frame; clamp interpolations with extrapolate options.
- Structure scenes with `<Sequence>` and compute timing as frames = seconds × fps (30fps standard); `Easing.out` for entrances, `Easing.in` for exits; transitions 15-60 frames, title scenes 90-150.
- Assets go in `public/` via `staticFile()` with `<Img>`/`<OffthreadVideo>`/`<Audio>` components; for GIFs hold 10-30fps at fixed dimensions (128×128 emoji, 480×480 message) and validate file size before shipping.

**Best specific skills**
1. **remotion-dev/skills — remotion** — fetch `https://raw.githubusercontent.com/remotion-dev/skills/main/skills/remotion/SKILL.md` — best as the default install for any Remotion work: official, 28+ modular rule files, targets the exact failure mode agents hit (time-based CSS instead of frame-based animation). Evidence: ~150K installs in 8 weeks, 3.6K stars, HN + viral X coverage. Strength: strong. ← default pick
2. **digitalsamba/claude-code-video-toolkit** — fetch `https://raw.githubusercontent.com/digitalsamba/claude-code-video-toolkit/main/.claude/skills/remotion/SKILL.md` — best for end-to-end AI video production: full promos with AI voiceover, music, FFmpeg post, Playwright demo capture. Composes cleanly with #1 (defers framework questions to it). Evidence: 1.4K stars, v0.17.0 June 10 2026. Strength: directional.
3. **anthropics/skills — slack-gif-creator** — fetch `https://raw.githubusercontent.com/anthropics/skills/main/skills/slack-gif-creator/SKILL.md` — best when the deliverable is a GIF, not a video: constraint-first (dimensions, fps, file-size validation) with composable animation primitives. Strength: strong.

*Skip:* remotion rewraps inside grab-bag repos; framer-motion skills mislabeled as video (they target in-app UI animation — see the web animation section).

---

## For Figma-to-code & design handoff use these

**tl;dr**
- Never code from assumptions: fetch the design context (layout, tokens, variants) AND a screenshot of the exact Figma node first, keep the screenshot as source of truth, and validate against a checklist (spacing, type, exact colors, hover/active/disabled states) before calling done.
- Translate, don't transcribe: map Figma values onto the project's existing tokens and components instead of hardcoding hex/px; when a token conflicts with the Figma spec, keep the token and adjust minimally — codebase consistency beats literal replication.
- QA with numbers, not vibes: diff rendered values against the design per property (~2px tolerance for dimensions), weight color/spacing mismatches as major, and compute a parity score so drift is measurable and re-checkable.

**Best specific skills**
1. **Figma official — figma-implement-design (curated in openai/skills)** — fetch `https://raw.githubusercontent.com/openai/skills/main/skills/.curated/figma-implement-design/SKILL.md` — best as the default for 1:1 implementation via the Figma MCP server: a strict 7-step pipeline with explicit do-nots and a validation checklist. (The canonical copy moved out of Figma's own repo; this curated path is currently the most reliable raw source.) Evidence: vendor-maintained, 21.9K-star host repo, ~27.5K installs across the figma source. Strength: strong. ← default pick
2. **southleft/skills-for-figma — check-design-parity-figma** — fetch `https://raw.githubusercontent.com/southleft/skills-for-figma/main/skills/check-design-parity-figma/SKILL.md` — best for design QA against mocks: diffs the built component against the Figma node's real specs and returns a weighted 0-100 parity score with per-property severity. The only structured QA methodology found. Evidence: 4 stars. Strength: single-source.
3. **terminalskills/skills — figma-to-code** — fetch `https://raw.githubusercontent.com/terminalskills/skills/main/skills/figma-to-code/SKILL.md` — best for handoff WITHOUT a Figma MCP connection: works from a REST token, a raw screenshot, or exported token JSON, with opinionated generation rules. Strength: directional.

*Skip:* "Pixel-Perfect UI" marketplace listings with no fetchable source; bulk-generated PM-checklist "figma-design-qa" packs.

---

## Hidden gems (skeptic-verified)

Skills with an exceptional quality-to-fame ratio: each was found via enthusiasm signals rather than popularity, then an adversarial reviewer re-fetched the file, checked the praise sources, and tried to refute "gem" status — these survived. Where the only praise on record is the author's own, that is said outright; these earn their place on verified content quality.

1. **Dammyjay93/interface-design** — fetch `https://raw.githubusercontent.com/Dammyjay93/interface-design/main/.claude/skills/interface-design/SKILL.md` — product/interface UI for dashboards, admin panels, and data-dense apps (explicitly NOT marketing pages), with a persisted `system.md` design-memory file for cross-session consistency. Concrete anti-default prescriptions and enforceable self-checks ("sameness is failure"). 5K stars and climbing — the least hidden of these; included because it is absent from every mainstream roundup tier above it. Third-party praise unverified (launch-post praise is the author's own).
2. **justinwetch/HIGAgentSkills** — fetch `https://raw.githubusercontent.com/justinwetch/HIGAgentSkills/main/SKILL.md` — Apple HIG distilled into 150 reference files with tiered retrieval and anti-hallucination rules ("cite exact values"); skeptic spot-checked its measurements against the real HIG and they held (44×44pt targets, 60×60 visionOS, 17pt iOS body). 74 stars, 3 months old, eval-rigorous author. No external praise on record — gem on content alone. Caveat: heavy always-load context cost.
3. **dominikmartn/hue** — fetch `https://raw.githubusercontent.com/dominikmartn/hue/HEAD/SKILL.md` — brand-to-design-system meta-skill: drop a brand URL/name/screenshot and it generates a complete persistent design-language skill (tokens, 40 component specs, light+dark, anti-pattern bans, a validate.mjs self-check). Skeptic: "I went in trying to refute 'gem' and could not." Third-party praise confirmed (Abduzeedo editorial feature). 694 stars, one month old.
4. **murphytrueman/design-system-ops** — fetch `https://raw.githubusercontent.com/murphytrueman/design-system-ops/HEAD/skills/component-audit/SKILL.md` (one of ~20 skills in the repo) — the maintenance side of design systems nobody covers: component/token audits, drift detection, adoption reporting, codemod generation, governance. Depth exceeds most 1K-star design skills (config loading, audit-over-audit comparison, blast-radius graphs). 84 stars; audience is design-system OPS leads, hence invisible. No external praise on record — gem on content alone.
5. **jamiemill/layers-skills** — fetch `https://raw.githubusercontent.com/jamiemill/layers-skills/main/skills/layers-orient/SKILL.md` — product design strategy BELOW the pixel layer: a 7-layer diagnostic (`/layers-orient`) that finds which design layer is actually the bottleneck before you design screens, plus per-layer skills (conceptual model, user needs, interaction flow). Third-party praise confirmed (Nervegna newsletter: "It will almost always tell you you've been working at the wrong layer"). 164 stars, 5 weeks old.
6. **zeke/swiss-design-skill** — fetch `https://raw.githubusercontent.com/zeke/swiss-design-skill/main/swiss-design/SKILL.md` — a complete Swiss International Style system as Tailwind rules: grid, type scale, stone palette, one-accent rule, plus typographic micro-rules most skills never reach (curly quotes, tabular-nums, text-balance, "opacity, not hue, creates hierarchy"). By a respected engineer, published with zero launch push; 104 stars. Narrow by design (one aesthetic, Tailwind-only). Third-party praise: neutral commentary only.
7. **rshankras/claude-code-apple-skills — liquid-glass + iOS HIG ui-review** — fetch `https://raw.githubusercontent.com/rshankras/claude-code-apple-skills/main/skills/design/liquid-glass/SKILL.md` — 801 lines of accurate API-level Liquid Glass implementation (SwiftUI `.glassEffect()`, AppKit, UIKit, WidgetKit) plus a HIG review checklist — design knowledge no web frontend skill carries. Third-party praise confirmed ("If you develop iOS apps, this skill is essential"). 402 stars, pushed the day of this research; buried inside a 50+ skill iOS repo, so design-skill hunters never surface it.

Near-misses the skeptics downgraded (kept here so we don't re-litigate them next refresh): Owl-Listener/designer-skills (1.5K stars; breadth without depth — ~50-line textbook recaps), julianoczkowski designer-skills (decent pack, thin flagship), LovroPodobnik refactoring-ui-skill (accurate book notes a frontier model already knows), Wholiver swiftui-design-skill (a port of the web anti-slop playbook), Owl-Listener model-interaction-design and inclusive-personas (tidy primers, not gems).

---

## Refresh protocol (when a topic is missing or stale)

This table was researched 2026-06-11. The skill ecosystem turns over fast.
When the user's aspect has no section here, or this file is older than ~90
days, re-run the sweep for that aspect — in parallel where possible:

1. Search skills.sh, GitHub ("claude skill <topic>", awesome-lists),
   `site:reddit.com` (r/ClaudeAI, r/ClaudeCode, r/cursor, r/webdev),
   `site:x.com`, and `site:news.ycombinator.com` — 4-8 searches.
2. **Verify before recommending**: fetch the candidate's repo and raw
   SKILL.md; a skill that can't be fetched and read does not ship. Never
   invent a skill, a rank, an install count, or a quote.
3. Count, don't vibe: a top pick needs ≥2 independent sources; label
   strength honestly (strong / directional / single-source); discount
   signals older than ~6 months; flag a thin corpus.
4. Present in the same format as the sections above, apply the winner to
   the user's task, and update this file's section (and the researched date)
   so the next run benefits.
