# arXiv submission — ready-to-fill metadata

**Upload file:** `paper/arxiv-submission.tar.gz` (LaTeX source + `main.bbl` + `figs/`; verified to compile clean in an isolated directory, 17 pp, 0 undefined refs). arXiv recompiles from source — do NOT upload the PDF alone.

## Form fields

**Title:**
Learning to Withdraw: Reflexive Environments as a Benchmark for Long-Horizon Agent Memory

**Authors:**
Ariel Agor

**Primary category:** cs.LG (Machine Learning)
**Cross-list:** cs.AI (Artificial Intelligence), cs.MA (Multiagent Systems)

**Comments:**
17 pages, 5 figures. Pre-registered (hypotheses/metrics/exclusions committed to version control before any run). Code, run logs, and cross-family judge transcripts: https://github.com/arielagor/lem-research

**License:** CC BY 4.0 recommended (maximum reuse/citation; you can also pick arXiv's default non-exclusive license if you prefer to restrict reuse).

**Abstract (plain text — paste as-is):**

Benchmarks for LLM agents almost universally hold the environment's other actors fixed with respect to the agent's strategy. Real deployment settings are reflexive: markets, negotiations, and multi-agent ecosystems adapt to the agent's observable behavior, so the agent's own participation shifts the process it is trying to predict. We introduce a deterministic, seeded commodity-market benchmark in which rule-based adversaries profile the focal agent's order flow and, once its behavior becomes predictable, exploit it through front-running and targeted spread-widening. We evaluate three memory architectures over 1,500-10,000-turn campaigns: a stateless baseline, a conventional episodic-summary-plus-retrieval memory, and a recursive self-model architecture that maintains a token-capped, continuously rewritten identity file through a meta-cognitive audit loop. We find that reflexivity punishes engagement: the stateless agent, unable to represent that its own patterns are being exploited, keeps trading and is driven to ruin (mean campaign score -1686, exploited on 82% of turns), while both memory architectures survive primarily by learning to withdraw from the market. The self-model architecture withdraws reliably across all seeds and with explicit reflexive reasoning; the retrieval baseline withdraws erratically and on one seed re-engages catastrophically. We introduce a self-attribution metric — whether the agent attributes environmental shifts to its own footprint rather than to exogenous shocks — scored blind by cross-family judges. Self-attribution is near-zero for stateless (0.00) and higher for both memory arms (retrieval 0.11, self-model 0.21); the self-model exceeds stateless significantly (Cliff's delta=+1.00, p=0.010) and retrieval numerically but not significantly at n=5. A pre-registered hypothesis is also rejected: in this environment goal coherence is anti-correlated with survival, because the stateless agent coherently restates the trading mission it is dying by while the survivors abandon trading. We are deliberately conservative about mechanism: with n=5 seeds in a single mean-reverting market where inactivity is near-optimal, we can establish that stateless agents collapse and that memory enables withdrawal, but we cannot separate the self-model's architecture from mere inactivity, and we frame the self-model results as preliminary, motivating the activity-controlled ablations and non-mean-reverting regimes we specify for future work. We offer this as an honest characterization of what current agent memory does under reflexivity, and a benchmark and metric for studying it, rather than a claim of architectural superiority. All hypotheses, metrics, and exclusion rules were pre-registered in version control before any run.

## Endorsement (the real gate)

First-time cs.* submitters usually need an endorsement for the primary category (cs.LG). When you start the submission, arXiv tells you whether you're already endorsed (registering with a recognized email can auto-endorse; a Rutgers address may or may not).

If it asks for one:
1. arXiv shows you an endorsement code + a link.
2. Send it to someone who has submitted 3+ papers to cs.LG in the qualifying window (a former advisor, a co-author, or any ML-publishing colleague). They click the link, enter the code, done — usually same-day.
3. Do NOT pay anyone or use a stranger; endorsement is a vouching mechanism.

Note: you can create/hold the submission in "unfinished" state on arXiv while endorsement is pending, so the metadata + upload work isn't wasted.

## Status (2026-07-09)
- Submission draft **7809406** created and saved at the Start step: author=Ariel Agor, license=CC BY 4.0, primary category=cs.AI, terms accepted.
- **BLOCKED on endorsement:** arXiv requires a cs.AI endorsement (first-time submitter). Endorsement code was emailed to ariel.agor@gmail.com — forward to a qualified endorser (3+ cs.* arXiv papers, 3mo–5yr window).
- Duplicate empty draft 7809412 exists (from a double "Start" click) — ignore; auto-expires 2026-07-24.
- On endorsement: resume 7809406 → Add Files (upload arxiv-submission.tar.gz) → Process → Metadata (title/abstract/comments, cross-list cs.LG+cs.MA) → Preview → Submit.
