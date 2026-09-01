import {createHash, createHmac, timingSafeEqual} from 'node:crypto';
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
  createServerPseudoSovereigntyProfile,
  createServerSovereigntyHandoffReceipt,
  createServerSovereigntyMigration,
  createCausalPhysicalProfile,
  createMinimumViableReality as createCoreMinimumViableReality,
  createRealityQuery,
  createRealityConsistencyProfile,
  createRealityFault as createCoreRealityFault,
  createRealityLoadSheddingPlan as createCoreRealityLoadSheddingPlan,
  createRealityPowerProfile as createCoreRealityPowerProfile,
  createRealityResourceBudget as createCoreRealityResourceBudget,
  createRealityResourceDemand as createCoreRealityResourceDemand,
  createRepresentationPortfolio,
  createRepresentationSlot,
  createRepresentationRef,
  createRealityChunk as createCoreRealityChunk,
  createRealityChunkDelta as createCoreRealityChunkDelta,
  createRealityChunkDeltaReceipt as createCoreRealityChunkDeltaReceipt,
  createRealityChunkSnapshotReceipt as createCoreRealityChunkSnapshotReceipt,
  createWorldEvent,
  createWorldEventLog,
  createWorldFact,
  createWorldTime,
  replayWorldEvents,
  rebuildFactWorldTree,
  rootHash,
  verifyFactWorldTree,
  verifyAuthorityLease,
  verifyServerPseudoSovereigntyProfile,
  verifyServerSovereigntyHandoffReceipt,
  verifyServerSovereigntyMigration,
  verifyCausalPhysicalProfile,
  verifyMinimumViableReality,
  verifyRealityFault,
  verifyRealityChunk,
  verifyRealityChunkDelta,
  verifyRealityChunkDeltaReceipt,
  verifyRealityChunkSnapshotReceipt,
  REALITY_CONSISTENCY_PROFILE_FORMAT,
  AUTHORITY_LEASE_FORMAT,
  REALITY_CAUSAL_PHYSICAL_PROFILE_FORMAT,
  verifyRealityConsistencyProfile,
  verifyCognitiveWorkingSet,
  verifyRealityHorizon,
  verifyRealityInterestGraph,
  verifyRealityLoadSheddingPlan,
  verifyRealityPowerProfile,
  verifyRealityResourceBudget,
  verifyRealityResourceDemand,
  verifyRealityQuery,
  verifyRealityQueryResult,
  verifyWorldEvent,
  verifyWorldEventLog,
  verifyWorldFact,
  verifyWorldTime,
  worldStateRoot
} from '@taowind/rncs-core-contract';
import {RealityRepresentationFabric, RealityRepresentationPortfolioRuntime} from '@taowind/reality-representation-fabric';
import {GlbBuilder, encodeFloat32, encodeUint16, encodeUint32, encodeGlb, encodePng, encodeKtx2Rgba8, inspectGlb, inspectKtx2, minMax, normalizeIntent, deriveGenomeFromIntent, generatePbrTexturePack, generateMesh3d} from '@taowind/reality-asset-genesis-fabric';

export const LARGE_WORLD_RUNTIME_FORMAT = 'rncs.large-world-runtime.v0.1';
export const LARGE_WORLD_RUNTIME_VERSION = '0.1.0';
export const LARGE_WORLD_REGION_FORMAT = 'rncs.large-world-region.v0.1';
export const LARGE_WORLD_CHUNK_FORMAT = 'rncs.large-world-chunk.v0.1';
export const LARGE_WORLD_STREAM_FORMAT = 'rncs.large-world-stream-resolution.v0.1';
export const LARGE_WORLD_REALITY_ACCESS_FORMAT = 'rncs.large-world-reality-access-resolution.v0.1';
export const LARGE_WORLD_PORTFOLIO_SELECTION_FORMAT = 'rncs.large-world-portfolio-selection.v0.1';
export const LARGE_WORLD_SPATIAL_SCENE_FORMAT = 'rncs.large-world-spatial-scene.v0.1';
export const LARGE_WORLD_SPATIAL_VISUAL_PROFILE = 'large-world.visual-prototypes.v0.1';
/**
 * Quality profiles lowered by the large-world renderer. REFERENCE remains
 * outside this list until a real reference-grade provider and renderer are
 * bound; these four profiles are deterministic candidates only.
 */
export const LARGE_WORLD_SPATIAL_QUALITY_PROFILES = Object.freeze(['PROXY', 'MOBILE', 'STANDARD', 'CINEMATIC']);
export const LARGE_WORLD_WORKING_SET_BUDGET_FORMAT = 'urrf.large-world-working-set-budget.v0.1';
export const LARGE_WORLD_QUALITY_ALLOCATION_POLICY_FORMAT = 'urrf.large-world-quality-allocation-policy.v0.1';
export const LARGE_WORLD_SPATIAL_GLTF_MANIFEST_FORMAT = 'rncs.large-world-spatial-gltf-manifest.v0.1';
export const LARGE_WORLD_SPATIAL_GLTF_BUNDLE_FORMAT = 'rncs.large-world-spatial-gltf-bundle.v0.1';
export const LARGE_WORLD_SPATIAL_GLTF_PROVIDER_ID = 'provider:taowind:large-world-gltf-prototype:v0.1';
export const LARGE_WORLD_SPATIAL_GLTF_TEXTURE_PROFILE = 'vsr.rgba-inline.v0.1';
export const LARGE_WORLD_SPATIAL_GLB_MANIFEST_FORMAT = 'rncs.large-world-spatial-glb-manifest.v0.1';
export const LARGE_WORLD_SPATIAL_GLB_BUNDLE_FORMAT = 'rncs.large-world-spatial-glb-bundle.v0.1';
export const LARGE_WORLD_SPATIAL_GLB_PROVIDER_ID = 'provider:taowind:large-world-glb-ragf:v0.1';
export const LARGE_WORLD_SPATIAL_GLB_TEXTURE_PROFILE = 'ragf.png-embedded.v0.1';
export const LARGE_WORLD_SPATIAL_GLB_KTX2_TEXTURE_PROFILE = 'ragf.ktx2-rgba8-mipped.v0.1';
export const LARGE_WORLD_SPATIAL_GLB_KTX2_PBR_TEXTURE_PROFILE = 'ragf.ktx2-pbr-mipped.v0.1';
export const LARGE_WORLD_SPATIAL_GLB_TEXTURE_RESIDENCY_PROFILE = 'vsr.progressive-mip-residency.v0.1';
export const LARGE_WORLD_TEXTURE_RESIDENCY_FORMAT = 'rncs.large-world-texture-residency.v0.1';
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
export const LARGE_WORLD_REALITY_CHUNK_FORMAT = 'rncs.reality-chunk.v0.3';
export const LARGE_WORLD_REALITY_CHUNK_DELTA_FORMAT = 'rncs.reality-chunk-delta.v0.3';
export const LARGE_WORLD_REALITY_CHUNK_RECEIPT_FORMAT = 'rncs.reality-chunk-delta-receipt.v0.3';
export const LARGE_WORLD_REALITY_CHUNK_SNAPSHOT_RECEIPT_FORMAT = 'rncs.reality-chunk-snapshot-receipt.v0.3';
export const LARGE_WORLD_REALITY_CHUNK_PACKET_FORMAT = 'rncs.reality-chunk-replication-packet.v0.3';
export const LARGE_WORLD_REALITY_CHUNK_ACK_FORMAT = 'rncs.reality-chunk-replication-ack.v0.3';
export const LARGE_WORLD_REALITY_FAULT_FORMAT = 'rncs.reality-fault.v0.3';
export const LARGE_WORLD_MINIMUM_REALITY_FORMAT = 'rncs.minimum-viable-reality.v0.3';
export const LARGE_WORLD_LOAD_SHEDDING_PLAN_FORMAT = 'rncs.reality-load-shedding-plan.v0.3';
export const LARGE_WORLD_MINIMUM_REALITY_RECOVERY_FORMAT = 'rncs.large-world-minimum-reality-recovery.v0.1';
export const LARGE_WORLD_REPLICATION_CONFLICT_POLICY_ID = 'lexicographic-writer-priority';
export const LARGE_WORLD_CONSISTENCY_PROFILE_FORMAT = REALITY_CONSISTENCY_PROFILE_FORMAT;
export const LARGE_WORLD_AUTHORITY_LEASE_FORMAT = AUTHORITY_LEASE_FORMAT;
export const LARGE_WORLD_CAUSAL_PHYSICAL_PROFILE_FORMAT = REALITY_CAUSAL_PHYSICAL_PROFILE_FORMAT;
export const LARGE_WORLD_SERVER_SOVEREIGNTY_PROFILE_FORMAT = 'rncs.server-pseudo-sovereignty.v0.3';
export const LARGE_WORLD_SERVER_SOVEREIGNTY_MIGRATION_FORMAT = 'rncs.server-sovereignty-migration.v0.3';
export const LARGE_WORLD_SERVER_SOVEREIGNTY_HANDOFF_RECEIPT_FORMAT = 'rncs.server-sovereignty-handoff-receipt.v0.3';

export const LARGE_WORLD_BIOMES = Object.freeze(['coast', 'desert', 'forest', 'grassland', 'tundra', 'wetland']);
export const LARGE_WORLD_STRUCTURE_KINDS = Object.freeze(['ruin', 'grove', 'mine', 'shrine', 'watchtower']);
export const LARGE_WORLD_RESOURCE_KINDS = Object.freeze(['crystal', 'iron', 'salt', 'timber', 'water']);
export const LARGE_WORLD_PROCEDURAL_PROVIDER_ID = 'provider:taowind:large-world-procedural-mesh:v0.1';
export const LARGE_WORLD_WIREFRAME_PROVIDER_ID = 'provider:taowind:large-world-wireframe-mesh:v0.1';

const POWER_BINDABLE_CANDIDATE_KINDS = new Set(['VISUAL', 'REFINEMENT', 'MINIMUM_REALITY']);
const POWER_QUALITY_LOWERING = Object.freeze({
  KEEP: {qualityProfile: null, effect: 'KEEP'},
  REDUCE_DETAIL: {qualityProfile: 'PROXY', effect: 'MINIMUM_REALITY_PROXY'},
  REDUCE_FREQUENCY: {qualityProfile: null, effect: 'REDUCE_FREQUENCY'},
  FREEZE: {qualityProfile: null, effect: 'FREEZE'},
  OFFLOAD: {qualityProfile: 'PROXY', effect: 'OFFLOAD_TO_MINIMUM_REALITY'},
  DEFER: {qualityProfile: 'PROXY', effect: 'MINIMUM_REALITY_PROXY'},
  DROP: {qualityProfile: 'PROXY', effect: 'MINIMUM_REALITY_PROXY'},
  RECOVER_MINIMUM: {qualityProfile: 'PROXY', effect: 'RECOVER_MINIMUM'}
});

const clone = value => structuredClone(value);
const record = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const keySort = (a, b) => Buffer.compare(Buffer.from(String(a), 'utf8'), Buffer.from(String(b), 'utf8'));
const strings = values => [...new Set((Array.isArray(values) ? values : []).map(String).filter(Boolean))].sort(keySort);
const hex64 = value => typeof value === 'string' && /^[0-9a-f]{64}$/i.test(value);
const fail = (condition, code) => { if (!condition) throw new Error(code); };
const normalizeQualityProfiles = (values, fallback = LARGE_WORLD_SPATIAL_QUALITY_PROFILES) => {
  const raw = Array.isArray(values) && values.length > 0 ? values : fallback;
  const normalized = [...new Set(raw.map(value => String(value).trim().toUpperCase()).filter(Boolean))];
  fail(normalized.length > 0 && normalized.every(value => LARGE_WORLD_SPATIAL_QUALITY_PROFILES.includes(value)), 'LARGE_WORLD_SPATIAL_QUALITY_PROFILE_INVALID');
  return normalized.sort((a, b) => LARGE_WORLD_SPATIAL_QUALITY_PROFILES.indexOf(a) - LARGE_WORLD_SPATIAL_QUALITY_PROFILES.indexOf(b));
};
const WORKING_SET_COST_FIELDS = Object.freeze(['CPU_MILLI', 'GPU_MILLI', 'NPU_MILLI', 'VRAM_MB', 'RAM_MB', 'STORAGE_KB', 'NETWORK_KB', 'ENERGY_MILLI']);
const WORKING_SET_COST_TO_RESOURCE = Object.freeze({
  CPU_MILLI: 'CPU',
  GPU_MILLI: 'GPU',
  NPU_MILLI: 'NPU',
  VRAM_MB: 'VRAM',
  RAM_MB: 'RAM',
  STORAGE_KB: 'STORAGE',
  NETWORK_KB: 'NETWORK',
  ENERGY_MILLI: 'ENERGY'
});

function normalizeWorkingSetResourceBudget(input) {
  if (input === undefined || input === null) return null;
  const value = record(input);
  if (value.budget_root !== undefined) {
    const verification = verifyRealityResourceBudget(value);
    fail(verification.valid, `LARGE_WORLD_WORKING_SET_BUDGET_INVALID:${verification.errors.join(',')}`);
  }
  const source = record(value.available ?? value);
  const available = {};
  for (const field of WORKING_SET_COST_FIELDS) {
    const resource = WORKING_SET_COST_TO_RESOURCE[field];
    const raw = source[field] ?? source[resource] ?? source[field.toLowerCase()] ?? source[resource.toLowerCase()];
    if (raw === undefined || raw === null) continue;
    const number = Number(raw);
    fail(Number.isSafeInteger(number) && number >= 0, 'LARGE_WORLD_WORKING_SET_BUDGET_VALUE_INVALID');
    available[field] = number;
  }
  fail(Object.keys(available).length > 0, 'LARGE_WORLD_WORKING_SET_BUDGET_EMPTY');
  return {available, source_budget_root: value.budget_root === undefined ? null : String(value.budget_root).toLowerCase()};
}

function workingSetCostVector(slot) {
  return Object.fromEntries(WORKING_SET_COST_FIELDS.map(field => [field, Number(slot?.resource_costs?.[field] ?? 0)]));
}

function sumWorkingSetCosts(rows) {
  return Object.fromEntries(WORKING_SET_COST_FIELDS.map(field => [field, rows.reduce((sum, row) => sum + Number(row?.selected_resource_costs?.[field] ?? 0), 0)]));
}

function workingSetFits(available, costs) {
  return Object.entries(available).every(([field, limit]) => Number(costs[field] ?? 0) <= Number(limit));
}

function workingSetRemaining(available, costs) {
  return Object.fromEntries(WORKING_SET_COST_FIELDS.map(field => [field, Object.hasOwn(available, field) ? Number(available[field]) - Number(costs[field] ?? 0) : null]));
}

function normalizeWorkingSetQuality(value, code, fallback = 'PROXY') {
  const normalized = String(value ?? fallback).trim().toUpperCase();
  fail(LARGE_WORLD_SPATIAL_QUALITY_PROFILES.includes(normalized), code);
  return normalized;
}

function normalizeWorkingSetPriorityMap(input) {
  const source = record(input);
  return Object.fromEntries(Object.entries(source).map(([chunkId, priority]) => [String(chunkId), integer(priority, 0, {min: 0, max: 100})]));
}

function workingSetQualityDowngradeScore(currentCosts, nextCosts, totalCosts, available) {
  return WORKING_SET_COST_FIELDS.reduce((score, field) => {
    const reduction = Number(currentCosts[field] ?? 0) - Number(nextCosts[field] ?? 0);
    if (reduction <= 0) return score;
    const deficit = Object.hasOwn(available, field) ? Math.max(Number(totalCosts[field] ?? 0) - Number(available[field]), 0) : 0;
    return score + reduction * (deficit > 0 ? 4 : 1);
  }, 0);
}

function allocateWorkingSetQuality({selections, budget, minimumQualityProfile, minimumQualityByChunk, priorityByChunk, selectForQuality}) {
  let rows = selections.map(clone);
  const initialCosts = sumWorkingSetCosts(rows);
  let costs = initialCosts;
  const initialFits = workingSetFits(budget.available, costs);
  const downgrades = [];
  while (!workingSetFits(budget.available, costs)) {
    const candidates = [];
    for (const [index, row] of rows.entries()) {
      const currentQuality = String(row.selected_quality_profile ?? '').toUpperCase();
      const currentRank = LARGE_WORLD_SPATIAL_QUALITY_PROFILES.indexOf(currentQuality);
      const minimumQuality = minimumQualityByChunk[row.chunk_id] ?? minimumQualityProfile;
      const minimumRank = LARGE_WORLD_SPATIAL_QUALITY_PROFILES.indexOf(minimumQuality);
      if (currentRank <= 0 || currentRank <= minimumRank) continue;
      const nextQuality = LARGE_WORLD_SPATIAL_QUALITY_PROFILES[currentRank - 1];
      const next = selectForQuality(row, nextQuality);
      if (!next?.slot || String(next.slot.quality_profile).toUpperCase() !== nextQuality) continue;
      const nextCosts = workingSetCostVector(next.slot);
      const currentCosts = row.selected_resource_costs;
      candidates.push({
        index,
        row,
        next,
        nextQuality,
        nextCosts,
        score: workingSetQualityDowngradeScore(currentCosts, nextCosts, costs, budget.available),
        priority: priorityByChunk[row.chunk_id] ?? 0,
        currentRank
      });
    }
    candidates.sort((a, b) => a.priority - b.priority || b.score - a.score || b.currentRank - a.currentRank || keySort(a.row.chunk_id, b.row.chunk_id));
    const candidate = candidates[0];
    if (!candidate) break;
    const nextRow = {
      ...candidate.row,
      selected_slot_id: candidate.next.selected_slot_id,
      selected_slot_root: candidate.next.selected_slot_root,
      selected_representation_root: candidate.next.slot?.representation_root ?? null,
      selected_quality_profile: candidate.next.slot?.quality_profile ?? null,
      fallback_used: true,
      reason_codes: strings([...candidate.row.reason_codes, ...candidate.next.reason_codes, 'WORKING_SET_RESOURCE_BUDGET_DOWNGRADE']),
      selection_root: candidate.next.selection_root,
      selected_resource_costs: candidate.nextCosts,
      working_set_downgraded: true
    };
    rows[candidate.index] = nextRow;
    costs = sumWorkingSetCosts(rows);
    downgrades.push({chunk_id: candidate.row.chunk_id, from: candidate.row.selected_quality_profile, to: candidate.nextQuality});
  }
  const fits = workingSetFits(budget.available, costs);
  return {
    selections: rows,
    initial_costs: initialCosts,
    costs,
    remaining: workingSetRemaining(budget.available, costs),
    status: initialFits ? 'WITHIN_BUDGET' : fits ? 'DOWNGRADED_TO_FIT' : 'MINIMUM_REALITY_OVER_BUDGET',
    downgrades,
    minimum_quality_profile: minimumQualityProfile,
    minimum_quality_by_chunk: Object.fromEntries(Object.entries(minimumQualityByChunk).sort(([a], [b]) => keySort(a, b))),
    priority_by_chunk: Object.fromEntries(Object.entries(priorityByChunk).sort(([a], [b]) => keySort(a, b)))
  };
}

function normalizeResourceGovernorPlan(input) {
  if (input === undefined || input === null) return null;
  const plan = clone(input);
  const verification = verifyRealityLoadSheddingPlan(plan);
  fail(verification.valid, `LARGE_WORLD_RESOURCE_GOVERNOR_PLAN_INVALID:${verification.errors.join(',')}`);
  return plan;
}

function resourceGovernorDecisionForChunk(plan, chunk) {
  if (!plan) return null;
  const candidateIds = [
    `visual:${chunk.chunk_id}`,
    `visual:${chunk.object_id}`,
    `refinement:${chunk.chunk_id}`,
    `refinement:${chunk.object_id}`,
    `minimum:${chunk.chunk_id}`,
    `minimum:${chunk.object_id}`,
    chunk.chunk_id,
    chunk.object_id
  ];
  for (const candidateId of candidateIds) {
    const decision = plan.decisions.find(entry => POWER_BINDABLE_CANDIDATE_KINDS.has(entry.candidate_kind) && entry.candidate_id === candidateId);
    if (decision) return decision;
  }
  return null;
}
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

function normalizeServerSovereigntyProfile(input, runtime) {
  if (input === undefined || input === null) return null;
  const value = record(input);
  const worldId = runtime.options?.worldId ?? runtime.worldId;
  const shardId = runtime.shardId;
  const worldRoot = runtime.region?.world_root ?? runtime.worldRoot;
  const profile = value.profile_root
    ? clone(value)
    : createServerPseudoSovereigntyProfile({
      ...value,
      world_id: worldId,
      shard_id: shardId,
      canonical_world_root: worldRoot,
      lease: value.lease ?? value.authority_lease ?? value.authorityLease ?? runtime.authorityLease ?? runtime.acceptedAuthorityLease
    });
  const verification = verifyServerPseudoSovereigntyProfile(profile);
  fail(verification.valid, `LARGE_WORLD_SERVER_SOVEREIGNTY_PROFILE_INVALID:${verification.errors.join(',')}`);
  fail(profile.world_id === worldId, 'LARGE_WORLD_SERVER_SOVEREIGNTY_WORLD_ID_MISMATCH');
  fail(profile.shard_id === shardId, 'LARGE_WORLD_SERVER_SOVEREIGNTY_SHARD_ID_MISMATCH');
  fail(profile.canonical_world_root === worldRoot, 'LARGE_WORLD_SERVER_SOVEREIGNTY_WORLD_ROOT_MISMATCH');
  fail(profile.lease?.shard_id === shardId, 'LARGE_WORLD_SERVER_SOVEREIGNTY_LEASE_SHARD_MISMATCH');
  return profile;
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

function chunkRealityQueryIndex(chunk) {
  const biome = String(chunk.biome ?? 'unknown').toLowerCase();
  const structureTags = (chunk.structures ?? []).map(structure => `structure:${String(structure.kind ?? 'unknown').toLowerCase()}`);
  const resourceTags = (chunk.resources ?? []).map(resource => `resource:${String(resource.kind ?? 'unknown').toLowerCase()}`);
  return {
    position: {
      x: Number(chunk.origin_mm?.x ?? 0) / 1000 + Number(chunk.extent_mm?.x ?? 0) / 2000,
      y: 0,
      z: Number(chunk.origin_mm?.z ?? 0) / 1000 + Number(chunk.extent_mm?.z ?? 0) / 2000
    },
    semantic_tags: strings(['large-world', 'chunk', biome, `biome:${biome}`, `world:${chunk.world_id}`, ...structureTags, ...resourceTags]),
    state: {
      world_id: chunk.world_id,
      chunk_id: chunk.chunk_id,
      biome,
      generation: String(chunk.generation),
      structure_count: String((chunk.structures ?? []).length),
      resource_count: String((chunk.resources ?? []).length),
      memory_bytes: String(chunk.memory_bytes)
    },
    relations: [{type: 'world_member', from: String(chunk.world_id), to: String(chunk.chunk_id)}],
    temporal: {from: '0', to: String(chunk.generation)},
    authority_scope: ['public'],
    freshness: String(chunk.generation),
    evidence_refs: [chunk.chunk_root, chunk.content_root]
  };
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
  const quality = String(qualityProfile).toUpperCase();
  const proxy = quality === 'PROXY';
  const mobile = quality === 'MOBILE';
  const cinematic = quality === 'CINEMATIC';
  return {
    CPU_MILLI: (proxy ? 20 : mobile ? 42 : cinematic ? 128 : 80) + chunk.sample_resolution * (proxy ? 2 : mobile ? 3 : cinematic ? 8 : 6),
    GPU_MILLI: proxy ? 15 : mobile ? 42 : cinematic ? 180 : 90,
    NPU_MILLI: 0,
    VRAM_MB: proxy ? 4 : mobile ? 6 + Math.max(1, Math.ceil(memory / 8192)) : cinematic ? 16 + Math.max(1, Math.ceil(memory / 2048)) : 8 + Math.max(1, Math.ceil(memory / 4096)),
    RAM_MB: proxy ? 1 + Math.max(1, Math.ceil(memory / 8192)) : mobile ? 2 + Math.max(1, Math.ceil(memory / 4096)) : cinematic ? 4 + Math.max(1, Math.ceil(memory / 1024)) : 2 + Math.max(1, Math.ceil(memory / 2048)),
    STORAGE_KB: proxy ? Math.max(1, Math.ceil(memory / 4096)) : mobile ? Math.max(1, Math.ceil(memory / 2048)) : cinematic ? Math.max(1, Math.ceil(memory / 512)) : Math.max(1, Math.ceil(memory / 1024)),
    NETWORK_KB: proxy ? Math.max(1, Math.ceil(memory / 4096)) : mobile ? Math.max(1, Math.ceil(memory / 2048)) : cinematic ? Math.max(1, Math.ceil(memory / 512)) : Math.max(1, Math.ceil(memory / 1024)),
    ENERGY_MILLI: proxy ? 5 : mobile ? 10 : cinematic ? 45 : 25
  };
}

function normalizeCausalPhysicalProfileForChunk(input, chunk) {
  if (input === null || input === undefined) return null;
  const value = record(input);
  const profile = value.profile_root
    ? clone(value)
    : createCausalPhysicalProfile({
      ...value,
      profile_id: value.profile_id ?? value.profileId ?? `profile:${chunk.object_id}:causal-physical`,
      object_id: chunk.object_id,
      canonical_state_root: value.canonical_state_root ?? value.canonicalStateRoot ?? chunk.state_root,
      demand: value.demand ?? value.requirement ?? value
    });
  fail(profile.object_id === chunk.object_id, 'LARGE_WORLD_CAUSAL_PHYSICAL_OBJECT_MISMATCH');
  fail(profile.canonical_state_root === chunk.state_root, 'LARGE_WORLD_CAUSAL_PHYSICAL_STATE_ROOT_MISMATCH');
  const verification = verifyCausalPhysicalProfile(profile);
  fail(verification.valid, `LARGE_WORLD_CAUSAL_PHYSICAL_PROFILE_INVALID:${verification.errors.join(',')}`);
  return profile;
}

function subtractCausalPhysicalCosts(resourceBudget, costs) {
  if (resourceBudget === null || resourceBudget === undefined || !costs) return resourceBudget;
  const output = clone(resourceBudget);
  const root = record(output);
  const target = root.available && typeof root.available === 'object' && !Array.isArray(root.available) ? root.available : output;
  const aliases = {
    CPU_MILLI: ['CPU_MILLI', 'CPU'],
    GPU_MILLI: ['GPU_MILLI', 'GPU'],
    RAM_MB: ['RAM_MB', 'RAM'],
    VRAM_MB: ['VRAM_MB', 'VRAM'],
    ENERGY_MILLI: ['ENERGY_MILLI', 'ENERGY']
  };
  for (const [key, names] of Object.entries(aliases)) {
    const name = names.find(candidate => target[candidate] !== undefined);
    if (!name) continue;
    const available = Number(target[name]);
    if (Number.isSafeInteger(available)) target[name] = Math.max(0, available - Number(costs[key] ?? 0));
  }
  return output;
}

function chunkPortfolioSlot(chunk, reference, qualityProfile, {
  proxyWidth,
  proxyHeight,
  mobileWidth,
  mobileHeight,
  standardWidth,
  standardHeight,
  cinematicWidth,
  cinematicHeight,
  fallbackSlotId = null
} = {}) {
  const quality = String(qualityProfile).toUpperCase();
  const proxy = quality === 'PROXY';
  const mobile = quality === 'MOBILE';
  const cinematic = quality === 'CINEMATIC';
  const style = proxy ? 'WIREFRAME' : `PROCEDURAL_GRID_${quality}`;
  const dimensions = proxy
    ? [proxyWidth, proxyHeight, 320, 180]
    : mobile
      ? [mobileWidth, mobileHeight, 480, 270]
      : cinematic
        ? [cinematicWidth, cinematicHeight, 1280, 720]
        : [standardWidth, standardHeight, 640, 360];
  const biome = String(chunk.biome ?? 'UNKNOWN').toUpperCase();
  const slot_id = `slot:${chunk.chunk_id}:${quality.toLowerCase()}`;
  return createRepresentationSlot({
    slot_id,
    representation_id: reference.representation_id,
    representation_root: reference.representation_root,
    representation_kind: reference.representation_kind,
    quality_profile: quality,
    diversity_axes: {
      MODALITY: 'MESH',
      DETAIL: quality,
      MATERIAL: `${quality}_BIOME_${biome}`,
      LIGHTING: proxy ? 'WORLD_GRID_PROXY' : mobile ? 'WORLD_GRID_MOBILE' : cinematic ? 'WORLD_GRID_CINEMATIC' : 'WORLD_GRID_STANDARD',
      ENVIRONMENT: biome,
      STYLE: style,
      MOTION: 'STATIC',
      VIEW: 'CHUNK'
    },
    render_profile: {
      renderer_id: `large-world-${quality.toLowerCase()}`,
      shading_model: proxy ? 'wireframe' : cinematic ? 'pbr-lite-cinematic-candidate' : mobile ? 'pbr-lite-mobile' : 'pbr-lite',
      lighting_profile: proxy ? 'world-grid-proxy' : mobile ? 'world-grid-mobile' : cinematic ? 'world-grid-cinematic-candidate' : 'world-grid-standard',
      camera_profile: 'chunk-topdown',
      resolution_class: quality.toLowerCase(),
      width: integer(dimensions[0], dimensions[2], {min: 1, max: 16384}),
      height: integer(dimensions[1], dimensions[3], {min: 1, max: 16384}),
      post_process: cinematic ? 'filmic-tonemap-candidate' : 'none',
      options: {
        chunk_size_mm: chunk.extent_mm?.x ?? 0,
        sample_resolution: chunk.sample_resolution,
        quality_tier: quality.toLowerCase(),
        geometry_source: 'chunk-procedural-grid',
        presentation_variant: `large-world-${quality.toLowerCase()}`
      }
    },
    resource_costs: portfolioResourceCosts(chunk, quality),
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
  const qualityProfiles = normalizeQualityProfiles(value.quality_profiles ?? value.qualityProfiles);
  const requiredQualityProfiles = normalizeQualityProfiles(
    value.required_quality_profiles ?? value.requiredQualityProfiles,
    qualityProfiles
  );
  fail(requiredQualityProfiles.every(profile => qualityProfiles.includes(profile)), 'LARGE_WORLD_PORTFOLIO_REQUIRED_QUALITY_NOT_IN_LADDER');
  const slots = [];
  if (wireframe && qualityProfiles.includes('PROXY')) slots.push(chunkPortfolioSlot(chunk, wireframe, 'PROXY', value));
  if (procedural) {
    for (const quality of qualityProfiles.filter(profile => profile !== 'PROXY')) {
      slots.push(chunkPortfolioSlot(chunk, procedural, quality, {
        ...value,
        fallbackSlotId: slots.at(-1)?.slot_id ?? null
      }));
    }
  }
  if (slots.length === 0) slots.push(chunkPortfolioSlot(chunk, references[0], qualityProfiles[0], value));
  const active_slot_id = slots.find(slot => slot.quality_profile === 'STANDARD')?.slot_id
    ?? slots.find(slot => slot.quality_profile === 'MOBILE')?.slot_id
    ?? slots.find(slot => slot.quality_profile === 'CINEMATIC')?.slot_id
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
      min_slots: integer(value.min_slots ?? value.minSlots, qualityProfiles.length, {min: 1, max: 64}),
      max_slots: integer(value.max_slots ?? value.maxSlots, qualityProfiles.length, {min: 1, max: 64}),
      required_kinds: ['mesh'],
      required_quality_profiles: requiredQualityProfiles,
      quality_ladder: qualityProfiles,
      diversity_targets: {
        MODALITY: 1,
        DETAIL: Math.min(qualityProfiles.length, 4),
        MATERIAL: Math.min(qualityProfiles.length, 4),
        ENVIRONMENT: 1,
        STYLE: Math.min(qualityProfiles.length, 4),
        MOTION: 1,
        VIEW: 1
      }
    },
    evidence_refs: [chunk.chunk_root, chunk.content_root, ...references.map(reference => reference.representation_root)]
  });
}

