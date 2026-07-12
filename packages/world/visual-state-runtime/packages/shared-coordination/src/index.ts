import {
  deepClone,
  cryptographicHash,
  semanticHash,
  type VSRState,
  type VSRValue,
} from '../../spec/src/index.js';
import {
  sealInteractionAuthorization,
  type VSRInteractionAuthorization,
  type VSRInteractionCommitReceipt,
  type VSRInteractionProposal,
} from '../../interaction-runtime/src/index.js';

export const VSR_SHARED_COORDINATION_VERSION = '0.1.0-alpha.12';

export type VSRSharedMergeMode = 'direct' | 'disjoint-rebase';
export type VSRSharedRejectCode =
  | 'invalid-candidate'
  | 'unknown-base-root'
  | 'overlapping-write-conflict'
  | 'authority-revoked'
  | 'observer-revoked'
  | 'device-revoked'
  | 'proposal-revoked'
  | 'document-mismatch'
  | 'receipt-not-committed';

export interface VSRSharedCursor {
  format: 'vsr.shared-reality-cursor.v0.1';
  sessionId: string;
  sequence: number;
  eventRoot: string;
}

export interface VSRSharedCommitCandidate {
  format: 'vsr.shared-interaction-candidate.v0.1';
  candidateId: string;
  sessionId: string;
  replicaId: string;
  baseSequence: number;
  baseEventRoot: string;
  logicalTime: number;
  proposal: VSRInteractionProposal;
  authorization: VSRInteractionAuthorization;
  receipt: VSRInteractionCommitReceipt;
}

export interface VSRSharedRevocationRequest {
  format: 'vsr.shared-revocation-request.v0.1';
  revocationId: string;
  sessionId: string;
  targetKind: 'authority' | 'observer' | 'device' | 'proposal';
  targetId: string;
  revokedBy: string;
  logicalTime: number;
  reason?: string;
  previousEventRoot?: string;
  requestHash?: string;
}

export interface VSRSharedInteractionCommittedPayload {
  candidateId: string;
  replicaId: string;
  proposalHash: string;
  authorizationHash: string;
  commitHash: string;
  authorityId: string;
  observerId?: string;
  deviceId?: string;
  documentHash: string;
  variablePatches: Array<{ target: string; before?: VSRValue; after: VSRValue }>;
  beforeSharedStateHash: string;
  afterSharedStateHash: string;
  mergeMode: VSRSharedMergeMode;
}

export interface VSRSharedAuthorityRevokedPayload {
  revocationId: string;
  targetKind: VSRSharedRevocationRequest['targetKind'];
  targetId: string;
  revokedBy: string;
  reason?: string;
  requestHash: string;
}

export interface VSRSharedSnapshotPayload {
  snapshotHash: string;
  stateHash: string;
  sourceSequence: number;
  sourceEventRoot: string;
}

export type VSRSharedEventPayload =
  | VSRSharedInteractionCommittedPayload
  | VSRSharedAuthorityRevokedPayload
  | VSRSharedSnapshotPayload;

export interface VSRSharedRealityEvent {
  format: 'vsr.shared-reality-event.v0.1';
  sessionId: string;
  sequence: number;
  type: 'interaction.committed' | 'authority.revoked' | 'snapshot.published';
  logicalTime: number;
  payload: VSRSharedEventPayload;
  previousEventHash: string;
  eventHash: string;
}

export interface VSRSharedRealitySnapshot {
  format: 'vsr.shared-reality-snapshot.v0.1';
  runtime: 'vsr@0.1.0-alpha.12';
  sessionId: string;
  documentHash: string;
  sequence: number;
  eventRoot: string;
  variables: Record<string, VSRValue>;
  revoked: {
    authorities: string[];
    observers: string[];
    devices: string[];
    proposals: string[];
  };
  stateHash: string;
  snapshotHash: string;
}

