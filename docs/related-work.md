# Related Work Survey — LEM Study

**Scope:** literature sweep (2023–2026, plus foundational earlier work) for *Reflexive Environments as a Benchmark for Long-Horizon Agent Memory*. Compiled 2026-07-02 via web search with per-paper verification of arXiv IDs. All entries below have a matching BibTeX entry in `paper/references.bib`.

**Our two claimed contributions, for reference:**
- **C1 (reflexive benchmark):** a deterministic, seeded long-horizon environment whose secondary actors ("watchers") adapt to the focal agent's detected strategy, with exogenous shocks as a confound so self-induced shifts are distinguishable from external ones.
- **C2 (self-model memory advantage):** a recursive self-model memory architecture (capped, continuously rewritten self-symbol + metacognitive audit) outperforms stateless and RAG+summary baselines in reflexive settings, including on self-attribution of self-induced shifts (M2b).

---

## Cluster 1 — LLM agent memory architectures

**Reflexion** — Shinn, Cassano, Gopinath, Narasimhan & Yao (2023), *Reflexion: Language Agents with Verbal Reinforcement Learning*, NeurIPS 2023, arXiv:2303.11366.
Contribution: agents improve across episodes by storing self-generated verbal critiques of failures in an episodic memory buffer.
Differs: Reflexion's memory is an append-only list of episodic lessons in static tasks; LEM compresses lessons into a single bounded self-symbol and is evaluated in an environment that reacts to the agent.

**MemGPT** — Packer, Wooders, Lin, Fang, Patil, Stoica & Gonzalez (2023), *MemGPT: Towards LLMs as Operating Systems*, arXiv:2310.08560.
Contribution: OS-style virtual context management with self-editing memory blocks (including a persona block) paged between context and external storage.
Differs: MemGPT's persona block is the closest architectural ancestor of our self-symbol, but it is a personalization/consistency device never evaluated for strategic adaptation in an adaptive environment; we test whether such a self-model confers measurable advantage under reflexivity.

**Voyager** — Wang, Xie, Jiang, Mandlekar, Xiao, Zhu, Fan & Anandkumar (2023), *Voyager: An Open-Ended Embodied Agent with Large Language Models*, arXiv:2305.16291.
Contribution: lifelong learning in Minecraft via an ever-growing skill library of verified code.
Differs: Voyager accumulates procedural skills in a static-rules world; LEM compresses declarative self-knowledge under a hard token cap and must handle rules that change *because of* its behavior.

**Generative Agents** — Park, O'Brien, Cai, Morris, Liang & Bernstein (2023), *Generative Agents: Interactive Simulacra of Human Behavior*, UIST 2023, arXiv:2304.03442.
Contribution: memory stream + retrieval + periodic reflection into higher-level abstractions for believable social agents.
Differs: their reflection synthesizes observations about the *world and others* for believability; our audit/compression loop synthesizes a model of the *agent itself* and is scored on task performance and attribution accuracy, not believability.

**MemoryBank** — Zhong, Guo, Gao, Ye & Wang (2024), *MemoryBank: Enhancing Large Language Models with Long-Term Memory*, AAAI 2024, arXiv:2305.10250.
Contribution: long-term companion-chat memory with Ebbinghaus-inspired forgetting curves.
Differs: decay-based forgetting in cooperative dialogue vs. deliberate lossy compression into abstract principles in an adversarially adapting environment.

**HippoRAG** — Gutiérrez, Shu, Gu, Yasunaga & Su (2024), *HippoRAG: Neurobiologically Inspired Long-Term Memory for Large Language Models*, NeurIPS 2024, arXiv:2405.14831.
Contribution: hippocampal-index-inspired RAG (knowledge graph + Personalized PageRank) for knowledge integration.
Differs: optimizes retrieval over external documents; our Control B represents this retrieval-centric paradigm, and the study asks when retrieval fundamentally underperforms self-model compression.

