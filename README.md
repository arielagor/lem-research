# Learning to Withdraw: Reflexive Environments as a Benchmark for Long-Horizon Agent Memory

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.21301554.svg)](https://doi.org/10.5281/zenodo.21301554)
[![License: CC BY 4.0](https://img.shields.io/badge/License-CC%20BY%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by/4.0/)

A benchmark for long-horizon LLM agent memory in **reflexive environments** — settings where the other actors adapt to the agent's own behavior, so the agent's participation changes the problem it is trying to solve. Pre-registered before any run.

## Abstract

Benchmarks for LLM agents almost universally hold the environment's other actors fixed with respect to the agent's strategy. Real deployment settings are reflexive: markets, negotiations, and multi-agent ecosystems adapt to the agent's observable behavior. We introduce a deterministic, seeded commodity-market benchmark in which rule-based adversaries profile the focal agent's order flow and, once its behavior becomes predictable, exploit it through front-running and targeted spread-widening. We evaluate three memory architectures — a stateless baseline, a conventional episodic-summary-plus-retrieval memory, and a recursive token-capped self-model — and introduce a cross-family-judged **self-attribution** metric (does the agent attribute environmental shifts to its own footprint?).

## What we find (calibrated)

- **Robust:** stateless agents cannot survive reflexivity — driven to ruin on every seed, exploited on 82% of turns (Cliff's δ = +1.00 vs both memory arms).
- **Mechanism:** survival comes from *learning to withdraw*. Memory lets an agent stop trading once trading becomes self-defeating; stateless agents cannot, and are exploited to death.
- **Preliminary (n=5):** the self-model attributes exploitation to itself more than stateless (significant) and more than retrieval (not significant at this sample size). We report it as a hypothesis, not a claim, and specify the activity-controlled, higher-n ablations needed to settle it.
- **A pre-registered hypothesis is rejected, informatively:** goal coherence is *anti*-correlated with survival here — the stateless agent coherently restates the trading mission it is dying by, while survivors "incoherently" withdraw.

Full results, including the withdrawal confound and an adversarial cross-family review of our own claims, are in [`paper/`](paper/) and [`docs/findings.md`](docs/findings.md).

## Repository

| Path | Contents |
|------|----------|
| `env/` | Deterministic reflexive market: price process, adversaries/watchers, shocks, `selftest.mjs` |
| `agents/` | The three memory arms + the LLM call wrapper |
| `runs/` | Checkpointed, resumable experiment orchestrator |
| `metrics/` | M1–M4 metrics + the cross-family (Gemini + GPT) judge harness |
| `analysis/` | Stats (Mann-Whitney, Cliff's δ, bootstrap) and figures |
| `paper/` | The 17-page paper (LaTeX + PDF) and submission metadata |
| `results/` | Per-run JSONL logs, metrics, and judgments |
| `docs/decisions/` | **Frozen pre-registration** (001) + deviations (002 transport, 003 corruption) |

## Reproduce

```bash
# Environment self-test (no LLM calls) — must pass 6/6
node env/selftest.mjs

# Full battery: 3 arms x 5 seeds x 1500 turns  (needs ANTHROPIC_API_KEY)
node runs/run.mjs --arms A,B,LEM --turns 1500 --seeds 1,2,3,4,5

# Metrics, cross-family judging (needs GEMINI_API_KEY + OPENAI_API_KEY), stats, figures
node metrics/compute.mjs --filter t1500
node metrics/judge.mjs --filter t1500
python analysis/stats.py --filter t1500
python analysis/figures.py --filter t1500
```

The environment is deterministic given a seed; the model snapshot and all prompts are pinned. Hypotheses, metrics, thresholds, and exclusion rules were committed to version control *before* any experimental run.

## Citation

```bibtex
@software{agor2026learning_to_withdraw,
  author  = {Agor, Ariel},
  title   = {Learning to Withdraw: Reflexive Environments as a Benchmark
             for Long-Horizon Agent Memory},
  year    = {2026},
  publisher = {Zenodo},
  doi     = {10.5281/zenodo.21301554},
  url     = {https://doi.org/10.5281/zenodo.21301554}
}
```

The concept DOI ("cite all versions") is on the [Zenodo record](https://doi.org/10.5281/zenodo.21301554) and always resolves to the latest version.

## License

Creative Commons Attribution 4.0 International (CC BY 4.0).
