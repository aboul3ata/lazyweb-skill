import assert from "node:assert/strict";
import { test } from "node:test";
import { execFile } from "node:child_process";
import http from "node:http";
import { mkdtempSync, readFileSync, writeFileSync, statSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const FETCH = path.join(root, "skills/lazyweb-deep-design-research/fetch-evidence.py");
const GEN = path.join(root, "skills/lazyweb-deep-design-research/generate-prototypes.py");

// 1x1 transparent PNG
const PNG_B64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

function startServer(handler) {
  return new Promise((resolve) => {
    const srv = http.createServer(handler);
    srv.listen(0, "127.0.0.1", () => resolve({ srv, port: srv.address().port }));
  });
}

function runPy(script, args, env) {
  // async spawn: a sync exec would block the event loop and starve the
  // in-process mock servers these tests rely on.
  return new Promise((resolve) => {
    execFile("python3", [script, ...args],
      { encoding: "utf8", env: { ...process.env, ...env }, timeout: 60000 },
      (err, stdout, stderr) => {
        resolve({ code: err ? (err.code ?? 1) : 0, out: `${stdout || ""}${stderr || ""}` });
      });
  });
}

function mcpHandler(perQuery) {
  return (req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      const msg = JSON.parse(body || "{}");
      if (msg.method === "initialize") {
        res.setHeader("Mcp-Session-Id", "test-session");
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ jsonrpc: "2.0", id: msg.id, result: { protocolVersion: "2025-06-18" } }));
        return;
      }
      if (msg.method === "notifications/initialized") {
        res.statusCode = 202;
        res.end();
        return;
      }
      assert.equal(req.headers["mcp-session-id"], "test-session", "session header must persist");
      const q = msg.params.arguments.query;
      const behavior = perQuery[q] || { refs: [] };
      if (behavior.http500) {
        res.statusCode = 500;
        res.end("boom");
        return;
      }
      res.setHeader("Content-Type", "application/json");
      if (behavior.malformed) {
        res.end("{not json");
        return;
      }
      res.end(JSON.stringify({
        jsonrpc: "2.0", id: msg.id,
        result: { content: [{ type: "text", text: JSON.stringify({ results: behavior.refs, coverage: behavior.coverage }) }] },
      }));
    });
  };
}

function plan(queries) {
  return { skill: "deep-design-research", version: "0.0.0-test", queries };
}

const REF = (company, page, n) => ({
  imageUrl: `https://img.example/${company}/${n}.png`,
  visionDescription: `${company} pricing screen ${n}`,
  company, pageUrl: page, platform: "desktop", similarity: 0.5, matchCount: 2,
});

test("fetch: happy path merges and dedupes same-company/page references", async () => {
  const { srv, port } = await startServer(mcpHandler({
    q1: { refs: [REF("acme", "https://acme.com/pricing", 1), REF("acme", "https://acme.com/pricing", 2), REF("beta", "https://beta.io/p", 1)] },
    q2: { refs: [REF("gamma", "https://gamma.dev/p", 1)] },
  }));
  const dir = mkdtempSync(path.join(tmpdir(), "lw-fetch-"));
  const planFile = path.join(dir, "plan.json");
  writeFileSync(planFile, JSON.stringify(plan([
    { id: "q1", pass: "A", tool: "lazyweb_search", args: { query: "q1", limit: 5 } },
    { id: "q2", pass: "B", tool: "lazyweb_search", args: { query: "q2", limit: 5 } },
  ])));
  const out = path.join(dir, "evidence.json");
  const res = await runPy(FETCH, ["--plan", planFile, "--out", out],
    { LAZYWEB_MCP_URL: `http://127.0.0.1:${port}`, LAZYWEB_MCP_TOKEN: "tok" });
  srv.close();
  assert.equal(res.code, 0, res.out);
  const ev = JSON.parse(readFileSync(out, "utf8"));
  assert.equal(ev.coverage_summary.succeeded, 2);
  assert.equal(ev.coverage_summary.raw_references, 4);
  assert.equal(ev.coverage_summary.deduped_references, 3, "duplicate acme/pricing ref must collapse");
  assert.ok(ev.references.every((r) => r.imageUrl && r.visionDescription), "imageUrl/visionDescription verbatim");
  const summary = JSON.parse(readFileSync(path.join(dir, "evidence-summary.json"), "utf8"));
  assert.equal(summary.references.length, 3, "summary mirrors deduped refs");
  assert.ok(summary.references.every((r) => r.vd.length <= 180 && !("imageUrl" in r)), "summary is compact: truncated vd, no URLs");
});

