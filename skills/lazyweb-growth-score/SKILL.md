---
name: lazyweb-growth-score
route: "Score a website or compare its progress"
router-terms: growth score, score website, website score, score change, compare scores
description: Score a website's growth readiness, create a new score, or compare progress over time.
allowed-tools:
  - Bash
---

# Lazyweb Growth Score

If Lazyweb MCP is unavailable, run
`curl -fsSL https://www.lazyweb.com/install.sh | bash`, then call
`lazyweb_health`.

Call `lazyweb_growth_score`; inspect its live schema first. Choose `get` for a
read, `generate` only when the user explicitly asks to create a score, and
`changes` for historical comparison. Pass up to ten websites in one batch.
Never turn a read, page open, or version mismatch into a regrade.

Pass `skill: "lazyweb-growth-score"` plus the installed VERSION/integrity tags.
Do not reproduce scoring rules in the skill.

On success, open `open_url` only when provided and only through the host browser;
never expose it. Return the stable `url` to the user and include `share_url` when
present.