**A-MEM** — Xu, Liang, Mei, Gao, Tan & Zhang (2025), *A-MEM: Agentic Memory for LLM Agents*, arXiv:2502.12110.
Contribution: Zettelkasten-style dynamic memory organization with agentic indexing and linking.
Differs: grows an interconnected note network; LEM does the opposite — forces a fixed-size recursive summary — and we test which regime survives a reflexive trigger.

**Agent Workflow Memory** — Wang, Mao, Fried & Neubig (2024), *Agent Workflow Memory*, arXiv:2409.07429.
Contribution: induces reusable workflows from past trajectories and injects them into web-agent memory.
Differs: reusable-routine memory presumes the environment keeps rewarding the same routines; our benchmark is built so that exactly this assumption fails (predictable routines get exploited).

**Mem0** — Chhikara, Khant, Aryan, Singh & Yadav (2025), *Mem0: Building Production-Ready AI Agents with Scalable Long-Term Memory*, arXiv:2504.19413.
Contribution: production memory layer that extracts/consolidates salient facts, with large latency and token-cost savings.
Differs: shares our H1 concern (token efficiency) but evaluates on conversational QA; we measure token curves over 1,500–10,000 adversarially adapting turns.

**Zep** — Rasmussen, Paliychuk, Beauvais, Ryan & Chalef (2025), *Zep: A Temporal Knowledge Graph Architecture for Agent Memory*, arXiv:2501.13956.
Contribution: temporally-aware knowledge-graph memory engine (Graphiti) beating MemGPT on DMR/LongMemEval.
Differs: temporal fact tracking for enterprise retrieval; no self-model and no adaptive environment.

**MemoryOS** — Kang, Ji, Zhao & Bai (2025), *Memory OS of AI Agent*, EMNLP 2025, arXiv:2506.06326.
Contribution: OS-inspired hierarchical short/mid/long-term memory management for personalized agents.
Differs: personalization-oriented storage hierarchy; LEM is a single flat artifact whose value is tested under reflexive pressure, not recall benchmarks.

**MIRIX** — Wang & Chen (2025), *MIRIX: Multi-Agent Memory System for LLM-Based Agents*, arXiv:2507.07957.
Contribution: six-type memory system (Core/Episodic/Semantic/Procedural/Resource/Knowledge-Vault) managed by a multi-agent controller.
Differs: MIRIX's "Core" memory again resembles a self-model slot but is evaluated on multimodal recall (ScreenshotVQA, LOCOMO); no reflexive or even interactive decision environment.

**Sleep-time Compute** — Lin et al. (2025), *Sleep-time Compute: Beyond Inference Scaling at Test-time*, arXiv:2504.13171.
Contribution: agents spend offline compute rewriting/re-representing their memory state between queries, cutting test-time compute ~5x.
Differs: closest mechanism-level prior for our periodic compression call; it optimizes latency/accuracy on stateful QA, whereas we ask whether periodic self-rewriting confers *strategic* advantage when the environment adapts.

**Recursive summarization** — Wang et al. (2023), *Recursively Summarizing Enables Long-Term Dialogue Memory in Large Language Models*, arXiv:2308.15022 (Neurocomputing 2025).
Contribution: recursively folding new context into a running summary sustains long-dialogue consistency.
Differs: this is essentially our Control B summary mechanism; LEM differs by rewriting an *identity-and-principles* artifact rather than a chronological digest — the paper thus helps define our baseline, not our contribution.

**LLMLingua** — Jiang, Wu, Lin, Yang & Qiu (2023), *LLMLingua: Compressing Prompts for Accelerated Inference*, EMNLP 2023, arXiv:2310.05736.
Contribution: coarse-to-fine token-level prompt compression with up to 20x ratios.
Differs: syntactic/token-level compression preserving content; LEM's compression is semantic and lossy by design (abstraction into principles), measured by downstream adaptation rather than fidelity.

