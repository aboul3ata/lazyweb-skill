import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const pluginDir = path.join(root, "plugins/lazyweb");

const publicTools = new Set([
  "lazyweb_health",
  "lazyweb_search",
  "lazyweb_find_similar",
  "lazyweb_compare_image",
  "search_screenshots",
  "list_filters",
  "list_all_filters",
  "vision_screenshots",
  "metadata_screenshots",
  "get_company_details",
  "list_companies_by_categories"
]);

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.join(root, relativePath), "utf8"));
}

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options
  });
}

function hasCommand(command) {
  const result = run("sh", ["-lc", `command -v ${command}`]);
  return result.status === 0;
}

function assertManifest() {
  const codex = readJson("plugins/lazyweb/.codex-plugin/plugin.json");
  assert.equal(codex.name, "lazyweb");
  assert.equal(codex.repository, "https://github.com/aboul3ata/lazyweb-skill");
  assert.equal(codex.skills, "./skills/");
  assert.equal(codex.mcpServers, "./.mcp.json");

  const claude = readJson("plugins/lazyweb/.claude-plugin/plugin.json");
  assert.equal(claude.name, "lazyweb");
  assert.match(claude.description, /Lazyweb design research/);
  assert.equal(claude.repository, "https://github.com/aboul3ata/lazyweb-skill");

  const claudeMarketplace = readJson(".claude-plugin/marketplace.json");
  assert.equal(claudeMarketplace.name, "lazyweb");
  assert.equal(claudeMarketplace.plugins[0].source, "./plugins/lazyweb");

  const codexMarketplace = readJson(".agents/plugins/marketplace.json");
  assert.equal(codexMarketplace.name, "lazyweb");
  assert.equal(codexMarketplace.plugins[0].source.path, "./plugins/lazyweb");
}

function assertMcpConfig() {
  const config = readJson("plugins/lazyweb/.mcp.json");
  const server = config.mcpServers?.lazyweb;
  assert.equal(server.command, "sh");
  const command = server.args?.join(" ");
  assert.match(command, /https:\/\/www\.lazyweb\.com\/mcp/);
  assert.match(command, /LAZYWEB_MCP_TOKEN/);
  assert.match(command, /\.lazyweb\/lazyweb_mcp_token/);
  assert.match(command, /\.codex\/lazyweb_mcp_token/);
  assert.ok(
    command.indexOf("LAZYWEB_MCP_TOKEN") < command.indexOf(".lazyweb/lazyweb_mcp_token") &&
      command.indexOf(".lazyweb/lazyweb_mcp_token") < command.indexOf(".codex/lazyweb_mcp_token"),
    "token fallback order must be env, ~/.lazyweb, ~/.codex"
  );
}

function assertSkills() {
  const skillsDir = path.join(pluginDir, "skills");
  const skillFiles = run("sh", ["-lc", `find ${JSON.stringify(skillsDir)} -path '*/SKILL.md' -type f | sort`]);
  assert.equal(skillFiles.status, 0, skillFiles.stderr);
  const files = skillFiles.stdout.trim().split("\n").filter(Boolean);
  assert.ok(files.length >= 4, "expected bundled Lazyweb skills");

  const mentionedTools = new Set();
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    assert.match(text, /^---\n[\s\S]+?\n---\n/, `${file} missing YAML frontmatter`);
    assert.match(text, /^name:\s*.+$/m, `${file} missing skill name`);
    assert.match(text, /^description:\s*(\||>|.+)$/m, `${file} missing description`);
    for (const match of text.matchAll(/\b(?:lazyweb_[a-z_]+|search_screenshots|list_filters|list_all_filters|vision_screenshots|metadata_screenshots|get_company_details|list_companies_by_categories)\b/g)) {
      mentionedTools.add(match[0]);
    }
  }

  for (const tool of mentionedTools) {
    assert.ok(publicTools.has(tool), `skill docs mention an unknown Lazyweb MCP tool: ${tool}`);
  }
}