const LARGE_WORLD_SPATIAL_BIOME_COLORS = Object.freeze({
  coast: '#2b8cbe',
  desert: '#d9a441',
  forest: '#2f855a',
  grassland: '#79a83b',
  tundra: '#b9d4e8',
  wetland: '#3f7f73'
});
const LARGE_WORLD_SPATIAL_PROXY_COLORS = Object.freeze({
  coast: '#1d4f69',
  desert: '#765b24',
  forest: '#214d36',
  grassland: '#4c6726',
  tundra: '#617481',
  wetland: '#2a514d'
});
const LARGE_WORLD_SPATIAL_MOBILE_COLORS = Object.freeze({
  coast: '#347da1',
  desert: '#bd8f3a',
  forest: '#397450',
  grassland: '#6f9639',
  tundra: '#a6c5d9',
  wetland: '#467f74'
});
const LARGE_WORLD_SPATIAL_CINEMATIC_COLORS = Object.freeze({
  coast: '#3ea9d4',
  desert: '#e6b34c',
  forest: '#3ba56a',
  grassland: '#8fbe48',
  tundra: '#d5efff',
  wetland: '#4ea99a'
});
const LARGE_WORLD_SPATIAL_RESOURCE_COLORS = Object.freeze({
  crystal: '#7dd3fc',
  iron: '#a8a29e',
  salt: '#f5f5f4',
  timber: '#a16207',
  water: '#38bdf8'
});
const LARGE_WORLD_SPATIAL_STRUCTURE_COLORS = Object.freeze({
  grove: '#4d9f62',
  mine: '#a8794e',
  ruin: '#b5a59b',
  shrine: '#c084fc',
  watchtower: '#f3b562'
});

function largeWorldSpatialCubeMesh(id = 'mesh:large-world:cube') {
  const faces = [
    {normal: [0, 0, 1], corners: [[-.5, -.5, .5], [.5, -.5, .5], [.5, .5, .5], [-.5, .5, .5]]},
    {normal: [0, 0, -1], corners: [[.5, -.5, -.5], [-.5, -.5, -.5], [-.5, .5, -.5], [.5, .5, -.5]]},
    {normal: [1, 0, 0], corners: [[.5, -.5, .5], [.5, -.5, -.5], [.5, .5, -.5], [.5, .5, .5]]},
    {normal: [-1, 0, 0], corners: [[-.5, -.5, -.5], [-.5, -.5, .5], [-.5, .5, .5], [-.5, .5, -.5]]},
    {normal: [0, 1, 0], corners: [[-.5, .5, .5], [.5, .5, .5], [.5, .5, -.5], [-.5, .5, -.5]]},
    {normal: [0, -1, 0], corners: [[-.5, -.5, -.5], [.5, -.5, -.5], [.5, -.5, .5], [-.5, -.5, .5]]}
  ];
  const positions = [], normals = [], uvs = [], indices = [];
  for (const face of faces) {
    const offset = positions.length / 3;
    for (const [u, v, w] of face.corners) {
      positions.push(u, v, w);
      normals.push(...face.normal);
    }
    uvs.push(0, 0, 1, 0, 1, 1, 0, 1);
    indices.push(offset, offset + 1, offset + 2, offset, offset + 2, offset + 3);
  }
  return {id, positions, normals, uvs, indices, topology: 'triangle-list'};
}

function largeWorldSpatialAppendFace(target, corners) {
  const offset = target.positions.length / 3;
  for (let cornerIndex = 0; cornerIndex < corners.length; cornerIndex++) {
    const [x, y, z] = corners[cornerIndex];
    target.positions.push(x, y, z);
    target.uvs.push(cornerIndex === 0 || cornerIndex === 3 ? 0 : 1, cornerIndex < 2 ? 0 : 1);
  }
  if (corners.length === 3) target.indices.push(offset, offset + 1, offset + 2);
  else target.indices.push(offset, offset + 1, offset + 2, offset, offset + 2, offset + 3);
}

function largeWorldSpatialRingMesh(id, {sides = 6, bottomRadius = .5, topRadius = .5, height = 1} = {}) {
  const mesh = {id, positions: [], normals: [], uvs: [], indices: [], topology: 'triangle-list'};
  const point = (radius, index, y) => {
    const angle = (Math.PI * 2 * index) / sides;
    return [Math.cos(angle) * radius, y, Math.sin(angle) * radius];
  };
  for (let side = 0; side < sides; side++) {
    const next = (side + 1) % sides;
    largeWorldSpatialAppendFace(mesh, [point(bottomRadius, side, 0), point(topRadius, side, height), point(topRadius, next, height), point(bottomRadius, next, 0)]);
  }
  if (bottomRadius > 0) {
    const center = [0, 0, 0];
    for (let side = 0; side < sides; side++) largeWorldSpatialAppendFace(mesh, [center, point(bottomRadius, side, 0), point(bottomRadius, (side + 1) % sides, 0)]);
  }
  if (topRadius > 0) {
    const center = [0, height, 0];
    for (let side = 0; side < sides; side++) largeWorldSpatialAppendFace(mesh, [center, point(topRadius, (side + 1) % sides, height), point(topRadius, side, height)]);
  }
  return {...mesh, normals: largeWorldSpatialMeshNormals(mesh)};
}

function largeWorldSpatialCombineMeshes(id, parts) {
  const mesh = {id, positions: [], normals: [], uvs: [], indices: [], topology: 'triangle-list'};
  for (const part of parts) {
    const source = part.mesh;
    const translation = part.translation ?? [0, 0, 0];
    const scale = part.scale ?? [1, 1, 1];
    const offset = mesh.positions.length / 3;
    for (let index = 0; index < source.positions.length; index += 3) {
      mesh.positions.push(source.positions[index] * scale[0] + translation[0], source.positions[index + 1] * scale[1] + translation[1], source.positions[index + 2] * scale[2] + translation[2]);
      mesh.uvs.push(source.uvs[index / 3 * 2] ?? 0, source.uvs[index / 3 * 2 + 1] ?? 0);
    }
    for (const index of source.indices) mesh.indices.push(index + offset);
  }
  return {...mesh, normals: largeWorldSpatialMeshNormals(mesh)};
}

function largeWorldSpatialPrototype(kind, qualityProfile) {
  const quality = String(qualityProfile).toUpperCase();
  const normalizedKind = String(kind ?? 'unknown').toLowerCase();
  if (quality === 'PROXY') return {
    prototypeId: `${LARGE_WORLD_SPATIAL_VISUAL_PROFILE}:proxy-structure`,
    mesh: largeWorldSpatialRingMesh('mesh:large-world:prototype:proxy-structure', {sides: 6, bottomRadius: .46, topRadius: .38, height: .72})
  };
  const variantSuffix = quality === 'STANDARD' ? '' : `:${quality.toLowerCase()}`;
  const sidesFor = sides => quality === 'MOBILE' ? Math.max(4, sides - 2) : quality === 'CINEMATIC' ? sides + 4 : sides;
  const prism = (sides, bottomRadius, topRadius, height) => largeWorldSpatialRingMesh(`mesh:large-world:prototype:${normalizedKind}${variantSuffix}`, {sides: sidesFor(sides), bottomRadius, topRadius, height});
  const cone = (sides, bottomRadius, height) => largeWorldSpatialRingMesh(`mesh:large-world:prototype:${normalizedKind}:roof${variantSuffix}`, {sides: sidesFor(sides), bottomRadius, topRadius: 0, height});
  const crystal = largeWorldSpatialRingMesh(`mesh:large-world:prototype:${normalizedKind}:crystal${variantSuffix}`, {sides: sidesFor(6), bottomRadius: .26, topRadius: 0, height: .95});
  let mesh;
  if (normalizedKind === 'grove') mesh = largeWorldSpatialCombineMeshes(`mesh:large-world:prototype:grove${variantSuffix}`, [
    {mesh: prism(6, .16, .13, .58)},
    {mesh: cone(8, .52, .72), translation: [0, .42, 0]},
    {mesh: cone(8, .38, .52), translation: [0, .83, 0]}
  ]);
  else if (normalizedKind === 'watchtower') mesh = largeWorldSpatialCombineMeshes(`mesh:large-world:prototype:watchtower${variantSuffix}`, [
    {mesh: prism(8, .34, .27, .95)},
    {mesh: cone(8, .45, .34), translation: [0, .95, 0]}
  ]);
  else if (normalizedKind === 'mine') mesh = largeWorldSpatialCombineMeshes(`mesh:large-world:prototype:mine${variantSuffix}`, [
    {mesh: prism(8, .5, .38, .38)},
    {mesh: cone(8, .52, .42), translation: [0, .32, 0]}
  ]);
  else if (normalizedKind === 'shrine') mesh = largeWorldSpatialCombineMeshes(`mesh:large-world:prototype:shrine${variantSuffix}`, [
    {mesh: prism(4, .46, .3, .28)},
    {mesh: crystal, translation: [0, .25, 0], scale: [1.25, 1.05, 1.25]}
  ]);
  else if (normalizedKind === 'ruin') mesh = largeWorldSpatialCombineMeshes(`mesh:large-world:prototype:ruin${variantSuffix}`, [
    {mesh: prism(6, .18, .16, .78), translation: [-.24, 0, -.12]},
    {mesh: prism(6, .16, .12, .54), translation: [.25, 0, .08]},
    {mesh: prism(6, .19, .1, .38), translation: [.02, 0, .28]}
  ]);
  else mesh = prism(6, .42, .34, .7);
  return {prototypeId: `${LARGE_WORLD_SPATIAL_VISUAL_PROFILE}:${normalizedKind}${variantSuffix}`, mesh};
}

function largeWorldSpatialResourcePrototype(kind, qualityProfile) {
  const normalizedKind = String(kind ?? 'unknown').toLowerCase();
  const quality = String(qualityProfile).toUpperCase();
  if (quality === 'PROXY') return {
    prototypeId: `${LARGE_WORLD_SPATIAL_VISUAL_PROFILE}:proxy-resource`,
    mesh: largeWorldSpatialRingMesh('mesh:large-world:prototype:proxy-resource', {sides: 5, bottomRadius: .42, topRadius: .26, height: .72})
  };
  const variantSuffix = quality === 'STANDARD' ? '' : `:${quality.toLowerCase()}`;
  const sidesFor = sides => quality === 'MOBILE' ? Math.max(4, sides - 2) : quality === 'CINEMATIC' ? sides + 4 : sides;
  if (normalizedKind === 'crystal' || normalizedKind === 'salt') return {
    prototypeId: `${LARGE_WORLD_SPATIAL_VISUAL_PROFILE}:${normalizedKind}${variantSuffix}`,
    mesh: largeWorldSpatialRingMesh(`mesh:large-world:prototype:resource:${normalizedKind}${variantSuffix}`, {sides: sidesFor(6), bottomRadius: .36, topRadius: 0, height: 1})
  };
  if (normalizedKind === 'timber') return {
    prototypeId: `${LARGE_WORLD_SPATIAL_VISUAL_PROFILE}:${normalizedKind}${variantSuffix}`,
    mesh: largeWorldSpatialRingMesh(`mesh:large-world:prototype:resource:timber${variantSuffix}`, {sides: sidesFor(8), bottomRadius: .3, topRadius: .22, height: 1})
  };
  return {
    prototypeId: `${LARGE_WORLD_SPATIAL_VISUAL_PROFILE}:${normalizedKind}${variantSuffix}`,
    mesh: largeWorldSpatialRingMesh(`mesh:large-world:prototype:resource:${normalizedKind}${variantSuffix}`, {sides: sidesFor(8), bottomRadius: .38, topRadius: .27, height: .76})
  };
}

function largeWorldSpatialMeshNormals(mesh) {
  const normals = new Array(mesh.positions.length).fill(0);
  for (let index = 0; index < mesh.indices.length; index += 3) {
    const a = mesh.indices[index] * 3, b = mesh.indices[index + 1] * 3, c = mesh.indices[index + 2] * 3;
    const ax = mesh.positions[b] - mesh.positions[a], ay = mesh.positions[b + 1] - mesh.positions[a + 1], az = mesh.positions[b + 2] - mesh.positions[a + 2];
    const bx = mesh.positions[c] - mesh.positions[a], by = mesh.positions[c + 1] - mesh.positions[a + 1], bz = mesh.positions[c + 2] - mesh.positions[a + 2];
    const nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx;
    for (const base of [a, b, c]) {
      normals[base] += nx;
      normals[base + 1] += ny;
      normals[base + 2] += nz;
    }
  }
  for (let index = 0; index < normals.length; index += 3) {
    const length = Math.hypot(normals[index], normals[index + 1], normals[index + 2]) || 1;
    normals[index] /= length;
    normals[index + 1] /= length;
    normals[index + 2] /= length;
  }
  return normals;
}

function largeWorldSpatialTerrainMesh(chunk, qualityProfile) {
  const resolution = integer(chunk.sample_resolution, 1, {min: 1, max: 32});
  const source = chunk.mesh.positions;
  const quality = String(qualityProfile).toUpperCase();
  const step = quality === 'PROXY'
    ? Math.max(1, Math.ceil(resolution / 4))
    : quality === 'MOBILE'
      ? Math.max(1, Math.ceil(resolution / 2))
      : 1;
  const axis = [];
  for (let coordinate = 0; coordinate <= resolution; coordinate += step) axis.push(coordinate);
  if (axis.at(-1) !== resolution) axis.push(resolution);
  const sourceStride = resolution + 1;
  const positions = [], uvs = [], indices = [];
  for (const row of axis) {
    for (const column of axis) {
      const sourceIndex = (row * sourceStride + column) * 3;
      positions.push(
        column * (chunk.extent_mm.x / 1000 / resolution),
        Number(source[sourceIndex + 1]) / 1000,
        row * (chunk.extent_mm.z / 1000 / resolution)
      );
      uvs.push(column / resolution, row / resolution);
    }
  }
  for (let row = 0; row < axis.length - 1; row++) {
    for (let column = 0; column < axis.length - 1; column++) {
      const a = row * axis.length + column, b = a + 1, c = a + axis.length, d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }
  const mesh = {id: `mesh:${chunk.chunk_id}:${qualityProfile.toLowerCase()}`, positions, uvs, indices, topology: 'triangle-list'};
  return {...mesh, normals: largeWorldSpatialMeshNormals(mesh)};
}

function largeWorldSpatialColor(palette, key, fallback) {
  return palette[String(key).toLowerCase()] ?? fallback;
}

function largeWorldSpatialSceneRoot(scene) {
  const extension = record(scene.large_world);
  return rootHash({
    format: extension.format,
    version: extension.version,
    scene_id: scene.sceneId,
    world_id: extension.world_id,
    generation: extension.generation,
    region_root: extension.region_root,
    world_root: extension.world_root,
    selection_root: extension.selection_root,
    active_chunk_ids: extension.active_chunk_ids,
    presentation_scale: String(extension.presentation_scale),
    representation_slots: extension.representation_slots,
    quality_profile: extension.quality_profile,
    quality_profiles: extension.quality_profiles,
    visual_prototype_profile: extension.visual_prototype_profile,
    visual_prototype_ids: extension.visual_prototype_ids,
    reality: {
      world_id: scene.reality?.worldId,
      generation: scene.reality?.generation,
      reality_root: scene.reality?.realityRoot,
      evidence_root: scene.reality?.evidenceRoot
    },
    candidate_only: extension.candidate_only,
    authoritative: extension.authoritative,
    canonical_write_authorized: extension.canonical_write_authorized,
    authority: extension.authority
  });
}

function largeWorldMinimumRealityRecoveryRoot(recovery) {
  return rootHash({
    format: recovery.format,
    version: recovery.version,
    world_id: recovery.world_id,
    node_id: recovery.node_id,
    generation: recovery.generation,
    region_root: recovery.region_root,
    world_root: recovery.world_root,
    canonical_state_root: recovery.canonical_state_root,
    world_time_tick: recovery.world_time_tick,
    fault_roots: recovery.fault_roots,
    faults: (recovery.faults ?? []).map(fault => ({fault_id: fault.fault_id, fault_root: fault.fault_root, status: fault.status})).sort((a, b) => keySort(a.fault_id, b.fault_id)),
    minimum_reality_root: recovery.minimum_reality?.minimum_reality_root ?? null,
    load_shedding_plan_root: recovery.load_shedding_plan?.plan_root ?? null,
    selection_root: recovery.selection?.selection_root ?? null,
    scene_root: recovery.scene?.scene_root ?? null,
    active_chunk_ids: recovery.active_chunk_ids,
    recovery_status: recovery.recovery_status,
    canonical_state_mutated: recovery.canonical_state_mutated,
    authority: recovery.authority,
    candidate_only: recovery.candidate_only,
    authoritative: recovery.authoritative,
    canonical_write_authorized: recovery.canonical_write_authorized,
    commit_status: recovery.commit_status
  });
}

function largeWorldSpatialSha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function largeWorldSpatialAppendBinary(target, values, componentType) {
  const componentSize = componentType === 5126 || componentType === 5125 ? 4 : componentType === 5123 ? 2 : 1;
  while (target.length % 4) target.push(0);
  const byteOffset = target.length;
  const bytes = new Uint8Array(values.length * componentSize);
  const view = new DataView(bytes.buffer);
  for (let index = 0; index < values.length; index++) {
    const value = Number(values[index] ?? 0);
    if (componentType === 5126) view.setFloat32(index * 4, Number.isFinite(value) ? value : 0, true);
    else if (componentType === 5125) view.setUint32(index * 4, Math.max(0, Math.trunc(value)), true);
    else if (componentType === 5123) view.setUint16(index * 2, Math.max(0, Math.min(0xffff, Math.trunc(value))), true);
    else bytes[index] = Math.max(0, Math.min(0xff, Math.trunc(value)));
  }
  for (const byte of bytes) target.push(byte);
  return {byteOffset, byteLength: bytes.length};
}

function largeWorldSpatialMeshForLod(mesh, lod) {
  const stride = lod === 0 ? 1 : lod === 1 ? 2 : 4;
  if (stride === 1) return mesh;
  const indices = [];
  for (let index = 0; index + 2 < mesh.indices.length; index += stride * 3) indices.push(mesh.indices[index], mesh.indices[index + 1], mesh.indices[index + 2]);
  if (indices.length < 3 && mesh.indices.length >= 3) indices.push(mesh.indices[0], mesh.indices[1], mesh.indices[2]);
  return {...mesh, indices};
}

function largeWorldSpatialColorRgba(value, fallback = '#9ca3af') {
  const match = /^#([0-9a-f]{6}|[0-9a-f]{8})$/i.exec(String(value ?? ''));
  const hex = match?.[1] ?? fallback.slice(1);
  return [0, 1, 2].map(index => Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16)).concat(hex.length === 8 ? Number.parseInt(hex.slice(6, 8), 16) : 255);
}

function largeWorldSpatialMaterialForMesh(scene, meshId) {
  const node = scene.nodes.find(entry => entry.meshId === meshId && entry.materialId);
  return scene.materials.find(entry => entry.id === node?.materialId) ?? scene.materials[0] ?? {id: 'material:large-world:default', baseColor: '#9ca3af', metallic: 0, roughness: .86};
}

function largeWorldSpatialGltfForMesh(mesh, material, {lod, prototypeId}) {
  const source = largeWorldSpatialMeshForLod(mesh, lod);
  const positions = Array.isArray(source.positions) ? source.positions : [];
  const normals = Array.isArray(source.normals) && source.normals.length === positions.length ? source.normals : new Array(positions.length).fill(0);
  const uvs = Array.isArray(source.uvs) && source.uvs.length === positions.length / 3 * 2 ? source.uvs : new Array(positions.length / 3 * 2).fill(0);
  const indices = Array.isArray(source.indices) ? source.indices : [];
  fail(positions.length >= 9 && indices.length >= 3, `LARGE_WORLD_GLTF_MESH_EMPTY:${mesh.id}`);
  const binary = [];
  const positionView = largeWorldSpatialAppendBinary(binary, positions, 5126);
  const normalView = largeWorldSpatialAppendBinary(binary, normals, 5126);
  const uvView = largeWorldSpatialAppendBinary(binary, uvs, 5126);
  const maximumIndex = indices.reduce((maximum, value) => Math.max(maximum, Number(value) || 0), 0);
  const indexComponentType = maximumIndex < 0x10000 ? 5123 : 5125;
  const indexView = largeWorldSpatialAppendBinary(binary, indices, indexComponentType);
  const color = largeWorldSpatialColorRgba(material.baseColor, '#9ca3af');
  const emissive = largeWorldSpatialColorRgba(material.emissive, '#000000');
  const texturePixels = [
    ...color, ...color,
    Math.max(0, color[0] - 24), Math.max(0, color[1] - 24), Math.max(0, color[2] - 24), color[3],
    Math.min(255, color[0] + 24), Math.min(255, color[1] + 24), Math.min(255, color[2] + 24), color[3]
  ];
  const gltf = {
    asset: {version: '2.0', generator: LARGE_WORLD_SPATIAL_GLTF_PROVIDER_ID},
    scene: 0,
    scenes: [{name: `${mesh.id}:lod${lod}`, nodes: [0]}],
    nodes: [{name: mesh.id, mesh: 0}],
    meshes: [{name: mesh.id, primitives: [{attributes: {POSITION: 0, NORMAL: 1, TEXCOORD_0: 2}, indices: 3, material: 0, mode: 4}]}],
    materials: [{
      name: String(material.id ?? 'material:large-world:default'),
      pbrMetallicRoughness: {
        baseColorFactor: color.map((entry, index) => entry / (index === 3 ? 255 : 255)),
        metallicFactor: Math.max(0, Math.min(1, Number(material.metallic ?? 0))),
        roughnessFactor: Math.max(0, Math.min(1, Number(material.roughness ?? .86))),
        baseColorTexture: {index: 0}
      },
      emissiveFactor: emissive.slice(0, 3).map(entry => entry / 255),
      alphaMode: material.alphaMode === 'BLEND' || material.alphaMode === 'MASK' ? material.alphaMode : 'OPAQUE',
      alphaCutoff: Number.isFinite(Number(material.alphaCutoff)) ? Number(material.alphaCutoff) : .5,
      doubleSided: material.doubleSided !== false,
      extras: {provider_id: LARGE_WORLD_SPATIAL_GLTF_PROVIDER_ID, prototype_id: prototypeId, lod}
    }],
    samplers: [{magFilter: 9729, minFilter: 9987, wrapS: 10497, wrapT: 10497}],
    images: [{
      name: `${mesh.id}:swatch`,
      mimeType: 'application/vnd.vsr.rgba',
      extras: {vsrRGBA: {width: 2, height: 2, pixels: texturePixels, colorSpace: 'srgb'}}
    }],
    textures: [{sampler: 0, source: 0}],
    buffers: [{byteLength: binary.length, uri: `data:application/octet-stream;base64,${Buffer.from(binary).toString('base64')}`}],
    bufferViews: [
      {...positionView, buffer: 0, target: 34962},
      {...normalView, buffer: 0, target: 34962},
      {...uvView, buffer: 0, target: 34962},
      {...indexView, buffer: 0, target: 34963}
    ],
    accessors: [
      {bufferView: 0, componentType: 5126, count: positions.length / 3, type: 'VEC3'},
      {bufferView: 1, componentType: 5126, count: normals.length / 3, type: 'VEC3'},
      {bufferView: 2, componentType: 5126, count: uvs.length / 2, type: 'VEC2'},
      {bufferView: 3, componentType: indexComponentType, count: indices.length, type: 'SCALAR'}
    ],
    extras: {
      format: LARGE_WORLD_SPATIAL_GLTF_MANIFEST_FORMAT,
      provider_id: LARGE_WORLD_SPATIAL_GLTF_PROVIDER_ID,
      prototype_id: prototypeId,
      lod,
      texture_profile: LARGE_WORLD_SPATIAL_GLTF_TEXTURE_PROFILE
    }
  };
  const bytes = new TextEncoder().encode(JSON.stringify(gltf));
  return {gltf, bytes, triangleCount: Math.floor(indices.length / 3), textureCount: 1};
}

function largeWorldSpatialGlbTexturePixels(material, meshId, lod, size) {
  const base = largeWorldSpatialColorRgba(material.baseColor, '#9ca3af');
  const accent = largeWorldSpatialColorRgba(material.emissive, '#000000');
  const pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const u = x / Math.max(1, size - 1), v = y / Math.max(1, size - 1);
    const stripe = ((Math.floor(u * 12) + Math.floor(v * 10) + lod) % 3) === 0;
    const wave = Math.round(Math.sin((u * 8 + v * 3 + lod) * Math.PI) * 6);
    const tone = stripe ? 18 + wave : -6 + wave;
    const pulse = (String(meshId).length + x * 7 + y * 11 + lod * 13) % Math.max(7, Math.floor(size * 1.2)) === 0;
    const index = (y * size + x) * 4;
    pixels[index] = Math.max(0, Math.min(255, base[0] + tone));
    pixels[index + 1] = Math.max(0, Math.min(255, base[1] + tone));
    pixels[index + 2] = Math.max(0, Math.min(255, base[2] + tone));
    pixels[index + 3] = pulse ? Math.max(base[3], accent[3]) : base[3];
  }
  return pixels;
}

function largeWorldSpatialPbrTexturePixels(material, meshId, lod, size, role) {
  if (role === 'base-color') return largeWorldSpatialGlbTexturePixels(material, meshId, lod, size);
  const base = largeWorldSpatialColorRgba(material.baseColor, '#9ca3af');
  const accent = largeWorldSpatialColorRgba(material.emissive, '#000000');
  const metallic = Math.max(0, Math.min(255, Math.round(Number(material.metallic ?? 0) * 255)));
  const roughness = Math.max(0, Math.min(255, Math.round(Number(material.roughness ?? .86) * 255)));
  const pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const u = x / Math.max(1, size - 1), v = y / Math.max(1, size - 1), index = (y * size + x) * 4;
    if (role === 'normal') {
      const dx = Math.round(Math.sin((u * 10 + lod) * Math.PI) * 18), dy = Math.round(Math.cos((v * 8 + String(meshId).length) * Math.PI) * 18);
      pixels[index] = Math.max(0, Math.min(255, 128 + dx));
      pixels[index + 1] = Math.max(0, Math.min(255, 128 + dy));
      pixels[index + 2] = 255;
      pixels[index + 3] = 255;
    } else if (role === 'metallic-roughness') {
      const edge = Math.min(u, 1 - u, v, 1 - v), localRoughness = Math.max(0, Math.min(255, roughness + Math.round((.5 - edge) * 24)));
      pixels[index] = Math.round(180 + edge * 75);
      pixels[index + 1] = localRoughness;
      pixels[index + 2] = metallic;
      pixels[index + 3] = 255;
    } else if (role === 'emissive') {
      const active = ((Math.floor(u * 12) + Math.floor(v * 10) + lod) % 11 === 0) || (Math.abs(u - .5) < .035 && v > .2 && v < .8);
      pixels[index] = active ? accent[0] : 0;
      pixels[index + 1] = active ? accent[1] : 0;
      pixels[index + 2] = active ? accent[2] : 0;
      pixels[index + 3] = 255;
    } else {
      throw new Error(`LARGE_WORLD_GLB_PBR_TEXTURE_ROLE_UNSUPPORTED:${role}`);
    }
  }
  return pixels;
}

function largeWorldSpatialDownsampleRgba8(source, width, height) {
  const nextWidth = Math.max(1, Math.floor(width / 2)), nextHeight = Math.max(1, Math.floor(height / 2)), pixels = new Uint8Array(nextWidth * nextHeight * 4);
  for (let y = 0; y < nextHeight; y++) for (let x = 0; x < nextWidth; x++) {
    const index = (y * nextWidth + x) * 4;
    for (let channel = 0; channel < 4; channel++) {
      let total = 0, count = 0;
      for (let oy = 0; oy < 2; oy++) for (let ox = 0; ox < 2; ox++) {
        const sx = Math.min(width - 1, x * 2 + ox), sy = Math.min(height - 1, y * 2 + oy);
        total += source[(sy * width + sx) * 4 + channel] ?? 0;
        count++;
      }
      pixels[index + channel] = Math.round(total / count);
    }
  }
  return {width: nextWidth, height: nextHeight, pixels};
}

