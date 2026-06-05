import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const SCRIPT = path.resolve(import.meta.dirname, "../plugins/lazyweb/bin/lazyweb-context-detect");

function detect(setup) {
  const dir = mkdtempSync(path.join(tmpdir(), "lazyweb-ctx-"));
  try {
    setup(dir);
    return (spawnSync("node", [SCRIPT], { encoding: "utf8", env: { ...process.env, LAZYWEB_CONTEXT_CWD: dir } }).stdout) || "";
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

const pkg = (deps) => (dir) => writeFileSync(path.join(dir, "package.json"), JSON.stringify({ dependencies: deps }));

test("react project is detected as desktop", () => {
  const out = detect(pkg({ react: "18" }));
  assert.match(out, /platform=desktop/);
  assert.match(out, /react/);
});

test("expo project is detected as mobile", () => {
  assert.match(detect(pkg({ expo: "50" })), /platform=mobile/);
});

test("flutter project is detected as mobile", () => {
  const out = detect((dir) => writeFileSync(path.join(dir, "pubspec.yaml"), "name: app\n"));
  assert.match(out, /platform=mobile/);
  assert.match(out, /flutter/);
});

test("empty dir is unknown and prompts to ask the user", () => {
  const out = detect(() => {});
  assert.match(out, /platform=unknown/);
  assert.match(out, /ask the user/);
});
