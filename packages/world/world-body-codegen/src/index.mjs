import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  canonicalClone,
  compareUtf8,
  createWorldBodyIR,
  quaternionFromEulerMilliDegrees,
  quaternionToEulerMilliDegrees,
  semanticHash,
  verifyWorldBodyIR,
} from '@taowind/world-body-ir';

export const WORLD_DECLARATION_FORMAT = 'taowind.world-declaration.v0.1';
export const WORLD_BODY_CODEGEN_VERSION = '0.1.0-alpha.1';
export const WORLD_BODY_CODEGEN_MANIFEST_FORMAT = 'taowind.world-body-codegen-manifest.v0.1';

const DEFAULT_ROTATION = Object.freeze({ x: 0, y: 0, z: 0 });
const DEFAULT_POSITION = Object.freeze({ x: 0, y: 0, z: 0 });
const DEFAULT_SCALE = Object.freeze({ x: 1_000_000, y: 1_000_000, z: 1_000_000, scale: 1_000_000 });

function requireDeclaration(declaration) {
  if (!declaration || declaration.format !== WORLD_DECLARATION_FORMAT) throw Object.assign(new Error('WORLD_BODY_DECLARATION_FORMAT_INVALID'), { code: 'WORLD_BODY_DECLARATION_FORMAT_INVALID' });
  if (declaration.declarationVersion !== WORLD_BODY_CODEGEN_VERSION) throw Object.assign(new Error('WORLD_BODY_DECLARATION_VERSION_INVALID'), { code: 'WORLD_BODY_DECLARATION_VERSION_INVALID' });
  if (!Array.isArray(declaration.entities) || declaration.entities.length === 0) throw Object.assign(new Error('WORLD_BODY_DECLARATION_ENTITIES_REQUIRED'), { code: 'WORLD_BODY_DECLARATION_ENTITIES_REQUIRED' });
  return declaration;
}

function rotation(value = DEFAULT_ROTATION) {
  return quaternionFromEulerMilliDegrees(value);
}

function fixtureFromDeclaration(fixture) {
  return canonicalClone({
    id: fixture.id,
    shape: fixture.shape,
    ...(fixture.localPositionMm === undefined ? {} : { localPositionMm: fixture.localPositionMm }),
    ...(fixture.sensor === undefined ? {} : { sensor: fixture.sensor }),
    ...(fixture.bodyZone === undefined ? {} : { bodyZone: fixture.bodyZone }),
    ...(fixture.collisionFilter === undefined ? {} : { collisionFilter: fixture.collisionFilter }),
  });
}

function physicalBody(entity) {
  if (!entity.physical) return null;
  return canonicalClone({
    id: entity.physical.bodyId ?? `body:${entity.id}`,
    entityId: entity.id,
    kind: entity.physical.kind,
    transform: {
      positionMm: entity.physical.positionMm ?? DEFAULT_POSITION,
      rotation: rotation(entity.physical.rotationEulerMilliDegrees),
    },
    ...(entity.physical.linearVelocityMmPerSecond === undefined ? {} : { linearVelocityMmPerSecond: entity.physical.linearVelocityMmPerSecond }),
    ...(entity.physical.angularVelocityMilliDegPerSecond === undefined ? {} : { angularVelocityMilliDegPerSecond: entity.physical.angularVelocityMilliDegPerSecond }),
    massGrams: entity.physical.massGrams ?? 0,
    fixtures: (entity.physical.fixtures ?? []).map(fixtureFromDeclaration),
    ...(entity.physical.tags === undefined ? {} : { tags: entity.physical.tags }),
  });
}

function visualBody(entity) {
  const visualId = entity.visual.visualBodyId ?? `visual:${entity.id}`;
  const nodeId = entity.visual.nodeId ?? `node:${entity.id}`;
  return canonicalClone({
    id: visualId,
    entityId: entity.id,
    rootNodeId: nodeId,
    nodes: [{
      id: nodeId,
      parentId: null,
      ...(entity.visual.assetRef === undefined ? {} : { assetRef: entity.visual.assetRef }),
      ...(entity.visual.materialRef === undefined ? {} : { materialRef: entity.visual.materialRef }),
      castShadow: entity.visual.castShadow ?? true,
      receiveShadow: entity.visual.receiveShadow ?? true,
      tags: entity.visual.tags ?? [],
    }],
  });
}

