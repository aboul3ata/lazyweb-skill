# Lazyweb Autorouter — Implementation Spec

**Status:** Shipped at v0.7.0 — eval gate PASSED, host coverage resolved (§12 Steps 6 + 6b done). Only the server-side MCP-session offer (§7.2, lazyweb.com infra, not this repo) remains external.
**Owner:** Ali
**Target version:** 0.5.0 spec → shipped as **0.7.0** (built on 0.6.1)
**Last updated:** 2026-06-11

> **Revision note (codebase review).** This draft was pressure-tested against
> the actual `setup`, `SKILL.md`, `scripts/validate-skill-pack.mjs`, and the
> host matrix. Findings folded in below:
> - **B1 — read-path hosts had no files to point at.** `setup` installs skill
>   files for 8 hosts (codex, claude, cursor, opencode, kiro, factory, slate,
>   hermes). **Antigravity gets MCP config only — zero skills on disk — and
>   there is no Gemini CLI host at all.** Routing is now gated on skill
>   installation: a host is a router target only if `setup` puts skill files on
>   disk for it (§4.3, §5, §6.4).
> - **B3 — sync check was self-contradictory.** §4.1 mandates trigger-shaped
>   router rows while the root table is category-shaped; "regenerate and diff"
>   could never pass. Replaced with a structural invariant (§11.3).
> - **S1 — coverage hole closed.** The curl|bash user who never explicitly
>   invokes a skill — the exact target population — was unreachable. The
>   one-time offer now rides the **MCP once-per-session instructions** (§7.2).
> - **S2/S3/S4/S5/S6** — node is an allowed dependency (§6); the byte budget is
>   a measured per-host gate and the template no longer repeats the read-path
>   per row (§4.1–§4.3); byte-identical project copies are deduped (§7.3, §10);
>   telemetry no longer depends on a self-reported tag (§9); rollout Step 1
>   distinguishes extraction from net-new code (§12).
> - **B2 (already shipped this pass)** — `validate-skill-pack.mjs` now iterates
>   `skills/*/` instead of a hardcoded six, and the README "Visible Skills"
>   table lists all eight modes. This was the live instance of the same
>   hardcoded-list trap the router design warns about.
>
> **Revision note 2 (adversarial multi-agent eval — 67 agents, 56 verified
> findings, no blockers).** Seven majors folded in:
> - **M1** — `block_sha256` is now a required manifest field; `status`/`refresh`
>   tamper-detection is defined against it (§6.2, §10).
> - **M2** — static set-equality can't catch a *mis-route*, so the §11.4 routing
>   eval is promoted to a **blocking pre-ship gate** with full per-mode coverage
>   and committed transcripts; `route:` must be non-empty (§11.3–§11.4).
> - **M3** — honest per-host coverage: v1 ships user-level for Claude/Codex/
>   opencode, project-level for Cursor, and capability-flag-off for Kiro/Factory/
>   Slate/Hermes until §12 Step 6b verifies them (§1, §12).
> - **M4** — portability stopped at the router boundary: four mode *bodies*
>   still say "ask ONE AskUserQuestion." Scrubbing them to host-neutral phrasing
>   is now in scope (§1 carve-out, §12 Step 2b).
> - **M5** — the cohort success metric needs net-new telemetry (a `router_install`
>   event + a stable per-machine id); §9 no longer claims it is "already emitted."
> - **M6** — manifest writes are serialized behind an advisory lock; `$HOME`-unset,
>   read-only-FS, and oversized-target edge cases added (§10).
> - **M7** — the interactive setup prompt's *no-answer* path is defined:
>   skip-without-persisting-decline, so the MCP-session offer is the single
>   follow-up and "exactly once" holds (§7.1).
> The eval also **refuted** three earlier worries (the `--yes` "consent bypass,"
> a supposed server-side/repo-edit confusion, and the opencode-XDG
> "contradiction") — left as-is deliberately.
>
> **Implementation note (2026-06-11, lands Steps 1–5).** Where shipped code
> diverges from the letter of this spec:
> - **The pack grew to 10 skills** before implementation; a naive render blew
>   the 1,800 B budget (worst host: 2,094 B). Per §4.1/§10 the budget held and
>   the content gave way: `route:` trigger texts were tightened, the catch-all
>   row shortened, skills-root paths render in `~` form (byte count no longer
>   varies with the username), and **`lazyweb-update` opts out of the routed
>   table via new `router-exclude: true` frontmatter** — it is a maintenance
>   command, not a design intent. Worst host now renders 1,790 B. The render
>   test enforces ≤1,800 B per routable host, so the 11th mode will fail CI
>   rather than silently overflow.
> - **`--project` shipped inside `lazyweb-router`** (consent-gated; AGENTS.md +
>   CLAUDE.md with symlink/`@`-import collapse and the identical-copies
>   notice), with a host-neutral `project` ACT_PREAMBLE.
> - **Telemetry shipped** (M5): `lazyweb-log` gained a generic `event` kind and
>   a per-machine random UUID (`~/.lazyweb/machine_id`, 0600) stamped on every
>   event; `lazyweb-router` emits `router_install/refresh/remove/decline`.
> - **`refresh` is manifest-driven** (covers project entries), not a host-table
>   walk; `setup` runs it on every re-run after skills are reinstalled.
> - **Step 2b widened:** beyond the four "ask ONE AskUserQuestion" lines, two
>   "when AskUserQuestion is unavailable" fallback mentions in design-research
>   were also scrubbed; the validator now rejects the tool name in any skill
>   body prose.
> - Open: §7.2's server-side MCP session offer (lazyweb.com, not this repo),
>   the §11.4 blocking routing evals (the committed transcript predates this
>   implementation), §12 Step 6b host verification, and the version bump.
>
> **Ship note (2026-06-11, v0.7.0 — gate cleared, shipping).**
> - **§11.4 routing-eval gate: PASS.** Ran a fresh 48-prompt controlled eval
>   (≥3 in-scope per routable mode + 12 out-of-scope incl. adversarial
>   near-misses), each decided by a fresh agent given only the rendered block.
>   Result **34/36 (94.4%) exact in-scope, 0/12 out-of-scope false positives** —
>   both bars cleared. Transcript committed at
>   [test/routing-evals/claude-0.7.0.md](../test/routing-evals/claude-0.7.0.md).
>   Two defensible borderline misroutes (di4, bp4) fall through to
>   `design-research`; documented, not over-fitted away. (First batch run was
>   inconclusive purely from transient server rate-limiting, not routing
>   errors; re-run in rate-limit-safe sequential waves + a direct re-run of the
>   2 throttled paywall cases.)
> - **§12 Step 6b host coverage: RESOLVED.** Only `claude` + `codex` have
>   driveable CLIs on this machine; `kiro`/`factory`/`slate`/`hermes` ship as
>   config dirs with no public global-instruction-file contract and cannot be
>   empirically driven here. They therefore **stay capability-flag OFF →
>   project-fallback** (`host_capability_on()` in `bin/lazyweb-hosts.sh`), and
>   `claude`/`codex`/`opencode` remain the user-level set. This is the
>   spec-compliant "don't write where we haven't confirmed the host reads"
>   outcome, now final rather than TBD.
> - **VERSION → 0.7.0**; spec status set to Shipped.

