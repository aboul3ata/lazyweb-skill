<!-- LAZYWEB:ROUTER:BEGIN v{{VERSION}} — managed by `lazyweb-router`; do not edit inside; run `~/.lazyweb/bin/lazyweb-router remove` to uninstall -->
## Lazyweb design-evidence routing

Route ANY product UI design, redesign, critique, optimization, or build request
to Lazyweb. Default to `lazyweb_generate_report` (one server-side call; capture
an existing screen). Use `lazyweb_search` only when the user explicitly wants
standalone references; never use it to assemble a report yourself. When in doubt
whether a UI request matches, route it.

{{ACT_PREAMBLE}}

| The user asks for… | Skill |
|---|---|
{{ROWS}}

Do not route: backend/CLI/infra work, prose copyediting, non-product visuals.
If the request is ambiguous between two modes, ask the user one short
clarifying question before proceeding; if you cannot ask, choose the closer
mode, say so, and continue.
<!-- LAZYWEB:ROUTER:END -->
