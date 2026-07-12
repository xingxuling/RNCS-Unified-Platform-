import {
  deepClone,
  documentHash,
  semanticHash,
  type VSRDisplayItem,
  type VSRDisplayState,
  type VSRDocument,
  type VSRNode,
  type VSRPaint,
  type VSRValue,
} from '../../spec/src/index.js';
import { VSR_RUNTIME_VERSION } from '../../core/src/index.js';

export type VSRObserverDecision = 'show' | 'redact' | 'hide';

export interface VSRObserverProfile {
  format: 'vsr.observer-profile.v0.1';
  observerId: string;
  subjectId?: string;
  roles?: string[];
  scopes?: string[];
  clearance?: number;
  locale?: string;
  claims?: Record<string, VSRValue>;
}

export interface VSRObserverPolicy {
  format?: 'vsr.observer-policy.v0.1';
  anyRole?: string[];
  allRoles?: string[];
  anyScope?: string[];
  allScopes?: string[];
  minClearance?: number;
  subjectIds?: string[];
  observerIds?: string[];
  deny?: Exclude<VSRObserverDecision, 'show'>;
  redactionText?: string;
  reason?: string;
}

export interface VSRObserverProjectionOptions {
  invariant?: Record<string, VSRValue>;
  defaultDecision?: VSRObserverDecision;
  redactionText?: string;
  diagnostics?: 'auto' | 'inherit' | 'omit';
}

export interface VSRPreparedObserverProjection {
  document: Readonly<VSRDocument>;
  documentHash: string;
  nodeById: Map<string, VSRNode>;
  parentById: Map<string, string | undefined>;
  policyByNode: Map<string, VSRObserverPolicy>;
  policyHash: string;
  decisionPlanByObserverHash: Map<string, Map<string, VSRObserverNodeDecision>>;
}

export interface VSRObserverNodeDecision {
  nodeId: string;
  decision: VSRObserverDecision;
  reason: string;
  policyNodeId?: string;
}

export interface VSRObserverProjectionManifest {
  format: 'vsr.observer-projection-manifest.v0.1';
  runtime: string;
  observerId: string;
  observerHash: string;
  sourceDocumentHash: string;
  sourceDisplayHash: string;
  projectedDisplayHash: string;
  invariantHash: string;
  policyHash: string;
  shownNodeIds: string[];
  redactedNodeIds: string[];
  hiddenNodeIds: string[];
  decisions: VSRObserverNodeDecision[];
}

export interface VSRObserverProjection {
  observer: VSRObserverProfile;
  displayState: VSRDisplayState;
  manifest: VSRObserverProjectionManifest;
}

export interface VSRObserverProjectionVerification {
  ok: boolean;
  sourceDisplayHash?: string;
  invariantHash?: string;
  observerCount: number;
  projectedDisplayHashes: string[];
  diagnostics: string[];
}

const POLICY_KEY = 'vsr:observer-policy';
const REDACTION_PAINT: VSRPaint = { type: 'solid', color: '#5d6b7a' };

function unique(values: string[] | undefined): string[] {
  return [...new Set((values ?? []).filter(Boolean))].sort();
}

export function normalizeObserverProfile(input: VSRObserverProfile): VSRObserverProfile {
  if (input.format !== 'vsr.observer-profile.v0.1') throw new Error(`Unsupported observer profile format: ${input.format}`);
  if (!input.observerId) throw new Error('Observer profile requires observerId.');
  const clearance = Number(input.clearance ?? 0);
  if (!Number.isFinite(clearance) || clearance < 0) throw new Error('Observer clearance must be a finite non-negative number.');
  return {
    format: 'vsr.observer-profile.v0.1',
    observerId: input.observerId,
    subjectId: input.subjectId,
    roles: unique(input.roles),
    scopes: unique(input.scopes),
    clearance,
    locale: input.locale ?? 'zh-CN',
    claims: deepClone(input.claims ?? {}),
  };
}

export function observerHash(observer: VSRObserverProfile): string {
  return semanticHash(normalizeObserverProfile(observer));
}

