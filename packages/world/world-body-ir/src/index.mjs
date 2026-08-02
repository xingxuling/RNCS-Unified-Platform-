import { canonicalClone, canonicalJson, canonicalize, compareUtf8, isSha256, semanticHash } from './canonical.mjs';
import { WorldBodyValidationError, diagnostic } from './errors.mjs';
import {
  WORLD_BODY_RENDER_GRAPH_FORMAT,
  assertRenderGraph,
  deriveRenderGraphBarriers,
  sealRenderGraph,
  validateRenderGraph,
} from './render-graph.mjs';

export { canonicalClone, canonicalJson, canonicalize, compareUtf8, isSha256, semanticHash } from './canonical.mjs';
export { WorldBodyValidationError } from './errors.mjs';
export {
  WORLD_BODY_RENDER_GRAPH_FORMAT,
  assertRenderGraph,
  deriveRenderGraphBarriers,
  sealRenderGraph,
  validateRenderGraph,
} from './render-graph.mjs';

export const WORLD_BODY_IR_VERSION = '0.1.0-alpha.1';
export const WORLD_BODY_IR_FORMAT = 'taowind.world-body-ir.v0.1';
export const QUATERNION_SCALE = 1_000_000;
export const TRANSFORM_SCALE = 1_000_000;

export const COMPONENT_FORMATS = Object.freeze({
  authorityState: 'taowind.world-body.authority-state.v0.1',
  physicalBodyState: 'taowind.world-body.physical-state.v0.1',
  visualBodyState: 'taowind.world-body.visual-state.v0.1',
  temporalPresentationState: 'taowind.world-body.temporal-presentation-state.v0.1',
  assetState: 'taowind.world-body.asset-state.v0.1',
  observerState: 'taowind.world-body.observer-state.v0.1',
  worldEventState: 'taowind.world-body.event-state.v0.1',
});

const ROOT_COMPONENTS = Object.freeze([
  ['authorityState', 'authorityStateRoot'],
  ['physicalBodyState', 'physicalBodyRoot'],
  ['visualBodyState', 'visualBodyRoot'],
  ['temporalPresentationState', 'temporalPresentationRoot'],
  ['assetState', 'assetStateRoot'],
  ['observerState', 'observerStateRoot'],
  ['worldEventState', 'worldEventStateRoot'],
  ['bodyMaps', 'bodyMapRoot'],
  ['renderGraphs', 'renderGraphSetRoot'],
]);

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$/;
const AUTHORITY_CLASSES = new Set(['candidate', 'authoritative-snapshot', 'committed-generation']);
const BODY_KINDS = new Set(['static', 'kinematic', 'dynamic']);
const SHAPE_KINDS = new Set(['sphere', 'box', 'capsule']);
const TEMPORAL_MODES = new Set(['hold', 'interpolate', 'extrapolate', 'snap']);
const RESIDENCY = new Set(['unloaded', 'requested', 'resident', 'evicted']);
const ASSET_KINDS = new Set(['mesh', 'material', 'texture', 'animation', 'shader', 'audio']);
const QUALITY_TIERS = new Set(['economy', 'balanced', 'quality', 'cinematic']);
const EVENT_SOURCES = new Set(['world', 'rsr', 'network', 'animation', 'interaction']);
const EVENT_CONSUMERS = new Set(['visual', 'animation', 'audio', 'haptic', 'network', 'telemetry']);

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function push(errors, condition, code, path, message, details = undefined) {
  if (!condition) errors.push(diagnostic(code, path, message, details));
}

function validId(value) {
  return typeof value === 'string' && ID_PATTERN.test(value) && !value.includes('..');
}

function validateId(value, path, errors) {
  push(errors, validId(value), 'WBIR_ID_INVALID', path, 'id must be 1-128 safe characters and cannot contain path traversal');
}

function validateSafeNonnegative(value, path, errors) {
  push(errors, Number.isSafeInteger(value) && value >= 0, 'WBIR_NONNEGATIVE_INTEGER_REQUIRED', path, 'expected a non-negative safe integer');
}

function validateVector3(value, path, errors) {
  if (!isRecord(value)) {
    errors.push(diagnostic('WBIR_VECTOR3_REQUIRED', path, 'expected an integer vector3 object'));
    return;
  }
  for (const axis of ['x', 'y', 'z']) {
    push(errors, Number.isSafeInteger(value[axis]), 'WBIR_VECTOR_COMPONENT_INVALID', `${path}/${axis}`, 'expected a safe integer');
  }
}

function quaternionSignIsCanonical(quaternion) {
  for (const component of [quaternion.w, quaternion.x, quaternion.y, quaternion.z]) {
    if (component !== 0) return component > 0;
  }
  return false;
}

function validateQuaternion(value, path, errors) {
  if (!isRecord(value)) {
    errors.push(diagnostic('WBIR_QUATERNION_REQUIRED', path, 'expected a scaled quaternion object'));
    return;
  }
  for (const component of ['x', 'y', 'z', 'w']) {
    push(errors, Number.isSafeInteger(value[component]), 'WBIR_QUATERNION_COMPONENT_INVALID', `${path}/${component}`, 'expected a safe integer');
  }
  push(errors, value.scale === QUATERNION_SCALE, 'WBIR_QUATERNION_SCALE_INVALID', `${path}/scale`, `expected scale ${QUATERNION_SCALE}`);
  if (['x', 'y', 'z', 'w'].every(component => Number.isSafeInteger(value[component])) && value.scale === QUATERNION_SCALE) {
    const normSquared = value.x ** 2 + value.y ** 2 + value.z ** 2 + value.w ** 2;
    const tolerance = QUATERNION_SCALE * 3;
    push(
      errors,
      Math.abs(normSquared - QUATERNION_SCALE ** 2) <= tolerance,
      'WBIR_QUATERNION_NOT_NORMALIZED',
      path,
      'quaternion norm is outside the fixed-point normalization tolerance',
      { normSquared, expected: QUATERNION_SCALE ** 2, tolerance },
    );
    push(errors, quaternionSignIsCanonical(value), 'WBIR_QUATERNION_SIGN_NONCANONICAL', path, 'q and -q must use the canonical positive leading sign');
  }
}

