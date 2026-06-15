import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

// The design-best-practices skill is a curated routing table: each topic
// section carries a tl;dr of actionable rules and ranked picks whose value
// IS the pointer URL the agent fetches at runtime. These tests guard the
// two ways the file can rot: structural drift (a section losing its tl;dr,
// default pick, or pointer) and pointer rot (a raw SKILL.md URL going 404,
// which would make the agent silently fall back to memory).

const root = path.resolve(import.meta.dirname, "..");
const skillPath = path.join(root, "skills", "lazyweb-design-best-practices", "SKILL.md");
const text = readFileSync(skillPath, "utf8");

const sections = [...text.matchAll(/^## For (.+?) use these$/gm)].map((m) => m[1]);

function sectionBody(title) {
  const start = text.indexOf(`## For ${title} use these`);
  const rest = text.slice(start + 1);
  const next = rest.search(/^## /m);
  return next === -1 ? text.slice(start) : text.slice(start, start + 1 + next);
}

const pointerUrls = [...new Set(
  [...text.matchAll(/fetch `(https:\/\/[^`]+)`/g)].map((m) => m[1])
)];

// Pointers route through the Lazyweb resolver, which 302-redirects to the
// canonical raw URL carried in its `u=` param (so we get routing analytics on
// the fetch the agent already makes). Tests validate the wrapper AND the
// decoded destination; live fetches hit the destination directly so they don't
// depend on the resolver being deployed.
const RESOLVER = "https://www.lazyweb.com/r";
function canonicalOf(pointer) {
  const url = new URL(pointer);
  assert.equal(url.origin + url.pathname, RESOLVER, `pointer must route through the resolver: ${pointer}`);
  const u = url.searchParams.get("u");
  assert.ok(u, `resolver pointer missing u= param: ${pointer}`);
  return u;
}
const canonicalUrls = [...new Set(pointerUrls.map(canonicalOf))];

test("routing table covers the core design aspects", () => {
  assert.ok(sections.length >= 8, `expected >=8 topic sections, found ${sections.length}`);
  for (const expected of ["web animation", "frontend", "landing pages", "typography", "color", "design systems", "accessibility", "mobile"]) {
    assert.ok(
      sections.some((s) => s.toLowerCase().includes(expected)),
      `missing a topic section covering "${expected}"`
    );
  }
});

test("every topic section has an actionable tl;dr, ranked picks, and one default pick", () => {
  for (const title of sections) {
    const body = sectionBody(title);
    assert.match(body, /\*\*tl;dr\*\*/, `${title}: missing tl;dr`);
    assert.match(body, /\*\*Best specific skills\*\*/, `${title}: missing Best specific skills`);
    assert.match(body, /^1\. \*\*/m, `${title}: picks must be a ranked numbered list`);
    const defaults = body.match(/← default pick/g) ?? [];
    assert.ok(defaults.length >= 1, `${title}: must mark at least one "← default pick"`);

    const tldr = body.slice(body.indexOf("**tl;dr**"), body.indexOf("**Best specific skills**"));
    const bullets = tldr.match(/^- /gm) ?? [];
    assert.ok(bullets.length >= 1 && bullets.length <= 3, `${title}: tl;dr must be 1-3 bullets, found ${bullets.length}`);
    // tl;dr bullets are the things to DO, not skill/repo meta-commentary.
    assert.doesNotMatch(tldr, /\b(?:installs?|stars|skills\.sh|registry|registries|roundups?|repo)\b/i,
      `${title}: tl;dr must carry actionable design rules, not skill/repo popularity talk`);
  }
});

test("every pick carries an evidence-strength label and the file carries a researched date", () => {
  assert.match(text, /\*\*Researched: \d{4}-\d{2}-\d{2}\.\*\*/, "missing researched date stamp");
  for (const title of sections) {
    const body = sectionBody(title);
    const picks = body.match(/^\d+\. \*\*/gm) ?? [];
    const strengths = body.match(/Strength: (?:strong|directional|single-source)/g) ?? [];
    assert.ok(strengths.length >= picks.length,
      `${title}: every ranked pick needs a Strength label (${strengths.length} labels for ${picks.length} picks)`);
  }
});

test("pointer URLs route through the resolver to raw fetchable instruction files", () => {
  assert.ok(pointerUrls.length >= 15, `expected >=15 pointer URLs, found ${pointerUrls.length}`);
  for (const pointer of pointerUrls) {
    const params = new URL(pointer).searchParams;
    assert.ok(params.get("t"), `pointer missing topic (t=): ${pointer}`);
    assert.ok(params.get("s"), `pointer missing skill (s=): ${pointer}`);
    assert.match(canonicalOf(pointer), /^https:\/\/raw\.githubusercontent\.com\/.+\.md$/,
      `resolver u= must be a raw .md URL an agent can fetch as text: ${pointer}`);
  }
});

// Live pointer-rot check. Real network calls on purpose — the whole skill is
// "fetch this URL and follow it", so a 404 here is a product bug, not flake.
// Skippable for offline runs: LAZYWEB_SKIP_NETWORK_TESTS=1 npm test
test(
  "every pointer URL resolves to real instruction content",
  { skip: process.env.LAZYWEB_SKIP_NETWORK_TESTS ? "LAZYWEB_SKIP_NETWORK_TESTS set" : false },
  async () => {
    const results = await Promise.all(canonicalUrls.map(async (url) => {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(20000), redirect: "follow" });
        const body = res.ok ? await res.text() : "";
        return { url, status: res.status, length: body.length };
      } catch (err) {
        return { url, status: 0, length: 0, error: String(err) };
      }
    }));
    const broken = results.filter((r) => r.status !== 200);
    assert.deepEqual(broken, [], `broken pointer URLs (re-run the Refresh protocol for their topics): ${JSON.stringify(broken, null, 2)}`);
    // A 200 that returns a stub/empty file is still rot.
    const thin = results.filter((r) => r.length < 500);
    assert.deepEqual(thin, [], `pointer URLs returned suspiciously thin content: ${JSON.stringify(thin, null, 2)}`);
  }
);
