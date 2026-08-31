import {createHmac, timingSafeEqual} from 'node:crypto';
import {mkdir, open, readFile, rename} from 'node:fs/promises';
import {dirname, isAbsolute} from 'node:path';
import {
  ZERO_ROOT,
  advanceWorldTime,
  appendWorldEvent,
  applyWorldMutation,
  checkAuthorityLease,
  createFactWorldTree,
  createAuthorityLease,
  createRealityConsistencyProfile,
  createRepresentationPortfolio,
  createRepresentationSlot,
  createRepresentationRef,
  createWorldEvent,
  createWorldEventLog,
  createWorldFact,
  createWorldTime,
  replayWorldEvents,
  rebuildFactWorldTree,
  rootHash,
  verifyFactWorldTree,
  verifyAuthorityLease,
  REALITY_CONSISTENCY_PROFILE_FORMAT,
  AUTHORITY_LEASE_FORMAT,
  verifyRealityConsistencyProfile,
  verifyWorldEvent,
  verifyWorldEventLog,
  verifyWorldFact,
  verifyWorldTime,
  worldStateRoot
} from '@taowind/rncs-core-contract';
import {RealityRepresentationFabric, RealityRepresentationPortfolioRuntime} from '@taowind/reality-representation-fabric';

export const LARGE_WORLD_RUNTIME_FORMAT = 'rncs.large-world-runtime.v0.1';
export const LARGE_WORLD_RUNTIME_VERSION = '0.1.0';
export const LARGE_WORLD_REGION_FORMAT = 'rncs.large-world-region.v0.1';
export const LARGE_WORLD_CHUNK_FORMAT = 'rncs.large-world-chunk.v0.1';
export const LARGE_WORLD_STREAM_FORMAT = 'rncs.large-world-stream-resolution.v0.1';
export const LARGE_WORLD_PORTFOLIO_SELECTION_FORMAT = 'rncs.large-world-portfolio-selection.v0.1';
export const LARGE_WORLD_MATERIALIZATION_FORMAT = 'rncs.large-world-materialization.v0.1';
export const LARGE_WORLD_REPLICATION_SNAPSHOT_FORMAT = 'rncs.large-world-replication-snapshot.v0.1';
export const LARGE_WORLD_REPLICATION_DELTA_FORMAT = 'rncs.large-world-replication-delta.v0.1';
export const LARGE_WORLD_REPLICATION_RECEIPT_FORMAT = 'rncs.large-world-replication-receipt.v0.1';
export const LARGE_WORLD_DURABLE_BUNDLE_FORMAT = 'rncs.large-world-durable-bundle.v0.1';
export const LARGE_WORLD_DURABLE_RESTORE_RECEIPT_FORMAT = 'rncs.large-world-durable-restore-receipt.v0.1';
export const LARGE_WORLD_DURABLE_STORE_RECEIPT_FORMAT = 'rncs.large-world-durable-store-receipt.v0.1';
export const LARGE_WORLD_REPLICATION_PACKET_FORMAT = 'rncs.large-world-replication-packet.v0.1';
export const LARGE_WORLD_REPLICATION_ACK_FORMAT = 'rncs.large-world-replication-ack.v0.1';
export const LARGE_WORLD_REPLICATION_CONFLICT_DECISION_FORMAT = 'rncs.large-world-replication-conflict-decision.v0.1';
export const LARGE_WORLD_REPLICATION_CONFLICT_RECEIPT_FORMAT = 'rncs.large-world-replication-conflict-receipt.v0.1';
export const LARGE_WORLD_REPLICATION_CONFLICT_POLICY_ID = 'lexicographic-writer-priority';
export const LARGE_WORLD_CONSISTENCY_PROFILE_FORMAT = REALITY_CONSISTENCY_PROFILE_FORMAT;
export const LARGE_WORLD_AUTHORITY_LEASE_FORMAT = AUTHORITY_LEASE_FORMAT;

export const LARGE_WORLD_BIOMES = Object.freeze(['coast', 'desert', 'forest', 'grassland', 'tundra', 'wetland']);
export const LARGE_WORLD_STRUCTURE_KINDS = Object.freeze(['ruin', 'grove', 'mine', 'shrine', 'watchtower']);
export const LARGE_WORLD_RESOURCE_KINDS = Object.freeze(['crystal', 'iron', 'salt', 'timber', 'water']);
export const LARGE_WORLD_PROCEDURAL_PROVIDER_ID = 'provider:taowind:large-world-procedural-mesh:v0.1';
export const LARGE_WORLD_WIREFRAME_PROVIDER_ID = 'provider:taowind:large-world-wireframe-mesh:v0.1';

const clone = value => structuredClone(value);
const record = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const keySort = (a, b) => Buffer.compare(Buffer.from(String(a), 'utf8'), Buffer.from(String(b), 'utf8'));
const strings = values => [...new Set((Array.isArray(values) ? values : []).map(String).filter(Boolean))].sort(keySort);
const hex64 = value => typeof value === 'string' && /^[0-9a-f]{64}$/i.test(value);
const fail = (condition, code) => { if (!condition) throw new Error(code); };
const integer = (value, fallback, {min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER} = {}) => {
  const number = value === undefined ? fallback : Number(value);
  fail(Number.isSafeInteger(number) && number >= min && number <= max, 'LARGE_WORLD_INTEGER_INVALID');
  return number;
};

function utf8Hash32(value) {
  let hash = 2166136261;
  for (const byte of new TextEncoder().encode(String(value))) hash = Math.imul(hash ^ byte, 16777619) >>> 0;
  return hash >>> 0;
}

function sequence(seed, label) {
  let state = utf8Hash32(`${seed}|${label}`) || 1;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1) >>> 0;
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0);
  };
}

function terrainHeight(seed, sampleX, sampleZ) {
  const coarse = utf8Hash32(`${seed}|terrain|${sampleX}|${sampleZ}`) % 1801;
  const ridge = utf8Hash32(`${seed}|ridge|${Math.floor(sampleX / 4)}|${Math.floor(sampleZ / 4)}`) % 401;
  return coarse - 900 + ridge - 200;
}

function chunkId(worldId, x, z) { return `chunk:${worldId}:${x}:${z}`; }
function objectId(worldId, x, z) { return `reality-object:${worldId}:chunk:${x}:${z}`; }
function chunkKey(x, z) { return `${x}:${z}`; }

function normalizeGeneration(value, fallback = 1) {
  return integer(value, fallback, {min: 0, max: 0x7fffffff});
}

function normalizeGenerationOptions(input = {}) {
  const value = record(input);
  const width = integer(value.width, 9, {min: 1, max: 257});
  const depth = integer(value.depth, 9, {min: 1, max: 257});
  const chunkSize = integer(value.chunkSize, 256, {min: 1, max: 0x7fffffff});
  const sampleResolution = integer(value.sampleResolution, 8, {min: 1, max: 32});
  const centerX = integer(value.centerX ?? value.center_x, 0);
  const centerZ = integer(value.centerZ ?? value.center_z, 0);
  const maximumCoordinate = Math.max(Math.abs(centerX) + Math.ceil(width / 2) + 1, Math.abs(centerZ) + Math.ceil(depth / 2) + 1);
  fail(Number.isSafeInteger(maximumCoordinate * chunkSize * 1000), 'LARGE_WORLD_COORDINATE_RANGE_INVALID');
  return {
    worldId: String(value.worldId ?? value.world_id ?? 'world:large-world'),
    seed: String(value.seed ?? 'large-world-seed'),
    generation: normalizeGeneration(value.generation),
    width,
    depth,
    centerX,
    centerZ,
    chunkSize,
    sampleResolution
  };
}

function normalizeRuntimeOptions(input = {}) {
  const value = record(input);
  const base = normalizeGenerationOptions(value);
  const loadRadius = integer(value.loadRadius ?? value.load_radius, 1, {min: 0, max: 32});
  const unloadRadius = integer(value.unloadRadius ?? value.unload_radius, Math.max(loadRadius, 2), {min: loadRadius, max: 64});
  const maxActiveChunks = integer(value.maxActiveChunks ?? value.max_active_chunks, Math.max(1, (loadRadius * 2 + 1) ** 2), {min: 1, max: 4096});
  const maxWorkingSetBytes = integer(value.maxWorkingSetBytes ?? value.max_working_set_bytes, 4 * 1024 * 1024, {min: 1, max: Number.MAX_SAFE_INTEGER});
  return {...base, loadRadius, unloadRadius, maxActiveChunks, maxWorkingSetBytes};
}

function normalizeDistributionProfile(input, worldId) {
  if (input === undefined || input === null) return null;
  const profile = record(input).profile_root ? clone(input) : createRealityConsistencyProfile({
    profile_id: `consistency:${worldId}`,
    ...record(input)
  });
  const verification = verifyRealityConsistencyProfile(profile);
  fail(verification.valid, `LARGE_WORLD_CONSISTENCY_PROFILE_INVALID:${verification.errors.join(',')}`);
  return profile;
}

function normalizeDistributionLease(input) {
  if (input === undefined || input === null) return null;
  const lease = record(input).lease_root ? clone(input) : createAuthorityLease(input);
  const verification = verifyAuthorityLease(lease);
  fail(verification.valid, `LARGE_WORLD_AUTHORITY_LEASE_INVALID:${verification.errors.join(',')}`);
  return lease;
}

function gridMesh(seed, x, z, sampleResolution) {
  const positions = [];
  const indices = [];
  for (let row = 0; row <= sampleResolution; row++) {
    for (let column = 0; column <= sampleResolution; column++) {
      const sampleX = x * sampleResolution + column;
      const sampleZ = z * sampleResolution + row;
      positions.push(column, terrainHeight(seed, sampleX, sampleZ), row);
    }
  }
  const stride = sampleResolution + 1;
  for (let row = 0; row < sampleResolution; row++) {
    for (let column = 0; column < sampleResolution; column++) {
      const a = row * stride + column;
      const b = a + 1;
      const c = a + stride;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }
  const base = {format: 'rncs.large-world-grid-mesh.v0.1', version: LARGE_WORLD_RUNTIME_VERSION, positions, indices, topology: 'triangle-list'};
  return {...base, mesh_root: rootHash(base)};
}

function generateStructures(seed, chunkIdValue, x, z, sampleResolution) {
  const random = sequence(seed, `structures|${x}|${z}`);
  const count = random() % 4;
  const structures = [];
  for (let index = 0; index < count; index++) {
    const localX = random() % (sampleResolution * 1000 + 1);
    const localZ = random() % (sampleResolution * 1000 + 1);
    const sampleX = x * sampleResolution + Math.floor(localX / 1000);
    const sampleZ = z * sampleResolution + Math.floor(localZ / 1000);
    structures.push({
      id: `structure:${chunkIdValue}:${String(index).padStart(2, '0')}`,
      kind: LARGE_WORLD_STRUCTURE_KINDS[random() % LARGE_WORLD_STRUCTURE_KINDS.length],
      local_position_mm: {x: localX, y: terrainHeight(seed, sampleX, sampleZ), z: localZ},
      scale_mm: 500 + (random() % 2500)
    });
  }
  return structures.sort((a, b) => keySort(a.id, b.id));
}

function generateResources(seed, chunkIdValue, x, z, sampleResolution) {
  const random = sequence(seed, `resources|${x}|${z}`);
  const count = random() % 5;
  const resources = [];
  for (let index = 0; index < count; index++) {
    const localX = random() % (sampleResolution * 1000 + 1);
    const localZ = random() % (sampleResolution * 1000 + 1);
    resources.push({
      id: `resource:${chunkIdValue}:${String(index).padStart(2, '0')}`,
      kind: LARGE_WORLD_RESOURCE_KINDS[random() % LARGE_WORLD_RESOURCE_KINDS.length],
      local_position_mm: {x: localX, y: terrainHeight(seed, x * sampleResolution + Math.floor(localX / 1000), z * sampleResolution + Math.floor(localZ / 1000)), z: localZ},
      amount: 1 + (random() % 12)
    });
  }
  return resources.sort((a, b) => keySort(a.id, b.id));
}

function chunkPayload({worldId, seed, generation, x, z, chunkSize, sampleResolution}) {
  const id = chunkId(worldId, x, z);
  const mesh = gridMesh(seed, x, z, sampleResolution);
  const structures = generateStructures(seed, id, x, z, sampleResolution);
  const resources = generateResources(seed, id, x, z, sampleResolution);
  const biome = LARGE_WORLD_BIOMES[utf8Hash32(`${seed}|biome|${x}|${z}`) % LARGE_WORLD_BIOMES.length];
  const payload = {
    format: LARGE_WORLD_CHUNK_FORMAT,
    version: LARGE_WORLD_RUNTIME_VERSION,
    world_id: worldId,
    seed,
    generation,
    chunk_id: id,
    coordinates: {x, z},
    origin_mm: {x: x * chunkSize * 1000, y: 0, z: z * chunkSize * 1000},
    extent_mm: {x: chunkSize * 1000, z: chunkSize * 1000},
    sample_resolution: sampleResolution,
    biome,
    mesh,
    structures,
    resources,
    memory_bytes: mesh.positions.length * 4 + mesh.indices.length * 4 + structures.length * 96 + resources.length * 64
  };
  return payload;
}

function sealChunk(payload) {
  const chunk_root = rootHash(payload);
  const state_root = rootHash({world_id: payload.world_id, chunk_id: payload.chunk_id, generation: payload.generation, chunk_root});
  const content_root = rootHash({chunk_id: payload.chunk_id, mesh_root: payload.mesh.mesh_root, structures: payload.structures, resources: payload.resources});
  return {
    ...clone(payload),
    object_id: objectId(payload.world_id, payload.coordinates.x, payload.coordinates.z),
    chunk_root,
    state_root,
    content_root,
    canonical_owner: 'RNCS',
    representation_owner: 'URRF',
    candidate_only: true,
    authoritative: false,
    commit_status: 'NOT_COMMITTED'
  };
}

export function generateChunk(input = {}) {
  const options = normalizeGenerationOptions(input);
  const x = integer(input.x ?? input.chunkX ?? input.chunk_x, 0);
  const z = integer(input.z ?? input.chunkZ ?? input.chunk_z, 0);
  return sealChunk(chunkPayload({...options, x, z}));
}

export function verifyChunk(chunk) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!chunk || typeof chunk !== 'object') return {valid: false, errors: ['LARGE_WORLD_CHUNK_NOT_OBJECT']};
  try {
    check(chunk.format === LARGE_WORLD_CHUNK_FORMAT, 'LARGE_WORLD_CHUNK_FORMAT_INVALID');
    check(chunk.version === LARGE_WORLD_RUNTIME_VERSION, 'LARGE_WORLD_CHUNK_VERSION_INVALID');
    check(typeof chunk.world_id === 'string' && chunk.world_id.length > 0, 'LARGE_WORLD_CHUNK_WORLD_ID_REQUIRED');
    check(typeof chunk.seed === 'string', 'LARGE_WORLD_CHUNK_SEED_REQUIRED');
    check(Number.isSafeInteger(chunk.generation) && chunk.generation >= 0, 'LARGE_WORLD_CHUNK_GENERATION_INVALID');
    check(typeof chunk.chunk_id === 'string' && chunk.chunk_id.length > 0, 'LARGE_WORLD_CHUNK_ID_REQUIRED');
    check(chunk.coordinates && Number.isSafeInteger(chunk.coordinates.x) && Number.isSafeInteger(chunk.coordinates.z), 'LARGE_WORLD_CHUNK_COORDINATES_INVALID');
    check(hex64(chunk.mesh?.mesh_root), 'LARGE_WORLD_CHUNK_MESH_ROOT_INVALID');
    if (chunk.mesh) {
      const mesh = clone(chunk.mesh);
      const actual = mesh.mesh_root;
      delete mesh.mesh_root;
      check(rootHash(mesh) === actual, 'LARGE_WORLD_CHUNK_MESH_ROOT_MISMATCH');
    }
    const payload = clone(chunk);
    for (const field of ['object_id', 'chunk_root', 'state_root', 'content_root', 'canonical_owner', 'representation_owner', 'candidate_only', 'authoritative', 'commit_status']) delete payload[field];
    check(hex64(chunk.chunk_root), 'LARGE_WORLD_CHUNK_ROOT_INVALID');
    check(rootHash(payload) === chunk.chunk_root, 'LARGE_WORLD_CHUNK_ROOT_MISMATCH');
    check(hex64(chunk.state_root), 'LARGE_WORLD_CHUNK_STATE_ROOT_INVALID');
    check(chunk.state_root === rootHash({world_id: chunk.world_id, chunk_id: chunk.chunk_id, generation: chunk.generation, chunk_root: chunk.chunk_root}), 'LARGE_WORLD_CHUNK_STATE_ROOT_MISMATCH');
    check(hex64(chunk.content_root), 'LARGE_WORLD_CHUNK_CONTENT_ROOT_INVALID');
    check(chunk.content_root === rootHash({chunk_id: chunk.chunk_id, mesh_root: chunk.mesh.mesh_root, structures: chunk.structures, resources: chunk.resources}), 'LARGE_WORLD_CHUNK_CONTENT_ROOT_MISMATCH');
    check(chunk.object_id === objectId(chunk.world_id, chunk.coordinates.x, chunk.coordinates.z), 'LARGE_WORLD_CHUNK_OBJECT_ID_MISMATCH');
    check(chunk.canonical_owner === 'RNCS', 'LARGE_WORLD_CHUNK_CANONICAL_OWNER_INVALID');
    check(chunk.representation_owner === 'URRF', 'LARGE_WORLD_CHUNK_REPRESENTATION_OWNER_INVALID');
    check(chunk.candidate_only === true && chunk.authoritative === false, 'LARGE_WORLD_CHUNK_AUTHORITY_INVALID');
    check(chunk.commit_status === 'NOT_COMMITTED', 'LARGE_WORLD_CHUNK_COMMIT_STATUS_INVALID');
  } catch (error) {
    errors.push(`LARGE_WORLD_CHUNK_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, chunk_root: chunk.chunk_root ?? null};
}

function regionBase(options, chunks) {
  const chunkRoots = chunks.map(chunk => ({chunk_id: chunk.chunk_id, coordinates: chunk.coordinates, chunk_root: chunk.chunk_root})).sort((a, b) => keySort(a.chunk_id, b.chunk_id));
  return {
    format: LARGE_WORLD_REGION_FORMAT,
    version: LARGE_WORLD_RUNTIME_VERSION,
    world_id: options.worldId,
    seed: options.seed,
    generation: options.generation,
    origin: {x: options.centerX - Math.floor(options.width / 2), z: options.centerZ - Math.floor(options.depth / 2)},
    dimensions: {width: options.width, depth: options.depth},
    chunk_size: options.chunkSize,
    sample_resolution: options.sampleResolution,
    chunk_roots: chunkRoots,
    canonical_owner: 'RNCS',
    representation_owner: 'URRF',
    candidate_only: true,
    authoritative: false,
    commit_status: 'NOT_COMMITTED'
  };
}

export function generateRegion(input = {}) {
  const options = normalizeGenerationOptions(input);
  const originX = options.centerX - Math.floor(options.width / 2);
  const originZ = options.centerZ - Math.floor(options.depth / 2);
  const chunks = [];
  for (let row = 0; row < options.depth; row++) {
    for (let column = 0; column < options.width; column++) {
      chunks.push(generateChunk({...options, x: originX + column, z: originZ + row}));
    }
  }
  const base = regionBase(options, chunks);
  const region_root = rootHash(base);
  const world_root = rootHash({format: LARGE_WORLD_RUNTIME_FORMAT, version: LARGE_WORLD_RUNTIME_VERSION, world_id: options.worldId, seed: options.seed, generation: options.generation, region_root});
  return {...base, chunks: chunks.sort((a, b) => keySort(a.chunk_id, b.chunk_id)), region_root, world_root};
}

export function verifyRegion(region) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!region || typeof region !== 'object') return {valid: false, errors: ['LARGE_WORLD_REGION_NOT_OBJECT']};
  try {
    check(region.format === LARGE_WORLD_REGION_FORMAT, 'LARGE_WORLD_REGION_FORMAT_INVALID');
    check(region.version === LARGE_WORLD_RUNTIME_VERSION, 'LARGE_WORLD_REGION_VERSION_INVALID');
    check(Array.isArray(region.chunks), 'LARGE_WORLD_REGION_CHUNKS_REQUIRED');
    const chunkIds = new Set();
    for (const chunk of region.chunks ?? []) {
      const verification = verifyChunk(chunk);
      if (!verification.valid) errors.push(...verification.errors.map(error => `CHUNK:${error}`));
      check(!chunkIds.has(chunk.chunk_id), `LARGE_WORLD_REGION_DUPLICATE_CHUNK:${chunk.chunk_id}`);
      chunkIds.add(chunk.chunk_id);
    }
    const payload = clone(region);
    for (const field of ['chunks', 'region_root', 'world_root']) delete payload[field];
    const chunk_roots = (region.chunks ?? []).map(chunk => ({chunk_id: chunk.chunk_id, coordinates: chunk.coordinates, chunk_root: chunk.chunk_root})).sort((a, b) => keySort(a.chunk_id, b.chunk_id));
    check(Array.isArray(region.chunk_roots) && rootHash(region.chunk_roots) === rootHash(chunk_roots) && rootHash({...payload, chunk_roots}) === region.region_root, 'LARGE_WORLD_REGION_ROOT_MISMATCH');
    check(hex64(region.region_root), 'LARGE_WORLD_REGION_ROOT_INVALID');
    check(hex64(region.world_root), 'LARGE_WORLD_REGION_WORLD_ROOT_INVALID');
    check(region.world_root === rootHash({format: LARGE_WORLD_RUNTIME_FORMAT, version: LARGE_WORLD_RUNTIME_VERSION, world_id: region.world_id, seed: region.seed, generation: region.generation, region_root: region.region_root}), 'LARGE_WORLD_REGION_WORLD_ROOT_MISMATCH');
    check(region.canonical_owner === 'RNCS', 'LARGE_WORLD_REGION_CANONICAL_OWNER_INVALID');
    check(region.representation_owner === 'URRF', 'LARGE_WORLD_REGION_REPRESENTATION_OWNER_INVALID');
    check(region.candidate_only === true && region.authoritative === false, 'LARGE_WORLD_REGION_AUTHORITY_INVALID');
    check(region.commit_status === 'NOT_COMMITTED', 'LARGE_WORLD_REGION_COMMIT_STATUS_INVALID');
  } catch (error) {
    errors.push(`LARGE_WORLD_REGION_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, region_root: region.region_root ?? null, world_root: region.world_root ?? null};
}

