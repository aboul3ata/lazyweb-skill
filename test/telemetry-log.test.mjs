import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const LOG = path.resolve(import.meta.dirname, "../plugins/lazyweb/bin/lazyweb-log");

function withDir(fn) {
  const dir = mkdtempSync(path.join(tmpdir(), "lazyweb-log-"));
  try { return fn(dir); } finally { rmSync(dir, { recursive: true, force: true }); }
}

function feed(kind, payload, dir) {
  return spawnSync("node", [LOG, kind], {
    input: JSON.stringify(payload),
    encoding: "utf8",
    env: { ...process.env, LAZYWEB_ANALYTICS_DIR: dir }
  });
}

function readEvents(dir) {
  const f = path.join(dir, "events.jsonl");
  return existsSync(f) ? readFileSync(f, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)) : [];
}

test("query event captures prompt and starts turn 1", () => {
  withDir((dir) => {
    feed("query", { session_id: "s1", prompt: "research onboarding flows", cwd: "/x" }, dir);
    const ev = readEvents(dir);
    assert.equal(ev.length, 1);
    assert.equal(ev[0].event, "query");
    assert.equal(ev[0].turn, 1);
    assert.equal(ev[0].data.prompt, "research onboarding flows");
  });
});

test("tool input is redacted (base64 image + bearer token)", () => {
  withDir((dir) => {
    feed("query", { session_id: "s1", prompt: "x" }, dir);
    feed("tool", {
      session_id: "s1",
      tool_name: "mcp__lazyweb__lazyweb_compare_image",
      tool_input: { image_base64: "AAAA".repeat(400), authorization: "Bearer abc.def.ghi", query: "pricing" },
      tool_response: { ok: true }
    }, dir);
    const tool = readEvents(dir).find((e) => e.event === "tool");
    assert.equal(tool.data.input.image_base64, "[redacted]");
    assert.equal(tool.data.input.authorization, "[redacted]");
    assert.equal(tool.data.input.query, "pricing"); // non-secret value preserved
    assert.equal(tool.data.ok, true);
  });
});

test("query / tool / self_eval correlate on (session, turn)", () => {
  withDir((dir) => {
    feed("query", { session_id: "s9", prompt: "improve my pricing page" }, dir);
    feed("tool", { session_id: "s9", tool_name: "mcp__lazyweb__lazyweb_search", tool_input: { query: "pricing" } }, dir);
    feed("stop", { session_id: "s9", last_assistant_message: 'done <lazyweb-eval>{"got_stuck":false,"quality":8,"unmet_need":"none"}</lazyweb-eval>' }, dir);
    const ev = readEvents(dir);
    assert.deepEqual([...new Set(ev.map((e) => e.turn))], [1]); // all in turn 1
    const se = ev.find((e) => e.event === "self_eval");
    assert.ok(se);
    assert.equal(se.data.quality, 8);
    assert.equal(se.data.got_stuck, false);
  });
});

test("stop without an eval block emits turn_end but no self_eval", () => {
  withDir((dir) => {
    feed("query", { session_id: "s2", prompt: "x" }, dir);
    feed("stop", { session_id: "s2", last_assistant_message: "all done, no block here" }, dir);
    const ev = readEvents(dir);
    assert.ok(ev.find((e) => e.event === "turn_end"));
    assert.equal(ev.find((e) => e.event === "self_eval"), undefined);
  });
});

test("malformed payload never errors (exit 0)", () => {
  withDir((dir) => {
    const res = spawnSync("node", [LOG, "query"], { input: "not json", encoding: "utf8", env: { ...process.env, LAZYWEB_ANALYTICS_DIR: dir } });
    assert.equal(res.status, 0);
  });
});

test("two prompts in one session advance the turn counter", () => {
  withDir((dir) => {
    feed("query", { session_id: "s3", prompt: "first" }, dir);
    feed("query", { session_id: "s3", prompt: "second" }, dir);
    assert.deepEqual(readEvents(dir).filter((e) => e.event === "query").map((e) => e.turn), [1, 2]);
  });
});
