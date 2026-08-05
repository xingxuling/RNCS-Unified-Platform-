import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  authorityProjectionInvariant,
  canonicalJson,
  compareUtf8,
  composeBodyMapTransform,
  createWorldBodyIR,
  deriveRenderGraphBarriers,
  normalizeQuaternion,
  quaternionEquivalent,
  quaternionFromEulerMilliDegrees,
  sealRenderGraph,
  validateRenderGraph,
  verifyWorldBodyIR,
} from '../src/index.mjs';
import { minimalWorldBodyInput, minimalWorldBodyIR } from '../examples/minimal-world-body.mjs';

function inputClone() {
  return structuredClone(minimalWorldBodyInput);
}

function expectCode(action, code) {
  assert.throws(action, error => error?.code === code, `expected ${code}`);
}

test('portable schema is valid JSON and names all seven root objects', () => {
  const schemaPath = fileURLToPath(new URL('../schemas/world-body-ir.v0.1.schema.json', import.meta.url));
  const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
  for (const key of [
    'authorityState',
    'physicalBodyState',
    'visualBodyState',
    'temporalPresentationState',
    'assetState',
    'observerState',
    'worldEventState',
  ]) assert.ok(schema.required.includes(key));
});

test('minimal World Body IR seals and verifies every component root', () => {
  const result = verifyWorldBodyIR(minimalWorldBodyIR);
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  assert.match(minimalWorldBodyIR.roots.worldBodyRoot, /^[a-f0-9]{64}$/);
  assert.equal(Object.keys(minimalWorldBodyIR.roots).length, 10);
});

test('unordered declaration collections normalize to one world root', () => {
  const reversed = inputClone();
  reversed.authorityState.capabilityScopes.reverse();
  reversed.observerState.observers[0].capabilities.reverse();
  reversed.worldEventState.events[0].routes.reverse();
  reversed.renderGraphs[0].resources.reverse();
  reversed.renderGraphs[0].passes.reverse();
  const second = createWorldBodyIR(reversed);
  assert.equal(second.roots.worldBodyRoot, minimalWorldBodyIR.roots.worldBodyRoot);
  assert.equal(canonicalJson(second), canonicalJson(minimalWorldBodyIR));
});

test('authority tampering is rejected by component and world roots', () => {
  const tampered = structuredClone(minimalWorldBodyIR);
  tampered.authorityState.revision += 1;
  const result = verifyWorldBodyIR(tampered);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some(error => error.code === 'WBIR_AUTHORITY_REVISION_MISMATCH'));
  assert.ok(result.errors.some(error => error.code === 'WBIR_COMPONENT_ROOT_MISMATCH'));
});

test('authority identity, scopes, and candidate commit boundary fail closed', () => {
  const missingOwner = inputClone();
  delete missingOwner.authorityState.authorityOwner;
  expectCode(() => createWorldBodyIR(missingOwner), 'WBIR_ID_INVALID');
  const duplicateScope = inputClone();
  duplicateScope.authorityState.capabilityScopes.push(duplicateScope.authorityState.capabilityScopes[0]);
  expectCode(() => createWorldBodyIR(duplicateScope), 'WBIR_AUTHORITY_SCOPE_DUPLICATE');
  const candidateCommit = inputClone();
  candidateCommit.authorityState.authorityClass = 'candidate';
  candidateCommit.authorityState.commitRoot = '1'.repeat(64);
  expectCode(() => createWorldBodyIR(candidateCommit), 'WBIR_CANDIDATE_COMMIT_ROOT_FORBIDDEN');
});

test('visual-only offset cannot mutate authority or physical roots', () => {
  const changed = inputClone();
  changed.bodyMaps[0].visualOnlyOffset.positionMm.y -= 25;
  const projected = createWorldBodyIR(changed);
  const invariant = authorityProjectionInvariant(minimalWorldBodyIR, projected);
  assert.equal(invariant.ok, true);
  assert.equal(projected.roots.authorityStateRoot, minimalWorldBodyIR.roots.authorityStateRoot);
  assert.equal(projected.roots.physicalBodyRoot, minimalWorldBodyIR.roots.physicalBodyRoot);
  assert.notEqual(projected.roots.bodyMapRoot, minimalWorldBodyIR.roots.bodyMapRoot);
  assert.notEqual(projected.roots.worldBodyRoot, minimalWorldBodyIR.roots.worldBodyRoot);
});