export function normalizeQuaternion(input, scale = QUATERNION_SCALE) {
  const components = ['x', 'y', 'z', 'w'].map(key => Number(input?.[key]));
  if (!Number.isSafeInteger(scale) || scale <= 0 || components.some(value => !Number.isFinite(value))) {
    throw new WorldBodyValidationError('WBIR_QUATERNION_INPUT_INVALID', '/rotation', 'finite quaternion components and a positive safe scale are required');
  }
  const norm = Math.hypot(...components);
  if (!(norm > 0)) throw new WorldBodyValidationError('WBIR_QUATERNION_ZERO', '/rotation', 'zero quaternion cannot be normalized');
  let [x, y, z, w] = components.map(value => Math.round((value / norm) * scale));
  const candidate = { x, y, z, w };
  if (!quaternionSignIsCanonical(candidate)) {
    x = -x;
    y = -y;
    z = -z;
    w = -w;
  }
  x = Object.is(x, -0) ? 0 : x;
  y = Object.is(y, -0) ? 0 : y;
  z = Object.is(z, -0) ? 0 : z;
  w = Object.is(w, -0) ? 0 : w;
  return { x, y, z, w, scale };
}

export function quaternionFromEulerMilliDegrees(rotation = { x: 0, y: 0, z: 0 }) {
  for (const axis of ['x', 'y', 'z']) {
    if (!Number.isSafeInteger(rotation[axis])) {
      throw new WorldBodyValidationError('WBIR_EULER_COMPONENT_INVALID', `/rotation/${axis}`, 'Euler milli-degrees must be safe integers');
    }
  }
  const factor = Math.PI / 360_000;
  const cx = Math.cos(rotation.x * factor);
  const sx = Math.sin(rotation.x * factor);
  const cy = Math.cos(rotation.y * factor);
  const sy = Math.sin(rotation.y * factor);
  const cz = Math.cos(rotation.z * factor);
  const sz = Math.sin(rotation.z * factor);
  return normalizeQuaternion({
    x: sx * cy * cz - cx * sy * sz,
    y: cx * sy * cz + sx * cy * sz,
    z: cx * cy * sz - sx * sy * cz,
    w: cx * cy * cz + sx * sy * sz,
  });
}

export function quaternionToEulerMilliDegrees(quaternion) {
  const errors = [];
  validateQuaternion(quaternion, '/rotation', errors);
  if (errors.length > 0) {
    const first = errors[0];
    throw new WorldBodyValidationError(first.code, first.path, first.message, first.details);
  }
  const x = quaternion.x / quaternion.scale;
  const y = quaternion.y / quaternion.scale;
  const z = quaternion.z / quaternion.scale;
  const w = quaternion.w / quaternion.scale;
  const roll = Math.atan2(2 * (w * x + y * z), 1 - 2 * (x * x + y * y));
  const sinPitch = Math.max(-1, Math.min(1, 2 * (w * y - z * x)));
  const pitch = Math.asin(sinPitch);
  const yaw = Math.atan2(2 * (w * z + x * y), 1 - 2 * (y * y + z * z));
  const factor = 180_000 / Math.PI;
  return { x: Math.round(roll * factor), y: Math.round(pitch * factor), z: Math.round(yaw * factor) };
}

export function quaternionEquivalent(left, right, tolerance = 4) {
  const direct = ['x', 'y', 'z', 'w'].every(component => Math.abs(left[component] - right[component]) <= tolerance);
  const opposite = ['x', 'y', 'z', 'w'].every(component => Math.abs(left[component] + right[component]) <= tolerance);
  return direct || opposite;
}

function multiplyQuaternion(left, right) {
  const scale = QUATERNION_SCALE;
  return normalizeQuaternion({
    x: (left.w * right.x + left.x * right.w + left.y * right.z - left.z * right.y) / scale,
    y: (left.w * right.y - left.x * right.z + left.y * right.w + left.z * right.x) / scale,
    z: (left.w * right.z + left.x * right.y - left.y * right.x + left.z * right.w) / scale,
    w: (left.w * right.w - left.x * right.x - left.y * right.y - left.z * right.z) / scale,
  });
}

function rotateVector(vector, rotation) {
  const scale = rotation.scale;
  const qx = rotation.x / scale;
  const qy = rotation.y / scale;
  const qz = rotation.z / scale;
  const qw = rotation.w / scale;
  const vx = vector.x;
  const vy = vector.y;
  const vz = vector.z;
  const tx = 2 * (qy * vz - qz * vy);
  const ty = 2 * (qz * vx - qx * vz);
  const tz = 2 * (qx * vy - qy * vx);
  return {
    x: Math.round(vx + qw * tx + (qy * tz - qz * ty)),
    y: Math.round(vy + qw * ty + (qz * tx - qx * tz)),
    z: Math.round(vz + qw * tz + (qx * ty - qy * tx)),
  };
}

export function composeBodyMapTransform(physicalTransform, visualOnlyOffset) {
  const rotatedOffset = rotateVector(visualOnlyOffset.positionMm, physicalTransform.rotation);
  return {
    positionMm: {
      x: physicalTransform.positionMm.x + rotatedOffset.x,
      y: physicalTransform.positionMm.y + rotatedOffset.y,
      z: physicalTransform.positionMm.z + rotatedOffset.z,
    },
    rotation: multiplyQuaternion(physicalTransform.rotation, visualOnlyOffset.rotation),
    scale: canonicalClone(visualOnlyOffset.scale),
  };
}

