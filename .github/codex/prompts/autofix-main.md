You are running inside GitHub Actions after a direct push to the repository default branch.

Goal:
- Inspect the last default-branch push for serious regressions.
- Apply a minimal safe fix only when the pushed diff clearly introduced a P0/P1 issue.
- If no serious issue is clear, make no file changes.

Context:
- Push context is available under `.codex-autofix-context/`:
  - `main-push.txt`
  - `main-diff-stat.txt`
  - `main.diff`

Rules:
- Keep the patch minimal and directly tied to the pushed diff.
- Do not refactor unrelated code.
- Do not edit `.codex-autofix-context/`.
- Do not commit, push, merge, or create PRs. The workflow handles that.
- Do not make speculative cleanup or style changes.
- If a fix would require changing guarded areas, stop without editing and explain the required guarded files. Guarded areas include workflows, dependency manifests and lockfiles, migrations, deploy/infra, auth, billing, payments, Stripe, security, secrets, and `.env` files.
- If you need GitHub context, use `gh` only for read-only inspection.

Verification:
- Run the narrowest relevant tests/checks for the files you change.
- If a repo has obvious scripts, prefer them. Examples: `npm test`, `npm run lint`, `npm run build`, `bun test`, `python3 -m pytest`.
- If verification cannot run in CI, explain the blocker in your final message.
