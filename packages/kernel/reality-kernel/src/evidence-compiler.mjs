import {RealityKernelError, assertNonEmptyString, clone, rootHash, withIntegrity} from './canonical.mjs';
import {verifyTransitionEnvelope, verifyAuthorityDecision} from './transition-vm.mjs';

const EVIDENCE_FORMAT = 'reality.evidence-bundle.v0.1';
const ITEM_FORMAT = 'reality.evidence-item.v0.1';

function verifyReceipt(receipt) {
  if (!receipt || receipt.format !== 'reality.commit-receipt.v0.1' || typeof receipt.receiptRoot !== 'string') return false;
  try {
    const body = Object.fromEntries(Object.entries(receipt).filter(([key]) => key !== 'receiptRoot'));
    return receipt.receiptRoot === rootHash(body) && typeof receipt.commitRoot === 'string' && typeof receipt.resultRoot === 'string';
  } catch {
    return false;
  }
}

export function createEvidenceItem({id, source, claim, value = null, observedAt = null, kind = 'observation', refs = []}) {
  assertNonEmptyString(id, 'RK_EVIDENCE_ID_REQUIRED', 'id');
  assertNonEmptyString(source, 'RK_EVIDENCE_SOURCE_REQUIRED', 'source');
  assertNonEmptyString(claim, 'RK_EVIDENCE_CLAIM_REQUIRED', 'claim');
  if (!Array.isArray(refs)) throw new RealityKernelError('RK_EVIDENCE_REFS_INVALID', 'refs must be an array');
  const body = {
    format: ITEM_FORMAT,
    id,
    kind,
    source,
    claim,
    value: clone(value),
    observedAt,
    refs: [...new Set(refs)].sort()
  };
  return {...body, evidenceItemRoot: rootHash(body)};
}

export function compileEvidence({envelope, receipt, observations = [], assertions = []} = {}) {
  if (!verifyTransitionEnvelope(envelope) || !verifyAuthorityDecision(envelope)) {
    throw new RealityKernelError('RK_PROPOSAL_INVALID', 'evidence must reference an authorized transition');
  }
  if (!verifyReceipt(receipt)) throw new RealityKernelError('RK_RECEIPT_INVALID', 'commit receipt verification failed');
  if (receipt.transitionId !== envelope.transitionId || receipt.proposalRoot !== envelope.proposalRoot || receipt.decisionRoot !== envelope.authority.decisionRoot) {
    throw new RealityKernelError('RK_RECEIPT_LINK_MISMATCH', 'receipt is not bound to the transition');
  }
  if (!Array.isArray(observations) || !Array.isArray(assertions)) throw new RealityKernelError('RK_EVIDENCE_INVALID', 'observations and assertions must be arrays');
  const items = [...observations.map((item) => createEvidenceItem(item)), ...assertions.map((item) => createEvidenceItem({...item, kind: item.kind ?? 'assertion'}))]
    .sort((a, b) => a.id.localeCompare(b.id) || a.evidenceItemRoot.localeCompare(b.evidenceItemRoot));
  const body = {
    format: EVIDENCE_FORMAT,
    transitionId: envelope.transitionId,
    worldId: envelope.worldId,
    proposalRoot: envelope.proposalRoot,
    decisionRoot: envelope.authority.decisionRoot,
    continuityClaimRoot: envelope.continuity?.claim?.claimRoot ?? null,
    sovereigntyRoot: envelope.continuity?.sovereignty?.sovereigntyRoot ?? null,
    commitRoot: receipt.commitRoot,
    resultRoot: receipt.resultRoot,
    items
  };
  return {...body, evidenceRoot: rootHash(body)};
}

export function verifyEvidence(bundle) {
  if (!bundle || bundle.format !== EVIDENCE_FORMAT || typeof bundle.evidenceRoot !== 'string') return false;
  try {
    const body = Object.fromEntries(Object.entries(bundle).filter(([key]) => key !== 'evidenceRoot'));
    if (bundle.evidenceRoot !== rootHash(body) || !Array.isArray(bundle.items)) return false;
    return bundle.items.every((item) => {
      if (item.format !== ITEM_FORMAT || typeof item.evidenceItemRoot !== 'string') return false;
      const itemBody = Object.fromEntries(Object.entries(item).filter(([key]) => key !== 'evidenceItemRoot'));
      return item.evidenceItemRoot === rootHash(itemBody);
    });
  } catch {
    return false;
  }
}

export {EVIDENCE_FORMAT, ITEM_FORMAT};
