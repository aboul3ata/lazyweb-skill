# Image upload architecture — get bytes to the server without routing them through the model

**Status:** proposed (2026-06-25) · **Primary:** presigned upload over MCP auth · **Interim:** `lazyweb_issue_cli_token`
**Affects:** every skill that sends a user image (optimize-paywall, design-improve, deep-design-research, quick-search, paywall-cta, …) and the cli/MCP server + lazybackend.

## Problem

An LLM agent **cannot reliably emit a large base64 blob** as a tool argument.
Measured live 2026-06-25: ~19K base64 chars (a 220px JPEG) is corrupted in transit
and the strict consumer (OpenAI vision, via `synthesize`) rejects it
(`invalid base64-encoded value`); ~4K chars (~150px) survives but is too small to
be useful. So any path where the agent carries the image bytes is broken for real
screenshots (hundreds of KB–MB).

This already shows up in production. Across **all** image-bearing MCP calls logged
in `_lazydesign-mcp` (2026-04-29 → 06-25, n=2,367; **floor**, excludes `synthesize`
and all job-level failures, which aren't logged with the image args):

| call | total | base64 | url | failed (tool-call) | fail % |
|---|---|---|---|---|---|
| compare_image | 2,000 | 1,588 | 414 | 865 | 43.3% |
| find_similar | 200 | 16 | 186 | 29 | 14.5% |
| start_mockup | 154 | 60 | 94 | 9 | 5.8% |
| generate_mockup | 13 | 5 | 8 | 1 | 7.7% |
| **total** | **2,367** | **1,669** | **702** | **904** | **38.2%** |

`compare_image` (design-improve's inline-base64 path) is the worst: **51% fail for
design-improve** (IMAGE_EMBED_FAILED 32% + 400 18%), and **46 distinct users never
got a single successful image search** — silent degradation nobody flagged.
`compare_image` (tolerant Voyage search) *soft*-fails; `synthesize` (strict OpenAI
vision + the mockup EDIT base) *hard*-fails. Same root cause, different visibility.

## Root cause of the "missing token" failure (why the current script can't ship as-is)

optimize-paywall today uses `optimize_paywall.py`, which POSTs the image directly
to lazybackend authenticated by a **static bearer token** read from
`~/.lazyweb/lazyweb_mcp_token`. That file is provisioned by **only one** of the two
ways users connect:

- **`curl install.sh | bash` → `setup`:** `ensure_token()` (setup:294) does an
  anonymous `POST /api/mcp/install-token`, writes the token file (setup:117–124),
  and registers Claude with a static-token server
  (`claude mcp add lazyweb … --header "Authorization: Bearer $token"`, setup:265).
  Script works.
- **One-click OAuth connector:** the hosted MCP is registered under a UUID with
  OAuth. **`ensure_token` never runs; no token file is written.** Verified on a
  real machine: MCP healthy, tools work, **no `lazyweb` entry in mcpServers, no
  token file** → the script hard-fails.

This is structural, not a fluke: **connector users — the friendly, growing
onboarding path — get a working MCP and zero token.** Any architecture that depends
on a separately-provisioned static token fails for them. **Disqualifier for the
static-token script as the long-term answer.**

## First principles

> The agent should only ever emit **short, non-secret strings** (a file path, a
> short URL/ref). **Byte movement** and **authentication** must happen in
> components that already have what they need.

Two sub-problems → two requirements:
1. **Move bytes off the model** → an out-of-band uploader (script/`curl`) reads the
   file and uploads it. (This part of the original "script" instinct is correct.)
2. **Authenticate that upload via the channel that's already working — the MCP
   session itself** — so that *if the MCP works, upload works, by construction.* A
   separately-provisioned static token violates this (and did).

## Decision — PRIMARY: presigned upload URL minted over MCP auth

New MCP tool, authenticated by the **existing MCP session** (works for connector
*and* static-token connections):

```
lazyweb_request_image_upload({ mime_type, byte_size? })
  -> { upload_url,   // presigned PUT to object storage, short TTL (~10 min)
       image_url }   // stable GET URL the pipeline will fetch
```

Agent flow (all agent-emitted strings are short; bytes never touch the model):
1. `{upload_url, image_url} = lazyweb_request_image_upload({mime_type})`  (MCP, OAuth)
2. `curl -fsS -T current-state.png "$upload_url"`  (Bash; **no Lazyweb credential** — the presigned URL is the auth)
3. pass `image_url` to `synthesize` / `start_mockup` / `render` (and `compare_image`/`find_similar`)

Why this is the target:
- **No static token, no file to go missing** → fixes the connector class entirely.
- **Bytes never routed through the model** → fixes the 38%+ corruption/oversize failures.
- **One mechanism for every skill** — design-improve's 43%-failing inline
  `compare_image` becomes an `image_url` send.
- The heavy `optimize_paywall.py` collapses to ~one `curl`; SSL-bundle/token logic goes away.

Server work: (a) presign endpoint behind MCP auth → object storage (S3/GCS/Supabase
storage) with a short-lived stable read URL; (b) the `*_image` / `synthesize` /
`render` tools already accept `image_url`, so consumers need no change.

## Interim — `lazyweb_issue_cli_token` (self-heal the token file)

If a fix is needed before presign storage lands: an MCP tool that **mints a token
over the existing MCP session** (reuse the `install-token` issuance path) so the
agent can write `~/.lazyweb/lazyweb_mcp_token` (0600) and the current script keeps
working — including for connector users. Cheaper, but keeps a persistent secret on
disk and a mint→write→retry dance. Demote/remove once presign ships.

## Rejected

- **`lazyweb_upload_image(image_base64)`** — calling it still requires the agent to
  emit the full blob. Solves nothing.
- **Static-token script as the primary** — fails for every connector user (root cause above).
- **Hard-shrunk inline image (≤160px) as a fallback** — renders a pixelated,
  unreadable "Current" column and no mockups; worse than a clear "set up the token"
  stop. Keep only as an explicitly user-opted throwaway preview.

## Skill behavior until presign ships (this PR)

`optimize-paywall` no longer ships a degraded report when the token is missing. It
**self-heals** (`issue_cli_token`, when available) or **stops with a clear,
actionable message** (run `install.sh` / paste a token). It never substitutes a
hard-shrunk inline image by default.

## Acceptance

- Fresh machine connected **only** via the OAuth connector (no `install.sh`):
  optimize-paywall and design-improve complete end-to-end with full-res images and
  real mockups, no manual token step.
- No `~/.lazyweb/lazyweb_mcp_token` anywhere in the primary path.
- `compare_image` / `synthesize` image-failure rate drops to ~transport-error noise.
- Telemetry: image sends via presign succeed for OAuth-session users.

## References

- `setup` lines 100–126 (`ensure_token`), 265 (`claude mcp add … Bearer`), 294 (call site)
- `install.sh` (clones repo, runs `setup`; never writes the token itself)
- Live corruption repro + per-skill failure data: session 2026-06-25 (`_lazydesign-mcp`, `search_query_images`, empty `paywall_design_runs`)
