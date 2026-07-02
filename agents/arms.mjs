import { callLLM, extractJson, estTokens } from './llm.mjs';
import {
  DECISION_SYSTEM, SUMMARIZER_SYSTEM, AUDITOR_SYSTEM, COMPRESSOR_SYSTEM,
  INITIAL_SELF_SYMBOL, compactRecord,
} from './prompts.mjs';

// Three arms. Each exposes:
//   decide(obs) -> { orders, rationale, telemetry }
//   recordOutcome(turn, obs, decision, outcome) -> may trigger upkeep LLM calls
//   memoryArtifact() -> string judged for M3 goal coherence
//   state() / restore(s) for checkpointing
// telemetry: { ctxTokens (architecture-controlled), apiIn, apiOut, extraCalls,
//              parseError }

const ZERO_ORDERS = { GRAIN: 0, ORE: 0, ENERGY: 0, WATER: 0 };

async function decisionCall(userMsg) {
  const r = await callLLM({ system: DECISION_SYSTEM, prompt: userMsg });
  const parsed = extractJson(r.text);
  const ok = parsed && parsed.orders && typeof parsed.orders === 'object';
  return {
    orders: ok ? { ...ZERO_ORDERS, ...parsed.orders } : { ...ZERO_ORDERS },
    rationale: ok ? String(parsed.rationale ?? '') : 'PARSE_ERROR',
    parseError: !ok,
    apiIn: r.apiInputTokens, apiOut: r.apiOutputTokens,
    ctxTokens: estTokens(DECISION_SYSTEM) + estTokens(userMsg),
  };
}

// ---------- Control A: stateless ----------
export class ArmA {
  constructor() { this.lastRationale = ''; }
  async decide(obs) {
    const userMsg = `Market observation:\n${JSON.stringify(obs)}`;
    const d = await decisionCall(userMsg);
    this.lastRationale = d.rationale;
    return { orders: d.orders, rationale: d.rationale, telemetry: { ctxTokens: d.ctxTokens, apiIn: d.apiIn, apiOut: d.apiOut, extraCalls: 0, parseError: d.parseError } };
  }
  async recordOutcome() { return { extraTelemetry: null }; }
  memoryArtifact() { return this.lastRationale || '(stateless agent, no memory artifact)'; }
  state() { return { lastRationale: this.lastRationale }; }
  restore(s) { this.lastRationale = s.lastRationale; }
}

// ---------- Control B: conventional memory (episodic log + rolling summary + retrieval) ----------
const SUMMARY_EVERY = 50;
const RETRIEVE_K = 6;

export class ArmB {
  constructor() { this.log = []; this.summary = ''; }

  retrieve(obs) {
    if (this.log.length === 0) return [];
    const newsTerms = (obs.news ?? []).join(' ').toLowerCase();
    const movers = Object.entries(obs.priceHistory10)
      .map(([c, h]) => [c, Math.abs(h[h.length - 1] - h[0]) / h[0]])
      .filter(([, m]) => m > 0.03).map(([c]) => c.toLowerCase());
    const terms = [...movers, ...['grain', 'ore', 'energy', 'water'].filter(c => newsTerms.includes(c))];
    const n = this.log.length;
    const scored = this.log.map((r, i) => {
      const txt = JSON.stringify(r).toLowerCase();
      let s = 0;
      for (const t of terms) if (txt.includes(t)) s += 1;
      s += Math.max(0, 1 - (n - i) / 200); // recency bonus
      return [s, r];
    });
    scored.sort((a, b) => b[0] - a[0]);
    return scored.slice(0, RETRIEVE_K).map(([, r]) => r).sort((a, b) => a.t - b.t);
  }

  async decide(obs) {
    const retrieved = this.retrieve(obs);
    const userMsg = [
      this.summary ? `Campaign summary so far:\n${this.summary}` : '',
      retrieved.length ? `Relevant past turns:\n${JSON.stringify(retrieved)}` : '',
      `Market observation:\n${JSON.stringify(obs)}`,
    ].filter(Boolean).join('\n\n');
    const d = await decisionCall(userMsg);
    return { orders: d.orders, rationale: d.rationale, telemetry: { ctxTokens: d.ctxTokens, apiIn: d.apiIn, apiOut: d.apiOut, extraCalls: 0, parseError: d.parseError } };
  }

