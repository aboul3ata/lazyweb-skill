import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const SCRIPT = path.resolve(import.meta.dirname, "../plugins/lazyweb/bin/lazyweb-update-check");

// Run the update-check with an isolated HOME (so the 24h cache can't leak between
// cases) and the remote version injected via the test seam (no network).
function run(localVersion, remoteVersion) {
  const dir = mkdtempSync(path.join(tmpdir(), "lazyweb-uc-"));
  try {
    writeFileSync(path.join(dir, "VERSION"), `${localVersion}\n`);
    const res = spawnSync("sh", [SCRIPT], {
      encoding: "utf8",
      env: {
        ...process.env,
        HOME: dir,
        LAZYWEB_SKILL_ROOT: dir,
        LAZYWEB_UPDATE_CHECK_REMOTE: remoteVersion
      }
    });
    return { status: res.status, out: (res.stdout || "").trim() };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("prints UPGRADE_AVAILABLE when remote is newer", () => {
  const { status, out } = run("0.2.0", "0.3.0");
  assert.equal(status, 0);
  assert.equal(out, "UPGRADE_AVAILABLE 0.2.0 0.3.0");
});

test("silent when versions are equal", () => {
  assert.equal(run("0.2.0", "0.2.0").out, "");
});

test("silent when local is newer than remote", () => {
  assert.equal(run("0.3.0", "0.2.9").out, "");
});

test("4-segment build bump counts as an upgrade", () => {
  assert.equal(run("0.2.0", "0.2.0.1").out, "UPGRADE_AVAILABLE 0.2.0 0.2.0.1");
});

test("minor ordering is numeric not lexical (9 < 10)", () => {
  assert.equal(run("0.9.0", "0.10.0").out, "UPGRADE_AVAILABLE 0.9.0 0.10.0");
});

test("never errors on a junk remote value", () => {
  assert.equal(run("0.2.0", "not-a-version").status, 0);
});
