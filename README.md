# Lazyweb Skill

**Design with evidence, not vibes.**

AI agents design from training data averages — generic layouts, safe colors, patterns you've seen a thousand times. This skill gives your agent access to Lazyweb's database of real app screenshots from thousands of the best mobile apps ever built.

Your agent searches before it designs. It finds real examples, downloads them locally, and produces structured reports with inline images you can preview in any markdown viewer.

## Four skills included

**`/lazyweb-design-research`** — Deep design research. Identifies competitors, searches Lazyweb + web, downloads reference screenshots, and produces a structured report with: TL;DR, Examples, Findings, Patterns, Anti-Patterns, Unique Angles, and Recommendations. Use for competitive analysis and best practices research.

**`/lazyweb-quick-references`** — Find screenshots fast. Searches Lazyweb, downloads results, groups by pattern. Lighter than design-research — just find, group, show. Use when you need visual references, not a full report.

**`/lazyweb-design-improve`** — Improve an existing design. Captures a screenshot of your current app, finds similar screens from the best apps, and generates 1-5 concrete improvement ideas — each tied to a real reference. Adapted from Lazyweb's production design critique system.

**`/lazyweb-design-brainstorm`** — Cross-pollination brainstorm. Deliberately searches OUTSIDE your category to find novel patterns. If everyone in fintech copies each other, this skill looks at gaming, entertainment, and social apps for transferable ideas. The "zig when everyone zags" skill.

## Install

```bash
npx skills add https://github.com/aboul3ata/lazyweb-skill
```

<details>
<summary>Alternative: manual install</summary>

Clone into your skills directory:

**Claude Code:**
```bash
git clone https://github.com/aboul3ata/lazyweb-skill.git ~/.claude/skills/lazyweb-skill
```

**Cursor:**
```bash
git clone https://github.com/aboul3ata/lazyweb-skill.git .cursor/skills/lazyweb-skill
```
</details>

## Prerequisites

These skills call the Lazyweb CLI, which talks to a local backend server that queries Lazyweb's database. You need:

1. **cli-lazybackend** — The search backend (runs locally)
2. **cli-lazyweb** — The CLI that the skills invoke

<details>
<summary>Setup instructions</summary>

### 1. Clone the repos

```bash
git clone https://github.com/aboul3ata/cli-lazybackend.git
git clone https://github.com/aboul3ata/cli-lazyweb.git
```

### 2. Install dependencies

```bash
cd cli-lazybackend && bun install
```

### 3. Configure environment

Copy `.env.example` to `.env` and fill in your API keys:

```bash
cp .env.example .env
```

See `.env.example` for the required API keys.

### 4. Start the backend

```bash
cd cli-lazybackend && bun run dev
```

The backend runs on port 3456 by default.

### 5. Test it

```bash
cd cli-lazyweb && bun run src/index.ts search "pricing page" --limit 3
```
</details>

## What your agent can do

| Command | What it does |
|---------|-------------|
| `lazyweb search "dark mode settings"` | Find screenshots matching a description |
| `lazyweb search "pricing" --category Finance` | Filter by app category |
| `lazyweb search "onboarding" --company linear` | Filter by company |
| `lazyweb compare ./my-design.png` | Find screenshots visually similar to your image |
| `lazyweb similar 12345` | Find screenshots similar to one you already found |
| `lazyweb search "pricing" --fields high_design_bar` | Include rich metadata |

## Output format

All skills produce a report with downloaded reference images:

```
.lazyweb/{skill}/{topic}-{date}/
├── report.md          ← Structured findings with inline images
└── references/        ← Downloaded screenshots (persisted locally)
    ├── stripe-pricing-page.png
    ├── linear-onboarding.png
    └── ...
```

Preview `report.md` in any markdown viewer to see the screenshots inline.

## License

MIT
