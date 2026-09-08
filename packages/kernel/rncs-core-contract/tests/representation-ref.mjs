import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRepresentationRef, verifyRepresentationRef, REPRESENTATION_KINDS, isRegisteredRepresentationKind} from '../src/index.mjs';

let pass = 0;
const test = (name, fn) => { try { fn(); console.log('ok', ++pass, '-', name); } catch (error) { console.error('not ok -', name, error); process.exitCode = 1; } };

const sample = () => createRepresentationRef({
  provider_id: 'provider:external:spark-2.1.0',
  provider_root: 'a'.repeat(64),
  representation_kind: 'gaussian-splats',
  representation_formats: ['application/vnd.spark.rad'],
  content_root: 'b'.repeat(64),
  representation_profile: {
    profile_id: 'spark.ext-splats',
    encoding: 'ExtSplats',
    fidelity: 'high',
    precision: 'float32-centers',
    formats: ['application/vnd.spark.rad']
  },
  detail_policy: {mode: 'hierarchical-lod', selectors: ['frustum', 'screen-space-size'], budget: {max_splats: 500000}},
  residency_policy: {mode: 'paged-streaming', selectors: ['viewpoint'], budget: {working_set: 'provider-configured'}},
  authority_scope: ['representation_candidate', 'visual_projection', 'observation_candidate'],
  availability: 'CONTRACT_ONLY',
  provenance: {upstream_url: 'https://github.com/sparkjsdev/spark', source_revision: '2.1.0-source-archive'},
  evidence: {provider_manifest_root: 'a'.repeat(64), notes: 'contract-only'}
});

test('candidate-only representation reference seals provider and policy evidence', () => {
  const reference = sample();
  assert.equal(verifyRepresentationRef(reference).valid, true);
  assert.equal(reference.authoritative, false);
  assert.equal(reference.authority.provider_may_write_authoritative_world_state, false);
  assert.equal(reference.commit_status, 'NOT_COMMITTED');
});

test('representation reference rejects an authority escalation', () => {
  assert.throws(() => createRepresentationRef({...sample(), authoritative: true}), /REPRESENTATION_REF_CANNOT_BE_AUTHORITATIVE/);
});

test('representation reference detects tampering', () => {
  const reference = sample();
  reference.availability = 'AVAILABLE';
  assert.equal(verifyRepresentationRef(reference).valid, false);
});

test('representation reference schema exposes candidate-only authority fields', () => {
  const schema = JSON.parse(fs.readFileSync(new URL('../schemas/representation-reference.v0.1.schema.json', import.meta.url), 'utf8'));
  assert.equal(schema.properties.authoritative.const, false);
  assert.equal(schema.properties.candidate_only.const, true);
  assert.ok(schema.required.includes('representation_profile'));
  assert.ok(schema.required.includes('detail_policy'));
  assert.ok(schema.required.includes('residency_policy'));
});

test('URRF visual families seal distinct reproducible candidate references', () => {
  const roots = new Set();
  for (const kind of ['character-mesh', 'layered-2d', 'gaussian-character', 'neural-visual', 'cinematic-character']) {
    assert.equal(isRegisteredRepresentationKind(kind), true);
    const input = {...sample(), representation_id: undefined, representation_kind: kind};
    const reference = createRepresentationRef(input);
    assert.equal(verifyRepresentationRef(reference).valid, true);
    assert.equal(reference.representation_root, createRepresentationRef(input).representation_root);
    assert.equal(reference.availability, 'CONTRACT_ONLY');
    assert.equal(reference.authoritative, false);
    assert.equal(reference.candidate_only, true);
    roots.add(reference.representation_root);
    assert.equal(verifyRepresentationRef({...reference, representation_kind: 'mesh'}).valid, false);
    assert.throws(() => createRepresentationRef({...input, authority: {provider_may_write_authoritative_world_state: true}}), /REPRESENTATION_PROVIDER_AUTHORITY_ESCALATION/);
  }
  assert.equal(roots.size, 5);
});

test('URRF registration is immutable and does not silently register provider extensions', () => {
  assert.equal(Object.isFrozen(REPRESENTATION_KINDS), true);
  for (const kind of [null, undefined, '', 'Character-Mesh', 'provider:custom-visual']) assert.equal(isRegisteredRepresentationKind(kind), false);
  assert.equal(verifyRepresentationRef(createRepresentationRef({...sample(), representation_kind: 'provider:custom-visual'})).valid, true);
  assert.throws(() => createRepresentationRef({...sample(), representation_kind: ''}), /REPRESENTATION_KIND_REQUIRED/);
});

test('reference and portfolio schemas advertise the same URRF vocabulary', () => {
  for (const file of ['representation-reference.v0.1.schema.json', 'representation-slot.v0.3.schema.json']) {
    const schema = JSON.parse(fs.readFileSync(new URL(`../schemas/${file}`, import.meta.url), 'utf8'));
    assert.deepEqual(schema.properties.representation_kind.examples, REPRESENTATION_KINDS);
    assert.equal(schema.properties.representation_kind.minLength, 1);
  }
});

console.log(`representation reference tests: ${pass}/7 PASS`);
