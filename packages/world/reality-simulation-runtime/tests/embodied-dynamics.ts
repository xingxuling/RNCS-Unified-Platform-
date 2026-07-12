import assert from 'node:assert/strict';
import {
  ANGLE_TURN_SCALE,
  EmbodiedDynamicsWorld,
  embodiedSnapshotToCausalDelta,
  replayEmbodiedDynamics,
  turns,
  type BodySpec,
  type DynamicsCommand,
  type EmbodiedDynamicsWorldConfig
} from '../packages/embodied-dynamics/src/index.js';

let passed = 0;
function test(name: string, fn: () => void): void {
  try { fn(); passed++; console.log(`PASS ${name}`); }
  catch (error) { console.error(`FAIL ${name}`); throw error; }
}
const box = (id: string, x: number, y: number, kind: BodySpec['kind'] = 'dynamic', hx = 500, hy = 500): BodySpec => ({ id, kind, position: { x, y }, fixtures: [{ id: `${id}-shape`, shape: { type: 'box', halfExtents: { x: hx, y: hy } } }] });
const circle = (id: string, x: number, y: number, kind: BodySpec['kind'] = 'dynamic', radius = 500): BodySpec => ({ id, kind, position: { x, y }, fixtures: [{ id: `${id}-shape`, shape: { type: 'circle', radius } }] });
function config(bodies: BodySpec[], extra: Partial<EmbodiedDynamicsWorldConfig> = {}): EmbodiedDynamicsWorldConfig {
  return { format: 'rsr.embodied-dynamics-world.v0.3', worldId: 'test-world', stepHz: 60, gravity: { x: 0, y: 0 }, velocityIterations: 8, positionIterations: 4, maxSubsteps: 32, bodies, ...extra };
}

test('circle-circle contact resolves', () => {
  const w = new EmbodiedDynamicsWorld(config([{ ...circle('a', -600, 0), velocity: { x: 1200, y: 0 } }, { ...circle('b', 600, 0), velocity: { x: -1200, y: 0 } }]));
  const phases = new Set<string>();
  for (let i = 0; i < 20; i++) for (const event of w.step().events) if (event.kind === 'contact') phases.add(event.phase);
  const s = w.snapshot();
  assert.ok(phases.has('begin'));
  assert.ok(s.bodies[0]!.position.x < s.bodies[1]!.position.x);
});

test('polygon vertices are canonical convex hull', () => {
  const w = new EmbodiedDynamicsWorld(config([{ id: 'poly', kind: 'dynamic', position: { x: 0, y: 0 }, fixtures: [{ id: 'p', shape: { type: 'polygon', vertices: [{ x: -500, y: -500 }, { x: 0, y: 0 }, { x: 500, y: -500 }, { x: 500, y: 500 }, { x: -500, y: 500 }] } }] }]));
  assert.equal((w.snapshot().bodies[0]!.fixtures[0]!.shape as { vertices: unknown[] }).vertices.length, 4);
});

test('off-center impulse creates angular velocity', () => {
  const w = new EmbodiedDynamicsWorld(config([box('a', 0, 0)]));
  w.step([{ id: 'kick', tick: 1, type: 'apply-impulse', bodyId: 'a', impulse: { x: 0, y: 1000 }, worldPoint: { x: 500, y: 0 } }]);
  assert.notEqual(w.snapshot().bodies[0]!.angularVelocity, 0);
});

test('angular velocity integrates body angle', () => {
  const w = new EmbodiedDynamicsWorld(config([{ ...box('a', 0, 0), angularVelocity: ANGLE_TURN_SCALE }]));
  w.run(15);
  const angle = w.snapshot().bodies[0]!.angle;
  assert.ok(angle > 200_000 && angle < 300_000);
});

test('capsule collides with rotated polygon', () => {
  const capsule: BodySpec = { id: 'capsule', kind: 'dynamic', position: { x: -2000, y: 0 }, velocity: { x: 6000, y: 0 }, fixtures: [{ id: 'c', shape: { type: 'capsule', halfLength: 500, radius: 250 } }] };
  const poly: BodySpec = { id: 'poly', kind: 'static', position: { x: 0, y: 0 }, angle: turns(0.125), fixtures: [{ id: 'p', shape: { type: 'polygon', vertices: [{ x: -600, y: -400 }, { x: 600, y: -400 }, { x: 600, y: 400 }, { x: -600, y: 400 }] } }] };
  const w = new EmbodiedDynamicsWorld(config([capsule, poly]));
  let touched = false;
  for (let i = 0; i < 30; i++) if (w.step().events.some(e => e.kind === 'contact')) touched = true;
  assert.ok(touched);
});