function providerManifest(runtimeAvailable) {
  const base = {
    id: LARGE_WORLD_PROCEDURAL_PROVIDER_ID,
    version: LARGE_WORLD_RUNTIME_VERSION,
    runtimeStatus: runtimeAvailable ? 'AVAILABLE' : 'CONTRACT_ONLY',
    capabilities: ['representation.visual.render', 'representation.mesh.procedural'],
    authority: {owns_authoritative_world_state: false, scope: ['representation_candidate', 'visual_projection']},
    representation: {kinds: ['mesh'], profiles: [{profile_id: 'large-world.grid-mesh.v0.1', formats: ['model/vnd.taowind.large-world-grid+json']} ]}
  };
  return {...base, manifest_root: rootHash(base)};
}

function wireframeProviderManifest(runtimeAvailable) {
  const base = {
    id: LARGE_WORLD_WIREFRAME_PROVIDER_ID,
    version: LARGE_WORLD_RUNTIME_VERSION,
    runtimeStatus: runtimeAvailable ? 'AVAILABLE' : 'CONTRACT_ONLY',
    capabilities: ['representation.visual.render', 'representation.mesh.wireframe'],
    authority: {owns_authoritative_world_state: false, scope: ['representation_candidate', 'visual_projection']},
    representation: {kinds: ['mesh'], profiles: [{profile_id: 'large-world.wireframe-mesh.v0.1', formats: ['model/vnd.taowind.large-world-wireframe+json']}]}
  };
  return {...base, manifest_root: rootHash(base)};
}

function createChunkReference(chunk, provider, available, {encoding, fidelity, precision} = {}) {
  const profile = provider.representation.profiles[0];
  const formats = [...profile.formats];
  return createRepresentationRef({
    provider_id: provider.id,
    provider_root: provider.manifest_root,
    representation_kind: 'mesh',
    representation_formats: formats,
    content_root: chunk.content_root,
    representation_profile: {profile_id: profile.profile_id, encoding: encoding ?? profile.profile_id, fidelity: fidelity ?? 'terrain-structures', precision: precision ?? 'integer-millimeter', formats},
    detail_policy: {mode: 'distance-lod', selectors: ['screen-space-size', 'chunk-distance'], budget: {levels: 3}},
    residency_policy: {mode: 'paged-streaming', selectors: ['active-working-set', 'unload-hysteresis'], budget: {chunk_bytes: chunk.memory_bytes}},
    authority_scope: ['representation_candidate', 'visual_projection'],
    availability: available ? 'AVAILABLE' : 'CONTRACT_ONLY',
    provenance: {generator_version: LARGE_WORLD_RUNTIME_VERSION, parameters_root: chunk.chunk_root},
    evidence: {provider_manifest_root: provider.manifest_root}
  });
}

function isWireframeReference(reference) {
  const profileId = String(reference?.representation_profile?.profile_id ?? '').toLowerCase();
  const encoding = String(reference?.representation_profile?.encoding ?? '').toLowerCase();
  const providerId = String(reference?.provider_id ?? '').toLowerCase();
  return providerId === LARGE_WORLD_WIREFRAME_PROVIDER_ID.toLowerCase()
    || profileId.includes('wireframe')
    || encoding.includes('wireframe');
}

function portfolioResourceCosts(chunk, qualityProfile) {
  const memory = integer(chunk.memory_bytes, 0, {min: 0});
  const proxy = qualityProfile === 'PROXY';
  return {
    CPU_MILLI: (proxy ? 20 : 80) + chunk.sample_resolution * (proxy ? 2 : 6),
    GPU_MILLI: proxy ? 15 : 90,
    NPU_MILLI: 0,
    VRAM_MB: proxy ? 4 : 8 + Math.max(1, Math.ceil(memory / 4096)),
    RAM_MB: proxy ? 1 + Math.max(1, Math.ceil(memory / 8192)) : 2 + Math.max(1, Math.ceil(memory / 2048)),
    STORAGE_KB: proxy ? Math.max(1, Math.ceil(memory / 4096)) : Math.max(1, Math.ceil(memory / 1024)),
    NETWORK_KB: proxy ? Math.max(1, Math.ceil(memory / 4096)) : Math.max(1, Math.ceil(memory / 1024)),
    ENERGY_MILLI: proxy ? 5 : 25
  };
}

function chunkPortfolioSlot(chunk, reference, qualityProfile, {proxyWidth, proxyHeight, standardWidth, standardHeight, fallbackSlotId = null} = {}) {
  const proxy = qualityProfile === 'PROXY';
  const style = proxy ? 'WIREFRAME' : 'PROCEDURAL_GRID';
  const biome = String(chunk.biome ?? 'UNKNOWN').toUpperCase();
  const slot_id = `slot:${chunk.chunk_id}:${qualityProfile.toLowerCase()}`;
  return createRepresentationSlot({
    slot_id,
    representation_id: reference.representation_id,
    representation_root: reference.representation_root,
    representation_kind: reference.representation_kind,
    quality_profile: qualityProfile,
    diversity_axes: {
      MODALITY: 'MESH',
      DETAIL: qualityProfile,
      MATERIAL: `BIOME_${biome}`,
      LIGHTING: 'WORLD_GRID',
      ENVIRONMENT: biome,
      STYLE: style,
      MOTION: 'STATIC',
      VIEW: 'CHUNK'
    },
    render_profile: {
      renderer_id: `large-world-${qualityProfile.toLowerCase()}`,
      shading_model: proxy ? 'wireframe' : 'pbr-lite',
      lighting_profile: 'world-grid',
      camera_profile: 'chunk-topdown',
      resolution_class: qualityProfile.toLowerCase(),
      width: integer(proxy ? proxyWidth : standardWidth, proxy ? 320 : 640, {min: 1, max: 16384}),
      height: integer(proxy ? proxyHeight : standardHeight, proxy ? 180 : 360, {min: 1, max: 16384}),
      post_process: 'none',
      options: {
        chunk_size_mm: chunk.extent_mm?.x ?? 0,
        sample_resolution: chunk.sample_resolution
      }
    },
    resource_costs: portfolioResourceCosts(chunk, qualityProfile),
    fallback_slot_id: proxy ? null : fallbackSlotId,
    required_for_minimum: proxy,
    evidence_refs: [chunk.chunk_root, chunk.content_root, reference.provider_root]
  });
}

/**
 * Lower one large-world chunk's URRF references into the canonical RNCS
 * Representation Portfolio contract. The portfolio is candidate-only: it
 * describes how a renderer may select a view and never owns world truth.
 */
export function createChunkRepresentationPortfolio(chunkInput, input = {}) {
  const chunk = clone(chunkInput);
  const verification = verifyChunk(chunk);
  fail(verification.valid, `LARGE_WORLD_CHUNK_INVALID:${verification.errors.join(',')}`);
  const value = record(input);
  const object = record(value.representationObject ?? value.representation_object ?? value.object);
  const references = (Array.isArray(value.representations) ? value.representations : object.representations ?? [])
    .map(clone)
    .filter(reference => reference && typeof reference === 'object');
  fail(references.length > 0, 'LARGE_WORLD_PORTFOLIO_REPRESENTATIONS_REQUIRED');
  const wireframe = references.find(isWireframeReference) ?? null;
  const procedural = references.find(reference => reference !== wireframe) ?? null;
  const slots = [];
  if (wireframe) slots.push(chunkPortfolioSlot(chunk, wireframe, 'PROXY', value));
  if (procedural) slots.push(chunkPortfolioSlot(chunk, procedural, 'STANDARD', {
    ...value,
    fallbackSlotId: wireframe ? `slot:${chunk.chunk_id}:proxy` : null
  }));
  if (!wireframe && !procedural) slots.push(chunkPortfolioSlot(chunk, references[0], 'STANDARD', value));
  const active_slot_id = slots.find(slot => slot.quality_profile === 'STANDARD')?.slot_id
    ?? slots.find(slot => slot.quality_profile === 'PROXY')?.slot_id
    ?? null;
  return createRepresentationPortfolio({
    portfolio_id: `portfolio:${chunk.object_id}`,
    object_id: chunk.object_id,
    canonical_state_root: chunk.state_root,
    content_root: chunk.content_root,
    slots,
    active_slot_id,
    composition: {
      mode: 'BALANCED',
      min_slots: 2,
      max_slots: 2,
      required_kinds: ['mesh'],
      required_quality_profiles: ['PROXY', 'STANDARD'],
      quality_ladder: ['PROXY', 'STANDARD'],
      diversity_targets: {
        MODALITY: 1,
        DETAIL: 2,
        ENVIRONMENT: 1,
        STYLE: 2,
        MOTION: 1,
        VIEW: 1
      }
    },
    evidence_refs: [chunk.chunk_root, chunk.content_root, ...references.map(reference => reference.representation_root)]
  });
}

function normalizeObserver(input = {}) {
  const value = record(input.position ?? input);
  const x = Number(value.x ?? 0);
  const z = Number(value.z ?? 0);
  fail(Number.isFinite(x) && Number.isFinite(z), 'LARGE_WORLD_OBSERVER_POSITION_INVALID');
  return {x: Math.floor(x), z: Math.floor(z)};
}

function normalizeForcedIds(input) { return strings(input.forcedChunkIds ?? input.forced_chunk_ids); }

function streamRoot(base) { return rootHash(base); }

function verifyStreamResolution(resolution) {
  const copy = clone(resolution);
  const actual = copy.stream_root;
  delete copy.stream_root;
  return hex64(actual) && rootHash(copy) === actual;
}

function replicationAuthorityReceipt(input) {
  const receipt = clone(record(input));
  fail(receipt.status === 'committed' && hex64(receipt.receipt_root), 'LARGE_WORLD_REPLICATION_AUTHORITY_RECEIPT_REQUIRED');
  return receipt;
}

function replicationDistributionFields(runtime, input = {}) {
  const profile = runtime.consistencyProfile;
  if (!profile) return null;
  const profileVerification = verifyRealityConsistencyProfile(profile);
  fail(profileVerification.valid, `LARGE_WORLD_CONSISTENCY_PROFILE_INVALID:${profileVerification.errors.join(',')}`);
  const lease = runtime.authorityLease;
  if (profile.lease_required || profile.fencing_required) {
    fail(lease, 'LARGE_WORLD_REPLICATION_LEASE_REQUIRED');
    const leaseAdmission = checkAuthorityLease(lease, {
      authority_id: lease.authority_id,
      shard_id: runtime.shardId,
      semantic_scope: lease.semantic_scope,
      owner_node: runtime.nodeId,
      tick: runtime.worldTime.simulation_tick,
      current_lease: lease
    });
    fail(leaseAdmission.valid, `LARGE_WORLD_REPLICATION_LEASE_ADMISSION_FAILED:${leaseAdmission.errors.join(',')}`);
  }
  const targetNode = String(input.targetNode ?? input.target_node ?? 'node:unknown');
  fail(targetNode.length > 0, 'LARGE_WORLD_REPLICATION_TARGET_NODE_REQUIRED');
  const sequence = integer(input.sequence, runtime.replicationSequence + 1, {min: 0, max: Number.MAX_SAFE_INTEGER});
  runtime.replicationSequence = Math.max(runtime.replicationSequence, sequence);
  return {
    consistency_profile: clone(profile),
    consistency_profile_root: profile.profile_root,
    authority_lease: lease ? clone(lease) : null,
    authority_lease_root: lease?.lease_root ?? null,
    source_node: runtime.nodeId,
    target_node: targetNode,
    shard_id: runtime.shardId,
    authority_id: lease?.authority_id ?? null,
    semantic_scope: lease?.semantic_scope ?? null,
    sequence,
    epoch: lease?.epoch ?? 0,
    fencing_token: lease?.fencing_token ?? 0
  };
}

function admitReplicationDistribution(runtime, delta, authorityReceipt) {
  if (delta.consistency_profile === undefined) return;
  const profile = runtime.consistencyProfile;
  fail(profile, 'LARGE_WORLD_REPLICATION_CONSISTENCY_PROFILE_REQUIRED');
  fail(profile.profile_root === delta.consistency_profile_root, 'LARGE_WORLD_REPLICATION_CONSISTENCY_PROFILE_MISMATCH');
  const profileVerification = verifyRealityConsistencyProfile(delta.consistency_profile);
  fail(profileVerification.valid, `LARGE_WORLD_REPLICATION_CONSISTENCY_PROFILE_INVALID:${profileVerification.errors.join(',')}`);
  fail(delta.target_node === runtime.nodeId, 'LARGE_WORLD_REPLICATION_TARGET_NODE_MISMATCH');
  fail(delta.shard_id === runtime.shardId, 'LARGE_WORLD_REPLICATION_SHARD_ID_MISMATCH');
  if (delta.consistency_profile.authority_required || delta.consistency_profile.lease_required || delta.consistency_profile.fencing_required) {
    fail(hex64(authorityReceipt.receipt_root), 'LARGE_WORLD_REPLICATION_AUTHORITY_RECEIPT_REQUIRED');
  }
  if (delta.consistency_profile.lease_required || delta.consistency_profile.fencing_required) {
    const currentLease = runtime.acceptedAuthorityLease ?? runtime.authorityLease;
    fail(currentLease, 'LARGE_WORLD_REPLICATION_CURRENT_LEASE_REQUIRED');
    const leaseAdmission = checkAuthorityLease(delta.authority_lease, {
      authority_id: delta.authority_id,
      shard_id: runtime.shardId,
      semantic_scope: delta.semantic_scope,
      owner_node: delta.source_node,
      epoch: delta.epoch,
      fencing_token: delta.fencing_token,
      tick: runtime.worldTime.simulation_tick,
      current_lease: currentLease
    });
    fail(leaseAdmission.valid, `LARGE_WORLD_REPLICATION_LEASE_ADMISSION_FAILED:${leaseAdmission.errors.join(',')}`);
    fail(authorityReceipt.lease_root === delta.authority_lease_root || authorityReceipt.leaseRoot === delta.authority_lease_root, 'LARGE_WORLD_REPLICATION_AUTHORITY_LEASE_RECEIPT_MISMATCH');
    fail(authorityReceipt.fencing_token === delta.fencing_token || authorityReceipt.fencingToken === delta.fencing_token, 'LARGE_WORLD_REPLICATION_FENCING_RECEIPT_MISMATCH');
    if (authorityReceipt.authority_id !== undefined) fail(String(authorityReceipt.authority_id) === delta.authority_id, 'LARGE_WORLD_REPLICATION_AUTHORITY_ID_RECEIPT_MISMATCH');
  }
}

function replicationSnapshotBase(runtime) {
  const eventLog = clone(runtime.eventLog);
  const factTree = clone(runtime.factTree);
  const canonicalState = clone(runtime.canonicalState);
  return {
    format: LARGE_WORLD_REPLICATION_SNAPSHOT_FORMAT,
    version: LARGE_WORLD_RUNTIME_VERSION,
    world_id: runtime.options.worldId,
    seed: runtime.options.seed,
    generation: runtime.options.generation,
    region_root: runtime.region.region_root,
    world_root: runtime.region.world_root,
    options: clone(runtime.options),
    observer: clone(runtime.observer),
    active_chunk_ids: [...runtime.activeChunkIds],
    active_chunk_roots: runtime.activeChunkIds.map(id => ({chunk_id: id, chunk_root: runtime.chunks.get(id)?.chunk_root ?? null})),
    trace: clone(runtime.trace),
    canonical_state: canonicalState,
    canonical_state_root: worldStateRoot(canonicalState),
    world_time: clone(runtime.worldTime),
    event_log: eventLog,
    event_log_root: eventLog.log_root,
    facts: clone(runtime.facts),
    fact_tree: factTree,
    fact_tree_root: factTree.tree_root,
    canonical_state_mutated: false,
    authority: {provider_can_write_authoritative_world_state: false, rncs_authority_required: true},
    candidate_only: true,
    authoritative: false,
    commit_status: 'NOT_COMMITTED'
  };
}

