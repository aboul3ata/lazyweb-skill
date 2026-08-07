import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const read = (relativePath) => readFileSync(path.join(root, relativePath), "utf8");
const frontmatter = (text) => text.match(/^---\n([\s\S]*?)\n---\n/)?.[1] || "";
const hasFlag = (text, key) => new RegExp(`^${key}:\\s*true\\s*$`, "m").test(frontmatter(text));

const CORE = new Map([
  ["lazyweb-growth-score", "lazyweb_growth_score"],
  ["lazyweb-growth-report", "lazyweb_growth_report"],
  ["lazyweb-growth-backlog", "lazyweb_growth_backlog"],
  ["lazyweb-search-experiments", "lazyweb_search_experiments"],
  ["lazyweb-search-flows", "lazyweb_search_flows"],
  ["lazyweb-search-screens", "lazyweb_search_screens"]
]);
const DEPRECATED_ALIASES = new Map([
  ["lazyweb-design", "lazyweb-growth-report"],
  ["lazyweb-growth-experiments", "lazyweb-search-experiments"],
  ["lazyweb-quick-search", "lazyweb-search-screens"]
]);
const SAFE_DOMAIN_TOOLS = [
  "lazyweb_products",
  "lazyweb_connections",
  "lazyweb_reports",
  "lazyweb_account"
];

assert.match(read("VERSION").trim(), /^\d+\.\d+\.\d+$/, "VERSION must be semver");
assert.ok(existsSync(path.join(root, "SKILL.md")), "missing root SKILL.md");
assert.ok(existsSync(path.join(root, "setup")), "missing setup");
assert.ok(statSync(path.join(root, "setup")).mode & 0o111, "setup must be executable");

for (const removedPath of ["plugins", "lazyweb", ".agents/plugins/marketplace.json", ".claude-plugin/marketplace.json"]) {
  assert.equal(existsSync(path.join(root, removedPath)), false, `${removedPath} must stay absent`);
}

const skillDirs = readdirSync(path.join(root, "skills"), { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && existsSync(path.join(root, "skills", entry.name, "SKILL.md")))
  .map((entry) => entry.name)
  .sort();
const visible = skillDirs.filter((name) => !hasFlag(read(`skills/${name}/SKILL.md`), "router-exclude"));
assert.deepEqual(visible, [...CORE.keys()].sort(), "the six capability skills are the only routed product skills");

const rootSkill = read("SKILL.md");
assert.match(frontmatter(rootSkill), /^name:\s*lazyweb\s*$/m);
assert.ok(rootSkill.split("\n").length <= 80, "root router must stay thin");
assert.match(rootSkill, /live Lazyweb MCP tool list as the source of truth/i);
assert.match(rootSkill, /lazyweb\.resource-link\.v1/);
assert.match(rootSkill, /never print, share, or log it/i);
for (const name of CORE.keys()) assert.match(rootSkill, new RegExp(`\\b${name}\\b`), `root router missing ${name}`);
for (const tool of SAFE_DOMAIN_TOOLS) assert.match(rootSkill, new RegExp(`\\b${tool}\\b`), `root router missing ${tool}`);
for (const humanOnly of ["checkout", "billing changes", "identity changes", "team invitations", "admin actions"]) {
  assert.match(rootSkill, new RegExp(humanOnly, "i"), `root router missing human-only class ${humanOnly}`);
}

for (const [name, tool] of CORE) {
  const relativePath = `skills/${name}/SKILL.md`;
  const text = read(relativePath);
  const fm = frontmatter(text);
  assert.match(fm, new RegExp(`^name:\\s*${name}\\s*$`, "m"), `${relativePath} wrong name`);
  assert.match(fm, /^route:\s*.+$/m, `${relativePath} missing route`);
  assert.match(fm, /^description:\s*.+$/m, `${relativePath} missing description`);
  assert.ok(text.split("\n").length <= 80, `${relativePath} must stay a thin wrapper`);
  assert.match(text, /lazyweb_health/, `${relativePath} must verify MCP health`);
  assert.match(text, /https:\/\/www\.lazyweb\.com\/install\.sh/, `${relativePath} missing installer`);
  assert.match(text, new RegExp(`\\b${tool}\\b`), `${relativePath} missing canonical tool`);
  assert.match(text, /live schema|live contract/i, `${relativePath} must defer to the live tool contract`);
  assert.doesNotMatch(text, /```(?:python|javascript|html|css|sql)/i, `${relativePath} embeds product implementation`);
}

for (const name of ["lazyweb-search-experiments", "lazyweb-search-flows", "lazyweb-search-screens"]) {
  const text = read(`skills/${name}/SKILL.md`);
  assert.match(text, /agentic_search_id/);
  assert.match(text, /result_ref/);
  assert.match(text, /lazyweb_agentic_search_finalize/);
  assert.match(text, /agentic_search_saved/);
  assert.match(text, /open_url/);
  assert.match(text, /share_url/);
}

const reportSkill = read("skills/lazyweb-growth-report/SKILL.md");
assert.match(reportSkill, /only the new name|rename changes only the skill name/i);
assert.match(reportSkill, /unchanged/i);
assert.doesNotMatch(reportSkill, /prototype|taxonomy|score rubric/i, "growth-report must not change report behavior");

for (const [alias, replacement] of DEPRECATED_ALIASES) {
  const text = read(`skills/${alias}/SKILL.md`);
  assert.equal(hasFlag(text, "router-exclude"), true, `${alias} must be hidden`);
  assert.match(text, /deprecated/i);
  assert.match(text, new RegExp(`\\b${replacement}\\b`), `${alias} must route to ${replacement}`);
  assert.ok(text.split("\n").length <= 30, `${alias} must stay a tiny compatibility alias`);
}

const setup = read("setup");
const focused = setup.match(/^FOCUSED_SKILLS="([^"]+)"/m)?.[1]?.split(/\s+/).filter(Boolean) || [];
assert.deepEqual(focused.sort(), [...CORE.keys(), "lazyweb-update"].sort(), "installer focused set must match capability skills");
for (const alias of DEPRECATED_ALIASES.keys()) {
  assert.match(setup, new RegExp(`^COMPAT_ALIAS_SKILLS=.*\\b${alias}\\b`, "m"), `${alias} must remain upgrade-compatible`);
}
assert.match(setup, /not installed for new users/i, "compatibility aliases must not expand fresh installs");

const readme = read("README.md");
for (const name of CORE.keys()) assert.match(readme, new RegExp(`/${name}\\b`), `README missing /${name}`);
assert.match(readme, /skills contain only routing and link-handling guidance/i);

for (const binName of ["lazyweb-context-detect", "lazyweb-log", "lazyweb-router", "lazyweb-telemetry-flush", "lazyweb-update", "lazyweb-update-check"]) {
  const file = path.join(root, "bin", binName);
  assert.ok(existsSync(file), `missing bin/${binName}`);
  assert.ok(statSync(file).mode & 0o111, `bin/${binName} must be executable`);
}

console.log(`Validated Lazyweb capability skill pack (${CORE.size} thin skills, ${DEPRECATED_ALIASES.size} aliases).`);