test('quaternion q and -q normalize to one canonical representative', () => {
  const positive = normalizeQuaternion({ x: 0, y: 1, z: 0, w: 1 });
  const negative = normalizeQuaternion({ x: 0, y: -1, z: 0, w: -1 });
  assert.deepEqual(positive, negative);
  assert.equal(quaternionEquivalent(positive, { ...positive, x: -positive.x, y: -positive.y, z: -positive.z, w: -positive.w }), true);
});

test('non-normalized fixed-point quaternion fails closed', () => {
  const input = inputClone();
  input.physicalBodyState.bodies[0].transform.rotation = { x: 0, y: 0, z: 0, w: 500_000, scale: 1_000_000 };
  expectCode(() => createWorldBodyIR(input), 'WBIR_QUATERNION_NOT_NORMALIZED');
});

test('dynamic body requires positive mass', () => {
  const input = inputClone();
  input.physicalBodyState.bodies[0].massGrams = 0;
  expectCode(() => createWorldBodyIR(input), 'WBIR_DYNAMIC_MASS_INVALID');
});

test('physical values must remain losslessly representable by the RSR boundary', () => {
  const massOverflow = inputClone();
  massOverflow.physicalBodyState.bodies[0].massGrams = Math.floor(Number.MAX_SAFE_INTEGER / 1000) + 1;
  expectCode(() => createWorldBodyIR(massOverflow), 'WBIR_DYNAMIC_MASS_INVALID');
  const bitOverflow = inputClone();
  bitOverflow.physicalBodyState.bodies[0].fixtures[0].collisionFilter.maskBits = 0x1_0000_0000;
  expectCode(() => createWorldBodyIR(bitOverflow), 'WBIR_COLLISION_FILTER_INVALID');
});

test('authoritative BodyMap requires an existing physical body', () => {
  const input = inputClone();
  input.bodyMaps[0].physicalBodyRef = 'body:missing';
  expectCode(() => createWorldBodyIR(input), 'WBIR_BODY_MAP_PHYSICAL_MISSING');
});

test('presentation-only BodyMap cannot claim authority physics', () => {
  const input = inputClone();
  input.bodyMaps[0].authorityMode = 'presentation-only';
  expectCode(() => createWorldBodyIR(input), 'WBIR_PRESENTATION_ONLY_PHYSICAL_FORBIDDEN');
});

test('BodyMap is total over every declared physical and visual body', () => {
  const physicalUnbound = inputClone();
  physicalUnbound.bodyMaps = physicalUnbound.bodyMaps.filter(map => map.physicalBodyRef !== 'body:floor');
  expectCode(() => createWorldBodyIR(physicalUnbound), 'WBIR_BODY_MAP_PHYSICAL_UNBOUND');
  const visualUnbound = inputClone();
  visualUnbound.bodyMaps = visualUnbound.bodyMaps.filter(map => map.visualBodyRef !== 'visual:floor');
  visualUnbound.physicalBodyState.bodies = visualUnbound.physicalBodyState.bodies.filter(body => body.id !== 'body:floor');
  expectCode(() => createWorldBodyIR(visualUnbound), 'WBIR_BODY_MAP_VISUAL_UNBOUND');
});

test('visual-only offset must explicitly deny authority effects', () => {
  const input = inputClone();
  delete input.bodyMaps[0].visualOnlyOffset.authorityAffecting;
  expectCode(() => createWorldBodyIR(input), 'WBIR_VISUAL_OFFSET_AUTHORITY_FORBIDDEN');
});

test('observer capability cannot grant write or commit authority', () => {
  const input = inputClone();
  input.observerState.observers[0].capabilities.push('world.commit');
  expectCode(() => createWorldBodyIR(input), 'WBIR_OBSERVER_AUTHORITY_FORBIDDEN');
});

test('event must bind the current authority source root', () => {
  const input = inputClone();
  input.worldEventState.events[0].sourceAuthorityRoot = '0'.repeat(64);
  expectCode(() => createWorldBodyIR(input), 'WBIR_EVENT_AUTHORITY_ROOT_MISMATCH');
});

test('event exactly-once key is unique across the event root', () => {
  const input = inputClone();
  input.worldEventState.events.push({
    ...structuredClone(input.worldEventState.events[0]),
    id: 'event:hero-contact:12:1',
    sequence: 1,
  });
  expectCode(() => createWorldBodyIR(input), 'WBIR_EVENT_ONCE_KEY_DUPLICATE');
});

