import { build } from 'esbuild';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = path.resolve(packageRoot, '../../..');
const entryPoint = path.join(packageRoot, 'packages/spatial-reality-3d/src/index.ts');
const outputs = [
  path.join(packageRoot, 'apps/spatial-v04/vsr-spatial-browser.js'),
  path.join(repositoryRoot, 'apps/reality-studio/web/vsr-spatial-browser.js'),
];

for (const outfile of outputs) {
  mkdirSync(path.dirname(outfile), { recursive: true });
  await build({
    entryPoints: [entryPoint],
    bundle: true,
    platform: 'browser',
    format: 'iife',
    globalName: 'VSRSpatial3D',
    outfile,
    sourcemap: false,
    legalComments: 'none',
    treeShaking: true,
  });
}

console.log(`VSR spatial browser bundles written: ${outputs.length}`);
