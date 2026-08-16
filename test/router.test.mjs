import { test } from "node:test";
import assert from "node:assert/strict";
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  symlinkSync,
  writeFileSync
} from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");
const routerBin = path.join(root, "bin", "lazyweb-router");
const packVersion = readFileSync(path.join(root, "VERSION"), "utf8").trim();

const BEGIN = "<!-- LAZYWEB:ROUTER:BEGIN";
const END = "<!-- LAZYWEB:ROUTER:END -->";
const BUDGET = 1800;

// Skill dirs that must appear in every rendered table (router-exclude: true
// opts a utility skill out — it must NOT appear).
const allSkillDirs = readdirSync(path.join(root, "skills"), { withFileTypes: true })
  .filter((e) => e.isDirectory() && existsSync(path.join(root, "skills", e.name, "SKILL.md")))
  .map((e) => e.name);
const routedSkills = [];
const excludedSkills = [];
for (const dir of allSkillDirs) {
  const fm = readFileSync(path.join(root, "skills", dir, "SKILL.md"), "utf8").match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "";
  (/^router-exclude:\s*true\s*$/m.test(fm) ? excludedSkills : routedSkills).push(dir);
}

function makeHome() {
  const dir = mkdtempSync(path.join(tmpdir(), "lazyweb-router-"));
  const home = path.join(dir, "home");
  // Populated skills roots make claude/codex/opencode routable (Rule 0).
  for (const sub of [".claude/skills/lazyweb", ".codex/skills/lazyweb", ".config/opencode/skills/lazyweb"]) {
    mkdirSync(path.join(home, sub), { recursive: true });
  }
  return home;
}

function run(home, args, opts = {}) {
  return spawnSync("bash", [routerBin, ...args], {
    encoding: "utf8",
    input: opts.input,
    env: {
      ...process.env,
      HOME: home,
      LAZYWEB_HOME: path.join(home, ".lazyweb"),
      CODEX_HOME: path.join(home, ".codex"),
      XDG_CONFIG_HOME: path.join(home, ".config"),
      PATH: `${path.dirname(process.execPath)}:/usr/bin:/bin`
    }
  });
}

function sha256(s) {
  return createHash("sha256").update(s, "utf8").digest("hex");
}

function blockOf(text) {
  const bi = text.indexOf(BEGIN);
  const ei = text.indexOf(END, bi);
  assert.ok(bi >= 0 && ei >= 0, "file should contain a complete router block");
  return text.slice(bi, ei + END.length);
}

function manifestOf(home) {
  return JSON.parse(readFileSync(path.join(home, ".lazyweb", "router.manifest.json"), "utf8"));
}

