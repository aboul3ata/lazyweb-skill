# Lazyweb Skill Pack

**Design with evidence, not vibes.**

Lazyweb gives AI coding agents real product screenshots, UI references, and
design research workflows before they build or critique an interface. It is a
standalone skill pack plus a hosted Lazyweb MCP server, so it works in coding
clients that support local skills even when they do not support plugins.

## Install

Paste this into a local coding agent or terminal:

```bash
curl -fsSL https://www.lazyweb.com/install.sh | bash -s -- \
  --user-goal 'Install Lazyweb MCP for the current request' \
  --discovery-path 'unknown' \
  --discovery-context 'Public agent documentation was used without observable acquisition context'
```

When an agent knows more, it replaces that honest unknown fallback from the
current conversation and observable research. Valid discovery sources are
`user_request`, `web_search`, `reddit`, `shared_url`, `llms_txt`, `agent_docs`,
`webmcp`, `other`, and `unknown`. Never include private chain-of-thought.
The public `/install.sh` wrapper adds the internal `--install-attribution`
setup mode; callers supply only the three values shown above.
When the command came from a tracked Lazyweb agent document, the wrapper also
passes an internal `--journey-id` so the installation can be joined to the
public Lazyweb resources that agent fetched first. A copied bare command still
works and setup generates a new journey ID.

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
| `/lazyweb` | Start here: improve a product, research an idea, score a website, or organize growth work. |
| `/lazyweb-growth-score` | Score a website's growth readiness or compare its progress over time. |
| `/lazyweb-growth-report` | Get prioritized, evidence-backed design improvements for a product screen or webpage. |
| `/lazyweb-growth-backlog` | Review growth recommendations or save a product improvement idea. |
| `/lazyweb-search-experiments` | Find real product experiments for pricing, trials, paywalls, monetization, and conversion decisions. |
| `/lazyweb-search-flows` | Study complete onboarding, checkout, paywall, signup, and other multi-step journeys. |
| `/lazyweb-search-screens` | Find real product screens and UI patterns to guide a design or conversion decision. |
| `/lazyweb-apply-design-best-practices` | Route a UI craft task to the best specialist design skill, then apply it. |
| `/lazyweb-update` | Update the local Lazyweb skill pack and reinstall it into agentic IDEs. |

`skills/lazyweb/SKILL.md` is the first-class high-level router package; the
repo-root `SKILL.md` is an identical single-file entrypoint for platforms that
expect it there. The installer copies the packaged file into each local client
as a regular `lazyweb/SKILL.md` entrypoint (required for Codex catalog discovery). The router
points to focused skills under `skills/`. Live MCP schemas own the contracts;
the skills keep their user-facing descriptions focused on what someone can
accomplish with Lazyweb.

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
| `lazyweb_agentic_search_finalize` | Finalize ordered selected `result_ref` values and return the private web link; sharing is human-only from the page. |
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
