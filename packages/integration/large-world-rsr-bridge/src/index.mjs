import {EntityKernel, rootHash, verifyEntityStateBatch} from '@taowind/rncs-core-contract';
import {verifyChunk, verifyRegion, verifyStreamResolutionReceipt, verifyStreamTransitionReceipt} from '@taowind/large-world-runtime';
import {materializeKernelStateBatch, verifySpatialBodyResidencyTransition} from '@taowind/reality-simulation-runtime/spatial-embodiment';

export const LARGE_WORLD_RSR_TERRAIN_FORMAT = 'rncs.large-world-rsr-terrain-candidate.v0.1';
export const LARGE_WORLD_RSR_TERRAIN_VERSION = '0.1.0';
export const LARGE_WORLD_RSR_TERRAIN_RESIDENCY_TRANSITION_FORMAT = 'rncs.large-world-rsr-terrain-residency-transition.v0.1';
export const LARGE_WORLD_RSR_TERRAIN_RESIDENCY_TRANSITION_VERSION = '0.1.0';
export const LARGE_WORLD_RSR_TERRAIN_RESIDENCY_ADMISSION_FORMAT = 'rncs.large-world-rsr-terrain-residency-admission.v0.1';
export const LARGE_WORLD_RSR_TERRAIN_RESIDENCY_ADMISSION_VERSION = '0.1.0';
export const LARGE_WORLD_RSR_TERRAIN_OWNER = '@taowind/large-world-runtime';
export const LARGE_WORLD_RSR_PHYSICAL_OWNER = '@taowind/reality-simulation-runtime';
export const LARGE_WORLD_RSR_TERRAIN_MANAGED_TAG = 'large-world-terrain';

const HEX64 = /^[0-9a-f]{64}$/;
const clone = value => structuredClone(value);
const record = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const sorted = values => [...values].sort((a, b) => Buffer.compare(Buffer.from(String(a), 'utf8'), Buffer.from(String(b), 'utf8')));

export class LargeWorldRsrTerrainBridgeError extends Error {
  constructor(code, message, details = undefined) {
    super(`${code}: ${message}`);
    this.name = 'LargeWorldRsrTerrainBridgeError';
    this.code = code;
    this.details = details;
  }
}

function fail(code, message, details = undefined) {
  throw new LargeWorldRsrTerrainBridgeError(code, message, details);
}

function requireRecord(value, code, message) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(code, message);
  return value;
}

function requireText(value, code, message) {
  if (typeof value !== 'string' || value.length === 0) fail(code, message);
  return value;
}

function requireRoot(value, code, message) {
  if (typeof value !== 'string' || !HEX64.test(value)) fail(code, message, {value});
  return value;
}

function requireInteger(value, code, message, minimum = undefined) {
  if (!Number.isSafeInteger(value) || (minimum !== undefined && value < minimum)) fail(code, message, {value});
  return value;
}

function normalizeResidencyBudget(input) {
  const value = requireRecord(input, 'LARGE_WORLD_RSR_RESIDENCY_BUDGET_REQUIRED', 'A physical residency budget is required');
  const budget = {};
  for (const [camel, snake] of [['maxManagedBodies', 'max_managed_bodies'], ['maxManagedFixtures', 'max_managed_fixtures'], ['maxHeightfieldSamples', 'max_heightfield_samples']]) {
    const raw = value[camel] ?? value[snake];
    if (raw !== undefined) budget[snake] = requireInteger(raw, 'LARGE_WORLD_RSR_RESIDENCY_BUDGET_INVALID', `${snake} must be a non-negative safe integer`, 0);
  }
  if (Object.keys(budget).length === 0) fail('LARGE_WORLD_RSR_RESIDENCY_BUDGET_EMPTY', 'At least one physical residency budget limit is required');
  return budget;
}

function physicalResidencyUsage(candidate) {
  const rows = candidate.batch.rows;
  let fixtureCount = 0;
  let heightfieldSamples = 0;
  for (const row of rows) {
    const fixtures = row?.fragments?.['spatial.fixtures']?.items;
    if (!Array.isArray(fixtures)) fail('LARGE_WORLD_RSR_RESIDENCY_FIXTURES_INVALID', 'Candidate fixture rows are required for physical residency accounting');
    fixtureCount += fixtures.length;
    for (const fixture of fixtures) {
      const shape = fixture?.shape;
      if (shape?.type !== 'heightfield') continue;
      const samples = requireInteger(shape.columns, 'LARGE_WORLD_RSR_RESIDENCY_COLUMNS_INVALID', 'Heightfield columns must be a positive safe integer', 1) * requireInteger(shape.rows, 'LARGE_WORLD_RSR_RESIDENCY_ROWS_INVALID', 'Heightfield rows must be a positive safe integer', 1);
      if (!Number.isSafeInteger(samples)) fail('LARGE_WORLD_RSR_RESIDENCY_SAMPLE_COUNT_INVALID', 'Heightfield sample count must be a safe integer');
      heightfieldSamples += samples;
    }
  }
  return {managed_body_count: rows.length, managed_fixture_count: fixtureCount, heightfield_sample_count: heightfieldSamples};
}

function orderedIds(values) {
  return sorted([...new Set(values.map(String))]);
}

