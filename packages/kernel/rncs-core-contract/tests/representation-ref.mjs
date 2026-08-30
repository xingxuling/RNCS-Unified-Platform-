import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRepresentationRef, verifyRepresentationRef} from '../src/index.mjs';

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

console.log(`representation reference tests: ${pass}/4 PASS`);
