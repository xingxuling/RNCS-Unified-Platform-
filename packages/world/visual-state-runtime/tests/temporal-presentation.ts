import assert from 'node:assert/strict';
import {
  TemporalPresentationBuffer,
  applyTemporalCorrection,
  createTemporalCorrectionPlan,
  networkPacketToTemporalState,
  sealTemporalStatePacket,
  verifyTemporalStatePacket,
  type TemporalObjectState,
} from '../packages/temporal-presentation/src/index.js';

const object = (tick: number, x: number, rotationY = 0, velocityX = 6000): TemporalObjectState => ({
  objectId: 'player',
  position: { x, y: 1000, z: 0 },
  rotationDeg: { x: 0, y: rotationY, z: 0 },
  velocity: { x: velocityX, y: 0, z: 0 },
  angularVelocityDeg: { x: 0, y: 0, z: 0 },
  animationState: tick % 2 ? 'run' : 'idle',
});
const packet = (tick: number, x: number, rotationY = 0, discontinuities: string[] = []) => sealTemporalStatePacket({
  format: 'vsr.temporal-state-packet.v0.6',
  protocol: 'vsr.temporal-presentation.v0.6',
  worldId: 'world:temporal-test',
  tick,
  stepHz: 60,
  sourceStateRoot: `${tick}`.padStart(64, '0'),
  sourcePacketRoot: `${tick + 100}`.padStart(64, '0'),
  objects: [object(tick, x, rotationY)],
  discontinuities,
});

const tests: Array<{ name: string; fn: () => void }> = [];
const test = (name: string, fn: () => void): void => { tests.push({ name, fn }); };

test('temporal packets seal and detect tampering', () => {
  const value = packet(1, 100);
  assert.equal(verifyTemporalStatePacket(value), true);
  value.objects[0]!.position.x++;
  assert.equal(verifyTemporalStatePacket(value), false);
});

test('network snapshot packets adapt without changing authority root', () => {
  const adapted = networkPacketToTemporalState({
    worldId: 'world:network', tick: 5, stateRoot: 'a'.repeat(64), snapshotRoot: 'b'.repeat(64),
    rsrSnapshot: { stepHz: 60 },
    objects: [{ objectId: 'player', position: { x: 10, y: 20, z: 30 }, rotation: { x: 0, y: 1000, z: 0 }, velocity: { x: 60, y: 0, z: 0 } }],
  });
  assert.equal(adapted.sourceStateRoot, 'a'.repeat(64));
  assert.equal(adapted.objects[0]!.rotationDeg.y, 1000);
  assert.equal(verifyTemporalStatePacket(adapted), true);
});

test('buffer interpolates with deterministic Hermite motion', () => {
  const buffer = new TemporalPresentationBuffer({ interpolationDelayTicks: 0 });
  buffer.push(packet(0, 0)); buffer.push(packet(2, 200));
  const first = buffer.sampleObject('player', 1)!;
  const second = buffer.sampleObject('player', 1)!;
  assert.equal(first.mode, 'interpolate');
  assert.equal(first.position.x, second.position.x);
  assert.equal(first.presentationRoot, second.presentationRoot);
  assert.ok(first.position.x > 0 && first.position.x < 200);
});

test('rotation interpolation follows shortest wrapped path', () => {
  const buffer = new TemporalPresentationBuffer({ interpolationDelayTicks: 0 });
  buffer.push(packet(0, 0, 350000)); buffer.push(packet(2, 0, 10000));
  const sample = buffer.sampleObject('player', 1)!;
  const normalized = ((sample.rotationDeg.y % 360000) + 360000) % 360000;
  assert.ok(normalized < 1000 || normalized > 359000);
});

test('missing future sample uses bounded extrapolation', () => {
  const buffer = new TemporalPresentationBuffer({ interpolationDelayTicks: 0, maximumExtrapolationTicks: 3 });
  buffer.push(packet(1, 100));
  const sample = buffer.sampleObject('player', 10)!;
  assert.equal(sample.mode, 'hold');
  buffer.push(packet(2, 200));
  const extrapolated = buffer.sampleObject('player', 10)!;
  assert.equal(extrapolated.mode, 'extrapolate');
  assert.equal(extrapolated.position.x, 500);
});

test('large discontinuity snaps instead of blending through the world', () => {
  const buffer = new TemporalPresentationBuffer({ interpolationDelayTicks: 0, teleportDistance: 1000 });
  buffer.push(packet(0, 0)); buffer.push(packet(2, 5000));
  assert.equal(buffer.sampleObject('player', 1)!.mode, 'snap');
});

test('correction plan separates visual smoothing from authority', () => {
  const predicted = object(0, 0);
  const authoritative = object(1, 800);
  const plan = createTemporalCorrectionPlan(predicted, authoritative, { softThreshold: 10, snapThreshold: 2000, blendTicks: 4 });
  const halfway = applyTemporalCorrection(predicted, authoritative, plan, .5);
  assert.equal(plan.mode, 'blend');
  assert.equal(halfway.position.x, 400);
  assert.equal(plan.authorityRoot, createTemporalCorrectionPlan(predicted, authoritative, { softThreshold: 10, snapThreshold: 2000, blendTicks: 4 }).authorityRoot);
});

test('presentation frame preserves latest authoritative root and owns a separate frame root', () => {
  const buffer = new TemporalPresentationBuffer({ interpolationDelayTicks: 1 });
  buffer.push(packet(1, 100)); buffer.push(packet(2, 200)); buffer.push(packet(3, 300));
  const frame = buffer.sampleFrame(3);
  assert.equal(frame.authorityStateRoot, packet(3, 300).sourceStateRoot);
  assert.notEqual(frame.frameRoot, frame.authorityStateRoot);
  assert.equal(frame.objects.length, 1);
  assert.equal(Object.values(frame.modes).reduce((a, b) => a + b, 0), 1);
});

let passed = 0;
for (const entry of tests) {
  try { entry.fn(); passed++; console.log(`PASS ${entry.name}`); }
  catch (error) { console.error(`FAIL ${entry.name}`); throw error; }
}
console.log(`VSR v0.6 temporal presentation tests: ${passed}/${tests.length} PASS`);
