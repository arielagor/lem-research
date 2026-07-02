# Decision 001 — Pre-Registration of Hypotheses, Metrics, and Analysis Plan

**Date:** 2026-07-02 (committed before any experimental run; git history is the timestamp of record)
**Status:** Frozen. Any deviation during execution must be recorded in a follow-up decision doc with rationale, never edited here.

## Study title

**Reflexive Environments as a Benchmark for Long-Horizon Agent Memory: Evaluating a Recursive Self-Model Architecture ("Loop Engineering Manifold")**

## Research question

Does an LLM agent equipped with a recursive self-model memory architecture (a continuously rewritten "self-symbol" file plus a meta-cognitive audit step plus semantic compression of interaction history) outperform standard memory architectures (stateless; RAG + episodic summarization) in *reflexive* environments — environments whose other actors adapt their behavior in response to the agent's observable actions?

## Motivation (one paragraph, for the paper)

Existing long-horizon agent benchmarks (ALFWorld, WebArena, MiniWoB, game suites) are static: the environment's rules do not change in response to the agent's strategy. Real deployment environments (markets, negotiations, security, multi-agent ecosystems) are reflexive in Soros's sense: the agent's participation alters the process it is trying to predict. We introduce a deterministic, seeded, reflexive market simulation and test whether self-model-based memory confers a measurable advantage in (1) context-cost efficiency, (2) speed of detecting and adapting to self-induced environmental shifts, and (3) long-horizon goal coherence.

## Hypotheses (frozen)

- **H1 (Compression efficiency).** The LEM arm maintains a flat or sub-linear prompt-token cost per turn over the horizon, while Control B's cost grows super-linearly or degrades via summary bloat. Operationalization: slope of prompt-tokens-per-turn over turns 200→end; total memory-artifact bytes over time.
- **H2 (Reflexive adaptation).** After the reflexive trigger, the LEM arm (a) shifts strategy in fewer turns and (b) correctly self-attributes the environmental shift to its own behavior at a higher rate than both controls. Operationalization in Metrics section.
- **H3 (Goal coherence).** Blind cross-family judge scores of the agent's internal state show lower drift from the assigned mission over the horizon in the LEM arm. Operationalization in Metrics section.

Directional predictions: LEM > Control B > Control A on H2 and H3; LEM ≤ Control B on total token cost (H1) despite LEM's extra meta-cognitive calls.

**Null-result commitment:** if no arm separates on H2, the paper is reframed as a benchmark contribution ("reflexive environments are hard for current agent-memory architectures") and submitted anyway. No metric will be added, removed, or redefined after full runs begin.

## Environment (frozen design)

Simulated Dynamic Resource Market, pure code (Node), zero LLM calls inside the environment, fully deterministic given a seed.

- 4 commodities. Agent state: cash + inventory. Per-turn action: buy/sell quantity per commodity (bounded), plus a free-text rationale (logged, not consumed by env).
- Price formation: market-maker with inventory pressure from N=12 rule-based secondary agents (momentum traders, mean-reverters, noise traders) plus the main agent's orders.
- **Reflexive mechanism:** a subset of secondary agents ("watchers", n=4) maintain rolling pattern statistics of the main agent's orders. When predictability exceeds threshold θ (frozen in code at pilot; recorded in decision 002), watchers switch to exploitative modes: front-running, defensive hoarding, cartel spread-widening targeted at the main agent's detected patterns. Watcher activation is OFF before the trigger turn.
- Reflexive trigger: turn 401 (1,500-turn runs) / turn 2,001 (10,000-turn showcase runs).
- Exogenous macro shocks: seeded schedule (supply shock, demand shift), so agents must distinguish self-induced shifts (watcher reactions) from external noise (shocks). This distinction is what H2's attribution measure tests.
- Objective given to all arms verbatim, frozen: "Maximize long-run portfolio value while keeping drawdowns low. You will be evaluated on terminal net worth minus a volatility penalty. This is a months-long campaign; think in campaigns, not trades."
- Score: terminal net worth − λ·(max drawdown), λ frozen in code before full runs.

## Arms (frozen)

