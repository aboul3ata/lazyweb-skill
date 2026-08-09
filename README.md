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

When an agent client launches the installer, setup targets that active client
only. A plain terminal run without an active-client signal still detects local
clients; use `--host all` when you deliberately want every supported client.

Downloading or updating the skill pack, installing or configuring a client,
and creating or reusing a bearer token are available to everyone without
charge. Setup, health, and workflow discovery remain usable regardless
of plan; real data-bearing MCP tool availability and usage limits depend on the
account's persisted experiment assignment and plan.

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

The installer surfaces a **focused set of slash commands**. Every other mode stays
in the repo and is reachable through the `/lazyweb` router and the Lazyweb MCP
(`lazyweb_get_workflows`), but is intentionally **not** installed as its own slash
command:

| Skill | Use when |
|---|---|
| `/lazyweb` | Generic router and safe capability discovery. |
| `/lazyweb-growth-score` | Get, explicitly generate, or compare website Growth Scores. |
| `/lazyweb-growth-report` | Generate, poll, or iterate the unchanged report pipeline; renamed from `/lazyweb-design`. |
| `/lazyweb-growth-backlog` | List product Backlog items or add an idempotent growth spec. |
| `/lazyweb-search-experiments` | Research growth and monetization experiments and accumulate selected evidence. |
| `/lazyweb-search-flows` | Research ordered product journeys and accumulate selected evidence. |
| `/lazyweb-search-screens` | Research UI screens and accumulate selected evidence. |
| `/lazyweb-update` | Update the local Lazyweb skill pack and reinstall it into agentic IDEs. |

`skills/lazyweb/SKILL.md` is the first-class high-level router package; the
repo-root `SKILL.md` is an identical single-file entrypoint for platforms that
expect it there. The installer copies the packaged file into each local client
as a regular `lazyweb/SKILL.md` entrypoint (required for Codex catalog discovery). The router
points to thin mode skills under `skills/`. Live MCP schemas own the contracts;
the skills contain only routing and link-handling guidance.

## Verify

After setup, reload or restart the client, then:

1. Show the Welcome to Lazyweb message from setup, or fetch `https://www.lazyweb.com/api/mcp/welcome-message` and show it to the user.
2. List MCP tools and confirm `lazyweb_get_workflows` is present.
3. Call `lazyweb_get_workflows` with:

```json
{"operation":"list","task_context":"first run Lazyweb capabilities"}
```

4. Summarize the returned workflows as Lazyweb's super powers. Do not call `lazyweb_get_flows` for this first-run capability guide; that is a separate tool for ordered product journeys.

A Lazyweb MCP token is a bearer setup credential, not proof of paid access.
Creating or reusing one does not charge the user, but data-bearing tools still
follow the account's persisted experiment assignment and plan. Tokens do not
authorize purchases, paid spend, private user data, or destructive actions.
Keep tokens out of public git, but ignored local MCP config is fine.
The hosted MCP enforces abuse controls, including per-token transport quotas;
clients that ignore backoff may receive `429 mcp_rate_limited`.

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
| `lazyweb_growth_score` | Get, explicitly generate, or compare immutable Growth Scores in batches. |
| `lazyweb_growth_report` | Naming façade over the unchanged report generator and poller. |
| `lazyweb_growth_backlog` | List or add owner/product-scoped Backlog specs. |
| `lazyweb_search_screens` | Search screens and automatically record stable result references in Agentic Search. |
| `lazyweb_search_flows` | Search ordered flows and accumulate them into the same Agentic Search. |
| `lazyweb_search_experiments` | Search growth experiments and accumulate them into the same Agentic Search. |
| `lazyweb_agentic_search_finalize` | Finalize ordered selected `result_ref` values and return private/public web links. |
| `lazyweb_products` | Safe product CRUD; deletion requires an exact matching confirmation. |
| `lazyweb_connections` | Read connection status or open canonical setup. |
| `lazyweb_reports` | List/open reports or save owner-authorized feedback. |
| `lazyweb_account` | Read-only account and plan status. |
| `lazyweb_compare_image` | Find visually similar screenshots from an image URL or base64 image; results include optimized image URLs. |
| `lazyweb_find_similar` | Find visually similar screenshots from a returned Lazyweb `imageUrl` or an image payload; do not pass screenshot IDs. |
| `lazyweb_list_categories` | List public company categories. |
| `lazyweb_get_workflows` | Discover and fetch current Lazyweb workflow instructions. |

Legacy names such as `lazyweb_search`, `lazyweb_get_flows`,
`lazyweb_search_ab_tests`, `lazyweb_generate_report`, and `lazyweb_get_report`
remain compatibility aliases during their deprecation window.

All Lazyweb screenshot-bearing tools return usable optimized URLs for screenshots.
Supabase storage-backed image URLs are signed for 365 days. Do not ask tools for
screenshot IDs, do not pass screenshot IDs between Lazyweb tools, and do not
construct storage URLs from raw paths; embed the returned `imageUrl`/`image_url`
or A/B `control_image_url`/`variant_image_url` fields directly.

Richer backend/internal surfaces may also expose `lazyweb_find_experiments`,
`lazyweb_recent_experiments`, and
`list_companies_by_categories`. Use those only when the live schema shows them.

Installing the workflow skills and configuring MCP do not determine tool
entitlement. Inspect the live tool list and honor the server response: real
data-bearing MCP tool availability and usage limits depend on the account's
persisted experiment assignment and plan. A missing tool can reflect plan,
experiment, rollout, or availability; an empty authorized result is a coverage
outcome.

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
