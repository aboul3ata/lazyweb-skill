import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, lstatSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync, mkdirSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");
const setup = path.join(root, "setup");

function makeExecutable(file, body) {
  writeFileSync(file, body, { mode: 0o755 });
}

function runSetup(home, fakeBin) {
  return spawnSync("bash", [setup, "--host", "auto", "--quiet"], {
    cwd: root,
    encoding: "utf8",
    env: {
      ...process.env,
      HOME: home,
      PATH: `${fakeBin}:/usr/bin:/bin:/usr/sbin:/sbin`,
      LAZYWEB_MCP_TOKEN: "11111111-1111-4111-8111-111111111111",
      LAZYWEB_MCP_URL: "https://lazyweb.example.com/mcp",
      CODEX_HOME: path.join(home, ".codex")
    }
  });
}

test("setup installs visible skills and direct MCP config into detected local clients", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "lazyweb-setup-"));
  const home = path.join(dir, "home");
  const fakeBin = path.join(dir, "bin");
  mkdirSync(fakeBin, { recursive: true });
  mkdirSync(path.join(home, ".cursor"), { recursive: true });
  mkdirSync(path.join(home, ".gemini", "antigravity"), { recursive: true });

  symlinkSync(process.execPath, path.join(fakeBin, "node"));
  makeExecutable(path.join(fakeBin, "codex"), "#!/usr/bin/env sh\nexit 0\n");
  makeExecutable(path.join(fakeBin, "claude"), `#!/usr/bin/env sh\nprintf '%s\\n' "$*" >> "${dir}/claude.log"\nexit 0\n`);

  try {
    const first = runSetup(home, fakeBin);
    assert.equal(first.status, 0, first.stderr || first.stdout);
    assert.match(first.stdout, /Welcome to Lazyweb/);
    assert.match(first.stdout, /Hey, Ali here through your agent/);
    assert.match(first.stdout, /Ask what the main Lazyweb usage modes are/);
    assert.match(first.stdout, /Ask for lite design research/);
    assert.match(first.stdout, /Ask for deep design research/);
    assert.match(first.stdout, /Ask for quick search before designing/);
    assert.match(first.stdout, /lazyweb_get_workflows/);
    assert.match(first.stdout, /first run Lazyweb capabilities/);
    assert.match(first.stdout, /Do not call lazyweb_get_flows for the first-run capability guide/);
    const second = runSetup(home, fakeBin);
    assert.equal(second.status, 0, second.stderr || second.stdout);

    const expectedSkillRoots = [
      path.join(home, ".codex", "skills"),
      path.join(home, ".claude", "skills"),
      path.join(home, ".cursor", "skills")
    ];
    for (const skillsRoot of expectedSkillRoots) {
      for (const skillName of [
        "lazyweb",
        "lazyweb-design",
        "lazyweb-quick-search",
        "lazyweb-update"
      ]) {
        const skillPath = path.join(skillsRoot, skillName, "SKILL.md");
        assert.ok(existsSync(skillPath), `missing installed skill ${skillPath}`);
        if (skillName === "lazyweb") {
          assert.ok(lstatSync(skillPath).isSymbolicLink(), "root lazyweb SKILL.md should be symlinked for updates");
        } else {
          assert.ok(lstatSync(path.dirname(skillPath)).isSymbolicLink(), `${skillName} should be symlinked for updates`);
        }
      }

      for (const oldSkillName of [
        "lazyweb-design-research",
        "lazyweb-quick-references",
        "lazyweb-paywall-optimization",
        "lazyweb-signup-optimization",
        "lazyweb-optimize-paywall",
        "lazyweb-deep-design-research",
        "lazyweb-optimize-sign-up",
        "lazyweb-design-create",
        "lazyweb-ab-test-research",
        "lazyweb-design-best-practices",
        "lazyweb-design-brainstorm",
        "lazyweb-design-improve",
        "lazyweb-lite-design-research",
        "lazyweb-paywall-cta"
      ]) {
        const staleDir = path.join(skillsRoot, oldSkillName);
        mkdirSync(staleDir, { recursive: true });
        writeFileSync(path.join(staleDir, "SKILL.md"), "stale");
      }
    }

    const cleanup = runSetup(home, fakeBin);
    assert.equal(cleanup.status, 0, cleanup.stderr || cleanup.stdout);
    for (const skillsRoot of expectedSkillRoots) {
      for (const oldSkillName of [
        "lazyweb-design-research",
        "lazyweb-quick-references",
        "lazyweb-paywall-optimization",
        "lazyweb-signup-optimization",
        "lazyweb-optimize-paywall",
        "lazyweb-deep-design-research",
        "lazyweb-optimize-sign-up",
        "lazyweb-design-create",
        "lazyweb-ab-test-research",
        "lazyweb-design-best-practices",
        "lazyweb-design-brainstorm",
        "lazyweb-design-improve",
        "lazyweb-lite-design-research",
        "lazyweb-paywall-cta"
      ]) {
        assert.equal(existsSync(path.join(skillsRoot, oldSkillName)), false, `${oldSkillName} should be cleaned up from ${skillsRoot}`);
      }
    }

    assert.equal(readFileSync(path.join(home, ".lazyweb", "lazyweb_mcp_token"), "utf8").trim(), "11111111-1111-4111-8111-111111111111");
    assert.ok(existsSync(path.join(home, ".lazyweb", "bin", "lazyweb-context-detect")));
    assert.ok(existsSync(path.join(home, ".lazyweb", "bin", "lazyweb-update")));

    const codexConfig = readFileSync(path.join(home, ".codex", "config.toml"), "utf8");
    assert.match(codexConfig, /\[mcp_servers\.lazyweb\]/);
    assert.match(codexConfig, /mcp-remote https:\/\/lazyweb\.example\.com\/mcp/);
    assert.doesNotMatch(codexConfig, /plugins\."lazyweb@lazyweb"/);

    const cursorConfig = JSON.parse(readFileSync(path.join(home, ".cursor", "mcp.json"), "utf8"));
    assert.equal(cursorConfig.mcpServers.lazyweb.url, "https://lazyweb.example.com/mcp");
    assert.equal(cursorConfig.mcpServers.lazyweb.headers.Authorization, "Bearer 11111111-1111-4111-8111-111111111111");

    const antigravityConfig = JSON.parse(readFileSync(path.join(home, ".gemini", "antigravity", "mcp_config.json"), "utf8"));
    assert.equal(antigravityConfig.mcpServers.lazyweb.serverUrl, "https://lazyweb.example.com/mcp");
    assert.equal(antigravityConfig.mcpServers.lazyweb.url, undefined);

    const claudeLog = readFileSync(path.join(dir, "claude.log"), "utf8");
    assert.match(claudeLog, /mcp remove -s user lazyweb/);
    assert.match(claudeLog, /mcp add --transport http --scope user lazyweb https:\/\/lazyweb\.example\.com\/mcp --header Authorization: Bearer 11111111-1111-4111-8111-111111111111/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

function runSetupHost(home, fakeBin, host, { quiet = false } = {}) {
  const args = [setup, "--host", host];
  if (quiet) args.push("--quiet");
  return spawnSync("bash", args, {
    cwd: root,
    encoding: "utf8",
    env: {
      ...process.env,
      HOME: home,
      PATH: `${fakeBin}:/usr/bin:/bin:/usr/sbin:/sbin`,
      LAZYWEB_MCP_TOKEN: "11111111-1111-4111-8111-111111111111",
      LAZYWEB_MCP_URL: "https://lazyweb.example.com/mcp",
      CODEX_HOME: path.join(home, ".codex")
    }
  });
}

test("setup verifies the prune: removes legacy + future-rename skill dirs and prints a summary", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "lazyweb-setup-prune-"));
  const home = path.join(dir, "home");
  const fakeBin = path.join(dir, "bin");
  const skillsRoot = path.join(home, ".claude", "skills");
  mkdirSync(fakeBin, { recursive: true });
  mkdirSync(skillsRoot, { recursive: true });
  symlinkSync(process.execPath, path.join(fakeBin, "node"));
  makeExecutable(path.join(fakeBin, "claude"), "#!/usr/bin/env sh\nexit 0\n");

  // A known retired dir from the hardcoded legacy list.
  const legacyDir = path.join(skillsRoot, "lazyweb-design-research");
  mkdirSync(legacyDir, { recursive: true });
  writeFileSync(path.join(legacyDir, "SKILL.md"), "stale");
  // A lazyweb-* dir NOT in the legacy list — the sweep must still catch it.
  const futureDir = path.join(skillsRoot, "lazyweb-some-future-skill");
  mkdirSync(futureDir, { recursive: true });
  writeFileSync(path.join(futureDir, "SKILL.md"), "stale");

  try {
    const result = runSetupHost(home, fakeBin, "claude", { quiet: false });
    assert.equal(result.status, 0, result.stderr || result.stdout);

    // Both stale dirs gone.
    assert.equal(existsSync(legacyDir), false, "legacy skill dir should be pruned");
    assert.equal(existsSync(futureDir), false, "future-rename skill dir should be pruned");

    // Focused set installed.
    for (const skillName of ["lazyweb", "lazyweb-design", "lazyweb-quick-search", "lazyweb-update"]) {
      assert.ok(existsSync(path.join(skillsRoot, skillName, "SKILL.md")), `missing ${skillName}`);
    }

    // Human-visible prune summary (non-quiet run).
    assert.match(result.stdout, /removed stale skill: lazyweb-design-research/);
    assert.match(result.stdout, /removed stale skill: lazyweb-some-future-skill/);
    assert.match(result.stdout, /stale skills remaining: none/);
    assert.doesNotMatch(result.stdout, /WARNING: stale Lazyweb skill dirs/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("setup purges retired distribution channels: legacy ~/.agents/skills root and the Claude Code plugin install", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "lazyweb-setup-legacy-"));
  const home = path.join(dir, "home");
  const fakeBin = path.join(dir, "bin");
  mkdirSync(fakeBin, { recursive: true });
  symlinkSync(process.execPath, path.join(fakeBin, "node"));
  makeExecutable(path.join(fakeBin, "claude"), "#!/usr/bin/env sh\nexit 0\n");

  // Legacy cross-agent root: the installer never writes here anymore, so even
  // `lazyweb` itself is stale. A non-lazyweb neighbor must survive.
  const agentsRoot = path.join(home, ".agents", "skills");
  for (const name of ["lazyweb", "lazyweb-design-improve", "lazyweb-quick-references", "free-trial-best-practices"]) {
    mkdirSync(path.join(agentsRoot, name), { recursive: true });
    writeFileSync(path.join(agentsRoot, name, "SKILL.md"), "stale");
  }

  // Retired Claude Code plugin install: registration + cache + marketplace.
  const pluginsDir = path.join(home, ".claude", "plugins");
  const cacheDir = path.join(pluginsDir, "cache", "lazyweb", "lazyweb", "0.1.1", "skills", "lazyweb-design-improve");
  mkdirSync(cacheDir, { recursive: true });
  writeFileSync(path.join(cacheDir, "SKILL.md"), "stale");
  const marketplaceDir = path.join(pluginsDir, "marketplaces", "lazyweb");
  mkdirSync(marketplaceDir, { recursive: true });
  writeFileSync(
    path.join(pluginsDir, "installed_plugins.json"),
    JSON.stringify({
      version: 2,
      plugins: {
        "lazyweb@lazyweb": [{ scope: "user", installPath: cacheDir, version: "0.1.1" }],
        "other@somewhere": [{ scope: "user", installPath: path.join(pluginsDir, "cache", "other"), version: "1.0.0" }]
      }
    }, null, 2)
  );
  writeFileSync(
    path.join(pluginsDir, "known_marketplaces.json"),
    JSON.stringify({
      lazyweb: {
        source: { source: "git", url: "https://github.com/aboul3ata/lazyweb-skill.git" },
        installLocation: marketplaceDir
      },
      "claude-plugins-official": {
        source: { source: "github", repo: "anthropics/claude-plugins-official" },
        installLocation: path.join(pluginsDir, "marketplaces", "claude-plugins-official")
      }
    }, null, 2)
  );

  try {
    const result = runSetupHost(home, fakeBin, "claude", { quiet: false });
    assert.equal(result.status, 0, result.stderr || result.stdout);

    // Legacy root: every lazyweb dir gone, unrelated neighbor untouched.
    for (const name of ["lazyweb", "lazyweb-design-improve", "lazyweb-quick-references"]) {
      assert.equal(existsSync(path.join(agentsRoot, name)), false, `${name} should be purged from ~/.agents/skills`);
    }
    assert.ok(existsSync(path.join(agentsRoot, "free-trial-best-practices")), "non-lazyweb skill must survive the legacy-root sweep");

    // Plugin: cache + marketplace dirs gone.
    assert.equal(existsSync(path.join(pluginsDir, "cache", "lazyweb")), false, "plugin cache should be deleted");
    assert.equal(existsSync(marketplaceDir), false, "plugin marketplace checkout should be deleted");

    // Registration surgically removed; unrelated plugin + marketplace survive.
    const installed = JSON.parse(readFileSync(path.join(pluginsDir, "installed_plugins.json"), "utf8"));
    assert.equal(installed.plugins["lazyweb@lazyweb"], undefined, "lazyweb@lazyweb should be deregistered");
    assert.ok(installed.plugins["other@somewhere"], "unrelated plugin registration must survive");
    const known = JSON.parse(readFileSync(path.join(pluginsDir, "known_marketplaces.json"), "utf8"));
    assert.equal(known.lazyweb, undefined, "lazyweb marketplace should be deregistered");
    assert.ok(known["claude-plugins-official"], "unrelated marketplace must survive");

    // Human-visible summary lines.
    assert.match(result.stdout, /removed stale skill: lazyweb \(/);
    assert.match(result.stdout, /removed legacy Claude Code plugin registration: lazyweb@lazyweb/);
    assert.match(result.stdout, /removed legacy Claude Code plugin marketplace: lazyweb/);
    assert.doesNotMatch(result.stderr, /WARNING: could not fully remove/);

    // Idempotent: a second run finds nothing to do and still succeeds.
    const second = runSetupHost(home, fakeBin, "claude", { quiet: false });
    assert.equal(second.status, 0, second.stderr || second.stdout);
    assert.doesNotMatch(second.stdout, /removed legacy Claude Code plugin/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("setup leaves a lazyweb-named marketplace alone when it does not point at lazyweb-skill", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "lazyweb-setup-foreign-mp-"));
  const home = path.join(dir, "home");
  const fakeBin = path.join(dir, "bin");
  mkdirSync(fakeBin, { recursive: true });
  symlinkSync(process.execPath, path.join(fakeBin, "node"));
  makeExecutable(path.join(fakeBin, "claude"), "#!/usr/bin/env sh\nexit 0\n");

  const pluginsDir = path.join(home, ".claude", "plugins");
  const marketplaceDir = path.join(pluginsDir, "marketplaces", "lazyweb");
  mkdirSync(marketplaceDir, { recursive: true });
  writeFileSync(
    path.join(pluginsDir, "known_marketplaces.json"),
    JSON.stringify({
      lazyweb: {
        source: { source: "git", url: "https://github.com/someone-else/unrelated-repo.git" },
        installLocation: marketplaceDir
      }
    }, null, 2)
  );

  try {
    const result = runSetupHost(home, fakeBin, "claude", { quiet: true });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const known = JSON.parse(readFileSync(path.join(pluginsDir, "known_marketplaces.json"), "utf8"));
    assert.ok(known.lazyweb, "foreign lazyweb-named marketplace must survive");
    assert.ok(existsSync(marketplaceDir), "foreign marketplace checkout must survive");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// --- Integrity marker (~/.lazyweb/INTEGRITY) — H5 Phase 0 producer ---

// Compute the expected skill-set hash the way setup's installed_skill_set_hash
// does: sha256 over the sorted, unique canonical lazyweb-* basenames shipped in
// $ROOT/skills. We shell out so the test tracks the real `shasum` output.
function expectedSetSha12() {
  const names = readdirSync(path.join(root, "skills"))
    .filter((n) => n.startsWith("lazyweb-"))
    .sort()
    .filter((n, i, a) => a.indexOf(n) === i);
  const listing = names.join("\n") + "\n";
  const out = spawnSync("shasum", ["-a", "256"], { input: listing, encoding: "utf8" });
  return out.stdout.trim().split(/\s+/)[0].slice(0, 12);
}

test("install_integrity_marker writes a well-formed lw1.<sha40>.<ver>.<set12> line for a git checkout", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "lazyweb-setup-integrity-"));
  const home = path.join(dir, "home");
  const fakeBin = path.join(dir, "bin");
  mkdirSync(fakeBin, { recursive: true });
  symlinkSync(process.execPath, path.join(fakeBin, "node"));
  makeExecutable(path.join(fakeBin, "claude"), "#!/usr/bin/env sh\nexit 0\n");

  try {
    // Real setup runs inside the repo's git checkout ($ROOT == root).
    const result = runSetupHost(home, fakeBin, "claude", { quiet: true });
    assert.equal(result.status, 0, result.stderr || result.stdout);

    const markerPath = path.join(home, ".lazyweb", "INTEGRITY");
    assert.ok(existsSync(markerPath), "INTEGRITY marker should be written");
    const line = readFileSync(markerPath, "utf8").trimEnd();

    // lw1.<40-hex sha>.<version>.<12-hex set>
    const m = /^lw1\.([0-9a-f]{40})\.([^.\s][^.]*(?:\.[^.]+)*)\.([0-9a-f]{12})$/.exec(line);
    assert.ok(m, `marker is well-formed: ${line}`);

    // SHA matches this checkout's HEAD.
    const head = spawnSync("git", ["-C", root, "rev-parse", "HEAD"], { encoding: "utf8" }).stdout.trim();
    assert.equal(m[1], head, "marker SHA matches git HEAD");

    // Version matches VERSION file.
    const ver = readFileSync(path.join(root, "VERSION"), "utf8").trim();
    assert.equal(m[2], ver, "marker version matches VERSION");

    // Set-hash matches the canonical shipped lazyweb-* set.
    assert.equal(m[3], expectedSetSha12(), "marker set-hash matches shipped skill set");

    // Single line, no `nogit` for a real checkout.
    assert.ok(!line.includes("nogit"), "git checkout must not emit nogit");
    assert.equal(readFileSync(markerPath, "utf8").split("\n").filter(Boolean).length, 1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("install_integrity_marker writes lw1.nogit.<ver>.<set12> when $ROOT has no .git", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "lazyweb-setup-nogit-"));
  const home = path.join(dir, "home");
  const fakeBin = path.join(dir, "bin");
  // A throwaway $ROOT copy with VERSION + skills/ but NO .git.
  const fakeRoot = path.join(dir, "root");
  mkdirSync(fakeBin, { recursive: true });
  symlinkSync(process.execPath, path.join(fakeBin, "node"));
  // Build just enough of a $ROOT for the marker function: VERSION + skills/,
  // and deliberately NO .git directory.
  mkdirSync(fakeRoot, { recursive: true });
  writeFileSync(path.join(fakeRoot, "VERSION"), readFileSync(path.join(root, "VERSION"), "utf8"));
  mkdirSync(path.join(fakeRoot, "skills"), { recursive: true });
  for (const s of ["lazyweb-design", "lazyweb-quick-search", "lazyweb-update", "lazyweb-design-create"]) {
    mkdirSync(path.join(fakeRoot, "skills", s), { recursive: true });
  }

  try {
    // Source the marker functions from setup and run them against the no-git
    // $ROOT, so we exercise the real `case`-based git/nogit branch.
    const script = `
      set -euo pipefail
      ROOT="${fakeRoot}"
      HOME="${home}"
      has_cmd() { command -v "$1" >/dev/null 2>&1; }
      log() { :; }
      # Extract the two functions verbatim from setup so the test tracks the
      # shipped implementation (no duplicated logic to drift).
      eval "$(sed -n '/^installed_skill_set_hash() {/,/^}/p' "${setup}")"
      eval "$(sed -n '/^install_integrity_marker() {/,/^}/p' "${setup}")"
      install_integrity_marker
      cat "$HOME/.lazyweb/INTEGRITY"
    `;
    const out = spawnSync("bash", ["-c", script], { encoding: "utf8" });
    assert.equal(out.status, 0, out.stderr || out.stdout);
    const line = out.stdout.trim();

    const ver = readFileSync(path.join(root, "VERSION"), "utf8").trim();
    const m = /^lw1\.nogit\.([^.\s][^.]*(?:\.[^.]+)*)\.([0-9a-f]{12})$/.exec(line);
    assert.ok(m, `nogit marker is well-formed: ${line}`);
    assert.equal(m[1], ver, "nogit marker carries the real version");
    assert.match(m[2], /^[0-9a-f]{12}$/, "nogit marker carries a 12-hex set-hash");
    // Never fabricate a SHA.
    assert.ok(!/[0-9a-f]{40}/.test(line), "nogit marker must not contain a 40-hex SHA");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("installed_skill_set_hash is deterministic and matches the shipped focused set", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "lazyweb-setsha-"));
  try {
    const run = () => {
      const out = spawnSync(
        "bash",
        [
          "-c",
          `set -euo pipefail
           ROOT="${root}"
           has_cmd() { command -v "$1" >/dev/null 2>&1; }
           eval "$(sed -n '/^installed_skill_set_hash() {/,/^}/p' "${setup}")"
           installed_skill_set_hash`,
        ],
        { encoding: "utf8" }
      );
      assert.equal(out.status, 0, out.stderr || out.stdout);
      return out.stdout.trim();
    };
    const a = run();
    const b = run();
    assert.equal(a, b, "skill-set hash is stable across invocations");
    assert.match(a, /^[0-9a-f]{64}$/, "skill-set hash is a full sha256");
    assert.equal(a.slice(0, 12), expectedSetSha12(), "first 12 hex match the canonical shipped set");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("releases.json parses, has schema lw-releases-1, and contains the current HEAD entry", () => {
  const data = JSON.parse(readFileSync(path.join(root, "releases.json"), "utf8"));
  assert.equal(data.schema, "lw-releases-1");
  assert.ok(Array.isArray(data.releases) && data.releases.length > 0, "releases array non-empty");

  const head = spawnSync("git", ["-C", root, "rev-parse", "HEAD"], { encoding: "utf8" }).stdout.trim();
  const ver = readFileSync(path.join(root, "VERSION"), "utf8").trim();

  // Every entry is well-shaped.
  const seen = new Set();
  for (const r of data.releases) {
    assert.match(r.sha, /^[0-9a-f]{40}$/, `entry sha is 40-hex: ${r.sha}`);
    assert.ok(typeof r.version === "string" && r.version.length, "entry has a version");
    assert.ok(typeof r.released_at === "string" && r.released_at.length, "entry has released_at");
    // expected_set is a 64-hex sha256 or null (older backfilled entries).
    assert.ok(r.expected_set === null || /^[0-9a-f]{64}$/.test(r.expected_set), `entry set ok: ${r.expected_set}`);
    assert.ok(!seen.has(r.sha), `no duplicate sha: ${r.sha}`);
    seen.add(r.sha);
  }

  // The current main HEAD must be present with the right version + a real set.
  const headEntry = data.releases.find((r) => r.sha === head);
  assert.ok(headEntry, `releases.json contains the current HEAD ${head}`);
  assert.equal(headEntry.version, ver, "HEAD entry version matches VERSION");
  assert.match(headEntry.expected_set, /^[0-9a-f]{64}$/, "HEAD entry has a real expected_set");

  // And that expected_set must match what setup actually stamps for HEAD.
  const out = spawnSync(
    "bash",
    [
      "-c",
      `set -euo pipefail
       ROOT="${root}"
       has_cmd() { command -v "$1" >/dev/null 2>&1; }
       eval "$(sed -n '/^installed_skill_set_hash() {/,/^}/p' "${setup}")"
       installed_skill_set_hash`,
    ],
    { encoding: "utf8" }
  );
  assert.equal(out.stdout.trim(), headEntry.expected_set, "HEAD expected_set matches the producer hash");
});

test("setup reports manual MCP config when no local clients are detected", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "lazyweb-setup-empty-"));
  const home = path.join(dir, "home");
  const fakeBin = path.join(dir, "bin");
  mkdirSync(fakeBin, { recursive: true });
  symlinkSync(process.execPath, path.join(fakeBin, "node"));
  try {
    const result = runSetup(home, fakeBin);
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.match(result.stdout, /No supported local coding clients were detected/);
    assert.match(result.stdout, /Manual MCP config/);
    assert.match(result.stdout, /https:\/\/lazyweb\.example\.com\/mcp/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
