import {
  checkRealityOrganLinkAdmission,
  checkRealityTransportAdmission,
  createRealityNodeAssociation,
  createRealityNodeDiscovery,
  createRealityOrganLink,
  createRealityRoamingDecision,
  createRealityTransportPacket,
  createRealityTransportProfile,
  rootHash,
  verifyRealityNodeAssociation,
  verifyRealityNodeDiscovery,
  verifyRealityOrganLink,
  verifyRealityRoamingDecision,
  verifyRealityTransportPacket,
  verifyRealityTransportProfile
} from '@taowind/rncs-core-contract';

const clone = value => structuredClone(value);
const record = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const keySort = (a, b) => Buffer.compare(Buffer.from(String(a), 'utf8'), Buffer.from(String(b), 'utf8'));
const fail = (condition, code) => { if (!condition) throw new Error(code); };
const strings = values => [...new Set((Array.isArray(values) ? values : []).map(String).filter(Boolean))].sort(keySort);

function normalizeNode(input = {}) {
  const value = record(input);
  const base = {
    node_id: String(value.node_id ?? value.nodeId ?? ''),
    node_kind: String(value.node_kind ?? value.nodeKind ?? 'reality-node'),
    endpoint: String(value.endpoint ?? ''),
    capability_ids: strings(value.capability_ids ?? value.capabilityIds),
    profile_roots: strings(value.profile_roots ?? value.profileRoots),
    link_quality_ppm: Number(value.link_quality_ppm ?? value.linkQualityPpm ?? 1000000),
    distance_m: Number(value.distance_m ?? value.distanceM ?? 0)
  };
  fail(base.node_id.length > 0, 'URRF_TRANSPORT_NODE_ID_REQUIRED');
  fail(base.endpoint.length > 0, 'URRF_TRANSPORT_NODE_ENDPOINT_REQUIRED');
  fail(Number.isSafeInteger(base.link_quality_ppm) && base.link_quality_ppm >= 0 && base.link_quality_ppm <= 1000000, 'URRF_TRANSPORT_NODE_LINK_QUALITY_INVALID');
  fail(Number.isSafeInteger(base.distance_m) && base.distance_m >= 0, 'URRF_TRANSPORT_NODE_DISTANCE_INVALID');
  return {...base, node_root: rootHash(base)};
}

export class RealityTransportFabric {
  constructor(input = {}) {
    const value = record(input);
    this.nodeId = String(value.node_id ?? value.nodeId ?? 'node:local');
    fail(this.nodeId.length > 0, 'URRF_TRANSPORT_LOCAL_NODE_REQUIRED');
    this.tick = Number(value.tick ?? 0);
    fail(Number.isSafeInteger(this.tick) && this.tick >= 0, 'URRF_TRANSPORT_TICK_INVALID');
    this.profiles = new Map();
    this.nodes = new Map();
    this.discoveries = new Map();
    this.associations = new Map();
    this.roamingDecisions = new Map();
    this.packets = new Map();
    this.organLinks = new Map();
    for (const profile of value.profiles ?? []) this.registerProfile(profile);
    for (const node of value.nodes ?? []) this.registerNode(node);
  }

  registerProfile(input) {
    const profile = record(input).profile_root ? clone(input) : createRealityTransportProfile(input);
    const verification = verifyRealityTransportProfile(profile);
    fail(verification.valid, `URRF_TRANSPORT_PROFILE_INVALID:${verification.errors.join(',')}`);
    this.profiles.set(profile.profile_id, profile);
    this.profiles.set(profile.profile_root, profile);
    return clone(profile);
  }

  getProfile(profileIdOrRoot) {
    return clone(this.profiles.get(String(profileIdOrRoot)) ?? null);
  }

  registerNode(input) {
    const node = normalizeNode(input);
    this.nodes.set(node.node_id, node);
    return clone(node);
  }

  discover(input = {}) {
    const value = record(input);
    const observer = String(value.observer_node ?? value.observerNode ?? this.nodeId);
    fail(observer === this.nodeId, 'URRF_TRANSPORT_DISCOVERY_OBSERVER_MISMATCH');
    const requestedKinds = new Set(strings(value.transport_kinds ?? value.transportKinds).map(kind => kind.toUpperCase()));
    const requestedNodes = strings(value.remote_nodes ?? value.remoteNodes);
    const candidates = [...this.nodes.values()]
      .filter(node => node.node_id !== observer)
      .filter(node => requestedNodes.length === 0 || requestedNodes.includes(node.node_id))
      .sort((a, b) => keySort(a.node_id, b.node_id));
    const discoveries = [];
    for (const node of candidates) {
      const profileRoots = node.profile_roots.filter(root => {
        const profile = this.profiles.get(root);
        return profile && (requestedKinds.size === 0 || requestedKinds.has(profile.transport_kind));
      });
      const discovery = createRealityNodeDiscovery({
        observer_node: observer,
        discovered_node: node.node_id,
        node_kind: node.node_kind,
        endpoint: node.endpoint,
        capability_ids: node.capability_ids,
        available_profile_roots: profileRoots,
        link_quality_ppm: node.link_quality_ppm,
        distance_m: node.distance_m,
        discovered_at_tick: this.tick,
        ttl_ticks: value.ttl_ticks ?? value.ttlTicks ?? 10
      });
      this.discoveries.set(discovery.discovery_root, discovery);
      discoveries.push(discovery);
    }
    return discoveries.map(clone);
  }

