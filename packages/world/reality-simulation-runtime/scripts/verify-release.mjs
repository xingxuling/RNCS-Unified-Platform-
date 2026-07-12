import { spawnSync } from 'node:child_process';
import { performance } from 'node:perf_hooks';

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const stages = [
  ['typecheck', ['run', 'typecheck']],
  ['lint', ['run', 'lint']],
  ['tests-164', ['test']],
  ['verify-v01', ['run', 'verify:simulation']],
  ['verify-v02', ['run', 'verify:constraint-physics']],
  ['verify-v03', ['run', 'verify:embodied-dynamics']],
  ['verify-v04', ['run', 'verify:experience-fabric']],
  ['verify-v05', ['run', 'verify:spatial-embodiment']],
  ['benchmark-v05', ['run', 'benchmark:spatial-embodiment']],
  ['release-audit', ['run', 'audit:release']]
];
const started = performance.now();
for (const [name, args] of stages) {
  const t0 = performance.now();
  const result = spawnSync(npm, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, env: process.env });
  const ms = performance.now() - t0;
  if (result.status !== 0) {
    console.error(`FAIL ${name} (${ms.toFixed(1)}ms)`);
    if (result.stdout) console.error(result.stdout);
    if (result.stderr) console.error(result.stderr);
    process.exit(result.status ?? 1);
  }
  console.log(`PASS ${name} (${ms.toFixed(1)}ms)`);
}
console.log(`RSR v0.6 release gate PASS (${(performance.now() - started).toFixed(1)}ms)`);
