import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
const roots = ['packages', 'tests', 'benchmarks', 'apps/studio', 'apps/webgpu-v03', 'apps/spatial-v04'];
const banned = [
  ['Math.random(', 'Use deterministicRandom() instead of Math.random().'],
  ['eval(', 'Bare eval is forbidden.'],
  ['new Function(', 'Dynamic Function construction is forbidden.']
];
const failures = [];
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name); const s = statSync(path);
    if (s.isDirectory()) walk(path);
    else if (/\.(ts|js|mjs|html)$/.test(name)) {
      const text = readFileSync(path, 'utf8');
      for (const [needle, message] of banned) if (text.includes(needle)) failures.push(`${path}: ${message}`);
    }
  }
}
for (const root of roots) walk(root);
if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log('Lint checks passed.');