function activeChunkRoots(runtime, ids) {
  return ids.map(id => ({chunk_id: id, chunk_root: runtime.chunks.get(id)?.chunk_root ?? null}));
}

function durableBundleBase(runtime) {
  return {
    format: LARGE_WORLD_DURABLE_BUNDLE_FORMAT,
    version: LARGE_WORLD_RUNTIME_VERSION,
    world_id: runtime.options.worldId,
    region_root: runtime.region.region_root,
    world_root: runtime.region.world_root,
    replication_snapshot: runtime.exportReplicationSnapshot(),
    applied_replication_receipts: [...runtime.appliedReplicationDeltas.values()].filter(Boolean).map(clone).sort((a, b) => keySort(a.delta_root, b.delta_root)),
    replication_conflict_decisions: [...runtime.replicationConflictDecisions.values()].filter(Boolean).map(clone).sort((a, b) => keySort(a.decision_root, b.decision_root)),
    canonical_state_mutated: false,
    authority: {provider_can_write_authoritative_world_state: false, rncs_authority_required: true},
    candidate_only: true,
    authoritative: false,
    commit_status: 'NOT_COMMITTED'
  };
}

function authenticationTag(value, authKey) {
  fail(typeof authKey === 'string' && authKey.length > 0, 'LARGE_WORLD_REPLICATION_AUTH_KEY_REQUIRED');
  return createHmac('sha256', Buffer.from(authKey, 'utf8')).update(rootHash(value), 'utf8').digest('hex');
}

function authenticationTagMatches(value, authTag, authKey) {
  if (!hex64(authTag) || typeof authKey !== 'string' || authKey.length === 0) return false;
  const expected = authenticationTag(value, authKey);
  return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(authTag, 'hex'));
}

function packetId({channelId, sequence, deltaRoot}) {
  return `replication-packet:${channelId}:${sequence}:${deltaRoot.slice(0, 24)}`;
}

const replicationConflictPolicy = Object.freeze({
  id: LARGE_WORLD_REPLICATION_CONFLICT_POLICY_ID,
  version: 'v0.1',
  ordering: 'writer_id,writer_sequence,delta_root',
  winner: 'first_sorted_candidate',
  loser_status: 'REJECTED_CONFLICT'
});

const conflictBaseFields = Object.freeze([
  'world_id',
  'region_root',
  'world_root',
  'base_snapshot_root',
  'base_event_log_root',
  'base_event_count',
  'base_canonical_state_root',
  'base_world_time_root',
  'base_fact_tree_root',
  'base_fact_count',
  'base_trace_length'
]);

function normalizeReplicationConflictCandidate(input, index) {
  const value = record(input);
  const delta = clone(value.delta);
  const verification = verifyReplicationDelta(delta);
  fail(verification.valid, `LARGE_WORLD_REPLICATION_CONFLICT_DELTA_INVALID:${verification.errors.join(',')}`);
  const writerId = String(value.writerId ?? value.writer_id ?? '');
  fail(writerId.length > 0, 'LARGE_WORLD_REPLICATION_CONFLICT_WRITER_REQUIRED');
  const writerSequence = integer(value.writerSequence ?? value.writer_sequence, 1, {min: 1});
  return {index, writer_id: writerId, writer_sequence: writerSequence, delta};
}

function replicationConflictBase(delta) {
  return Object.fromEntries(conflictBaseFields.map(field => [field, clone(delta[field])]));
}

function compareReplicationConflictCandidates(a, b) {
  const aDeltaRoot = a.delta?.delta_root ?? a.delta_root;
  const bDeltaRoot = b.delta?.delta_root ?? b.delta_root;
  return keySort(a.writer_id, b.writer_id) || a.writer_sequence - b.writer_sequence || keySort(aDeltaRoot, bDeltaRoot);
}

function resolveReplicationConflictCandidates(candidatesInput) {
  fail(Array.isArray(candidatesInput) && candidatesInput.length > 0, 'LARGE_WORLD_REPLICATION_CONFLICT_CANDIDATES_REQUIRED');
  const candidates = candidatesInput.map((candidate, index) => normalizeReplicationConflictCandidate(candidate, index));
  const first = candidates[0].delta;
  const writers = new Set();
  const deltas = new Set();
  for (const candidate of candidates) {
    for (const field of conflictBaseFields) fail(candidate.delta[field] === first[field], `LARGE_WORLD_REPLICATION_CONFLICT_BASE_MISMATCH:${field}`);
    fail(!writers.has(candidate.writer_id), `LARGE_WORLD_REPLICATION_CONFLICT_WRITER_DUPLICATE:${candidate.writer_id}`);
    fail(!deltas.has(candidate.delta.delta_root), `LARGE_WORLD_REPLICATION_CONFLICT_DELTA_DUPLICATE:${candidate.delta.delta_root}`);
    writers.add(candidate.writer_id);
    deltas.add(candidate.delta.delta_root);
  }
  const ordered = [...candidates].sort(compareReplicationConflictCandidates);
  const summaries = ordered.map(candidate => ({
    writer_id: candidate.writer_id,
    writer_sequence: candidate.writer_sequence,
    delta_id: candidate.delta.delta_id,
    delta_root: candidate.delta.delta_root,
    target_snapshot_root: candidate.delta.target_snapshot_root
  }));
  const base = {
    format: LARGE_WORLD_REPLICATION_CONFLICT_DECISION_FORMAT,
    version: LARGE_WORLD_RUNTIME_VERSION,
    conflict_id: `replication-conflict:${rootHash(replicationConflictBase(first))}:${rootHash(summaries).slice(0, 24)}`,
    policy: clone(replicationConflictPolicy),
    ...replicationConflictBase(first),
    candidates: summaries,
    winner_delta_root: ordered[0].delta.delta_root,
    rejected_delta_roots: ordered.slice(1).map(candidate => candidate.delta.delta_root),
    status: ordered.length > 1 ? 'RESOLVED' : 'NO_CONFLICT',
    canonical_state_mutated: false,
    authority: {provider_can_write_authoritative_world_state: false, rncs_authority_required: true},
    candidate_only: true,
    authoritative: false,
    commit_status: 'NOT_COMMITTED'
  };
  return {candidates: ordered, decision: {...base, decision_root: rootHash(base)}};
}

function injectDurableStoreFault(faultAt, stage) {
  if (faultAt === stage) throw new Error(`LARGE_WORLD_DURABLE_STORE_FAULT:${stage}`);
}

async function syncDurableStoreDirectory(directoryPath) {
  let handle = null;
  try {
    handle = await open(directoryPath, 'r');
    await handle.sync();
    return true;
  } catch (error) {
    if (['EBADF', 'EISDIR', 'EINVAL', 'ENOTDIR', 'ENOTSUP', 'EPERM'].includes(error.code)) return false;
    throw error;
  } finally {
    if (handle) await handle.close();
  }
}

async function readDurableStoreCandidate(filePath) {
  try {
    const serialized = await readFile(filePath, 'utf8');
    let bundle;
    try {
      bundle = JSON.parse(serialized);
    } catch (error) {
      return {exists: true, valid: false, bytes: Buffer.byteLength(serialized, 'utf8'), error: `JSON_PARSE:${error.message}`};
    }
    const verification = verifyDurableBundle(bundle);
    return {
      exists: true,
      valid: verification.valid,
      bundle: verification.valid ? clone(bundle) : null,
      bundle_root: bundle?.bundle_root ?? null,
      bytes: Buffer.byteLength(serialized, 'utf8'),
      error: verification.valid ? null : verification.errors.join(',')
    };
  } catch (error) {
    if (error.code === 'ENOENT') return {exists: false, valid: false, bundle: null, bundle_root: null, bytes: 0, error: null};
    return {exists: true, valid: false, bundle: null, bundle_root: null, bytes: 0, error: `${error.code ?? error.name}:${error.message}`};
  }
}

function durableStoreReceipt(input) {
  const base = {
    format: LARGE_WORLD_DURABLE_STORE_RECEIPT_FORMAT,
    version: LARGE_WORLD_RUNTIME_VERSION,
    operation: String(input.operation),
    status: String(input.status),
    source: String(input.source),
    bundle_root: input.bundleRoot ?? input.bundle_root ?? null,
    bytes: integer(input.bytes, 0, {min: 0}),
    atomic_rename: input.atomicRename === true || input.atomic_rename === true,
    file_synced: input.fileSynced === true || input.file_synced === true,
    directory_synced: input.directorySynced === true || input.directory_synced === true,
    canonical_state_mutated: false,
    authority: {provider_can_write_authoritative_world_state: false, rncs_authority_required: true},
    candidate_only: true,
    authoritative: false,
    commit_status: 'NOT_COMMITTED'
  };
  return {...base, receipt_root: rootHash(base)};
}

export class LargeWorldRuntime {
  constructor(input = {}) {
    const value = record(input);
    this.options = normalizeRuntimeOptions(value);
    this.nodeId = String(value.nodeId ?? value.node_id ?? `node:${this.options.worldId}:local`);
    fail(this.nodeId.length > 0, 'LARGE_WORLD_NODE_ID_REQUIRED');
    this.shardId = String(value.shardId ?? value.shard_id ?? `shard:${this.options.worldId}`);
    fail(this.shardId.length > 0, 'LARGE_WORLD_SHARD_ID_REQUIRED');
    const leaseInput = value.authorityLease ?? value.authority_lease;
    const acceptedLeaseInput = value.acceptedAuthorityLease ?? value.accepted_authority_lease ?? value.replicationLease ?? value.replication_lease;
    this.consistencyProfile = normalizeDistributionProfile(value.consistencyProfile ?? value.consistency_profile, this.options.worldId);
    if (!this.consistencyProfile && (leaseInput !== undefined || acceptedLeaseInput !== undefined)) {
      this.consistencyProfile = createRealityConsistencyProfile({profile_id: `consistency:${this.options.worldId}`, evidence_refs: []});
    }
    this.authorityLease = normalizeDistributionLease(leaseInput);
    this.acceptedAuthorityLease = normalizeDistributionLease(acceptedLeaseInput);
    if (this.authorityLease) {
      fail(this.authorityLease.owner_node === this.nodeId, 'LARGE_WORLD_AUTHORITY_LEASE_OWNER_NODE_MISMATCH');
      fail(this.authorityLease.shard_id === this.shardId, 'LARGE_WORLD_AUTHORITY_LEASE_SHARD_ID_MISMATCH');
    }
    if (this.acceptedAuthorityLease) fail(this.acceptedAuthorityLease.shard_id === this.shardId, 'LARGE_WORLD_ACCEPTED_LEASE_SHARD_ID_MISMATCH');
    if (this.consistencyProfile?.lease_required || this.consistencyProfile?.fencing_required) {
      fail(this.authorityLease || this.acceptedAuthorityLease, 'LARGE_WORLD_DISTRIBUTION_LEASE_REQUIRED');
    }
    this.region = generateRegion(this.options);
    this.chunks = new Map(this.region.chunks.map(chunk => [chunk.chunk_id, chunk]));
    this.chunkByKey = new Map(this.region.chunks.map(chunk => [chunkKey(chunk.coordinates.x, chunk.coordinates.z), chunk]));
    this.activeChunkIds = [];
    this.observer = {x: 0, z: 0};
    this.trace = [];
    this.replicationSequence = 0;
    this.canonicalState = {
      format: 'rncs.large-world-state.v0.1',
      world_id: this.options.worldId,
      generation: this.options.generation,
      region_root: this.region.region_root,
      world_root: this.region.world_root,
      weather: 'clear',
      world_time_tick: 0
    };
    this.worldTime = createWorldTime({
      world_id: this.options.worldId,
      epoch: 0,
      logical_clock: 0,
      simulation_tick: 0,
      causal_sequence: 0,
      simulation_rate: '1hz',
      time_scale: '1',
      status: 'running',
      causal_root: ZERO_ROOT,
      historical_reference: null
    });
    this.eventLog = createWorldEventLog({
      world_id: this.options.worldId,
      branch_id: 'main',
      initial_state: this.canonicalState,
      initial_world_time: this.worldTime
    });
    this.facts = [];
    this.factTree = createFactWorldTree({world_id: this.options.worldId, reality_root: this.region.world_root, branch_id: 'main'});
    this.materializeChunk = typeof value.materializeChunk === 'function' ? value.materializeChunk : null;
    this.materializeWireframeChunk = typeof value.materializeWireframeChunk === 'function' ? value.materializeWireframeChunk : null;
    this.provider = providerManifest(Boolean(this.materializeChunk));
    this.wireframeProvider = wireframeProviderManifest(Boolean(this.materializeWireframeChunk));
    this.chunksByObjectId = new Map(this.region.chunks.map(chunk => [chunk.object_id, chunk]));
    const providerInput = {manifest: this.provider};
    if (this.materializeChunk) providerInput.materialize = async adapterInput => this.materializeChunk({
      ...adapterInput,
      chunk: clone(this.chunksByObjectId.get(adapterInput.object.object_id) ?? null)
    });
    const wireframeProviderInput = {manifest: this.wireframeProvider};
    if (this.materializeWireframeChunk) wireframeProviderInput.materialize = async adapterInput => this.materializeWireframeChunk({
      ...adapterInput,
      chunk: clone(this.chunksByObjectId.get(adapterInput.object.object_id) ?? null)
    });
    this.fabric = new RealityRepresentationFabric({providers: [providerInput, wireframeProviderInput]});
    this.portfolioRuntime = new RealityRepresentationPortfolioRuntime({fabric: this.fabric});
    this.objects = new Map();
    this.appliedReplicationDeltas = new Map();
    this.replicationConflictDecisions = new Map();
    for (const chunk of this.region.chunks) {
      const proceduralReference = createChunkReference(chunk, this.provider, Boolean(this.materializeChunk), {
        encoding: 'procedural-grid',
        fidelity: 'terrain-structures',
        precision: 'integer-millimeter'
      });
      const wireframeReference = createChunkReference(chunk, this.wireframeProvider, Boolean(this.materializeWireframeChunk), {
        encoding: 'wireframe-grid',
        fidelity: 'terrain-outline',
        precision: 'integer-millimeter'
      });
      const object = this.fabric.registerRealityObject({
        object_id: chunk.object_id,
        branch: 'main',
        state_root: chunk.state_root,
        content_root: chunk.content_root,
        representations: [proceduralReference, wireframeReference]
      });
      this.objects.set(chunk.chunk_id, object);
      this.portfolioRuntime.registerPortfolio(createChunkRepresentationPortfolio(chunk, {representationObject: object}));
    }
  }

  getRegion() { return clone(this.region); }

  getChunk(chunkIdValue) { return clone(this.chunks.get(String(chunkIdValue)) ?? null); }

  getRepresentationObject(chunkIdValue) {
    const chunk = this.chunks.get(String(chunkIdValue));
    return chunk ? this.fabric.getRealityObject(chunk.object_id) : null;
  }

  getRepresentationPortfolio(chunkIdValue, input = {}) {
    const chunk = this.chunks.get(String(chunkIdValue));
    if (!chunk) return null;
    return createChunkRepresentationPortfolio(chunk, {
      ...record(input),
      representationObject: this.getRepresentationObject(chunk.chunk_id)
    });
  }

  selectActiveRepresentationPortfolios(input = {}) {
    const value = record(input);
    const requestedQuality = value.qualityProfile ?? value.quality_profile ?? null;
    const qualityByChunk = record(value.qualityByChunk ?? value.quality_by_chunk);
    const budgetByChunk = record(value.resourceBudgetByChunk ?? value.resource_budget_by_chunk);
    const globalBudget = value.resourceBudget ?? value.resource_budget;
    const globalDiversity = value.diversity ?? value.diversity_axes ?? value.diversityAxes;
    const selections = this.activeChunkIds.map(chunkIdValue => {
      const chunk = this.chunks.get(chunkIdValue);
      const portfolio = this.portfolioRuntime.getPortfolio(`portfolio:${chunk.object_id}`)
        ?? this.getRepresentationPortfolio(chunk.chunk_id);
      if (!this.portfolioRuntime.getPortfolio(portfolio.portfolio_id)) this.portfolioRuntime.registerPortfolio(portfolio);
      const requested = qualityByChunk[chunk.chunk_id] ?? requestedQuality;
      const resourceBudget = budgetByChunk[chunk.chunk_id] ?? globalBudget;
      const selection = this.portfolioRuntime.selectSlot({
        portfolio_id: portfolio.portfolio_id,
        ...(requested === null || requested === undefined ? {} : {quality_profile: requested}),
        ...(resourceBudget === undefined ? {} : {resource_budget: resourceBudget}),
        ...(globalDiversity === undefined ? {} : {diversity: globalDiversity})
      });
      return {
        chunk_id: chunk.chunk_id,
        coordinates: clone(chunk.coordinates),
        portfolio_id: selection.portfolio_id,
        portfolio_root: selection.portfolio_root,
        selected_slot_id: selection.selected_slot_id,
        selected_slot_root: selection.selected_slot_root,
        selected_representation_root: selection.slot?.representation_root ?? null,
        selected_quality_profile: selection.slot?.quality_profile ?? null,
        fallback_used: selection.fallback_used,
        reason_codes: clone(selection.reason_codes),
        selection_root: selection.selection_root,
        candidate_only: true,
        authoritative: false,
        canonical_write_authorized: false
      };
    }).sort((a, b) => keySort(a.chunk_id, b.chunk_id));
    const base = {
      format: LARGE_WORLD_PORTFOLIO_SELECTION_FORMAT,
      version: LARGE_WORLD_RUNTIME_VERSION,
      world_id: this.options.worldId,
      generation: this.options.generation,
      region_root: this.region.region_root,
      world_root: this.region.world_root,
      stream_root: this.activeChunkIds.length > 0 ? this.trace.at(-1)?.stream_root ?? null : null,
      requested_quality_profile: requestedQuality === null || requestedQuality === undefined ? null : String(requestedQuality).toUpperCase(),
      active_chunk_ids: [...this.activeChunkIds].sort(keySort),
      selections,
      fallback_count: selections.filter(selection => selection.fallback_used).length,
      candidate_only: true,
      authoritative: false,
      canonical_write_authorized: false,
      authority: {provider_can_write_authoritative_world_state: false, rncs_authority_required: true}
    };
    return {...base, selection_root: rootHash(base)};
  }

  listActiveChunks() { return this.activeChunkIds.map(id => clone(this.chunks.get(id))).filter(Boolean); }

