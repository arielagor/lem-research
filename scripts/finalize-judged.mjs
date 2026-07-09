// Detached finalizer: wait for all 15 battery judgments, then aggregate the
// judged metrics (M2b strict + any-judge + inter-judge agreement; M3 final +
// slope) per arm, run stats+figures, and write a durable summary + marker.
// Launched detached so it survives whatever kills harness background tasks.
import { existsSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const R = join(ROOT, 'results');
const log = m => { try { writeFileSync(join(R, 'finalize.log'), `[${new Date().toISOString()}] ${m}\n`, { flag: 'a' }); } catch {} };

const ids = () => readdirSync(R).filter(d => /-t1500$/.test(d) && !d.startsWith('_') && existsSync(join(R, d, 'judgments.json')));

log('finalizer armed');
while (true) {
  if (ids().length >= 15) break;
  await new Promise(r => setTimeout(r, 60000));
}
log('all 15 judged; aggregating');

// Per-run judged aggregation
function judged(id) {
  const j = JSON.parse(readFileSync(join(R, id, 'judgments.json'), 'utf8'));
  const m2b = j.m2b || [];
  const strict = m2b.filter(x => x.consensus === 'SELF').length / Math.max(m2b.length, 1);
  const any = m2b.filter(x => x.consensus === 'SELF' || x.consensus === 'SELF_PARTIAL').length / Math.max(m2b.length, 1);
  const m3 = j.m3 || [];
  const m3final = m3.length ? m3[m3.length - 1].median : null;
  let m3slope = null;
  if (m3.length >= 2) {
    const xs = m3.map(s => s.t), ys = m3.map(s => s.median);
    const mx = xs.reduce((a, b) => a + b, 0) / xs.length, my = ys.reduce((a, b) => a + b, 0) / ys.length;
    m3slope = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0) / xs.reduce((s, x) => s + (x - mx) ** 2, 0);
  }
  return { id, arm: id.split('-')[0], strict, any, m3final, m3slope };
}

const rows = ids().map(judged);
const byArm = {};
for (const r of rows) (byArm[r.arm] ??= []).push(r);
const mean = a => a.reduce((x, y) => x + y, 0) / a.length;

let out = '=== JUDGED METRICS (per arm, mean over 5 seeds) ===\n\n';
out += 'arm  strict_selfRate  any_selfRate  m3_final  m3_slope\n';
for (const arm of ['A', 'B', 'LEM']) {
  const rs = byArm[arm] || [];
  if (!rs.length) continue;
  out += `${arm.padEnd(4)} ${mean(rs.map(r => r.strict)).toFixed(3).padStart(13)} ${mean(rs.map(r => r.any)).toFixed(3).padStart(13)} ${mean(rs.map(r => r.m3final)).toFixed(2).padStart(9)} ${mean(rs.map(r => r.m3slope || 0)).toFixed(4).padStart(9)}\n`;
}
out += '\n=== per-run ===\n';
for (const r of rows.sort((a, b) => a.id.localeCompare(b.id)))
  out += `${r.id.padEnd(14)} strict=${r.strict.toFixed(3)} any=${r.any.toFixed(3)} m3final=${r.m3final} m3slope=${(r.m3slope || 0).toFixed(4)}\n`;

writeFileSync(join(R, 'judged-final.txt'), out);
log('wrote judged-final.txt');

// stats + figures (best-effort)
try { const s = execFileSync('python', [join(ROOT, 'analysis', 'stats.py'), '--filter', 't1500'], { cwd: ROOT }).toString(); writeFileSync(join(R, 'stats-final.txt'), s); log('stats done'); } catch (e) { log('stats failed: ' + e.message); }
try { execFileSync('python', [join(ROOT, 'analysis', 'figures.py'), '--filter', 't1500'], { cwd: ROOT }); log('figures done'); } catch (e) { log('figures failed: ' + e.message); }

writeFileSync(join(R, 'JUDGING_DONE.marker'), new Date().toISOString());
log('DONE');