function temporalPolicy(entity) {
  return canonicalClone({
    id: entity.temporal.policyId ?? `temporal:${entity.id}`,
    mode: entity.temporal.mode,
    interpolationDelayTicks: entity.temporal.interpolationDelayTicks ?? 0,
    maximumExtrapolationTicks: entity.temporal.maximumExtrapolationTicks ?? 0,
    authorityRootBinding: 'required',
    snapDistanceMm: entity.temporal.snapDistanceMm ?? 0,
    blendTicks: entity.temporal.blendTicks ?? 0,
  });
}

function bodyMap(entity, physical, visual, temporal) {
  const authorityMode = entity.authorityMode ?? (physical ? 'authoritative' : 'presentation-only');
  return canonicalClone({
    entityId: entity.id,
    authorityMode,
    ...(physical ? { physicalBodyRef: physical.id } : {}),
    visualBodyRef: visual.id,
    temporalPolicyRef: temporal.id,
    visualOnlyOffset: {
      positionMm: entity.visual.offset?.positionMm ?? DEFAULT_POSITION,
      rotation: rotation(entity.visual.offset?.rotationEulerMilliDegrees),
      scale: entity.visual.offset?.scale ?? DEFAULT_SCALE,
      authorityAffecting: false,
    },
  });
}

export function compileWorldDeclaration(declaration) {
  requireDeclaration(declaration);
  const physicalBodies = [];
  const visualBodies = [];
  const policies = [];
  const policyById = new Map();
  const bodyMaps = [];
  for (const entity of declaration.entities) {
    if (!entity.visual || !entity.temporal) throw Object.assign(new Error(`WORLD_BODY_ENTITY_PRESENTATION_REQUIRED:${entity.id}`), { code: 'WORLD_BODY_ENTITY_PRESENTATION_REQUIRED' });
    const physical = physicalBody(entity);
    const visual = visualBody(entity);
    const temporal = temporalPolicy(entity);
    if ((entity.authorityMode ?? 'authoritative') === 'authoritative' && !physical) throw Object.assign(new Error(`WORLD_BODY_ENTITY_PHYSICAL_REQUIRED:${entity.id}`), { code: 'WORLD_BODY_ENTITY_PHYSICAL_REQUIRED' });
    if (physical) physicalBodies.push(physical);
    visualBodies.push(visual);
    const existingPolicy = policyById.get(temporal.id);
    if (existingPolicy && JSON.stringify(existingPolicy) !== JSON.stringify(temporal)) {
      throw Object.assign(new Error(`WORLD_BODY_TEMPORAL_POLICY_CONFLICT:${temporal.id}`), { code: 'WORLD_BODY_TEMPORAL_POLICY_CONFLICT' });
    }
    if (!existingPolicy) {
      policyById.set(temporal.id, temporal);
      policies.push(temporal);
    }
    bodyMaps.push(bodyMap(entity, physical, visual, temporal));
  }
  const world = declaration.world;
  const ir = createWorldBodyIR({
    worldId: world.id,
    generation: world.generation,
    revision: world.revision,
    authorityState: {
      worldId: world.id,
      generation: world.generation,
      revision: world.revision,
      authorityClass: world.authorityClass,
      authorityOwner: world.authorityOwner,
      sourceRealityRoot: world.sourceRealityRoot,
      capabilityScopes: world.capabilityScopes ?? [],
      ...(world.proposalRoot === undefined ? {} : { proposalRoot: world.proposalRoot }),
      ...(world.commitRoot === undefined ? {} : { commitRoot: world.commitRoot }),
    },
    physicalBodyState: { bodies: physicalBodies },
    visualBodyState: { bodies: visualBodies },
    temporalPresentationState: { clock: { tick: world.tick, tickHz: world.tickHz }, policies },
    assetState: { assets: declaration.assets ?? [] },
    observerState: { observers: declaration.observers ?? [] },
    worldEventState: { events: declaration.events ?? [] },
    bodyMaps,
    renderGraphs: declaration.renderGraphs ?? [],
  });
  return {
    format: 'taowind.world-declaration-compilation.v0.1',
    generatorVersion: WORLD_BODY_CODEGEN_VERSION,
    semanticDeclarationRoot: semanticHash({
      format: declaration.format,
      declarationVersion: declaration.declarationVersion,
      world: declaration.world,
      worldBodyRoot: ir.roots.worldBodyRoot,
      gravityMmPerSecondSquared: declaration.world.gravityMmPerSecondSquared ?? { x: 0, y: -9810, z: 0 },
      floorY: declaration.world.floorY ?? -100_000,
    }),
    ir,
  };
}

