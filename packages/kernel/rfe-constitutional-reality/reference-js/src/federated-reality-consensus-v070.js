import { canonical, hash } from './replicated-authority-v050.js';

function withoutField(value, field) {
  const copy = structuredClone(value);
  delete copy[field];
  return copy;
}

function withHash(value, field) {
  const copy = withoutField(value, field);
  copy[field] = hash(copy);
  return copy;
}

function assert(condition, code, detail = '') {
  if (!condition) {
    const failure = new Error(`${code}: ${detail}`);
    failure.code = code;
    throw failure;
  }
}

function sortedClusters(map) {
  return [...map.values()].sort((a, b) => a.clusterId.localeCompare(b.clusterId));
}

function sortedVotes(votes) {
  return [...votes].sort((a, b) => a.clusterId.localeCompare(b.clusterId));
}

export function clusterSeedFromC8(clusterId, weight, c8Result) {
  assert(typeof c8Result.finalGlobalRoot === 'string', 'MISSING_C8_GLOBAL_ROOT');
  assert(typeof c8Result.crossDomainAtomicResultHash === 'string', 'MISSING_C8_ATOMIC_PROOF');
  assert(Number.isSafeInteger(weight) && weight > 0, 'INVALID_CLUSTER_WEIGHT', clusterId);
  return {
    clusterId,
    weight,
    sovereignRoot: c8Result.finalGlobalRoot,
    authorityProofHash: c8Result.crossDomainAtomicResultHash,
    policyHash: hash({ clusterId, policy: 'rfe.sovereign-policy.v0.7' }),
  };
}

export class FederatedRealityConsensus {
  constructor(clusters, quorumWeight) {
    assert(Array.isArray(clusters) && clusters.length >= 3, 'INSUFFICIENT_FEDERATION_MEMBERS');
    assert(Number.isSafeInteger(quorumWeight) && quorumWeight > 0, 'INVALID_QUORUM_WEIGHT');
    this.clusters = new Map();
    this.totalWeight = 0;
    for (const seed of clusters) {
      assert(!this.clusters.has(seed.clusterId), 'DUPLICATE_CLUSTER', seed.clusterId);
      assert(Number.isSafeInteger(seed.weight) && seed.weight > 0, 'INVALID_CLUSTER_WEIGHT', seed.clusterId);
      assert(typeof seed.sovereignRoot === 'string' && seed.sovereignRoot.length > 0, 'INVALID_SOVEREIGN_ROOT');
      assert(typeof seed.authorityProofHash === 'string' && seed.authorityProofHash.length > 0, 'INVALID_AUTHORITY_PROOF');
      const state = withHash({
        format: 'rfe.federated-cluster-state.v0.7',
        clusterId: seed.clusterId,
        weight: seed.weight,
        authorityProofHash: seed.authorityProofHash,
        policyHash: seed.policyHash,
        revision: 0,
        sovereignRoot: seed.sovereignRoot,
        phase: 'stable',
        pendingProposalId: null,
        preparedRoot: null,
        prepareHash: null,
      }, 'integrityHash');
      this.clusters.set(seed.clusterId, state);
      this.totalWeight += seed.weight;
    }
    assert(quorumWeight <= this.totalWeight, 'QUORUM_EXCEEDS_TOTAL_WEIGHT');
    this.quorumWeight = quorumWeight;
    this.proposals = new Map();
    this.proposalSequence = 0;
    this.federationRoot = this.currentFederationRoot();
    this.metrics = {
      proposalsAttempted: 0,
      proposalsAborted: 0,
      proposalsCommitted: 0,
      quorumCertificatesFormed: 0,
      injectedInterruptions: 0,
      recoveryPasses: 0,
      idempotentRecoveryReplays: 0,
      sovereignVetoes: 0,
      forgedVotesRejected: 0,
      partialFederationCommitsExposed: 0,
      federationRootDivergences: 0,
    };
  }

  currentFederationRoot() {
    return hash(sortedClusters(this.clusters).map((state) => ({
      clusterId: state.clusterId,
      weight: state.weight,
      revision: state.revision,
      sovereignRoot: state.sovereignRoot,
      authorityProofHash: state.authorityProofHash,
      policyHash: state.policyHash,
    })));
  }

  clusterState(clusterId) {
    const state = this.clusters.get(clusterId);
    assert(state, 'UNKNOWN_CLUSTER', clusterId);
    return state;
  }

