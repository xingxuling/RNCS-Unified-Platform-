import {
  RealityKernelError,
  assertNonEmptyString,
  clone,
  compareStrings,
  rootHash,
  withIntegrity
} from './canonical.mjs';

const CONTINUITY_CLAIM_FORMAT = 'rncs.typed-continuity-claim.v0.1';
const SOVEREIGNTY_FORMAT = 'rncs.subject-sovereignty-envelope.v0.1';
const LEDGER_FORMAT = 'rncs.continuity-ledger.v0.1';

function assertCounter(value, code, field) {
  if (!Number.isInteger(value) || value < 0) {
    throw new RealityKernelError(code, `${field} must be a non-negative integer`);
  }
}

function assertJsonObject(value, code, field) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new RealityKernelError(code, `${field} must be a JSON object`);
  }
}

export function createContinuityClaim({
  subjectId,
  branchId = 'main',
  epoch = 0,
  sequence = 0,
  previousClaimRoot = null,
  forkPolicy = 'deny',
  lineage = [],
  embodiment = {kind: 'logical'},
  issuedAt = 0,
  expiresAt = null,
  authorityRoot = null,
  metadata = {}
} = {}) {
  assertNonEmptyString(subjectId, 'RK_CONTINUITY_SUBJECT_REQUIRED', 'subjectId');
  assertNonEmptyString(branchId, 'RK_CONTINUITY_BRANCH_REQUIRED', 'branchId');
  assertCounter(epoch, 'RK_CONTINUITY_EPOCH_INVALID', 'epoch');
  assertCounter(sequence, 'RK_CONTINUITY_SEQUENCE_INVALID', 'sequence');
  assertCounter(issuedAt, 'RK_CONTINUITY_ISSUED_AT_INVALID', 'issuedAt');
  if (expiresAt !== null) {
    assertCounter(expiresAt, 'RK_CONTINUITY_EXPIRES_AT_INVALID', 'expiresAt');
    if (expiresAt < issuedAt) throw new RealityKernelError('RK_CONTINUITY_TIME_INVALID', 'expiresAt must not precede issuedAt');
  }
  if (previousClaimRoot !== null) assertNonEmptyString(previousClaimRoot, 'RK_CONTINUITY_PREDECESSOR_INVALID', 'previousClaimRoot');
  if (authorityRoot !== null) assertNonEmptyString(authorityRoot, 'RK_CONTINUITY_AUTHORITY_INVALID', 'authorityRoot');
  if (!['deny', 'allow'].includes(forkPolicy)) throw new RealityKernelError('RK_CONTINUITY_FORK_POLICY_INVALID', forkPolicy);
  if (!Array.isArray(lineage) || lineage.some((item) => typeof item !== 'string')) {
    throw new RealityKernelError('RK_CONTINUITY_LINEAGE_INVALID', 'lineage must be an array of strings');
  }
  assertJsonObject(embodiment, 'RK_CONTINUITY_EMBODIMENT_INVALID', 'embodiment');
  assertJsonObject(metadata, 'RK_CONTINUITY_METADATA_INVALID', 'metadata');

  const body = {
    format: CONTINUITY_CLAIM_FORMAT,
    subjectId,
    branchId,
    epoch,
    sequence,
    previousClaimRoot,
    forkPolicy,
    lineage: [...new Set(lineage)].sort(),
    embodiment: clone(embodiment),
    issuedAt,
    expiresAt,
    authorityRoot,
    metadata: clone(metadata)
  };
  return {...body, claimRoot: rootHash(body)};
}