test("fetch: missing token exits 2 (fallback signal)", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "lw-fetch-"));
  const planFile = path.join(dir, "plan.json");
  writeFileSync(planFile, JSON.stringify(plan([{ id: "q1", tool: "lazyweb_search", args: { query: "x" } }])));
  const res = await runPy(FETCH, ["--plan", planFile, "--out", path.join(dir, "e.json")],
    { LAZYWEB_MCP_URL: "http://127.0.0.1:1", LAZYWEB_MCP_TOKEN: "", HOME: dir });
  assert.equal(res.code, 2);
  assert.match(res.out, /FETCH_FALLBACK: no Lazyweb MCP token/);
});

test("fetch: >50% query failure exits 2 but still writes evidence", async () => {
  const { srv, port } = await startServer(mcpHandler({
    q1: { http500: true }, q2: { http500: true },
    q3: { refs: [REF("acme", "https://acme.com/p", 1)] },
  }));
  const dir = mkdtempSync(path.join(tmpdir(), "lw-fetch-"));
  const planFile = path.join(dir, "plan.json");
  writeFileSync(planFile, JSON.stringify(plan([
    { id: "q1", tool: "lazyweb_search", args: { query: "q1" } },
    { id: "q2", tool: "lazyweb_search", args: { query: "q2" } },
    { id: "q3", tool: "lazyweb_search", args: { query: "q3" } },
  ])));
  const out = path.join(dir, "evidence.json");
  const res = await runPy(FETCH, ["--plan", planFile, "--out", out],
    { LAZYWEB_MCP_URL: `http://127.0.0.1:${port}`, LAZYWEB_MCP_TOKEN: "tok" });
  srv.close();
  assert.equal(res.code, 2, res.out);
  const ev = JSON.parse(readFileSync(out, "utf8"));
  assert.equal(ev.coverage_summary.failed.length, 2);
  assert.equal(ev.coverage_summary.succeeded, 1);
});

test("fetch: malformed JSON on one query is a recorded miss, run continues", async () => {
  const { srv, port } = await startServer(mcpHandler({
    q1: { malformed: true },
    q2: { refs: [REF("acme", "https://acme.com/p", 1)] },
    q3: { refs: [REF("beta", "https://beta.io/p", 1)] },
  }));
  const dir = mkdtempSync(path.join(tmpdir(), "lw-fetch-"));
  const planFile = path.join(dir, "plan.json");
  writeFileSync(planFile, JSON.stringify(plan([
    { id: "q1", tool: "lazyweb_search", args: { query: "q1" } },
    { id: "q2", tool: "lazyweb_search", args: { query: "q2" } },
    { id: "q3", tool: "lazyweb_search", args: { query: "q3" } },
  ])));
  const out = path.join(dir, "evidence.json");
  const res = await runPy(FETCH, ["--plan", planFile, "--out", out],
    { LAZYWEB_MCP_URL: `http://127.0.0.1:${port}`, LAZYWEB_MCP_TOKEN: "tok" });
  srv.close();
  assert.equal(res.code, 0, res.out);
  const ev = JSON.parse(readFileSync(out, "utf8"));
  assert.deepEqual(ev.coverage_summary.failed, ["q1"]);
});

function openaiHandler(state) {
  return (req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      if (req.url.endsWith("/models")) {
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ data: [{ id: "gpt-image-1" }, { id: "gpt-image-2-2026-04-21" }, { id: "gpt-4o" }] }));
        return;
      }
      const msg = JSON.parse(body);
      state.calls.push(msg.prompt);
      if (msg.prompt.includes("REFUSE-ME") ) {
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: { message: "rejected by safety system", code: "moderation_blocked" } }));
        return;
      }
      if (msg.prompt.includes("SERVER-DIES")) {
        res.statusCode = 500;
        res.end("boom");
        return;
      }
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ data: [{ b64_json: PNG_B64 }] }));
    });
  };
}

