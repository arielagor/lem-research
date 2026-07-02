# lem-research

Empirical study: **Reflexive Environments as a Benchmark for Long-Horizon Agent Memory** (the "Loop Engineering Manifold" / LEM study). Target: arXiv + NeurIPS 2026 workshop + possible ICLR 2027 expansion.

## Ground rules

- `docs/decisions/001-preregistration.md` is FROZEN. Never edit it. Deviations go in new numbered decision docs.
- The environment (`env/`) must stay pure code, deterministic, seeded. No LLM calls inside it, ever.
- All substrate LLM calls go through `agents/llm.mjs` (spawns `claude -p`, strips `ANTHROPIC_API_KEY` from env so billing stays on the Max plan). Never call the API directly without a cost gate decision.
- Judges for M2b/M3 are cross-family only (Gemini, GPT via codex CLI). Claude never judges these outputs.
- Every run writes JSONL to `results/` with full turn-level logs. Runs are resumable from checkpoint; infra failures resume same-seed, never selectively dropped.
- Plain Node .mjs for env/agents/orchestration; Python for `analysis/` (stats, figures); LaTeX in `paper/`.

## Layout

- `env/` — market sim, adversaries (watchers), shocks
- `agents/` — llm.mjs spawn wrapper + arm-a-stateless, arm-b-memory, arm-lem
- `runs/` — run.mjs orchestrator (seeds, checkpoints, parallel batteries)
- `metrics/` — M1 tokens, M2 adaptation (JS divergence), M2b/M3 judge harness
- `analysis/` — stats.py, figures.py
- `paper/` — NeurIPS-style LaTeX
- `results/` — JSONL logs, checkpoints (gitignored except manifests)

## Commands

- Pilot: `node runs/run.mjs --arm all --turns 200 --seeds 2`
- Full battery: `node runs/run.mjs --arm all --turns 1500 --seeds 5 --background`
- Showcase: `node runs/run.mjs --arm all --turns 10000 --seeds 1 --trigger 2001`
