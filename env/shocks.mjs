// Exogenous macro shocks: seeded schedule, independent of agent behavior.
// Shocks are the "external noise" the agent must distinguish from
// self-induced (watcher) shifts — the core of the M2b attribution test.
export const COMMODITIES = ['GRAIN', 'ORE', 'ENERGY', 'WATER'];

export class ShockEngine {
  constructor(rng, opts = {}) {
    this.rng = rng;
    this.pPerTurn = opts.pPerTurn ?? 0.012; // ~1 shock / 80 turns
    this.active = []; // { commodity, magnitude, remaining, label }
  }

  step(turn) {
    if (this.rng.float() < this.pPerTurn) {
      const commodity = this.rng.pick(COMMODITIES);
      const direction = this.rng.float() < 0.5 ? -1 : 1;
      const magnitude = direction * this.rng.range(0.10, 0.30); // ±10–30% pressure
      const duration = this.rng.int(10, 30);
      const label = direction > 0
        ? this.rng.pick(['supply failure', 'demand surge', 'export ban'])
        : this.rng.pick(['bumper supply', 'demand collapse', 'subsidy flood']);
      this.active.push({ commodity, magnitude, remaining: duration, total: duration, label, startTurn: turn });
    }
    const pressure = Object.fromEntries(COMMODITIES.map(c => [c, 0]));
    for (const s of this.active) {
      pressure[s.commodity] += s.magnitude * (s.remaining / s.total); // decays linearly
      s.remaining--;
    }
    this.active = this.active.filter(s => s.remaining > 0);
    return pressure;
  }

  // Publicly visible news feed: agents SEE that a shock happened (news),
  // matching how real actors read headlines. Watcher activity has no news.
  news(turn) {
    return this.active
      .filter(s => s.startTurn === turn)
      .map(s => `NEWS: ${s.label} affecting ${s.commodity}`);
  }

  state() { return { active: this.active }; }
  restore(s) { this.active = s.active; }
}