  buildPrepare(proposalId, operation) {
    const state = this.clusterState(operation.clusterId);
    assert(state.phase === 'stable', 'CLUSTER_NOT_STABLE', operation.clusterId);
    const operationHash = hash(operation.operation);
    const nextRevision = state.revision + 1;
    const afterRoot = hash({
      clusterId: state.clusterId,
      beforeRoot: state.sovereignRoot,
      nextRevision,
      operationHash,
      proposalId,
    });
    return withHash({
      format: 'rfe.federated-prepare.v0.7',
      proposalId,
      clusterId: state.clusterId,
      authorityProofHash: state.authorityProofHash,
      policyHash: state.policyHash,
      baseRevision: state.revision,
      nextRevision,
      beforeRoot: state.sovereignRoot,
      afterRoot,
      operationHash,
    }, 'prepareHash');
  }

  applyPrepare(proposalId, prepare) {
    const state = this.clusterState(prepare.clusterId);
    Object.assign(state, {
      phase: 'prepared',
      pendingProposalId: proposalId,
      preparedRoot: prepare.afterRoot,
      prepareHash: prepare.prepareHash,
    });
    const rehashed = withHash(state, 'integrityHash');
    this.clusters.set(state.clusterId, rehashed);
  }

  abortPrepare(proposalId, prepare) {
    const state = this.clusterState(prepare.clusterId);
    if (state.pendingProposalId !== proposalId) return false;
    Object.assign(state, {
      phase: 'stable',
      pendingProposalId: null,
      preparedRoot: null,
      prepareHash: null,
    });
    this.clusters.set(state.clusterId, withHash(state, 'integrityHash'));
    return true;
  }

  commitPrepare(proposalId, prepare) {
    const state = this.clusterState(prepare.clusterId);
    if (state.revision === prepare.nextRevision && state.sovereignRoot === prepare.afterRoot) return false;
    assert(state.pendingProposalId === proposalId, 'PREPARE_OWNERSHIP_MISMATCH', prepare.clusterId);
    assert(state.prepareHash === prepare.prepareHash, 'PREPARE_HASH_MISMATCH', prepare.clusterId);
    Object.assign(state, {
      revision: prepare.nextRevision,
      sovereignRoot: prepare.afterRoot,
      phase: 'stable',
      pendingProposalId: null,
      preparedRoot: null,
      prepareHash: null,
    });
    this.clusters.set(state.clusterId, withHash(state, 'integrityHash'));
    return true;
  }

  registerVote(proposal, vote) {
    const state = this.clusterState(vote.clusterId);
    assert(!proposal.votes.some((current) => current.clusterId === vote.clusterId), 'DUPLICATE_FEDERATION_VOTE');
    assert(vote.proposalHash === proposal.proposalHash, 'VOTE_PROPOSAL_HASH_MISMATCH');
    assert(vote.authorityProofHash === state.authorityProofHash, 'VOTE_AUTHORITY_PROOF_MISMATCH');
    assert(vote.policyHash === state.policyHash, 'VOTE_POLICY_HASH_MISMATCH');
    const normalized = withHash({
      format: 'rfe.federation-vote.v0.7',
      proposalId: proposal.proposalId,
      proposalHash: proposal.proposalHash,
      clusterId: vote.clusterId,
      decision: vote.decision,
      weight: state.weight,
      authorityProofHash: state.authorityProofHash,
      policyHash: state.policyHash,
    }, 'voteHash');
    proposal.votes.push(normalized);
    return normalized;
  }

  approvalWeight(proposal) {
    return proposal.votes
      .filter((vote) => vote.decision === 'approve')
      .reduce((sum, vote) => sum + vote.weight, 0);
  }

  requiredApprovalsPresent(proposal) {
    return proposal.requiredClusterIds.every((clusterId) => proposal.votes.some(
      (vote) => vote.clusterId === clusterId && vote.decision === 'approve',
    ));
  }

  requiredVetoPresent(proposal) {
    return proposal.requiredClusterIds.some((clusterId) => proposal.votes.some(
      (vote) => vote.clusterId === clusterId && vote.decision === 'reject',
    ));
  }

  formDecision(proposal) {
    if (this.requiredVetoPresent(proposal)) {
      this.metrics.sovereignVetoes += 1;
      return null;
    }
    const approvalWeight = this.approvalWeight(proposal);
    if (approvalWeight < this.quorumWeight || !this.requiredApprovalsPresent(proposal)) return null;
    const decision = withHash({
      format: 'rfe.federation-commit-decision.v0.7',
      proposalId: proposal.proposalId,
      proposalHash: proposal.proposalHash,
      baseFederationRoot: proposal.baseFederationRoot,
      finalFederationRoot: this.projectedFederationRoot(proposal.prepares),
      quorumWeight: this.quorumWeight,
      approvalWeight,
      requiredClusterIds: [...proposal.requiredClusterIds],
      prepareHashes: proposal.prepares.map((prepare) => prepare.prepareHash),
      voteHashes: sortedVotes(proposal.votes).filter((vote) => vote.decision === 'approve').map((vote) => vote.voteHash),
      proposalSequence: proposal.sequence,
    }, 'quorumCertificateHash');
    this.metrics.quorumCertificatesFormed += 1;
    return decision;
  }

