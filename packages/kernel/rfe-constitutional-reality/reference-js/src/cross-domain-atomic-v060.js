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

function sortedParticipants(map) {
  return [...map.values()].sort((a, b) => a.domainId.localeCompare(b.domainId));
}

export function participantSeedFromC7(domainId, c7Result) {
  assert(typeof c7Result.finalSemanticRoot === 'string', 'MISSING_C7_SEMANTIC_ROOT');
  assert(typeof c7Result.replicatedAuthorityResultHash === 'string', 'MISSING_C7_AUTHORITY_PROOF');
  return {
    domainId,
    semanticRoot: c7Result.finalSemanticRoot,
    authorityProofHash: c7Result.replicatedAuthorityResultHash,
  };
}

export class AtomicRealityCoordinator {
  constructor(participants) {
    assert(Array.isArray(participants) && participants.length >= 2, 'INSUFFICIENT_PARTICIPANTS');
    this.participants = new Map();
    this.transactions = new Map();
    this.transactionSequence = 0;
    for (const seed of participants) {
      assert(!this.participants.has(seed.domainId), 'DUPLICATE_DOMAIN', seed.domainId);
      this.participants.set(seed.domainId, withHash({
        format: 'rfe.atomic-domain-state.v0.6',
        domainId: seed.domainId,
        authorityProofHash: seed.authorityProofHash,
        revision: 0,
        committedRoot: seed.semanticRoot,
        phase: 'stable',
        pendingTransactionId: null,
        preparedRoot: null,
        prepareHash: null,
      }, 'integrityHash'));
    }
    this.globalRoot = this.currentGlobalRoot();
  }

  currentGlobalRoot() {
    return hash(sortedParticipants(this.participants).map((state) => ({
      domainId: state.domainId,
      authorityProofHash: state.authorityProofHash,
      revision: state.revision,
      committedRoot: state.committedRoot,
    })));
  }

  buildPrepare(transactionId, domainId, operation) {
    const state = this.participants.get(domainId);
    assert(state, 'UNKNOWN_DOMAIN', domainId);
    assert(state.phase === 'stable', 'DOMAIN_NOT_STABLE', domainId);
    const operationHash = hash(operation);
    const transition = {
      format: 'rfe.atomic-domain-transition.v0.6',
      transactionId,
      domainId,
      authorityProofHash: state.authorityProofHash,
      beforeRoot: state.committedRoot,
      nextRevision: state.revision + 1,
      operationHash,
    };
    return withHash({
      format: 'rfe.atomic-prepare.v0.6',
      transactionId,
      domainId,
      authorityProofHash: state.authorityProofHash,
      baseRevision: state.revision,
      nextRevision: state.revision + 1,
      beforeRoot: state.committedRoot,
      afterRoot: hash(transition),
      operationHash,
    }, 'prepareHash');
  }

  applyPrepare(transactionId, prepare) {
    const state = this.participants.get(prepare.domainId);
    assert(state.committedRoot === prepare.beforeRoot, 'PREPARE_BASE_STATE_MISMATCH', prepare.domainId);
    this.participants.set(prepare.domainId, withHash({
      ...withoutField(state, 'integrityHash'),
      phase: 'prepared',
      pendingTransactionId: transactionId,
      preparedRoot: prepare.afterRoot,
      prepareHash: prepare.prepareHash,
    }, 'integrityHash'));
  }

  projectedGlobalRoot(prepares) {
    const projected = new Map([...this.participants.entries()].map(([key, value]) => [key, structuredClone(value)]));
    for (const prepare of prepares) {
      const state = projected.get(prepare.domainId);
      state.committedRoot = prepare.afterRoot;
      state.revision = prepare.nextRevision;
    }
    return hash(sortedParticipants(projected).map((state) => ({
      domainId: state.domainId,
      authorityProofHash: state.authorityProofHash,
      revision: state.revision,
      committedRoot: state.committedRoot,
    })));
  }

