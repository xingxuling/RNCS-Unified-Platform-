import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { hash, verifyAgainstFrozenC7, verifyReplicatedAuthorityResult } from '../src/replicated-authority-v050.js';

const vector = JSON.parse(readFileSync(new URL('../../conformance/vectors/c7-replicated-authority.json', import.meta.url), 'utf8'));

test('C7: frozen replicated authority result has a valid canonical hash chain', () => {
  const verification = verifyAgainstFrozenC7(vector);
  assert.equal(verification.ok, true, JSON.stringify(verification.checks.filter((item) => !item.ok)));
  assert.equal(verification.resultHash, '61b2bbd1b98ceb14f3027eba05b22f83c93df4e47171f49bc3acf52682d7f3ec');
});

test('C7: leader failure preserves one committed reality across healthy replicas', () => {
  const result = vector.expected;
  assert.deepEqual(result.authorityLog.map(({ term, leaderId, index }) => ({ term, leaderId, index })), [
    { term: 1, leaderId: 'replica:a', index: 1 },
    { term: 1, leaderId: 'replica:a', index: 2 },
    { term: 2, leaderId: 'replica:b', index: 3 },
  ]);
  assert.equal(result.replicaStates['replica:a'].online, false);
  assert.equal(result.replicaStates['replica:b'].semanticRoot, result.replicaStates['replica:c'].semanticRoot);
  assert.equal(result.replicaStates['replica:b'].checkpointHash, result.replicaStates['replica:c'].checkpointHash);
  assert.equal(result.healthyConvergence.identityCount, 1);
});

test('C7: stale leader or chain tampering is independently rejected', () => {
  const tampered = structuredClone(vector.expected);
  tampered.authorityLog[1].leaderId = 'replica:c';
  assert.equal(verifyReplicatedAuthorityResult(tampered).ok, false);

  const body = structuredClone(vector.expected.authorityLog[0]);
  delete body.entryHash;
  assert.equal(hash(body), vector.expected.authorityLog[0].entryHash);
  assert.equal(vector.expected.staleLeaderRejection.reasonCode, 'stale_leader_term');
});
