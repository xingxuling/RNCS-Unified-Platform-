import assert from 'node:assert/strict';
import test from 'node:test';
import {createAuthorityLease, createRealityTransportProfile, rootHash, verifyRealityNodeAssociation, verifyRealityNodeDiscovery, verifyRealityOrganLink, verifyRealityRoamingDecision, verifyRealityTransportPacket, verifyRealityTransportProfile} from '@taowind/rncs-core-contract';
import {RealityTransportFabric} from '../src/index.mjs';

const lease = createAuthorityLease({
  authority_id: 'authority:transport-runtime',
  shard_id: 'shard:transport-runtime',
  semantic_scope: 'simulation',
  owner_node: 'node:source',
  epoch: 3,
  fencing_token: 33,
  valid_from_tick: 0,
  valid_until_tick: 100,
  provenance_ref: 'urn:test:transport-runtime',
  authority_ref: 'urn:test:transport-runtime-authority',
  evidence_refs: ['evidence:transport-runtime']
});

test('routes Fiber, WiFi and Bluetooth profiles through URRF transport fabric', () => {
  const fiber = createRealityTransportProfile({profile_id: 'fiber:state', transport_kind: 'fiber', qos_class: 'state_delta', coverage: 'cross-region', requires_authority: true});
  const wifi = createRealityTransportProfile({profile_id: 'wifi:visual', transport_kind: 'wifi', qos_class: 'visual_page', coverage: 'local', requires_authority: false, roaming_supported: true});
  const bluetooth = createRealityTransportProfile({profile_id: 'bluetooth:organ', transport_kind: 'bluetooth', qos_class: 'state_delta', coverage: 'near-field', requires_authority: true, low_power: true, roaming_supported: false});
  for (const profile of [fiber, wifi, bluetooth]) assert.equal(verifyRealityTransportProfile(profile).valid, true);
  const fabric = new RealityTransportFabric({
    nodeId: 'node:target',
    profiles: [fiber, wifi, bluetooth],
    nodes: [
      {node_id: 'node:source', node_kind: 'room-edge', endpoint: 'local://source', capability_ids: ['simulation.delta', 'haptic.state'], profile_roots: [fiber.profile_root, wifi.profile_root, bluetooth.profile_root], link_quality_ppm: 990000, distance_m: 2},
      {node_id: 'node:backup', node_kind: 'room-edge', endpoint: 'local://backup', capability_ids: ['visual.page'], profile_roots: [wifi.profile_root], link_quality_ppm: 800000, distance_m: 8}
    ]
  });
  const discoveries = fabric.discover({transportKinds: ['wifi']});
  assert.equal(discoveries.length, 2);
  assert.equal(discoveries.every(discovery => verifyRealityNodeDiscovery(discovery).valid), true);
  const sourceDiscovery = discoveries.find(discovery => discovery.discovered_node === 'node:source');
  const sourceAssociation = fabric.associate({discovery: sourceDiscovery, profileId: wifi.profile_id, deviceId: 'device:xr', paired: true, permissionScope: ['visual.page']});
  assert.equal(verifyRealityNodeAssociation(sourceAssociation).valid, true);
  const backupDiscovery = discoveries.find(discovery => discovery.discovered_node === 'node:backup');
  const backupAssociation = fabric.associate({discovery: backupDiscovery, profileId: wifi.profile_id, deviceId: 'device:xr', paired: true, permissionScope: ['visual.page']});
  const roaming = fabric.roam({previousAssociation: sourceAssociation, targetAssociation: backupAssociation, fallbackProfileRoot: fiber.profile_root, reason: 'source-link-degraded'});
  assert.equal(verifyRealityRoamingDecision(roaming).valid, true);
  assert.equal(fabric.resolveProfile({preferredProfile: 'missing', fallbackProfiles: [wifi.profile_id]}).profile_root, wifi.profile_root);
  assert.equal(fabric.verify().candidate_only, true);
});

test('keeps authority-gated packets and low-power Organ Links candidate-only', () => {
  const state = createRealityTransportProfile({profile_id: 'fiber:authority-state', transport_kind: 'fiber', qos_class: 'state_delta', coverage: 'cross-region', requires_authority: true});
  const bluetooth = createRealityTransportProfile({profile_id: 'bluetooth:organ-state', transport_kind: 'bluetooth', qos_class: 'state_delta', coverage: 'near-field', requires_authority: true, low_power: true, roaming_supported: false});
  const fabric = new RealityTransportFabric({
    nodeId: 'node:source',
    profiles: [state]
  });
  const targetFabric = new RealityTransportFabric({
    nodeId: 'node:target',
    profiles: [bluetooth],
    nodes: [{node_id: 'node:source', endpoint: 'local://source', capability_ids: ['simulation.delta', 'haptic.state'], profile_roots: [state.profile_root, bluetooth.profile_root], link_quality_ppm: 990000, distance_m: 1}]
  });
  const receiptRoot = 'a'.repeat(64);
  const packet = fabric.send({profileId: state.profile_id, targetNode: 'node:target', authorityLease: lease, authorityReceiptRoot: receiptRoot, currentLease: lease, authorityReceipt: {status: 'committed', receipt_root: receiptRoot}, authorityId: lease.authority_id, shardId: lease.shard_id, semanticScope: lease.semantic_scope, worldMutation: true, payload: {state_root: 'b'.repeat(64)}});
  assert.equal(verifyRealityTransportPacket(packet).valid, true);
  const discovery = targetFabric.discover({remoteNodes: ['node:source'], transportKinds: ['bluetooth']})[0];
  const association = targetFabric.associate({discovery, profileId: bluetooth.profile_id, deviceId: 'device:haptic', paired: true, permissionScope: ['device.state']});
  const link = targetFabric.sendOrganState({association, profileId: bluetooth.profile_id, deviceId: 'device:haptic', capabilityId: 'haptic.state', capabilityManifestRoot: 'c'.repeat(64), permissionScope: ['device.state'], authorityLease: lease, authorityReceiptRoot: receiptRoot, currentLease: lease, authorityReceipt: {status: 'committed', receipt_root: receiptRoot}, authorityId: lease.authority_id, shardId: lease.shard_id, semanticScope: lease.semantic_scope, worldMutation: true, payload: {pose: {x: 1}}});
  assert.equal(verifyRealityOrganLink(link).valid, true);
  assert.equal(link.paired, true);
  assert.equal(link.authority_granted, false);
  assert.equal(targetFabric.verify().organ_links.length, 1);
  const snapshot = targetFabric.snapshot();
  const snapshotBody = structuredClone(snapshot);
  delete snapshotBody.fabric_root;
  assert.equal(rootHash(snapshotBody), snapshot.fabric_root);
});
