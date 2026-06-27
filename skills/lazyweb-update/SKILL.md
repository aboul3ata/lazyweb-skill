---
name: lazyweb-update
route: 'Updating local Lazyweb skills, reinstalling Lazyweb, or syncing Lazyweb into agentic IDEs'
router-terms: update lazyweb, lazyweb update, reinstall lazyweb, refresh lazyweb, sync lazyweb, stale slash, stale command, slash command, local skills, agentic ide
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

`~/.lazyweb/bin/lazyweb-update` is a trusted local binary the user already
installed — it only refreshes the local checkout and reinstalls local skills. Do
not stack up multiple permission gates around it: a single lightweight "Updating
your local Lazyweb skills now." confirmation is enough (any client tool-approval
prompt already covers the rest).

Use the bundled updater when available:

```bash
"$HOME/.lazyweb/bin/lazyweb-update" --host all --quiet
```

Use `--host auto` only when the user explicitly wants detected clients instead
of every supported local skill root.

If that file is missing because the install is old, bootstrap once from GitHub.
Use `git fetch` + `git reset --hard`, never `git pull --ff-only`: a plain pull
cannot escape a non-`main` checkout (the "branch trap" that left users stamped
current but stale), whereas a hard reset to `origin/main` always lands on the
latest no matter what branch or dirty state the checkout is in. Fall back to a
clean re-clone if the fetch/reset cannot complete:

```bash
set -euo pipefail
REPO="${LAZYWEB_SKILL_REPO:-https://github.com/aboul3ata/lazyweb-skill}"
TARGET="${LAZYWEB_SKILL_DIR:-$HOME/.lazyweb/repos/lazyweb-skill}"
mkdir -p "$(dirname "$TARGET")"
if [ -d "$TARGET/.git" ] \
  && git -C "$TARGET" fetch --depth 1 origin main \
  && git -C "$TARGET" reset --hard FETCH_HEAD; then
  :
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
2. **Assert the retired/legacy skill dirs are GONE from every detected skill
   root** — not merely that `lazyweb-update/SKILL.md` exists. Trapped users keep
   invoking server-retired skills (e.g. `lazyweb-design-research`) precisely
   because the stale dir survived on disk. Check every root that exists
   (`~/.claude/skills`, `~/.codex/skills`, `~/.cursor/skills`,
   `~/.config/opencode/skills`, `~/.kiro/skills`, `~/.factory/skills`,
   `~/.slate/skills`, `~/.hermes/skills`):

   ```bash
   for root in "$HOME"/.claude/skills "$HOME"/.codex/skills \
     "$HOME"/.cursor/skills "$HOME"/.config/opencode/skills \
     "$HOME"/.kiro/skills "$HOME"/.factory/skills \
     "$HOME"/.slate/skills "$HOME"/.hermes/skills; do
     [ -d "$root" ] || continue
     for legacy in lazyweb-design-research lazyweb-quick-references \
       lazyweb-paywall-optimization lazyweb-signup-optimization \
       lazyweb-optimize-sign-up lazyweb-optimize-paywall \
       lazyweb-deep-design-research lazyweb-ab-test-research \
       lazyweb-design-best-practices lazyweb-design-brainstorm \
       lazyweb-design-improve lazyweb-lite-design-research lazyweb-paywall-cta; do
       [ -e "$root/$legacy" ] && echo "STALE: $root/$legacy"
     done
     # Any lazyweb-* dir outside the focused set is also stale.
     for d in "$root"/lazyweb-*/; do
       [ -e "$d" ] || continue
       name="$(basename "$d")"
       case " lazyweb-design lazyweb-quick-search lazyweb-update " in
         *" $name "*) : ;;
         *) echo "STALE: ${d%/}" ;;
       esac
     done
   done
   ```

3. **If that prints any `STALE:` line, re-run the updater** so setup's own
   `verify_prune` removes them, then re-check:

   ```bash
   "$HOME/.lazyweb/bin/lazyweb-update" --host all --quiet
   ```

   `setup --host all` is idempotent and itself asserts the prune; if a dir still
   survives (permissions, etc.) tell the user the exact path to `rm -rf` by hand.
4. Run `~/.lazyweb/bin/lazyweb-update-check`; it should print nothing when the
   installed version is current.
5. If Lazyweb MCP tools are available in the current client, run
   `lazyweb_health`.
6. **Always tell the user to RESTART the client.** Skills are loaded at client
   startup, so a disk-level prune does NOT fix the currently-running session —
   the old slash commands stay visible and invokable until restart. This is the
   one step that actually clears a trapped session; do not skip it even when the
   disk looks clean.

Summarize the updated commit/version, which clients were refreshed, whether any
stale skill dirs were found and removed, and remind the user to restart the
client so the changes take effect.
