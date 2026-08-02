import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { compileReality } from '@taowind/reality-computation-language';
import { semanticHash } from '@taowind/world-body-ir';
import { minimalWorldBodyIR } from '../../world-body-ir/examples/minimal-world-body.mjs';
import {
  compileRsrWorldConfig,
  compileWorldDeclaration,
  generateWorldBodyArtifacts,
  verifyGeneratedArtifactBundle,
  writeGeneratedArtifacts,
} from '../src/index.mjs';

const declaration = JSON.parse(readFileSync(new URL('../examples/minimal-world.declaration.json', import.meta.url), 'utf8'));

test('one World Declaration compiles to the audited equivalent World Body IR', () => {
  const compilation = compileWorldDeclaration(declaration);
  assert.equal(compilation.ir.roots.worldBodyRoot, minimalWorldBodyIR.roots.worldBodyRoot);
  assert.deepEqual(compilation.ir, minimalWorldBodyIR);
});

test('codegen emits seven deterministic candidate artifacts and a sealed manifest', () => {
  const first = generateWorldBodyArtifacts(declaration);
  const second = generateWorldBodyArtifacts(declaration);
  assert.equal(first.artifacts.length, 7);
  assert.equal(first.manifest.authority, 'candidate-artifact-generation-only-no-commit');
  assert.equal(first.manifest.manifestRoot, second.manifest.manifestRoot);
  assert.deepEqual(first.artifacts, second.artifacts);
  assert.equal(verifyGeneratedArtifactBundle(first), true);
});

test('semantic compilation is invariant to declaration collection order', () => {
  const reordered = structuredClone(declaration);
  reordered.entities.reverse();
  reordered.assets.reverse();
  reordered.events[0].routes.reverse();
  reordered.renderGraphs[0].passes.reverse();
  reordered.renderGraphs[0].resources.reverse();
  const first = generateWorldBodyArtifacts(declaration);
  const second = generateWorldBodyArtifacts(reordered);
  assert.equal(first.compilation.semanticDeclarationRoot, second.compilation.semanticDeclarationRoot);
  assert.equal(first.ir.roots.worldBodyRoot, second.ir.roots.worldBodyRoot);
  assert.deepEqual(first.artifacts, second.artifacts);
});

test('generated RSR config preserves real protocol, units, bodies, and authority evidence', () => {
  const compilation = compileWorldDeclaration(declaration);
  const config = compileRsrWorldConfig(compilation, declaration);
  assert.equal(config.format, 'rsr.spatial-embodiment-world.v0.6');
  assert.equal(config.stepHz, 60);
  assert.equal(config.bodies.length, 2);
  assert.equal(config.bodies.find(body => body.id === 'body:hero').position.y, 1500);
  assert.equal(config.reality.realityRoot, declaration.world.sourceRealityRoot);
  assert.equal(config.reality.evidenceRoot, compilation.ir.roots.worldBodyRoot);
});

test('generated RCL artifact compiles with the repository real RCL compiler', () => {
  const bundle = generateWorldBodyArtifacts(declaration);
  const source = bundle.artifacts.find(item => item.path.endsWith('.rcl')).content;
  const program = compileReality(source);
  assert.match(program.name, /^GeneratedWorldBody_/);
  assert.equal(program.facets.some(facet => facet.path === 'contract.candidate_only'), true);
});

test('writing a verified bundle stays under an explicit output directory', () => {
  const output = mkdtempSync(path.join(os.tmpdir(), 'world-body-codegen-test-'));
  try {
    const bundle = generateWorldBodyArtifacts(declaration);
    const result = writeGeneratedArtifacts(bundle, output);
    assert.equal(result.artifactCount, 8);
    assert.equal(existsSync(path.join(output, 'manifest.json')), true);
    assert.equal(JSON.parse(readFileSync(path.join(output, 'manifest.json'), 'utf8')).manifestRoot, bundle.manifest.manifestRoot);
  } finally {
    rmSync(output, { recursive: true, force: true });
  }
});

test('bundle tampering is rejected before filesystem writes', () => {
  const bundle = generateWorldBodyArtifacts(declaration);
  bundle.artifacts[0].content += '\n';
  assert.equal(verifyGeneratedArtifactBundle(bundle), false);
  assert.throws(() => writeGeneratedArtifacts(bundle, path.join(os.tmpdir(), 'world-body-invalid')), error => error.code === 'WORLD_BODY_CODEGEN_BUNDLE_INVALID');
});

test('unmanifested and duplicate artifacts are rejected before filesystem writes', () => {
  const extra = generateWorldBodyArtifacts(declaration);
  extra.artifacts.push({
    path: 'unmanifested.txt',
    mediaType: 'text/plain',
    content: 'not sealed by the manifest',
    contentRoot: semanticHash('not sealed by the manifest'),
  });
  assert.equal(verifyGeneratedArtifactBundle(extra), false);
  assert.throws(() => writeGeneratedArtifacts(extra, path.join(os.tmpdir(), 'world-body-extra')), error => error.code === 'WORLD_BODY_CODEGEN_BUNDLE_INVALID');

  const duplicate = generateWorldBodyArtifacts(declaration);
  duplicate.artifacts[1] = structuredClone(duplicate.artifacts[0]);
  assert.equal(verifyGeneratedArtifactBundle(duplicate), false);
  assert.equal(verifyGeneratedArtifactBundle({ format: 'taowind.world-body-codegen-bundle.v0.1', ir: duplicate.ir }), false);
});

test('even a resealed malicious artifact path cannot escape output root', () => {
  const bundle = generateWorldBodyArtifacts(declaration);
  const item = bundle.artifacts[0];
  const oldPath = item.path;
  item.path = '../escape.txt';
  const manifestEntry = bundle.manifest.artifacts.find(entry => entry.path === oldPath);
  manifestEntry.path = item.path;
  const { manifestRoot, ...base } = bundle.manifest;
  bundle.manifest.manifestRoot = semanticHash(base);
  assert.equal(verifyGeneratedArtifactBundle(bundle), true);
  assert.throws(() => writeGeneratedArtifacts(bundle, path.join(os.tmpdir(), 'world-body-contained')), error => error.code === 'WORLD_BODY_CODEGEN_PATH_ESCAPE');
});

test('authoritative entity without a physical body fails closed', () => {
  const invalid = structuredClone(declaration);
  delete invalid.entities[0].physical;
  assert.throws(() => compileWorldDeclaration(invalid), error => error.code === 'WORLD_BODY_ENTITY_PHYSICAL_REQUIRED');
});
