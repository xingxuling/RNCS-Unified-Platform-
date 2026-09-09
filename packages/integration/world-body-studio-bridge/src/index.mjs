import {
  canonicalClone,
  isSha256,
  semanticHash,
} from '@taowind/world-body-ir';
import {
  compileWorldDeclaration,
  generateWorldBodyArtifacts,
  verifyGeneratedArtifactBundle,
} from '@taowind/world-body-codegen';

export const STUDIO_WORLD_BODY_BRIDGE_FORMAT = 'taowind.reality-studio.world-body-bridge.v0.1';
export const STUDIO_WORLD_BODY_BRIDGE_VERSION = '0.1.0-alpha.1';
export const STUDIO_WORLD_BODY_BRIDGE_MANIFEST_FORMAT = 'taowind.reality-studio.world-body-bridge-manifest.v0.1';

const DEFAULT_AUTHORITY_OWNER = 'reality-studio:world-body-bridge';
const DEFAULT_CAPABILITY_SCOPES = Object.freeze(['world.body.read', 'world.body.project']);
const DEFAULT_TEMPORAL_POLICY = Object.freeze({
  policyId: 'temporal:studio-world-default',
  mode: 'hold',
  interpolationDelayTicks: 0,
  maximumExtrapolationTicks: 0,
  snapDistanceMm: 0,
  blendTicks: 0,
});
const ASSET_KIND_MAP = Object.freeze({
  'model-3d': 'mesh',
  model: 'mesh',
  mesh: 'mesh',
  material: 'material',
  texture: 'texture',
  animation: 'animation',
  shader: 'shader',
  audio: 'audio',
});

export class StudioWorldBodyBridgeError extends Error {
  constructor(code, message, details = undefined) {
    super(`${code}: ${message}`);
    this.name = 'StudioWorldBodyBridgeError';
    this.code = code;
    this.details = details;
  }
}