**CoALA** — Sumers, Yao, Narasimhan & Griffiths (2024), *Cognitive Architectures for Language Agents*, TMLR 2024, arXiv:2309.02427.
Contribution: framework organizing language agents by memory types (working/episodic/semantic/procedural) and decision loops.
Differs: taxonomy paper; LEM's self-symbol does not fit cleanly in its four memory types (it is a compressed self-referential hybrid), which we can use to position the architecture.

**Identity drift** — Choi et al. (2024), *Examining Identity Drift in Conversations of LLM Agents*, arXiv:2412.00804.
Contribution: shows LLMs lose assigned identity/persona consistency over long conversations, worse in larger models; static personas don't prevent it.
Differs: documents the failure mode that motivates H3 (goal coherence); LEM tests an *active* countermeasure (recursive self-model rewriting) rather than measuring passive drift.

**Darwin Gödel Machine** — Zhang, Hu, Lu, Lange & Clune (2025), *Darwin Gödel Machine: Open-Ended Evolution of Self-Improving Agents*, ICLR 2026, arXiv:2505.22954.
Contribution: self-referential agents that rewrite their own code, validated empirically rather than by proof.
Differs: self-modification of *code/scaffolding* across evolutionary generations; LEM self-modifies a *memory artifact* within a single agent's lifetime, with the environment (not a benchmark suite) supplying selection pressure.

**Survey** — Hu, Liu et al. (2025), *Memory in the Age of AI Agents*, arXiv:2512.13564. Comprehensive taxonomy (forms/functions/dynamics) of agent memory; useful for positioning and confirms via its benchmark compilation that no surveyed evaluation uses a strategy-adaptive environment.

---

## Cluster 2 — Long-horizon agent benchmarks and the static-environment assumption

For each: **does the environment adapt to the agent's strategy?**

| Benchmark | Environment adapts to agent strategy? |
|---|---|
| ALFWorld | No — fixed household task dynamics |
| MiniWoB++ | No — fixed synthetic web widgets |
| WebArena | No — self-hosted sites with fixed state-transition rules |
| GAIA | No — one-shot QA, no persistent environment at all |
| AgentBench | No — 8 fixed environments |
| SmartPlay | No — game opponents are fixed policies |
| BALROG | No — procedural variation ≠ strategic reaction; rules never respond to the agent's policy |
| tau-bench | Partially reactive, not strategic — the simulated user responds within a scripted persona/goal; it does not model or counter the agent's strategy across tasks |
| TheAgentCompany | No — simulated colleagues are scripted NPCs |
| Vending-Bench | No — demand/supply process independent of agent's strategy pattern |
| UltraHorizon | No — hidden rules are fixed; agent discovers them, they never change in response |
| LoCoMo / MemoryAgentBench | No — pre-generated interaction streams; pure recall/consolidation testing |
| RetailBench | No — exogenous events only; no actor models the agent |
| CoffeeBench | **No — explicitly fixed:** the five other firms are "fixed reference agents" |

**ALFWorld** — Shridhar, Yuan, Côté, Bisk, Trischler & Hausknecht (2021), ICLR 2021, arXiv:2010.03768. Aligns TextWorld with embodied ALFRED tasks for abstract-to-grounded policy transfer. Static: the canonical example of the assumption we relax.

**MiniWoB++** — Liu, Guu, Pasupat, Shi & Liang (2018), ICLR 2018, arXiv:1802.08802. Web-interaction micro-tasks with workflow-guided exploration. Static.

**WebArena** — Zhou et al. (2024), ICLR 2024, arXiv:2307.13854. Realistic self-hosted web environments for long-horizon web tasks. Static; sites never react to agent patterns.

**GAIA** — Mialon, Fourrier, Swift, Wolf, LeCun & Scialom (2023), arXiv:2311.12983. General-assistant questions requiring tool use and multi-step reasoning. No persistent environment; nothing to adapt.

**AgentBench** — Liu et al. (2023), ICLR 2024, arXiv:2308.03688. Multi-environment LLM-as-agent evaluation suite. Static.

