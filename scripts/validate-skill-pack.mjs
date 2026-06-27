import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);

// Discover mode skills by iterating skills/*/ instead of a hardcoded list.
// A hardcoded list is the exact trap that left lazyweb-paywall-cta and
// lazyweb-optimize-sign-up unvalidated (and undocumented) after 0.4.0:
// a new mode must be picked up by adding its directory, nothing else.
//
// lazyweb-design-create is an INTERNAL backend: it is reached via
// lazyweb_get_workflows and the design `create` objective, never surfaced as a
// slash command (setup does not install it). So it is excluded from the
// visible-mode checks (router row, README row, route: frontmatter) and is
// validated separately below as the create/report backend.
const INTERNAL_BACKEND_SKILLS = new Set(["lazyweb-design-create"]);
const visibleModeSkillDirs = readdirSync(path.join(root, "skills"), { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && existsSync(path.join(root, "skills", entry.name, "SKILL.md")))
  .filter((entry) => !INTERNAL_BACKEND_SKILLS.has(entry.name))
  .map((entry) => `skills/${entry.name}`)
  .sort();

assert.ok(visibleModeSkillDirs.length > 0, "no mode skills found under skills/");

const removedPluginPaths = [
  "plugins",
  "lazyweb",
  ".agents/plugins/marketplace.json",
  ".claude-plugin/marketplace.json"
];

const documentedLazywebTools = new Set([
  "lazyweb_health",
  "lazyweb_search",
  "lazyweb_find_similar",
  "lazyweb_compare_image",
  "lazyweb_list_categories",
  "lazyweb_search_ab_tests",
  "lazyweb_paywall_cta_research",
  "lazyweb_get_workflows",
  "lazyweb_get_flows",
  "lazyweb_find_experiments",
  "lazyweb_recent_experiments",
  "search_screenshots",
  "list_filters",
  "list_all_filters",
  "vision_screenshots",
  "metadata_screenshots",
  "get_company_details",
  "list_companies_by_categories"
]);

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function assertSkillFile(relativePath, expectedName) {
  const text = read(relativePath);
  assert.match(text, /^---\n[\s\S]+?\n---\n/, `${relativePath} missing YAML frontmatter`);
  assert.match(text, new RegExp(`^name:\\s*${expectedName}\\s*$`, "m"), `${relativePath} wrong name`);
  assert.match(text, /^description:\s*(\||>|.+)$/m, `${relativePath} missing description`);
  return text;
}

for (const removedPath of removedPluginPaths) {
  assert.equal(existsSync(path.join(root, removedPath)), false, `${removedPath} should not exist in standalone skill pack`);
}

assert.ok(existsSync(path.join(root, "SKILL.md")), "missing root SKILL.md");
for (const dir of visibleModeSkillDirs) {
  assert.ok(existsSync(path.join(root, dir, "SKILL.md")), `missing ${dir}/SKILL.md`);
}

const router = assertSkillFile("SKILL.md", "lazyweb");
// The router invokes installed modes BY NAME — it deliberately never references
// skills/<name>/SKILL.md file paths (that layout exists only in the source repo,
// not in the install). So assert the router names each visible mode.
for (const mode of visibleModeSkillDirs) {
  const name = path.basename(mode);
  assert.match(router, new RegExp(`\\b${name}\\b`), `router must route to ${name}`);
}
for (const removedMode of ["lazyweb-welcome", "lazyweb-feedback", "lazyweb-flows", "lazyweb-add-inspo-source", "lazyweb-remove-inspo-source"]) {
  assert.doesNotMatch(router, new RegExp(removedMode), `router must not route to removed mode ${removedMode}`);
}
assert.match(router, /curl -fsSL https:\/\/www\.lazyweb\.com\/install\.sh \| bash/);

for (const dir of visibleModeSkillDirs) {
  const name = path.basename(dir);
  const text = assertSkillFile(`${dir}/SKILL.md`, name);
  assert.match(text, /lazyweb_health/, `${dir} should verify MCP health`);
  assert.match(text, /https:\/\/www\.lazyweb\.com\/install\.sh/, `${dir} should point to standalone installer`);
}

const allSkillText = ["SKILL.md", ...visibleModeSkillDirs.map((dir) => `${dir}/SKILL.md`)]
  .map((relativePath) => read(relativePath))
  .join("\n");
const allInstructionText = ["README.md", "AGENTS.md", "CLAUDE.md", "SKILL.md", ...visibleModeSkillDirs.map((dir) => `${dir}/SKILL.md`)]
  .map((relativePath) => read(relativePath))
  .join("\n");
for (const match of allSkillText.matchAll(/\b(?:lazyweb_(?:health|search|find_similar|compare_image|list_categories|search_ab_tests|paywall_cta_research|get_workflows|get_flows|find_experiments|recent_experiments)|search_screenshots|list_filters|list_all_filters|vision_screenshots|metadata_screenshots|get_company_details|list_companies_by_categories)\b/g)) {
  assert.ok(documentedLazywebTools.has(match[0]), `skill docs mention unknown Lazyweb MCP tool: ${match[0]}`);
}

for (const stalePattern of [
  /Design-research v2 exception/i,
  /do not place them side by side/i,
  /Do not reintroduce a visible standalone Agent Instructions block/i,
  /v2 prototype\/inspo\/pattern-crop/i,
  /\.hypothesis-strip/,
  /\.pattern-crop/
]) {
  assert.doesNotMatch(allInstructionText, stalePattern, `stale design-research v2 guidance must not reappear: ${stalePattern}`);
}

const setupPath = path.join(root, "setup");
assert.ok(existsSync(setupPath), "missing root setup script");
assert.ok(statSync(setupPath).mode & 0o111, "root setup must be executable");

for (const binName of ["lazyweb-context-detect", "lazyweb-log", "lazyweb-router", "lazyweb-telemetry-flush", "lazyweb-update", "lazyweb-update-check"]) {
  const binPath = path.join(root, "bin", binName);
  assert.ok(existsSync(binPath), `missing bin/${binName}`);
  assert.ok(statSync(binPath).mode & 0o111, `bin/${binName} must be executable`);
}
assert.ok(existsSync(path.join(root, "bin", "lazyweb-hosts.sh")), "missing bin/lazyweb-hosts.sh (shared host table, sourced by setup and lazyweb-router)");

// --- Autorouter contract (specs/autorouter.md §11.3, §12 Step 2b) ----------
// 1. Every mode skill must carry a NON-EMPTY `route:` frontmatter value — the
//    renderer builds the injected routing table from it, so an empty value
//    would emit a blank intent cell that routes nothing.
function frontmatterOf(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n/);
  return m ? m[1] : "";
}
for (const dir of visibleModeSkillDirs) {
  const fm = frontmatterOf(read(`${dir}/SKILL.md`));
  const m = fm.match(/^route:\s*(.+)$/m);
  assert.ok(m, `${dir}/SKILL.md missing route: frontmatter (used by lazyweb-router to render the autorouter table)`);
  const value = m[1].trim().replace(/^["']|["']$/g, "").trim();
  assert.ok(value.length > 0, `${dir}/SKILL.md has an empty route: value`);
}

// 2. Structural sync invariant: set-equality of skill identifiers between
//    skills/*/ and the root SKILL.md routing table. (Direction "every dir is
//    in the table" is asserted above; this is the inverse — the table must
//    not reference a mode that does not exist on disk.) Deliberately NOT a
//    prose diff: router rows are trigger-shaped, the root table is
//    category-shaped (spec B3).
const skillDirNames = new Set(visibleModeSkillDirs.map((dir) => path.basename(dir)));
for (const match of router.matchAll(/skills\/([a-z0-9-]+)\/SKILL\.md/g)) {
  assert.ok(skillDirNames.has(match[1]), `root SKILL.md routes to skills/${match[1]}/SKILL.md which does not exist on disk`);
}

// 3. Router template: required placeholders, markers, and the table rows left
//    to the renderer ({{ROWS}}), never hardcoded mode rows that could strand a
//    new mode.
const routerTemplate = read("router/ROUTER.template.md");
assert.match(routerTemplate, /<!-- LAZYWEB:ROUTER:BEGIN v\{\{VERSION\}\}/, "router template missing versioned BEGIN marker");
assert.match(routerTemplate, /<!-- LAZYWEB:ROUTER:END -->/, "router template missing END marker");
for (const placeholder of ["{{ACT_PREAMBLE}}", "{{ROWS}}"]) {
  const count = routerTemplate.split(placeholder).length - 1;
  assert.equal(count, 1, `router template must contain ${placeholder} exactly once (found ${count})`);
}
assert.doesNotMatch(routerTemplate, /lazyweb-(design|quick|paywall|signup|ab|update)[a-z-]*/, "router template must not hardcode mode rows — rows are rendered from skills/*/ frontmatter");

// 4. Host portability guard (Step 2b): no skill BODY prose may name a
//    Claude-only tool — the router delivers users into these files on hosts
//    that do not have that tool. `allowed-tools:` frontmatter is exempt
//    (non-Claude hosts ignore unknown allowed-tools).
for (const relativePath of ["SKILL.md", ...visibleModeSkillDirs.map((dir) => `${dir}/SKILL.md`)]) {
  const body = read(relativePath).replace(/^---\n[\s\S]*?\n---\n/, "");
  assert.doesNotMatch(body, /AskUserQuestion/, `${relativePath} body prose names Claude-only tool AskUserQuestion — use host-neutral phrasing ("ask the user one short clarifying question")`);
}

// Every discovered mode skill must be documented in the README "Visible
// Skills" table, so the docs can't drift from disk the way they did before
// (paywall-cta and signup-optimization were on disk but absent from README).
const readmeText = read("README.md");
for (const dir of visibleModeSkillDirs) {
  const slashCommand = `/${path.basename(dir)}`;
  assert.match(readmeText, new RegExp(slashCommand.replace(/[-/]/g, "\\$&")), `README.md missing ${slashCommand} in the Visible Skills table`);
}

const pluginInstallPattern = /codex plugin marketplace|claude plugin install|lazyweb@lazyweb|plugins\/lazyweb|\.codex-plugin|\.claude-plugin/;
for (const relativePath of ["README.md", "setup", "SKILL.md", ...visibleModeSkillDirs.map((dir) => `${dir}/SKILL.md`)]) {
  const text = read(relativePath);
  assert.doesNotMatch(text, pluginInstallPattern, `${relativePath} still mentions plugin install paths`);
}

const staleScreenshotContractPatterns = [
  /\{"screenshot_id"/,
  /\bscreenshotId\b/,
  /\bscreenshotIds\b/,
  /known Lazyweb screenshot ID/i,
  /BASE\+control\.path/,
  /BASE\+variant\.path/,
  /control\/variant\.image_url do NOT exist/i,
  /Build the URL yourself/i
];
for (const relativePath of ["README.md", "SKILL.md", ...visibleModeSkillDirs.map((dir) => `${dir}/SKILL.md`)]) {
  const text = read(relativePath);
  for (const pattern of staleScreenshotContractPatterns) {
    assert.doesNotMatch(text, pattern, `${relativePath} has stale screenshot URL/ID guidance: ${pattern}`);
  }
}

const designResearchText = read("skills/lazyweb-design-create/SKILL.md");
// The render-tested report skeleton/CSS/JS lives in the template file the
// skill instructs agents to copy; component assertions check both.
const designResearchTemplate = read("skills/lazyweb-design-create/report-template.html");
const designResearchAll = designResearchText + "\n" + designResearchTemplate;
assert.match(designResearchText, /report-template\.html/, "design-research skill must reference its report template");
for (const scriptName of ["fetch-evidence.py", "generate-prototypes.py", "fill-report.py"]) {
  const sp = path.join(root, "skills/lazyweb-design-create", scriptName);
  assert.ok(existsSync(sp), `missing skills/lazyweb-design-create/${scriptName}`);
  assert.ok(statSync(sp).mode & 0o111, `${scriptName} must be executable`);
  assert.match(designResearchText, new RegExp(scriptName.replace(".", "\\.")), `design-research skill must reference ${scriptName}`);
}
for (const removedSkeletonToken of [/genbar/, /pending-ref/, /pending-strip/, /lazyweb-report-state/]) {
  assert.doesNotMatch(designResearchTemplate, removedSkeletonToken, `removed skeleton-publish markup must not reappear in the template: ${removedSkeletonToken}`);
}
assert.doesNotMatch(designResearchText, /Skeleton publish|publish a SKELETON/i, "skeleton-publish instructions must not reappear in the skill");
assert.match(designResearchText, /in-progress leftovers/, "publish gate must reject in-progress markers in final reports");
assert.match(designResearchText, /ONCE, when it is complete/, "publish section must state reports publish only when complete");
assert.match(designResearchText, /unfilled template example content/, "publish gate must block unfilled template example content");
assert.match(designResearchText, /picsum\\\.photos|picsum\.photos/, "publish gate must name picsum.photos as forbidden in final reports");
for (const templatePattern of [
  /data-ex=/,
  /picsum\.photos/,
  /window\.__vstep/,
  /window\.__zoom/,
  /id="lb"/,
  /class="scalebar"/,
  /REPEAT/,
  /LAZYWEB REPORT — AGENT HANDOFF/
]) {
  assert.match(designResearchTemplate, templatePattern, `design-research report template missing ${templatePattern}`);
}
for (const pattern of [
  /## Report v3 Contract/,
  /## Goal/,
  /## Recommendation/,
  /## Inspo/,
  /Prototype fidelity rules/,
  /High fidelity/,
  /Medium fidelity/,
  /Low fidelity/,
  /\.compare/,
  /\.cmp-frame/,
  /\.option-deck/,
  /\.inspo-map/,
  /\.inspo-point/,
  /\.inspo-img/,
  /\.prototype-option/,
  /\.prototype-img/,
  /\.proto-full/,
  /\.opt-points/,
  /\.build-prompt/,
  /side-by-side compare/i,
  /Control on the left, the recommended\s+prototype on the right/,
  /height-locked frames/i,
  /variant switcher/i,
  /options carousel/i,
  /## Agent Instructions/,
  /\.agent-instructions/,
  /\.ai-block/,
  /\.corpus/,
  /\.scalebar/,
  /\.vnav/,
  /\.cluster-label/,
  /\.rec-intro/,
  /\.why-h/,
  /Report rescale \+ lightbox/,
  /Creativity engine/,
  /Bet archetypes/,
  /Safe bet/,
  /Bold bet/,
  /Wild card/,
  /planning-meeting test/i,
  /reasonableness test/i,
  /prevalence ceiling/i,
  /Divergence between options/,
  /Hypothesis-to-prototype workflow/,
  /2-4 bets/,
  /detailed `\.build-prompt`/i,
  /generated bitmap prototype images/i,
  /image generation is available/i,
  /HTML\/CSS only as a fallback/i,
  /same-size `\.prototype-option` card/i,
  /horizontal snap scroller/i,
  /recommended first/i,
  /never as standalone metric chips/i,
  /8 selected references/,
  /Fast parallel image generation/,
  /launch all prototype generations in\s+parallel/i,
  /medium effort/i,
  /low effort/i,
  /Normal skill execution must not run full `npm test`/,
  /REPORT_CONTRACT_OK/,
  /REPORT_CONTRACT_FAILED/,
  /option-tabs/,
  /option-panel/,
  /Reference Evidence/,
  /Source Notes/,
  /Never publish a `lazyweb-deep-design-research` report that fails this gate/,
  /Provider priority order/,
  /Capability probe/,
  /imagegen-capability\.json/,
  /OpenAI Images API/,
  /generate-prototypes\.py/,
  /fetch-evidence\.py/,
  /native host image generation tool/i,
  /Nano Banana/,
  /Gemini/,
  /CONTROL/,
  /WHAT TO IMPROVE/,
  /HOW TO IMPROVE/,
  /INSPIRATION/,
  /ATTACHMENTS/,
  /INSPO A/,
  /INSPO B/,
  /Anti-collapse rules/,
  /persuasion mechanism/,
  /information architecture/,
  /trust source/,
  /primary\s+component set/i,
  /Long-scroll pages/i,
  /decisive region/i,
  /8-16 points/i,
  /image-only/i,
  /## Comparison Eval Contract/,
  /metrics\.json/,
  /Total elapsed time/,
  /Per-step timing/,
  /Tool-call count/,
  /Design-reference count/,
  /fresh context/i,
  /Easy to parse/,
  /Sharp recommendation/,
  /Trust in process\/evidence/
]) {
  assert.match(designResearchAll, pattern, `design-research v3 contract missing ${pattern}`);
}

for (const forbiddenHeading of [
  /^## Recommendations \/ Next Steps\b/m,
  /^## Key Examples\b/m,
  /^## Patterns\b/m,
  /^## Anti-Patterns\b/m,
  /^## Unique Angles\b/m,
  /^## Findings\b/m,
  /^## Sources\b/m
]) {
  assert.doesNotMatch(designResearchAll, forbiddenHeading, `design-research should not reintroduce old visible report heading ${forbiddenHeading}`);
}
for (const removedPatternsToken of [
  /\.pattern-shot/,
  /\.patterns-grid/,
  /\.bbox/,
  /\.annotated\b/,
  /## Interesting Patterns/
]) {
  assert.doesNotMatch(designResearchAll, removedPatternsToken, `removed Interesting Patterns machinery must not reappear: ${removedPatternsToken}`);
}

for (const forbiddenV2Pattern of [
  /\.inspo-card/,
  /\.rec-copy/,
  /\.anno-shot/,
  /\.anno-box/,
  /<h3>Rec<\/h3>/,
  /<h3>Why<\/h3>/
]) {
  assert.doesNotMatch(designResearchAll, forbiddenV2Pattern, `design-research v3 should keep Recommendation side-by-side, option-led, and inspo image-only: ${forbiddenV2Pattern}`);
}

for (const guidanceFile of ["AGENTS.md", "CLAUDE.md"]) {
  const guidance = read(guidanceFile);
  assert.match(guidance, /report v3/, `${guidanceFile} should document the design-research v3 exception`);
  assert.match(guidance, /\.compare.*\.option-deck/s, `${guidanceFile} should name the design-research v3 components`);
  assert.match(guidance, /side-by-side `\.compare`.*Control × Recommended.*height-locked frames.*variant switcher/s, `${guidanceFile} should require side-by-side control/recommendation comparison for design-research v3`);
  assert.match(guidance, /ranking is carried by order \+ a `Recommended` flag/, `${guidanceFile} should require order plus Recommended flag for design-research ranking`);
  assert.match(guidance, /renders no patterns/, `${guidanceFile} should state design-research v3 has no patterns section`);
  assert.match(guidance, /CSS gotcha/, `${guidanceFile} should carry the font-shorthand CSS gotcha`);
}

// The invalid `font: ... inherit` shorthand is silently dropped by browsers;
// the prose mention ends with a backtick, real CSS ends with ; or } — only the
// latter is forbidden. Scoped to design-research for now: the other skills'
// CSS contracts still carry the legacy bug (tracked for a separate fix) —
// broaden to allSkillText once they are cleaned.
assert.doesNotMatch(designResearchAll, /font:[^;{}`]*\binherit\s*[;}]/, "design-research CSS contract must not use `inherit` inside the font shorthand (browsers drop the declaration)");

assert.match(allSkillText, /signed for\s+365 days/i, "skill docs should state Lazyweb storage image URLs are signed for 365 days");
assert.doesNotMatch(allSkillText, /signed for\s+90 days/i, "stale 90-day signing claim must not reappear in skill docs");
assert.doesNotMatch(read("README.md"), /signed for\s+90 days/i, "stale 90-day signing claim must not reappear in README.md");
assert.match(allSkillText, /lazyweb_find_similar` accepts `image_url` or `image_base64`/i, "router should document lazyweb_find_similar image URL input");

console.log("Lazyweb skill-pack validation passed");
