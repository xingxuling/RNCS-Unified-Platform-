#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { generateWorldBodyArtifacts, writeGeneratedArtifacts } from './index.mjs';

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) {
  process.stderr.write('Usage: world-body-codegen <world.declaration.json> <output-directory>\n');
  process.exit(2);
}

const declaration = JSON.parse(readFileSync(path.resolve(inputPath), 'utf8'));
const bundle = generateWorldBodyArtifacts(declaration);
const result = writeGeneratedArtifacts(bundle, path.resolve(outputPath));
process.stdout.write(`${JSON.stringify({
  format: 'taowind.world-body-codegen-cli-result.v0.1',
  outputRoot: result.outputRoot,
  manifestRoot: result.manifestRoot,
  worldBodyRoot: bundle.ir.roots.worldBodyRoot,
  artifactCount: result.artifactCount,
  authority: bundle.manifest.authority,
}, null, 2)}\n`);
