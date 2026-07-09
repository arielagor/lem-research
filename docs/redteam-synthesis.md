# Cross-family red-team synthesis (GPT-5 + Gemini-3.1-pro, Claude excluded)

Both families independently converged. Judge integrity confirmed first: both gemini-flash and gpt-mini labeled all M2b rationales and M3 snapshots on every run (98/98 sampled) — cross-family blinding held throughout; the Gemini 404s began only after judging completed.

## Consensus critique (both families)

1. **n=5 cannot support distributional claims.** "Bimodal", "no catastrophic tail", "consistency is the mechanism" are claims about a distribution built from 5 points. Gemini: Texas-sharpshooter fallacy on Claim 4 (pivoting from a non-significant mean difference to a "consistency" win).
2. **Withdrawal confound is fatal to the LEM-superiority narrative.** "The complex cognitive architecture is being praised for simply learning to turn itself off." No activity-controlled ablation isolates architecture from mere inactivity. Contaminates Claims 2–5.
3. **Claim 4 is the weakest** and must not pivot non-significance into a mechanism.
4. **Claim 5 (coherence inversion)** is over-causal; M3 is confounded by the withdrawal behavior it scores as drift. Keep as descriptive, single-benchmark.
5. **Claim 7 internal contradiction:** praising "capped growth" while total cost is higher. Fix wording: bounds memory *size*, not total *compute*.

## What survives (robust)
- Stateless collapse vs both memory arms: δ=+1.00/+0.84, p<0.05. Robust.
- The benchmark and the M2b self-attribution metric (novel contributions).
- LEM self-attributes significantly above stateless (δ=1.00, p=0.010).
- Descriptive: memory arms withdraw; stateless cannot.

## Required edits (applied to main.tex)
- Demote every LEM-vs-B claim to "numerically higher but NOT significant at n=5; preliminary."
- Replace "ties B" with "we do not detect a difference (not an equivalence test)."
- Replace "no catastrophic tail" with "in our 5 seeds LEM had no losing run and B had one; too few seeds to characterize the tail."
- Reframe Claim 4: LEM > A significant; LEM vs B underpowered; do not claim consistency as mechanism.
- Reframe H3 as "in this environment, coherence was anti-correlated with survival" (descriptive).
- Fix H1 wording (size vs compute).
- Reframe primary contributions to: benchmark + metric + robust stateless-collapse + honest memory→withdrawal characterization. LEM-specific results = preliminary.

## Future work both families demanded (add to paper)
1. **Non-mean-reverting / holding-cost regime** so passivity is punished — forces real reflexive navigation rather than "playing dead."
2. **Activity-controlled ablation:** forced-withdrawal and forced-trading baselines + oracle-withdraw, to test whether LEM's advantage persists at matched activity; formal mediation of score by activity.
3. **n ≥ 30 seeds** for distributional/tail claims.
4. **Neutral-audit LEM ablation** (already flagged) to isolate the reflexive framing from the capped-self-model structure.
