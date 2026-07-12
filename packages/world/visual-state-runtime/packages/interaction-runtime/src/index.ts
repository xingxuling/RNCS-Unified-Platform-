import { VSRRuntimeSession } from '../../core/src/index.js';
import { evaluateExpression } from '../../expression/src/index.js';
import {
  cryptographicHash,
  deepClone,
  documentHash,
  semanticHash,
  type VSRContext,
  type VSRDocument,
  type VSRInteraction,
  type VSRState,
  type VSRValue,
  type VSRValueSource,
} from '../../spec/src/index.js';

export interface VSRInputEvent {
  format: 'vsr.input-event.v0.1';
  inputId: string;
  trigger: VSRInteraction['trigger'];
  nodeId: string;
  logicalTime: number;
  pointer?: { x: number; y: number };
  key?: string;
  payload?: Record<string, VSRValue>;
  observerId?: string;
  deviceId?: string;
}

export interface VSRInteractionVariablePatch {
  target: string;
  before?: VSRValue;
  after: VSRValue;
}

export interface VSRInteractionEmission {
  interactionId: string;
  event: string;
  payload: Record<string, VSRValue>;
}

export interface VSRInteractionEvidence {
  sourceDisplayHash: string;
  observerDisplayHash?: string;
  deviceDisplayHash?: string;
  realityInvariantHash?: string;
  eventChainRoot?: string;
}

export interface VSRInteractionProposal {
  format: 'vsr.interaction-proposal.v0.1';
  runtime: 'vsr@0.1.0-alpha.12';
  proposalId: string;
  status: 'provisional';
  documentHash: string;
  input: VSRInputEvent;
  matchedInteractionIds: string[];
  variablePatches: VSRInteractionVariablePatch[];
  emissions: VSRInteractionEmission[];
  requestedSeek?: number;
  baseStateHash: string;
  proposedStateHash: string;
  evidence: VSRInteractionEvidence;
  previousProposalHash?: string;
  proposalHash: string;
}

export interface VSRInteractionAuthorization {
  format: 'vsr.interaction-authorization.v0.1';
  proposalHash: string;
  decision: 'approved' | 'denied';
  authorityId: string;
  grantedScopes?: string[];
  reason?: string;
  evidenceRoot?: string;
  logicalTime: number;
  authorizationHash?: string;
}

export interface VSRInteractionCommitReceipt {
  format: 'vsr.interaction-commit-receipt.v0.1';
  runtime: 'vsr@0.1.0-alpha.12';
  proposalHash: string;
  authorizationHash: string;
  status: 'committed' | 'denied' | 'stale' | 'invalid';
  documentHash: string;
  beforeStateHash: string;
  afterStateHash: string;
  sourceDisplayHash: string;
  finalDisplayHash: string;
  emissions: VSRInteractionEmission[];
  reason?: string;
  authorityEvidenceRoot?: string;
  commitHash: string;
}

export interface VSRInteractionCommitResult {
  receipt: VSRInteractionCommitReceipt;
  state: VSRState;
}

function getPath(target: unknown, path: string): unknown {
  let cursor = target;
  for (const part of path.split('.').filter(Boolean)) {
    if (cursor === null || typeof cursor !== 'object' || !Object.prototype.hasOwnProperty.call(cursor, part)) return undefined;
    cursor = (cursor as Record<string, unknown>)[part];
  }
  return cursor;
}

function setPath(target: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.replace(/^vars\./, '').split('.').filter(Boolean);
  if (!parts.length) throw new Error('Interaction variable target cannot be empty.');
  let cursor = target;
  for (let index = 0; index < parts.length - 1; index++) {
    const part = parts[index]!;
    const current = cursor[part];
    if (!current || typeof current !== 'object' || Array.isArray(current)) cursor[part] = {};
    cursor = cursor[part] as Record<string, unknown>;
  }
  cursor[parts.at(-1)!] = deepClone(value);
}

function resolveSource(source: VSRValueSource, state: VSRState, context: VSRContext, input: VSRInputEvent, seed: number, scopeId: string): VSRValue {
  const candidate = source && typeof source === 'object' && !Array.isArray(source) ? source as Record<string, unknown> : undefined;
  const binding = typeof candidate?.binding === 'string' ? candidate.binding : undefined;
  const expression = typeof candidate?.expression === 'string' ? candidate.expression : undefined;
  if (!binding && !expression) return deepClone(source as VSRValue);
  if (binding) {
    const value = getPath({ vars: state.variables, context, input: { ...input.payload, pointerX: input.pointer?.x, pointerY: input.pointer?.y, key: input.key } }, binding);
    return deepClone((value ?? null) as VSRValue);
  }
  return evaluateExpression(expression!, {
    time: input.logicalTime,
    frame: Math.floor(input.logicalTime * context.fps),
    fps: context.fps,
    vars: state.variables,
    context: context as unknown as Record<string, VSRValue>,
    input: { ...(input.payload ?? {}), pointerX: input.pointer?.x ?? 0, pointerY: input.pointer?.y ?? 0, key: input.key ?? '' },
    seed,
    scopeId,
  });
}

