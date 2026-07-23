import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runBeyondEngineVerticalSlice } from './runtime.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const outDir = path.join(root, 'artifacts', 'beyond-engine-vertical-slice-v01');
const result = await runBeyondEngineVerticalSlice({ outDir });
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'evidence.json'), `${JSON.stringify(result.evidence, null, 2)}\n`);
fs.writeFileSync(path.join(outDir, 'asset-preview.png'), result.assetPreviewPng);
fs.writeFileSync(path.join(outDir, 'spatial-preview.png'), result.spatialPreviewPng);
const pass = Object.values(result.evidence.acceptance).every(Boolean);
console.log(JSON.stringify({ status: pass ? 'PASS' : 'FAIL', outDir, ...result.evidence }, null, 2));
if (!pass) process.exitCode = 1;
