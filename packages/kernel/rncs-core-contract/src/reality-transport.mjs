import {
  ContractError,
  checkAuthorityLease,
  rootHash
} from './index.mjs';

export const REALITY_TRANSPORT_VERSION = '0.3.0';
export const REALITY_TRANSPORT_PROFILE_FORMAT = 'rncs.reality-transport-profile.v0.3';
export const REALITY_TRANSPORT_PACKET_FORMAT = 'rncs.reality-transport-packet.v0.3';
export const REALITY_NODE_DISCOVERY_FORMAT = 'rncs.reality-node-discovery.v0.3';
export const REALITY_NODE_ASSOCIATION_FORMAT = 'rncs.reality-node-association.v0.3';
export const REALITY_ROAMING_DECISION_FORMAT = 'rncs.reality-roaming-decision.v0.3';
export const REALITY_ORGAN_LINK_FORMAT = 'rncs.reality-organ-link.v0.3';

export const REALITY_TRANSPORT_KINDS = Object.freeze(['FIBER', 'WIFI', 'BLUETOOTH', 'RDN']);
export const REALITY_QOS_CLASSES = Object.freeze([
  'PLAYER_CONTROL',
  'AUTHORITY_EVENT',
  'STATE_DELTA',
  'AUDIO',
  'VISUAL_PAGE',
  'EVIDENCE_ROOT',
  'BACKGROUND_REFINEMENT'
]);
export const REALITY_TRANSPORT_PACKET_TYPES = Object.freeze([
  'CONTROL',
  'AUTHORITY_EVENT',
  'STATE_DELTA',
  'REPRESENTATION_DELTA',
  'VISUAL_PAGE',
  'AUDIO_FIELD',
  'EVIDENCE_ROOT',
  'ORGAN_STATE',
  'DISCOVERY',
  'ACK',
  'NACK',
  'RESYNC_REQUEST'
]);
export const REALITY_TRANSPORT_LOSS_MODES = Object.freeze(['NONE', 'RECOVERABLE', 'BEST_EFFORT']);
export const REALITY_NODE_ASSOCIATION_STATUSES = Object.freeze(['ASSOCIATED', 'ROAMING', 'RELEASED']);
export const REALITY_ROAMING_STATUSES = Object.freeze(['ACCEPTED', 'REJECTED']);
export const REALITY_ORGAN_LINK_POWER_MODES = Object.freeze(['LOW_POWER', 'NORMAL']);

const clone = value => structuredClone(value);
const record = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const keySort = (a, b) => Buffer.compare(Buffer.from(String(a), 'utf8'), Buffer.from(String(b), 'utf8'));
const hex64 = value => typeof value === 'string' && /^[0-9a-f]{64}$/i.test(value);
const fail = (condition, code) => { if (!condition) throw new ContractError(code); };
const strings = values => [...new Set((Array.isArray(values) ? values : []).map(String).filter(Boolean))].sort(keySort);
const text = (value, code, fallback = '') => {
  const result = String(value ?? fallback);
  fail(result.length > 0, code);
  return result;
};
const integer = (value, code, fallback = 0, {min = 0, max = Number.MAX_SAFE_INTEGER} = {}) => {
  const result = value === undefined || value === null ? fallback : Number(value);
  fail(Number.isSafeInteger(result) && result >= min && result <= max, code);
  return result;
};
const bool = (value, code, fallback) => {
  const result = value === undefined ? fallback : value;
  fail(typeof result === 'boolean', code);
  return result;
};
const root = (value, code, fallback = '0'.repeat(64)) => {
  const result = String(value ?? fallback).toLowerCase();
  fail(hex64(result), code);
  return result;
};

