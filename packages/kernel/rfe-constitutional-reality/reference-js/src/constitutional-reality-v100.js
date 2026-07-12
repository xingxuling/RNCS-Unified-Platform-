import fs from 'node:fs';
import path from 'node:path';
import { canonical, hash } from './replicated-authority-v050.js';

function fail(code, detail = '') {
  const error = new Error(`${code}${detail === '' ? '' : `: ${detail}`}`);
  error.code = code;
  error.detail = detail;
  throw error;
}

function assert(condition, code, detail = '') {
  if (!condition) fail(code, detail);
}

function withoutField(value, field) {
  const copy = structuredClone(value);
  delete copy[field];
  return copy;
}

function withHash(value, field) {
  const body = withoutField(value, field);
  return { ...body, [field]: hash(body) };
}

function sortedBy(items, key) {
  return [...items].sort((left, right) => String(left[key]).localeCompare(String(right[key])));
}

function keyedProof(body, verifierKey) {
  return hash({
    format: 'rfe.constitutional-keyed-proof.v1.0',
    body,
    verifierKey,
  });
}

function publicMember(seed) {
  const identityCommitment = seed.identityCommitment ?? hash({
    format: 'rfe.constitutional-identity.v1.0',
    clusterId: seed.clusterId,
    origin: seed.origin ?? 'federation',
  });
  return {
    clusterId: seed.clusterId,
    weight: seed.weight,
    identityCommitment,
    verifierKeyCommitment: hash({
      format: 'rfe.constitutional-verifier-key.v1.0',
      verifierKey: seed.verifierKey,
    }),
  };
}

export function normalizeConstitution(raw) {
  assert(raw && typeof raw === 'object', 'MISSING_CONSTITUTION');
  assert(Number.isInteger(raw.epoch) && raw.epoch > 0, 'INVALID_CONFIGURATION_EPOCH');
  assert(Array.isArray(raw.members) && raw.members.length >= 3, 'INSUFFICIENT_CONSTITUTION_MEMBERS');
  const members = [];
  const verifierKeys = new Map();
  const seen = new Set();
  for (const seed of raw.members) {
    assert(typeof seed.clusterId === 'string' && seed.clusterId.length > 0, 'INVALID_CLUSTER_ID');
    assert(!seen.has(seed.clusterId), 'DUPLICATE_CONSTITUTION_MEMBER', seed.clusterId);
    seen.add(seed.clusterId);
    assert(Number.isInteger(seed.weight) && seed.weight > 0, 'INVALID_CONSTITUTION_WEIGHT', seed.clusterId);
    assert(typeof seed.verifierKey === 'string' && seed.verifierKey.length > 0, 'MISSING_CONSTITUTION_VERIFIER_KEY', seed.clusterId);
    members.push(publicMember(seed));
    verifierKeys.set(seed.clusterId, seed.verifierKey);
  }
  const ordered = sortedBy(members, 'clusterId');
  const totalWeight = ordered.reduce((sum, item) => sum + item.weight, 0);
  assert(Number.isInteger(raw.quorumWeight) && raw.quorumWeight > 0 && raw.quorumWeight <= totalWeight, 'INVALID_CONSTITUTION_QUORUM');
  assert(Number.isInteger(raw.byzantineBudgetWeight) && raw.byzantineBudgetWeight >= 0, 'INVALID_CONSTITUTION_BYZANTINE_BUDGET');
  assert(
    2 * raw.quorumWeight > totalWeight + raw.byzantineBudgetWeight,
    'UNSAFE_CONSTITUTIONAL_QUORUM',
    `epoch=${raw.epoch}`,
  );
  const configuration = withHash({
    format: 'rfe.constitution.v1.0',
    epoch: raw.epoch,
    members: ordered,
    totalWeight,
    quorumWeight: raw.quorumWeight,
    byzantineBudgetWeight: raw.byzantineBudgetWeight,
  }, 'configurationHash');
  return { configuration, verifierKeys };
}

function memberMap(configuration) {
  return new Map(configuration.members.map((member) => [member.clusterId, member]));
}

function configurationChanges(current, next) {
  const oldMembers = memberMap(current);
  const newMembers = memberMap(next);
  const allIds = [...new Set([...oldMembers.keys(), ...newMembers.keys()])].sort();
  const added = [];
  const removed = [];
  const weightChanged = [];
  const keyRotated = [];
  for (const clusterId of allIds) {
    const oldMember = oldMembers.get(clusterId);
    const newMember = newMembers.get(clusterId);
    if (!oldMember) added.push(clusterId);
    else if (!newMember) removed.push(clusterId);
    else {
      if (oldMember.weight !== newMember.weight) {
        weightChanged.push({ clusterId, from: oldMember.weight, to: newMember.weight });
      }
      if (oldMember.verifierKeyCommitment !== newMember.verifierKeyCommitment) {
        keyRotated.push({
          clusterId,
          from: oldMember.verifierKeyCommitment,
          to: newMember.verifierKeyCommitment,
        });
      }
    }
  }
  return { added, removed, weightChanged, keyRotated };
}

function topologyRecord(member, epoch, configurationHash, status = 'active') {
  return withHash({
    format: 'rfe.constitutional-topology-record.v1.0',
    clusterId: member.clusterId,
    status,
    weight: member.weight,
    identityCommitment: member.identityCommitment,
    verifierKeyCommitment: member.verifierKeyCommitment,
    configurationHash,
    effectiveEpoch: epoch,
    retiredAtEpoch: status === 'retired' ? epoch : null,
  }, 'topologyRecordHash');
}

function initialTopology(configuration) {
  return new Map(configuration.members.map((member) => [
    member.clusterId,
    topologyRecord(member, configuration.epoch, configuration.configurationHash),
  ]));
}