function rsrShape(shape) {
  if (shape.type === 'sphere') return { type: 'sphere', radius: shape.radiusMm };
  if (shape.type === 'capsule') return { type: 'capsule', radius: shape.radiusMm, halfHeight: shape.halfHeightMm };
  return { type: 'box', halfExtents: shape.halfExtentsMm };
}

export function compileRsrWorldConfig(compilation, declaration) {
  const ir = compilation.ir;
  return canonicalClone({
    format: 'rsr.spatial-embodiment-world.v0.6',
    worldId: ir.worldId,
    stepHz: ir.temporalPresentationState.clock.tickHz,
    gravity: declaration.world.gravityMmPerSecondSquared ?? { x: 0, y: -9810, z: 0 },
    floorY: declaration.world.floorY ?? -100_000,
    velocityIterations: declaration.world.solver?.velocityIterations ?? 6,
    positionIterations: declaration.world.solver?.positionIterations ?? 4,
    maxSubsteps: declaration.world.solver?.maxSubsteps ?? 16,
    bodies: ir.physicalBodyState.bodies.map(body => ({
      id: body.id,
      kind: body.kind,
      position: body.transform.positionMm,
      rotationDeg: quaternionToEulerMilliDegrees(body.transform.rotation),
      ...(body.linearVelocityMmPerSecond === undefined ? {} : { velocity: body.linearVelocityMmPerSecond }),
      ...(body.angularVelocityMilliDegPerSecond === undefined ? {} : { angularVelocityDeg: body.angularVelocityMilliDegPerSecond }),
      ...(body.kind !== 'dynamic' ? {} : { massQ: Math.round(body.massGrams * 1_000_000 / 1000) }),
      fixtures: body.fixtures.map(fixture => ({
        id: fixture.id,
        shape: rsrShape(fixture.shape),
        ...(fixture.localPositionMm === undefined ? {} : { localPosition: fixture.localPositionMm }),
        ...(fixture.sensor === undefined ? {} : { sensor: fixture.sensor }),
        ...(fixture.collisionFilter === undefined ? {} : {
          categoryBits: fixture.collisionFilter.categoryBits,
          maskBits: fixture.collisionFilter.maskBits,
        }),
        ...(fixture.bodyZone === undefined ? {} : { bodyZone: fixture.bodyZone }),
      })),
      ...(body.tags === undefined ? {} : { tags: body.tags }),
      data: {
        worldBodyEntityId: body.entityId,
        worldBodyRoot: ir.roots.worldBodyRoot,
        physicalBodyRoot: semanticHash(body),
      },
    })),
    reality: {
      generation: ir.generation,
      realityRoot: ir.authorityState.sourceRealityRoot,
      evidenceRoot: ir.roots.worldBodyRoot,
    },
  });
}

function visualBindings(ir) {
  const visualBodies = new Map(ir.visualBodyState.bodies.map(body => [body.id, body]));
  return ir.bodyMaps.map(map => {
    const visual = visualBodies.get(map.visualBodyRef);
    return canonicalClone({
      entityId: map.entityId,
      authorityMode: map.authorityMode,
      physicalBodyId: map.physicalBodyRef ?? null,
      visualBodyId: map.visualBodyRef,
      nodeIds: visual.nodes.map(node => node.id).sort(),
      assetIds: visual.nodes.flatMap(node => node.assetRef ? [node.assetRef] : []).sort(),
      tags: [...new Set(visual.nodes.flatMap(node => node.tags ?? []))].sort(),
      temporalPolicyId: map.temporalPolicyRef,
      visualOffsetMm: map.visualOnlyOffset.positionMm,
      visualRotationMilliDegrees: quaternionToEulerMilliDegrees(map.visualOnlyOffset.rotation),
      visualScaleQ: map.visualOnlyOffset.scale,
    });
  }).sort((left, right) => compareUtf8(left.entityId, right.entityId));
}

function temporalBindings(ir) {
  const policies = new Map(ir.temporalPresentationState.policies.map(policy => [policy.id, policy]));
  return ir.bodyMaps.map(map => canonicalClone({
    entityId: map.entityId,
    authorityMode: map.authorityMode,
    objectId: map.physicalBodyRef ?? `presentation:${map.entityId}`,
    visualBodyId: map.visualBodyRef,
    policy: policies.get(map.temporalPolicyRef),
  })).sort((left, right) => compareUtf8(left.entityId, right.entityId));
}

