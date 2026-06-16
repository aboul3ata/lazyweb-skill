import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const skill = readFileSync(path.join(root, "skills/lazyweb-deep-design-research/SKILL.md"), "utf8");

test("server-render flow replaces the old local HTML publish gate", () => {
  assert.doesNotMatch(skill, /REPORT_CONTRACT_EOF/);
  assert.doesNotMatch(skill, /lazyweb_publish_report/);
  assert.match(skill, /lazyweb_render_report/);
  assert.match(skill, /work\/report-data\.json/);
  assert.match(skill, /There is no local `report\.html` to write/);
  assert.match(skill, /Never hand-render HTML or fall back to a local file/);
});

test("render call documents the required validation and retry contract", () => {
  assert.match(skill, /report_data/);
  assert.match(skill, /assets/);
  assert.match(skill, /idempotency_key/);
  assert.match(skill, /REPORT_RENDER_ERROR/);
  assert.match(skill, /call ONCE more/);
  assert.match(skill, /REPORT_TOO_LARGE/);
});

test("report-data instructions keep image references hostable", () => {
  assert.match(skill, /absolute `imageUrl`\/`image_url`/);
  assert.match(skill, /relative `references\/\{filename\}`/);
  assert.match(skill, /Never use `file:\/\/` URLs/);
  assert.match(skill, /absolute local paths/);
});
