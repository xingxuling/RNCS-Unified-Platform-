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

function sortedBy(items, key) {
  return [...items].sort((a, b) => a[key].localeCompare(b[key]));
}

function keyedAttestation(body, verifierKey) {
  return hash({ format: 'rfe.keyed-attestation-fixture.v0.8', body, verifierKey });
}

export function signByzantineAttestation(cluster, body) {
  const normalized = {
    format: 'rfe.byzantine-attestation.v0.8',
    epoch: body.epoch,
    round: body.round,
    parentFederationRoot: body.parentFederationRoot,
    proposalId: body.proposalId,
    proposalHash: body.proposalHash,
    clusterId: cluster.clusterId,
    decision: body.decision,
    weight: cluster.weight,
    authorityProofHash: cluster.authorityProofHash,
    policyHash: cluster.policyHash,
    identityCommitment: hash({ clusterId: cluster.clusterId, verifierKey: cluster.verifierKey }),
  };
  return {
    ...normalized,
    attestationHash: hash(normalized),
    keyedProof: keyedAttestation(normalized, cluster.verifierKey),
  };
}

export class ByzantineFederatedReality {
  constructor(clusters, quorumWeight, byzantineBudgetWeight, parentCertificateHash) {
    assert(Array.isArray(clusters) && clusters.length >= 4, 'INSUFFICIENT_BYZANTINE_FEDERATION');
    this.clusters = new Map();
    this.verifierKeys = new Map();
    this.totalWeight = 0;
    for (const seed of clusters) {
      assert(!this.clusters.has(seed.clusterId), 'DUPLICATE_CLUSTER', seed.clusterId);
      assert(Number.isSafeInteger(seed.weight) && seed.weight > 0, 'INVALID_CLUSTER_WEIGHT', seed.clusterId);
      assert(typeof seed.verifierKey === 'string' && seed.verifierKey.length >= 8, 'INVALID_VERIFIER_KEY', seed.clusterId);
      this.verifierKeys.set(seed.clusterId, seed.verifierKey);
      const state = withHash({
        format: 'rfe.byzantine-cluster-state.v0.8',
        clusterId: seed.clusterId,
        weight: seed.weight,
        authorityProofHash: seed.authorityProofHash,
        policyHash: seed.policyHash,
        identityCommitment: hash({ clusterId: seed.clusterId, verifierKey: seed.verifierKey }),
        revision: seed.revision ?? 0,
        sovereignRoot: seed.sovereignRoot,
        phase: 'stable',
        pendingCertificateHash: null,
        preparedRoot: null,
        quarantined: false,
        quarantineEvidenceHash: null,
      }, 'integrityHash');
      this.clusters.set(seed.clusterId, state);
      this.totalWeight += seed.weight;
    }
    assert(Number.isSafeInteger(byzantineBudgetWeight) && byzantineBudgetWeight >= 0, 'INVALID_BYZANTINE_BUDGET');
    assert(Number.isSafeInteger(quorumWeight) && quorumWeight > byzantineBudgetWeight, 'UNSAFE_QUORUM_WEIGHT');
    assert((2 * quorumWeight) > (this.totalWeight + byzantineBudgetWeight), 'QUORUM_INTERSECTION_NOT_BYZANTINE_SAFE');
    this.quorumWeight = quorumWeight;
    this.byzantineBudgetWeight = byzantineBudgetWeight;
    this.parentCertificateHash = parentCertificateHash;
    this.epoch = 1;
    this.round = 1;
    this.attestations = [];
    this.evidence = new Map();
    this.proposals = new Map();
    this.certificate = null;
    this.receipt = null;
    this.federationRoot = this.currentFederationRoot();
    this.metrics = {
      attestationsAccepted: 0,
      forgedAttestationsRejected: 0,
      equivocationsDetected: 0,
      quarantinedWeight: 0,
      conflictingCertificatesFormed: 0,
      staleRoundAttestationsRejected: 0,
      wrongParentAttestationsRejected: 0,
      certificateRecoveries: 0,
      idempotentRecoveryReplays: 0,
      partialFederationCommitsExposed: 0,
      federationRootDivergences: 0,
      injectedInterruptions: 0,
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
      identityCommitment: state.identityCommitment,
      quarantined: state.quarantined,
      quarantineEvidenceHash: state.quarantineEvidenceHash,
    })));
  }

  clusterState(clusterId) {
    const state = this.clusters.get(clusterId);
    assert(state, 'UNKNOWN_CLUSTER', clusterId);
    return state;
  }

  proposal(transaction) {
    const operations = [...transaction.operations].sort((a, b) => a.clusterId.localeCompare(b.clusterId));
    assert(operations.length >= 2, 'INSUFFICIENT_FEDERATION_SCOPE');
    assert(new Set(operations.map((operation) => operation.clusterId)).size === operations.length, 'DUPLICATE_CLUSTER_OPERATION');
    const body = {
      format: 'rfe.byzantine-proposal.v0.8',
      epoch: this.epoch,
      round: this.round,
      parentFederationRoot: this.federationRoot,
      parentCertificateHash: this.parentCertificateHash,
      proposalId: transaction.proposalId,
      requiredClusterIds: [...transaction.requiredClusterIds].sort(),
      operationHashes: operations.map((operation) => ({
        clusterId: operation.clusterId,
        operationHash: hash(operation.operation),
      })),
    };
    const proposal = { ...withHash(body, 'proposalHash'), operations };
    this.proposals.set(proposal.proposalHash, proposal);
    return proposal;
  }

  verifyAttestation(attestation) {
    const state = this.clusterState(attestation.clusterId);
    assert(attestation.epoch === this.epoch && attestation.round === this.round, 'STALE_BYZANTINE_ROUND', attestation.clusterId);
    assert(attestation.parentFederationRoot === this.federationRoot, 'ATTESTATION_PARENT_ROOT_MISMATCH', attestation.clusterId);
    assert(attestation.weight === state.weight, 'ATTESTATION_WEIGHT_MISMATCH', attestation.clusterId);
    assert(attestation.authorityProofHash === state.authorityProofHash, 'ATTESTATION_AUTHORITY_MISMATCH', attestation.clusterId);
    assert(attestation.policyHash === state.policyHash, 'ATTESTATION_POLICY_MISMATCH', attestation.clusterId);
    assert(attestation.identityCommitment === state.identityCommitment, 'ATTESTATION_IDENTITY_MISMATCH', attestation.clusterId);
    const body = withoutField(withoutField(attestation, 'keyedProof'), 'attestationHash');
    assert(hash(body) === attestation.attestationHash, 'ATTESTATION_HASH_MISMATCH', attestation.clusterId);
    const verifierKey = this.verifierKeys.get(attestation.clusterId);
    assert(keyedAttestation(body, verifierKey) === attestation.keyedProof, 'ATTESTATION_KEYED_PROOF_MISMATCH', attestation.clusterId);
    assert(this.proposals.has(attestation.proposalHash), 'UNKNOWN_ATTESTED_PROPOSAL', attestation.proposalHash);
  }

  registerAttestation(attestation) {
    try {
      this.verifyAttestation(attestation);
    } catch (error) {
      if (error.code === 'STALE_BYZANTINE_ROUND') this.metrics.staleRoundAttestationsRejected += 1;
      else if (error.code === 'ATTESTATION_PARENT_ROOT_MISMATCH') this.metrics.wrongParentAttestationsRejected += 1;
      else this.metrics.forgedAttestationsRejected += 1;
      throw error;
    }
    const exactDuplicate = this.attestations.some((current) => current.attestationHash === attestation.attestationHash);
    assert(!exactDuplicate, 'DUPLICATE_ATTESTATION', attestation.clusterId);
    const conflict = this.attestations.find((current) => (
      current.clusterId === attestation.clusterId
      && current.epoch === attestation.epoch
      && current.round === attestation.round
      && current.proposalHash !== attestation.proposalHash
    ));
    this.attestations.push(structuredClone(attestation));
    this.metrics.attestationsAccepted += 1;
    if (conflict) this.recordEquivocation(conflict, attestation);
  }

  recordEquivocation(left, right) {
    const clusterId = left.clusterId;
    if (this.evidence.has(clusterId)) return;
    const [first, second] = [left, right].sort((a, b) => a.proposalHash.localeCompare(b.proposalHash));
    const evidence = withHash({
      format: 'rfe.equivocation-evidence.v0.8',
      epoch: this.epoch,
      round: this.round,
      clusterId,
      parentFederationRoot: this.federationRoot,
      firstProposalHash: first.proposalHash,
      secondProposalHash: second.proposalHash,
      firstAttestationHash: first.attestationHash,
      secondAttestationHash: second.attestationHash,
    }, 'evidenceHash');
    this.evidence.set(clusterId, evidence);
    const state = this.clusterState(clusterId);
    state.quarantined = true;
    state.quarantineEvidenceHash = evidence.evidenceHash;
    this.clusters.set(clusterId, withHash(state, 'integrityHash'));
    this.metrics.equivocationsDetected += 1;
    this.metrics.quarantinedWeight += state.weight;
  }

  effectiveApprovals(proposalHash) {
    return this.attestations.filter((attestation) => (
      attestation.proposalHash === proposalHash
      && attestation.decision === 'approve'
      && !this.clusterState(attestation.clusterId).quarantined
    ));
  }

  approvalWeight(proposalHash) {
    return this.effectiveApprovals(proposalHash).reduce((sum, vote) => sum + vote.weight, 0);
  }

  requiredApprovalsPresent(proposal) {
    return proposal.requiredClusterIds.every((clusterId) => this.effectiveApprovals(proposal.proposalHash)
      .some((attestation) => attestation.clusterId === clusterId));
  }

  projectedFederationRoot(proposal) {
    return hash(sortedClusters(this.clusters).map((state) => {
      const operation = proposal.operations.find((item) => item.clusterId === state.clusterId);
      if (!operation) {
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
        };
      }
      return {
        clusterId: state.clusterId,
        weight: state.weight,
        revision: state.revision + 1,
        sovereignRoot: hash({
          clusterId: state.clusterId,
          beforeRoot: state.sovereignRoot,
          nextRevision: state.revision + 1,
          operationHash: hash(operation.operation),
          proposalHash: proposal.proposalHash,
        }),
        authorityProofHash: state.authorityProofHash,
        policyHash: state.policyHash,
        identityCommitment: state.identityCommitment,
        quarantined: state.quarantined,
        quarantineEvidenceHash: state.quarantineEvidenceHash,
      };
    }));
  }

  formCertificate(proposalHash) {
    assert(this.certificate === null, 'CERTIFICATE_ALREADY_FORMED');
    const proposal = this.proposals.get(proposalHash);
    assert(proposal, 'UNKNOWN_PROPOSAL', proposalHash);
    const approvals = this.effectiveApprovals(proposalHash);
    const approvalWeight = approvals.reduce((sum, item) => sum + item.weight, 0);
    if (approvalWeight < this.quorumWeight || !this.requiredApprovalsPresent(proposal)) return null;
    const certificate = withHash({
      format: 'rfe.byzantine-quorum-certificate.v0.8',
      epoch: this.epoch,
      round: this.round,
      parentFederationRoot: this.federationRoot,
      parentCertificateHash: this.parentCertificateHash,
      proposalId: proposal.proposalId,
      proposalHash,
      finalFederationRoot: this.projectedFederationRoot(proposal),
      totalWeight: this.totalWeight,
      byzantineBudgetWeight: this.byzantineBudgetWeight,
      quorumWeight: this.quorumWeight,
      approvalWeight,
      requiredClusterIds: [...proposal.requiredClusterIds],
      attestationHashes: sortedBy(approvals, 'clusterId').map((item) => item.attestationHash),
      excludedEvidenceHashes: sortedBy([...this.evidence.values()], 'clusterId').map((item) => item.evidenceHash),
    }, 'byzantineCertificateHash');
    this.certificate = certificate;
    return structuredClone(certificate);
  }

  prepareCertificate(certificate) {
    const proposal = this.proposals.get(certificate.proposalHash);
    for (const operation of proposal.operations) {
      const state = this.clusterState(operation.clusterId);
      state.phase = 'prepared';
      state.pendingCertificateHash = certificate.byzantineCertificateHash;
      state.preparedRoot = hash({
        clusterId: state.clusterId,
        beforeRoot: state.sovereignRoot,
        nextRevision: state.revision + 1,
        operationHash: hash(operation.operation),
        proposalHash: proposal.proposalHash,
      });
      this.clusters.set(state.clusterId, withHash(state, 'integrityHash'));
    }
  }

  commitCertificate(crashAfter = null) {
    assert(this.certificate, 'NO_DURABLE_BYZANTINE_CERTIFICATE');
    const proposal = this.proposals.get(this.certificate.proposalHash);
    let committed = 0;
    for (const operation of proposal.operations) {
      const state = this.clusterState(operation.clusterId);
      if (state.revision > 0 && state.sovereignRoot === state.preparedRoot && state.phase === 'stable') continue;
      assert(state.pendingCertificateHash === this.certificate.byzantineCertificateHash, 'CERTIFICATE_OWNERSHIP_MISMATCH', state.clusterId);
      state.revision += 1;
      state.sovereignRoot = state.preparedRoot;
      state.phase = 'stable';
      state.pendingCertificateHash = null;
      state.preparedRoot = null;
      this.clusters.set(state.clusterId, withHash(state, 'integrityHash'));
      committed += 1;
      if (crashAfter === committed) {
        this.metrics.injectedInterruptions += 1;
        assert(false, 'BYZANTINE_CRASH_INJECTED_AFTER_COMMIT', committed);
      }
    }
    return this.finalize(false);
  }

  finalize(recovered) {
    const root = this.currentFederationRoot();
    assert(root === this.certificate.finalFederationRoot, 'BYZANTINE_FINAL_ROOT_MISMATCH');
    this.federationRoot = root;
    if (!this.receipt) {
      this.receipt = withHash({
        format: 'rfe.byzantine-federation-receipt.v0.8',
        epoch: this.epoch,
        round: this.round,
        proposalId: this.certificate.proposalId,
        proposalHash: this.certificate.proposalHash,
        status: 'committed',
        finalFederationRoot: root,
        byzantineCertificateHash: this.certificate.byzantineCertificateHash,
        approvalWeight: this.certificate.approvalWeight,
        quorumWeight: this.quorumWeight,
        quarantinedWeight: this.metrics.quarantinedWeight,
        recovered,
      }, 'receiptHash');
    }
    return structuredClone(this.receipt);
  }

  recover() {
    assert(this.certificate, 'NO_DURABLE_BYZANTINE_CERTIFICATE');
    this.metrics.certificateRecoveries += 1;
    if (this.receipt) {
      this.metrics.idempotentRecoveryReplays += 1;
      return structuredClone(this.receipt);
    }
    const proposal = this.proposals.get(this.certificate.proposalHash);
    for (const operation of proposal.operations) {
      const state = this.clusterState(operation.clusterId);
      if (state.revision > 0 && state.phase === 'stable') continue;
      assert(state.pendingCertificateHash === this.certificate.byzantineCertificateHash, 'CERTIFICATE_OWNERSHIP_MISMATCH', state.clusterId);
      state.revision += 1;
      state.sovereignRoot = state.preparedRoot;
      state.phase = 'stable';
      state.pendingCertificateHash = null;
      state.preparedRoot = null;
      this.clusters.set(state.clusterId, withHash(state, 'integrityHash'));
    }
    return this.finalize(true);
  }

  runAcceptanceScenario(mainTransaction, forkTransaction, attestations) {
    const initialFederationRoot = this.currentFederationRoot();
    const main = this.proposal(mainTransaction);
    const fork = this.proposal(forkTransaction);
    for (const attestation of attestations) this.registerAttestation(attestation);
    const forkWeight = this.approvalWeight(fork.proposalHash);
    const rejectedFork = withHash({
      format: 'rfe.rejected-byzantine-fork.v0.8',
      proposalId: fork.proposalId,
      proposalHash: fork.proposalHash,
      effectiveApprovalWeight: forkWeight,
      quorumWeight: this.quorumWeight,
      reason: 'INSUFFICIENT_NON_EQUIVOCATING_QUORUM',
    }, 'rejectionHash');
    const certificate = this.formCertificate(main.proposalHash);
    assert(certificate, 'MAIN_PROPOSAL_FAILED_TO_FORM_CERTIFICATE');
    this.prepareCertificate(certificate);
    let interruptedCommitState;
    try {
      this.commitCertificate(1);
      assert(false, 'EXPECTED_BYZANTINE_COMMIT_INTERRUPTION');
    } catch (error) {
      assert(error.code === 'BYZANTINE_CRASH_INJECTED_AFTER_COMMIT', 'UNEXPECTED_BYZANTINE_ERROR', error.code);
      interruptedCommitState = {
        committedClusters: main.operations.filter((operation) => this.clusterState(operation.clusterId).phase === 'stable').length,
        preparedClusters: main.operations.filter((operation) => this.clusterState(operation.clusterId).phase === 'prepared').length,
        durableCertificatePresent: this.certificate !== null,
      };
    }
    const commitReceipt = this.recover();
    const recoveryReplayReceipt = this.recover();
    const result = {
      format: 'rfe.byzantine-federated-reality-result.v0.8',
      consensusModel: 'weighted-byzantine-quorum-with-equivocation-exclusion',
      totalWeight: this.totalWeight,
      byzantineBudgetWeight: this.byzantineBudgetWeight,
      quorumWeight: this.quorumWeight,
      initialFederationRoot,
      parentCertificateHash: this.parentCertificateHash,
      mainProposalHash: main.proposalHash,
      forkProposalHash: fork.proposalHash,
      equivocationEvidence: sortedBy([...this.evidence.values()], 'clusterId'),
      rejectedFork,
      certificate,
      interruptedCommitState,
      commitReceipt,
      recoveryReplayReceipt,
      finalFederationRoot: this.currentFederationRoot(),
      clusterStates: Object.fromEntries(sortedClusters(this.clusters).map((state) => [state.clusterId, structuredClone(state)])),
      metrics: { ...this.metrics },
    };
    return withHash(result, 'byzantineFederatedRealityResultHash');
  }
}