  observe(input = {}) {
    const observer = normalizeObserver(input);
    const forcedRequested = normalizeForcedIds(input);
    const previous = new Set(this.activeChunkIds);
    const centerChunk = {x: Math.floor(observer.x / this.options.chunkSize), z: Math.floor(observer.z / this.options.chunkSize)};
    const forcedKnown = forcedRequested.map(id => this.chunks.get(id)).filter(Boolean);
    const unknownForcedIds = forcedRequested.filter(id => !this.chunks.has(id));
    const distance = chunk => Math.max(Math.abs(chunk.coordinates.x - centerChunk.x), Math.abs(chunk.coordinates.z - centerChunk.z));
    const within = (chunk, radius) => distance(chunk) <= radius;
    const desired = this.region.chunks.filter(chunk => within(chunk, this.options.loadRadius));
    const retained = this.region.chunks.filter(chunk => previous.has(chunk.chunk_id) && within(chunk, this.options.unloadRadius));
    const candidates = new Map([...retained, ...desired, ...forcedKnown].map(chunk => [chunk.chunk_id, chunk]));
    const sorted = [...candidates.values()].sort((a, b) => {
      const af = forcedKnown.some(chunk => chunk.chunk_id === a.chunk_id) ? 0 : 1;
      const bf = forcedKnown.some(chunk => chunk.chunk_id === b.chunk_id) ? 0 : 1;
      return af - bf || distance(a) - distance(b) || keySort(a.chunk_id, b.chunk_id);
    });
    const selected = [];
    let workingSetBytes = 0;
    const evicted = [];
    const budgetDiagnostics = [];
    for (const chunk of sorted) {
      const forced = forcedKnown.some(item => item.chunk_id === chunk.chunk_id);
      const fits = selected.length < this.options.maxActiveChunks && workingSetBytes + chunk.memory_bytes <= this.options.maxWorkingSetBytes;
      if (fits || forced && selected.length === 0) {
        selected.push(chunk);
        workingSetBytes += chunk.memory_bytes;
        if (forced && !fits) budgetDiagnostics.push(`forced-budget-overflow:${chunk.chunk_id}`);
      } else {
        evicted.push(chunk.chunk_id);
      }
    }
    const activeChunkIds = selected.map(chunk => chunk.chunk_id).sort(keySort);
    const activeSet = new Set(activeChunkIds);
    const entered = activeChunkIds.filter(id => !previous.has(id));
    const exited = [...previous].filter(id => !activeSet.has(id)).sort(keySort);
    const evictedSet = new Set(evicted);
    const base = {
      format: LARGE_WORLD_STREAM_FORMAT,
      version: LARGE_WORLD_RUNTIME_VERSION,
      world_id: this.options.worldId,
      generation: this.options.generation,
      region_root: this.region.region_root,
      world_root: this.region.world_root,
      observer_position_mm: {x: observer.x * 1000, z: observer.z * 1000},
      observer_chunk: centerChunk,
      forced_chunk_ids: forcedRequested,
      unknown_forced_chunk_ids: unknownForcedIds,
      active_chunk_ids: activeChunkIds,
      active_chunk_roots: activeChunkIds.map(id => ({chunk_id: id, chunk_root: this.chunks.get(id).chunk_root})),
      entered_chunk_ids: entered,
      exited_chunk_ids: exited,
      evicted_chunk_ids: [...evictedSet].sort(keySort),
      loaded_chunk_ids: entered,
      working_set_bytes: workingSetBytes,
      max_active_chunks: this.options.maxActiveChunks,
      max_working_set_bytes: this.options.maxWorkingSetBytes,
      diagnostics: [...budgetDiagnostics, ...unknownForcedIds.map(id => `unknown-forced-chunk:${id}`)].sort(keySort),
      canonical_state_mutated: false,
      authority: {provider_can_write_authoritative_world_state: false, rncs_authority_required: true},
      candidate_only: true,
      authoritative: false,
      commit_status: 'NOT_COMMITTED'
    };
    const resolution = {...base, stream_root: streamRoot(base)};
    this.activeChunkIds = activeChunkIds;
    this.observer = observer;
    this.trace.push({observer_position: observer, forced_chunk_ids: forcedRequested, stream_root: resolution.stream_root});
    return clone(resolution);
  }

  recordWorldEvent(input = {}) {
    const value = record(input);
    const authorityReceipt = value.authorityReceipt ?? value.authority_receipt;
    fail(authorityReceipt !== undefined && authorityReceipt !== null, 'LARGE_WORLD_EVENT_AUTHORITY_RECEIPT_REQUIRED');
    const rawMutation = clone(value.mutation ?? {operations: []});
    const mutation = Array.isArray(rawMutation)
      ? {operations: rawMutation}
      : {...record(rawMutation), operations: [...(record(rawMutation).operations ?? [])]};
    const logicalDelta = integer(value.logicalClockDelta ?? value.logical_clock_delta, 1, {min: 0});
    const simulationDelta = integer(value.simulationTickDelta ?? value.simulation_tick_delta, 1, {min: 0});
    const causalDelta = integer(value.causalSequenceDelta ?? value.causal_sequence_delta, 1, {min: 0});
    fail(logicalDelta > 0 || simulationDelta > 0 || causalDelta > 0, 'LARGE_WORLD_EVENT_TIME_DELTA_REQUIRED');
    const nextTime = advanceWorldTime(this.worldTime, {
      logical_clock_delta: logicalDelta,
      simulation_tick_delta: simulationDelta,
      causal_sequence_delta: causalDelta,
      causal_root: rootHash({previous_time_root: this.worldTime.time_root, event_index: this.eventLog.event_count + 1})
    });
    mutation.operations.push({op: 'set', path: 'world_time_tick', value: nextTime.simulation_tick});
    const nextState = applyWorldMutation(this.canonicalState, mutation);
    const event = createWorldEvent({
      world_id: this.options.worldId,
      branch_id: 'main',
      event_id: value.eventId ?? value.event_id,
      world_time: nextTime,
      causal_parents: this.eventLog.head_event_id ? [this.eventLog.head_event_id] : [],
      subjects: value.subjects ?? [],
      objects: value.objects ?? [],
      mutation,
      previous_state_root: worldStateRoot(this.canonicalState),
      next_state_root: worldStateRoot(nextState),
      authority_receipt: authorityReceipt,
      evidence_ref: value.evidenceRef ?? value.evidence_ref ?? null
    });
    this.eventLog = appendWorldEvent(this.eventLog, event);
    this.canonicalState = nextState;
    this.worldTime = nextTime;
    let fact = null;
    if (value.fact !== undefined && value.fact !== null) {
      const factInput = record(value.fact);
      fact = createWorldFact({
        ...factInput,
        world_id: this.options.worldId,
        branch_id: 'main',
        source_events: [...(factInput.source_events ?? factInput.sourceEvents ?? []), event.event_id]
      });
      this.facts = [...this.facts, fact];
    }
    this.factTree = rebuildFactWorldTree({eventLog: this.eventLog, reality_root: this.region.world_root, facts: this.facts});
    return {
      format: 'rncs.large-world-event-receipt.v0.1',
      version: LARGE_WORLD_RUNTIME_VERSION,
      world_id: this.options.worldId,
      event: clone(event),
      fact: clone(fact),
      world_time: clone(this.worldTime),
      event_log_root: this.eventLog.log_root,
      fact_tree_root: this.factTree.tree_root,
      canonical_state_root: worldStateRoot(this.canonicalState),
      canonical_state_mutated: true,
      authority_receipt: clone(authorityReceipt),
      commit_status: 'COMMITTED',
      receipt_root: rootHash({event_root: event.event_root, event_log_root: this.eventLog.log_root, fact_tree_root: this.factTree.tree_root, canonical_state_root: worldStateRoot(this.canonicalState)})
    };
  }

  async materializeActive(input = {}) {
    const value = record(input);
    const latestStream = this.trace[this.trace.length - 1];
    const streamRootValue = latestStream?.stream_root ?? this.observe({x: this.observer.x, z: this.observer.z}).stream_root;
    const receipts = [];
    for (const chunkIdValue of this.activeChunkIds) {
      const chunk = this.chunks.get(chunkIdValue);
      const receipt = await this.fabric.materialize({
        object_id: chunk.object_id,
        representation_kind: 'mesh',
        preferred_provider_id: value.providerId ?? value.provider_id ?? value.preferredProviderId ?? value.preferred_provider_id,
        detail_mode: value.detailMode ?? value.detail_mode ?? 'distance-lod',
        residency_mode: value.residencyMode ?? value.residency_mode ?? 'paged-streaming',
        resource_budget: clone(value.resourceBudget ?? value.resource_budget ?? {})
      }, {context: {world_id: this.options.worldId, stream_root: streamRootValue, world_time_root: this.worldTime.time_root, chunk: clone(chunk)}});
      receipts.push(receipt);
    }
    const statuses = receipts.map(receipt => receipt.status);
    const status = statuses.every(value => value === 'EXECUTED') ? 'EXECUTED' : statuses.some(value => value === 'FAILED') ? 'FAILED' : 'NOT_EXECUTED';
    const base = {
      format: LARGE_WORLD_MATERIALIZATION_FORMAT,
      version: LARGE_WORLD_RUNTIME_VERSION,
      world_id: this.options.worldId,
      region_root: this.region.region_root,
      stream_root: streamRootValue,
      active_chunk_ids: [...this.activeChunkIds],
      status,
      receipts: receipts.map(receipt => ({receipt_id: receipt.receipt_id, chunk_id: this.chunksByObjectId.get(receipt.object_id)?.chunk_id ?? null, representation_id: receipt.representation_id, provider_id: receipt.provider_id, status: receipt.status, output_root: receipt.output_root, receipt_root: receipt.receipt_root})),
      canonical_state_mutated: false,
      authority: {provider_can_write_authoritative_world_state: false, rncs_authority_required: true},
      candidate_only: true,
      authoritative: false,
      commit_status: 'NOT_COMMITTED'
    };
    return {...base, materialization_root: rootHash(base)};
  }

  exportReplicationSnapshot() {
    const base = replicationSnapshotBase(this);
    return {...base, snapshot_root: rootHash(base)};
  }

  replicationSnapshot() { return this.exportReplicationSnapshot(); }

  exportDurableBundle() {
    const base = durableBundleBase(this);
    return {...base, bundle_root: rootHash(base)};
  }

  durableBundle() { return this.exportDurableBundle(); }

  restoreDurableBundle(bundleInput, input = {}) {
    const bundle = clone(bundleInput);
    const verification = verifyDurableBundle(bundle);
    fail(verification.valid, `LARGE_WORLD_DURABLE_BUNDLE_INVALID:${verification.errors.join(',')}`);
    const authorityReceipt = replicationAuthorityReceipt(input.authorityReceipt ?? input.authority_receipt);
    fail(bundle.world_id === this.options.worldId, 'LARGE_WORLD_DURABLE_WORLD_MISMATCH');
    fail(bundle.region_root === this.region.region_root && bundle.world_root === this.region.world_root, 'LARGE_WORLD_DURABLE_REGION_MISMATCH');
    fail(rootHash(bundle.replication_snapshot.options) === rootHash(this.options), 'LARGE_WORLD_DURABLE_OPTIONS_MISMATCH');
    const current = this.exportReplicationSnapshot();
    fail(current.event_log.event_count === 0 && current.facts.length === 0 && current.trace.length === 0 && current.active_chunk_ids.length === 0, 'LARGE_WORLD_DURABLE_TARGET_NOT_PRISTINE');

    const snapshot = bundle.replication_snapshot;
    this.eventLog = clone(snapshot.event_log);
    this.canonicalState = clone(snapshot.canonical_state);
    this.worldTime = clone(snapshot.world_time);
    this.facts = clone(snapshot.facts);
    this.factTree = clone(snapshot.fact_tree);
    this.activeChunkIds = [...snapshot.active_chunk_ids].sort(keySort);
    this.observer = normalizeObserver(snapshot.observer);
    this.trace = clone(snapshot.trace);
    this.appliedReplicationDeltas = new Map(bundle.applied_replication_receipts.map(receipt => [receipt.delta_root, clone(receipt)]));
    this.replicationConflictDecisions = new Map((bundle.replication_conflict_decisions ?? []).map(decision => [decision.decision_root, clone(decision)]));
    const restored = this.exportReplicationSnapshot();
    fail(restored.snapshot_root === snapshot.snapshot_root, 'LARGE_WORLD_DURABLE_SNAPSHOT_MISMATCH');

    const receiptBase = {
      format: LARGE_WORLD_DURABLE_RESTORE_RECEIPT_FORMAT,
      version: LARGE_WORLD_RUNTIME_VERSION,
      receipt_id: `durable-restore-receipt:${bundle.bundle_root}`,
      bundle_root: bundle.bundle_root,
      world_id: this.options.worldId,
      restored_snapshot_root: restored.snapshot_root,
      restored_event_log_root: this.eventLog.log_root,
      restored_fact_tree_root: this.factTree.tree_root,
      restored_canonical_state_root: worldStateRoot(this.canonicalState),
      restored_delta_count: this.appliedReplicationDeltas.size,
      authority_receipt: authorityReceipt,
      status: 'RESTORED',
      canonical_state_mutated: true,
      candidate_only: false,
      authoritative: true,
      commit_status: 'COMMITTED'
    };
    return {...receiptBase, receipt_root: rootHash(receiptBase)};
  }

  createReplicationDelta(baseSnapshotInput, input = {}) {
    const baseSnapshot = clone(baseSnapshotInput);
    const baseVerification = verifyReplicationSnapshot(baseSnapshot);
    fail(baseVerification.valid, `LARGE_WORLD_REPLICATION_BASE_SNAPSHOT_INVALID:${baseVerification.errors.join(',')}`);
    const target = this.exportReplicationSnapshot();
    fail(baseSnapshot.world_id === target.world_id, 'LARGE_WORLD_REPLICATION_WORLD_MISMATCH');
    fail(baseSnapshot.region_root === target.region_root && baseSnapshot.world_root === target.world_root, 'LARGE_WORLD_REPLICATION_REGION_MISMATCH');

    const sourceEvents = target.event_log.events;
    const baseEvents = baseSnapshot.event_log.events;
    fail(baseEvents.length <= sourceEvents.length, 'LARGE_WORLD_REPLICATION_BASE_AHEAD');
    for (let index = 0; index < baseEvents.length; index += 1) {
      fail(baseEvents[index].event_root === sourceEvents[index].event_root, `LARGE_WORLD_REPLICATION_EVENT_PREFIX_MISMATCH:${index}`);
    }

    const sourceFacts = target.facts;
    const sourceFactsById = new Map(sourceFacts.map(fact => [fact.fact_id, fact]));
    for (const fact of baseSnapshot.facts) {
      const sourceFact = sourceFactsById.get(fact.fact_id);
      fail(sourceFact?.version_root === fact.version_root, `LARGE_WORLD_REPLICATION_FACT_PREFIX_MISMATCH:${fact.fact_id}`);
    }
    const baseFactIds = new Set(baseSnapshot.facts.map(fact => fact.fact_id));
    const newFacts = sourceFacts.filter(fact => !baseFactIds.has(fact.fact_id));

    const baseTrace = baseSnapshot.trace;
    const sourceTrace = target.trace;
    fail(baseTrace.length <= sourceTrace.length, 'LARGE_WORLD_REPLICATION_TRACE_PREFIX_AHEAD');
    for (let index = 0; index < baseTrace.length; index += 1) {
      fail(rootHash(baseTrace[index]) === rootHash(sourceTrace[index]), `LARGE_WORLD_REPLICATION_TRACE_PREFIX_MISMATCH:${index}`);
    }
    const traceDelta = sourceTrace.slice(baseTrace.length).map(clone);
    const value = record(input);
    const distribution = replicationDistributionFields(this, value);
    const deltaSeed = {
      base_snapshot_root: baseSnapshot.snapshot_root,
      target_snapshot_root: target.snapshot_root,
      event_roots: sourceEvents.slice(baseEvents.length).map(event => event.event_root),
      fact_roots: newFacts.map(fact => fact.version_root),
      trace_roots: traceDelta.map(entry => rootHash(entry))
    };
    if (distribution) deltaSeed.distribution = {
      consistency_profile_root: distribution.consistency_profile_root,
      authority_lease_root: distribution.authority_lease_root,
      source_node: distribution.source_node,
      target_node: distribution.target_node,
      sequence: distribution.sequence,
      epoch: distribution.epoch,
      fencing_token: distribution.fencing_token
    };
    const delta_id = String(value.deltaId ?? value.delta_id ?? `delta:${rootHash(deltaSeed).slice(0, 24)}`);
    fail(delta_id.length > 0, 'LARGE_WORLD_REPLICATION_DELTA_ID_REQUIRED');
    const base = {
      format: LARGE_WORLD_REPLICATION_DELTA_FORMAT,
      version: LARGE_WORLD_RUNTIME_VERSION,
      delta_id,
      world_id: target.world_id,
      seed: target.seed,
      generation: target.generation,
      region_root: target.region_root,
      world_root: target.world_root,
      base_snapshot_root: baseSnapshot.snapshot_root,
      base_event_log_root: baseSnapshot.event_log_root,
      base_event_count: baseEvents.length,
      base_canonical_state_root: baseSnapshot.canonical_state_root,
      base_world_time_root: baseSnapshot.world_time.time_root,
      base_fact_tree_root: baseSnapshot.fact_tree_root,
      base_fact_count: baseSnapshot.facts.length,
      base_trace_length: baseTrace.length,
      events: sourceEvents.slice(baseEvents.length).map(clone),
      facts: newFacts.map(clone),
      trace_delta: traceDelta,
      target_snapshot_root: target.snapshot_root,
      target_event_log_root: target.event_log_root,
      target_event_count: sourceEvents.length,
      target_canonical_state: clone(target.canonical_state),
      target_canonical_state_root: target.canonical_state_root,
      target_world_time: clone(target.world_time),
      target_fact_tree_root: target.fact_tree_root,
      target_fact_count: sourceFacts.length,
      target_observer: clone(target.observer),
      target_active_chunk_ids: [...target.active_chunk_ids],
      target_active_chunk_roots: clone(target.active_chunk_roots),
      target_trace_length: sourceTrace.length,
      canonical_state_mutated: false,
      authority: {provider_can_write_authoritative_world_state: false, rncs_authority_required: true},
      candidate_only: true,
      authoritative: false,
      commit_status: 'NOT_COMMITTED'
    };
    if (distribution) Object.assign(base, distribution);
    return {...base, delta_root: rootHash(base)};
  }

