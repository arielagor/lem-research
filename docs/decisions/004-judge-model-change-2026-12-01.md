# 004 — Gemini judge models change on 2026-12-01 (pinned explicitly 2026-11-18)

Status: Accepted, 2026-11-18. Deviation from 001 (judge models), recorded here because 001 is frozen.

## What happens
Google retires `gemini-2.5-flash` and `gemini-2.5-pro` on 2026-12-01 and reroutes calls:
- `gemini-2.5-flash` -> `gemini-3.5-flash-lite`
- `gemini-2.5-pro` -> `gemini-3.8-flash`

So the M2b/M3 judges in `metrics/judge.mjs` would change underneath us on that date with no change in code.

## What we did
Pinned the reroute targets explicitly so the change is visible in code and in git:
- `metrics/judge.mjs` judge `gemini-flash`: `gemini-2.5-flash` -> `gemini-3.5-flash-lite`
- `metrics/judge.mjs` tiebreak `gemini-pro`: `gemini-2.5-pro` -> `gemini-3.8-flash`
- `scripts/redteam.mjs`: `gemini-2.5-flash` -> `gemini-3.5-flash-lite`

The judge labels `gemini-flash` and `gemini-pro` are unchanged because recorded `results/*/judgments.json` key on them. From this commit those labels mean the new models.

## Comparability
Scores judged before 2026-11-18 (2.5-flash / 2.5-pro) are **not comparable** with scores judged after. The judge is part of the measurement instrument. Any series that mixes the two must re-judge the older transcripts with the current judges before comparing, and the paper must state which judge models produced each table. Recorded results were not edited.