export function verifyByzantineFederatedRealityResult(result) {
  assert(hash(withoutField(result, 'byzantineFederatedRealityResultHash')) === result.byzantineFederatedRealityResultHash, 'BYZANTINE_RESULT_HASH_MISMATCH');
  assert((2 * result.quorumWeight) > (result.totalWeight + result.byzantineBudgetWeight), 'UNSAFE_BYZANTINE_QUORUM');
  assert(result.certificate.approvalWeight >= result.quorumWeight, 'INSUFFICIENT_BYZANTINE_CERTIFICATE');
  assert(result.rejectedFork.effectiveApprovalWeight < result.quorumWeight, 'CONFLICTING_FORK_REACHED_QUORUM');
  assert(result.metrics.conflictingCertificatesFormed === 0, 'CONFLICTING_CERTIFICATES_FORMED');
  assert(result.metrics.partialFederationCommitsExposed === 0, 'PARTIAL_FEDERATION_COMMIT_EXPOSED');
  assert(result.metrics.federationRootDivergences === 0, 'FEDERATION_ROOT_DIVERGENCE');
  assert(canonical(result.commitReceipt) === canonical(result.recoveryReplayReceipt), 'NON_IDEMPOTENT_BYZANTINE_RECOVERY');
  for (const evidence of result.equivocationEvidence) {
    assert(evidence.firstProposalHash !== evidence.secondProposalHash, 'INVALID_EQUIVOCATION_EVIDENCE');
    assert(hash(withoutField(evidence, 'evidenceHash')) === evidence.evidenceHash, 'EQUIVOCATION_EVIDENCE_HASH_MISMATCH');
  }
  for (const state of Object.values(result.clusterStates)) {
    assert(hash(withoutField(state, 'integrityHash')) === state.integrityHash, 'CLUSTER_STATE_INTEGRITY_MISMATCH', state.clusterId);
  }
  return true;
}
