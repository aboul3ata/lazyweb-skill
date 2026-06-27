---
name: lazyweb
description: |
  Lazyweb is the design-evidence skill for AI coding agents. Use it before
  designing, critiquing, or changing product UI when the agent needs real app
  screenshots, competitor references, best practices, quick examples, creative
  cross-category ideas, paywall optimization guidance, or mobile growth and
  monetization A/B test context. It can also route explicit requests to update
  the local Lazyweb skill pack.
  It routes to the right Lazyweb mode and tells the agent to use Lazyweb MCP
  tools instead of guessing from generic training data.
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

Design with evidence, not vibes. Use Lazyweb when the user asks for product UI
inspiration, competitive design analysis, best-practice research, quick screen
examples, feedback on an existing interface, creative design ideas, or
paywall optimization, monetization, and A/B test research.

This high-level skill routes to the right Lazyweb mode. Do not reimplement the
mode here. Hand off by **invoking the mode's installed skill by name**, using
its **dedicated MCP tool**, or **fetching its workflow over MCP** — see Routing
below. Never point the agent at a `skills/<name>/SKILL.md` file path: that
layout exists only in the source repo, not in the installed skill, so the path
does not resolve.

## First Run

If Lazyweb MCP has not been configured in this client, run the standalone setup:

```bash
curl -fsSL https://www.lazyweb.com/install.sh | bash
```

The installer creates or reuses `~/.lazyweb/lazyweb_mcp_token`, installs the
visible Lazyweb skills into supported local coding clients, and configures the
Lazyweb MCP server at `https://www.lazyweb.com/mcp`.

Lazyweb MCP tokens are free no-billing bearer tokens for UI reference tools.
They do not authorize purchases, paid spend, private user data, or destructive
actions. Keep tokens out of public git, but ignored local MCP config is fine.

After setup, show the user what Lazyweb can do:

1. Fetch `https://www.lazyweb.com/api/mcp/welcome-message` and show the welcome message.
2. List MCP tools and confirm `lazyweb_get_workflows` is present.
3. Call `lazyweb_get_workflows` with `{"operation":"list","task_context":"first run Lazyweb capabilities","skill":"lazyweb"}`.
4. Summarize the returned workflows as Lazyweb's super powers.

Do not call `lazyweb_get_flows` for the first-run capability guide. That is a
separate tool for ordered product journeys.

If MCP tools are unavailable, tell the user to run the installer above, then
continue with web research only if they want a degraded fallback.

## Routing

Choose exactly one mode:

| User intent | How to run |
|---|---|
| Optimize (conversion), improve (design quality), or design from scratch ANY product screen — paywall, pricing, landing, signup, onboarding, dashboard, settings, etc. (routes on objective) | **Invoke the `lazyweb-design` skill** |
| Quick grouped examples, UI references, or screenshots without a full report | **Invoke the `lazyweb-quick-search` skill** |
| Quick direct `lazyweb_search` preflight before designing, no report | **Invoke the `lazyweb-quick-search` skill** |
| Update local Lazyweb skills, reinstall Lazyweb, or sync Lazyweb into agentic IDEs | **Invoke the `lazyweb-update` skill** |
| A/B tests, experiment examples, pricing, trials, lifecycle, or monetization strategy | Use the `lazyweb_search_ab_tests` MCP tool (mobile A/B evidence) |

**How to run, explained.** Only `lazyweb-design`, `lazyweb-quick-search`, and
`lazyweb-update` are installed as local skills — invoke them **by name**, which
resolves regardless of how the host lays out skill directories. A/B-test
evidence is reached through the `lazyweb_search_ab_tests` MCP tool above. The
`create` objective inside `lazyweb-design` fetches the `lazyweb-design-create`
backend over MCP. Never substitute a `skills/<name>/SKILL.md` file read for any
of these — that path does not exist in the install.

**Retired skills — route their intent to one of the two skills above.** These
earlier Lazyweb skills no longer exist. Do NOT try to invoke or fetch the old
name; route the *intent* instead:

| Retired skill / intent | Use now |
|---|---|
| `lazyweb-optimize-paywall`, `lazyweb-design-improve`, `lazyweb-optimize-sign-up` — optimize or improve an existing screen | `lazyweb-design` (objective `optimize` / `improve`) |
| `lazyweb-design-research`, `lazyweb-deep-design-research`, `lazyweb-design-brainstorm`, `lazyweb-design-best-practices` — research, competitive analysis, best practices, "what do top apps do", creative ideas | `lazyweb-quick-search` for references; `lazyweb-design` (objective `create`) for a full new-screen design |
| `lazyweb-quick-references`, `lazyweb-lite-design-research` — quick examples / UI references | `lazyweb-quick-search` |
| `lazyweb-paywall-cta` — CTA copy | `lazyweb-design` (the CTA is part of the screen) |
| `lazyweb-ab-test-research` — A/B / experiment evidence | the `lazyweb_search_ab_tests` MCP tool |

Calling `lazyweb_search` directly under one of these retired skill tags is no
longer supported — the server rejects it and points back here. `lazyweb_search`
is reached only INSIDE `lazyweb-quick-search` (references) and the server-side
`lazyweb-design` pipeline (which searches internally); it is not a direct
external tool for any retired skill.

For a bare `/lazyweb` request, briefly explain the modes above and ask which
one the user wants. Recommend `lazyweb-design` when they want to optimize,
improve, or design a product screen, and `lazyweb-quick-search` when they need
direct MCP search context or quick references before designing and do not want a
report. Paywall CTA copy is part of the screen, so it also goes to
`lazyweb-design`. `lazyweb-design` is the
user-facing umbrella for ANY product screen and routes on `objective`. Pick by
the user's INTENT, not by whether they have a screenshot: route an EXISTING
screen they want to optimize/improve to `lazyweb-design` (objectives `optimize`
and `improve`), and route designing a NEW screen FROM SCRATCH to `lazyweb-design`
too (objective `create`, which hands off internally to the `lazyweb-design-create`
backend — never route users straight to `lazyweb-design-create`). Route explicit
install, update, refresh, or stale slash-command requests to `lazyweb-update`.

## Mode Handoff

When a mode is clear:

1. Reach the mode by the mechanism in the table above — **invoke the installed
   skill by name** (`lazyweb-design`, `lazyweb-quick-search`, `lazyweb-update`),
   use the mode's **dedicated MCP tool**, or **fetch its workflow** with
   `lazyweb_get_workflows`. Do NOT read a `skills/<name>/SKILL.md` file path —
   that layout exists only in the source repo, not in the install.
2. Follow that mode from the top.
3. Use Lazyweb MCP tools for database-backed evidence.
4. Embed Lazyweb database images directly with returned `imageUrl`/`image_url` values, and save only current-state or web-captured screenshots locally when the selected mode requires them.
5. Cite whether each reference came from Lazyweb or the web.

The installed mode skills (`lazyweb-design`, `lazyweb-quick-search`,
`lazyweb-update`) may also be called directly by the user from the slash menu.
This `/lazyweb` skill remains the entry point for hosts that show only one
downloaded skill or where the user is not sure which mode to use — there, reach
the unsurfaced modes via their MCP tool or `lazyweb_get_workflows`, never a
local file path.

## Autorouter Check (one-time, after the request is served)

Lazyweb has an autorouter: a small, marker-delimited routing block written
into each host agent's global instruction file so design questions route to
the right Lazyweb mode without anyone invoking a skill. This skill carries a
local fallback offer for installs that never saw the setup prompt.

AFTER completing the user's actual request — never before, and never
interrupting unrelated work — run this check at most once per session, and
only when this skill was explicitly invoked:

1. Skip silently unless BOTH are true:
   - `~/.lazyweb/router.manifest.json` is missing or empty
   - `grep -q "^router_declined=1" ~/.lazyweb/config` finds nothing
2. Ask the user one plain question (no host-specific tool): "Want me to
   install Lazyweb's autorouter so design questions route to the right mode
   automatically? I'd run `~/.lazyweb/bin/lazyweb-router install`, which adds
   a marked routing section to your agents' global instruction files."