function prettyJson(value) {
  return `${JSON.stringify(canonicalClone(value), null, 2)}\n`;
}

function jsModule(name, value, extra = '') {
  return `// Generated by @taowind/world-body-codegen ${WORLD_BODY_CODEGEN_VERSION}. Do not hand-edit.\nexport const ${name} = ${JSON.stringify(canonicalClone(value), null, 2)};\n${extra}export default ${name};\n`;
}

function generatedVsrModule(ir, bindings) {
  return `// Generated by @taowind/world-body-codegen ${WORLD_BODY_CODEGEN_VERSION}. Do not hand-edit.\nexport const sourceWorldBodyRoot = ${JSON.stringify(ir.roots.worldBodyRoot)};\nexport const sourcePhysicalBodyRoot = ${JSON.stringify(ir.roots.physicalBodyRoot)};\nexport const visualBindings = ${JSON.stringify(bindings, null, 2)};\n\nexport function applyWorldBodyVisualBindings(scene) {\n  const output = structuredClone(scene);\n  for (const binding of visualBindings) {\n    let node = binding.physicalBodyId === null ? null : output.nodes.find(item => item.id === \`body:\${binding.physicalBodyId}\`);\n    if (!node && binding.authorityMode === 'presentation-only') {\n      node = { id: \`world-body:\${binding.entityId}\`, transform: { translation: [0, 0, 0] }, tags: [] };\n      output.nodes.push(node);\n    }\n    if (!node) throw Object.assign(new Error(\`WORLD_BODY_VSR_NODE_MISSING:\${binding.physicalBodyId}\`), { code: 'WORLD_BODY_VSR_NODE_MISSING' });\n    node.transform ??= {};\n    const translation = node.transform.translation ?? [0, 0, 0];\n    node.transform.translation = translation.map((value, index) => value + [binding.visualOffsetMm.x, binding.visualOffsetMm.y, binding.visualOffsetMm.z][index] / 1000);\n    const rotation = node.transform.rotationEulerDeg ?? [0, 0, 0];\n    node.transform.rotationEulerDeg = rotation.map((value, index) => value + [binding.visualRotationMilliDegrees.x, binding.visualRotationMilliDegrees.y, binding.visualRotationMilliDegrees.z][index] / 1000);\n    node.transform.scale = [binding.visualScaleQ.x, binding.visualScaleQ.y, binding.visualScaleQ.z].map(value => value / binding.visualScaleQ.scale);\n    node.tags = [...new Set([...(node.tags ?? []), \`world-body-entity:\${binding.entityId}\`, ...binding.tags])].sort();\n  }\n  return output;\n}\n\nexport default visualBindings;\n`;
}

