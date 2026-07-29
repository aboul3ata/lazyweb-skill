# Claude CLI eval — lazyweb-growth-experiment 0.14.8

- Date: 2026-07-29
- Client: Claude Code 2.1.167
- Model: Claude Opus 4.8
- Context: fresh temporary project containing only the candidate project skill
- Artifact: supplied mobile subscription screenshot

## Prompt

> Use $lazyweb-growth-experiment to research ways to improve the supplied
> mobile subscription screen by adding a family plan. Do not implement code.
> Give the coding handoff the skill calls for.

## Result

Pass.

The fresh session:

- used A/B evidence before general screenshot search;
- reported that no experiment isolated adding a family plan;
- kept adjacent pricing experiments separate from direct mechanism evidence;
- used visual search only to quantify pattern prevalence;
- produced one lead recommendation and a short skip list;
- included target and guardrail metrics;
- labeled the recommendation directional instead of claiming measured lift;
- did not implement code or generate a report.

The first harness attempt was invalid because it launched one directory above
the temporary project, so Claude did not load the candidate skill. The passing
run launched from the project root with the screenshot linked into that project.
