import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const core = [
  "lazyweb-growth-score",
  "lazyweb-growth-report",
  "lazyweb-growth-backlog",
  "lazyweb-search-experiments",
  "lazyweb-search-flows",
  "lazyweb-search-screens"
];

test("capability skills defer access and product behavior to live MCP contracts", () => {
  for (const name of core) {
    const text = readFileSync(path.join(root, "skills", name, "SKILL.md"), "utf8");
    assert.match(text, /live (?:schema|contract)/i, name);
    assert.match(text, /lazyweb_health/, name);
    assert.ok(text.split("\n").length <= 80, `${name} is too thick`);
    assert.doesNotMatch(text, /MCP_PRO_REQUIRED|FREE_REPORT_DAILY_LIMIT|locked_preview/, `${name} duplicated server access behavior`);
  }
});

test("Growth Report is a naming-only replacement for Lazyweb Design", () => {
  const report = readFileSync(path.join(root, "skills/lazyweb-growth-report", "SKILL.md"), "utf8");
  const alias = readFileSync(path.join(root, "skills/lazyweb-design", "SKILL.md"), "utf8");
  assert.match(report, /only the new name/i);
  assert.match(report, /unchanged/i);
  assert.match(alias, /deprecated alias/i);
  assert.match(alias, /lazyweb-growth-report/);
});
