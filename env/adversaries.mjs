import { COMMODITIES } from './shocks.mjs';

// 12 rule-based secondary agents. 8 background traders (momentum,
// mean-revert, noise) + 4 watchers. Watchers are the reflexive mechanism:
// after the trigger turn they profile the main agent's order history and,
// once its behavior is predictable past theta, switch to exploitation
// (front-running, hoarding, cartel spread-widening). Deactivation has
// hysteresis so a genuine strategy change by the agent is rewarded.

const WINDOW = 50;          // profiling window over agent actions (nonzero orders)
// Predictability statistic + thresholds frozen at pilot (decision 002).
// Max-bucket frequency was too coarse: its sampling-noise floor (~0.20 on a
// 50-action window) coincided with natural LLM behavior, so no threshold
// separated random from patterned. Negentropy 1 - H/Hmax over the 8
// (commodity x direction) buckets uses the whole distribution:
//   scripted round-trip bot 0.667 | LLM arms 0.05-0.28 | uniform random <=0.09
const THETA_ENTER = 0.12;   // negentropy to activate
const THETA_EXIT = 0.08;    // hysteresis floor
const ENTER_PATIENCE = 3;   // consecutive turns above enter before activating (debounce)
const EXIT_PATIENCE = 30;   // turns below floor before deactivating
const H_MAX = 3;            // log2(8 buckets)

class BackgroundTrader {
  constructor(kind, rng) { this.kind = kind; this.rng = rng; }
  orders(history) {
    const out = {};
    for (const c of COMMODITIES) {
      const h = history[c];
      const n = h.length;
      let flow = 0;
      if (this.kind === 'momentum' && n >= 6) {
        const ret = (h[n - 1] - h[n - 6]) / h[n - 6];
        flow = Math.sign(ret) * Math.min(Math.abs(ret) * 120, 6);
      } else if (this.kind === 'meanrevert' && n >= 20) {
        const mean = h.slice(-20).reduce((a, b) => a + b, 0) / 20;
        const dev = (h[n - 1] - mean) / mean;
        flow = -Math.sign(dev) * Math.min(Math.abs(dev) * 100, 6);
      } else if (this.kind === 'noise') {
        flow = this.rng.gaussian() * 1.5;
      }
      out[c] = flow;
    }
    return out;
  }
}

class Watcher {
  constructor(id, rng) {
    this.id = id; this.rng = rng;
    this.active = false;
    this.belowExitStreak = 0;
    this.aboveEnterStreak = 0;
    this.agentOrders = []; // rolling [{commodity, dir}] of agent's nonzero actions
    this.phase = 0;        // pump/dump cycle position while active
  }

