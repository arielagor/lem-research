# Decision 002 — Transport Deviation + Pilot-Frozen Constants

**Date:** 2026-07-02
**Status:** Transport section final; constants section frozen upon pilot completion, before the confirmatory battery launches.

## Deviation from decision 001: LLM transport

Decision 001 specified substrate calls via `claude -p` (Claude Code CLI). Two problems surfaced during the smoke/pilot phase, before any confirmatory run:

1. **Context contamination:** the CLI injects a ~21k-token harness prefix (tool schemas, skills catalog, account identity) that `settingSources: []` does not remove. This is both a token-accounting corruption for H1 and a behavioral confound (the purity probe showed the model knew the operator's email).
2. **Throughput:** per-call CLI process spawn cost ~90 s/turn at concurrency 6 (Windows spawn + bundle load), making the pre-registered battery infeasible in wall-clock.

**Resolution:** direct Messages API calls authenticated with the same Max-plan OAuth token the CLI itself uses (`agents/llm.mjs`). Result: ~2 s/call, and the model receives ONLY the experiment-controlled context (purity probe: 49-token prefix, zero knowledge of operator). This is a methods improvement, not a hypothesis-relevant change; it was made before any confirmatory data existed. M1 can now use exact API token counts; the estimated-tokens measure is retained as a secondary check.

Billing note: same subscription, no API-key spend. The pre-registered cost gate (flag Ariel before paid-API fallback) stands.

## Pilot-frozen constants (filled at pilot completion; frozen before battery)

- Watcher activation threshold θ_enter: **TBD after pilot** (code default 0.35; check LLM arms' natural predictability concentrations)
- Watcher exit threshold / patience: TBD (defaults 0.25 / 30 turns)
- M2 JSD threshold δ: TBD (default 0.15; window 50)
- Judge prompts: frozen as committed in `metrics/judge.mjs` at battery-launch commit
- Battery config: 3 arms × 5 seeds (1..5) × 1,500 turns, trigger 401, concurrency 8
- Showcase config: 3 arms × seed 101 × 10,000 turns, trigger 2001, concurrency 3