  projectedFederationRoot(prepares) {
    const projected = sortedClusters(this.clusters).map((state) => {
      const prepare = prepares.find((item) => item.clusterId === state.clusterId);
      return {
        clusterId: state.clusterId,
        weight: state.weight,
        revision: prepare ? prepare.nextRevision : state.revision,
        sovereignRoot: prepare ? prepare.afterRoot : state.sovereignRoot,
        authorityProofHash: state.authorityProofHash,
        policyHash: state.policyHash,
      };
    });
    return hash(projected);
  }

  receipt(proposal, status, recovered) {
    return withHash({
      format: 'rfe.federation-receipt.v0.7',
      proposalId: proposal.proposalId,
      status,
      baseFederationRoot: proposal.baseFederationRoot,
      finalFederationRoot: this.currentFederationRoot(),
      quorumCertificateHash: proposal.decision?.quorumCertificateHash ?? null,
      approvalWeight: proposal.decision?.approvalWeight ?? this.approvalWeight(proposal),
      quorumWeight: this.quorumWeight,
      requiredClusterIds: [...proposal.requiredClusterIds],
      recovered,
    }, 'federationReceiptHash');
  }

  propose(transaction, crashPoint = null) {
    assert(!this.proposals.has(transaction.proposalId), 'DUPLICATE_PROPOSAL_ID');
    assert(this.federationRoot === this.currentFederationRoot(), 'FEDERATION_ROOT_STALE');
    const operations = [...transaction.operations].sort((a, b) => a.clusterId.localeCompare(b.clusterId));
    const requiredClusterIds = [...transaction.requiredClusterIds].sort();
    assert(operations.length >= 2, 'INSUFFICIENT_FEDERATION_SCOPE');
    assert(new Set(operations.map((operation) => operation.clusterId)).size === operations.length, 'DUPLICATE_CLUSTER_OPERATION');
    assert(requiredClusterIds.every((clusterId) => operations.some((operation) => operation.clusterId === clusterId)), 'REQUIRED_CLUSTER_WITHOUT_OPERATION');
    this.proposalSequence += 1;
    this.metrics.proposalsAttempted += 1;
    const proposalBody = {
      format: 'rfe.federation-proposal.v0.7',
      proposalId: transaction.proposalId,
      baseFederationRoot: this.currentFederationRoot(),
      requiredClusterIds,
      operationHashes: operations.map((operation) => ({ clusterId: operation.clusterId, operationHash: hash(operation.operation) })),
      proposalSequence: this.proposalSequence,
    };
    const proposal = {
      ...withHash(proposalBody, 'proposalHash'),
      sequence: this.proposalSequence,
      operations,
      votes: [],
      prepares: [],
      decision: null,
      receipt: null,
    };
    this.proposals.set(transaction.proposalId, proposal);
    for (let index = 0; index < operations.length; index += 1) {
      const prepare = this.buildPrepare(proposal.proposalId, operations[index]);
      proposal.prepares.push(prepare);
      this.applyPrepare(proposal.proposalId, prepare);
    }
    for (const vote of transaction.votes) this.registerVote(proposal, vote);
    proposal.decision = this.formDecision(proposal);
    if (!proposal.decision) return structuredClone(proposal);
    for (let index = 0; index < proposal.prepares.length; index += 1) {
      this.commitPrepare(proposal.proposalId, proposal.prepares[index]);
      if (crashPoint?.phase === 'commit' && crashPoint.count === index + 1) {
        this.metrics.injectedInterruptions += 1;
        assert(false, 'FEDERATION_CRASH_INJECTED_AFTER_COMMIT', index + 1);
      }
    }
    return this.finalizeCommit(proposal, false);
  }

  finalizeCommit(proposal, recovered) {
    const currentRoot = this.currentFederationRoot();
    assert(currentRoot === proposal.decision.finalFederationRoot, 'FEDERATION_FINAL_ROOT_MISMATCH');
    this.federationRoot = currentRoot;
    if (!proposal.receipt) this.metrics.proposalsCommitted += 1;
    proposal.receipt = this.receipt(proposal, 'committed', recovered);
    return structuredClone(proposal.receipt);
  }

