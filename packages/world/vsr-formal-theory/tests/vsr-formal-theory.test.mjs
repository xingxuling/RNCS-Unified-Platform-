import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assertTheoremRegistry,
  evaluateTheorem,
  evaluateTheoremSuite,
  verifyProofBundle,
} from '@taowind/world-body-formal-kernel';
import { quaternionFromEulerMilliDegrees, validateRenderGraph } from '@taowind/world-body-ir';
import { minimalWorldBodyIR } from '../../world-body-ir/examples/minimal-world-body.mjs';
import {
  VSR_THEOREMS,
  boundedExtrapolate,
  buildVsrReferenceFixture,
  evaluateDiffusePbrQ,
  interpolateQuaternion,
  interpolateVector3,
  planTemporalCorrection,
  verifyVsrProjectionRefinement,
  visibleObjectsForObserver,
  worldBodyToVsrReferenceProjection,
} from '../src/index.mjs';

test('VSR theorem registry covers all five levels with stable ids', () => {
  const registry = assertTheoremRegistry(VSR_THEOREMS);
  assert.equal(registry.theoremCount, 18);
  assert.deepEqual(registry.levels, [1, 2, 3, 4, 5]);
});

test('VSR reference fixture closes every executable theorem', async () => {
  const fixture = buildVsrReferenceFixture(minimalWorldBodyIR);
  const bundle = await evaluateTheoremSuite(VSR_THEOREMS, fixture, { domain: 'VSR' });
  assert.equal(bundle.status, 'PARTIAL');
  assert.deepEqual(bundle.counts, { FAIL: 0, PASS: 17, UNVERIFIED: 1 });
  assert.equal(verifyProofBundle(bundle), true);
  assert.equal(bundle.receipts.find(receipt => receipt.theorem.id === 'VSR-T5.3').status, 'UNVERIFIED');
});

test('projection is deterministic and binds authority without mutation', () => {
  const before = structuredClone(minimalWorldBodyIR.roots);
  const first = worldBodyToVsrReferenceProjection(minimalWorldBodyIR);
  const second = worldBodyToVsrReferenceProjection(minimalWorldBodyIR);
  assert.equal(first.projectionRoot, second.projectionRoot);
  assert.equal(first.sourceAuthorityRoot, minimalWorldBodyIR.authorityState.sourceRealityRoot);
  assert.equal(first.sourcePhysicalRoot, minimalWorldBodyIR.roots.physicalBodyRoot);
  assert.deepEqual(minimalWorldBodyIR.roots, before);
});

test('integer interpolation remains inside its component interval', () => {
  const result = interpolateVector3({ x: -10, y: 20, z: 100 }, { x: 11, y: -20, z: 101 }, 1, 2);
  assert.deepEqual(result, { x: 1, y: 0, z: 101 });
  assert.throws(() => interpolateVector3({ x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1 }, 2, 1), error => error.code === 'VSR_FORMAL_SAMPLE_FRACTION_INVALID');
});

test('quaternion interpolation takes the equivalent shortest-sign path', () => {
  const identity = quaternionFromEulerMilliDegrees({ x: 0, y: 0, z: 0 });
  const opposite = { ...identity, x: -identity.x, y: -identity.y, z: -identity.z, w: -identity.w };
  assert.deepEqual(interpolateQuaternion(identity, opposite, 1, 2), identity);
});

test('extrapolation clamps requested ticks to the policy bound', () => {
  const result = boundedExtrapolate(
    { x: 0, y: 0, z: 0 },
    { x: 600, y: -300, z: 0 },
    { requestedTicks: 9, tickHz: 60, maximumExtrapolationTicks: 2 },
  );
  assert.equal(result.appliedTicks, 2);
  assert.equal(result.clamped, true);
  assert.deepEqual(result.positionMm, { x: 20, y: -10, z: 0 });
});

test('temporal correction threshold partitions blend and snap', () => {
  const policy = { snapDistanceMm: 100, blendTicks: 4 };
  const predicted = { entityId: 'entity:a', positionMm: { x: 0, y: 0, z: 0 } };
  const blend = planTemporalCorrection(predicted, { entityId: 'entity:a', positionMm: { x: 99, y: 0, z: 0 }, sourceAuthorityRoot: 'a'.repeat(64) }, policy);
  const snap = planTemporalCorrection(predicted, { entityId: 'entity:a', positionMm: { x: 100, y: 0, z: 0 }, sourceAuthorityRoot: 'a'.repeat(64) }, policy);
  assert.equal(blend.mode, 'blend');
  assert.equal(snap.mode, 'snap');
});

test('scaled diffuse PBR is deterministic, non-negative, and bounded', () => {
  const input = { baseColorQ: [800_000, 200_000, 100_000], metallicQ: 350_000, normalDotLightQ: 900_000, radianceQ: [1_000_000, 900_000, 800_000] };
  const first = evaluateDiffusePbrQ(input);
  const second = evaluateDiffusePbrQ(input);
  assert.deepEqual(first, second);
  assert.ok(first.every(value => Number.isSafeInteger(value) && value >= 0));
});

test('observer visibility filters presentation without changing projection root', () => {
  const projection = worldBodyToVsrReferenceProjection(minimalWorldBodyIR);
  const before = projection.projectionRoot;
  const visible = visibleObjectsForObserver(projection, { visibleTags: ['player-visual'] });
  assert.deepEqual(visible.map(object => object.entityId), ['entity:hero']);
  assert.equal(projection.projectionRoot, before);
});

test('render graph mutation loses barrier and graph-root validity', () => {
  const graph = structuredClone(minimalWorldBodyIR.renderGraphs[0]);
  graph.barriers = [];
  const result = validateRenderGraph(graph);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some(error => error.code === 'WBIR_GRAPH_BARRIER_MISSING'));
  assert.ok(result.errors.some(error => error.code === 'WBIR_GRAPH_ROOT_MISMATCH'));
});

test('VSR refinement relation detects observable visual drift', () => {
  const reference = worldBodyToVsrReferenceProjection(minimalWorldBodyIR);
  const implementation = structuredClone(reference);
  implementation.objects[0].positionMm.y += 3;
  assert.equal(verifyVsrProjectionRefinement(reference, implementation, { toleranceMm: 2 }).ok, false);
  assert.equal(verifyVsrProjectionRefinement(reference, implementation, { toleranceMm: 3 }).ok, true);
});

test('L5 adapter theorem fails visibly when its relation is violated', async () => {
  const fixture = buildVsrReferenceFixture(minimalWorldBodyIR);
  fixture.refinementCandidate.sourceAuthorityRoot = '0'.repeat(64);
  const theorem = VSR_THEOREMS.find(item => item.id === 'VSR-T5.2');
  const receipt = await evaluateTheorem(theorem, fixture);
  assert.equal(receipt.status, 'FAIL');
});