function largeWorldSpatialGlbTexture(material, meshId, lod, {profile = LARGE_WORLD_SPATIAL_GLB_TEXTURE_PROFILE, textureSize = 32, role = 'base-color'} = {}) {
  if (profile === LARGE_WORLD_SPATIAL_GLB_TEXTURE_PROFILE && role === 'base-color') {
    const pixels = largeWorldSpatialGlbTexturePixels(material, meshId, lod, 4);
    return {width: 4, height: 4, pixels: [...pixels], png: encodePng(4, 4, Buffer.from(pixels)), profile, role, levelCount: 1};
  }
  fail(profile === LARGE_WORLD_SPATIAL_GLB_KTX2_TEXTURE_PROFILE || profile === LARGE_WORLD_SPATIAL_GLB_KTX2_PBR_TEXTURE_PROFILE, `LARGE_WORLD_GLB_TEXTURE_PROFILE_UNSUPPORTED:${profile}`);
  const requestedSize = Number(textureSize), size = Number.isFinite(requestedSize) ? Math.max(4, Math.min(256, 2 ** Math.floor(Math.log2(Math.max(4, requestedSize))))) : 32;
  const levels = [];
  let width = size, height = size, pixels = largeWorldSpatialPbrTexturePixels(material, meshId, lod, size, role);
  while (true) {
    levels.push({width, height, pixels});
    if (width === 1 && height === 1) break;
    const next = largeWorldSpatialDownsampleRgba8(pixels, width, height);
    width = next.width; height = next.height; pixels = next.pixels;
  }
  const colorSpace = role === 'normal' || role === 'metallic-roughness' ? 'linear' : 'srgb';
  const ktx2 = encodeKtx2Rgba8(levels, {colorSpace});
  return {
    width: size,
    height: size,
    pixels: [...levels[0].pixels],
    ktx2,
    profile,
    role,
    colorSpace,
    levelCount: levels.length,
    levels: levels.map((level, index) => ({level: index, width: level.width, height: level.height, byteLength: level.pixels.byteLength}))
  };
}

function largeWorldSpatialGlbTextureSet(material, meshId, lod, {profile, textureSize} = {}) {
  const roles = profile === LARGE_WORLD_SPATIAL_GLB_KTX2_PBR_TEXTURE_PROFILE ? ['base-color', 'normal', 'metallic-roughness', 'emissive'] : ['base-color'];
  return roles.map(role => largeWorldSpatialGlbTexture(material, meshId, lod, {profile, textureSize, role}));
}

function largeWorldSpatialTextureResidency(texture) {
  if (texture.profile !== LARGE_WORLD_SPATIAL_GLB_KTX2_TEXTURE_PROFILE && texture.profile !== LARGE_WORLD_SPATIAL_GLB_KTX2_PBR_TEXTURE_PROFILE) return undefined;
  return {
    format: LARGE_WORLD_SPATIAL_GLB_TEXTURE_RESIDENCY_PROFILE,
    mode: 'progressive-mip',
    ...(texture.profile === LARGE_WORLD_SPATIAL_GLB_KTX2_PBR_TEXTURE_PROFILE ? {map_role: texture.role ?? 'base-color'} : {}),
    initial_level: Math.min(2, Math.max(0, texture.levelCount - 1)),
    promotion: 'screen-coverage-and-distance',
    release: 'cell-unload-hysteresis',
    levels: texture.levels.map(level => ({...level, residency_tier: level.level === 0 ? 'vram' : 'ram'}))
  };
}

function largeWorldSpatialTextureResidencySet(textures) {
  const base = largeWorldSpatialTextureResidency(textures[0]);
  if (!base) return undefined;
  if (textures.length === 1 && textures[0].profile !== LARGE_WORLD_SPATIAL_GLB_KTX2_PBR_TEXTURE_PROFILE) return base;
  return {
    ...base,
    maps: textures.map(texture => ({map_role: texture.role ?? 'base-color', levels: texture.levels.map(level => ({...level, residency_tier: level.level === 0 ? 'vram' : 'ram'}))}))
  };
}

/**
 * Resolve a candidate mip residency plan from the explicit distance and
 * screen-coverage inputs. The plan is presentation evidence only: it does not
 * upload, evict, or mutate any canonical world state.
 */
export function resolveLargeWorldTextureResidency(textureResidency, input = {}) {
  const value = record(textureResidency), request = record(input), levels = Array.isArray(value.levels) ? value.levels.map(level => ({...level})).sort((a, b) => Number(a.level) - Number(b.level)) : [];
  fail(value.format === LARGE_WORLD_SPATIAL_GLB_TEXTURE_RESIDENCY_PROFILE, 'LARGE_WORLD_TEXTURE_RESIDENCY_PROFILE_INVALID');
  fail(levels.length > 0 && levels.every((level, index) => Number(level.level) === index && Number(level.width) >= 1 && Number(level.height) >= 1), 'LARGE_WORLD_TEXTURE_RESIDENCY_LEVELS_INVALID');
  const distance = Number.isFinite(Number(request.distance_m ?? request.distanceM)) ? Math.max(0, Number(request.distance_m ?? request.distanceM)) : 0;
  const coverage = Number.isFinite(Number(request.screen_coverage_percent ?? request.screenCoveragePercent)) ? Math.max(0, Math.min(100, Number(request.screen_coverage_percent ?? request.screenCoveragePercent))) : 100;
  const distanceLevel = distance <= 64 ? 0 : distance <= 192 ? 1 : 2;
  const coverageLevel = coverage >= 70 ? 0 : coverage >= 25 ? 1 : 2;
  const selectedLevel = Math.min(levels.length - 1, Math.max(distanceLevel, coverageLevel));
  const base = {
    format: LARGE_WORLD_TEXTURE_RESIDENCY_FORMAT,
    profile: value.format,
    distance_m: distance,
    screen_coverage_percent: coverage,
    selected_level: selectedLevel,
    resident_levels: [selectedLevel],
    prefetch_levels: levels.slice(selectedLevel + 1).map(level => level.level),
    deferred_levels: levels.slice(0, selectedLevel).map(level => level.level),
    policy: {promotion: value.promotion ?? 'screen-coverage-and-distance', release: value.release ?? 'cell-unload-hysteresis'},
    candidate_only: true,
    authoritative: false,
    canonical_write_authorized: false
  };
  return {...base, root: rootHash(base)};
}

export function verifyLargeWorldTextureResidency(receipt) {
  if (!receipt || typeof receipt !== 'object' || Array.isArray(receipt) || !hex64(receipt.root)) return false;
  const copy = clone(receipt), root = copy.root;
  delete copy.root;
  return rootHash(copy) === root && copy.format === LARGE_WORLD_TEXTURE_RESIDENCY_FORMAT && copy.candidate_only === true && copy.authoritative === false && copy.canonical_write_authorized === false;
}

/**
 * Lower one RNCS spatial mesh through the RAGF GLB encoder. This keeps the
 * large-world provider responsible for candidate materialization while the
 * reusable GLB container/validation semantics remain owned by RAGF.
 */
function largeWorldSpatialGlbForMesh(mesh, material, {lod, prototypeId, textureProfile = LARGE_WORLD_SPATIAL_GLB_TEXTURE_PROFILE, textureSize = 32}) {
  const source = largeWorldSpatialMeshForLod(mesh, lod);
  const positions = Array.isArray(source.positions) ? source.positions : [];
  const normals = Array.isArray(source.normals) && source.normals.length === positions.length ? source.normals : new Array(positions.length).fill(0);
  const uvs = Array.isArray(source.uvs) && source.uvs.length === positions.length / 3 * 2 ? source.uvs : new Array(positions.length / 3 * 2).fill(0);
  const indices = Array.isArray(source.indices) ? source.indices : [];
  fail(positions.length >= 9 && indices.length >= 3, `LARGE_WORLD_GLB_MESH_EMPTY:${mesh.id}`);
  const builder = new GlbBuilder();
  const bounds = minMax(positions, 3);
  const positionAccessor = builder.addAccessor(encodeFloat32(positions), {componentType: 5126, type: 'VEC3', count: positions.length / 3, target: 34962, min: bounds.min, max: bounds.max});
  const normalAccessor = builder.addAccessor(encodeFloat32(normals), {componentType: 5126, type: 'VEC3', count: normals.length / 3, target: 34962});
  const uvAccessor = builder.addAccessor(encodeFloat32(uvs), {componentType: 5126, type: 'VEC2', count: uvs.length / 2, target: 34962});
  const maximumIndex = indices.reduce((maximum, value) => Math.max(maximum, Number(value) || 0), 0);
  const indexComponentType = maximumIndex < 0x10000 ? 5123 : 5125;
  const indexAccessor = builder.addAccessor(indexComponentType === 5123 ? encodeUint16(indices) : encodeUint32(indices), {componentType: indexComponentType, type: 'SCALAR', count: indices.length, target: 34963, min: [0], max: [maximumIndex]});
  const textures = largeWorldSpatialGlbTextureSet(material, mesh.id, lod, {profile: textureProfile, textureSize});
  const texture = textures[0];
  const isKtx2 = texture.profile === LARGE_WORLD_SPATIAL_GLB_KTX2_TEXTURE_PROFILE || texture.profile === LARGE_WORLD_SPATIAL_GLB_KTX2_PBR_TEXTURE_PROFILE;
  const isPbr = texture.profile === LARGE_WORLD_SPATIAL_GLB_KTX2_PBR_TEXTURE_PROFILE;
  const imageBufferViews = textures.map(entry => builder.addBuffer(entry.png ?? entry.ktx2));
  const binary = builder.binary();
  const color = largeWorldSpatialColorRgba(material.baseColor, '#9ca3af');
  const emissive = largeWorldSpatialColorRgba(material.emissive, '#000000');
  const gltf = {
    asset: {version: '2.0', generator: LARGE_WORLD_SPATIAL_GLB_PROVIDER_ID},
    scene: 0,
    scenes: [{name: `${mesh.id}:lod${lod}`, nodes: [0]}],
    nodes: [{name: mesh.id, mesh: 0}],
    meshes: [{name: mesh.id, primitives: [{attributes: {POSITION: positionAccessor, NORMAL: normalAccessor, TEXCOORD_0: uvAccessor}, indices: indexAccessor, material: 0, mode: 4}]}],
    materials: [{
      name: String(material.id ?? 'material:large-world:default'),
      pbrMetallicRoughness: {
        baseColorFactor: color.map(entry => entry / 255),
        metallicFactor: Math.max(0, Math.min(1, Number(material.metallic ?? 0))),
        roughnessFactor: Math.max(0, Math.min(1, Number(material.roughness ?? .86))),
        baseColorTexture: {index: 0},
        ...(isPbr ? {metallicRoughnessTexture: {index: 2}} : {})
      },
      emissiveFactor: emissive.slice(0, 3).map(entry => entry / 255),
      ...(isPbr ? {normalTexture: {index: 1, scale: 1}, occlusionTexture: {index: 2, strength: .86}, emissiveTexture: {index: 3}} : {}),
      alphaMode: material.alphaMode === 'BLEND' || material.alphaMode === 'MASK' ? material.alphaMode : 'OPAQUE',
      alphaCutoff: Number.isFinite(Number(material.alphaCutoff)) ? Number(material.alphaCutoff) : .5,
      doubleSided: material.doubleSided !== false,
      extras: {provider_id: LARGE_WORLD_SPATIAL_GLB_PROVIDER_ID, prototype_id: prototypeId, lod}
    }],
    samplers: [{magFilter: 9729, minFilter: 9987, wrapS: 10497, wrapT: 10497}],
    ...(isKtx2 ? {extensionsUsed: ['KHR_texture_basisu']} : {}),
    images: textures.map((entry, index) => isKtx2
      ? {name: `${mesh.id}:${entry.role}`, mimeType: 'image/ktx2', bufferView: imageBufferViews[index], ...(isPbr ? {extras: {role: entry.role, color_space: entry.colorSpace}} : {})}
      : {name: `${mesh.id}:base-color`, mimeType: 'image/png', bufferView: imageBufferViews[index], extras: {vsrRGBA: {width: entry.width, height: entry.height, pixels: entry.pixels, colorSpace: 'srgb'}}}),
    textures: textures.map((entry, index) => isKtx2
      ? {sampler: 0, extensions: {KHR_texture_basisu: {source: index}}}
      : {sampler: 0, source: index}),
    buffers: [{byteLength: binary.length}],
    bufferViews: builder.bufferViews,
    accessors: builder.accessors,
    extras: {
      format: LARGE_WORLD_SPATIAL_GLB_MANIFEST_FORMAT,
      provider_id: LARGE_WORLD_SPATIAL_GLB_PROVIDER_ID,
      prototype_id: prototypeId,
      lod,
      texture_profile: texture.profile,
      texture_residency: largeWorldSpatialTextureResidencySet(textures),
      ragf: {encoder: 'GlbBuilder', index_accessor: indexAccessor, ...(isPbr ? {image_buffer_views: imageBufferViews} : {image_buffer_view: imageBufferViews[0]})}
    }
  };
  const glb = encodeGlb(gltf, binary);
  const inspection = inspectGlb(glb);
  fail(inspection.valid, `LARGE_WORLD_GLB_INVALID:${mesh.id}:lod${lod}:${inspection.errors.join(',')}`);
  return {gltf: inspection.json ?? gltf, bytes: new Uint8Array(glb), triangleCount: Math.floor(indices.length / 3), vertexCount: positions.length / 3, textureCount: textures.length, textureProfile: texture.profile, textureByteLength: textures.reduce((sum, entry) => sum + (entry.png ?? entry.ktx2).byteLength, 0), textureLevelCount: texture.levelCount, textureLevels: texture.levels, textureRoles: isPbr ? textures.map(entry => entry.role) : undefined, textureColorSpaces: isPbr ? textures.map(entry => entry.colorSpace ?? 'srgb') : undefined, textureResidency: gltf.extras.texture_residency, inspection};
}

function largeWorldSpatialRagfShowcase(scene, {variant = 'cinematic'} = {}) {
  const assetId = `asset:ragf:${scene.sceneId}:showcase`;
  const intent = normalizeIntent({
    description: `为大世界 ${scene.sceneId} 生成一个可观察的冰属性三维世界角色展示资产`,
    asset_kind: 'character-3d',
    seed: rootHash({scene_root: scene.scene_root, asset_id: assetId}),
    target_platforms: ['desktop', 'web'],
    required_outputs: ['mesh-glb'],
    constraints: {max_triangles: 2400, pbr_texture_size: 256, max_bones: 64, style: 'stylized-readable'},
    extensions: {asset_id: assetId}
  });
  const genome = deriveGenomeFromIntent(intent);
  const pbr = generatePbrTexturePack({genome, variant});
  const mesh = generateMesh3d({genome, variant, lod: 0, pbr});
  const inspection = inspectGlb(mesh.glb);
  fail(inspection.valid, `LARGE_WORLD_RAGF_SHOWCASE_GLB_INVALID:${inspection.errors.join(',')}`);
  return {assetId, variant, genome, pbr, mesh, inspection};
}

function largeWorldSpatialMeshCellIds(scene, meshId) {
  const nodeIds = new Set(scene.nodes.filter(node => node.meshId === meshId).map(node => node.id));
  return strings((scene.streaming?.cells ?? []).filter(cell => (cell.nodeIds ?? []).some(nodeId => nodeIds.has(nodeId))).map(cell => cell.id));
}

function largeWorldSpatialMeshPrototypeId(scene, meshId) {
  const node = scene.nodes.find(entry => entry.meshId === meshId && entry.prototypeId);
  return String(node?.prototypeId ?? `${LARGE_WORLD_SPATIAL_VISUAL_PROFILE}:mesh`);
}

function largeWorldSpatialGltfRecordView(record) {
  return {
    id: record.id,
    uri: record.uri,
    format: record.format ?? null,
    sha256: record.sha256,
    byteLength: record.byteLength,
    kind: record.kind,
    dependencies: strings(record.dependencies),
    cellIds: strings(record.cellIds),
    priority: Number(record.priority ?? 0),
    metadata: record.metadata ?? null
  };
}

/**
 * Materialize the deterministic spatial meshes in a VSR-compatible glTF
 * candidate bundle. The bundle is a provider artifact: it never changes the
 * RNCS scene root or grants a provider authority over world truth.
 */
export function createLargeWorldSpatialGltfBundle(scene, input = {}) {
  const value = record(input);
  const sceneVerification = verifyLargeWorldSpatialScene(scene);
  fail(sceneVerification.valid, `LARGE_WORLD_GLTF_SCENE_INVALID:${sceneVerification.errors.join(',')}`);
  const levels = [0, 1, 2];
  const meshEntries = [...new Map((scene.meshes ?? []).map(mesh => [mesh.id, mesh])).values()].sort((a, b) => keySort(a.id, b.id));
  fail(meshEntries.length > 0, 'LARGE_WORLD_GLTF_MESHES_REQUIRED');
  const assets = [];
  const cellAssetIndex = {};
  const providerId = String(value.providerId ?? value.provider_id ?? LARGE_WORLD_SPATIAL_GLTF_PROVIDER_ID);
  for (const mesh of meshEntries) {
    const material = largeWorldSpatialMaterialForMesh(scene, mesh.id);
    const prototypeId = largeWorldSpatialMeshPrototypeId(scene, mesh.id);
    const cellIds = largeWorldSpatialMeshCellIds(scene, mesh.id);
    for (const lod of levels) {
      const generated = largeWorldSpatialGltfForMesh(mesh, material, {lod, prototypeId});
      const assetId = `asset:gltf:${scene.sceneId}:${mesh.id}:lod${lod}`;
      const recordValue = {
        id: assetId,
        uri: `rncs+gltf://${encodeURIComponent(scene.sceneId)}/${encodeURIComponent(mesh.id)}/lod${lod}.gltf`,
        format: 'model/gltf+json',
        sha256: largeWorldSpatialSha256(generated.bytes),
        byteLength: generated.bytes.byteLength,
        kind: 'mesh',
        cellIds,
        priority: lod === 0 ? 100 : lod === 1 ? 50 : 10,
        metadata: {
          provider_id: providerId,
          source_scene_root: scene.scene_root,
          source_mesh_id: mesh.id,
          prototype_id: prototypeId,
          lod,
          triangle_count: generated.triangleCount,
          texture_count: generated.textureCount,
          texture_profile: LARGE_WORLD_SPATIAL_GLTF_TEXTURE_PROFILE,
          candidate_only: true,
          authoritative: false
        }
      };
      assets.push({record: recordValue, gltf: generated.gltf, payload: generated.bytes});
      for (const cellId of cellIds) (cellAssetIndex[cellId] ??= []).push(assetId);
    }
  }
  assets.sort((a, b) => keySort(a.record.id, b.record.id));
  for (const ids of Object.values(cellAssetIndex)) ids.sort(keySort);
  const lodPolicy = [
    {lod: 0, max_distance_m: 64, screen_coverage_percent: 100, geometric_error_mm: 0},
    {lod: 1, max_distance_m: 192, screen_coverage_percent: 45, geometric_error_mm: 18},
    {lod: 2, max_distance_m: 512, screen_coverage_percent: 16, geometric_error_mm: 55}
  ];
  const manifestBase = {
    format: LARGE_WORLD_SPATIAL_GLTF_MANIFEST_FORMAT,
    version: '0.1.0',
    scene_id: String(scene.sceneId),
    scene_root: String(scene.scene_root),
    source_reality_root: String(scene.reality?.realityRoot ?? ''),
    provider_id: providerId,
    visual_prototype_profile: String(scene.large_world.visual_prototype_profile),
    mesh_count: meshEntries.length,
    lod_level_count: levels.length,
    asset_count: assets.length,
    texture_count: assets.reduce((sum, entry) => sum + Number(entry.record.metadata.texture_count ?? 0), 0),
    texture_profile: LARGE_WORLD_SPATIAL_GLTF_TEXTURE_PROFILE,
    lod_policy: lodPolicy,
    asset_ids: assets.map(entry => entry.record.id),
    cell_asset_index: cellAssetIndex,
    candidate_only: true,
    authoritative: false,
    canonical_write_authorized: false,
    authority: {provider_can_write_authoritative_world_state: false, rncs_authority_required: true}
  };
  const manifest = {...manifestBase, manifest_root: rootHash(manifestBase)};
  const bundleBase = {
    format: LARGE_WORLD_SPATIAL_GLTF_BUNDLE_FORMAT,
    version: '0.1.0',
    manifest_root: manifest.manifest_root,
    assets: assets.map(entry => largeWorldSpatialGltfRecordView(entry.record))
  };
  return {
    format: LARGE_WORLD_SPATIAL_GLTF_BUNDLE_FORMAT,
    version: '0.1.0',
    manifest,
    assets,
    bundle_root: rootHash(bundleBase)
  };
}

export function verifyLargeWorldSpatialGltfBundle(bundle, input = {}) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!bundle || typeof bundle !== 'object' || Array.isArray(bundle)) return {valid: false, errors: ['LARGE_WORLD_GLTF_BUNDLE_NOT_OBJECT']};
  try {
    check(bundle.format === LARGE_WORLD_SPATIAL_GLTF_BUNDLE_FORMAT, 'LARGE_WORLD_GLTF_BUNDLE_FORMAT_INVALID');
    check(bundle.version === '0.1.0', 'LARGE_WORLD_GLTF_BUNDLE_VERSION_INVALID');
    const manifest = bundle.manifest;
    check(manifest?.format === LARGE_WORLD_SPATIAL_GLTF_MANIFEST_FORMAT, 'LARGE_WORLD_GLTF_MANIFEST_FORMAT_INVALID');
    check(manifest?.candidate_only === true && manifest?.authoritative === false && manifest?.canonical_write_authorized === false, 'LARGE_WORLD_GLTF_AUTHORITY_INVALID');
    const manifestCopy = clone(manifest ?? {});
    const manifestRoot = manifestCopy.manifest_root;
    delete manifestCopy.manifest_root;
    check(hex64(manifestRoot) && rootHash(manifestCopy) === manifestRoot, 'LARGE_WORLD_GLTF_MANIFEST_ROOT_MISMATCH');
    if (input.sceneRoot !== undefined) check(manifest?.scene_root === input.sceneRoot, 'LARGE_WORLD_GLTF_SCENE_ROOT_MISMATCH');
    const entries = Array.isArray(bundle.assets) ? bundle.assets : [];
    const ids = entries.map(entry => entry?.record?.id).sort(keySort);
    check(ids.length === entries.length && new Set(ids).size === ids.length, 'LARGE_WORLD_GLTF_ASSET_IDS_INVALID');
    check(JSON.stringify(ids) === JSON.stringify([...(manifest?.asset_ids ?? [])].sort(keySort)), 'LARGE_WORLD_GLTF_ASSET_INDEX_MISMATCH');
    for (const entry of entries) {
      const asset = entry?.record;
      const payload = entry?.payload;
      check(asset && typeof asset.id === 'string' && asset.format === 'model/gltf+json' && asset.kind === 'mesh', `LARGE_WORLD_GLTF_ASSET_RECORD_INVALID:${asset?.id ?? 'unknown'}`);
      check(payload instanceof Uint8Array, `LARGE_WORLD_GLTF_ASSET_PAYLOAD_INVALID:${asset?.id ?? 'unknown'}`);
      if (!(payload instanceof Uint8Array)) continue;
      check(asset.byteLength === payload.byteLength, `LARGE_WORLD_GLTF_ASSET_LENGTH_MISMATCH:${asset.id}`);
      check(typeof asset.sha256 === 'string' && asset.sha256 === largeWorldSpatialSha256(payload), `LARGE_WORLD_GLTF_ASSET_HASH_MISMATCH:${asset.id}`);
      let gltf;
      try { gltf = JSON.parse(new TextDecoder().decode(payload)); } catch { check(false, `LARGE_WORLD_GLTF_JSON_INVALID:${asset.id}`); continue; }
      check(gltf?.asset?.version === '2.0', `LARGE_WORLD_GLTF_VERSION_INVALID:${asset.id}`);
      const bufferUri = gltf?.buffers?.[0]?.uri;
      const match = typeof bufferUri === 'string' ? /^data:application\/octet-stream;base64,(.*)$/s.exec(bufferUri) : null;
      check(Boolean(match), `LARGE_WORLD_GLTF_BUFFER_URI_INVALID:${asset.id}`);
      if (match) check(Number(gltf.buffers[0].byteLength) === Buffer.from(match[1], 'base64').byteLength, `LARGE_WORLD_GLTF_BUFFER_LENGTH_INVALID:${asset.id}`);
      const triangleCount = (gltf?.accessors?.[3]?.count ?? 0) / 3;
      check(Number.isInteger(triangleCount) && triangleCount === Number(asset.metadata?.triangle_count), `LARGE_WORLD_GLTF_TRIANGLE_COUNT_INVALID:${asset.id}`);
      check(gltf?.textures?.length === 1 && gltf?.images?.[0]?.extras?.vsrRGBA, `LARGE_WORLD_GLTF_TEXTURE_CHANNEL_MISSING:${asset.id}`);
    }
    const bundleBase = {
      format: LARGE_WORLD_SPATIAL_GLTF_BUNDLE_FORMAT,
      version: '0.1.0',
      manifest_root: manifest?.manifest_root,
      assets: entries.map(entry => largeWorldSpatialGltfRecordView(entry.record)).sort((a, b) => keySort(a.id, b.id))
    };
    check(hex64(bundle.bundle_root) && rootHash(bundleBase) === bundle.bundle_root, 'LARGE_WORLD_GLTF_BUNDLE_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`LARGE_WORLD_GLTF_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, bundle_root: bundle?.bundle_root ?? null, manifest_root: bundle?.manifest?.manifest_root ?? null};
}

/**
 * Materialize the same spatial meshes as binary glTF 2.0 assets. Geometry and
 * container encoding are delegated to the reusable RAGF GLB builder; this
 * bundle remains candidate-only and is indexed by RNCS streaming cells.
 */
export function createLargeWorldSpatialGlbBundle(scene, input = {}) {
  const value = record(input);
  const sceneVerification = verifyLargeWorldSpatialScene(scene);
  fail(sceneVerification.valid, `LARGE_WORLD_GLB_SCENE_INVALID:${sceneVerification.errors.join(',')}`);
  const levels = [0, 1, 2];
  const meshEntries = [...new Map((scene.meshes ?? []).map(mesh => [mesh.id, mesh])).values()].sort((a, b) => keySort(a.id, b.id));
  fail(meshEntries.length > 0, 'LARGE_WORLD_GLB_MESHES_REQUIRED');
  const assets = [];
  const cellAssetIndex = {};
  const providerId = String(value.providerId ?? value.provider_id ?? LARGE_WORLD_SPATIAL_GLB_PROVIDER_ID);
  const textureProfile = String(value.textureProfile ?? value.texture_profile ?? LARGE_WORLD_SPATIAL_GLB_TEXTURE_PROFILE);
  fail(textureProfile === LARGE_WORLD_SPATIAL_GLB_TEXTURE_PROFILE || textureProfile === LARGE_WORLD_SPATIAL_GLB_KTX2_TEXTURE_PROFILE || textureProfile === LARGE_WORLD_SPATIAL_GLB_KTX2_PBR_TEXTURE_PROFILE, `LARGE_WORLD_GLB_TEXTURE_PROFILE_UNSUPPORTED:${textureProfile}`);
  const textureSize = value.textureSize ?? value.texture_size ?? 32;
  for (const mesh of meshEntries) {
    const material = largeWorldSpatialMaterialForMesh(scene, mesh.id);
    const prototypeId = largeWorldSpatialMeshPrototypeId(scene, mesh.id);
    const cellIds = largeWorldSpatialMeshCellIds(scene, mesh.id);
    for (const lod of levels) {
      const generated = largeWorldSpatialGlbForMesh(mesh, material, {lod, prototypeId, textureProfile, textureSize});
      const assetId = `asset:glb:${scene.sceneId}:${mesh.id}:lod${lod}`;
      const recordValue = {
        id: assetId,
        uri: `rncs+glb://${encodeURIComponent(scene.sceneId)}/${encodeURIComponent(mesh.id)}/lod${lod}.glb`,
        format: 'model/gltf-binary',
        sha256: largeWorldSpatialSha256(generated.bytes),
        byteLength: generated.bytes.byteLength,
        kind: 'mesh',
        cellIds,
        priority: lod === 0 ? 100 : lod === 1 ? 50 : 10,
        metadata: {
          provider_id: providerId,
          source_scene_root: scene.scene_root,
          source_mesh_id: mesh.id,
          prototype_id: prototypeId,
          lod,
          vertex_count: generated.vertexCount,
          triangle_count: generated.triangleCount,
          texture_count: generated.textureCount,
          texture_profile: generated.textureProfile,
          ...(generated.textureProfile === LARGE_WORLD_SPATIAL_GLB_KTX2_TEXTURE_PROFILE || generated.textureProfile === LARGE_WORLD_SPATIAL_GLB_KTX2_PBR_TEXTURE_PROFILE ? {
            texture_residency: generated.textureResidency
          } : {}),
          texture_byte_length: generated.textureByteLength,
          texture_level_count: generated.textureLevelCount,
          ...(generated.textureRoles?.length ? {texture_roles: generated.textureRoles} : {}),
          ...(generated.textureColorSpaces?.length ? {texture_color_spaces: generated.textureColorSpaces} : {}),
          encoder: 'ragf.glb-builder.v0.1',
          candidate_only: true,
          authoritative: false
        }
      };
      assets.push({record: recordValue, gltf: generated.gltf, payload: generated.bytes});
      for (const cellId of cellIds) (cellAssetIndex[cellId] ??= []).push(assetId);
    }
  }
  let providerAssetCount = 0;
  if (value.includeRagfShowcase === true || value.include_ragf_showcase === true) {
    const showcase = largeWorldSpatialRagfShowcase(scene, {variant: String(value.showcaseVariant ?? value.showcase_variant ?? 'cinematic')});
    const payload = new Uint8Array(showcase.mesh.glb);
    const recordValue = {
      id: showcase.assetId,
      uri: `rncs+glb://${encodeURIComponent(scene.sceneId)}/ragf-showcase/${showcase.variant}.glb`,
      format: 'model/gltf-binary',
      sha256: largeWorldSpatialSha256(payload),
      byteLength: payload.byteLength,
      kind: 'mesh',
      cellIds: [],
      priority: 200,
      metadata: {
        provider_id: providerId,
        source_provider_id: 'provider:taowind:procedural-3d',
        source_scene_root: scene.scene_root,
        source_mesh_id: showcase.assetId,
        prototype_id: 'prototype:ragf:character-showcase',
        asset_role: 'ragf-showcase',
        variant: showcase.variant,
        genome_root: showcase.genome.genome_root,
        lod: 0,
        vertex_count: showcase.mesh.metadata.vertex_count,
        triangle_count: showcase.mesh.metadata.triangle_count,
        texture_count: showcase.mesh.metadata.embedded_texture_count,
        texture_profile: 'ragf.pbr-embedded.v0.4',
        encoder: 'ragf.procedural-3d.v0.4',
        candidate_only: true,
        authoritative: false
      }
    };
    assets.push({record: recordValue, gltf: showcase.inspection.json ?? {}, payload});
    providerAssetCount = 1;
  }
  assets.sort((a, b) => keySort(a.record.id, b.record.id));
  for (const ids of Object.values(cellAssetIndex)) ids.sort(keySort);
  const lodPolicy = [
    {lod: 0, max_distance_m: 64, screen_coverage_percent: 100, geometric_error_mm: 0},
    {lod: 1, max_distance_m: 192, screen_coverage_percent: 45, geometric_error_mm: 18},
    {lod: 2, max_distance_m: 512, screen_coverage_percent: 16, geometric_error_mm: 55}
  ];
  const manifestBase = {
    format: LARGE_WORLD_SPATIAL_GLB_MANIFEST_FORMAT,
    version: '0.1.0',
    scene_id: String(scene.sceneId),
    scene_root: String(scene.scene_root),
    source_reality_root: String(scene.reality?.realityRoot ?? ''),
    provider_id: providerId,
    encoder_provider_id: LARGE_WORLD_SPATIAL_GLB_PROVIDER_ID,
    provider_asset_count: providerAssetCount,
    visual_prototype_profile: String(scene.large_world.visual_prototype_profile),
    mesh_count: meshEntries.length,
    lod_level_count: levels.length,
    asset_count: assets.length,
    texture_count: assets.reduce((sum, entry) => sum + Number(entry.record.metadata.texture_count ?? 0), 0),
    texture_profile: textureProfile,
    ...(textureProfile === LARGE_WORLD_SPATIAL_GLB_KTX2_TEXTURE_PROFILE || textureProfile === LARGE_WORLD_SPATIAL_GLB_KTX2_PBR_TEXTURE_PROFILE ? {texture_residency_profile: LARGE_WORLD_SPATIAL_GLB_TEXTURE_RESIDENCY_PROFILE} : {}),
    lod_policy: lodPolicy,
    asset_ids: assets.map(entry => entry.record.id),
    cell_asset_index: cellAssetIndex,
    candidate_only: true,
    authoritative: false,
    canonical_write_authorized: false,
    authority: {provider_can_write_authoritative_world_state: false, rncs_authority_required: true}
  };
  const manifest = {...manifestBase, manifest_root: rootHash(manifestBase)};
  const bundleBase = {
    format: LARGE_WORLD_SPATIAL_GLB_BUNDLE_FORMAT,
    version: '0.1.0',
    manifest_root: manifest.manifest_root,
    assets: assets.map(entry => largeWorldSpatialGltfRecordView(entry.record))
  };
  return {format: LARGE_WORLD_SPATIAL_GLB_BUNDLE_FORMAT, version: '0.1.0', manifest, assets, bundle_root: rootHash(bundleBase)};
}

function largeWorldSpatialGlbBinaryChunk(payload) {
  const bytes = Buffer.from(payload);
  if (bytes.length < 20 || bytes.readUInt32LE(0) !== 0x46546c67) return null;
  const declaredLength = bytes.readUInt32LE(8);
  if (declaredLength !== bytes.length) return null;
  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const length = bytes.readUInt32LE(offset), type = bytes.readUInt32LE(offset + 4), start = offset + 8, end = start + length;
    if (end > bytes.length) return null;
    if (type === 0x004e4942) return bytes.subarray(start, end);
    offset = end;
  }
  return null;
}

