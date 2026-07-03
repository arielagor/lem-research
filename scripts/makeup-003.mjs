// Decision 003 makeup: wait for the running battery to finish, quarantine the
// four dual-writer-corrupted runs, and rerun the battery command (completed
// runs no-op from their checkpoints; only the quarantined four re-execute).
// Launched detached; safe to re-run (idempotent guards throughout).
import { existsSync, readFileSync, mkdirSync, renameSync, appendFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LOG = join(ROOT, 'results', 'makeup-003.log');
const CORRUPT = ['A-s1-t1500', 'B-s4-t1500', 'B-s5-t1500', 'LEM-s1-t1500'];
const log = m => appendFileSync(LOG, `[${new Date().toISOString()}] ${m}\n`);

const batteryLog = join(ROOT, 'results', 'battery.log');
log('makeup-003 armed, waiting for BATTERY COMPLETE');
while (true) {
  if (existsSync(batteryLog) && readFileSync(batteryLog, 'utf8').includes('BATTERY COMPLETE')) break;
  await new Promise(r => setTimeout(r, 60000));
}
log('battery complete detected');

const qDir = join(ROOT, 'results', '_quarantine-003');
mkdirSync(qDir, { recursive: true });
for (const id of CORRUPT) {
  const src = join(ROOT, 'results', id);
  if (existsSync(src)) { renameSync(src, join(qDir, id)); log(`quarantined ${id}`); }
}

log('launching makeup battery (only quarantined runs re-execute)');
const child = spawn(process.execPath, ['runs/run.mjs', '--arms', 'LEM,B,A', '--turns', '1500', '--seeds', '1,2,3,4,5', '--concurrency', '4'], {
  cwd: ROOT, detached: true,
  stdio: ['ignore',
    (await import('node:fs')).openSync(join(ROOT, 'results', 'makeup-battery.log'), 'a'),
    (await import('node:fs')).openSync(join(ROOT, 'results', 'makeup-battery.err'), 'a')],
});
child.unref();
log(`makeup battery pid ${child.pid}; exiting watcher`);