function validateFormats(ir, errors) {
  push(errors, ir.format === WORLD_BODY_IR_FORMAT, 'WBIR_FORMAT_INVALID', '/format', `expected ${WORLD_BODY_IR_FORMAT}`);
  push(errors, ir.irVersion === WORLD_BODY_IR_VERSION, 'WBIR_VERSION_INVALID', '/irVersion', `expected ${WORLD_BODY_IR_VERSION}`);
  for (const [key, format] of Object.entries(COMPONENT_FORMATS)) {
    push(errors, isRecord(ir[key]), 'WBIR_COMPONENT_REQUIRED', `/${key}`, `${key} component is required`);
    if (isRecord(ir[key])) push(errors, ir[key].format === format, 'WBIR_COMPONENT_FORMAT_INVALID', `/${key}/format`, `expected ${format}`);
  }
}

function unique(items, path, key, errors) {
  const map = new Map();
  if (!Array.isArray(items)) {
    errors.push(diagnostic('WBIR_ARRAY_REQUIRED', path, 'expected an array'));
    return map;
  }
  items.forEach((item, index) => {
    const value = item?.[key];
    validateId(value, `${path}/${index}/${key}`, errors);
    if (!validId(value)) return;
    if (map.has(value)) errors.push(diagnostic('WBIR_ID_DUPLICATE', `${path}/${index}/${key}`, `duplicate ${key} ${value}`));
    else map.set(value, item);
  });
  return map;
}

function validateAuthority(ir, errors) {
  const state = ir.authorityState;
  if (!isRecord(state)) return;
  push(errors, state.worldId === ir.worldId, 'WBIR_AUTHORITY_WORLD_MISMATCH', '/authorityState/worldId', 'authority worldId must match IR worldId');
  push(errors, state.generation === ir.generation, 'WBIR_AUTHORITY_GENERATION_MISMATCH', '/authorityState/generation', 'authority generation must match IR generation');
  push(errors, state.revision === ir.revision, 'WBIR_AUTHORITY_REVISION_MISMATCH', '/authorityState/revision', 'authority revision must match IR revision');
  push(errors, AUTHORITY_CLASSES.has(state.authorityClass), 'WBIR_AUTHORITY_CLASS_INVALID', '/authorityState/authorityClass', 'invalid authority class');
  validateId(state.authorityOwner, '/authorityState/authorityOwner', errors);
  push(errors, isSha256(state.sourceRealityRoot), 'WBIR_AUTHORITY_ROOT_INVALID', '/authorityState/sourceRealityRoot', 'sourceRealityRoot must be a lowercase SHA-256 root');
  if (state.proposalRoot !== undefined) push(errors, isSha256(state.proposalRoot), 'WBIR_PROPOSAL_ROOT_INVALID', '/authorityState/proposalRoot', 'proposalRoot must be a lowercase SHA-256 root');
  if (state.commitRoot !== undefined) push(errors, isSha256(state.commitRoot), 'WBIR_COMMIT_ROOT_INVALID', '/authorityState/commitRoot', 'commitRoot must be a lowercase SHA-256 root');
  if (state.authorityClass === 'committed-generation') {
    push(errors, isSha256(state.commitRoot), 'WBIR_COMMIT_ROOT_REQUIRED', '/authorityState/commitRoot', 'committed-generation requires commitRoot');
  }
  if (state.authorityClass === 'candidate') push(errors, state.commitRoot === undefined, 'WBIR_CANDIDATE_COMMIT_ROOT_FORBIDDEN', '/authorityState/commitRoot', 'candidate authority cannot carry a commit root');
  if (!Array.isArray(state.capabilityScopes)) errors.push(diagnostic('WBIR_AUTHORITY_SCOPES_REQUIRED', '/authorityState/capabilityScopes', 'capabilityScopes must be an array'));
  else {
    const scopes = new Set();
    state.capabilityScopes.forEach((scope, index) => {
      validateId(scope, `/authorityState/capabilityScopes/${index}`, errors);
      if (scopes.has(scope)) errors.push(diagnostic('WBIR_AUTHORITY_SCOPE_DUPLICATE', `/authorityState/capabilityScopes/${index}`, `duplicate capability scope ${scope}`));
      scopes.add(scope);
    });
  }
}

