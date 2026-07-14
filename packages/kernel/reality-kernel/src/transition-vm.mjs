import {RealityKernelError, assertNonEmptyString, clone, rootHash, withIntegrity} from './canonical.mjs';
import {createRealityObject, replaceObjectState} from './object-abi.mjs';
import {RealityGraph} from './reality-graph.mjs';

const TRANSITION_FORMAT = 'rncs.reality-transition.v0.1';
const DECISION_FORMAT = 'rncs.reality-authority-decision.v0.1';
const RECEIPT_FORMAT = 'reality.commit-receipt.v0.1';

function proposalBody(envelope) {
  return {
    format: TRANSITION_FORMAT,
    transitionId: envelope.transitionId,
    worldId: envelope.worldId,
    baseRoot: envelope.baseRoot,
    actor: envelope.actor,
    intent: envelope.intent,
    operations: envelope.operations,
    evidenceRefs: envelope.evidenceRefs
  };
}

export function buildTransitionEnvelope({
  transitionId,
  worldId,
  baseRoot,
  actor,
  intent = {},
  operations = [],
  evidenceRefs = []
}) {
  assertNonEmptyString(transitionId, 'RK_TRANSITION_ID_REQUIRED', 'transitionId');
  assertNonEmptyString(worldId, 'RK_WORLD_ID_REQUIRED', 'worldId');
  assertNonEmptyString(baseRoot, 'RK_BASE_ROOT_REQUIRED', 'baseRoot');
  assertNonEmptyString(actor, 'RK_ACTOR_REQUIRED', 'actor');
  if (!Array.isArray(operations) || operations.length === 0) throw new RealityKernelError('RK_OPERATIONS_REQUIRED', 'at least one operation is required');
  if (!Array.isArray(evidenceRefs)) throw new RealityKernelError('RK_EVIDENCE_REFS_INVALID', 'evidenceRefs must be an array');
  const envelope = {
    ...proposalBody({transitionId, worldId, baseRoot, actor, intent: clone(intent), operations: clone(operations), evidenceRefs: clone(evidenceRefs)})
  };
  return {...envelope, proposalRoot: rootHash(envelope)};
}

export function authorizeTransition(envelope, {
  decisionId,
  principal,
  approved = true,
  scope = '*',
  reason = null
} = {}) {
  if (!verifyTransitionEnvelope(envelope)) throw new RealityKernelError('RK_PROPOSAL_INVALID', 'proposal root verification failed');
  assertNonEmptyString(decisionId, 'RK_DECISION_ID_REQUIRED', 'decisionId');
  assertNonEmptyString(principal, 'RK_AUTHORITY_PRINCIPAL_REQUIRED', 'principal');
  const decision = withIntegrity({
    format: DECISION_FORMAT,
    transitionId: envelope.transitionId,
    proposalRoot: envelope.proposalRoot,
    decisionId,
    principal,
    approved: Boolean(approved),
    scope: clone(scope),
    reason
  }, 'decisionRoot');
  return {...clone(envelope), authority: decision};
}

export function verifyTransitionEnvelope(envelope) {
  if (!envelope || envelope.format !== TRANSITION_FORMAT || typeof envelope.proposalRoot !== 'string') return false;
  try {
    return envelope.proposalRoot === rootHash(proposalBody(envelope));
  } catch {
    return false;
  }
}

export function verifyAuthorityDecision(envelope) {
  const decision = envelope?.authority;
  if (!decision || decision.format !== DECISION_FORMAT || decision.proposalRoot !== envelope.proposalRoot) return false;
  if (typeof decision.decisionRoot !== 'string') return false;
  try {
    const body = Object.fromEntries(Object.entries(decision).filter(([key]) => key !== 'decisionRoot'));
    return decision.decisionRoot === rootHash(body);
  } catch {
    return false;
  }
}

function scopeAllows(scope, operation) {
  if (scope === '*' || scope === undefined || scope === null) return true;
  const values = Array.isArray(scope) ? scope : [scope];
  const targets = [];
  if (operation.objectId) targets.push(operation.objectId);
  if (operation.object?.id) targets.push(operation.object.id);
  if (operation.relation?.from) targets.push(operation.relation.from);
  if (operation.relation?.to) targets.push(operation.relation.to);
  if (operation.match?.from) targets.push(operation.match.from);
  if (operation.match?.to) targets.push(operation.match.to);
  return targets.length === 0 || targets.every((target) => values.includes(target));
}