function generatedTemporalExecutable(ir, bindings) {
  return `// Generated by @taowind/world-body-codegen ${WORLD_BODY_CODEGEN_VERSION}. Do not hand-edit.
import { canonicalJson, semanticHash } from '@taowind/world-body-ir';
import { authoritativeFrameToTemporalState } from '@taowind/visual-state-runtime/temporal-presentation';

export const sourceWorldBodyRoot = ${JSON.stringify(ir.roots.worldBodyRoot)};
export const temporalBindings = ${JSON.stringify(bindings, null, 2)};

export function bindAuthoritativeFrame(frame) {
  if (frame.worldId !== ${JSON.stringify(ir.worldId)}) throw Object.assign(new Error('WORLD_BODY_TEMPORAL_WORLD_MISMATCH'), { code: 'WORLD_BODY_TEMPORAL_WORLD_MISMATCH' });
  const packet = authoritativeFrameToTemporalState(frame);
  const objectIds = new Set(packet.objects.map(object => object.objectId));
  for (const binding of temporalBindings) {
    if (binding.authorityMode === 'authoritative' && !objectIds.has(binding.objectId)) throw Object.assign(new Error('WORLD_BODY_TEMPORAL_OBJECT_MISSING:' + binding.objectId), { code: 'WORLD_BODY_TEMPORAL_OBJECT_MISSING' });
  }
  return { packet, bindings: temporalBindings, sourceWorldBodyRoot };
}

export function createRollbackSnapshot(frame) {
  const bound = bindAuthoritativeFrame(frame);
  const base = {
    format: 'taowind.world-body-generated-rollback-snapshot.v0.1',
    sourceWorldBodyRoot,
    worldId: bound.packet.worldId,
    tick: bound.packet.tick,
    sourceStateRoot: bound.packet.sourceStateRoot,
    packet: JSON.parse(JSON.stringify(bound.packet)),
    bindings: structuredClone(bound.bindings),
  };
  return { ...base, snapshotRoot: semanticHash(base) };
}

export function restoreRollbackSnapshot(snapshot) {
  if (!snapshot || snapshot.format !== 'taowind.world-body-generated-rollback-snapshot.v0.1') throw Object.assign(new Error('WORLD_BODY_ROLLBACK_FORMAT_INVALID'), { code: 'WORLD_BODY_ROLLBACK_FORMAT_INVALID' });
  const { snapshotRoot, ...base } = snapshot;
  if (semanticHash(base) !== snapshotRoot || base.sourceWorldBodyRoot !== sourceWorldBodyRoot) throw Object.assign(new Error('WORLD_BODY_ROLLBACK_ROOT_MISMATCH'), { code: 'WORLD_BODY_ROLLBACK_ROOT_MISMATCH' });
  return structuredClone(base);
}

export function serializeNetworkSnapshot(frame) {
  const snapshot = createRollbackSnapshot(frame);
  const base = {
    format: 'taowind.world-body-generated-network-envelope.v0.1',
    sourceWorldBodyRoot,
    snapshot,
  };
  return canonicalJson({ ...base, envelopeRoot: semanticHash(base) });
}

export function deserializeNetworkSnapshot(serialized) {
  const envelope = JSON.parse(serialized);
  if (!envelope || envelope.format !== 'taowind.world-body-generated-network-envelope.v0.1') throw Object.assign(new Error('WORLD_BODY_NETWORK_FORMAT_INVALID'), { code: 'WORLD_BODY_NETWORK_FORMAT_INVALID' });
  const { envelopeRoot, ...base } = envelope;
  if (semanticHash(base) !== envelopeRoot || base.sourceWorldBodyRoot !== sourceWorldBodyRoot) throw Object.assign(new Error('WORLD_BODY_NETWORK_ROOT_MISMATCH'), { code: 'WORLD_BODY_NETWORK_ROOT_MISMATCH' });
  return restoreRollbackSnapshot(base.snapshot);
}

export default temporalBindings;
`;
}

function generatedRcl(ir) {
  const programName = `GeneratedWorldBody_${ir.worldId.replace(/[^A-Za-z0-9_]/g, '_')}`;
  return `reality ${programName} {\n  facet world.id : Text = ${JSON.stringify(ir.worldId)}\n  facet world.generation : Number = ${ir.generation}\n  facet world.revision : Number = ${ir.revision}\n  facet roots.world_body : Text = ${JSON.stringify(ir.roots.worldBodyRoot)}\n  facet roots.authority : Text = ${JSON.stringify(ir.roots.authorityStateRoot)}\n  facet roots.physical : Text = ${JSON.stringify(ir.roots.physicalBodyRoot)}\n  facet roots.visual : Text = ${JSON.stringify(ir.roots.visualBodyRoot)}\n  facet contract.entity_count : Number = ${ir.bodyMaps.length}\n  facet contract.candidate_only : Truth = true\n  facet contract.commit_authority : Truth = false\n}\n`;
}

function generatedProofReceiptTemplate(ir, artifactPaths) {
  return canonicalClone({
    format: 'taowind.world-body-generated-proof-receipt-template.v0.1',
    status: 'CANDIDATE',
    subjectRoot: ir.roots.worldBodyRoot,
    sourceAuthorityRoot: ir.roots.authorityStateRoot,
    authority: 'evidence-template-only-no-commit',
    generatedArtifactPaths: artifactPaths,
    obligations: [
      { id: 'WB-GEN-01', claim: 'generated artifacts preserve the declared World Body root', status: 'PENDING_EXECUTION' },
      { id: 'WB-GEN-02', claim: 'generated RSR/VSR bindings preserve authority non-interference', status: 'PENDING_EXECUTION' },
      { id: 'WB-GEN-03', claim: 'generated network and rollback payloads verify their roots', status: 'PENDING_EXECUTION' },
    ],
  });
}

