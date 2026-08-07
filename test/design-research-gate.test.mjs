import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const skill = readFileSync(path.join(root, "skills/lazyweb-design-create/SKILL.md"), "utf8");

test("legacy create backend remains hidden and server-rendered", () => {
  assert.match(skill, /^router-exclude:\s*true$/m);
  assert.match(skill, /lazyweb_render_report/);
  assert.match(skill, /server fills a fixed, render-tested template/i);
  assert.match(skill, /partial or skeleton\s+report can never be hosted/i);
});