export function readObserverPolicy(node: VSRNode): VSRObserverPolicy | undefined {
  const value = node.extensions?.[POLICY_KEY];
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const policy = deepClone(value) as VSRObserverPolicy;
  if (policy.format && policy.format !== 'vsr.observer-policy.v0.1') throw new Error(`Unsupported observer policy format on node ${node.id}: ${policy.format}`);
  if (policy.minClearance !== undefined && (!Number.isFinite(policy.minClearance) || policy.minClearance < 0)) throw new Error(`Invalid minClearance on node ${node.id}.`);
  return policy;
}

function intersects(required: string[] | undefined, actual: Set<string>): boolean {
  return !required?.length || required.some(value => actual.has(value));
}
function includesAll(required: string[] | undefined, actual: Set<string>): boolean {
  return !required?.length || required.every(value => actual.has(value));
}

export function evaluateObserverPolicy(policy: VSRObserverPolicy | undefined, observerInput: VSRObserverProfile): { decision: VSRObserverDecision; reason: string } {
  if (!policy) return { decision: 'show', reason: 'public' };
  const observer = normalizeObserverProfile(observerInput);
  const roles = new Set(observer.roles ?? []);
  const scopes = new Set(observer.scopes ?? []);
  const checks: Array<[boolean, string]> = [
    [intersects(policy.anyRole, roles), 'anyRole'],
    [includesAll(policy.allRoles, roles), 'allRoles'],
    [intersects(policy.anyScope, scopes), 'anyScope'],
    [includesAll(policy.allScopes, scopes), 'allScopes'],
    [policy.minClearance === undefined || (observer.clearance ?? 0) >= policy.minClearance, 'minClearance'],
    [!policy.subjectIds?.length || Boolean(observer.subjectId && policy.subjectIds.includes(observer.subjectId)), 'subjectIds'],
    [!policy.observerIds?.length || policy.observerIds.includes(observer.observerId), 'observerIds'],
  ];
  const failed = checks.find(([ok]) => !ok);
  if (!failed) return { decision: 'show', reason: policy.reason ?? 'policy-satisfied' };
  return { decision: policy.deny ?? 'hide', reason: `${policy.reason ?? 'policy-denied'}:${failed[1]}` };
}

export function prepareObserverProjection(document: VSRDocument): VSRPreparedObserverProjection {
  const frozen = deepClone(document);
  const nodeById = new Map(frozen.nodes.map(node => [node.id, node]));
  const parentById = new Map(frozen.nodes.map(node => [node.id, node.parentId]));
  const policyByNode = new Map<string, VSRObserverPolicy>();
  for (const node of frozen.nodes) {
    const policy = readObserverPolicy(node);
    if (policy) policyByNode.set(node.id, policy);
  }
  return {
    document: frozen,
    documentHash: documentHash(frozen),
    nodeById,
    parentById,
    policyByNode,
    policyHash: semanticHash([...policyByNode.entries()].sort(([a], [b]) => a.localeCompare(b))),
    decisionPlanByObserverHash: new Map(),
  };
}

function isPreparedProjection(value: VSRDocument | VSRPreparedObserverProjection): value is VSRPreparedObserverProjection {
  return 'policyByNode' in value && 'nodeById' in value && value.nodeById instanceof Map;
}

function resolveDecision(
  nodeId: string,
  nodeById: Map<string, VSRNode>,
  parentById: Map<string, string | undefined>,
  policyByNode: Map<string, VSRObserverPolicy>,
  observer: VSRObserverProfile,
  defaultDecision: VSRObserverDecision,
  cache: Map<string, VSRObserverNodeDecision>,
): VSRObserverNodeDecision {
  const cached = cache.get(nodeId);
  if (cached) return cached;
  const node = nodeById.get(nodeId);
  if (!node) {
    const missing = { nodeId, decision: defaultDecision, reason: 'node-missing' } satisfies VSRObserverNodeDecision;
    cache.set(nodeId, missing);
    return missing;
  }
  const parentId = parentById.get(nodeId);
  if (parentId) {
    const parentDecision = resolveDecision(parentId, nodeById, parentById, policyByNode, observer, defaultDecision, cache);
    if (parentDecision.decision !== 'show') {
      const inherited = {
        nodeId,
        decision: parentDecision.decision,
        reason: `inherited:${parentDecision.reason}`,
        policyNodeId: parentDecision.policyNodeId ?? parentId,
      } satisfies VSRObserverNodeDecision;
      cache.set(nodeId, inherited);
      return inherited;
    }
  }
  const policy = policyByNode.get(node.id);
  const evaluated = policy ? evaluateObserverPolicy(policy, observer) : { decision: defaultDecision, reason: defaultDecision === 'show' ? 'public' : 'default-policy' };
  const decision = {
    nodeId,
    decision: evaluated.decision,
    reason: evaluated.reason,
    policyNodeId: policy ? nodeId : undefined,
  } satisfies VSRObserverNodeDecision;
  cache.set(nodeId, decision);
  return decision;
}