**SmartPlay** — Wu et al. (2024), ICLR 2024, arXiv:2310.01557. Six games isolating agent capabilities (planning, spatial reasoning, randomness). Opponents are fixed-policy; no strategic adaptation to the focal agent.

**BALROG** — Paglieri et al. (2024), ICLR 2025, arXiv:2411.13543. Long-horizon game suite up to NetHack difficulty. Procedural stochasticity but rule-stationary with respect to agent strategy.

**tau-bench** — Yao, Shinn, Razavi & Narasimhan (2024), arXiv:2406.12045. Tool-agent-user benchmark with LM-simulated users and pass^k reliability metric. The user is *reactive* (responds to the agent's utterances) but not *reflexive* (does not learn/counter the agent's strategy over the horizon); we adopt its emphasis on consistency across trials via paired seeds.

**TheAgentCompany** — Xu et al. (2024), arXiv:2412.14161. Simulated software company with browsing, coding, and scripted colleague communication. Static NPCs.

**Vending-Bench** — Backlund & Petersson (2025), arXiv:2502.15840. Long-horizon (>20M tokens) vending-machine business sim exposing coherence "meltdowns" uncorrelated with context limits. Closest long-horizon *economic* predecessor, and its meltdown finding motivates H3; but its market never reacts to the agent's strategy, and it compares models, not memory architectures.

**UltraHorizon** — Luo et al. (2025), arXiv:2509.21766. Ultra-long exploration tasks (200k+ tokens, 400+ tool calls) where agents uncover hidden but *fixed* rules; identifies "in-context locking" as a failure mode. We add the case where the rules move because the agent probed them.

**LoCoMo** — Maharana, Lee, Tulyakov, Bansal, Barbieri & Fang (2024), ACL 2024, arXiv:2402.17753. Very-long-term conversational memory dataset (up to 35 sessions). Pure recall; no environment.

**MemoryAgentBench** — Hu, Wang & McAuley (2025), ICLR 2026, arXiv:2507.05257. Four memory competencies (retrieval, test-time learning, long-range understanding, conflict resolution) via incremental multi-turn interactions. Evaluates memory *quality in consumption*, not memory *strategy under adversarial adaptation*; none of its four competencies covers self-attribution.

**RetailBench** — Zhang, Wang, Wu & Zhang (2026), arXiv:2603.16453. 180-day single-store retail sim testing strategy stability of seven LLMs. Exogenous events only — confirms the gap: even 2026 long-horizon economic benchmarks keep the environment indifferent to the agent.

**CoffeeBench** — Sugiura, Hattori, Araragi, Ogawa, Onose, Makino, Usuki & Ishida (2026), arXiv:2606.16613. 90-day coffee-supply-chain economy where the evaluated roaster trades with five other firms — which are *fixed reference agents*. The most surface-similar benchmark to ours; its explicit choice of non-adaptive counterparties is direct evidence that the reflexive axis is unoccupied. Must be cited and distinguished prominently.

---

## Cluster 3 — Adaptive / non-stationary / reflexive environments

**Soros (1987)** — *The Alchemy of Finance*. Introduces reflexivity: market participants' biased views alter the fundamentals those views are about. Our environment operationalizes this loop in miniature (watchers change price formation *because* they modeled the agent).

**Soros (2013)** — *Fallibility, Reflexivity, and the Human Uncertainty Principle*, J. Economic Methodology 20(4). Formal statement of reflexivity as a two-way feedback between cognitive and manipulative functions. Motivation-only citation, per the preregistration's framing discipline.

**Beinhocker (2013)** — *Reflexivity, Complexity, and the Nature of Social Science*, J. Economic Methodology 20(4). Situates reflexivity within complex-adaptive-systems theory. Bridges Soros to the multi-agent-simulation literature for our related-work narrative.

