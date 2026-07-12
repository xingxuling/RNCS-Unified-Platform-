import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { AtomicRealityCoordinator, verifyCrossDomainAtomicResult } from '../src/cross-domain-atomic-v060.js';

const vector = JSON.parse(readFileSync(new URL('../../conformance/vectors/c8-cross-domain-atomic.json', import.meta.url)));

test('C8 reference runtime matches frozen vector', () => {
  const coordinator = new AtomicRealityCoordinator(vector.participants);
  const result = coordinator.runAcceptanceScenario(vector.abortTransaction, vector.commitTransaction);
  assert.deepEqual(result, vector.expected);
});

test('C8 result passes independent structural verification', () => {
  const verification = verifyCrossDomainAtomicResult(vector.expected);
  assert.equal(verification.ok, true, verification.checks.filter((item) => !item.ok).map((item) => item.code).join(','));
});

test('C8 recovery is idempotent after durable decision', () => {
  const coordinator = new AtomicRealityCoordinator(vector.participants);
  assert.throws(
    () => coordinator.execute(vector.commitTransaction, { phase: 'commit', count: 1 }),
    (failure) => failure.code === 'ATOMIC_CRASH_INJECTED_AFTER_COMMIT',
  );
  const first = coordinator.recover(vector.commitTransaction.transactionId);
  const second = coordinator.recover(vector.commitTransaction.transactionId);
  assert.deepEqual(first, second);
});

test('C8 verifier rejects participant-state tampering', () => {
  const tampered = structuredClone(vector.expected);
  tampered.participantStates['domain:world'].committedRoot = '00'.repeat(32);
  const verification = verifyCrossDomainAtomicResult(tampered);
  assert.equal(verification.ok, false);
  assert.equal(verification.checks.some((item) => item.code === 'state_integrity:domain:world' && !item.ok), true);
});

test('C8 rejects duplicate domain operations before preparing', () => {
  const coordinator = new AtomicRealityCoordinator(vector.participants);
  const duplicate = structuredClone(vector.abortTransaction);
  duplicate.transactionId = 'transaction:c8:duplicate-domain';
  duplicate.operations[1].domainId = duplicate.operations[0].domainId;
  assert.throws(
    () => coordinator.execute(duplicate),
    (failure) => failure.code === 'DUPLICATE_DOMAIN_OPERATION',
  );
});