test("probe: picks newest gpt-image-*, writes 0600 cache, busts on version change", async () => {
  const { srv, port } = await startServer(openaiHandler({ calls: [] }));
  const dir = mkdtempSync(path.join(tmpdir(), "lw-gen-"));
  const cache = path.join(dir, "cap.json");
  const env = {
    OPENAI_BASE_URL: `http://127.0.0.1:${port}`, OPENAI_API_KEY: "test-key",
    LAZYWEB_CAP_CACHE: cache, PATH: "/usr/bin:/bin", // no codex on PATH -> dead, fast
  };
  const r1 = await runPy(GEN, ["probe", "--skill-version", "1.0.0"], env);
  assert.equal(r1.code, 0, r1.out);
  assert.match(r1.out, /PROBE_FRESH/);
  const cap = JSON.parse(readFileSync(cache, "utf8"));
  assert.equal(cap.openai, "ok");
  assert.equal(cap.openai_model, "gpt-image-2-2026-04-21", "must pick newest gpt-image-*");
  assert.equal(cap.codex, "dead");
  assert.equal(statSync(cache).mode & 0o777, 0o600, "cache must be 0600");
  const r2 = await runPy(GEN, ["probe", "--skill-version", "1.0.0"], env);
  assert.match(r2.out, /PROBE_CACHED/, "same version within TTL uses cache");
  const r3 = await runPy(GEN, ["probe", "--skill-version", "2.0.0"], env);
  assert.match(r3.out, /PROBE_FRESH/, "version change must bust the cache");
  srv.close();
});

test("generate: happy + refusal-with-debranded-retry + hard failure produce per-bet statuses", async () => {
  const state = { calls: [] };
  const { srv, port } = await startServer(openaiHandler(state));
  const dir = mkdtempSync(path.join(tmpdir(), "lw-gen-"));
  const cache = path.join(dir, "cap.json");
  writeFileSync(cache, JSON.stringify({ openai_model: "gpt-image-2-2026-04-21" }));
  const bets = path.join(dir, "bets.json");
  writeFileSync(bets, JSON.stringify([
    { slug: "happy", prompt: "a nice pricing page" },
    { slug: "refused", prompt: "REFUSE-ME branded page", debranded_prompt: "a generic page" },
    { slug: "dies", prompt: "SERVER-DIES page" },
  ]));
  const statusFile = path.join(dir, "status.json");
  const res = await runPy(GEN, ["generate", "--bets", bets, "--out-dir", dir, "--status", statusFile],
    { OPENAI_BASE_URL: `http://127.0.0.1:${port}`, OPENAI_API_KEY: "test-key", LAZYWEB_CAP_CACHE: cache });
  srv.close();
  assert.equal(res.code, 0, res.out);
  const status = JSON.parse(readFileSync(statusFile, "utf8")).bets;
  assert.equal(status.happy.status, "ok");
  assert.ok(existsSync(path.join(dir, "prototype-happy.png")));
  assert.equal(status.refused.status, "ok", "de-branded retry must rescue a refusal");
  assert.equal(status.refused.debranded_retry, true);
  assert.equal(status.dies.status, "failed", "hard failure surfaces per-bet for HTML fallback");
  assert.ok(!existsSync(path.join(dir, "prototype-dies.png")) || statSync(path.join(dir, "prototype-dies.png")).size === 0);
});

test("generate: missing key exits 2 (route-level fallback)", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "lw-gen-"));
  const bets = path.join(dir, "bets.json");
  writeFileSync(bets, JSON.stringify([{ slug: "x", prompt: "p" }]));
  const res = await runPy(GEN, ["generate", "--bets", bets, "--out-dir", dir],
    { OPENAI_API_KEY: "", HOME: dir, LAZYWEB_CAP_CACHE: path.join(dir, "cap.json") });
  assert.equal(res.code, 2);
  assert.match(res.out, /GEN_FALLBACK: no OpenAI key/);
});