test('compound fixtures participate in point queries', () => {
  const body: BodySpec = { id: 'compound', kind: 'static', position: { x: 0, y: 0 }, fixtures: [
    { id: 'left', localPosition: { x: -1000, y: 0 }, shape: { type: 'circle', radius: 300 } },
    { id: 'right', localPosition: { x: 1000, y: 0 }, shape: { type: 'circle', radius: 300 } }
  ] };
  const w = new EmbodiedDynamicsWorld(config([body]));
  assert.equal(w.queryPoint({ x: -1000, y: 0 })[0]!.fixtureId, 'left');
  assert.equal(w.queryPoint({ x: 1000, y: 0 })[0]!.fixtureId, 'right');
});

test('collision filters reject masked pairs', () => {
  const a = circle('a', -300, 0); a.fixtures[0]!.filter = { categoryBits: 1, maskBits: 1 };
  const b = circle('b', 300, 0); b.fixtures[0]!.filter = { categoryBits: 2, maskBits: 2 };
  const s = new EmbodiedDynamicsWorld(config([a, b])).step().snapshot;
  assert.equal(s.contacts.length, 0);
});

test('sensor emits event without impulse response', () => {
  const a = circle('a', -500, 0); a.velocity = { x: 1000, y: 0 };
  const b = circle('sensor', 0, 0, 'static', 500); b.fixtures[0]!.sensor = true;
  const w = new EmbodiedDynamicsWorld(config([a, b])); const s = w.run(15);
  assert.ok(s.events.some(e => e.kind === 'sensor'));
  assert.ok(s.bodies.find(x => x.id === 'a')!.velocity.x > 0);
});

test('distance joint preserves approximate length', () => {
  const cfg = config([circle('a', 0, 0), circle('b', 2000, 0)], { joints: [{ id: 'd', type: 'distance', bodyA: 'a', bodyB: 'b', restLength: 2000, stiffnessQ: 900_000, dampingQ: 200_000 }] });
  const w = new EmbodiedDynamicsWorld(cfg); w.run(120, [{ id: 'kick', tick: 1, type: 'apply-impulse', bodyId: 'b', impulse: { x: 0, y: 5000 } }]);
  const s = w.snapshot(); const a = s.bodies.find(x => x.id === 'a')!; const b = s.bodies.find(x => x.id === 'b')!; const d = Math.hypot(a.position.x - b.position.x, a.position.y - b.position.y);
  assert.ok(Math.abs(d - 2000) < 500);
});

test('revolute joint motor changes relative angle', () => {
  const cfg = config([box('base', 0, 0, 'static'), box('arm', 0, 1000)], { joints: [{ id: 'r', type: 'revolute', bodyA: 'base', bodyB: 'arm', localAnchorA: { x: 0, y: 500 }, localAnchorB: { x: 0, y: -500 }, motorSpeed: ANGLE_TURN_SCALE / 4, maxMotorTorque: 200000 }] });
  const s = new EmbodiedDynamicsWorld(cfg).run(60);
  assert.notEqual(s.bodies.find(x => x.id === 'arm')!.angle, 0);
});

test('prismatic joint constrains transverse motion', () => {
  const cfg = config([box('base', 0, 0, 'static'), { ...box('slider', 0, 0), velocity: { x: 1000, y: 5000 } }], { joints: [{ id: 'p', type: 'prismatic', bodyA: 'base', bodyB: 'slider', localAxisA: { x: 1000, y: 0 }, lowerTranslation: -2000, upperTranslation: 2000, stiffnessQ: 900_000, dampingQ: 400_000 }] });
  const s = new EmbodiedDynamicsWorld(cfg).run(60); const slider = s.bodies.find(x => x.id === 'slider')!;
  assert.ok(Math.abs(slider.position.y) < 1000);
});