function observerDecisionPlan(plan: VSRPreparedObserverProjection, observer: VSRObserverProfile, defaultDecision: VSRObserverDecision): Map<string, VSRObserverNodeDecision> {
  const key = `${observerHash(observer)}:${defaultDecision}`;
  const cached = plan.decisionPlanByObserverHash.get(key);
  if (cached) return cached;
  const decisions = new Map<string, VSRObserverNodeDecision>();
  for (const node of plan.document.nodes) resolveDecision(node.id, plan.nodeById, plan.parentById, plan.policyByNode, observer, defaultDecision, decisions);
  plan.decisionPlanByObserverHash.set(key, decisions);
  return decisions;
}

function redactItem(item: VSRDisplayItem, text: string): VSRDisplayItem {
  const copy = deepClone(item);
  copy.opacity = Math.min(copy.opacity, 0.72);
  copy.appearance = { ...copy.appearance, fill: REDACTION_PAINT, stroke: undefined, shadow: undefined, opacity: copy.opacity };
  copy.sourceTrace = { ...(copy.sourceTrace ?? {}), 'observer.projection': 'redacted' };
  if (copy.type === 'text') {
    copy.content = { ...copy.content, text };
  } else if (copy.type === 'image') {
    copy.content = { redacted: true };
  } else {
    copy.content = { ...copy.content, redacted: true };
  }
  return copy;
}

function projectedHash(
  source: VSRDisplayState,
  observer: VSRObserverProfile,
  invariantHash: string,
  decisions: VSRObserverNodeDecision[],
  redactedNodeIds: string[],
  hiddenNodeIds: string[],
): string {
  return semanticHash({
    sourceDocumentHash: source.documentHash,
    sourceDisplayHash: source.semanticHash,
    observerHash: observerHash(observer),
    invariantHash,
    disclosure: decisions.map(decision => [decision.nodeId, decision.decision, decision.policyNodeId ?? '', decision.reason]),
    redactedNodeIds,
    hiddenNodeIds,
    hashMode: 'observer-disclosure-manifest-v1',
  });
}

