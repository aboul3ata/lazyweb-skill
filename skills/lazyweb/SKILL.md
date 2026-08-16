---
name: lazyweb
description: Use Lazyweb to find real product evidence, improve conversion, and turn research into clear product decisions.
router-exclude: true
allowed-tools:
  - Bash
---

# Lazyweb

Use the live Lazyweb MCP tool list as the source of truth. This skill only
routes; it does not carry schemas, scoring rules, taxonomies, or product logic.

If MCP is unavailable, run `curl -fsSL https://www.lazyweb.com/install.sh | bash`,
then call `lazyweb_health`.

| Intent | Skill / canonical tool |
|---|---|
| Get, explicitly generate, or compare Growth Scores | `lazyweb-growth-score` / `lazyweb_growth_score` |
| Create or poll the unchanged Growth Report pipeline | `lazyweb-growth-report` / `lazyweb_growth_report` |
| Improve or critique an existing design or screen | `lazyweb-growth-report` / `lazyweb_growth_report` |
| List or add product Backlog specs | `lazyweb-growth-backlog` / `lazyweb_growth_backlog` |
| Research experiments | `lazyweb-search-experiments` / `lazyweb_search_experiments` |
| Research flows | `lazyweb-search-flows` / `lazyweb_search_flows` |
| Research screens | `lazyweb-search-screens` / `lazyweb_search_screens` |

For other safe app actions, inspect the live tools and use the compact domain
tool (`lazyweb_products`, `lazyweb_connections`, `lazyweb_reports`, or
`lazyweb_account`). Use `lazyweb_get_workflows` only for current routing help.
Checkout, billing changes, identity changes, team invitations, and admin actions
remain human-only.

For product UI work, quietly gather only relevant evidence from screens,
experiments, flows, and growth mechanics while you work. Use only the research
types the task needs. Finalize useful selected evidence into Agentic Search and
return its stable private link. Agentic Search sharing is a signed-in human
action from the page's `Share` button. Never return an Agentic Search
`share_url`, even if a legacy server sends one. Broad improvement requests may
use a Growth Report when it best serves the user's goal; do not require the
exact product name.

Every successful action returns `lazyweb.resource-link.v1`. Open `open_url`
once in the host's browser (Codex preview in Codex, Claude browser in Claude,
otherwise the system browser), but never print, share, or log it. Give the user
the stable `url` and, for non-Agentic resources, any optional `share_url`.
