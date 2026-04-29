---
name: lazyweb-remove-inspo-source
description: |
  Disconnect an inspiration source from Lazyweb design skills.
  Lists connected sources and removes the selected one.
  Trigger on: "remove inspo source", "remove inspiration source",
  "disconnect Mobbin", "remove design source", "unlink source".
allowed-tools:
  - Bash
  - Read
  - Write
  - AskUserQuestion
---

# Remove Inspiration Library

Disconnect an external inspiration library so Lazyweb design skills no longer search it.

## Workflow

### 1. List Connected Libraries

```bash
cat ~/.lazyweb/libraries.json 2>/dev/null || echo '{"libraries":[]}'
```

If no libraries are connected, tell the user: "No inspiration libraries are connected.
Use `/lazyweb-add-inspo-source` to connect one."

### 2. Ask Which to Remove

If the user didn't specify, show the list and ask which library to disconnect.
If only one library is connected, confirm they want to remove it.

### 3. Remove from Config

Read `~/.lazyweb/libraries.json`, remove the selected library from the `libraries`
array, write back. If the array is now empty, you can either leave the empty array
or delete the file.

### 4. Confirm

Tell the user: "{Name} has been disconnected. Lazyweb design skills will no longer search it."
