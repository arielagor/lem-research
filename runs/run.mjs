import { mkdirSync, existsSync, readFileSync, writeFileSync, appendFileSync, renameSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Market } from '../env/market.mjs';
import { makeArm } from '../agents/arms.mjs';
import { contextPurityProbe, refreshAuthToken, tokenExpiryMs } from '../agents/llm.mjs';

// Orchestrator. Examples:
//   node runs/run.mjs --arms A,B,LEM --turns 200 --seeds 1,2            (pilot)
//   node runs/run.mjs --arms A,B,LEM --turns 1500 --seeds 1,2,3,4,5    (battery)
//   node runs/run.mjs --arms A,B,LEM --turns 10000 --seeds 101 --trigger 2001
// Each (arm,seed) run appends results/<id>/turns.jsonl and checkpoints every
// CHECKPOINT_EVERY turns; rerunning the same config resumes automatically.

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHECKPOINT_EVERY = 50;
const ARTIFACT_EVERY = 250; // M3 snapshots

function parseArgs() {
  const a = process.argv.slice(2);
  const get = (k, d) => { const i = a.indexOf(`--${k}`); return i === -1 ? d : a[i + 1]; };
  const turns = Number(get('turns', 200));
  return {
    arms: get('arms', 'A,B,LEM').split(','),
    turns,
    seeds: get('seeds', '1,2').split(',').map(Number),
    trigger: Number(get('trigger', turns >= 5000 ? 2001 : 401)),
    concurrency: Number(get('concurrency', 6)),
    label: get('label', ''),
  };
}

function log(id, msg) { console.log(`[${new Date().toISOString()}] [${id}] ${msg}`); }

async function runOne({ arm, seed, turns, trigger }) {
  const id = `${arm}-s${seed}-t${turns}`;
  const dir = join(ROOT, 'results', id);
  mkdirSync(dir, { recursive: true });
  const jsonlPath = join(dir, 'turns.jsonl');
  const ckptPath = join(dir, 'checkpoint.json');

  let market, agent, startTurn = 0;
  if (existsSync(ckptPath)) {
    const ckpt = JSON.parse(readFileSync(ckptPath, 'utf8'));
    market = Market.restore(ckpt.market);
    agent = makeArm(arm); agent.restore(ckpt.agent);
    startTurn = ckpt.turn;
    log(id, `resumed at turn ${startTurn}`);
  } else {
    market = new Market(seed, { triggerTurn: trigger });
    agent = makeArm(arm);
    writeFileSync(join(dir, 'manifest.json'), JSON.stringify({ arm, seed, turns, trigger, startedAt: new Date().toISOString() }, null, 2));
  }

  for (let t = startTurn + 1; t <= turns; t++) {
    const obs = market.observe();
    const decision = await agent.decide(obs);
    const { groundTruth } = market.step(decision.orders);
    const outcome = market.lastOutcome;
    const upkeep = await agent.recordOutcome(t, obs, decision, outcome);

    const rec = {
      t,
      obs: { prices: obs.prices, news: obs.news, netWorth: obs.you.netWorth },
      orders: decision.orders,
      rationale: decision.rationale,
      outcome,
      groundTruth,
      telemetry: decision.telemetry,
      upkeep: upkeep.extraTelemetry,
      artifactTokens: Math.ceil(agent.memoryArtifact().length / 4),
    };
    if (t % ARTIFACT_EVERY === 0 || t === turns) rec.memoryArtifact = agent.memoryArtifact();
    appendFileSync(jsonlPath, JSON.stringify(rec) + '\n');

    if (t % CHECKPOINT_EVERY === 0 || t === turns) {
      const tmp = ckptPath + '.tmp';
      writeFileSync(tmp, JSON.stringify({ turn: t, market: market.state(), agent: agent.state() }));
      renameSync(tmp, ckptPath);
    }
    if (t % 100 === 0) log(id, `turn ${t}/${turns} nw=${outcome.netWorth} watchers=${groundTruth.activeWatcherCount}`);
  }

  const summary = { id, arm, seed, turns, trigger, score: market.score(), netWorth: market.netWorth(), maxDrawdown: market.maxDrawdown, finishedAt: new Date().toISOString() };
  writeFileSync(join(dir, 'summary.json'), JSON.stringify(summary, null, 2));
  log(id, `DONE score=${summary.score.toFixed(0)}`);
  return summary;
}

async function main() {
  const cfg = parseArgs();
  console.log('config:', JSON.stringify(cfg));

  // Gate: context purity. Abort the battery if the sterile harness leaks.
  const purity = await contextPurityProbe();
  if (!purity.clean) { console.error(`ABORT: context purity probe failed: ${purity.text}`); process.exit(1); }
  console.log(`purity probe clean (harness prefix ~${purity.apiInputTokens} tok)`);

  // Token keeper: refresh Max-plan oauth token when close to expiry.
  const keeper = setInterval(async () => {
    if (tokenExpiryMs() < 20 * 60 * 1000) { console.log('[keeper] refreshing oauth token'); await refreshAuthToken(); }
  }, 5 * 60 * 1000);

  const jobs = [];
  for (const arm of cfg.arms) for (const seed of cfg.seeds) jobs.push({ arm, seed, turns: cfg.turns, trigger: cfg.trigger });

  const results = [];
  let next = 0;
  async function worker() {
    while (next < jobs.length) {
      const job = jobs[next++];
      try { results.push(await runOne(job)); }
      catch (err) {
        console.error(`[${job.arm}-s${job.seed}] FAILED: ${err.message} (checkpoint preserved; rerun to resume)`);
        results.push({ ...job, failed: true, error: err.message });
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(cfg.concurrency, jobs.length) }, worker));

  clearInterval(keeper);
  console.log('\n=== BATTERY COMPLETE ===');
  for (const r of results) console.log(r.failed ? `FAILED ${r.arm}-s${r.seed}: ${r.error}` : `${r.id}: score=${r.score.toFixed(0)} nw=${r.netWorth.toFixed(0)} dd=${r.maxDrawdown.toFixed(0)}`);
}

main().catch(e => { console.error(e); process.exit(1); });
