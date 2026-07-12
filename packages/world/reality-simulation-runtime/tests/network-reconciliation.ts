import assert from 'node:assert/strict';
import {
  SpatialEmbodimentWorld,
  computeSpatialEmbodimentStateRoot,
  verifySpatialEmbodimentSnapshot,
  type SpatialEmbodimentWorldConfig,
  type SpatialEmbodimentSnapshot,
} from '../packages/spatial-embodiment/src/index.js';
import {
  AuthoritativeStateHistory,
  applyAuthoritativeStateDelta,
  createAuthoritativeStateDelta,
  createAuthoritativeStateFrame,
  reconcilePredictedState,
  verifyAuthoritativeStateDelta,
  verifyAuthoritativeStateFrame,
} from '../packages/network-reconciliation/src/index.js';

const config = (): SpatialEmbodimentWorldConfig => ({
  format: 'rsr.spatial-embodiment-world.v0.5',
  worldId: 'world:authority-test',
  stepHz: 60,
  gravity: { x: 0, y: -9810, z: 0 },
  floorY: 0,
  bodies: [
    { id: 'ground', kind: 'static', position: { x: 0, y: -500, z: 0 }, fixtures: [{ id: 'ground-fixture', shape: { type: 'box', halfExtents: { x: 5000, y: 500, z: 5000 } } }] },
    { id: 'player', kind: 'dynamic', position: { x: 0, y: 1000, z: 0 }, fixtures: [{ id: 'player-fixture', shape: { type: 'box', halfExtents: { x: 300, y: 500, z: 300 } } }], fixedRotation: true },
  ],
  characters: [{ id: 'character:player', bodyId: 'player', walkSpeed: 6000, acceleration: 32000, jumpSpeed: 6500 }],
  materials: [{ id: 'default', frictionQ: 500000, restitutionQ: 0 }],
  listeners: [],
});

const tests: Array<{ name: string; fn: () => void }> = [];
const test = (name: string, fn: () => void): void => { tests.push({ name, fn }); };

test('authoritative frame binds presentation objects to one verified RSR state root', () => {
  const snapshot = new SpatialEmbodimentWorld(config()).snapshot();
  const frame = createAuthoritativeStateFrame(snapshot, { reason: 'join' });
  assert.equal(frame.sourceStateRoot, snapshot.stateRoot);
  assert.equal(frame.objects.length, snapshot.bodies.length);
  assert.equal(verifyAuthoritativeStateFrame(frame), true);
});

test('authoritative delta reconstructs the exact target snapshot', () => {
  const world = new SpatialEmbodimentWorld(config());
  const before = world.snapshot();
  const after = world.step([{ id: 'move:1', tick: 1, type: 'move-character', characterId: 'character:player', direction: { x: 1000000, y: 0, z: 0 } }]).snapshot;
  const delta = createAuthoritativeStateDelta(before, after);
  const rebuilt = applyAuthoritativeStateDelta(before, delta);
  assert.equal(delta.baseStateRoot, before.stateRoot);
  assert.equal(rebuilt.stateRoot, after.stateRoot);
  assert.deepEqual(rebuilt, after);
});

test('tampered authoritative delta is rejected before state mutation', () => {
  const world = new SpatialEmbodimentWorld(config());
  const before = world.snapshot();
  const after = world.step().snapshot;
  const delta = createAuthoritativeStateDelta(before, after);
  delta.changedBodies[0]!.position.x += 999;
  assert.equal(verifyAuthoritativeStateDelta(delta), false);
  assert.throws(() => applyAuthoritativeStateDelta(before, delta), /RSR_DELTA_INTEGRITY_MISMATCH/);
});

test('bounded authoritative history evicts oldest ticks and creates exact deltas', () => {
  const world = new SpatialEmbodimentWorld(config());
  const history = new AuthoritativeStateHistory(3);
  history.push(world.snapshot());
  for (let i = 0; i < 4; i++) history.push(world.step().snapshot);
  assert.deepEqual(history.ticks(), [2, 3, 4]);
  const delta = history.delta(2, 4);
  assert.equal(applyAuthoritativeStateDelta(history.get(2)!, delta).stateRoot, history.get(4)!.stateRoot);
});

test('prediction reconciliation restores authority then deterministically replays pending commands', () => {
  const authoritativeWorld = new SpatialEmbodimentWorld(config());
  const authoritative = authoritativeWorld.step().snapshot;
  const predictedWorld = SpatialEmbodimentWorld.fromSnapshot(authoritative);
  const predicted = predictedWorld.step([{ id: 'wrong', tick: 2, type: 'apply-impulse', bodyId: 'player', impulse: { x: 9000, y: 0, z: 0 } }]).snapshot;
  const pending = [{ id: 'pending:move', tick: 2, type: 'move-character' as const, characterId: 'character:player', direction: { x: 1000000, y: 0, z: 0 } }];
  const first = reconcilePredictedState({ predicted, authoritative, pendingCommands: pending });
  const second = reconcilePredictedState({ predicted, authoritative, pendingCommands: pending });
  assert.equal(first.receipt.corrected, true);
  assert.equal(first.snapshot.stateRoot, second.snapshot.stateRoot);
  assert.equal(first.receipt.receiptRoot, second.receipt.receiptRoot);
});

test('snapshot integrity ignores transport-only metadata but rejects authoritative field mutation', () => {
  const snapshot = new SpatialEmbodimentWorld(config()).snapshot() as SpatialEmbodimentSnapshot & { previousRoot?: string };
  snapshot.previousRoot = 'a'.repeat(64);
  assert.equal(computeSpatialEmbodimentStateRoot(snapshot), snapshot.stateRoot);
  assert.equal(verifySpatialEmbodimentSnapshot(snapshot), true);
  snapshot.bodies[0]!.position.x += 1;
  assert.equal(verifySpatialEmbodimentSnapshot(snapshot), false);
});

let passed = 0;
for (const entry of tests) {
  try { entry.fn(); passed++; console.log(`PASS ${entry.name}`); }
  catch (error) { console.error(`FAIL ${entry.name}`); throw error; }
}
console.log(`RSR v0.7 network reconciliation tests: ${passed}/${tests.length} PASS`);