  associate(input = {}) {
    const value = record(input);
    const discovery = clone(value.discovery ?? value.node_discovery ?? this.discoveries.get(String(value.discovery_root ?? value.discoveryRoot)));
    const discoveryVerification = verifyRealityNodeDiscovery(discovery);
    fail(discoveryVerification.valid, `URRF_TRANSPORT_DISCOVERY_INVALID:${discoveryVerification.errors.join(',')}`);
    fail(discovery.observer_node === this.nodeId, 'URRF_TRANSPORT_ASSOCIATION_LOCAL_NODE_MISMATCH');
    const profile = this.getProfile(value.profile_id ?? value.profileId ?? value.profile_root ?? value.profileRoot);
    fail(profile, 'URRF_TRANSPORT_ASSOCIATION_PROFILE_NOT_FOUND');
    fail(discovery.available_profile_roots.includes(profile.profile_root), 'URRF_TRANSPORT_ASSOCIATION_PROFILE_UNAVAILABLE');
    const association = createRealityNodeAssociation({
      association_id: value.association_id ?? value.associationId,
      local_node: this.nodeId,
      remote_node: discovery.discovered_node,
      device_id: value.device_id ?? value.deviceId ?? `${this.nodeId}:link:${discovery.discovered_node}`,
      discovery,
      profile_root: profile.profile_root,
      paired: value.paired ?? false,
      permission_scope: value.permission_scope ?? value.permissionScope
    });
    this.associations.set(association.association_root, association);
    return clone(association);
  }

  resolveProfile(input = {}) {
    const value = record(input);
    const candidates = [value.preferred_profile ?? value.preferredProfile, ...(value.fallback_profiles ?? value.fallbackProfiles ?? [])].map(String).filter(Boolean);
    for (const candidate of candidates) {
      const profile = this.getProfile(candidate);
      if (profile) return profile;
    }
    return null;
  }

  roam(input = {}) {
    const value = record(input);
    const targetAssociation = clone(value.target_association ?? value.targetAssociation ?? this.associations.get(String(value.target_association_root ?? value.targetAssociationRoot)));
    const targetVerification = verifyRealityNodeAssociation(targetAssociation);
    fail(targetVerification.valid, `URRF_TRANSPORT_ROAM_TARGET_INVALID:${targetVerification.errors.join(',')}`);
    fail(targetAssociation.local_node === this.nodeId, 'URRF_TRANSPORT_ROAM_LOCAL_NODE_MISMATCH');
    const selected = this.getProfile(targetAssociation.profile_root);
    fail(selected, 'URRF_TRANSPORT_ROAM_PROFILE_NOT_FOUND');
    const decision = createRealityRoamingDecision({
      decision_id: value.decision_id ?? value.decisionId,
      subject_id: value.subject_id ?? value.subjectId ?? targetAssociation.device_id,
      from_node: value.from_node ?? value.fromNode,
      to_node: targetAssociation.remote_node,
      previous_association: value.previous_association ?? value.previousAssociation ?? null,
      target_association: targetAssociation,
      fallback_profile_root: value.fallback_profile_root ?? value.fallbackProfileRoot ?? null,
      reason: value.reason ?? 'explicit-roaming',
      sequence: value.sequence ?? this.roamingDecisions.size + 1
    });
    this.roamingDecisions.set(decision.decision_root, decision);
    return clone(decision);
  }

  send(input = {}) {
    const value = record(input);
    const profile = this.getProfile(value.profile_id ?? value.profileId ?? value.profile_root ?? value.profileRoot ?? value.profile?.profile_root);
    fail(profile, 'URRF_TRANSPORT_SEND_PROFILE_NOT_FOUND');
    const packet = createRealityTransportPacket({
      ...value,
      profile,
      source_node: value.source_node ?? value.sourceNode ?? this.nodeId,
      created_tick: value.created_tick ?? value.createdTick ?? this.tick,
      sequence: value.sequence ?? this.packets.size + 1
    });
    const admission = checkRealityTransportAdmission(packet, {
      profile_root: profile.profile_root,
      source_node: this.nodeId,
      target_node: value.target_node ?? value.targetNode,
      tick: this.tick,
      current_lease: value.current_lease ?? value.currentLease,
      authority_id: value.authority_id,
      shard_id: value.shard_id,
      semantic_scope: value.semantic_scope,
      authority_receipt: value.authority_receipt ?? value.authorityReceipt,
      require_authority: value.require_authority,
      world_mutation: value.world_mutation
    });
    fail(admission.valid, `URRF_TRANSPORT_SEND_ADMISSION_FAILED:${admission.errors.join(',')}`);
    this.packets.set(packet.packet_root, packet);
    return clone(packet);
  }

