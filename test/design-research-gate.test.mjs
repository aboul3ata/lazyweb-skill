import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const skill = readFileSync(path.join(root, "skills/lazyweb-design-create/SKILL.md"), "utf8");
const template = readFileSync(path.join(root, "skills/lazyweb-design-create/report-template.html"), "utf8");

test("design-create uses server-side render validation instead of the retired local gate", () => {
  assert.doesNotMatch(skill, /REPORT_CONTRACT_EOF/, "retired local publish gate must not reappear");
  assert.match(skill, /server fills a fixed, render-tested template/i);
  assert.match(skill, /REPORT_RENDER_ERROR/);
  assert.match(skill, /report-template\.html/);
});

test("raw template still carries example markers for validation fixtures", () => {
  assert.match(template, /data-ex=/);
  assert.match(template, /picsum\.photos/);
  assert.match(template, /<!--~/);
});
