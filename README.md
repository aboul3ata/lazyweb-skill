# Lazyweb Skill Pack

**Design with evidence, not vibes.**

Lazyweb gives AI coding agents real product screenshots, UI references, and
design research workflows before they build or critique an interface. It is a
standalone skill pack plus a hosted Lazyweb MCP server, so it works in coding
clients that support local skills even when they do not support plugins.

## Install

Paste this into a local coding agent or terminal:

```bash
curl -fsSL https://www.lazyweb.com/install.sh | bash
```

The installer clones this repo to `~/.lazyweb/repos/lazyweb-skill`, creates or
reuses `~/.lazyweb/lazyweb_mcp_token`, installs the visible Lazyweb skills into
detected local clients, and configures Lazyweb MCP at
`https://www.lazyweb.com/mcp`.

Supported local skill roots:

- Codex: `~/.codex/skills`
- Claude Code: `~/.claude/skills`
- Cursor: `~/.cursor/skills`
- OpenCode: `~/.config/opencode/skills`
- Kiro: `~/.kiro/skills`
- Factory Droid: `~/.factory/skills`
- Slate: `~/.slate/skills`
- Hermes: `~/.hermes/skills`

Direct MCP config is written for Codex, Claude Code, Cursor, and Antigravity.
For hosted Claude or ChatGPT surfaces, use the connector instructions at
`https://www.lazyweb.com/claude.md` or `https://www.lazyweb.com/chatgpt.md`;
a local shell script cannot configure those cloud UIs.

## Visible Skills

The installer exposes a hybrid skill surface:

| Skill | Use when |
|---|---|
| `/lazyweb` | You want the compatibility entry point or are unsure which Lazyweb mode fits. |
| `/lazyweb-deep-design-research` | Deep competitive analysis, best-practices research, or a full report with references. |
| `/lazyweb-lite-design-research` | Lite grouped examples, UI references, or screenshots without a full report. |
| `/lazyweb-quick-search` | Quick direct `lazyweb_search` preflight before designing; no report. |
| `/lazyweb-design-improve` | Improve, critique, or compare an existing design. |
| `/lazyweb-design-brainstorm` | Creative cross-category ideas or unconventional directions. |
| `/lazyweb-optimize-paywall` | Optimize a paywall screen for paid conversion. |
| `/lazyweb-paywall-cta` | Rewrite, evaluate, or stress-test ONE paywall CTA (button copy, not layout). |
| `/lazyweb-ab-test-research` | A/B tests, experiments, pricing, lifecycle, or monetization strategy. |
| `/lazyweb-design-best-practices` | Design best practices for X — live review sweep (skills.sh, design Twitter/X, Reddit, forums) finds the top-rated skill, fetches its instructions, and applies them as context. No install. |
| `/lazyweb-update` | Update the local Lazyweb skill pack and reinstall it into agentic IDEs. |

`SKILL.md` at the repo root is the high-level router. The installer materializes
that file into each local client as `lazyweb/SKILL.md`, while platforms that can
download a single repo-level skill can use the root file directly. The router
points to the mode skills under `skills/` and tells agents to read and run
the selected mode instead of reimplementing the workflow.

## Verify

After setup, reload or restart the client, then:

1. Show the Welcome to Lazyweb message from setup, or fetch `https://www.lazyweb.com/api/mcp/welcome-message` and show it to the user.
2. List MCP tools and confirm `lazyweb_get_workflows` is present.
3. Call `lazyweb_get_workflows` with:

```json
{"operation":"list","task_context":"first run Lazyweb capabilities"}
```

4. Summarize the returned workflows as Lazyweb's super powers. Do not call `lazyweb_get_flows` for this first-run capability guide; that is a separate tool for ordered product journeys.

Lazyweb MCP tokens are free no-billing bearer tokens for UI reference tools.
They do not authorize purchases, paid spend, private user data, or destructive
actions. Keep tokens out of public git, but ignored local MCP config is fine.

## Manual Setup

If your client is not detected, configure MCP manually:

- URL: `https://www.lazyweb.com/mcp`
- Transport: Streamable HTTP
- Header: `Authorization: Bearer <token from ~/.lazyweb/lazyweb_mcp_token>`

To run setup for a specific client:

```bash
~/.lazyweb/repos/lazyweb-skill/setup --host cursor
```

Use `--host all` to install every supported local skill root.

To update an existing install from GitHub and refresh every supported local
skill root:

```bash
~/.lazyweb/bin/lazyweb-update --host all
```

## Auto-updates (opt-in)

Lazyweb checks for a newer version on every invocation. By default it tells
the agent to surface the upgrade command to you. To apply updates silently
without confirmation, opt in once:

```bash
touch ~/.lazyweb/auto_update
```