function proposalHashInput(proposal: Omit<VSRInteractionProposal, 'proposalHash'>): unknown {
  return proposal;
}

function proposalWithoutHash(proposal: VSRInteractionProposal): Omit<VSRInteractionProposal, 'proposalHash'> {
  const { proposalHash: _proposalHash, ...rest } = proposal;
  return rest;
}

export function sealInteractionAuthorization(input: VSRInteractionAuthorization): VSRInteractionAuthorization {
  if (input.format !== 'vsr.interaction-authorization.v0.1') throw new Error(`Unsupported interaction authorization format: ${String(input.format)}`);
  if (!input.proposalHash) throw new Error('Interaction authorization requires proposalHash.');
  if (!input.authorityId) throw new Error('Interaction authorization requires authorityId.');
  if (!Number.isFinite(input.logicalTime) || input.logicalTime < 0) throw new Error('Interaction authorization logicalTime must be non-negative.');
  const hash = cryptographicHash({
    format: input.format,
    proposalHash: input.proposalHash,
    decision: input.decision,
    authorityId: input.authorityId,
    grantedScopes: [...new Set(input.grantedScopes ?? [])].sort(),
    reason: input.reason ?? '',
    evidenceRoot: input.evidenceRoot ?? '',
    logicalTime: input.logicalTime,
  });
  if (input.authorizationHash !== undefined && input.authorizationHash !== hash) throw new Error('Interaction authorization hash mismatch.');
  return { ...deepClone(input), grantedScopes: [...new Set(input.grantedScopes ?? [])].sort(), authorizationHash: hash };
}

export class VSRInteractionController {
  readonly document: VSRDocument;
  readonly runtime: VSRRuntimeSession;
  private previousProposalHash = '';

  constructor(document: VSRDocument, runtime: VSRRuntimeSession) {
    this.document = deepClone(document);
    this.runtime = runtime;
  }

  reset(): void { this.previousProposalHash = ''; }

  propose(input: VSRInputEvent, evidence?: Partial<VSRInteractionEvidence>): VSRInteractionProposal {
    if (input.format !== 'vsr.input-event.v0.1') throw new Error(`Unsupported input event format: ${String(input.format)}`);
    if (!input.inputId) throw new Error('Input event requires inputId.');
    if (!input.nodeId) throw new Error('Input event requires nodeId.');
    if (!Number.isFinite(input.logicalTime) || input.logicalTime < 0) throw new Error('Input event logicalTime must be non-negative.');
    const evaluation = this.runtime.evaluate(input.logicalTime);
    const context: VSRContext = {
      width: evaluation.displayState.viewport.width,
      height: evaluation.displayState.viewport.height,
      aspect: evaluation.displayState.viewport.width / evaluation.displayState.viewport.height,
      dpr: evaluation.displayState.viewport.dpr,
      locale: 'zh-CN',
      fps: this.document.metadata.defaultFps,
      input: { pointerX: input.pointer?.x, pointerY: input.pointer?.y, keys: input.key ? [input.key] : [] },
    };
    const matching = (this.document.interactions ?? [])
      .filter(interaction => interaction.nodeId === input.nodeId && interaction.trigger === input.trigger)
      .sort((a, b) => a.id.localeCompare(b.id));
    const nextVariables = deepClone(evaluation.state.variables);
    const variablePatches: VSRInteractionVariablePatch[] = [];
    const emissions: VSRInteractionEmission[] = [];
    let requestedSeek: number | undefined;
    for (const interaction of matching) {
      if (interaction.action.type === 'setVariable') {
        const target = interaction.action.target.replace(/^vars\./, '');
        const before = getPath(nextVariables, target) as VSRValue | undefined;
        const after = resolveSource(interaction.action.value, evaluation.state, context, input, this.document.metadata.seed, interaction.id);
        setPath(nextVariables as Record<string, unknown>, target, after);
        variablePatches.push({ target, before: deepClone(before), after: deepClone(after) });
      } else if (interaction.action.type === 'emit') {
        const payload: Record<string, VSRValue> = {};
        for (const [key, value] of Object.entries(interaction.action.payload ?? {})) payload[key] = resolveSource(value, evaluation.state, context, input, this.document.metadata.seed, `${interaction.id}:${key}`);
        emissions.push({ interactionId: interaction.id, event: interaction.action.event, payload });
      } else if (interaction.action.type === 'seek') {
        const value = resolveSource(interaction.action.time, evaluation.state, context, input, this.document.metadata.seed, interaction.id);
        const number = Number(value);
        if (!Number.isFinite(number)) throw new Error(`Interaction ${interaction.id} resolved seek time is not finite.`);
        requestedSeek = Math.max(0, Math.min(this.document.metadata.duration, number));
      }
    }
    const proposedState: VSRState = { ...deepClone(evaluation.state), variables: nextVariables };
    const proposalBase: Omit<VSRInteractionProposal, 'proposalHash'> = {
      format: 'vsr.interaction-proposal.v0.1',
      runtime: 'vsr@0.1.0-alpha.12',
      proposalId: `proposal:${input.inputId}`,
      status: 'provisional',
      documentHash: documentHash(this.document),
      input: deepClone(input),
      matchedInteractionIds: matching.map(interaction => interaction.id),
      variablePatches,
      emissions,
      requestedSeek,
      baseStateHash: semanticHash(evaluation.state),
      proposedStateHash: semanticHash(proposedState),
      evidence: {
        sourceDisplayHash: evidence?.sourceDisplayHash ?? evaluation.displayState.semanticHash,
        observerDisplayHash: evidence?.observerDisplayHash,
        deviceDisplayHash: evidence?.deviceDisplayHash,
        realityInvariantHash: evidence?.realityInvariantHash,
        eventChainRoot: evidence?.eventChainRoot,
      },
      previousProposalHash: this.previousProposalHash || undefined,
    };
    const proposalHash = cryptographicHash(proposalHashInput(proposalBase));
    const proposal = { ...proposalBase, proposalHash };
    this.previousProposalHash = proposalHash;
    return proposal;
  }

