---
name: lazyweb-add-inspo-source
description: |
  Connect an external inspiration source (Mobbin, Savee, Dribbble, Behance, etc.)
  as a first-class source in all Lazyweb design skills. Authenticates via headless
  browser, persists session cookies, and registers the source so future design
  research automatically includes it alongside Lazyweb.
  Trigger on: "add inspo source", "add inspiration source", "connect Mobbin",
  "connect Savee", "add design source", "connect inspiration", "add Dribbble",
  "link Behance".
allowed-tools:
  - Bash
  - Read
  - Write
  - AskUserQuestion
---

# Add Inspiration Library

Connect an external design inspiration library so all Lazyweb design skills
(`/lazyweb-design-research`, `/lazyweb-design-improve`, `/lazyweb-design-brainstorm`,
`/lazyweb-quick-references`) search it alongside Lazyweb's database.

No adapters or scrapers needed — Claude uses the browse tool to navigate the library
UI at search time, the same way it browses any website.

## Browse Setup

```bash
LB=""
# Check lazyweb-skill browse first
for _P in "$(pwd)/.claude/skills/lazyweb-skill/browse/dist/browse" ~/.claude/skills/lazyweb-skill/browse/dist/browse; do
  [ -x "$_P" ] && LB="$_P" && break
done
# Fall back to gstack browse
if [ -z "$LB" ]; then
  _ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
  [ -n "$_ROOT" ] && [ -x "$_ROOT/.claude/skills/gstack/browse/dist/browse" ] && LB="$_ROOT/.claude/skills/gstack/browse/dist/browse"
  [ -z "$LB" ] && [ -x ~/.claude/skills/gstack/browse/dist/browse ] && LB=~/.claude/skills/gstack/browse/dist/browse
fi
[ -x "$LB" ] && echo "BROWSE_READY: $LB" || echo "NO_BROWSE"
```

If `NO_BROWSE`: This skill requires the browse tool. Tell the user:
"Browse tool not found. Install it with: `cd ~/.claude/skills/lazyweb-skill/browse && ./setup`"
Then stop.

## Workflow

### 1. Ask Which Library

If the user didn't specify, ask which library to connect. Common options:

| Library | URL | Search URL |
|---------|-----|-----------|
| Mobbin | https://mobbin.com | https://mobbin.com/browse/ios/apps |
| Savee | https://savee.it | https://savee.it/search/ |
| Dribbble | https://dribbble.com | https://dribbble.com/search |
| Behance | https://www.behance.net | https://www.behance.net/search/projects |
| Awwwards | https://www.awwwards.com | https://www.awwwards.com/websites |

If the user wants a library not listed here, ask for:
- Name of the library
- Base URL
- Search URL (the page where you can type a search query)

### 2. Check If Already Connected

```bash
cat ~/.lazyweb/libraries.json 2>/dev/null || echo '{"libraries":[]}'
```

If the library is already in the list, tell the user it's already connected and ask
if they want to re-authenticate (useful if session expired).

### 3. Authenticate via Headless Browser

Navigate to the library and hand off to the user for login:

```bash
# Open the library's login page
$LB goto "{url}"

# Hand off to visible Chrome so user can log in
$LB handoff "Log in to {name}. Close this window or press Enter when done."
```

The handoff opens a visible Chrome window where the user can:
- Log in with email/password
- Complete OAuth flows
- Handle 2FA/CAPTCHA

After the user completes login:

```bash
# Resume headless control with cookies preserved
$LB resume
```

### 4. Verify Authentication

Navigate to the search page and confirm we're logged in:

```bash
$LB goto "{searchUrl}"
$LB snapshot -i
```

Check the snapshot for signs of being logged in (user avatar, account menu, no login
prompts). If it looks like we're not authenticated, tell the user and offer to retry.

### 5. Test Search

Do a quick test search to confirm everything works:

```bash
$LB snapshot -i
# Find the search input and type a test query
$LB fill @eN "pricing page"
$LB press Enter
# Wait briefly for results
$LB snapshot -i
```

If results load successfully, the connection works.

### 6. Save Library Config

```bash
mkdir -p ~/.lazyweb
```

Read existing config, add the new library, write back:

```json
{
  "libraries": [
    {
      "name": "Mobbin",
      "url": "https://mobbin.com",
      "searchUrl": "https://mobbin.com/browse/ios/apps",
      "addedAt": "2026-03-26"
    }
  ]
}
```

Write to `~/.lazyweb/libraries.json`.

### 7. Confirm to User

Tell the user:
- "{Name} is now connected as an inspiration source."
- "All Lazyweb design skills will now search {Name} alongside Lazyweb's database."
- "If your session expires, run `/lazyweb-add-inspo-source` again to reconnect."
- "To disconnect, run `/lazyweb-remove-inspo-source`."

## Important Notes

- **Session persistence**: Browse cookies persist within a server session (30 min idle
  timeout). If the session expires between uses, the design skills will detect this
  and prompt the user to reconnect.
- **No adapters**: Claude navigates each library's UI at search time using browse
  snapshots and interactions. This means it works with any library, even ones that
  redesign their UI.
- **Multiple libraries**: Users can connect as many libraries as they want. Each gets
  searched during design research.