export interface VSRSharedSyncBatch {
  format: 'vsr.shared-reality-sync-batch.v0.1';
  sessionId: string;
  fromSequence: number;
  toSequence: number;
  fromEventRoot: string;
  toEventRoot: string;
  events: VSRSharedRealityEvent[];
  batchHash: string;
}

export interface VSRSharedCommitAccepted {
  ok: true;
  status: 'committed';
  mergeMode: VSRSharedMergeMode;
  event: VSRSharedRealityEvent;
  snapshot: VSRSharedRealitySnapshot;
}

export interface VSRSharedCommitRejected {
  ok: false;
  status: 'rejected';
  code: VSRSharedRejectCode;
  reason: string;
  conflictTargets?: string[];
  currentCursor: VSRSharedCursor;
}

export type VSRSharedCommitResult = VSRSharedCommitAccepted | VSRSharedCommitRejected;

function getPath(target: unknown, path: string): unknown {
  let cursor = target;
  for (const part of path.replace(/^vars\./, '').split('.').filter(Boolean)) {
    if (cursor === null || typeof cursor !== 'object' || !Object.prototype.hasOwnProperty.call(cursor, part)) return undefined;
    cursor = (cursor as Record<string, unknown>)[part];
  }
  return cursor;
}

function setPath(target: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.replace(/^vars\./, '').split('.').filter(Boolean);
  if (!parts.length) throw new Error('Shared reality patch target cannot be empty.');
  let cursor = target;
  for (let index = 0; index < parts.length - 1; index++) {
    const part = parts[index]!;
    const current = cursor[part];
    if (!current || typeof current !== 'object' || Array.isArray(current)) cursor[part] = {};
    cursor = cursor[part] as Record<string, unknown>;
  }
  cursor[parts.at(-1)!] = deepClone(value);
}

function withoutField<T extends Record<string, unknown>>(value: T, field: string): Record<string, unknown> {
  const copy = deepClone(value) as Record<string, unknown>;
  delete copy[field];
  return copy;
}

function validateReceipt(receipt: VSRInteractionCommitReceipt): boolean {
  if (receipt.format !== 'vsr.interaction-commit-receipt.v0.1') return false;
  return cryptographicHash(withoutField(receipt as unknown as Record<string, unknown>, 'commitHash')) === receipt.commitHash;
}

function eventHashInput(event: Omit<VSRSharedRealityEvent, 'eventHash'>): unknown {
  return event;
}

export function sealSharedRealityEvent(event: Omit<VSRSharedRealityEvent, 'eventHash'> & { eventHash?: string }): VSRSharedRealityEvent {
  if (event.format !== 'vsr.shared-reality-event.v0.1') throw new Error('Unsupported shared reality event format.');
  if (!event.sessionId) throw new Error('Shared reality event requires sessionId.');
  if (!Number.isInteger(event.sequence) || event.sequence <= 0) throw new Error('Shared reality event sequence must be positive.');
  if (!Number.isFinite(event.logicalTime) || event.logicalTime < 0) throw new Error('Shared reality event logicalTime must be non-negative.');
  const eventHash = cryptographicHash(eventHashInput({
    format: event.format,
    sessionId: event.sessionId,
    sequence: event.sequence,
    type: event.type,
    logicalTime: event.logicalTime,
    payload: deepClone(event.payload),
    previousEventHash: event.previousEventHash,
  }));
  if (event.eventHash !== undefined && event.eventHash !== eventHash) throw new Error(`Shared reality event hash mismatch at sequence ${event.sequence}.`);
  return { ...deepClone(event), eventHash } as VSRSharedRealityEvent;
}

