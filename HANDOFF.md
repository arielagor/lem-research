# HANDOFF — lem-research (updated 2026-07-09: STUDY COMPLETE, paper drafted)

> STATUS: All 15 battery + 3 showcase runs done, judged (cross-family), analyzed, red-teamed, paper drafted (paper/main.pdf, 16pp). Remaining = human actions (OpenReview profile, arXiv endorsement, pick workshop) + optional n>=30 activity-controlled ablation the red-team wants. See docs/findings.md + docs/redteam-synthesis.md.

# HANDOFF — lem-research (2026-07-02)

> ⚠️ **DO NOT launch a second battery/showcase orchestrator.** Check `results/orchestrator-t*.lock` and `Get-Process node` first — a second orchestrator over the same run dirs interleaves writes and corrupts runs (this happened; see decision 003; four runs had to be redone). `runs/run.mjs` now enforces a lockfile, but only trust it on code at/after commit "decision 003".
> ⚠️ Do NOT run `metrics/judge.mjs` before a run's `summary.json` exists — judgments.json blocks re-judging (delete stale ones first).
> A detached `scripts/makeup-003.mjs` watcher is armed: when the battery completes it quarantines the 4 corrupt runs and reruns them automatically (logs: `results/makeup-003.log`, `results/makeup-battery.log`).

## What this is
Pre-registered ML study: **Reflexive Environments as a Benchmark for Long-Horizon Agent Memory** (from Ariel's "Loop Engineering" Gemini conversation, stripped to falsifiable claims). Target: arXiv + NeurIPS 2026 workshop (Aug–early Sept deadlines) + ICLR 2027 stretch. Read `docs/decisions/001-preregistration.md` (FROZEN) and `002-pilot-freeze-and-transport.md` first.

## State at handoff
- Environment built, calibrated, 6/6 selftests (`node env/selftest.mjs`). Negentropy watcher statistic, θ 0.12/0.08, debounce 3, patience 30 (decision 002).
- Three arms + orchestrator built; direct Messages-API transport on Max-plan OAuth (~2s/call, zero context contamination — do NOT revert to claude -p spawning, see decision 002).
- Pilot (old thresholds, exploratory) + 120-turn verification (new thresholds) complete: watchers engage LLM arms (A heavily skimmed, B intermittent, LEM active-but-unskimmed).
- Judge harness (Gemini 2.5 Flash + GPT-5-mini, cross-family, blind) validated on pilot: no hallucinated SELF labels; M3 sane.
- Lit review: `docs/related-work.md` + `paper/references.bib` (58 verified entries). NOT scooped; M2b believed novel. Re-run scoop-hunt (arXiv 2603–2607 range) before any upload.
- Paper skeleton: `paper/main.tex` (intro/related/methods drafted; results TODO).
- **LAUNCHED overnight (2026-07-02 ~19:45Z):** battery 3×5×1500 (trigger 401, concurrency 8) + showcase 3×1×10000 (trigger 2001, concurrency 3). LEM-10k lands ~Friday; battery ~6h.

## Morning-after sequence
1. Check completions: `ls results/*-t1500/summary.json | wc -l` (want 15). Crashed runs: rerun the same battery command — it resumes from checkpoints (never delete checkpoints).
2. `node metrics/compute.mjs --filter t1500` → per-run metrics + table.
3. `node metrics/judge.mjs --filter t1500` (needs GEMINI_API_KEY + OPENAI_API_KEY in env; ~$2-3 of already-paid API).
4. `python analysis/stats.py --filter t1500` → hypothesis tests. `python analysis/figures.py --filter t1500` → paper figs.
5. Fill `paper/main.tex` results (H1/H2/H2b/H3 against pre-registered predictions; report nulls as nulls — the benchmark contribution stands either way).
6. Crossfamily red-team of claims (`/crossfamily-council`) before any submission.
7. Showcase runs: same pipeline with `--filter t10000` when they land.

## Ariel action items (human-only)
- **Create OpenReview profile NOW** (non-institutional email moderation takes days–weeks; needed for NeurIPS workshop submission).
- Watch for NeurIPS 2026 workshop list announcement (July); pick 1–2 agent/memory workshops.
- arXiv endorsement: after first submission attempt generates the endorsement code, request from authors of nearest-prior papers (see related-work.md novelty section).

## Standing rules for this repo
- Decision 001 is frozen; deviations = new numbered decision doc, never edits.
- Environment stays pure code (no LLM calls inside env/).
- Claude never judges M2b/M3 (subjects are Claude).
- Battery/showcase quota note: everything runs on Max-plan OAuth. If hard-throttled, the fallback is Haiku API ~$130 — requires Ariel's explicit OK (pre-registered cost gate).