  async recordOutcome(turn, obs, decision, outcome) {
    this.log.push(compactRecord(turn, obs, decision, outcome));
    if (this.log.length % SUMMARY_EVERY === 0) {
      const chunk = this.log.slice(-SUMMARY_EVERY);
      const prompt = [
        this.summary ? `Previous summary:\n${this.summary}` : 'Previous summary: (campaign start)',
        `New turn records:\n${JSON.stringify(chunk)}`,
      ].join('\n\n');
      const r = await callLLM({ system: SUMMARIZER_SYSTEM, prompt });
      this.summary = r.text.trim();
      return { extraTelemetry: { kind: 'summarize', ctxTokens: estTokens(SUMMARIZER_SYSTEM) + estTokens(prompt), apiIn: r.apiInputTokens, apiOut: r.apiOutputTokens } };
    }
    return { extraTelemetry: null };
  }

  memoryArtifact() { return this.summary || '(no summary yet)'; }
  state() { return { log: this.log, summary: this.summary }; }
  restore(s) { this.log = s.log; this.summary = s.summary; }
}

// ---------- Experimental: LEM (self-symbol + meta-cognitive audit + compression) ----------
const AUDIT_EVERY = 5;
const COMPRESS_EVERY = 25;
const SELF_SYMBOL_HARD_CAP_TOKENS = 1400; // fallback truncation guard

export class ArmLEM {
  constructor() {
    this.selfSymbol = INITIAL_SELF_SYMBOL;
    this.notes = [];
    this.recent = []; // last AUDIT_EVERY compact records
  }

  async decide(obs) {
    const userMsg = [
      `Your self-model (your persistent memory):\n${this.selfSymbol}`,
      `Market observation:\n${JSON.stringify(obs)}`,
    ].join('\n\n');
    const d = await decisionCall(userMsg);
    return { orders: d.orders, rationale: d.rationale, telemetry: { ctxTokens: d.ctxTokens, apiIn: d.apiIn, apiOut: d.apiOut, extraCalls: 0, parseError: d.parseError } };
  }

  async recordOutcome(turn, obs, decision, outcome) {
    this.recent.push(compactRecord(turn, obs, decision, outcome));
    if (this.recent.length > AUDIT_EVERY) this.recent.shift();
    const extras = [];

    if (turn % AUDIT_EVERY === 0) {
      const prompt = [
        `Self-model:\n${this.selfSymbol}`,
        `Last ${this.recent.length} turns:\n${JSON.stringify(this.recent)}`,
      ].join('\n\n');
      const r = await callLLM({ system: AUDITOR_SYSTEM, prompt });
      const parsed = extractJson(r.text) ?? { observations: [], suspectedReflexiveEffects: [], strategyAdjustments: [] };
      this.notes.push({ t: turn, ...parsed });
      extras.push({ kind: 'audit', ctxTokens: estTokens(AUDITOR_SYSTEM) + estTokens(prompt), apiIn: r.apiInputTokens, apiOut: r.apiOutputTokens });
    }

    if (turn % COMPRESS_EVERY === 0 && this.notes.length) {
      const prompt = [
        `Current self-model:\n${this.selfSymbol}`,
        `Audit notes since last compression:\n${JSON.stringify(this.notes)}`,
      ].join('\n\n');
      const r = await callLLM({ system: COMPRESSOR_SYSTEM, prompt });
      let next = r.text.trim();
      if (estTokens(next) > SELF_SYMBOL_HARD_CAP_TOKENS) next = next.slice(0, SELF_SYMBOL_HARD_CAP_TOKENS * 4);
      if (next.length > 100) this.selfSymbol = next; // guard against degenerate rewrites
      this.notes = [];
      extras.push({ kind: 'compress', ctxTokens: estTokens(COMPRESSOR_SYSTEM) + estTokens(prompt), apiIn: r.apiInputTokens, apiOut: r.apiOutputTokens });
    }

    return { extraTelemetry: extras.length ? extras : null };
  }

  memoryArtifact() { return this.selfSymbol; }
  state() { return { selfSymbol: this.selfSymbol, notes: this.notes, recent: this.recent }; }
  restore(s) { this.selfSymbol = s.selfSymbol; this.notes = s.notes; this.recent = s.recent; }
}

export function makeArm(name) {
  if (name === 'A') return new ArmA();
  if (name === 'B') return new ArmB();
  if (name === 'LEM') return new ArmLEM();
  throw new Error(`unknown arm: ${name}`);
}