function validatePhysical(ir, errors) {
  const state = ir.physicalBodyState;
  if (!isRecord(state)) return new Map();
  push(errors, state.coordinateSystem === 'right-handed-y-up', 'WBIR_COORDINATE_SYSTEM_INVALID', '/physicalBodyState/coordinateSystem', 'v0.1 requires right-handed-y-up');
  push(errors, state.positionUnit === 'millimetre', 'WBIR_POSITION_UNIT_INVALID', '/physicalBodyState/positionUnit', 'v0.1 requires millimetre positions');
  const bodies = unique(state.bodies, '/physicalBodyState/bodies', 'id', errors);
  for (const [id, body] of bodies) {
    validateId(body.entityId, `/physicalBodyState/bodies/${id}/entityId`, errors);
    push(errors, BODY_KINDS.has(body.kind), 'WBIR_BODY_KIND_INVALID', `/physicalBodyState/bodies/${id}/kind`, 'invalid physical body kind');
    if (!isRecord(body.transform)) errors.push(diagnostic('WBIR_TRANSFORM_REQUIRED', `/physicalBodyState/bodies/${id}/transform`, 'transform is required'));
    else {
      validateVector3(body.transform.positionMm, `/physicalBodyState/bodies/${id}/transform/positionMm`, errors);
      validateQuaternion(body.transform.rotation, `/physicalBodyState/bodies/${id}/transform/rotation`, errors);
    }
    if (body.linearVelocityMmPerSecond !== undefined) validateVector3(body.linearVelocityMmPerSecond, `/physicalBodyState/bodies/${id}/linearVelocityMmPerSecond`, errors);
    if (body.angularVelocityMilliDegPerSecond !== undefined) validateVector3(body.angularVelocityMilliDegPerSecond, `/physicalBodyState/bodies/${id}/angularVelocityMilliDegPerSecond`, errors);
    if (body.kind === 'dynamic') push(errors, Number.isSafeInteger(body.massGrams) && body.massGrams > 0 && body.massGrams <= Math.floor(Number.MAX_SAFE_INTEGER / 1000), 'WBIR_DYNAMIC_MASS_INVALID', `/physicalBodyState/bodies/${id}/massGrams`, 'dynamic body mass must be positive and safely convertible to RSR massQ');
    const fixtures = unique(body.fixtures, `/physicalBodyState/bodies/${id}/fixtures`, 'id', errors);
    push(errors, fixtures.size > 0, 'WBIR_BODY_FIXTURE_REQUIRED', `/physicalBodyState/bodies/${id}/fixtures`, 'at least one fixture is required');
    for (const [fixtureId, fixture] of fixtures) {
      push(errors, isRecord(fixture.shape) && SHAPE_KINDS.has(fixture.shape?.type), 'WBIR_SHAPE_INVALID', `/physicalBodyState/bodies/${id}/fixtures/${fixtureId}/shape`, 'shape must be sphere, box, or capsule');
      if (fixture.shape?.type === 'sphere') push(errors, Number.isSafeInteger(fixture.shape.radiusMm) && fixture.shape.radiusMm > 0, 'WBIR_SHAPE_RADIUS_INVALID', `/physicalBodyState/bodies/${id}/fixtures/${fixtureId}/shape/radiusMm`, 'radiusMm must be positive');
      if (fixture.shape?.type === 'box') {
        validateVector3(fixture.shape.halfExtentsMm, `/physicalBodyState/bodies/${id}/fixtures/${fixtureId}/shape/halfExtentsMm`, errors);
        if (isRecord(fixture.shape.halfExtentsMm)) {
          push(errors, ['x', 'y', 'z'].every(axis => fixture.shape.halfExtentsMm[axis] > 0), 'WBIR_SHAPE_EXTENT_INVALID', `/physicalBodyState/bodies/${id}/fixtures/${fixtureId}/shape/halfExtentsMm`, 'box half extents must be positive');
        }
      }
      if (fixture.shape?.type === 'capsule') {
        push(errors, Number.isSafeInteger(fixture.shape.radiusMm) && fixture.shape.radiusMm > 0, 'WBIR_SHAPE_RADIUS_INVALID', `/physicalBodyState/bodies/${id}/fixtures/${fixtureId}/shape/radiusMm`, 'radiusMm must be positive');
        push(errors, Number.isSafeInteger(fixture.shape.halfHeightMm) && fixture.shape.halfHeightMm >= 0, 'WBIR_SHAPE_HALF_HEIGHT_INVALID', `/physicalBodyState/bodies/${id}/fixtures/${fixtureId}/shape/halfHeightMm`, 'halfHeightMm must be non-negative');
      }
      if (fixture.localPositionMm !== undefined) validateVector3(fixture.localPositionMm, `/physicalBodyState/bodies/${id}/fixtures/${fixtureId}/localPositionMm`, errors);
      if (fixture.collisionFilter !== undefined) {
        push(errors, Number.isSafeInteger(fixture.collisionFilter.categoryBits) && fixture.collisionFilter.categoryBits >= 0 && fixture.collisionFilter.categoryBits <= 0xffff_ffff, 'WBIR_COLLISION_FILTER_INVALID', `/physicalBodyState/bodies/${id}/fixtures/${fixtureId}/collisionFilter/categoryBits`, 'categoryBits must be an unsigned 32-bit integer');
        push(errors, Number.isSafeInteger(fixture.collisionFilter.maskBits) && fixture.collisionFilter.maskBits >= 0 && fixture.collisionFilter.maskBits <= 0xffff_ffff, 'WBIR_COLLISION_FILTER_INVALID', `/physicalBodyState/bodies/${id}/fixtures/${fixtureId}/collisionFilter/maskBits`, 'maskBits must be an unsigned 32-bit integer');
      }
    }
  }
  return bodies;
}

