import assert from 'node:assert/strict';
import test from 'node:test';
import {
  checkRealityOrganLinkAdmission,
  checkRealityTransportAdmission,
  createAuthorityLease,
  createRealityNodeAssociation,
  createRealityNodeDiscovery,
  createRealityOrganLink,
  createRealityRoamingDecision,
  createRealityTransportPacket,
  createRealityTransportProfile,
  verifyRealityNodeAssociation,
  verifyRealityNodeDiscovery,
  verifyRealityOrganLink,
  verifyRealityRoamingDecision,
  verifyRealityTransportPacket,
  verifyRealityTransportProfile
} from '../src/index.mjs';

const lease = createAuthorityLease({
  authority_id: 'authority:transport',
  shard_id: 'shard:local',
  semantic_scope: 'simulation',
  owner_node: 'node:source',
  epoch: 4,
  fencing_token: 44,
  valid_from_tick: 0,
  valid_until_tick: 100,
  provenance_ref: 'urn:test:transport-lease',
  authority_ref: 'urn:test:transport-authority',
  evidence_refs: ['evidence:transport-lease']
});

function profile(overrides = {}) {
  return createRealityTransportProfile({
    profile_id: 'transport:test:fiber',
    transport_kind: 'fiber',
    qos_class: 'state_delta',
    coverage: 'cross-region',
    evidence_refs: ['evidence:transport-profile'],
    ...overrides
  });
}

function discovery(overrides = {}) {
  return createRealityNodeDiscovery({
    observer_node: 'node:local',
    discovered_node: 'node:remote',
    node_kind: 'room-edge',
    endpoint: 'local://remote',
    capability_ids: ['state.delta', 'visual.page'],
    available_profile_roots: [profile({profile_id: 'transport:test:wifi', transport_kind: 'wifi', qos_class: 'visual_page'}).profile_root],
    link_quality_ppm: 950000,
    distance_m: 3,
    discovered_at_tick: 10,
    ttl_ticks: 30,
    ...overrides
  });
}

test('distinguishes Fiber, WiFi and Bluetooth QoS profiles', () => {
  const fiber = profile({profile_id: 'transport:test:fiber-authority', transport_kind: 'fiber', qos_class: 'authority_event', coverage: 'cross-region'});
  const wifi = profile({profile_id: 'transport:test:wifi-visual', transport_kind: 'wifi', qos_class: 'visual_page', coverage: 'local', roaming_supported: true});
  assert.equal(verifyRealityTransportProfile(fiber).valid, true);
  assert.equal(verifyRealityTransportProfile(wifi).valid, true);
  assert.throws(() => profile({profile_id: 'transport:test:bluetooth-organ', transport_kind: 'bluetooth', qos_class: 'organ_state', low_power: true, requires_authority: true, coverage: 'near-field'}), /RNCS_TRANSPORT_QOS_CLASS_INVALID/);
  const validBluetooth = profile({profile_id: 'transport:test:bluetooth-organ', transport_kind: 'bluetooth', qos_class: 'state_delta', low_power: true, requires_authority: true, coverage: 'near-field'});
  assert.equal(verifyRealityTransportProfile(validBluetooth).valid, true);
  assert.deepEqual(new Set([fiber.transport_kind, wifi.transport_kind, validBluetooth.transport_kind]).size, 3);
  assert.notEqual(fiber.qos_class, wifi.qos_class);
  const tampered = structuredClone(wifi);
  tampered.priority = 101;
  assert.equal(verifyRealityTransportProfile(tampered).valid, false);
});

test('binds a transport packet to a lease, receipt and profile root', () => {
  const stateProfile = profile({profile_id: 'transport:test:state', transport_kind: 'fiber', qos_class: 'state_delta', requires_authority: true});
  const receiptRoot = 'c'.repeat(64);
  const packet = createRealityTransportPacket({
    packet_type: 'state_delta',
    profile: stateProfile,
    source_node: 'node:source',
    target_node: 'node:target',
    sequence: 1,
    created_tick: 12,
    authority_lease: lease,
    authority_receipt_root: receiptRoot,
    permission_scope: ['simulation.delta'],
    payload: {delta_root: 'a'.repeat(64)}
  });
  assert.equal(verifyRealityTransportPacket(packet).valid, true);
  assert.equal(checkRealityTransportAdmission(packet, {
    source_node: 'node:source',
    target_node: 'node:target',
    tick: 12,
    current_lease: lease,
    authority_id: lease.authority_id,
    shard_id: lease.shard_id,
    semantic_scope: lease.semantic_scope,
    authority_receipt: {status: 'committed', receipt_root: receiptRoot}
  }).valid, true);
  const tampered = structuredClone(packet);
  tampered.profile_root = 'd'.repeat(64);
  assert.equal(verifyRealityTransportPacket(tampered).valid, false);
});