---

## 1. Problem & goal

Today, Lazyweb modes fire in two ways: the user explicitly invokes a skill
(`/lazyweb`, `/lazyweb-lite-design-research`, …) or the host agent happens to
trigger on a SKILL.md `description`. Description-matching is unreliable and
inconsistent across hosts: Claude Code and Codex do implicit skill matching,
but Cursor rules, Gemini CLI, opencode, Kiro, Factory, etc. either don't, or do
it weakly. The result is that a user who types "show me some paywall examples"
or "how do top apps do onboarding?" often gets a generic answer from training
data instead of being routed into the right Lazyweb mode.

gstack solved this with what we'll call an **autorouter**: a short
"intent → invoke this skill" routing section injected into the agent's
persistent instruction file (CLAUDE.md), so every session starts with the
routing rules already in context — no skill-trigger lottery, no explicit
invocation needed.

**Goal:** ship a Lazyweb autorouter that

1. works on **every host we install skill files to** — today that is Claude
   Code, Codex, Cursor, opencode, Kiro, Factory, Slate, and Hermes (the eight
   hosts `setup`'s `install_skills_to_root()` writes to) — using only
   capabilities each host actually has, no Claude-only tool names in portable
   text. **Antigravity (MCP-config-only today) and Gemini CLI (not yet an
   installed host) are explicitly out of router scope until `setup` installs
   skills for them** — the router has nothing to point at otherwise (§5).

   **What "works on" means per host in v1 (M3 — honest coverage).** The eight
   split three ways, and the brief's "all other coding agents" is met by a
   *graceful degradation*, not uniform user-level coverage:
   - **User-level, shipping enabled in 0.5.0:** Claude Code, Codex, opencode —
     each has a vendor-documented global instruction file we verified (§5).
   - **Project-level only (no global file exists):** Cursor — routing via the
     §7.3 project flow + a paste-into-Settings snippet.
   - **Capability-flag default OFF → project fallback until verified:** Kiro,
     Factory, Slate, Hermes — their global-file behavior is unconfirmed (§13 Q4),
     so they do not silently write a user-level file; §12 Step 6b funds the
     verification that can flip them on. This is a deliberate "don't write where
     we haven't confirmed the host reads" stance, not an oversight;
2. is woven into **onboarding** with a clear, bounded cadence (install-time
   offer → one-time runtime fallback offer → silent idempotent refresh on
   every update → clean uninstall);
3. installs at the **user level by default** (one consented write, works in
   every project), with project-level as the fallback for hosts that have no
   global instruction file — the Roughdraft model, not the per-project
   gstack model.

Non-goals: changing how the modes themselves work; replacing the root router
`SKILL.md` (the autorouter *points at* it); any server-side routing.

**Carve-out (M4) — the one mode-body change that is in scope.** The router is
host-neutral, but it routes agents *into* mode `SKILL.md` files, and four of
those bodies currently instruct the agent to "ask ONE **AskUserQuestion**"
([design-research/SKILL.md:113](../skills/lazyweb-deep-design-research/SKILL.md),
[design-improve:48](../skills/lazyweb-design-improve/SKILL.md),
[quick-references:46](../skills/lazyweb-lite-design-research/SKILL.md),
[design-brainstorm:52](../skills/lazyweb-design-brainstorm/SKILL.md)) — a
Claude-only tool name. On Codex/Cursor/opencode the autorouter would faithfully
deliver the user into a mode that then names a tool the host doesn't have, so
portability that holds at the routing layer breaks one hop downstream. Scrubbing
that prose to host-neutral phrasing ("ask the user one short clarifying
question") is therefore in scope (§12 Step 2b). The frontmatter `allowed-tools:`
entries naming AskUserQuestion are *not* a leak — non-Claude hosts ignore
unknown allowed-tools — so they can stay; only the body prose must change.

---

## 2. Prior art (what we copy, what we fix)

### 2.1 gstack `## Skill routing` injection

gstack's preamble (generated by
`scripts/resolvers/preamble/generate-routing-injection.ts`) checks at skill
runtime:

```bash
_HAS_ROUTING="no"
if [ -f CLAUDE.md ] && grep -q "## Skill routing" CLAUDE.md 2>/dev/null; then
  _HAS_ROUTING="yes"
fi
_ROUTING_DECLINED=$(gstack-config get routing_declined)
```

If routing is absent and the user hasn't declined before, it uses
`AskUserQuestion` to offer appending a `## Skill routing` section to the
**project** CLAUDE.md, with plain "intent → invoke /skill" lines, then commits
the change. A decline is persisted globally (`routing_declined` in
`~/.gstack/config.yaml`) so it never nags again.

**Copy:** runtime one-time offer with a persisted decline; tiny plain-text
routing table; detection-by-marker so it never duplicates.

**Fix:**
- gstack injects per **project**, so every new repo re-pays the cost (a new
  CLAUDE.md edit, a new commit, PR noise for teammates who don't use gstack).
  We default to **user-level** files.
- gstack's injected block has no version stamp and no machine-parseable
  delimiters — upgrades can't rewrite it safely, and uninstall is manual
  ("remove the sections yourself"). We use BEGIN/END markers + a version
  stamp + a write manifest.
- gstack's prompt mechanism names `AskUserQuestion`, a Claude Code-only
  tool. Our runtime offer is phrased host-neutrally (§7.2).

### 2.2 Roughdraft `setup.md`

Roughdraft doesn't ship an injector binary at all: its setup page instructs
the *agent* to add Roughdraft guidance to "the persistent instruction file
this agent will actually load," **preferring the user/global level**, with an
explicit per-agent table (Codex → `${CODEX_HOME:-$HOME/.codex}/AGENTS.md`,
Claude Code → `~/.claude/CLAUDE.md`, Gemini → `~/.gemini/GEMINI.md`,
opencode → `~/.config/opencode/AGENTS.md`), ask-first permission language,
and "do not overwrite existing files."

This is the answer to "is there a smarter way to do user-level?": **yes — in
Codex, the app's "Custom instructions" UI *is* `~/.codex/AGENTS.md`** (the
settings page literally edits personal instructions in AGENTS.md). Writing
that one file gives Lazyweb routing in every Codex session on the machine,
and the user can see/edit it in the Codex settings UI afterwards. The same
trick exists per host (§5).

**Copy:** user-level-first targeting table; consent-before-write; agent-
mediated install path as a complement to the shell installer.

**Fix:** Roughdraft has no idempotent update story either (it just says
"check before editing"). We own the block with markers so `setup` can
refresh it on every version bump.

---

## 3. Design overview

One **canonical router template** lives in the repo. At install time, a new
injector (`bin/lazyweb-router`) renders it per host (substituting the
invocation phrasing and skill paths that host understands) and **upserts a
marker-delimited managed block** into that host's *user-level* instruction
file, with explicit consent. Hosts with no user-level file get a documented
project-level fallback. Every block write is recorded in a manifest so
upgrade rewrites and uninstall are exact.

```
repo
├── router/
│   └── ROUTER.template.md      # canonical routing text, host-agnostic, with placeholders
├── bin/
│   └── lazyweb-router          # render + upsert + remove + status (bash entrypoint, node for JSON manifest I/O — same as setup)
└── setup                       # gains --router / --no-router and a consent prompt

~/.lazyweb/
├── router.manifest.json        # every file we wrote a block into, with version
└── config                      # router_declined=1 (decline persistence)
```

The injected block (rendered, Claude Code example) is delimited like:

```markdown
<!-- LAZYWEB:ROUTER:BEGIN v0.5.0 — managed by `lazyweb-router`; do not edit inside; `lazyweb-router remove` to uninstall -->
## Lazyweb design-evidence routing
…routing rules…
<!-- LAZYWEB:ROUTER:END -->
```

Everything between the markers is ours; everything outside is never touched.

---

## 4. The router block (canonical content)

### 4.1 Requirements on the text itself

- **Small.** Budget: **≤ 1,800 bytes rendered, enforced per host.** It rides in
  every session's context on every host, and Codex caps combined project docs at
  32 KiB — we must be a rounding error, not a tenant. The block routes; it must
  not teach. All workflow detail stays in the SKILL.md files. **The binding
  constraint is the verbose renderings, not the Claude form:** a naive design
  that repeats `(or read ~/.<host>/skills/<name>/SKILL.md and follow it)` on
  every one of nine rows costs ~90 B/row ≈ 850 B for the right column alone and
  blows 1,800 B at *eight* modes, before the "someday 14" concern. The render
  test (§11.2) measures every host's rendered size; the template avoids the
  cliff by **stating the read-path convention once, above the table, and
  keeping table cells to the bare skill identifier** (§4.2). If a future host's
  shortest form still can't fit, that host collapses long-tail modes into the
  catch-all row — the budget is the gate, never raised silently.
- **Host-portable.** No tool names (`AskUserQuestion`, `Skill`), no
  `/slash-command` syntax in the canonical template — those are filled per
  host by the renderer (§4.3). The lowest common denominator that works on
  *every* host with skills on disk is: *"read the skill file at `<path>` and
  follow it"* — stated once as the table's how-to-act preamble, not per cell.
- **Trigger-shaped, not category-shaped.** Routing lines lead with the user
  phrasings that should trip them, mirroring the root `SKILL.md` routing
  table — that table is the single source of truth for intent → mode.
- **Bounded.** The block must state when *not* to fire (pure backend work,
  copyediting prose, anything not product-UI) so it doesn't tax unrelated
  sessions.

### 4.2 Canonical template (`router/ROUTER.template.md`)

Placeholders: `{{ACT_PREAMBLE}}` (host-specific *how to act on a skill name*,
stated once), `{{VERSION}}`. Table cells render only the bare skill identifier
— the read-path lives in the preamble, never per row, so the byte cost is paid
once instead of nine times (§4.1).

```markdown
<!-- LAZYWEB:ROUTER:BEGIN v{{VERSION}} — managed by `lazyweb-router`; do not edit inside; run `~/.lazyweb/bin/lazyweb-router remove` to uninstall -->
## Lazyweb design-evidence routing

Lazyweb provides real app screenshots, UI patterns, and A/B test evidence.
Before designing, critiquing, or changing any product UI (screens, flows,
landing pages, paywalls, onboarding, pricing, checkout, dashboards), route
through Lazyweb instead of answering from training data. When in doubt
whether a UI request matches, route it.

{{ACT_PREAMBLE}}

| The user asks for… | Skill |
|---|---|
| Design research, best practices, competitive analysis, "what do top apps do" | `lazyweb-deep-design-research` |
| Quick examples / screenshots / UI references, no full report | `lazyweb-lite-design-research` |
| Feedback on / improvement of an existing screen or design | `lazyweb-design-improve` |
| Creative, unconventional, cross-category design ideas | `lazyweb-design-brainstorm` |
| Paywall redesign or paywall conversion optimization | `lazyweb-optimize-paywall` |
| Rewriting or stress-testing one paywall CTA (button copy only) | `lazyweb-paywall-cta` |
| A/B tests, experiments, pricing/trial/monetization strategy | `lazyweb-ab-test-research` |
| Anything UI-related that fits none of the above | `lazyweb` (the router skill picks the mode) |

Do not route: backend/CLI/infra work, prose copyediting, non-product visuals.
If the request is ambiguous between two modes, ask the user one short
clarifying question before proceeding; if you cannot ask, choose the closer
mode, say so, and continue.
<!-- LAZYWEB:ROUTER:END -->
```

Notes:

- `{{ACT_PREAMBLE}}` is the single line that tells the host how to turn a skill
  name into action, rendered per host (§4.3). This is what keeps the block
  under budget — the per-host verbosity is paid once, not per row.
- The ambiguity line is the portable replacement for gstack's
  `AskUserQuestion` flow: every interactive host can end a turn with a
  question; headless runs get the "state your assumption and continue"
  branch. No tool is named.
- The "Anything UI-related…" catch-all keeps the table future-proof: a new
  mode added to the root `SKILL.md` routing table is reachable through the
  router skill even before the user's block is refreshed.

### 4.3 Per-host rendering of `{{ACT_PREAMBLE}}`

One line, rendered per host, sitting above the table. Table cells stay bare.

| Host class | `{{ACT_PREAMBLE}}` rendering | Why |
|---|---|---|
| Claude Code | `To act on a row, invoke that skill (e.g. /lazyweb-deep-design-research).` | Skill tool + slash commands are native; naming the skill is enough. |
| Codex | `To act on a row, invoke that skill by name, or read ~/.codex/skills/<skill>/SKILL.md and follow it.` | Native skills with implicit invocation; the read-path covers older builds. |
| Cursor | `To act on a row, read ~/.cursor/skills/<skill>/SKILL.md and follow it.` | No reliable global skill invocation; file-read phrasing always works. |
| opencode / Kiro / Factory / Slate / Hermes | `To act on a row, read {{SKILLS_ROOT}}/<skill>/SKILL.md and follow it.` | Instruction-file-only hosts; the file path is the only portable handle. |

`{{SKILLS_ROOT}}` comes from the same host→path table `setup` already uses in
`install_skills_to_root()` — the two must share one table (see §6.4) so a path
change can never strand the router.

**Hard gate (B1): a host is a router target only if `setup` installs skill
files for it.** The read-path forms above resolve only because those eight
hosts call `install_skills_to_root()`. **Antigravity installs MCP config but no
skills, and Gemini CLI is not an installed host at all** — for them
`{{SKILLS_ROOT}}/<skill>/SKILL.md` points at nothing, so they are excluded from
routing until `setup` installs their skills (tracked in §5 / §13 Q3). The
renderer asserts `host_skills_root()` is populated *and* skills are present
before emitting a block; an unpopulated root is a skip, not a broken block.

The mode list in the table is **generated, not hardcoded**: the renderer
iterates `skills/*/SKILL.md`, reads each frontmatter `name` + a one-line
route hint (new frontmatter key `route:`, falling back to the first sentence
of `description`), and emits one row per skill. This is the same lesson as
the `install_skills_to_root()` comment about the "hardcoded list trap that
left lazyweb-paywall-cta and lazyweb-optimize-sign-up stranded after
0.4.0" — and that trap was *still live* in `validate-skill-pack.mjs` and the
README at review time (both listed six of eight modes); both were converted to
directory iteration in the B2 pass. A new mode must appear in the router by
*adding its directory*, nothing else. The canonical intent phrasings in §4.2
seed the initial `route:` values, copied from the root `SKILL.md` routing
table.

---

## 5. Target files per host (the injection matrix)

Verified June 2026. **Key correction baked in: Claude Code does NOT read
AGENTS.md natively** (docs state "Claude Code reads CLAUDE.md, not
AGENTS.md"; feature request anthropics/claude-code#34235 is open). Any plan
that writes one AGENTS.md and assumes Claude picks it up is wrong.

| Host | User-level target (primary) | Notes / fallback |
|---|---|---|
| **Claude Code** | `~/.claude/CLAUDE.md` | Loaded in every session, every project. Create if missing. |
| **Codex** (CLI + IDE + app) | `${CODEX_HOME:-$HOME/.codex}/AGENTS.md` | This file **is** the "Custom instructions" surface in the Codex app settings — user-visible and editable after we write it. Codex prefers `AGENTS.override.md` if non-empty: if one exists, inject there instead and note it in the manifest. |
| **opencode** | `${XDG_CONFIG_HOME:-$HOME/.config}/opencode/AGENTS.md` | Documented global rules path. |
| **Cursor** | — none on disk | User Rules live only in the Settings UI (no documented `~/.cursor/rules` file). **Fallback:** project-level `AGENTS.md` (Cursor reads it natively) via the project flow in §7.3, plus a printed one-paragraph snippet the user can paste into Settings → Rules. |
| **Kiro** | `~/.kiro/steering/lazyweb.md` if steering dir exists | Unverified-stable; gate behind detection of the directory, else project fallback. |
| **Factory / Slate / Hermes** | probe for `~/.{factory,slate,hermes}/AGENTS.md` | These hosts already get skills from `setup`; their global-file conventions are undocumented. Write only if the host's config dir exists AND the host honors a global AGENTS.md (maintain a per-host capability flag in the table, default **off** → project fallback). |
| **Antigravity** | — none (router-excluded today) | `setup` writes MCP config to `~/.gemini/antigravity*/mcp_config.json` but **installs no skill files**, so the read-path has nothing to resolve. Whether Antigravity even reads `~/.gemini/GEMINI.md` is unverified (it is a distinct product from Gemini CLI). Out of router scope until `setup` calls `install_skills_to_root()` for it (§13 Q3). |
| **Gemini CLI** | — none (not an installed host) | There is **no `gemini` host** in `setup`'s `selected_hosts()`; we install neither skills nor MCP for it today. Adding routing means first making it a host (skills root + `~/.gemini/GEMINI.md`, honoring a remapped `context.fileName` from `~/.gemini/settings.json`). Deferred (§13 Q3). |
| **(not installed by us, for completeness)** GitHub Copilot coding agent | — | Project-only: `.github/copilot-instructions.md` or repo `AGENTS.md`. Covered automatically when a team adopts the project-level block. |

Rules for all targets:

0. **Skills-on-disk prerequisite (B1).** A host is a router target only if
   `setup` installs its skill files (`host_skills_root()` resolves *and* the
   directory is populated). The router points *at* those files; with no files
   there is nothing to route to. This rule is what excludes Antigravity and
   Gemini CLI above, and it is enforced in the renderer (§4.3), not left to
   documentation.
1. **Never create a host's config directory.** Directory absent ⇒ host not
   installed ⇒ skip (mirrors `selected_hosts()` detection).
2. **Create the instruction file** if the directory exists but the file
   doesn't — with consent, and containing only our block.
3. **Append-only placement** when the file exists: our block goes at the end,
   after a blank line. We never reorder or reformat user content. (End of
   file is fine for routing rules; instruction files have no precedence
   cliff within a single file that affects us measurably.)
4. **One block per file.** If markers already exist, replace between them
   in place (position preserved — the user may have moved our block; respect
   that).

---

## 6. The injector: `bin/lazyweb-router`

A bash entrypoint that shells out to **node for all JSON manifest I/O**, mirroring
`setup` (whose `json_escape()` and config writers are node, not jq, not
hand-rolled bash). node is an allowed dependency — the Lazyweb MCP itself runs
via `npx mcp-remote`, so any working install already has it, and `lazyweb-log`
documents it as "a safe dependency" for exactly this reason. (The pure-bash
discipline of `lazyweb-update-check` is for the hot-path per-invocation version
check; the router is not hot-path. Do **not** hand-roll manifest read/write/
hash-compare in bash — that is the brittle path this clause exists to forbid.)
Installed to `~/.lazyweb/bin/` by `install_lazyweb_bins()` like its siblings;
the shared `bin/lazyweb-hosts.sh` (§6.4) is sourced, not installed as a bin.

### 6.1 Commands

```
lazyweb-router install [--host <h>|--all] [--yes] [--project [<dir>]]
lazyweb-router remove  [--host <h>|--all] [--project [<dir>]]
lazyweb-router status            # per host: installed version | absent | declined
lazyweb-router render --host <h> # print rendered block to stdout (used by docs, agent-mediated installs, and tests)
```

### 6.2 Upsert algorithm (per target file)

```
1. target = resolve(host)                 # §5 matrix; skip if host dir missing
2. block  = render(template, host, version, skills/*/SKILL.md)
3. assert len(block) <= 1800 bytes        # hard fail in CI, warn at runtime
4. if file missing:        content = block
   elif markers found:     content = file with [BEGIN..END] replaced by block
        (match BEGIN by prefix "<!-- LAZYWEB:ROUTER:BEGIN" — any version)
   elif BEGIN without END (corrupt): refuse, print manual-fix instructions, exit 2
   else:                   content = file + "\n\n" + block
5. write via temp file + mv (atomic); preserve original permissions
6. record in ~/.lazyweb/router.manifest.json (under a manifest lock, §10):
   { "version": 1,                          # manifest format version
     "targets": [ {"host":"codex", "file":"/Users/x/.codex/AGENTS.md",
                   "version":"0.5.0", "created_file":false,
                   "block_sha256":"<hex>",   # sha256 of the rendered block bytes, BEGIN..END inclusive
                   "updated_at":"2026-06-10T00:00:00Z"} ] }
```

`block_sha256` is the field §10's `status`/`refresh` rely on and is **required**,
not optional: it is the sha256 of the exact rendered block we wrote (from the
`<!-- LAZYWEB:ROUTER:BEGIN` byte through the `:END -->` byte, inclusive of the
trailing newline we emit). It is written on **every** `install` and `refresh`.
`status` recomputes the sha256 of the block currently in the file and compares:
equal ⇒ `installed v<ver>`; differ ⇒ `modified` (user edited inside the
markers); marker absent ⇒ `removed externally`. `refresh` uses the same compare
to decide whether its overwrite clobbers user edits, and prints the one-line
notice (§10) only when it does. Without this field neither check is
implementable — defining it here is M1.

`remove` reverses it: delete the marker block (plus one adjacent blank
line); if `created_file:true` and the file is now empty/whitespace, delete
the file; drop the manifest entry. `remove` works even with no manifest (scan
the §5 matrix for markers) so it survives a wiped `~/.lazyweb`.

Idempotency invariant (tested, §10): `install ∘ install = install`, and
`remove ∘ install` restores the original file byte-for-byte when
`created_file:false` and the user didn't edit inside the markers.

### 6.3 Consent model

`lazyweb-router install` **never writes without an explicit yes**, obtained
from exactly one of:

- interactive TTY prompt (shows the target file list + the rendered block
  first — preview-then-confirm, like gstack's plan-tune hook prompt; default
  **No**; 30s timeout = No so piped/CI runs never hang);
- `--yes` flag (used by `setup --router` after `setup` itself prompted);
- pre-existing manifest entry for that file (a refresh of a block the user
  already approved is *not* a new consent event — this is what makes silent
  auto-update refresh legitimate, §7.4).

A decline writes `router_declined=1` to `~/.lazyweb/config` and is
respected by every future automatic offer (install-time and runtime). Manual
`lazyweb-router install` always works regardless of the flag and clears it
on success.

### 6.4 Shared host table

Extract the host→paths mapping currently embedded in `setup`
(`install_skills_to_root()`, `selected_hosts()`) into one sourced file
(`bin/lazyweb-hosts.sh`), used by both `setup` and `lazyweb-router`. One table,
two consumers — a new host added for skills is automatically a candidate for
routing.

Functions:

- `host_skills_root(host)` and `host_detected(host)` are **extractions** — the
  values already live in `setup`'s `install_skills_to_root()` calls and
  `selected_hosts()` detection.
- `host_instruction_file(host)` and `host_routable(host)` are **net-new** —
  `setup` has no instruction-file concept today (see §12 Step 1). `host_routable`
  encodes Rule 0: it returns true only when `host_skills_root(host)` resolves to
  a populated directory *and* the host's capability flag is on. Antigravity and
  Gemini CLI return false here, in code, not just in prose.

---

## 7. Onboarding integration & cadence

The autorouter touches the user at exactly four moments. Everything else is
silent.

### 7.1 Moment 1 — install time (`setup`)

`setup` gains `--router` / `--no-router` (mirroring
`--auto-update/--no-auto-update`):

- **Interactive run:** after skills + MCP are configured, print the rendered
  block once and ask:
  `Add Lazyweb routing to your agents' global instructions so design
  questions auto-route to the right mode? [y/N]`
  - **Explicit yes** ⇒ `lazyweb-router install --all --yes`.
  - **Explicit no** ⇒ set `router_declined=1` and print the one-liner to enable
    later. This is the *only* input that persists a decline here.
  - **No answer (M7 — the cadence hole):** empty line, EOF, or a `read`
    timeout = **skip without persisting a decline.** Do *not* treat silence as
    "no" — that would either permanently opt out a user who just hit Enter, or
    (if we also didn't record it) double-prompt them. Skipping-without-persist
    leaves the manifest empty and `router_declined` unset, so the §7.2
    MCP-session offer becomes the single, later follow-up — exactly one more
    ask, on a different surface, gated to fire at most once. That preserves the
    "exactly once per resolution" invariant: a user is asked again only if they
    never actually answered.
- **`--quiet` / piped (the curl|bash path):** **never** inject. Print:
  `Tip: run ~/.lazyweb/bin/lazyweb-router install to auto-route design
  questions to Lazyweb (see README).` Rationale: curl|bash already writes
  MCP configs, but instruction files are user-authored prose — higher
  trust bar, explicit consent only.
- `--router` ⇒ install without the prompt; `--no-router` ⇒ skip + persist
  decline.

### 7.2 Moment 2 — first-run offer (MCP session instructions, primary)

**The coverage problem (S1).** The autorouter exists for the user on a
weak-matching host who *never explicitly invokes a skill* (§1) — that is the
whole point. But the `--quiet`/curl|bash install path (§7.1) deliberately
never injects, and `refresh` (§7.4) only touches existing manifest entries. So
if the one-time offer fires *only on explicit skill invocation*, the target
population is never reached: curl|bash install + never-invoke = never offered,
forever. A skill-side-only fallback closes the hole for exactly the users who
don't have it.

**Fix: the offer rides the MCP once-per-session instructions** — the one
surface that runs every session regardless of whether the user invokes
anything. The existing Lazyweb skill-pack version-check block (server-side,
already "ONCE per session, BEFORE the user's request, non-blocking") gains a
sibling autorouter check:

```
Once per session, non-blocking, only if BOTH are true:
  - ~/.lazyweb/router.manifest.json is missing or empty
  - `grep -q router_declined ~/.lazyweb/config` fails
then, AFTER serving the user's request, ask once (plain question, no
host-specific tool): "Want me to install Lazyweb's autorouter so design
questions route to the right mode automatically? I'd run
~/.lazyweb/bin/lazyweb-router install, which adds a marked routing section to
<detected files>."
On yes: run `lazyweb-router install --all --yes` and show what was written.
On no: run `lazyweb-router decline` (writes router_declined=1). Never ask again.
```

Bounded by design: fires at most once ever (manifest or decline flag ends it),
non-blocking, and runs *after* the user's actual request is served. Because it
is server-side text, it also reaches pre-0.5.0 installs with no client update.

### 7.2b Moment 2 fallback — skill-side (redundant local path)

The root `SKILL.md` (router skill) carries the *same* check, gated identically
(no manifest, not declined, after the request is served), for sessions where
the MCP instructions weren't honored — e.g. MCP disconnected, or a host that
loads skills but suppresses server instructions. It is redundant with §7.2 by
design: whichever path fires first writes the manifest or the decline flag,
which silences the other. Unlike the original draft, this is the *backup*, not
the only path — so it no longer matters that it depends on explicit invocation.

### 7.3 Moment 2b — project-level opt-in (teams, Cursor, Copilot)

`lazyweb-router install --project [<dir>]` writes the same block to the
project's `AGENTS.md` **and** `CLAUDE.md` (both, because Claude Code ignores
AGENTS.md; if `CLAUDE.md` already `@`-imports or symlinks AGENTS.md, write
only AGENTS.md). This is never automatic — it edits files that land in the
team's repo and shows up in PRs. It's the documented path for: Cursor (no
global file), GitHub Copilot coding agent, and teams that want routing for
every contributor. README gets a "Team install" subsection.

**Byte-identical copies (S4).** A repo often keeps `AGENTS.md` and `CLAUDE.md`
as identical *copies* — not symlinks — that the author syncs by hand. (This
very repo does: both are 3,271 bytes, identical content, distinct inodes.)
That is **not** a symlink, so the §10 resolved-path dedup does not fire, and it
should not: the two files are read by different hosts and both need the block.
Writing the same rendered block to both keeps them identical at write time, and
because each is a separate manifest entry keyed by path, `refresh` updates both
in lockstep — *our* block never diverges. The only residual risk is the user's
*own* content drifting between two hand-synced copies, so on detecting
identical copies the project flow emits a one-line notice: "AGENTS.md and
CLAUDE.md are identical copies — consider symlinking one to the other so you
maintain a single file." We write both; we do not silently collapse them.

### 7.4 Moment 3 — updates (silent, every version)

Refreshing an approved block needs no new consent (§6.3). Two hooks:

- **`setup` re-runs** (including the auto-update `curl … | sh -s -- --quiet`
  path): after `install_version_marker()`, run
  `lazyweb-router refresh` = for each manifest entry whose `version` <
  current, re-render and upsert in place. No manifest ⇒ no-op. This keeps
  the routing table in lockstep with the skill list — when 0.6.0 adds a
  mode, every consented instruction file gets the new row on its next
  update, with zero prompts.
- **MCP server-side session instructions** carry the new autorouter *offer*
  text (§7.2), but the *refresh* itself needs none — re-running `setup` (or the
  auto-update path) calls `lazyweb-router refresh`, so the routing table stays
  in lockstep with the skill list with no per-session server logic.

The version stamp in the BEGIN marker is what `status`/`refresh` parse;
matching is by marker prefix so any historical version is upgradable.

### 7.5 Moment 4 — uninstall

`lazyweb-router remove --all` per §6.2. Any future pack-level uninstall doc
references it. Markers carry the remove command inline, so a user staring at
their CLAUDE.md knows exactly how to get rid of the block without us.

### Cadence summary

| Event | Frequency | User interaction |
|---|---|---|
| `setup` interactive | once per machine | one y/N with preview |
| MCP-session offer (primary) + skill-side fallback | at most once ever, any session | one plain question, after the request is served |
| Project-level install | only on explicit command | command + preview |
| Refresh on update | every version bump | none (silent, pre-consented) |
| Remove | on demand | command |

---

## 8. User-level vs project-level: the decision

**Default: user-level.** Rationale:

1. **One consent, machine-wide coverage.** A project-level default means
   re-asking in every repo (gstack's model) — n prompts, n diffs, and routing
   silently absent in repo n+1.
2. **No repo pollution.** Project CLAUDE.md/AGENTS.md edits show up in
   `git status` and PRs and impose Lazyweb on teammates who never installed
   it. User-level files are personal by construction.
3. **The host vendors already blessed it.** Codex's own settings UI edits
   `~/.codex/AGENTS.md`; Claude Code documents `~/.claude/CLAUDE.md` as
   user memory; opencode documents `~/.config/opencode/AGENTS.md` as its
   global rules file. We're writing to surfaces the user can inspect and edit
   with first-party tooling — exactly the Roughdraft insight. (`~/.gemini/
   GEMINI.md` is the same kind of surface, but Gemini CLI is not yet an
   installed host — §5, §13 Q3 — so it is not a v1 target.)
4. **Codex byte budget.** Project AGENTS.md files share a 32 KiB cap; the
   global file keeps us out of that contention.

Project-level remains as an explicit opt-in (§7.3) because it's genuinely
better for: teams standardizing on Lazyweb, Cursor (no global file), and
hosted/CI agents (Copilot coding agent) that only read the repo.

---

## 9. Telemetry

Two additions, both logging-only, consistent with the existing analytics
tag (`skill:` + `skillVersion:` on every `lazyweb_*` call):

1. **Install-state, not a self-reported per-call tag (S5).** The original draft
   distinguished autorouted runs by having the rendered block instruct the
   agent to append `entry:"autorouter"` to every `lazyweb_*` tag. That relies on
   the agent reliably threading a flag from a CLAUDE.md line into every tool
   call many turns later — soft compliance the draft itself called "looser." A
   metric built on it can't tell "router didn't fire" from "agent dropped the
   tag," so it can't validate the feature. Instead, attribute at install state:
   `lazyweb-router` records each machine's router status (installed version +
   host list) in its events, and mode usage is compared **between cohorts** —
   mode-invocation volume on router-installed machines vs. not.

   **What this needs (M5 — these are net-new, not "already emitted").** Today
   only the `skill:` per-call tag exists. Cohort attribution additionally
   requires two pieces this feature must add: (a) the `router_install`/`refresh`/
   `remove`/`decline` events in item 2 below, and (b) a **stable per-machine
   identifier** on `lazyweb-log` events — currently they carry none, so two
   machines are indistinguishable in the buffer. Adding a machine id touches the
   redaction rules in `lazyweb-log` (it must be a random install-time UUID in
   `~/.lazyweb/`, never a hostname/user/email), so call it out as real work, not
   a freebie. If per-session attribution is later wanted, stamp it server-side
   when a route passes through the `/lazyweb` root skill — never via a
   client-carried tag.
2. `lazyweb-router` logs `router_install|router_refresh|router_remove|
   router_decline` events via the existing `lazyweb-log` buffer, with host
   list and version — same fire-and-forget, never blocks on network.

Success metric for 0.5.x (cohort-based, measurable **once the machine id +
`router_install` event above land**): mode-invocation rate per active machine is
materially higher on router-installed machines than on not-installed machines
within 30 days (target: ≥1.3× lift); decline rate at the setup + MCP-session
offers <50% combined (if higher, the preview text is scaring people — revisit
wording, not the mechanism). The metric no longer depends on a tag the agent
might forget to emit — but it is not free either; it ships with its telemetry.

---

## 10. Edge cases & failure modes

| Case | Behavior |
|---|---|
| Instruction file is a symlink (e.g. `CLAUDE.md → AGENTS.md`) | Resolve and write through the symlink; record the *resolved* path in the manifest; detect duplicates (two hosts resolving to **the same real path** ⇒ one block). Dedup is by resolved path, *not* content: two distinct real files with identical bytes (a common hand-synced `AGENTS.md`/`CLAUDE.md` pair) are read by different hosts and each correctly gets its own block — see §7.3 (S4). |
| `AGENTS.override.md` present in `~/.codex/` | It shadows `AGENTS.md` entirely — inject there; manifest records which. |
| User edited inside our markers | `refresh` overwrites (markers say "do not edit inside"); `status` flags `modified` by comparing the live block's sha256 against `block_sha256` in the manifest (§6.2), and `refresh` prints a one-line notice when it clobbers. |
| BEGIN without END | Refuse to touch the file; exit 2 with manual instructions. Never guess at block extent. |
| File >0 bytes but unreadable/unwritable (permissions) | Skip host with a warning; non-zero exit only if *every* target failed. |
| Concurrent installs (setup prompt + MCP-session offer + skill-side fallback all fire close together) | The three triggers (§7.1/§7.2/§7.2b) all read-modify-write the same `targets` array. Serialize **every** manifest mutation behind an advisory lock (`~/.lazyweb/router.manifest.lock`, e.g. `mkdir`-based or `flock` where available; stale-lock breaker after 30 s). Re-read the manifest *inside* the lock before writing (compare-and-swap on the file's content), never on a stale in-memory copy. Per-target file writes are already atomic (temp+mv); the lock protects only the shared manifest. |
| `$HOME` (or `CODEX_HOME`/`XDG_CONFIG_HOME`) unset or empty | Resolve targets only from set, non-empty env; if the base var is missing, skip that host with a warning rather than writing to `/` or CWD. No env ⇒ no targets ⇒ clean no-op exit 0. |
| Target file on a read-only filesystem / quota-exceeded | The atomic temp+mv fails; catch it, skip that host with a warning (same path as the permissions case), leave the manifest unchanged for that target. |
| Target instruction file is very large (user has a huge CLAUDE.md) | Appending our ≤1,800 B block is negligible, but on Codex check the combined-docs 32 KiB cap *before* writing the user-level `AGENTS.md`: if our block would push it over, skip with a warning pointing at the project-level flow instead of silently overflowing. |
| Host uninstalled later (dir gone) | `refresh` skips, keeps the manifest entry (the file may come back); `status` shows `target missing`. |
| Two Lazyweb checkouts / re-curl over an old install | Manifest is keyed by absolute file path — second install refreshes, never duplicates. |
| Pre-0.5.0 manual snippets users pasted from README | Out of marker scope; one-time migration: `install` greps for the legacy heading `## Lazyweb design-evidence routing` outside markers and, if found, asks to replace it. |
| CRLF files (Windows-edited) | Preserve the file's dominant line ending when splicing. |
| Block budget exceeded | Measured per host by the render test (§11.2). The binding case is the *verbose* renderings (Codex/file-path), which the §4.2 once-stated-read-path design keeps off the per-row multiplier; the bare-cell table fits eight modes comfortably. If a host still overflows, collapse long-tail modes into the catch-all row — never raise the budget. |

---

## 11. Testing & validation

Extend the existing harness (`npm test` over `test/`, plus
`scripts/validate-skill-pack.mjs`):

1. **Unit tests for the upsert** (`test/router.test.*`, run against temp
   dirs with `HOME` overridden — same pattern as existing bin tests):
   fresh-file create; append to existing; in-place replace preserving
   position; idempotency (`install; install` ⇒ identical bytes); remove
   restores original; remove deletes only created files; corrupt-marker
   refusal; symlink resolution; CRLF preservation; manifest round-trip.
2. **Render tests:** every *routable* host (Rule 0 — skills on disk) renders
   within the per-host byte budget; non-routable hosts (Antigravity, Gemini CLI
   today) render nothing; every `skills/*/SKILL.md` appears exactly once in
   every rendered table; the `{{ACT_PREAMBLE}}` read-path appears exactly once
   (never per row); placeholders fully substituted (grep for `{{` fails the
   build).
3. **Validator additions** (`validate-skill-pack.mjs`): every skill frontmatter
   has a **non-empty `route:`** value (assert present *and* ≥1 trigger phrase,
   not just the key); and a **structural** sync invariant — *every `skills/*/`
   directory appears exactly once in both the root `SKILL.md` routing table and
   `router/ROUTER.template.md`, keyed by skill name/path.* It does **not** diff
   the intent prose: §4.1 deliberately makes the router rows trigger-shaped and
   the root table category-shaped, so a string diff could never pass (this was
   the B3 contradiction in the original draft). The invariant is set-equality of
   skill identifiers across the three sources, not text identity. (The B2 pass
   already converted this validator from a hardcoded six-mode list to
   `skills/*/` iteration, so the set side is in place.)

   **Limit (M2): set-equality cannot catch a *mis-route*.** A row whose intent
   text points the wrong phrasing at the wrong skill passes every static check —
   the IDs are all present, just wired wrong. Static validation proves
   *coverage*, never *correctness of the mapping*. That makes §11.4 the only
   gate for the autorouter's signature failure mode, so it is promoted from
   advisory to blocking below.
4. **Routing evals — BLOCKING pre-ship gate (M2), not advisory.** Because no
   static check catches a mis-route, 0.5.0 does not ship until this passes, with
   the run recorded:
   - **Full per-mode coverage:** ≥3 in-scope natural-language prompts for
     *every* mode (not just "popular" ones) + ≥3 deliberately out-of-scope
     prompts, run against a fresh session per host with the block installed.
   - **Pass bar:** ≥8/10 correct route per host, **and zero** false-positive
     routes on the out-of-scope prompts. Out-of-scope false positives are hard
     release blockers — an over-eager router is worse than no router.
   - **Recorded transcripts:** save each run (prompt → routed mode) as a
     committed artifact under `test/routing-evals/<host>-<version>.md`, so the
     gate is auditable and re-runnable on the next mode addition, not a one-off
     human judgment that evaporates.
   - **Hosts:** run on every host we can drive (Claude Code, Codex, Cursor-
     project at minimum, §12 Step 6); a host we cannot eval ships its block only
     behind its capability flag (§5).

---

## 12. Rollout plan

| Step | Deliverable |
|---|---|
| 0 | **Done (B2 pass).** `validate-skill-pack.mjs` iterates `skills/*/` (was a hardcoded six); README "Visible Skills" table lists all eight modes + a validator guard so it can't drift again. Prereq for the §11.3 set-equality check. |
| 1 | `bin/lazyweb-hosts.sh`. **Partly extraction, partly net-new — not "no behavior change":** `host_skills_root()` / `host_detected()` are lifted verbatim from `setup` (true refactor, no behavior change); `host_instruction_file()` / `host_routable()` are **new code** with no precedent in `setup`, and they carry *all* the host-verification risk (§13 Q4, Rule 0). Land the extraction with `setup` unchanged in behavior, then add the new functions with their own tests. |
| 2 | `router/ROUTER.template.md` (bare-cell table + `{{ACT_PREAMBLE}}`) + `route:` frontmatter on all 8 skills + the §11.3 structural sync check. |
| 2b | **Scrub mode bodies for host portability (M4).** Replace the four "ask ONE AskUserQuestion" prose instructions with host-neutral phrasing ("ask the user one short clarifying question"), matching the §4.2 ambiguity language. Add a `validate-skill-pack.mjs` assertion that **no mode-body prose** (outside `allowed-tools:` frontmatter) names a Claude-only tool, so a new mode can't reintroduce the leak. |
| 3 | `bin/lazyweb-router` (install/remove/status/render/refresh/decline) + unit tests. |
| 4 | `setup` integration: `--router/--no-router`, interactive prompt, refresh hook in the update path. |
| 5 | Root `SKILL.md`: Autorouter check step (§7.2). README: "Autorouter" + "Team install" sections, including a copy-paste block for unsupported hosts (the `render` command output). |
| 6 | Routing evals (blocking gate, §11.4) on Claude Code + Codex + Cursor-project; record transcripts under `test/routing-evals/`; fix wording until every host passes ≥8/10 with zero out-of-scope false positives. |
| 6b | **Host-coverage verification (M3).** Empirically confirm the global-file behavior of Kiro, Factory, Slate, Hermes (§13 Q4). Each host that passes flips its capability flag on and ships user-level in 0.5.0; each that fails (or can't be verified in time) ships **project-fallback only**, and §1/§5/§8 are updated to state exactly which hosts are user-level vs project-level at release. 0.5.0 ships with this table *resolved*, not "TBD" — the brief's "all other coding agents" is answered by a documented per-host stance, not silence. |
| 7 | Bump VERSION → 0.5.0; update server-side MCP instructions' published version. Ship. |
| 8 | Post-ship: watch `router_*` events + the cohort mode-invocation lift (router-installed vs not) for 30 days; revisit the §9 metric. |

---

## 13. Open questions (decide before step 4)

1. **Codex skills overlap.** Codex now implicitly invokes skills from
   description matching and reads `~/.agents/skills` (cross-vendor dir). Do
   we also move/symlink our Codex skills there (currently `~/.codex/skills`)?
   The router block makes this non-blocking, but worth a follow-up.
2. ~~**`entry:"autorouter"` plumbing.**~~ **Resolved (S5):** rejected the
   block-line tag — it depends on agent discipline the metric can't verify.
   Attribution is cohort-based on install state (router-installed vs not), with
   server-side stamping via the `/lazyweb` root skill if per-session attribution
   is ever needed. No client-carried tag.
3. **Enabling Antigravity + Gemini CLI as routable hosts (B1 follow-up).** Both
   are router-excluded today because `setup` installs no skills for them (§5).
   Enabling either means (a) `setup` installs skill files to a real skills root
   for that host, then (b) `host_instruction_file()` targets the right file —
   `~/.gemini/GEMINI.md` for Gemini CLI (honoring a remapped `context.fileName`
   from `~/.gemini/settings.json`), and *verified* Antigravity behavior (does it
   even read `GEMINI.md`? it is a distinct product). Recommend: do the Gemini
   CLI skills-install first (cheap, well-documented file), defer Antigravity
   until its global-file behavior is confirmed. Until then both correctly
   render nothing (§11.2).
4. **Kiro/Factory/Slate/Hermes capability flags** — confirm each host's
   global-file behavior empirically before flipping any of them on (default
   off ⇒ project fallback, §5). These hosts *do* install skills, so their
   read-path resolves once the flag is on — they are the safe file-path hosts;
   Antigravity/Gemini (Q3) are the ones with no files at all.