function targetTopology(current, next) {
  const currentMembers = memberMap(current);
  const nextMembers = memberMap(next);
  const ids = [...new Set([...currentMembers.keys(), ...nextMembers.keys()])].sort();
  const records = [];
  for (const clusterId of ids) {
    const nextMember = nextMembers.get(clusterId);
    if (nextMember) records.push(topologyRecord(nextMember, next.epoch, next.configurationHash));
    else records.push(topologyRecord(currentMembers.get(clusterId), next.epoch, next.configurationHash, 'retired'));
  }
  return records;
}

function topologyRoot(records) {
  return hash(sortedBy(records, 'clusterId'));
}

export function signConstitutionalVote(seed, body) {
  const unsigned = {
    format: 'rfe.constitutional-vote.v1.0',
    phase: body.phase,
    configurationRole: body.configurationRole,
    epoch: body.epoch,
    configurationHash: body.configurationHash,
    transitionHash: body.transitionHash,
    parentFederationRoot: body.parentFederationRoot,
    clusterId: seed.clusterId,
    weight: seed.weight,
    identityCommitment: publicMember(seed).identityCommitment,
    verifierKeyCommitment: publicMember(seed).verifierKeyCommitment,
    decision: body.decision ?? 'approve',
  };
  return {
    ...unsigned,
    voteHash: hash(unsigned),
    keyedProof: keyedProof(unsigned, seed.verifierKey),
  };
}

export function signRotationContinuity(oldSeed, newSeed, proposal) {
  assert(oldSeed.clusterId === newSeed.clusterId, 'ROTATION_IDENTITY_MISMATCH');
  const unsigned = {
    format: 'rfe.constitutional-rotation-continuity.v1.0',
    clusterId: oldSeed.clusterId,
    fromEpoch: proposal.fromEpoch,
    toEpoch: proposal.toEpoch,
    oldConfigurationHash: proposal.oldConfigurationHash,
    newConfigurationHash: proposal.newConfigurationHash,
    transitionHash: proposal.transitionHash,
    oldVerifierKeyCommitment: publicMember(oldSeed).verifierKeyCommitment,
    newVerifierKeyCommitment: publicMember(newSeed).verifierKeyCommitment,
  };
  const proofBody = {
    ...unsigned,
    oldKeyedProof: keyedProof(unsigned, oldSeed.verifierKey),
    newKeyedProof: keyedProof(unsigned, newSeed.verifierKey),
  };
  return withHash(proofBody, 'rotationProofHash');
}

export function signConstitutionConfirmation(seed, body) {
  const unsigned = {
    format: 'rfe.constitution-confirmation-vote.v1.0',
    epoch: body.epoch,
    configurationHash: body.configurationHash,
    federationRoot: body.federationRoot,
    confirmationId: body.confirmationId,
    confirmationHash: body.confirmationHash,
    clusterId: seed.clusterId,
    weight: seed.weight,
    identityCommitment: publicMember(seed).identityCommitment,
    verifierKeyCommitment: publicMember(seed).verifierKeyCommitment,
  };
  return {
    ...unsigned,
    voteHash: hash(unsigned),
    keyedProof: keyedProof(unsigned, seed.verifierKey),
  };
}

export class ConstitutionalReality {
  constructor(currentRaw, parentCertificateHash, federationRoot) {
    const normalized = normalizeConstitution(currentRaw);
    assert(typeof parentCertificateHash === 'string' && parentCertificateHash.length > 0, 'MISSING_PARENT_CERTIFICATE_HASH');
    assert(typeof federationRoot === 'string' && federationRoot.length > 0, 'MISSING_FEDERATION_ROOT');
    this.currentConfiguration = normalized.configuration;
    this.currentVerifierKeys = normalized.verifierKeys;
    this.parentCertificateHash = parentCertificateHash;
    this.federationRoot = federationRoot;
    this.initialFederationRoot = federationRoot;
    this.archivedConfigurations = [];
    this.topology = initialTopology(this.currentConfiguration);
    this.pendingTransition = null;
    this.pendingNewConfiguration = null;
    this.pendingNewVerifierKeys = new Map();
    this.rotationProofs = new Map();
    this.oldVotes = [];
    this.newVotes = [];
    this.oldAuthorizationCertificate = null;
    this.newAcceptanceCertificate = null;
    this.jointActivationCertificate = null;
    this.pendingActivationCertificateHash = null;
    this.activationProgress = [];
    this.receipt = null;
    this.confirmationVotes = [];
    this.confirmationCertificate = null;
    this.metrics = {
      transitionProposals: 0,
      rotationProofsAccepted: 0,
      oldVotesAccepted: 0,
      newVotesAccepted: 0,
      oldAuthorizationCertificates: 0,
      newAcceptanceCertificates: 0,
      jointActivationCertificates: 0,
      topologyMutations: 0,
      injectedInterruptions: 0,
      recoveries: 0,
      idempotentRecoveryReplays: 0,
      staleEpochRejections: 0,
      removedMemberRejections: 0,
      keyMismatchRejections: 0,
      transitionMismatchRejections: 0,
      confirmationVotesAccepted: 0,
      confirmationCertificates: 0,
      topologyDivergences: 0,
    };
  }

