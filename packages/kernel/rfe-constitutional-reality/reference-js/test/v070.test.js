import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { hash } from '../src/replicated-authority-v050.js';
import {
  FederatedRealityConsensus,
  verifyFederatedRealityConsensusResult,
} from '../src/federated-reality-consensus-v070.js';

const vector = JSON.parse(fs.readFileSync(new URL('../../conformance/vectors/c9-federated-reality-consensus.json', import.meta.url)));

function runtime() {
  return new FederatedRealityConsensus(vector.clusters, vector.quorumWeight);
}

function bindVotes(transaction, engine, sequence = engine.proposalSequence + 1) {
  const operations = [...transaction.operations].sort((a, b) => a.clusterId.localeCompare(b.clusterId));
  const proposalBody = {
    format: 'rfe.federation-proposal.v0.7',
    proposalId: transaction.proposalId,
    baseFederationRoot: engine.currentFederationRoot(),
    requiredClusterIds: [...transaction.requiredClusterIds].sort(),
    operationHashes: operations.map((operation) => ({
      clusterId: operation.clusterId,
      operationHash: hash(operation.operation),
    })),
    proposalSequence: sequence,
  };
  const proposalHash = hash(proposalBody);
  return {
    ...transaction,
    votes: transaction.votes.map((vote) => ({
      ...vote,
      proposalHash,
      authorityProofHash: engine.clusterState(vote.clusterId).authorityProofHash,
      policyHash: engine.clusterState(vote.clusterId).policyHash,
    })),
  };
}

test('C9 reference runtime matches frozen vector', () => {
  const engine = runtime();
  const result = engine.runAcceptanceScenario(
    bindVotes(vector.noQuorumProposal, engine, 1),
    bindVotes(vector.commitProposal, engine, 2),
  );
  assert.deepStrictEqual(result, vector.expected);
});

test('C9 verifier accepts frozen result', () => {
  assert.equal(verifyFederatedRealityConsensusResult(vector.expected), true);
});

test('C9 recovery is idempotent after quorum certificate', () => {
  const engine = runtime();
  assert.throws(
    () => engine.propose(bindVotes(vector.commitProposal, engine), { phase: 'commit', count: 1 }),
    { code: 'FEDERATION_CRASH_INJECTED_AFTER_COMMIT' },
  );
  const first = engine.recover(vector.commitProposal.proposalId);
  const second = engine.recover(vector.commitProposal.proposalId);
  assert.deepStrictEqual(first, second);
});

test('C9 rejects forged cluster vote authority', () => {
  const engine = runtime();
  const proposal = bindVotes(vector.commitProposal, engine);
  proposal.votes[0].authorityProofHash = 'forged';
  assert.throws(() => engine.propose(proposal), { code: 'VOTE_AUTHORITY_PROOF_MISMATCH' });
});

test('C9 rejects duplicate votes', () => {
  const engine = runtime();
  const proposal = bindVotes(vector.commitProposal, engine);
  proposal.votes.push({ ...proposal.votes[0] });
  assert.throws(() => engine.propose(proposal), { code: 'DUPLICATE_FEDERATION_VOTE' });
});

test('C9 verifier rejects cluster-state tampering', () => {
  const tampered = structuredClone(vector.expected);
  tampered.clusterStates['cluster:aurora'].weight = 400;
  assert.throws(() => verifyFederatedRealityConsensusResult(tampered), { code: 'FEDERATION_RESULT_HASH_MISMATCH' });
});