export function verifyContinuityClaim(claim) {
  if (!claim || claim.format !== CONTINUITY_CLAIM_FORMAT || typeof claim.claimRoot !== 'string') return false;
  try {
    const body = Object.fromEntries(Object.entries(claim).filter(([key]) => key !== 'claimRoot'));
    return claim.claimRoot === rootHash(body) &&
      typeof claim.subjectId === 'string' && claim.subjectId.length > 0 &&
      typeof claim.branchId === 'string' && claim.branchId.length > 0 &&
      Number.isInteger(claim.epoch) && claim.epoch >= 0 &&
      Number.isInteger(claim.sequence) && claim.sequence >= 0 &&
      (claim.previousClaimRoot === null || typeof claim.previousClaimRoot === 'string') &&
      ['deny', 'allow'].includes(claim.forkPolicy) &&
      Array.isArray(claim.lineage) && claim.lineage.every((item) => typeof item === 'string') &&
      claim.embodiment && typeof claim.embodiment === 'object' && !Array.isArray(claim.embodiment) &&
      Number.isInteger(claim.issuedAt) && claim.issuedAt >= 0 &&
      (claim.expiresAt === null || (Number.isInteger(claim.expiresAt) && claim.expiresAt >= claim.issuedAt));
  } catch {
    return false;
  }
}

export function assertContinuityClaim(claim) {
  if (!verifyContinuityClaim(claim)) throw new RealityKernelError('RK_CONTINUITY_CLAIM_INVALID', 'continuity claim failed verification');
  return claim;
}

export function nextContinuityClaim(previous, options = {}) {
  assertContinuityClaim(previous);
  const epoch = options.epoch ?? previous.epoch;
  const sequence = options.sequence ?? (epoch === previous.epoch ? previous.sequence + 1 : 0);
  const validStep = (epoch === previous.epoch && sequence === previous.sequence + 1) ||
    (epoch === previous.epoch + 1 && sequence === 0);
  if (!validStep) throw new RealityKernelError('RK_CONTINUITY_STEP_INVALID', `${previous.epoch}:${previous.sequence} -> ${epoch}:${sequence}`);
  return createContinuityClaim({
    subjectId: previous.subjectId,
    branchId: options.branchId ?? previous.branchId,
    epoch,
    sequence,
    previousClaimRoot: previous.claimRoot,
    forkPolicy: options.forkPolicy ?? previous.forkPolicy,
    lineage: options.lineage ?? previous.lineage,
    embodiment: options.embodiment ?? previous.embodiment,
    issuedAt: options.issuedAt ?? previous.issuedAt + 1,
    expiresAt: options.expiresAt ?? previous.expiresAt,
    authorityRoot: options.authorityRoot ?? previous.authorityRoot,
    metadata: options.metadata ?? previous.metadata
  });
}

export function forkContinuityClaim(previous, {branchId, issuedAt = previous.issuedAt + 1, metadata = previous.metadata} = {}) {
  assertContinuityClaim(previous);
  assertNonEmptyString(branchId, 'RK_CONTINUITY_BRANCH_REQUIRED', 'branchId');
  if (branchId === previous.branchId) throw new RealityKernelError('RK_CONTINUITY_BRANCH_EXISTS', branchId);
  return createContinuityClaim({
    subjectId: previous.subjectId,
    branchId,
    epoch: previous.epoch,
    sequence: previous.sequence + 1,
    previousClaimRoot: previous.claimRoot,
    forkPolicy: 'allow',
    lineage: [...previous.lineage, previous.claimRoot],
    embodiment: previous.embodiment,
    issuedAt,
    expiresAt: previous.expiresAt,
    authorityRoot: previous.authorityRoot,
    metadata
  });
}

export function createSubjectSovereigntyEnvelope({
  claim,
  transitionId,
  leaseId,
  fencingToken = 0,
  nonce,
  scope = '*'
} = {}) {
  assertContinuityClaim(claim);
  assertNonEmptyString(transitionId, 'RK_SOVEREIGNTY_TRANSITION_REQUIRED', 'transitionId');
  assertNonEmptyString(leaseId, 'RK_SOVEREIGNTY_LEASE_REQUIRED', 'leaseId');
  assertNonEmptyString(nonce, 'RK_SOVEREIGNTY_NONCE_REQUIRED', 'nonce');
  assertCounter(fencingToken, 'RK_SOVEREIGNTY_FENCING_INVALID', 'fencingToken');
  const body = {
    format: SOVEREIGNTY_FORMAT,
    subjectId: claim.subjectId,
    branchId: claim.branchId,
    transitionId,
    claimRoot: claim.claimRoot,
    leaseId,
    fencingToken,
    nonce,
    scope: clone(scope)
  };
  return withIntegrity(body, 'sovereigntyRoot');
}

