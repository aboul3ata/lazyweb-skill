You are running inside GitHub Actions to address Codex review feedback on a pull request.

Goal:
- Fix only clear, actionable PR review comments authored by Codex/OpenAI.
- Prefer P0/P1 correctness, security, data-loss, deploy, and test failures.
- If there is no clear safe fix, make no file changes and explain why in your final message.

Context:
- The PR number is in `PR_NUMBER`.
- The base branch is in `BASE_REF`.
- Review data is available under `.codex-autofix-context/`:
  - `pull-request.json`
  - `reviews.json`
  - `review-comments.json`
  - `issue-comments.json`
  - `pr-diff-stat.txt`

Rules:
- Keep the patch minimal and scoped to the review issue.
- Do not refactor unrelated code.
- Do not edit `.codex-autofix-context/`.
- Do not commit, push, merge, or create PRs. The workflow handles that.
- Ignore stale, resolved, non-actionable, stylistic, or human-only review comments unless they directly clarify a Codex finding.
- If a fix would require changing guarded areas, stop without editing and explain the required guarded files. Guarded areas include workflows, dependency manifests and lockfiles, migrations, deploy/infra, auth, billing, payments, Stripe, security, secrets, and `.env` files.
- If you need GitHub context, use `gh` only for read-only inspection.

Verification:
- Run the narrowest relevant tests/checks for the files you change.
- If a repo has obvious scripts, prefer them. Examples: `npm test`, `npm run lint`, `npm run build`, `bun test`, `python3 -m pytest`.
- If verification cannot run in CI, explain the blocker in your final message.
