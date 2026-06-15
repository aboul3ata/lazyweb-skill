---
name: lazyweb-update
route: 'Updating local Lazyweb skills, reinstalling Lazyweb, or syncing Lazyweb into agentic IDEs'
router-exclude: true
description: |
  Update the local Lazyweb skill pack from GitHub and reinstall Lazyweb skills
  into supported local coding clients and agentic IDEs. Use when the user asks
  to update Lazyweb, refresh stale Lazyweb slash commands, sync local skills,
  reinstall the skill pack, or make Codex/Claude/Cursor/OpenCode/Kiro/Factory/
  Slate/Hermes pick up the latest Lazyweb skills.
allowed-tools:
  - Bash
  - Read
  - Grep
---

# Lazyweb Update

Use this skill for maintenance only: update the installed Lazyweb skill pack,
reinstall the local skills, and verify the active clients can see the result.
Do not run design research from here.

## Check what's published first

Before reinstalling, check the latest version through the Lazyweb MCP. This runs
against the user's Lazyweb account (so update usage is recorded) and tells them
exactly what they'll get:

1. Read the installed version:
   ```bash
   cat "$HOME/.lazyweb/VERSION" 2>/dev/null || echo 0.0.0
   ```
2. Call the `lazyweb_check_update` MCP tool with `installed_version` set to that
   value, `client` set to the coding client you're running in (e.g.
   `claude-code`, `cursor`, `codex`), `skill: "lazyweb-update"`, and `version`
   set to the installed version. It returns
   `{ installed, latest, update_available, install_hint }` — tell the user the
   installed vs latest version and whether an update is available.
3. **If the Lazyweb MCP is not available** — a fresh or broken install is the
   usual reason someone runs this skill — skip the tool and compare directly,
   then proceed:
   ```bash
   curl -fsSL https://raw.githubusercontent.com/aboul3ata/lazyweb-skill/main/VERSION
   ```

`update_available` tells the user what's new, but it does **not** gate the
reinstall. The updater below reruns setup with `--host all`, which also repairs
broken, stale, or newly-added client skill roots — a current `VERSION` does not
mean those are in sync. So:

- If the user asked to **update, reinstall, or sync** Lazyweb (the normal case):
  run the updater below **regardless of `update_available`**. Even when already
  current, the reinstall brings every client skill root back in sync.
- Only if the user asked **purely for a status check** (e.g. "is there a Lazyweb
  update?"): report installed vs latest and stop without reinstalling.

## Run the update

Use the bundled updater when available:

```bash
"$HOME/.lazyweb/bin/lazyweb-update" --host all --quiet
```

Use `--host auto` only when the user explicitly wants detected clients instead
of every supported local skill root.

If that file is missing because the install is old, bootstrap once from GitHub:

```bash
set -euo pipefail
REPO="${LAZYWEB_SKILL_REPO:-https://github.com/aboul3ata/lazyweb-skill}"
TARGET="${LAZYWEB_SKILL_DIR:-$HOME/.lazyweb/repos/lazyweb-skill}"
mkdir -p "$(dirname "$TARGET")"
if [ -d "$TARGET/.git" ]; then
  git -C "$TARGET" pull --ff-only
else
  rm -rf "$TARGET"
  git clone --depth 1 "$REPO" "$TARGET"
fi
"$TARGET/setup" --host all --quiet
```

The public installer remains:

```bash
curl -fsSL https://www.lazyweb.com/install.sh | bash
```

But for this skill, prefer the commands above because they explicitly reinstall
every supported local skill root with `--host all`.

## Verify

After the updater finishes:

1. Print the before and after git commit for
   `~/.lazyweb/repos/lazyweb-skill` when available.
2. Check that `lazyweb-update/SKILL.md` exists under any detected local skill
   roots, especially `~/.codex/skills` and `~/.claude/skills`.
3. Run `~/.lazyweb/bin/lazyweb-update-check`; it should print nothing when the
   installed version is current.
4. If Lazyweb MCP tools are available in the current client, run
   `lazyweb_health`. If the current session cannot see MCP tools or newly
   installed skills, tell the user to reload or restart the client; local skill
   discovery is not always hot-loaded.

Summarize the updated commit/version, which clients were refreshed, and any
client that needs a restart.