function generatedExecutableTest(ir) {
  return `// Generated by @taowind/world-body-codegen ${WORLD_BODY_CODEGEN_VERSION}. Do not hand-edit.
import assert from 'node:assert/strict';
import test from 'node:test';
import { semanticHash } from '@taowind/world-body-ir';
import { createAuthoritativeStateFrame } from '@taowind/reality-simulation-runtime/network-reconciliation';
import { SpatialEmbodimentWorld } from '@taowind/reality-simulation-runtime/spatial-embodiment';
import { rsrWorldConfig } from './rsr-world-config.generated.mjs';
import { sourceWorldBodyRoot as visualRoot, visualBindings } from './vsr-bindings.generated.mjs';
import {
  createRollbackSnapshot,
  deserializeNetworkSnapshot,
  serializeNetworkSnapshot,
  sourceWorldBodyRoot as temporalRoot,
  temporalBindings,
} from './temporal-network.generated.mjs';

const expectedWorldBodyRoot = ${JSON.stringify(ir.roots.worldBodyRoot)};

test('generated specialization roots and rollback/network runtime close', () => {
  assert.equal(rsrWorldConfig.reality.evidenceRoot, expectedWorldBodyRoot);
  assert.equal(visualRoot, expectedWorldBodyRoot);
  assert.equal(temporalRoot, expectedWorldBodyRoot);
  assert.equal(visualBindings.length, ${ir.bodyMaps.length});
  assert.equal(temporalBindings.length, ${ir.bodyMaps.length});
  const authority = new SpatialEmbodimentWorld(rsrWorldConfig).snapshot();
  const frame = createAuthoritativeStateFrame(authority, { reason: 'generated-runtime-test' });
  const snapshot = createRollbackSnapshot(frame);
  const serialized = serializeNetworkSnapshot(frame);
  const restored = deserializeNetworkSnapshot(serialized);
  const { snapshotRoot, ...snapshotBase } = snapshot;
  assert.equal(snapshotRoot, semanticHash(snapshotBase));
  assert.equal(restored.sourceStateRoot, frame.sourceStateRoot);
  assert.deepEqual(restored.packet.objects, snapshot.packet.objects);
  const tampered = JSON.parse(serialized);
  tampered.snapshot.tick++;
  assert.throws(() => deserializeNetworkSnapshot(JSON.stringify(tampered)), error => error.code === 'WORLD_BODY_NETWORK_ROOT_MISMATCH');
});
`;
}

function artifact(filePath, mediaType, content) {
  return { path: filePath, mediaType, content, contentRoot: semanticHash(content) };
}

export function generateWorldBodyArtifacts(declaration) {
  const compilation = compileWorldDeclaration(declaration);
  const ir = compilation.ir;
  const rsrConfig = compileRsrWorldConfig(compilation, declaration);
  const bindings = visualBindings(ir);
  const temporal = temporalBindings(ir);
  const eventPlan = {
    format: 'taowind.world-body-generated-event-routes.v0.1',
    sourceWorldBodyRoot: ir.roots.worldBodyRoot,
    events: ir.worldEventState.events,
  };
  const renderGraphPlan = {
    format: 'taowind.world-body-generated-render-graphs.v0.1',
    sourceWorldBodyRoot: ir.roots.worldBodyRoot,
    graphs: ir.renderGraphs,
  };
  const primaryArtifacts = [
    artifact('world-body.ir.json', 'application/json', prettyJson(ir)),
    artifact('rsr-world-config.generated.mjs', 'text/javascript', jsModule('rsrWorldConfig', rsrConfig)),
    artifact('vsr-bindings.generated.mjs', 'text/javascript', generatedVsrModule(ir, bindings)),
    artifact('temporal-network.generated.mjs', 'text/javascript', generatedTemporalExecutable(ir, temporal)),
    artifact('render-graph.generated.json', 'application/json', prettyJson(renderGraphPlan)),
    artifact('event-routes.generated.json', 'application/json', prettyJson(eventPlan)),
    artifact('world-body.generated.rcl', 'text/x-rcl', generatedRcl(ir)),
  ];
  const primaryPaths = primaryArtifacts.map(item => item.path).sort(compareUtf8);
  const artifacts = [
    ...primaryArtifacts,
    artifact('proof-receipt-template.generated.json', 'application/json', prettyJson(generatedProofReceiptTemplate(ir, primaryPaths))),
    artifact('world-body.generated.test.mjs', 'text/javascript', generatedExecutableTest(ir)),
  ].sort((left, right) => compareUtf8(left.path, right.path));
  const manifestBase = {
    format: WORLD_BODY_CODEGEN_MANIFEST_FORMAT,
    generatorVersion: WORLD_BODY_CODEGEN_VERSION,
    semanticDeclarationRoot: compilation.semanticDeclarationRoot,
    worldBodyRoot: ir.roots.worldBodyRoot,
    authority: 'candidate-artifact-generation-only-no-commit',
    metrics: {
      entityCount: ir.bodyMaps.length,
      physicalBodyCount: ir.physicalBodyState.bodies.length,
      visualBodyCount: ir.visualBodyState.bodies.length,
      generatedBindingCount: bindings.length,
      eventRouteCount: ir.worldEventState.events.reduce((count, event) => count + event.routes.length, 0),
      renderPassCount: ir.renderGraphs.reduce((count, graph) => count + graph.passes.length, 0),
      generatedArtifactCount: artifacts.length,
    },
    artifacts: artifacts.map(({ path: artifactPath, mediaType, contentRoot }) => ({ path: artifactPath, mediaType, contentRoot })),
  };
  const manifest = canonicalClone({ ...manifestBase, manifestRoot: semanticHash(manifestBase) });
  return { format: 'taowind.world-body-codegen-bundle.v0.1', compilation, ir, manifest, artifacts };
}

