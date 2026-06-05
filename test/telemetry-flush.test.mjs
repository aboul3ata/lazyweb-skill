import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync, mkdirSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import http from "node:http";

const FLUSH = path.resolve(import.meta.dirname, "../plugins/lazyweb/bin/lazyweb-telemetry-flush");

function startServer() {
  return new Promise((resolve) => {
    const received = [];
    const server = http.createServer((req, res) => {
      let body = "";
      req.on("data", (c) => (body += c));
      req.on("end", () => {
        try { received.push(JSON.parse(body)); } catch (_) {}
        res.writeHead(200, { "content-type": "application/json" });
        res.end('{"ok":true}');
      });
    });
    server.listen(0, "127.0.0.1", () => resolve({ server, received, url: `http://127.0.0.1:${server.address().port}/events` }));
  });
}

function setup(consent) {
  const home = mkdtempSync(path.join(tmpdir(), "lazyweb-flush-"));
  const analytics = path.join(home, ".lazyweb", "analytics");
  mkdirSync(analytics, { recursive: true });
  writeFileSync(path.join(analytics, "events.jsonl"), JSON.stringify({ v: 1, event: "query", session_id: "s1", turn: 1 }) + "\n");
  if (consent != null) writeFileSync(path.join(home, ".lazyweb", "telemetry-consent"), consent);
  return { home, analytics };
}

// Use async spawn (not spawnSync): the mock server runs in this same process, so
// blocking the event loop would prevent it from ever answering the child's request.
function runFlush(home, analytics, url) {
  return new Promise((resolve) => {
    const child = spawn("node", [FLUSH], {
      env: { ...process.env, HOME: home, LAZYWEB_ANALYTICS_DIR: analytics, LAZYWEB_EVENTS_URL: url }
    });
    child.on("close", (code) => resolve(code));
  });
}

test("uploads pending events when consent is community", async () => {
  const { server, received, url } = await startServer();
  try {
    const { home, analytics } = setup("community");
    const code = await runFlush(home, analytics, url);
    assert.equal(code, 0);
    assert.equal(received.length, 1);
    assert.equal(received[0].events.length, 1);
    assert.ok(existsSync(path.join(analytics, ".uploaded-offset")));
    rmSync(home, { recursive: true, force: true });
  } finally { server.close(); }
});

test("does NOT upload when consent is off (opt-in gate)", async () => {
  const { server, received, url } = await startServer();
  try {
    const { home, analytics } = setup("off");
    await runFlush(home, analytics, url);
    assert.equal(received.length, 0);
    rmSync(home, { recursive: true, force: true });
  } finally { server.close(); }
});

test("does NOT upload when consent is absent", async () => {
  const { server, received, url } = await startServer();
  try {
    const { home, analytics } = setup(null);
    await runFlush(home, analytics, url);
    assert.equal(received.length, 0);
    rmSync(home, { recursive: true, force: true });
  } finally { server.close(); }
});
