import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assertTheoremRegistry,
  evaluateTheorem,
  evaluateTheoremSuite,
  verifyProofBundle,
} from '@taowind/world-body-formal-kernel';
import { minimalWorldBodyIR } from '../../world-body-ir/examples/minimal-world-body.mjs';
import {
  WORLD_BODY_THEOREMS,
  advanceWorldBodyReference,
  buildWorldBodyJointFixture,
  forkWorldBodyReference,
  routeWorldEvents,
  verifyJointRefinement,
} from '../src/index.mjs';

test('joint theorem registry exposes WB-T1 through WB-T10 over five levels', () => {
  const registry = assertTheoremRegistry(WORLD_BODY_THEOREMS);
  assert.equal(registry.theoremCount, 10);
  assert.deepEqual(registry.theoremIds, Array.from({ length: 10 }, (_, index) => `WB-T${index + 1}`).sort());
  assert.deepEqual(registry.levels, [1, 2, 3, 4, 5]);
});

test('joint reference fixture closes WB-T1 through WB-T9 and preserves WB-T10 boundary', async () => {
  const fixture = buildWorldBodyJointFixture(minimalWorldBodyIR);
  const bundle = await evaluateTheoremSuite(WORLD_BODY_THEOREMS, fixture, { domain: 'WORLD_BODY' });
  assert.equal(bundle.status, 'PARTIAL');
  assert.deepEqual(bundle.counts, { FAIL: 0, PASS: 9, UNVERIFIED: 1 });
  assert.equal(verifyProofBundle(bundle), true);
  assert.equal(bundle.receipts.find(receipt => receipt.theorem.id === 'WB-T10').status, 'UNVERIFIED');
});

test('joint transition binds the new authority root into presentation without mutating base', () => {
  const baseRoot = minimalWorldBodyIR.roots.worldBodyRoot;
  const dynamic = minimalWorldBodyIR.physicalBodyState.bodies.find(body => body.kind === 'dynamic');
  const transition = advanceWorldBodyReference(minimalWorldBodyIR, [{
    id: 'command:test', tick: minimalWorldBodyIR.temporalPresentationState.clock.tick + 1, sequence: 0,
    bodyId: dynamic.id, kind: 'set-velocity', value: { x: 600, y: 0, z: 0 },
  }]);
  assert.equal(transition.presentationSourceAuthorityRoot, transition.afterAuthorityRoot);
  assert.equal(transition.presentationSourcePhysicalRoot, transition.afterPhysicalRoot);
  assert.equal(minimalWorldBodyIR.roots.worldBodyRoot, baseRoot);
  assert.notEqual(transition.afterWorldBodyRoot, baseRoot);
});

test('event routes compile to unique authority-bound delivery keys', () => {
  const plan = routeWorldEvents(minimalWorldBodyIR);
  assert.equal(new Set(plan.deliveries.map(item => item.deliveryKey)).size, plan.deliveries.length);
  assert.ok(plan.deliveries.every(item => item.sourceAuthorityRoot === minimalWorldBodyIR.authorityState.sourceRealityRoot));
});

test('candidate branches diverge without modifying their base root', () => {
  const body = minimalWorldBodyIR.physicalBodyState.bodies.find(item => item.kind === 'dynamic');
  const tick = minimalWorldBodyIR.temporalPresentationState.clock.tick + 1;
  const left = forkWorldBodyReference(minimalWorldBodyIR, 'branch:left', [{ id: 'command:left', tick, sequence: 0, bodyId: body.id, kind: 'set-velocity', value: { x: 600, y: 0, z: 0 } }]);
  const right = forkWorldBodyReference(minimalWorldBodyIR, 'branch:right', [{ id: 'command:right', tick, sequence: 0, bodyId: body.id, kind: 'set-velocity', value: { x: -600, y: 0, z: 0 } }]);
  assert.equal(left.baseWorldBodyRoot, right.baseWorldBodyRoot);
  assert.notEqual(left.branchRoot, right.branchRoot);
  assert.equal(left.authorityClass, 'candidate');
});

test('joint refinement requires both layer relations and authority binding', () => {
  const fixture = buildWorldBodyJointFixture(minimalWorldBodyIR);
  assert.equal(verifyJointRefinement(fixture.jointReference, fixture.jointImplementation).ok, true);
  const tampered = structuredClone(fixture.jointImplementation);
  tampered.vsr.sourceAuthorityRoot = '0'.repeat(64);
  const result = verifyJointRefinement(fixture.jointReference, tampered);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some(error => error.code === 'WB_REFINEMENT_AUTHORITY_BINDING_MISMATCH'));
});

test('WB-T9 fails visibly when the composed implementation drifts', async () => {
  const fixture = buildWorldBodyJointFixture(minimalWorldBodyIR);
  fixture.jointImplementation.rsr.bodies[0].transform.positionMm.x += 1;
  const theorem = WORLD_BODY_THEOREMS.find(item => item.id === 'WB-T9');
  const receipt = await evaluateTheorem(theorem, fixture);
  assert.equal(receipt.status, 'FAIL');
});