function nonBlankLineCount(value) {
  return value.split(/\r?\n/).filter(line => line.trim().length > 0).length;
}

function occurrenceCount(text, value) {
  if (value.length === 0) return 0;
  let count = 0;
  let offset = 0;
  while ((offset = text.indexOf(value, offset)) !== -1) {
    count++;
    offset += value.length;
  }
  return count;
}

function stableIdentifiers(ir) {
  return [...new Set([
    ir.worldId,
    ...ir.bodyMaps.flatMap(map => [map.entityId, map.physicalBodyRef, map.visualBodyRef, map.temporalPolicyRef]),
    ...ir.physicalBodyState.bodies.flatMap(body => [body.id, ...body.fixtures.map(fixture => fixture.id)]),
    ...ir.visualBodyState.bodies.flatMap(body => [body.id, ...body.nodes.flatMap(node => [node.id, node.assetRef, node.materialRef])]),
    ...ir.temporalPresentationState.policies.map(policy => policy.id),
    ...ir.assetState.assets.map(asset => asset.id),
    ...ir.observerState.observers.map(observer => observer.id),
    ...ir.worldEventState.events.flatMap(event => [event.id, ...event.routes.map(route => route.id)]),
    ...ir.renderGraphs.flatMap(graph => [graph.id, ...graph.resources.map(resource => resource.id), ...graph.passes.map(pass => pass.id)]),
  ].filter(value => typeof value === 'string'))].sort(compareUtf8);
}

export function measureCodeReduction(declarationSource, bundle) {
  if (typeof declarationSource !== 'string') throw new TypeError('WORLD_BODY_CODE_REDUCTION_SOURCE_REQUIRED');
  if (!verifyGeneratedArtifactBundle(bundle)) throw Object.assign(new Error('WORLD_BODY_CODEGEN_BUNDLE_INVALID'), { code: 'WORLD_BODY_CODEGEN_BUNDLE_INVALID' });
  const parsed = JSON.parse(declarationSource);
  if (compileWorldDeclaration(parsed).semanticDeclarationRoot !== bundle.compilation.semanticDeclarationRoot) throw Object.assign(new Error('WORLD_BODY_CODE_REDUCTION_SOURCE_MISMATCH'), { code: 'WORLD_BODY_CODE_REDUCTION_SOURCE_MISMATCH' });
  const generatedSource = bundle.artifacts.map(item => item.content).join('\n');
  const identifiers = stableIdentifiers(bundle.ir);
  const declarationLines = nonBlankLineCount(declarationSource);
  const generatedLines = bundle.artifacts.reduce((total, item) => total + nonBlankLineCount(item.content), 0);
  const declarationIdentifierOccurrences = identifiers.reduce((total, id) => total + occurrenceCount(declarationSource, id), 0);
  const generatedIdentifierOccurrences = identifiers.reduce((total, id) => total + occurrenceCount(generatedSource, id), 0);
  const reductionBasisPoints = generatedLines === 0 ? 0 : Math.round((generatedLines - declarationLines) * 10_000 / generatedLines);
  return canonicalClone({
    format: 'taowind.world-body-code-reduction-measurement.v0.1',
    method: 'physical non-blank source lines and exact stable-identifier occurrences over the verified declaration and its generated specialization bundle',
    measuredSource: {
      declarationLines,
      declarationBytes: Buffer.byteLength(declarationSource, 'utf8'),
      authoredRepresentationCount: 1,
    },
    measuredGeneratedSurface: {
      artifactCount: bundle.artifacts.length,
      specializationLines: generatedLines,
      specializationBytes: bundle.artifacts.reduce((total, item) => total + Buffer.byteLength(item.content, 'utf8'), 0),
      generatorOwnedRepresentationCount: bundle.artifacts.length,
    },
    reduction: {
      manuallyMaintainedSpecializationLinesAvoided: generatedLines,
      netAuthoredLines: declarationLines,
      netAuthoredLineDelta: generatedLines - declarationLines,
      netAuthoredLineReductionBasisPoints: reductionBasisPoints,
    },
    semanticDuplication: {
      stableIdentifierCount: identifiers.length,
      declarationIdentifierOccurrences,
      generatedIdentifierOccurrences,
      repeatedOccurrencesMovedBehindGenerator: Math.max(0, generatedIdentifierOccurrences - declarationIdentifierOccurrences),
    },
    limitations: [
      'The generated specialization surface is the exact maintained-code proxy; this is not a claim about deleted historical lines.',
      'Line counts are not minified and do not measure solver, shader, provider, transport, or backend code.',
      'Runtime and build timing are measured separately because they are host dependent and are not sealed into this deterministic result.',
    ],
  });
}

