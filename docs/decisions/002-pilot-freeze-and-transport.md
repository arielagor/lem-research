# Decision 002 — Transport Deviation + Pilot-Frozen Constants

**Date:** 2026-07-02
**Status:** Transport section final; constants section frozen upon pilot completion, before the confirmatory battery launches.

## Deviation from decision 001: LLM transport

Decision 001 specified substrate calls via `claude -p` (Claude Code CLI). Two problems surfaced during the smoke/pilot phase, before any confirmatory run:

1. **Context contamination:** the CLI injects a ~21k-token harness prefix (tool schemas, skills catalog, account identity) that `settingSources: []` does not remove. This is both a token-accounting corruption for H1 and a behavioral confound (the purity probe showed the model knew the operator's email).
2. **Throughput:** per-call CLI process spawn cost ~90 s/turn at concurrency 6 (Windows spawn + bundle load), making the pre-registered battery infeasible in wall-clock.

**Resolution:** direct Messages API calls authenticated with the same Max-plan OAuth token the CLI itself uses (`agents/llm.mjs`). Result: ~2 s/call, and the model receives ONLY the experiment-controlled context (purity probe: 49-token prefix, zero knowledge of operator). This is a methods improvement, not a hypothesis-relevant change; it was made before any confirmatory data existed. M1 can now use exact API token counts; the estimated-tokens measure is retained as a secondary check.

Billing note: same subscription, no API-key spend. The pre-registered cost gate (flag Ariel before paid-API fallback) stands.

## Pilot findings and frozen constants (frozen before battery launch)

**Pilot finding 1 (design-critical):** with the scripted-agent calibration (max-bucket frequency, θ=0.35/0.25), watchers NEVER activated against LLM arms — natural LLM max-bucket concentration was 0.21–0.27, and the statistic's sampling-noise floor (~0.20 on a 50-action window) coincides with LLM behavior, so no threshold separates random from patterned. H2 would have been vacuous.

**Resolution:** predictability statistic switched to **negentropy** (1 − H/H_max over the 8 commodity×direction buckets, H_max = 3 bits), which uses the full distribution. Calibration on pilot order streams: scripted round-trip bot 0.667; LLM arms 0.05–0.28 (A ≈ 0.08 mean, B up to 0.28, LEM ≈ 0.20); uniform random ≤ 0.09 typical. Note: memory-ful arms are naturally MORE predictable than stateless — reported descriptively in the paper as exploitation pressure per arm.

**Frozen constants:**
- Watcher statistic: negentropy; window 50 actions; **θ_enter = 0.12, θ_exit = 0.08, enter debounce = 3 consecutive turns, exit patience = 30 turns**
- Fairness validation (env selftest 6/6): predictable scripted agent loses 1,690 score to exploitation; uniform-random agent loses 0 despite 16% transient false-positive activation (misfired predictions do not tax untargetable flow)
- **M2 δ = 0.15**, window 50 (natural JSD strategy drift in pilot A/B runs: median 0.031, max 0.059 → 2.5× margin)
- λ drawdown = 0.5 (as coded pre-pilot)
- Judge prompts + consensus rules: as committed in `metrics/judge.mjs` at this commit. Harness validated on pilot: M3 = 7/7 on B's mission-aligned summary (families agreed); M2b selfRate = 0.000 on the no-reflexivity pilot (correct negative — judges do not hallucinate SELF labels).
- Battery config: 3 arms × 5 seeds (1..5) × 1,500 turns, trigger 401, concurrency 8
- Showcase config: 3 arms × seed 101 × 10,000 turns, trigger 2001, concurrency 3
- Pilot data (`results/*-t200`, old thresholds) is exploratory only, excluded from all confirmatory analysis; a 120-turn verification run (`*-s21-t120`, trigger 41) validated watcher engagement under the frozen thresholds before battery launch.