  static fromDurableState(snapshot) {
    assert(snapshot.format === 'rfe.constitutional-durable-state.v1.0', 'INVALID_CONSTITUTIONAL_SNAPSHOT_FORMAT');
    assert(hash(withoutField(snapshot, 'snapshotHash')) === snapshot.snapshotHash, 'CONSTITUTIONAL_SNAPSHOT_HASH_MISMATCH');
    const engine = Object.create(ConstitutionalReality.prototype);
    engine.currentConfiguration = structuredClone(snapshot.currentConfiguration);
    engine.currentVerifierKeys = new Map(snapshot.currentVerifierKeys);
    engine.parentCertificateHash = snapshot.parentCertificateHash;
    engine.federationRoot = snapshot.federationRoot;
    engine.initialFederationRoot = snapshot.initialFederationRoot;
    engine.archivedConfigurations = structuredClone(snapshot.archivedConfigurations);
    engine.topology = new Map(snapshot.topology.map((item) => [item.clusterId, structuredClone(item)]));
    engine.pendingTransition = structuredClone(snapshot.pendingTransition);
    engine.pendingNewConfiguration = structuredClone(snapshot.pendingNewConfiguration);
    engine.pendingNewVerifierKeys = new Map(snapshot.pendingNewVerifierKeys);
    engine.rotationProofs = new Map(snapshot.rotationProofs.map((item) => [item.clusterId, structuredClone(item)]));
    engine.oldVotes = structuredClone(snapshot.oldVotes);
    engine.newVotes = structuredClone(snapshot.newVotes);
    engine.oldAuthorizationCertificate = structuredClone(snapshot.oldAuthorizationCertificate);
    engine.newAcceptanceCertificate = structuredClone(snapshot.newAcceptanceCertificate);
    engine.jointActivationCertificate = structuredClone(snapshot.jointActivationCertificate);
    engine.pendingActivationCertificateHash = snapshot.pendingActivationCertificateHash;
    engine.activationProgress = structuredClone(snapshot.activationProgress);
    engine.receipt = structuredClone(snapshot.receipt);
    engine.confirmationVotes = structuredClone(snapshot.confirmationVotes);
    engine.confirmationCertificate = structuredClone(snapshot.confirmationCertificate);
    engine.metrics = structuredClone(snapshot.metrics);
    return engine;
  }

  static open(filePath) {
    return ConstitutionalReality.fromDurableState(JSON.parse(fs.readFileSync(filePath, 'utf8')));
  }

  durableState() {
    return withHash({
      format: 'rfe.constitutional-durable-state.v1.0',
      currentConfiguration: structuredClone(this.currentConfiguration),
      currentVerifierKeys: [...this.currentVerifierKeys.entries()].sort(([left], [right]) => left.localeCompare(right)),
      parentCertificateHash: this.parentCertificateHash,
      federationRoot: this.federationRoot,
      initialFederationRoot: this.initialFederationRoot,
      archivedConfigurations: structuredClone(this.archivedConfigurations),
      topology: sortedBy([...this.topology.values()].map((item) => structuredClone(item)), 'clusterId'),
      pendingTransition: structuredClone(this.pendingTransition),
      pendingNewConfiguration: structuredClone(this.pendingNewConfiguration),
      pendingNewVerifierKeys: [...this.pendingNewVerifierKeys.entries()].sort(([left], [right]) => left.localeCompare(right)),
      rotationProofs: sortedBy([...this.rotationProofs.values()].map((item) => structuredClone(item)), 'clusterId'),
      oldVotes: sortedBy(this.oldVotes, 'voteHash'),
      newVotes: sortedBy(this.newVotes, 'voteHash'),
      oldAuthorizationCertificate: structuredClone(this.oldAuthorizationCertificate),
      newAcceptanceCertificate: structuredClone(this.newAcceptanceCertificate),
      jointActivationCertificate: structuredClone(this.jointActivationCertificate),
      pendingActivationCertificateHash: this.pendingActivationCertificateHash,
      activationProgress: [...this.activationProgress].sort(),
      receipt: structuredClone(this.receipt),
      confirmationVotes: sortedBy(this.confirmationVotes, 'voteHash'),
      confirmationCertificate: structuredClone(this.confirmationCertificate),
      metrics: structuredClone(this.metrics),
    }, 'snapshotHash');
  }

