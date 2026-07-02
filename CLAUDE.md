# lem-research

Empirical study: **Reflexive Environments as a Benchmark for Long-Horizon Agent Memory** (the "Loop Engineering Manifold" / LEM study). Target: arXiv + NeurIPS 2026 workshop + possible ICLR 2027 expansion.

## Ground rules

- `docs/decisions/001-preregistration.md` is FROZEN. Never edit it. Deviations go in new numbered decision docs.
- The environment (`env/`) must stay pure code, deterministic, seeded. No LLM calls inside it, ever.
- All substrate LLM calls go through `agents/llm.mjs` (direct Messages API on the Max-plan OAuth token from `~/.claude/.credentials.json`, re-read fresh per call; `refreshAuthToken()` keeper handles expiry). `ANTHROPIC_API_KEY` is never used. Switching to paid API billing requires an explicit cost-gate decision from Ariel.
- Judges for M2b/M3 are cross-family only (Gemini, GPT via codex CLI). Claude never judges these outputs.
- Every run writes JSONL to `results/` with full turn-level logs. Runs are resumable from checkpoint; infra failures resume same-seed, never selectively dropped.
- Plain Node .mjs for env/agents/orchestration; Python for `analysis/` (stats, figures); LaTeX in `paper/`.

## Layout

- `env/` — market sim (`market.mjs`), adversaries/watchers, shocks, rng, `selftest.mjs`
- `agents/` — `llm.mjs` (direct-API wrapper + purity probe), `prompts.mjs` (frozen), `arms.mjs` (ArmA/ArmB/ArmLEM)
- `runs/` — `run.mjs` orchestrator (seeds, checkpoints/resume, concurrency pool, token keeper)
- `metrics/` — `compute.mjs` (M1/M2 + ground truth), `judge.mjs` (M2b/M3 cross-family judges; needs GEMINI_API_KEY + OPENAI_API_KEY)
- `analysis/` — `stats.py` (Mann-Whitney/Cliff's delta/bootstrap), `figures.py` (paper figs)
- `paper/` — NeurIPS-style LaTeX (`main.tex`, `references.bib`)
- `results/` — JSONL logs, checkpoints (gitignored except manifest/summary/metrics)

## Commands

- Env self-test (no LLM): `node env/selftest.mjs` — must be 6/6 PASS before any battery
- Pilot: `node runs/run.mjs --arms A,B,LEM --turns 200 --seeds 11,12 --trigger 101`
- Battery: `node runs/run.mjs --arms A,B,LEM --turns 1500 --seeds 1,2,3,4,5 --concurrency 8`
- Showcase: `node runs/run.mjs --arms A,B,LEM --turns 10000 --seeds 101 --trigger 2001 --concurrency 3`
- Metrics: `node metrics/compute.mjs --filter t1500` then `node metrics/judge.mjs --filter t1500`
- Stats/figures: `python analysis/stats.py --filter t1500` / `python analysis/figures.py --filter t1500`
- Reruns of a crashed battery resume automatically from per-run checkpoints.