function largeWorldSpatialGlbImageBytes(payload, gltf, image) {
  const binary = largeWorldSpatialGlbBinaryChunk(payload), view = Number.isInteger(image?.bufferView) ? gltf?.bufferViews?.[image.bufferView] : null;
  if (!binary || !view || Number(view.buffer ?? 0) !== 0) return null;
  const start = Number(view.byteOffset ?? 0), end = start + Number(view.byteLength ?? 0);
  return Number.isInteger(start) && Number.isInteger(end) && start >= 0 && end <= binary.length ? binary.subarray(start, end) : null;
}

export function verifyLargeWorldSpatialGlbBundle(bundle, input = {}) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!bundle || typeof bundle !== 'object' || Array.isArray(bundle)) return {valid: false, errors: ['LARGE_WORLD_GLB_BUNDLE_NOT_OBJECT']};
  try {
    check(bundle.format === LARGE_WORLD_SPATIAL_GLB_BUNDLE_FORMAT, 'LARGE_WORLD_GLB_BUNDLE_FORMAT_INVALID');
    check(bundle.version === '0.1.0', 'LARGE_WORLD_GLB_BUNDLE_VERSION_INVALID');
    const manifest = bundle.manifest;
    check(manifest?.format === LARGE_WORLD_SPATIAL_GLB_MANIFEST_FORMAT, 'LARGE_WORLD_GLB_MANIFEST_FORMAT_INVALID');
    check(manifest?.candidate_only === true && manifest?.authoritative === false && manifest?.canonical_write_authorized === false, 'LARGE_WORLD_GLB_AUTHORITY_INVALID');
    const manifestCopy = clone(manifest ?? {});
    const manifestRoot = manifestCopy.manifest_root;
    delete manifestCopy.manifest_root;
    check(hex64(manifestRoot) && rootHash(manifestCopy) === manifestRoot, 'LARGE_WORLD_GLB_MANIFEST_ROOT_MISMATCH');
    if (input.sceneRoot !== undefined) check(manifest?.scene_root === input.sceneRoot, 'LARGE_WORLD_GLB_SCENE_ROOT_MISMATCH');
    const entries = Array.isArray(bundle.assets) ? bundle.assets : [];
    const ids = entries.map(entry => entry?.record?.id).sort(keySort);
    check(ids.length === entries.length && new Set(ids).size === ids.length, 'LARGE_WORLD_GLB_ASSET_IDS_INVALID');
    check(JSON.stringify(ids) === JSON.stringify([...(manifest?.asset_ids ?? [])].sort(keySort)), 'LARGE_WORLD_GLB_ASSET_INDEX_MISMATCH');
    check(Number(manifest?.provider_asset_count ?? 0) === entries.filter(entry => entry?.record?.metadata?.asset_role === 'ragf-showcase').length, 'LARGE_WORLD_GLB_PROVIDER_ASSET_COUNT_INVALID');
    for (const entry of entries) {
      const asset = entry?.record;
      const payload = entry?.payload;
      check(asset && typeof asset.id === 'string' && asset.format === 'model/gltf-binary' && asset.kind === 'mesh', `LARGE_WORLD_GLB_ASSET_RECORD_INVALID:${asset?.id ?? 'unknown'}`);
      check(payload instanceof Uint8Array, `LARGE_WORLD_GLB_ASSET_PAYLOAD_INVALID:${asset?.id ?? 'unknown'}`);
      if (!(payload instanceof Uint8Array)) continue;
      check(asset.byteLength === payload.byteLength, `LARGE_WORLD_GLB_ASSET_LENGTH_MISMATCH:${asset.id}`);
      check(typeof asset.sha256 === 'string' && asset.sha256 === largeWorldSpatialSha256(payload), `LARGE_WORLD_GLB_ASSET_HASH_MISMATCH:${asset.id}`);
      let inspection;
      try { inspection = inspectGlb(Buffer.from(payload)); } catch (error) { check(false, `LARGE_WORLD_GLB_PARSE_FAILED:${asset.id}:${error.message}`); continue; }
      check(inspection.valid, `LARGE_WORLD_GLB_INVALID:${asset.id}`);
      const gltf = inspection.json ?? {};
      const isRagfShowcase = asset.metadata?.asset_role === 'ragf-showcase';
      check(gltf?.asset?.version === '2.0', `LARGE_WORLD_GLB_VERSION_INVALID:${asset.id}`);
      check(isRagfShowcase ? String(gltf?.asset?.generator ?? '').includes('RAGF') : gltf?.asset?.generator === LARGE_WORLD_SPATIAL_GLB_PROVIDER_ID, `LARGE_WORLD_GLB_GENERATOR_INVALID:${asset.id}`);
      const indexAccessor = Number(gltf?.meshes?.[0]?.primitives?.[0]?.indices ?? gltf?.extras?.ragf?.index_accessor ?? 3);
      const triangleCount = (gltf?.accessors?.[indexAccessor]?.count ?? 0) / 3;
      check(Number.isInteger(triangleCount) && triangleCount === Number(asset.metadata?.triangle_count), `LARGE_WORLD_GLB_TRIANGLE_COUNT_INVALID:${asset.id}`);
      const images = Array.isArray(gltf?.images) ? gltf.images : [];
      const textureProfile = String(asset.metadata?.texture_profile ?? gltf?.extras?.texture_profile ?? '');
      const isPbr = textureProfile === LARGE_WORLD_SPATIAL_GLB_KTX2_PBR_TEXTURE_PROFILE;
      const isKtx2 = textureProfile === LARGE_WORLD_SPATIAL_GLB_KTX2_TEXTURE_PROFILE || isPbr;
      const expectedTextureCount = isRagfShowcase ? 4 : isPbr ? 4 : 1;
      check(gltf?.textures?.length === expectedTextureCount, `LARGE_WORLD_GLB_TEXTURE_COUNT_INVALID:${asset.id}`);
      check(images.length === expectedTextureCount, `LARGE_WORLD_GLB_TEXTURE_CHANNEL_MISSING:${asset.id}`);
      if (!isRagfShowcase && !isKtx2) check(textureProfile === LARGE_WORLD_SPATIAL_GLB_TEXTURE_PROFILE, `LARGE_WORLD_GLB_TEXTURE_PROFILE_INVALID:${asset.id}`);
      if (isKtx2) {
        check(gltf?.extensionsUsed?.includes('KHR_texture_basisu'), `LARGE_WORLD_GLB_KTX2_EXTENSION_MISSING:${asset.id}`);
        let inspectedLevelCount = 0;
        for (let imageIndex = 0; imageIndex < images.length; imageIndex++) {
          check(gltf?.textures?.[imageIndex]?.extensions?.KHR_texture_basisu?.source === imageIndex, `LARGE_WORLD_GLB_KTX2_SOURCE_INVALID:${asset.id}:${imageIndex}`);
          check(images[imageIndex]?.mimeType === 'image/ktx2', `LARGE_WORLD_GLB_KTX2_MIME_INVALID:${asset.id}:${imageIndex}`);
          const ktx2 = largeWorldSpatialGlbImageBytes(payload, gltf, images[imageIndex]);
          const inspection = ktx2 ? inspectKtx2(ktx2) : {valid: false, errors: ['KTX2_IMAGE_BYTES_MISSING']};
          check(inspection.valid, `LARGE_WORLD_GLB_KTX2_INVALID:${asset.id}:${imageIndex}`);
          const expectedColorSpace = isPbr && ['normal', 'metallic-roughness'].includes(images[imageIndex]?.extras?.role) ? 'linear' : 'srgb';
          check(inspection.color_space === expectedColorSpace, `LARGE_WORLD_GLB_KTX2_COLOR_SPACE_INVALID:${asset.id}:${imageIndex}`);
          inspectedLevelCount = Number(inspection.level_count ?? inspectedLevelCount);
          check(Number(asset.metadata?.texture_level_count) === Number(inspection.level_count), `LARGE_WORLD_GLB_KTX2_LEVEL_COUNT_INVALID:${asset.id}:${imageIndex}`);
        }
        if (isPbr) {
          check(JSON.stringify(asset.metadata?.texture_roles ?? []) === JSON.stringify(['base-color', 'normal', 'metallic-roughness', 'emissive']), `LARGE_WORLD_GLB_PBR_TEXTURE_ROLES_INVALID:${asset.id}`);
          check(Array.isArray(gltf?.extras?.texture_residency?.maps) && gltf.extras.texture_residency.maps.length === 4, `LARGE_WORLD_GLB_PBR_RESIDENCY_MAPS_INVALID:${asset.id}`);
          const pbr = gltf?.materials?.[0]?.pbrMetallicRoughness ?? {}, material = gltf?.materials?.[0] ?? {};
          check(pbr.baseColorTexture?.index === 0 && pbr.metallicRoughnessTexture?.index === 2 && material.normalTexture?.index === 1 && material.occlusionTexture?.index === 2 && material.emissiveTexture?.index === 3, `LARGE_WORLD_GLB_PBR_BINDINGS_INVALID:${asset.id}`);
        }
        check(gltf?.extras?.texture_residency?.format === LARGE_WORLD_SPATIAL_GLB_TEXTURE_RESIDENCY_PROFILE, `LARGE_WORLD_GLB_TEXTURE_RESIDENCY_INVALID:${asset.id}`);
        check(Array.isArray(gltf?.extras?.texture_residency?.levels) && gltf.extras.texture_residency.levels.length === inspectedLevelCount, `LARGE_WORLD_GLB_TEXTURE_RESIDENCY_LEVELS_INVALID:${asset.id}`);
      }
      for (const image of images) {
        check(isKtx2 ? image?.mimeType === 'image/ktx2' : image?.mimeType === 'image/png', `LARGE_WORLD_GLB_TEXTURE_MIME_INVALID:${asset.id}`);
        if (!isRagfShowcase && !isKtx2) check(Boolean(image?.extras?.vsrRGBA), `LARGE_WORLD_GLB_TEXTURE_RGBA_MISSING:${asset.id}`);
        const imageView = Number.isInteger(image?.bufferView) ? gltf?.bufferViews?.[image.bufferView] : null;
        check(Boolean(imageView && imageView.byteLength > 0), `LARGE_WORLD_GLB_TEXTURE_BUFFER_MISSING:${asset.id}`);
      }
    }
    const bundleBase = {
      format: LARGE_WORLD_SPATIAL_GLB_BUNDLE_FORMAT,
      version: '0.1.0',
      manifest_root: manifest?.manifest_root,
      assets: entries.map(entry => largeWorldSpatialGltfRecordView(entry.record)).sort((a, b) => keySort(a.id, b.id))
    };
    check(hex64(bundle.bundle_root) && rootHash(bundleBase) === bundle.bundle_root, 'LARGE_WORLD_GLB_BUNDLE_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`LARGE_WORLD_GLB_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, bundle_root: bundle?.bundle_root ?? null, manifest_root: bundle?.manifest?.manifest_root ?? null};
}

/**
 * Lower an RNCS active chunk selection envelope into the VSR spatial-scene
 * contract. This is a projection/lowering artifact only: world truth remains
 * owned by RNCS and every selected representation stays candidate-only.
 */
export function createLargeWorldSpatialScene(input = {}) {
  const value = record(input);
  const region = clone(value.region ?? {});
  const regionVerification = verifyRegion(region);
  fail(regionVerification.valid, `LARGE_WORLD_SPATIAL_REGION_INVALID:${regionVerification.errors.join(',')}`);
  const selection = clone(value.selection ?? value.selectionEnvelope ?? value.selection_envelope ?? null);
  const selectionVerification = verifyPortfolioSelectionEnvelope(selection);
  fail(selectionVerification.valid, `LARGE_WORLD_SPATIAL_SELECTION_INVALID:${selectionVerification.errors.join(',')}`);
  fail(selection.world_id === region.world_id && selection.region_root === region.region_root && selection.world_root === region.world_root, 'LARGE_WORLD_SPATIAL_SELECTION_REGION_MISMATCH');
  const activeChunkIds = new Set(selection.active_chunk_ids);
  const sourceChunks = Array.isArray(value.chunks) ? value.chunks : region.chunks.filter(chunk => activeChunkIds.has(chunk.chunk_id));
  const chunks = sourceChunks.map(clone).sort((a, b) => keySort(a.chunk_id, b.chunk_id));
  const rows = new Map(selection.selections.map(row => [row.chunk_id, row]));
  fail(chunks.length > 0, 'LARGE_WORLD_SPATIAL_CHUNKS_REQUIRED');
  fail(chunks.length === selection.active_chunk_ids.length, 'LARGE_WORLD_SPATIAL_CHUNK_COUNT_MISMATCH');
  for (const chunk of chunks) {
    fail(verifyChunk(chunk).valid, `LARGE_WORLD_SPATIAL_CHUNK_INVALID:${chunk.chunk_id}`);
    fail(selection.active_chunk_ids.includes(chunk.chunk_id), `LARGE_WORLD_SPATIAL_CHUNK_NOT_SELECTED:${chunk.chunk_id}`);
    fail(rows.has(chunk.chunk_id), `LARGE_WORLD_SPATIAL_SELECTION_ROW_MISSING:${chunk.chunk_id}`);
  }

  const meshes = [largeWorldSpatialCubeMesh()], materials = [], nodes = [], cells = [], assets = [];
  const materialIds = new Set();
  const meshIds = new Set(meshes.map(mesh => mesh.id));
  const visualPrototypeIds = new Set();
  const addMaterial = (material) => {
    if (!materialIds.has(material.id)) {
      materialIds.add(material.id);
      materials.push(material);
    }
    return material.id;
  };
  const addMesh = (mesh) => {
    if (!meshIds.has(mesh.id)) {
      meshIds.add(mesh.id);
      meshes.push(mesh);
    }
    return mesh.id;
  };
  const structureVisuals = new Map();
  const resourceVisuals = new Map();
  const activeQualityProfiles = new Set(selection.selections.map(row => String(row.selected_quality_profile ?? '').toUpperCase()));
  const sceneLightingQuality = activeQualityProfiles.has('CINEMATIC')
    ? 'CINEMATIC'
    : activeQualityProfiles.has('STANDARD')
      ? 'STANDARD'
      : activeQualityProfiles.has('MOBILE')
        ? 'MOBILE'
        : 'PROXY';
  const ensureStructureVisual = (kind, qualityProfile) => {
    const normalizedKind = String(kind ?? 'unknown').toLowerCase();
    const quality = String(qualityProfile).toUpperCase();
    const key = `${quality}:${normalizedKind}`;
    const existing = structureVisuals.get(key);
    if (existing) return existing;
    const prototype = largeWorldSpatialPrototype(normalizedKind, quality);
    const meshId = addMesh(prototype.mesh);
    visualPrototypeIds.add(prototype.prototypeId);
    const materialId = addMaterial({
      id: `material:structure:${quality.toLowerCase()}:${normalizedKind}`,
      baseColor: largeWorldSpatialColor(
        LARGE_WORLD_SPATIAL_STRUCTURE_COLORS,
        normalizedKind,
        quality === 'PROXY' ? '#b7791f' : quality === 'CINEMATIC' ? '#ffd18a' : quality === 'MOBILE' ? '#d69a4a' : '#f6ad55'
      ),
      roughness: quality === 'PROXY' ? .92 : quality === 'MOBILE' ? .72 : quality === 'CINEMATIC' ? (normalizedKind === 'shrine' ? .24 : .42) : normalizedKind === 'shrine' ? .34 : .58,
      metallic: quality === 'PROXY' ? .05 : quality === 'MOBILE' ? .1 : quality === 'CINEMATIC' ? (normalizedKind === 'watchtower' ? .28 : .12) : normalizedKind === 'watchtower' ? .18 : .08,
      emissive: quality === 'CINEMATIC' && normalizedKind === 'shrine' ? '#d8b4fe' : undefined,
      emissiveStrength: quality === 'CINEMATIC' && normalizedKind === 'shrine' ? .22 : 0,
      doubleSided: true
    });
    const value = {meshId, materialId, prototypeId: prototype.prototypeId};
    structureVisuals.set(key, value);
    return value;
  };
  const ensureResourceVisual = (kind, qualityProfile) => {
    const normalizedKind = String(kind ?? 'water').toLowerCase();
    const quality = String(qualityProfile).toUpperCase();
    const key = `${quality}:${normalizedKind}`;
    const existing = resourceVisuals.get(key);
    if (existing) return existing;
    const prototype = largeWorldSpatialResourcePrototype(normalizedKind, quality);
    const meshId = addMesh(prototype.mesh);
    visualPrototypeIds.add(prototype.prototypeId);
    const value = {meshId, prototypeId: prototype.prototypeId};
    resourceVisuals.set(key, value);
    return value;
  };
  const presentationScale = Number(value.visualScale ?? value.visual_scale ?? 1);
  fail(Number.isFinite(presentationScale) && presentationScale >= .25 && presentationScale <= 8, 'LARGE_WORLD_SPATIAL_PRESENTATION_SCALE_INVALID');
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity, maxY = -Infinity;
  for (const chunk of chunks) {
    const selectionRow = rows.get(chunk.chunk_id);
    const qualityProfile = String(selectionRow.selected_quality_profile ?? '').toUpperCase();
    fail(LARGE_WORLD_SPATIAL_QUALITY_PROFILES.includes(qualityProfile), `LARGE_WORLD_SPATIAL_QUALITY_INVALID:${chunk.chunk_id}`);
    fail(typeof selectionRow.selected_slot_id === 'string' && selectionRow.selected_slot_id.length > 0, `LARGE_WORLD_SPATIAL_SLOT_REQUIRED:${chunk.chunk_id}`);
    const mesh = largeWorldSpatialTerrainMesh(chunk, qualityProfile);
    addMesh(mesh);
    const biome = String(chunk.biome ?? 'unknown').toLowerCase();
    const terrainPalette = qualityProfile === 'PROXY'
      ? LARGE_WORLD_SPATIAL_PROXY_COLORS
      : qualityProfile === 'MOBILE'
        ? LARGE_WORLD_SPATIAL_MOBILE_COLORS
        : qualityProfile === 'CINEMATIC'
          ? LARGE_WORLD_SPATIAL_CINEMATIC_COLORS
          : LARGE_WORLD_SPATIAL_BIOME_COLORS;
    const temporalReactive = qualityProfile === 'PROXY' ? .05 : qualityProfile === 'MOBILE' ? .08 : qualityProfile === 'CINEMATIC' ? .14 : .1;
    const terrainMaterialId = addMaterial({
      id: `material:terrain:${qualityProfile.toLowerCase()}:${biome}`,
      baseColor: largeWorldSpatialColor(terrainPalette, biome, '#6b7280'),
      roughness: qualityProfile === 'PROXY' ? .98 : qualityProfile === 'MOBILE' ? .9 : qualityProfile === 'CINEMATIC' ? .68 : .82,
      metallic: qualityProfile === 'PROXY' ? .02 : qualityProfile === 'CINEMATIC' ? .06 : .04,
      doubleSided: true,
      temporalReactive
    });
    const resourceMaterialIds = new Map();
    for (const resourceKind of LARGE_WORLD_RESOURCE_KINDS) resourceMaterialIds.set(resourceKind, addMaterial({
      id: `material:resource:${qualityProfile.toLowerCase()}:${resourceKind}`,
      baseColor: largeWorldSpatialColor(LARGE_WORLD_SPATIAL_RESOURCE_COLORS, resourceKind, '#d1d5db'),
      roughness: qualityProfile === 'CINEMATIC' ? .28 : qualityProfile === 'MOBILE' ? .46 : .36,
      metallic: resourceKind === 'iron' ? (qualityProfile === 'CINEMATIC' ? .82 : .72) : qualityProfile === 'CINEMATIC' ? .12 : .08,
      emissive: resourceKind === 'crystal' || resourceKind === 'water' ? largeWorldSpatialColor(LARGE_WORLD_SPATIAL_RESOURCE_COLORS, resourceKind, '#d1d5db') : undefined,
      emissiveStrength: resourceKind === 'crystal' || resourceKind === 'water' ? (qualityProfile === 'CINEMATIC' ? .3 : qualityProfile === 'MOBILE' ? .08 : .16) : 0,
      doubleSided: true
    }));
    const worldX = Number(chunk.origin_mm.x) / 1000, worldZ = Number(chunk.origin_mm.z) / 1000, extentX = Number(chunk.extent_mm.x) / 1000, extentZ = Number(chunk.extent_mm.z) / 1000;
    minX = Math.min(minX, worldX); maxX = Math.max(maxX, worldX + extentX); minZ = Math.min(minZ, worldZ); maxZ = Math.max(maxZ, worldZ + extentZ);
    const terrainNodeId = `node:${chunk.chunk_id}:terrain`, cellNodeIds = [terrainNodeId];
    nodes.push({id: terrainNodeId, meshId: mesh.id, materialId: terrainMaterialId, transform: {translation: [worldX, 0, worldZ]}, castShadow: qualityProfile === 'STANDARD' || qualityProfile === 'CINEMATIC', receiveShadow: true, temporalReactive, tags: ['large-world', 'terrain', qualityProfile.toLowerCase()], representationSlotId: selectionRow.selected_slot_id});
    for (const structure of chunk.structures ?? []) {
      const structureNodeId = `node:${structure.id}`, size = Math.max(.5, Number(structure.scale_mm) / 1000), renderSize = size * presentationScale, y = Number(structure.local_position_mm.y) / 1000;
      const visual = ensureStructureVisual(structure.kind, qualityProfile);
      maxY = Math.max(maxY, y + renderSize);
      nodes.push({id: structureNodeId, meshId: visual.meshId, materialId: visual.materialId, transform: {translation: [worldX + Number(structure.local_position_mm.x) / 1000, y, worldZ + Number(structure.local_position_mm.z) / 1000], scale: [renderSize, renderSize, renderSize]}, castShadow: qualityProfile === 'STANDARD' || qualityProfile === 'CINEMATIC', receiveShadow: true, tags: ['large-world', 'structure', String(structure.kind)], structureKind: structure.kind, prototypeId: visual.prototypeId, authoredScale: size, presentationScale, representationSlotId: selectionRow.selected_slot_id});
      cellNodeIds.push(structureNodeId);
    }
    for (const resource of chunk.resources ?? []) {
      const resourceNodeId = `node:${resource.id}`, size = .22 + Math.min(12, Number(resource.amount) || 1) * .035, renderSize = size * Math.sqrt(presentationScale), y = Number(resource.local_position_mm.y) / 1000;
      const visual = ensureResourceVisual(resource.kind, qualityProfile);
      maxY = Math.max(maxY, y + renderSize);
      nodes.push({id: resourceNodeId, meshId: visual.meshId, materialId: resourceMaterialIds.get(String(resource.kind).toLowerCase()) ?? resourceMaterialIds.get('water'), transform: {translation: [worldX + Number(resource.local_position_mm.x) / 1000, y, worldZ + Number(resource.local_position_mm.z) / 1000], scale: [renderSize, renderSize, renderSize]}, castShadow: false, receiveShadow: true, tags: ['large-world', 'resource', String(resource.kind)], resourceKind: resource.kind, prototypeId: visual.prototypeId, authoredScale: size, presentationScale, representationSlotId: selectionRow.selected_slot_id});
      cellNodeIds.push(resourceNodeId);
    }
     const cellId = `cell:${chunk.chunk_id}`;
     const qualityPriority = LARGE_WORLD_SPATIAL_QUALITY_PROFILES.indexOf(qualityProfile);
     cells.push({id: cellId, center: [worldX + extentX / 2, 0, worldZ + extentZ / 2], radius: Math.hypot(extentX, extentZ) / 2, nodeIds: cellNodeIds, loadRadius: Math.max(extentX, extentZ) * 1.1, unloadRadius: Math.max(extentX, extentZ) * 1.6, priority: qualityPriority});
     assets.push({id: `asset:${chunk.chunk_id}`, uri: `rncs://${chunk.chunk_id}/${qualityProfile.toLowerCase()}`, sha256: chunk.content_root, byteLength: chunk.memory_bytes, kind: 'mesh', cellIds: [cellId], priority: qualityPriority, representationRoot: selectionRow.selected_representation_root, portfolioRoot: selectionRow.portfolio_root, candidateOnly: true, authoritative: false});
   }
  const centerX = (minX + maxX) / 2, centerZ = (minZ + maxZ) / 2, extent = Math.max(maxX - minX, maxZ - minZ), cameraDistance = Math.max(48, extent * .88), cameraHeight = Math.max(36, extent * .28);
  const camera = clone(value.camera ?? {translation: [centerX, cameraHeight, centerZ + cameraDistance], rotationEulerDeg: [-18, 0, 0]});
  const selectionRoot = selection.selection_root;
  const evidenceRoot = String(value.evidenceRoot ?? value.evidence_root ?? rootHash({selection_root: selectionRoot, chunks: chunks.map(chunk => chunk.chunk_root)}));
  fail(hex64(evidenceRoot), 'LARGE_WORLD_SPATIAL_EVIDENCE_ROOT_INVALID');
  const lighting = sceneLightingQuality === 'CINEMATIC'
    ? {diffuse: '#3d5e78', specular: '#fff3d6', probe: '#6f9fc1', ambient: .36, sun: 2.6, fill: 12}
    : sceneLightingQuality === 'MOBILE'
      ? {diffuse: '#28465d', specular: '#d7e4f1', probe: '#527b98', ambient: .3, sun: 2, fill: 7}
      : sceneLightingQuality === 'PROXY'
        ? {diffuse: '#1c2e3f', specular: '#b7c7d8', probe: '#405e73', ambient: .22, sun: 1.4, fill: 5}
        : {diffuse: '#29435c', specular: '#d9e7ff', probe: '#52789a', ambient: .28, sun: 2.2, fill: 8};
  const base = {
    format: 'vsr.spatial-scene.v0.4',
    sceneId: String(value.sceneId ?? value.scene_id ?? `large-world:${region.world_id}:${selectionRoot.slice(0, 16)}`),
    title: String(value.title ?? 'URRF Large World · VSR Spatial Projection'),
    background: String(value.background ?? '#07111e'),
    environment: {
      diffuseColor: String(value.diffuseColor ?? lighting.diffuse),
      specularColor: String(value.specularColor ?? lighting.specular),
      intensity: Number(value.environmentIntensity ?? value.environment_intensity ?? .72),
      probes: [{id: 'probe:large-world:center', position: [centerX, Math.max(1, maxY * .35), centerZ], radius: Math.max(1, extent * .8), diffuseColor: lighting.probe, specularColor: lighting.specular, intensity: sceneLightingQuality === 'CINEMATIC' ? .9 : .7}]
    },
    activeCameraId: 'camera:large-world',
    meshes,
    materials,
    nodes,
    streaming: {worldId: region.world_id, cells, persistentNodeIds: []},
    cameras: [{id: 'camera:large-world', projection: 'perspective', fovYDeg: Number(value.fovYDeg ?? value.fov_y_deg ?? 55), near: .1, far: Math.max(1000, cameraDistance * 5), transform: camera}],
    lights: [
      {id: 'light:large-world:ambient', kind: 'ambient', color: sceneLightingQuality === 'CINEMATIC' ? '#cfe4ff' : '#b8d4ff', intensity: lighting.ambient},
      {id: 'light:large-world:sun', kind: 'directional', color: sceneLightingQuality === 'CINEMATIC' ? '#fff1cf' : '#fff0ce', intensity: lighting.sun, direction: [-.45, -1, -.35], castShadow: true},
      {id: 'light:large-world:fill', kind: 'point', color: sceneLightingQuality === 'CINEMATIC' ? '#7dd3fc' : '#60a5fa', intensity: lighting.fill, position: [centerX - extent * .2, Math.max(8, cameraHeight * .35), centerZ + extent * .15], range: Math.max(8, extent * .65)}
    ],
    reality: {worldId: region.world_id, generation: region.generation, realityRoot: region.world_root, evidenceRoot},
    assets,
    large_world: {
      format: LARGE_WORLD_SPATIAL_SCENE_FORMAT,
      version: LARGE_WORLD_RUNTIME_VERSION,
      world_id: region.world_id,
      generation: region.generation,
      region_root: region.region_root,
      world_root: region.world_root,
      selection_root: selectionRoot,
      resource_governor_plan_root: selection.resource_governor_plan_root ?? null,
      resource_governor_power_mode: selection.resource_governor_power_mode ?? null,
      resource_governor_load_shedding_level: selection.resource_governor_load_shedding_level ?? null,
      power_downgrade_count: selection.power_downgrade_count ?? 0,
      unbound_governor_chunk_ids: clone(selection.unbound_governor_chunk_ids ?? []),
      causal_physical_profile_roots: clone(selection.causal_physical_profile_roots ?? {}),
      causal_physical_ready_count: selection.causal_physical_ready_count ?? 0,
      causal_physical_blocked_count: selection.causal_physical_blocked_count ?? 0,
      active_chunk_ids: chunks.map(chunk => chunk.chunk_id).sort(keySort),
      presentation_scale: presentationScale,
      quality_profile: sceneLightingQuality,
      quality_profiles: [...activeQualityProfiles].sort((a, b) => LARGE_WORLD_SPATIAL_QUALITY_PROFILES.indexOf(a) - LARGE_WORLD_SPATIAL_QUALITY_PROFILES.indexOf(b)),
      visual_prototype_profile: LARGE_WORLD_SPATIAL_VISUAL_PROFILE,
      visual_prototype_ids: [...visualPrototypeIds].sort(keySort),
      representation_slots: chunks.map(chunk => {
        const row = rows.get(chunk.chunk_id);
        return {chunk_id: chunk.chunk_id, selected_slot_id: row.selected_slot_id, selected_quality_profile: row.selected_quality_profile, selected_representation_root: row.selected_representation_root, portfolio_root: row.portfolio_root};
      }).sort((a, b) => keySort(a.chunk_id, b.chunk_id)),
      candidate_only: true,
      authoritative: false,
      canonical_write_authorized: false,
      authority: {provider_can_write_authoritative_world_state: false, rncs_authority_required: true}
    }
  };
  return {...base, scene_root: largeWorldSpatialSceneRoot(base)};
}

export function verifyLargeWorldSpatialScene(scene) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!scene || typeof scene !== 'object' || Array.isArray(scene)) return {valid: false, errors: ['LARGE_WORLD_SPATIAL_SCENE_NOT_OBJECT']};
  try {
    check(scene.format === 'vsr.spatial-scene.v0.4', 'LARGE_WORLD_SPATIAL_SCENE_FORMAT_INVALID');
    check(scene.large_world?.format === LARGE_WORLD_SPATIAL_SCENE_FORMAT, 'LARGE_WORLD_SPATIAL_SCENE_EXTENSION_INVALID');
    check(Number.isFinite(scene.large_world?.presentation_scale) && scene.large_world.presentation_scale >= .25 && scene.large_world.presentation_scale <= 8, 'LARGE_WORLD_SPATIAL_PRESENTATION_SCALE_INVALID');
    check(LARGE_WORLD_SPATIAL_QUALITY_PROFILES.includes(scene.large_world?.quality_profile), 'LARGE_WORLD_SPATIAL_QUALITY_PROFILE_INVALID');
    check(Array.isArray(scene.large_world?.quality_profiles) && scene.large_world.quality_profiles.length > 0 && scene.large_world.quality_profiles.every(profile => LARGE_WORLD_SPATIAL_QUALITY_PROFILES.includes(profile)), 'LARGE_WORLD_SPATIAL_QUALITY_PROFILES_INVALID');
    check(scene.large_world?.visual_prototype_profile === LARGE_WORLD_SPATIAL_VISUAL_PROFILE, 'LARGE_WORLD_SPATIAL_VISUAL_PROFILE_INVALID');
    check(Array.isArray(scene.large_world?.visual_prototype_ids) && scene.large_world.visual_prototype_ids.length > 0, 'LARGE_WORLD_SPATIAL_VISUAL_PROTOTYPES_MISSING');
    if (scene.large_world?.resource_governor_plan_root !== undefined) check(scene.large_world.resource_governor_plan_root === null || hex64(scene.large_world.resource_governor_plan_root), 'LARGE_WORLD_SPATIAL_GOVERNOR_ROOT_INVALID');
    if (scene.large_world?.resource_governor_power_mode !== undefined) check(scene.large_world.resource_governor_power_mode === null || typeof scene.large_world.resource_governor_power_mode === 'string', 'LARGE_WORLD_SPATIAL_GOVERNOR_POWER_MODE_INVALID');
    if (scene.large_world?.resource_governor_load_shedding_level !== undefined) check(scene.large_world.resource_governor_load_shedding_level === null || typeof scene.large_world.resource_governor_load_shedding_level === 'string', 'LARGE_WORLD_SPATIAL_GOVERNOR_LOAD_LEVEL_INVALID');
    if (scene.large_world?.power_downgrade_count !== undefined) check(Number.isSafeInteger(scene.large_world.power_downgrade_count) && scene.large_world.power_downgrade_count >= 0, 'LARGE_WORLD_SPATIAL_POWER_DOWNGRADE_COUNT_INVALID');
    if (scene.large_world?.unbound_governor_chunk_ids !== undefined) check(Array.isArray(scene.large_world.unbound_governor_chunk_ids), 'LARGE_WORLD_SPATIAL_UNBOUND_GOVERNOR_IDS_INVALID');
    if (scene.large_world?.causal_physical_profile_roots !== undefined) check(scene.large_world.causal_physical_profile_roots && typeof scene.large_world.causal_physical_profile_roots === 'object' && !Array.isArray(scene.large_world.causal_physical_profile_roots), 'LARGE_WORLD_SPATIAL_CAUSAL_PHYSICAL_ROOTS_INVALID');
    if (scene.large_world?.causal_physical_ready_count !== undefined) check(Number.isSafeInteger(scene.large_world.causal_physical_ready_count) && scene.large_world.causal_physical_ready_count >= 0, 'LARGE_WORLD_SPATIAL_CAUSAL_PHYSICAL_READY_COUNT_INVALID');
    if (scene.large_world?.causal_physical_blocked_count !== undefined) check(Number.isSafeInteger(scene.large_world.causal_physical_blocked_count) && scene.large_world.causal_physical_blocked_count >= 0, 'LARGE_WORLD_SPATIAL_CAUSAL_PHYSICAL_BLOCKED_COUNT_INVALID');
    check(scene.large_world?.candidate_only === true && scene.large_world?.authoritative === false && scene.large_world?.canonical_write_authorized === false, 'LARGE_WORLD_SPATIAL_SCENE_AUTHORITY_INVALID');
    check(scene.reality?.realityRoot === scene.large_world?.world_root, 'LARGE_WORLD_SPATIAL_SCENE_REALITY_ROOT_MISMATCH');
    check(hex64(scene.scene_root), 'LARGE_WORLD_SPATIAL_SCENE_ROOT_INVALID');
    check(largeWorldSpatialSceneRoot(scene) === scene.scene_root, 'LARGE_WORLD_SPATIAL_SCENE_ROOT_MISMATCH');
    check(Array.isArray(scene.large_world?.active_chunk_ids) && scene.large_world.active_chunk_ids.length === scene.streaming?.cells?.length, 'LARGE_WORLD_SPATIAL_SCENE_CELL_COUNT_MISMATCH');
  } catch (error) {
    errors.push(`LARGE_WORLD_SPATIAL_SCENE_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, scene_root: scene?.scene_root ?? null};
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

function realityChunkNeighborIds(runtime, chunk) {
  const x = Number(chunk.coordinates?.x ?? 0);
  const z = Number(chunk.coordinates?.z ?? 0);
  return runtime.region.chunks
    .filter(candidate => candidate.chunk_id !== chunk.chunk_id
      && Math.max(Math.abs(Number(candidate.coordinates?.x ?? 0) - x), Math.abs(Number(candidate.coordinates?.z ?? 0) - z)) === 1)
    .map(candidate => candidate.chunk_id)
    .sort(keySort);
}

function realityChunkInput(runtime, chunk, input = {}) {
  const value = record(input);
  const pick = (...keys) => {
    for (const key of keys) if (value[key] !== undefined) return value[key];
    return undefined;
  };
  const dependencies = pick('dependencies', 'dependency_ids', 'dependencyIds') ?? realityChunkNeighborIds(runtime, chunk);
  const evidenceRefs = pick('evidence_refs', 'evidenceRefs') ?? [chunk.chunk_root, chunk.content_root];
  const consistencyProfile = value.consistency_profile !== undefined
    ? value.consistency_profile
    : value.consistencyProfile !== undefined
      ? value.consistencyProfile
      : runtime.consistencyProfile ?? null;
  const active = runtime.activeChunkIds.includes(chunk.chunk_id);
  const defaultCost = {
    CPU_MILLI: Math.max(1, Math.ceil(Number(chunk.memory_bytes ?? 0) / 1024)),
    RAM_MB: Math.max(1, Math.ceil(Number(chunk.memory_bytes ?? 0) / (1024 * 1024))),
    NETWORK_KB: Math.max(1, Math.ceil(Number(chunk.memory_bytes ?? 0) / 1024)),
    ENERGY_MILLI: Math.max(1, Math.ceil(Number(chunk.memory_bytes ?? 0) / 4096))
  };
  return {
    chunk_id: chunk.chunk_id,
    world_id: runtime.options.worldId,
    branch_id: pick('branch_id', 'branchId') ?? 'main',
    spatial_bounds: pick('spatial_bounds', 'spatialBounds') ?? {
      coordinates: clone(chunk.coordinates),
      origin_mm: clone(chunk.origin_mm),
      extent_mm: clone(chunk.extent_mm)
    },
    temporal_bounds: pick('temporal_bounds', 'temporalBounds') ?? {
      from_tick: 0,
      to_tick: runtime.worldTime?.simulation_tick ?? 0
    },
    semantic_bounds: pick('semantic_bounds', 'semanticBounds') ?? {
      biome: chunk.biome,
      world_id: runtime.options.worldId,
      generation: chunk.generation
    },
    canonical_state_root: chunk.state_root,
    representation_refs: pick('representation_refs', 'representationRefs') ?? [chunk.content_root],
    authority_scope: pick('authority_scope', 'authorityScope') ?? ['read', 'replicate'],
    dependencies,
    residency: pick('residency') ?? {tier: 'RAM', status: active ? 'HOT' : 'COLD'},
    content_hash: pick('content_hash', 'contentHash') ?? chunk.content_root,
    delta_root: pick('delta_root', 'deltaRoot') ?? ZERO_ROOT,
    parent_version: pick('parent_version', 'parentVersion') ?? null,
    dependency_graph_ref: pick('dependency_graph_ref', 'dependencyGraphRef') ?? rootHash({chunk_id: chunk.chunk_id, dependencies}),
    compression_profile: pick('compression_profile', 'compressionProfile') ?? {codec: 'none', level: 0},
    replication_class: pick('replication_class', 'replicationClass') ?? 'PRIMARY',
    consistency_profile: consistencyProfile,
    retention_policy: pick('retention_policy', 'retentionPolicy') ?? {mode: 'HOLD', ttl_ticks: 0, evictable: false},
    reconstruction_cost: pick('reconstruction_cost', 'reconstructionCost') ?? defaultCost,
    priority_class: pick('priority_class', 'priorityClass') ?? 'REPRESENTATION',
    evidence_refs: evidenceRefs,
    evidence_root: pick('evidence_root', 'evidenceRoot')
  };
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
    this.sovereigntyProfile = normalizeServerSovereigntyProfile(
      value.serverSovereigntyProfile
        ?? value.server_sovereignty_profile
        ?? value.sovereigntyProfile
        ?? value.sovereignty_profile,
      this
    );
    this.chunks = new Map(this.region.chunks.map(chunk => [chunk.chunk_id, chunk]));
    this.chunkByKey = new Map(this.region.chunks.map(chunk => [chunkKey(chunk.coordinates.x, chunk.coordinates.z), chunk]));
    this.activeChunkIds = [];
    this.observer = {x: 0, z: 0};
    this.trace = [];
    this.replicationSequence = 0;
    this.realityChunkSequence = 0;
    this.realityChunkReplicas = new Map();
    this.appliedRealityChunkDeltas = new Map();
    this.appliedRealityChunkSnapshots = new Map();
    this.realityFaults = new Map();
    this.minimumReality = null;
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
        query_index: chunkRealityQueryIndex(chunk),
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

  createHorizon(input = {}) { return this.fabric.createHorizon(input); }

  createRealityHorizon(input = {}) { return this.createHorizon(input); }

  createInterestGraph(input = {}) { return this.fabric.createInterestGraph(input); }

  createRealityInterestGraph(input = {}) { return this.createInterestGraph(input); }

  queryReality(input = {}) { return this.fabric.queryReality(input); }

  createCognitiveWorkingSet(input = {}) { return this.fabric.createCognitiveWorkingSet(input); }

  createCausalPhysicalProfile(input = {}) {
    const value = record(input);
    const chunk = value.chunk_id || value.chunkId ? this.chunks.get(String(value.chunk_id ?? value.chunkId)) : null;
    return this.fabric.createCausalPhysicalProfile({
      ...value,
      object_id: value.object_id ?? value.objectId ?? chunk?.object_id,
      canonical_state_root: value.canonical_state_root ?? value.canonicalStateRoot ?? chunk?.state_root
    });
  }

  verifyCausalPhysicalProfile(profile) { return verifyCausalPhysicalProfile(profile); }

  createRealityFault(input = {}) {
    const value = record(input.fault ?? input);
    const fault = value.fault_root
      ? clone(value)
      : createCoreRealityFault({
        ...value,
        node_id: value.node_id ?? value.nodeId ?? this.nodeId,
        opened_at_tick: value.opened_at_tick ?? value.openedAtTick ?? this.worldTime.simulation_tick
      });
    const verification = verifyRealityFault(fault);
    fail(verification.valid, `LARGE_WORLD_REALITY_FAULT_INVALID:${verification.errors.join(',')}`);
    fail(fault.node_id === this.nodeId, 'LARGE_WORLD_REALITY_FAULT_NODE_ID_MISMATCH');
    return clone(fault);
  }

  registerRealityFault(input = {}) {
    const fault = this.createRealityFault(input);
    this.realityFaults.set(fault.fault_id, clone(fault));
    return clone(fault);
  }

  getRealityFault(faultIdValue) {
    return clone(this.realityFaults.get(String(faultIdValue)) ?? null);
  }

  listRealityFaults() {
    return [...this.realityFaults.values()].sort((a, b) => keySort(a.fault_id, b.fault_id)).map(clone);
  }

  clearRealityFault(faultIdValue, recoveredAtTick = this.worldTime.simulation_tick) {
    const faultId = String(faultIdValue);
    const current = this.realityFaults.get(faultId);
    fail(current, 'LARGE_WORLD_REALITY_FAULT_NOT_FOUND');
    const tick = integer(recoveredAtTick, this.worldTime.simulation_tick, {min: current.opened_at_tick});
    const {fault_root: _faultRoot, ...faultFields} = current;
    const recovered = this.createRealityFault({
      ...faultFields,
      status: 'RECOVERED',
      recovered_at_tick: tick
    });
    this.realityFaults.set(faultId, clone(recovered));
    return clone(recovered);
  }

  createMinimumViableReality(input = {}) {
    const value = record(input.minimum_reality ?? input.minimumReality ?? input);
    const currentRoot = worldStateRoot(this.canonicalState);
    const currentTick = this.worldTime.simulation_tick;
    const reality = value.minimum_reality_root
      ? clone(value)
      : createCoreMinimumViableReality({
        ...value,
        reality_id: value.reality_id ?? value.realityId ?? `reality:${this.options.worldId}`,
        scope_id: value.scope_id ?? value.scopeId ?? `scope:${this.options.worldId}`,
        canonical_state_root: value.canonical_state_root ?? value.canonicalStateRoot ?? currentRoot,
        world_time_tick: value.world_time_tick ?? value.worldTimeTick ?? currentTick
      });
    const verification = verifyMinimumViableReality(reality);
    fail(verification.valid, `LARGE_WORLD_MINIMUM_REALITY_INVALID:${verification.errors.join(',')}`);
    fail(reality.canonical_state_root === currentRoot, 'LARGE_WORLD_MINIMUM_REALITY_CANONICAL_ROOT_STALE');
    fail(reality.world_time_tick === currentTick, 'LARGE_WORLD_MINIMUM_REALITY_WORLD_TIME_STALE');
    return clone(reality);
  }

  getMinimumReality() { return clone(this.minimumReality); }

  /**
   * Build a candidate-only minimum-reality recovery envelope. Faults and
   * resource plans are verified RNCS contracts; LargeWorldRuntime only lowers
   * the result into proxy representation selections and a VSR scene. No
   * canonical world state is mutated and no provider receives write authority.
   */
  recoverMinimumReality(input = {}) {
    const value = record(input);
    const currentRoot = worldStateRoot(this.canonicalState);
    const currentTick = this.worldTime.simulation_tick;
    const faultValue = value.faults ?? value.fault ?? this.listRealityFaults();
    const faultInputs = Array.isArray(faultValue) ? faultValue : [faultValue];
    const faults = faultInputs.filter(Boolean).map(faultInput => this.createRealityFault(faultInput));
    for (const fault of faults) this.realityFaults.set(fault.fault_id, clone(fault));
    faults.sort((a, b) => keySort(a.fault_id, b.fault_id));
    const faultRoots = faults.map(fault => fault.fault_root).sort(keySort);
    const activeCriticalFault = faults.some(fault => fault.status !== 'RECOVERED' && (fault.severity >= 70 || fault.affects_minimum_reality));

    if (this.activeChunkIds.length === 0) {
      this.observe({
        position: value.position ?? value.observer ?? this.observer,
        forcedChunkIds: value.forced_chunk_ids ?? value.forcedChunkIds ?? []
      });
    }
    const activeChunks = this.listActiveChunks();
    fail(activeChunks.length > 0, 'LARGE_WORLD_MINIMUM_REALITY_ACTIVE_CHUNKS_REQUIRED');

    const minimumInput = record(value.minimum_reality ?? value.minimumReality);
    const requiredLayers = minimumInput.required_layers ?? minimumInput.requiredLayers ?? value.required_layers ?? value.requiredLayers;
    const explicitAvailableLayers = minimumInput.available_layers
      ?? minimumInput.availableLayers
      ?? value.available_layers
      ?? value.availableLayers;
    const defaultAvailableLayers = activeCriticalFault
      ? ['WORLD_PROXY']
      : requiredLayers ?? ['WORLD_PROXY', 'COLLISION', 'SEMANTIC'];
    const minimum = this.createMinimumViableReality({
      ...minimumInput,
      reality_id: minimumInput.reality_id ?? minimumInput.realityId ?? value.reality_id ?? value.realityId ?? `reality:${this.options.worldId}`,
      scope_id: minimumInput.scope_id ?? minimumInput.scopeId ?? value.scope_id ?? value.scopeId ?? `scope:${this.options.worldId}`,
      canonical_state_root: minimumInput.canonical_state_root ?? minimumInput.canonicalStateRoot ?? currentRoot,
      world_time_tick: minimumInput.world_time_tick ?? minimumInput.worldTimeTick ?? currentTick,
      required_layers: requiredLayers ?? ['WORLD_PROXY', 'COLLISION', 'SEMANTIC'],
      available_layers: explicitAvailableLayers ?? defaultAvailableLayers,
      fault_roots: minimumInput.fault_roots ?? minimumInput.faultRoots ?? faultRoots
    });
    fail(JSON.stringify(minimum.fault_roots) === JSON.stringify(faultRoots), 'LARGE_WORLD_MINIMUM_REALITY_FAULT_ROOTS_MISMATCH');

    const powerInput = value.power_profile ?? value.powerProfile;
    const power = record(powerInput).power_root
      ? clone(powerInput)
      : createCoreRealityPowerProfile({node_id: this.nodeId, ...record(powerInput)});
    const powerVerification = verifyRealityPowerProfile(power);
    fail(powerVerification.valid, `LARGE_WORLD_MINIMUM_REALITY_POWER_INVALID:${powerVerification.errors.join(',')}`);
    fail(power.node_id === this.nodeId, 'LARGE_WORLD_MINIMUM_REALITY_POWER_NODE_ID_MISMATCH');

    const budgetInput = value.resource_budget ?? value.resourceBudget;
    const budget = record(budgetInput).budget_root
      ? clone(budgetInput)
      : createCoreRealityResourceBudget({node_id: this.nodeId, power_profile_root: power.power_root, ...record(budgetInput)});
    const budgetVerification = verifyRealityResourceBudget(budget);
    fail(budgetVerification.valid, `LARGE_WORLD_MINIMUM_REALITY_RESOURCE_BUDGET_INVALID:${budgetVerification.errors.join(',')}`);
    fail(budget.node_id === this.nodeId, 'LARGE_WORLD_MINIMUM_REALITY_RESOURCE_BUDGET_NODE_ID_MISMATCH');
    fail(budget.power_profile_root === power.power_root, 'LARGE_WORLD_MINIMUM_REALITY_RESOURCE_BUDGET_POWER_ROOT_MISMATCH');

    const demandInput = value.demands ?? value.resource_demands ?? value.resourceDemands;
    const demands = (Array.isArray(demandInput) ? demandInput : [
      {
        candidate_id: `minimum:${minimum.scope_id}`,
        candidate_kind: 'MINIMUM_REALITY',
        priority: 100,
        authority_critical: true,
        preserve_minimum_reality: true,
        canonical_state_root: currentRoot,
        resource_costs: {CPU: 40, RAM: 32, ENERGY: 5}
      },
      ...activeChunks.map(chunk => ({
        candidate_id: `visual:${chunk.chunk_id}`,
        candidate_kind: 'VISUAL',
        priority: 50,
        canonical_state_root: currentRoot,
        resource_costs: {GPU: 400, VRAM: 256, NETWORK: 32}
      }))
    ]).map(demandInputValue => {
      const demand = record(demandInputValue).demand_root
        ? clone(demandInputValue)
        : createCoreRealityResourceDemand(demandInputValue);
      const verification = verifyRealityResourceDemand(demand);
      fail(verification.valid, `LARGE_WORLD_MINIMUM_REALITY_DEMAND_INVALID:${verification.errors.join(',')}`);
      fail(demand.canonical_state_root === null || demand.canonical_state_root === currentRoot, 'LARGE_WORLD_MINIMUM_REALITY_DEMAND_CANONICAL_ROOT_STALE');
      return demand;
    });

    const planInput = value.resource_governor_plan
      ?? value.resourceGovernorPlan
      ?? value.load_shedding_plan
      ?? value.loadSheddingPlan;
    const plan = record(planInput).plan_root
      ? clone(planInput)
      : createCoreRealityLoadSheddingPlan({
        ...record(planInput),
        plan_id: record(planInput).plan_id ?? record(planInput).planId ?? `plan:${this.nodeId}:${currentTick}`,
        tick: record(planInput).tick ?? currentTick,
        power_profile: power,
        resource_budget: budget,
        minimum_reality: minimum,
        faults,
        demands,
        evidence_refs: value.evidence_refs ?? value.evidenceRefs ?? []
      });
    const planVerification = verifyRealityLoadSheddingPlan(plan);
    fail(planVerification.valid, `LARGE_WORLD_MINIMUM_REALITY_PLAN_INVALID:${planVerification.errors.join(',')}`);
    fail(plan.node_id === this.nodeId, 'LARGE_WORLD_MINIMUM_REALITY_PLAN_NODE_ID_MISMATCH');
    fail(plan.tick === currentTick, 'LARGE_WORLD_MINIMUM_REALITY_PLAN_TICK_STALE');
    fail(plan.minimum_reality_root === minimum.minimum_reality_root, 'LARGE_WORLD_MINIMUM_REALITY_PLAN_MINIMUM_ROOT_MISMATCH');
    fail(JSON.stringify(plan.fault_roots) === JSON.stringify(faultRoots), 'LARGE_WORLD_MINIMUM_REALITY_PLAN_FAULT_ROOTS_MISMATCH');
    if (powerInput !== undefined) fail(plan.power_profile_root === power.power_root, 'LARGE_WORLD_MINIMUM_REALITY_PLAN_POWER_ROOT_MISMATCH');
    if (budgetInput !== undefined) fail(plan.resource_budget_root === budget.budget_root, 'LARGE_WORLD_MINIMUM_REALITY_PLAN_RESOURCE_BUDGET_ROOT_MISMATCH');

    const selection = this.selectActiveRepresentationPortfolios({
      quality_profile: 'PROXY',
      resource_governor_plan: plan,
      diversity: value.diversity ?? value.diversity_axes ?? value.diversityAxes
    });
    const evidenceRoot = rootHash({
      canonical_state_root: currentRoot,
      minimum_reality_root: minimum.minimum_reality_root,
      plan_root: plan.plan_root,
      selection_root: selection.selection_root,
      fault_roots: faultRoots
    });
    const sceneInput = record(value.scene);
    const scene = this.createSpatialScene({
      ...sceneInput,
      title: sceneInput.title ?? 'URRF Minimum Viable Reality',
      selection,
      evidence_root: evidenceRoot
    });
    const base = {
      format: LARGE_WORLD_MINIMUM_REALITY_RECOVERY_FORMAT,
      version: LARGE_WORLD_RUNTIME_VERSION,
      world_id: this.options.worldId,
      node_id: this.nodeId,
      generation: this.options.generation,
      region_root: this.region.region_root,
      world_root: this.region.world_root,
      canonical_state_root: currentRoot,
      world_time_tick: currentTick,
      fault_roots: faultRoots,
      faults: faults.map(clone),
      minimum_reality: clone(minimum),
      load_shedding_plan: clone(plan),
      selection: clone(selection),
      scene: clone(scene),
      active_chunk_ids: [...this.activeChunkIds].sort(keySort),
      recovery_status: minimum.recovery_status,
      canonical_state_mutated: false,
      authority: {provider_can_write_authoritative_world_state: false, rncs_authority_required: true},
      candidate_only: true,
      authoritative: false,
      canonical_write_authorized: false,
      commit_status: 'NOT_COMMITTED'
    };
    this.minimumReality = clone(minimum);
    return {...base, recovery_root: largeWorldMinimumRealityRecoveryRoot(base)};
  }

  /**
   * Lower the v0.3 URRF access chain into the bounded large-world stream:
   * RealityHorizon -> InterestGraph -> RealityQuery -> CognitiveWorkingSet
   * -> forced chunk requests -> candidate stream resolution.
   *
   * This only changes candidate streaming state. RNCS world truth remains
   * canonical and no provider or query result receives mutation authority.
   */
  resolveRealityAccess(input = {}) {
    const value = record(input);
    const subjectId = String(value.subject_id ?? value.subjectId ?? '');
    fail(subjectId, 'LARGE_WORLD_REALITY_ACCESS_SUBJECT_ID_REQUIRED');
    const observer = normalizeObserver(value.observer ?? value.position ?? this.observer);
    const radiusInput = value.radius_m ?? value.radius ?? Math.max(this.options.chunkSize * (this.options.loadRadius + 1), this.options.chunkSize);
    const radius = Number(radiusInput);
    fail(Number.isFinite(radius) && radius >= 0, 'LARGE_WORLD_REALITY_ACCESS_RADIUS_INVALID');
    const permissionInput = value.permission_scope ?? value.permissionScope;
    const permissionScope = Array.isArray(permissionInput) ? strings(permissionInput) : ['public'];
    const horizon = value.horizon ?? value.reality_horizon ?? this.createHorizon({
      subject_id: subjectId,
      spatial: {radius: String(radius), unit: 'm'},
      semantic: {tags: ['large-world', `world:${this.options.worldId}`]},
      permission_scope: permissionScope
    });
    const horizonVerification = verifyRealityHorizon(horizon);
    fail(horizonVerification.valid, `LARGE_WORLD_REALITY_ACCESS_HORIZON_INVALID:${horizonVerification.errors.join(',')}`);
    fail(horizon.subject_id === subjectId, 'LARGE_WORLD_REALITY_ACCESS_HORIZON_SUBJECT_MISMATCH');
    const interestGraph = value.interest_graph ?? value.interestGraph ?? null;
    if (interestGraph !== null) {
      const graphVerification = verifyRealityInterestGraph(interestGraph);
      fail(graphVerification.valid, `LARGE_WORLD_REALITY_ACCESS_INTEREST_GRAPH_INVALID:${graphVerification.errors.join(',')}`);
      fail(interestGraph.subject_id === subjectId, 'LARGE_WORLD_REALITY_ACCESS_INTEREST_GRAPH_SUBJECT_MISMATCH');
    }
    const rawFilters = record(value.filters);
    const rawSpatial = record(rawFilters.spatial);
    const filters = {
      ...rawFilters,
      spatial: {
        ...rawSpatial,
        origin: rawSpatial.origin ?? {x: observer.x, y: 0, z: observer.z},
        radius: rawSpatial.radius ?? String(radius),
        unit: rawSpatial.unit ?? 'm'
      }
    };
    const query = createRealityQuery({
      ...(value.query_id === undefined && value.queryId === undefined ? {} : {query_id: value.query_id ?? value.queryId}),
      subject_id: subjectId,
      horizon,
      interest_graph: interestGraph,
      filters,
      permission_scope: permissionScope,
      limit: value.limit ?? Math.max(1, this.options.maxActiveChunks * 2),
      freshness_budget: value.freshness_budget ?? value.freshnessBudget,
      revalidate_canonical: value.revalidate_canonical !== false
    });
    const queryVerification = verifyRealityQuery(query);
    fail(queryVerification.valid, `LARGE_WORLD_REALITY_ACCESS_QUERY_INVALID:${queryVerification.errors.join(',')}`);
    const queryResult = this.fabric.queryReality(query);
    const workingSet = this.createCognitiveWorkingSet({
      query_result: queryResult,
      subject_id: subjectId,
      capacity: value.capacity ?? value.max_objects ?? value.maxObjects ?? this.options.maxActiveChunks
    });
    const selectedObjectIds = workingSet.objects.map(row => String(row.object_id));
    const selectedChunkIds = [];
    const unresolvedObjectIds = [];
    for (const objectId of selectedObjectIds) {
      const chunk = this.chunksByObjectId.get(objectId);
      if (chunk) selectedChunkIds.push(chunk.chunk_id);
      else unresolvedObjectIds.push(objectId);
    }
    const existingForced = value.forcedChunkIds ?? value.forced_chunk_ids;
    const forcedChunkIds = strings([...(Array.isArray(existingForced) ? existingForced : []), ...selectedChunkIds]);
    const stream = this.observe({position: observer, forcedChunkIds});
    const activeSelectedChunkIds = selectedChunkIds.filter(chunkId => stream.active_chunk_ids.includes(chunkId));
    const unresolvedChunkIds = selectedChunkIds.filter(chunkId => !stream.active_chunk_ids.includes(chunkId));
    const base = {
      format: LARGE_WORLD_REALITY_ACCESS_FORMAT,
      version: LARGE_WORLD_RUNTIME_VERSION,
      world_id: this.options.worldId,
      generation: this.options.generation,
      region_root: this.region.region_root,
      world_root: this.region.world_root,
      subject_id: subjectId,
      observer: clone(observer),
      horizon: clone(horizon),
      interest_graph: interestGraph ? clone(interestGraph) : null,
      query: clone(query),
      query_result: clone(queryResult),
      working_set: clone(workingSet),
      stream_resolution: clone(stream),
      stream_root: stream.stream_root,
      active_chunk_ids: [...stream.active_chunk_ids],
      selected_object_ids: selectedObjectIds,
      selected_chunk_ids: selectedChunkIds,
      active_selected_chunk_ids: activeSelectedChunkIds,
      unresolved_object_ids: unresolvedObjectIds,
      unresolved_chunk_ids: unresolvedChunkIds,
      forced_chunk_ids: forcedChunkIds,
      canonical_state_mutated: false,
      authority: {provider_can_write_authoritative_world_state: false, rncs_authority_required: true},
      candidate_only: true,
      authoritative: false,
      commit_status: 'NOT_COMMITTED'
    };
    return {...base, resolution_root: rootHash(base)};
  }

  createSpatialScene(input = {}) {
    const value = record(input);
    const selection = value.selection ?? value.selectionEnvelope ?? value.selection_envelope ?? this.selectActiveRepresentationPortfolios(value);
    const chunks = this.listActiveChunks();
    fail(chunks.length > 0, 'LARGE_WORLD_SPATIAL_ACTIVE_CHUNKS_REQUIRED');
    return createLargeWorldSpatialScene({
      ...value,
      region: this.region,
      chunks,
      selection
    });
  }

  selectActiveRepresentationPortfolios(input = {}) {
    const value = record(input);
    const requestedQuality = value.qualityProfile ?? value.quality_profile ?? null;
    const qualityByChunk = record(value.qualityByChunk ?? value.quality_by_chunk);
    const budgetByChunk = record(value.resourceBudgetByChunk ?? value.resource_budget_by_chunk);
    const globalBudget = value.resourceBudget ?? value.resource_budget;
    const workingSetBudget = normalizeWorkingSetResourceBudget(
      value.workingSetResourceBudget
        ?? value.working_set_resource_budget
        ?? value.aggregateResourceBudget
        ?? value.aggregate_resource_budget
    );
    const workingSetMinimumQualityProfile = normalizeWorkingSetQuality(
      value.workingSetMinimumQualityProfile
        ?? value.working_set_minimum_quality_profile
        ?? value.minimumQualityProfile
        ?? value.minimum_quality_profile,
      'LARGE_WORLD_WORKING_SET_MINIMUM_QUALITY_INVALID'
    );
    const workingSetMinimumQualityByChunk = Object.fromEntries(Object.entries(record(value.workingSetMinimumQualityByChunk ?? value.working_set_minimum_quality_by_chunk)).map(([chunkId, profile]) => [String(chunkId), normalizeWorkingSetQuality(profile, 'LARGE_WORLD_WORKING_SET_MINIMUM_QUALITY_INVALID')]));
    const workingSetPriorityByChunk = normalizeWorkingSetPriorityMap(value.workingSetPriorityByChunk ?? value.working_set_priority_by_chunk);
    const globalDiversity = value.diversity ?? value.diversity_axes ?? value.diversityAxes;
    const causalPhysicalByChunk = record(value.causalPhysicalProfileByChunk ?? value.causal_physical_profile_by_chunk);
    const globalCausalPhysical = value.causalPhysicalProfile ?? value.causal_physical_profile ?? null;
    const resourceGovernorPlan = normalizeResourceGovernorPlan(
      value.resourceGovernorPlan
        ?? value.resource_governor_plan
        ?? value.loadSheddingPlan
        ?? value.load_shedding_plan
        ?? null
    );
    const selectionContexts = new Map();
    let selections = this.activeChunkIds.map(chunkIdValue => {
      const chunk = this.chunks.get(chunkIdValue);
      const portfolio = this.portfolioRuntime.getPortfolio(`portfolio:${chunk.object_id}`)
        ?? this.getRepresentationPortfolio(chunk.chunk_id);
      if (!this.portfolioRuntime.getPortfolio(portfolio.portfolio_id)) this.portfolioRuntime.registerPortfolio(portfolio);
      const requestedBeforePower = qualityByChunk[chunk.chunk_id] ?? requestedQuality;
      const powerDecision = resourceGovernorDecisionForChunk(resourceGovernorPlan, chunk);
      const powerAction = powerDecision?.action ?? null;
      const powerLowering = powerAction ? POWER_QUALITY_LOWERING[powerAction] : null;
      const requested = powerLowering?.qualityProfile ?? requestedBeforePower;
      const resourceBudget = budgetByChunk[chunk.chunk_id] ?? globalBudget;
      const causalPhysicalInput = causalPhysicalByChunk[chunk.chunk_id] ?? globalCausalPhysical;
      const causalPhysicalProfile = normalizeCausalPhysicalProfileForChunk(causalPhysicalInput, chunk);
      const effectiveResourceBudget = causalPhysicalProfile
        ? subtractCausalPhysicalCosts(resourceBudget, causalPhysicalProfile.resource_costs)
        : resourceBudget;
      selectionContexts.set(chunk.chunk_id, {effectiveResourceBudget});
      const selection = this.portfolioRuntime.selectSlot({
        portfolio_id: portfolio.portfolio_id,
        ...(requested === null || requested === undefined ? {} : {quality_profile: requested}),
        ...(effectiveResourceBudget === undefined ? {} : {resource_budget: effectiveResourceBudget}),
        ...(globalDiversity === undefined ? {} : {diversity: globalDiversity})
      });
      const row = {
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
        power_plan_root: resourceGovernorPlan?.plan_root ?? null,
        power_decision_candidate_id: powerDecision?.candidate_id ?? null,
        power_decision_kind: powerDecision?.candidate_kind ?? null,
        power_action: powerAction,
        power_action_effect: powerLowering?.effect ?? (resourceGovernorPlan ? 'UNBOUND' : null),
        power_quality_override: powerLowering?.qualityProfile ?? null,
        power_decision_bound: resourceGovernorPlan ? Boolean(powerDecision) : null,
        causal_physical_profile_root: causalPhysicalProfile?.profile_root ?? null,
        causal_physical_causal_level: causalPhysicalProfile?.causal_level ?? null,
        causal_physical_physical_level: causalPhysicalProfile?.physical_level ?? null,
        causal_physical_execution_status: causalPhysicalProfile?.execution_status ?? null,
        causal_physical_resource_status: causalPhysicalProfile?.resource_admission?.status ?? null,
        causal_physical_execution: clone(causalPhysicalProfile?.execution ?? null),
        causal_physical_resource_costs: clone(causalPhysicalProfile?.resource_costs ?? null),
        causal_physical_effective_resource_budget: clone(effectiveResourceBudget ?? null),
        candidate_only: true,
        authoritative: false,
        canonical_write_authorized: false
      };
      if (workingSetBudget) {
        row.working_set_requested_quality_profile = requested === null || requested === undefined ? null : String(requested).toUpperCase();
        row.working_set_minimum_quality_profile = workingSetMinimumQualityByChunk[chunk.chunk_id] ?? workingSetMinimumQualityProfile;
        row.selected_resource_costs = workingSetCostVector(selection.slot);
        row.working_set_downgraded = false;
      }
      return row;
    }).sort((a, b) => keySort(a.chunk_id, b.chunk_id));
    const workingSetAllocation = workingSetBudget
      ? allocateWorkingSetQuality({
        selections,
        budget: workingSetBudget,
        minimumQualityProfile: workingSetMinimumQualityProfile,
        minimumQualityByChunk: workingSetMinimumQualityByChunk,
        priorityByChunk: workingSetPriorityByChunk,
        selectForQuality: (row, quality) => {
          const context = selectionContexts.get(row.chunk_id) ?? {};
          const selectionPortfolio = this.portfolioRuntime.getPortfolio(row.portfolio_id);
          return this.portfolioRuntime.selectSlot({
            portfolio_id: selectionPortfolio.portfolio_id,
            quality_profile: quality,
            ...(context.effectiveResourceBudget === undefined ? {} : {resource_budget: context.effectiveResourceBudget}),
            ...(globalDiversity === undefined ? {} : {diversity: globalDiversity})
          });
        }
      })
      : null;
    if (workingSetAllocation) selections = workingSetAllocation.selections;
    const base = {
      format: LARGE_WORLD_PORTFOLIO_SELECTION_FORMAT,
      version: LARGE_WORLD_RUNTIME_VERSION,
      world_id: this.options.worldId,
      generation: this.options.generation,
      region_root: this.region.region_root,
      world_root: this.region.world_root,
      stream_root: this.activeChunkIds.length > 0 ? this.trace.at(-1)?.stream_root ?? null : null,
      requested_quality_profile: requestedQuality === null || requestedQuality === undefined ? null : String(requestedQuality).toUpperCase(),
      resource_governor_plan_root: resourceGovernorPlan?.plan_root ?? null,
      resource_governor_power_mode: resourceGovernorPlan?.power_mode ?? null,
      resource_governor_load_shedding_level: resourceGovernorPlan?.load_shedding_level ?? null,
      resource_governor_decision_count: resourceGovernorPlan?.decisions.length ?? 0,
      active_chunk_ids: [...this.activeChunkIds].sort(keySort),
      selections,
      fallback_count: selections.filter(selection => selection.fallback_used).length,
      power_downgrade_count: selections.filter(selection => selection.power_quality_override === 'PROXY').length,
      causal_physical_profile_roots: Object.fromEntries(selections.filter(selection => selection.causal_physical_profile_root).map(selection => [selection.chunk_id, selection.causal_physical_profile_root]).sort(([a], [b]) => keySort(a, b))),
      causal_physical_ready_count: selections.filter(selection => selection.causal_physical_execution_status === 'READY').length,
      causal_physical_blocked_count: selections.filter(selection => selection.causal_physical_execution_status === 'BLOCKED_RESOURCE').length,
      unbound_governor_chunk_ids: resourceGovernorPlan
        ? selections.filter(selection => !selection.power_decision_bound).map(selection => selection.chunk_id).sort(keySort)
        : [],
      ...(workingSetAllocation ? {
        working_set_budget: {
          format: LARGE_WORLD_WORKING_SET_BUDGET_FORMAT,
          version: '0.1.0',
          available: clone(workingSetBudget.available),
          source_budget_root: workingSetBudget.source_budget_root
        },
        working_set_budget_root: rootHash({
          format: LARGE_WORLD_WORKING_SET_BUDGET_FORMAT,
          version: '0.1.0',
          available: clone(workingSetBudget.available),
          source_budget_root: workingSetBudget.source_budget_root
        }),
        working_set_quality_policy: {
          format: LARGE_WORLD_QUALITY_ALLOCATION_POLICY_FORMAT,
          version: '0.1.0',
          algorithm: 'priority-weighted-greedy-downgrade',
          minimum_quality_profile: workingSetAllocation.minimum_quality_profile,
          minimum_quality_by_chunk: workingSetAllocation.minimum_quality_by_chunk,
          priority_by_chunk: workingSetAllocation.priority_by_chunk
        },
        working_set_initial_resource_costs: workingSetAllocation.initial_costs,
        working_set_resource_costs: workingSetAllocation.costs,
        working_set_resource_remaining: workingSetAllocation.remaining,
        working_set_budget_status: workingSetAllocation.status,
        working_set_downgrade_count: workingSetAllocation.downgrades.length,
        working_set_downgrade_chunk_ids: [...new Set(workingSetAllocation.downgrades.map(item => item.chunk_id))].sort(keySort),
        working_set_downgrades: workingSetAllocation.downgrades.map(clone)
      } : {}),
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

  exportRealityChunkSnapshot(chunkIdInput, input = {}) {
    const chunkIdValue = String(chunkIdInput ?? '');
    fail(chunkIdValue.length > 0, 'LARGE_WORLD_REALITY_CHUNK_ID_REQUIRED');
    const canonicalChunk = this.chunks.get(chunkIdValue);
    fail(canonicalChunk, 'LARGE_WORLD_REALITY_CHUNK_UNKNOWN');
    const value = record(input);
    const replica = this.realityChunkReplicas.get(chunkIdValue);
    if (replica && value.forceCanonical !== true) return clone(replica);
    const requestedCanonicalRoot = value.canonical_state_root ?? value.canonicalStateRoot;
    if (requestedCanonicalRoot !== undefined) fail(requestedCanonicalRoot === canonicalChunk.state_root, 'LARGE_WORLD_REALITY_CHUNK_CANONICAL_ROOT_MISMATCH');
    const snapshot = createCoreRealityChunk(realityChunkInput(this, canonicalChunk, value));
    const verification = verifyRealityChunk(snapshot);
    fail(verification.valid, `LARGE_WORLD_REALITY_CHUNK_SNAPSHOT_INVALID:${verification.errors.join(',')}`);
    return clone(snapshot);
  }

  realityChunkSnapshot(chunkIdInput, input = {}) { return this.exportRealityChunkSnapshot(chunkIdInput, input); }

  listRealityChunkReplicas() {
    return [...this.realityChunkReplicas.entries()]
      .sort(([a], [b]) => keySort(a, b))
      .map(([chunkId, chunk]) => ({chunk_id: chunkId, chunk_root: chunk.chunk_root, version_root: chunk.version_root}));
  }

  applyRealityChunkSnapshot(snapshotInput, input = {}) {
    const snapshot = clone(snapshotInput);
    const verification = verifyRealityChunk(snapshot);
    fail(verification.valid, `LARGE_WORLD_REALITY_CHUNK_SNAPSHOT_INVALID:${verification.errors.join(',')}`);
    const value = record(input);
    const sourceNode = String(value.source_node ?? value.sourceNode ?? 'node:unknown');
    const targetNode = String(value.target_node ?? value.targetNode ?? this.nodeId);
    fail(sourceNode.length > 0, 'LARGE_WORLD_REALITY_CHUNK_SNAPSHOT_SOURCE_NODE_REQUIRED');
    fail(targetNode === this.nodeId, 'LARGE_WORLD_REALITY_CHUNK_SNAPSHOT_TARGET_NODE_MISMATCH');
    fail(snapshot.world_id === this.options.worldId, 'LARGE_WORLD_REALITY_CHUNK_WORLD_MISMATCH');
    const canonicalChunk = this.chunks.get(snapshot.chunk_id);
    fail(canonicalChunk, 'LARGE_WORLD_REALITY_CHUNK_UNKNOWN');
    fail(snapshot.canonical_state_root === canonicalChunk.state_root, 'LARGE_WORLD_REALITY_CHUNK_CANONICAL_ROOT_MISMATCH');
    const existing = this.realityChunkReplicas.get(snapshot.chunk_id);
    const priorSnapshot = this.appliedRealityChunkSnapshots.get(snapshot.chunk_root);
    if (priorSnapshot || existing?.version_root === snapshot.version_root) {
      const duplicate = createCoreRealityChunkSnapshotReceipt({
        snapshot,
        status: 'DUPLICATE',
        source_node: sourceNode,
        target_node: targetNode,
        evidence_refs: value.evidenceRefs ?? value.evidence_refs ?? []
      });
      fail(verifyRealityChunkSnapshotReceipt(duplicate).valid, 'LARGE_WORLD_REALITY_CHUNK_SNAPSHOT_DUPLICATE_RECEIPT_INVALID');
      return clone(duplicate);
    }
    if (existing && snapshot.parent_version !== null) {
      fail(existing.version_root === snapshot.parent_version, 'LARGE_WORLD_REALITY_CHUNK_SNAPSHOT_PARENT_VERSION_MISMATCH');
    }
    if (existing && snapshot.parent_version === null) {
      fail(value.resync === true, 'LARGE_WORLD_REALITY_CHUNK_SNAPSHOT_REPLACEMENT_REQUIRES_RESYNC');
    }
    this.realityChunkReplicas.set(snapshot.chunk_id, snapshot);
    const receipt = createCoreRealityChunkSnapshotReceipt({
      snapshot,
      status: 'APPLIED',
      source_node: sourceNode,
      target_node: targetNode,
      evidence_refs: value.evidenceRefs ?? value.evidence_refs ?? []
    });
    fail(verifyRealityChunkSnapshotReceipt(receipt).valid, 'LARGE_WORLD_REALITY_CHUNK_SNAPSHOT_RECEIPT_INVALID');
    this.appliedRealityChunkSnapshots.set(snapshot.chunk_root, clone(receipt));
    return clone(receipt);
  }

  createRealityChunkDelta(baseChunkInput, input = {}) {
    const value = record(input);
    const baseChunk = clone(value.base_chunk ?? value.baseChunk ?? baseChunkInput);
    const baseVerification = verifyRealityChunk(baseChunk);
    fail(baseVerification.valid, `LARGE_WORLD_REALITY_CHUNK_BASE_INVALID:${baseVerification.errors.join(',')}`);
    fail(baseChunk.world_id === this.options.worldId, 'LARGE_WORLD_REALITY_CHUNK_WORLD_MISMATCH');
    fail(this.chunks.has(baseChunk.chunk_id), 'LARGE_WORLD_REALITY_CHUNK_UNKNOWN');
    const operations = clone(value.operations ?? value.ops ?? []);
    fail(Array.isArray(operations), 'LARGE_WORLD_REALITY_CHUNK_DELTA_OPERATIONS_REQUIRED');
    const targetChunkInput = clone(value.target_chunk ?? value.targetChunk);
    let targetChunk = targetChunkInput;
    if (!targetChunk) {
      const overrides = record(value.target ?? value.target_overrides ?? value.targetOverrides);
      const overrideContentHash = overrides.content_hash ?? overrides.contentHash;
      const contentHash = value.content_hash ?? value.contentHash ?? overrideContentHash
        ?? rootHash({base_content_hash: baseChunk.content_hash, operations});
      const overrideDeltaRoot = overrides.delta_root ?? overrides.deltaRoot;
      const deltaRoot = value.delta_root ?? value.deltaRoot ?? overrideDeltaRoot
        ?? rootHash({base_version_root: baseChunk.version_root, content_hash: contentHash, operations});
      const parentVersion = overrides.parent_version ?? overrides.parentVersion ?? baseChunk.version_root;
      targetChunk = this.exportRealityChunkSnapshot(baseChunk.chunk_id, {
        ...overrides,
        parent_version: parentVersion,
        content_hash: contentHash,
        delta_root: deltaRoot,
        replication_class: overrides.replication_class ?? overrides.replicationClass ?? 'REPLICA'
      });
    }
    const targetVerification = verifyRealityChunk(targetChunk);
    fail(targetVerification.valid, `LARGE_WORLD_REALITY_CHUNK_TARGET_INVALID:${targetVerification.errors.join(',')}`);
    const sourceNode = String(value.source_node ?? value.sourceNode ?? this.nodeId);
    const targetNode = String(value.target_node ?? value.targetNode ?? 'node:unknown');
    fail(sourceNode.length > 0, 'LARGE_WORLD_REALITY_CHUNK_SOURCE_NODE_REQUIRED');
    fail(sourceNode === this.nodeId, 'LARGE_WORLD_REALITY_CHUNK_SOURCE_NODE_MISMATCH');
    fail(targetNode.length > 0, 'LARGE_WORLD_REALITY_CHUNK_TARGET_NODE_REQUIRED');
    const sequenceValue = integer(value.sequence, this.realityChunkSequence + 1, {min: 1, max: Number.MAX_SAFE_INTEGER});
    this.realityChunkSequence = Math.max(this.realityChunkSequence, sequenceValue);
    const delta = createCoreRealityChunkDelta({
      ...value,
      base_chunk: baseChunk,
      target_chunk: targetChunk,
      source_node: sourceNode,
      target_node: targetNode,
      sequence: sequenceValue,
      operations
    });
    const verification = verifyRealityChunkDelta(delta);
    fail(verification.valid, `LARGE_WORLD_REALITY_CHUNK_DELTA_INVALID:${verification.errors.join(',')}`);
    return clone(delta);
  }

  realityChunkDelta(baseChunkInput, input = {}) { return this.createRealityChunkDelta(baseChunkInput, input); }

  applyRealityChunkDelta(deltaInput, input = {}) {
    const delta = clone(deltaInput);
    const verification = verifyRealityChunkDelta(delta);
    fail(verification.valid, `LARGE_WORLD_REALITY_CHUNK_DELTA_INVALID:${verification.errors.join(',')}`);
    fail(delta.target_node === this.nodeId, 'LARGE_WORLD_REALITY_CHUNK_TARGET_NODE_MISMATCH');
    fail(delta.world_id === this.options.worldId, 'LARGE_WORLD_REALITY_CHUNK_WORLD_MISMATCH');
    const canonicalChunk = this.chunks.get(delta.chunk_id);
    fail(canonicalChunk, 'LARGE_WORLD_REALITY_CHUNK_UNKNOWN');
    fail(delta.canonical_state_root === canonicalChunk.state_root, 'LARGE_WORLD_REALITY_CHUNK_CANONICAL_ROOT_MISMATCH');
    const profile = delta.consistency_profile;
    if (profile) {
      const profileVerification = verifyRealityConsistencyProfile(profile);
      fail(profileVerification.valid, `LARGE_WORLD_REALITY_CHUNK_CONSISTENCY_PROFILE_INVALID:${profileVerification.errors.join(',')}`);
      fail(this.consistencyProfile, 'LARGE_WORLD_REALITY_CHUNK_CONSISTENCY_PROFILE_REQUIRED');
      fail(profile.profile_root === this.consistencyProfile.profile_root, 'LARGE_WORLD_REALITY_CHUNK_CONSISTENCY_PROFILE_MISMATCH');
      if (profile.authority_required || profile.lease_required || profile.fencing_required) {
        const authorityReceipt = clone(record(input.authorityReceipt ?? input.authority_receipt));
        fail(hex64(authorityReceipt.receipt_root), 'LARGE_WORLD_REALITY_CHUNK_AUTHORITY_RECEIPT_REQUIRED');
        fail(delta.authority_receipt_root === authorityReceipt.receipt_root, 'LARGE_WORLD_REALITY_CHUNK_AUTHORITY_RECEIPT_MISMATCH');
      }
    }
    const applied = this.appliedRealityChunkDeltas.get(delta.delta_root);
    if (applied) {
      const duplicate = createCoreRealityChunkDeltaReceipt({
        delta,
        status: 'DUPLICATE',
        evidence_refs: input.evidenceRefs ?? input.evidence_refs ?? []
      });
      fail(verifyRealityChunkDeltaReceipt(duplicate).valid, 'LARGE_WORLD_REALITY_CHUNK_DUPLICATE_RECEIPT_INVALID');
      return clone(duplicate);
    }
    const current = this.realityChunkReplicas.get(delta.chunk_id)
      ?? this.exportRealityChunkSnapshot(delta.chunk_id, {forceCanonical: true});
    fail(current.chunk_root === delta.base_chunk_root && current.version_root === delta.base_version_root, 'LARGE_WORLD_REALITY_CHUNK_BASE_VERSION_MISMATCH');
    const receipt = createCoreRealityChunkDeltaReceipt({
      delta,
      status: 'APPLIED',
      evidence_refs: input.evidenceRefs ?? input.evidence_refs ?? []
    });
    fail(verifyRealityChunkDeltaReceipt(receipt).valid, 'LARGE_WORLD_REALITY_CHUNK_RECEIPT_INVALID');
    this.realityChunkReplicas.set(delta.chunk_id, clone(delta.target_chunk));
    this.appliedRealityChunkDeltas.set(delta.delta_root, clone(receipt));
    return clone(receipt);
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

  createServerSovereigntyProfile(input = {}) {
    const value = record(input);
    const registrationRequested = value.register === true;
    const profileInput = {...value};
    delete profileInput.register;
    if (Object.keys(profileInput).length === 0 && this.sovereigntyProfile) return clone(this.sovereigntyProfile);
    const lease = profileInput.lease
      ?? profileInput.authority_lease
      ?? profileInput.authorityLease
      ?? this.acceptedAuthorityLease
      ?? this.authorityLease;
    fail(lease, 'LARGE_WORLD_SERVER_SOVEREIGNTY_LEASE_REQUIRED');
    const profile = createServerPseudoSovereigntyProfile({
      ...profileInput,
      sovereignty_id: profileInput.sovereignty_id ?? profileInput.sovereigntyId ?? `sovereignty:${this.options.worldId}:${this.shardId}`,
      world_id: this.options.worldId,
      shard_id: this.shardId,
      canonical_world_root: this.region.world_root,
      lease
    });
    const verification = verifyServerPseudoSovereigntyProfile(profile);
    fail(verification.valid, `LARGE_WORLD_SERVER_SOVEREIGNTY_PROFILE_INVALID:${verification.errors.join(',')}`);
    if (registrationRequested) this.sovereigntyProfile = clone(profile);
    return clone(profile);
  }

  serverSovereigntyProfile() { return this.sovereigntyProfile ? clone(this.sovereigntyProfile) : null; }

  createSovereigntyMigration(targetProfileInput, input = {}) {
    const value = record(input);
    const sourceProfile = this.sovereigntyProfile ?? this.createServerSovereigntyProfile(value.sourceProfile ?? value.source_profile ?? {});
    const targetValue = record(targetProfileInput);
    const targetProfile = targetValue.sovereigntyProfile
      ?? targetValue.serverSovereigntyProfile
      ?? targetValue.server_sovereignty_profile
      ?? targetProfileInput;
    const sourceSnapshot = this.exportReplicationSnapshot();
    return createServerSovereigntyMigration({
      ...value,
      source_profile: sourceProfile,
      target_profile: targetProfile,
      source_snapshot_root: value.source_snapshot_root ?? value.sourceSnapshotRoot ?? sourceSnapshot.snapshot_root
    });
  }

  sovereigntyMigration(targetProfileInput, input = {}) { return this.createSovereigntyMigration(targetProfileInput, input); }

  executeSovereigntyHandoff(migrationInput, input = {}) {
    const migration = clone(migrationInput);
    const migrationVerification = verifyServerSovereigntyMigration(migration);
    fail(migrationVerification.valid, `LARGE_WORLD_SERVER_SOVEREIGNTY_MIGRATION_INVALID:${migrationVerification.errors.join(',')}`);
    fail(migration.target_node === this.nodeId, 'LARGE_WORLD_SERVER_SOVEREIGNTY_TARGET_NODE_MISMATCH');
    const targetProfile = this.sovereigntyProfile;
    fail(targetProfile, 'LARGE_WORLD_SERVER_SOVEREIGNTY_TARGET_PROFILE_REQUIRED');
    fail(targetProfile.profile_root === migration.target_profile_root, 'LARGE_WORLD_SERVER_SOVEREIGNTY_TARGET_PROFILE_ROOT_MISMATCH');
    const targetLease = this.acceptedAuthorityLease ?? this.authorityLease;
    fail(targetLease?.lease_root === migration.target_lease_root, 'LARGE_WORLD_SERVER_SOVEREIGNTY_TARGET_LEASE_ROOT_MISMATCH');
    const leaseAdmission = checkAuthorityLease(targetLease, {
      authority_id: targetLease.authority_id,
      shard_id: this.shardId,
      semantic_scope: targetLease.semantic_scope,
      owner_node: this.nodeId,
      epoch: migration.target_epoch,
      fencing_token: migration.target_fencing_token,
      tick: this.worldTime.simulation_tick,
      current_lease: targetLease
    });
    fail(leaseAdmission.valid, `LARGE_WORLD_SERVER_SOVEREIGNTY_TARGET_LEASE_ADMISSION_FAILED:${leaseAdmission.errors.join(',')}`);
    const bundle = clone(input.durableBundle ?? input.durable_bundle ?? input.bundle);
    const bundleVerification = verifyDurableBundle(bundle);
    fail(bundleVerification.valid, `LARGE_WORLD_SERVER_SOVEREIGNTY_BUNDLE_INVALID:${bundleVerification.errors.join(',')}`);
    fail(bundle.world_id === this.options.worldId && bundle.region_root === this.region.region_root && bundle.world_root === this.region.world_root, 'LARGE_WORLD_SERVER_SOVEREIGNTY_BUNDLE_WORLD_MISMATCH');
    fail(bundle.replication_snapshot?.snapshot_root === migration.source_snapshot_root, 'LARGE_WORLD_SERVER_SOVEREIGNTY_BUNDLE_SNAPSHOT_MISMATCH');
    const authorityReceipt = replicationAuthorityReceipt(input.authorityReceipt ?? input.authority_receipt);
    if (authorityReceipt.lease_root !== undefined) fail(authorityReceipt.lease_root === targetLease.lease_root, 'LARGE_WORLD_SERVER_SOVEREIGNTY_AUTHORITY_LEASE_MISMATCH');
    if (authorityReceipt.migration_root !== undefined) fail(authorityReceipt.migration_root === migration.migration_root, 'LARGE_WORLD_SERVER_SOVEREIGNTY_AUTHORITY_MIGRATION_MISMATCH');
    const restoreReceipt = this.restoreDurableBundle(bundle, {authorityReceipt});
    const targetSnapshot = this.exportReplicationSnapshot();
    fail(targetSnapshot.snapshot_root === migration.source_snapshot_root, 'LARGE_WORLD_SERVER_SOVEREIGNTY_TARGET_SNAPSHOT_MISMATCH');
    const handoffReceipt = createServerSovereigntyHandoffReceipt({
      migration,
      source_snapshot_root: migration.source_snapshot_root,
      target_snapshot_root: targetSnapshot.snapshot_root,
      durable_bundle_root: bundle.bundle_root,
      restore_receipt_root: restoreReceipt.receipt_root,
      authority_receipt: authorityReceipt,
      evidence_refs: input.evidenceRefs ?? input.evidence_refs ?? []
    });
    fail(verifyServerSovereigntyHandoffReceipt(handoffReceipt).valid, 'LARGE_WORLD_SERVER_SOVEREIGNTY_HANDOFF_RECEIPT_INVALID');
    return {status: 'COMPLETED', migration: clone(migration), restore_receipt: clone(restoreReceipt), handoff_receipt: clone(handoffReceipt)};
  }

  handoffSovereignty(migrationInput, input = {}) { return this.executeSovereigntyHandoff(migrationInput, input); }

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

export function verifyLargeWorldMinimumRealityRecovery(recovery) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!recovery || typeof recovery !== 'object' || Array.isArray(recovery)) return {valid: false, errors: ['LARGE_WORLD_MINIMUM_REALITY_RECOVERY_NOT_OBJECT']};
  try {
    const copy = clone(recovery);
    const recoveryRoot = copy.recovery_root;
    delete copy.recovery_root;
    check(recovery.format === LARGE_WORLD_MINIMUM_REALITY_RECOVERY_FORMAT, 'LARGE_WORLD_MINIMUM_REALITY_RECOVERY_FORMAT_INVALID');
    check(recovery.version === LARGE_WORLD_RUNTIME_VERSION, 'LARGE_WORLD_MINIMUM_REALITY_RECOVERY_VERSION_INVALID');
    check(typeof recovery.world_id === 'string' && recovery.world_id.length > 0, 'LARGE_WORLD_MINIMUM_REALITY_RECOVERY_WORLD_ID_REQUIRED');
    check(typeof recovery.node_id === 'string' && recovery.node_id.length > 0, 'LARGE_WORLD_MINIMUM_REALITY_RECOVERY_NODE_ID_REQUIRED');
    check(Number.isSafeInteger(recovery.generation) && recovery.generation >= 0, 'LARGE_WORLD_MINIMUM_REALITY_RECOVERY_GENERATION_INVALID');
    check(hex64(recovery.region_root) && hex64(recovery.world_root), 'LARGE_WORLD_MINIMUM_REALITY_RECOVERY_WORLD_ROOT_INVALID');
    check(hex64(recovery.canonical_state_root), 'LARGE_WORLD_MINIMUM_REALITY_RECOVERY_CANONICAL_ROOT_INVALID');
    check(Number.isSafeInteger(recovery.world_time_tick) && recovery.world_time_tick >= 0, 'LARGE_WORLD_MINIMUM_REALITY_RECOVERY_WORLD_TIME_INVALID');
    check(Array.isArray(recovery.fault_roots) && recovery.fault_roots.every(hex64), 'LARGE_WORLD_MINIMUM_REALITY_RECOVERY_FAULT_ROOTS_INVALID');
    check(Array.isArray(recovery.faults), 'LARGE_WORLD_MINIMUM_REALITY_RECOVERY_FAULTS_REQUIRED');
    const faultIds = new Set();
    const actualFaultRoots = [];
    for (const fault of recovery.faults ?? []) {
      const verification = verifyRealityFault(fault);
      check(verification.valid, `LARGE_WORLD_MINIMUM_REALITY_RECOVERY_FAULT_INVALID:${fault?.fault_id ?? 'unknown'}:${verification.errors.join(',')}`);
      check(fault?.node_id === recovery.node_id, `LARGE_WORLD_MINIMUM_REALITY_RECOVERY_FAULT_NODE_MISMATCH:${fault?.fault_id ?? 'unknown'}`);
      check(!faultIds.has(fault?.fault_id), `LARGE_WORLD_MINIMUM_REALITY_RECOVERY_FAULT_DUPLICATE:${fault?.fault_id ?? 'unknown'}`);
      faultIds.add(fault?.fault_id);
      if (hex64(fault?.fault_root)) actualFaultRoots.push(fault.fault_root);
    }
    actualFaultRoots.sort(keySort);
    const declaredFaultRoots = [...(recovery.fault_roots ?? [])].sort(keySort);
    check(JSON.stringify(declaredFaultRoots) === JSON.stringify(actualFaultRoots), 'LARGE_WORLD_MINIMUM_REALITY_RECOVERY_FAULT_ROOTS_MISMATCH');

    const minimumVerification = verifyMinimumViableReality(recovery.minimum_reality);
    check(minimumVerification.valid, `LARGE_WORLD_MINIMUM_REALITY_RECOVERY_MINIMUM_INVALID:${minimumVerification.errors.join(',')}`);
    check(recovery.minimum_reality?.canonical_state_root === recovery.canonical_state_root, 'LARGE_WORLD_MINIMUM_REALITY_RECOVERY_MINIMUM_CANONICAL_ROOT_MISMATCH');
    check(recovery.minimum_reality?.world_time_tick === recovery.world_time_tick, 'LARGE_WORLD_MINIMUM_REALITY_RECOVERY_MINIMUM_WORLD_TIME_MISMATCH');
    check(JSON.stringify([...(recovery.minimum_reality?.fault_roots ?? [])].sort(keySort)) === JSON.stringify(declaredFaultRoots), 'LARGE_WORLD_MINIMUM_REALITY_RECOVERY_MINIMUM_FAULT_ROOTS_MISMATCH');
    check(recovery.recovery_status === recovery.minimum_reality?.recovery_status, 'LARGE_WORLD_MINIMUM_REALITY_RECOVERY_STATUS_MISMATCH');

    const planVerification = verifyRealityLoadSheddingPlan(recovery.load_shedding_plan);
    check(planVerification.valid, `LARGE_WORLD_MINIMUM_REALITY_RECOVERY_PLAN_INVALID:${planVerification.errors.join(',')}`);
    check(recovery.load_shedding_plan?.node_id === recovery.node_id, 'LARGE_WORLD_MINIMUM_REALITY_RECOVERY_PLAN_NODE_MISMATCH');
    check(recovery.load_shedding_plan?.minimum_reality_root === recovery.minimum_reality?.minimum_reality_root, 'LARGE_WORLD_MINIMUM_REALITY_RECOVERY_PLAN_MINIMUM_ROOT_MISMATCH');
    check(JSON.stringify([...(recovery.load_shedding_plan?.fault_roots ?? [])].sort(keySort)) === JSON.stringify(declaredFaultRoots), 'LARGE_WORLD_MINIMUM_REALITY_RECOVERY_PLAN_FAULT_ROOTS_MISMATCH');

    const selectionVerification = verifyPortfolioSelectionEnvelope(recovery.selection);
    check(selectionVerification.valid, `LARGE_WORLD_MINIMUM_REALITY_RECOVERY_SELECTION_INVALID:${selectionVerification.errors.join(',')}`);
    check(recovery.selection?.world_id === recovery.world_id && recovery.selection?.region_root === recovery.region_root && recovery.selection?.world_root === recovery.world_root, 'LARGE_WORLD_MINIMUM_REALITY_RECOVERY_SELECTION_WORLD_MISMATCH');
    check(recovery.selection?.resource_governor_plan_root === recovery.load_shedding_plan?.plan_root, 'LARGE_WORLD_MINIMUM_REALITY_RECOVERY_SELECTION_PLAN_ROOT_MISMATCH');
    check((recovery.selection?.selections ?? []).every(row => row.selected_quality_profile === 'PROXY'), 'LARGE_WORLD_MINIMUM_REALITY_RECOVERY_PROXY_REQUIRED');

    const sceneVerification = verifyLargeWorldSpatialScene(recovery.scene);
    check(sceneVerification.valid, `LARGE_WORLD_MINIMUM_REALITY_RECOVERY_SCENE_INVALID:${sceneVerification.errors.join(',')}`);
    check(recovery.scene?.large_world?.world_id === recovery.world_id && recovery.scene?.large_world?.region_root === recovery.region_root && recovery.scene?.large_world?.world_root === recovery.world_root, 'LARGE_WORLD_MINIMUM_REALITY_RECOVERY_SCENE_WORLD_MISMATCH');
    check(recovery.scene?.large_world?.selection_root === recovery.selection?.selection_root, 'LARGE_WORLD_MINIMUM_REALITY_RECOVERY_SCENE_SELECTION_ROOT_MISMATCH');
    check(recovery.scene?.large_world?.resource_governor_plan_root === recovery.load_shedding_plan?.plan_root, 'LARGE_WORLD_MINIMUM_REALITY_RECOVERY_SCENE_PLAN_ROOT_MISMATCH');
    const activeIds = [...(recovery.active_chunk_ids ?? [])].sort(keySort);
    check(JSON.stringify(activeIds) === JSON.stringify([...(recovery.selection?.active_chunk_ids ?? [])].sort(keySort)), 'LARGE_WORLD_MINIMUM_REALITY_RECOVERY_ACTIVE_CHUNKS_SELECTION_MISMATCH');
    check(JSON.stringify(activeIds) === JSON.stringify([...(recovery.scene?.large_world?.active_chunk_ids ?? [])].sort(keySort)), 'LARGE_WORLD_MINIMUM_REALITY_RECOVERY_ACTIVE_CHUNKS_SCENE_MISMATCH');
    check(recovery.canonical_state_mutated === false, 'LARGE_WORLD_MINIMUM_REALITY_RECOVERY_CANONICAL_MUTATION');
    check(recovery.authority?.provider_can_write_authoritative_world_state === false && recovery.authority?.rncs_authority_required === true, 'LARGE_WORLD_MINIMUM_REALITY_RECOVERY_AUTHORITY_ESCALATION');
    check(recovery.candidate_only === true && recovery.authoritative === false && recovery.canonical_write_authorized === false, 'LARGE_WORLD_MINIMUM_REALITY_RECOVERY_CANDIDATE_REQUIRED');
    check(recovery.commit_status === 'NOT_COMMITTED', 'LARGE_WORLD_MINIMUM_REALITY_RECOVERY_COMMIT_STATUS_INVALID');
    check(hex64(recoveryRoot) && largeWorldMinimumRealityRecoveryRoot(copy) === recoveryRoot, 'LARGE_WORLD_MINIMUM_REALITY_RECOVERY_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`LARGE_WORLD_MINIMUM_REALITY_RECOVERY_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, recovery_root: recovery.recovery_root ?? null};
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

function realityChunkPacketId({channelId, sequence, payloadRoot}) {
  return `reality-chunk-packet:${channelId}:${sequence}:${payloadRoot.slice(0, 24)}`;
}

export function createRealityChunkPacket(payloadInput, input = {}) {
  const value = record(input);
  const kind = String(value.kind ?? (payloadInput?.format === LARGE_WORLD_REALITY_CHUNK_DELTA_FORMAT ? 'DELTA' : 'SNAPSHOT')).toUpperCase();
  fail(['DELTA', 'SNAPSHOT'].includes(kind), 'LARGE_WORLD_REALITY_CHUNK_PACKET_KIND_INVALID');
  const delta = kind === 'DELTA' ? clone(payloadInput) : null;
  const snapshot = kind === 'SNAPSHOT' ? clone(payloadInput) : null;
  if (delta) {
    const verification = verifyRealityChunkDelta(delta);
    fail(verification.valid, `LARGE_WORLD_REALITY_CHUNK_PACKET_DELTA_INVALID:${verification.errors.join(',')}`);
  } else {
    const verification = verifyRealityChunk(snapshot);
    fail(verification.valid, `LARGE_WORLD_REALITY_CHUNK_PACKET_SNAPSHOT_INVALID:${verification.errors.join(',')}`);
  }
  const payloadRoot = delta?.delta_root ?? snapshot?.chunk_root;
  const channelId = String(value.channelId ?? value.channel_id ?? 'reality-chunk-replication');
  const senderId = String(value.senderId ?? value.sender_id ?? 'source');
  const recipientId = String(value.recipientId ?? value.recipient_id ?? 'target');
  const sequence = integer(value.sequence, 1, {min: 1, max: Number.MAX_SAFE_INTEGER});
  fail(channelId.length > 0 && senderId.length > 0 && recipientId.length > 0, 'LARGE_WORLD_REALITY_CHUNK_PACKET_ENDPOINT_REQUIRED');
  const resyncForPacketId = value.resyncForPacketId ?? value.resync_for_packet_id ?? null;
  const base = {
    format: LARGE_WORLD_REALITY_CHUNK_PACKET_FORMAT,
    version: '0.3.0',
    packet_id: realityChunkPacketId({channelId, sequence, payloadRoot}),
    channel_id: channelId,
    sender_id: senderId,
    recipient_id: recipientId,
    sequence,
    kind,
    chunk_id: delta?.chunk_id ?? snapshot?.chunk_id,
    payload_root: payloadRoot,
    delta,
    snapshot,
    resync_for_packet_id: resyncForPacketId === null ? null : String(resyncForPacketId),
    resync: value.resync === true,
    reliability: {mode: 'ack-and-retry', duplicate_safe: true, ordered_parent_versions: true, resync_supported: true}
  };
  return {...base, packet_root: rootHash(base), auth_tag: authenticationTag(base, value.authKey ?? value.auth_key)};
}

export function verifyRealityChunkPacket(packet, input = {}) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!packet || typeof packet !== 'object' || Array.isArray(packet)) return {valid: false, errors: ['LARGE_WORLD_REALITY_CHUNK_PACKET_NOT_OBJECT']};
  try {
    const copy = clone(packet);
    const packetRoot = copy.packet_root;
    const authTag = copy.auth_tag;
    delete copy.packet_root;
    delete copy.auth_tag;
    check(packet.format === LARGE_WORLD_REALITY_CHUNK_PACKET_FORMAT, 'LARGE_WORLD_REALITY_CHUNK_PACKET_FORMAT_INVALID');
    check(packet.version === '0.3.0', 'LARGE_WORLD_REALITY_CHUNK_PACKET_VERSION_INVALID');
    check(typeof packet.packet_id === 'string' && packet.packet_id.length > 0, 'LARGE_WORLD_REALITY_CHUNK_PACKET_ID_REQUIRED');
    check(typeof packet.channel_id === 'string' && packet.channel_id.length > 0, 'LARGE_WORLD_REALITY_CHUNK_PACKET_CHANNEL_REQUIRED');
    check(typeof packet.sender_id === 'string' && packet.sender_id.length > 0, 'LARGE_WORLD_REALITY_CHUNK_PACKET_SENDER_REQUIRED');
    check(typeof packet.recipient_id === 'string' && packet.recipient_id.length > 0, 'LARGE_WORLD_REALITY_CHUNK_PACKET_RECIPIENT_REQUIRED');
    check(Number.isSafeInteger(packet.sequence) && packet.sequence > 0, 'LARGE_WORLD_REALITY_CHUNK_PACKET_SEQUENCE_INVALID');
    check(['DELTA', 'SNAPSHOT'].includes(packet.kind), 'LARGE_WORLD_REALITY_CHUNK_PACKET_KIND_INVALID');
    const deltaVerification = packet.kind === 'DELTA' ? verifyRealityChunkDelta(packet.delta) : {valid: true, errors: []};
    const snapshotVerification = packet.kind === 'SNAPSHOT' ? verifyRealityChunk(packet.snapshot) : {valid: true, errors: []};
    check(deltaVerification.valid, `LARGE_WORLD_REALITY_CHUNK_PACKET_DELTA_INVALID:${deltaVerification.errors.join(',')}`);
    check(snapshotVerification.valid, `LARGE_WORLD_REALITY_CHUNK_PACKET_SNAPSHOT_INVALID:${snapshotVerification.errors.join(',')}`);
    check(packet.kind === 'DELTA' ? packet.snapshot === null : packet.delta === null, 'LARGE_WORLD_REALITY_CHUNK_PACKET_PAYLOAD_CARDINALITY_INVALID');
    const payloadRoot = packet.kind === 'DELTA' ? packet.delta?.delta_root : packet.snapshot?.chunk_root;
    check(packet.payload_root === payloadRoot && hex64(packet.payload_root), 'LARGE_WORLD_REALITY_CHUNK_PACKET_PAYLOAD_ROOT_INVALID');
    check(packet.chunk_id === (packet.kind === 'DELTA' ? packet.delta?.chunk_id : packet.snapshot?.chunk_id), 'LARGE_WORLD_REALITY_CHUNK_PACKET_CHUNK_ID_MISMATCH');
    check(packet.packet_id === realityChunkPacketId({channelId: packet.channel_id, sequence: packet.sequence, payloadRoot: packet.payload_root ?? ''}), 'LARGE_WORLD_REALITY_CHUNK_PACKET_ID_MISMATCH');
    check(packet.reliability?.mode === 'ack-and-retry' && packet.reliability?.duplicate_safe === true && packet.reliability?.resync_supported === true, 'LARGE_WORLD_REALITY_CHUNK_PACKET_RELIABILITY_INVALID');
    check(packet.resync_for_packet_id === null || (typeof packet.resync_for_packet_id === 'string' && packet.resync_for_packet_id.length > 0), 'LARGE_WORLD_REALITY_CHUNK_PACKET_RESYNC_ID_INVALID');
    check(typeof packet.resync === 'boolean', 'LARGE_WORLD_REALITY_CHUNK_PACKET_RESYNC_FLAG_INVALID');
    check(hex64(packetRoot) && rootHash(copy) === packetRoot, 'LARGE_WORLD_REALITY_CHUNK_PACKET_ROOT_MISMATCH');
    check(authenticationTagMatches(copy, authTag, input.authKey ?? input.auth_key), 'LARGE_WORLD_REALITY_CHUNK_PACKET_AUTH_INVALID');
  } catch (error) {
    errors.push(`LARGE_WORLD_REALITY_CHUNK_PACKET_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, packet_root: packet.packet_root ?? null};
}

export function createRealityChunkAck(packetInput, input = {}) {
  const packet = clone(packetInput);
  const packetVerification = verifyRealityChunkPacket(packet, input);
  fail(packetVerification.valid, `LARGE_WORLD_REALITY_CHUNK_ACK_PACKET_INVALID:${packetVerification.errors.join(',')}`);
  const value = record(input);
  const status = String(value.status ?? 'APPLIED').toUpperCase();
  fail(['APPLIED', 'DUPLICATE', 'REJECTED', 'RESYNC_REQUIRED'].includes(status), 'LARGE_WORLD_REALITY_CHUNK_ACK_STATUS_INVALID');
  const receiptRoot = value.receiptRoot ?? value.receipt_root ?? null;
  if (status === 'APPLIED' || status === 'DUPLICATE') fail(hex64(receiptRoot), 'LARGE_WORLD_REALITY_CHUNK_ACK_RECEIPT_ROOT_REQUIRED');
  const resync = value.resync === undefined || value.resync === null ? null : clone(value.resync);
  if (status === 'RESYNC_REQUIRED') fail(resync && resync.chunk_id === packet.chunk_id && hex64(resync.current_chunk_root) && hex64(resync.current_version_root), 'LARGE_WORLD_REALITY_CHUNK_ACK_RESYNC_REQUIRED');
  const base = {
    format: LARGE_WORLD_REALITY_CHUNK_ACK_FORMAT,
    version: '0.3.0',
    ack_id: `reality-chunk-ack:${packet.packet_id}:${status}`,
    packet_id: packet.packet_id,
    packet_root: packet.packet_root,
    channel_id: packet.channel_id,
    sender_id: String(value.senderId ?? value.sender_id ?? packet.recipient_id),
    recipient_id: String(value.recipientId ?? value.recipient_id ?? packet.sender_id),
    sequence: packet.sequence,
    kind: packet.kind,
    chunk_id: packet.chunk_id,
    payload_root: packet.payload_root,
    status,
    receipt_root: receiptRoot,
    error: value.error === undefined || value.error === null ? null : String(value.error),
    resync_for_packet_id: packet.resync_for_packet_id,
    resync
  };
  return {...base, ack_root: rootHash(base), auth_tag: authenticationTag(base, value.authKey ?? value.auth_key)};
}

export function verifyRealityChunkAck(ack, input = {}) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!ack || typeof ack !== 'object' || Array.isArray(ack)) return {valid: false, errors: ['LARGE_WORLD_REALITY_CHUNK_ACK_NOT_OBJECT']};
  try {
    const copy = clone(ack);
    const ackRoot = copy.ack_root;
    const authTag = copy.auth_tag;
    delete copy.ack_root;
    delete copy.auth_tag;
    check(ack.format === LARGE_WORLD_REALITY_CHUNK_ACK_FORMAT, 'LARGE_WORLD_REALITY_CHUNK_ACK_FORMAT_INVALID');
    check(ack.version === '0.3.0', 'LARGE_WORLD_REALITY_CHUNK_ACK_VERSION_INVALID');
    check(typeof ack.ack_id === 'string' && ack.ack_id.length > 0, 'LARGE_WORLD_REALITY_CHUNK_ACK_ID_REQUIRED');
    check(typeof ack.packet_id === 'string' && ack.packet_id.length > 0, 'LARGE_WORLD_REALITY_CHUNK_ACK_PACKET_ID_REQUIRED');
    check(hex64(ack.packet_root) && hex64(ack.payload_root), 'LARGE_WORLD_REALITY_CHUNK_ACK_ROOT_REFERENCE_INVALID');
    check(['DELTA', 'SNAPSHOT'].includes(ack.kind), 'LARGE_WORLD_REALITY_CHUNK_ACK_KIND_INVALID');
    check(['APPLIED', 'DUPLICATE', 'REJECTED', 'RESYNC_REQUIRED'].includes(ack.status), 'LARGE_WORLD_REALITY_CHUNK_ACK_STATUS_INVALID');
    check(Number.isSafeInteger(ack.sequence) && ack.sequence > 0, 'LARGE_WORLD_REALITY_CHUNK_ACK_SEQUENCE_INVALID');
    check(typeof ack.channel_id === 'string' && ack.channel_id.length > 0, 'LARGE_WORLD_REALITY_CHUNK_ACK_CHANNEL_REQUIRED');
    check(typeof ack.sender_id === 'string' && ack.sender_id.length > 0 && typeof ack.recipient_id === 'string' && ack.recipient_id.length > 0, 'LARGE_WORLD_REALITY_CHUNK_ACK_ENDPOINT_REQUIRED');
    if (ack.status === 'APPLIED' || ack.status === 'DUPLICATE') check(hex64(ack.receipt_root), 'LARGE_WORLD_REALITY_CHUNK_ACK_RECEIPT_ROOT_INVALID');
    else check(ack.receipt_root === null, 'LARGE_WORLD_REALITY_CHUNK_ACK_RECEIPT_ROOT_UNEXPECTED');
    if (ack.status === 'RESYNC_REQUIRED') check(ack.resync?.chunk_id === ack.chunk_id && hex64(ack.resync?.current_chunk_root) && hex64(ack.resync?.current_version_root), 'LARGE_WORLD_REALITY_CHUNK_ACK_RESYNC_INVALID');
    else check(ack.resync === null, 'LARGE_WORLD_REALITY_CHUNK_ACK_RESYNC_UNEXPECTED');
    check(ack.resync_for_packet_id === null || (typeof ack.resync_for_packet_id === 'string' && ack.resync_for_packet_id.length > 0), 'LARGE_WORLD_REALITY_CHUNK_ACK_RESYNC_ID_INVALID');
    check(hex64(ackRoot) && rootHash(copy) === ackRoot, 'LARGE_WORLD_REALITY_CHUNK_ACK_ROOT_MISMATCH');
    check(authenticationTagMatches(copy, authTag, input.authKey ?? input.auth_key), 'LARGE_WORLD_REALITY_CHUNK_ACK_AUTH_INVALID');
  } catch (error) {
    errors.push(`LARGE_WORLD_REALITY_CHUNK_ACK_VERIFY_EXCEPTION:${error.name}:${error.message}`);
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

export class RealityChunkReplicationLink {
  constructor({source, target, transport, authKey, channelId = 'reality-chunk-replication', sourceEndpoint = 'source', targetEndpoint = 'target'} = {}) {
    fail(source instanceof LargeWorldRuntime && target instanceof LargeWorldRuntime, 'LARGE_WORLD_REALITY_CHUNK_LINK_RUNTIME_REQUIRED');
    fail(transport && typeof transport.send === 'function' && typeof transport.register === 'function', 'LARGE_WORLD_REALITY_CHUNK_LINK_TRANSPORT_REQUIRED');
    fail(typeof authKey === 'string' && authKey.length > 0, 'LARGE_WORLD_REALITY_CHUNK_LINK_AUTH_KEY_REQUIRED');
    this.source = source;
    this.target = target;
    this.transport = transport;
    this.authKey = authKey;
    this.channelId = String(channelId);
    this.sourceEndpoint = String(sourceEndpoint);
    this.targetEndpoint = String(targetEndpoint);
    this.sequence = 0;
    this.pending = new Map();
    this.received = new Map();
    this.resyncRequests = new Map();
    this.acks = [];
    this.errors = [];
    this.transport.register(this.targetEndpoint, message => this.receiveAtTarget(message?.payload ?? message));
    this.transport.register(this.sourceEndpoint, message => this.receiveAtSource(message?.payload ?? message));
  }

  queue(packet) {
    this.sequence = packet.sequence;
    this.pending.set(packet.packet_id, {packet: clone(packet), retries: 0});
    this.transport.send(this.sourceEndpoint, this.targetEndpoint, 'reality-chunk-replication', packet);
    return clone(packet);
  }

  sendDelta(delta, input = {}) {
    const packet = createRealityChunkPacket(delta, {
      ...record(input),
      kind: 'DELTA',
      authKey: this.authKey,
      channelId: this.channelId,
      senderId: this.sourceEndpoint,
      recipientId: this.targetEndpoint,
      sequence: this.sequence + 1
    });
    return this.queue(packet);
  }

  sendSnapshot(snapshotOrChunkId, input = {}) {
    const value = record(input);
    let snapshot = value.snapshot ? clone(value.snapshot) : null;
    if (!snapshot && snapshotOrChunkId && typeof snapshotOrChunkId === 'object') snapshot = clone(snapshotOrChunkId);
    if (!snapshot) {
      const chunkId = String(snapshotOrChunkId ?? '');
      fail(chunkId.length > 0, 'LARGE_WORLD_REALITY_CHUNK_LINK_SNAPSHOT_CHUNK_ID_REQUIRED');
      snapshot = this.source.exportRealityChunkSnapshot(chunkId, {forceCanonical: true, ...record(value.snapshotOverrides ?? value.snapshot_overrides)});
    }
    const packet = createRealityChunkPacket(snapshot, {
      ...value,
      kind: 'SNAPSHOT',
      authKey: this.authKey,
      channelId: this.channelId,
      senderId: this.sourceEndpoint,
      recipientId: this.targetEndpoint,
      sequence: this.sequence + 1
    });
    return this.queue(packet);
  }

  receiveAtTarget(packet) {
    const verification = verifyRealityChunkPacket(packet, {authKey: this.authKey});
    if (!verification.valid || packet.recipient_id !== this.targetEndpoint || packet.sender_id !== this.sourceEndpoint || packet.channel_id !== this.channelId) {
      this.errors.push({kind: 'packet', errors: verification.errors.length ? verification.errors : ['LARGE_WORLD_REALITY_CHUNK_PACKET_ROUTE_INVALID']});
      return {status: 'REJECTED', errors: [...this.errors.at(-1).errors]};
    }
    const prior = this.received.get(packet.packet_id);
    if (prior) {
      const ack = createRealityChunkAck(packet, {authKey: this.authKey, status: prior.status, receiptRoot: prior.receipt_root, senderId: this.targetEndpoint, recipientId: this.sourceEndpoint});
      this.transport.send(this.targetEndpoint, this.sourceEndpoint, 'reality-chunk-replication-ack', ack);
      return clone(prior);
    }
    let receipt;
    try {
      if (packet.kind === 'DELTA') {
        receipt = this.target.applyRealityChunkDelta(packet.delta, {evidenceRefs: [packet.packet_root]});
      } else {
        receipt = this.target.applyRealityChunkSnapshot(packet.snapshot, {
          sourceNode: this.source.nodeId,
          targetNode: this.target.nodeId,
          resync: packet.resync,
          evidenceRefs: [packet.packet_root]
        });
      }
    } catch (error) {
      const message = String(error.message ?? error);
      this.errors.push({kind: 'apply', packet_id: packet.packet_id, error: message});
      const isResync = packet.kind === 'DELTA' && message.includes('LARGE_WORLD_REALITY_CHUNK_BASE_VERSION_MISMATCH');
      const current = isResync ? this.target.exportRealityChunkSnapshot(packet.chunk_id) : null;
      const ack = createRealityChunkAck(packet, {
        authKey: this.authKey,
        status: isResync ? 'RESYNC_REQUIRED' : 'REJECTED',
        error: message,
        resync: isResync ? {chunk_id: packet.chunk_id, current_chunk_root: current.chunk_root, current_version_root: current.version_root, reason: 'delta base version is not resident'} : null,
        senderId: this.targetEndpoint,
        recipientId: this.sourceEndpoint
      });
      this.transport.send(this.targetEndpoint, this.sourceEndpoint, 'reality-chunk-replication-ack', ack);
      return {status: isResync ? 'RESYNC_REQUIRED' : 'REJECTED', error: message};
    }
    this.received.set(packet.packet_id, clone(receipt));
    const ack = createRealityChunkAck(packet, {authKey: this.authKey, status: receipt.status, receiptRoot: receipt.receipt_root, senderId: this.targetEndpoint, recipientId: this.sourceEndpoint});
    this.transport.send(this.targetEndpoint, this.sourceEndpoint, 'reality-chunk-replication-ack', ack);
    return clone(receipt);
  }

  receiveAtSource(ack) {
    const verification = verifyRealityChunkAck(ack, {authKey: this.authKey});
    if (!verification.valid || ack.recipient_id !== this.sourceEndpoint || ack.sender_id !== this.targetEndpoint || ack.channel_id !== this.channelId) {
      this.errors.push({kind: 'ack', errors: verification.errors.length ? verification.errors : ['LARGE_WORLD_REALITY_CHUNK_ACK_ROUTE_INVALID']});
      return {status: 'REJECTED', errors: [...this.errors.at(-1).errors]};
    }
    this.acks.push(clone(ack));
    if (ack.status === 'APPLIED' || ack.status === 'DUPLICATE') {
      this.pending.delete(ack.packet_id);
      if (ack.kind === 'SNAPSHOT' && ack.resync_for_packet_id) {
        const original = this.pending.get(ack.resync_for_packet_id);
        if (original && !original.replayed_after_resync) {
          original.replayed_after_resync = true;
          original.retries += 1;
          this.transport.send(this.sourceEndpoint, this.targetEndpoint, 'reality-chunk-replication', original.packet);
        }
      }
    } else if (ack.status === 'RESYNC_REQUIRED') {
      this.resyncRequests.set(ack.packet_id, clone(ack.resync));
    }
    return clone(ack);
  }

  resyncPending(packetIdInput) {
    const packetId = String(packetIdInput ?? '');
    const entry = this.pending.get(packetId);
    fail(entry, 'LARGE_WORLD_REALITY_CHUNK_LINK_PENDING_PACKET_UNKNOWN');
    this.resyncRequests.delete(packetId);
    const snapshot = entry.packet.kind === 'DELTA' ? entry.packet.delta.base_chunk : entry.packet.snapshot;
    return this.sendSnapshot(snapshot, {resync: true, resyncForPacketId: packetId});
  }

  retryPending() {
    const resent = [];
    for (const entry of this.pending.values()) {
      entry.retries += 1;
      resent.push(clone(entry.packet));
      this.transport.send(this.sourceEndpoint, this.targetEndpoint, 'reality-chunk-replication', entry.packet);
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
      resync_request_packet_ids: [...this.resyncRequests.keys()].sort(keySort),
      ack_count: this.acks.length,
      errors: clone(this.errors)
    };
  }
}

export function verifyLargeWorldRealityAccessResolution(resolution) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!resolution || typeof resolution !== 'object' || Array.isArray(resolution)) return {valid: false, errors: ['LARGE_WORLD_REALITY_ACCESS_NOT_OBJECT']};
  try {
    check(resolution.format === LARGE_WORLD_REALITY_ACCESS_FORMAT, 'LARGE_WORLD_REALITY_ACCESS_FORMAT_INVALID');
    check(resolution.version === LARGE_WORLD_RUNTIME_VERSION, 'LARGE_WORLD_REALITY_ACCESS_VERSION_INVALID');
    check(typeof resolution.world_id === 'string' && resolution.world_id.length > 0, 'LARGE_WORLD_REALITY_ACCESS_WORLD_ID_REQUIRED');
    check(Number.isSafeInteger(resolution.generation) && resolution.generation >= 0, 'LARGE_WORLD_REALITY_ACCESS_GENERATION_INVALID');
    check(hex64(resolution.region_root), 'LARGE_WORLD_REALITY_ACCESS_REGION_ROOT_INVALID');
    check(hex64(resolution.world_root), 'LARGE_WORLD_REALITY_ACCESS_WORLD_ROOT_INVALID');
    check(typeof resolution.subject_id === 'string' && resolution.subject_id.length > 0, 'LARGE_WORLD_REALITY_ACCESS_SUBJECT_ID_REQUIRED');
    check(resolution.observer && Number.isSafeInteger(resolution.observer.x) && Number.isSafeInteger(resolution.observer.z), 'LARGE_WORLD_REALITY_ACCESS_OBSERVER_INVALID');
    const queryVerification = verifyRealityQuery(resolution.query);
    check(queryVerification.valid, `LARGE_WORLD_REALITY_ACCESS_QUERY_INVALID:${queryVerification.errors.join(',')}`);
    const resultVerification = verifyRealityQueryResult(resolution.query_result);
    check(resultVerification.valid, `LARGE_WORLD_REALITY_ACCESS_QUERY_RESULT_INVALID:${resultVerification.errors.join(',')}`);
    const workingSetVerification = verifyCognitiveWorkingSet(resolution.working_set);
    check(workingSetVerification.valid, `LARGE_WORLD_REALITY_ACCESS_WORKING_SET_INVALID:${workingSetVerification.errors.join(',')}`);
    const streamVerification = verifyStreamResolutionReceipt(resolution.stream_resolution);
    check(streamVerification.valid, `LARGE_WORLD_REALITY_ACCESS_STREAM_INVALID:${streamVerification.errors.join(',')}`);
    check(resolution.query?.subject_id === resolution.subject_id, 'LARGE_WORLD_REALITY_ACCESS_QUERY_SUBJECT_MISMATCH');
    check(resolution.query?.horizon?.horizon_root === resolution.horizon?.horizon_root, 'LARGE_WORLD_REALITY_ACCESS_HORIZON_ROOT_MISMATCH');
    check((resolution.query?.interest_graph?.graph_root ?? null) === (resolution.interest_graph?.graph_root ?? null), 'LARGE_WORLD_REALITY_ACCESS_INTEREST_GRAPH_ROOT_MISMATCH');
    check(resolution.query_result?.query_root === resolution.query?.query_root, 'LARGE_WORLD_REALITY_ACCESS_QUERY_ROOT_MISMATCH');
    check(resolution.working_set?.source_query_root === resolution.query_result?.query_root, 'LARGE_WORLD_REALITY_ACCESS_WORKING_SET_QUERY_ROOT_MISMATCH');
    check(resolution.working_set?.subject_id === resolution.subject_id, 'LARGE_WORLD_REALITY_ACCESS_WORKING_SET_SUBJECT_MISMATCH');
    check(resolution.stream_resolution?.stream_root === resolution.stream_root, 'LARGE_WORLD_REALITY_ACCESS_STREAM_ROOT_MISMATCH');
    check(Array.isArray(resolution.selected_object_ids), 'LARGE_WORLD_REALITY_ACCESS_SELECTED_OBJECTS_INVALID');
    check(Array.isArray(resolution.selected_chunk_ids), 'LARGE_WORLD_REALITY_ACCESS_SELECTED_CHUNKS_INVALID');
    check(Array.isArray(resolution.active_selected_chunk_ids), 'LARGE_WORLD_REALITY_ACCESS_ACTIVE_SELECTED_INVALID');
    check(Array.isArray(resolution.unresolved_object_ids), 'LARGE_WORLD_REALITY_ACCESS_UNRESOLVED_OBJECTS_INVALID');
    check(Array.isArray(resolution.unresolved_chunk_ids), 'LARGE_WORLD_REALITY_ACCESS_UNRESOLVED_CHUNKS_INVALID');
    check(Array.isArray(resolution.forced_chunk_ids), 'LARGE_WORLD_REALITY_ACCESS_FORCED_CHUNKS_INVALID');
    const workingObjectIds = (resolution.working_set?.objects ?? []).map(row => String(row.object_id));
    check(JSON.stringify(workingObjectIds) === JSON.stringify(resolution.selected_object_ids ?? []), 'LARGE_WORLD_REALITY_ACCESS_SELECTED_OBJECTS_MISMATCH');
    check(JSON.stringify([...(resolution.stream_resolution?.forced_chunk_ids ?? [])].sort(keySort)) === JSON.stringify([...(resolution.forced_chunk_ids ?? [])].sort(keySort)), 'LARGE_WORLD_REALITY_ACCESS_FORCED_CHUNKS_MISMATCH');
    check((resolution.selected_chunk_ids ?? []).every(chunkId => (resolution.forced_chunk_ids ?? []).includes(chunkId)), 'LARGE_WORLD_REALITY_ACCESS_SELECTED_CHUNKS_NOT_FORCED');
    check((resolution.active_selected_chunk_ids ?? []).every(chunkId => (resolution.stream_resolution?.active_chunk_ids ?? []).includes(chunkId)), 'LARGE_WORLD_REALITY_ACCESS_ACTIVE_SELECTED_NOT_ACTIVE');
    check((resolution.unresolved_chunk_ids ?? []).every(chunkId => !(resolution.stream_resolution?.active_chunk_ids ?? []).includes(chunkId)), 'LARGE_WORLD_REALITY_ACCESS_UNRESOLVED_CHUNK_ACTIVE');
    check(JSON.stringify([...(resolution.active_selected_chunk_ids ?? []), ...(resolution.unresolved_chunk_ids ?? [])].sort(keySort)) === JSON.stringify([...(resolution.selected_chunk_ids ?? [])].sort(keySort)), 'LARGE_WORLD_REALITY_ACCESS_SELECTED_CHUNK_PARTITION_MISMATCH');
    check(JSON.stringify([...(resolution.stream_resolution?.active_chunk_ids ?? [])].sort(keySort)) === JSON.stringify([...(resolution.active_chunk_ids ?? resolution.stream_resolution?.active_chunk_ids ?? [])].sort(keySort)), 'LARGE_WORLD_REALITY_ACCESS_ACTIVE_CHUNKS_MISMATCH');
    check(resolution.canonical_state_mutated === false, 'LARGE_WORLD_REALITY_ACCESS_CANONICAL_MUTATION');
    check(resolution.authority?.provider_can_write_authoritative_world_state === false, 'LARGE_WORLD_REALITY_ACCESS_AUTHORITY_ESCALATION');
    check(resolution.authority?.rncs_authority_required === true, 'LARGE_WORLD_REALITY_ACCESS_RNCS_AUTHORITY_REQUIRED');
    check(resolution.candidate_only === true && resolution.authoritative === false, 'LARGE_WORLD_REALITY_ACCESS_STATUS_INVALID');
    check(resolution.commit_status === 'NOT_COMMITTED', 'LARGE_WORLD_REALITY_ACCESS_COMMIT_STATUS_INVALID');
    const copy = clone(resolution);
    const root = copy.resolution_root;
    delete copy.resolution_root;
    check(hex64(root) && rootHash(copy) === root, 'LARGE_WORLD_REALITY_ACCESS_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`LARGE_WORLD_REALITY_ACCESS_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, resolution_root: resolution.resolution_root ?? null};
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
      if (row?.power_plan_root !== undefined) check(row.power_plan_root === null || hex64(row.power_plan_root), 'LARGE_WORLD_PORTFOLIO_SELECTION_POWER_PLAN_ROOT_INVALID');
      if (row?.power_decision_candidate_id !== undefined) check(row.power_decision_candidate_id === null || (typeof row.power_decision_candidate_id === 'string' && row.power_decision_candidate_id.length > 0), 'LARGE_WORLD_PORTFOLIO_SELECTION_POWER_DECISION_ID_INVALID');
      if (row?.power_decision_kind !== undefined) check(row.power_decision_kind === null || POWER_BINDABLE_CANDIDATE_KINDS.has(row.power_decision_kind), 'LARGE_WORLD_PORTFOLIO_SELECTION_POWER_DECISION_KIND_INVALID');
      if (row?.power_action !== undefined) check(row.power_action === null || Object.hasOwn(POWER_QUALITY_LOWERING, row.power_action), 'LARGE_WORLD_PORTFOLIO_SELECTION_POWER_ACTION_INVALID');
      if (row?.power_action_effect !== undefined) check(row.power_action_effect === null || row.power_action_effect === 'UNBOUND' || Object.values(POWER_QUALITY_LOWERING).some(policy => policy.effect === row.power_action_effect), 'LARGE_WORLD_PORTFOLIO_SELECTION_POWER_EFFECT_INVALID');
      if (row?.power_quality_override !== undefined) check(row.power_quality_override === null || row.power_quality_override === 'PROXY', 'LARGE_WORLD_PORTFOLIO_SELECTION_POWER_QUALITY_OVERRIDE_INVALID');
      if (row?.power_decision_bound !== undefined) check(row.power_decision_bound === null || typeof row.power_decision_bound === 'boolean', 'LARGE_WORLD_PORTFOLIO_SELECTION_POWER_BOUND_INVALID');
      if (row?.causal_physical_profile_root !== undefined) check(row.causal_physical_profile_root === null || hex64(row.causal_physical_profile_root), 'LARGE_WORLD_PORTFOLIO_SELECTION_CAUSAL_PHYSICAL_ROOT_INVALID');
      if (row?.causal_physical_causal_level !== undefined) check(row.causal_physical_causal_level === null || /^C[0-5]$/.test(row.causal_physical_causal_level), 'LARGE_WORLD_PORTFOLIO_SELECTION_CAUSAL_LEVEL_INVALID');
      if (row?.causal_physical_physical_level !== undefined) check(row.causal_physical_physical_level === null || /^P[0-5]$/.test(row.causal_physical_physical_level), 'LARGE_WORLD_PORTFOLIO_SELECTION_PHYSICAL_LEVEL_INVALID');
      if (row?.causal_physical_execution_status !== undefined) check(row.causal_physical_execution_status === null || ['READY', 'BLOCKED_RESOURCE'].includes(row.causal_physical_execution_status), 'LARGE_WORLD_PORTFOLIO_SELECTION_CAUSAL_PHYSICAL_EXECUTION_STATUS_INVALID');
      if (row?.causal_physical_resource_status !== undefined) check(row.causal_physical_resource_status === null || ['ADMITTED', 'RESOURCE_INSUFFICIENT'].includes(row.causal_physical_resource_status), 'LARGE_WORLD_PORTFOLIO_SELECTION_CAUSAL_PHYSICAL_RESOURCE_STATUS_INVALID');
      if (row?.causal_physical_execution !== undefined) check(row.causal_physical_execution === null || (typeof row.causal_physical_execution === 'object' && !Array.isArray(row.causal_physical_execution)), 'LARGE_WORLD_PORTFOLIO_SELECTION_CAUSAL_PHYSICAL_EXECUTION_INVALID');
      if (row?.causal_physical_resource_costs !== undefined) check(row.causal_physical_resource_costs === null || (typeof row.causal_physical_resource_costs === 'object' && !Array.isArray(row.causal_physical_resource_costs)), 'LARGE_WORLD_PORTFOLIO_SELECTION_CAUSAL_PHYSICAL_COSTS_INVALID');
      if (row?.selected_resource_costs !== undefined) {
        check(row.selected_resource_costs && typeof row.selected_resource_costs === 'object' && !Array.isArray(row.selected_resource_costs), 'LARGE_WORLD_PORTFOLIO_SELECTION_SELECTED_COSTS_INVALID');
        for (const field of WORKING_SET_COST_FIELDS) check(Number.isSafeInteger(row.selected_resource_costs?.[field]) && row.selected_resource_costs[field] >= 0, `LARGE_WORLD_PORTFOLIO_SELECTION_SELECTED_COST_${field}_INVALID`);
      }
      if (row?.working_set_requested_quality_profile !== undefined) check(row.working_set_requested_quality_profile === null || LARGE_WORLD_SPATIAL_QUALITY_PROFILES.includes(row.working_set_requested_quality_profile), 'LARGE_WORLD_PORTFOLIO_SELECTION_WORKING_SET_REQUESTED_QUALITY_INVALID');
      if (row?.working_set_minimum_quality_profile !== undefined) check(LARGE_WORLD_SPATIAL_QUALITY_PROFILES.includes(row.working_set_minimum_quality_profile), 'LARGE_WORLD_PORTFOLIO_SELECTION_WORKING_SET_MINIMUM_QUALITY_INVALID');
      if (row?.working_set_downgraded !== undefined) check(typeof row.working_set_downgraded === 'boolean', 'LARGE_WORLD_PORTFOLIO_SELECTION_WORKING_SET_DOWNGRADED_INVALID');
      check(hex64(row?.selection_root), 'LARGE_WORLD_PORTFOLIO_SELECTION_ROW_ROOT_INVALID');
      check(row?.candidate_only === true && row?.authoritative === false && row?.canonical_write_authorized === false, 'LARGE_WORLD_PORTFOLIO_SELECTION_ROW_AUTHORITY_INVALID');
    }
    check(Number.isSafeInteger(selection.fallback_count) && selection.fallback_count >= 0, 'LARGE_WORLD_PORTFOLIO_SELECTION_FALLBACK_COUNT_INVALID');
    check(selection.fallback_count === (selection.selections ?? []).filter(row => row.fallback_used).length, 'LARGE_WORLD_PORTFOLIO_SELECTION_FALLBACK_COUNT_MISMATCH');
    if (selection.resource_governor_plan_root !== undefined) {
      const governorRoot = selection.resource_governor_plan_root;
      check(governorRoot === null || hex64(governorRoot), 'LARGE_WORLD_PORTFOLIO_SELECTION_GOVERNOR_ROOT_INVALID');
      check(governorRoot === null || typeof selection.resource_governor_power_mode === 'string', 'LARGE_WORLD_PORTFOLIO_SELECTION_GOVERNOR_POWER_MODE_INVALID');
      check(governorRoot === null || typeof selection.resource_governor_load_shedding_level === 'string', 'LARGE_WORLD_PORTFOLIO_SELECTION_GOVERNOR_LOAD_LEVEL_INVALID');
      check(Number.isSafeInteger(selection.resource_governor_decision_count) && selection.resource_governor_decision_count >= 0, 'LARGE_WORLD_PORTFOLIO_SELECTION_GOVERNOR_DECISION_COUNT_INVALID');
      check(Number.isSafeInteger(selection.power_downgrade_count) && selection.power_downgrade_count >= 0, 'LARGE_WORLD_PORTFOLIO_SELECTION_POWER_DOWNGRADE_COUNT_INVALID');
      check(selection.power_downgrade_count === (selection.selections ?? []).filter(row => row.power_quality_override === 'PROXY').length, 'LARGE_WORLD_PORTFOLIO_SELECTION_POWER_DOWNGRADE_COUNT_MISMATCH');
      check(Array.isArray(selection.unbound_governor_chunk_ids), 'LARGE_WORLD_PORTFOLIO_SELECTION_UNBOUND_GOVERNOR_IDS_INVALID');
      const unboundIds = [...selection.unbound_governor_chunk_ids].sort(keySort);
      const expectedUnboundIds = (selection.selections ?? []).filter(row => row.power_decision_bound === false).map(row => row.chunk_id).sort(keySort);
      check(JSON.stringify(unboundIds) === JSON.stringify(expectedUnboundIds), 'LARGE_WORLD_PORTFOLIO_SELECTION_UNBOUND_GOVERNOR_IDS_MISMATCH');
      for (const row of selection.selections ?? []) {
        check(row.power_plan_root === governorRoot, 'LARGE_WORLD_PORTFOLIO_SELECTION_ROW_GOVERNOR_ROOT_MISMATCH');
      }
    }
    if (selection.causal_physical_profile_roots !== undefined) {
      const profileRoots = selection.causal_physical_profile_roots;
      check(profileRoots && typeof profileRoots === 'object' && !Array.isArray(profileRoots), 'LARGE_WORLD_PORTFOLIO_SELECTION_CAUSAL_PHYSICAL_ROOTS_INVALID');
      const declared = Object.entries(profileRoots ?? {}).sort(([a], [b]) => keySort(a, b));
      for (const [chunkId, profileRoot] of declared) {
        check(typeof chunkId === 'string' && chunkId.length > 0 && hex64(profileRoot), 'LARGE_WORLD_PORTFOLIO_SELECTION_CAUSAL_PHYSICAL_ROOT_ENTRY_INVALID');
      }
      const expected = (selection.selections ?? [])
        .filter(row => row.causal_physical_profile_root)
        .map(row => [row.chunk_id, row.causal_physical_profile_root])
        .sort(([a], [b]) => keySort(a, b));
      check(JSON.stringify(declared) === JSON.stringify(expected), 'LARGE_WORLD_PORTFOLIO_SELECTION_CAUSAL_PHYSICAL_ROOTS_MISMATCH');
    }
    if (selection.causal_physical_ready_count !== undefined) check(Number.isSafeInteger(selection.causal_physical_ready_count) && selection.causal_physical_ready_count >= 0 && selection.causal_physical_ready_count === (selection.selections ?? []).filter(row => row.causal_physical_execution_status === 'READY').length, 'LARGE_WORLD_PORTFOLIO_SELECTION_CAUSAL_PHYSICAL_READY_COUNT_INVALID');
    if (selection.causal_physical_blocked_count !== undefined) check(Number.isSafeInteger(selection.causal_physical_blocked_count) && selection.causal_physical_blocked_count >= 0 && selection.causal_physical_blocked_count === (selection.selections ?? []).filter(row => row.causal_physical_execution_status === 'BLOCKED_RESOURCE').length, 'LARGE_WORLD_PORTFOLIO_SELECTION_CAUSAL_PHYSICAL_BLOCKED_COUNT_INVALID');
    if (selection.working_set_budget !== undefined) {
      const budget = selection.working_set_budget;
      check(budget && typeof budget === 'object' && !Array.isArray(budget), 'LARGE_WORLD_PORTFOLIO_SELECTION_WORKING_SET_BUDGET_INVALID');
      check(budget?.format === LARGE_WORLD_WORKING_SET_BUDGET_FORMAT, 'LARGE_WORLD_PORTFOLIO_SELECTION_WORKING_SET_BUDGET_FORMAT_INVALID');
      check(budget?.version === '0.1.0', 'LARGE_WORLD_PORTFOLIO_SELECTION_WORKING_SET_BUDGET_VERSION_INVALID');
      check(budget?.available && typeof budget.available === 'object' && !Array.isArray(budget.available), 'LARGE_WORLD_PORTFOLIO_SELECTION_WORKING_SET_BUDGET_AVAILABLE_INVALID');
      for (const [field, amount] of Object.entries(budget?.available ?? {})) check(WORKING_SET_COST_FIELDS.includes(field) && Number.isSafeInteger(amount) && amount >= 0, 'LARGE_WORLD_PORTFOLIO_SELECTION_WORKING_SET_BUDGET_VALUE_INVALID');
      check(budget.source_budget_root === null || hex64(budget.source_budget_root), 'LARGE_WORLD_PORTFOLIO_SELECTION_WORKING_SET_SOURCE_ROOT_INVALID');
      check(hex64(selection.working_set_budget_root) && rootHash(budget) === selection.working_set_budget_root, 'LARGE_WORLD_PORTFOLIO_SELECTION_WORKING_SET_BUDGET_ROOT_MISMATCH');
      const policy = selection.working_set_quality_policy;
      check(policy && typeof policy === 'object' && !Array.isArray(policy), 'LARGE_WORLD_PORTFOLIO_SELECTION_WORKING_SET_POLICY_INVALID');
      check(policy?.format === LARGE_WORLD_QUALITY_ALLOCATION_POLICY_FORMAT && policy?.version === '0.1.0', 'LARGE_WORLD_PORTFOLIO_SELECTION_WORKING_SET_POLICY_FORMAT_INVALID');
      check(policy?.algorithm === 'priority-weighted-greedy-downgrade', 'LARGE_WORLD_PORTFOLIO_SELECTION_WORKING_SET_POLICY_ALGORITHM_INVALID');
      check(LARGE_WORLD_SPATIAL_QUALITY_PROFILES.includes(policy?.minimum_quality_profile), 'LARGE_WORLD_PORTFOLIO_SELECTION_WORKING_SET_POLICY_MINIMUM_INVALID');
      check(policy?.minimum_quality_by_chunk && typeof policy.minimum_quality_by_chunk === 'object' && !Array.isArray(policy.minimum_quality_by_chunk), 'LARGE_WORLD_PORTFOLIO_SELECTION_WORKING_SET_POLICY_MINIMUM_MAP_INVALID');
      check(policy?.priority_by_chunk && typeof policy.priority_by_chunk === 'object' && !Array.isArray(policy.priority_by_chunk), 'LARGE_WORLD_PORTFOLIO_SELECTION_WORKING_SET_POLICY_PRIORITY_MAP_INVALID');
      for (const value of Object.values(policy?.minimum_quality_by_chunk ?? {})) check(LARGE_WORLD_SPATIAL_QUALITY_PROFILES.includes(value), 'LARGE_WORLD_PORTFOLIO_SELECTION_WORKING_SET_POLICY_MINIMUM_VALUE_INVALID');
      for (const value of Object.values(policy?.priority_by_chunk ?? {})) check(Number.isSafeInteger(value) && value >= 0 && value <= 100, 'LARGE_WORLD_PORTFOLIO_SELECTION_WORKING_SET_POLICY_PRIORITY_VALUE_INVALID');
      for (const field of WORKING_SET_COST_FIELDS) {
        check(Number.isSafeInteger(selection.working_set_initial_resource_costs?.[field]) && selection.working_set_initial_resource_costs[field] >= 0, `LARGE_WORLD_PORTFOLIO_SELECTION_WORKING_SET_INITIAL_COST_${field}_INVALID`);
        check(Number.isSafeInteger(selection.working_set_resource_costs?.[field]) && selection.working_set_resource_costs[field] >= 0, `LARGE_WORLD_PORTFOLIO_SELECTION_WORKING_SET_COST_${field}_INVALID`);
        const remaining = selection.working_set_resource_remaining?.[field];
        check(remaining === null || Number.isSafeInteger(remaining), `LARGE_WORLD_PORTFOLIO_SELECTION_WORKING_SET_REMAINING_${field}_INVALID`);
      }
      const expectedWorkingSetCosts = sumWorkingSetCosts(selection.selections ?? []);
      for (const field of WORKING_SET_COST_FIELDS) {
        check(selection.working_set_resource_costs[field] === expectedWorkingSetCosts[field], `LARGE_WORLD_PORTFOLIO_SELECTION_WORKING_SET_COST_${field}_MISMATCH`);
        const available = selection.working_set_budget.available[field] ?? null;
        const expectedRemaining = available === null ? null : available - expectedWorkingSetCosts[field];
        check(selection.working_set_resource_remaining[field] === expectedRemaining, `LARGE_WORLD_PORTFOLIO_SELECTION_WORKING_SET_REMAINING_${field}_MISMATCH`);
      }
      check(['WITHIN_BUDGET', 'DOWNGRADED_TO_FIT', 'MINIMUM_REALITY_OVER_BUDGET'].includes(selection.working_set_budget_status), 'LARGE_WORLD_PORTFOLIO_SELECTION_WORKING_SET_STATUS_INVALID');
      check(Number.isSafeInteger(selection.working_set_downgrade_count) && selection.working_set_downgrade_count >= 0, 'LARGE_WORLD_PORTFOLIO_SELECTION_WORKING_SET_DOWNGRADE_COUNT_INVALID');
      check(Array.isArray(selection.working_set_downgrade_chunk_ids), 'LARGE_WORLD_PORTFOLIO_SELECTION_WORKING_SET_DOWNGRADE_IDS_INVALID');
      check(Array.isArray(selection.working_set_downgrades), 'LARGE_WORLD_PORTFOLIO_SELECTION_WORKING_SET_DOWNGRADES_INVALID');
      check(selection.working_set_downgrade_count === selection.working_set_downgrades.length, 'LARGE_WORLD_PORTFOLIO_SELECTION_WORKING_SET_DOWNGRADE_COUNT_MISMATCH');
      const downgradeIds = [...new Set(selection.working_set_downgrades.map(item => item?.chunk_id))].sort(keySort);
      check(JSON.stringify(downgradeIds) === JSON.stringify([...selection.working_set_downgrade_chunk_ids].sort(keySort)), 'LARGE_WORLD_PORTFOLIO_SELECTION_WORKING_SET_DOWNGRADE_IDS_MISMATCH');
      check((selection.selections ?? []).filter(row => row.working_set_downgraded).every(row => selection.working_set_downgrade_chunk_ids.includes(row.chunk_id)), 'LARGE_WORLD_PORTFOLIO_SELECTION_WORKING_SET_ROW_DOWNGRADE_MISMATCH');
    }
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
