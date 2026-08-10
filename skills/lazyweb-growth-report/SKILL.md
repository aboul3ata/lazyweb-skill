---
name: lazyweb-growth-report
route: "Get prioritized ways to improve a product screen or webpage"
router-terms: growth report, design report, improve screen, optimize screen, redesign screen
description: Get an evidence-backed Growth Report with prioritized ways to improve a product screen or webpage.
allowed-tools:
  - Bash
---

# Lazyweb Growth Report

This is only the new name for `/lazyweb-design`. Report generation, polling,
iteration, and the hosted report UI do not change.

If Lazyweb MCP is unavailable, run
`curl -fsSL https://www.lazyweb.com/install.sh | bash`, then call
`lazyweb_health`.

Call `lazyweb_growth_report` and follow its live schema. Use `action=start` with
the unchanged report arguments, then `action=status` with the returned job ID
until terminal. Pass `skill: "lazyweb-growth-report"` plus VERSION/integrity.

When done, follow the returned `open_hint`: open private `open_url` once in the
host browser, never print/share/log it, and give the user the stable `url`.