export function verifySharedRealityEventChain(events: VSRSharedRealityEvent[], sessionId?: string, initialRoot = ''): { ok: boolean; eventRoot: string; sequence: number; error?: string } {
  let previous = initialRoot;
  let sequence = 0;
  try {
    for (const event of events) {
      if (sessionId && event.sessionId !== sessionId) throw new Error(`Shared reality session mismatch at sequence ${event.sequence}.`);
      if (event.sequence !== sequence + 1) throw new Error(`Shared reality sequence gap at ${event.sequence}.`);
      if (event.previousEventHash !== previous) throw new Error(`Shared reality previous root mismatch at ${event.sequence}.`);
      const sealed = sealSharedRealityEvent(event);
      previous = sealed.eventHash;
      sequence = sealed.sequence;
    }
    return { ok: true, eventRoot: previous, sequence };
  } catch (error) {
    return { ok: false, eventRoot: previous, sequence, error: error instanceof Error ? error.message : String(error) };
  }
}

function snapshotHashInput(snapshot: Omit<VSRSharedRealitySnapshot, 'snapshotHash'>): unknown {
  return snapshot;
}

export class VSRSharedRealityCoordinator {
  readonly sessionId: string;
  readonly documentHash: string;
  private variables: Record<string, VSRValue>;
  private events: VSRSharedRealityEvent[] = [];
  private rootsBySequence = new Map<number, string>([[0, '']]);
  private lastModifiedByTarget = new Map<string, number>();
  private revokedAuthorities = new Set<string>();
  private revokedObservers = new Set<string>();
  private revokedDevices = new Set<string>();
  private revokedProposals = new Set<string>();
  private listeners = new Set<(event: VSRSharedRealityEvent) => void>();

  constructor(options: { sessionId: string; documentHash: string; initialVariables?: Record<string, VSRValue> }) {
    if (!options.sessionId) throw new Error('Shared reality coordinator requires sessionId.');
    if (!options.documentHash) throw new Error('Shared reality coordinator requires documentHash.');
    this.sessionId = options.sessionId;
    this.documentHash = options.documentHash;
    this.variables = deepClone(options.initialVariables ?? {});
  }

  cursor(): VSRSharedCursor {
    return { format: 'vsr.shared-reality-cursor.v0.1', sessionId: this.sessionId, sequence: this.events.length, eventRoot: this.events.at(-1)?.eventHash ?? '' };
  }

  state(): VSRState {
    return { variables: deepClone(this.variables), interaction: {}, runtime: { sharedSequence: this.events.length, sharedEventRoot: this.cursor().eventRoot } };
  }

  snapshot(): VSRSharedRealitySnapshot {
    const base: Omit<VSRSharedRealitySnapshot, 'snapshotHash'> = {
      format: 'vsr.shared-reality-snapshot.v0.1',
      runtime: 'vsr@0.1.0-alpha.12',
      sessionId: this.sessionId,
      documentHash: this.documentHash,
      sequence: this.events.length,
      eventRoot: this.cursor().eventRoot,
      variables: deepClone(this.variables),
      revoked: {
        authorities: [...this.revokedAuthorities].sort(),
        observers: [...this.revokedObservers].sort(),
        devices: [...this.revokedDevices].sort(),
        proposals: [...this.revokedProposals].sort(),
      },
      stateHash: cryptographicHash(this.variables),
    };
    return { ...base, snapshotHash: cryptographicHash(snapshotHashInput(base)) };
  }