export function verifySubjectSovereigntyEnvelope(envelope) {
  if (!envelope || envelope.format !== SOVEREIGNTY_FORMAT || typeof envelope.sovereigntyRoot !== 'string') return false;
  try {
    const body = Object.fromEntries(Object.entries(envelope).filter(([key]) => key !== 'sovereigntyRoot'));
    return envelope.sovereigntyRoot === rootHash(body) &&
      typeof envelope.subjectId === 'string' && envelope.subjectId.length > 0 &&
      typeof envelope.branchId === 'string' && envelope.branchId.length > 0 &&
      typeof envelope.transitionId === 'string' && envelope.transitionId.length > 0 &&
      typeof envelope.claimRoot === 'string' && envelope.claimRoot.length > 0 &&
      typeof envelope.leaseId === 'string' && envelope.leaseId.length > 0 &&
      Number.isInteger(envelope.fencingToken) && envelope.fencingToken >= 0 &&
      typeof envelope.nonce === 'string' && envelope.nonce.length > 0;
  } catch {
    return false;
  }
}

function headKey(subjectId, branchId) {
  return `${subjectId}\u0000${branchId}`;
}

function compareHead(left, right) {
  return compareStrings(left.claim.subjectId, right.claim.subjectId) ||
    compareStrings(left.claim.branchId, right.claim.branchId) ||
    compareStrings(left.claim.claimRoot, right.claim.claimRoot);
}

export class ContinuityLedger {
  constructor() {
    this._heads = new Map();
    this._leases = new Map();
  }

  getHead(subjectId, branchId = 'main') {
    const record = this._heads.get(headKey(subjectId, branchId));
    return record ? clone(record.claim) : null;
  }

  getHeads(subjectId = null) {
    return [...this._heads.values()]
      .filter((record) => !subjectId || record.claim.subjectId === subjectId)
      .sort(compareHead)
      .map((record) => clone(record.claim));
  }