test("render emits a complete, budgeted, fully-substituted block per routable host", () => {
  const home = makeHome();
  for (const host of ["claude", "codex", "opencode"]) {
    const res = run(home, ["render", "--host", host]);
    assert.equal(res.status, 0, res.stderr);
    const block = res.stdout;
    assert.ok(block.startsWith(BEGIN), `${host}: block must start with BEGIN marker`);
    assert.match(block, new RegExp(`BEGIN v${packVersion.replace(/\./g, "\\.")}`), `${host}: BEGIN marker carries the pack version`);
    assert.ok(block.trimEnd().endsWith(END), `${host}: block must end with END marker`);
    assert.ok(!block.includes("{{"), `${host}: no unsubstituted placeholders`);
    const bytes = Buffer.byteLength(blockOf(block), "utf8");
    assert.ok(bytes <= BUDGET, `${host}: rendered block is ${bytes}B > ${BUDGET}B budget`);
    // Every routed skill exactly once; excluded utility skills absent.
    for (const skill of routedSkills) {
      const count = block.split("`" + skill + "`").length - 1;
      assert.equal(count, 1, `${host}: ${skill} must appear exactly once (found ${count})`);
    }
    for (const skill of excludedSkills) {
      if (skill === "lazyweb") continue; // the root router is the catch-all row
      assert.ok(!block.includes(skill), `${host}: router-excluded ${skill} must not appear`);
    }
    // The read-path convention is stated once, never per row (spec §4.1).
    const preambles = block.split("To act on a row").length - 1;
    assert.equal(preambles, 1, `${host}: ACT_PREAMBLE must appear exactly once`);
    // Catch-all row routes leftovers through the root skill.
    assert.match(block, /`lazyweb` \(/, `${host}: catch-all row must reference the root lazyweb skill`);
    assert.match(block, /quietly gather only relevant evidence from screens,\s+experiments,\s+flows, and growth mechanics/i);
    assert.match(block, /finalize useful selected\s+evidence into Agentic Search/i);
    assert.match(block, /broad (?:improve|improvement)[\s\S]{0,100}may\s+use (?:a )?Growth Report/i);
    assert.doesNotMatch(block, /Default to `lazyweb_generate_report`/i);
    // Tilde-form paths keep the budget independent of the username.
    assert.ok(!block.includes(home), `${host}: rendered block must not embed the absolute HOME path`);
  }
});

test("advertises design improvement through the Growth Report route", () => {
  for (const file of ["SKILL.md", path.join("skills", "lazyweb", "SKILL.md")]) {
    const text = readFileSync(path.join(root, file), "utf8");
    assert.match(text, /Improve or critique an existing design or screen\s*\|\s*`lazyweb-growth-report`/);
  }
  const readme = readFileSync(path.join(root, "README.md"), "utf8");
  assert.match(readme, /design improvements for a product screen or webpage/i);
});

test("render refuses hosts that get no skill files (Rule 0)", () => {
  const home = makeHome();
  for (const host of ["antigravity", "gemini"]) {
    const res = run(home, ["render", "--host", host]);
    assert.equal(res.status, 1, `${host} must not render`);
    assert.match(res.stderr, /not a routable host/);
  }
});

test("install creates a missing file, records the manifest, and is idempotent", () => {
  const home = makeHome();
  const target = path.join(home, ".claude", "CLAUDE.md");
  const res = run(home, ["install", "--host", "claude", "--yes"]);
  assert.equal(res.status, 0, res.stderr);
  assert.ok(existsSync(target), "CLAUDE.md should be created");
  const first = readFileSync(target, "utf8");
  const block = blockOf(first);

  const manifest = manifestOf(home);
  assert.equal(manifest.version, 1);
  const entry = manifest.targets.find((t) => t.file === target);
  assert.ok(entry, "manifest entry for the target");
  assert.equal(entry.host, "claude");
  assert.equal(entry.version, packVersion);
  assert.equal(entry.created_file, true);
  assert.equal(entry.block_sha256, sha256(block), "manifest sha must match the written block");

  const again = run(home, ["install", "--host", "claude", "--yes"]);
  assert.equal(again.status, 0, again.stderr);
  assert.equal(readFileSync(target, "utf8"), first, "install ∘ install = install (byte-identical)");
});

test("install appends to an existing file and remove restores it byte-for-byte", () => {
  const home = makeHome();
  const target = path.join(home, ".claude", "CLAUDE.md");
  const original = "# My instructions\n\nKeep being excellent.\n";
  writeFileSync(target, original);

  assert.equal(run(home, ["install", "--host", "claude", "--yes"]).status, 0);
  const installed = readFileSync(target, "utf8");
  assert.ok(installed.startsWith("# My instructions"), "user content stays first");
  assert.ok(installed.includes(BEGIN), "block appended");
  assert.equal(manifestOf(home).targets[0].created_file, false);

  assert.equal(run(home, ["remove", "--host", "claude"]).status, 0);
  assert.equal(readFileSync(target, "utf8"), original, "remove must restore the original bytes");
  assert.equal(manifestOf(home).targets.length, 0, "manifest entry dropped");
});

test("remove deletes only files the router itself created", () => {
  const home = makeHome();
  const target = path.join(home, ".claude", "CLAUDE.md");
  assert.equal(run(home, ["install", "--host", "claude", "--yes"]).status, 0);
  assert.ok(existsSync(target));
  assert.equal(run(home, ["remove", "--host", "claude"]).status, 0);
  assert.ok(!existsSync(target), "created-by-us file is deleted when only our block remains");
});

test("reinstall replaces the block in place, preserving its position", () => {
  const home = makeHome();
  const target = path.join(home, ".claude", "CLAUDE.md");
  writeFileSync(target, "before\n");
  assert.equal(run(home, ["install", "--host", "claude", "--yes"]).status, 0);
  // User moves on with life; content lands after our block.
  writeFileSync(target, readFileSync(target, "utf8") + "\nafter\n");

  assert.equal(run(home, ["install", "--host", "claude", "--yes"]).status, 0);
  const text = readFileSync(target, "utf8");
  assert.equal(text.split(BEGIN).length - 1, 1, "exactly one block");
  assert.ok(text.indexOf("before") < text.indexOf(BEGIN), "block stays after 'before'");
  assert.ok(text.indexOf(END) < text.indexOf("after"), "block stays before 'after'");
});

test("a BEGIN marker without END is corrupt: refuse with exit 2, file untouched", () => {
  const home = makeHome();
  const target = path.join(home, ".claude", "CLAUDE.md");
  const corrupt = `hello\n${BEGIN} v0.0.1 -->\nno end marker here\n`;
  writeFileSync(target, corrupt);
  const res = run(home, ["install", "--host", "claude", "--yes"]);
  assert.equal(res.status, 2);
  assert.match(res.stderr, /refusing/i);
  assert.equal(readFileSync(target, "utf8"), corrupt, "corrupt file must not be modified");
});

test("status reports absent / installed / modified / removed externally", () => {
  const home = makeHome();
  const target = path.join(home, ".claude", "CLAUDE.md");

  assert.match(run(home, ["status"]).stdout, /claude: absent/);

  assert.equal(run(home, ["install", "--host", "claude", "--yes"]).status, 0);
  assert.match(run(home, ["status"]).stdout, new RegExp(`claude: installed v${packVersion.replace(/\./g, "\\.")}`));

  // Tampering inside the markers flips status to modified (M1 sha check).
  writeFileSync(target, readFileSync(target, "utf8").replace("## Lazyweb design-evidence routing", "## Hacked heading"));
  assert.match(run(home, ["status"]).stdout, /claude: modified/);

  writeFileSync(target, "no block anymore\n");
  assert.match(run(home, ["status"]).stdout, /claude: removed externally/);
});

test("refresh re-renders consented targets back to canonical; no manifest is a no-op", () => {
  const home = makeHome();
  const noManifest = run(home, ["refresh"]);
  assert.equal(noManifest.status, 0);
  assert.match(noManifest.stdout, /no manifest/);

  const target = path.join(home, ".claude", "CLAUDE.md");
  assert.equal(run(home, ["install", "--host", "claude", "--yes"]).status, 0);
  writeFileSync(target, readFileSync(target, "utf8").replace("Use only the research types", "Use every research type"));

  assert.equal(run(home, ["refresh"]).status, 0);
  const block = blockOf(readFileSync(target, "utf8"));
  assert.equal(sha256(block), manifestOf(home).targets[0].block_sha256, "refresh restores the canonical block and the manifest sha");
  assert.ok(block.includes("Use only the research types"), "edit inside markers was overwritten");
});

test("consent: declined blocks unforced installs; --yes overrides and clears the decline", () => {
  const home = makeHome();
  assert.equal(run(home, ["decline"]).status, 0);
  const config = path.join(home, ".lazyweb", "config");
  assert.match(readFileSync(config, "utf8"), /^router_declined=1$/m);

  const refused = run(home, ["install", "--host", "claude"]);
  assert.equal(refused.status, 0);
  assert.match(refused.stderr, /previously declined/);
  assert.ok(!existsSync(path.join(home, ".claude", "CLAUDE.md")), "no write after decline");

  assert.equal(run(home, ["install", "--host", "claude", "--yes"]).status, 0);
  assert.ok(existsSync(path.join(home, ".claude", "CLAUDE.md")));
  assert.doesNotMatch(readFileSync(config, "utf8"), /^router_declined=1$/m, "manual install clears the decline");
});

test("consent: refuses to write without --yes when stdin is not a TTY", () => {
  const home = makeHome();
  const res = run(home, ["install", "--host", "claude"], { input: "y\n" });
  assert.equal(res.status, 3, "piped stdin is not consent");
  assert.match(res.stderr, /refusing to write without --yes/);
  assert.ok(!existsSync(path.join(home, ".claude", "CLAUDE.md")));
});

test("install --host on a non-routable host fails loudly; --all skips it silently", () => {
  const home = makeHome();
  const single = run(home, ["install", "--host", "kiro", "--yes"]);
  assert.equal(single.status, 1);
  assert.match(single.stderr, /not routable/);

  const all = run(home, ["install", "--all", "--yes"]);
  assert.equal(all.status, 0, all.stderr);
  const hosts = manifestOf(home).targets.map((t) => t.host).sort();
  assert.deepEqual(hosts, ["claude", "codex", "opencode"], "exactly the capability-on hosts with skills on disk");
});

test("project install writes AGENTS.md and CLAUDE.md; refresh covers both", () => {
  const home = makeHome();
  const proj = path.join(home, "repo");
  mkdirSync(proj, { recursive: true });
  writeFileSync(path.join(proj, "AGENTS.md"), "# agents\n");
  writeFileSync(path.join(proj, "CLAUDE.md"), "# claude\n");

  const res = run(home, ["install", "--project", proj, "--yes"]);
  assert.equal(res.status, 0, res.stderr);
  for (const f of ["AGENTS.md", "CLAUDE.md"]) {
    const text = readFileSync(path.join(proj, f), "utf8");
    assert.ok(text.includes(BEGIN), `${f} gets the block`);
    assert.ok(!text.includes(home), `${f} block is host-neutral (no absolute HOME path)`);
  }
  const projTargets = manifestOf(home).targets.filter((t) => t.host === "project");
  assert.equal(projTargets.length, 2);

  // refresh is manifest-driven, so project entries are re-rendered too.
  writeFileSync(path.join(proj, "AGENTS.md"), readFileSync(path.join(proj, "AGENTS.md"), "utf8").replace("Use only the research types", "Use every research type"));
  assert.equal(run(home, ["refresh"]).status, 0);
  assert.ok(readFileSync(path.join(proj, "AGENTS.md"), "utf8").includes("Use only the research types"), "project block refreshed to canonical");

  assert.equal(run(home, ["remove", "--project", proj]).status, 0);
  assert.equal(readFileSync(path.join(proj, "AGENTS.md"), "utf8"), "# agents\n");
  assert.equal(readFileSync(path.join(proj, "CLAUDE.md"), "utf8"), "# claude\n");
});

test("project install collapses to AGENTS.md alone for symlinked or @-imported CLAUDE.md", () => {
  const home = makeHome();
  const linked = path.join(home, "repo-link");
  mkdirSync(linked, { recursive: true });
  writeFileSync(path.join(linked, "AGENTS.md"), "# shared\n");
  symlinkSync("AGENTS.md", path.join(linked, "CLAUDE.md"));
  assert.equal(run(home, ["install", "--project", linked, "--yes"]).status, 0);
  assert.equal(
    readFileSync(path.join(linked, "AGENTS.md"), "utf8").split(BEGIN).length - 1,
    1,
    "one block, not two, through the symlink pair"
  );

  const imported = path.join(home, "repo-import");
  mkdirSync(imported, { recursive: true });
  writeFileSync(path.join(imported, "AGENTS.md"), "# agents\n");
  writeFileSync(path.join(imported, "CLAUDE.md"), "@AGENTS.md\n");
  assert.equal(run(home, ["install", "--project", imported, "--yes"]).status, 0);
  assert.ok(readFileSync(path.join(imported, "AGENTS.md"), "utf8").includes(BEGIN), "AGENTS.md written");
  assert.equal(readFileSync(path.join(imported, "CLAUDE.md"), "utf8"), "@AGENTS.md\n", "importing CLAUDE.md left alone");
});

test("router lifecycle events land in the analytics buffer (spec §9)", () => {
  const home = makeHome();
  assert.equal(run(home, ["install", "--host", "claude", "--yes"]).status, 0);
  assert.equal(run(home, ["decline"]).status, 0);
  assert.equal(run(home, ["remove", "--host", "claude"]).status, 0);
  const events = readFileSync(path.join(home, ".lazyweb", "analytics", "events.jsonl"), "utf8")
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line));
  for (const name of ["router_install", "router_decline", "router_remove"]) {
    assert.ok(events.some((e) => e.event === name), `missing ${name} event`);
  }
  for (const e of events) {
    assert.match(e.machine, /^[0-9a-f-]{36}$/, "events carry the per-machine UUID");
  }
});