  sendOrganState(input = {}) {
    const value = record(input);
    const association = clone(value.association ?? value.node_association ?? this.associations.get(String(value.association_root ?? value.associationRoot)));
    const associationVerification = verifyRealityNodeAssociation(association);
    fail(associationVerification.valid, `URRF_TRANSPORT_ORGAN_ASSOCIATION_INVALID:${associationVerification.errors.join(',')}`);
    const profile = this.getProfile(value.profile_id ?? value.profileId ?? value.profile_root ?? value.profileRoot ?? value.profile?.profile_root);
    fail(profile?.transport_kind === 'BLUETOOTH', 'URRF_TRANSPORT_ORGAN_BLUETOOTH_REQUIRED');
    const link = createRealityOrganLink({
      ...value,
      association,
      profile,
      source_node: value.source_node ?? value.sourceNode ?? association.remote_node,
      target_node: value.target_node ?? value.targetNode ?? association.local_node,
      state_sequence: value.state_sequence ?? value.stateSequence ?? this.organLinks.size + 1
    });
    const admission = checkRealityOrganLinkAdmission(link, {
      ...value,
      target_node: link.target_node,
      profile_root: profile.profile_root,
      tick: this.tick,
      current_lease: value.current_lease ?? value.currentLease,
      authority_receipt: value.authority_receipt ?? value.authorityReceipt,
      require_authority: value.require_authority ?? value.requireAuthority,
      world_mutation: value.world_mutation ?? value.worldMutation,
      authority_id: value.authority_id ?? value.authorityId,
      shard_id: value.shard_id ?? value.shardId,
      semantic_scope: value.semantic_scope ?? value.semanticScope
    });
    fail(admission.valid, `URRF_TRANSPORT_ORGAN_ADMISSION_FAILED:${admission.errors.join(',')}`);
    this.organLinks.set(link.link_root, link);
    return clone(link);
  }

  advance(ticks = 1) {
    const delta = Number(ticks);
    fail(Number.isSafeInteger(delta) && delta >= 0, 'URRF_TRANSPORT_ADVANCE_INVALID');
    this.tick += delta;
    return this.tick;
  }

  snapshot() {
    const base = {
      node_id: this.nodeId,
      tick: this.tick,
      profiles: [...new Map([...this.profiles.values()].map(profile => [profile.profile_root, profile])).values()].sort((a, b) => keySort(a.profile_root, b.profile_root)).map(profile => ({profile_id: profile.profile_id, profile_root: profile.profile_root, transport_kind: profile.transport_kind, qos_class: profile.qos_class})),
      nodes: [...this.nodes.values()].sort((a, b) => keySort(a.node_id, b.node_id)).map(node => ({node_id: node.node_id, node_root: node.node_root})),
      discoveries: [...this.discoveries.values()].sort((a, b) => keySort(a.discovery_root, b.discovery_root)).map(discovery => ({discovered_node: discovery.discovered_node, discovery_root: discovery.discovery_root})),
      associations: [...this.associations.values()].sort((a, b) => keySort(a.association_root, b.association_root)).map(association => ({association_id: association.association_id, association_root: association.association_root, status: association.status})),
      roaming_decisions: [...this.roamingDecisions.values()].sort((a, b) => keySort(a.decision_root, b.decision_root)).map(decision => ({decision_id: decision.decision_id, decision_root: decision.decision_root, status: decision.status})),
      packets: [...this.packets.values()].sort((a, b) => keySort(a.packet_root, b.packet_root)).map(packet => ({packet_id: packet.packet_id, packet_root: packet.packet_root, profile_root: packet.profile_root})),
      organ_links: [...this.organLinks.values()].sort((a, b) => keySort(a.link_root, b.link_root)).map(link => ({link_id: link.link_id, link_root: link.link_root, profile_root: link.profile_root})),
      candidate_only: true,
      authoritative: false,
      commit_status: 'NOT_COMMITTED'
    };
    return {...base, fabric_root: rootHash(base)};
  }

  verify() {
    const snapshot = this.snapshot();
    for (const profile of this.profiles.values()) fail(verifyRealityTransportProfile(profile).valid, 'URRF_TRANSPORT_SNAPSHOT_PROFILE_INVALID');
    for (const discovery of this.discoveries.values()) fail(verifyRealityNodeDiscovery(discovery).valid, 'URRF_TRANSPORT_SNAPSHOT_DISCOVERY_INVALID');
    for (const association of this.associations.values()) fail(verifyRealityNodeAssociation(association).valid, 'URRF_TRANSPORT_SNAPSHOT_ASSOCIATION_INVALID');
    for (const decision of this.roamingDecisions.values()) fail(verifyRealityRoamingDecision(decision).valid, 'URRF_TRANSPORT_SNAPSHOT_ROAMING_INVALID');
    for (const packet of this.packets.values()) fail(verifyRealityTransportPacket(packet).valid, 'URRF_TRANSPORT_SNAPSHOT_PACKET_INVALID');
    for (const link of this.organLinks.values()) fail(verifyRealityOrganLink(link).valid, 'URRF_TRANSPORT_SNAPSHOT_ORGAN_INVALID');
    return snapshot;
  }
}

export function createRealityTransportFabric(options = {}) {
  return new RealityTransportFabric(options);
}