const FILL = path.join(root, "skills/lazyweb-deep-design-research/fill-report.py");
const TEMPLATE = path.join(root, "skills/lazyweb-deep-design-research/report-template.html");

const FILL_DATA = {
  topic: "Acme's \"Pricing\" <Test>",
  goal: "More upgrades.",
  rec_intro: { what: "Swap the hero", why: "buyers' trust needs <proof>" },
  control: { src: "references/current-state.png", alt: 'control "shot"' },
  handoff: { report_path: "/x/report.html", task: "redesigning Acme's page",
    recs: ["Ship the trust band", "Print the SLA", "Add the data room"],
    index_on: "i", dont_index: "d", dive: "v", evidence_basis: "19 refs" },
  bets: [
    { name: "Founder's Letter", slug: "fl", recommended: true,
      img: "references/prototype-fl.png", alt: "letter with </script>\n'quotes'",
      what: "Letter replaces hero.", why: "Trust via voice.",
      deck: [
        { src: "https://i/1.png", alt: "1", source: "Lazyweb", company: "Beta<Co>", detail: "letter hero. 0 of 19." },
        { src: "https://i/2.png", alt: "2", source: "Web", company: "G", detail: "x" },
        { src: "https://i/3.png", alt: "3", source: "Lazyweb", company: "D", detail: "y" }],
      build_prompt: "Brief with \\ and 'quotes'." },
    { name: "Plain", slug: "p", recommended: false, img: "references/prototype-p.png",
      alt: "p", what: "W.", why: "Y.", deck: [], build_prompt: "B." }],
  inspo: null,
};

test("fill-report: produces a gate-passing report with correct escaping", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "lw-fill-"));
  writeFileSync(path.join(dir, "data.json"), JSON.stringify(FILL_DATA));
  const out = path.join(dir, "report.html");
  const res = await runPy(FILL, ["--data", path.join(dir, "data.json"), "--template", TEMPLATE, "--out", out], {});
  assert.equal(res.code, 0, res.out);
  const html = readFileSync(out, "utf8");
  assert.match(html, /n:'Recommended — Founder\\'s Letter'/, "JS apostrophe escaping in _vars");
  assert.match(html, /Beta&lt;Co&gt;/, "HTML escaping in captions");
  assert.ok(!html.includes("<section id=\"inspo\""), "inspo:null omits the section");
  const body = html.slice(html.indexOf("<body>"));
  const art1 = body.slice(body.indexOf("<article"), body.indexOf("</article>"));
  assert.ok(art1.includes("deck-nav"), "3-figure mini deck carries nav");
  assert.ok(!html.slice(html.indexOf("var _vars="), html.indexOf("</script>")).includes("</script>"),
    "raw data must not be able to close the generated script");
  // run the real publish gate from SKILL.md against the output
  const skill = readFileSync(path.join(root, "skills/lazyweb-deep-design-research/SKILL.md"), "utf8");
  const gatePy = skill.match(/<<'REPORT_CONTRACT_EOF'\n([\s\S]*?)\nREPORT_CONTRACT_EOF/)[1];
  writeFileSync(path.join(dir, "gate.py"), gatePy);
  const gate = await runPy(path.join(dir, "gate.py"), [out], {});
  assert.equal(gate.code, 0, gate.out);
  assert.match(gate.out, /REPORT_CONTRACT_OK/);
});

test("fill-report: missing required field fails with a named field", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "lw-fill-"));
  const bad = { ...FILL_DATA, bets: [{ ...FILL_DATA.bets[0], what: "" }, FILL_DATA.bets[1]] };
  writeFileSync(path.join(dir, "data.json"), JSON.stringify(bad));
  const res = await runPy(FILL, ["--data", path.join(dir, "data.json"), "--template", TEMPLATE, "--out", path.join(dir, "r.html")], {});
  assert.equal(res.code, 1);
  assert.match(res.out, /FILL_FAILED: missing bets\[0\]\.what/);
});
