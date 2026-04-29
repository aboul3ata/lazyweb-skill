---
name: lazyweb
description: |
  Top-level Lazyweb entrypoint for Codex. Use when the user mentions Lazyweb,
  wants design references, wants design research, wants to improve a screen, or
  wants to verify the hosted Lazyweb MCP tools are installed.
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
  - Grep
  - WebSearch
  - AskUserQuestion
  - Agent
---

# Lazyweb

Use Lazyweb's hosted MCP tools and bundled design skills to search real app and
web screenshots, produce visual references, and ground design work in examples.

## First Step

Verify Lazyweb MCP is available by listing MCP tools and running `lazyweb_health`.
If auth fails, tell the user to enable the global Lazyweb plugin or get the free
one-line install prompt at `https://lazyweb.com/#pricing`.

## Route The Request

- For quick examples or screenshots, use `/lazyweb-quick-references`.
- For deeper competitive or best-practice research, use `/lazyweb-design-research`.
- For feedback on an existing design, use `/lazyweb-design-improve`.
- For unconventional directions and cross-category inspiration, use `/lazyweb-design-brainstorm`.
- For external inspiration sources, use `/lazyweb-add-inspo-source` or `/lazyweb-remove-inspo-source`.

## MCP Tools

Use these tools for Lazyweb database access:

- `lazyweb_search`
- `lazyweb_compare_image`
- `lazyweb_find_similar`
- `lazyweb_list_categories`
- `lazyweb_list_collections`
- `lazyweb_health`

If the user gives a concrete query with `@lazyweb`, run the appropriate Lazyweb
search or route directly to the best skill. If the request is only `@lazyweb`
without a goal, ask what they want to find or improve.
