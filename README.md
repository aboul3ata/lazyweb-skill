# Lazyweb Plugin

**Design with evidence, not vibes.**

AI agents design from training data averages — generic layouts, safe colors, patterns you've seen a thousand times. This plugin gives your agent Lazyweb skills plus the hosted Lazyweb MCP server for real app and web screenshots.

Your agent searches before it designs. It finds real examples, downloads them locally, and produces structured reports with inline images you can preview in any markdown viewer.

## Skills included

**`/lazyweb-design-research`** — Deep design research. Identifies competitors, searches Lazyweb + web, downloads reference screenshots, and produces a structured report with: TL;DR, Examples, Findings, Patterns, Anti-Patterns, Unique Angles, and Recommendations. Use for competitive analysis and best practices research.

**`/lazyweb-quick-references`** — Find screenshots fast. Searches Lazyweb, downloads results, groups by pattern. Lighter than design-research — just find, group, show. Use when you need visual references, not a full report.

**`/lazyweb-design-improve`** — Improve an existing design. Captures a screenshot of your current app, finds similar screens from the best apps, and generates 1-5 concrete improvement ideas — each tied to a real reference. Adapted from Lazyweb's production design critique system.

**`/lazyweb-design-brainstorm`** — Cross-pollination brainstorm. Deliberately searches OUTSIDE your category to find novel patterns. If everyone in fintech copies each other, this skill looks at gaming, entertainment, and social apps for transferable ideas. The "zig when everyone zags" skill.

**`/lazyweb-add-inspo-source`** — Connect external inspiration libraries so Lazyweb design skills can include them in research.

**`/lazyweb-remove-inspo-source`** — Disconnect an external inspiration library.

## Setup

### Codex plugin

This repo is packaged as a Codex plugin with:

- Plugin source in `plugins/lazyweb/`
- Skills in `~/plugins/lazyweb/skills/`
- MCP config in `~/plugins/lazyweb/.mcp.json`
- Marketplace entry in `~/.agents/plugins/marketplace.json`

Set `LAZYWEB_MCP_TOKEN` or store the generated token at `~/.lazyweb/lazyweb_mcp_token`.
The plugin also checks the legacy `~/.codex/lazyweb_mcp_token` path for existing installs.
The plugin talks to `https://www.lazyweb.com/mcp` through `mcp-remote`.

### Claude Code plugin

This repo is also a Claude Code plugin marketplace. Add the marketplace, then install the plugin:

```bash
claude plugin marketplace add https://github.com/aboul3ata/lazyweb-skill
claude plugin install lazyweb@lazyweb
```

Claude Code skills are namespaced as `/lazyweb:<skill-name>`, for example
`/lazyweb:lazyweb-quick-references`.

### Generate a free token

Run the no-login token endpoint:

```bash
mkdir -p ~/.lazyweb
curl -sS -X POST https://www.lazyweb.com/api/mcp/install-token \
  -H "content-type: application/json" \
  -d '{}' | node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>require('fs').writeFileSync(process.env.HOME+'/.lazyweb/lazyweb_mcp_token', JSON.parse(s).token))"
```

Lazyweb is free. This bearer token only authorizes Lazyweb MCP reference tools;
it does not grant purchases, paid spend, private user data, or destructive
actions. It is okay in ignored local config, but do not commit it to public git.

### Verify

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

These public `lazyweb_*` tool names are compatibility aliases on `https://www.lazyweb.com/mcp`.
They map to the current canonical MCP tools such as `search_screenshots`,
`list_filters`, `vision_screenshots`, and `metadata_screenshots`.

Use MCP tools for all Lazyweb database access.

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