function normalizeTransportProfile(input = {}) {
  const value = record(input);
  const transport_kind = String(value.transport_kind ?? value.transportKind ?? 'FIBER').toUpperCase();
  const qos_class = String(value.qos_class ?? value.qosClass ?? 'STATE_DELTA').toUpperCase();
  const loss_mode = String(value.loss_mode ?? value.lossMode ?? 'RECOVERABLE').toUpperCase();
  fail(REALITY_TRANSPORT_KINDS.includes(transport_kind), 'RNCS_TRANSPORT_KIND_INVALID');
  fail(REALITY_QOS_CLASSES.includes(qos_class), 'RNCS_TRANSPORT_QOS_CLASS_INVALID');
  fail(REALITY_TRANSPORT_LOSS_MODES.includes(loss_mode), 'RNCS_TRANSPORT_LOSS_MODE_INVALID');
  const defaultLowPower = transport_kind === 'BLUETOOTH';
  const defaultDiscovery = transport_kind === 'WIFI' || transport_kind === 'BLUETOOTH';
  return {
    format: REALITY_TRANSPORT_PROFILE_FORMAT,
    version: REALITY_TRANSPORT_VERSION,
    profile_id: text(value.profile_id ?? value.profileId, 'RNCS_TRANSPORT_PROFILE_ID_REQUIRED'),
    transport_kind,
    qos_class,
    coverage: text(value.coverage, 'RNCS_TRANSPORT_COVERAGE_REQUIRED', transport_kind === 'WIFI' || transport_kind === 'BLUETOOTH' ? 'LOCAL' : 'CROSS_REGION'),
    bandwidth_mbps: integer(value.bandwidth_mbps ?? value.bandwidthMbps, 'RNCS_TRANSPORT_BANDWIDTH_INVALID', transport_kind === 'FIBER' ? 10000 : transport_kind === 'WIFI' ? 500 : 2, {min: 0}),
    latency_budget_ms: integer(value.latency_budget_ms ?? value.latencyBudgetMs, 'RNCS_TRANSPORT_LATENCY_INVALID', transport_kind === 'FIBER' ? 10 : transport_kind === 'WIFI' ? 30 : 200, {min: 0}),
    reliability_ppm: integer(value.reliability_ppm ?? value.reliabilityPpm, 'RNCS_TRANSPORT_RELIABILITY_INVALID', 999000, {min: 0, max: 1000000}),
    freshness_budget_ms: integer(value.freshness_budget_ms ?? value.freshnessBudgetMs, 'RNCS_TRANSPORT_FRESHNESS_INVALID', 500, {min: 0}),
    priority: integer(value.priority, 'RNCS_TRANSPORT_PRIORITY_INVALID', qos_class === 'AUTHORITY_EVENT' ? 100 : qos_class === 'PLAYER_CONTROL' ? 90 : 50, {min: 0, max: 100}),
    loss_mode,
    discovery_supported: bool(value.discovery_supported ?? value.discoverySupported, 'RNCS_TRANSPORT_DISCOVERY_INVALID', defaultDiscovery),
    roaming_supported: bool(value.roaming_supported ?? value.roamingSupported, 'RNCS_TRANSPORT_ROAMING_INVALID', transport_kind === 'WIFI'),
    low_power: bool(value.low_power ?? value.lowPower, 'RNCS_TRANSPORT_LOW_POWER_INVALID', defaultLowPower),
    bidirectional: bool(value.bidirectional, 'RNCS_TRANSPORT_BIDIRECTIONAL_INVALID', true),
    requires_authority: bool(value.requires_authority ?? value.requiresAuthority, 'RNCS_TRANSPORT_AUTHORITY_REQUIRED_INVALID', qos_class === 'AUTHORITY_EVENT' || qos_class === 'STATE_DELTA'),
    fallback_profile_ids: strings(value.fallback_profile_ids ?? value.fallbackProfileIds),
    evidence_refs: strings(value.evidence_refs ?? value.evidenceRefs),
    candidate_only: true,
    authoritative: false,
    commit_status: 'NOT_COMMITTED'
  };
}

export function createRealityTransportProfile(input = {}) {
  const base = normalizeTransportProfile(input);
  return {...base, profile_root: rootHash(base)};
}

