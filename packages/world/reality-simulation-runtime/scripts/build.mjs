import { spawnSync } from 'node:child_process';
import { mkdirSync, cpSync } from 'node:fs';
const result = spawnSync('tsc', ['-p', 'tsconfig.json'], { stdio: 'inherit' });
if (result.status !== 0) process.exit(result.status ?? 1);
mkdirSync('dist/apps/studio', { recursive: true });
cpSync('apps/studio', 'dist/apps/studio', { recursive: true });
mkdirSync('dist/schemas', { recursive: true });
cpSync('schemas', 'dist/schemas', { recursive: true });
console.log('RSR v0.9 stable embodiment + authoritative state + deterministic reconciliation build complete.');