function validateVisual(ir, assets, errors) {
  const state = ir.visualBodyState;
  if (!isRecord(state)) return new Map();
  const bodies = unique(state.bodies, '/visualBodyState/bodies', 'id', errors);
  const globalNodeIds = new Set();
  for (const [id, body] of bodies) {
    validateId(body.entityId, `/visualBodyState/bodies/${id}/entityId`, errors);
    const nodes = unique(body.nodes, `/visualBodyState/bodies/${id}/nodes`, 'id', errors);
    push(errors, nodes.has(body.rootNodeId), 'WBIR_VISUAL_ROOT_NODE_MISSING', `/visualBodyState/bodies/${id}/rootNodeId`, `root node ${body.rootNodeId} does not exist`);
    const parents = new Map();
    for (const [nodeId, node] of nodes) {
      if (globalNodeIds.has(nodeId)) errors.push(diagnostic('WBIR_VISUAL_NODE_GLOBAL_DUPLICATE', `/visualBodyState/bodies/${id}/nodes/${nodeId}/id`, `visual node id ${nodeId} is already used by another visual body`));
      globalNodeIds.add(nodeId);
      if (node.parentId !== undefined && node.parentId !== null) {
        push(errors, nodes.has(node.parentId), 'WBIR_VISUAL_PARENT_MISSING', `/visualBodyState/bodies/${id}/nodes/${nodeId}/parentId`, `unknown parent ${node.parentId}`);
        parents.set(nodeId, node.parentId);
      }
      if (node.assetRef !== undefined) push(errors, assets.has(node.assetRef), 'WBIR_VISUAL_ASSET_MISSING', `/visualBodyState/bodies/${id}/nodes/${nodeId}/assetRef`, `unknown asset ${node.assetRef}`);
      if (node.materialRef !== undefined) push(errors, assets.has(node.materialRef) && assets.get(node.materialRef)?.kind === 'material', 'WBIR_VISUAL_MATERIAL_MISSING', `/visualBodyState/bodies/${id}/nodes/${nodeId}/materialRef`, `unknown or non-material asset ${node.materialRef}`);
    }
    const rootNode = nodes.get(body.rootNodeId);
    push(errors, rootNode?.parentId === undefined || rootNode?.parentId === null, 'WBIR_VISUAL_ROOT_HAS_PARENT', `/visualBodyState/bodies/${id}/rootNodeId`, 'root node cannot have a parent');
    for (const nodeId of nodes.keys()) {
      const seen = new Set();
      let current = nodeId;
      while (current !== body.rootNodeId) {
        if (seen.has(current)) {
          errors.push(diagnostic('WBIR_VISUAL_HIERARCHY_CYCLE', `/visualBodyState/bodies/${id}/nodes/${nodeId}`, 'visual node hierarchy contains a cycle'));
          break;
        }
        seen.add(current);
        const parent = parents.get(current);
        if (parent === undefined) {
          errors.push(diagnostic('WBIR_VISUAL_NODE_DISCONNECTED', `/visualBodyState/bodies/${id}/nodes/${nodeId}`, `node ${nodeId} is not connected to root ${body.rootNodeId}`));
          break;
        }
        current = parent;
      }
    }
  }
  return bodies;
}

function validateTemporal(ir, errors) {
  const state = ir.temporalPresentationState;
  if (!isRecord(state)) return new Map();
  validateSafeNonnegative(state.clock?.tick, '/temporalPresentationState/clock/tick', errors);
  push(errors, Number.isSafeInteger(state.clock?.tickHz) && state.clock.tickHz > 0, 'WBIR_CLOCK_RATE_INVALID', '/temporalPresentationState/clock/tickHz', 'tickHz must be a positive safe integer');
  const policies = unique(state.policies, '/temporalPresentationState/policies', 'id', errors);
  for (const [id, policy] of policies) {
    push(errors, TEMPORAL_MODES.has(policy.mode), 'WBIR_TEMPORAL_MODE_INVALID', `/temporalPresentationState/policies/${id}/mode`, 'invalid temporal mode');
    validateSafeNonnegative(policy.interpolationDelayTicks, `/temporalPresentationState/policies/${id}/interpolationDelayTicks`, errors);
    validateSafeNonnegative(policy.maximumExtrapolationTicks, `/temporalPresentationState/policies/${id}/maximumExtrapolationTicks`, errors);
    validateSafeNonnegative(policy.snapDistanceMm, `/temporalPresentationState/policies/${id}/snapDistanceMm`, errors);
    validateSafeNonnegative(policy.blendTicks, `/temporalPresentationState/policies/${id}/blendTicks`, errors);
    push(errors, policy.authorityRootBinding === 'required', 'WBIR_TEMPORAL_AUTHORITY_BINDING_REQUIRED', `/temporalPresentationState/policies/${id}/authorityRootBinding`, 'presentation policies must require an authority root binding');
    if (policy.mode === 'extrapolate') push(errors, policy.maximumExtrapolationTicks > 0, 'WBIR_EXTRAPOLATION_BOUND_REQUIRED', `/temporalPresentationState/policies/${id}/maximumExtrapolationTicks`, 'extrapolation requires a positive bound');
  }
  return policies;
}

function validateAssets(ir, errors) {
  const state = ir.assetState;
  if (!isRecord(state)) return new Map();
  const assets = unique(state.assets, '/assetState/assets', 'id', errors);
  for (const [id, asset] of assets) {
    push(errors, ASSET_KINDS.has(asset.kind), 'WBIR_ASSET_KIND_INVALID', `/assetState/assets/${id}/kind`, 'invalid asset kind');
    push(errors, typeof asset.version === 'string' && asset.version.length > 0, 'WBIR_ASSET_VERSION_REQUIRED', `/assetState/assets/${id}/version`, 'asset version is required');
    push(errors, isSha256(asset.contentRoot), 'WBIR_ASSET_ROOT_INVALID', `/assetState/assets/${id}/contentRoot`, 'asset contentRoot must be SHA-256');
    push(errors, RESIDENCY.has(asset.residency), 'WBIR_ASSET_RESIDENCY_INVALID', `/assetState/assets/${id}/residency`, 'invalid asset residency');
    if (asset.importReceiptRoot !== undefined) push(errors, isSha256(asset.importReceiptRoot), 'WBIR_ASSET_IMPORT_ROOT_INVALID', `/assetState/assets/${id}/importReceiptRoot`, 'importReceiptRoot must be SHA-256');
  }
  return assets;
}

