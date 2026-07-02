// Deterministic seeded PRNG (mulberry32). All environment randomness flows
// through one instance per run so runs are exactly reproducible from a seed.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Rng {
  constructor(seed) { this.seed = seed; this.next = mulberry32(seed); this.calls = 0; }
  float() { this.calls++; return this.next(); }
  range(lo, hi) { return lo + this.float() * (hi - lo); }
  int(lo, hi) { return Math.floor(this.range(lo, hi + 1)); }
  pick(arr) { return arr[this.int(0, arr.length - 1)]; }
  gaussian() { // Box-Muller
    const u = Math.max(this.float(), 1e-12), v = this.float();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  state() { return { seed: this.seed, calls: this.calls }; }
  static restore(s) { const r = new Rng(s.seed); for (let i = 0; i < s.calls; i++) r.next(); r.calls = s.calls; return r; }
}