  save(filePath) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const temporary = `${filePath}.tmp`;
    fs.writeFileSync(temporary, canonical(this.durableState()));
    fs.renameSync(temporary, filePath);
  }

  proposeTransition(plan, nextRaw) {
    assert(this.pendingTransition === null, 'CONSTITUTIONAL_TRANSITION_ALREADY_PENDING');
    assert(this.receipt === null, 'CONSTITUTIONAL_TRANSITION_ALREADY_COMMITTED');
    const next = normalizeConstitution(nextRaw);
    assert(next.configuration.epoch === this.currentConfiguration.epoch + 1, 'NON_MONOTONIC_CONFIGURATION_EPOCH');
    const changes = configurationChanges(this.currentConfiguration, next.configuration);
    const changeCount = changes.added.length + changes.removed.length + changes.weightChanged.length + changes.keyRotated.length;
    assert(changeCount > 0, 'EMPTY_CONSTITUTIONAL_TRANSITION');
    const body = {
      format: 'rfe.constitutional-transition.v1.0',
      transitionId: plan.transitionId,
      fromEpoch: this.currentConfiguration.epoch,
      toEpoch: next.configuration.epoch,
      parentCertificateHash: this.parentCertificateHash,
      parentFederationRoot: this.federationRoot,
      oldConfigurationHash: this.currentConfiguration.configurationHash,
      newConfigurationHash: next.configuration.configurationHash,
      purposeHash: hash(plan.purpose ?? null),
      changes,
    };
    const proposal = withHash(body, 'transitionHash');
    this.pendingTransition = proposal;
    this.pendingNewConfiguration = next.configuration;
    this.pendingNewVerifierKeys = next.verifierKeys;
    this.metrics.transitionProposals += 1;
    return structuredClone(proposal);
  }

  registerRotationProof(proof) {
    assert(this.pendingTransition, 'NO_PENDING_CONSTITUTIONAL_TRANSITION');
    const rotation = this.pendingTransition.changes.keyRotated.find((item) => item.clusterId === proof.clusterId);
    assert(rotation, 'UNEXPECTED_KEY_ROTATION_PROOF', proof.clusterId);
    assert(proof.transitionHash === this.pendingTransition.transitionHash, 'ROTATION_TRANSITION_HASH_MISMATCH');
    assert(proof.fromEpoch === this.pendingTransition.fromEpoch && proof.toEpoch === this.pendingTransition.toEpoch, 'ROTATION_EPOCH_MISMATCH');
    assert(proof.oldConfigurationHash === this.pendingTransition.oldConfigurationHash, 'ROTATION_OLD_CONFIGURATION_MISMATCH');
    assert(proof.newConfigurationHash === this.pendingTransition.newConfigurationHash, 'ROTATION_NEW_CONFIGURATION_MISMATCH');
    assert(proof.oldVerifierKeyCommitment === rotation.from, 'ROTATION_OLD_KEY_COMMITMENT_MISMATCH');
    assert(proof.newVerifierKeyCommitment === rotation.to, 'ROTATION_NEW_KEY_COMMITMENT_MISMATCH');
    assert(hash(withoutField(proof, 'rotationProofHash')) === proof.rotationProofHash, 'ROTATION_PROOF_HASH_MISMATCH');
    const oldKey = this.currentVerifierKeys.get(proof.clusterId);
    const newKey = this.pendingNewVerifierKeys.get(proof.clusterId);
    assert(oldKey && newKey, 'ROTATION_KEY_REGISTRY_MISSING', proof.clusterId);
    const unsigned = {
      format: proof.format,
      clusterId: proof.clusterId,
      fromEpoch: proof.fromEpoch,
      toEpoch: proof.toEpoch,
      oldConfigurationHash: proof.oldConfigurationHash,
      newConfigurationHash: proof.newConfigurationHash,
      transitionHash: proof.transitionHash,
      oldVerifierKeyCommitment: proof.oldVerifierKeyCommitment,
      newVerifierKeyCommitment: proof.newVerifierKeyCommitment,
    };
    assert(proof.oldKeyedProof === keyedProof(unsigned, oldKey), 'ROTATION_OLD_KEYED_PROOF_MISMATCH');
    assert(proof.newKeyedProof === keyedProof(unsigned, newKey), 'ROTATION_NEW_KEYED_PROOF_MISMATCH');
    assert(!this.rotationProofs.has(proof.clusterId), 'DUPLICATE_KEY_ROTATION_PROOF', proof.clusterId);
    this.rotationProofs.set(proof.clusterId, structuredClone(proof));
    this.metrics.rotationProofsAccepted += 1;
    return structuredClone(proof);
  }

  registerTransitionVote(vote) {
    if (vote.epoch < this.currentConfiguration.epoch || (this.receipt && vote.epoch < this.currentConfiguration.epoch)) {
      this.metrics.staleEpochRejections += 1;
      fail('STALE_CONFIGURATION_EPOCH', vote.epoch);
    }
    assert(this.pendingTransition, 'NO_PENDING_CONSTITUTIONAL_TRANSITION');
    assert(vote.transitionHash === this.pendingTransition.transitionHash, 'TRANSITION_HASH_MISMATCH');
    assert(vote.parentFederationRoot === this.pendingTransition.parentFederationRoot, 'TRANSITION_PARENT_ROOT_MISMATCH');
    assert(vote.decision === 'approve', 'CONSTITUTIONAL_VOTE_REJECTED');
    const isOld = vote.configurationRole === 'old' && vote.phase === 'authorize';
    const isNew = vote.configurationRole === 'new' && vote.phase === 'accept';
    assert(isOld || isNew, 'INVALID_CONSTITUTIONAL_VOTE_PHASE');
    const configuration = isOld ? this.currentConfiguration : this.pendingNewConfiguration;
    const verifierKeys = isOld ? this.currentVerifierKeys : this.pendingNewVerifierKeys;
    const expectedEpoch = isOld ? this.pendingTransition.fromEpoch : this.pendingTransition.toEpoch;
    assert(vote.epoch === expectedEpoch, 'CONSTITUTIONAL_VOTE_EPOCH_MISMATCH');
    assert(vote.configurationHash === configuration.configurationHash, 'CONSTITUTIONAL_VOTE_CONFIGURATION_MISMATCH');
    const member = memberMap(configuration).get(vote.clusterId);
    assert(member, 'UNKNOWN_CONSTITUTION_MEMBER', vote.clusterId);
    assert(vote.weight === member.weight, 'CONSTITUTIONAL_VOTE_WEIGHT_MISMATCH');
    assert(vote.identityCommitment === member.identityCommitment, 'CONSTITUTIONAL_IDENTITY_MISMATCH');
    assert(vote.verifierKeyCommitment === member.verifierKeyCommitment, 'CONSTITUTIONAL_KEY_COMMITMENT_MISMATCH');
    const unsignedVote = withoutField(withoutField(vote, 'voteHash'), 'keyedProof');
    assert(hash(unsignedVote) === vote.voteHash, 'CONSTITUTIONAL_VOTE_HASH_MISMATCH');
    const verifierKey = verifierKeys.get(vote.clusterId);
    assert(vote.keyedProof === keyedProof(unsignedVote, verifierKey), 'CONSTITUTIONAL_KEYED_PROOF_MISMATCH');
    const votes = isOld ? this.oldVotes : this.newVotes;
    assert(!votes.some((item) => item.clusterId === vote.clusterId), 'DUPLICATE_CONSTITUTIONAL_VOTE', vote.clusterId);
    votes.push(structuredClone(vote));
    if (isOld) this.metrics.oldVotesAccepted += 1;
    else this.metrics.newVotesAccepted += 1;
    return structuredClone(vote);
  }

  formOldAuthorizationCertificate() {
    assert(this.pendingTransition, 'NO_PENDING_CONSTITUTIONAL_TRANSITION');
    const weight = this.oldVotes.reduce((sum, vote) => sum + vote.weight, 0);
    if (weight < this.currentConfiguration.quorumWeight) return null;
    const certificate = withHash({
      format: 'rfe.old-constitution-authorization-certificate.v1.0',
      transitionHash: this.pendingTransition.transitionHash,
      epoch: this.pendingTransition.fromEpoch,
      configurationHash: this.currentConfiguration.configurationHash,
      parentFederationRoot: this.federationRoot,
      voterIds: this.oldVotes.map((vote) => vote.clusterId).sort(),
      voteHashes: this.oldVotes.map((vote) => vote.voteHash).sort(),
      approvedWeight: weight,
      quorumWeight: this.currentConfiguration.quorumWeight,
    }, 'oldAuthorizationCertificateHash');
    this.oldAuthorizationCertificate = certificate;
    this.metrics.oldAuthorizationCertificates += 1;
    return structuredClone(certificate);
  }

  formNewAcceptanceCertificate() {
    assert(this.pendingTransition, 'NO_PENDING_CONSTITUTIONAL_TRANSITION');
    const weight = this.newVotes.reduce((sum, vote) => sum + vote.weight, 0);
    if (weight < this.pendingNewConfiguration.quorumWeight) return null;
    const certificate = withHash({
      format: 'rfe.new-constitution-acceptance-certificate.v1.0',
      transitionHash: this.pendingTransition.transitionHash,
      epoch: this.pendingTransition.toEpoch,
      configurationHash: this.pendingNewConfiguration.configurationHash,
      parentFederationRoot: this.federationRoot,
      voterIds: this.newVotes.map((vote) => vote.clusterId).sort(),
      voteHashes: this.newVotes.map((vote) => vote.voteHash).sort(),
      acceptedWeight: weight,
      quorumWeight: this.pendingNewConfiguration.quorumWeight,
    }, 'newAcceptanceCertificateHash');
    this.newAcceptanceCertificate = certificate;
    this.metrics.newAcceptanceCertificates += 1;
    return structuredClone(certificate);
  }

  formJointActivationCertificate() {
    assert(this.pendingTransition, 'NO_PENDING_CONSTITUTIONAL_TRANSITION');
    assert(this.oldAuthorizationCertificate, 'MISSING_OLD_AUTHORIZATION_CERTIFICATE');
    assert(this.newAcceptanceCertificate, 'MISSING_NEW_ACCEPTANCE_CERTIFICATE');
    for (const rotation of this.pendingTransition.changes.keyRotated) {
      assert(this.rotationProofs.has(rotation.clusterId), 'MISSING_KEY_ROTATION_CONTINUITY', rotation.clusterId);
    }
    const records = targetTopology(this.currentConfiguration, this.pendingNewConfiguration);
    const targetTopologyRoot = topologyRoot(records);
    const certificate = withHash({
      format: 'rfe.joint-constitution-activation-certificate.v1.0',
      transitionHash: this.pendingTransition.transitionHash,
      fromEpoch: this.pendingTransition.fromEpoch,
      toEpoch: this.pendingTransition.toEpoch,
      parentFederationRoot: this.federationRoot,
      oldConfigurationHash: this.currentConfiguration.configurationHash,
      newConfigurationHash: this.pendingNewConfiguration.configurationHash,
      oldAuthorizationCertificateHash: this.oldAuthorizationCertificate.oldAuthorizationCertificateHash,
      newAcceptanceCertificateHash: this.newAcceptanceCertificate.newAcceptanceCertificateHash,
      rotationProofHashes: sortedBy([...this.rotationProofs.values()], 'clusterId').map((proof) => proof.rotationProofHash),
      targetTopologyRoot,
    }, 'jointActivationCertificateHash');
    this.jointActivationCertificate = certificate;
    this.pendingActivationCertificateHash = certificate.jointActivationCertificateHash;
    this.metrics.jointActivationCertificates += 1;
    return structuredClone(certificate);
  }

  commitActivation(crashAfter = null) {
    assert(this.jointActivationCertificate, 'NO_DURABLE_JOINT_ACTIVATION_CERTIFICATE');
    assert(this.pendingActivationCertificateHash === this.jointActivationCertificate.jointActivationCertificateHash, 'ACTIVATION_CERTIFICATE_OWNERSHIP_MISMATCH');
    const targets = targetTopology(this.currentConfiguration, this.pendingNewConfiguration);
    let mutations = 0;
    for (const record of targets) {
      if (this.activationProgress.includes(record.clusterId)) continue;
      this.topology.set(record.clusterId, structuredClone(record));
      this.activationProgress.push(record.clusterId);
      this.metrics.topologyMutations += 1;
      mutations += 1;
      if (crashAfter === mutations) {
        this.metrics.injectedInterruptions += 1;
        fail('CONSTITUTIONAL_CRASH_INJECTED_AFTER_MEMBER', mutations);
      }
    }
    return this.finalizeActivation(false);
  }

  finalizeActivation(recovered) {
    if (this.receipt) return structuredClone(this.receipt);
    const currentRoot = topologyRoot([...this.topology.values()]);
    if (currentRoot !== this.jointActivationCertificate.targetTopologyRoot) {
      this.metrics.topologyDivergences += 1;
      fail('CONSTITUTIONAL_TOPOLOGY_DIVERGENCE', currentRoot);
    }
    const previous = structuredClone(this.currentConfiguration);
    const previousRoot = this.federationRoot;
    this.archivedConfigurations.push(previous);
    this.currentConfiguration = structuredClone(this.pendingNewConfiguration);
    this.currentVerifierKeys = new Map(this.pendingNewVerifierKeys);
    this.federationRoot = hash({
      format: 'rfe.constitutional-federation-root.v1.0',
      previousFederationRoot: previousRoot,
      jointActivationCertificateHash: this.jointActivationCertificate.jointActivationCertificateHash,
      targetTopologyRoot: currentRoot,
      epoch: this.currentConfiguration.epoch,
    });
    this.parentCertificateHash = this.jointActivationCertificate.jointActivationCertificateHash;
    this.pendingActivationCertificateHash = null;
    this.receipt = withHash({
      format: 'rfe.constitutional-activation-receipt.v1.0',
      transitionHash: this.pendingTransition.transitionHash,
      fromEpoch: previous.epoch,
      toEpoch: this.currentConfiguration.epoch,
      oldConfigurationHash: previous.configurationHash,
      newConfigurationHash: this.currentConfiguration.configurationHash,
      jointActivationCertificateHash: this.jointActivationCertificate.jointActivationCertificateHash,
      finalTopologyRoot: currentRoot,
      finalFederationRoot: this.federationRoot,
      recovered,
    }, 'receiptHash');
    return structuredClone(this.receipt);
  }

  recover() {
    if (this.receipt) {
      this.metrics.idempotentRecoveryReplays += 1;
      return structuredClone(this.receipt);
    }
    assert(this.jointActivationCertificate, 'NO_DURABLE_JOINT_ACTIVATION_CERTIFICATE');
    this.metrics.recoveries += 1;
    return this.commitActivation(null).recovered === true
      ? structuredClone(this.receipt)
      : (() => {
          this.receipt.recovered = true;
          this.receipt.receiptHash = hash(withoutField(this.receipt, 'receiptHash'));
          return structuredClone(this.receipt);
        })();
  }

  registerConfirmationVote(vote) {
    assert(this.receipt, 'CONSTITUTION_NOT_ACTIVATED');
    if (vote.epoch < this.currentConfiguration.epoch) {
      this.metrics.staleEpochRejections += 1;
      fail('STALE_CONFIGURATION_EPOCH', vote.epoch);
    }
    assert(vote.epoch === this.currentConfiguration.epoch, 'CONFIRMATION_EPOCH_MISMATCH');
    assert(vote.configurationHash === this.currentConfiguration.configurationHash, 'CONFIRMATION_CONFIGURATION_MISMATCH');
    assert(vote.federationRoot === this.federationRoot, 'CONFIRMATION_FEDERATION_ROOT_MISMATCH');
    const member = memberMap(this.currentConfiguration).get(vote.clusterId);
    if (!member) {
      this.metrics.removedMemberRejections += 1;
      fail('REMOVED_CONSTITUTION_MEMBER', vote.clusterId);
    }
    assert(vote.weight === member.weight, 'CONFIRMATION_WEIGHT_MISMATCH');
    assert(vote.identityCommitment === member.identityCommitment, 'CONFIRMATION_IDENTITY_MISMATCH');
    if (vote.verifierKeyCommitment !== member.verifierKeyCommitment) {
      this.metrics.keyMismatchRejections += 1;
      fail('CONFIGURATION_KEY_MISMATCH', vote.clusterId);
    }
    const unsignedVote = withoutField(withoutField(vote, 'voteHash'), 'keyedProof');
    assert(hash(unsignedVote) === vote.voteHash, 'CONFIRMATION_VOTE_HASH_MISMATCH');
    const verifierKey = this.currentVerifierKeys.get(vote.clusterId);
    if (vote.keyedProof !== keyedProof(unsignedVote, verifierKey)) {
      this.metrics.keyMismatchRejections += 1;
      fail('CONFIGURATION_KEY_MISMATCH', vote.clusterId);
    }
    assert(!this.confirmationVotes.some((item) => item.clusterId === vote.clusterId), 'DUPLICATE_CONFIRMATION_VOTE', vote.clusterId);
    this.confirmationVotes.push(structuredClone(vote));
    this.metrics.confirmationVotesAccepted += 1;
    return structuredClone(vote);
  }

  formConfirmationCertificate() {
    assert(this.receipt, 'CONSTITUTION_NOT_ACTIVATED');
    const weight = this.confirmationVotes.reduce((sum, vote) => sum + vote.weight, 0);
    if (weight < this.currentConfiguration.quorumWeight) return null;
    const first = this.confirmationVotes[0];
    assert(this.confirmationVotes.every((vote) => vote.confirmationHash === first.confirmationHash), 'CONFIRMATION_HASH_CONFLICT');
    const certificate = withHash({
      format: 'rfe.constitution-confirmation-certificate.v1.0',
      epoch: this.currentConfiguration.epoch,
      configurationHash: this.currentConfiguration.configurationHash,
      federationRoot: this.federationRoot,
      confirmationId: first.confirmationId,
      confirmationHash: first.confirmationHash,
      voterIds: this.confirmationVotes.map((vote) => vote.clusterId).sort(),
      voteHashes: this.confirmationVotes.map((vote) => vote.voteHash).sort(),
      confirmedWeight: weight,
      quorumWeight: this.currentConfiguration.quorumWeight,
    }, 'confirmationCertificateHash');
    this.confirmationCertificate = certificate;
    this.metrics.confirmationCertificates += 1;
    return structuredClone(certificate);
  }

  result(extra) {
    assert(this.receipt, 'CONSTITUTION_NOT_ACTIVATED');
    assert(this.confirmationCertificate, 'MISSING_NEW_CONSTITUTION_CONFIRMATION');
    return withHash({
      format: 'rfe.constitutional-reality-result.v1.0',
      safetyModel: 'byzantine-weighted-dual-quorum-constitutional-continuity',
      livenessModel: 'joint-old-authorization-and-new-acceptance-with-durable-recovery',
      initialFederationRoot: this.initialFederationRoot,
      initialParentCertificateHash: extra.initialParentCertificateHash,
      oldConfiguration: structuredClone(extra.oldConfiguration),
      newConfiguration: structuredClone(this.currentConfiguration),
      transition: structuredClone(this.pendingTransition),
      rotationProofs: sortedBy([...this.rotationProofs.values()].map((item) => structuredClone(item)), 'clusterId'),
      oldAuthorizationCertificate: structuredClone(this.oldAuthorizationCertificate),
      newAcceptanceCertificate: structuredClone(this.newAcceptanceCertificate),
      jointActivationCertificate: structuredClone(this.jointActivationCertificate),
      interruptedActivationState: structuredClone(extra.interruptedActivationState),
      activationReceipt: structuredClone(this.receipt),
      recoveryReplayReceipt: structuredClone(extra.recoveryReplayReceipt),
      staleEpochRejection: structuredClone(extra.staleEpochRejection),
      removedMemberRejection: structuredClone(extra.removedMemberRejection),
      oldKeyRejection: structuredClone(extra.oldKeyRejection),
      confirmationCertificate: structuredClone(this.confirmationCertificate),
      finalTopologyRoot: topologyRoot([...this.topology.values()]),
      finalFederationRoot: this.federationRoot,
      finalEpoch: this.currentConfiguration.epoch,
      topologyRecords: Object.fromEntries(sortedBy([...this.topology.values()].map((item) => structuredClone(item)), 'clusterId').map((item) => [item.clusterId, item])),
      archivedConfigurationHashes: this.archivedConfigurations.map((item) => item.configurationHash),
      metrics: structuredClone(this.metrics),
    }, 'constitutionalRealityResultHash');
  }
}