function assertStreamResolution(stream, region) {
  const verification = verifyStreamResolutionReceipt(stream);
  if (!verification.valid) fail('LARGE_WORLD_RSR_STREAM_INVALID', verification.errors.join(','));
  const transitionVerification = verifyStreamTransitionReceipt(stream?.stream_transition);
  if (!transitionVerification.valid) fail('LARGE_WORLD_RSR_STREAM_TRANSITION_INVALID', transitionVerification.errors.join(','));
  if (stream.world_id !== region.world_id) fail('LARGE_WORLD_RSR_STREAM_WORLD_MISMATCH', 'Stream and region world ids differ');
  if (stream.generation !== region.generation) fail('LARGE_WORLD_RSR_STREAM_GENERATION_MISMATCH', 'Stream and region generations differ');
  if (stream.region_root !== region.region_root) fail('LARGE_WORLD_RSR_STREAM_REGION_ROOT_MISMATCH', 'Stream and region roots differ');
  if (stream.world_root !== region.world_root) fail('LARGE_WORLD_RSR_STREAM_WORLD_ROOT_MISMATCH', 'Stream and region world roots differ');
  return clone(stream);
}

function canonicalChunkIds(region) {
  return new Map((region.chunks ?? []).map(chunk => [chunk.chunk_id, chunk]));
}

function lowerChunk(chunk) {
  const verification = verifyChunk(chunk);
  if (!verification.valid) fail('LARGE_WORLD_RSR_CHUNK_INVALID', verification.errors.join(','), {chunkId: chunk?.chunk_id});
  const resolution = requireInteger(chunk.sample_resolution, 'LARGE_WORLD_RSR_SAMPLE_RESOLUTION_INVALID', 'Chunk sample resolution must be a positive integer', 1);
  const columns = resolution + 1;
  const rows = resolution + 1;
  const mesh = requireRecord(chunk.mesh, 'LARGE_WORLD_RSR_MESH_REQUIRED', 'Chunk mesh is required');
  const positions = mesh.positions;
  if (!Array.isArray(positions) || positions.length !== columns * rows * 3) {
    fail('LARGE_WORLD_RSR_MESH_GRID_INVALID', 'Chunk mesh positions do not match its sample resolution', {chunkId: chunk.chunk_id});
  }
  const origin = requireRecord(chunk.origin_mm, 'LARGE_WORLD_RSR_ORIGIN_REQUIRED', 'Chunk origin_mm is required');
  const extent = requireRecord(chunk.extent_mm, 'LARGE_WORLD_RSR_EXTENT_REQUIRED', 'Chunk extent_mm is required');
  const extentX = requireInteger(extent.x, 'LARGE_WORLD_RSR_EXTENT_INVALID', 'Chunk extent_mm.x must be a safe integer', 1);
  const extentZ = requireInteger(extent.z, 'LARGE_WORLD_RSR_EXTENT_INVALID', 'Chunk extent_mm.z must be a safe integer', 1);
  if (extentX !== extentZ || extentX % resolution !== 0 || extentZ % resolution !== 0) {
    fail('LARGE_WORLD_RSR_SAMPLE_SPACING_INVALID', 'Chunk extent must be a square divisible by sample resolution', {chunkId: chunk.chunk_id, extentX, extentZ, resolution});
  }
  const sampleSpacing = extentX / resolution;
  const heights = [];
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const offset = (row * columns + column) * 3;
      if (positions[offset] !== column || positions[offset + 2] !== row) {
        fail('LARGE_WORLD_RSR_MESH_COORDINATE_INVALID', 'Chunk mesh grid coordinates are not canonical', {chunkId: chunk.chunk_id, row, column});
      }
      heights.push(requireInteger(positions[offset + 1], 'LARGE_WORLD_RSR_HEIGHT_INVALID', 'Chunk terrain height must be an integer millimeter',  -Number.MAX_SAFE_INTEGER));
    }
  }
  const originMm = {
    x: requireInteger(origin.x, 'LARGE_WORLD_RSR_ORIGIN_INVALID', 'Chunk origin_mm.x must be a safe integer'),
    y: requireInteger(origin.y ?? 0, 'LARGE_WORLD_RSR_ORIGIN_INVALID', 'Chunk origin_mm.y must be a safe integer'),
    z: requireInteger(origin.z, 'LARGE_WORLD_RSR_ORIGIN_INVALID', 'Chunk origin_mm.z must be a safe integer')
  };
  const entityId = `terrain:${chunk.chunk_id}`;
  const fixtureId = `${entityId}:heightfield`;
  const shape = {type: 'heightfield', columns, rows, sample_spacing: sampleSpacing, heights};
  return {
    chunk_id: chunk.chunk_id,
    entity_id: entityId,
    fixture_id: fixtureId,
    coordinates: clone(chunk.coordinates),
    origin_mm: originMm,
    extent_mm: {x: extentX, z: extentZ},
    sample_resolution: resolution,
    columns,
    rows,
    sample_spacing: sampleSpacing,
    source_chunk_root: chunk.chunk_root,
    source_state_root: chunk.state_root,
    source_content_root: chunk.content_root,
    source_mesh_root: chunk.mesh.mesh_root,
    height_samples_root: rootHash(heights),
    shape,
    managed_tag: LARGE_WORLD_RSR_TERRAIN_MANAGED_TAG,
    tags: ['candidate', 'large-world', 'terrain', 'heightfield', LARGE_WORLD_RSR_TERRAIN_MANAGED_TAG]
  };
}