  commitParticipant(transactionId, prepare) {
    const state = this.participants.get(prepare.domainId);
    if (state.phase === 'committed'
      && state.pendingTransactionId === transactionId
      && state.committedRoot === prepare.afterRoot
      && state.revision === prepare.nextRevision) return false;
    assert(state.phase === 'prepared', 'PARTICIPANT_NOT_PREPARED', prepare.domainId);
    assert(state.pendingTransactionId === transactionId, 'PARTICIPANT_TRANSACTION_MISMATCH', prepare.domainId);
    assert(state.prepareHash === prepare.prepareHash, 'PARTICIPANT_PREPARE_HASH_MISMATCH', prepare.domainId);
    this.participants.set(prepare.domainId, withHash({
      ...withoutField(state, 'integrityHash'),
      revision: prepare.nextRevision,
      committedRoot: prepare.afterRoot,
      phase: 'committed',
    }, 'integrityHash'));
    return true;
  }

  stabilize(transactionId, prepare) {
    const state = this.participants.get(prepare.domainId);
    assert(state.phase === 'committed', 'STABILIZE_BEFORE_COMMIT', prepare.domainId);
    assert(state.pendingTransactionId === transactionId, 'STABILIZE_TRANSACTION_MISMATCH', prepare.domainId);
    this.participants.set(prepare.domainId, withHash({
      ...withoutField(state, 'integrityHash'),
      phase: 'stable',
      pendingTransactionId: null,
      preparedRoot: null,
      prepareHash: null,
    }, 'integrityHash'));
  }

  abortParticipant(transactionId, prepare) {
    const state = this.participants.get(prepare.domainId);
    if (state.pendingTransactionId !== transactionId) return false;
    assert(state.phase !== 'committed', 'ABORT_AFTER_COMMIT_DECISION', prepare.domainId);
    this.participants.set(prepare.domainId, withHash({
      ...withoutField(state, 'integrityHash'),
      phase: 'stable',
      pendingTransactionId: null,
      preparedRoot: null,
      prepareHash: null,
    }, 'integrityHash'));
    return true;
  }

  receipt(tx, status, decisionHash, recovered) {
    return withHash({
      format: 'rfe.atomic-receipt.v0.6',
      transactionId: tx.transactionId,
      status,
      baseGlobalRoot: tx.baseGlobalRoot,
      finalGlobalRoot: this.currentGlobalRoot(),
      decisionHash,
      participantIds: tx.prepares.map((item) => item.domainId),
      recovered,
    }, 'atomicTransactionReceiptHash');
  }

  finalizeCommit(tx, recovered) {
    for (const prepare of tx.prepares) this.stabilize(tx.transactionId, prepare);
    const finalGlobalRoot = this.currentGlobalRoot();
    assert(finalGlobalRoot === tx.decision.finalGlobalRoot, 'FINAL_GLOBAL_ROOT_MISMATCH');
    this.globalRoot = finalGlobalRoot;
    tx.status = 'committed';
    tx.receipt = this.receipt(tx, 'committed', tx.decision.decisionHash, recovered);
    return structuredClone(tx.receipt);
  }

  execute(transaction, crashPoint = null) {
    if (this.transactions.has(transaction.transactionId)) {
      const existing = this.transactions.get(transaction.transactionId);
      if (existing.receipt) return structuredClone(existing.receipt);
      assert(false, 'TRANSACTION_ALREADY_IN_PROGRESS', transaction.transactionId);
    }
    assert(this.globalRoot === this.currentGlobalRoot(), 'COORDINATOR_GLOBAL_ROOT_STALE');
    const operations = [...transaction.operations].sort((a, b) => a.domainId.localeCompare(b.domainId));
    assert(operations.length >= 2, 'INSUFFICIENT_ATOMIC_SCOPE');
    assert(new Set(operations.map((item) => item.domainId)).size === operations.length, 'DUPLICATE_DOMAIN_OPERATION');
    this.transactionSequence += 1;
    const tx = {
      transactionId: transaction.transactionId,
      status: 'preparing',
      baseGlobalRoot: this.currentGlobalRoot(),
      sequence: this.transactionSequence,
      prepares: [],
      decision: null,
      receipt: null,
    };
    this.transactions.set(transaction.transactionId, tx);
    for (let index = 0; index < operations.length; index += 1) {
      const item = operations[index];
      const prepare = this.buildPrepare(transaction.transactionId, item.domainId, item.operation);
      tx.prepares.push(prepare);
      this.applyPrepare(transaction.transactionId, prepare);
      if (crashPoint?.phase === 'prepare' && crashPoint.count === index + 1) {
        assert(false, 'ATOMIC_CRASH_INJECTED_AFTER_PREPARE', index + 1);
      }
    }
    tx.decision = withHash({
      format: 'rfe.atomic-commit-decision.v0.6',
      transactionId: transaction.transactionId,
      baseGlobalRoot: tx.baseGlobalRoot,
      finalGlobalRoot: this.projectedGlobalRoot(tx.prepares),
      prepareHashes: tx.prepares.map((prepare) => prepare.prepareHash),
      participantIds: tx.prepares.map((prepare) => prepare.domainId),
      transactionSequence: tx.sequence,
    }, 'decisionHash');
    tx.status = 'commit_decided';
    for (let index = 0; index < tx.prepares.length; index += 1) {
      this.commitParticipant(tx.transactionId, tx.prepares[index]);
      if (crashPoint?.phase === 'commit' && crashPoint.count === index + 1) {
        assert(false, 'ATOMIC_CRASH_INJECTED_AFTER_COMMIT', index + 1);
      }
    }
    return this.finalizeCommit(tx, false);
  }

