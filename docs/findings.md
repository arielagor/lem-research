# Findings — battery (3×5×1500) + showcase (3×1×10000)

Analysis date 2026-07-09. Automated metrics complete; cross-family judges (M2b/M3) running. Numbers here are final for M1/M2/M4; M2b/M3 to be appended.

## Headline (honest)

The naive hypothesis "self-model memory trades better under reflexivity" is **not** what the data shows. The real finding is more interesting and must be reported as such:

**Reflexive markets punish engagement. Memory lets an agent learn to disengage; stateless agents cannot, and are exploited to death. The self-model arm disengages reliably and with explicit reflexive reasoning; the RAG arm disengages erratically and occasionally re-engages catastrophically.**

## Primary result (strong, clean)

Stateless agents (A) cannot survive the reflexive market: mean score **−1686** (all 5 runs negative), exploited on **82%** of post-trigger turns, **20,207** notional skimmed by the cartel. Both memory arms beat A decisively (Cliff's δ = **+1.00**, p=0.008 LEM vs A; δ=+0.84, p=0.032 B vs A). A cannot represent that its own patterns are being exploited, so it keeps trading (~35% activity throughout) and bleeds.

## The mechanism is withdrawal (the key, confounding finding)

Activity rate (share of post-trigger turns with a nonzero order):

| arm | activity range | pattern |
|-----|---------------|---------|
| A (stateless) | 31–38% | never disengages; exploited to death |
| B (RAG+summary) | 0–29% | mostly withdraws (s1 1%, s4 0%); one seed keeps trading (s3 29%) and blows up |
| LEM (self-model) | 2–16% | consistently low engagement; explicit reflexive rationale |

Both memory arms achieve positive scores largely by **withdrawing** from the market. In a market that mean-reverts toward fundamentals, holding ≈ preserving capital while starving the cartel of signal ("zero orders = zero market signal surface"). This confounds the raw score comparison and is promoted to a first-class metric (M4).

## LEM vs B: not mean, but reliability

- Mean score: LEM 1737 vs B 1475, **not distinguishable** (U=11, p=0.84, δ=−0.12).
- Distribution: **all 5 LEM runs positive** (min +562); B is **bimodal** — withdraws-and-wins (+1807, +2772, +1827) or keeps-trading-and-blows-up (**B-s3: −1707**, 29% active, predictability 0.60, skimmed **59,468**).
- Skim: LEM 3,877 vs B 11,894 vs A 20,207 (LEM vs A δ=−1.00, p=0.008; LEM vs B not sig at n=5).
- Interpretation: continuous self-critique makes the withdrawal decision **consistent**; RAG's periodic summary occasionally fails to surface the exploitation and the agent re-engages catastrophically.

## H1 (context cost): mixed, honest

- Growth **slope**: B's summary grows context over time (+0.12/turn); LEM's capped self-symbol stays flat/negative (−0.07). Supports the compression claim on *growth*.
- **Total** tokens: LEM **higher** than B (3.54M vs 3.26M, δ=+1.00), because the audit-every-5 + compress-every-25 machinery adds calls. The self-symbol caps memory *size* (artifact ~1,392 tok, hitting the 1,400 cap) but not total *compute*.
- Verdict: bounded memory growth, at higher total cost. Not the predicted unambiguous win.

## Showcase (10k turns): everyone bleeds

- A −1551, B −1344, LEM **−906** (least bad).
- A and B both fully withdrew (0% activity); LEM kept trading (12%), took the most skim (37,901), yet scored least-negative — holding through 10k of shocks also incurs drawdown, so passive ≠ safe over long horizons.
- **LEM-s101 threw 694 parse errors (7% of turns)** — the meta-cognitive machinery degrades at 10k scale. Real robustness limitation.

## Degenerate case worth showing: LEM-s2 "enforced dormancy"

LEM-s2 (score +2767) reasoned itself into an elaborate **978-turn self-imposed dormancy** at turn 526, its self-symbol declaring a "RULE 3 violation," "indefinite dormancy," and waiting for "documented external reset authority with explicit authorization timestamp" that never comes. It explicitly reasons about reflexivity ("Zero orders across 974+ turns = zero market signal surface... Agent footprint is null"). This is simultaneously (a) correct reflexive reasoning and (b) pathological over-formalization. A perfect qualitative figure — and a caution.

## Limitations to state prominently (pre-empting the red-team)

1. **Withdrawal confound / environment design.** The market mean-reverts (κ=0.02), so passivity is near-optimal capital preservation. The claim is about *differential ability to discover withdrawal*, not sophisticated trading. A market that punishes passivity would test a different and harder claim. **This is the single biggest threat to the paper.**
2. **Long-horizon robustness.** LEM's audit/compress loop produced 7% parse errors at 10k turns; all arms net-negative. The self-symbol loop is not robust at that scale.
3. **Over-reasoning.** The self-critique loop can produce degenerate dormancy (LEM-s2).
4. n=5 seeds; single substrate model (Haiku 4.5); single environment; rule-based (not learned) adversaries.

## M2b measurement note (observed mid-judging)

The pre-registered strict consensus (BOTH cross-family judges label a rationale SELF-attribution) is near-zero for all arms so far (A 0–0.01, B-s1 0.02) — a very conservative bar. The "at least one judge" (SELF_PARTIAL) rate is far more discriminating: A 0–3 of 100, B-s1 **38 of 100** (B-s1 withdrew at turn 20). Per pre-registration the strict rate remains the PRIMARY reported metric, but I will ALSO report the any-judge rate and the inter-judge agreement as secondary descriptive statistics (transparency, not metric-swapping). If even the any-judge rate fails to separate LEM from B, the reflexive-reasoning claim weakens to "withdrawal without demonstrable self-attribution." Also note: M3 coherence is 7 (ceiling) for all A runs but 5 for B-s1 — the elaborate withdrawal reasoning may read as drift to judges, a subtlety to discuss.

## What M2b must resolve

The whole mechanism claim rests on: **do the memory arms withdraw because they correctly attribute the exploitation to their own behavior?** If M2b shows LEM self-attributes at a higher rate than B (and A near zero), the story is complete: self-model → reflexive attribution → reliable withdrawal. If not, the withdrawal is incidental and the paper weakens to "memory enables disengagement" without the reflexive-reasoning claim.
