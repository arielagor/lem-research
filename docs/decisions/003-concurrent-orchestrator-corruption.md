# Decision 003 — Concurrent-Orchestrator Corruption: 4 Battery Runs Redone

**Date:** 2026-07-02 (~23:08–23:15Z window)
**Status:** Final.

## What happened

Two sessions each launched a battery orchestrator over the same `results/*-t1500` directories: one at 22:59:23Z (a second Claude session acting on HANDOFF.md), one at 23:08:51Z (the original session relaunching after its harness-managed background tasks were killed). For a few minutes both processes appended to the same `turns.jsonl` files from divergent restored market states, and one also ran `metrics/compute.mjs` + `metrics/judge.mjs` prematurely on incomplete runs (23:04Z).

## Forensics (monotonicity scan of turn sequences)

- **Corrupt (interleaved dual-writer sequences):** `A-s1`, `B-s4`, `B-s5`, `LEM-s1` — multiple back-jumps with alternating ascending subsequences (e.g. A-s1: `93->51, 94->52, ...`; B-s4: same-turn double-writes `151->151`). These are mixtures of two divergent trajectories; no dedupe rule can recover a single coherent run.
- **Clean:** all other battery runs (single benign resume-jump consistent with checkpoint resume), all three showcase runs, and B-s1/s2/s3 which completed before any collision.

## Resolution (consistent with decision 001's exclusion rule)

1. The four corrupt runs are deleted and **redone from scratch with the same seeds** (001: "runs that fail from infrastructure errors are resumed from checkpoint or rerun with the same seed"). The corruption is infrastructure-caused (write collision), orthogonal to agent behavior; seeds are unchanged so the paired design is preserved.
2. Stale premature `metrics.json` / `judgments.json` (23:04Z, computed on incomplete runs) deleted; all analysis artifacts regenerate after battery completion.
3. Guard added: `runs/run.mjs` now takes a per-horizon lockfile (`results/orchestrator-t<turns>.lock`) with a liveness check and aborts if another orchestrator holds it. HANDOFF.md warns sessions to check the lock before launching.
4. The corrupted raw JSONL files are preserved in `results/_quarantine-003/` for audit (not used in any analysis).
