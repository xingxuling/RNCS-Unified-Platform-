import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assertTheoremRegistry,
  evaluateTheorem,
  evaluateTheoremSuite,
  verifyProofBundle,
} from '@taowind/world-body-formal-kernel';
import { createWorldBodyIR } from '@taowind/world-body-ir';
import { minimalWorldBodyInput, minimalWorldBodyIR } from '../../world-body-ir/examples/minimal-world-body.mjs';
import {
  RSR_THEOREMS,
  buildRsrReferenceFixture,
  collisionPairAllowed,
  createFormalAuthorityFrame,
  createRsrReferenceSnapshot,
  restoreRsrReferenceSnapshot,
  rsrReferenceStep,
  symmetricContactKey,
  verifyFormalAuthorityFrame,
  verifyRsrTraceRefinement,
  worldBodyToRsrReferenceState,
} from '../src/index.mjs';

test('RSR theorem registry covers all five levels with stable ids', () => {
  const registry = assertTheoremRegistry(RSR_THEOREMS);
  assert.equal(registry.theoremCount, 18);
  assert.deepEqual(registry.levels, [1, 2, 3, 4, 5]);
});

test('RSR reference fixture closes every executable theorem', async () => {
  const fixture = buildRsrReferenceFixture(minimalWorldBodyIR);
  const bundle = await evaluateTheoremSuite(RSR_THEOREMS, fixture, { domain: 'RSR' });
  assert.equal(bundle.status, 'PARTIAL');
  assert.deepEqual(bundle.counts, { FAIL: 0, PASS: 17, UNVERIFIED: 1 });
  assert.equal(verifyProofBundle(bundle), true);
  assert.equal(bundle.receipts.find(receipt => receipt.theorem.id === 'RSR-T5.3').status, 'UNVERIFIED');
});

test('fixed-step replay is deterministic and static body is unchanged', () => {
  const state = worldBodyToRsrReferenceState(minimalWorldBodyIR);
  const first = rsrReferenceStep(state, []);
  const second = rsrReferenceStep(state, []);
  assert.equal(first.stateRoot, second.stateRoot);
  const staticBefore = state.bodies.find(body => body.kind === 'static');
  const staticAfter = first.bodies.find(body => body.id === staticBefore.id);
  assert.deepEqual(staticAfter.transform, staticBefore.transform);
});

test('snapshot restore preserves exact root and rejects mutation', () => {
  const state = worldBodyToRsrReferenceState(minimalWorldBodyIR);
  const snapshot = createRsrReferenceSnapshot(state);
  assert.equal(restoreRsrReferenceSnapshot(snapshot).stateRoot, state.stateRoot);
  const tampered = structuredClone(snapshot);
  tampered.state.tick += 1;
  assert.throws(() => restoreRsrReferenceSnapshot(tampered), error => error.code === 'RSR_FORMAL_SNAPSHOT_ROOT_MISMATCH');
});

test('contact identity and collision admission are symmetric', () => {
  assert.equal(symmetricContactKey('fixture:z', 'fixture:a'), symmetricContactKey('fixture:a', 'fixture:z'));
  const a = { collisionFilter: { categoryBits: 1, maskBits: 2 } };
  const b = { collisionFilter: { categoryBits: 2, maskBits: 1 } };
  assert.equal(collisionPairAllowed(a, b), collisionPairAllowed(b, a));
  assert.equal(collisionPairAllowed(a, b), true);
});

test('nested body root mutation invalidates an authority frame', () => {
  const state = worldBodyToRsrReferenceState(minimalWorldBodyIR);
  const frame = createFormalAuthorityFrame(state);
  assert.equal(verifyFormalAuthorityFrame(frame), true);
  const tampered = structuredClone(frame);
  tampered.objects[0].transform.positionMm.x += 1;
  assert.equal(verifyFormalAuthorityFrame(tampered), false);
});

test('refinement relation detects production-observable position drift', () => {
  const reference = worldBodyToRsrReferenceState(minimalWorldBodyIR);
  const implementation = structuredClone(reference);
  implementation.bodies[0].transform.positionMm.x += 5;
  assert.equal(verifyRsrTraceRefinement(reference, implementation, { toleranceMm: 4 }).ok, false);
  assert.equal(verifyRsrTraceRefinement(reference, implementation, { toleranceMm: 5 }).ok, true);
});

test('L5 adapter theorem fails visibly when its relation is violated', async () => {
  const fixture = buildRsrReferenceFixture(minimalWorldBodyIR);
  fixture.refinementCandidate.bodies[0].transform.positionMm.z += 1;
  const theorem = RSR_THEOREMS.find(item => item.id === 'RSR-T5.2');
  const receipt = await evaluateTheorem(theorem, fixture);
  assert.equal(receipt.status, 'FAIL');
});

test('invalid World Body IR cannot enter the RSR reference theory', () => {
  const invalid = structuredClone(minimalWorldBodyInput);
  invalid.physicalBodyState.bodies[0].massGrams = 0;
  assert.throws(() => createWorldBodyIR(invalid), error => error.code === 'WBIR_DYNAMIC_MASS_INVALID');
});