3. On yes: run `~/.lazyweb/bin/lazyweb-router install --all --yes` and show
   the user what was written where. On no: run
   `~/.lazyweb/bin/lazyweb-router decline`. Either way, never ask again —
   the manifest or the decline flag silences this check and the
   once-per-session server-side offer alike.

## Search Discipline

These rules apply to every `lazyweb_search` call in every mode:

- **Always run at least one real search for the user's actual screen.** Example
  or connectivity queries (like "pricing page") teach the user nothing about
  their own project — follow them immediately with the screen they are building.
- **One screen, one search.** When the user is building a whole app or page,
  run one query per screen/section (onboarding, home, paywall, settings,
  checkout…) instead of a single broad query. Pass `platform` ("mobile" or
  "desktop") and `company: "<app>"` when the user names a reference product.
- **Never repeat an identical query** — results are deterministic. To see more,
  pass `offset` (e.g. `{"query":"onboarding quiz","limit":20,"offset":20}`);
  the response's `pagination.next_offset` gives the next page.
- **Read `coverage` and `warnings` on every response and obey them.** On
  `no_matches` or `low_coverage`, use the closest result anyway, strip the
  query to its core 2-6 word UI pattern, or tell the user the pattern is not
  in the library — do not rephrase the same concept in a loop. Style
  adjectives ("dark", "minimal", "editorial") are not searchable facets yet;
  drop them from the query and judge style from the returned images.
- **On a `company_not_in_library` warning**, pick one of the suggested closest
  companies or drop the company filter — do not retry other spellings of the
  same brand.

## Tool Rules

**Pass `skill: "lazyweb"` on every call.** Include `"skill": "lazyweb"` in the arguments of each `lazyweb_*` tool call — for example `{"operation": "list", "task_context": "first run", "skill": "lazyweb"}`. This is optional analytics metadata Lazyweb uses to understand which skills are used; never drop or change a real argument for it.

- Always inspect the live MCP tool list before assuming optional filters or
  backend/internal aliases are available.
- The current public gateway normally exposes `lazyweb_health`,
  `lazyweb_search`, `lazyweb_find_similar`, `lazyweb_compare_image`,
  `lazyweb_list_categories`, `lazyweb_get_workflows`, `lazyweb_get_flows`,
  `lazyweb_search_ab_tests`, and `lazyweb_paywall_cta_research`. The
  full-pipeline run tools
  `paywall_design_run` / `paywall_design_check_status` (and the parallel
  `signup_design_run` / `signup_design_check_status`) are gated behind
  env flags and may also be exposed — check the live tool list.
- All current public Lazyweb MCP tools and visible workflow skills are free,
  including `lazyweb_search_ab_tests`, `lazyweb_paywall_cta_research`,
  `paywall_design_run`, and `signup_design_run` when those run tools are
  exposed by the live schema. If a tool is missing or returns no matching
  evidence, treat that as an availability or coverage issue, not a billing gate.
- Richer internal/backend surfaces may expose `lazyweb_find_experiments`,
  `lazyweb_recent_experiments`, or
  `list_companies_by_categories`; use them only when the live tool schema shows
  them.
- Pass `high_design_bar: true` only to tools whose live schema exposes it, and
  only when the user asks for premium, stronger, high-design-bar, or
  best-designed examples.
- Screenshot-bearing tools return optimized image URLs. Supabase storage-backed URLs
  are signed for 365 days. Do not request or pass screenshot IDs, and do not
  construct storage URLs from raw paths.
- `lazyweb_search_ab_tests` is mobile-only A/B test evidence. It uses
  `category` as the industry filter and forwards `product`/`company` as target
  context. Do not use them to force an exact company match or trust a
  zero-result answer caused by an exact product/company filter.
- `lazyweb_find_similar` accepts `image_url` or `image_base64` plus `mime_type`;
  it does not take a screenshot ID.
- `lazyweb_compare_image` does real image-similarity. Always send
  `image_base64` — localhost, file paths, and web-page URLs are unreachable
  from the server. When you only have a page URL or a running local app,
  capture it yourself with your client's built-in screenshot/browser tool
  (browser screenshot, Playwright, device screenshot) and pass the capture as
  `image_base64`. Failed calls return a `how_to_fix` field — follow it instead
  of retrying the same input.