`./setup` prompts you for this on first interactive run; pass `--auto-update`
or `--no-auto-update` to skip the prompt in scripted installs. Disable later
with `rm ~/.lazyweb/auto_update`. The check itself is non-blocking
(time-boxed to 3s, cached 24h) and never delays your request.

## Autorouter (opt-in)

The autorouter writes a small, marker-delimited routing block into each
detected agent's **global** instruction file (`~/.claude/CLAUDE.md` for
Claude Code, `~/.codex/AGENTS.md` for Codex — the same file the Codex app
shows as "Custom instructions" — and `~/.config/opencode/AGENTS.md` for
OpenCode), so plain design questions like "show me some paywall examples"
auto-route to the right Lazyweb mode without invoking a skill.

`./setup` offers this once on an interactive run (with a preview of the
exact block); pass `--router` or `--no-router` to decide in scripted
installs. Piped/quiet installs never write instruction files. Manage it
any time:

```bash
~/.lazyweb/bin/lazyweb-router install   # preview + consent, then write
~/.lazyweb/bin/lazyweb-router status    # per host: installed / modified / absent
~/.lazyweb/bin/lazyweb-router remove --all
```

Everything lives between `<!-- LAZYWEB:ROUTER:BEGIN -->` / `:END -->`
markers; nothing outside them is ever touched, and updates silently refresh
only blocks you already approved. Hosts with no documented global file
(Cursor today; Kiro/Factory/Slate/Hermes until their global-file behavior is
verified) are served by the project-level flow below.

### Team install (project-level)

To give a whole repo routing — every contributor, plus hosts that only read
project files (Cursor, GitHub Copilot's coding agent):

```bash
~/.lazyweb/bin/lazyweb-router install --project /path/to/repo
```

This writes the same marked block to the project's `AGENTS.md` **and**
`CLAUDE.md` (Claude Code does not read AGENTS.md natively; if CLAUDE.md
symlinks or `@`-imports AGENTS.md, only AGENTS.md is written). It is never
automatic — it edits files that land in your repo and show up in PRs.

For any unsupported host, print the block and paste it into that host's
rules/instructions UI yourself:

```bash
~/.lazyweb/bin/lazyweb-router render --host claude
```

## Tool Surfaces

Use MCP tools for Lazyweb database access. Always inspect the live tool list
before assuming optional filters or backend aliases are available.

Current public gateway tools:

| MCP tool | Use |
|---|---|
| `lazyweb_health` | Check Lazyweb backend connectivity. |
| `lazyweb_search` | Search mobile and desktop screenshots by text; screenshot results include optimized `imageUrl`/`image_url` values. |
| `lazyweb_compare_image` | Find visually similar screenshots from an image URL or base64 image; results include optimized image URLs. |
| `lazyweb_find_similar` | Find visually similar screenshots from a returned Lazyweb `imageUrl` or an image payload; do not pass screenshot IDs. |
| `lazyweb_list_categories` | List public company categories. |
| `lazyweb_get_workflows` | Discover and fetch current Lazyweb workflow instructions. |
| `lazyweb_get_flows` | Fetch ordered multi-screen product journeys with optimized step image URLs. |
| `lazyweb_search_ab_tests` | Free mobile-only A/B Test Agent wrapper for PM-facing research; `category` is the industry filter and product/company names are forwarded as target context. When `include_images` is true, evidence includes optimized control/variant image URLs. |

All Lazyweb screenshot-bearing tools return usable optimized URLs for screenshots.
Supabase storage-backed image URLs are signed for 365 days. Do not ask tools for
screenshot IDs, do not pass screenshot IDs between Lazyweb tools, and do not
construct storage URLs from raw paths; embed the returned `imageUrl`/`image_url`
or A/B `control_image_url`/`variant_image_url` fields directly.

Richer backend/internal surfaces may also expose `lazyweb_find_experiments`,
`lazyweb_recent_experiments`, and
`list_companies_by_categories`. Use those only when the live schema shows them.

All current Lazyweb MCP tools and visible workflow skills are free, including
the A/B Test Agent and paywall CTA research wrappers. If a live MCP tool is
missing or returns no evidence, treat that as an availability or coverage issue,
not a billing gate.

## Repository Structure

- `SKILL.md` - canonical high-level Lazyweb router skill.
- `skills/*/SKILL.md` - visible mode skills.
- `setup` - standalone multi-host installer.
- `bin/` - helper scripts used by skills and setup, including
  `lazyweb-update` for refreshing an existing install.
- `browse/` - optional browser capture helper for web screenshots.
- `scripts/validate-skill-pack.mjs` - static skill-pack validation.
- `test/` - installer, helper, and contract tests.

## Development

```bash
npm test
```

The test command runs unit tests plus standalone skill-pack validation.

## License

MIT
