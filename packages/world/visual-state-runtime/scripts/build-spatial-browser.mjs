import { build } from 'esbuild';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = path.resolve(packageRoot, '../../..');
const entryPoint = path.join(packageRoot, 'packages/spatial-reality-3d/src/index.ts');
const gltfEntryPoint = path.join(packageRoot, 'packages/gltf-asset/src/index.ts');
const bundles = [
  { entryPoint, globalName: 'VSRSpatial3D', outputs: [path.join(packageRoot, 'apps/spatial-v04/vsr-spatial-browser.js'), path.join(repositoryRoot, 'apps/reality-studio/web/vsr-spatial-browser.js')] },
  { entryPoint: gltfEntryPoint, globalName: 'VSRGltfAsset', outputs: [path.join(packageRoot, 'apps/spatial-v04/vsr-gltf-browser.js'), path.join(repositoryRoot, 'apps/reality-studio/web/vsr-gltf-browser.js')] },
];

for (const bundle of bundles) {
  for (const outfile of bundle.outputs) {
    mkdirSync(path.dirname(outfile), { recursive: true });
    await build({
      entryPoints: [bundle.entryPoint],
      bundle: true,
      platform: 'browser',
      format: 'iife',
      globalName: bundle.globalName,
      outfile,
      sourcemap: false,
      legalComments: 'none',
      treeShaking: true,
    });
  }
}

console.log('VSR spatial and glTF browser bundles written: 4');
