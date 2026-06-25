import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const skill = readFileSync(path.join(root, "skills/lazyweb-design-create/SKILL.md"), "utf8");
const template = readFileSync(path.join(root, "skills/lazyweb-design-create/report-template.html"), "utf8");

test("design-create documents server-side render validation instead of a local publish gate", () => {
  assert.match(skill, /lazyweb_render_report` ONCE/);
  assert.match(skill, /REPORT_RENDER_ERROR/);
  assert.match(skill, /server fills a fixed, render-tested template/i);
  assert.match(skill, /Never hand-render HTML or fall back to a local file/i);
  assert.doesNotMatch(skill, /REPORT_CONTRACT_EOF/);
});

test("design-create template keeps example markers for fill/render tests", () => {
  assert.match(template, /data-ex=/);
  assert.match(template, /picsum\.photos/);
  assert.match(template, /LAZYWEB REPORT — AGENT HANDOFF/);
});

test("design-create template does not reintroduce removed skeleton or patterns markup", () => {
  for (const removed of [/genbar/, /pending-ref/, /pending-strip/, /lazyweb-report-state/, /\.pattern-shot/, /## Interesting Patterns/]) {
    assert.doesNotMatch(template, removed);
  }
});
