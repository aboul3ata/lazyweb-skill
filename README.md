# Lazyweb Skill

**Design with evidence, not vibes.**

AI agents design from training data averages — generic layouts, safe colors, patterns you've seen a thousand times. This skill gives your agent access to Lazyweb's database of real app screenshots from thousands of the best mobile apps ever built.

Your agent searches before it designs. It finds real examples, downloads them locally, and produces structured reports with inline images you can preview in any markdown viewer.

## Four skills included

**`/lazyweb-design-research`** — Deep design research. Identifies competitors, searches Lazyweb + web, downloads reference screenshots, and produces a structured report with: TL;DR, Examples, Findings, Patterns, Anti-Patterns, Unique Angles, and Recommendations. Use for competitive analysis and best practices research.

**`/lazyweb-quick-references`** — Find screenshots fast. Searches Lazyweb, downloads results, groups by pattern. Lighter than design-research — just find, group, show. Use when you need visual references, not a full report.

**`/lazyweb-design-improve`** — Improve an existing design. Captures a screenshot of your current app, finds similar screens from the best apps, and generates 1-5 concrete improvement ideas — each tied to a real reference. Adapted from Lazyweb's production design critique system.

**`/lazyweb-design-brainstorm`** — Cross-pollination brainstorm. Deliberately searches OUTSIDE your category to find novel patterns. If everyone in fintech copies each other, this skill looks at gaming, entertainment, and social apps for transferable ideas. The "zig when everyone zags" skill.

## Setup

### 1. Generate a free install prompt

Go to [lazyweb.com](https://lazyweb.com), press **Get Lazyweb MCP**, and copy the
one-line install prompt.

### 2. Paste it into your coding agent

Paste the prompt into Claude Code, Codex, Cursor, or another MCP-capable coding
agent. The prompt configures the hosted Lazyweb MCP server with your free token
and installs/updates this skill pack.

### 3. Manual MCP config, if needed

Server URL: `https://cli-lazybackend.onrender.com/mcp`
Header: `Authorization: Bearer <your-user-id-token>`
Skill URL: `https://github.com/aboul3ata/lazyweb-skill`

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

### 4. Verify

List MCP tools, run `lazyweb_health`, then run `lazyweb_search` with:

```json
{"query":"pricing page","limit":3}
```

## What your agent can do

| MCP tool | What it does |
|---------|-------------|
| `lazyweb_search` | Find screenshots matching a description |
| `lazyweb_search` with `category` | Filter by app category |
| `lazyweb_search` with `company` | Filter by company |
| `lazyweb_search` with `platform: "desktop"` | Search desktop/web screenshots only |
| `lazyweb_search` with `platform: "mobile"` | Search mobile app screenshots only |
| `lazyweb_compare_image` | Find screenshots visually similar to an image URL or base64 image |
| `lazyweb_find_similar` | Find screenshots similar to one you already found |

## Output format

All skills produce a report with downloaded reference images:

```
.lazyweb/{skill}/{topic}-{date}/
├── report.md          <- Structured findings with inline images
└── references/        <- Downloaded screenshots (persisted locally)
    ├── stripe-pricing-page.png
    ├── linear-onboarding.png
    └── ...
```

Preview `report.md` in any markdown viewer to see the screenshots inline.

## License

MIT
