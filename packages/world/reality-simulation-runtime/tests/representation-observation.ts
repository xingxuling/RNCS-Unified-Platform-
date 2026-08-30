import assert from 'node:assert/strict';
import {
  createRepresentationObservationCandidate,
  verifyRepresentationObservationCandidate,
  type RSRRepresentationReference
} from '../packages/representation-observation/src/index.js';

const root = (char: string): string => char.repeat(64);
const reference = (): RSRRepresentationReference => ({
  format: 'rncs.representation-ref.v0.1',
  provider_id: 'provider:external:spark-2.1.0',
  provider_root: root('a'),
  representation_kind: 'gaussian-splats',
  content_root: root('b'),
  availability: 'CONTRACT_ONLY',
  authority_scope: ['representation_candidate', 'visual_projection', 'observation_candidate'],
  authority: { provider_may_write_authoritative_world_state: false, rncs_authority_required: true },
  candidate_only: true,
  authoritative: false,
  representation_root: root('c')
});

const tests: Array<{ name: string; fn: () => void }> = [];
const test = (name: string, fn: () => void): void => { tests.push({ name, fn }); };

test('RSR emits observation candidates without a reconstruction or canonical-state proposal', () => {
  const candidate = createRepresentationObservationCandidate({ reference: reference(), observation: { kind: 'bounds', data: { bounds_root: root('d') } } });
  assert.equal(candidate.observation.kind, 'bounds');
  assert.equal(candidate.reconstruction_candidate, null);
  assert.equal(candidate.canonical_state_proposal, null);
  assert.equal(candidate.authority.rsr_can_promote_without_independent_evidence, false);
  assert.equal(candidate.authoritative, false);
  assert.equal(verifyRepresentationObservationCandidate(candidate), true);
});

test('RSR rejects representation authority escalation and direct canonical promotion', () => {
  const authoritative = { ...reference(), authoritative: true } as unknown as RSRRepresentationReference;
  assert.throws(() => createRepresentationObservationCandidate({ reference: authoritative }), /RSR_REPRESENTATION_REF_CANNOT_BE_AUTHORITATIVE/);
  assert.throws(() => createRepresentationObservationCandidate({ reference: reference(), canonical_state_proposal: { world: 'forbidden' } }), /RSR_REPRESENTATION_CANONICAL_PROMOTION_FORBIDDEN/);
  assert.throws(() => createRepresentationObservationCandidate({ reference: reference(), reconstruction_candidate: { mesh: 'forbidden' } }), /RSR_REPRESENTATION_RECONSTRUCTION_IR_FORBIDDEN/);
});

test('RSR observation candidate integrity detects mutation', () => {
  const candidate = createRepresentationObservationCandidate({ reference: reference(), observation: { kind: 'lod', data: { selected_lod: 2 } } });
  candidate.observation.data.selected_lod = 9;
  assert.equal(verifyRepresentationObservationCandidate(candidate), false);
});

let passed = 0;
for (const entry of tests) {
  try { entry.fn(); passed++; console.log(`PASS ${entry.name}`); }
  catch (error) { console.error(`FAIL ${entry.name}`); throw error; }
}
console.log(`RSR representation observation tests: ${passed}/${tests.length} PASS`);