  applyReplicationDelta(deltaInput, input = {}) {
    const delta = clone(deltaInput);
    const verification = verifyReplicationDelta(delta);
    fail(verification.valid, `LARGE_WORLD_REPLICATION_DELTA_INVALID:${verification.errors.join(',')}`);
    const authorityReceipt = replicationAuthorityReceipt(input.authorityReceipt ?? input.authority_receipt);
    admitReplicationDistribution(this, delta, authorityReceipt);
    const applied = this.appliedReplicationDeltas.get(delta.delta_root);
    if (applied) {
      const duplicateBase = {
        ...clone(applied),
        status: 'DUPLICATE',
        applied_event_ids: [],
        applied_fact_ids: [],
        authority_receipt: authorityReceipt,
        canonical_state_mutated: false
      };
      if (duplicateBase.consistency_profile_root !== undefined) duplicateBase.authority_receipt_root = authorityReceipt.receipt_root;
      delete duplicateBase.receipt_root;
      return {...duplicateBase, receipt_root: rootHash(duplicateBase)};
    }
    const conflictDecision = [...this.replicationConflictDecisions.values()].find(decision => decision.candidates?.some(candidate => candidate.delta_root === delta.delta_root));
    if (conflictDecision && conflictDecision.winner_delta_root !== delta.delta_root) fail(false, `LARGE_WORLD_REPLICATION_CONFLICT_LOSER:${conflictDecision.conflict_id}`);

    const current = this.exportReplicationSnapshot();
    fail(delta.world_id === this.options.worldId, 'LARGE_WORLD_REPLICATION_WORLD_MISMATCH');
    fail(delta.region_root === this.region.region_root && delta.world_root === this.region.world_root, 'LARGE_WORLD_REPLICATION_REGION_MISMATCH');
    fail(delta.base_snapshot_root === current.snapshot_root, 'LARGE_WORLD_REPLICATION_BASE_SNAPSHOT_MISMATCH');
    fail(delta.base_event_log_root === this.eventLog.log_root && delta.base_event_count === this.eventLog.event_count, 'LARGE_WORLD_REPLICATION_BASE_EVENT_LOG_MISMATCH');
    fail(delta.base_canonical_state_root === worldStateRoot(this.canonicalState), 'LARGE_WORLD_REPLICATION_BASE_STATE_MISMATCH');
    fail(delta.base_world_time_root === this.worldTime.time_root, 'LARGE_WORLD_REPLICATION_BASE_TIME_MISMATCH');
    fail(delta.base_fact_tree_root === this.factTree.tree_root && delta.base_fact_count === this.facts.length, 'LARGE_WORLD_REPLICATION_BASE_FACT_TREE_MISMATCH');
    fail(delta.base_trace_length === this.trace.length, 'LARGE_WORLD_REPLICATION_BASE_TRACE_MISMATCH');

    let nextEventLog = this.eventLog;
    for (const event of delta.events) nextEventLog = appendWorldEvent(nextEventLog, event);
    const nextReplay = replayWorldEvents(nextEventLog.initial_state, nextEventLog.events);
    const nextFacts = [...this.facts, ...delta.facts.map(clone)];
    const factIds = new Set();
    for (const fact of nextFacts) {
      fail(!factIds.has(fact.fact_id), `LARGE_WORLD_REPLICATION_FACT_DUPLICATE:${fact.fact_id}`);
      factIds.add(fact.fact_id);
    }
    const nextFactTree = rebuildFactWorldTree({eventLog: nextEventLog, reality_root: this.region.world_root, facts: nextFacts});
    const nextWorldTime = clone(delta.target_world_time);
    fail(verifyWorldTime(nextWorldTime).valid, 'LARGE_WORLD_REPLICATION_TARGET_TIME_INVALID');
    const expectedHeadTime = nextEventLog.events.at(-1)?.world_time ?? nextEventLog.initial_world_time;
    fail(nextWorldTime.time_root === expectedHeadTime.time_root, 'LARGE_WORLD_REPLICATION_TARGET_TIME_MISMATCH');
    fail(nextEventLog.log_root === delta.target_event_log_root && nextEventLog.event_count === delta.target_event_count, 'LARGE_WORLD_REPLICATION_TARGET_EVENT_LOG_MISMATCH');
    fail(nextReplay.state_root === delta.target_canonical_state_root && worldStateRoot(delta.target_canonical_state) === delta.target_canonical_state_root, 'LARGE_WORLD_REPLICATION_TARGET_STATE_MISMATCH');
    fail(nextFactTree.tree_root === delta.target_fact_tree_root && nextFacts.length === delta.target_fact_count, 'LARGE_WORLD_REPLICATION_TARGET_FACT_TREE_MISMATCH');

    const targetActive = [...delta.target_active_chunk_ids];
    fail(targetActive.every(id => this.chunks.has(id)), 'LARGE_WORLD_REPLICATION_TARGET_CHUNK_UNKNOWN');
    fail(rootHash(activeChunkRoots(this, targetActive)) === rootHash(delta.target_active_chunk_roots), 'LARGE_WORLD_REPLICATION_TARGET_CHUNK_ROOT_MISMATCH');
    const targetBytes = targetActive.reduce((sum, id) => sum + this.chunks.get(id).memory_bytes, 0);
    fail(targetActive.length <= this.options.maxActiveChunks && targetBytes <= this.options.maxWorkingSetBytes, 'LARGE_WORLD_REPLICATION_TARGET_WORKING_SET_INVALID');
    const targetObserver = normalizeObserver(delta.target_observer);
    const nextTrace = [...this.trace, ...delta.trace_delta.map(clone)];
    fail(nextTrace.length === delta.target_trace_length, 'LARGE_WORLD_REPLICATION_TARGET_TRACE_LENGTH_MISMATCH');

    this.eventLog = nextEventLog;
    this.canonicalState = clone(delta.target_canonical_state);
    this.worldTime = nextWorldTime;
    this.facts = nextFacts;
    this.factTree = nextFactTree;
    this.activeChunkIds = targetActive.sort(keySort);
    this.observer = targetObserver;
    this.trace = nextTrace;
    const finalSnapshot = this.exportReplicationSnapshot();
    fail(finalSnapshot.snapshot_root === delta.target_snapshot_root, 'LARGE_WORLD_REPLICATION_TARGET_SNAPSHOT_MISMATCH');

    const receiptBase = {
      format: LARGE_WORLD_REPLICATION_RECEIPT_FORMAT,
      version: LARGE_WORLD_RUNTIME_VERSION,
      receipt_id: `replication-receipt:${delta.delta_id}`,
      delta_id: delta.delta_id,
      delta_root: delta.delta_root,
      world_id: this.options.worldId,
      source_snapshot_root: delta.target_snapshot_root,
      base_snapshot_root: delta.base_snapshot_root,
      target_snapshot_root: finalSnapshot.snapshot_root,
      status: 'APPLIED',
      applied_event_ids: delta.events.map(event => event.event_id),
      applied_fact_ids: delta.facts.map(fact => fact.fact_id),
      target_event_log_root: this.eventLog.log_root,
      target_fact_tree_root: this.factTree.tree_root,
      target_canonical_state_root: worldStateRoot(this.canonicalState),
      authority_receipt: authorityReceipt,
      canonical_state_mutated: delta.events.length > 0,
      candidate_only: false,
      authoritative: true,
      commit_status: 'COMMITTED'
    };
    if (delta.consistency_profile !== undefined) Object.assign(receiptBase, {
      consistency_profile_root: delta.consistency_profile_root,
      authority_lease_root: delta.authority_lease_root,
      authority_receipt_root: authorityReceipt.receipt_root,
      source_node: delta.source_node,
      target_node: delta.target_node,
      shard_id: delta.shard_id,
      sequence: delta.sequence,
      epoch: delta.epoch,
      fencing_token: delta.fencing_token
    });
    const receipt = {...receiptBase, receipt_root: rootHash(receiptBase)};
    this.appliedReplicationDeltas.set(delta.delta_root, receipt);
    return clone(receipt);
  }

  applyReplicationConflict(candidatesInput, input = {}) {
    const resolved = resolveReplicationConflictCandidates(candidatesInput);
    const authorityReceipt = replicationAuthorityReceipt(input.authorityReceipt ?? input.authority_receipt);
    if (authorityReceipt.decision_root !== undefined && authorityReceipt.decision_root !== null) fail(authorityReceipt.decision_root === resolved.decision.decision_root, 'LARGE_WORLD_REPLICATION_CONFLICT_AUTHORITY_DECISION_MISMATCH');
    const winner = resolved.candidates[0];
    const existingDecision = this.replicationConflictDecisions.get(resolved.decision.decision_root);
    if (!existingDecision) {
      const current = this.exportReplicationSnapshot();
      fail(resolved.decision.base_snapshot_root === current.snapshot_root, 'LARGE_WORLD_REPLICATION_CONFLICT_BASE_SNAPSHOT_MISMATCH');
    }
    const applied = this.applyReplicationDelta(winner.delta, {authorityReceipt});
    const receiptBase = {
      format: LARGE_WORLD_REPLICATION_CONFLICT_RECEIPT_FORMAT,
      version: LARGE_WORLD_RUNTIME_VERSION,
      receipt_id: `replication-conflict-receipt:${resolved.decision.conflict_id}`,
      conflict_id: resolved.decision.conflict_id,
      decision_root: resolved.decision.decision_root,
      decision: clone(resolved.decision),
      world_id: resolved.decision.world_id,
      base_snapshot_root: resolved.decision.base_snapshot_root,
      winner_delta_root: resolved.decision.winner_delta_root,
      rejected_delta_roots: [...resolved.decision.rejected_delta_roots],
      applied_receipt_root: applied.receipt_root,
      status: applied.status,
      authority_receipt: authorityReceipt,
      canonical_state_mutated: applied.canonical_state_mutated === true,
      candidate_only: false,
      authoritative: true,
      commit_status: 'COMMITTED'
    };
    const receipt = {...receiptBase, receipt_root: rootHash(receiptBase)};
    this.replicationConflictDecisions.set(resolved.decision.decision_root, clone(resolved.decision));
    return clone(receipt);
  }

  snapshot() {
    const fabricSnapshot = this.fabric.snapshot();
    const base = {
      format: LARGE_WORLD_RUNTIME_FORMAT,
      version: LARGE_WORLD_RUNTIME_VERSION,
      world_id: this.options.worldId,
      seed: this.options.seed,
      generation: this.options.generation,
      region_root: this.region.region_root,
      world_root: this.region.world_root,
      observer: clone(this.observer),
      active_chunk_ids: [...this.activeChunkIds],
      active_chunk_roots: this.activeChunkIds.map(id => ({chunk_id: id, chunk_root: this.chunks.get(id).chunk_root})),
      trace: clone(this.trace),
      canonical_state_root: worldStateRoot(this.canonicalState),
      world_time: clone(this.worldTime),
      event_log_root: this.eventLog.log_root,
      fact_tree_root: this.factTree.tree_root,
      fabric_root: fabricSnapshot.fabric_root,
      canonical_state_mutated: false,
      authority: {provider_can_write_authoritative_world_state: false, rncs_authority_required: true},
      candidate_only: true,
      authoritative: false,
      commit_status: 'NOT_COMMITTED'
    };
    return {...base, snapshot_root: rootHash(base)};
  }

  replay(trace = this.trace) {
    const entries = Array.isArray(trace) ? trace : [];
    const fresh = new LargeWorldRuntime(this.options);
    const expectedRoots = entries.map(entry => String(entry.stream_root ?? ''));
    const actualResolutions = entries.map(entry => fresh.observe({position: entry.observer_position ?? entry.observer ?? {}, forcedChunkIds: entry.forced_chunk_ids ?? entry.forcedChunkIds ?? []}));
    const actualRoots = actualResolutions.map(resolution => resolution.stream_root);
    const ok = expectedRoots.length === actualRoots.length && expectedRoots.every((root, index) => root === actualRoots[index]);
    const base = {format: 'rncs.large-world-replay.v0.1', version: LARGE_WORLD_RUNTIME_VERSION, world_id: this.options.worldId, world_root: this.region.world_root, expected_stream_roots: expectedRoots, actual_stream_roots: actualRoots, ok};
    return {...base, replay_root: rootHash(base)};
  }

  verify() {
    return {
      region: verifyRegion(this.region),
      snapshot: verifyRuntimeSnapshot(this.snapshot()),
      world_truth: {
        time: verifyWorldTime(this.worldTime),
        event_log: verifyWorldEventLog(this.eventLog),
        fact_tree: verifyFactWorldTree(this.factTree),
        canonical_state_root: worldStateRoot(this.canonicalState)
      },
      fabric_root: this.fabric.snapshot().fabric_root
    };
  }
}

export class LargeWorldDurableStore {
  constructor({filePath, path: pathValue} = {}) {
    const target = String(filePath ?? pathValue ?? '');
    fail(isAbsolute(target), 'LARGE_WORLD_DURABLE_STORE_ABSOLUTE_PATH_REQUIRED');
    this.filePath = target;
    this.tempPath = `${target}.tmp`;
  }

  async save(bundleInput, {faultAt} = {}) {
    const bundle = clone(bundleInput);
    const verification = verifyDurableBundle(bundle);
    fail(verification.valid, `LARGE_WORLD_DURABLE_STORE_BUNDLE_INVALID:${verification.errors.join(',')}`);
    await mkdir(dirname(this.filePath), {recursive: true});
    const serialized = JSON.stringify(bundle);
    const handle = await open(this.tempPath, 'w');
    let fileSynced = false;
    try {
      await handle.writeFile(serialized, 'utf8');
      await handle.sync();
      fileSynced = true;
    } finally {
      await handle.close();
    }
    injectDurableStoreFault(faultAt, 'after-temp-sync');
    await rename(this.tempPath, this.filePath);
    injectDurableStoreFault(faultAt, 'after-rename');
    const directorySynced = await syncDurableStoreDirectory(dirname(this.filePath));
    return durableStoreReceipt({
      operation: 'SAVE',
      status: 'COMMITTED',
      source: 'temp_rename',
      bundleRoot: bundle.bundle_root,
      bytes: Buffer.byteLength(serialized, 'utf8'),
      atomicRename: true,
      fileSynced,
      directorySynced
    });
  }

  async load() {
    const primary = await readDurableStoreCandidate(this.filePath);
    fail(primary.exists, 'LARGE_WORLD_DURABLE_STORE_PRIMARY_MISSING');
    fail(primary.valid, `LARGE_WORLD_DURABLE_STORE_PRIMARY_INVALID:${primary.error ?? 'unknown'}`);
    return clone(primary.bundle);
  }

  async recover() {
    const primary = await readDurableStoreCandidate(this.filePath);
    const temporary = await readDurableStoreCandidate(this.tempPath);
    if (primary.valid) {
      return {
        status: 'RECOVERED',
        source: 'primary',
        bundle: clone(primary.bundle),
        receipt: durableStoreReceipt({
          operation: 'RECOVER',
          status: 'RECOVERED',
          source: 'primary',
          bundleRoot: primary.bundle.bundle_root,
          bytes: primary.bytes,
          atomicRename: true,
          fileSynced: true,
          directorySynced: false
        }),
        diagnostics: {primary: 'VALID', temporary: temporary.valid ? 'VALID_IGNORED' : temporary.exists ? 'INVALID_IGNORED' : 'MISSING'}
      };
    }
    if (temporary.valid) {
      await rename(this.tempPath, this.filePath);
      const directorySynced = await syncDurableStoreDirectory(dirname(this.filePath));
      return {
        status: 'RECOVERED',
        source: 'temporary_promoted',
        bundle: clone(temporary.bundle),
        receipt: durableStoreReceipt({
          operation: 'RECOVER',
          status: 'RECOVERED',
          source: 'temporary_promoted',
          bundleRoot: temporary.bundle.bundle_root,
          bytes: temporary.bytes,
          atomicRename: true,
          fileSynced: true,
          directorySynced
        }),
        diagnostics: {primary: primary.exists ? 'INVALID' : 'MISSING', temporary: 'VALID_PROMOTED'}
      };
    }
    return {
      status: primary.exists || temporary.exists ? 'CORRUPT' : 'EMPTY',
      source: null,
      bundle: null,
      receipt: null,
      diagnostics: {
        primary: primary.exists ? `INVALID:${primary.error ?? 'unknown'}` : 'MISSING',
        temporary: temporary.exists ? `INVALID:${temporary.error ?? 'unknown'}` : 'MISSING'
      }
    };
  }
}

export function verifyRuntimeSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') return {valid: false, errors: ['LARGE_WORLD_SNAPSHOT_NOT_OBJECT']};
  const copy = clone(snapshot);
  const root = copy.snapshot_root;
  delete copy.snapshot_root;
  const errors = [];
  if (snapshot.format !== LARGE_WORLD_RUNTIME_FORMAT) errors.push('LARGE_WORLD_SNAPSHOT_FORMAT_INVALID');
  if (snapshot.version !== LARGE_WORLD_RUNTIME_VERSION) errors.push('LARGE_WORLD_SNAPSHOT_VERSION_INVALID');
  if (!hex64(root)) errors.push('LARGE_WORLD_SNAPSHOT_ROOT_INVALID');
  else if (rootHash(copy) !== root) errors.push('LARGE_WORLD_SNAPSHOT_ROOT_MISMATCH');
  if (snapshot.canonical_state_mutated !== false) errors.push('LARGE_WORLD_SNAPSHOT_CANONICAL_MUTATION');
  if (snapshot.authority?.provider_can_write_authoritative_world_state !== false) errors.push('LARGE_WORLD_SNAPSHOT_AUTHORITY_ESCALATION');
  if (snapshot.candidate_only !== true || snapshot.authoritative !== false) errors.push('LARGE_WORLD_SNAPSHOT_CANDIDATE_REQUIRED');
  if (snapshot.commit_status !== 'NOT_COMMITTED') errors.push('LARGE_WORLD_SNAPSHOT_COMMIT_STATUS_INVALID');
  return {valid: errors.length === 0, errors, snapshot_root: root ?? null};
}

