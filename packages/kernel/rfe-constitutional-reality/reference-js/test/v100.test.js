import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  ConstitutionalReality,
  normalizeConstitution,
  runConstitutionalAcceptanceScenario,
  signConstitutionalVote,
  signRotationContinuity,
  verifyConstitutionalRealityResult,
} from '../src/constitutional-reality-v100.js';
import { hash } from '../src/replicated-authority-v050.js';

const vector = JSON.parse(fs.readFileSync(new URL('../../conformance/vectors/c12-constitutional-reality.json', import.meta.url)));

function temporaryState(label) {
  return path.join(os.tmpdir(), `rfe-c12-${label}-${process.pid}-${Math.random().toString(16).slice(2)}.json`);
}

function run(label) {
  const file = temporaryState(label);
  try {
    return runConstitutionalAcceptanceScenario(vector, file);
  } finally {
    fs.rmSync(file, { force: true });
  }
}

function seedMaps() {
  return {
    oldById: new Map(vector.oldConfiguration.members.map((member) => [member.clusterId, member])),
    newById: new Map(vector.newConfiguration.members.map((member) => [member.clusterId, member])),
  };
}

test('C12 reference runtime matches frozen vector', () => {
  assert.deepStrictEqual(run('golden'), vector.expected);
});

test('C12 verifier accepts frozen result', () => {
  assert.equal(verifyConstitutionalRealityResult(vector.expected), true);
});

test('C12 deterministic rerun preserves every authoritative hash', () => {
  const left = run('determinism-left');
  const right = run('determinism-right');
  assert.deepStrictEqual(left, right);
  assert.equal(left.constitutionalRealityResultHash, vector.expected.constitutionalRealityResultHash);
});

test('C12 requires independent old and new weighted quorums', () => {
  assert.equal(vector.expected.oldAuthorizationCertificate.approvedWeight, 7);
  assert.equal(vector.expected.oldAuthorizationCertificate.quorumWeight, 7);
  assert.equal(vector.expected.newAcceptanceCertificate.acceptedWeight, 8);
  assert.equal(vector.expected.newAcceptanceCertificate.quorumWeight, 7);
  assert.notEqual(
    vector.expected.oldAuthorizationCertificate.oldAuthorizationCertificateHash,
    vector.expected.newAcceptanceCertificate.newAcceptanceCertificateHash,
  );
});

test('C12 freezes add, remove, weight change, and key rotation in one transition', () => {
  const changes = vector.expected.transition.changes;
  assert.deepStrictEqual(changes.added, ['cluster:nova']);
  assert.deepStrictEqual(changes.removed, ['cluster:mirror']);
  assert.equal(changes.keyRotated.length, 1);
  assert.equal(changes.keyRotated[0].clusterId, 'cluster:aurora');
  assert.equal(changes.weightChanged.length, 2);
});

test('C12 recovery is idempotent after partial topology application', () => {
  const result = vector.expected;
  assert.equal(result.interruptedActivationState.durableJointCertificatePresent, true);
  assert.equal(result.interruptedActivationState.appliedMembers, 2);
  assert.equal(result.interruptedActivationState.remainingMembers, 3);
  assert.equal(result.activationReceipt.recovered, true);
  assert.equal(result.activationReceipt.receiptHash, result.recoveryReplayReceipt.receiptHash);
  assert.equal(result.metrics.recoveries, 1);
  assert.equal(result.metrics.idempotentRecoveryReplays, 1);
});

test('C12 rejects unsafe target quorum geometry before transition creation', () => {
  const unsafe = structuredClone(vector.newConfiguration);
  unsafe.quorumWeight = 6;
  assert.throws(() => normalizeConstitution(unsafe), { code: 'UNSAFE_CONSTITUTIONAL_QUORUM' });
});

test('C12 rejects a forged key-rotation continuity proof', () => {
  const engine = new ConstitutionalReality(vector.oldConfiguration, vector.parentCertificateHash, vector.initialFederationRoot);
  const { oldById, newById } = seedMaps();
  const proposal = engine.proposeTransition(vector.transitionPlan, vector.newConfiguration);
  const proof = signRotationContinuity(oldById.get('cluster:aurora'), newById.get('cluster:aurora'), proposal);
  proof.oldKeyedProof = 'forged';
  const body = structuredClone(proof);
  delete body.rotationProofHash;
  proof.rotationProofHash = hash(body);
  assert.throws(() => engine.registerRotationProof(proof), { code: 'ROTATION_OLD_KEYED_PROOF_MISMATCH' });
});

test('C12 cannot form a joint activation certificate without both constitutions', () => {
  const engine = new ConstitutionalReality(vector.oldConfiguration, vector.parentCertificateHash, vector.initialFederationRoot);
  const { oldById, newById } = seedMaps();
  const proposal = engine.proposeTransition(vector.transitionPlan, vector.newConfiguration);
  engine.registerRotationProof(signRotationContinuity(oldById.get('cluster:aurora'), newById.get('cluster:aurora'), proposal));
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
  assert.ok(engine.formOldAuthorizationCertificate());
  assert.throws(() => engine.formJointActivationCertificate(), { code: 'MISSING_NEW_ACCEPTANCE_CERTIFICATE' });
});

test('C12 makes old epoch, removed member, and rotated old key invalid after activation', () => {
  const result = vector.expected;
  assert.equal(result.staleEpochRejection.code, 'STALE_CONFIGURATION_EPOCH');
  assert.equal(result.removedMemberRejection.code, 'REMOVED_CONSTITUTION_MEMBER');
  assert.equal(result.oldKeyRejection.code, 'CONFIGURATION_KEY_MISMATCH');
  assert.equal(result.metrics.staleEpochRejections, 1);
  assert.equal(result.metrics.removedMemberRejections, 1);
  assert.equal(result.metrics.keyMismatchRejections, 1);
});

test('C12 new constitution proves it is operational with its own quorum', () => {
  const certificate = vector.expected.confirmationCertificate;
  assert.equal(certificate.epoch, 2);
  assert.equal(certificate.configurationHash, vector.expected.newConfiguration.configurationHash);
  assert.deepStrictEqual(certificate.voterIds, ['cluster:aurora', 'cluster:nova']);
  assert.equal(certificate.confirmedWeight, 8);
});

test('C12 verifier rejects a tampered joint activation certificate', () => {
  const tampered = structuredClone(vector.expected);
  tampered.jointActivationCertificate.targetTopologyRoot = '0'.repeat(64);
  assert.throws(() => verifyConstitutionalRealityResult(tampered), { code: 'JOINT_ACTIVATION_CERTIFICATE_HASH_MISMATCH' });
});