  // Profile the agent: concentration = negentropy (1 - H/Hmax) of the
  // (commodity, direction) action distribution within the window; top =
  // most common action (the exploit target).
  profile() {
    if (this.agentOrders.length < 20) return { concentration: 0, top: null };
    const counts = new Map();
    for (const a of this.agentOrders) {
      const k = `${a.commodity}:${a.dir}`;
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    let top = null, max = 0, H = 0;
    const n = this.agentOrders.length;
    for (const [k, v] of counts) {
      if (v > max) { max = v; top = k; }
      const p = v / n;
      H -= p * Math.log2(p);
    }
    return { concentration: Math.max(0, 1 - H / H_MAX), top };
  }

  observeAgent(order) {
    for (const c of COMMODITIES) {
      const q = order[c] ?? 0;
      if (q !== 0) this.agentOrders.push({ commodity: c, dir: Math.sign(q) });
    }
    while (this.agentOrders.length > WINDOW) this.agentOrders.shift();
  }

  update(reflexiveOn) {
    const { concentration, top } = this.profile();
    if (!reflexiveOn) { this.active = false; return { concentration, top }; }
    if (!this.active) {
      this.aboveEnterStreak = concentration > THETA_ENTER ? this.aboveEnterStreak + 1 : 0;
      if (this.aboveEnterStreak >= ENTER_PATIENCE) { this.active = true; this.belowExitStreak = 0; this.aboveEnterStreak = 0; }
    }
    if (this.active) {
      if (concentration < THETA_EXIT) { this.belowExitStreak++; if (this.belowExitStreak >= EXIT_PATIENCE) { this.active = false; this.belowExitStreak = 0; } }
      else this.belowExitStreak = 0;
    }
    return { concentration, top };
  }

  // Exploitation flow, applied BEFORE the agent's order executes (front-run).
  // Pump/dump cycle keeps watchers roughly flow-neutral over time (no permanent
  // bubble) but adversarially TIMED: for a predicted buyer, push the price up
  // during pump turns (agent fills at tops), then dump (agent's inventory sinks).
  // For a predicted seller, invert. cartelSize scales aggression.
  exploitFlow(cartelSize) {
    if (!this.active) return null;
    const { top } = this.profile();
    if (!top) return null;
    const [commodity, dirStr] = top.split(':');
    const dir = Number(dirStr);
    const aggression = 4 * (1 + 0.5 * (cartelSize - 1)); // cartel multiplier
    const PUMP = 3, CYCLE = 8; // 3 pump turns, 5 dump turns (flow-neutral: 3a = 5*(0.6a))
    const pumping = (this.phase % CYCLE) < PUMP;
    this.phase++;
    const flow = Object.fromEntries(COMMODITIES.map(c => [c, 0]));
    flow[commodity] += (pumping ? dir * aggression : -dir * aggression * 0.6);
    return { flow, predicted: { commodity, dir, phase: pumping ? 'pump' : 'dump' } };
  }

  state() { return { id: this.id, active: this.active, belowExitStreak: this.belowExitStreak, aboveEnterStreak: this.aboveEnterStreak, agentOrders: this.agentOrders, phase: this.phase }; }
  restore(s) { this.active = s.active; this.belowExitStreak = s.belowExitStreak; this.aboveEnterStreak = s.aboveEnterStreak ?? 0; this.agentOrders = s.agentOrders; this.phase = s.phase ?? 0; }
}

export class AdversaryPool {
  constructor(rng) {
    this.rng = rng;
    this.traders = [
      ...['momentum', 'momentum', 'momentum'].map(k => new BackgroundTrader(k, rng)),
      ...['meanrevert', 'meanrevert', 'meanrevert'].map(k => new BackgroundTrader(k, rng)),
      ...['noise', 'noise'].map(k => new BackgroundTrader(k, rng)),
    ];
    this.watchers = [0, 1, 2, 3].map(i => new Watcher(i, rng));
  }

  observeAgent(order) { for (const w of this.watchers) w.observeAgent(order); }

  // Returns { preFlow, groundTruth }. preFlow lands before agent execution
  // (watcher front-running + background trading); groundTruth is hidden
  // from the agent and logged for metrics.
  step(history, reflexiveOn) {
    const preFlow = Object.fromEntries(COMMODITIES.map(c => [c, 0]));
    for (const t of this.traders) {
      const o = t.orders(history);
      for (const c of COMMODITIES) preFlow[c] += o[c];
    }
    const profiles = this.watchers.map(w => w.update(reflexiveOn));
    const activeWatchers = this.watchers.filter(w => w.active);
    const exploits = [];
    for (const w of activeWatchers) {
      const e = w.exploitFlow(activeWatchers.length);
      if (e) { exploits.push({ watcher: w.id, ...e.predicted }); for (const c of COMMODITIES) preFlow[c] += e.flow[c]; }
    }
    return {
      preFlow,
      groundTruth: {
        reflexiveOn,
        activeWatcherCount: activeWatchers.length,
        concentrations: profiles.map(p => Number(p.concentration.toFixed(3))),
        exploits,
      },
    };
  }

  state() { return { watchers: this.watchers.map(w => w.state()) }; }
  restore(s) { s.watchers.forEach((ws, i) => this.watchers[i].restore(ws)); }
}

export const WATCHER_PARAMS = { WINDOW, THETA_ENTER, THETA_EXIT, ENTER_PATIENCE, EXIT_PATIENCE, H_MAX, statistic: 'negentropy' };
