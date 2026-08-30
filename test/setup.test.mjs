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
      CODEX_HOME: path.join(home, ".codex"),
      CODEX_THREAD_ID: "",
      CODEX_CI: "",
      CODEX_SHELL: "",
      CLAUDECODE: "",
      CLAUDE_CODE_ENTRYPOINT: ""
    }
  });
}

function runSetupWithoutToken(home, fakeBin, extraEnv = {}) {
  return spawnSync("bash", [setup, "--host", "auto", "--quiet", "--no-auto-update"], {
    cwd: root,
    encoding: "utf8",
    env: {
      ...process.env,
      HOME: home,
      PATH: `${fakeBin}:/usr/bin:/bin:/usr/sbin:/sbin`,
      LAZYWEB_MCP_TOKEN: "",
      LAZYWEB_MCP_URL: "https://lazyweb.example.com/mcp",
      LAZYWEB_INSTALL_TOKEN_URL: "https://lazyweb.example.com/api/mcp/install-token",
      CODEX_HOME: path.join(home, ".codex"),
      CODEX_THREAD_ID: "",
      CODEX_CI: "",
      CODEX_SHELL: "",
      CLAUDECODE: "",
      CLAUDE_CODE_ENTRYPOINT: "",
      ...extraEnv
    }
  });
}

function runAttributedSetup(home, fakeBin, extraEnv = {}) {
  return spawnSync("bash", [
    setup,
    "--host", "auto",
    "--quiet",
    "--no-auto-update",
    "--install-attribution",
    "--user-goal", "Find stronger onboarding examples",
    "--discovery-path", "reddit",
    "--discovery-context", "The agent opened a Reddit thread recommending Lazyweb."
  ], {
    cwd: root,
    encoding: "utf8",
    env: {
      ...process.env,
      HOME: home,
      PATH: `${fakeBin}:/usr/bin:/bin:/usr/sbin:/sbin`,
      LAZYWEB_MCP_TOKEN: "11111111-1111-4111-8111-111111111111",
      LAZYWEB_MCP_URL: "https://lazyweb.example.com/mcp",
      LAZYWEB_INSTALL_TOKEN_URL: "https://lazyweb.example.com/api/mcp/install-token?install_channel=curl",
      CODEX_HOME: path.join(home, ".codex"),
      CODEX_THREAD_ID: "fresh-codex-eval",
      CLAUDECODE: "",
      ...extraEnv
    }
  });
}