export function verifyConstitutionalRealityResult(result) {
  assert(result.format === 'rfe.constitutional-reality-result.v1.0', 'INVALID_C12_FORMAT');
  assert(result.safetyModel === 'byzantine-weighted-dual-quorum-constitutional-continuity', 'INVALID_C12_SAFETY_MODEL');
  assert(result.livenessModel === 'joint-old-authorization-and-new-acceptance-with-durable-recovery', 'INVALID_C12_LIVENESS_MODEL');
  for (const configuration of [result.oldConfiguration, result.newConfiguration]) {
    assert(hash(withoutField(configuration, 'configurationHash')) === configuration.configurationHash, 'CONFIGURATION_HASH_MISMATCH');
    assert(2 * configuration.quorumWeight > configuration.totalWeight + configuration.byzantineBudgetWeight, 'UNSAFE_C12_CONFIGURATION');
  }
  assert(result.newConfiguration.epoch === result.oldConfiguration.epoch + 1, 'C12_EPOCH_NOT_MONOTONIC');
  assert(result.transition.oldConfigurationHash === result.oldConfiguration.configurationHash, 'TRANSITION_OLD_CONFIGURATION_HASH_MISMATCH');
  assert(result.transition.newConfigurationHash === result.newConfiguration.configurationHash, 'TRANSITION_NEW_CONFIGURATION_HASH_MISMATCH');
  assert(hash(withoutField(result.transition, 'transitionHash')) === result.transition.transitionHash, 'TRANSITION_HASH_MISMATCH');
  const oldCert = result.oldAuthorizationCertificate;
  const newCert = result.newAcceptanceCertificate;
  const joint = result.jointActivationCertificate;
  assert(hash(withoutField(oldCert, 'oldAuthorizationCertificateHash')) === oldCert.oldAuthorizationCertificateHash, 'OLD_AUTHORIZATION_CERTIFICATE_HASH_MISMATCH');
  assert(hash(withoutField(newCert, 'newAcceptanceCertificateHash')) === newCert.newAcceptanceCertificateHash, 'NEW_ACCEPTANCE_CERTIFICATE_HASH_MISMATCH');
  assert(hash(withoutField(joint, 'jointActivationCertificateHash')) === joint.jointActivationCertificateHash, 'JOINT_ACTIVATION_CERTIFICATE_HASH_MISMATCH');
  assert(oldCert.approvedWeight >= result.oldConfiguration.quorumWeight, 'OLD_AUTHORIZATION_QUORUM_MISSING');
  assert(newCert.acceptedWeight >= result.newConfiguration.quorumWeight, 'NEW_ACCEPTANCE_QUORUM_MISSING');
  assert(joint.oldAuthorizationCertificateHash === oldCert.oldAuthorizationCertificateHash, 'JOINT_OLD_CERTIFICATE_MISMATCH');
  assert(joint.newAcceptanceCertificateHash === newCert.newAcceptanceCertificateHash, 'JOINT_NEW_CERTIFICATE_MISMATCH');
  assert(result.rotationProofs.length === result.transition.changes.keyRotated.length, 'ROTATION_CONTINUITY_COUNT_MISMATCH');
  for (const proof of result.rotationProofs) {
    assert(hash(withoutField(proof, 'rotationProofHash')) === proof.rotationProofHash, 'ROTATION_PROOF_HASH_MISMATCH');
    assert(proof.transitionHash === result.transition.transitionHash, 'ROTATION_TRANSITION_MISMATCH');
  }
  assert(result.interruptedActivationState.durableJointCertificatePresent === true, 'MISSING_DURABLE_JOINT_CERTIFICATE');
  assert(result.interruptedActivationState.appliedMembers > 0, 'MISSING_PARTIAL_TOPOLOGY_APPLICATION');
  assert(result.interruptedActivationState.remainingMembers > 0, 'MISSING_TOPOLOGY_REMAINDER');
  assert(result.activationReceipt.recovered === true, 'ACTIVATION_RECEIPT_NOT_RECOVERED');
  assert(result.activationReceipt.receiptHash === result.recoveryReplayReceipt.receiptHash, 'CONSTITUTIONAL_RECOVERY_NOT_IDEMPOTENT');
  assert(result.activationReceipt.finalTopologyRoot === result.finalTopologyRoot, 'FINAL_TOPOLOGY_ROOT_MISMATCH');
  assert(result.finalEpoch === result.newConfiguration.epoch, 'FINAL_EPOCH_MISMATCH');
  assert(result.staleEpochRejection.code === 'STALE_CONFIGURATION_EPOCH', 'MISSING_STALE_EPOCH_REJECTION');
  assert(result.removedMemberRejection.code === 'REMOVED_CONSTITUTION_MEMBER', 'MISSING_REMOVED_MEMBER_REJECTION');
  assert(result.oldKeyRejection.code === 'CONFIGURATION_KEY_MISMATCH', 'MISSING_OLD_KEY_REJECTION');
  const confirm = result.confirmationCertificate;
  assert(hash(withoutField(confirm, 'confirmationCertificateHash')) === confirm.confirmationCertificateHash, 'CONFIRMATION_CERTIFICATE_HASH_MISMATCH');
  assert(confirm.configurationHash === result.newConfiguration.configurationHash, 'CONFIRMATION_WRONG_CONFIGURATION');
  assert(confirm.federationRoot === result.finalFederationRoot, 'CONFIRMATION_WRONG_FEDERATION_ROOT');
  assert(confirm.confirmedWeight >= result.newConfiguration.quorumWeight, 'CONFIRMATION_QUORUM_MISSING');
  assert(result.archivedConfigurationHashes.includes(result.oldConfiguration.configurationHash), 'OLD_CONFIGURATION_NOT_ARCHIVED');
  assert(result.metrics.topologyDivergences === 0, 'CONSTITUTIONAL_TOPOLOGY_DIVERGED');
  assert(hash(withoutField(result, 'constitutionalRealityResultHash')) === result.constitutionalRealityResultHash, 'CONSTITUTIONAL_RESULT_HASH_MISMATCH');
  return true;
}