export function verifyReplicationSnapshot(snapshot) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!snapshot || typeof snapshot !== 'object') return {valid: false, errors: ['LARGE_WORLD_REPLICATION_SNAPSHOT_NOT_OBJECT']};
  try {
    const copy = clone(snapshot);
    const snapshotRoot = copy.snapshot_root;
    delete copy.snapshot_root;
    check(snapshot.format === LARGE_WORLD_REPLICATION_SNAPSHOT_FORMAT, 'LARGE_WORLD_REPLICATION_SNAPSHOT_FORMAT_INVALID');
    check(snapshot.version === LARGE_WORLD_RUNTIME_VERSION, 'LARGE_WORLD_REPLICATION_SNAPSHOT_VERSION_INVALID');
    check(typeof snapshot.world_id === 'string' && snapshot.world_id.length > 0, 'LARGE_WORLD_REPLICATION_SNAPSHOT_WORLD_ID_REQUIRED');
    check(hex64(snapshot.region_root) && hex64(snapshot.world_root), 'LARGE_WORLD_REPLICATION_SNAPSHOT_REGION_ROOT_INVALID');
    check(verifyWorldTime(snapshot.world_time).valid, 'LARGE_WORLD_REPLICATION_SNAPSHOT_TIME_INVALID');
    const eventLogVerification = verifyWorldEventLog(snapshot.event_log);
    check(eventLogVerification.valid, `LARGE_WORLD_REPLICATION_SNAPSHOT_EVENT_LOG_INVALID:${eventLogVerification.errors.join(',')}`);
    check(snapshot.event_log_root === snapshot.event_log?.log_root, 'LARGE_WORLD_REPLICATION_SNAPSHOT_EVENT_LOG_ROOT_MISMATCH');
    check(snapshot.canonical_state_root === worldStateRoot(snapshot.canonical_state), 'LARGE_WORLD_REPLICATION_SNAPSHOT_STATE_ROOT_MISMATCH');
    const factTreeVerification = verifyFactWorldTree(snapshot.fact_tree);
    check(factTreeVerification.valid, `LARGE_WORLD_REPLICATION_SNAPSHOT_FACT_TREE_INVALID:${factTreeVerification.errors.join(',')}`);
    check(snapshot.fact_tree_root === snapshot.fact_tree?.tree_root, 'LARGE_WORLD_REPLICATION_SNAPSHOT_FACT_TREE_ROOT_MISMATCH');
    check(snapshot.fact_tree?.reality_root === snapshot.world_root, 'LARGE_WORLD_REPLICATION_SNAPSHOT_FACT_TREE_REALITY_MISMATCH');
    check(Array.isArray(snapshot.facts), 'LARGE_WORLD_REPLICATION_SNAPSHOT_FACTS_REQUIRED');
    check(Array.isArray(snapshot.active_chunk_ids) && Array.isArray(snapshot.active_chunk_roots), 'LARGE_WORLD_REPLICATION_SNAPSHOT_ACTIVE_CHUNKS_REQUIRED');
    check(snapshot.active_chunk_ids?.length === snapshot.active_chunk_roots?.length, 'LARGE_WORLD_REPLICATION_SNAPSHOT_ACTIVE_CHUNK_ROOT_COUNT_MISMATCH');
    check(Array.isArray(snapshot.trace), 'LARGE_WORLD_REPLICATION_SNAPSHOT_TRACE_REQUIRED');
    check(snapshot.canonical_state_mutated === false, 'LARGE_WORLD_REPLICATION_SNAPSHOT_CANONICAL_MUTATION');
    check(snapshot.authority?.provider_can_write_authoritative_world_state === false, 'LARGE_WORLD_REPLICATION_SNAPSHOT_AUTHORITY_ESCALATION');
    check(snapshot.candidate_only === true && snapshot.authoritative === false, 'LARGE_WORLD_REPLICATION_SNAPSHOT_CANDIDATE_REQUIRED');
    check(snapshot.commit_status === 'NOT_COMMITTED', 'LARGE_WORLD_REPLICATION_SNAPSHOT_COMMIT_STATUS_INVALID');
    check(hex64(snapshotRoot) && rootHash(copy) === snapshotRoot, 'LARGE_WORLD_REPLICATION_SNAPSHOT_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`LARGE_WORLD_REPLICATION_SNAPSHOT_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, snapshot_root: snapshot.snapshot_root ?? null};
}

export function verifyReplicationDelta(delta) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!delta || typeof delta !== 'object') return {valid: false, errors: ['LARGE_WORLD_REPLICATION_DELTA_NOT_OBJECT']};
  try {
    const copy = clone(delta);
    const deltaRoot = copy.delta_root;
    delete copy.delta_root;
    check(delta.format === LARGE_WORLD_REPLICATION_DELTA_FORMAT, 'LARGE_WORLD_REPLICATION_DELTA_FORMAT_INVALID');
    check(delta.version === LARGE_WORLD_RUNTIME_VERSION, 'LARGE_WORLD_REPLICATION_DELTA_VERSION_INVALID');
    check(typeof delta.delta_id === 'string' && delta.delta_id.length > 0, 'LARGE_WORLD_REPLICATION_DELTA_ID_REQUIRED');
    check(typeof delta.world_id === 'string' && delta.world_id.length > 0, 'LARGE_WORLD_REPLICATION_DELTA_WORLD_ID_REQUIRED');
    check(hex64(delta.region_root) && hex64(delta.world_root), 'LARGE_WORLD_REPLICATION_DELTA_REGION_ROOT_INVALID');
    for (const field of ['base_snapshot_root', 'base_event_log_root', 'base_canonical_state_root', 'base_world_time_root', 'base_fact_tree_root', 'target_snapshot_root', 'target_event_log_root', 'target_canonical_state_root', 'target_fact_tree_root']) {
      check(hex64(delta[field]), `LARGE_WORLD_REPLICATION_DELTA_${field.toUpperCase()}_INVALID`);
    }
    for (const field of ['base_event_count', 'base_fact_count', 'base_trace_length', 'target_event_count', 'target_fact_count', 'target_trace_length']) {
      check(Number.isSafeInteger(delta[field]) && delta[field] >= 0, `LARGE_WORLD_REPLICATION_DELTA_${field.toUpperCase()}_INVALID`);
    }
    if (delta.consistency_profile !== undefined) {
      const profileVerification = verifyRealityConsistencyProfile(delta.consistency_profile);
      check(profileVerification.valid, `LARGE_WORLD_REPLICATION_DELTA_CONSISTENCY_PROFILE_INVALID:${profileVerification.errors.join(',')}`);
      check(delta.consistency_profile_root === delta.consistency_profile?.profile_root, 'LARGE_WORLD_REPLICATION_DELTA_CONSISTENCY_PROFILE_ROOT_MISMATCH');
      check(typeof delta.source_node === 'string' && delta.source_node.length > 0, 'LARGE_WORLD_REPLICATION_DELTA_SOURCE_NODE_REQUIRED');
      check(typeof delta.target_node === 'string' && delta.target_node.length > 0, 'LARGE_WORLD_REPLICATION_DELTA_TARGET_NODE_REQUIRED');
      check(typeof delta.shard_id === 'string' && delta.shard_id.length > 0, 'LARGE_WORLD_REPLICATION_DELTA_SHARD_ID_REQUIRED');
      check(Number.isSafeInteger(delta.sequence) && delta.sequence >= 0, 'LARGE_WORLD_REPLICATION_DELTA_SEQUENCE_INVALID');
      if (delta.authority_lease !== null) {
        const leaseVerification = verifyAuthorityLease(delta.authority_lease);
        check(leaseVerification.valid, `LARGE_WORLD_REPLICATION_DELTA_AUTHORITY_LEASE_INVALID:${leaseVerification.errors.join(',')}`);
        check(delta.authority_lease_root === delta.authority_lease?.lease_root, 'LARGE_WORLD_REPLICATION_DELTA_AUTHORITY_LEASE_ROOT_MISMATCH');
        check(delta.authority_id === delta.authority_lease?.authority_id, 'LARGE_WORLD_REPLICATION_DELTA_AUTHORITY_ID_MISMATCH');
        check(delta.semantic_scope === delta.authority_lease?.semantic_scope, 'LARGE_WORLD_REPLICATION_DELTA_SEMANTIC_SCOPE_MISMATCH');
        check(delta.source_node === delta.authority_lease?.owner_node, 'LARGE_WORLD_REPLICATION_DELTA_OWNER_NODE_MISMATCH');
        check(delta.epoch === delta.authority_lease?.epoch, 'LARGE_WORLD_REPLICATION_DELTA_EPOCH_MISMATCH');
        check(delta.fencing_token === delta.authority_lease?.fencing_token, 'LARGE_WORLD_REPLICATION_DELTA_FENCING_TOKEN_MISMATCH');
      } else {
        check(delta.authority_lease_root === null, 'LARGE_WORLD_REPLICATION_DELTA_NULL_LEASE_ROOT_INVALID');
        check(delta.authority_id === null && delta.semantic_scope === null, 'LARGE_WORLD_REPLICATION_DELTA_NULL_LEASE_METADATA_INVALID');
      }
      if (delta.consistency_profile?.lease_required || delta.consistency_profile?.fencing_required) check(delta.authority_lease !== null, 'LARGE_WORLD_REPLICATION_DELTA_LEASE_REQUIRED');
    }
    check(Array.isArray(delta.events) && Array.isArray(delta.facts) && Array.isArray(delta.trace_delta), 'LARGE_WORLD_REPLICATION_DELTA_PAYLOAD_REQUIRED');
    check(delta.target_event_count === delta.base_event_count + delta.events.length, 'LARGE_WORLD_REPLICATION_DELTA_EVENT_COUNT_MISMATCH');
    check(delta.target_fact_count === delta.base_fact_count + delta.facts.length, 'LARGE_WORLD_REPLICATION_DELTA_FACT_COUNT_MISMATCH');
    check(delta.target_trace_length === delta.base_trace_length + delta.trace_delta.length, 'LARGE_WORLD_REPLICATION_DELTA_TRACE_COUNT_MISMATCH');
    const eventIds = new Set();
    for (const event of delta.events) {
      const verification = verifyWorldEvent(event);
      check(verification.valid, `LARGE_WORLD_REPLICATION_DELTA_EVENT_INVALID:${event?.event_id ?? 'unknown'}`);
      check(event?.world_id === delta.world_id, `LARGE_WORLD_REPLICATION_DELTA_EVENT_WORLD_MISMATCH:${event?.event_id ?? 'unknown'}`);
      check(!eventIds.has(event?.event_id), `LARGE_WORLD_REPLICATION_DELTA_EVENT_DUPLICATE:${event?.event_id ?? 'unknown'}`);
      eventIds.add(event?.event_id);
    }
    const factIds = new Set();
    for (const fact of delta.facts) {
      const verification = verifyWorldFact(fact);
      check(verification.valid, `LARGE_WORLD_REPLICATION_DELTA_FACT_INVALID:${fact?.fact_id ?? 'unknown'}`);
      check(fact?.world_id === delta.world_id, `LARGE_WORLD_REPLICATION_DELTA_FACT_WORLD_MISMATCH:${fact?.fact_id ?? 'unknown'}`);
      check(!factIds.has(fact?.fact_id), `LARGE_WORLD_REPLICATION_DELTA_FACT_DUPLICATE:${fact?.fact_id ?? 'unknown'}`);
      factIds.add(fact?.fact_id);
    }
    check(delta.target_world_time && verifyWorldTime(delta.target_world_time).valid, 'LARGE_WORLD_REPLICATION_DELTA_TARGET_TIME_INVALID');
    check(delta.target_canonical_state && worldStateRoot(delta.target_canonical_state) === delta.target_canonical_state_root, 'LARGE_WORLD_REPLICATION_DELTA_TARGET_STATE_ROOT_MISMATCH');
    check(Array.isArray(delta.target_active_chunk_ids) && Array.isArray(delta.target_active_chunk_roots), 'LARGE_WORLD_REPLICATION_DELTA_TARGET_ACTIVE_CHUNKS_REQUIRED');
    check(delta.target_active_chunk_ids?.length === delta.target_active_chunk_roots?.length, 'LARGE_WORLD_REPLICATION_DELTA_TARGET_ACTIVE_CHUNK_ROOT_COUNT_MISMATCH');
    check(delta.canonical_state_mutated === false, 'LARGE_WORLD_REPLICATION_DELTA_CANONICAL_MUTATION');
    check(delta.authority?.provider_can_write_authoritative_world_state === false, 'LARGE_WORLD_REPLICATION_DELTA_AUTHORITY_ESCALATION');
    check(delta.candidate_only === true && delta.authoritative === false, 'LARGE_WORLD_REPLICATION_DELTA_CANDIDATE_REQUIRED');
    check(delta.commit_status === 'NOT_COMMITTED', 'LARGE_WORLD_REPLICATION_DELTA_COMMIT_STATUS_INVALID');
    check(hex64(deltaRoot) && rootHash(copy) === deltaRoot, 'LARGE_WORLD_REPLICATION_DELTA_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`LARGE_WORLD_REPLICATION_DELTA_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, delta_root: delta.delta_root ?? null};
}

export function verifyReplicationReceipt(receipt) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!receipt || typeof receipt !== 'object') return {valid: false, errors: ['LARGE_WORLD_REPLICATION_RECEIPT_NOT_OBJECT']};
  try {
    const copy = clone(receipt);
    const receiptRoot = copy.receipt_root;
    delete copy.receipt_root;
    check(receipt.format === LARGE_WORLD_REPLICATION_RECEIPT_FORMAT, 'LARGE_WORLD_REPLICATION_RECEIPT_FORMAT_INVALID');
    check(receipt.version === LARGE_WORLD_RUNTIME_VERSION, 'LARGE_WORLD_REPLICATION_RECEIPT_VERSION_INVALID');
    check(['APPLIED', 'DUPLICATE'].includes(receipt.status), 'LARGE_WORLD_REPLICATION_RECEIPT_STATUS_INVALID');
    check(hex64(receipt.delta_root) && hex64(receipt.base_snapshot_root) && hex64(receipt.target_snapshot_root), 'LARGE_WORLD_REPLICATION_RECEIPT_ROOT_REFERENCE_INVALID');
    check(receipt.authority_receipt?.status === 'committed' && hex64(receipt.authority_receipt?.receipt_root), 'LARGE_WORLD_REPLICATION_RECEIPT_AUTHORITY_INVALID');
    if (receipt.consistency_profile_root !== undefined) {
      check(hex64(receipt.consistency_profile_root), 'LARGE_WORLD_REPLICATION_RECEIPT_CONSISTENCY_PROFILE_ROOT_INVALID');
      check(hex64(receipt.authority_lease_root), 'LARGE_WORLD_REPLICATION_RECEIPT_AUTHORITY_LEASE_ROOT_INVALID');
      check(hex64(receipt.authority_receipt_root), 'LARGE_WORLD_REPLICATION_RECEIPT_AUTHORITY_RECEIPT_ROOT_INVALID');
      check(typeof receipt.source_node === 'string' && receipt.source_node.length > 0, 'LARGE_WORLD_REPLICATION_RECEIPT_SOURCE_NODE_REQUIRED');
      check(typeof receipt.target_node === 'string' && receipt.target_node.length > 0, 'LARGE_WORLD_REPLICATION_RECEIPT_TARGET_NODE_REQUIRED');
      check(typeof receipt.shard_id === 'string' && receipt.shard_id.length > 0, 'LARGE_WORLD_REPLICATION_RECEIPT_SHARD_ID_REQUIRED');
      for (const field of ['sequence', 'epoch', 'fencing_token']) check(Number.isSafeInteger(receipt[field]) && receipt[field] >= 0, `LARGE_WORLD_REPLICATION_RECEIPT_${field.toUpperCase()}_INVALID`);
      check(receipt.authority_receipt_root === receipt.authority_receipt.receipt_root, 'LARGE_WORLD_REPLICATION_RECEIPT_AUTHORITY_RECEIPT_ROOT_MISMATCH');
    }
    check(receipt.canonical_state_mutated === (receipt.status === 'APPLIED' && (receipt.applied_event_ids?.length ?? 0) > 0), 'LARGE_WORLD_REPLICATION_RECEIPT_MUTATION_FLAG_INVALID');
    check(receipt.candidate_only === false && receipt.authoritative === true, 'LARGE_WORLD_REPLICATION_RECEIPT_AUTHORITY_SCOPE_INVALID');
    check(receipt.commit_status === 'COMMITTED', 'LARGE_WORLD_REPLICATION_RECEIPT_COMMIT_STATUS_INVALID');
    check(hex64(receiptRoot) && rootHash(copy) === receiptRoot, 'LARGE_WORLD_REPLICATION_RECEIPT_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`LARGE_WORLD_REPLICATION_RECEIPT_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, receipt_root: receipt.receipt_root ?? null};
}

export function resolveReplicationConflict(candidatesInput) {
  return clone(resolveReplicationConflictCandidates(candidatesInput).decision);
}

export function verifyReplicationConflictDecision(decision) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!decision || typeof decision !== 'object') return {valid: false, errors: ['LARGE_WORLD_REPLICATION_CONFLICT_DECISION_NOT_OBJECT']};
  try {
    const copy = clone(decision);
    const decisionRoot = copy.decision_root;
    delete copy.decision_root;
    check(decision.format === LARGE_WORLD_REPLICATION_CONFLICT_DECISION_FORMAT, 'LARGE_WORLD_REPLICATION_CONFLICT_DECISION_FORMAT_INVALID');
    check(decision.version === LARGE_WORLD_RUNTIME_VERSION, 'LARGE_WORLD_REPLICATION_CONFLICT_DECISION_VERSION_INVALID');
    check(typeof decision.conflict_id === 'string' && decision.conflict_id.length > 0, 'LARGE_WORLD_REPLICATION_CONFLICT_ID_REQUIRED');
    check(decision.policy?.id === LARGE_WORLD_REPLICATION_CONFLICT_POLICY_ID && decision.policy?.version === 'v0.1', 'LARGE_WORLD_REPLICATION_CONFLICT_POLICY_INVALID');
    check(decision.policy?.ordering === replicationConflictPolicy.ordering && decision.policy?.winner === replicationConflictPolicy.winner && decision.policy?.loser_status === replicationConflictPolicy.loser_status, 'LARGE_WORLD_REPLICATION_CONFLICT_POLICY_DRIFT');
    check(typeof decision.world_id === 'string' && decision.world_id.length > 0, 'LARGE_WORLD_REPLICATION_CONFLICT_WORLD_ID_REQUIRED');
    check(hex64(decision.region_root) && hex64(decision.world_root), 'LARGE_WORLD_REPLICATION_CONFLICT_REGION_ROOT_INVALID');
    check(hex64(decision.base_snapshot_root) && hex64(decision.base_event_log_root) && hex64(decision.base_canonical_state_root) && hex64(decision.base_world_time_root) && hex64(decision.base_fact_tree_root), 'LARGE_WORLD_REPLICATION_CONFLICT_BASE_ROOT_INVALID');
    for (const field of ['base_event_count', 'base_fact_count', 'base_trace_length']) check(Number.isSafeInteger(decision[field]) && decision[field] >= 0, `LARGE_WORLD_REPLICATION_CONFLICT_${field.toUpperCase()}_INVALID`);
    check(Array.isArray(decision.candidates) && decision.candidates.length > 0, 'LARGE_WORLD_REPLICATION_CONFLICT_CANDIDATES_REQUIRED');
    const writers = new Set();
    const deltas = new Set();
    for (const [index, candidate] of (decision.candidates ?? []).entries()) {
      check(typeof candidate?.writer_id === 'string' && candidate.writer_id.length > 0, `LARGE_WORLD_REPLICATION_CONFLICT_WRITER_INVALID:${index}`);
      check(Number.isSafeInteger(candidate?.writer_sequence) && candidate.writer_sequence > 0, `LARGE_WORLD_REPLICATION_CONFLICT_WRITER_SEQUENCE_INVALID:${index}`);
      check(typeof candidate?.delta_id === 'string' && candidate.delta_id.length > 0, `LARGE_WORLD_REPLICATION_CONFLICT_DELTA_ID_INVALID:${index}`);
      check(hex64(candidate?.delta_root) && hex64(candidate?.target_snapshot_root), `LARGE_WORLD_REPLICATION_CONFLICT_CANDIDATE_ROOT_INVALID:${index}`);
      check(!writers.has(candidate?.writer_id), `LARGE_WORLD_REPLICATION_CONFLICT_WRITER_DUPLICATE:${candidate?.writer_id ?? 'unknown'}`);
      check(!deltas.has(candidate?.delta_root), `LARGE_WORLD_REPLICATION_CONFLICT_DELTA_DUPLICATE:${candidate?.delta_root ?? 'unknown'}`);
      writers.add(candidate?.writer_id);
      deltas.add(candidate?.delta_root);
      if (index > 0) check(compareReplicationConflictCandidates(decision.candidates[index - 1], candidate) < 0, `LARGE_WORLD_REPLICATION_CONFLICT_ORDER_INVALID:${index}`);
    }
    check(['RESOLVED', 'NO_CONFLICT'].includes(decision.status), 'LARGE_WORLD_REPLICATION_CONFLICT_STATUS_INVALID');
    check(decision.status === (decision.candidates?.length > 1 ? 'RESOLVED' : 'NO_CONFLICT'), 'LARGE_WORLD_REPLICATION_CONFLICT_STATUS_MISMATCH');
    check(decision.winner_delta_root === decision.candidates?.[0]?.delta_root, 'LARGE_WORLD_REPLICATION_CONFLICT_WINNER_INVALID');
    check(Array.isArray(decision.rejected_delta_roots) && decision.rejected_delta_roots.every(hex64) && rootHash(decision.rejected_delta_roots) === rootHash((decision.candidates ?? []).slice(1).map(candidate => candidate.delta_root)), 'LARGE_WORLD_REPLICATION_CONFLICT_REJECTED_SET_INVALID');
    check(decision.canonical_state_mutated === false, 'LARGE_WORLD_REPLICATION_CONFLICT_CANONICAL_MUTATION');
    check(decision.authority?.provider_can_write_authoritative_world_state === false, 'LARGE_WORLD_REPLICATION_CONFLICT_AUTHORITY_ESCALATION');
    check(decision.candidate_only === true && decision.authoritative === false, 'LARGE_WORLD_REPLICATION_CONFLICT_CANDIDATE_REQUIRED');
    check(decision.commit_status === 'NOT_COMMITTED', 'LARGE_WORLD_REPLICATION_CONFLICT_COMMIT_STATUS_INVALID');
    check(decision.conflict_id === `replication-conflict:${rootHash(replicationConflictBase(decision))}:${rootHash(decision.candidates).slice(0, 24)}`, 'LARGE_WORLD_REPLICATION_CONFLICT_ID_MISMATCH');
    check(hex64(decisionRoot) && rootHash(copy) === decisionRoot, 'LARGE_WORLD_REPLICATION_CONFLICT_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`LARGE_WORLD_REPLICATION_CONFLICT_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, decision_root: decision.decision_root ?? null};
}

export function verifyReplicationConflictReceipt(receipt) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!receipt || typeof receipt !== 'object') return {valid: false, errors: ['LARGE_WORLD_REPLICATION_CONFLICT_RECEIPT_NOT_OBJECT']};
  try {
    const copy = clone(receipt);
    const receiptRoot = copy.receipt_root;
    delete copy.receipt_root;
    const decisionVerification = verifyReplicationConflictDecision(receipt.decision);
    check(receipt.format === LARGE_WORLD_REPLICATION_CONFLICT_RECEIPT_FORMAT, 'LARGE_WORLD_REPLICATION_CONFLICT_RECEIPT_FORMAT_INVALID');
    check(receipt.version === LARGE_WORLD_RUNTIME_VERSION, 'LARGE_WORLD_REPLICATION_CONFLICT_RECEIPT_VERSION_INVALID');
    check(typeof receipt.receipt_id === 'string' && receipt.receipt_id.length > 0, 'LARGE_WORLD_REPLICATION_CONFLICT_RECEIPT_ID_REQUIRED');
    check(decisionVerification.valid, `LARGE_WORLD_REPLICATION_CONFLICT_RECEIPT_DECISION_INVALID:${decisionVerification.errors.join(',')}`);
    check(receipt.decision_root === receipt.decision?.decision_root && hex64(receipt.decision_root), 'LARGE_WORLD_REPLICATION_CONFLICT_RECEIPT_DECISION_ROOT_INVALID');
    check(receipt.conflict_id === receipt.decision?.conflict_id, 'LARGE_WORLD_REPLICATION_CONFLICT_RECEIPT_ID_MISMATCH');
    check(['APPLIED', 'DUPLICATE'].includes(receipt.status), 'LARGE_WORLD_REPLICATION_CONFLICT_RECEIPT_STATUS_INVALID');
    check(typeof receipt.world_id === 'string' && receipt.world_id === receipt.decision?.world_id, 'LARGE_WORLD_REPLICATION_CONFLICT_RECEIPT_WORLD_MISMATCH');
    check(hex64(receipt.base_snapshot_root) && receipt.base_snapshot_root === receipt.decision?.base_snapshot_root, 'LARGE_WORLD_REPLICATION_CONFLICT_RECEIPT_BASE_ROOT_INVALID');
    check(receipt.winner_delta_root === receipt.decision?.winner_delta_root, 'LARGE_WORLD_REPLICATION_CONFLICT_RECEIPT_WINNER_INVALID');
    check(Array.isArray(receipt.rejected_delta_roots) && rootHash(receipt.rejected_delta_roots) === rootHash(receipt.decision?.rejected_delta_roots ?? []), 'LARGE_WORLD_REPLICATION_CONFLICT_RECEIPT_REJECTED_SET_INVALID');
    check(hex64(receipt.applied_receipt_root), 'LARGE_WORLD_REPLICATION_CONFLICT_RECEIPT_APPLIED_ROOT_INVALID');
    check(receipt.authority_receipt?.status === 'committed' && hex64(receipt.authority_receipt?.receipt_root), 'LARGE_WORLD_REPLICATION_CONFLICT_RECEIPT_AUTHORITY_INVALID');
    check(receipt.authority_receipt?.decision_root === undefined || receipt.authority_receipt?.decision_root === null || receipt.authority_receipt?.decision_root === receipt.decision_root, 'LARGE_WORLD_REPLICATION_CONFLICT_RECEIPT_AUTHORITY_DECISION_MISMATCH');
    check(typeof receipt.canonical_state_mutated === 'boolean' && (receipt.status === 'APPLIED' || receipt.canonical_state_mutated === false), 'LARGE_WORLD_REPLICATION_CONFLICT_RECEIPT_MUTATION_FLAG_INVALID');
    check(receipt.candidate_only === false && receipt.authoritative === true, 'LARGE_WORLD_REPLICATION_CONFLICT_RECEIPT_AUTHORITY_SCOPE_INVALID');
    check(receipt.commit_status === 'COMMITTED', 'LARGE_WORLD_REPLICATION_CONFLICT_RECEIPT_COMMIT_STATUS_INVALID');
    check(hex64(receiptRoot) && rootHash(copy) === receiptRoot, 'LARGE_WORLD_REPLICATION_CONFLICT_RECEIPT_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`LARGE_WORLD_REPLICATION_CONFLICT_RECEIPT_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, receipt_root: receipt.receipt_root ?? null};
}

export function verifyDurableBundle(bundle) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!bundle || typeof bundle !== 'object') return {valid: false, errors: ['LARGE_WORLD_DURABLE_BUNDLE_NOT_OBJECT']};
  try {
    const copy = clone(bundle);
    const bundleRoot = copy.bundle_root;
    delete copy.bundle_root;
    check(bundle.format === LARGE_WORLD_DURABLE_BUNDLE_FORMAT, 'LARGE_WORLD_DURABLE_BUNDLE_FORMAT_INVALID');
    check(bundle.version === LARGE_WORLD_RUNTIME_VERSION, 'LARGE_WORLD_DURABLE_BUNDLE_VERSION_INVALID');
    check(typeof bundle.world_id === 'string' && bundle.world_id.length > 0, 'LARGE_WORLD_DURABLE_BUNDLE_WORLD_ID_REQUIRED');
    check(hex64(bundle.region_root) && hex64(bundle.world_root), 'LARGE_WORLD_DURABLE_BUNDLE_REGION_ROOT_INVALID');
    const snapshotVerification = verifyReplicationSnapshot(bundle.replication_snapshot);
    check(snapshotVerification.valid, `LARGE_WORLD_DURABLE_BUNDLE_SNAPSHOT_INVALID:${snapshotVerification.errors.join(',')}`);
    check(bundle.replication_snapshot?.world_id === bundle.world_id, 'LARGE_WORLD_DURABLE_BUNDLE_SNAPSHOT_WORLD_MISMATCH');
    check(bundle.replication_snapshot?.region_root === bundle.region_root && bundle.replication_snapshot?.world_root === bundle.world_root, 'LARGE_WORLD_DURABLE_BUNDLE_SNAPSHOT_REGION_MISMATCH');
    check(Array.isArray(bundle.applied_replication_receipts), 'LARGE_WORLD_DURABLE_BUNDLE_RECEIPTS_REQUIRED');
    const deltaRoots = new Set();
    for (const receipt of bundle.applied_replication_receipts ?? []) {
      const receiptVerification = verifyReplicationReceipt(receipt);
      check(receiptVerification.valid, `LARGE_WORLD_DURABLE_BUNDLE_RECEIPT_INVALID:${receipt?.delta_id ?? 'unknown'}`);
      check(!deltaRoots.has(receipt?.delta_root), `LARGE_WORLD_DURABLE_BUNDLE_RECEIPT_DUPLICATE:${receipt?.delta_root ?? 'unknown'}`);
      deltaRoots.add(receipt?.delta_root);
    }
    check(Array.isArray(bundle.replication_conflict_decisions ?? []), 'LARGE_WORLD_DURABLE_BUNDLE_CONFLICT_DECISIONS_REQUIRED');
    const conflictRoots = new Set();
    for (const decision of bundle.replication_conflict_decisions ?? []) {
      const decisionVerification = verifyReplicationConflictDecision(decision);
      check(decisionVerification.valid, `LARGE_WORLD_DURABLE_BUNDLE_CONFLICT_DECISION_INVALID:${decision?.conflict_id ?? 'unknown'}`);
      check(!conflictRoots.has(decision?.decision_root), `LARGE_WORLD_DURABLE_BUNDLE_CONFLICT_DECISION_DUPLICATE:${decision?.decision_root ?? 'unknown'}`);
      conflictRoots.add(decision?.decision_root);
      check(decision?.world_id === bundle.world_id && decision?.region_root === bundle.region_root && decision?.world_root === bundle.world_root, `LARGE_WORLD_DURABLE_BUNDLE_CONFLICT_DECISION_WORLD_MISMATCH:${decision?.conflict_id ?? 'unknown'}`);
    }
    check(bundle.canonical_state_mutated === false, 'LARGE_WORLD_DURABLE_BUNDLE_CANONICAL_MUTATION');
    check(bundle.authority?.provider_can_write_authoritative_world_state === false, 'LARGE_WORLD_DURABLE_BUNDLE_AUTHORITY_ESCALATION');
    check(bundle.candidate_only === true && bundle.authoritative === false, 'LARGE_WORLD_DURABLE_BUNDLE_CANDIDATE_REQUIRED');
    check(bundle.commit_status === 'NOT_COMMITTED', 'LARGE_WORLD_DURABLE_BUNDLE_COMMIT_STATUS_INVALID');
    check(hex64(bundleRoot) && rootHash(copy) === bundleRoot, 'LARGE_WORLD_DURABLE_BUNDLE_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`LARGE_WORLD_DURABLE_BUNDLE_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, bundle_root: bundle.bundle_root ?? null};
}

export function verifyDurableRestoreReceipt(receipt) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!receipt || typeof receipt !== 'object') return {valid: false, errors: ['LARGE_WORLD_DURABLE_RESTORE_RECEIPT_NOT_OBJECT']};
  try {
    const copy = clone(receipt);
    const receiptRoot = copy.receipt_root;
    delete copy.receipt_root;
    check(receipt.format === LARGE_WORLD_DURABLE_RESTORE_RECEIPT_FORMAT, 'LARGE_WORLD_DURABLE_RESTORE_RECEIPT_FORMAT_INVALID');
    check(receipt.version === LARGE_WORLD_RUNTIME_VERSION, 'LARGE_WORLD_DURABLE_RESTORE_RECEIPT_VERSION_INVALID');
    check(receipt.status === 'RESTORED', 'LARGE_WORLD_DURABLE_RESTORE_RECEIPT_STATUS_INVALID');
    check(hex64(receipt.bundle_root) && hex64(receipt.restored_snapshot_root) && hex64(receipt.restored_event_log_root) && hex64(receipt.restored_fact_tree_root) && hex64(receipt.restored_canonical_state_root), 'LARGE_WORLD_DURABLE_RESTORE_RECEIPT_ROOT_REFERENCE_INVALID');
    check(receipt.authority_receipt?.status === 'committed' && hex64(receipt.authority_receipt?.receipt_root), 'LARGE_WORLD_DURABLE_RESTORE_RECEIPT_AUTHORITY_INVALID');
    check(receipt.canonical_state_mutated === true && receipt.candidate_only === false && receipt.authoritative === true, 'LARGE_WORLD_DURABLE_RESTORE_RECEIPT_AUTHORITY_SCOPE_INVALID');
    check(receipt.commit_status === 'COMMITTED', 'LARGE_WORLD_DURABLE_RESTORE_RECEIPT_COMMIT_STATUS_INVALID');
    check(hex64(receiptRoot) && rootHash(copy) === receiptRoot, 'LARGE_WORLD_DURABLE_RESTORE_RECEIPT_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`LARGE_WORLD_DURABLE_RESTORE_RECEIPT_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, receipt_root: receipt.receipt_root ?? null};
}

export function verifyDurableStoreReceipt(receipt) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!receipt || typeof receipt !== 'object') return {valid: false, errors: ['LARGE_WORLD_DURABLE_STORE_RECEIPT_NOT_OBJECT']};
  try {
    const copy = clone(receipt);
    const receiptRoot = copy.receipt_root;
    delete copy.receipt_root;
    check(receipt.format === LARGE_WORLD_DURABLE_STORE_RECEIPT_FORMAT, 'LARGE_WORLD_DURABLE_STORE_RECEIPT_FORMAT_INVALID');
    check(receipt.version === LARGE_WORLD_RUNTIME_VERSION, 'LARGE_WORLD_DURABLE_STORE_RECEIPT_VERSION_INVALID');
    check(['SAVE', 'RECOVER'].includes(receipt.operation), 'LARGE_WORLD_DURABLE_STORE_RECEIPT_OPERATION_INVALID');
    check(['COMMITTED', 'RECOVERED'].includes(receipt.status), 'LARGE_WORLD_DURABLE_STORE_RECEIPT_STATUS_INVALID');
    check(['temp_rename', 'primary', 'temporary_promoted'].includes(receipt.source), 'LARGE_WORLD_DURABLE_STORE_RECEIPT_SOURCE_INVALID');
    check(hex64(receipt.bundle_root), 'LARGE_WORLD_DURABLE_STORE_RECEIPT_BUNDLE_ROOT_INVALID');
    check(Number.isSafeInteger(receipt.bytes) && receipt.bytes > 0, 'LARGE_WORLD_DURABLE_STORE_RECEIPT_BYTES_INVALID');
    check(receipt.atomic_rename === true && receipt.file_synced === true, 'LARGE_WORLD_DURABLE_STORE_RECEIPT_ATOMICITY_INVALID');
    check(typeof receipt.directory_synced === 'boolean', 'LARGE_WORLD_DURABLE_STORE_RECEIPT_DIRECTORY_SYNC_INVALID');
    check(receipt.canonical_state_mutated === false, 'LARGE_WORLD_DURABLE_STORE_RECEIPT_CANONICAL_MUTATION');
    check(receipt.authority?.provider_can_write_authoritative_world_state === false, 'LARGE_WORLD_DURABLE_STORE_RECEIPT_AUTHORITY_ESCALATION');
    check(receipt.candidate_only === true && receipt.authoritative === false, 'LARGE_WORLD_DURABLE_STORE_RECEIPT_CANDIDATE_REQUIRED');
    check(receipt.commit_status === 'NOT_COMMITTED', 'LARGE_WORLD_DURABLE_STORE_RECEIPT_COMMIT_STATUS_INVALID');
    check(hex64(receiptRoot) && rootHash(copy) === receiptRoot, 'LARGE_WORLD_DURABLE_STORE_RECEIPT_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`LARGE_WORLD_DURABLE_STORE_RECEIPT_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, receipt_root: receipt.receipt_root ?? null};
}

export function createReplicationPacket(deltaInput, input = {}) {
  const delta = clone(deltaInput);
  const deltaVerification = verifyReplicationDelta(delta);
  fail(deltaVerification.valid, `LARGE_WORLD_REPLICATION_PACKET_DELTA_INVALID:${deltaVerification.errors.join(',')}`);
  const value = record(input);
  const channelId = String(value.channelId ?? value.channel_id ?? 'large-world-replication');
  const senderId = String(value.senderId ?? value.sender_id ?? 'source');
  const recipientId = String(value.recipientId ?? value.recipient_id ?? 'target');
  const sequence = integer(value.sequence, 1, {min: 1});
  fail(channelId.length > 0 && senderId.length > 0 && recipientId.length > 0, 'LARGE_WORLD_REPLICATION_PACKET_ENDPOINT_REQUIRED');
  const base = {
    format: LARGE_WORLD_REPLICATION_PACKET_FORMAT,
    version: LARGE_WORLD_RUNTIME_VERSION,
    packet_id: packetId({channelId, sequence, deltaRoot: delta.delta_root}),
    channel_id: channelId,
    sender_id: senderId,
    recipient_id: recipientId,
    sequence,
    delta_root: delta.delta_root,
    delta,
    reliability: {mode: 'ack-and-retry', duplicate_safe: true, ordered_base_roots: true}
  };
  return {...base, packet_root: rootHash(base), auth_tag: authenticationTag(base, value.authKey ?? value.auth_key)};
}

export function verifyReplicationPacket(packet, input = {}) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!packet || typeof packet !== 'object') return {valid: false, errors: ['LARGE_WORLD_REPLICATION_PACKET_NOT_OBJECT']};
  try {
    const copy = clone(packet);
    const packetRoot = copy.packet_root;
    const authTag = copy.auth_tag;
    delete copy.packet_root;
    delete copy.auth_tag;
    check(packet.format === LARGE_WORLD_REPLICATION_PACKET_FORMAT, 'LARGE_WORLD_REPLICATION_PACKET_FORMAT_INVALID');
    check(packet.version === LARGE_WORLD_RUNTIME_VERSION, 'LARGE_WORLD_REPLICATION_PACKET_VERSION_INVALID');
    check(typeof packet.packet_id === 'string' && packet.packet_id.length > 0, 'LARGE_WORLD_REPLICATION_PACKET_ID_REQUIRED');
    check(typeof packet.channel_id === 'string' && packet.channel_id.length > 0, 'LARGE_WORLD_REPLICATION_PACKET_CHANNEL_REQUIRED');
    check(typeof packet.sender_id === 'string' && packet.sender_id.length > 0, 'LARGE_WORLD_REPLICATION_PACKET_SENDER_REQUIRED');
    check(typeof packet.recipient_id === 'string' && packet.recipient_id.length > 0, 'LARGE_WORLD_REPLICATION_PACKET_RECIPIENT_REQUIRED');
    check(Number.isSafeInteger(packet.sequence) && packet.sequence > 0, 'LARGE_WORLD_REPLICATION_PACKET_SEQUENCE_INVALID');
    const deltaVerification = verifyReplicationDelta(packet.delta);
    check(deltaVerification.valid, `LARGE_WORLD_REPLICATION_PACKET_DELTA_INVALID:${deltaVerification.errors.join(',')}`);
    check(packet.delta_root === packet.delta?.delta_root, 'LARGE_WORLD_REPLICATION_PACKET_DELTA_ROOT_MISMATCH');
    check(packet.packet_id === packetId({channelId: packet.channel_id, sequence: packet.sequence, deltaRoot: packet.delta_root ?? ''}), 'LARGE_WORLD_REPLICATION_PACKET_ID_MISMATCH');
    check(packet.reliability?.mode === 'ack-and-retry' && packet.reliability?.duplicate_safe === true, 'LARGE_WORLD_REPLICATION_PACKET_RELIABILITY_INVALID');
    check(hex64(packetRoot) && rootHash(copy) === packetRoot, 'LARGE_WORLD_REPLICATION_PACKET_ROOT_MISMATCH');
    check(authenticationTagMatches(copy, authTag, input.authKey ?? input.auth_key), 'LARGE_WORLD_REPLICATION_PACKET_AUTH_INVALID');
  } catch (error) {
    errors.push(`LARGE_WORLD_REPLICATION_PACKET_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, packet_root: packet.packet_root ?? null};
}

export function createReplicationAck(packetInput, input = {}) {
  const packet = clone(packetInput);
  const packetVerification = verifyReplicationPacket(packet, input);
  fail(packetVerification.valid, `LARGE_WORLD_REPLICATION_ACK_PACKET_INVALID:${packetVerification.errors.join(',')}`);
  const value = record(input);
  const status = String(value.status ?? 'APPLIED');
  fail(['APPLIED', 'DUPLICATE', 'REJECTED'].includes(status), 'LARGE_WORLD_REPLICATION_ACK_STATUS_INVALID');
  const receiptRoot = value.receiptRoot ?? value.receipt_root ?? null;
  if (status !== 'REJECTED') fail(hex64(receiptRoot), 'LARGE_WORLD_REPLICATION_ACK_RECEIPT_ROOT_REQUIRED');
  const base = {
    format: LARGE_WORLD_REPLICATION_ACK_FORMAT,
    version: LARGE_WORLD_RUNTIME_VERSION,
    ack_id: `replication-ack:${packet.packet_id}:${status}`,
    packet_id: packet.packet_id,
    channel_id: packet.channel_id,
    sender_id: String(value.senderId ?? value.sender_id ?? packet.recipient_id),
    recipient_id: String(value.recipientId ?? value.recipient_id ?? packet.sender_id),
    sequence: packet.sequence,
    delta_root: packet.delta_root,
    status,
    receipt_root: receiptRoot,
    error: value.error === undefined || value.error === null ? null : String(value.error)
  };
  return {...base, ack_root: rootHash(base), auth_tag: authenticationTag(base, value.authKey ?? value.auth_key)};
}

export function verifyReplicationAck(ack, input = {}) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!ack || typeof ack !== 'object') return {valid: false, errors: ['LARGE_WORLD_REPLICATION_ACK_NOT_OBJECT']};
  try {
    const copy = clone(ack);
    const ackRoot = copy.ack_root;
    const authTag = copy.auth_tag;
    delete copy.ack_root;
    delete copy.auth_tag;
    check(ack.format === LARGE_WORLD_REPLICATION_ACK_FORMAT, 'LARGE_WORLD_REPLICATION_ACK_FORMAT_INVALID');
    check(ack.version === LARGE_WORLD_RUNTIME_VERSION, 'LARGE_WORLD_REPLICATION_ACK_VERSION_INVALID');
    check(typeof ack.ack_id === 'string' && ack.ack_id.length > 0, 'LARGE_WORLD_REPLICATION_ACK_ID_REQUIRED');
    check(typeof ack.packet_id === 'string' && ack.packet_id.length > 0, 'LARGE_WORLD_REPLICATION_ACK_PACKET_ID_REQUIRED');
    check(['APPLIED', 'DUPLICATE', 'REJECTED'].includes(ack.status), 'LARGE_WORLD_REPLICATION_ACK_STATUS_INVALID');
    check(Number.isSafeInteger(ack.sequence) && ack.sequence > 0, 'LARGE_WORLD_REPLICATION_ACK_SEQUENCE_INVALID');
    if (ack.status !== 'REJECTED') check(hex64(ack.receipt_root), 'LARGE_WORLD_REPLICATION_ACK_RECEIPT_ROOT_INVALID');
    check(hex64(ack.delta_root), 'LARGE_WORLD_REPLICATION_ACK_DELTA_ROOT_INVALID');
    check(hex64(ackRoot) && rootHash(copy) === ackRoot, 'LARGE_WORLD_REPLICATION_ACK_ROOT_MISMATCH');
    check(authenticationTagMatches(copy, authTag, input.authKey ?? input.auth_key), 'LARGE_WORLD_REPLICATION_ACK_AUTH_INVALID');
  } catch (error) {
    errors.push(`LARGE_WORLD_REPLICATION_ACK_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, ack_root: ack.ack_root ?? null};
}