test('visual node hierarchy cycles are rejected', () => {
  const input = inputClone();
  input.visualBodyState.bodies[0].nodes.push(
    { id: 'node:child-a', parentId: 'node:child-b' },
    { id: 'node:child-b', parentId: 'node:child-a' },
  );
  expectCode(() => createWorldBodyIR(input), 'WBIR_VISUAL_HIERARCHY_CYCLE');
});

test('visual node identity is global and every node is rooted', () => {
  const disconnected = inputClone();
  disconnected.visualBodyState.bodies[0].nodes.push({ id: 'node:orphan', parentId: null });
  expectCode(() => createWorldBodyIR(disconnected), 'WBIR_VISUAL_NODE_DISCONNECTED');
  const duplicate = inputClone();
  duplicate.visualBodyState.bodies[1].nodes[0].id = 'node:hero';
  duplicate.visualBodyState.bodies[1].rootNodeId = 'node:hero';
  expectCode(() => createWorldBodyIR(duplicate), 'WBIR_VISUAL_NODE_GLOBAL_DUPLICATE');
});

test('visual material references must resolve to material assets', () => {
  const input = inputClone();
  input.visualBodyState.bodies[0].nodes[0].materialRef = 'asset:hero-mesh';
  expectCode(() => createWorldBodyIR(input), 'WBIR_VISUAL_MATERIAL_MISSING');
});

test('temporal policy bounds and observer quality are explicit', () => {
  const temporal = inputClone();
  delete temporal.temporalPresentationState.policies[0].snapDistanceMm;
  expectCode(() => createWorldBodyIR(temporal), 'WBIR_NONNEGATIVE_INTEGER_REQUIRED');
  const observer = inputClone();
  observer.observerState.observers[0].qualityTier = 'unbounded';
  expectCode(() => createWorldBodyIR(observer), 'WBIR_OBSERVER_QUALITY_TIER_INVALID');
});

test('event kinds and route targets use safe identifiers', () => {
  const input = inputClone();
  input.worldEventState.events[0].routes[0].target = '../authority';
  expectCode(() => createWorldBodyIR(input), 'WBIR_ID_INVALID');
});

test('render graph dependency cycle is rejected', () => {
  const graph = structuredClone(minimalWorldBodyInput.renderGraphs[0]);
  graph.passes[0].dependsOn = ['pass:main'];
  expectCode(() => sealRenderGraph(graph), 'WBIR_GRAPH_CYCLE');
});

test('render graph structure rejects unsafe ids, resource kinds, and non-array dependencies', () => {
  const unsafe = structuredClone(minimalWorldBodyInput.renderGraphs[0]);
  unsafe.resources[0].id = '../depth';
  expectCode(() => sealRenderGraph(unsafe), 'WBIR_GRAPH_ID_REQUIRED');
  const kind = structuredClone(minimalWorldBodyInput.renderGraphs[0]);
  kind.resources[0].kind = 'magic-memory';
  expectCode(() => sealRenderGraph(kind), 'WBIR_GRAPH_RESOURCE_KIND_INVALID');
  const dependencies = structuredClone(minimalWorldBodyInput.renderGraphs[0]);
  dependencies.passes[0].dependsOn = 'pass:main';
  expectCode(() => sealRenderGraph(dependencies), 'WBIR_GRAPH_DEPENDENCIES_REQUIRED');
});

test('render graph complexity is bounded before transitive hazard analysis', () => {
  const graph = {
    id: 'render-graph:oversized',
    resources: [],
    passes: Array.from({ length: 1025 }, (_, index) => ({
      id: `pass:${index}`,
      kind: 'empty',
      queue: 'graphics',
      dependsOn: [],
      reads: [],
      writes: [],
    })),
  };
  expectCode(() => sealRenderGraph(graph), 'WBIR_GRAPH_PASS_LIMIT');
});

test('render graph read before import or ordered write is rejected', () => {
  const graph = {
    id: 'render-graph:read-before-write',
    resources: [{ id: 'resource:a', kind: 'texture', lifetime: 'transient', imported: false, exported: false }],
    passes: [{ id: 'pass:read', kind: 'sample', queue: 'graphics', dependsOn: [], reads: [{ resourceId: 'resource:a', access: 'sampled' }], writes: [] }],
  };
  expectCode(() => sealRenderGraph(graph), 'WBIR_GRAPH_READ_BEFORE_WRITE');
});