export function runConstitutionalAcceptanceScenario(vector, durableStatePath) {
  assert(typeof durableStatePath === 'string' && durableStatePath.length > 0, 'MISSING_DURABLE_STATE_PATH');
  const engine = new ConstitutionalReality(vector.oldConfiguration, vector.parentCertificateHash, vector.initialFederationRoot);
  const oldById = new Map(vector.oldConfiguration.members.map((member) => [member.clusterId, member]));
  const newById = new Map(vector.newConfiguration.members.map((member) => [member.clusterId, member]));
  const oldConfiguration = structuredClone(engine.currentConfiguration);
  const proposal = engine.proposeTransition(vector.transitionPlan, vector.newConfiguration);

  for (const clusterId of proposal.changes.keyRotated.map((item) => item.clusterId)) {
    engine.registerRotationProof(signRotationContinuity(oldById.get(clusterId), newById.get(clusterId), proposal));
  }

  for (const clusterId of vector.oldAuthorizationVoters) {
    engine.registerTransitionVote(signConstitutionalVote(oldById.get(clusterId), {
      phase: 'authorize',
      configurationRole: 'old',
      epoch: proposal.fromEpoch,
      configurationHash: proposal.oldConfigurationHash,
      transitionHash: proposal.transitionHash,
      parentFederationRoot: proposal.parentFederationRoot,
    }));
  }
  const oldAuthorizationCertificate = engine.formOldAuthorizationCertificate();
  assert(oldAuthorizationCertificate, 'C12_OLD_AUTHORIZATION_QUORUM_NOT_REACHED');

  for (const clusterId of vector.newAcceptanceVoters) {
    engine.registerTransitionVote(signConstitutionalVote(newById.get(clusterId), {
      phase: 'accept',
      configurationRole: 'new',
      epoch: proposal.toEpoch,
      configurationHash: proposal.newConfigurationHash,
      transitionHash: proposal.transitionHash,
      parentFederationRoot: proposal.parentFederationRoot,
    }));
  }
  const newAcceptanceCertificate = engine.formNewAcceptanceCertificate();
  assert(newAcceptanceCertificate, 'C12_NEW_ACCEPTANCE_QUORUM_NOT_REACHED');
  const jointActivationCertificate = engine.formJointActivationCertificate();
  assert(jointActivationCertificate, 'C12_JOINT_ACTIVATION_CERTIFICATE_NOT_FORMED');

  let crashEvidence;
  try {
    engine.commitActivation(vector.crashAfterAppliedMembers);
    fail('EXPECTED_C12_CRASH_INJECTION');
  } catch (error) {
    crashEvidence = { code: error.code, detail: error.detail };
  }
  const targetCount = new Set([
    ...vector.oldConfiguration.members.map((member) => member.clusterId),
    ...vector.newConfiguration.members.map((member) => member.clusterId),
  ]).size;
  const interruptedActivationState = {
    crash: crashEvidence,
    durableJointCertificatePresent: engine.jointActivationCertificate !== null,
    appliedMembers: engine.activationProgress.length,
    remainingMembers: targetCount - engine.activationProgress.length,
  };
  engine.save(durableStatePath);
  const reopened = ConstitutionalReality.open(durableStatePath);
  reopened.recover();
  const recoveryReplayReceipt = reopened.recover();

  let staleEpochRejection;
  try {
    reopened.registerTransitionVote(signConstitutionalVote(oldById.get(vector.oldAuthorizationVoters[0]), {
      phase: 'authorize',
      configurationRole: 'old',
      epoch: proposal.fromEpoch,
      configurationHash: proposal.oldConfigurationHash,
      transitionHash: proposal.transitionHash,
      parentFederationRoot: proposal.parentFederationRoot,
    }));
    fail('EXPECTED_STALE_EPOCH_REJECTION');
  } catch (error) {
    staleEpochRejection = { code: error.code, detail: error.detail };
  }

  const confirmationPayload = {
    format: 'rfe.constitution-confirmation-payload.v1.0',
    message: vector.confirmationMessage,
    epoch: reopened.currentConfiguration.epoch,
  };
  const confirmationBody = {
    epoch: reopened.currentConfiguration.epoch,
    configurationHash: reopened.currentConfiguration.configurationHash,
    federationRoot: reopened.federationRoot,
    confirmationId: vector.confirmationId,
    confirmationHash: hash(confirmationPayload),
  };

  let removedMemberRejection;
  try {
    const removed = oldById.get(vector.removedMemberProbe);
    reopened.registerConfirmationVote(signConstitutionConfirmation(removed, confirmationBody));
    fail('EXPECTED_REMOVED_MEMBER_REJECTION');
  } catch (error) {
    removedMemberRejection = { code: error.code, detail: error.detail };
  }

  let oldKeyRejection;
  try {
    const rotatedOld = oldById.get(vector.rotatedMemberProbe);
    reopened.registerConfirmationVote(signConstitutionConfirmation(rotatedOld, confirmationBody));
    fail('EXPECTED_OLD_KEY_REJECTION');
  } catch (error) {
    oldKeyRejection = { code: error.code, detail: error.detail };
  }

  for (const clusterId of vector.confirmationVoters) {
    reopened.registerConfirmationVote(signConstitutionConfirmation(newById.get(clusterId), confirmationBody));
  }
  const confirmationCertificate = reopened.formConfirmationCertificate();
  assert(confirmationCertificate, 'C12_CONFIRMATION_QUORUM_NOT_REACHED');

  return reopened.result({
    initialParentCertificateHash: vector.parentCertificateHash,
    oldConfiguration,
    interruptedActivationState,
    recoveryReplayReceipt,
    staleEpochRejection,
    removedMemberRejection,
    oldKeyRejection,
  });
}