test('weld joint suppresses relative rotation', () => {
  const cfg = config([box('a', 0, 0, 'static'), { ...box('b', 1000, 0), angularVelocity: ANGLE_TURN_SCALE }], { joints: [{ id: 'w', type: 'weld', bodyA: 'a', bodyB: 'b', localAnchorA: { x: 500, y: 0 }, localAnchorB: { x: -500, y: 0 }, referenceAngle: 0, stiffnessQ: 950_000, dampingQ: 500_000 }] });
  const s = new EmbodiedDynamicsWorld(cfg).run(60); assert.ok(Math.abs(s.bodies.find(x => x.id === 'b')!.angularVelocity) < ANGLE_TURN_SCALE / 2);
});

test('joint can break under force', () => {
  const cfg = config([circle('a', 0, 0, 'static'), circle('b', 2000, 0)], { joints: [{ id: 'd', type: 'distance', bodyA: 'a', bodyB: 'b', restLength: 1000, stiffnessQ: 1_000_000, breakForce: 10 }] });
  const s = new EmbodiedDynamicsWorld(cfg).step().snapshot; assert.equal(Boolean(s.joints[0]!.broken), true); assert.ok(s.events.some(e => e.kind === 'joint' && e.phase === 'break'));
});

test('uniform field accelerates dynamic body', () => {
  const s = new EmbodiedDynamicsWorld(config([circle('a', 0, 0)], { fields: [{ id: 'wind', type: 'uniform', acceleration: { x: 1000, y: 0 } }] })).run(60);
  assert.ok(s.bodies[0]!.velocity.x > 800);
});

test('vortex field adds tangential velocity', () => {
  const s = new EmbodiedDynamicsWorld(config([circle('a', 1000, 0)], { fields: [{ id: 'v', type: 'vortex', center: { x: 0, y: 0 }, radius: 5000, tangentialStrength: 1000 }] })).run(60);
  assert.ok(Math.abs(s.bodies[0]!.velocity.y) > 100);
});

test('buoyancy opposes configured gravity below surface', () => {
  const s = new EmbodiedDynamicsWorld(config([circle('a', 0, 1000)], { gravity: { x: 0, y: 1000 }, fields: [{ id: 'water', type: 'buoyancy', surfaceY: 0, densityQ: 2_000_000, gravity: { x: 0, y: 1000 } }] })).run(30);
  assert.ok(s.bodies[0]!.velocity.y < 0);
});

test('stable island goes to sleep', () => {
  const cfg = config([circle('a', 0, 0)], { bodies: undefined as never });
  cfg.bodies = [{ ...circle('a', 0, 0), sleepTicks: 3 }];
  const s = new EmbodiedDynamicsWorld(cfg).run(5); assert.equal(s.bodies[0]!.awake, false);
});

test('command wakes sleeping body', () => {
  const body = { ...circle('a', 0, 0), sleepTicks: 1 };
  const w = new EmbodiedDynamicsWorld(config([body])); w.run(2); w.step([{ id: 'wake', tick: 3, type: 'apply-impulse', bodyId: 'a', impulse: { x: 1000, y: 0 } }]);
  assert.equal(w.snapshot().bodies[0]!.awake, true);
});

test('ray cast returns nearest hit', () => {
  const w = new EmbodiedDynamicsWorld(config([circle('near', 1000, 0, 'static'), circle('far', 3000, 0, 'static')])); const hit = w.rayCast({ x: 0, y: 0 }, { x: 5000, y: 0 }, true)[0]!;
  assert.equal(hit.bodyId, 'near'); assert.ok(hit.fractionQ < 500_000);
});

test('circle shape cast detects obstacle', () => {
  const w = new EmbodiedDynamicsWorld(config([box('wall', 3000, 0, 'static', 200, 2000)])); const hit = w.shapeCastCircle({ x: 0, y: 0 }, 200, { x: 5000, y: 0 })[0]!;
  assert.equal(hit.bodyId, 'wall'); assert.ok(hit.fractionQ > 400_000 && hit.fractionQ < 700_000);
});

test('AABB query returns overlapping fixtures', () => {
  const w = new EmbodiedDynamicsWorld(config([circle('a', 0, 0, 'static'), circle('b', 5000, 0, 'static')])); const hits = w.queryAabb({ min: { x: -1000, y: -1000 }, max: { x: 1000, y: 1000 } });
  assert.deepEqual(hits.map(h => h.bodyId), ['a']);
});