function validateObservers(ir, errors) {
  const state = ir.observerState;
  if (!isRecord(state)) return new Map();
  const observers = unique(state.observers, '/observerState/observers', 'id', errors);
  for (const [id, observer] of observers) {
    const capabilities = Array.isArray(observer.capabilities) ? observer.capabilities : [];
    push(errors, QUALITY_TIERS.has(observer.qualityTier), 'WBIR_OBSERVER_QUALITY_TIER_INVALID', `/observerState/observers/${id}/qualityTier`, 'invalid observer quality tier');
    if (!Array.isArray(observer.capabilities)) errors.push(diagnostic('WBIR_OBSERVER_CAPABILITIES_REQUIRED', `/observerState/observers/${id}/capabilities`, 'capabilities must be an array'));
    const seenCapabilities = new Set();
    for (const [index, capability] of capabilities.entries()) {
      push(
        errors,
        typeof capability === 'string' && !/(^|[.:/-])(write|commit|authorize)([.:/-]|$)/i.test(capability),
        'WBIR_OBSERVER_AUTHORITY_FORBIDDEN',
        `/observerState/observers/${id}/capabilities/${index}`,
        'observer capabilities cannot grant write, commit, or authorization authority',
      );
      if (seenCapabilities.has(capability)) errors.push(diagnostic('WBIR_OBSERVER_CAPABILITY_DUPLICATE', `/observerState/observers/${id}/capabilities/${index}`, `duplicate capability ${capability}`));
      seenCapabilities.add(capability);
    }
    if (observer.visibleTags !== undefined) {
      push(errors, Array.isArray(observer.visibleTags) && observer.visibleTags.every(tag => typeof tag === 'string'), 'WBIR_OBSERVER_VISIBLE_TAGS_INVALID', `/observerState/observers/${id}/visibleTags`, 'visibleTags must be an array of strings');
      if (Array.isArray(observer.visibleTags)) push(errors, new Set(observer.visibleTags).size === observer.visibleTags.length, 'WBIR_OBSERVER_VISIBLE_TAG_DUPLICATE', `/observerState/observers/${id}/visibleTags`, 'visibleTags must be unique');
    }
  }
  return observers;
}

function validateEvents(ir, errors) {
  const state = ir.worldEventState;
  if (!isRecord(state)) return new Map();
  const events = unique(state.events, '/worldEventState/events', 'id', errors);
  const onceKeys = new Set();
  for (const [id, event] of events) {
    push(errors, EVENT_SOURCES.has(event.source), 'WBIR_EVENT_SOURCE_INVALID', `/worldEventState/events/${id}/source`, 'invalid event source');
    validateId(event.kind, `/worldEventState/events/${id}/kind`, errors);
    validateSafeNonnegative(event.tick, `/worldEventState/events/${id}/tick`, errors);
    validateSafeNonnegative(event.sequence, `/worldEventState/events/${id}/sequence`, errors);
    push(errors, event.sourceAuthorityRoot === ir.authorityState?.sourceRealityRoot, 'WBIR_EVENT_AUTHORITY_ROOT_MISMATCH', `/worldEventState/events/${id}/sourceAuthorityRoot`, 'event must bind the active sourceRealityRoot');
    push(errors, typeof event.exactlyOnceKey === 'string' && event.exactlyOnceKey.length > 0 && event.exactlyOnceKey.length <= 512, 'WBIR_EVENT_ONCE_KEY_REQUIRED', `/worldEventState/events/${id}/exactlyOnceKey`, 'exactlyOnceKey is required and cannot exceed 512 characters');
    if (onceKeys.has(event.exactlyOnceKey)) errors.push(diagnostic('WBIR_EVENT_ONCE_KEY_DUPLICATE', `/worldEventState/events/${id}/exactlyOnceKey`, `duplicate exactly-once key ${event.exactlyOnceKey}`));
    onceKeys.add(event.exactlyOnceKey);
    const routeIds = new Set();
    if (!Array.isArray(event.routes)) errors.push(diagnostic('WBIR_EVENT_ROUTES_REQUIRED', `/worldEventState/events/${id}/routes`, 'routes must be an array'));
    for (const [index, route] of (event.routes ?? []).entries()) {
      validateId(route.id, `/worldEventState/events/${id}/routes/${index}/id`, errors);
      validateId(route.target, `/worldEventState/events/${id}/routes/${index}/target`, errors);
      push(errors, EVENT_CONSUMERS.has(route.consumer), 'WBIR_EVENT_CONSUMER_INVALID', `/worldEventState/events/${id}/routes/${index}/consumer`, 'invalid or authority-owning event consumer');
      if (routeIds.has(route.id)) errors.push(diagnostic('WBIR_EVENT_ROUTE_DUPLICATE', `/worldEventState/events/${id}/routes/${index}/id`, `duplicate route ${route.id}`));
      routeIds.add(route.id);
    }
  }
  return events;
}