export function verifyRealityTransportProfile(profile) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!profile || typeof profile !== 'object') return {valid: false, errors: ['RNCS_TRANSPORT_PROFILE_NOT_OBJECT']};
  try {
    const copy = clone(profile);
    const profileRoot = copy.profile_root;
    delete copy.profile_root;
    check(profile.format === REALITY_TRANSPORT_PROFILE_FORMAT, 'RNCS_TRANSPORT_PROFILE_FORMAT_INVALID');
    check(profile.version === REALITY_TRANSPORT_VERSION, 'RNCS_TRANSPORT_PROFILE_VERSION_INVALID');
    check(typeof profile.profile_id === 'string' && profile.profile_id.length > 0, 'RNCS_TRANSPORT_PROFILE_ID_REQUIRED');
    check(REALITY_TRANSPORT_KINDS.includes(profile.transport_kind), 'RNCS_TRANSPORT_KIND_INVALID');
    check(REALITY_QOS_CLASSES.includes(profile.qos_class), 'RNCS_TRANSPORT_QOS_CLASS_INVALID');
    check(typeof profile.coverage === 'string' && profile.coverage.length > 0, 'RNCS_TRANSPORT_COVERAGE_REQUIRED');
    check(Number.isSafeInteger(profile.bandwidth_mbps) && profile.bandwidth_mbps >= 0, 'RNCS_TRANSPORT_BANDWIDTH_INVALID');
    check(Number.isSafeInteger(profile.latency_budget_ms) && profile.latency_budget_ms >= 0, 'RNCS_TRANSPORT_LATENCY_INVALID');
    check(Number.isSafeInteger(profile.reliability_ppm) && profile.reliability_ppm >= 0 && profile.reliability_ppm <= 1000000, 'RNCS_TRANSPORT_RELIABILITY_INVALID');
    check(Number.isSafeInteger(profile.freshness_budget_ms) && profile.freshness_budget_ms >= 0, 'RNCS_TRANSPORT_FRESHNESS_INVALID');
    check(Number.isSafeInteger(profile.priority) && profile.priority >= 0 && profile.priority <= 100, 'RNCS_TRANSPORT_PRIORITY_INVALID');
    check(REALITY_TRANSPORT_LOSS_MODES.includes(profile.loss_mode), 'RNCS_TRANSPORT_LOSS_MODE_INVALID');
    for (const field of ['discovery_supported', 'roaming_supported', 'low_power', 'bidirectional', 'requires_authority']) check(typeof profile[field] === 'boolean', `RNCS_TRANSPORT_${field.toUpperCase()}_INVALID`);
    check(Array.isArray(profile.fallback_profile_ids), 'RNCS_TRANSPORT_FALLBACK_PROFILES_INVALID');
    check(Array.isArray(profile.evidence_refs), 'RNCS_TRANSPORT_EVIDENCE_REFS_REQUIRED');
    check(profile.candidate_only === true && profile.authoritative === false, 'RNCS_TRANSPORT_CANDIDATE_REQUIRED');
    check(profile.commit_status === 'NOT_COMMITTED', 'RNCS_TRANSPORT_COMMIT_STATUS_INVALID');
    check(hex64(profileRoot) && rootHash(copy) === profileRoot, 'RNCS_TRANSPORT_PROFILE_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`RNCS_TRANSPORT_PROFILE_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, profile_root: profile.profile_root ?? null};
}

function normalizeTransportPacket(input = {}) {
  const value = record(input);
  const profile = clone(value.profile ?? value.transport_profile ?? value.transportProfile);
  const profileVerification = verifyRealityTransportProfile(profile);
  fail(profileVerification.valid, `RNCS_TRANSPORT_PACKET_PROFILE_INVALID:${profileVerification.errors.join(',')}`);
  const payload = clone(value.payload ?? {});
  const authorityLease = value.authority_lease ?? value.authorityLease ?? null;
  if (authorityLease !== null) {
    const leaseVerification = checkAuthorityLease(authorityLease);
    fail(leaseVerification.valid, `RNCS_TRANSPORT_PACKET_LEASE_INVALID:${leaseVerification.errors.join(',')}`);
  }
  if (profile.requires_authority) fail(authorityLease !== null, 'RNCS_TRANSPORT_PACKET_AUTHORITY_LEASE_REQUIRED');
  const packet_type = String(value.packet_type ?? value.packetType ?? 'STATE_DELTA').toUpperCase();
  fail(REALITY_TRANSPORT_PACKET_TYPES.includes(packet_type), 'RNCS_TRANSPORT_PACKET_TYPE_INVALID');
  return {
    format: REALITY_TRANSPORT_PACKET_FORMAT,
    version: REALITY_TRANSPORT_VERSION,
    packet_id: text(value.packet_id ?? value.packetId, 'RNCS_TRANSPORT_PACKET_ID_REQUIRED', `packet:${rootHash({payload, profile_root: profile.profile_root}).slice(0, 24)}`),
    packet_type,
    profile,
    profile_root: profile.profile_root,
    source_node: text(value.source_node ?? value.sourceNode, 'RNCS_TRANSPORT_PACKET_SOURCE_NODE_REQUIRED'),
    target_node: text(value.target_node ?? value.targetNode, 'RNCS_TRANSPORT_PACKET_TARGET_NODE_REQUIRED'),
    sequence: integer(value.sequence, 'RNCS_TRANSPORT_PACKET_SEQUENCE_INVALID'),
    created_tick: integer(value.created_tick ?? value.createdTick, 'RNCS_TRANSPORT_PACKET_TICK_INVALID'),
    authority_lease: authorityLease,
    authority_lease_root: authorityLease?.lease_root ?? null,
    authority_receipt_root: value.authority_receipt_root ?? value.authorityReceiptRoot ?? null,
    permission_scope: strings(value.permission_scope ?? value.permissionScope),
    payload,
    payload_root: rootHash(payload),
    candidate_only: true,
    authoritative: false,
    commit_status: 'NOT_COMMITTED'
  };
}

export function createRealityTransportPacket(input = {}) {
  const base = normalizeTransportPacket(input);
  return {...base, packet_root: rootHash(base)};
}

export function verifyRealityTransportPacket(packet) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!packet || typeof packet !== 'object') return {valid: false, errors: ['RNCS_TRANSPORT_PACKET_NOT_OBJECT']};
  try {
    const copy = clone(packet);
    const packetRoot = copy.packet_root;
    delete copy.packet_root;
    check(packet.format === REALITY_TRANSPORT_PACKET_FORMAT, 'RNCS_TRANSPORT_PACKET_FORMAT_INVALID');
    check(packet.version === REALITY_TRANSPORT_VERSION, 'RNCS_TRANSPORT_PACKET_VERSION_INVALID');
    for (const field of ['packet_id', 'source_node', 'target_node']) check(typeof packet[field] === 'string' && packet[field].length > 0, `RNCS_TRANSPORT_PACKET_${field.toUpperCase()}_REQUIRED`);
    check(REALITY_TRANSPORT_PACKET_TYPES.includes(packet.packet_type), 'RNCS_TRANSPORT_PACKET_TYPE_INVALID');
    check(Number.isSafeInteger(packet.sequence) && packet.sequence >= 0, 'RNCS_TRANSPORT_PACKET_SEQUENCE_INVALID');
    check(Number.isSafeInteger(packet.created_tick) && packet.created_tick >= 0, 'RNCS_TRANSPORT_PACKET_TICK_INVALID');
    const profileVerification = verifyRealityTransportProfile(packet.profile);
    check(profileVerification.valid, `RNCS_TRANSPORT_PACKET_PROFILE_INVALID:${profileVerification.errors.join(',')}`);
    check(packet.profile_root === packet.profile?.profile_root, 'RNCS_TRANSPORT_PACKET_PROFILE_ROOT_MISMATCH');
    if (packet.authority_lease !== null) {
      const leaseResult = checkAuthorityLease(packet.authority_lease);
      check(leaseResult.valid, `RNCS_TRANSPORT_PACKET_LEASE_INVALID:${leaseResult.errors.join(',')}`);
      check(packet.authority_lease_root === packet.authority_lease?.lease_root, 'RNCS_TRANSPORT_PACKET_LEASE_ROOT_MISMATCH');
    } else check(packet.authority_lease_root === null, 'RNCS_TRANSPORT_PACKET_NULL_LEASE_ROOT_INVALID');
    if (packet.profile?.requires_authority) check(packet.authority_lease !== null, 'RNCS_TRANSPORT_PACKET_AUTHORITY_LEASE_REQUIRED');
    check(packet.authority_receipt_root === null || hex64(packet.authority_receipt_root), 'RNCS_TRANSPORT_PACKET_AUTHORITY_RECEIPT_ROOT_INVALID');
    check(Array.isArray(packet.permission_scope), 'RNCS_TRANSPORT_PACKET_PERMISSION_SCOPE_INVALID');
    check(packet.payload && typeof packet.payload === 'object', 'RNCS_TRANSPORT_PACKET_PAYLOAD_REQUIRED');
    check(rootHash(packet.payload) === packet.payload_root, 'RNCS_TRANSPORT_PACKET_PAYLOAD_ROOT_MISMATCH');
    check(packet.candidate_only === true && packet.authoritative === false, 'RNCS_TRANSPORT_PACKET_CANDIDATE_REQUIRED');
    check(packet.commit_status === 'NOT_COMMITTED', 'RNCS_TRANSPORT_PACKET_COMMIT_STATUS_INVALID');
    check(hex64(packetRoot) && rootHash(copy) === packetRoot, 'RNCS_TRANSPORT_PACKET_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`RNCS_TRANSPORT_PACKET_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, packet_root: packet.packet_root ?? null};
}

export function checkRealityTransportAdmission(packet, input = {}) {
  const errors = [];
  const verification = verifyRealityTransportPacket(packet);
  if (!verification.valid) errors.push(...verification.errors);
  const value = record(input);
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (verification.valid) {
    if (value.profile_root !== undefined) check(packet.profile_root === String(value.profile_root), 'RNCS_TRANSPORT_PROFILE_ROOT_EXPECTED_MISMATCH');
    if (value.source_node !== undefined) check(packet.source_node === String(value.source_node), 'RNCS_TRANSPORT_SOURCE_NODE_MISMATCH');
    if (value.target_node !== undefined) check(packet.target_node === String(value.target_node), 'RNCS_TRANSPORT_TARGET_NODE_MISMATCH');
    if (packet.profile.requires_authority || value.require_authority === true || value.world_mutation === true) {
      const receipt = record(value.authority_receipt ?? value.authorityReceipt);
      check(receipt.status === 'committed' && hex64(receipt.receipt_root), 'RNCS_TRANSPORT_AUTHORITY_RECEIPT_REQUIRED');
      check(packet.authority_receipt_root === receipt.receipt_root, 'RNCS_TRANSPORT_AUTHORITY_RECEIPT_ROOT_MISMATCH');
      const lease = value.current_lease ?? value.currentLease ?? packet.authority_lease;
      const leaseResult = checkAuthorityLease(packet.authority_lease, {
        authority_id: value.authority_id,
        shard_id: value.shard_id,
        semantic_scope: value.semantic_scope,
        owner_node: packet.source_node,
        tick: value.tick,
        current_lease: lease
      });
      if (!leaseResult.valid) errors.push(...leaseResult.errors);
    }
  }
  return {valid: errors.length === 0, errors, packet_root: packet?.packet_root ?? null};
}

function normalizeNodeDiscovery(input = {}) {
  const value = record(input);
  return {
    format: REALITY_NODE_DISCOVERY_FORMAT,
    version: REALITY_TRANSPORT_VERSION,
    discovery_id: text(value.discovery_id ?? value.discoveryId, 'RNCS_NODE_DISCOVERY_ID_REQUIRED', `discovery:${rootHash(value).slice(0, 24)}`),
    observer_node: text(value.observer_node ?? value.observerNode, 'RNCS_NODE_DISCOVERY_OBSERVER_REQUIRED'),
    discovered_node: text(value.discovered_node ?? value.discoveredNode, 'RNCS_NODE_DISCOVERY_NODE_REQUIRED'),
    node_kind: text(value.node_kind ?? value.nodeKind, 'RNCS_NODE_DISCOVERY_KIND_REQUIRED', 'reality-node'),
    endpoint: text(value.endpoint, 'RNCS_NODE_DISCOVERY_ENDPOINT_REQUIRED'),
    capability_ids: strings(value.capability_ids ?? value.capabilityIds),
    available_profile_roots: strings(value.available_profile_roots ?? value.availableProfileRoots),
    link_quality_ppm: integer(value.link_quality_ppm ?? value.linkQualityPpm, 'RNCS_NODE_DISCOVERY_LINK_QUALITY_INVALID', 1000000, {min: 0, max: 1000000}),
    distance_m: integer(value.distance_m ?? value.distanceM, 'RNCS_NODE_DISCOVERY_DISTANCE_INVALID', 0),
    discovered_at_tick: integer(value.discovered_at_tick ?? value.discoveredAtTick, 'RNCS_NODE_DISCOVERY_TICK_INVALID'),
    ttl_ticks: integer(value.ttl_ticks ?? value.ttlTicks, 'RNCS_NODE_DISCOVERY_TTL_INVALID', 10, {min: 1}),
    status: 'DISCOVERED',
    candidate_only: true,
    authoritative: false,
    commit_status: 'NOT_COMMITTED'
  };
}

export function createRealityNodeDiscovery(input = {}) {
  const base = normalizeNodeDiscovery(input);
  return {...base, discovery_root: rootHash(base)};
}

export function verifyRealityNodeDiscovery(discovery) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!discovery || typeof discovery !== 'object') return {valid: false, errors: ['RNCS_NODE_DISCOVERY_NOT_OBJECT']};
  try {
    const copy = clone(discovery);
    const discoveryRoot = copy.discovery_root;
    delete copy.discovery_root;
    check(discovery.format === REALITY_NODE_DISCOVERY_FORMAT, 'RNCS_NODE_DISCOVERY_FORMAT_INVALID');
    check(discovery.version === REALITY_TRANSPORT_VERSION, 'RNCS_NODE_DISCOVERY_VERSION_INVALID');
    for (const field of ['discovery_id', 'observer_node', 'discovered_node', 'node_kind', 'endpoint']) check(typeof discovery[field] === 'string' && discovery[field].length > 0, `RNCS_NODE_DISCOVERY_${field.toUpperCase()}_REQUIRED`);
    check(Array.isArray(discovery.capability_ids) && Array.isArray(discovery.available_profile_roots), 'RNCS_NODE_DISCOVERY_CAPABILITIES_INVALID');
    check(Number.isSafeInteger(discovery.link_quality_ppm) && discovery.link_quality_ppm >= 0 && discovery.link_quality_ppm <= 1000000, 'RNCS_NODE_DISCOVERY_LINK_QUALITY_INVALID');
    for (const field of ['distance_m', 'discovered_at_tick', 'ttl_ticks']) check(Number.isSafeInteger(discovery[field]) && discovery[field] >= 0, `RNCS_NODE_DISCOVERY_${field.toUpperCase()}_INVALID`);
    check(discovery.ttl_ticks > 0, 'RNCS_NODE_DISCOVERY_TTL_INVALID');
    check(discovery.status === 'DISCOVERED', 'RNCS_NODE_DISCOVERY_STATUS_INVALID');
    check(discovery.candidate_only === true && discovery.authoritative === false, 'RNCS_NODE_DISCOVERY_CANDIDATE_REQUIRED');
    check(discovery.commit_status === 'NOT_COMMITTED', 'RNCS_NODE_DISCOVERY_COMMIT_STATUS_INVALID');
    check(hex64(discoveryRoot) && rootHash(copy) === discoveryRoot, 'RNCS_NODE_DISCOVERY_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`RNCS_NODE_DISCOVERY_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, discovery_root: discovery.discovery_root ?? null};
}

function normalizeAssociation(input = {}) {
  const value = record(input);
  const status = String(value.status ?? 'ASSOCIATED').toUpperCase();
  fail(REALITY_NODE_ASSOCIATION_STATUSES.includes(status), 'RNCS_NODE_ASSOCIATION_STATUS_INVALID');
  const discovery = clone(value.discovery ?? value.node_discovery);
  const discoveryVerification = verifyRealityNodeDiscovery(discovery);
  fail(discoveryVerification.valid, `RNCS_NODE_ASSOCIATION_DISCOVERY_INVALID:${discoveryVerification.errors.join(',')}`);
  const profileRoot = root(value.profile_root ?? value.profileRoot, 'RNCS_NODE_ASSOCIATION_PROFILE_ROOT_INVALID');
  return {
    format: REALITY_NODE_ASSOCIATION_FORMAT,
    version: REALITY_TRANSPORT_VERSION,
    association_id: text(value.association_id ?? value.associationId, 'RNCS_NODE_ASSOCIATION_ID_REQUIRED', `association:${discovery.discovery_root.slice(0, 24)}:${profileRoot.slice(0, 12)}`),
    local_node: text(value.local_node ?? value.localNode, 'RNCS_NODE_ASSOCIATION_LOCAL_NODE_REQUIRED'),
    remote_node: text(value.remote_node ?? value.remoteNode ?? discovery.discovered_node, 'RNCS_NODE_ASSOCIATION_REMOTE_NODE_REQUIRED'),
    device_id: text(value.device_id ?? value.deviceId, 'RNCS_NODE_ASSOCIATION_DEVICE_ID_REQUIRED'),
    discovery,
    discovery_root: discovery.discovery_root,
    profile_root: profileRoot,
    paired: bool(value.paired, 'RNCS_NODE_ASSOCIATION_PAIRED_INVALID', false),
    permission_scope: strings(value.permission_scope ?? value.permissionScope),
    authority_granted: false,
    status,
    candidate_only: true,
    authoritative: false,
    commit_status: 'NOT_COMMITTED'
  };
}

export function createRealityNodeAssociation(input = {}) {
  const base = normalizeAssociation(input);
  return {...base, association_root: rootHash(base)};
}

export function verifyRealityNodeAssociation(association) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!association || typeof association !== 'object') return {valid: false, errors: ['RNCS_NODE_ASSOCIATION_NOT_OBJECT']};
  try {
    const copy = clone(association);
    const associationRoot = copy.association_root;
    delete copy.association_root;
    check(association.format === REALITY_NODE_ASSOCIATION_FORMAT, 'RNCS_NODE_ASSOCIATION_FORMAT_INVALID');
    check(association.version === REALITY_TRANSPORT_VERSION, 'RNCS_NODE_ASSOCIATION_VERSION_INVALID');
    for (const field of ['association_id', 'local_node', 'remote_node', 'device_id']) check(typeof association[field] === 'string' && association[field].length > 0, `RNCS_NODE_ASSOCIATION_${field.toUpperCase()}_REQUIRED`);
    const discoveryVerification = verifyRealityNodeDiscovery(association.discovery);
    check(discoveryVerification.valid, `RNCS_NODE_ASSOCIATION_DISCOVERY_INVALID:${discoveryVerification.errors.join(',')}`);
    check(association.discovery_root === association.discovery?.discovery_root, 'RNCS_NODE_ASSOCIATION_DISCOVERY_ROOT_MISMATCH');
    check(hex64(association.profile_root), 'RNCS_NODE_ASSOCIATION_PROFILE_ROOT_INVALID');
    check(typeof association.paired === 'boolean', 'RNCS_NODE_ASSOCIATION_PAIRED_INVALID');
    check(association.authority_granted === false, 'RNCS_NODE_ASSOCIATION_AUTHORITY_ESCALATION');
    check(Array.isArray(association.permission_scope), 'RNCS_NODE_ASSOCIATION_PERMISSION_SCOPE_INVALID');
    check(REALITY_NODE_ASSOCIATION_STATUSES.includes(association.status), 'RNCS_NODE_ASSOCIATION_STATUS_INVALID');
    check(association.candidate_only === true && association.authoritative === false, 'RNCS_NODE_ASSOCIATION_CANDIDATE_REQUIRED');
    check(association.commit_status === 'NOT_COMMITTED', 'RNCS_NODE_ASSOCIATION_COMMIT_STATUS_INVALID');
    check(hex64(associationRoot) && rootHash(copy) === associationRoot, 'RNCS_NODE_ASSOCIATION_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`RNCS_NODE_ASSOCIATION_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, association_root: association.association_root ?? null};
}

function normalizeRoamingDecision(input = {}) {
  const value = record(input);
  const status = String(value.status ?? 'ACCEPTED').toUpperCase();
  fail(REALITY_ROAMING_STATUSES.includes(status), 'RNCS_ROAMING_STATUS_INVALID');
  const previous = value.previous_association ?? value.previousAssociation ?? null;
  const target = clone(value.target_association ?? value.targetAssociation);
  const targetVerification = verifyRealityNodeAssociation(target);
  fail(targetVerification.valid, `RNCS_ROAMING_TARGET_ASSOCIATION_INVALID:${targetVerification.errors.join(',')}`);
  if (previous !== null) {
    const previousVerification = verifyRealityNodeAssociation(previous);
    fail(previousVerification.valid, `RNCS_ROAMING_PREVIOUS_ASSOCIATION_INVALID:${previousVerification.errors.join(',')}`);
  }
  const fallbackProfileRoot = value.fallback_profile_root ?? value.fallbackProfileRoot ?? null;
  if (fallbackProfileRoot !== null) root(fallbackProfileRoot, 'RNCS_ROAMING_FALLBACK_PROFILE_ROOT_INVALID');
  return {
    format: REALITY_ROAMING_DECISION_FORMAT,
    version: REALITY_TRANSPORT_VERSION,
    decision_id: text(value.decision_id ?? value.decisionId, 'RNCS_ROAMING_DECISION_ID_REQUIRED', `roam:${target.association_root.slice(0, 24)}`),
    subject_id: text(value.subject_id ?? value.subjectId ?? value.device_id ?? value.deviceId, 'RNCS_ROAMING_SUBJECT_ID_REQUIRED'),
    from_node: text(value.from_node ?? value.fromNode ?? previous?.remote_node ?? target.local_node, 'RNCS_ROAMING_FROM_NODE_REQUIRED'),
    to_node: text(value.to_node ?? value.toNode ?? target.remote_node, 'RNCS_ROAMING_TO_NODE_REQUIRED'),
    previous_association: previous,
    previous_association_root: previous?.association_root ?? null,
    target_association: target,
    target_association_root: target.association_root,
    selected_profile_root: target.profile_root,
    fallback_profile_root: fallbackProfileRoot,
    reason: text(value.reason, 'RNCS_ROAMING_REASON_REQUIRED'),
    sequence: integer(value.sequence, 'RNCS_ROAMING_SEQUENCE_INVALID', 1, {min: 1}),
    status,
    candidate_only: true,
    authoritative: false,
    commit_status: 'NOT_COMMITTED'
  };
}

export function createRealityRoamingDecision(input = {}) {
  const base = normalizeRoamingDecision(input);
  return {...base, decision_root: rootHash(base)};
}

export function verifyRealityRoamingDecision(decision) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!decision || typeof decision !== 'object') return {valid: false, errors: ['RNCS_ROAMING_DECISION_NOT_OBJECT']};
  try {
    const copy = clone(decision);
    const decisionRoot = copy.decision_root;
    delete copy.decision_root;
    check(decision.format === REALITY_ROAMING_DECISION_FORMAT, 'RNCS_ROAMING_FORMAT_INVALID');
    check(decision.version === REALITY_TRANSPORT_VERSION, 'RNCS_ROAMING_VERSION_INVALID');
    for (const field of ['decision_id', 'subject_id', 'from_node', 'to_node', 'reason']) check(typeof decision[field] === 'string' && decision[field].length > 0, `RNCS_ROAMING_${field.toUpperCase()}_REQUIRED`);
    check(decision.previous_association === null || verifyRealityNodeAssociation(decision.previous_association).valid, 'RNCS_ROAMING_PREVIOUS_ASSOCIATION_INVALID');
    check(decision.previous_association_root === decision.previous_association?.association_root || (decision.previous_association === null && decision.previous_association_root === null), 'RNCS_ROAMING_PREVIOUS_ASSOCIATION_ROOT_MISMATCH');
    check(verifyRealityNodeAssociation(decision.target_association).valid, 'RNCS_ROAMING_TARGET_ASSOCIATION_INVALID');
    check(decision.target_association_root === decision.target_association?.association_root, 'RNCS_ROAMING_TARGET_ASSOCIATION_ROOT_MISMATCH');
    check(decision.selected_profile_root === decision.target_association?.profile_root, 'RNCS_ROAMING_PROFILE_ROOT_MISMATCH');
    check(decision.fallback_profile_root === null || hex64(decision.fallback_profile_root), 'RNCS_ROAMING_FALLBACK_PROFILE_ROOT_INVALID');
    check(Number.isSafeInteger(decision.sequence) && decision.sequence >= 1, 'RNCS_ROAMING_SEQUENCE_INVALID');
    check(REALITY_ROAMING_STATUSES.includes(decision.status), 'RNCS_ROAMING_STATUS_INVALID');
    check(decision.candidate_only === true && decision.authoritative === false, 'RNCS_ROAMING_CANDIDATE_REQUIRED');
    check(decision.commit_status === 'NOT_COMMITTED', 'RNCS_ROAMING_COMMIT_STATUS_INVALID');
    check(hex64(decisionRoot) && rootHash(copy) === decisionRoot, 'RNCS_ROAMING_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`RNCS_ROAMING_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, decision_root: decision.decision_root ?? null};
}

function normalizeOrganLink(input = {}) {
  const value = record(input);
  const profile = clone(value.profile ?? value.transport_profile ?? value.transportProfile);
  const profileVerification = verifyRealityTransportProfile(profile);
  fail(profileVerification.valid, `RNCS_ORGAN_LINK_PROFILE_INVALID:${profileVerification.errors.join(',')}`);
  fail(profile.transport_kind === 'BLUETOOTH', 'RNCS_ORGAN_LINK_BLUETOOTH_PROFILE_REQUIRED');
  fail(profile.low_power === true, 'RNCS_ORGAN_LINK_LOW_POWER_REQUIRED');
  const association = clone(value.association ?? value.node_association);
  const associationVerification = verifyRealityNodeAssociation(association);
  fail(associationVerification.valid, `RNCS_ORGAN_LINK_ASSOCIATION_INVALID:${associationVerification.errors.join(',')}`);
  const payload = clone(value.payload ?? {});
  const authorityLease = value.authority_lease ?? value.authorityLease ?? null;
  if (authorityLease !== null) {
    const leaseResult = checkAuthorityLease(authorityLease);
    fail(leaseResult.valid, `RNCS_ORGAN_LINK_LEASE_INVALID:${leaseResult.errors.join(',')}`);
  }
  const direction = String(value.direction ?? 'BIDIRECTIONAL').toUpperCase();
  fail(['BIDIRECTIONAL', 'UPLINK', 'DOWNLINK'].includes(direction), 'RNCS_ORGAN_LINK_DIRECTION_INVALID');
  const power_mode = String(value.power_mode ?? value.powerMode ?? 'LOW_POWER').toUpperCase();
  fail(REALITY_ORGAN_LINK_POWER_MODES.includes(power_mode), 'RNCS_ORGAN_LINK_POWER_MODE_INVALID');
  return {
    format: REALITY_ORGAN_LINK_FORMAT,
    version: REALITY_TRANSPORT_VERSION,
    link_id: text(value.link_id ?? value.linkId, 'RNCS_ORGAN_LINK_ID_REQUIRED', `organ:${association.association_root.slice(0, 24)}`),
    device_id: text(value.device_id ?? value.deviceId ?? association.device_id, 'RNCS_ORGAN_LINK_DEVICE_ID_REQUIRED'),
    source_node: text(value.source_node ?? value.sourceNode ?? association.remote_node, 'RNCS_ORGAN_LINK_SOURCE_NODE_REQUIRED'),
    target_node: text(value.target_node ?? value.targetNode ?? association.local_node, 'RNCS_ORGAN_LINK_TARGET_NODE_REQUIRED'),
    capability_id: text(value.capability_id ?? value.capabilityId, 'RNCS_ORGAN_LINK_CAPABILITY_REQUIRED'),
    capability_manifest_root: root(value.capability_manifest_root ?? value.capabilityManifestRoot, 'RNCS_ORGAN_LINK_CAPABILITY_ROOT_INVALID'),
    association,
    association_root: association.association_root,
    profile,
    profile_root: profile.profile_root,
    permission_scope: strings(value.permission_scope ?? value.permissionScope),
    authority_lease: authorityLease,
    authority_lease_root: authorityLease?.lease_root ?? null,
    authority_receipt_root: value.authority_receipt_root ?? value.authorityReceiptRoot ?? null,
    state_sequence: integer(value.state_sequence ?? value.stateSequence, 'RNCS_ORGAN_LINK_SEQUENCE_INVALID'),
    direction,
    power_mode,
    payload,
    payload_root: rootHash(payload),
    paired: association.paired === true,
    authority_granted: false,
    candidate_only: true,
    authoritative: false,
    commit_status: 'NOT_COMMITTED'
  };
}

export function createRealityOrganLink(input = {}) {
  const base = normalizeOrganLink(input);
  return {...base, link_root: rootHash(base)};
}

export function verifyRealityOrganLink(link) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!link || typeof link !== 'object') return {valid: false, errors: ['RNCS_ORGAN_LINK_NOT_OBJECT']};
  try {
    const copy = clone(link);
    const linkRoot = copy.link_root;
    delete copy.link_root;
    check(link.format === REALITY_ORGAN_LINK_FORMAT, 'RNCS_ORGAN_LINK_FORMAT_INVALID');
    check(link.version === REALITY_TRANSPORT_VERSION, 'RNCS_ORGAN_LINK_VERSION_INVALID');
    for (const field of ['link_id', 'device_id', 'source_node', 'target_node', 'capability_id']) check(typeof link[field] === 'string' && link[field].length > 0, `RNCS_ORGAN_LINK_${field.toUpperCase()}_REQUIRED`);
    check(hex64(link.capability_manifest_root), 'RNCS_ORGAN_LINK_CAPABILITY_ROOT_INVALID');
    const associationVerification = verifyRealityNodeAssociation(link.association);
    check(associationVerification.valid, `RNCS_ORGAN_LINK_ASSOCIATION_INVALID:${associationVerification.errors.join(',')}`);
    check(link.association_root === link.association?.association_root, 'RNCS_ORGAN_LINK_ASSOCIATION_ROOT_MISMATCH');
    const profileVerification = verifyRealityTransportProfile(link.profile);
    check(profileVerification.valid, `RNCS_ORGAN_LINK_PROFILE_INVALID:${profileVerification.errors.join(',')}`);
    check(link.profile.transport_kind === 'BLUETOOTH' && link.profile.low_power === true, 'RNCS_ORGAN_LINK_PROFILE_BOUNDARY_INVALID');
    check(link.profile_root === link.profile?.profile_root, 'RNCS_ORGAN_LINK_PROFILE_ROOT_MISMATCH');
    check(Array.isArray(link.permission_scope), 'RNCS_ORGAN_LINK_PERMISSION_SCOPE_INVALID');
    if (link.authority_lease !== null) {
      const leaseResult = checkAuthorityLease(link.authority_lease);
      check(leaseResult.valid, `RNCS_ORGAN_LINK_LEASE_INVALID:${leaseResult.errors.join(',')}`);
      check(link.authority_lease_root === link.authority_lease?.lease_root, 'RNCS_ORGAN_LINK_LEASE_ROOT_MISMATCH');
    } else check(link.authority_lease_root === null, 'RNCS_ORGAN_LINK_NULL_LEASE_ROOT_INVALID');
    check(link.authority_receipt_root === null || hex64(link.authority_receipt_root), 'RNCS_ORGAN_LINK_AUTHORITY_RECEIPT_ROOT_INVALID');
    check(Number.isSafeInteger(link.state_sequence) && link.state_sequence >= 0, 'RNCS_ORGAN_LINK_SEQUENCE_INVALID');
    check(['BIDIRECTIONAL', 'UPLINK', 'DOWNLINK'].includes(link.direction), 'RNCS_ORGAN_LINK_DIRECTION_INVALID');
    check(REALITY_ORGAN_LINK_POWER_MODES.includes(link.power_mode), 'RNCS_ORGAN_LINK_POWER_MODE_INVALID');
    check(link.paired === (link.association?.paired === true), 'RNCS_ORGAN_LINK_PAIRED_MISMATCH');
    check(link.authority_granted === false && link.association?.authority_granted === false, 'RNCS_ORGAN_LINK_AUTHORITY_ESCALATION');
    check(rootHash(link.payload) === link.payload_root, 'RNCS_ORGAN_LINK_PAYLOAD_ROOT_MISMATCH');
    check(link.candidate_only === true && link.authoritative === false, 'RNCS_ORGAN_LINK_CANDIDATE_REQUIRED');
    check(link.commit_status === 'NOT_COMMITTED', 'RNCS_ORGAN_LINK_COMMIT_STATUS_INVALID');
    check(hex64(linkRoot) && rootHash(copy) === linkRoot, 'RNCS_ORGAN_LINK_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`RNCS_ORGAN_LINK_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, link_root: link.link_root ?? null};
}

export function checkRealityOrganLinkAdmission(link, input = {}) {
  const errors = [];
  const verification = verifyRealityOrganLink(link);
  if (!verification.valid) errors.push(...verification.errors);
  const value = record(input);
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (verification.valid) {
    check(link.paired === true, 'RNCS_ORGAN_LINK_PAIRING_REQUIRED');
    if (value.device_id !== undefined) check(link.device_id === String(value.device_id), 'RNCS_ORGAN_LINK_DEVICE_ID_MISMATCH');
    if (value.capability_id !== undefined) check(link.capability_id === String(value.capability_id), 'RNCS_ORGAN_LINK_CAPABILITY_MISMATCH');
    const requestedScope = value.requested_scope ?? value.requestedScope;
    if (requestedScope !== undefined) check(link.permission_scope.includes(String(requestedScope)), 'RNCS_ORGAN_LINK_PERMISSION_SCOPE_DENIED');
    if (value.target_node !== undefined) check(link.target_node === String(value.target_node), 'RNCS_ORGAN_LINK_TARGET_NODE_MISMATCH');
    if (value.profile_root !== undefined) check(link.profile_root === String(value.profile_root), 'RNCS_ORGAN_LINK_PROFILE_ROOT_EXPECTED_MISMATCH');
    if (value.world_mutation === true || value.require_authority === true) {
      const receipt = record(value.authority_receipt ?? value.authorityReceipt);
      check(receipt.status === 'committed' && hex64(receipt.receipt_root), 'RNCS_ORGAN_LINK_AUTHORITY_RECEIPT_REQUIRED');
      check(link.authority_receipt_root === receipt.receipt_root, 'RNCS_ORGAN_LINK_AUTHORITY_RECEIPT_ROOT_MISMATCH');
      const leaseResult = checkAuthorityLease(link.authority_lease, {
        authority_id: value.authority_id,
        shard_id: value.shard_id,
        semantic_scope: value.semantic_scope,
        owner_node: link.source_node,
        tick: value.tick,
        current_lease: value.current_lease ?? value.currentLease ?? link.authority_lease
      });
      if (!leaseResult.valid) errors.push(...leaseResult.errors);
    }
  }
  return {valid: errors.length === 0, errors, link_root: link?.link_root ?? null};
}
