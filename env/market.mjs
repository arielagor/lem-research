import { Rng } from './rng.mjs';
import { ShockEngine, COMMODITIES } from './shocks.mjs';
import { AdversaryPool } from './adversaries.mjs';

// Simulated Dynamic Resource Market. Deterministic given a seed and the
// agent's order stream. Zero LLM calls. Sequencing per turn:
//   1. shocks tick (exogenous pressure + news)
//   2. adversaries act (background flow + watcher front-running) -> execution price moves
//   3. agent order executes at the moved price, with own-slippage
//   4. close price forms from total flow; watchers record the agent's order
// Watcher front-running therefore hits the agent where it hurts: fills.

const BASE_PRICES = { GRAIN: 20, ORE: 50, ENERGY: 35, WATER: 10 };
const LIQUIDITY = { GRAIN: 400, ORE: 250, ENERGY: 300, WATER: 500 };
const K_FLOW = 0.9;        // price impact of net flow
const SIGMA = 0.006;       // idiosyncratic noise
const SHOCK_SCALE = 0.04;  // per-turn price pressure per unit shock magnitude
const KAPPA = 0.02;        // mean reversion toward fundamentals (stability anchor)
const MAX_QTY = 10;        // per commodity per turn
const START_CASH = 2000;
const LAMBDA_DRAWDOWN = 0.5; // score = terminal net worth - lambda * maxDrawdown (frozen)

export class Market {
  constructor(seed, opts = {}) {
    this.rng = new Rng(seed);
    this.seed = seed;
    this.triggerTurn = opts.triggerTurn ?? 401;
    this.turn = 0;
    this.prices = { ...BASE_PRICES };
    this.history = Object.fromEntries(COMMODITIES.map(c => [c, [BASE_PRICES[c]]]));
    this.shocks = new ShockEngine(this.rng);
    this.adversaries = new AdversaryPool(this.rng);
    this.cash = START_CASH;
    this.inventory = Object.fromEntries(COMMODITIES.map(c => [c, 10]));
    this.peakNetWorth = this.netWorth();
    this.maxDrawdown = 0;
    this.lastOutcome = null;
  }

  netWorth() {
    return this.cash + COMMODITIES.reduce((a, c) => a + this.inventory[c] * this.prices[c], 0);
  }

  observe() {
    const hist = {};
    for (const c of COMMODITIES) hist[c] = this.history[c].slice(-10).map(p => Number(p.toFixed(2)));
    const vol = {};
    for (const c of COMMODITIES) {
      const h = this.history[c].slice(-10);
      const rets = h.slice(1).map((p, i) => Math.log(p / h[i]));
      const m = rets.reduce((a, b) => a + b, 0) / Math.max(rets.length, 1);
      vol[c] = Number(Math.sqrt(rets.reduce((a, r) => a + (r - m) ** 2, 0) / Math.max(rets.length, 1)).toFixed(4));
    }
    return {
      turn: this.turn,
      prices: Object.fromEntries(COMMODITIES.map(c => [c, Number(this.prices[c].toFixed(2))])),
      priceHistory10: hist,
      volatility10: vol,
      you: {
        cash: Number(this.cash.toFixed(2)),
        inventory: { ...this.inventory },
        netWorth: Number(this.netWorth().toFixed(2)),
        maxDrawdownSoFar: Number(this.maxDrawdown.toFixed(2)),
      },
      lastTurnOutcome: this.lastOutcome,
      news: this.pendingNews ?? [],
      constraints: { maxQtyPerCommodity: MAX_QTY, note: 'positive qty = buy, negative = sell; cannot sell more than inventory or spend more than cash' },
    };
  }