  subscribe(listener: (event: VSRSharedRealityEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private append(type: VSRSharedRealityEvent['type'], logicalTime: number, payload: VSRSharedEventPayload): VSRSharedRealityEvent {
    const sequence = this.events.length + 1;
    const previousEventHash = this.events.at(-1)?.eventHash ?? '';
    const event = sealSharedRealityEvent({
      format: 'vsr.shared-reality-event.v0.1',
      sessionId: this.sessionId,
      sequence,
      type,
      logicalTime,
      payload,
      previousEventHash,
    });
    this.events.push(event);
    this.rootsBySequence.set(sequence, event.eventHash);
    for (const listener of this.listeners) listener(deepClone(event));
    return event;
  }

  private reject(code: VSRSharedRejectCode, reason: string, conflictTargets?: string[]): VSRSharedCommitRejected {
    return { ok: false, status: 'rejected', code, reason, conflictTargets, currentCursor: this.cursor() };
  }

  submit(candidate: VSRSharedCommitCandidate): VSRSharedCommitResult {
    try {
      if (candidate.format !== 'vsr.shared-interaction-candidate.v0.1' || candidate.sessionId !== this.sessionId || !candidate.candidateId || !candidate.replicaId) {
        return this.reject('invalid-candidate', 'Candidate identity or format is invalid.');
      }
      if (candidate.proposal.documentHash !== this.documentHash || candidate.receipt.documentHash !== this.documentHash) {
        return this.reject('document-mismatch', 'Candidate document hash does not match coordinator document.');
      }
      if (candidate.receipt.status !== 'committed') return this.reject('receipt-not-committed', 'Only locally committed interactions can enter shared coordination.');
      const authorization = sealInteractionAuthorization(candidate.authorization);
      if (candidate.proposal.proposalHash !== candidate.receipt.proposalHash || authorization.proposalHash !== candidate.proposal.proposalHash || authorization.authorizationHash !== candidate.receipt.authorizationHash || !validateReceipt(candidate.receipt)) {
        return this.reject('invalid-candidate', 'Proposal, authorization, or receipt hash binding is invalid.');
      }
      if (this.revokedAuthorities.has(authorization.authorityId)) return this.reject('authority-revoked', `Authority ${authorization.authorityId} has been revoked.`);
      if (candidate.proposal.input.observerId && this.revokedObservers.has(candidate.proposal.input.observerId)) return this.reject('observer-revoked', `Observer ${candidate.proposal.input.observerId} has been revoked.`);
      if (candidate.proposal.input.deviceId && this.revokedDevices.has(candidate.proposal.input.deviceId)) return this.reject('device-revoked', `Device ${candidate.proposal.input.deviceId} has been revoked.`);
      if (this.revokedProposals.has(candidate.proposal.proposalHash)) return this.reject('proposal-revoked', `Proposal ${candidate.proposal.proposalHash} has been revoked.`);

      const knownBaseRoot = this.rootsBySequence.get(candidate.baseSequence);
      if (knownBaseRoot === undefined || knownBaseRoot !== candidate.baseEventRoot) return this.reject('unknown-base-root', 'Candidate base sequence/root is not in the canonical shared event chain.');
      const currentSequence = this.events.length;
      const conflictTargets = candidate.proposal.variablePatches
        .map(patch => patch.target.replace(/^vars\./, ''))
        .filter(target => (this.lastModifiedByTarget.get(target) ?? 0) > candidate.baseSequence)
        .sort();
      if (conflictTargets.length) return this.reject('overlapping-write-conflict', 'At least one variable target changed after the candidate base revision.', conflictTargets);

      for (const patch of candidate.proposal.variablePatches) {
        const target = patch.target.replace(/^vars\./, '');
        const current = getPath(this.variables, target);
        if (cryptographicHash(current ?? null) !== cryptographicHash(patch.before ?? null)) {
          return this.reject('overlapping-write-conflict', `Variable ${target} no longer matches the proposal before-value.`, [target]);
        }
      }

      const beforeSharedStateHash = cryptographicHash(this.variables);
      for (const patch of candidate.proposal.variablePatches) setPath(this.variables as Record<string, unknown>, patch.target, patch.after);
      const afterSharedStateHash = cryptographicHash(this.variables);
      const mergeMode: VSRSharedMergeMode = candidate.baseSequence === currentSequence ? 'direct' : 'disjoint-rebase';
      const payload: VSRSharedInteractionCommittedPayload = {
        candidateId: candidate.candidateId,
        replicaId: candidate.replicaId,
        proposalHash: candidate.proposal.proposalHash,
        authorizationHash: authorization.authorizationHash!,
        commitHash: candidate.receipt.commitHash,
        authorityId: authorization.authorityId,
        observerId: candidate.proposal.input.observerId,
        deviceId: candidate.proposal.input.deviceId,
        documentHash: this.documentHash,
        variablePatches: deepClone(candidate.proposal.variablePatches),
        beforeSharedStateHash,
        afterSharedStateHash,
        mergeMode,
      };
      const event = this.append('interaction.committed', candidate.logicalTime, payload);
      for (const patch of candidate.proposal.variablePatches) this.lastModifiedByTarget.set(patch.target.replace(/^vars\./, ''), event.sequence);
      return { ok: true, status: 'committed', mergeMode, event, snapshot: this.snapshot() };
    } catch (error) {
      return this.reject('invalid-candidate', error instanceof Error ? error.message : String(error));
    }
  }

  revoke(request: VSRSharedRevocationRequest): VSRSharedRealityEvent {
    if (request.format !== 'vsr.shared-revocation-request.v0.1' || request.sessionId !== this.sessionId) throw new Error('Invalid shared revocation request.');
    if (!request.revocationId || !request.targetId || !request.revokedBy) throw new Error('Shared revocation request is incomplete.');
    if (!Number.isFinite(request.logicalTime) || request.logicalTime < 0) throw new Error('Shared revocation logicalTime must be non-negative.');
    if (request.previousEventRoot !== undefined && request.previousEventRoot !== this.cursor().eventRoot) throw new Error('Shared revocation request is stale.');
    const unsigned = {
      format: request.format,
      revocationId: request.revocationId,
      sessionId: request.sessionId,
      targetKind: request.targetKind,
      targetId: request.targetId,
      revokedBy: request.revokedBy,
      logicalTime: request.logicalTime,
      reason: request.reason ?? '',
      previousEventRoot: this.cursor().eventRoot,
    };
    const requestHash = cryptographicHash(unsigned);
    if (request.requestHash !== undefined && request.requestHash !== requestHash) throw new Error('Shared revocation request hash mismatch.');
    const target = request.targetId;
    if (request.targetKind === 'authority') this.revokedAuthorities.add(target);
    else if (request.targetKind === 'observer') this.revokedObservers.add(target);
    else if (request.targetKind === 'device') this.revokedDevices.add(target);
    else this.revokedProposals.add(target);
    return this.append('authority.revoked', request.logicalTime, {
      revocationId: request.revocationId,
      targetKind: request.targetKind,
      targetId: target,
      revokedBy: request.revokedBy,
      reason: request.reason,
      requestHash,
    });
  }

  eventsAfter(cursor: VSRSharedCursor): VSRSharedSyncBatch {
    if (cursor.format !== 'vsr.shared-reality-cursor.v0.1' || cursor.sessionId !== this.sessionId) throw new Error('Invalid shared cursor.');
    const known = this.rootsBySequence.get(cursor.sequence);
    if (known === undefined || known !== cursor.eventRoot) throw new Error('Shared cursor root is not canonical.');
    const events = this.events.slice(cursor.sequence).map(event => deepClone(event));
    const result = {
      format: 'vsr.shared-reality-sync-batch.v0.1' as const,
      sessionId: this.sessionId,
      fromSequence: cursor.sequence,
      toSequence: this.events.length,
      fromEventRoot: cursor.eventRoot,
      toEventRoot: this.cursor().eventRoot,
      events,
    };
    return { ...result, batchHash: cryptographicHash(result) };
  }

  publishSnapshot(logicalTime: number): VSRSharedRealityEvent {
    const snapshot = this.snapshot();
    return this.append('snapshot.published', logicalTime, {
      snapshotHash: snapshot.snapshotHash,
      stateHash: snapshot.stateHash,
      sourceSequence: snapshot.sequence,
      sourceEventRoot: snapshot.eventRoot,
    });
  }
}

export class VSRSharedRealityReplica {
  readonly replicaId: string;
  readonly sessionId: string;
  private documentHash: string;
  private variables: Record<string, VSRValue>;
  private sequence = 0;
  private eventRoot = '';
  private revokedAuthorities = new Set<string>();
  private revokedObservers = new Set<string>();
  private revokedDevices = new Set<string>();
  private revokedProposals = new Set<string>();

  constructor(options: { replicaId: string; sessionId: string; documentHash: string; initialVariables?: Record<string, VSRValue> }) {
    this.replicaId = options.replicaId;
    this.sessionId = options.sessionId;
    this.documentHash = options.documentHash;
    this.variables = deepClone(options.initialVariables ?? {});
  }

  cursor(): VSRSharedCursor {
    return { format: 'vsr.shared-reality-cursor.v0.1', sessionId: this.sessionId, sequence: this.sequence, eventRoot: this.eventRoot };
  }

  state(): Record<string, VSRValue> { return deepClone(this.variables); }

  hydrate(snapshot: VSRSharedRealitySnapshot): void {
    const { snapshotHash, ...body } = snapshot;
    if (snapshot.format !== 'vsr.shared-reality-snapshot.v0.1' || snapshot.sessionId !== this.sessionId || snapshot.documentHash !== this.documentHash) throw new Error('Shared snapshot identity mismatch.');
    if (cryptographicHash(body) !== snapshotHash) throw new Error('Shared snapshot hash mismatch.');
    this.variables = deepClone(snapshot.variables);
    this.sequence = snapshot.sequence;
    this.eventRoot = snapshot.eventRoot;
    this.revokedAuthorities = new Set(snapshot.revoked.authorities);
    this.revokedObservers = new Set(snapshot.revoked.observers);
    this.revokedDevices = new Set(snapshot.revoked.devices);
    this.revokedProposals = new Set(snapshot.revoked.proposals);
  }

  applyBatch(batch: VSRSharedSyncBatch): void {
    if (batch.format !== 'vsr.shared-reality-sync-batch.v0.1' || batch.sessionId !== this.sessionId) throw new Error('Shared sync batch identity mismatch.');
    const { batchHash, ...body } = batch;
    if (cryptographicHash(body) !== batchHash) throw new Error('Shared sync batch hash mismatch.');
    if (batch.fromSequence !== this.sequence || batch.fromEventRoot !== this.eventRoot) throw new Error('Shared sync batch does not continue replica cursor.');
    let previous = this.eventRoot;
    let expectedSequence = this.sequence + 1;
    for (const event of batch.events) {
      if (event.sequence !== expectedSequence || event.previousEventHash !== previous) throw new Error(`Shared sync chain mismatch at sequence ${event.sequence}.`);
      const sealed = sealSharedRealityEvent(event);
      if (sealed.type === 'interaction.committed') {
        const payload = sealed.payload as VSRSharedInteractionCommittedPayload;
        if (payload.documentHash !== this.documentHash) throw new Error('Shared interaction document mismatch.');
        for (const patch of payload.variablePatches) setPath(this.variables as Record<string, unknown>, patch.target, patch.after);
        if (cryptographicHash(this.variables) !== payload.afterSharedStateHash) throw new Error(`Shared state hash mismatch at sequence ${sealed.sequence}.`);
      } else if (sealed.type === 'authority.revoked') {
        const payload = sealed.payload as VSRSharedAuthorityRevokedPayload;
        if (payload.targetKind === 'authority') this.revokedAuthorities.add(payload.targetId);
        else if (payload.targetKind === 'observer') this.revokedObservers.add(payload.targetId);
        else if (payload.targetKind === 'device') this.revokedDevices.add(payload.targetId);
        else this.revokedProposals.add(payload.targetId);
      }
      previous = sealed.eventHash;
      expectedSequence += 1;
      this.sequence = sealed.sequence;
      this.eventRoot = sealed.eventHash;
    }
    if (this.sequence !== batch.toSequence || this.eventRoot !== batch.toEventRoot) throw new Error('Shared sync batch terminal cursor mismatch.');
  }

  revocationState(): VSRSharedRealitySnapshot['revoked'] {
    return {
      authorities: [...this.revokedAuthorities].sort(),
      observers: [...this.revokedObservers].sort(),
      devices: [...this.revokedDevices].sort(),
      proposals: [...this.revokedProposals].sort(),
    };
  }
}
