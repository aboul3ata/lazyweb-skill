---
name: lazyweb
description: |
  Lazyweb entry point — one command for every Lazyweb design tool. Routes the user to
  the right skill: deep design research, quick screenshot references, improving an
  existing design, cross-category brainstorming, or connecting/disconnecting external
  inspiration libraries. Use when the user types /lazyweb, says "lazyweb", asks what
  Lazyweb can do, or makes a design-evidence request and the specific sub-skill is
  unclear. Design with evidence, not vibes.
  Trigger on: "lazyweb", "use lazyweb", "what can lazyweb do", "ask lazyweb", and any
  design research / reference / inspiration request where the right sub-skill is unclear.
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

The single entry point for Lazyweb's design tools. This skill orients the user and
hands off to the right sub-skill. It does not do research itself — it routes.

## Preamble (run first)

Run this once at the start. It is safe and fast: the update check is time-boxed to a few
seconds, cached for 24h, and never blocks or errors out.

Resolve the plugin root, then run the update check. The plugin's `bin/` is normally on
`$PATH` when installed; if it is not, fall back to this skill's base directory (the
harness shows it to you as "Base directory for this skill"). This skill lives at
`<plugin-root>/skills/lazyweb`, so the plugin root is two directories up.

```bash
export LAZYWEB_ROUTER=1   # sub-skills check this to skip their own router-level setup
if command -v lazyweb-update-check >/dev/null 2>&1; then
  lazyweb-update-check 2>/dev/null || true
else
  # Fallback: replace <SKILL_BASE_DIR> with this skill's actual base directory.
  LAZYWEB_PLUGIN_ROOT="$(cd "<SKILL_BASE_DIR>/../.." 2>/dev/null && pwd)"
  export LAZYWEB_SKILL_ROOT="$LAZYWEB_PLUGIN_ROOT"
  [ -x "$LAZYWEB_PLUGIN_ROOT/bin/lazyweb-update-check" ] && \
    "$LAZYWEB_PLUGIN_ROOT/bin/lazyweb-update-check" 2>/dev/null || true
fi

# Telemetry: flush queued events in the background (a no-op unless the user opted in),
# then report the current consent state so we know whether to ask below. Never blocks.
if command -v lazyweb-telemetry-flush >/dev/null 2>&1; then
  ( lazyweb-telemetry-flush >/dev/null 2>&1 & ) 2>/dev/null || true
elif [ -n "${LAZYWEB_PLUGIN_ROOT:-}" ] && [ -x "$LAZYWEB_PLUGIN_ROOT/bin/lazyweb-telemetry-flush" ]; then
  ( "$LAZYWEB_PLUGIN_ROOT/bin/lazyweb-telemetry-flush" >/dev/null 2>&1 & ) 2>/dev/null || true
fi
[ -f "$HOME/.lazyweb/telemetry-consent" ] && echo "TELEMETRY: $(cat "$HOME/.lazyweb/telemetry-consent" 2>/dev/null)" || echo "TELEMETRY: unset"
```

If the output shows `UPGRADE_AVAILABLE <old> <new>`, tell the user once:

> A newer Lazyweb plugin is available (`<old>` → `<new>`). Update with
> `claude plugin update lazyweb@lazyweb` (Claude Code) or re-run the install command,
> then restart your agent.

Then continue routing regardless. Never block on the update.

### Telemetry opt-in (ask at most once)

Lazyweb logs your queries and outcomes locally to `~/.lazyweb/analytics/` so you (and we)
can see what it gets used for. That data stays on your machine. Uploading is separate and
strictly opt-in.

If the preamble printed `TELEMETRY: unset`, ask ONCE with AskUserQuestion:

> Lazyweb improves by learning what people actually search for. Your queries are already
> logged locally either way — this only decides whether to also share them. Share
> anonymized usage (your queries and outcomes, with tokens and file contents stripped)
> to help improve Lazyweb?
>
> A) Share anonymized usage (recommended) — helps prioritize what to build
> B) Keep it local only

- If A: ``printf 'community' > "$HOME/.lazyweb/telemetry-consent"``
- If B: ``printf 'off' > "$HOME/.lazyweb/telemetry-consent"``

If the preamble printed `TELEMETRY: community` or `TELEMETRY: off`, do NOT ask again.

## Routing

Pick the one sub-skill that matches the user's request and hand off to it.

| The user wants… | Route to |
|---|---|
| Deep competitive analysis / best-practices research, a full report with references | `lazyweb-design-research` |
| Just a few screenshots / references, fast — no full report | `lazyweb-quick-references` |
| Improvement ideas for a design they already have | `lazyweb-design-improve` |
| Creative, cross-category ideas ("zig when everyone zags") | `lazyweb-design-brainstorm` |
| A real multi-screen flow (onboarding, checkout, paywall) step by step | `lazyweb-flows` |
| Connect an external inspiration library (Mobbin, Savee, Dribbble…) | `lazyweb-add-inspo-source` |
| Disconnect an inspiration library | `lazyweb-remove-inspo-source` |

### How to hand off

1. **Clear match (one skill):** Read the sibling skill file and follow it from the top.
   The sub-skills are siblings of this one under `skills/`, so the path is this skill's
   base directory with the final `lazyweb` segment replaced by the target skill name
   (e.g. `…/skills/lazyweb-design-research/SKILL.md`). Read that file and execute it
   inline. It sees `LAZYWEB_ROUTER=1` and skips any duplicated router-level setup.
   Resolve any bundled resources (the browse tool, helper scripts) relative to the
   plugin root, never the current working directory.

2. **Ambiguous (could be two or more):** ask with AskUserQuestion. Offer the candidate
   skills as options, each with a one-line "best when…", plus a recommendation. Route to
   the chosen one. Do not guess when the cost of guessing wrong is a wasted full report.

3. **Bare `/lazyweb` with no task:** briefly say what Lazyweb does (the table above, in
   plain language: research, quick references, improve a design, brainstorm, manage
   inspiration sources) and ask what they want to work on.

Do not re-implement a sub-skill here. Always hand off to the real skill file so there is
one source of truth.

## Notes

- Every sub-skill stays directly invocable (e.g. `/lazyweb:lazyweb-design-research`).
- All skills are backed by the hosted Lazyweb MCP tools (`lazyweb_search`,
  `lazyweb_find_similar`, `lazyweb_compare_image`, `lazyweb_health`). If MCP is not
  installed, the skills degrade to web research and tell the user how to install it.
