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
    format: 'rfe.partition-healing-keyed-proof.v0.9',
    body,
    verifierKey,
  });
}

function publicClusterState(state) {
  return {
    clusterId: state.clusterId,
    weight: state.weight,
    revision: state.revision,
    sovereignRoot: state.sovereignRoot,
    authorityProofHash: state.authorityProofHash,
    policyHash: state.policyHash,
    identityCommitment: state.identityCommitment,
    quarantined: state.quarantined,
    quarantineEvidenceHash: state.quarantineEvidenceHash,
    phase: state.phase,
    pendingCommitCertificateHash: state.pendingCommitCertificateHash,
    preparedRoot: state.preparedRoot,
  };
}

function rootFromClusters(clusters) {
  return hash(sortedBy([...clusters.values()].map(publicClusterState), 'clusterId'));
}

function operationPlan(transaction) {
  const operations = sortedBy(transaction.operations ?? [], 'clusterId');
  assert(operations.length >= 2, 'INSUFFICIENT_FEDERATION_SCOPE');
  assert(new Set(operations.map((item) => item.clusterId)).size === operations.length, 'DUPLICATE_CLUSTER_OPERATION');
  const requiredClusterIds = [...(transaction.requiredClusterIds ?? [])].sort();
  assert(requiredClusterIds.length > 0, 'MISSING_REQUIRED_CLUSTERS');
  return { operations, requiredClusterIds };
}

export function signPartitionHealingVote(seed, body) {
  const identityCommitment = seed.identityCommitment ?? hash({
    clusterId: seed.clusterId,
    verifierKey: seed.verifierKey,
    format: 'rfe.partition-healing-identity.v0.9',
  });
  const unsigned = {
    format: 'rfe.partition-healing-vote.v0.9',
    phase: body.phase,
    epoch: body.epoch,
    view: body.view,
    parentFederationRoot: body.parentFederationRoot,
    proposalId: body.proposalId,
    proposalHash: body.proposalHash,
    changeHash: body.changeHash,
    clusterId: seed.clusterId,
    weight: seed.weight,
    authorityProofHash: seed.authorityProofHash,
    policyHash: seed.policyHash,
    identityCommitment,
    decision: body.decision ?? 'approve',
  };
  const voteHash = hash(unsigned);
  return { ...unsigned, voteHash, keyedProof: keyedProof(unsigned, seed.verifierKey) };
}

export function signPartitionTimeoutVote(seed, body) {
  const identityCommitment = seed.identityCommitment ?? hash({
    clusterId: seed.clusterId,
    verifierKey: seed.verifierKey,
    format: 'rfe.partition-healing-identity.v0.9',
  });
  const unsigned = {
    format: 'rfe.partition-timeout-vote.v0.9',
    epoch: body.epoch,
    view: body.view,
    parentFederationRoot: body.parentFederationRoot,
    clusterId: seed.clusterId,
    weight: seed.weight,
    authorityProofHash: seed.authorityProofHash,
    policyHash: seed.policyHash,
    identityCommitment,
    highestPreparedView: body.highestPreparedView ?? 0,
    highestPreparedCertificateHash: body.highestPreparedCertificateHash ?? null,
    highestPreparedChangeHash: body.highestPreparedChangeHash ?? null,
  };
  const timeoutVoteHash = hash(unsigned);
  return { ...unsigned, timeoutVoteHash, keyedProof: keyedProof(unsigned, seed.verifierKey) };
}

export class PartitionHealingReality {
  constructor(clusters, quorumWeight, byzantineBudgetWeight, parentCertificateHash) {
    assert(Array.isArray(clusters) && clusters.length >= 3, 'INSUFFICIENT_CLUSTER_COUNT');
    this.clusters = new Map();
    this.verifierKeys = new Map();
    for (const seed of clusters) {
      assert(!this.clusters.has(seed.clusterId), 'DUPLICATE_CLUSTER', seed.clusterId);
      assert(Number.isInteger(seed.weight) && seed.weight > 0, 'INVALID_CLUSTER_WEIGHT', seed.clusterId);
      assert(typeof seed.verifierKey === 'string' && seed.verifierKey.length > 0, 'MISSING_VERIFIER_KEY', seed.clusterId);
      const identityCommitment = seed.identityCommitment ?? hash({
        clusterId: seed.clusterId,
        verifierKey: seed.verifierKey,
        format: 'rfe.partition-healing-identity.v0.9',
      });
      const state = withHash({
        format: 'rfe.partition-healing-cluster-state.v0.9',
        clusterId: seed.clusterId,
        weight: seed.weight,
        revision: seed.revision ?? 0,
        sovereignRoot: seed.sovereignRoot,
        authorityProofHash: seed.authorityProofHash,
        policyHash: seed.policyHash,
        identityCommitment,
        quarantined: false,
        quarantineEvidenceHash: null,
        phase: 'stable',
        pendingCommitCertificateHash: null,
        preparedRoot: null,
      }, 'integrityHash');
      this.clusters.set(seed.clusterId, state);
      this.verifierKeys.set(seed.clusterId, seed.verifierKey);
    }
    this.totalWeight = [...this.clusters.values()].reduce((sum, item) => sum + item.weight, 0);
    assert(Number.isInteger(quorumWeight) && quorumWeight > 0 && quorumWeight <= this.totalWeight, 'INVALID_QUORUM_WEIGHT');
    assert(Number.isInteger(byzantineBudgetWeight) && byzantineBudgetWeight >= 0, 'INVALID_BYZANTINE_BUDGET');
    assert(2 * quorumWeight > this.totalWeight + byzantineBudgetWeight, 'UNSAFE_BYZANTINE_QUORUM');
    this.quorumWeight = quorumWeight;
    this.byzantineBudgetWeight = byzantineBudgetWeight;
    this.parentCertificateHash = parentCertificateHash;
    this.epoch = 1;
    this.view = 1;
    this.federationRoot = rootFromClusters(this.clusters);
    this.initialFederationRoot = this.federationRoot;
    this.proposals = new Map();
    this.prepareVotes = [];
    this.commitVotes = [];
    this.timeoutVotes = [];
    this.prepareCertificates = new Map();
    this.timeoutCertificates = new Map();
    this.commitCertificate = null;
    this.latestTimeoutCertificateHash = null;
    this.lock = null;
    this.evidence = new Map();
    this.partitionObservations = [];
    this.receipt = null;
    this.metrics = {
      partitionObservations: 0,
      partitionStallsObserved: 0,
      healedPartitions: 0,
      prepareVotesAccepted: 0,
      commitVotesAccepted: 0,
      timeoutVotesAccepted: 0,
      prepareCertificatesFormed: 0,
      timeoutCertificatesFormed: 0,
      commitCertificatesFormed: 0,
      viewChanges: 0,
      lockedChangesReproposed: 0,
      lockedConflictRejections: 0,
      staleViewMessagesRejected: 0,
      forgedVotesRejected: 0,
      equivocationsDetected: 0,
      quarantinedWeight: 0,
      recoveries: 0,
      idempotentRecoveryReplays: 0,
      injectedInterruptions: 0,
      federationRootDivergences: 0,
    };
  }

