# `_shared/` — canonical shared skill includes

This directory is **not a skill**. It has no `SKILL.md`, so skill loaders ignore
it. It holds content that is identical across multiple Lazyweb skills, extracted
to a single source of truth so a change is made once instead of in every skill.

The installer (`setup`) copies every directory under `skills/` into the client
skills-root, so `_shared/` ships alongside the skills and each skill resolves it
via a relative path from its own directory (`../_shared/<file>.md`).

## Files

- **`operating-principles.md`** — the report operating principles plus the
  reusable evidence/report components (`.deck` carousel, `.legend` + `.rec`
  cards, `.ebadge`/`.corpus` honesty labels, `.flip` control/variant, `.mock`
  mock-frame). Referenced by every report-producing skill except
  `lazyweb-design-research` (which uses the sanctioned report-v3 substitution —
  see `CLAUDE.md`).
- **`browse-setup.md`** — the browse / web-capture setup run before any web
  capture. Referenced by the skills that capture from the live web.

## Editing

Edit the file here once; every referencing skill inherits it. **Do not** copy a
shared block back inline into a skill — that reintroduces the drift this
directory exists to prevent. When a skill needs a genuinely different variant,
keep that variant inline in the skill and note why.