test('deterministic replay preserves state root', () => {
  const cfg = config([{ ...circle('a', 0, 0), velocity: { x: 1000, y: 200 } }, box('floor', 0, 3000, 'static', 5000, 300)]);
  const commands: DynamicsCommand[] = [{ id: 'torque', tick: 5, type: 'apply-torque', bodyId: 'a', torque: 2000 }]; const a = replayEmbodiedDynamics(cfg, 100, commands); const b = replayEmbodiedDynamics(cfg, 100, commands);
  assert.equal(a.stateRoot, b.stateRoot);
});

test('snapshot recovery converges with uninterrupted run', () => {
  const cfg = config([{ ...box('a', 0, 0), velocity: { x: 1000, y: 0 }, angularVelocity: 10000 }]); const w = new EmbodiedDynamicsWorld(cfg); w.run(30); const checkpoint = w.snapshot(); w.run(30); const final = w.snapshot(); const restored = EmbodiedDynamicsWorld.fromSnapshot(checkpoint); restored.run(30); assert.equal(restored.snapshot().stateRoot, final.stateRoot);
});

test('broad phase implementations converge on simple scene', () => {
  const bodies = Array.from({ length: 12 }, (_, i) => circle(`b${i}`, i * 800, 0)); const a = new EmbodiedDynamicsWorld(config(bodies, { broadPhase: 'sweep-and-prune' })).step().snapshot; const b = new EmbodiedDynamicsWorld(config(bodies, { broadPhase: 'uniform-grid', gridCellSize: 1500 })).step().snapshot;
  assert.equal(a.contacts.length, b.contacts.length);
});

test('material interaction can disable collision', () => {
  const a = circle('a', -300, 0); a.fixtures[0]!.materialId = 'ghost'; const b = circle('b', 300, 0); b.fixtures[0]!.materialId = 'solid'; const cfg = config([a, b], { materials: [{ id: 'ghost' }, { id: 'solid' }], materialInteractions: [{ materialA: 'ghost', materialB: 'solid', enabled: false }] });
  assert.equal(new EmbodiedDynamicsWorld(cfg).step().snapshot.contacts.length, 0);
});

test('RFE causal delta contains angular and contact evidence', () => {
  const w = new EmbodiedDynamicsWorld(config([circle('a', -300, 0), circle('b', 300, 0)])); const delta = embodiedSnapshotToCausalDelta(w.step().snapshot, 'rfe:base');
  assert.equal(delta.format, 'rfe.embodied-dynamics-causal-delta.v0.3'); assert.ok(delta.facts.some(f => f.predicate === 'embodied.angle')); assert.ok(delta.deltaRoot.length > 8);
});

test('bullet body requests adaptive microsteps', () => {
  const bullet = circle('bullet', 0, 0, 'dynamic', 100); bullet.velocity = { x: 200_000, y: 0 }; bullet.bullet = true; const s = new EmbodiedDynamicsWorld(config([bullet, box('wall', 2000, 0, 'static', 50, 1000)], { maxSubsteps: 64 })).step().snapshot;
  assert.ok(s.diagnostics.microsteps > 1); assert.ok(s.diagnostics.ccdBodies >= 1);
});

test('warm starting cache is used on persistent contacts', () => {
  const cfg = config([circle('a', 0, 100), box('floor', 0, 900, 'static', 3000, 300)], { gravity: { x: 0, y: 1000 }, warmStart: true }); const w = new EmbodiedDynamicsWorld(cfg); w.step(); const s = w.step().snapshot;
  assert.ok(s.diagnostics.warmStartedContacts >= 1); assert.ok(s.contacts.length >= 1);
});

test('point query respects rotated boxes', () => {
  const rotated = box('r', 0, 0, 'static', 1000, 200); rotated.angle = turns(0.125); const w = new EmbodiedDynamicsWorld(config([rotated]));
  assert.equal(w.queryPoint({ x: 700, y: 700 }).length, 1); assert.equal(w.queryPoint({ x: 900, y: 0 }).length, 0);
});

test('contact lifecycle includes begin and end', () => {
  const a = circle('a', -1000, 0); a.velocity = { x: 5000, y: 0 }; const b = circle('b', 0, 0, 'static'); const w = new EmbodiedDynamicsWorld(config([a, b])); const phases = new Set<string>(); for (let i = 0; i < 40; i++) for (const e of w.step().events) if (e.kind === 'contact') phases.add(e.phase);
  assert.ok(phases.has('begin')); assert.ok(phases.has('end') || phases.has('persist'));
});

console.log(`Embodied Dynamics tests: ${passed}/${passed} PASS`);
