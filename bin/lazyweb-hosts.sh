#!/usr/bin/env bash
# Shared host table for `setup` and `lazyweb-router` (spec §6.4).
# One table, two consumers: a host added for skills is automatically a router
# candidate. Sourced, not executed. No side effects.
#
# Functions:
#   host_skills_root <host>        -> prints the host's skills dir (may not exist), or nothing
#   host_instruction_file <host>   -> prints the host's USER-LEVEL instruction file, or nothing
#   host_routable <host>           -> exit 0 if the host is a valid router target NOW
#   host_detected <host>           -> exit 0 if the host appears installed (config dir present)
#   host_act_preamble <host>       -> prints the {{ACT_PREAMBLE}} line for the rendered block
#
# Rule 0 (spec §5): a host is routable only if `setup` installs skill files for
# it (skills root resolves AND is populated) AND its capability flag is on.
# Antigravity (MCP-only) and Gemini CLI (not an installed host) are NOT routable.

_lw_codex_home() { printf '%s' "${CODEX_HOME:-$HOME/.codex}"; }
_lw_xdg_config() { printf '%s' "${XDG_CONFIG_HOME:-$HOME/.config}"; }

host_skills_root() {
  case "$1" in
    claude)   printf '%s' "$HOME/.claude/skills" ;;
    codex)    printf '%s' "$(_lw_codex_home)/skills" ;;
    cursor)   printf '%s' "$HOME/.cursor/skills" ;;
    opencode) printf '%s' "$(_lw_xdg_config)/opencode/skills" ;;
    kiro)     printf '%s' "$HOME/.kiro/skills" ;;
    factory)  printf '%s' "$HOME/.factory/skills" ;;
    slate)    printf '%s' "$HOME/.slate/skills" ;;
    hermes)   printf '%s' "$HOME/.hermes/skills" ;;
    *)        printf '' ;;  # antigravity / gemini: no skills installed
  esac
}

host_instruction_file() {
  case "$1" in
    claude)   printf '%s' "$HOME/.claude/CLAUDE.md" ;;
    codex)
      # Codex prefers AGENTS.override.md when it exists and is non-empty (spec §5/§10).
      local home; home="$(_lw_codex_home)"
      if [ -s "$home/AGENTS.override.md" ]; then
        printf '%s' "$home/AGENTS.override.md"
      else
        printf '%s' "$home/AGENTS.md"
      fi
      ;;
    opencode) printf '%s' "$(_lw_xdg_config)/opencode/AGENTS.md" ;;
    # cursor: no documented global file -> project fallback only (no user-level target)
    # kiro/factory/slate/hermes: capability flag OFF until verified (spec §13 Q4) -> none
    *)        printf '' ;;
  esac
}

# Per-host capability flag for user-level routing. ON only where the global
# instruction file is verified (spec §1 M3). Flip kiro/factory/slate/hermes on
# after empirical verification (§12 Step 6b).
host_capability_on() {
  case "$1" in
    claude|codex|opencode) return 0 ;;
    *) return 1 ;;
  esac
}

host_detected() {
  local h="$1" root
  root="$(host_skills_root "$h")"
  [ -n "$root" ] && [ -d "$root" ]
}

# Routable NOW = skills root exists AND is populated AND capability flag on AND
# a user-level instruction file is defined.
host_routable() {
  local h="$1" root file
  root="$(host_skills_root "$h")"
  file="$(host_instruction_file "$h")"
  [ -n "$root" ] || return 1
  [ -d "$root" ] || return 1
  # populated = at least one entry
  [ -n "$(ls -A "$root" 2>/dev/null)" ] || return 1
  host_capability_on "$h" || return 1
  [ -n "$file" ] || return 1
  return 0
}

# Tilde-form path for rendered text: stable byte count across usernames, and
# every host expands ~ in its own instruction files.
_lw_tilde() { case "$1" in "$HOME"/*) printf '~%s' "${1#"$HOME"}" ;; *) printf '%s' "$1" ;; esac; }

host_act_preamble() {
  case "$1" in
    claude)
      printf '%s' 'To act on a row, invoke that skill (e.g. /lazyweb-growth-report).'
      ;;
    codex|opencode)
      printf '%s' 'To act on a row, invoke the named skill.'
      ;;
    project)
      # Project-level block (spec §7.3): read by whichever host opens the repo,
      # so the phrasing must be host-neutral and name no single skills root.
      printf '%s' "To act on a row, invoke that skill by name if your client supports skills; otherwise read <skill>/SKILL.md under your client's installed Lazyweb skills directory (e.g. ~/.claude/skills, ~/.codex/skills, ~/.cursor/skills) and follow it."
      ;;
    *)
      printf 'To act on a row, read %s/<skill>/SKILL.md and follow it.' "$(_lw_tilde "$(host_skills_root "$1")")"
      ;;
  esac
}

# All hosts the table knows about (routable or not), for `status --all` scans.
host_all() { printf '%s\n' claude codex cursor opencode kiro factory slate hermes; }