function assertClaudeCli() {
  if (!hasCommand("claude")) {
    console.log("skip claude plugin validate: claude CLI not found");
    return;
  }

  for (const target of [pluginDir, root]) {
    const result = run("claude", ["plugin", "validate", target]);
    assert.equal(result.status, 0, result.stdout + result.stderr);
  }
}

function assertCodexCli() {
  if (!hasCommand("codex")) {
    console.log("skip codex marketplace install: codex CLI not found");
    return;
  }

  const temp = mkdtempSync(path.join(tmpdir(), "lazyweb-codex-plugin-"));
  try {
    const home = path.join(temp, "home");
    const codexHome = path.join(temp, "codex");
    run("mkdir", ["-p", home, codexHome]);
    const result = run("codex", ["plugin", "marketplace", "add", root], {
      env: {
        ...process.env,
        HOME: home,
        CODEX_HOME: codexHome
      }
    });
    assert.equal(result.status, 0, result.stdout + result.stderr);
    const configPath = path.join(codexHome, "config.toml");
    assert.ok(existsSync(configPath), "codex marketplace install did not write temp config");
    assert.match(readFileSync(configPath, "utf8"), /\[marketplaces\.lazyweb\]/);
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const text = await response.text();
  assert.ok(response.ok, `${url} failed: ${response.status} ${text.slice(0, 500)}`);
  return JSON.parse(text);
}

async function listLiveMcpTools() {
  const tokenPayload = await fetchJson("https://www.lazyweb.com/api/mcp/install-token", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: "{}"
  });
  const token = tokenPayload.token;
  assert.ok(token, "install-token did not return token");

  const mcpUrl = tokenPayload.mcpUrl || "https://www.lazyweb.com/mcp";
  const baseHeaders = {
    "content-type": "application/json",
    accept: "application/json, text/event-stream",
    authorization: `Bearer ${token}`,
    "mcp-protocol-version": "2025-06-18"
  };
  const initResponse = await fetch(mcpUrl, {
    method: "POST",
    headers: baseHeaders,
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-06-18",
        capabilities: {},
        clientInfo: { name: "lazyweb-plugin-validation", version: "1.0.0" }
      }
    })
  });
  const initText = await initResponse.text();
  assert.ok(initResponse.ok, `MCP initialize failed: ${initResponse.status} ${initText.slice(0, 500)}`);
  const sessionId = initResponse.headers.get("mcp-session-id");
  const headers = sessionId ? { ...baseHeaders, "mcp-session-id": sessionId } : baseHeaders;

  await fetch(mcpUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized", params: {} })
  });

  const toolsResponse = await fetch(mcpUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} })
  });
  const toolsText = await toolsResponse.text();
  assert.ok(toolsResponse.ok, `MCP tools/list failed: ${toolsResponse.status} ${toolsText.slice(0, 500)}`);
  const payload = JSON.parse(toolsText);
  return new Set((payload.result?.tools || []).map((tool) => tool.name));
}

async function assertLiveMcpToolNamesWhenRequested() {
  if (process.env.RUN_LIVE_MCP_TESTS !== "1") {
    console.log("skip live MCP tool-name check: set RUN_LIVE_MCP_TESTS=1 to enable");
    return;
  }

  const liveTools = await listLiveMcpTools();
  for (const tool of ["lazyweb_health", "lazyweb_search", "lazyweb_find_similar", "lazyweb_compare_image"]) {
    assert.ok(liveTools.has(tool), `live MCP missing compatibility tool ${tool}`);
  }
  for (const tool of publicTools) {
    if (tool.startsWith("lazyweb_")) continue;
    assert.ok(liveTools.has(tool), `live MCP missing canonical tool ${tool}`);
  }
}

assertManifest();
assertMcpConfig();
assertSkills();
assertClaudeCli();
assertCodexCli();
await assertLiveMcpToolNamesWhenRequested();
console.log("Lazyweb plugin validation passed");