export class LargeWorldReplicationLink {
  constructor({source, target, transport, authKey, channelId = 'large-world-replication', sourceEndpoint = 'source', targetEndpoint = 'target', authorityReceipt} = {}) {
    fail(source instanceof LargeWorldRuntime && target instanceof LargeWorldRuntime, 'LARGE_WORLD_REPLICATION_LINK_RUNTIME_REQUIRED');
    fail(transport && typeof transport.send === 'function' && typeof transport.register === 'function', 'LARGE_WORLD_REPLICATION_TRANSPORT_REQUIRED');
    fail(typeof authKey === 'string' && authKey.length > 0, 'LARGE_WORLD_REPLICATION_AUTH_KEY_REQUIRED');
    this.source = source;
    this.target = target;
    this.transport = transport;
    this.authKey = authKey;
    this.channelId = String(channelId);
    this.sourceEndpoint = String(sourceEndpoint);
    this.targetEndpoint = String(targetEndpoint);
    this.authorityReceipt = clone(authorityReceipt ?? null);
    this.sequence = 0;
    this.pending = new Map();
    this.received = new Map();
    this.acks = [];
    this.errors = [];
    this.transport.register(this.targetEndpoint, message => this.receiveAtTarget(message?.payload ?? message));
    this.transport.register(this.sourceEndpoint, message => this.receiveAtSource(message?.payload ?? message));
  }