  commit(proposal: VSRInteractionProposal, authorizationInput: VSRInteractionAuthorization): VSRInteractionCommitResult {
    const authorization = sealInteractionAuthorization(authorizationInput);
    const before = this.runtime.evaluate(proposal.input.logicalTime);
    const beforeStateHash = semanticHash(before.state);
    let status: VSRInteractionCommitReceipt['status'] = 'committed';
    let reason: string | undefined;
    if (cryptographicHash(proposalHashInput(proposalWithoutHash(proposal))) !== proposal.proposalHash) {
      status = 'invalid';
      reason = 'proposal-hash-mismatch';
    } else if (authorization.proposalHash !== proposal.proposalHash) {
      status = 'invalid';
      reason = 'authorization-proposal-mismatch';
    } else if (authorization.decision === 'denied') {
      status = 'denied';
      reason = authorization.reason ?? 'authority-denied';
    } else if (beforeStateHash !== proposal.baseStateHash || before.displayState.semanticHash !== proposal.evidence.sourceDisplayHash) {
      status = 'stale';
      reason = 'optimistic-concurrency-conflict';
    }

    if (status === 'committed') {
      const variables = deepClone(before.state.variables);
      for (const patch of proposal.variablePatches) setPath(variables as Record<string, unknown>, patch.target, patch.after);
      this.runtime.replaceVariables(variables);
      this.runtime.setInteractionState({
        lastProposalHash: proposal.proposalHash,
        lastInputId: proposal.input.inputId,
        lastNodeId: proposal.input.nodeId,
        lastTrigger: proposal.input.trigger,
      });
      if (proposal.requestedSeek !== undefined) this.runtime.clock.seek(proposal.requestedSeek);
    }

    const after = this.runtime.evaluate(proposal.requestedSeek ?? proposal.input.logicalTime);
    const receiptBase = {
      format: 'vsr.interaction-commit-receipt.v0.1' as const,
      runtime: 'vsr@0.1.0-alpha.12' as const,
      proposalHash: proposal.proposalHash,
      authorizationHash: authorization.authorizationHash!,
      status,
      documentHash: proposal.documentHash,
      beforeStateHash,
      afterStateHash: semanticHash(after.state),
      sourceDisplayHash: proposal.evidence.sourceDisplayHash,
      finalDisplayHash: after.displayState.semanticHash,
      emissions: status === 'committed' ? deepClone(proposal.emissions) : [],
      reason,
      authorityEvidenceRoot: authorization.evidenceRoot,
    };
    const commitHash = cryptographicHash(receiptBase);
    return { receipt: { ...receiptBase, commitHash }, state: deepClone(after.state) };
  }
}