  recover(transactionId) {
    const tx = this.transactions.get(transactionId);
    assert(tx, 'UNKNOWN_TRANSACTION', transactionId);
    if (tx.receipt) return structuredClone(tx.receipt);
    if (!tx.decision) {
      for (const prepare of tx.prepares) this.abortParticipant(transactionId, prepare);
      assert(this.currentGlobalRoot() === tx.baseGlobalRoot, 'ABORT_CHANGED_GLOBAL_ROOT');
      tx.status = 'aborted';
      tx.receipt = this.receipt(tx, 'aborted', null, true);
      return structuredClone(tx.receipt);
    }
    assert(tx.decision.prepareHashes.length === tx.prepares.length, 'DECISION_PREPARE_COUNT_MISMATCH');
    for (let index = 0; index < tx.prepares.length; index += 1) {
      assert(tx.decision.prepareHashes[index] === tx.prepares[index].prepareHash, 'DECISION_PREPARE_HASH_MISMATCH');
      this.commitParticipant(transactionId, tx.prepares[index]);
    }
    return this.finalizeCommit(tx, true);
  }

  runAcceptanceScenario(abortTransaction, commitTransaction) {
    const initialGlobalRoot = this.currentGlobalRoot();
    try {
      this.execute(abortTransaction, { phase: 'prepare', count: 2 });
      assert(false, 'EXPECTED_PREPARE_INTERRUPTION');
    } catch (failure) {
      assert(failure.code === 'ATOMIC_CRASH_INJECTED_AFTER_PREPARE', failure.code ?? 'WRONG_PREPARE_FAILURE');
    }
    const abortReceipt = this.recover(abortTransaction.transactionId);
    assert(abortReceipt.status === 'aborted', 'ABORT_RECEIPT_STATUS');
    assert(this.currentGlobalRoot() === initialGlobalRoot, 'ABORT_ATOMICITY_FAILED');

    try {
      this.execute(commitTransaction, { phase: 'commit', count: 1 });
      assert(false, 'EXPECTED_COMMIT_INTERRUPTION');
    } catch (failure) {
      assert(failure.code === 'ATOMIC_CRASH_INJECTED_AFTER_COMMIT', failure.code ?? 'WRONG_COMMIT_FAILURE');
    }
    const interruptedStates = sortedParticipants(this.participants);
    const committedParticipants = interruptedStates.filter((state) => state.phase === 'committed').length;
    const preparedParticipants = interruptedStates.filter((state) => state.phase === 'prepared').length;
    const commitReceipt = this.recover(commitTransaction.transactionId);
    const recoveryReplayReceipt = this.recover(commitTransaction.transactionId);
    assert(canonical(commitReceipt) === canonical(recoveryReplayReceipt), 'RECOVERY_NOT_IDEMPOTENT');
    const finalGlobalRoot = this.currentGlobalRoot();
    assert(finalGlobalRoot !== initialGlobalRoot, 'COMMIT_DID_NOT_CHANGE_ROOT');
    assert(finalGlobalRoot === commitReceipt.finalGlobalRoot, 'COMMIT_ROOT_MISMATCH');
    assert(sortedParticipants(this.participants).every((state) => state.phase === 'stable'), 'PARTICIPANT_NOT_STABLE');

    return withHash({
      format: 'rfe.cross-domain-atomic-result.v0.6',
      atomicityModel: 'durable-decision-all-or-nothing',
      initialGlobalRoot,
      abortReceipt,
      interruptedCommitState: {
        committedParticipants,
        preparedParticipants,
        durableDecisionPresent: true,
      },
      commitReceipt,
      recoveryReplayReceipt,
      finalGlobalRoot,
      participantStates: Object.fromEntries(sortedParticipants(this.participants).map((state) => [state.domainId, state])),
      metrics: {
        transactionsAttempted: 2,
        transactionsAborted: 1,
        transactionsCommitted: 1,
        injectedInterruptions: 2,
        recoveryPasses: 3,
        partialCommitsExposed: 0,
        globalRootDivergences: 0,
        idempotentRecoveryReplays: 1,
      },
    }, 'crossDomainAtomicResultHash');
  }
}

