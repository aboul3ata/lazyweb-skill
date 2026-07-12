import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const setupBoundarySurfaces = [
  "README.md",
  "SKILL.md",
  "skills/lazyweb-design-create/SKILL.md"
];

const instructionSurfaces = [
  "SKILL.md",
  "skills/lazyweb-design/SKILL.md",
  "skills/lazyweb-quick-search/SKILL.md",
  "skills/lazyweb-design-create/SKILL.md"
];

const touchedSurfaces = [
  "README.md",
  ...instructionSurfaces,
  "skills/lazyweb-design-create/fill-report.py",
  "skills/lazyweb-design-create/report-template.html"
];

test("skill-pack copy separates no-charge setup from plan-dependent MCP data access", () => {
  for (const relativePath of setupBoundarySurfaces) {
    const text = readFileSync(path.join(root, relativePath), "utf8");
    assert.match(
      text,
      /available to everyone without\s+charge/,
      `${relativePath} must say setup and token issuance are available to everyone without charge`
    );
    assert.match(
      text,
      /real data-bearing MCP tool availability and usage limits depend on the\s+account's persisted experiment assignment and plan/,
      `${relativePath} must make data-bearing access plan- and experiment-dependent`
    );
  }
});

test("every touched instruction, template, and renderer avoids the retired free-MCP promise", () => {
  for (const relativePath of touchedSurfaces) {
    const text = readFileSync(path.join(root, relativePath), "utf8");
    assert.doesNotMatch(
      text,
      /turn your agent into a design researcher\.\.\. for free!|Lazyweb MCP tokens are free|All current (?:public )?Lazyweb MCP tools[^.]*free|Lazyweb is free|Free mobile-only A\/B Test Agent/i,
      `${relativePath} must not make an unconditional free-MCP claim`
    );
  }
});

test("the report template and renderer use the same plan-aware footer", () => {
  const footerSurfaces = [
    "skills/lazyweb-design-create/fill-report.py",
    "skills/lazyweb-design-create/report-template.html"
  ];
  const expected = "agent-ready design research. MCP data access and usage limits depend on your plan.";

  for (const relativePath of footerSurfaces) {
    const text = readFileSync(path.join(root, relativePath), "utf8");
    assert.match(text, new RegExp(expected.replaceAll(".", "\\."), "i"), `${relativePath} must carry the plan-aware footer`);
  }
});

test("all MCP-backed skills relay terminal plan responses without retry, fallback, or polling", () => {
  for (const relativePath of instructionSurfaces) {
    const text = readFileSync(path.join(root, relativePath), "utf8");
    assert.match(text, /`MCP_PRO_REQUIRED`/, `${relativePath} must handle the new-user Pro gate`);
    assert.match(text, /`FREE_REPORT_DAILY_LIMIT`/, `${relativePath} must handle the existing-user daily limit`);
    assert.match(text, /`status:\s*"locked_preview"`/, `${relativePath} must handle a successful locked preview`);
    assert.match(text, /relay `display_to_user` verbatim/i, `${relativePath} must surface the server-authored user message`);
    assert.match(text, /do not retry another data tool or\s+fall\s+back/i, `${relativePath} must not evade an access decision`);
    assert.match(text, /do not poll/i, `${relativePath} must not poll a terminal preview`);
  }
});

test("lazyweb-design branches on a successful locked preview before assuming a job exists", () => {
  const text = readFileSync(path.join(root, "skills/lazyweb-design/SKILL.md"), "utf8");
  const branchStart = text.indexOf("Before reading `job_id`");
  const normalJobStart = text.indexOf('`{ job_id, status:"pending"', branchStart + 1);

  assert.notEqual(branchStart, -1, "lazyweb-design must inspect the result before reading job_id");
  assert.notEqual(normalJobStart, -1, "lazyweb-design must retain its normal pending-job contract");
  assert.ok(branchStart < normalJobStart, "the locked-preview branch must precede the pending-job branch");

  const branch = text.slice(branchStart, normalJobStart);
  assert.match(branch, /`status:\s*"locked_preview"`/);
  assert.match(branch, /successful terminal result/i);
  assert.match(branch, /intentionally has no `job_id`/i);
  assert.match(branch, /do not call\s+`lazyweb_get_report`/i);
  assert.match(branch, /do not poll/i);
  assert.match(branch, /do not retry another data tool or\s+fall\s+back/i);
});
