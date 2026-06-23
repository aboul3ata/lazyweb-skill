#!/usr/bin/env python3
"""Byte-perfect image transport for the optimize-paywall skill.

WHY THIS EXISTS
---------------
The optimize-paywall pipeline's first server call sends the user's paywall
screenshot to OpenAI's vision model to LABEL the screen. That step needs the
image to arrive byte-valid. When the *agent* hand-supplies `image_base64` to the
MCP tool, a large blob can be corrupted in the agent's output tokens (observed:
"does not represent a valid image" / "invalid base64-encoded value") and is also
size-hostile through the chat/gateway transport.

This script does what the INTERNAL runner did: it reads the screenshot **from a
file**, base64-encodes it **in code**, and makes the MCP `tools/call` itself over
HTTP. The image bytes never pass through an LLM's output. The downstream server
pipeline (`_agent_synthesize`) is unchanged, so labeling / evidence / hypotheses
are identical to the internal version.

It mirrors the deep-design-research `fetch-evidence.py` MCP-client pattern.

USAGE
-----
  # 1) run synthesis from a screenshot file -> prints {synthesis_id, winners}
  python optimize_paywall.py synthesize \
      --image references/current-state.png \
      --product Reddit --conversion-goal "annual-plan share" \
      --plan-structure "monthly $6.99 / annual $59.99" [--category social] \
      [--divergence auto] [--out work/synthesis.json]

  # 2) generate ONE mockup (EDIT off the same screenshot) -> prints {image_url}
  python optimize_paywall.py mockup \
      --image references/current-state.png \
      --prompt-file work/mock-safe_bet.txt   # or --prompt "..." \
      [--out work/mock-safe_bet.json]

Exit codes: 0 ok; 2 fatal (bad token / endpoint / image / server error).
Env overrides (tests): LAZYWEB_MCP_URL, LAZYWEB_MCP_TOKEN, OPTIMIZE_PAYWALL_VERSION.
The bearer token is never printed.
"""
from __future__ import annotations

import argparse
import base64
import json
import mimetypes
import os
import pathlib
import sys
import time
import urllib.error
import urllib.request

DEFAULT_ENDPOINT = "https://www.lazyweb.com/mcp"
PROTOCOL_VERSION = "2025-06-18"
POST_TIMEOUT_S = 60
POLL_INTERVAL_S = 6.0
SYNTH_BUDGET_S = 240.0
MOCKUP_BUDGET_S = 240.0
ALLOWED_MIME = {"image/png", "image/jpeg", "image/webp"}
# Above this base64 length the screenshot is uploaded to lazybackend for a signed
# URL instead of going inline — the gateway 413s large MCP request bodies (a
# ~380KB PNG / 507KB b64 is fine; full-res ~2.6MB+ b64 gets rejected). The upload
# goes DIRECT to lazybackend, which has no such cap.
UPLOAD_THRESHOLD_B64 = 1_400_000
LAZYBACKEND_URL = os.environ.get("LAZYBACKEND_URL", "https://lazybackend-jgpo.onrender.com")


def log(msg: str) -> None:
    print(msg, file=sys.stderr)


def fatal(msg: str) -> "None":
    log(f"ERROR: {msg}")
    sys.exit(2)


def skill_version() -> str:
    env = os.environ.get("OPTIMIZE_PAYWALL_VERSION", "").strip()
    if env:
        return env
    p = pathlib.Path.home() / ".lazyweb" / "VERSION"
    try:
        return p.read_text(encoding="utf-8").strip() or "0.0.0"
    except OSError:
        return "0.0.0"


def load_token() -> str:
    tok = os.environ.get("LAZYWEB_MCP_TOKEN", "").strip()
    if tok:
        return tok
    p = pathlib.Path.home() / ".lazyweb" / "lazyweb_mcp_token"
    if p.is_file():
        return p.read_text(encoding="utf-8").strip()
    return ""


def read_image_b64(path_str: str) -> tuple[str, str]:
    """Return (base64_no_newlines, mime). Validates the file is a real image."""
    p = pathlib.Path(path_str).expanduser()
    if not p.is_file():
        fatal(f"image not found: {p}")
    raw = p.read_bytes()
    if len(raw) < 64:
        fatal(f"image is only {len(raw)} bytes — empty or truncated: {p}")
    mime = mimetypes.guess_type(str(p))[0] or ""
    if mime not in ALLOWED_MIME:
        # sniff magic bytes as a fallback
        if raw[:3] == b"\xff\xd8\xff":
            mime = "image/jpeg"
        elif raw[:8] == b"\x89PNG\r\n\x1a\n":
            mime = "image/png"
        elif raw[:4] == b"RIFF" and raw[8:12] == b"WEBP":
            mime = "image/webp"
        else:
            fatal(f"unsupported image type ({mime or 'unknown'}); use PNG/JPEG/WebP: {p}")
    b64 = base64.b64encode(raw).decode("ascii")  # standard, no newlines
    return b64, mime


