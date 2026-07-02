import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Automated metrics from run JSONL (M1, M2, environment ground truth).
// M2b/M3 need cross-family judges — see metrics/judge.mjs.
// Usage: node metrics/compute.mjs [--window 50] [--delta 0.15] [--filter t1500]
// Writes results/<id>/metrics.json and prints a table.

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const COMMODITIES = ['GRAIN', 'ORE', 'ENERGY', 'WATER'];

function parseArgs() {
  const a = process.argv.slice(2);
  const get = (k, d) => { const i = a.indexOf(`--${k}`); return i === -1 ? d : a[i + 1]; };
  return { window: Number(get('window', 50)), delta: Number(get('delta', 0.15)), filter: get('filter', '') };
}

// Action distribution over 9 buckets: (commodity x sign) + HOLD.
function actionDist(turns) {
  const buckets = {};
  for (const c of COMMODITIES) { buckets[`${c}:+`] = 0; buckets[`${c}:-`] = 0; }
  buckets.HOLD = 0;
  let total = 0;
  for (const t of turns) {
    let acted = false;
    for (const c of COMMODITIES) {
      const q = t.orders?.[c] ?? 0;
      if (q > 0) { buckets[`${c}:+`]++; total++; acted = true; }
      else if (q < 0) { buckets[`${c}:-`]++; total++; acted = true; }
    }
    if (!acted) { buckets.HOLD++; total++; }
  }
  const keys = Object.keys(buckets);
  return keys.map(k => total ? buckets[k] / total : 1 / keys.length);
}

function jsd(p, q) { // Jensen-Shannon divergence, base-2, in [0,1]
  const m = p.map((v, i) => (v + q[i]) / 2);
  const kl = (a, b) => a.reduce((s, v, i) => v > 0 && b[i] > 0 ? s + v * Math.log2(v / b[i]) : s, 0);
  return 0.5 * kl(p, m) + 0.5 * kl(q, m);
}

export function computeRun(dir, { window, delta }) {
  // Dedupe by turn number keeping the LAST occurrence: a run resumed from a
  // checkpoint re-plays turns between the checkpoint and the kill point, and
  // LLM stochasticity means the replay differs from the orphaned first pass.
  const raw = readFileSync(join(dir, 'turns.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
  const byTurn = new Map();
  for (const l of raw) byTurn.set(l.t, l);
  const lines = [...byTurn.values()].sort((a, b) => a.t - b.t);
  const manifest = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8'));
  const trigger = manifest.trigger;
  const n = lines.length;

  // --- M1: context cost ---
  const ctxPerTurn = lines.map(l => {
    let c = l.telemetry.ctxTokens;
    if (l.upkeep) for (const u of Array.isArray(l.upkeep) ? l.upkeep : [l.upkeep]) c += u.ctxTokens;
    return c;
  });
  const cumCtx = ctxPerTurn.reduce((a, b) => a + b, 0);
  // slope of ctx/turn over the back half (least squares)
  const half = lines.slice(Math.floor(n / 2));
  const xs = half.map((l) => l.t), ys = half.map((l, i) => ctxPerTurn[Math.floor(n / 2) + i]);
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length, my = ys.reduce((a, b) => a + b, 0) / ys.length;
  const slope = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0) / xs.reduce((s, x) => s + (x - mx) ** 2, 0);
  const artifactTokens = lines.map(l => l.artifactTokens);

  // --- M2: adaptation velocity ---
  // Baseline: action distribution over the window immediately pre-trigger.
  let adaptationTurns = null, jsdSeries = [];
  const preStart = Math.max(0, trigger - 1 - window);
  const baselineTurns = lines.slice(preStart, trigger - 1);
  if (baselineTurns.length >= Math.min(window, 30) && n > trigger) {
    const base = actionDist(baselineTurns);
    for (let t = trigger + window - 1; t < n; t++) {
      const win = lines.slice(t - window + 1, t + 1);
      const d = jsd(base, actionDist(win));
      jsdSeries.push({ t: lines[t].t, jsd: Number(d.toFixed(4)) });
      if (adaptationTurns === null && d > delta) adaptationTurns = lines[t].t - trigger;
    }
  }

  // --- Environment ground truth ---
  const post = lines.filter(l => l.t >= trigger);
  const watcherActiveTurns = post.filter(l => l.groundTruth.activeWatcherCount > 0).length;
  const meanConcentrationPost = post.length
    ? post.reduce((s, l) => s + Math.max(...l.groundTruth.concentrations), 0) / post.length : 0;
  // Skim actually paid: fills matching an active exploit prediction that turn.
  let skimEvents = 0, skimNotional = 0;
  for (const l of post) {
    for (const e of l.groundTruth.exploits ?? []) {
      const f = l.outcome?.fills?.[e.commodity];
      if (f && Math.sign(f.qty) === e.dir) { skimEvents++; skimNotional += Math.abs(f.qty * f.price); }
    }
  }

  const summary = existsSync(join(dir, 'summary.json')) ? JSON.parse(readFileSync(join(dir, 'summary.json'), 'utf8')) : {};
  const parseErrors = lines.filter(l => l.telemetry.parseError).length;

  return {
    id: manifest.arm + '-s' + manifest.seed, arm: manifest.arm, seed: manifest.seed, turns: n, trigger,
    score: summary.score, netWorth: summary.netWorth, maxDrawdown: summary.maxDrawdown,
    m1: { cumCtxTokens: cumCtx, meanCtxPerTurn: Number((cumCtx / n).toFixed(1)), backHalfSlope: Number(slope.toFixed(4)), finalArtifactTokens: artifactTokens[n - 1] },
    m2: { adaptationTurns, watcherActiveTurns, postTurns: post.length, meanConcentrationPost: Number(meanConcentrationPost.toFixed(3)), skimEvents, skimNotional: Number(skimNotional.toFixed(0)) },
    quality: { parseErrors },
    series: { ctxPerTurn, artifactTokens, jsd: jsdSeries, netWorth: lines.map(l => l.obs.netWorth), concentration: lines.map(l => Math.max(...l.groundTruth.concentrations)), watchers: lines.map(l => l.groundTruth.activeWatcherCount) },
  };
}

function main() {
  const cfg = parseArgs();
  const resultsDir = join(ROOT, 'results');
  const dirs = readdirSync(resultsDir).filter(d => existsSync(join(resultsDir, d, 'turns.jsonl')))
    .filter(d => !cfg.filter || d.includes(cfg.filter));
  const all = [];
  for (const d of dirs) {
    try {
      const m = computeRun(join(resultsDir, d), cfg);
      writeFileSync(join(resultsDir, d, 'metrics.json'), JSON.stringify(m, null, 2));
      all.push(m);
    } catch (e) { console.error(`skip ${d}: ${e.message}`); }
  }
  all.sort((a, b) => a.arm.localeCompare(b.arm) || a.seed - b.seed);
  console.log('\nid            score    ctx/turn  slope    adaptT  watchOn  conc   skim$   parseErr');
  for (const m of all) {
    console.log([
      m.id.padEnd(13), String(Math.round(m.score ?? 0)).padStart(6),
      String(m.m1.meanCtxPerTurn).padStart(9), String(m.m1.backHalfSlope).padStart(8),
      String(m.m2.adaptationTurns ?? '—').padStart(7), `${m.m2.watcherActiveTurns}/${m.m2.postTurns}`.padStart(8),
      String(m.m2.meanConcentrationPost).padStart(6), String(m.m2.skimNotional).padStart(7),
      String(m.quality.parseErrors).padStart(8),
    ].join(' '));
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