export function projectDisplayForObserver(
  documentOrPlan: VSRDocument | VSRPreparedObserverProjection,
  source: VSRDisplayState,
  observerInput: VSRObserverProfile,
  options: VSRObserverProjectionOptions = {},
): VSRObserverProjection {
  const observer = normalizeObserverProfile(observerInput);
  const plan = isPreparedProjection(documentOrPlan) ? documentOrPlan : prepareObserverProjection(documentOrPlan);
  if (source.documentHash !== plan.documentHash) throw new Error(`Observer projection document mismatch: expected ${plan.documentHash}, received ${source.documentHash}.`);
  const { nodeById, parentById, policyByNode } = plan;
  const defaultDecision = options.defaultDecision ?? 'show';
  const decisionCache = observerDecisionPlan(plan, observer, defaultDecision);
  const projectedItems: VSRDisplayItem[] = [];
  const shownNodeIds: string[] = [];
  const redactedNodeIds: string[] = [];
  const hiddenNodeIds: string[] = [];

  for (const item of source.items) {
    const decision = decisionCache.get(item.nodeId) ?? resolveDecision(item.nodeId, nodeById, parentById, policyByNode, observer, defaultDecision, decisionCache);
    if (decision.decision === 'hide') {
      hiddenNodeIds.push(item.nodeId);
      continue;
    }
    if (decision.decision === 'redact') {
      const policy = policyByNode.get(item.nodeId);
      projectedItems.push(redactItem(item, policy?.redactionText ?? options.redactionText ?? '•••• 权限受限'));
      redactedNodeIds.push(item.nodeId);
      continue;
    }
    projectedItems.push(item);
    shownNodeIds.push(item.nodeId);
  }

  const decisions = [...decisionCache.values()].sort((a, b) => a.nodeId.localeCompare(b.nodeId));
  const invariantHash = semanticHash(options.invariant ?? {
    documentHash: source.documentHash,
    time: source.time,
    frame: source.frame,
  });
  const semantic = projectedHash(source, observer, invariantHash, decisions, redactedNodeIds, hiddenNodeIds);
  const mayReadDiagnostics = (observer.scopes ?? []).includes('diagnostics.read') || (observer.roles ?? []).some(role => role === 'operator' || role === 'auditor');
  const diagnosticsMode = options.diagnostics ?? 'auto';
  const inheritDiagnostics = diagnosticsMode === 'inherit' || (diagnosticsMode === 'auto' && mayReadDiagnostics);
  const projectionDiagnostic = {
    code: 'OBSERVER_PROJECTION_APPLIED',
    severity: 'info' as const,
    message: `Observer projection applied for ${observer.observerId}.`,
    messageZh: `已为观察者 ${observer.observerId} 应用相对投影。`,
    ...(mayReadDiagnostics ? { details: { shown: shownNodeIds.length, redacted: redactedNodeIds.length, hidden: hiddenNodeIds.length } } : {}),
  };
  const displayState: VSRDisplayState = {
    ...source,
    viewport: { ...source.viewport },
    background: source.background ? deepClone(source.background) : undefined,
    items: projectedItems,
    semanticHash: semantic,
    diagnostics: [...(inheritDiagnostics ? deepClone(source.diagnostics) : []), projectionDiagnostic],
  };
  const manifest: VSRObserverProjectionManifest = {
    format: 'vsr.observer-projection-manifest.v0.1',
    runtime: `vsr@${VSR_RUNTIME_VERSION}`,
    observerId: observer.observerId,
    observerHash: observerHash(observer),
    sourceDocumentHash: source.documentHash,
    sourceDisplayHash: source.semanticHash,
    projectedDisplayHash: semantic,
    invariantHash,
    policyHash: plan.policyHash,
    shownNodeIds: shownNodeIds.sort(),
    redactedNodeIds: redactedNodeIds.sort(),
    hiddenNodeIds: hiddenNodeIds.sort(),
    decisions,
  };
  return { observer, displayState, manifest };
}

export function verifyObserverProjectionSet(projections: VSRObserverProjection[]): VSRObserverProjectionVerification {
  const diagnostics: string[] = [];
  if (!projections.length) return { ok: false, observerCount: 0, projectedDisplayHashes: [], diagnostics: ['No observer projections supplied.'] };
  const sourceDisplayHash = projections[0]!.manifest.sourceDisplayHash;
  const invariantHash = projections[0]!.manifest.invariantHash;
  const sourceDocumentHash = projections[0]!.manifest.sourceDocumentHash;
  const observerIds = new Set<string>();
  for (const projection of projections) {
    const manifest = projection.manifest;
    if (manifest.sourceDisplayHash !== sourceDisplayHash) diagnostics.push(`Observer ${manifest.observerId} has a different source display hash.`);
    if (manifest.sourceDocumentHash !== sourceDocumentHash) diagnostics.push(`Observer ${manifest.observerId} has a different source document hash.`);
    if (manifest.invariantHash !== invariantHash) diagnostics.push(`Observer ${manifest.observerId} has a different reality invariant hash.`);
    if (manifest.projectedDisplayHash !== projection.displayState.semanticHash) diagnostics.push(`Observer ${manifest.observerId} projected display hash mismatch.`);
    if (observerIds.has(manifest.observerId)) diagnostics.push(`Duplicate observer id: ${manifest.observerId}.`);
    observerIds.add(manifest.observerId);
    const disclosed = new Set([...manifest.shownNodeIds, ...manifest.redactedNodeIds, ...manifest.hiddenNodeIds]);
    if (disclosed.size !== manifest.shownNodeIds.length + manifest.redactedNodeIds.length + manifest.hiddenNodeIds.length) diagnostics.push(`Observer ${manifest.observerId} has overlapping disclosure sets.`);
  }
  return {
    ok: diagnostics.length === 0,
    sourceDisplayHash,
    invariantHash,
    observerCount: projections.length,
    projectedDisplayHashes: projections.map(projection => projection.manifest.projectedDisplayHash),
    diagnostics,
  };
}
