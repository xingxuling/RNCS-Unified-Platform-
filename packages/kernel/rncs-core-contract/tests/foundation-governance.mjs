import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { authorize, commit, newProposal, proposalPayload, reseal, rootHash, verify, without } from '../src/index.mjs';

const input = JSON.parse(await readFile(new URL('../examples/proposal-input.json', import.meta.url), 'utf8'));
const foundationGovernance = {
  explicitVariables: [{ name: 'world.energy', value: 12, unit: 'MJ' }],
  uncertainty: [{ variable: 'world.energy', range: [10, 14], confidence: '0.8' }],
  providerCapabilities: [{ provider: 'rcl-native', capability: 'state-transition', status: 'verified' }],
  authorityRequirements: [{ action: 'commit', scope: 'world.rcl.write', riskLevel: 'high' }],
  irreversibleEffects: [{ effect: 'advance-generation', reversible: false }],
  invariants: [{ name: 'state-root-bound', expression: 'nativeStateRoot === evidence.stateRoot' }],
  adaptiveInvariantField: { enabled: true, updatePolicy: 'evidence-backed-only', version: 1 },
  causalParents: [{ id: 'cause:proposal-input', relation: 'supports' }],
  evidenceRequirements: [{ kind: 'rcl-native-authority-state', required: true }],
};

const proposal = newProposal({ ...input, foundation_governance: foundationGovernance });
assert.equal(verify(proposal).valid, true);
assert.deepEqual(proposal.foundation_governance, foundationGovernance);

const authorized = authorize(proposal, { status: 'approved', resolver: 'rfe' });
const committed = commit(authorized, { generation: 8, generation_root: '9'.repeat(64) });
assert.equal(verify(committed).valid, true);

const tampered = structuredClone(authorized);
tampered.foundation_governance.evidenceRequirements = null;
tampered.proposal_root = rootHash(proposalPayload(tampered));
tampered.authority.proposal_root = tampered.proposal_root;
delete tampered.authority.decision_root;
tampered.authority.decision_root = rootHash(without(tampered.authority, 'decision_root'));
const resealedTamper = reseal(tampered);
assert.equal(verify(resealedTamper).valid, true);
assert.throws(
  () => commit(resealedTamper, { generation: 9, generation_root: '8'.repeat(64) }),
  /FOUNDATION_4R_GATE_FAILED/,
);

console.log('ok foundation governance proposal root and commit gate');