export function verifyGeneratedArtifactBundle(bundle) {
  if (!bundle || bundle.format !== 'taowind.world-body-codegen-bundle.v0.1') return false;
  if (!bundle.manifest || typeof bundle.manifest !== 'object') return false;
  if (!verifyWorldBodyIR(bundle.ir).ok || bundle.ir.roots.worldBodyRoot !== bundle.manifest.worldBodyRoot) return false;
  const { manifestRoot, ...manifestBase } = bundle.manifest;
  if (semanticHash(manifestBase) !== manifestRoot) return false;
  if (!Array.isArray(bundle.artifacts) || !Array.isArray(bundle.manifest.artifacts)) return false;
  if (bundle.artifacts.length !== bundle.manifest.artifacts.length) return false;
  const byPath = new Map(bundle.artifacts.map(item => [item.path, item]));
  const manifestPaths = new Set(bundle.manifest.artifacts.map(item => item.path));
  if (byPath.size !== bundle.artifacts.length || manifestPaths.size !== bundle.manifest.artifacts.length) return false;
  return bundle.manifest.artifacts.every(entry => {
    const item = byPath.get(entry.path);
    return item && item.mediaType === entry.mediaType && item.contentRoot === entry.contentRoot && semanticHash(item.content) === item.contentRoot;
  });
}

function resolveArtifactTarget(outputRoot, artifactPath) {
  if (typeof artifactPath !== 'string' || artifactPath.length === 0 || path.isAbsolute(artifactPath)) throw Object.assign(new Error('WORLD_BODY_CODEGEN_PATH_INVALID'), { code: 'WORLD_BODY_CODEGEN_PATH_INVALID' });
  const target = path.resolve(outputRoot, artifactPath);
  const relative = path.relative(outputRoot, target);
  if (relative.startsWith('..') || path.isAbsolute(relative)) throw Object.assign(new Error('WORLD_BODY_CODEGEN_PATH_ESCAPE'), { code: 'WORLD_BODY_CODEGEN_PATH_ESCAPE' });
  return target;
}

export function writeGeneratedArtifacts(bundle, outputDirectory) {
  if (!verifyGeneratedArtifactBundle(bundle)) throw Object.assign(new Error('WORLD_BODY_CODEGEN_BUNDLE_INVALID'), { code: 'WORLD_BODY_CODEGEN_BUNDLE_INVALID' });
  const outputRoot = path.resolve(outputDirectory);
  if (path.parse(outputRoot).root === outputRoot) throw Object.assign(new Error('WORLD_BODY_CODEGEN_OUTPUT_ROOT_FORBIDDEN'), { code: 'WORLD_BODY_CODEGEN_OUTPUT_ROOT_FORBIDDEN' });
  mkdirSync(outputRoot, { recursive: true });
  for (const item of bundle.artifacts) {
    const target = resolveArtifactTarget(outputRoot, item.path);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, item.content, 'utf8');
  }
  const manifestPath = resolveArtifactTarget(outputRoot, 'manifest.json');
  writeFileSync(manifestPath, prettyJson(bundle.manifest), 'utf8');
  return { outputRoot, manifestPath, manifestRoot: bundle.manifest.manifestRoot, artifactCount: bundle.artifacts.length + 1 };
}
