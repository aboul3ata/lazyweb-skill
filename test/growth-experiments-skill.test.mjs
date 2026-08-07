import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const text = readFileSync(path.join(root, "skills", "lazyweb-search-experiments", "SKILL.md"), "utf8");

test("experiment research is a thin wrapper over the canonical MCP tool", () => {
  assert.match(text, /^name: lazyweb-search-experiments$/m);
  assert.ok(text.split("\n").length <= 80);
  assert.match(text, /lazyweb_search_experiments/);
  assert.match(text, /live schema/i);
  assert.match(text, /agentic_search_id/);
  assert.match(text, /result_ref/);
  assert.match(text, /lazyweb_agentic_search_finalize/);
  assert.doesNotMatch(text, /dataset_caveat|evidence_confidence|target metric|guardrail/i);
});

test("the former growth-experiments name is a hidden compatibility alias", () => {
  const alias = readFileSync(path.join(root, "skills", "lazyweb-growth-experiments", "SKILL.md"), "utf8");
  assert.match(alias, /^router-exclude:\s*true$/m);
  assert.match(alias, /deprecated/i);
  assert.match(alias, /lazyweb-search-experiments/);
});