**Performative Prediction** — Perdomo, Zrnic, Mendler-Dünner & Hardt (2020), ICML 2020, arXiv:2002.06673. Formalizes predictions that shift the distribution they predict; introduces performative stability. The supervised-learning formalization of reflexivity — our benchmark is, in effect, a *performative* decision environment for LLM agents; we cite this line as the theoretical anchor so reviewers do not treat "reflexivity" as merely literary.

**Performative Prediction: Past and Future** — Hardt & Mendler-Dünner (2023), arXiv:2310.16608. Survey consolidating performativity, including performative power. Useful for framing; contains no agentic/LLM instantiation.

**Performative Reinforcement Learning** — Mandal, Triantafyllou & Radanovic (2023), ICML 2023, arXiv:2207.00046. Extends performativity to RL: the deployed policy changes transition dynamics and rewards; proves convergence to performatively stable policies. Theory with tabular/regularized solvers; no LLM agents, no memory, no attribution measurement — we provide the empirical LLM-agent counterpart.

**Performative RL in Gradually Shifting Environments** — Rank, Triantafyllou, Mandal & Radanovic (2024), UAI 2024, arXiv:2402.09838. Models environments that respond to deployed policies gradually — structurally similar to our watchers' threshold-triggered adaptation. Same theory-vs-benchmark distinction as above.

**LOLA** — Foerster, Chen, Al-Shedivat, Whiteson, Abbeel & Mordatch (2018), AAMAS 2018, arXiv:1709.04326. Gradient-based agents that account for their own influence on opponents' learning updates. The classic MARL formalization of "my behavior trains my opponents"; LEM asks whether a *memory architecture* lets a frozen-weights LLM approximate this awareness in context.

**Non-stationarity surveys** — Hernandez-Leal, Kaisers, Baarslag & Munoz de Cote (2017), arXiv:1707.09183; Papoudakis, Christianos, Rahman & Albrecht (2019), arXiv:1906.04737. Canonical treatments of opponent-induced non-stationarity in multi-agent learning. Establish vocabulary (opponent modeling, adaptation) that we transfer from weight-learning agents to in-context LLM agents.

**Melting Pot** — Leibo, Duéñez-Guzmán, Vezhnevets et al. (2021), ICML 2021, arXiv:2107.06857. Evaluates MARL generalization to novel co-players in social dilemmas. Adaptive co-players exist here — but for RL policies trained over many episodes, not in-context LLM agents with explicit memory artifacts; also no self-attribution measure.

**Opponent Shaping in LLM Agents** — Garcia Segura, Hailes & Musolesi (2025), arXiv:2510.08255. ShapeLLM shows transformer agents can deliberately steer co-players' learning in matrix games — LLM agents "can both shape and be shaped." The inverse direction of our question: they engineer influence; we test whether an agent *detects and attributes* the influence it has unintentionally exerted, and whether memory architecture moderates that ability.

**EconAgent** — Li, Gao, Li, Li & Liao (2024), ACL 2024, arXiv:2310.10436. LLM agents with perception/memory/reflection simulate macroeconomic dynamics. Simulation-fidelity goal (do LLM populations reproduce macro stylized facts), not benchmark goal; no focal agent evaluated.

**StockAgent** — Zhang, Liu, Jin et al. (2024), arXiv:2407.18957. LLM multi-agent stock market with external-factor manipulation. Agents react to shared prices — collective endogeneity exists — but no focal agent, no targeted exploitation of a detected pattern, no memory comparison.

**Can LLMs Trade?** — Lopez-Lira (2025), arXiv:2504.10789. Heterogeneous LLM trader arena where price discovery, bubbles, and strategic liquidity emerge from collective actions; notes correlated-prompt behavior affects stability. Closest LLM *market* prior with genuine endogenous feedback; still simulation-science framing — no benchmark protocol, no memory arms, no reflexive trigger isolating self-induced shift.