test('render graph unordered write hazard is rejected', () => {
  const graph = {
    id: 'render-graph:write-conflict',
    resources: [{ id: 'resource:a', kind: 'texture', lifetime: 'transient', imported: false, exported: false }],
    passes: [
      { id: 'pass:a', kind: 'write', queue: 'graphics', dependsOn: [], reads: [], writes: [{ resourceId: 'resource:a', access: 'color-attachment' }] },
      { id: 'pass:b', kind: 'write', queue: 'graphics', dependsOn: [], reads: [], writes: [{ resourceId: 'resource:a', access: 'color-attachment' }] },
    ],
  };
  expectCode(() => sealRenderGraph(graph), 'WBIR_GRAPH_UNORDERED_HAZARD');
});

test('render graph validator rejects a missing generated barrier', () => {
  const graph = structuredClone(minimalWorldBodyIR.renderGraphs[0]);
  graph.barriers = [];
  const result = validateRenderGraph(graph);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some(error => error.code === 'WBIR_GRAPH_BARRIER_MISSING'));
});

test('transient alias resources require disjoint dependency-ordered lifetimes', () => {
  const graph = {
    id: 'render-graph:alias-overlap',
    resources: [
      { id: 'resource:a', kind: 'texture', lifetime: 'transient', aliasGroup: 'alias:one', imported: false, exported: false },
      { id: 'resource:b', kind: 'texture', lifetime: 'transient', aliasGroup: 'alias:one', imported: false, exported: false },
    ],
    passes: [
      { id: 'pass:a', kind: 'write', queue: 'graphics', dependsOn: [], reads: [], writes: [{ resourceId: 'resource:a', access: 'color-attachment' }] },
      { id: 'pass:b', kind: 'write', queue: 'graphics', dependsOn: [], reads: [], writes: [{ resourceId: 'resource:b', access: 'color-attachment' }] },
    ],
  };
  expectCode(() => sealRenderGraph(graph), 'WBIR_GRAPH_ALIAS_LIFETIME_OVERLAP');
});

test('render graph derives the required depth-to-main barrier', () => {
  const graph = structuredClone(minimalWorldBodyInput.renderGraphs[0]);
  graph.format = 'taowind.world-body-render-graph.v0.1';
  const barriers = deriveRenderGraphBarriers(graph);
  assert.equal(barriers.length, 1);
  assert.equal(barriers[0].fromPassId, 'pass:depth');
  assert.equal(barriers[0].toPassId, 'pass:main');
});

test('canonical core rejects floating JSON numbers', () => {
  expectCode(() => canonicalJson({ value: 0.5 }), 'WBIR_CANONICAL_NUMBER_INVALID');
});

test('semantic collection ordering uses portable UTF-8 byte order', () => {
  assert.deepEqual(['a', '_', 'Z', '-'].sort(compareUtf8), ['-', 'Z', '_', 'a']);
});

test('world root tampering is rejected', () => {
  const tampered = structuredClone(minimalWorldBodyIR);
  tampered.roots.worldBodyRoot = '0'.repeat(64);
  const result = verifyWorldBodyIR(tampered);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some(error => error.code === 'WBIR_WORLD_ROOT_MISMATCH'));
});

test('BodyMap transform composes physical pose and visual-only offset', () => {
  const rotation = quaternionFromEulerMilliDegrees({ x: 0, y: 0, z: 0 });
  const result = composeBodyMapTransform(
    { positionMm: { x: 100, y: 200, z: 300 }, rotation },
    { positionMm: { x: 10, y: -20, z: 30 }, rotation, scale: { x: 1_000_000, y: 1_000_000, z: 1_000_000, scale: 1_000_000 } },
  );
  assert.deepEqual(result.positionMm, { x: 110, y: 180, z: 330 });
  assert.equal(quaternionEquivalent(result.rotation, rotation), true);
});

test('path-traversal identifiers are rejected before code generation', () => {
  const input = inputClone();
  input.worldId = '../escape';
  expectCode(() => createWorldBodyIR(input), 'WBIR_ID_INVALID');
});

test('equivalent render graph declaration order has one graph root', () => {
  const first = sealRenderGraph(minimalWorldBodyInput.renderGraphs[0]);
  const reordered = structuredClone(minimalWorldBodyInput.renderGraphs[0]);
  reordered.resources.reverse();
  reordered.passes.reverse();
  const second = sealRenderGraph(reordered);
  assert.equal(first.graphRoot, second.graphRoot);
  assert.deepEqual(first, second);
});