  static fromDurableState(snapshot) {
    const body = withoutField(snapshot, 'snapshotHash');
    assert(hash(body) === snapshot.snapshotHash, 'DURABLE_SNAPSHOT_HASH_MISMATCH');
    const engine = Object.create(PartitionHealingReality.prototype);
    engine.clusters = new Map(snapshot.clusters.map((item) => [item.clusterId, structuredClone(item)]));
    engine.verifierKeys = new Map(snapshot.verifierKeys);
    engine.totalWeight = snapshot.totalWeight;
    engine.quorumWeight = snapshot.quorumWeight;
    engine.byzantineBudgetWeight = snapshot.byzantineBudgetWeight;
    engine.parentCertificateHash = snapshot.parentCertificateHash;
    engine.epoch = snapshot.epoch;
    engine.view = snapshot.view;
    engine.federationRoot = snapshot.federationRoot;
    engine.initialFederationRoot = snapshot.initialFederationRoot;
    engine.proposals = new Map(snapshot.proposals.map((item) => [item.proposalHash, structuredClone(item)]));
    engine.prepareVotes = structuredClone(snapshot.prepareVotes);
    engine.commitVotes = structuredClone(snapshot.commitVotes);
    engine.timeoutVotes = structuredClone(snapshot.timeoutVotes);
    engine.prepareCertificates = new Map(snapshot.prepareCertificates.map((item) => [item.prepareCertificateHash, structuredClone(item)]));
    engine.timeoutCertificates = new Map(snapshot.timeoutCertificates.map((item) => [item.timeoutCertificateHash, structuredClone(item)]));
    engine.commitCertificate = structuredClone(snapshot.commitCertificate);
    engine.latestTimeoutCertificateHash = snapshot.latestTimeoutCertificateHash;
    engine.lock = structuredClone(snapshot.lock);
    engine.evidence = new Map(snapshot.evidence.map((item) => [`${item.clusterId}:${item.view}:${item.phase}`, structuredClone(item)]));
    engine.partitionObservations = structuredClone(snapshot.partitionObservations);
    engine.receipt = structuredClone(snapshot.receipt);
    engine.metrics = structuredClone(snapshot.metrics);
    assert(rootFromClusters(engine.clusters) === engine.federationRoot || engine.commitCertificate !== null, 'DURABLE_FEDERATION_ROOT_MISMATCH');
    return engine;
  }

  static open(filePath) {
    return PartitionHealingReality.fromDurableState(JSON.parse(fs.readFileSync(filePath, 'utf8')));
  }

  durableState() {
    return withHash({
      format: 'rfe.partition-healing-durable-state.v0.9',
      clusters: sortedBy([...this.clusters.values()].map((item) => structuredClone(item)), 'clusterId'),
      verifierKeys: [...this.verifierKeys.entries()].sort(([left], [right]) => left.localeCompare(right)),
      totalWeight: this.totalWeight,
      quorumWeight: this.quorumWeight,
      byzantineBudgetWeight: this.byzantineBudgetWeight,
      parentCertificateHash: this.parentCertificateHash,
      epoch: this.epoch,
      view: this.view,
      federationRoot: this.federationRoot,
      initialFederationRoot: this.initialFederationRoot,
      proposals: sortedBy([...this.proposals.values()].map((item) => structuredClone(item)), 'proposalHash'),
      prepareVotes: sortedBy(this.prepareVotes, 'voteHash'),
      commitVotes: sortedBy(this.commitVotes, 'voteHash'),
      timeoutVotes: sortedBy(this.timeoutVotes, 'timeoutVoteHash'),
      prepareCertificates: sortedBy([...this.prepareCertificates.values()].map((item) => structuredClone(item)), 'prepareCertificateHash'),
      timeoutCertificates: sortedBy([...this.timeoutCertificates.values()].map((item) => structuredClone(item)), 'timeoutCertificateHash'),
      commitCertificate: structuredClone(this.commitCertificate),
      latestTimeoutCertificateHash: this.latestTimeoutCertificateHash,
      lock: structuredClone(this.lock),
      evidence: sortedBy([...this.evidence.values()].map((item) => structuredClone(item)), 'clusterId'),
      partitionObservations: structuredClone(this.partitionObservations),
      receipt: structuredClone(this.receipt),
      metrics: structuredClone(this.metrics),
    }, 'snapshotHash');
  }