def parse_body(raw: bytes, content_type: str | None):
    """Accept plain JSON or SSE-framed (text/event-stream) JSON-RPC."""
    text = raw.decode("utf-8", "replace")
    if "text/event-stream" in (content_type or ""):
        last = None
        for line in text.splitlines():
            if line.startswith("data:"):
                chunk = line[5:].strip()
                if chunk and chunk != "[DONE]":
                    try:
                        last = json.loads(chunk)
                    except ValueError:
                        continue
        return last
    try:
        return json.loads(text)
    except ValueError:
        return None


class McpClient:
    def __init__(self, endpoint: str, token: str):
        self.endpoint = endpoint
        self.token = token
        self.session_id: str | None = None

    def _headers(self) -> dict[str, str]:
        h = {
            "Content-Type": "application/json",
            "Accept": "application/json, text/event-stream",
            "Authorization": f"Bearer {self.token}",
        }
        if self.session_id:
            h["Mcp-Session-Id"] = self.session_id
        return h

    def _post(self, payload: dict, timeout: int = POST_TIMEOUT_S):
        body = json.dumps(payload).encode()
        req = urllib.request.Request(self.endpoint, data=body, headers=self._headers())
        resp = urllib.request.urlopen(req, timeout=timeout)
        sid = resp.headers.get("Mcp-Session-Id")
        if sid:
            self.session_id = sid
        return parse_body(resp.read(), resp.headers.get("Content-Type"))

    def initialize(self) -> None:
        out = self._post({
            "jsonrpc": "2.0", "id": 0, "method": "initialize",
            "params": {
                "protocolVersion": PROTOCOL_VERSION,
                "capabilities": {},
                "clientInfo": {"name": "lazyweb-optimize-paywall", "version": "1.0"},
            },
        })
        if not out or "result" not in out:
            raise RuntimeError("initialize returned no result")
        try:
            body = json.dumps({"jsonrpc": "2.0", "method": "notifications/initialized"}).encode()
            urllib.request.urlopen(
                urllib.request.Request(self.endpoint, data=body, headers=self._headers()),
                timeout=POST_TIMEOUT_S,
            ).read()
        except Exception:
            pass

    def tools_call(self, rpc_id: int, tool: str, args: dict) -> dict:
        attempts = 0
        while True:
            attempts += 1
            try:
                out = self._post({
                    "jsonrpc": "2.0", "id": rpc_id, "method": "tools/call",
                    "params": {"name": tool, "arguments": args},
                })
                if out is None:
                    raise RuntimeError("unparseable response")
                if "error" in out:
                    raise RuntimeError(f"rpc error: {str(out['error'].get('message', 'unknown'))[:300]}")
                return out.get("result", {})
            except urllib.error.HTTPError as exc:
                if (exc.code == 429 or exc.code >= 500) and attempts == 1:
                    time.sleep(2.0)
                    continue
                raise


def payload_of(result: dict) -> dict:
    """Normalize a tools/call result into the tool's JSON payload."""
    if isinstance(result, dict):
        if isinstance(result.get("structuredContent"), dict):
            return result["structuredContent"]
        for item in result.get("content", []) or []:
            if item.get("type") == "text":
                try:
                    return json.loads(item["text"])
                except (ValueError, KeyError):
                    continue
    return {}


def poll(client: McpClient, get_tool: str, job_id: str, budget_s: float, label: str) -> dict:
    deadline = time.monotonic() + budget_s
    rpc = 100
    while time.monotonic() < deadline:
        time.sleep(POLL_INTERVAL_S)
        rpc += 1
        res = payload_of(client.tools_call(rpc, get_tool, {"job_id": job_id,
                                                           "skill": "lazyweb-optimize-paywall",
                                                           "version": skill_version()}))
        status = (res.get("status") or "").lower()
        if status == "done":
            return res
        if status == "error":
            raise RuntimeError(f"{label} failed server-side: "
                               f"{res.get('error') or res.get('code') or 'unknown error'}")
        log(f"  {label}: {status or 'pending'}…")
    raise RuntimeError(f"{label} timed out after {budget_s:.0f}s (job {job_id})")


def upload_image_for_url(b64: str, mime: str, token: str) -> str:
    """POST the screenshot DIRECTLY to lazybackend (bypassing the gateway's
    request-size cap) and return a 24h signed image_url."""
    url = f"{LAZYBACKEND_URL.rstrip('/')}/paywall-report/upload-image"
    body = json.dumps({"image_b64": b64, "mime_type": mime}).encode()
    req = urllib.request.Request(url, data=body, headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}",
    })
    payload = json.loads(
        urllib.request.urlopen(req, timeout=POST_TIMEOUT_S).read().decode("utf-8", "replace")
    )
    image_url = (payload or {}).get("image_url") or ""
    if not image_url:
        raise RuntimeError(f"upload-image returned no image_url: {json.dumps(payload)[:200]}")
    return image_url