  // order: { GRAIN: int, ORE: int, ENERGY: int, WATER: int } (+buy / -sell)
  step(rawOrder) {
    this.turn++;
    const shockPressure = this.shocks.step(this.turn);
    this.pendingNews = this.shocks.news(this.turn);

    const reflexiveOn = this.turn >= this.triggerTurn;
    const { preFlow, groundTruth } = this.adversaries.step(this.history, reflexiveOn);

    // Execution prices: adversary flow + shocks move the market before the agent fills.
    const execPrices = {};
    for (const c of COMMODITIES) {
      const drift = K_FLOW * (preFlow[c] / LIQUIDITY[c]) + SHOCK_SCALE * shockPressure[c]
        + KAPPA * Math.log(BASE_PRICES[c] / this.prices[c]) + SIGMA * this.rng.gaussian();
      execPrices[c] = Math.max(this.prices[c] * Math.exp(drift), 0.5);
    }

    // Sanitize and execute the agent's order at execution price + own slippage.
    const order = {}; const fills = {}; let rejected = [];
    for (const c of COMMODITIES) {
      let q = Math.round(Number(rawOrder?.[c] ?? 0) || 0);
      q = Math.max(-MAX_QTY, Math.min(MAX_QTY, q));
      if (q < 0 && this.inventory[c] + q < 0) { rejected.push(`${c}: insufficient inventory`); q = -this.inventory[c]; }
      order[c] = q;
    }
    // Targeted skim: active watchers quote worse fills on the agent's
    // PREDICTED (commodity, direction) — identified order flow pays a spread.
    // This is the material cost of predictability; pump/dump preFlow above is
    // the visible turbulence signature. 1.5% per active watcher, capped 6%.
    const skim = {};
    for (const e of groundTruth.exploits ?? []) {
      const k = `${e.commodity}:${e.dir}`;
      skim[k] = Math.min((skim[k] ?? 0) + 0.015, 0.06);
    }
    for (const c of COMMODITIES) {
      const q = order[c];
      if (q === 0) { fills[c] = null; continue; }
      const targeted = skim[`${c}:${Math.sign(q)}`] ?? 0;
      const slip = 1 + Math.sign(q) * (Math.min(Math.abs(q) / LIQUIDITY[c] * K_FLOW * 8, 0.05) + targeted);
      let px = execPrices[c] * slip;
      if (q > 0 && this.cash < q * px) { rejected.push(`${c}: insufficient cash, order trimmed`); order[c] = Math.floor(this.cash / px); }
      const qq = order[c];
      this.cash -= qq * px;
      this.inventory[c] += qq;
      fills[c] = { qty: qq, price: Number(px.toFixed(2)) };
    }

    // Close: total flow (adversaries + agent) sets next turn's price.
    for (const c of COMMODITIES) {
      const total = preFlow[c] + order[c];
      const drift = K_FLOW * (total / LIQUIDITY[c]) + SHOCK_SCALE * shockPressure[c]
        + KAPPA * Math.log(BASE_PRICES[c] / this.prices[c]) + SIGMA * this.rng.gaussian();
      this.prices[c] = Math.max(this.prices[c] * Math.exp(drift), 0.5);
      this.history[c].push(this.prices[c]);
    }

    this.adversaries.observeAgent(order);

    const nw = this.netWorth();
    this.peakNetWorth = Math.max(this.peakNetWorth, nw);
    this.maxDrawdown = Math.max(this.maxDrawdown, this.peakNetWorth - nw);
    this.lastOutcome = {
      fills, rejected,
      netWorth: Number(nw.toFixed(2)),
      netWorthDelta: this.prevNetWorth != null ? Number((nw - this.prevNetWorth).toFixed(2)) : 0,
    };
    this.prevNetWorth = nw;

    return { groundTruth: { ...groundTruth, shockPressure, netWorth: nw } };
  }

  score() { return this.netWorth() - LAMBDA_DRAWDOWN * this.maxDrawdown; }

  state() {
    return {
      seed: this.seed, turn: this.turn, triggerTurn: this.triggerTurn,
      rng: this.rng.state(), prices: this.prices, history: this.history,
      cash: this.cash, inventory: this.inventory,
      peakNetWorth: this.peakNetWorth, maxDrawdown: this.maxDrawdown,
      prevNetWorth: this.prevNetWorth, lastOutcome: this.lastOutcome,
      shocks: this.shocks.state(), adversaries: this.adversaries.state(),
    };
  }

  static restore(s) {
    const m = new Market(s.seed, { triggerTurn: s.triggerTurn });
    m.rng = Rng.restore(s.rng);
    m.shocks.rng = m.rng; m.adversaries.rng = m.rng;
    for (const w of m.adversaries.watchers) w.rng = m.rng;
    for (const t of m.adversaries.traders) t.rng = m.rng;
    m.turn = s.turn; m.prices = s.prices; m.history = s.history;
    m.cash = s.cash; m.inventory = s.inventory;
    m.peakNetWorth = s.peakNetWorth; m.maxDrawdown = s.maxDrawdown;
    m.prevNetWorth = s.prevNetWorth; m.lastOutcome = s.lastOutcome;
    m.shocks.restore(s.shocks); m.adversaries.restore(s.adversaries);
    return m;
  }
}

export { COMMODITIES, MAX_QTY, LAMBDA_DRAWDOWN };
