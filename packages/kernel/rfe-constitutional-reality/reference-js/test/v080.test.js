import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  ByzantineFederatedReality,
  signByzantineAttestation,
  verifyByzantineFederatedRealityResult,
} from '../src/byzantine-federated-reality-v080.js';

const vector = JSON.parse(fs.readFileSync(new URL('../../conformance/vectors/c10-byzantine-federated-reality.json', import.meta.url)));

function runtime() {
  return new ByzantineFederatedReality(
    vector.clusters,
    vector.quorumWeight,
    vector.byzantineBudgetWeight,
    vector.parentCertificateHash,
  );
}

function scenario(engine) {
  const main = engine.proposal(vector.mainProposal);
  const fork = engine.proposal(vector.forkProposal);
  const byId = new Map(vector.clusters.map((cluster) => [cluster.clusterId, cluster]));
  const bodies = [
    ['cluster:aurora', main, 'approve'],
    ['cluster:forge', main, 'approve'],
    ['cluster:harbor', main, 'approve'],
    ['cluster:harbor', fork, 'approve'],
    ['cluster:mirror', fork, 'approve'],
  ];
  const attestations = bodies.map(([clusterId, proposal, decision]) => signByzantineAttestation(byId.get(clusterId), {
    epoch: engine.epoch,
    round: engine.round,
    parentFederationRoot: engine.federationRoot,
    proposalId: proposal.proposalId,
    proposalHash: proposal.proposalHash,
    decision,
  }));
  return { main, fork, attestations };
}

test('C10 reference runtime matches frozen vector', () => {
  const engine = runtime();
  const { attestations } = scenario(engine);
  const result = engine.runAcceptanceScenario(vector.mainProposal, vector.forkProposal, attestations);
  assert.deepStrictEqual(result, vector.expected);
});

test('C10 verifier accepts frozen result', () => {
  assert.equal(verifyByzantineFederatedRealityResult(vector.expected), true);
});

test('C10 quarantines an equivocating cluster and removes its weight from both forks', () => {
  const engine = runtime();
  const { main, fork, attestations } = scenario(engine);
  for (const attestation of attestations) engine.registerAttestation(attestation);
  assert.equal(engine.clusterState('cluster:harbor').quarantined, true);
  assert.equal(engine.approvalWeight(main.proposalHash), 7);
  assert.equal(engine.approvalWeight(fork.proposalHash), 1);
});

test('C10 rejects a forged keyed attestation', () => {
  const engine = runtime();
  const { attestations } = scenario(engine);
  attestations[0].keyedProof = 'forged';
  assert.throws(() => engine.registerAttestation(attestations[0]), { code: 'ATTESTATION_KEYED_PROOF_MISMATCH' });
});

test('C10 rejects stale-round attestations', () => {
  const engine = runtime();
  const { attestations } = scenario(engine);
  attestations[0].round = 0;
  assert.throws(() => engine.registerAttestation(attestations[0]), { code: 'STALE_BYZANTINE_ROUND' });
});

test('C10 verifier rejects a second conflicting certificate', () => {
  const tampered = structuredClone(vector.expected);
  tampered.rejectedFork.effectiveApprovalWeight = tampered.quorumWeight;
  assert.throws(() => verifyByzantineFederatedRealityResult(tampered), { code: 'BYZANTINE_RESULT_HASH_MISMATCH' });
});
