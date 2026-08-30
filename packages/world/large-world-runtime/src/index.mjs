import {createRepresentationRef, rootHash} from '@taowind/rncs-core-contract';
import {RealityRepresentationFabric} from '@taowind/reality-representation-fabric';

export const LARGE_WORLD_RUNTIME_FORMAT = 'rncs.large-world-runtime.v0.1';
export const LARGE_WORLD_RUNTIME_VERSION = '0.1.0';
export const LARGE_WORLD_REGION_FORMAT = 'rncs.large-world-region.v0.1';
export const LARGE_WORLD_CHUNK_FORMAT = 'rncs.large-world-chunk.v0.1';
export const LARGE_WORLD_STREAM_FORMAT = 'rncs.large-world-stream-resolution.v0.1';
export const LARGE_WORLD_MATERIALIZATION_FORMAT = 'rncs.large-world-materialization.v0.1';

export const LARGE_WORLD_BIOMES = Object.freeze(['coast', 'desert', 'forest', 'grassland', 'tundra', 'wetland']);
export const LARGE_WORLD_STRUCTURE_KINDS = Object.freeze(['ruin', 'grove', 'mine', 'shrine', 'watchtower']);
export const LARGE_WORLD_RESOURCE_KINDS = Object.freeze(['crystal', 'iron', 'salt', 'timber', 'water']);
export const LARGE_WORLD_PROCEDURAL_PROVIDER_ID = 'provider:taowind:large-world-procedural-mesh:v0.1';

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

function createChunkReference(chunk, providerRoot, available) {
  return createRepresentationRef({
    provider_id: LARGE_WORLD_PROCEDURAL_PROVIDER_ID,
    provider_root: providerRoot,
    representation_kind: 'mesh',
    representation_formats: ['model/vnd.taowind.large-world-grid+json'],
    content_root: chunk.content_root,
    representation_profile: {profile_id: 'large-world.grid-mesh.v0.1', encoding: 'procedural-grid', fidelity: 'terrain-structures', precision: 'integer-millimeter', formats: ['model/vnd.taowind.large-world-grid+json']},
    detail_policy: {mode: 'distance-lod', selectors: ['screen-space-size', 'chunk-distance'], budget: {levels: 3}},
    residency_policy: {mode: 'paged-streaming', selectors: ['active-working-set', 'unload-hysteresis'], budget: {chunk_bytes: chunk.memory_bytes}},
    authority_scope: ['representation_candidate', 'visual_projection'],
    availability: available ? 'AVAILABLE' : 'CONTRACT_ONLY',
    provenance: {generator_version: LARGE_WORLD_RUNTIME_VERSION, parameters_root: chunk.chunk_root},
    evidence: {provider_manifest_root: providerRoot}
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

export class LargeWorldRuntime {
  constructor(input = {}) {
    const value = record(input);
    this.options = normalizeRuntimeOptions(value);
    this.region = generateRegion(this.options);
    this.chunks = new Map(this.region.chunks.map(chunk => [chunk.chunk_id, chunk]));
    this.chunkByKey = new Map(this.region.chunks.map(chunk => [chunkKey(chunk.coordinates.x, chunk.coordinates.z), chunk]));
    this.activeChunkIds = [];
    this.observer = {x: 0, z: 0};
    this.trace = [];
    this.materializeChunk = typeof value.materializeChunk === 'function' ? value.materializeChunk : null;
    this.provider = providerManifest(Boolean(this.materializeChunk));
    this.chunksByObjectId = new Map(this.region.chunks.map(chunk => [chunk.object_id, chunk]));
    const providerInput = {manifest: this.provider};
    if (this.materializeChunk) providerInput.materialize = async adapterInput => this.materializeChunk({
      ...adapterInput,
      chunk: clone(this.chunksByObjectId.get(adapterInput.object.object_id) ?? null)
    });
    this.fabric = new RealityRepresentationFabric({providers: [providerInput]});
    this.objects = new Map();
    for (const chunk of this.region.chunks) {
      const reference = createChunkReference(chunk, this.provider.manifest_root, Boolean(this.materializeChunk));
      const object = this.fabric.registerRealityObject({
        object_id: chunk.object_id,
        branch: 'main',
        state_root: chunk.state_root,
        content_root: chunk.content_root,
        representations: [reference]
      });
      this.objects.set(chunk.chunk_id, object);
    }
  }

  getRegion() { return clone(this.region); }

  getChunk(chunkIdValue) { return clone(this.chunks.get(String(chunkIdValue)) ?? null); }

  getRepresentationObject(chunkIdValue) {
    const chunk = this.chunks.get(String(chunkIdValue));
    return chunk ? this.fabric.getRealityObject(chunk.object_id) : null;
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
        detail_mode: value.detailMode ?? value.detail_mode ?? 'distance-lod',
        residency_mode: value.residencyMode ?? value.residency_mode ?? 'paged-streaming',
        resource_budget: clone(value.resourceBudget ?? value.resource_budget ?? {})
      }, {context: {world_id: this.options.worldId, stream_root: streamRootValue, chunk: clone(chunk)}});
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
      receipts: receipts.map(receipt => ({receipt_id: receipt.receipt_id, chunk_id: this.chunks.get(receipt.object_id)?.chunk_id ?? null, status: receipt.status, output_root: receipt.output_root, receipt_root: receipt.receipt_root})),
      canonical_state_mutated: false,
      authority: {provider_can_write_authoritative_world_state: false, rncs_authority_required: true},
      candidate_only: true,
      authoritative: false,
      commit_status: 'NOT_COMMITTED'
    };
    return {...base, materialization_root: rootHash(base)};
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
    return {region: verifyRegion(this.region), snapshot: verifyRuntimeSnapshot(this.snapshot()), fabric_root: this.fabric.snapshot().fabric_root};
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

export function verifyStreamResolutionReceipt(resolution) {
  const errors = [];
  if (resolution?.format !== LARGE_WORLD_STREAM_FORMAT) errors.push('LARGE_WORLD_STREAM_FORMAT_INVALID');
  if (!verifyStreamResolution(resolution)) errors.push('LARGE_WORLD_STREAM_ROOT_INVALID');
  if (resolution?.canonical_state_mutated !== false) errors.push('LARGE_WORLD_STREAM_CANONICAL_MUTATION');
  if (resolution?.authority?.provider_can_write_authoritative_world_state !== false) errors.push('LARGE_WORLD_STREAM_AUTHORITY_ESCALATION');
  if (resolution?.active_chunk_ids?.length > resolution?.max_active_chunks) errors.push('LARGE_WORLD_STREAM_ACTIVE_BUDGET_EXCEEDED');
  return {valid: errors.length === 0, errors, stream_root: resolution?.stream_root ?? null};
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