function createKernel(region, bindings, tick) {
  const kernel = new EntityKernel({world_id: region.world_id, generation: region.generation, generation_root: region.world_root, tick});
  kernel.registerFragment({
    fragment_id: 'spatial.body',
    fields: {
      kind: {type: 'string'},
      position: {type: 'json'},
      rotation: {type: 'json', default: {x: 0, y: 0, z: 0}},
      tags: {type: 'json', default: []},
      enabled: {type: 'boolean', default: true}
    }
  });
  kernel.registerFragment({
    fragment_id: 'spatial.fixtures',
    fields: {items: {type: 'json'}}
  });
  for (const binding of bindings) {
    kernel.registerEntity({
      entity_id: binding.entity_id,
      tags: binding.tags,
      fragments: {
        'spatial.body': {
          kind: 'static',
          position: binding.origin_mm,
          rotation: {x: 0, y: 0, z: 0},
          tags: binding.tags,
          enabled: true
        },
        'spatial.fixtures': {
          items: [{
            fixture_id: binding.fixture_id,
            shape: binding.shape,
            local_position: {x: 0, y: 0, z: 0},
            tags: binding.tags
          }]
        }
      }
    });
  }
  return kernel.readStateBatch();
}

function selectChunks(region, stream, input) {
  const byId = canonicalChunkIds(region);
  const active = new Set(stream.active_chunk_ids);
  const requested = Array.isArray(input.chunks)
    ? input.chunks
    : Array.isArray(input.chunkIds ?? input.chunk_ids)
      ? (input.chunkIds ?? input.chunk_ids).map(id => byId.get(String(id)))
      : stream.active_chunk_ids.map(id => byId.get(id));
  if (requested.length === 0) fail('LARGE_WORLD_RSR_ACTIVE_CHUNKS_REQUIRED', 'At least one active chunk is required');
  const chunks = requested.map(chunk => {
    if (!chunk || typeof chunk !== 'object') fail('LARGE_WORLD_RSR_CHUNK_NOT_FOUND', 'Requested chunk is not present in the verified region');
    if (!active.has(chunk.chunk_id)) fail('LARGE_WORLD_RSR_CHUNK_NOT_ACTIVE', `Chunk ${chunk.chunk_id} is not in the verified active working set`);
    const source = byId.get(chunk.chunk_id);
    if (!source || source.chunk_root !== chunk.chunk_root) fail('LARGE_WORLD_RSR_CHUNK_REGION_ROOT_MISMATCH', `Chunk ${chunk.chunk_id} is not the region-owned chunk`);
    return source;
  });
  const unique = new Map(chunks.map(chunk => [chunk.chunk_id, chunk]));
  return [...unique.values()].sort((a, b) => Buffer.compare(Buffer.from(a.chunk_id, 'utf8'), Buffer.from(b.chunk_id, 'utf8')));
}

export function createLargeWorldRsrTerrainCandidate(input = {}) {
  const value = record(input);
  const region = clone(value.region);
  const regionVerification = verifyRegion(region);
  if (!regionVerification.valid) fail('LARGE_WORLD_RSR_REGION_INVALID', regionVerification.errors.join(','));
  const stream = assertStreamResolution(value.streamResolution ?? value.stream_resolution, region);
  const chunks = selectChunks(region, stream, value);
  const bindings = chunks.map(lowerChunk);
  const tick = requireInteger(value.tick ?? 0, 'LARGE_WORLD_RSR_TICK_INVALID', 'Candidate tick must be a non-negative safe integer', 0);
  const batch = createKernel(region, bindings, tick);
  const base = {
    format: LARGE_WORLD_RSR_TERRAIN_FORMAT,
    version: LARGE_WORLD_RSR_TERRAIN_VERSION,
    world_id: region.world_id,
    generation: region.generation,
    source: {
      terrain_owner: LARGE_WORLD_RSR_TERRAIN_OWNER,
      physical_owner: LARGE_WORLD_RSR_PHYSICAL_OWNER,
      region_root: region.region_root,
      world_root: region.world_root,
      stream_root: stream.stream_root,
      stream_transition_root: stream.stream_transition.transition_root,
      lowering: 'chunk.mesh.positions→spatial.fixtures.items.heightfield'
    },
    managed_tag: LARGE_WORLD_RSR_TERRAIN_MANAGED_TAG,
    active_chunk_ids: orderedIds(stream.active_chunk_ids),
    lowered_chunk_ids: bindings.map(binding => binding.chunk_id),
    chunk_bindings: bindings.map(binding => {
      const result = clone(binding);
      delete result.shape;
      delete result.tags;
      return result;
    }),
    stream_resolution: stream,
    batch,
    authority: {
      provider_can_write_authoritative_world_state: false,
      rncs_authority_required: true,
      adapter_authority: 'candidate-artifact-generation-only-no-commit'
    },
    candidate_only: true,
    authoritative: false,
    canonical_write_authorized: false,
    commit_status: 'NOT_COMMITTED'
  };
  return {...base, candidate_root: rootHash(base)};
}

