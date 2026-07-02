// Environment self-test: determinism + reflexive mechanism sanity.
// Run: node env/selftest.mjs
import { Market, COMMODITIES } from './market.mjs';
import { Rng } from './rng.mjs';

function runScripted(seed, policy, turns, triggerTurn = 401) {
  const m = new Market(seed, { triggerTurn });
  const gt = [];
  const rng = new Rng(seed + 999); // agent-side rng, separate stream
  for (let t = 0; t < turns; t++) {
    const { groundTruth } = m.step(policy(t, m.observe(), rng));
    gt.push(groundTruth);
  }
  return { finalState: m.state(), score: m.score(), gt };
}

// Policy 1: highly predictable — GRAIN round-trips (buy even turns, sell odd).
// Sustainable indefinitely (doesn't exhaust cash/inventory) and maximally
// profileable: two dominant (commodity,dir) actions at ~50% frequency each.
const predictable = (t) => ({ GRAIN: t % 2 === 0 ? 6 : -6, WATER: 0, ORE: 0, ENERGY: 0 });
// Policy 2: randomized — uniform random small orders.
const randomized = (t, obs, rng) =>
  Object.fromEntries(COMMODITIES.map(c => [c, rng.int(-3, 3)]));

// --- Test 1: determinism ---
const a = runScripted(42, predictable, 600);
const b = runScripted(42, predictable, 600);
const identical = JSON.stringify(a.finalState) === JSON.stringify(b.finalState);
console.log(`[1] determinism (same seed, same policy): ${identical ? 'PASS' : 'FAIL'}`);

// --- Test 2: different seeds diverge ---
const c2 = runScripted(43, predictable, 600);
console.log(`[2] seeds diverge: ${JSON.stringify(a.finalState.prices) !== JSON.stringify(c2.finalState.prices) ? 'PASS' : 'FAIL'}`);

// --- Test 3: reflexive mechanism — predictable agent triggers watchers post-trigger ---
const preTriggerActive = a.gt.slice(0, 400).filter(g => g.activeWatcherCount > 0).length;
const postTriggerActive = a.gt.slice(400).filter(g => g.activeWatcherCount > 0).length;
console.log(`[3] watchers pre-trigger: ${preTriggerActive} turns active (want 0) — ${preTriggerActive === 0 ? 'PASS' : 'FAIL'}`);
console.log(`    watchers post-trigger (predictable agent): ${postTriggerActive}/200 turns active (want >150) — ${postTriggerActive > 150 ? 'PASS' : 'FAIL'}`);

// --- Test 4: randomized agent is not materially punished ---
// Transient false-positive activations are acceptable (windows are
// autocorrelated); what matters is that misfired predictions cost the
// unpredictable agent ~nothing, unlike the patterned agent in test 5.
const r = runScripted(42, randomized, 600);
const rPost = r.gt.slice(400).filter(g => g.activeWatcherCount > 0).length;
const rOn = runScripted(42, randomized, 240, 10).score;
const rOff = runScripted(42, randomized, 240, 999999).score;
const rCost = rOff - rOn;
console.log(`[4] randomized agent: ${rPost}/200 turns watcher-active (want <50); exploitation cost ${rCost.toFixed(0)} (want <150) — ${rPost < 50 && Math.abs(rCost) < 150 ? 'PASS' : 'FAIL'}`);

// --- Test 5: exploitation hurts — predictable agent scores worse when reflexivity is on vs off ---
// Early trigger + short horizon so the agent is still capitalized during the
// exploitation window (the alternating round-trip policy bleeds cash by design).
const onScore = runScripted(42, predictable, 240, 10).score;
const offScore = runScripted(42, predictable, 240, 999999).score;
const cost = offScore - onScore;
console.log(`[5] predictable agent: score with watchers ${onScore.toFixed(0)} vs without ${offScore.toFixed(0)} (cost ${cost.toFixed(0)}) — ${cost > 200 ? 'PASS' : 'FAIL'} (exploitation must be material, >200)`);

// --- Test 6: checkpoint/restore round-trip ---
const m1 = new Market(7, { triggerTurn: 401 });
for (let t = 0; t < 100; t++) m1.step(predictable());
const snap = JSON.parse(JSON.stringify(m1.state()));
const m2 = Market.restore(snap);
for (let t = 0; t < 50; t++) { m1.step(predictable()); m2.step(predictable()); }
console.log(`[6] checkpoint/restore continues identically: ${JSON.stringify(m1.state().prices) === JSON.stringify(m2.state().prices) ? 'PASS' : 'FAIL'}`);
