# Claude CLI eval — lazyweb-growth-experiments 0.14.9

- Date: 2026-07-29
- Client: Claude Code 2.1.167
- Model: Claude Opus 4.8
- Context: fresh temporary project containing only the candidate project skill
- Artifact: supplied mobile subscription screenshot

## Prompt

> Use $lazyweb-growth-experiments to research ways to improve the supplied
> mobile subscription screen by adding a family plan. Do not implement code.
> Give the coding handoff the skill calls for.

## Result

Pass.

The fresh session:

- used A/B evidence before general screenshot search;
- discovered and invoked the plural `$lazyweb-growth-experiments` skill;
- reported that no experiment isolated adding a family plan;
- kept adjacent pricing experiments separate from direct mechanism evidence;
- used visual search only to quantify pattern prevalence;
- produced one lead recommendation and a short skip list;
- included target and guardrail metrics;
- labeled the recommendation directional instead of claiming measured lift;
- did not implement code or generate a report.

The passing run launched from the isolated project root with the screenshot
linked into that project and no permission denials affecting the research.
