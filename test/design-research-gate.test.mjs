import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const skill = readFileSync(path.join(root, "skills/lazyweb-deep-design-research/SKILL.md"), "utf8");

test("server-render contract replaces the old local publish gate", () => {
  assert.match(skill, /lazyweb_render_report/, "skill must call the server renderer");
  assert.match(skill, /work\/report-data\.json/, "skill must author structured report data");
  assert.match(skill, /report_data/, "render call must pass parsed report_data");
  assert.match(skill, /assets/, "render call must upload local reference assets");
  assert.match(skill, /REPORT_RENDER_ERROR/, "server validation failures must be handled");
  assert.match(skill, /Never hand-render HTML or fall back to a local file/, "local HTML fallback must stay forbidden");
  assert.match(skill, /web-only fallback cannot produce the deliverable/, "missing MCP must stop instead of promising a web-only fallback");
});

test("old local REPORT_CONTRACT gate is not documented anymore", () => {
  assert.doesNotMatch(skill, /REPORT_CONTRACT_EOF/, "deleted heredoc gate must not reappear");
  assert.doesNotMatch(skill, /REPORT_CONTRACT_OK/, "local gate success marker must not reappear");
  assert.doesNotMatch(skill, /REPORT_CONTRACT_FAILED/, "local gate failure marker must not reappear");
});