export class RealityTransitionVM {
  constructor({maxOperations = 128} = {}) {
    this.maxOperations = maxOperations;
  }

  execute(graph, envelope) {
    if (!(graph instanceof RealityGraph)) throw new RealityKernelError('RK_GRAPH_REQUIRED', 'RealityGraph is required');
    if (!verifyTransitionEnvelope(envelope)) throw new RealityKernelError('RK_PROPOSAL_INVALID', 'proposal root verification failed');
    if (envelope.worldId !== graph.worldId) throw new RealityKernelError('RK_WORLD_MISMATCH', `${envelope.worldId} != ${graph.worldId}`);
    if (envelope.baseRoot !== graph.realityRoot) throw new RealityKernelError('RK_STALE_BASE', envelope.baseRoot);
    if (!verifyAuthorityDecision(envelope)) throw new RealityKernelError('RK_AUTHORITY_REQUIRED', 'an integrity-bound authority decision is required');
    if (!envelope.authority.approved) throw new RealityKernelError('RK_AUTHORITY_DENIED', envelope.authority.reason ?? 'authority denied');
    if (!Array.isArray(envelope.operations) || envelope.operations.length === 0 || envelope.operations.length > this.maxOperations) {
      throw new RealityKernelError('RK_OPERATION_COUNT_INVALID', `expected 1..${this.maxOperations} operations`);
    }
    for (const operation of envelope.operations) {
      if (!operation || typeof operation.op !== 'string') throw new RealityKernelError('RK_OPERATION_INVALID', 'operation opcode is required');
      if (!scopeAllows(envelope.authority.scope, operation)) throw new RealityKernelError('RK_AUTHORITY_SCOPE_DENIED', operation.op);
    }

    const next = graph.clone();
    next.revision += 1;
    next.logicalTime += 1;
    for (const operation of envelope.operations) this.#apply(next, operation);
    const snapshot = next.snapshot();
    const receipt = withIntegrity({
      format: RECEIPT_FORMAT,
      status: 'preview',
      transitionId: envelope.transitionId,
      worldId: envelope.worldId,
      baseRoot: envelope.baseRoot,
      resultRoot: snapshot.realityRoot,
      proposalRoot: envelope.proposalRoot,
      decisionRoot: envelope.authority.decisionRoot,
      revision: snapshot.revision,
      logicalTime: snapshot.logicalTime,
      operations: clone(envelope.operations),
      commitRoot: rootHash({
        format: 'reality.commit.v0.1',
        transitionId: envelope.transitionId,
        proposalRoot: envelope.proposalRoot,
        decisionRoot: envelope.authority.decisionRoot,
        baseRoot: envelope.baseRoot,
        resultRoot: snapshot.realityRoot,
        revision: snapshot.revision,
        logicalTime: snapshot.logicalTime,
        operations: envelope.operations
      })
    }, 'receiptRoot');
    return {phase: 'preview', snapshot, receipt, envelope: clone(envelope)};
  }

  commit(graph, envelope) {
    const result = this.execute(graph, envelope);
    graph.commitSnapshot(result.snapshot);
    const committedReceipt = withIntegrity({...result.receipt, status: 'committed'}, 'receiptRoot');
    return {...result, phase: 'committed', receipt: committedReceipt};
  }

  #apply(graph, operation) {
    switch (operation.op) {
      case 'create-object':
        graph.addObject(operation.object ?? createRealityObject(operation.spec ?? {}));
        return;
      case 'set-state': {
        const current = graph.getObject(operation.objectId);
        if (!current) throw new RealityKernelError('RK_OBJECT_NOT_FOUND', operation.objectId);
        const state = operation.state ?? {...current.state, ...(operation.patch ?? {})};
        graph.replaceObject(replaceObjectState(current, state));
        return;
      }
      case 'add-relation':
        graph.addRelation(operation.relation);
        return;
      case 'remove-relation':
        graph.removeRelation(operation.match);
        return;
      default:
        throw new RealityKernelError('RK_OPERATION_UNSUPPORTED', operation.op);
    }
  }
}

export {DECISION_FORMAT, RECEIPT_FORMAT, TRANSITION_FORMAT};