**OASIS** — Yang et al. (2024), arXiv:2411.11581. Million-agent social-media simulator with recommender feedback loops. Platform-scale endogeneity; not a focal-agent benchmark.

**GovSim** — Piatti, Jin, Kleiman-Weiner, Schölkopf, Sachan & Mihalcea (2024), NeurIPS 2024, arXiv:2404.16698. Common-pool resource sim where LLM societies usually collapse; failures traced to inability to hypothesize the long-term effects of one's own actions on the group equilibrium. The closest published *finding* to our H2 premise — agents are bad at reasoning about self-induced environmental effects — but cooperative, anticipatory (not detection/attribution), and memory-architecture-free.

**Profit is the Red Team** — Wang, Politi, Marro & Crapis (2026), arXiv:2603.20925. Stress-tests LLM agents in four canonical economic interactions against a *learned adversary* trained to maximize profit, which discovers probing, anchoring, and deceptive commitments. The nearest neighbor to our watcher mechanism — an opponent that adapts to the focal agent for profit — but framed as security red-teaming, short-horizon, with no memory comparison and no attribution metric. Highest-priority citation for C1.

**AgentLAB** — Jiang, Wang, Liang & Wang (2026), arXiv:2602.16901. Benchmarks agent susceptibility to adaptive long-horizon attacks (intent hijacking, memory poisoning, objective drifting) across 28 environments. Adversary adapts and memory is attacked — but the object of study is vulnerability, not memory-architecture capability; objective-drifting attacks connect to our H3.

---

## Cluster 4 — Meta-cognition / self-reflection in LLM agents

**Self-Refine** — Madaan et al. (2023), NeurIPS 2023, arXiv:2303.17651. Iterative self-feedback improves single-shot outputs without training. Single-turn output polishing; LEM's audit critiques *decision history* against an environment model.

**CRITIC** — Gou, Shao, Gong, Shen, Yang, Duan & Chen (2024), ICLR 2024, arXiv:2305.11738. Tool-assisted self-critique; also shows unaided intrinsic self-correction is weak. Cautionary prior for us: LEM's audit is unaided, so we must show its value comes from *accumulated self-knowledge*, not from the critique step per se — supports our Control B comparison design.

**Metacognitive Prompting** — Wang & Zhao (2024), NAACL 2024, arXiv:2308.05342. Five-stage introspective prompting improves understanding tasks. Static NLU; we move metacognition into a closed loop with an environment that punishes its absence.

**Evidence for Limited Metacognition in LLMs** — Ackerman (2025), arXiv:2509.21545. Frontier LLMs have real but low-resolution, context-dependent metacognitive abilities. Grounds our expectation that raw substrate metacognition is weak — the LEM hypothesis is precisely that an *architectural* scaffold (persistent self-symbol) compensates.

