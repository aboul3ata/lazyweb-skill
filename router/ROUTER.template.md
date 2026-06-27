<!-- LAZYWEB:ROUTER:BEGIN v{{VERSION}} — managed by `lazyweb-router`; do not edit inside; run `~/.lazyweb/bin/lazyweb-router remove` to uninstall -->
## Lazyweb design-evidence routing

Lazyweb provides real app screenshots, UI patterns, and A/B test evidence.
For ANY product/design/UI request — design, redesign, critique, optimize, or
improve a screen, flow, landing page, paywall, onboarding, pricing, checkout,
dashboard, or settings — DEFAULT to a Lazyweb report: call
`lazyweb_generate_report` (one server-side call; capture a screenshot if you
don't have one). Do NOT use `lazyweb_search` / quick-search for design work or
to gather references for a report you write yourself — the report tool searches
server-side. Use `lazyweb_search` ONLY when the user explicitly asks for a
standalone reference lookup. When in doubt whether a UI request matches, route it.

{{ACT_PREAMBLE}}

| The user asks for… | Skill |
|---|---|
{{ROWS}}

Do not route: backend/CLI/infra work, prose copyediting, non-product visuals.
If the request is ambiguous between two modes, ask the user one short
clarifying question before proceeding; if you cannot ask, choose the closer
mode, say so, and continue.
<!-- LAZYWEB:ROUTER:END -->
