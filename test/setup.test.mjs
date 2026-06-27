import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, lstatSync, mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync, symlinkSync } from "node:fs";
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