  save(filePath) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const temporary = `${filePath}.tmp`;
    fs.writeFileSync(temporary, canonical(this.durableState()));
    fs.renameSync(temporary, filePath);
  }

  clusterState(clusterId) {
    const state = this.clusters.get(clusterId);
    assert(state, 'UNKNOWN_CLUSTER', clusterId);
    return state;
  }

  observePartition(reachableClusterIds, label) {
    const ids = [...reachableClusterIds].sort();
    assert(new Set(ids).size === ids.length, 'DUPLICATE_REACHABILITY_MEMBER');
    const reachableWeight = ids.reduce((sum, clusterId) => sum + this.clusterState(clusterId).weight, 0);
    const stalled = reachableWeight < this.quorumWeight;
    const previousWasStalled = this.partitionObservations.at(-1)?.stalled === true;
    const observation = withHash({
      format: 'rfe.partition-observation.v0.9',
      epoch: this.epoch,
      view: this.view,
      label,
      reachableClusterIds: ids,
      unreachableClusterIds: [...this.clusters.keys()].filter((id) => !ids.includes(id)).sort(),
      reachableWeight,
      quorumWeight: this.quorumWeight,
      stalled,
    }, 'partitionObservationHash');
    this.partitionObservations.push(observation);
    this.metrics.partitionObservations += 1;
    if (stalled) this.metrics.partitionStallsObserved += 1;
    if (!stalled && previousWasStalled) this.metrics.healedPartitions += 1;
    return structuredClone(observation);
  }

  proposal(transaction) {
    const { operations, requiredClusterIds } = operationPlan(transaction);
    for (const operation of operations) this.clusterState(operation.clusterId);
    for (const clusterId of requiredClusterIds) this.clusterState(clusterId);
    const changeBody = {
      format: 'rfe.partition-healing-change.v0.9',
      requiredClusterIds,
      operationHashes: operations.map((item) => ({ clusterId: item.clusterId, operationHash: hash(item.operation) })),
    };
    const changeHash = hash(changeBody);
    if (this.lock && this.lock.changeHash !== changeHash) {
      this.metrics.lockedConflictRejections += 1;
      fail('LOCKED_CHANGE_CONFLICT', transaction.proposalId);
    }
    if (this.view > 1) {
      assert(this.latestTimeoutCertificateHash !== null, 'MISSING_VIEW_CHANGE_CERTIFICATE');
      assert(this.timeoutCertificates.has(this.latestTimeoutCertificateHash), 'UNKNOWN_VIEW_CHANGE_CERTIFICATE');
    }
    const body = {
      format: 'rfe.partition-healing-proposal.v0.9',
      epoch: this.epoch,
      view: this.view,
      parentFederationRoot: this.federationRoot,
      parentCertificateHash: this.parentCertificateHash,
      proposalId: transaction.proposalId,
      requiredClusterIds,
      operationHashes: changeBody.operationHashes,
      changeHash,
      viewChangeCertificateHash: this.latestTimeoutCertificateHash,
      extendsPreparedCertificateHash: this.lock?.prepareCertificateHash ?? null,
    };
    const proposal = { ...withHash(body, 'proposalHash'), operations };
    this.proposals.set(proposal.proposalHash, proposal);
    if (this.view > 1 && this.lock) this.metrics.lockedChangesReproposed += 1;
    return structuredClone(proposal);
  }

  verifyVote(vote) {
    const state = this.clusterState(vote.clusterId);
    if (vote.epoch !== this.epoch || vote.view !== this.view) {
      this.metrics.staleViewMessagesRejected += 1;
      fail('STALE_PARTITION_VIEW', vote.clusterId);
    }
    assert(vote.parentFederationRoot === this.federationRoot, 'VOTE_PARENT_ROOT_MISMATCH', vote.clusterId);
    assert(vote.weight === state.weight, 'VOTE_WEIGHT_MISMATCH', vote.clusterId);
    assert(vote.authorityProofHash === state.authorityProofHash, 'VOTE_AUTHORITY_MISMATCH', vote.clusterId);
    assert(vote.policyHash === state.policyHash, 'VOTE_POLICY_MISMATCH', vote.clusterId);
    assert(vote.identityCommitment === state.identityCommitment, 'VOTE_IDENTITY_MISMATCH', vote.clusterId);
    const unsigned = withoutField(withoutField(vote, 'voteHash'), 'keyedProof');
    assert(hash(unsigned) === vote.voteHash, 'VOTE_HASH_MISMATCH', vote.clusterId);
    assert(keyedProof(unsigned, this.verifierKeys.get(vote.clusterId)) === vote.keyedProof, 'VOTE_KEYED_PROOF_MISMATCH', vote.clusterId);
    const proposal = this.proposals.get(vote.proposalHash);
    assert(proposal, 'UNKNOWN_VOTED_PROPOSAL', vote.proposalHash);
    assert(vote.changeHash === proposal.changeHash, 'VOTE_CHANGE_HASH_MISMATCH', vote.clusterId);
    assert(vote.phase === 'prepare' || vote.phase === 'commit', 'INVALID_VOTE_PHASE', vote.phase);
    if (vote.phase === 'commit') {
      const certificate = [...this.prepareCertificates.values()].find((item) => item.proposalHash === vote.proposalHash && item.view === vote.view);
      assert(certificate, 'COMMIT_WITHOUT_PREPARE_CERTIFICATE', vote.proposalHash);
    }
  }

  registerVote(vote) {
    try {
      this.verifyVote(vote);
    } catch (error) {
      if (!['STALE_PARTITION_VIEW'].includes(error.code)) this.metrics.forgedVotesRejected += 1;
      throw error;
    }
    const collection = vote.phase === 'prepare' ? this.prepareVotes : this.commitVotes;
    assert(!collection.some((current) => current.voteHash === vote.voteHash), 'DUPLICATE_PARTITION_VOTE', vote.clusterId);
    const conflict = collection.find((current) => current.clusterId === vote.clusterId
      && current.epoch === vote.epoch
      && current.view === vote.view
      && current.proposalHash !== vote.proposalHash);
    collection.push(structuredClone(vote));
    if (vote.phase === 'prepare') this.metrics.prepareVotesAccepted += 1;
    else this.metrics.commitVotesAccepted += 1;
    if (conflict) this.recordEquivocation(vote.phase, conflict, vote);
  }

  recordEquivocation(phase, left, right) {
    const key = `${left.clusterId}:${left.view}:${phase}`;
    if (this.evidence.has(key)) return;
    const [first, second] = [left, right].sort((a, b) => a.proposalHash.localeCompare(b.proposalHash));
    const evidence = withHash({
      format: 'rfe.partition-healing-equivocation-evidence.v0.9',
      epoch: this.epoch,
      view: left.view,
      phase,
      clusterId: left.clusterId,
      firstProposalHash: first.proposalHash,
      secondProposalHash: second.proposalHash,
      firstVoteHash: first.voteHash,
      secondVoteHash: second.voteHash,
    }, 'evidenceHash');
    this.evidence.set(key, evidence);
    const state = this.clusterState(left.clusterId);
    if (!state.quarantined) {
      state.quarantined = true;
      state.quarantineEvidenceHash = evidence.evidenceHash;
      state.integrityHash = hash(withoutField(state, 'integrityHash'));
      this.metrics.quarantinedWeight += state.weight;
    }
    this.metrics.equivocationsDetected += 1;
  }

  effectiveVotes(collection, proposalHash, view = this.view) {
    return collection.filter((vote) => vote.proposalHash === proposalHash
      && vote.view === view
      && vote.decision === 'approve'
      && !this.clusterState(vote.clusterId).quarantined);
  }

  requiredApprovalsPresent(proposal, votes) {
    return proposal.requiredClusterIds.every((clusterId) => votes.some((vote) => vote.clusterId === clusterId));
  }

  projectedFederationRoot(proposal, commitCertificateHash = null) {
    const projected = new Map([...this.clusters.entries()].map(([key, value]) => [key, structuredClone(value)]));
    for (const operation of proposal.operations) {
      const state = projected.get(operation.clusterId);
      state.revision += 1;
      state.sovereignRoot = hash({
        format: 'rfe.partition-healing-sovereign-transition.v0.9',
        clusterId: state.clusterId,
        beforeRoot: state.sovereignRoot,
        nextRevision: state.revision,
        operationHash: hash(operation.operation),
        changeHash: proposal.changeHash,
      });
      state.phase = 'stable';
      state.pendingCommitCertificateHash = null;
      state.preparedRoot = null;
      state.integrityHash = hash(withoutField(state, 'integrityHash'));
    }
    if (commitCertificateHash) {
      // The certificate hash is deliberately not part of the semantic federation root.
    }
    return rootFromClusters(projected);
  }

  formPrepareCertificate(proposalHash) {
    const proposal = this.proposals.get(proposalHash);
    assert(proposal, 'UNKNOWN_PROPOSAL', proposalHash);
    const votes = this.effectiveVotes(this.prepareVotes, proposalHash, proposal.view);
    const approvalWeight = votes.reduce((sum, item) => sum + item.weight, 0);
    if (approvalWeight < this.quorumWeight || !this.requiredApprovalsPresent(proposal, votes)) return null;
    const certificate = withHash({
      format: 'rfe.partition-prepare-certificate.v0.9',
      epoch: this.epoch,
      view: proposal.view,
      parentFederationRoot: proposal.parentFederationRoot,
      proposalId: proposal.proposalId,
      proposalHash,
      changeHash: proposal.changeHash,
      projectedFederationRoot: this.projectedFederationRoot(proposal),
      approvalWeight,
      quorumWeight: this.quorumWeight,
      requiredClusterIds: [...proposal.requiredClusterIds],
      voteHashes: sortedBy(votes, 'clusterId').map((item) => item.voteHash),
      extendsPreparedCertificateHash: proposal.extendsPreparedCertificateHash,
    }, 'prepareCertificateHash');
    this.prepareCertificates.set(certificate.prepareCertificateHash, certificate);
    if (!this.lock || certificate.view >= this.lock.view) {
      this.lock = {
        view: certificate.view,
        changeHash: certificate.changeHash,
        proposalHash: certificate.proposalHash,
        prepareCertificateHash: certificate.prepareCertificateHash,
        projectedFederationRoot: certificate.projectedFederationRoot,
      };
    }
    this.metrics.prepareCertificatesFormed += 1;
    return structuredClone(certificate);
  }

  verifyTimeoutVote(vote) {
    const state = this.clusterState(vote.clusterId);
    if (vote.epoch !== this.epoch || vote.view !== this.view) {
      this.metrics.staleViewMessagesRejected += 1;
      fail('STALE_PARTITION_VIEW', vote.clusterId);
    }
    assert(vote.parentFederationRoot === this.federationRoot, 'TIMEOUT_PARENT_ROOT_MISMATCH', vote.clusterId);
    assert(vote.weight === state.weight, 'TIMEOUT_WEIGHT_MISMATCH', vote.clusterId);
    assert(vote.authorityProofHash === state.authorityProofHash, 'TIMEOUT_AUTHORITY_MISMATCH', vote.clusterId);
    assert(vote.policyHash === state.policyHash, 'TIMEOUT_POLICY_MISMATCH', vote.clusterId);
    assert(vote.identityCommitment === state.identityCommitment, 'TIMEOUT_IDENTITY_MISMATCH', vote.clusterId);
    const unsigned = withoutField(withoutField(vote, 'timeoutVoteHash'), 'keyedProof');
    assert(hash(unsigned) === vote.timeoutVoteHash, 'TIMEOUT_VOTE_HASH_MISMATCH', vote.clusterId);
    assert(keyedProof(unsigned, this.verifierKeys.get(vote.clusterId)) === vote.keyedProof, 'TIMEOUT_KEYED_PROOF_MISMATCH', vote.clusterId);
    if (vote.highestPreparedCertificateHash !== null) {
      const certificate = this.prepareCertificates.get(vote.highestPreparedCertificateHash);
      assert(certificate, 'UNKNOWN_TIMEOUT_PREPARE_CERTIFICATE', vote.highestPreparedCertificateHash);
      assert(certificate.view === vote.highestPreparedView, 'TIMEOUT_PREPARE_VIEW_MISMATCH', vote.clusterId);
      assert(certificate.changeHash === vote.highestPreparedChangeHash, 'TIMEOUT_PREPARE_CHANGE_MISMATCH', vote.clusterId);
    } else {
      assert(vote.highestPreparedView === 0 && vote.highestPreparedChangeHash === null, 'INVALID_EMPTY_TIMEOUT_LOCK', vote.clusterId);
    }
  }

  registerTimeoutVote(vote) {
    try {
      this.verifyTimeoutVote(vote);
    } catch (error) {
      if (!['STALE_PARTITION_VIEW'].includes(error.code)) this.metrics.forgedVotesRejected += 1;
      throw error;
    }
    assert(!this.timeoutVotes.some((current) => current.timeoutVoteHash === vote.timeoutVoteHash), 'DUPLICATE_TIMEOUT_VOTE', vote.clusterId);
    assert(!this.timeoutVotes.some((current) => current.clusterId === vote.clusterId && current.view === vote.view), 'DUPLICATE_TIMEOUT_SIGNER', vote.clusterId);
    this.timeoutVotes.push(structuredClone(vote));
    this.metrics.timeoutVotesAccepted += 1;
  }

  formTimeoutCertificate() {
    const votes = this.timeoutVotes.filter((vote) => vote.view === this.view && !this.clusterState(vote.clusterId).quarantined);
    const timeoutWeight = votes.reduce((sum, item) => sum + item.weight, 0);
    if (timeoutWeight < this.quorumWeight) return null;
    const lockedVotes = votes.filter((item) => item.highestPreparedCertificateHash !== null)
      .sort((left, right) => right.highestPreparedView - left.highestPreparedView
        || left.highestPreparedCertificateHash.localeCompare(right.highestPreparedCertificateHash));
    const highest = lockedVotes[0] ?? null;
    const certificate = withHash({
      format: 'rfe.partition-timeout-certificate.v0.9',
      epoch: this.epoch,
      sourceView: this.view,
      nextView: this.view + 1,
      parentFederationRoot: this.federationRoot,
      timeoutWeight,
      quorumWeight: this.quorumWeight,
      timeoutVoteHashes: sortedBy(votes, 'clusterId').map((item) => item.timeoutVoteHash),
      highestPreparedView: highest?.highestPreparedView ?? 0,
      highestPreparedCertificateHash: highest?.highestPreparedCertificateHash ?? null,
      highestPreparedChangeHash: highest?.highestPreparedChangeHash ?? null,
    }, 'timeoutCertificateHash');
    this.timeoutCertificates.set(certificate.timeoutCertificateHash, certificate);
    this.metrics.timeoutCertificatesFormed += 1;
    return structuredClone(certificate);
  }

  advanceView(timeoutCertificateHash) {
    const certificate = this.timeoutCertificates.get(timeoutCertificateHash);
    assert(certificate, 'UNKNOWN_TIMEOUT_CERTIFICATE', timeoutCertificateHash);
    assert(certificate.sourceView === this.view && certificate.nextView === this.view + 1, 'INVALID_VIEW_ADVANCE');
    if (certificate.highestPreparedCertificateHash !== null) {
      const prepare = this.prepareCertificates.get(certificate.highestPreparedCertificateHash);
      assert(prepare, 'UNKNOWN_TIMEOUT_LOCK');
      this.lock = {
        view: prepare.view,
        changeHash: prepare.changeHash,
        proposalHash: prepare.proposalHash,
        prepareCertificateHash: prepare.prepareCertificateHash,
        projectedFederationRoot: prepare.projectedFederationRoot,
      };
    }
    this.latestTimeoutCertificateHash = timeoutCertificateHash;
    this.view += 1;
    this.metrics.viewChanges += 1;
    return this.view;
  }

  formCommitCertificate(proposalHash) {
    assert(this.commitCertificate === null, 'COMMIT_CERTIFICATE_ALREADY_FORMED');
    const proposal = this.proposals.get(proposalHash);
    assert(proposal, 'UNKNOWN_PROPOSAL', proposalHash);
    const prepare = [...this.prepareCertificates.values()].find((item) => item.proposalHash === proposalHash && item.view === proposal.view);
    assert(prepare, 'MISSING_PREPARE_CERTIFICATE', proposalHash);
    const votes = this.effectiveVotes(this.commitVotes, proposalHash, proposal.view);
    const approvalWeight = votes.reduce((sum, item) => sum + item.weight, 0);
    if (approvalWeight < this.quorumWeight || !this.requiredApprovalsPresent(proposal, votes)) return null;
    const certificate = withHash({
      format: 'rfe.partition-healing-commit-certificate.v0.9',
      epoch: this.epoch,
      view: proposal.view,
      parentFederationRoot: this.federationRoot,
      parentCertificateHash: this.parentCertificateHash,
      proposalId: proposal.proposalId,
      proposalHash,
      changeHash: proposal.changeHash,
      prepareCertificateHash: prepare.prepareCertificateHash,
      timeoutCertificateHash: proposal.viewChangeCertificateHash,
      finalFederationRoot: prepare.projectedFederationRoot,
      totalWeight: this.totalWeight,
      byzantineBudgetWeight: this.byzantineBudgetWeight,
      quorumWeight: this.quorumWeight,
      approvalWeight,
      requiredClusterIds: [...proposal.requiredClusterIds],
      voteHashes: sortedBy(votes, 'clusterId').map((item) => item.voteHash),
    }, 'commitCertificateHash');
    this.commitCertificate = certificate;
    this.metrics.commitCertificatesFormed += 1;
    return structuredClone(certificate);
  }

  prepareCommit() {
    assert(this.commitCertificate, 'NO_DURABLE_COMMIT_CERTIFICATE');
    const proposal = this.proposals.get(this.commitCertificate.proposalHash);
    for (const operation of proposal.operations) {
      const state = this.clusterState(operation.clusterId);
      state.phase = 'prepared';
      state.pendingCommitCertificateHash = this.commitCertificate.commitCertificateHash;
      state.preparedRoot = hash({
        format: 'rfe.partition-healing-sovereign-transition.v0.9',
        clusterId: state.clusterId,
        beforeRoot: state.sovereignRoot,
        nextRevision: state.revision + 1,
        operationHash: hash(operation.operation),
        changeHash: proposal.changeHash,
      });
      state.integrityHash = hash(withoutField(state, 'integrityHash'));
    }
  }

  commit(crashAfter = null) {
    assert(this.commitCertificate, 'NO_DURABLE_COMMIT_CERTIFICATE');
    const proposal = this.proposals.get(this.commitCertificate.proposalHash);
    let committed = 0;
    for (const operation of proposal.operations) {
      const state = this.clusterState(operation.clusterId);
      if (state.phase === 'stable' && state.pendingCommitCertificateHash === null) continue;
      assert(state.pendingCommitCertificateHash === this.commitCertificate.commitCertificateHash, 'COMMIT_CERTIFICATE_OWNERSHIP_MISMATCH', state.clusterId);
      state.revision += 1;
      state.sovereignRoot = state.preparedRoot;
      state.phase = 'stable';
      state.pendingCommitCertificateHash = null;
      state.preparedRoot = null;
      state.integrityHash = hash(withoutField(state, 'integrityHash'));
      committed += 1;
      if (crashAfter === committed) {
        this.metrics.injectedInterruptions += 1;
        fail('PARTITION_HEALING_CRASH_INJECTED_AFTER_COMMIT', committed);
      }
    }
    return this.finalize(false);
  }

  finalize(recovered) {
    if (this.receipt !== null) return structuredClone(this.receipt);
    const currentRoot = rootFromClusters(this.clusters);
    if (currentRoot !== this.commitCertificate.finalFederationRoot) {
      this.metrics.federationRootDivergences += 1;
      fail('PARTITION_HEALING_ROOT_DIVERGENCE', currentRoot);
    }
    this.federationRoot = currentRoot;
    this.parentCertificateHash = this.commitCertificate.commitCertificateHash;
    this.receipt = withHash({
      format: 'rfe.partition-healing-commit-receipt.v0.9',
      epoch: this.epoch,
      committedView: this.commitCertificate.view,
      proposalHash: this.commitCertificate.proposalHash,
      changeHash: this.commitCertificate.changeHash,
      commitCertificateHash: this.commitCertificate.commitCertificateHash,
      finalFederationRoot: this.federationRoot,
      recovered,
    }, 'receiptHash');
    return structuredClone(this.receipt);
  }

  recover() {
    if (this.receipt !== null) {
      this.metrics.idempotentRecoveryReplays += 1;
      return structuredClone(this.receipt);
    }
    assert(this.commitCertificate, 'NO_DURABLE_COMMIT_CERTIFICATE');
    this.metrics.recoveries += 1;
    const proposal = this.proposals.get(this.commitCertificate.proposalHash);
    for (const operation of proposal.operations) {
      const state = this.clusterState(operation.clusterId);
      if (state.phase === 'stable' && state.pendingCommitCertificateHash === null) continue;
      assert(state.pendingCommitCertificateHash === this.commitCertificate.commitCertificateHash, 'RECOVERY_CERTIFICATE_OWNERSHIP_MISMATCH', state.clusterId);
      state.revision += 1;
      state.sovereignRoot = state.preparedRoot;
      state.phase = 'stable';
      state.pendingCommitCertificateHash = null;
      state.preparedRoot = null;
      state.integrityHash = hash(withoutField(state, 'integrityHash'));
    }
    return this.finalize(true);
  }

  result(extra = {}) {
    assert(this.receipt, 'MISSING_FINAL_RECEIPT');
    return withHash({
      format: 'rfe.partition-healing-reality-result.v0.9',
      livenessModel: 'partial-synchrony-with-weighted-timeout-certificates',
      safetyModel: 'byzantine-weighted-lock-preservation-across-views',
      totalWeight: this.totalWeight,
      byzantineBudgetWeight: this.byzantineBudgetWeight,
      quorumWeight: this.quorumWeight,
      initialFederationRoot: this.initialFederationRoot,
      parentCertificateHash: extra.initialParentCertificateHash,
      partitionObservations: structuredClone(this.partitionObservations),
      firstPrepareCertificate: structuredClone(extra.firstPrepareCertificate),
      timeoutCertificate: structuredClone(extra.timeoutCertificate),
      staleViewRejection: structuredClone(extra.staleViewRejection),
      lockedConflictRejection: structuredClone(extra.lockedConflictRejection),
      healingProposalHash: extra.healingProposalHash,
      healingPrepareCertificate: structuredClone(extra.healingPrepareCertificate),
      commitCertificate: structuredClone(this.commitCertificate),
      interruptedCommitState: structuredClone(extra.interruptedCommitState),
      commitReceipt: structuredClone(this.receipt),
      recoveryReplayReceipt: structuredClone(extra.recoveryReplayReceipt),
      finalFederationRoot: this.federationRoot,
      finalView: this.view,
      clusterStates: Object.fromEntries(sortedBy([...this.clusters.values()].map((item) => structuredClone(item)), 'clusterId').map((item) => [item.clusterId, item])),
      equivocationEvidence: sortedBy([...this.evidence.values()].map((item) => structuredClone(item)), 'evidenceHash'),
      metrics: structuredClone(this.metrics),
    }, 'partitionHealingRealityResultHash');
  }
}