function validateBodyMaps(ir, physicalBodies, visualBodies, policies, errors) {
  const maps = unique(ir.bodyMaps, '/bodyMaps', 'entityId', errors);
  const usedPhysical = new Set();
  const usedVisual = new Set();
  for (const [entityId, map] of maps) {
    push(errors, map.authorityMode === 'authoritative' || map.authorityMode === 'presentation-only', 'WBIR_BODY_MAP_AUTHORITY_MODE_INVALID', `/bodyMaps/${entityId}/authorityMode`, 'authorityMode must be authoritative or presentation-only');
    if (map.authorityMode === 'authoritative') {
      push(errors, physicalBodies.has(map.physicalBodyRef), 'WBIR_BODY_MAP_PHYSICAL_MISSING', `/bodyMaps/${entityId}/physicalBodyRef`, `unknown physical body ${map.physicalBodyRef}`);
    } else {
      push(errors, map.physicalBodyRef === undefined || map.physicalBodyRef === null, 'WBIR_PRESENTATION_ONLY_PHYSICAL_FORBIDDEN', `/bodyMaps/${entityId}/physicalBodyRef`, 'presentation-only mappings cannot claim a physical body');
    }
    push(errors, visualBodies.has(map.visualBodyRef), 'WBIR_BODY_MAP_VISUAL_MISSING', `/bodyMaps/${entityId}/visualBodyRef`, `unknown visual body ${map.visualBodyRef}`);
    push(errors, policies.has(map.temporalPolicyRef), 'WBIR_BODY_MAP_TEMPORAL_MISSING', `/bodyMaps/${entityId}/temporalPolicyRef`, `unknown temporal policy ${map.temporalPolicyRef}`);
    if (map.physicalBodyRef !== undefined && map.physicalBodyRef !== null) {
      if (usedPhysical.has(map.physicalBodyRef)) errors.push(diagnostic('WBIR_BODY_MAP_PHYSICAL_DUPLICATE', `/bodyMaps/${entityId}/physicalBodyRef`, `physical body ${map.physicalBodyRef} is already mapped`));
      usedPhysical.add(map.physicalBodyRef);
      const physical = physicalBodies.get(map.physicalBodyRef);
      push(errors, physical?.entityId === entityId, 'WBIR_BODY_MAP_ENTITY_MISMATCH', `/bodyMaps/${entityId}/physicalBodyRef`, 'physical entityId must match BodyMap entityId');
    }
    if (map.visualBodyRef !== undefined) {
      if (usedVisual.has(map.visualBodyRef)) errors.push(diagnostic('WBIR_BODY_MAP_VISUAL_DUPLICATE', `/bodyMaps/${entityId}/visualBodyRef`, `visual body ${map.visualBodyRef} is already mapped`));
      usedVisual.add(map.visualBodyRef);
      const visual = visualBodies.get(map.visualBodyRef);
      push(errors, visual?.entityId === entityId, 'WBIR_BODY_MAP_ENTITY_MISMATCH', `/bodyMaps/${entityId}/visualBodyRef`, 'visual entityId must match BodyMap entityId');
    }
    if (!isRecord(map.visualOnlyOffset)) errors.push(diagnostic('WBIR_VISUAL_OFFSET_REQUIRED', `/bodyMaps/${entityId}/visualOnlyOffset`, 'visualOnlyOffset is required'));
    else {
      validateVector3(map.visualOnlyOffset.positionMm, `/bodyMaps/${entityId}/visualOnlyOffset/positionMm`, errors);
      validateQuaternion(map.visualOnlyOffset.rotation, `/bodyMaps/${entityId}/visualOnlyOffset/rotation`, errors);
      validateVector3(map.visualOnlyOffset.scale, `/bodyMaps/${entityId}/visualOnlyOffset/scale`, errors);
      push(errors, map.visualOnlyOffset.scale?.scale === TRANSFORM_SCALE, 'WBIR_VISUAL_SCALE_INVALID', `/bodyMaps/${entityId}/visualOnlyOffset/scale/scale`, `visual scale must use ${TRANSFORM_SCALE}`);
      push(errors, map.visualOnlyOffset.authorityAffecting === false, 'WBIR_VISUAL_OFFSET_AUTHORITY_FORBIDDEN', `/bodyMaps/${entityId}/visualOnlyOffset/authorityAffecting`, 'visual-only offset must explicitly declare authorityAffecting=false');
    }
  }
  for (const [bodyId] of physicalBodies) {
    if (!usedPhysical.has(bodyId)) errors.push(diagnostic('WBIR_BODY_MAP_PHYSICAL_UNBOUND', '/bodyMaps', `physical body ${bodyId} has no BodyMap`));
  }
  for (const [bodyId] of visualBodies) {
    if (!usedVisual.has(bodyId)) errors.push(diagnostic('WBIR_BODY_MAP_VISUAL_UNBOUND', '/bodyMaps', `visual body ${bodyId} has no BodyMap`));
  }
  return maps;
}

function validateRoots(ir, errors) {
  if (!isRecord(ir.roots)) {
    errors.push(diagnostic('WBIR_ROOTS_REQUIRED', '/roots', 'sealed IR roots are required'));
    return;
  }
  for (const [component, rootField] of ROOT_COMPONENTS) {
    const expected = semanticHash(ir[component]);
    push(errors, ir.roots[rootField] === expected, 'WBIR_COMPONENT_ROOT_MISMATCH', `/roots/${rootField}`, `${rootField} does not match ${component}`, { expected, actual: ir.roots[rootField] });
  }
  const worldRootBase = {
    format: ir.format,
    irVersion: ir.irVersion,
    worldId: ir.worldId,
    generation: ir.generation,
    revision: ir.revision,
    componentRoots: Object.fromEntries(ROOT_COMPONENTS.map(([, rootField]) => [rootField, ir.roots[rootField]])),
  };
  const expectedWorldBodyRoot = semanticHash(worldRootBase);
  push(errors, ir.roots.worldBodyRoot === expectedWorldBodyRoot, 'WBIR_WORLD_ROOT_MISMATCH', '/roots/worldBodyRoot', 'worldBodyRoot does not match component roots', { expected: expectedWorldBodyRoot, actual: ir.roots.worldBodyRoot });
}

export function validateWorldBodyIR(ir, options = {}) {
  const errors = [];
  if (!isRecord(ir)) return { ok: false, errors: [diagnostic('WBIR_OBJECT_REQUIRED', '', 'World Body IR must be an object')] };
  try {
    canonicalize(ir);
  } catch (error) {
    if (error instanceof WorldBodyValidationError) errors.push(error.toJSON());
    else throw error;
  }
  validateFormats(ir, errors);
  validateId(ir.worldId, '/worldId', errors);
  validateSafeNonnegative(ir.generation, '/generation', errors);
  validateSafeNonnegative(ir.revision, '/revision', errors);
  validateAuthority(ir, errors);
  const physicalBodies = validatePhysical(ir, errors);
  const temporalPolicies = validateTemporal(ir, errors);
  const assets = validateAssets(ir, errors);
  const visualBodies = validateVisual(ir, assets, errors);
  validateObservers(ir, errors);
  validateEvents(ir, errors);
  validateBodyMaps(ir, physicalBodies, visualBodies, temporalPolicies, errors);
  if (!Array.isArray(ir.renderGraphs)) errors.push(diagnostic('WBIR_ARRAY_REQUIRED', '/renderGraphs', 'renderGraphs must be an array'));
  else {
    const graphIds = new Set();
    ir.renderGraphs.forEach((graph, index) => {
      if (graphIds.has(graph?.id)) errors.push(diagnostic('WBIR_ID_DUPLICATE', `/renderGraphs/${index}/id`, `duplicate graph id ${graph.id}`));
      graphIds.add(graph?.id);
      const result = validateRenderGraph(graph);
      result.errors.forEach(error => errors.push({ ...error, path: `/renderGraphs/${index}${error.path}` }));
    });
  }
  if (options.requireRoots !== false) validateRoots(ir, errors);
  return { ok: errors.length === 0, errors };
}

