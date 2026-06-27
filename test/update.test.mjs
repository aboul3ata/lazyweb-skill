import { test } from "node:test";
import assert from "node:assert/strict";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");
const script = path.join(root, "bin", "lazyweb-update");

function makeExecutable(file, body) {
  writeFileSync(file, body, { mode: 0o755 });
}

// Fake git that lets `fetch` + `reset` succeed (so the trap-proof refresh path
// is taken) and makes `clone` fail (so a re-clone fallback is never silently
// masked). Mirrors the inline fakes used by the existing tests.
const FAKE_GIT = `#!/usr/bin/env sh
if [ "$1" = "-C" ]; then
  shift 2
fi
case "$1" in
  rev-parse) printf '%s\\n' abc123 ;;
  fetch) exit 0 ;;
  reset) exit 0 ;;
  clone) exit 1 ;;
  *) exit 0 ;;
esac
`;

// Records each setup invocation so a test can assert setup ran exactly once
// (i.e. the self-heal re-exec did not loop).
const RECORDING_SETUP = (traceFile) =>
  `#!/usr/bin/env sh\nprintf '%s\\n' "$@" >> "${traceFile}"\n`;

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

test("a TRAPPED user's stale updater re-execs the refreshed one exactly once", () => {
  // Scenario: the installed ~/.lazyweb/bin/lazyweb-update the user invokes is
  // STALE (different content from the freshly-reset checkout's bin). After the
  // refresh lands the latest checkout, the updater must re-exec the fresh bin so
  // the rest of the run uses current logic — and must do so only once.
  const dir = mkdtempSync(path.join(tmpdir(), "lazyweb-update-trap-"));
  const home = path.join(dir, "home");
  const fakeBin = path.join(dir, "bin");
  const target = path.join(dir, "checkout");
  const trace = path.join(dir, "setup.trace");
  mkdirSync(path.join(target, ".git"), { recursive: true });
  mkdirSync(path.join(target, "bin"), { recursive: true });
  mkdirSync(fakeBin, { recursive: true });

  makeExecutable(path.join(fakeBin, "git"), FAKE_GIT);
  makeExecutable(path.join(target, "setup"), RECORDING_SETUP(trace));
  writeFileSync(path.join(target, "VERSION"), "9.9.9\n");

  // The FRESH updater that the refresh "lands" in the checkout == the current
  // repo bin under test.
  copyFileSync(script, path.join(target, "bin", "lazyweb-update"));
  // The STALE installed bin the user actually invokes: same script + a trailing
  // marker so its content differs from FRESH (cmp -s returns non-zero).
  const staleBin = path.join(dir, "installed-lazyweb-update");
  writeFileSync(
    staleBin,
    readFileSync(script, "utf8") + "\n# STALE MARKER (pre-refresh content)\n",
    { mode: 0o755 }
  );

  try {
    const result = spawnSync("bash", [staleBin, "--host", "all", "--quiet"], {
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
    // setup ran exactly once -> re-exec happened but did NOT loop.
    const traceLines = readFileSync(trace, "utf8").trim().split("\n").filter(Boolean);
    assert.equal(traceLines.join("|"), "--host|all|--quiet", "setup should run once with forwarded args");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("an up-to-date updater runs inline without re-exec", () => {
  // When the invoked bin already matches the freshly-reset checkout bin, there
  // is nothing to self-heal — it must run inline (no re-exec, setup once).
  const dir = mkdtempSync(path.join(tmpdir(), "lazyweb-update-fresh-"));
  const home = path.join(dir, "home");
  const fakeBin = path.join(dir, "bin");
  const target = path.join(dir, "checkout");
  const trace = path.join(dir, "setup.trace");
  mkdirSync(path.join(target, ".git"), { recursive: true });
  mkdirSync(path.join(target, "bin"), { recursive: true });
  mkdirSync(fakeBin, { recursive: true });

  makeExecutable(path.join(fakeBin, "git"), FAKE_GIT);
  makeExecutable(path.join(target, "setup"), RECORDING_SETUP(trace));
  writeFileSync(path.join(target, "VERSION"), "9.9.9\n");
  copyFileSync(script, path.join(target, "bin", "lazyweb-update"));

  try {
    // Invoke the checkout bin itself (identical to FRESH) so cmp -s matches.
    const result = spawnSync("bash", [path.join(target, "bin", "lazyweb-update"), "--host", "all", "--quiet"], {
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
    const traceLines = readFileSync(trace, "utf8").trim().split("\n").filter(Boolean);
    assert.equal(traceLines.join("|"), "--host|all|--quiet", "setup should run once, no re-exec loop");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