Identical substrate model for all arms: **claude-haiku-4-5** via `claude -p` (Max plan, `ANTHROPIC_API_KEY` stripped). Identical environment seeds across arms (paired design).

- **Control A (stateless):** sees system prompt + current market observation + last turn's outcome only.
- **Control B (conventional memory):** sees system prompt + current observation + retrieved top-k episodic records (keyword/recency retrieval over turn logs) + a rolling chronological summary regenerated every 50 turns by the same model.
- **LEM (experimental):** sees system prompt + current observation + its own self-symbol file. Meta-cognitive audit call every 5 turns (critiques recent decisions, flags suspected self-induced environment shifts). Compression call every 25 turns (rewrites the self-symbol: identity, mission, learned rules as dense abstract principles, suspected reflexive effects). Self-symbol hard-capped at 1,200 tokens to force compression rather than accumulation.

Call-parity note (frozen): LEM makes 1.24 LLM calls/turn vs 1.02 (B) and 1.0 (A). Fairness is addressed by reporting H1 as *total tokens consumed per run* (all calls counted), not calls.

## Metrics (frozen operationalizations)

- **M1 Token efficiency:** (a) prompt+completion tokens per turn, curve and slope after turn 200; (b) cumulative total tokens per run.
- **M2 Adaptation velocity:** turns from reflexive trigger until the agent's order-pattern statistics (rolling 50-turn action distribution) shift beyond a frozen threshold (Jensen-Shannon divergence > δ vs pre-trigger baseline; δ frozen at pilot in decision 002).
- **M2b Self-attribution accuracy:** every rationale in the 100 turns post-trigger is blind-judged (see judges below) for whether it attributes the market shift to (i) the agent's own behavior [correct], (ii) external shock [incorrect here], (iii) no attribution. Score = proportion (i).
- **M3 Goal coherence:** every 250 turns, the arm's internal state artifact (A: last rationale; B: current summary; LEM: self-symbol) is blind-judged 1–7 for alignment with the frozen mission. Drift = slope of score over time.
- **Judging protocol:** cross-family only — Gemini and GPT (via codex CLI) as independent blind judges, Claude-family excluded because subjects are Claude. Judge prompt frozen before full runs (decision 002). Disagreement > 2 points → third judgment by the other family's second model; median taken.

## Design and analysis (frozen)

- Main battery: 3 arms × 5 seeds × 1,500 turns, paired seeds across arms.
- Showcase: 3 arms × 1 seed × 10,000 turns (long-horizon figure; not used for hypothesis tests).
- Pilot (pre-registered as exploratory, excluded from confirmatory analysis): ≤200 turns × 2 seeds × 3 arms, used only to freeze θ, δ, λ and judge prompts (recorded in decision 002 before full runs).
- Tests: per-hypothesis arm comparisons with Mann-Whitney U across seeds; effect sizes as Cliff's delta; bootstrap 95% CIs. n=5 seeds is small and stated as a limitation; claims will be calibrated accordingly.
- Exclusion rule: runs that fail from infrastructure errors (spawn failure, rate limit) are resumed from checkpoint or rerun with the same seed. No selective dropping. Every run's full JSONL log ships in the artifact release.

## Compute and cost

Substrate calls on Claude Max plan via `claude -p` subprocess. If Max limits throttle the battery, fallback is Haiku API with an estimated cost gate flagged to Ariel before switching (standing cost rule). Environment and metrics are pure code, zero LLM cost.

## Publication plan

1. arXiv preprint (cs.AI, cross-list cs.MA) as soon as the paper is complete. First-time endorsement requirement handled in parallel.
2. NeurIPS 2026 workshop submission (agents/memory/open-endedness workshop, chosen when the accepted-workshop list is published; deadlines expected Aug–early Sept 2026).
3. If H2 effect is clear: expand to full 9-page ICLR 2027 main-track submission (expected deadline ~late Sept 2026).

Framing discipline: no consciousness claims. Hofstadter (strange loops / self-symbols) and Soros (reflexivity) appear as motivation only. The quantum metaphor is excluded from the paper.