export function verifyPartitionHealingRealityResult(result) {
  assert(result.format === 'rfe.partition-healing-reality-result.v0.9', 'INVALID_C11_FORMAT');
  assert(result.livenessModel === 'partial-synchrony-with-weighted-timeout-certificates', 'INVALID_C11_LIVENESS_MODEL');
  assert(result.safetyModel === 'byzantine-weighted-lock-preservation-across-views', 'INVALID_C11_SAFETY_MODEL');
  assert(2 * result.quorumWeight > result.totalWeight + result.byzantineBudgetWeight, 'UNSAFE_C11_QUORUM');
  assert(result.partitionObservations.length >= 2, 'MISSING_PARTITION_OBSERVATIONS');
  assert(result.partitionObservations.some((item) => item.stalled === true), 'MISSING_PARTITION_STALL');
  assert(result.partitionObservations.some((item) => item.stalled === false), 'MISSING_PARTITION_HEAL');
  for (const observation of result.partitionObservations) {
    assert(hash(withoutField(observation, 'partitionObservationHash')) === observation.partitionObservationHash, 'PARTITION_OBSERVATION_HASH_MISMATCH');
  }
  const firstPrepare = result.firstPrepareCertificate;
  assert(hash(withoutField(firstPrepare, 'prepareCertificateHash')) === firstPrepare.prepareCertificateHash, 'FIRST_PREPARE_CERTIFICATE_HASH_MISMATCH');
  const timeout = result.timeoutCertificate;
  assert(hash(withoutField(timeout, 'timeoutCertificateHash')) === timeout.timeoutCertificateHash, 'TIMEOUT_CERTIFICATE_HASH_MISMATCH');
  assert(timeout.highestPreparedCertificateHash === firstPrepare.prepareCertificateHash, 'TIMEOUT_DROPPED_HIGHEST_LOCK');
  assert(timeout.highestPreparedChangeHash === firstPrepare.changeHash, 'TIMEOUT_CHANGED_LOCKED_CHANGE');
  const healingPrepare = result.healingPrepareCertificate;
  assert(hash(withoutField(healingPrepare, 'prepareCertificateHash')) === healingPrepare.prepareCertificateHash, 'HEALING_PREPARE_CERTIFICATE_HASH_MISMATCH');
  assert(healingPrepare.changeHash === firstPrepare.changeHash, 'HEALING_PROPOSAL_DID_NOT_PRESERVE_LOCK');
  assert(healingPrepare.extendsPreparedCertificateHash === firstPrepare.prepareCertificateHash, 'HEALING_PROPOSAL_DID_NOT_EXTEND_LOCK');
  const commit = result.commitCertificate;
  assert(hash(withoutField(commit, 'commitCertificateHash')) === commit.commitCertificateHash, 'COMMIT_CERTIFICATE_HASH_MISMATCH');
  assert(commit.prepareCertificateHash === healingPrepare.prepareCertificateHash, 'COMMIT_PREPARE_CERTIFICATE_MISMATCH');
  assert(commit.finalFederationRoot === result.finalFederationRoot, 'COMMIT_FINAL_ROOT_MISMATCH');
  assert(result.finalView === timeout.nextView, 'FINAL_VIEW_MISMATCH');
  assert(result.staleViewRejection.code === 'STALE_PARTITION_VIEW', 'MISSING_STALE_VIEW_REJECTION');
  assert(result.lockedConflictRejection.code === 'LOCKED_CHANGE_CONFLICT', 'MISSING_LOCK_CONFLICT_REJECTION');
  assert(result.interruptedCommitState.durableCommitCertificatePresent === true, 'MISSING_DURABLE_COMMIT_CERTIFICATE');
  assert(result.interruptedCommitState.committedClusters > 0, 'MISSING_PARTIAL_COMMIT');
  assert(result.interruptedCommitState.preparedClusters > 0, 'MISSING_PREPARED_REMAINDER');
  assert(result.commitReceipt.recovered === true, 'RECOVERY_RECEIPT_NOT_MARKED');
  assert(result.commitReceipt.receiptHash === result.recoveryReplayReceipt.receiptHash, 'RECOVERY_NOT_IDEMPOTENT');
  assert(result.metrics.partitionStallsObserved >= 1, 'PARTITION_STALL_METRIC_MISSING');
  assert(result.metrics.healedPartitions >= 1, 'PARTITION_HEAL_METRIC_MISSING');
  assert(result.metrics.viewChanges >= 1, 'VIEW_CHANGE_METRIC_MISSING');
  assert(result.metrics.federationRootDivergences === 0, 'FEDERATION_ROOT_DIVERGED');
  assert(hash(withoutField(result, 'partitionHealingRealityResultHash')) === result.partitionHealingRealityResultHash, 'PARTITION_HEALING_RESULT_HASH_MISMATCH');
  return true;
}