  recover(proposalId) {
    const proposal = this.proposals.get(proposalId);
    assert(proposal, 'UNKNOWN_PROPOSAL', proposalId);
    this.metrics.recoveryPasses += 1;
    if (proposal.receipt) {
      this.metrics.idempotentRecoveryReplays += 1;
      return structuredClone(proposal.receipt);
    }
    if (!proposal.decision) {
      for (const prepare of proposal.prepares) this.abortPrepare(proposalId, prepare);
      assert(this.currentFederationRoot() === proposal.baseFederationRoot, 'ABORT_CHANGED_FEDERATION_ROOT');
      this.metrics.proposalsAborted += 1;
      proposal.receipt = this.receipt(proposal, 'aborted', true);
      return structuredClone(proposal.receipt);
    }
    assert(proposal.decision.prepareHashes.length === proposal.prepares.length, 'DECISION_PREPARE_COUNT_MISMATCH');
    for (let index = 0; index < proposal.prepares.length; index += 1) {
      assert(proposal.decision.prepareHashes[index] === proposal.prepares[index].prepareHash, 'DECISION_PREPARE_HASH_MISMATCH');
      this.commitPrepare(proposalId, proposal.prepares[index]);
    }
    return this.finalizeCommit(proposal, true);
  }

  runAcceptanceScenario(noQuorumTransaction, commitTransaction) {
    const initialFederationRoot = this.currentFederationRoot();
    const undecided = this.propose(noQuorumTransaction);
    assert(undecided.decision === null, 'UNEXPECTED_QUORUM_CERTIFICATE');
    const abortReceipt = this.recover(noQuorumTransaction.proposalId);

    let interrupted;
    try {
      this.propose(commitTransaction, { phase: 'commit', count: 1 });
      assert(false, 'EXPECTED_FEDERATION_INTERRUPTION');
    } catch (error) {
      assert(error.code === 'FEDERATION_CRASH_INJECTED_AFTER_COMMIT', 'UNEXPECTED_FEDERATION_ERROR', error.code);
      const proposal = this.proposals.get(commitTransaction.proposalId);
      interrupted = {
        committedClusters: proposal.prepares.filter((prepare) => {
          const state = this.clusterState(prepare.clusterId);
          return state.revision === prepare.nextRevision && state.sovereignRoot === prepare.afterRoot;
        }).length,
        preparedClusters: proposal.prepares.filter((prepare) => this.clusterState(prepare.clusterId).phase === 'prepared').length,
        durableQuorumCertificatePresent: proposal.decision !== null,
        approvalWeight: proposal.decision.approvalWeight,
        quorumWeight: this.quorumWeight,
      };
    }
    const commitReceipt = this.recover(commitTransaction.proposalId);
    const replayReceipt = this.recover(commitTransaction.proposalId);
    const clusterStates = Object.fromEntries(sortedClusters(this.clusters).map((state) => [state.clusterId, structuredClone(state)]));
    const result = {
      format: 'rfe.federated-reality-consensus-result.v0.7',
      consensusModel: 'weighted-quorum-with-required-sovereign-approval',
      totalWeight: this.totalWeight,
      quorumWeight: this.quorumWeight,
      initialFederationRoot,
      abortReceipt,
      interruptedCommitState: interrupted,
      commitReceipt,
      recoveryReplayReceipt: replayReceipt,
      finalFederationRoot: this.currentFederationRoot(),
      offlineClusters: commitTransaction.offlineClusters ?? [],
      clusterStates,
      metrics: { ...this.metrics },
    };
    return withHash(result, 'federatedRealityConsensusResultHash');
  }
}

export function verifyFederatedRealityConsensusResult(result) {
  assert(hash(withoutField(result, 'federatedRealityConsensusResultHash')) === result.federatedRealityConsensusResultHash, 'FEDERATION_RESULT_HASH_MISMATCH');
  assert(result.commitReceipt.status === 'committed', 'FEDERATION_NOT_COMMITTED');
  assert(result.commitReceipt.approvalWeight >= result.commitReceipt.quorumWeight, 'INSUFFICIENT_QUORUM_CERTIFICATE');
  assert(canonical(result.commitReceipt) === canonical(result.recoveryReplayReceipt), 'NON_IDEMPOTENT_FEDERATION_RECOVERY');
  assert(result.metrics.partialFederationCommitsExposed === 0, 'PARTIAL_FEDERATION_COMMIT_EXPOSED');
  assert(result.metrics.federationRootDivergences === 0, 'FEDERATION_ROOT_DIVERGENCE');
  for (const state of Object.values(result.clusterStates)) {
    assert(hash(withoutField(state, 'integrityHash')) === state.integrityHash, 'CLUSTER_STATE_INTEGRITY_MISMATCH', state.clusterId);
  }
  return true;
}