def image_args(image_path: str, token: str, label: str) -> dict:
    """MCP image args: inline base64 for small images, else upload to lazybackend
    and pass a small image_url — keeps large bodies off the size-limited gateway
    (which 413s full-res screenshots). Byte-perfect either way (encoded in code)."""
    b64, mime = read_image_b64(image_path)
    if len(b64) > UPLOAD_THRESHOLD_B64:
        log(f"{label}: {len(b64)} b64 chars ({mime}) — large; uploading for a URL "
            "(bypasses the gateway size limit)…")
        return {"image_url": upload_image_for_url(b64, mime, token)}
    log(f"{label}: {len(b64)} b64 chars ({mime}); inline from file (byte-perfect)…")
    return {"image_base64": b64, "mime_type": mime}


def cmd_synthesize(client: McpClient, a: argparse.Namespace) -> dict:
    args = {
        **image_args(a.image, client.token, "synthesize"),
        "product": a.product or "",
        "conversion_goal": a.conversion_goal or "",
        "plan_structure": a.plan_structure or "",
        "category": a.category or "",
        "constraints": a.constraints or "",
        "task": a.task or "Optimize the paywall for conversion",
        "divergence": a.divergence or "auto",
        "report_skill": "optimize-paywall",
        "skill": "lazyweb-optimize-paywall",
        "version": skill_version(),
    }
    started = payload_of(client.tools_call(1, "lazyweb_start_paywall_synthesize", args))
    job_id = started.get("job_id")
    if not job_id:
        raise RuntimeError(f"start_paywall_synthesize returned no job_id: {json.dumps(started)[:300]}")
    log(f"synthesize job {job_id} (eta ~{started.get('eta_seconds', '?')}s)")
    done = poll(client, "lazyweb_get_paywall_synthesize", job_id, SYNTH_BUDGET_S, "synthesize")
    result = done.get("result") or done
    winners = result.get("winners") or []
    return {"synthesis_id": result.get("synthesis_id"), "winners": winners}


def cmd_mockup(client: McpClient, a: argparse.Namespace) -> dict:
    prompt = a.prompt
    if not prompt and a.prompt_file:
        prompt = pathlib.Path(a.prompt_file).expanduser().read_text(encoding="utf-8").strip()
    if not prompt:
        fatal("mockup needs --prompt or --prompt-file")
    args = {
        "prompt": prompt,
        **image_args(a.image, client.token, "mockup (EDIT off current screenshot)"),
        "quality": a.quality or "high",
        "skill": "lazyweb-optimize-paywall",
        "version": skill_version(),
    }  # NOTE: omit `size` in EDIT mode so it matches the input aspect ratio
    started = payload_of(client.tools_call(1, "lazyweb_start_mockup", args))
    job_id = started.get("job_id")
    if not job_id:
        raise RuntimeError(f"start_mockup returned no job_id: {json.dumps(started)[:300]}")
    log(f"mockup job {job_id}")
    done = poll(client, "lazyweb_get_mockup", job_id, MOCKUP_BUDGET_S, "mockup")
    # Prefer the signed URL (payload-friendly); the renderer fetches it server-side.
    return {"image_url": done.get("image_url"), "mime_type": done.get("mime_type")}


def main() -> None:
    ap = argparse.ArgumentParser(description="Byte-perfect image transport for optimize-paywall.")
    ap.add_argument("--endpoint", default=os.environ.get("LAZYWEB_MCP_URL", DEFAULT_ENDPOINT))
    sub = ap.add_subparsers(dest="cmd", required=True)

    s = sub.add_parser("synthesize")
    s.add_argument("--image", required=True)
    s.add_argument("--product", default="")
    s.add_argument("--conversion-goal", dest="conversion_goal", default="")
    s.add_argument("--plan-structure", dest="plan_structure", default="")
    s.add_argument("--category", default="")
    s.add_argument("--constraints", default="")
    s.add_argument("--task", default="")
    s.add_argument("--divergence", default="auto", choices=["auto", "low", "med", "high"])
    s.add_argument("--out", default="")

    m = sub.add_parser("mockup")
    m.add_argument("--image", required=True)
    m.add_argument("--prompt", default="")
    m.add_argument("--prompt-file", dest="prompt_file", default="")
    m.add_argument("--quality", default="high", choices=["low", "medium", "high", "auto"])
    m.add_argument("--out", default="")

    a = ap.parse_args()
    token = load_token()
    if not token:
        fatal("no Lazyweb token (set LAZYWEB_MCP_TOKEN or ~/.lazyweb/lazyweb_mcp_token)")

    client = McpClient(a.endpoint, token)
    try:
        client.initialize()
        out = cmd_synthesize(client, a) if a.cmd == "synthesize" else cmd_mockup(client, a)
    except urllib.error.HTTPError as exc:
        detail = ""
        try:
            detail = exc.read().decode("utf-8", "replace")[:400]
        except Exception:
            pass
        fatal(f"HTTP {exc.code} from {a.endpoint}: {detail}")
    except (urllib.error.URLError, RuntimeError, OSError) as exc:
        fatal(str(exc))

    text = json.dumps(out, indent=2)
    if getattr(a, "out", ""):
        pathlib.Path(a.out).expanduser().parent.mkdir(parents=True, exist_ok=True)
        pathlib.Path(a.out).expanduser().write_text(text + "\n", encoding="utf-8")
        log(f"wrote {a.out}")
    print(text)


if __name__ == "__main__":
    main()
