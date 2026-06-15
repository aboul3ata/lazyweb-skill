import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");
const script = path.join(root, "bin", "lazyweb-update");

function makeExecutable(file, body) {
  writeFileSync(file, body, { mode: 0o755 });
}

test("lazyweb-update runs setup when no optional setup flags are provided", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "lazyweb-update-"));
  const home = path.join(dir, "home");
  const fakeBin = path.join(dir, "bin");
  const target = path.join(dir, "checkout");
  mkdirSync(path.join(target, ".git"), { recursive: true });
  mkdirSync(fakeBin, { recursive: true });

  makeExecutable(
    path.join(fakeBin, "git"),
    `#!/usr/bin/env sh
if [ "$1" = "-C" ]; then
  shift 2
fi
case "$1" in
  rev-parse) printf '%s\\n' abc123 ;;
  pull) printf '%s\\n' "Already up to date." ;;
  clone) exit 1 ;;
  *) exit 0 ;;
esac
`
  );
  makeExecutable(
    path.join(target, "setup"),
    `#!/usr/bin/env sh
printf '%s\\n' "$@" > "${dir}/setup.args"
`
  );
  writeFileSync(path.join(target, "VERSION"), "9.9.9\n");

  try {
    const result = spawnSync("bash", [script], {
      cwd: root,
      encoding: "utf8",
      env: {
        ...process.env,
        HOME: home,
        PATH: `${fakeBin}:/usr/bin:/bin:/usr/sbin:/sbin`,
        LAZYWEB_SKILL_DIR: target
      }
    });

    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.match(result.stdout, /Lazyweb update complete/);
    assert.equal(readFileSync(path.join(dir, "setup.args"), "utf8"), "--host\nall\n");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("lazyweb-update forwards optional setup flags when present", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "lazyweb-update-flags-"));
  const home = path.join(dir, "home");
  const fakeBin = path.join(dir, "bin");
  const target = path.join(dir, "checkout");
  mkdirSync(path.join(target, ".git"), { recursive: true });
  mkdirSync(fakeBin, { recursive: true });

  makeExecutable(
    path.join(fakeBin, "git"),
    `#!/usr/bin/env sh
if [ "$1" = "-C" ]; then
  shift 2
fi
case "$1" in
  rev-parse) printf '%s\\n' abc123 ;;
  pull) printf '%s\\n' "Already up to date." ;;
  clone) exit 1 ;;
  *) exit 0 ;;
esac
`
  );
  makeExecutable(
    path.join(target, "setup"),
    `#!/usr/bin/env sh
printf '%s\\n' "$@" > "${dir}/setup.args"
`
  );
  writeFileSync(path.join(target, "VERSION"), "9.9.9\n");

  try {
    const result = spawnSync("bash", [script, "--host", "codex", "--quiet", "--auto-update"], {
      cwd: root,
      encoding: "utf8",
      env: {
        ...process.env,
        HOME: home,
        PATH: `${fakeBin}:/usr/bin:/bin:/usr/sbin:/sbin`,
        LAZYWEB_SKILL_DIR: target
      }
    });

    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.equal(
      readFileSync(path.join(dir, "setup.args"), "utf8"),
      "--host\ncodex\n--quiet\n--auto-update\n"
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