**Intrinsic Metacognitive Learning** — Liu & van der Schaar (2025), ICML 2025 position paper, arXiv:2506.05109. Argues self-improving agents need intrinsic metacognition (self-assessment of one's own learning process), with current agents' metacognition fixed and human-designed. The position our experiment operationalizes and tests; it offers no environment, metrics, or empirical comparison — we supply all three.

**Agentic Knowledgeable Self-awareness** — Qiao et al. (2025), arXiv:2504.03553. KnowSelf: agents situationally judge when they need knowledge vs. reflection ("knowledgeable self-awareness") in planning tasks. Self-awareness about *knowledge boundaries* in static tasks; our M2b targets self-awareness about *causal footprint* on the environment.

**Hypothetical Minds** — Cross, Xiang, Bhatia, Yamins & Haber (2024), arXiv:2407.07086. LLM agent with a Theory-of-Mind module that generates and refines natural-language hypotheses about *other agents'* strategies in Melting Pot, validated by prediction accuracy. Closest architectural prior for the audit step (hypothesis generation + validation about other actors). Crucially, its hypotheses run in one direction — "what is the opponent doing?" — never "is the opponent doing this *because of me*?" No self-attribution, no persistent compressed self-model, no memory-arm comparison.

**Self-attribution of self-induced environmental shifts — gap check.** Targeted searches ("agent attributes environment change to own actions", "agent-induced/endogenous distribution shift + LLM agents", "detect adversary adaptation", performative RL follow-ups, self-evolving-agent surveys) surfaced *no* paper that measures whether an LLM agent correctly attributes an environmental shift to its own behavior versus an exogenous cause. The nearest items are GovSim's failure analysis (anticipation, not detection; cooperative), LOLA (gradient-level, not epistemic), and the performative-RL theory line (defines the shift, never asks the agent to explain it). As of 2026-07-02, M2b appears to be an unoccupied measurement.

---

## Cluster 5 — Strange loops in AI architecture (motivation support)

**Hofstadter (1979)** — *Gödel, Escher, Bach*. Tangled hierarchies and self-reference as the substrate of cognition. Motivation-only citation for the self-symbol construct.

**Hofstadter (2007)** — *I Am a Strange Loop*. The self as a self-referential symbol the system continuously rewrites — the direct namesake of LEM's self-symbol file. Motivation only; no consciousness claims (per preregistration).

**Gödel Machines** — Schmidhuber (2007; arXiv:cs/0309048). Fully self-referential learners that provably rewrite their own code. Establishes self-reference as a serious architectural lineage; LEM is the lightweight, memory-level, empirically-evaluated end of that spectrum.

**Darwin Gödel Machine** — Zhang, Hu, Lu, Lange & Clune (2025), ICLR 2026, arXiv:2505.22954 (also Cluster 1). Empirical revival of self-referential self-improvement. Shows venue appetite for strange-loop-flavored architectures with rigorous evaluation.

**Tangled information hierarchies** — Prokopenko, Davies, Harré, Heisler, Kuncic, Lewis, Livson, Lizier & Rosas (2024), arXiv:2409.12029. Formalizes Hofstadter-style tangled hierarchies and self-modelling dynamics in the emergence of biological complexity. A peer-reviewed-adjacent, non-metaphorical citation for "self-modelling tangled hierarchy," strengthening the motivation section beyond popular books.

**Hofstadter-Möbius loops in LLMs** — Hryszko (2026), arXiv:2603.13378. Uses "Hofstadter-Möbius loop" (via Clarke's *2010*) for RLHF contradiction-induced failure modes. Name-only overlap — it is about conflicting directives, not self-model architecture; cite defensively in a footnote if at all, to avoid reviewer confusion with our usage.

---

## Novelty risk assessment

### Contribution C1 — the reflexive benchmark

| Threat | Overlap | Severity |
|---|---|---|
| **Profit is the Red Team** (arXiv:2603.20925, Mar 2026) | A learned, profit-maximizing adversary adapts against a focal LLM agent in economic interactions — the same *mechanism* as our watchers. Framed as security stress-testing; short-horizon canonical games; no seeded determinism/paired-arm protocol; no exogenous-shock confound; no memory arms; no attribution metric. | **Moderate-high.** Does not preempt the benchmark claim, but a reviewer will surface it. Cite in the intro, adopt "reflexive *benchmark for memory*" (not "first adaptive adversary") as the exact claim. |
| **Performative prediction / performative RL** (2002.06673; 2207.00046; 2402.09838) | The formal concept that a deployed policy shifts its own environment is fully established. | **Moderate (conceptual only).** Zero empirical LLM-agent overlap. Turn it into an asset: our environment is the first LLM-agent *memory* benchmark instantiating performativity, and Soros framing must be co-anchored to this literature to be taken seriously. |
| **Opponent Shaping in LLM Agents** (2510.08255) | Establishes that LLM agents shape and are shaped by co-players' learning. | **Moderate.** Inverse direction (deliberate shaping vs. detection/attribution of self-induced shifts); matrix games vs. long-horizon market; no memory comparison. |
| **CoffeeBench** (2606.16613) / **RetailBench** (2603.16453) / **Vending-Bench** (2502.15840) | Long-horizon economic-sim benchmarks — same surface aesthetics. | **Low-moderate.** All three keep counterparties fixed or purely exogenous (CoffeeBench states "fixed reference agents" explicitly). They *strengthen* the gap claim; the risk is only reviewer conflation, handled by the Cluster 2 table. |
| **AgentLAB** (2602.16901) | Adaptive long-horizon adversaries, memory as attack surface. | **Low-moderate.** Security framing; measures vulnerability, not memory capability. |
| **GovSim** (2404.16698) | Environment (commons) responds to collective agent behavior; failure analysis touches self-induced effects. | **Low.** Cooperative, no focal agent, no attribution metric. |

### Contribution C2 — self-model memory advantage in reflexive settings (incl. M2b self-attribution)

| Threat | Overlap | Severity |
|---|---|---|
| **Hypothetical Minds** (2407.07086) | Hypothesis-generation-and-validation loop about other agents ≈ our audit step; beats baselines in adaptive multi-agent settings. | **Moderate.** Their hypotheses are about others, never about the agent's own causal footprint; no persistent capped self-symbol; no memory-arm comparison; Melting Pot episodes vs. 1,500-turn campaigns. Cite as closest architecture and differentiate on self-attribution. |
| **MemGPT persona / MIRIX Core / MemoryOS** (2310.08560; 2507.07957; 2506.06326) | Persistent agent-identity memory blocks exist in prior architectures. | **Low-moderate.** In all three, the self/persona block is a consistency-and-personalization device evaluated on recall benchmarks; none is recursively rewritten under a hard cap, and none is evaluated in any interactive — let alone reflexive — environment. Our claim must be phrased as *advantage of a self-model in reflexive settings*, not *invention of self-model memory*. |
| **Sleep-time Compute** (2504.13171) | Periodic offline rewriting of memory state ≈ our compression call. | **Moderate (mechanism only).** Optimizes cost/latency on stateful QA; no strategy, no environment. Cite when introducing the compression schedule. |
| **Reflexion / Self-Refine / CRITIC** (2303.11366; 2303.17651; 2305.11738) | Self-critique loops are standard. | **Low.** Episodic, static tasks; CRITIC's finding that unaided self-correction is weak actually raises the bar our results must clear — design already handles this via Control B. |
| **Intrinsic metacognitive learning position** (2506.05109) | Argues for exactly the capability we test. | **Low (and citable as motivation).** Position paper with no experiments — we are the test it calls for. |
| **M2b self-attribution measure** | No paper found that scores LLM agents on attributing environment shifts to their own behavior vs. exogenous causes. | **Currently unoccupied.** This is the sharpest novelty and should be foregrounded in the abstract. |

### Bottom line

1. **Neither claimed contribution is scooped as of 2026-07-02.** Every long-horizon benchmark checked — including the 2026 economic ones — holds the environment's other actors fixed with respect to the focal agent's strategy.
2. **The claim wording matters.** Safe claims: "first *benchmark* to make environmental adaptation to the agent's own strategy the object of *memory-architecture* evaluation" and "first *measurement* of self-attribution of self-induced environmental shifts." Unsafe claims (already taken): "first adaptive adversary for LLM agents" (Profit is the Red Team, AgentLAB), "first self-model memory" (MemGPT et al.), "first LLM market sim with endogenous feedback" (Lopez-Lira).
3. **Mandatory citations to survive review:** Profit is the Red Team, performative prediction/RL line, Opponent Shaping in LLM Agents, Hypothetical Minds, CoffeeBench, Vending-Bench, GovSim, Sleep-time Compute, MemGPT.
4. **Residual risk:** the 2603–2606 arXiv range is moving fast (three new economic benchmarks in four months). Re-run the Cluster 3/4 scoop-hunt searches immediately before the arXiv upload and again before the NeurIPS workshop deadline.