export function assertWorldBodyIR(ir, options = {}) {
  const result = validateWorldBodyIR(ir, options);
  if (!result.ok) {
    const first = result.errors[0];
    throw new WorldBodyValidationError(first.code, first.path, first.message, first.details);
  }
  return ir;
}

function component(value, format, defaults) {
  return { format, ...defaults, ...(value ?? {}) };
}

function sortBy(items, selector) {
  return [...(items ?? [])].sort((left, right) => compareUtf8(selector(left), selector(right)));
}

function normalizeWorldCollections(value) {
  const output = canonicalClone(value);
  output.authorityState.capabilityScopes = sortBy(output.authorityState.capabilityScopes, item => item);
  output.physicalBodyState.bodies = sortBy(output.physicalBodyState.bodies, item => item.id).map(body => ({
    ...body,
    fixtures: sortBy(body.fixtures, item => item.id),
    ...(body.tags === undefined ? {} : { tags: sortBy(body.tags, item => item) }),
  }));
  output.visualBodyState.bodies = sortBy(output.visualBodyState.bodies, item => item.id).map(body => ({
    ...body,
    nodes: sortBy(body.nodes, item => item.id).map(node => ({
      ...node,
      ...(node.tags === undefined ? {} : { tags: sortBy(node.tags, item => item) }),
    })),
  }));
  output.temporalPresentationState.policies = sortBy(output.temporalPresentationState.policies, item => item.id);
  output.assetState.assets = sortBy(output.assetState.assets, item => item.id);
  output.observerState.observers = sortBy(output.observerState.observers, item => item.id).map(observer => ({
    ...observer,
    capabilities: sortBy(observer.capabilities, item => item),
    ...(observer.visibleTags === undefined ? {} : { visibleTags: sortBy(observer.visibleTags, item => item) }),
  }));
  output.worldEventState.events = [...(output.worldEventState.events ?? [])]
    .sort((left, right) => left.tick - right.tick || left.sequence - right.sequence || compareUtf8(left.id, right.id))
    .map(event => ({ ...event, routes: sortBy(event.routes, item => item.id) }));
  output.bodyMaps = sortBy(output.bodyMaps, item => item.entityId);
  output.renderGraphs = sortBy(output.renderGraphs, item => item.id);
  return canonicalClone(output);
}

export function createWorldBodyIR(input) {
  if (!isRecord(input)) throw new WorldBodyValidationError('WBIR_OBJECT_REQUIRED', '', 'input must be an object');
  const ir = normalizeWorldCollections({
    format: WORLD_BODY_IR_FORMAT,
    irVersion: WORLD_BODY_IR_VERSION,
    worldId: input.worldId,
    generation: input.generation,
    revision: input.revision,
    authorityState: component(input.authorityState, COMPONENT_FORMATS.authorityState, { capabilityScopes: [] }),
    physicalBodyState: component(input.physicalBodyState, COMPONENT_FORMATS.physicalBodyState, {
      coordinateSystem: 'right-handed-y-up',
      positionUnit: 'millimetre',
      bodies: [],
    }),
    visualBodyState: component(input.visualBodyState, COMPONENT_FORMATS.visualBodyState, { bodies: [] }),
    temporalPresentationState: component(input.temporalPresentationState, COMPONENT_FORMATS.temporalPresentationState, {
      clock: { tick: 0, tickHz: 60 },
      policies: [],
    }),
    assetState: component(input.assetState, COMPONENT_FORMATS.assetState, { assets: [] }),
    observerState: component(input.observerState, COMPONENT_FORMATS.observerState, { observers: [] }),
    worldEventState: component(input.worldEventState, COMPONENT_FORMATS.worldEventState, { events: [] }),
    bodyMaps: input.bodyMaps ?? [],
    renderGraphs: (input.renderGraphs ?? []).map(graph => {
      if (graph?.graphRoot !== undefined && validateRenderGraph(graph).ok) return graph;
      return sealRenderGraph(graph);
    }),
  });
  assertWorldBodyIR(ir, { requireRoots: false });
  const componentRoots = Object.fromEntries(ROOT_COMPONENTS.map(([key, rootField]) => [rootField, semanticHash(ir[key])]));
  const worldRootBase = {
    format: ir.format,
    irVersion: ir.irVersion,
    worldId: ir.worldId,
    generation: ir.generation,
    revision: ir.revision,
    componentRoots,
  };
  const sealed = canonicalClone({ ...ir, roots: { ...componentRoots, worldBodyRoot: semanticHash(worldRootBase) } });
  assertWorldBodyIR(sealed);
  return sealed;
}

export function verifyWorldBodyIR(ir) {
  return validateWorldBodyIR(ir);
}

export function worldBodyRoot(ir) {
  assertWorldBodyIR(ir);
  return ir.roots.worldBodyRoot;
}

export function authorityProjectionInvariant(before, after) {
  return {
    ok: before.roots.authorityStateRoot === after.roots.authorityStateRoot
      && before.roots.physicalBodyRoot === after.roots.physicalBodyRoot,
    beforeAuthorityRoot: before.roots.authorityStateRoot,
    afterAuthorityRoot: after.roots.authorityStateRoot,
    beforePhysicalRoot: before.roots.physicalBodyRoot,
    afterPhysicalRoot: after.roots.physicalBodyRoot,
  };
}