function verifyBindingAgainstRow(binding, row, errors) {
  const body = row?.fragments?.['spatial.body'];
  const collection = row?.fragments?.['spatial.fixtures']?.items;
  const shape = collection?.[0]?.shape;
  const push = (condition, code) => { if (!condition) errors.push(`${code}:${binding.chunk_id}`); };
  push(row?.entity_id === binding.entity_id, 'LARGE_WORLD_RSR_ENTITY_ID_MISMATCH');
  push(body?.kind === 'static', 'LARGE_WORLD_RSR_TERRAIN_BODY_KIND_INVALID');
  push(Array.isArray(body?.tags) && body.tags.includes(binding.managed_tag), 'LARGE_WORLD_RSR_TERRAIN_MANAGED_TAG_MISSING');
  push(JSON.stringify(body?.position) === JSON.stringify(binding.origin_mm), 'LARGE_WORLD_RSR_TERRAIN_ORIGIN_MISMATCH');
  push(Array.isArray(collection) && collection.length === 1, 'LARGE_WORLD_RSR_FIXTURE_COUNT_INVALID');
  push(collection?.[0]?.fixture_id === binding.fixture_id, 'LARGE_WORLD_RSR_FIXTURE_ID_MISMATCH');
  push(shape?.type === 'heightfield', 'LARGE_WORLD_RSR_SHAPE_TYPE_INVALID');
  push(shape?.columns === binding.columns && shape?.rows === binding.rows, 'LARGE_WORLD_RSR_SHAPE_DIMENSIONS_MISMATCH');
  push(shape?.sample_spacing === binding.sample_spacing, 'LARGE_WORLD_RSR_SAMPLE_SPACING_MISMATCH');
  push(Array.isArray(shape?.heights) && rootHash(shape.heights) === binding.height_samples_root, 'LARGE_WORLD_RSR_HEIGHT_ROOT_MISMATCH');
}