  sendDelta(delta, input = {}) {
    if (input.authorityReceipt !== undefined || input.authority_receipt !== undefined) this.authorityReceipt = clone(input.authorityReceipt ?? input.authority_receipt);
    replicationAuthorityReceipt(this.authorityReceipt);
    const packet = createReplicationPacket(delta, {
      authKey: this.authKey,
      channelId: this.channelId,
      senderId: this.sourceEndpoint,
      recipientId: this.targetEndpoint,
      sequence: this.sequence + 1
    });
    this.sequence = packet.sequence;
    this.pending.set(packet.packet_id, {packet, retries: 0});
    this.transport.send(this.sourceEndpoint, this.targetEndpoint, 'large-world-replication', packet);
    return clone(packet);
  }

  receiveAtTarget(packet) {
    const verification = verifyReplicationPacket(packet, {authKey: this.authKey});
    if (!verification.valid || packet.recipient_id !== this.targetEndpoint || packet.sender_id !== this.sourceEndpoint || packet.channel_id !== this.channelId) {
      this.errors.push({kind: 'packet', errors: verification.errors.length ? verification.errors : ['LARGE_WORLD_REPLICATION_PACKET_ROUTE_INVALID']});
      return {status: 'REJECTED', errors: [...this.errors.at(-1).errors]};
    }
    const prior = this.received.get(packet.packet_id);
    if (prior) {
      const ack = createReplicationAck(packet, {authKey: this.authKey, status: prior.status, receiptRoot: prior.receipt_root, senderId: this.targetEndpoint, recipientId: this.sourceEndpoint});
      this.transport.send(this.targetEndpoint, this.sourceEndpoint, 'large-world-replication-ack', ack);
      return clone(prior);
    }
    let receipt;
    try {
      receipt = this.target.applyReplicationDelta(packet.delta, {authorityReceipt: this.authorityReceipt});
    } catch (error) {
      const message = String(error.message ?? error);
      this.errors.push({kind: 'apply', packet_id: packet.packet_id, error: message});
      const ack = createReplicationAck(packet, {authKey: this.authKey, status: 'REJECTED', error: message, senderId: this.targetEndpoint, recipientId: this.sourceEndpoint});
      this.transport.send(this.targetEndpoint, this.sourceEndpoint, 'large-world-replication-ack', ack);
      return {status: 'REJECTED', error: message};
    }
    this.received.set(packet.packet_id, receipt);
    const ack = createReplicationAck(packet, {authKey: this.authKey, status: receipt.status, receiptRoot: receipt.receipt_root, senderId: this.targetEndpoint, recipientId: this.sourceEndpoint});
    this.transport.send(this.targetEndpoint, this.sourceEndpoint, 'large-world-replication-ack', ack);
    return clone(receipt);
  }

  receiveAtSource(ack) {
    const verification = verifyReplicationAck(ack, {authKey: this.authKey});
    if (!verification.valid || ack.recipient_id !== this.sourceEndpoint || ack.sender_id !== this.targetEndpoint || ack.channel_id !== this.channelId) {
      this.errors.push({kind: 'ack', errors: verification.errors.length ? verification.errors : ['LARGE_WORLD_REPLICATION_ACK_ROUTE_INVALID']});
      return {status: 'REJECTED', errors: [...this.errors.at(-1).errors]};
    }
    this.acks.push(clone(ack));
    if (ack.status === 'APPLIED' || ack.status === 'DUPLICATE') this.pending.delete(ack.packet_id);
    return clone(ack);
  }

  retryPending() {
    const resent = [];
    for (const entry of this.pending.values()) {
      entry.retries += 1;
      resent.push(clone(entry.packet));
      this.transport.send(this.sourceEndpoint, this.targetEndpoint, 'large-world-replication', entry.packet);
    }
    return resent;
  }

  advance(ticks = 1) {
    if (typeof this.transport.advance === 'function') this.transport.advance(ticks);
    return this.status();
  }

  status() {
    return {
      channel_id: this.channelId,
      next_sequence: this.sequence + 1,
      pending_packet_ids: [...this.pending.keys()].sort(keySort),
      received_packet_ids: [...this.received.keys()].sort(keySort),
      ack_count: this.acks.length,
      errors: clone(this.errors)
    };
  }
}

export function verifyStreamResolutionReceipt(resolution) {
  const errors = [];
  if (resolution?.format !== LARGE_WORLD_STREAM_FORMAT) errors.push('LARGE_WORLD_STREAM_FORMAT_INVALID');
  if (!verifyStreamResolution(resolution)) errors.push('LARGE_WORLD_STREAM_ROOT_INVALID');
  if (resolution?.canonical_state_mutated !== false) errors.push('LARGE_WORLD_STREAM_CANONICAL_MUTATION');
  if (resolution?.authority?.provider_can_write_authoritative_world_state !== false) errors.push('LARGE_WORLD_STREAM_AUTHORITY_ESCALATION');
  if (resolution?.active_chunk_ids?.length > resolution?.max_active_chunks) errors.push('LARGE_WORLD_STREAM_ACTIVE_BUDGET_EXCEEDED');
  return {valid: errors.length === 0, errors, stream_root: resolution?.stream_root ?? null};
}

export function verifyPortfolioSelectionEnvelope(selection) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!selection || typeof selection !== 'object') return {valid: false, errors: ['LARGE_WORLD_PORTFOLIO_SELECTION_NOT_OBJECT']};
  try {
    check(selection.format === LARGE_WORLD_PORTFOLIO_SELECTION_FORMAT, 'LARGE_WORLD_PORTFOLIO_SELECTION_FORMAT_INVALID');
    check(selection.version === LARGE_WORLD_RUNTIME_VERSION, 'LARGE_WORLD_PORTFOLIO_SELECTION_VERSION_INVALID');
    check(typeof selection.world_id === 'string' && selection.world_id.length > 0, 'LARGE_WORLD_PORTFOLIO_SELECTION_WORLD_ID_REQUIRED');
    check(Number.isSafeInteger(selection.generation) && selection.generation >= 0, 'LARGE_WORLD_PORTFOLIO_SELECTION_GENERATION_INVALID');
    check(hex64(selection.region_root), 'LARGE_WORLD_PORTFOLIO_SELECTION_REGION_ROOT_INVALID');
    check(hex64(selection.world_root), 'LARGE_WORLD_PORTFOLIO_SELECTION_WORLD_ROOT_INVALID');
    check(selection.stream_root === null || hex64(selection.stream_root), 'LARGE_WORLD_PORTFOLIO_SELECTION_STREAM_ROOT_INVALID');
    check(Array.isArray(selection.active_chunk_ids), 'LARGE_WORLD_PORTFOLIO_SELECTION_ACTIVE_IDS_INVALID');
    check(Array.isArray(selection.selections), 'LARGE_WORLD_PORTFOLIO_SELECTION_ROWS_INVALID');
    check(selection.selections.length === selection.active_chunk_ids.length, 'LARGE_WORLD_PORTFOLIO_SELECTION_ROW_COUNT_MISMATCH');
    const activeIds = [...selection.active_chunk_ids].sort(keySort);
    const rowIds = (selection.selections ?? []).map(row => row?.chunk_id).sort(keySort);
    check(JSON.stringify(activeIds) === JSON.stringify(rowIds), 'LARGE_WORLD_PORTFOLIO_SELECTION_ACTIVE_IDS_MISMATCH');
    for (const row of selection.selections ?? []) {
      check(typeof row?.chunk_id === 'string' && row.chunk_id.length > 0, 'LARGE_WORLD_PORTFOLIO_SELECTION_CHUNK_ID_REQUIRED');
      check(hex64(row?.portfolio_root), 'LARGE_WORLD_PORTFOLIO_SELECTION_PORTFOLIO_ROOT_INVALID');
      check(row?.selected_slot_id === null || typeof row?.selected_slot_id === 'string', 'LARGE_WORLD_PORTFOLIO_SELECTION_SLOT_ID_INVALID');
      check(row?.selected_slot_root === null || hex64(row?.selected_slot_root), 'LARGE_WORLD_PORTFOLIO_SELECTION_SLOT_ROOT_INVALID');
      check(row?.selected_representation_root === null || hex64(row?.selected_representation_root), 'LARGE_WORLD_PORTFOLIO_SELECTION_REPRESENTATION_ROOT_INVALID');
      check(row?.selected_quality_profile === null || typeof row?.selected_quality_profile === 'string', 'LARGE_WORLD_PORTFOLIO_SELECTION_QUALITY_INVALID');
      check(typeof row?.fallback_used === 'boolean', 'LARGE_WORLD_PORTFOLIO_SELECTION_FALLBACK_INVALID');
      check(Array.isArray(row?.reason_codes), 'LARGE_WORLD_PORTFOLIO_SELECTION_REASON_CODES_INVALID');
      check(hex64(row?.selection_root), 'LARGE_WORLD_PORTFOLIO_SELECTION_ROW_ROOT_INVALID');
      check(row?.candidate_only === true && row?.authoritative === false && row?.canonical_write_authorized === false, 'LARGE_WORLD_PORTFOLIO_SELECTION_ROW_AUTHORITY_INVALID');
    }
    check(Number.isSafeInteger(selection.fallback_count) && selection.fallback_count >= 0, 'LARGE_WORLD_PORTFOLIO_SELECTION_FALLBACK_COUNT_INVALID');
    check(selection.fallback_count === (selection.selections ?? []).filter(row => row.fallback_used).length, 'LARGE_WORLD_PORTFOLIO_SELECTION_FALLBACK_COUNT_MISMATCH');
    check(selection.candidate_only === true && selection.authoritative === false && selection.canonical_write_authorized === false, 'LARGE_WORLD_PORTFOLIO_SELECTION_AUTHORITY_INVALID');
    check(selection.authority?.provider_can_write_authoritative_world_state === false, 'LARGE_WORLD_PORTFOLIO_SELECTION_PROVIDER_AUTHORITY_INVALID');
    check(selection.authority?.rncs_authority_required === true, 'LARGE_WORLD_PORTFOLIO_SELECTION_RNCS_AUTHORITY_REQUIRED');
    const copy = clone(selection);
    const selectionRoot = copy.selection_root;
    delete copy.selection_root;
    check(hex64(selectionRoot) && rootHash(copy) === selectionRoot, 'LARGE_WORLD_PORTFOLIO_SELECTION_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`LARGE_WORLD_PORTFOLIO_SELECTION_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, selection_root: selection.selection_root ?? null};
}

export function verifyMaterializationBatch(batch) {
  const errors = [];
  if (batch?.format !== LARGE_WORLD_MATERIALIZATION_FORMAT) errors.push('LARGE_WORLD_MATERIALIZATION_FORMAT_INVALID');
  if (!hex64(batch?.materialization_root)) errors.push('LARGE_WORLD_MATERIALIZATION_ROOT_INVALID');
  else {
    const copy = clone(batch);
    const root = copy.materialization_root;
    delete copy.materialization_root;
    if (rootHash(copy) !== root) errors.push('LARGE_WORLD_MATERIALIZATION_ROOT_MISMATCH');
  }
  if (batch?.canonical_state_mutated !== false) errors.push('LARGE_WORLD_MATERIALIZATION_CANONICAL_MUTATION');
  if (batch?.authority?.provider_can_write_authoritative_world_state !== false) errors.push('LARGE_WORLD_MATERIALIZATION_AUTHORITY_ESCALATION');
  for (const receipt of batch?.receipts ?? []) if (!receipt || typeof receipt.receipt_root !== 'string') errors.push('LARGE_WORLD_MATERIALIZATION_RECEIPT_REFERENCE_INVALID');
  return {valid: errors.length === 0, errors, materialization_root: batch?.materialization_root ?? null};
}

export function createLargeWorldRuntime(options = {}) { return new LargeWorldRuntime(options); }

export function replayLargeWorldTrace(options = {}, trace = []) { return new LargeWorldRuntime(options).replay(trace); }