  preview({claim, sovereignty}, transitionId) {
    assertContinuityClaim(claim);
    if (!verifySubjectSovereigntyEnvelope(sovereignty)) {
      throw new RealityKernelError('RK_SOVEREIGNTY_INVALID', 'sovereignty envelope failed verification');
    }
    assertNonEmptyString(transitionId, 'RK_TRANSITION_ID_REQUIRED', 'transitionId');
    if (sovereignty.transitionId !== transitionId) throw new RealityKernelError('RK_SOVEREIGNTY_TRANSITION_MISMATCH', transitionId);
    if (sovereignty.subjectId !== claim.subjectId || sovereignty.branchId !== claim.branchId || sovereignty.claimRoot !== claim.claimRoot) {
      throw new RealityKernelError('RK_SOVEREIGNTY_CLAIM_MISMATCH', claim.subjectId);
    }

    const lease = this._leases.get(claim.subjectId);
    if (lease && sovereignty.fencingToken < lease.fencingToken) {
      throw new RealityKernelError('RK_FENCING_TOKEN_STALE', claim.subjectId);
    }
    if (lease && sovereignty.fencingToken === lease.fencingToken && sovereignty.leaseId !== lease.leaseId) {
      throw new RealityKernelError('RK_LEASE_MISMATCH', claim.subjectId);
    }

    const current = this._heads.get(headKey(claim.subjectId, claim.branchId));
    if (current) {
      if (claim.epoch < current.claim.epoch || (claim.epoch === current.claim.epoch && claim.sequence <= current.claim.sequence)) {
        throw new RealityKernelError('RK_CONTINUITY_REPLAY', claim.claimRoot);
      }
      if (claim.previousClaimRoot !== current.claim.claimRoot) {
        throw new RealityKernelError('RK_CONTINUITY_PREDECESSOR_MISMATCH', claim.claimRoot);
      }
      if (claim.epoch === current.claim.epoch && claim.sequence > current.claim.sequence + 1) {
        throw new RealityKernelError('RK_CONTINUITY_GAP', claim.claimRoot);
      }
      if (claim.epoch > current.claim.epoch + 1 || (claim.epoch === current.claim.epoch + 1 && claim.sequence !== 0)) {
        throw new RealityKernelError('RK_CONTINUITY_GAP', claim.claimRoot);
      }
    } else {
      const subjectHeads = this.getHeads(claim.subjectId);
      if (!subjectHeads.length) {
        if (claim.epoch !== 0 || claim.sequence !== 0 || claim.previousClaimRoot !== null) {
          throw new RealityKernelError('RK_CONTINUITY_INITIAL_INVALID', claim.claimRoot);
        }
      } else {
        const parent = subjectHeads.find((head) => head.claimRoot === claim.previousClaimRoot);
        if (!parent || parent.forkPolicy !== 'allow' || claim.forkPolicy !== 'allow') {
          throw new RealityKernelError('RK_CONTINUITY_FORK_DENIED', claim.branchId);
        }
        if (claim.epoch !== parent.epoch || claim.sequence !== parent.sequence + 1) {
          throw new RealityKernelError('RK_CONTINUITY_GAP', claim.claimRoot);
        }
        if (!claim.lineage.includes(parent.claimRoot)) {
          throw new RealityKernelError('RK_CONTINUITY_PREDECESSOR_MISMATCH', claim.claimRoot);
        }
      }
    }

    return {claim: clone(claim), sovereignty: clone(sovereignty)};
  }

  accept(proof, transitionId) {
    const accepted = this.preview(proof, transitionId);
    const key = headKey(accepted.claim.subjectId, accepted.claim.branchId);
    this._heads.set(key, {
      claim: clone(accepted.claim),
      sovereignty: clone(accepted.sovereignty)
    });
    const previousLease = this._leases.get(accepted.claim.subjectId);
    if (!previousLease || accepted.sovereignty.fencingToken >= previousLease.fencingToken) {
      this._leases.set(accepted.claim.subjectId, {
        leaseId: accepted.sovereignty.leaseId,
        fencingToken: accepted.sovereignty.fencingToken
      });
    }
    return clone(accepted.claim);
  }

  snapshot() {
    const body = {
      format: LEDGER_FORMAT,
      heads: [...this._heads.values()].sort(compareHead).map((record) => clone(record)),
      leases: [...this._leases.entries()].sort(([left], [right]) => compareStrings(left, right)).map(([subjectId, lease]) => ({subjectId, ...clone(lease)}))
    };
    return {...body, ledgerRoot: rootHash(body)};
  }

  restore(snapshot) {
    if (!snapshot || snapshot.format !== LEDGER_FORMAT || snapshot.ledgerRoot !== rootHash(Object.fromEntries(Object.entries(snapshot).filter(([key]) => key !== 'ledgerRoot')))) {
      throw new RealityKernelError('RK_LEDGER_INVALID', 'continuity ledger snapshot failed verification');
    }
    this._heads = new Map((snapshot.heads ?? []).map((record) => [headKey(record.claim.subjectId, record.claim.branchId), clone(record)]));
    this._leases = new Map((snapshot.leases ?? []).map((lease) => [lease.subjectId, {leaseId: lease.leaseId, fencingToken: lease.fencingToken}]));
    return this;
  }
}

export {
  CONTINUITY_CLAIM_FORMAT,
  LEDGER_FORMAT,
  SOVEREIGNTY_FORMAT
};
