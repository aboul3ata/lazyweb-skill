import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const skillPath = path.join(root, "skills", "lazyweb-growth-experiment", "SKILL.md");
const text = readFileSync(skillPath, "utf8");

test("growth experiment skill stays a small MCP operating guide", () => {
  assert.match(text, /^name: lazyweb-growth-experiment$/m);
  assert.match(text, /^route:\s*.+$/m);
  assert.ok(text.split("\n").length <= 180, "skill should remain skeletal");
  assert.doesNotMatch(text, /\bCreed\b|\$9\.99|7-day journey/i);
});

test("uses A/B evidence first and visual search only as secondary evidence", () => {
  assert.match(text, /lazyweb_search_ab_tests/);
  assert.match(text, /operation.*research/is);
  assert.match(text, /operation.*grab/is);
  assert.match(text, /lazyweb_search/);
  assert.match(text, /secondary|fallback/i);
  assert.match(text, /do not treat.*experiment result/i);
});

test("defines the relevance and honesty gates from the live response schema", () => {
  for (const field of [
    "dataset_caveat",
    "evidence.count",
    "warnings",
    "filters_applied",
    "experiment_id",
    "company",
    "platform",
    "what_changed",
    "learning",
    "evidence_confidence",
    "vision_description",
    "image_url",
  ]) {
    assert.ok(text.includes(field), `missing response field ${field}`);
  }
  assert.match(text, /verify.*experiment_id|experiment_id.*verify/is);
  assert.match(text, /unknown.*product|omit.*product/is);
  assert.match(text, /hypotheses|not statistically measured lift/i);
});

test("downloads only selected before/after proof and leaves a coding handoff", () => {
  assert.match(text, /include_images.*false/is);
  assert.match(text, /include_images.*true/is);
  assert.match(text, /download only|only download/i);
  assert.match(text, /control.*variant/is);
  assert.match(text, /target metric/i);
  assert.match(text, /guardrail/i);
  assert.match(text, /rank/i);
});

test("keeps shared Lazyweb setup and access-state handling", () => {
  assert.match(text, /lazyweb_health/);
  assert.match(text, /https:\/\/www\.lazyweb\.com\/install\.sh/);
  assert.match(text, /MCP_PRO_REQUIRED/);
  assert.match(text, /FREE_REPORT_DAILY_LIMIT/);
  assert.match(text, /locked_preview/);
  assert.match(text, /integrity/);
  assert.match(text, /version/);
});
