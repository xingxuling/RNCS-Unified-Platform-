import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  ConstraintCausalPhysicsWorld,
  constraintSnapshotToCausalDelta,
  replayConstraintPhysics,
  type ConstraintPhysicsCommand,
  type ConstraintPhysicsWorldConfig
} from '../packages/constraint-physics/src/index.js';
import {
  ConstraintPhysicsVSRBridge,
  createConstraintPhysicsObserverProfile,
  createConstraintPhysicsVisualDocument,
  constraintSnapshotToRuntimeOverrides
} from '../packages/constraint-physics-vsr/src/index.js';
import { evaluateAt } from '../packages/core/src/index.js';
import { documentHash, validateDocument } from '../packages/spec/src/index.js';

const tests: Array<{ name: string; fn: () => void }> = [];
const test = (name: string, fn: () => void) => tests.push({ name, fn });
const playground = JSON.parse(readFileSync('examples/constraint-physics/constraint-playground.world.json', 'utf8')) as ConstraintPhysicsWorldConfig;

function simpleWorld(bodies: ConstraintPhysicsWorldConfig['bodies'], extra: Partial<ConstraintPhysicsWorldConfig> = {}): ConstraintPhysicsWorldConfig {
  return {
    format: 'rsr.constraint-world.v0.2',
    worldId: extra.worldId ?? 'test-world',
    scale: 1000,
    stepHz: 60,
    gravity: extra.gravity ?? { x: 0, y: 0 },
    solverIterations: extra.solverIterations ?? 6,
    gridCellSize: extra.gridCellSize ?? 32000,
    maxSubsteps: extra.maxSubsteps ?? 12,
    materials: extra.materials,
    materialInteractions: extra.materialInteractions,
    fields: extra.fields,
    constraints: extra.constraints,
    bodies
  };
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

test('mixed-shape replay is deterministic', () => {
  const a = replayConstraintPhysics(playground, 120);
  const b = replayConstraintPhysics(playground, 120);
  assert.equal(a.stateRoot, b.stateRoot);
  assert.deepEqual(a.bodies, b.bodies);
  assert.deepEqual(a.constraints, b.constraints);
});

test('deterministic microsteps prevent a fast circle tunnelling through a thin wall', () => {
  const config = simpleWorld([
    { id: 'ball', kind: 'dynamic', position: { x: 0, y: 0 }, shape: { type: 'circle', radius: 5000 }, velocity: { x: 2400000, y: 0 }, inverseMassQ: 1000, continuous: true, restitutionQ: 0 },
    { id: 'wall', kind: 'static', position: { x: 50000, y: 0 }, shape: { type: 'box', halfExtents: { x: 2000, y: 30000 } }, restitutionQ: 0 }
  ], { maxSubsteps: 16, gridCellSize: 16000 });
  const snapshot = replayConstraintPhysics(config, 2);
  const ball = snapshot.bodies.find(body => body.id === 'ball')!;
  assert.ok(snapshot.diagnostics.microsteps > 1);
  assert.ok(ball.position.x <= 43050, `ball passed wall: ${ball.position.x}`);
  assert.ok(snapshot.events.some(event => event.kind === 'contact'));
});

test('circle-circle contact produces a normalized fixed-point normal', () => {
  const config = simpleWorld([
    { id: 'a', kind: 'dynamic', position: { x: 0, y: 0 }, shape: { type: 'circle', radius: 10000 }, velocity: { x: 30000, y: 0 }, inverseMassQ: 1000 },
    { id: 'b', kind: 'dynamic', position: { x: 18000, y: 0 }, shape: { type: 'circle', radius: 10000 }, velocity: { x: -30000, y: 0 }, inverseMassQ: 1000 }
  ]);
  const snapshot = replayConstraintPhysics(config, 1);
  assert.equal(snapshot.contacts.length, 1);
  assert.ok(Math.abs(snapshot.contacts[0]!.normalQ.x) >= 990);
  assert.equal(snapshot.contacts[0]!.normalQ.y, 0);
});

test('box-circle contact is resolved without shape conversion', () => {
  const config = simpleWorld([
    { id: 'box', kind: 'static', position: { x: 0, y: 0 }, shape: { type: 'box', halfExtents: { x: 15000, y: 15000 } } },
    { id: 'circle', kind: 'dynamic', position: { x: 19000, y: 0 }, shape: { type: 'circle', radius: 7000 }, velocity: { x: -10000, y: 0 }, inverseMassQ: 1000 }
  ]);
  const snapshot = replayConstraintPhysics(config, 1);
  assert.equal(snapshot.contacts.length, 1);
  const circle = snapshot.bodies.find(body => body.id === 'circle')!;
  assert.ok(circle.position.x >= 21990, `circle was not separated: ${circle.position.x}`);
});

test('sensor overlap creates evidence but does not apply collision impulse', () => {
  const config = simpleWorld([
    { id: 'actor', kind: 'dynamic', position: { x: 0, y: 0 }, shape: { type: 'circle', radius: 8000 }, velocity: { x: 60000, y: 0 }, inverseMassQ: 1000, filter: { categoryBits: 2, maskBits: 4 } },
    { id: 'zone', kind: 'static', position: { x: 9000, y: 0 }, shape: { type: 'circle', radius: 12000 }, sensor: true, filter: { categoryBits: 4, maskBits: 2 } }
  ]);
  const snapshot = replayConstraintPhysics(config, 1);
  const actor = snapshot.bodies.find(body => body.id === 'actor')!;
  assert.equal(snapshot.contacts[0]!.sensor, true);
  assert.equal(snapshot.contacts[0]!.normalImpulse, 0);
  assert.equal(actor.velocity.x, 60000);
  assert.ok(snapshot.events.some(event => event.kind === 'sensor' && event.phase === 'begin'));
});

test('collision layers reject pairs before narrow phase', () => {
  const config = simpleWorld([
    { id: 'a', kind: 'dynamic', position: { x: 0, y: 0 }, shape: { type: 'circle', radius: 10000 }, inverseMassQ: 1000, filter: { categoryBits: 2, maskBits: 2 } },
    { id: 'b', kind: 'dynamic', position: { x: 5000, y: 0 }, shape: { type: 'circle', radius: 10000 }, inverseMassQ: 1000, filter: { categoryBits: 4, maskBits: 4 } }
  ]);
  const snapshot = replayConstraintPhysics(config, 1);
  assert.equal(snapshot.contacts.length, 0);
  assert.equal(snapshot.diagnostics.narrowPhaseTests, 0);
});

test('material interaction can convert a solid pair into a sensor-only relation', () => {
  const config = simpleWorld([
    { id: 'a', kind: 'dynamic', position: { x: 0, y: 0 }, shape: { type: 'circle', radius: 10000 }, velocity: { x: 10000, y: 0 }, inverseMassQ: 1000, materialId: 'ghost' },
    { id: 'b', kind: 'static', position: { x: 12000, y: 0 }, shape: { type: 'circle', radius: 10000 }, materialId: 'solid' }
  ], {
    materials: [{ id: 'ghost' }, { id: 'solid' }],
    materialInteractions: [{ materialA: 'ghost', materialB: 'solid', sensorOnly: true }]
  });
  const snapshot = replayConstraintPhysics(config, 1);
  assert.equal(snapshot.contacts[0]!.sensor, true);
  assert.equal(snapshot.bodies.find(body => body.id === 'a')!.velocity.x, 10000);
});

test('uniform and radial fields alter only matching embodiments', () => {
  const config = simpleWorld([
    { id: 'affected', kind: 'dynamic', position: { x: 0, y: 0 }, shape: { type: 'circle', radius: 5000 }, inverseMassQ: 1000, tags: ['wind', 'orb'] },
    { id: 'ignored', kind: 'dynamic', position: { x: 0, y: 50000 }, shape: { type: 'circle', radius: 5000 }, inverseMassQ: 1000, tags: ['heavy'] }
  ], {
    fields: [
      { id: 'wind', type: 'uniform', acceleration: { x: 60000, y: 0 }, tagsAny: ['wind'] },
      { id: 'well', type: 'radial', center: { x: 100000, y: 0 }, radius: 200000, strength: 120000, tagsAny: ['orb'] }
    ]
  });
  const snapshot = replayConstraintPhysics(config, 60);
  const affected = snapshot.bodies.find(body => body.id === 'affected')!;
  const ignored = snapshot.bodies.find(body => body.id === 'ignored')!;
  assert.ok(affected.velocity.x > 100000);
  assert.equal(ignored.velocity.x, 0);
});

test('kinematic embodiment moves independently and transfers motion to dynamic bodies', () => {
  const config = simpleWorld([
    { id: 'platform', kind: 'kinematic', position: { x: 0, y: 10000 }, shape: { type: 'box', halfExtents: { x: 30000, y: 5000 } }, velocity: { x: 60000, y: 0 } },
    { id: 'box', kind: 'dynamic', position: { x: 0, y: 0 }, shape: { type: 'box', halfExtents: { x: 5000, y: 5000 } }, inverseMassQ: 1000, frictionQ: 1000 }
  ], { gravity: { x: 0, y: 60000 } });
  const snapshot = replayConstraintPhysics(config, 30);
  const platform = snapshot.bodies.find(body => body.id === 'platform')!;
  const box = snapshot.bodies.find(body => body.id === 'box')!;
  assert.ok(platform.position.x > 0);
  assert.ok(box.position.x > -1000, `dynamic body moved unexpectedly: ${box.position.x}`);
});

test('distance constraint preserves a relation instead of hard-coding a joint class', () => {
  const config = simpleWorld([
    { id: 'anchor', kind: 'static', position: { x: 0, y: 0 }, shape: { type: 'circle', radius: 3000 } },
    { id: 'bob', kind: 'dynamic', position: { x: 40000, y: 0 }, shape: { type: 'circle', radius: 5000 }, velocity: { x: 0, y: 70000 }, inverseMassQ: 1000 }
  ], {
    gravity: { x: 0, y: 90000 },
    constraints: [{ id: 'link', type: 'distance', bodyA: 'anchor', bodyB: 'bob', restLength: 40000, stiffnessQ: 980, dampingQ: 300 }]
  });
  const snapshot = replayConstraintPhysics(config, 180);
  const anchor = snapshot.bodies.find(body => body.id === 'anchor')!;
  const bob = snapshot.bodies.find(body => body.id === 'bob')!;
  assert.ok(Math.abs(distance(anchor.position, bob.position) - 40000) < 2500);
  assert.equal(snapshot.constraints[0]!.broken, false);
});

test('breakable constraints emit a content-addressed break event', () => {
  const config = simpleWorld([
    { id: 'a', kind: 'static', position: { x: 0, y: 0 }, shape: { type: 'circle', radius: 1000 } },
    { id: 'b', kind: 'dynamic', position: { x: 90000, y: 0 }, shape: { type: 'circle', radius: 1000 }, inverseMassQ: 1000 }
  ], {
    constraints: [{ id: 'fragile', type: 'distance', bodyA: 'a', bodyB: 'b', restLength: 10000, stiffnessQ: 1000, dampingQ: 0, breakImpulse: 5000 }]
  });
  const snapshot = replayConstraintPhysics(config, 1);
  assert.equal(snapshot.constraints[0]!.broken, true);
  const event = snapshot.events.find(item => item.kind === 'constraint' && item.phase === 'break');
  assert.ok(event);
  assert.ok(event!.evidenceHash.startsWith('fnv1a64:'));
});

test('snapshot recovery remains bit-identical', () => {
  const world = new ConstraintCausalPhysicsWorld(playground);
  world.run(45);
  const checkpoint = world.snapshot();
  world.run(75);
  const expected = world.snapshot();
  const restored = ConstraintCausalPhysicsWorld.fromSnapshot(checkpoint);
  restored.run(75);
  assert.equal(restored.snapshot().stateRoot, expected.stateRoot);
});

test('commands are canonicalized by id and apply-force remains tick-local', () => {
  const config = simpleWorld([
    { id: 'body', kind: 'dynamic', position: { x: 0, y: 0 }, shape: { type: 'circle', radius: 5000 }, inverseMassQ: 1000 }
  ]);
  const commands: ConstraintPhysicsCommand[] = [
    { id: 'b', tick: 0, type: 'apply-force', bodyId: 'body', force: { x: 60000, y: 0 } },
    { id: 'a', tick: 0, type: 'apply-impulse', bodyId: 'body', impulse: { x: 12000, y: 0 } }
  ];
  const first = replayConstraintPhysics(config, 2, commands);
  const second = replayConstraintPhysics(config, 2, [...commands].reverse());
  assert.equal(first.stateRoot, second.stateRoot);
  assert.ok(first.bodies[0]!.velocity.x > 12000);
  assert.ok(first.bodies[0]!.velocity.x < 15000, `force leaked across ticks: ${first.bodies[0]!.velocity.x}`);
});

test('uniform-grid broad phase compresses sparse pair search', () => {
  const bodies: ConstraintPhysicsWorldConfig['bodies'] = [];
  for (let index = 0; index < 100; index++) {
    bodies.push({
      id: `body-${String(index).padStart(3, '0')}`,
      kind: 'dynamic',
      position: { x: index * 100000, y: 0 },
      shape: { type: 'circle', radius: 3000 },
      inverseMassQ: 1000
    });
  }
  const config = simpleWorld(bodies, { gridCellSize: 16000, solverIterations: 1 });
  const snapshot = replayConstraintPhysics(config, 1);
  const naivePairs = bodies.length * (bodies.length - 1) / 2;
  assert.ok(snapshot.diagnostics.candidatePairs < naivePairs / 20, `${snapshot.diagnostics.candidatePairs} vs ${naivePairs}`);
});

test('negative coordinates use stable spatial cells', () => {
  const config = simpleWorld([
    { id: 'a', kind: 'dynamic', position: { x: -12000, y: -12000 }, shape: { type: 'circle', radius: 10000 }, inverseMassQ: 1000 },
    { id: 'b', kind: 'static', position: { x: -5000, y: -12000 }, shape: { type: 'circle', radius: 10000 } }
  ], { gridCellSize: 8000 });
  const snapshot = replayConstraintPhysics(config, 1);
  assert.equal(snapshot.contacts.length, 1);
});

test('constraint islands are deterministic and exclude unrelated static bodies', () => {
  const config = simpleWorld([
    { id: 'a', kind: 'dynamic', position: { x: 0, y: 0 }, shape: { type: 'circle', radius: 5000 }, inverseMassQ: 1000 },
    { id: 'b', kind: 'dynamic', position: { x: 10000, y: 0 }, shape: { type: 'circle', radius: 5000 }, inverseMassQ: 1000 },
    { id: 'c', kind: 'dynamic', position: { x: 100000, y: 0 }, shape: { type: 'circle', radius: 5000 }, inverseMassQ: 1000 },
    { id: 'ground', kind: 'static', position: { x: 0, y: 50000 }, shape: { type: 'box', halfExtents: { x: 200000, y: 5000 } } }
  ], { constraints: [{ id: 'ab', type: 'distance', bodyA: 'a', bodyB: 'b', restLength: 10000 }] });
  const snapshot = replayConstraintPhysics(config, 1);
  assert.equal(snapshot.islands.length, 2);
  assert.ok(snapshot.islands.some(island => island.bodyIds.join(',') === 'a,b'));
  assert.ok(snapshot.islands.some(island => island.bodyIds.join(',') === 'c'));
});

test('RFE bridge emits provisional embodiment, constraint, interaction and diagnostic evidence', () => {
  const snapshot = replayConstraintPhysics(playground, 30);
  const delta = constraintSnapshotToCausalDelta(snapshot, 'rfe:test:root');
  assert.equal(delta.provisional, true);
  assert.equal(delta.simulationRoot, snapshot.stateRoot);
  assert.ok(delta.facts.some(fact => fact.predicate === 'simulation.embodiment-state'));
  assert.ok(delta.facts.some(fact => fact.predicate === 'simulation.constraint-state'));
  assert.equal(delta.diagnostics.microsteps, snapshot.diagnostics.microsteps);
  assert.ok(delta.deltaRoot.startsWith('fnv1a64:'));
});

test('stable Visual IR receives runtime motion without document rebuild', () => {
  const document = createConstraintPhysicsVisualDocument(playground);
  assert.equal(validateDocument(document).ok, true);
  const beforeHash = documentHash(document);
  const a = replayConstraintPhysics(playground, 1);
  const b = replayConstraintPhysics(playground, 60);
  const displayA = evaluateAt({ document, time: a.tick / a.stepHz, runtimeOverrides: constraintSnapshotToRuntimeOverrides(a) });
  const displayB = evaluateAt({ document, time: b.tick / b.stepHz, runtimeOverrides: constraintSnapshotToRuntimeOverrides(b) });
  assert.equal(displayA.displayState.documentHash, beforeHash);
  assert.equal(displayB.displayState.documentHash, beforeHash);
  assert.notEqual(displayA.displayState.semanticHash, displayB.displayState.semanticHash);
});

test('player and debugger projections share reality roots while exposing different affordances', () => {
  const snapshot = replayConstraintPhysics(playground, 35);
  const bridge = new ConstraintPhysicsVSRBridge(playground, { width: 720, height: 420 });
  const set = bridge.render(snapshot, [createConstraintPhysicsObserverProfile('player'), createConstraintPhysicsObserverProfile('debugger')]);
  assert.equal(set.verification.ok, true);
  const player = set.views.find(view => view.observer.observerId.endsWith(':player'))!;
  const debuggerView = set.views.find(view => view.observer.observerId.endsWith(':debugger'))!;
  assert.equal(player.projection.manifest.invariantHash, debuggerView.projection.manifest.invariantHash);
  assert.ok(player.projection.manifest.hiddenNodeIds.some(id => id.startsWith('constraint:')));
  assert.ok(debuggerView.projection.manifest.shownNodeIds.some(id => id.startsWith('constraint:')));
  assert.notEqual(player.projection.manifest.projectedDisplayHash, debuggerView.projection.manifest.projectedDisplayHash);
  assert.deepEqual([...player.png.slice(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
});

let passed = 0;
const started = performance.now();
for (const { name, fn } of tests) {
  try {
    fn();
    passed++;
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    console.error(error);
    process.exitCode = 1;
  }
}
console.log(`\n${passed}/${tests.length} constraint-physics tests passed in ${(performance.now() - started).toFixed(1)}ms.`);
if (passed !== tests.length) process.exitCode = 1;