/** Execute the frozen C11 acceptance scenario through one public entry point. */
export function runPartitionHealingAcceptanceScenario(vector, durableStatePath) {
  assert(typeof durableStatePath === 'string' && durableStatePath.length > 0, 'MISSING_DURABLE_STATE_PATH');
  const engine = new PartitionHealingReality(
    vector.clusters,
    vector.quorumWeight,
    vector.byzantineBudgetWeight,
    vector.parentCertificateHash,
  );
  const byId = new Map(vector.clusters.map((cluster) => [cluster.clusterId, cluster]));
  const signVote = (clusterId, phase, proposal, view = engine.view) => signPartitionHealingVote(byId.get(clusterId), {
    phase,
    epoch: engine.epoch,
    view,
    parentFederationRoot: engine.federationRoot,
    proposalId: proposal.proposalId,
    proposalHash: proposal.proposalHash,
    changeHash: proposal.changeHash,
  });

  const firstProposal = engine.proposal(vector.initialProposal);
  for (const clusterId of vector.prepareVoters) engine.registerVote(signVote(clusterId, 'prepare', firstProposal));
  const firstPrepareCertificate = engine.formPrepareCertificate(firstProposal.proposalHash);
  assert(firstPrepareCertificate !== null, 'C11_FIRST_PREPARE_QUORUM_NOT_REACHED');

  engine.observePartition(vector.partitionedReachableClusterIds, vector.partitionLabel);
  for (const clusterId of vector.timeoutVoters) {
    engine.registerTimeoutVote(signPartitionTimeoutVote(byId.get(clusterId), {
      epoch: engine.epoch,
      view: engine.view,
      parentFederationRoot: engine.federationRoot,
      highestPreparedView: firstPrepareCertificate.view,
      highestPreparedCertificateHash: firstPrepareCertificate.prepareCertificateHash,
      highestPreparedChangeHash: firstPrepareCertificate.changeHash,
    }));
  }
  const timeoutCertificate = engine.formTimeoutCertificate();
  assert(timeoutCertificate !== null, 'C11_TIMEOUT_QUORUM_NOT_REACHED');
  engine.advanceView(timeoutCertificate.timeoutCertificateHash);

  let staleViewRejection;
  try {
    engine.registerVote(signVote(vector.prepareVoters[0], 'prepare', firstProposal, timeoutCertificate.sourceView));
    fail('EXPECTED_STALE_VIEW_REJECTION');
  } catch (error) {
    staleViewRejection = { code: error.code, detail: error.detail };
  }

  let lockedConflictRejection;
  try {
    engine.proposal(vector.conflictingProposal);
    fail('EXPECTED_LOCKED_CHANGE_REJECTION');
  } catch (error) {
    lockedConflictRejection = { code: error.code, detail: error.detail };
  }

  engine.observePartition(vector.healedReachableClusterIds, vector.healedLabel);
  const healingProposal = engine.proposal(vector.healingProposal);
  for (const clusterId of vector.prepareVoters) engine.registerVote(signVote(clusterId, 'prepare', healingProposal));
  const healingPrepareCertificate = engine.formPrepareCertificate(healingProposal.proposalHash);
  assert(healingPrepareCertificate !== null, 'C11_HEALING_PREPARE_QUORUM_NOT_REACHED');
  for (const clusterId of vector.commitVoters) engine.registerVote(signVote(clusterId, 'commit', healingProposal));
  const commitCertificate = engine.formCommitCertificate(healingProposal.proposalHash);
  assert(commitCertificate !== null, 'C11_COMMIT_QUORUM_NOT_REACHED');

  engine.prepareCommit();
  let crashEvidence;
  try {
    engine.commit(vector.crashAfterCommittedClusters);
    fail('EXPECTED_C11_CRASH_INJECTION');
  } catch (error) {
    crashEvidence = { code: error.code, detail: error.detail };
  }
  const operationClusterIds = new Set(healingProposal.operations.map((operation) => operation.clusterId));
  const interruptedCommitState = {
    crash: crashEvidence,
    durableCommitCertificatePresent: engine.commitCertificate !== null,
    committedClusters: [...engine.clusters.values()].filter((state) => operationClusterIds.has(state.clusterId)
      && state.phase === 'stable' && state.pendingCommitCertificateHash === null).length,
    preparedClusters: [...engine.clusters.values()].filter((state) => operationClusterIds.has(state.clusterId)
      && state.phase === 'prepared').length,
  };
  engine.save(durableStatePath);
  const reopened = PartitionHealingReality.open(durableStatePath);
  reopened.recover();
  const recoveryReplayReceipt = reopened.recover();
  return reopened.result({
    initialParentCertificateHash: vector.parentCertificateHash,
    firstPrepareCertificate,
    timeoutCertificate,
    staleViewRejection,
    lockedConflictRejection,
    healingProposalHash: healingProposal.proposalHash,
    healingPrepareCertificate,
    interruptedCommitState,
    recoveryReplayReceipt,
  });
}