export function verifyLargeWorldRsrTerrainCandidate(candidate, options = {}) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  try {
    check(candidate?.format === LARGE_WORLD_RSR_TERRAIN_FORMAT, 'LARGE_WORLD_RSR_FORMAT_INVALID');
    check(candidate?.version === LARGE_WORLD_RSR_TERRAIN_VERSION, 'LARGE_WORLD_RSR_VERSION_INVALID');
    check(typeof candidate?.world_id === 'string' && candidate.world_id.length > 0, 'LARGE_WORLD_RSR_WORLD_ID_INVALID');
    check(Number.isSafeInteger(candidate?.generation) && candidate.generation >= 0, 'LARGE_WORLD_RSR_GENERATION_INVALID');
    check(candidate?.candidate_only === true && candidate?.authoritative === false && candidate?.canonical_write_authorized === false, 'LARGE_WORLD_RSR_AUTHORITY_ESCALATION');
    check(candidate?.commit_status === 'NOT_COMMITTED', 'LARGE_WORLD_RSR_COMMIT_STATUS_INVALID');
    check(candidate?.authority?.provider_can_write_authoritative_world_state === false, 'LARGE_WORLD_RSR_PROVIDER_AUTHORITY_ESCALATION');
    check(candidate?.authority?.rncs_authority_required === true, 'LARGE_WORLD_RSR_RNCS_AUTHORITY_MISSING');
    check(candidate?.source?.terrain_owner === LARGE_WORLD_RSR_TERRAIN_OWNER, 'LARGE_WORLD_RSR_TERRAIN_OWNER_INVALID');
    check(candidate?.source?.physical_owner === LARGE_WORLD_RSR_PHYSICAL_OWNER, 'LARGE_WORLD_RSR_PHYSICAL_OWNER_INVALID');
    check(candidate?.managed_tag === LARGE_WORLD_RSR_TERRAIN_MANAGED_TAG, 'LARGE_WORLD_RSR_MANAGED_TAG_INVALID');
    for (const field of ['region_root', 'world_root', 'stream_root', 'stream_transition_root']) check(HEX64.test(candidate?.source?.[field] ?? ''), `LARGE_WORLD_RSR_SOURCE_${field.toUpperCase()}_INVALID`);
    check(Array.isArray(candidate?.active_chunk_ids), 'LARGE_WORLD_RSR_ACTIVE_IDS_INVALID');
    check(Array.isArray(candidate?.lowered_chunk_ids), 'LARGE_WORLD_RSR_LOWERED_IDS_INVALID');
    check(Array.isArray(candidate?.chunk_bindings), 'LARGE_WORLD_RSR_BINDINGS_INVALID');
    check(candidate?.lowered_chunk_ids?.length === candidate?.chunk_bindings?.length, 'LARGE_WORLD_RSR_BINDING_COUNT_MISMATCH');
    const streamVerification = verifyStreamResolutionReceipt(candidate?.stream_resolution);
    check(streamVerification.valid, 'LARGE_WORLD_RSR_STREAM_INVALID');
    const streamTransitionVerification = verifyStreamTransitionReceipt(candidate?.stream_resolution?.stream_transition);
    check(streamTransitionVerification.valid, 'LARGE_WORLD_RSR_STREAM_TRANSITION_INVALID');
    check(candidate?.stream_resolution?.stream_root === candidate?.source?.stream_root, 'LARGE_WORLD_RSR_STREAM_ROOT_MISMATCH');
    check(candidate?.stream_resolution?.stream_transition?.transition_root === candidate?.source?.stream_transition_root, 'LARGE_WORLD_RSR_STREAM_TRANSITION_ROOT_MISMATCH');
    check(JSON.stringify(orderedIds(candidate?.active_chunk_ids ?? [])) === JSON.stringify(orderedIds(candidate?.stream_resolution?.active_chunk_ids ?? [])), 'LARGE_WORLD_RSR_ACTIVE_STREAM_IDS_MISMATCH');
    check(verifyEntityStateBatch(candidate?.batch), 'LARGE_WORLD_RSR_BATCH_ROOT_INVALID');
    check(candidate?.batch?.world_id === candidate?.world_id && candidate?.batch?.generation === candidate?.generation, 'LARGE_WORLD_RSR_BATCH_SOURCE_MISMATCH');
    check(candidate?.batch?.generation_root === candidate?.source?.world_root, 'LARGE_WORLD_RSR_BATCH_GENERATION_ROOT_MISMATCH');
    const rows = new Map((candidate?.batch?.rows ?? []).map(row => [row.entity_id, row]));
    for (const binding of candidate?.chunk_bindings ?? []) {
      check(binding.managed_tag === LARGE_WORLD_RSR_TERRAIN_MANAGED_TAG, 'LARGE_WORLD_RSR_BINDING_MANAGED_TAG_INVALID');
      verifyBindingAgainstRow(binding, rows.get(binding.entity_id), errors);
    }
    check(rows.size === (candidate?.chunk_bindings?.length ?? -1), 'LARGE_WORLD_RSR_BATCH_ROW_COUNT_MISMATCH');
    if (options.region !== undefined) {
      const region = clone(options.region);
      const regionVerification = verifyRegion(region);
      check(regionVerification.valid, 'LARGE_WORLD_RSR_SOURCE_REGION_INVALID');
      check(region.world_id === candidate.world_id && region.generation === candidate.generation, 'LARGE_WORLD_RSR_SOURCE_REGION_IDENTITY_MISMATCH');
      check(region.region_root === candidate.source.region_root && region.world_root === candidate.source.world_root, 'LARGE_WORLD_RSR_SOURCE_REGION_ROOT_MISMATCH');
      const byId = canonicalChunkIds(region);
      for (const binding of candidate.chunk_bindings ?? []) {
        const chunk = byId.get(binding.chunk_id);
        check(Boolean(chunk), 'LARGE_WORLD_RSR_SOURCE_CHUNK_MISSING');
        if (chunk) {
          check(chunk.chunk_root === binding.source_chunk_root, 'LARGE_WORLD_RSR_SOURCE_CHUNK_ROOT_MISMATCH');
          try {
            const expected = lowerChunk(chunk);
            check(expected.source_mesh_root === binding.source_mesh_root && expected.height_samples_root === binding.height_samples_root, 'LARGE_WORLD_RSR_SOURCE_SAMPLE_ROOT_MISMATCH');
          } catch (error) {
            errors.push(error.code ?? `LARGE_WORLD_RSR_SOURCE_CHUNK_EXCEPTION:${error.message}`);
          }
        }
      }
    }
    const copy = clone(candidate);
    const root = copy.candidate_root;
    delete copy.candidate_root;
    check(HEX64.test(root ?? '') && rootHash(copy) === root, 'LARGE_WORLD_RSR_CANDIDATE_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`LARGE_WORLD_RSR_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, candidate_root: candidate?.candidate_root ?? null};
}

export function planLargeWorldRsrTerrainResidency(candidate, options = {}) {
  const verification = verifyLargeWorldRsrTerrainCandidate(candidate, options.region === undefined ? {} : {region: options.region});
  if (!verification.valid) fail('LARGE_WORLD_RSR_CANDIDATE_INVALID', verification.errors.join(','));
  const budget = normalizeResidencyBudget(options.residencyBudget ?? options.residency_budget);
  const usage = physicalResidencyUsage(candidate);
  const exceeded = [];
  if (budget.max_managed_bodies !== undefined && usage.managed_body_count > budget.max_managed_bodies) exceeded.push('max_managed_bodies');
  if (budget.max_managed_fixtures !== undefined && usage.managed_fixture_count > budget.max_managed_fixtures) exceeded.push('max_managed_fixtures');
  if (budget.max_heightfield_samples !== undefined && usage.heightfield_sample_count > budget.max_heightfield_samples) exceeded.push('max_heightfield_samples');
  const base = {
    format: LARGE_WORLD_RSR_TERRAIN_RESIDENCY_ADMISSION_FORMAT,
    version: LARGE_WORLD_RSR_TERRAIN_RESIDENCY_ADMISSION_VERSION,
    world_id: candidate.world_id,
    generation: candidate.generation,
    source_candidate_root: candidate.candidate_root,
    source_region_root: candidate.source.region_root,
    source_world_root: candidate.source.world_root,
    source_stream_root: candidate.source.stream_root,
    source_stream_transition_root: candidate.source.stream_transition_root,
    managed_tag: candidate.managed_tag,
    budget,
    budget_root: rootHash(budget),
    usage,
    source_active_chunk_ids: orderedIds(candidate.active_chunk_ids),
    source_evicted_chunk_ids: orderedIds(candidate.stream_resolution.evicted_chunk_ids ?? []),
    source_released_chunk_ids: orderedIds(candidate.stream_resolution.stream_transition?.released_chunk_ids ?? []),
    status: exceeded.length === 0 ? 'READY' : 'BLOCKED_RESOURCE',
    exceeded_limits: exceeded,
    authority: {
      provider_can_write_authoritative_world_state: false,
      rncs_authority_required: true,
      adapter_authority: 'candidate-physical-residency-admission-only-no-commit'
    },
    candidate_only: true,
    authoritative: false,
    canonical_write_authorized: false,
    commit_status: 'NOT_COMMITTED'
  };
  return {...base, admission_root: rootHash(base)};
}

export function verifyLargeWorldRsrTerrainResidencyAdmission(admission, options = {}) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  try {
    check(admission?.format === LARGE_WORLD_RSR_TERRAIN_RESIDENCY_ADMISSION_FORMAT, 'LARGE_WORLD_RSR_ADMISSION_FORMAT_INVALID');
    check(admission?.version === LARGE_WORLD_RSR_TERRAIN_RESIDENCY_ADMISSION_VERSION, 'LARGE_WORLD_RSR_ADMISSION_VERSION_INVALID');
    check(typeof admission?.world_id === 'string' && admission.world_id.length > 0, 'LARGE_WORLD_RSR_ADMISSION_WORLD_ID_INVALID');
    check(Number.isSafeInteger(admission?.generation) && admission.generation >= 0, 'LARGE_WORLD_RSR_ADMISSION_GENERATION_INVALID');
    for (const field of ['source_candidate_root', 'source_region_root', 'source_world_root', 'source_stream_root', 'source_stream_transition_root', 'budget_root']) check(HEX64.test(admission?.[field] ?? ''), `LARGE_WORLD_RSR_ADMISSION_${field.toUpperCase()}_INVALID`);
    check(admission?.managed_tag === LARGE_WORLD_RSR_TERRAIN_MANAGED_TAG, 'LARGE_WORLD_RSR_ADMISSION_MANAGED_TAG_INVALID');
    check(admission?.budget && typeof admission.budget === 'object' && !Array.isArray(admission.budget), 'LARGE_WORLD_RSR_ADMISSION_BUDGET_INVALID');
    const budget = admission?.budget ?? {};
    for (const field of ['max_managed_bodies', 'max_managed_fixtures', 'max_heightfield_samples']) if (budget[field] !== undefined) check(Number.isSafeInteger(budget[field]) && budget[field] >= 0, `LARGE_WORLD_RSR_ADMISSION_${field.toUpperCase()}_INVALID`);
    check(rootHash(budget) === admission?.budget_root, 'LARGE_WORLD_RSR_ADMISSION_BUDGET_ROOT_INVALID');
    const usage = admission?.usage ?? {};
    for (const field of ['managed_body_count', 'managed_fixture_count', 'heightfield_sample_count']) check(Number.isSafeInteger(usage[field]) && usage[field] >= 0, `LARGE_WORLD_RSR_ADMISSION_${field.toUpperCase()}_INVALID`);
    check(Array.isArray(admission?.source_active_chunk_ids), 'LARGE_WORLD_RSR_ADMISSION_ACTIVE_IDS_INVALID');
    check(Array.isArray(admission?.source_evicted_chunk_ids), 'LARGE_WORLD_RSR_ADMISSION_EVICTED_IDS_INVALID');
    check(Array.isArray(admission?.source_released_chunk_ids), 'LARGE_WORLD_RSR_ADMISSION_RELEASED_IDS_INVALID');
    check(admission?.status === 'READY' || admission?.status === 'BLOCKED_RESOURCE', 'LARGE_WORLD_RSR_ADMISSION_STATUS_INVALID');
    const expectedExceeded = [];
    if (budget.max_managed_bodies !== undefined && usage.managed_body_count > budget.max_managed_bodies) expectedExceeded.push('max_managed_bodies');
    if (budget.max_managed_fixtures !== undefined && usage.managed_fixture_count > budget.max_managed_fixtures) expectedExceeded.push('max_managed_fixtures');
    if (budget.max_heightfield_samples !== undefined && usage.heightfield_sample_count > budget.max_heightfield_samples) expectedExceeded.push('max_heightfield_samples');
    check(JSON.stringify(admission.exceeded_limits ?? []) === JSON.stringify(expectedExceeded), 'LARGE_WORLD_RSR_ADMISSION_EXCEEDED_LIMITS_MISMATCH');
    check(admission.status === (expectedExceeded.length === 0 ? 'READY' : 'BLOCKED_RESOURCE'), 'LARGE_WORLD_RSR_ADMISSION_STATUS_MISMATCH');
    check(admission.authority?.provider_can_write_authoritative_world_state === false, 'LARGE_WORLD_RSR_ADMISSION_PROVIDER_AUTHORITY_ESCALATION');
    check(admission.authority?.rncs_authority_required === true, 'LARGE_WORLD_RSR_ADMISSION_RNCS_AUTHORITY_MISSING');
    check(admission.authority?.adapter_authority === 'candidate-physical-residency-admission-only-no-commit', 'LARGE_WORLD_RSR_ADMISSION_AUTHORITY_INVALID');
    check(admission.candidate_only === true && admission.authoritative === false && admission.canonical_write_authorized === false, 'LARGE_WORLD_RSR_ADMISSION_AUTHORITY_ESCALATION');
    check(admission.commit_status === 'NOT_COMMITTED', 'LARGE_WORLD_RSR_ADMISSION_COMMIT_STATUS_INVALID');
    if (options.candidate !== undefined) {
      const candidateVerification = verifyLargeWorldRsrTerrainCandidate(options.candidate, options.region === undefined ? {} : {region: options.region});
      check(candidateVerification.valid, 'LARGE_WORLD_RSR_ADMISSION_CANDIDATE_INVALID');
      check(options.candidate?.candidate_root === admission.source_candidate_root, 'LARGE_WORLD_RSR_ADMISSION_CANDIDATE_ROOT_MISMATCH');
      check(options.candidate?.source?.stream_transition_root === admission.source_stream_transition_root, 'LARGE_WORLD_RSR_ADMISSION_STREAM_TRANSITION_ROOT_MISMATCH');
      check(JSON.stringify(admission.source_evicted_chunk_ids ?? []) === JSON.stringify(orderedIds(options.candidate?.stream_resolution?.evicted_chunk_ids ?? [])), 'LARGE_WORLD_RSR_ADMISSION_EVICTED_IDS_MISMATCH');
      check(JSON.stringify(admission.source_released_chunk_ids ?? []) === JSON.stringify(orderedIds(options.candidate?.stream_resolution?.stream_transition?.released_chunk_ids ?? [])), 'LARGE_WORLD_RSR_ADMISSION_RELEASED_IDS_MISMATCH');
    }
    const copy = clone(admission);
    const root = copy.admission_root;
    delete copy.admission_root;
    check(HEX64.test(root ?? '') && rootHash(copy) === root, 'LARGE_WORLD_RSR_ADMISSION_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`LARGE_WORLD_RSR_ADMISSION_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, admission_root: admission?.admission_root ?? null};
}

export function applyLargeWorldRsrTerrainCandidate(world, candidate, options = {}) {
  const verification = verifyLargeWorldRsrTerrainCandidate(candidate, options.region === undefined ? {} : {region: options.region});
  if (!verification.valid) fail('LARGE_WORLD_RSR_CANDIDATE_INVALID', verification.errors.join(','));
  if (!world || typeof world.replaceManagedStaticBodies !== 'function') fail('LARGE_WORLD_RSR_WORLD_UNSUPPORTED', 'RSR world does not expose managed static body residency');
  if (world.config?.worldId !== candidate.world_id) fail('LARGE_WORLD_RSR_WORLD_MISMATCH', 'Candidate and RSR world ids differ');
  if (world.tick !== candidate.batch.tick) fail('LARGE_WORLD_RSR_TICK_MISMATCH', 'Candidate batch tick must match the current RSR tick', {candidateTick: candidate.batch.tick, worldTick: world.tick});
  const hasResidencyBudget = options.residencyBudget !== undefined || options.residency_budget !== undefined;
  const admission = hasResidencyBudget ? planLargeWorldRsrTerrainResidency(candidate, {region: options.region, residencyBudget: options.residencyBudget ?? options.residency_budget}) : undefined;
  if (admission && admission.status !== 'READY') fail('LARGE_WORLD_RSR_PHYSICAL_RESIDENCY_BUDGET_EXCEEDED', admission.exceeded_limits.join(','), {admissionRoot: admission.admission_root, usage: admission.usage, budget: admission.budget});
  const materialization = materializeKernelStateBatch(candidate.batch);
  const managedTag = candidate.managed_tag ?? LARGE_WORLD_RSR_TERRAIN_MANAGED_TAG;
  if (managedTag !== LARGE_WORLD_RSR_TERRAIN_MANAGED_TAG) fail('LARGE_WORLD_RSR_MANAGED_TAG_INVALID', 'Candidate managed tag is not owned by this adapter');
  const transition = world.replaceManagedStaticBodies(materialization.config.bodies, {
    managedTag,
    reality: {generation: candidate.generation, realityRoot: candidate.source.world_root, evidenceRoot: candidate.source.stream_root}
  });
  if (!verifySpatialBodyResidencyTransition(transition)) fail('LARGE_WORLD_RSR_PHYSICAL_TRANSITION_INVALID', 'RSR rejected its own residency transition root');
  const base = {
    format: LARGE_WORLD_RSR_TERRAIN_RESIDENCY_TRANSITION_FORMAT,
    version: LARGE_WORLD_RSR_TERRAIN_RESIDENCY_TRANSITION_VERSION,
    world_id: candidate.world_id,
    generation: candidate.generation,
    tick: transition.tick,
    source_candidate_root: candidate.candidate_root,
    source_region_root: candidate.source.region_root,
    source_world_root: candidate.source.world_root,
    source_stream_root: candidate.source.stream_root,
    source_stream_transition_root: candidate.source.stream_transition_root,
    source_released_chunk_ids: orderedIds(candidate.stream_resolution.stream_transition?.released_chunk_ids ?? []),
    managed_tag: managedTag,
    entered_body_ids: [...transition.enteredBodyIds],
    exited_body_ids: [...transition.exitedBodyIds],
    retained_body_ids: [...transition.retainedBodyIds],
    previous_state_root: transition.previousStateRoot,
    next_state_root: transition.nextStateRoot,
    previous_body_root: transition.previousBodyRoot,
    next_body_root: transition.nextBodyRoot,
    physical_transition: clone(transition),
    ...(admission === undefined ? {} : {residency_admission: clone(admission)}),
    authority: {
      provider_can_write_authoritative_world_state: false,
      rncs_authority_required: true,
      adapter_authority: 'candidate-physical-residency-transition-only-no-commit'
    },
    candidate_only: true,
    authoritative: false,
    canonical_write_authorized: false,
    commit_status: 'NOT_COMMITTED'
  };
  return {...base, transition_root: rootHash(base)};
}

export function verifyLargeWorldRsrTerrainResidencyTransition(transition, options = {}) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  try {
    check(transition?.format === LARGE_WORLD_RSR_TERRAIN_RESIDENCY_TRANSITION_FORMAT, 'LARGE_WORLD_RSR_RESIDENCY_FORMAT_INVALID');
    check(transition?.version === LARGE_WORLD_RSR_TERRAIN_RESIDENCY_TRANSITION_VERSION, 'LARGE_WORLD_RSR_RESIDENCY_VERSION_INVALID');
    check(typeof transition?.world_id === 'string' && transition.world_id.length > 0, 'LARGE_WORLD_RSR_RESIDENCY_WORLD_ID_INVALID');
    check(Number.isSafeInteger(transition?.generation) && transition.generation >= 0, 'LARGE_WORLD_RSR_RESIDENCY_GENERATION_INVALID');
    check(Number.isSafeInteger(transition?.tick) && transition.tick >= 0, 'LARGE_WORLD_RSR_RESIDENCY_TICK_INVALID');
    check(transition?.managed_tag === LARGE_WORLD_RSR_TERRAIN_MANAGED_TAG, 'LARGE_WORLD_RSR_RESIDENCY_MANAGED_TAG_INVALID');
    for (const field of ['source_candidate_root', 'source_region_root', 'source_world_root', 'source_stream_root', 'source_stream_transition_root']) check(HEX64.test(transition?.[field] ?? ''), `LARGE_WORLD_RSR_RESIDENCY_${field.toUpperCase()}_INVALID`);
    check(Array.isArray(transition?.source_released_chunk_ids), 'LARGE_WORLD_RSR_RESIDENCY_RELEASED_IDS_INVALID');
    check(transition?.authority?.provider_can_write_authoritative_world_state === false, 'LARGE_WORLD_RSR_RESIDENCY_PROVIDER_AUTHORITY_ESCALATION');
    check(transition?.authority?.rncs_authority_required === true, 'LARGE_WORLD_RSR_RESIDENCY_RNCS_AUTHORITY_MISSING');
    check(transition?.candidate_only === true && transition?.authoritative === false && transition?.canonical_write_authorized === false, 'LARGE_WORLD_RSR_RESIDENCY_AUTHORITY_ESCALATION');
    check(transition?.commit_status === 'NOT_COMMITTED', 'LARGE_WORLD_RSR_RESIDENCY_COMMIT_STATUS_INVALID');
    check(verifySpatialBodyResidencyTransition(transition?.physical_transition), 'LARGE_WORLD_RSR_RESIDENCY_PHYSICAL_TRANSITION_INVALID');
    check(transition?.physical_transition?.worldId === transition?.world_id && transition?.physical_transition?.tick === transition?.tick, 'LARGE_WORLD_RSR_RESIDENCY_PHYSICAL_IDENTITY_MISMATCH');
    check(transition?.physical_transition?.managedTag === transition?.managed_tag, 'LARGE_WORLD_RSR_RESIDENCY_PHYSICAL_MANAGED_TAG_MISMATCH');
    if (transition?.residency_admission !== undefined) {
      const admissionVerification = verifyLargeWorldRsrTerrainResidencyAdmission(transition.residency_admission, options.candidate === undefined ? {} : {candidate: options.candidate, region: options.region});
      check(admissionVerification.valid, 'LARGE_WORLD_RSR_RESIDENCY_ADMISSION_INVALID');
      check(transition.residency_admission.status === 'READY', 'LARGE_WORLD_RSR_RESIDENCY_ADMISSION_NOT_READY');
      check(transition.residency_admission.world_id === transition.world_id && transition.residency_admission.generation === transition.generation, 'LARGE_WORLD_RSR_RESIDENCY_ADMISSION_IDENTITY_MISMATCH');
    }
    for (const [outer, inner] of [['entered_body_ids', 'enteredBodyIds'], ['exited_body_ids', 'exitedBodyIds'], ['retained_body_ids', 'retainedBodyIds']]) check(JSON.stringify(transition?.[outer] ?? []) === JSON.stringify(transition?.physical_transition?.[inner] ?? []), `LARGE_WORLD_RSR_RESIDENCY_${outer.toUpperCase()}_MISMATCH`);
    for (const [outer, inner] of [['previous_state_root', 'previousStateRoot'], ['next_state_root', 'nextStateRoot'], ['previous_body_root', 'previousBodyRoot'], ['next_body_root', 'nextBodyRoot']]) check(transition?.[outer] === transition?.physical_transition?.[inner], `LARGE_WORLD_RSR_RESIDENCY_${outer.toUpperCase()}_MISMATCH`);
    if (options.candidate !== undefined) {
      const candidateVerification = verifyLargeWorldRsrTerrainCandidate(options.candidate, options.region === undefined ? {} : {region: options.region});
      check(candidateVerification.valid, 'LARGE_WORLD_RSR_RESIDENCY_SOURCE_CANDIDATE_INVALID');
      check(options.candidate?.candidate_root === transition?.source_candidate_root, 'LARGE_WORLD_RSR_RESIDENCY_SOURCE_CANDIDATE_ROOT_MISMATCH');
      check(options.candidate?.source?.stream_transition_root === transition?.source_stream_transition_root, 'LARGE_WORLD_RSR_RESIDENCY_STREAM_TRANSITION_ROOT_MISMATCH');
      check(JSON.stringify(transition?.source_released_chunk_ids ?? []) === JSON.stringify(orderedIds(options.candidate?.stream_resolution?.stream_transition?.released_chunk_ids ?? [])), 'LARGE_WORLD_RSR_RESIDENCY_RELEASED_IDS_MISMATCH');
    }
    const copy = clone(transition);
    const root = copy.transition_root;
    delete copy.transition_root;
    check(HEX64.test(root ?? '') && rootHash(copy) === root, 'LARGE_WORLD_RSR_RESIDENCY_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`LARGE_WORLD_RSR_RESIDENCY_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, transition_root: transition?.transition_root ?? null};
}