function fail(code, message, details = undefined) {
  throw new StudioWorldBodyBridgeError(code, message, details);
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function requiredRecord(value, code, message) {
  if (!isRecord(value)) fail(code, message);
  return value;
}

function requiredText(value, code, message) {
  if (typeof value !== 'string' || value.length === 0) fail(code, message);
  return value;
}

function requiredRoot(value, code, message) {
  if (!isSha256(value)) fail(code, message, { value });
  return value;
}

function integer(value, code, message, { minimum = undefined } = {}) {
  if (!Number.isSafeInteger(value) || (minimum !== undefined && value < minimum)) fail(code, message, { value });
  return value;
}

function clone(value) {
  return structuredClone(value);
}

function sortedUnique(values) {
  return [...new Set(values)].sort((left, right) => String(left).localeCompare(String(right)));
}

function verifySeal(value, field) {
  if (!isRecord(value) || !isSha256(value[field])) return false;
  try {
    const payload = clone(value);
    const root = payload[field];
    delete payload[field];
    return semanticHash(payload) === root;
  } catch {
    return false;
  }
}

function mapVector3(value, code, message) {
  const vector = requiredRecord(value, code, message);
  return {
    x: integer(vector.x, code, message),
    y: integer(vector.y, code, message),
    z: integer(vector.z, code, message),
  };
}

function mapRotation(value) {
  if (value === undefined) return { x: 0, y: 0, z: 0 };
  return mapVector3(value, 'STUDIO_WB_ROTATION_INVALID', 'Studio body rotation must contain safe integer milli-degrees');
}

function mapShape(shape, bodyId, fixtureId) {
  requiredRecord(shape, 'STUDIO_WB_SHAPE_REQUIRED', `Studio fixture ${fixtureId} on ${bodyId} has no shape`);
  if (shape.type === 'sphere') {
    return { type: 'sphere', radiusMm: integer(shape.radius, 'STUDIO_WB_SHAPE_INVALID', `Studio sphere ${fixtureId} has an invalid radius`, { minimum: 1 }) };
  }
  if (shape.type === 'capsule') {
    return {
      type: 'capsule',
      radiusMm: integer(shape.radius, 'STUDIO_WB_SHAPE_INVALID', `Studio capsule ${fixtureId} has an invalid radius`, { minimum: 1 }),
      halfHeightMm: integer(shape.halfHeight, 'STUDIO_WB_SHAPE_INVALID', `Studio capsule ${fixtureId} has an invalid half-height`, { minimum: 0 }),
    };
  }
  if (shape.type === 'box') {
    const halfExtents = mapVector3(shape.halfExtents, 'STUDIO_WB_SHAPE_INVALID', `Studio box ${fixtureId} has invalid half-extents`);
    if (halfExtents.x <= 0 || halfExtents.y <= 0 || halfExtents.z <= 0) fail('STUDIO_WB_SHAPE_INVALID', `Studio box ${fixtureId} has non-positive half-extents`, { bodyId, fixtureId, halfExtents });
    return { type: 'box', halfExtentsMm: halfExtents };
  }
  fail('STUDIO_WB_SHAPE_UNSUPPORTED', `Studio fixture ${fixtureId} uses unsupported shape ${String(shape.type)}`, { bodyId, fixtureId, shapeType: shape.type });
}

function mapAsset(source, assetId) {
  requiredRecord(source, 'STUDIO_WB_ASSET_MISSING', `Studio asset ${assetId} is not present in the registry`);
  const sourceKind = requiredText(source.kind, 'STUDIO_WB_ASSET_KIND_MISSING', `Studio asset ${assetId} has no kind`);
  const worldBodyKind = ASSET_KIND_MAP[sourceKind];
  if (!worldBodyKind) fail('STUDIO_WB_ASSET_KIND_UNSUPPORTED', `Studio asset kind ${sourceKind} has no World Body mapping`, { assetId, sourceKind, supportedKinds: Object.keys(ASSET_KIND_MAP) });
  const sourceAssetRoot = requiredRoot(source.asset_root, 'STUDIO_WB_ASSET_ROOT_INVALID', `Studio asset ${assetId} has no SHA-256 asset root`);
  const files = Array.isArray(source.files) ? source.files : [];
  const sourceFile = files.find(file => file?.mime === 'model/gltf-binary') ?? files.find(file => isSha256(file?.sha256)) ?? null;
  const importReceiptRoot = isSha256(sourceFile?.sha256) ? sourceFile.sha256 : undefined;
  return {
    asset: {
      id: assetId,
      kind: worldBodyKind,
      version: typeof source.version === 'string' && source.version.length > 0 ? source.version : 'studio-record-v1.6',
      contentRoot: sourceAssetRoot,
      residency: sourceFile?.embedded_base64 ? 'resident' : 'requested',
      ...(importReceiptRoot === undefined ? {} : { importReceiptRoot }),
    },
    mapping: {
      world_body_asset_id: assetId,
      source_asset_id: source.asset_id ?? assetId,
      source_kind: sourceKind,
      world_body_kind: worldBodyKind,
      source_asset_root: sourceAssetRoot,
      source_file_sha256: importReceiptRoot ?? null,
      source_file_mime: sourceFile?.mime ?? null,
      source_residency_basis: sourceFile?.embedded_base64 ? 'embedded-source-file' : 'asset-root-only',
      mapping_reason: worldBodyKind === sourceKind
        ? 'Studio asset kind is already a World Body asset kind.'
        : `Studio ${sourceKind} is lowered to World Body ${worldBodyKind}; the original kind remains in this sidecar.`,
    },
  };
}

function normalizeTemporalPolicy(input) {
  const value = { ...DEFAULT_TEMPORAL_POLICY, ...(input ?? {}) };
  requiredText(value.policyId, 'STUDIO_WB_TEMPORAL_POLICY_ID_INVALID', 'Temporal policy id is required');
  if (!['hold', 'interpolate', 'extrapolate', 'snap'].includes(value.mode)) fail('STUDIO_WB_TEMPORAL_MODE_INVALID', `Unsupported temporal mode ${String(value.mode)}`);
  for (const field of ['interpolationDelayTicks', 'maximumExtrapolationTicks', 'snapDistanceMm', 'blendTicks']) integer(value[field], 'STUDIO_WB_TEMPORAL_VALUE_INVALID', `Temporal policy ${field} must be a non-negative safe integer`, { minimum: 0 });
  if (value.mode === 'extrapolate' && value.maximumExtrapolationTicks <= 0) fail('STUDIO_WB_TEMPORAL_EXTRAPOLATION_BOUND_REQUIRED', 'Extrapolation requires a positive maximumExtrapolationTicks');
  return {
    policyId: value.policyId,
    mode: value.mode,
    interpolationDelayTicks: value.interpolationDelayTicks,
    maximumExtrapolationTicks: value.maximumExtrapolationTicks,
    snapDistanceMm: value.snapDistanceMm,
    blendTicks: value.blendTicks,
  };
}

function validateNetworkCompilation(project, workspace, sourceWorld, scene, networkCompilation) {
  if (networkCompilation === undefined || networkCompilation === null) {
    return {
      supplied: false,
      roots: {},
      gaps: ['Studio network compilation was not supplied; the candidate remains a Studio spatial ingress only.'],
    };
  }
  if (!verifySeal(networkCompilation, 'compilation_root')) fail('STUDIO_WB_NETWORK_COMPILATION_INVALID', 'Network compilation root does not verify');
  if (!verifySeal(networkCompilation.evidence, 'evidence_root')) fail('STUDIO_WB_NETWORK_EVIDENCE_INVALID', 'Network compilation evidence root does not verify');
  if (networkCompilation.project_root !== project.project_root) fail('STUDIO_WB_NETWORK_PROJECT_ROOT_MISMATCH', 'Network compilation project root does not match the Studio project');
  if (networkCompilation.spatial_workspace_root !== workspace.workspace_root) fail('STUDIO_WB_NETWORK_WORKSPACE_ROOT_MISMATCH', 'Network compilation workspace root does not match the Studio workspace');
  if (networkCompilation.source_world_root !== sourceWorld.world_root) fail('STUDIO_WB_NETWORK_SOURCE_WORLD_ROOT_MISMATCH', 'Network compilation source world root does not match the active Studio world');
  if (networkCompilation.active_scene_root !== scene.scene_root) fail('STUDIO_WB_NETWORK_SCENE_ROOT_MISMATCH', 'Network compilation scene root does not match the active Studio scene');
  return {
    supplied: true,
    roots: {
      project_root: networkCompilation.project_root,
      spatial_workspace_root: networkCompilation.spatial_workspace_root,
      source_world_root: networkCompilation.source_world_root,
      active_scene_root: networkCompilation.active_scene_root,
      authoring_root: networkCompilation.authoring_root,
      evidence_root: networkCompilation.evidence.evidence_root,
      compilation_root: networkCompilation.compilation_root,
    },
    player_slots: clone(networkCompilation.player_slots ?? []),
    asset_binding_count: networkCompilation.asset_bindings?.length ?? 0,
    gaps: [],
  };
}

function sourceFacetSummary(body, sceneNode, characters) {
  return {
    source_body_id: body.id,
    source_scene_node_id: sceneNode?.node_id ?? null,
    source_character_ids: characters.filter(character => character.bodyId === body.id).map(character => character.id).sort(),
    binding_status: sceneNode ? (sceneNode.asset_id ? 'scene-bound' : 'scene-bound-without-asset') : 'synthetic-no-scene-node',
    source_body_facets: {
      massQ: body.massQ ?? null,
      frictionQ: body.frictionQ ?? null,
      allowSleep: body.allowSleep ?? null,
      bullet: body.bullet ?? null,
      fixedRotation: body.fixedRotation ?? null,
      tags: clone(body.tags ?? []),
    },
    source_fixture_facets: (body.fixtures ?? []).map(fixture => ({
      id: fixture.id,
      materialId: fixture.materialId ?? null,
      tags: clone(fixture.tags ?? []),
      bodyZone: fixture.bodyZone ?? null,
    })),
    source_scene_transform: sceneNode?.transform ? clone(sceneNode.transform) : null,
    source_scene_components: sceneNode?.components ? clone(sceneNode.components) : null,
  };
}

function createDeclaration(project, options = {}) {
  requiredRecord(project, 'STUDIO_WB_PROJECT_REQUIRED', 'A Unified Project object is required');
  requiredRoot(project.project_root, 'STUDIO_WB_PROJECT_ROOT_INVALID', 'Studio project_root must be a SHA-256 root');
  requiredRecord(project.identity, 'STUDIO_WB_PROJECT_IDENTITY_REQUIRED', 'Studio project identity is required');
  const projectId = requiredText(project.identity.project_id, 'STUDIO_WB_PROJECT_ID_REQUIRED', 'Studio project identity.project_id is required');
  const workspace = requiredRecord(project.spatial3d, 'STUDIO_WB_SPATIAL_WORKSPACE_REQUIRED', 'Studio spatial3d workspace is required');
  const activeWorldId = requiredText(workspace.active_world_id, 'STUDIO_WB_ACTIVE_WORLD_ID_REQUIRED', 'Studio active spatial world id is required');
  const sourceWorld = workspace.worlds?.[activeWorldId];
  requiredRecord(sourceWorld, 'STUDIO_WB_ACTIVE_WORLD_MISSING', `Studio active world ${activeWorldId} is missing`);
  requiredText(sourceWorld.worldId, 'STUDIO_WB_SOURCE_WORLD_ID_INVALID', 'Studio source world id is required');
  requiredRoot(sourceWorld.world_root, 'STUDIO_WB_SOURCE_WORLD_ROOT_INVALID', 'Studio source world must expose a SHA-256 world_root');
  const scenes = Array.isArray(project.scenes) ? project.scenes : [];
  const scene = scenes.find(item => item.scene_id === project.active_scene_id);
  requiredRecord(scene, 'STUDIO_WB_ACTIVE_SCENE_MISSING', 'Studio active scene is missing');
  requiredRoot(scene.scene_root, 'STUDIO_WB_ACTIVE_SCENE_ROOT_INVALID', 'Studio active scene must expose a SHA-256 scene_root');
  requiredRoot(workspace.workspace_root, 'STUDIO_WB_WORKSPACE_ROOT_INVALID', 'Studio spatial workspace must expose a SHA-256 workspace_root');

  const network = validateNetworkCompilation(project, workspace, sourceWorld, scene, options.networkCompilation);
  const sourceRealityRoot = requiredRoot(
    options.sourceRealityRoot ?? options.networkCompilation?.project_root ?? project.project_root,
    'STUDIO_WB_SOURCE_REALITY_ROOT_INVALID',
    'Studio ingress sourceRealityRoot must be a SHA-256 root',
  );
  const nodes = Array.isArray(scene.nodes) ? scene.nodes : [];
  const nodeByBody = new Map();
  for (const node of nodes) {
    const bodyId = node?.components?.spatial_body_id;
    if (!bodyId) continue;
    if (nodeByBody.has(bodyId)) fail('STUDIO_WB_BODY_SCENE_BINDING_DUPLICATE', `Multiple Studio scene nodes bind spatial body ${bodyId}`);
    nodeByBody.set(bodyId, node);
  }

  const usedAssetIds = sortedUnique([...nodeByBody.values()].map(node => node.asset_id).filter(Boolean));
  const declarationAssets = [];
  const assetMappings = [];
  for (const assetId of usedAssetIds) {
    const source = project.assets?.registry?.[assetId];
    const mapped = mapAsset(source, assetId);
    declarationAssets.push(mapped.asset);
    assetMappings.push(mapped.mapping);
  }
  const assetIds = new Set(declarationAssets.map(asset => asset.id));
  const temporalPolicy = normalizeTemporalPolicy(options.temporalPolicy);
  const characters = sourceWorld.characters ?? [];

  const entities = (sourceWorld.bodies ?? []).map(body => {
    requiredText(body.id, 'STUDIO_WB_BODY_ID_INVALID', 'Studio spatial body id is required');
    if (!['static', 'dynamic', 'kinematic'].includes(body.kind)) fail('STUDIO_WB_BODY_KIND_UNSUPPORTED', `Studio body ${body.id} uses unsupported kind ${String(body.kind)}`);
    const node = nodeByBody.get(body.id);
    const fixtures = (body.fixtures ?? []).map(fixture => ({
      id: requiredText(fixture.id, 'STUDIO_WB_FIXTURE_ID_INVALID', `Studio body ${body.id} has an invalid fixture id`),
      shape: mapShape(fixture.shape, body.id, fixture.id),
      ...(fixture.localPosition ? { localPositionMm: mapVector3(fixture.localPosition, 'STUDIO_WB_LOCAL_POSITION_INVALID', `Studio fixture ${fixture.id} has invalid local position`) } : {}),
      ...(fixture.sensor === undefined ? {} : { sensor: Boolean(fixture.sensor) }),
      ...(fixture.bodyZone === undefined ? {} : { bodyZone: String(fixture.bodyZone) }),
      ...(fixture.collisionFilter === undefined ? {} : { collisionFilter: clone(fixture.collisionFilter) }),
    }));
    if (fixtures.length === 0) fail('STUDIO_WB_BODY_FIXTURE_REQUIRED', `Studio body ${body.id} has no fixtures`);
    const scaleMilli = node?.components?.spatial_scale_milli ?? 1000;
    integer(scaleMilli, 'STUDIO_WB_SCALE_INVALID', `Studio scene binding for ${body.id} has an invalid scale`, { minimum: 1 });
    const scaleQ = scaleMilli * 1000;
    const mappedAsset = node?.asset_id && assetIds.has(node.asset_id) ? node.asset_id : undefined;
    const characterTags = characters.filter(character => character.bodyId === body.id).map(character => `character:${character.id}`);
    return {
      id: `entity:studio:${body.id}`,
      authorityMode: 'authoritative',
      physical: {
        bodyId: body.id,
        kind: body.kind,
        positionMm: mapVector3(body.position, 'STUDIO_WB_POSITION_INVALID', `Studio body ${body.id} has invalid position`),
        rotationEulerMilliDegrees: mapRotation(body.rotationDeg),
        ...(body.velocity === undefined ? {} : { linearVelocityMmPerSecond: mapVector3(body.velocity, 'STUDIO_WB_VELOCITY_INVALID', `Studio body ${body.id} has invalid velocity`) }),
        ...(body.angularVelocityDeg === undefined ? {} : { angularVelocityMilliDegPerSecond: mapVector3(body.angularVelocityDeg, 'STUDIO_WB_ANGULAR_VELOCITY_INVALID', `Studio body ${body.id} has invalid angular velocity`) }),
        massGrams: body.kind === 'dynamic'
          ? integer(Math.round((integer(body.massQ, 'STUDIO_WB_DYNAMIC_MASS_INVALID', `Studio dynamic body ${body.id} has no valid massQ`, { minimum: 1 })) / 1000), 'STUDIO_WB_DYNAMIC_MASS_INVALID', `Studio dynamic body ${body.id} has an invalid gram mass`, { minimum: 1 })
          : 0,
        fixtures,
        ...(body.tags === undefined ? {} : { tags: clone(body.tags) }),
      },
      visual: {
        visualBodyId: `visual:studio:${body.id}`,
        nodeId: `node:studio:${body.id}`,
        ...(mappedAsset === undefined ? {} : { assetRef: mappedAsset }),
        tags: sortedUnique(['studio-world-body', ...(body.tags ?? []), ...characterTags]),
        offset: {
          positionMm: { x: 0, y: 0, z: 0 },
          rotationEulerMilliDegrees: { x: 0, y: 0, z: 0 },
          scale: { x: scaleQ, y: scaleQ, z: scaleQ, scale: 1_000_000 },
        },
      },
      temporal: temporalPolicy,
    };
  });

  const boundBodyIds = new Set((sourceWorld.bodies ?? []).map(body => body.id));
  const bodyBindings = (sourceWorld.bodies ?? []).map(body => sourceFacetSummary(body, nodeByBody.get(body.id), characters));
  const unmappedSceneNodes = nodes
    .filter(node => !node?.components?.spatial_body_id)
    .map(node => ({
      scene_node_id: node.node_id ?? null,
      asset_id: node.asset_id ?? null,
      reason: 'scene node has no spatial_body_id and is not emitted as a World Body physical entity',
    }));
  const sidecar = {
    format: 'taowind.reality-studio.world-body-bridge-sidecar.v0.1',
    bridgeVersion: STUDIO_WORLD_BODY_BRIDGE_VERSION,
    project_id: projectId,
    source_roots: {
      project_root: project.project_root,
      spatial_workspace_root: workspace.workspace_root,
      source_world_root: sourceWorld.world_root,
      active_scene_root: scene.scene_root,
      source_reality_root: sourceRealityRoot,
      ...network.roots,
    },
    source_world_reality: clone(sourceWorld.reality ?? {}),
    asset_mappings: assetMappings,
    body_bindings: bodyBindings,
    network: network,
    unmapped_scene_nodes: unmappedSceneNodes,
    preserved_source_facets: {
      material_count: Array.isArray(sourceWorld.materials) ? sourceWorld.materials.length : 0,
      character_count: characters.length,
      joint_count: Array.isArray(sourceWorld.joints) ? sourceWorld.joints.length : 0,
      listener_count: Array.isArray(sourceWorld.listeners) ? sourceWorld.listeners.length : 0,
      character_runtime: clone(characters),
      joints: clone(sourceWorld.joints ?? []),
      listeners: clone(sourceWorld.listeners ?? []),
    },
    mapping_policy: {
      source_scene_2d_transform: 'preserved-only-not-converted-to-3d',
      source_spatial_coordinates: 'millimetre-preserved',
      source_spatial_rotation: 'milli-degree-preserved-when-present',
      source_massQ: 'converted-to-grams-by-round(massQ/1000)',
      asset_kind: 'explicit-closed-world-body-kind-map',
      temporal: options.temporalPolicy ? 'caller-supplied' : 'adapter-default-hold',
    },
    coverage: {
      source_scene_node_count: nodes.length,
      spatial_body_count: sourceWorld.bodies?.length ?? 0,
      emitted_entity_count: entities.length,
      scene_bound_body_count: [...nodeByBody.keys()].filter(bodyId => boundBodyIds.has(bodyId)).length,
      synthetic_body_visual_count: entities.filter(entity => !nodeByBody.has(entity.physical.bodyId)).length,
      emitted_asset_count: declarationAssets.length,
      unmapped_scene_node_count: unmappedSceneNodes.length,
    },
    gaps: [
      ...(options.temporalPolicy ? [] : ['Studio source has no explicit temporal presentation policy in this path; the bridge uses a reviewable hold default.']),
      ...(network.supplied ? [] : network.gaps),
      ...(unmappedSceneNodes.length === 0 ? [] : [`${unmappedSceneNodes.length} non-spatial Studio scene nodes remain outside this World Body candidate.`]),
      'Studio material/friction, character controller, joint, listener, render graph, and UI/input facets remain source sidecar data; this bridge does not duplicate their runtimes.',
    ],
  };

  const declaration = {
    format: 'taowind.world-declaration.v0.1',
    declarationVersion: '0.1.0-alpha.1',
    world: {
      id: sourceWorld.worldId,
      generation: sourceWorld.reality?.generation ?? 0,
      revision: options.revision ?? 0,
      tick: options.tick ?? 0,
      tickHz: integer(sourceWorld.stepHz, 'STUDIO_WB_STEP_HZ_INVALID', 'Studio world stepHz must be a positive safe integer', { minimum: 1 }),
      authorityClass: 'candidate',
      authorityOwner: options.authorityOwner ?? DEFAULT_AUTHORITY_OWNER,
      sourceRealityRoot: sidecar.source_roots.source_reality_root,
      capabilityScopes: clone(options.capabilityScopes ?? DEFAULT_CAPABILITY_SCOPES),
      gravityMmPerSecondSquared: mapVector3(sourceWorld.gravity, 'STUDIO_WB_GRAVITY_INVALID', 'Studio world gravity must be an integer vector'),
      floorY: integer(sourceWorld.floorY, 'STUDIO_WB_FLOOR_INVALID', 'Studio world floorY must be a safe integer'),
      solver: {
        velocityIterations: integer(sourceWorld.velocityIterations, 'STUDIO_WB_SOLVER_INVALID', 'Studio velocityIterations must be a positive safe integer', { minimum: 1 }),
        positionIterations: integer(sourceWorld.positionIterations, 'STUDIO_WB_SOLVER_INVALID', 'Studio positionIterations must be a positive safe integer', { minimum: 1 }),
        maxSubsteps: integer(sourceWorld.maxSubsteps, 'STUDIO_WB_SOLVER_INVALID', 'Studio maxSubsteps must be a positive safe integer', { minimum: 1 }),
      },
    },
    assets: declarationAssets,
    entities,
    observers: [],
    events: [],
    renderGraphs: [],
  };
  return { declaration, sidecar };
}

export function createWorldBodyDeclarationFromStudioProject(project, options = {}) {
  return createDeclaration(project, options);
}

export function compileStudioWorldBodyCandidate(project, options = {}) {
  const { declaration, sidecar } = createDeclaration(project, options);
  const worldBody = generateWorldBodyArtifacts(declaration);
  const manifestBase = {
    format: STUDIO_WORLD_BODY_BRIDGE_MANIFEST_FORMAT,
    bridgeVersion: STUDIO_WORLD_BODY_BRIDGE_VERSION,
    authority: 'candidate-artifact-generation-only-no-commit',
    project_id: sidecar.project_id,
    source_roots: sidecar.source_roots,
    semanticDeclarationRoot: worldBody.compilation.semanticDeclarationRoot,
    worldBodyRoot: worldBody.manifest.worldBodyRoot,
    generatedArtifactPaths: worldBody.manifest.artifacts.map(item => item.path).sort(),
    coverage: sidecar.coverage,
    gaps: sidecar.gaps,
  };
  const manifest = { ...manifestBase, manifestRoot: semanticHash(manifestBase) };
  return {
    format: STUDIO_WORLD_BODY_BRIDGE_FORMAT,
    bridgeVersion: STUDIO_WORLD_BODY_BRIDGE_VERSION,
    authority: 'candidate-artifact-generation-only-no-commit',
    declaration,
    sidecar,
    worldBody,
    manifest,
  };
}

export function verifyStudioWorldBodyCandidate(bundle) {
  try {
    if (!bundle || bundle.format !== STUDIO_WORLD_BODY_BRIDGE_FORMAT || bundle.bridgeVersion !== STUDIO_WORLD_BODY_BRIDGE_VERSION) return false;
    if (bundle.authority !== 'candidate-artifact-generation-only-no-commit') return false;
    if (!bundle.declaration || bundle.declaration.world?.authorityClass !== 'candidate' || bundle.declaration.world?.commitRoot !== undefined) return false;
    if (!verifyGeneratedArtifactBundle(bundle.worldBody)) return false;
    const recompilation = compileWorldDeclaration(bundle.declaration);
    if (recompilation.semanticDeclarationRoot !== bundle.worldBody.compilation.semanticDeclarationRoot) return false;
    if (!bundle.sidecar || bundle.sidecar.format !== 'taowind.reality-studio.world-body-bridge-sidecar.v0.1') return false;
    if (!bundle.manifest || bundle.manifest.format !== STUDIO_WORLD_BODY_BRIDGE_MANIFEST_FORMAT) return false;
    const { manifestRoot, ...manifestBase } = bundle.manifest;
    if (semanticHash(manifestBase) !== manifestRoot) return false;
    if (bundle.worldBody.manifest.worldBodyRoot !== bundle.manifest.worldBodyRoot) return false;
    if (bundle.worldBody.compilation.semanticDeclarationRoot !== bundle.manifest.semanticDeclarationRoot) return false;
    if (semanticHash(bundle.sidecar.source_roots) !== semanticHash(bundle.manifest.source_roots)) return false;
    if (bundle.worldBody.manifest.authority !== 'candidate-artifact-generation-only-no-commit') return false;
    return true;
  } catch {
    return false;
  }
}

export function summarizeStudioWorldBodyCandidate(bundle) {
  if (!verifyStudioWorldBodyCandidate(bundle)) fail('STUDIO_WB_CANDIDATE_INVALID', 'Cannot summarize an invalid Studio World Body candidate');
  return canonicalClone({
    format: 'taowind.reality-studio.world-body-bridge-summary.v0.1',
    authority: bundle.authority,
    source_roots: bundle.manifest.source_roots,
    semanticDeclarationRoot: bundle.manifest.semanticDeclarationRoot,
    worldBodyRoot: bundle.manifest.worldBodyRoot,
    coverage: bundle.manifest.coverage,
    gaps: bundle.manifest.gaps,
    generatedArtifactCount: bundle.worldBody.artifacts.length,
  });
}