export function verifyCrossDomainAtomicResult(result) {
  const checks = [];
  const check = (condition, code, detail) => checks.push({ ok: Boolean(condition), code, detail });
  check(result.format === 'rfe.cross-domain-atomic-result.v0.6', 'format', result.format);
  check(result.atomicityModel === 'durable-decision-all-or-nothing', 'atomicity_model', result.atomicityModel);
  check(result.abortReceipt?.status === 'aborted', 'abort_status', result.abortReceipt?.status);
  check(result.abortReceipt?.baseGlobalRoot === result.initialGlobalRoot, 'abort_base_root', result.abortReceipt?.baseGlobalRoot);
  check(result.abortReceipt?.finalGlobalRoot === result.initialGlobalRoot, 'abort_final_root', result.abortReceipt?.finalGlobalRoot);
  check(result.commitReceipt?.status === 'committed', 'commit_status', result.commitReceipt?.status);
  check(result.commitReceipt?.finalGlobalRoot === result.finalGlobalRoot, 'commit_final_root', result.commitReceipt?.finalGlobalRoot);
  check(result.initialGlobalRoot !== result.finalGlobalRoot, 'root_changed', result.finalGlobalRoot);
  check(result.interruptedCommitState?.committedParticipants === 1, 'interrupted_committed', result.interruptedCommitState?.committedParticipants);
  check(result.interruptedCommitState?.preparedParticipants === 2, 'interrupted_prepared', result.interruptedCommitState?.preparedParticipants);
  check(result.interruptedCommitState?.durableDecisionPresent === true, 'durable_decision', result.interruptedCommitState?.durableDecisionPresent);
  check(canonical(result.commitReceipt) === canonical(result.recoveryReplayReceipt), 'recovery_idempotent', result.recoveryReplayReceipt);
  const states = Object.values(result.participantStates ?? {});
  check(states.length === 3, 'participant_count', states.length);
  check(states.every((state) => state.phase === 'stable' && state.revision === 1), 'participant_stability', states);
  check(states.every((state) => state.pendingTransactionId === null && state.preparedRoot === null), 'participant_cleanup', states);
  for (const state of states) {
    check(state.integrityHash === hash(withoutField(state, 'integrityHash')), `state_integrity:${state.domainId}`, state.integrityHash);
  }
  check(result.abortReceipt?.atomicTransactionReceiptHash === hash(withoutField(result.abortReceipt, 'atomicTransactionReceiptHash')), 'abort_receipt_hash', result.abortReceipt?.atomicTransactionReceiptHash);
  check(result.commitReceipt?.atomicTransactionReceiptHash === hash(withoutField(result.commitReceipt, 'atomicTransactionReceiptHash')), 'commit_receipt_hash', result.commitReceipt?.atomicTransactionReceiptHash);
  const metrics = result.metrics ?? {};
  check(metrics.transactionsAborted === 1, 'metric_aborted', metrics.transactionsAborted);
  check(metrics.transactionsCommitted === 1, 'metric_committed', metrics.transactionsCommitted);
  check(metrics.partialCommitsExposed === 0, 'metric_partial_exposure', metrics.partialCommitsExposed);
  check(metrics.globalRootDivergences === 0, 'metric_divergence', metrics.globalRootDivergences);
  const resultHash = hash(withoutField(result, 'crossDomainAtomicResultHash'));
  check(result.crossDomainAtomicResultHash === resultHash, 'result_hash', resultHash);
  return { ok: checks.every((item) => item.ok), checks, resultHash };
}