test("attributed setup submits context even when an MCP token already exists", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "lazyweb-attributed-existing-token-"));
  const home = path.join(dir, "home");
  const fakeBin = path.join(dir, "bin");
  const curlLog = path.join(dir, "curl.log");
  mkdirSync(fakeBin, { recursive: true });
  mkdirSync(home, { recursive: true });
  symlinkSync(process.execPath, path.join(fakeBin, "node"));
  makeExecutable(path.join(fakeBin, "codex"), "#!/usr/bin/env sh\nexit 0\n");
  makeExecutable(path.join(fakeBin, "curl"), `#!/usr/bin/env bash
printf '%s\\n' "$*" >> "${curlLog}"
printf '%s\\n' '{"ok":true,"token":"11111111-1111-4111-8111-111111111111","userId":"11111111-1111-4111-8111-111111111111","attributionRecorded":true}' '200'
`);

  try {
    const result = runAttributedSetup(home, fakeBin);
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const installCall = readFileSync(curlLog, "utf8");
    assert.match(installCall, /Authorization: Bearer 11111111-1111-4111-8111-111111111111/);
    assert.match(installCall, /Find stronger onboarding examples/);
    assert.match(installCall, /reddit/);
    assert.match(installCall, /Reddit thread recommending Lazyweb/);
    assert.match(installCall, /journey_id/);
    assert.doesNotMatch(`${result.stdout}\n${result.stderr}`, /11111111-1111-4111-8111-111111111111|Reddit thread/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("attributed setup mints a fresh token with the same required context", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "lazyweb-attributed-fresh-token-"));
  const home = path.join(dir, "home");
  const fakeBin = path.join(dir, "bin");
  const curlLog = path.join(dir, "curl.log");
  mkdirSync(fakeBin, { recursive: true });
  mkdirSync(home, { recursive: true });
  symlinkSync(process.execPath, path.join(fakeBin, "node"));
  makeExecutable(path.join(fakeBin, "codex"), "#!/usr/bin/env sh\nexit 0\n");
  makeExecutable(path.join(fakeBin, "curl"), `#!/usr/bin/env bash
printf '%s\\n' "$*" >> "${curlLog}"
printf '%s\\n' '{"ok":true,"token":"22222222-2222-4222-8222-222222222222","userId":"22222222-2222-4222-8222-222222222222","attributionRecorded":null}' '200'
`);

  try {
    const result = runAttributedSetup(home, fakeBin, { LAZYWEB_MCP_TOKEN: "" });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const installCall = readFileSync(curlLog, "utf8");
    assert.doesNotMatch(installCall, /Authorization: Bearer/);
    assert.match(installCall, /"install_channel":"curl"/);
    assert.match(installCall, /Find stronger onboarding examples/);
    assert.match(installCall, /reddit/);
    assert.equal(
      readFileSync(path.join(home, ".lazyweb", "lazyweb_mcp_token"), "utf8").trim(),
      "22222222-2222-4222-8222-222222222222"
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("attributed setup rejects a missing user goal before changing client config", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "lazyweb-attributed-missing-goal-"));
  const home = path.join(dir, "home");
  const fakeBin = path.join(dir, "bin");
  mkdirSync(fakeBin, { recursive: true });
  mkdirSync(home, { recursive: true });
  symlinkSync(process.execPath, path.join(fakeBin, "node"));

  try {
    const result = spawnSync("bash", [
      setup,
      "--host", "auto",
      "--quiet",
      "--no-auto-update",
      "--install-attribution",
      "--discovery-path", "reddit",
      "--discovery-context", "A Reddit thread recommended Lazyweb."
    ], {
      cwd: root,
      encoding: "utf8",
      env: {
        ...process.env,
        HOME: home,
        PATH: `${fakeBin}:/usr/bin:/bin:/usr/sbin:/sbin`,
        LAZYWEB_MCP_TOKEN: "11111111-1111-4111-8111-111111111111",
        CODEX_HOME: path.join(home, ".codex")
      }
    });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /--user-goal is required/);
    assert.equal(existsSync(path.join(home, ".codex", "config.toml")), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("auto setup targets the invoking Codex host before scanning other installed clients", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "lazyweb-setup-active-codex-"));
  const home = path.join(dir, "home");
  const fakeBin = path.join(dir, "bin");
  mkdirSync(fakeBin, { recursive: true });
  mkdirSync(home, { recursive: true });
  symlinkSync(process.execPath, path.join(fakeBin, "node"));
  makeExecutable(path.join(fakeBin, "codex"), "#!/usr/bin/env sh\nexit 0\n");
  makeExecutable(path.join(fakeBin, "claude"), `#!/usr/bin/env sh\nprintf '%s\\n' "$*" >> "${dir}/claude.log"\nexit 0\n`);

  try {
    const result = spawnSync("bash", [setup, "--host", "auto", "--quiet", "--no-auto-update"], {
      cwd: root,
      encoding: "utf8",
      env: {
        ...process.env,
        HOME: home,
        PATH: `${fakeBin}:/usr/bin:/bin:/usr/sbin:/sbin`,
        LAZYWEB_MCP_TOKEN: "11111111-1111-4111-8111-111111111111",
        LAZYWEB_MCP_URL: "https://lazyweb.example.com/mcp",
        CODEX_HOME: path.join(home, ".codex"),
        CODEX_THREAD_ID: "fresh-codex-eval",
        CLAUDECODE: ""
      }
    });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.ok(existsSync(path.join(home, ".codex", "skills", "lazyweb", "SKILL.md")));
    assert.equal(existsSync(path.join(home, ".claude", "skills", "lazyweb", "SKILL.md")), false);
    assert.equal(existsSync(path.join(dir, "claude.log")), false, "Claude MCP must not be changed by a Codex-hosted install");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("an explicit active Claude host overrides ambient Codex signals", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "lazyweb-setup-active-claude-"));
  const home = path.join(dir, "home");
  const fakeBin = path.join(dir, "bin");
  mkdirSync(fakeBin, { recursive: true });
  mkdirSync(home, { recursive: true });
  symlinkSync(process.execPath, path.join(fakeBin, "node"));
  makeExecutable(path.join(fakeBin, "codex"), "#!/usr/bin/env sh\nexit 0\n");
  makeExecutable(path.join(fakeBin, "claude"), "#!/usr/bin/env sh\nexit 0\n");

  try {
    const result = spawnSync("bash", [setup, "--host", "auto", "--quiet", "--no-auto-update"], {
      cwd: root,
      encoding: "utf8",
      env: {
        ...process.env,
        HOME: home,
        PATH: `${fakeBin}:/usr/bin:/bin:/usr/sbin:/sbin`,
        LAZYWEB_MCP_TOKEN: "11111111-1111-4111-8111-111111111111",
        LAZYWEB_MCP_URL: "https://lazyweb.example.com/mcp",
        LAZYWEB_ACTIVE_HOST: "claude",
        CODEX_HOME: path.join(home, ".codex"),
        CODEX_THREAD_ID: "ambient-codex-host"
      }
    });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.ok(existsSync(path.join(home, ".claude", "skills", "lazyweb", "SKILL.md")));
    assert.equal(existsSync(path.join(home, ".codex", "skills", "lazyweb", "SKILL.md")), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("setup keeps cookie-less retries sticky and still mints a treatment setup credential", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "lazyweb-setup-mcp-pro-"));
  const home = path.join(dir, "home");
  const fakeBin = path.join(dir, "bin");
  const curlLog = path.join(dir, "curl.log");
  const attemptFile = path.join(dir, "attempt");
  const userId = "34343434-3434-4343-8343-343434343434";
  mkdirSync(fakeBin, { recursive: true });
  mkdirSync(home, { recursive: true });
  symlinkSync(process.execPath, path.join(fakeBin, "node"));
  makeExecutable(path.join(fakeBin, "curl"), `#!/usr/bin/env bash
printf '%s\\n' "$*" >> "${curlLog}"
attempt=0
[ -f "${attemptFile}" ] && attempt="$(tr -d '[:space:]' < "${attemptFile}")"
attempt=$((attempt + 1))
printf '%s\\n' "$attempt" > "${attemptFile}"
if [ "$attempt" -eq 1 ]; then
  printf '%s\\n' '{"ok":false,"message":"Lazyweb MCP setup is temporarily unavailable. Please retry."}' '503'
else
  printf '%s\\n' '{"ok":true,"token":"${userId}","userId":"${userId}","experiment_key":"mcp_new_user_paywall_v1","variant":"pro_paywall"}' '200'
fi
`);

  try {
    const first = runSetupWithoutToken(home, fakeBin);
    const second = runSetupWithoutToken(home, fakeBin);

    assert.equal(first.status, 1, first.stderr || first.stdout);
    assert.match(first.stderr, /setup is temporarily unavailable/i);
    assert.equal(second.status, 0, second.stderr || second.stdout);
    assert.equal(
      readFileSync(path.join(home, ".lazyweb", "lazyweb_mcp_token"), "utf8").trim(),
      userId
    );
    assert.doesNotMatch(`${first.stderr}\n${second.stderr}`, /MCP Pro is required|Upgrade securely/);
    assert.doesNotMatch(`${first.stderr}\n${second.stderr}`, /SyntaxError|Failed to create Lazyweb MCP token/);

    const installIdPath = path.join(home, ".lazyweb", "install_id");
    const cookieJarPath = path.join(home, ".lazyweb", "install_cookies");
    assert.match(readFileSync(installIdPath, "utf8").trim(), /^[0-9a-f]{8}-[0-9a-f-]{27}$/);
    assert.ok(existsSync(cookieJarPath), "treatment cookie jar must survive for a sticky retry");
    assert.equal(existsSync(path.join(home, ".lazyweb", "lazyweb_mcp_token")), true);

    const installId = readFileSync(installIdPath, "utf8").trim();
    const calls = readFileSync(curlLog, "utf8").trim().split("\n")
      .filter((call) => call.includes("/api/mcp/install-token"));
    assert.equal(calls.length, 2);
    for (const call of calls) {
      assert.match(call, new RegExp(`X-Lazyweb-Install-Id: ${installId}`));
      assert.ok(
        call.includes(`{"install_id":"${installId}"}`),
        "install_id must ride in the JSON body (the server's durable-identity contract)"
      );
      assert.match(call, /install_cookies/);
      assert.doesNotMatch(call, /(?:^|\s)-f(?:sS)?(?:\s|$)/);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("setup reports the actual HTTP status when token creation returns a non-JSON error", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "lazyweb-setup-http-error-"));
  const home = path.join(dir, "home");
  const fakeBin = path.join(dir, "bin");
  mkdirSync(fakeBin, { recursive: true });
  mkdirSync(home, { recursive: true });
  symlinkSync(process.execPath, path.join(fakeBin, "node"));
  makeExecutable(path.join(fakeBin, "curl"), `#!/usr/bin/env bash
printf '%s\\n' 'upstream unavailable' '402'
`);

  try {
    const result = runSetupWithoutToken(home, fakeBin);
    assert.equal(result.status, 1, result.stderr || result.stdout);
    assert.match(result.stderr, /Lazyweb MCP setup failed with HTTP 402\./);
    assert.doesNotMatch(result.stderr, /HTTP https:\/\//);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("setup accepts a valid token from any successful 2xx response", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "lazyweb-setup-2xx-token-"));
  const home = path.join(dir, "home");
  const fakeBin = path.join(dir, "bin");
  const userId = "56565656-5656-4656-8656-565656565656";
  mkdirSync(fakeBin, { recursive: true });
  mkdirSync(home, { recursive: true });
  symlinkSync(process.execPath, path.join(fakeBin, "node"));
  makeExecutable(path.join(fakeBin, "curl"), `#!/usr/bin/env bash
printf '%s\\n' '{"ok":true,"token":"${userId}","userId":"${userId}"}' '201'
`);

  try {
    const result = runSetupWithoutToken(home, fakeBin);
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.equal(
      readFileSync(path.join(home, ".lazyweb", "lazyweb_mcp_token"), "utf8").trim(),
      userId
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("setup mints a plan-bound token without claiming the token is free", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "lazyweb-setup-plan-token-"));
  const home = path.join(dir, "home");
  const fakeBin = path.join(dir, "bin");
  const curlLog = path.join(dir, "curl.log");
  const userId = "12121212-1212-4121-8121-121212121212";
  mkdirSync(fakeBin, { recursive: true });
  mkdirSync(home, { recursive: true });
  symlinkSync(process.execPath, path.join(fakeBin, "node"));
  makeExecutable(path.join(fakeBin, "curl"), `#!/usr/bin/env bash
printf '%s\\n' "$*" >> "${curlLog}"
case "$*" in
  *"/api/mcp/install-token"*) printf '%s\\n' '{"ok":true,"token":"${userId}","userId":"${userId}"}' '200' ;;
  *) exit 0 ;;
esac
`);

  try {
    const result = runSetupWithoutToken(home, fakeBin);
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.equal(
      readFileSync(path.join(home, ".lazyweb", "lazyweb_mcp_token"), "utf8").trim(),
      userId
    );
    assert.doesNotMatch(`${result.stdout}\n${result.stderr}`, /Creating a free Lazyweb MCP token/);
    const installId = readFileSync(path.join(home, ".lazyweb", "install_id"), "utf8").trim();
    const installCall = readFileSync(curlLog, "utf8").split("\n")
      .find((call) => call.includes("/api/mcp/install-token"));
    assert.ok(installCall);
    assert.match(installCall, new RegExp(`X-Lazyweb-Install-Id: ${installId}`));
    assert.ok(
      installCall.includes(`{"install_id":"${installId}"}`),
      "install_id must ride in the JSON body (the server's durable-identity contract)"
    );
    assert.match(installCall, /install_cookies/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

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

  // Pre-0.15.8 consented autorouter install: a manifest-tracked block in the
  // user's CLAUDE.md plus the stale router binary. Setup must retire it.
  mkdirSync(path.join(home, ".claude"), { recursive: true });
  mkdirSync(path.join(home, ".lazyweb", "bin"), { recursive: true });
  const migratedFile = path.join(home, ".claude", "CLAUDE.md");
  writeFileSync(
    migratedFile,
    [
      "# My own instructions",
      "",
      "Keep answers short.",
      "",
      "",
      "",
      "Stay curious.",
      "",
      "<!-- LAZYWEB:ROUTER:BEGIN — managed by Lazyweb -->",
      "## Use Lazyweb for ALL product UI work",
      "route everything",
      "<!-- LAZYWEB:ROUTER:END -->",
      ""
    ].join("\n")
  );
  writeFileSync(
    path.join(home, ".lazyweb", "router.manifest.json"),
    JSON.stringify({ targets: [{ host: "claude", file: migratedFile, created_file: false }] })
  );
  writeFileSync(path.join(home, ".lazyweb", "bin", "lazyweb-router"), "#!/usr/bin/env bash\nexit 0\n");

  try {
    const first = runSetup(home, fakeBin);
    assert.equal(first.status, 0, first.stderr || first.stdout);
    assert.doesNotMatch(
      `${first.stdout}\n${first.stderr}`,
      /11111111-1111-4111-8111-111111111111/,
      "setup output must never print the bearer credential"
    );
    assert.match(first.stdout, /Welcome to Lazyweb/);
    assert.match(first.stdout, /Hey, Ali here through your agent/);
    assert.match(first.stdout, /Use \/lazyweb to route any Lazyweb product action/);
    assert.match(first.stdout, /\/lazyweb-growth-score/);
    assert.match(first.stdout, /\/lazyweb-growth-report/);
    assert.match(first.stdout, /design improvement feedback on an existing screen or webpage/i);
    assert.match(first.stdout, /\/lazyweb-apply-design-best-practices/);
    assert.match(first.stdout, /\/lazyweb-growth-backlog/);
    assert.match(first.stdout, /lazyweb_agentic_search_finalize/);
    assert.match(first.stdout, /live tool schemas as the source of truth/);
    // The autorouter (persistent-instruction routing block + its agent-facing
    // opt-in ask) is removed: install output must never instruct an agent to
    // edit persistent instructions or run a router binary.
    assert.doesNotMatch(first.stdout, /Want me to make Lazyweb part of every product UI task\?/);
    assert.doesNotMatch(first.stdout, /lazyweb-router/);
    assert.doesNotMatch(first.stdout, /change persistent instructions/i);

    // Autorouter retirement: a manifest-tracked LAZYWEB:ROUTER block from a
    // pre-0.15.8 consented install is stripped on upgrade; everything outside
    // the markers is untouched, and the manifest + stale binary are removed.
    const migrated = readFileSync(migratedFile, "utf8");
    assert.doesNotMatch(migrated, /LAZYWEB:ROUTER/);
    assert.match(migrated, /# My own instructions/);
    assert.match(migrated, /Keep answers short\./);
    // User-authored whitespace outside the markers survives verbatim (the
    // migration normalizes only the splice seam).
    assert.match(migrated, /Keep answers short\.\n\n\n\nStay curious\./);
    assert.equal(existsSync(path.join(home, ".lazyweb", "router.manifest.json")), false);
    assert.equal(existsSync(path.join(home, ".lazyweb", "bin", "lazyweb-router")), false);
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
        "lazyweb-growth-score",
        "lazyweb-growth-report",
        "lazyweb-growth-backlog",
        "lazyweb-search-experiments",
        "lazyweb-search-flows",
        "lazyweb-search-screens",
        "lazyweb-apply-design-best-practices",
        "lazyweb-update"
      ]) {
        const skillPath = path.join(skillsRoot, skillName, "SKILL.md");
        assert.ok(existsSync(skillPath), `missing installed skill ${skillPath}`);
        if (skillName === "lazyweb") {
          assert.equal(lstatSync(skillPath).isSymbolicLink(), false, "root lazyweb SKILL.md must be a regular file so Codex catalogs it");
          assert.equal(
            readFileSync(skillPath, "utf8"),
            readFileSync(path.join(root, "skills", "lazyweb", "SKILL.md"), "utf8"),
            "the installed router must come from the published skills/lazyweb package"
          );
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
        "lazyweb-paywall-cta",
        "lazyweb-growth-experiment",
        "lazyweb-explain-flow",
        "lazyweb-propose-ui-changes"
      ]) {
        const staleDir = path.join(skillsRoot, oldSkillName);
        mkdirSync(staleDir, { recursive: true });
        writeFileSync(path.join(staleDir, "SKILL.md"), "stale");
      }
      for (const aliasName of ["lazyweb-design", "lazyweb-quick-search", "lazyweb-growth-experiments"]) {
        const aliasDir = path.join(skillsRoot, aliasName);
        mkdirSync(aliasDir, { recursive: true });
        writeFileSync(path.join(aliasDir, "SKILL.md"), "stale alias");
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
        "lazyweb-paywall-cta",
        "lazyweb-growth-experiment",
        "lazyweb-explain-flow",
        "lazyweb-propose-ui-changes"
      ]) {
        assert.equal(existsSync(path.join(skillsRoot, oldSkillName)), false, `${oldSkillName} should be cleaned up from ${skillsRoot}`);
      }
      for (const aliasName of ["lazyweb-design", "lazyweb-quick-search", "lazyweb-growth-experiments"]) {
        const aliasSkill = path.join(skillsRoot, aliasName, "SKILL.md");
        assert.ok(existsSync(aliasSkill), `${aliasName} should remain available for an upgrading install`);
        assert.match(readFileSync(aliasSkill, "utf8"), /deprecated/i, `${aliasName} should be refreshed to the thin alias`);
      }
    }

    assert.equal(readFileSync(path.join(home, ".lazyweb", "lazyweb_mcp_token"), "utf8").trim(), "11111111-1111-4111-8111-111111111111");
    assert.ok(existsSync(path.join(home, ".lazyweb", "bin", "lazyweb-context-detect")));
    assert.ok(existsSync(path.join(home, ".lazyweb", "bin", "lazyweb-update")));

    const codexConfig = readFileSync(path.join(home, ".codex", "config.toml"), "utf8");
    assert.match(codexConfig, /\[mcp_servers\.lazyweb\]/);
    assert.match(codexConfig, /url = "https:\/\/lazyweb\.example\.com\/mcp"/);
    assert.match(codexConfig, /http_headers = \{ Authorization = "Bearer 11111111-1111-4111-8111-111111111111" \}/);
    assert.doesNotMatch(codexConfig, /mcp-remote|command = "sh"|args = \[/);
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

test("setup upgrades the legacy Codex bridge to native HTTP without clobbering neighboring config", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "lazyweb-setup-codex-native-http-"));
  const home = path.join(dir, "home");
  const fakeBin = path.join(dir, "bin");
  const codexHome = path.join(home, ".codex");
  mkdirSync(fakeBin, { recursive: true });
  mkdirSync(codexHome, { recursive: true });
  symlinkSync(process.execPath, path.join(fakeBin, "node"));
  makeExecutable(path.join(fakeBin, "codex"), "#!/usr/bin/env sh\nexit 0\n");
  writeFileSync(path.join(codexHome, "config.toml"), [
    'model = "gpt-5.4"',
    "",
    "[mcp_servers.lazyweb]",
    'command = "sh"',
    'args = ["-lc", "exec npx -y mcp-remote https://old.lazyweb.example/mcp --transport http-first"]',
    "",
    "[mcp_servers.keep_me]",
    'url = "https://example.com/mcp"',
    ""
  ].join("\n"));

  try {
    const result = runSetupHost(home, fakeBin, "codex", { quiet: true });
    assert.equal(result.status, 0, result.stderr || result.stdout);

    const codexConfig = readFileSync(path.join(codexHome, "config.toml"), "utf8");
    assert.match(codexConfig, /^model = "gpt-5\.4"/m);
    assert.match(codexConfig, /\[mcp_servers\.keep_me\]\nurl = "https:\/\/example\.com\/mcp"/);
    assert.match(codexConfig, /\[mcp_servers\.lazyweb\]\nurl = "https:\/\/lazyweb\.example\.com\/mcp"/);
    assert.match(codexConfig, /http_headers = \{ Authorization = "Bearer 11111111-1111-4111-8111-111111111111" \}/);
    assert.doesNotMatch(codexConfig, /mcp-remote|command = "sh"|args = \[/);
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
    for (const skillName of ["lazyweb", "lazyweb-growth-score", "lazyweb-growth-report", "lazyweb-growth-backlog", "lazyweb-search-experiments", "lazyweb-search-flows", "lazyweb-search-screens", "lazyweb-apply-design-best-practices", "lazyweb-update"]) {
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
  for (const s of ["lazyweb-growth-score", "lazyweb-growth-report", "lazyweb-update", "lazyweb-design-create"]) {
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

test("releases.json parses and either contains the released HEAD or permits the next unreleased version", () => {
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

  // Release automation appends the merged commit. A feature branch may carry
  // the next VERSION before that immutable release entry can exist.
  const headEntry = data.releases.find((r) => r.sha === head);
  if (!headEntry) {
    assert.notEqual(ver, data.releases[0].version, "an unlisted HEAD must carry the next unreleased VERSION");
    return;
  }
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
    assert.match(result.stdout, /token stored in the Token file above/i);
    assert.doesNotMatch(result.stdout, /11111111-1111-4111-8111-111111111111/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