test('seals WiFi discovery, association and a fallback roaming decision', () => {
  const wifi = profile({profile_id: 'transport:test:wifi-roam', transport_kind: 'wifi', qos_class: 'visual_page', coverage: 'local', roaming_supported: true, requires_authority: false});
  const firstDiscovery = discovery({available_profile_roots: [wifi.profile_root]});
  assert.equal(verifyRealityNodeDiscovery(firstDiscovery).valid, true);
  const association = createRealityNodeAssociation({
    local_node: 'node:local',
    remote_node: 'node:remote',
    device_id: 'device:xr-headset',
    discovery: firstDiscovery,
    profile_root: wifi.profile_root,
    paired: true,
    permission_scope: ['visual.page', 'cache.exchange']
  });
  assert.equal(verifyRealityNodeAssociation(association).valid, true);
  const secondDiscovery = discovery({
    discovery_id: 'discovery:backup',
    discovered_node: 'node:backup',
    endpoint: 'local://backup',
    link_quality_ppm: 800000,
    available_profile_roots: [wifi.profile_root]
  });
  const targetAssociation = createRealityNodeAssociation({
    association_id: 'association:backup',
    local_node: 'node:local',
    remote_node: 'node:backup',
    device_id: 'device:xr-headset',
    discovery: secondDiscovery,
    profile_root: wifi.profile_root,
    paired: true,
    permission_scope: ['visual.page']
  });
  const decision = createRealityRoamingDecision({
    subject_id: 'device:xr-headset',
    from_node: 'node:remote',
    to_node: 'node:backup',
    previous_association: association,
    target_association: targetAssociation,
    fallback_profile_root: 'e'.repeat(64),
    reason: 'link-quality-threshold',
    sequence: 2
  });
  assert.equal(verifyRealityRoamingDecision(decision).valid, true);
  assert.equal(decision.fallback_profile_root, 'e'.repeat(64));
});

test('keeps Bluetooth Organ Link paired but not authoritative', () => {
  const bluetooth = profile({profile_id: 'transport:test:organ', transport_kind: 'bluetooth', qos_class: 'state_delta', coverage: 'near-field', low_power: true, requires_authority: true, discovery_supported: true, roaming_supported: false});
  const found = discovery({observer_node: 'node:target', discovered_node: 'node:source', available_profile_roots: [bluetooth.profile_root]});
  const association = createRealityNodeAssociation({
    local_node: 'node:target',
    remote_node: 'node:source',
    device_id: 'device:haptic-glove',
    discovery: found,
    profile_root: bluetooth.profile_root,
    paired: true,
    permission_scope: ['device.state']
  });
  const receiptRoot = 'f'.repeat(64);
  const link = createRealityOrganLink({
    device_id: 'device:haptic-glove',
    source_node: 'node:source',
    target_node: 'node:target',
    capability_id: 'haptic.state',
    capability_manifest_root: '1'.repeat(64),
    association,
    profile: bluetooth,
    permission_scope: ['device.state'],
    authority_lease: lease,
    authority_receipt_root: receiptRoot,
    state_sequence: 3,
    payload: {pose: {x: 1, y: 2, z: 3}}
  });
  assert.equal(verifyRealityOrganLink(link).valid, true);
  assert.equal(checkRealityOrganLinkAdmission(link, {
    device_id: 'device:haptic-glove',
    capability_id: 'haptic.state',
    requested_scope: 'device.state',
    target_node: 'node:target',
    world_mutation: true,
    authority_id: lease.authority_id,
    shard_id: lease.shard_id,
    semantic_scope: lease.semantic_scope,
    tick: 20,
    current_lease: lease,
    authority_receipt: {status: 'committed', receipt_root: receiptRoot}
  }).valid, true);
  assert.equal(checkRealityOrganLinkAdmission(link, {world_mutation: true, current_lease: lease, tick: 20}).valid, false);
  const escalated = structuredClone(link);
  escalated.authority_granted = true;
  assert.equal(verifyRealityOrganLink(escalated).valid, false);
});

console.log('reality transport contract tests: 4 PASS');
