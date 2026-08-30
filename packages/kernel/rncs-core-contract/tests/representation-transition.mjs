import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  applyRepresentationTransition,
  createRepresentationRef,
  createRepresentationTransitionCandidate,
  rootHash,
  rollbackRepresentationTransition,
  verifyRepresentationTransition
} from '../src/index.mjs';

let pass = 0;
const test = (name, fn) => { try { fn(); console.log('ok', ++pass, '-', name); } catch (error) { console.error('not ok -', name, error); process.exitCode = 1; } };

const common = {
  content_root: 'c'.repeat(64),
  detail_policy: {mode: 'distance-lod', selectors: ['screen-space-size']},
  residency_policy: {mode: 'paged-streaming', selectors: ['viewpoint']},
  authority_scope: ['representation_candidate', 'visual_projection', 'observation_candidate'],
  availability: 'CONTRACT_ONLY'
};

const spark = createRepresentationRef({
  ...common,
  provider_id: 'provider:external:spark-2.1.0',
  provider_root: 'a'.repeat(64),
  representation_kind: 'gaussian-splats',
  representation_formats: ['application/vnd.spark.rad'],
  representation_profile: {profile_id: 'spark.ext-splats', formats: ['application/vnd.spark.rad']}
});

const mesh = createRepresentationRef({
  ...common,
  provider_id: 'provider:external:gltf-mesh-0.2',
  provider_root: 'b'.repeat(64),
  representation_kind: 'mesh',
  representation_formats: ['model/gltf-binary'],
  representation_profile: {profile_id: 'gltf.mesh', formats: ['model/gltf-binary']},
  detail_policy: {mode: 'distance-lod', selectors: ['screen-space-size', 'triangle-budget']},
  residency_policy: {mode: 'asset-resident', selectors: ['vram-budget']}
});

const input = {
  transition_id: 'transition:gaussian-to-mesh:phase3',
  operation: 'handoff',
  object_id: 'reality-object:phase3-fixture',
  branch: 'main',
  state_root: 'd'.repeat(64),
  source_representation: spark,
  target_representation: mesh,
  equivalence: {
    identity: 'PASS',
    authority: 'PASS',
    constraint: 'UNKNOWN',
    semantic: 'PASS',
    spatial: 'PASS',
    perceptual: 'PASS',
    behavioral: 'NOT_RUN',
    temporal: 'NOT_RUN',
    task: 'PASS'
  },
  resource_decision: {
    mode: 'handoff',
    selected_representation_root: mesh.representation_root,
    resource_budget: {vram_mb: 128, working_set: 'mesh-resident'},
    reason: 'mesh edit task within declared budget'
  }
};

test('representation transition candidate keeps identity and policy roots', () => {
  const transition = createRepresentationTransitionCandidate(input);
  assert.equal(verifyRepresentationTransition(transition).valid, true);
  assert.equal(transition.identity.content_root, spark.content_root);
  assert.equal(transition.identity.source_representation_root, spark.representation_root);
  assert.equal(transition.identity.target_representation_root, mesh.representation_root);
  assert.equal(transition.resource_decision.selected_representation_root, mesh.representation_root);
  assert.equal(transition.candidate_only, true);
  assert.equal(transition.authoritative, false);
  assert.equal(transition.commit_status, 'NOT_COMMITTED');
});

test('candidate transition applies only as a reversible candidate handoff', () => {
  const applied = applyRepresentationTransition(createRepresentationTransitionCandidate(input));
  assert.equal(verifyRepresentationTransition(applied).valid, true);
  assert.equal(applied.phase, 'applied');
  assert.equal(applied.execution_status, 'CANDIDATE_APPLIED');
  assert.equal(applied.active_representation_root, mesh.representation_root);
  assert.equal(applied.commit_status, 'NOT_COMMITTED');
  assert.equal(applied.authority.provider_can_write_authoritative_world_state, false);
});

test('rollback restores the source representation without canonical commit', () => {
  const applied = applyRepresentationTransition(createRepresentationTransitionCandidate(input));
  const rolledBack = rollbackRepresentationTransition(applied, 'mesh perceptual check failed on target device');
  assert.equal(verifyRepresentationTransition(rolledBack).valid, true);
  assert.equal(rolledBack.phase, 'rolled_back');
  assert.equal(rolledBack.execution_status, 'CANDIDATE_ROLLED_BACK');
  assert.equal(rolledBack.active_representation_root, spark.representation_root);
  assert.equal(rolledBack.rollback.status, 'ROLLED_BACK');
  assert.equal(rolledBack.commit_status, 'NOT_COMMITTED');
});

test('identity mismatch is rejected before a representation transition can be created', () => {
  assert.throws(() => createRepresentationTransitionCandidate({
    ...input,
    target_representation: createRepresentationRef({...common, provider_id: 'provider:external:gltf-mesh-0.2', provider_root: 'b'.repeat(64), representation_kind: 'mesh', representation_formats: ['model/gltf-binary'], representation_profile: {profile_id: 'gltf.mesh', formats: ['model/gltf-binary']}, content_root: 'e'.repeat(64)})
  }), /REPRESENTATION_TRANSITION_CONTENT_ROOT_MISMATCH/);
});

test('transition tampering is detected and schema freezes candidate-only fields', () => {
  const transition = createRepresentationTransitionCandidate(input);
  transition.resource_decision.selected_representation_root = spark.representation_root;
  assert.equal(verifyRepresentationTransition(transition).valid, false);
  const schema = JSON.parse(fs.readFileSync(new URL('../schemas/representation-transition.v0.1.schema.json', import.meta.url), 'utf8'));
  assert.equal(schema.properties.candidate_only.const, true);
  assert.equal(schema.properties.authoritative.const, false);
  assert.equal(rootHash({transition: 'phase3'}).length, 64);
});

console.log(`representation transition tests: ${pass}/5 PASS`);
