import { VSRRuntimeSession, type VSREvaluateResult } from '../../core/src/index.js';
import {
  prepareObserverProjection,
  projectDisplayForObserver,
  verifyObserverProjectionSet,
  type VSRObserverProfile,
  type VSRObserverProjection,
  type VSRPreparedObserverProjection,
  type VSRObserverProjectionVerification,
} from '../../observer-projection/src/index.js';
import {
  deepClone,
  documentHash,
  semanticHash,
  type VSRDocument,
  type VSRNode,
  type VSRPaint,
  type VSRValue,
} from '../../spec/src/index.js';

export type RealityOneProjectionPhase = 'understanding' | 'permission' | 'executing' | 'result';
export type RealityOneLifecycleEventType =
  | 'intent.received'
  | 'intent.understood'
  | 'authority.requested'
  | 'authority.resolved'
  | 'execution.started'
  | 'execution.step.updated'
  | 'execution.progress'
  | 'application.committed'
  | 'application.failed';

export interface RealityOneProjectionOptions {
  profile?: 'desktop' | 'mobile';
  width?: number;
  height?: number;
  duration?: number;
  maxSteps?: number;
}

export type RealityOneObserverKind = 'owner' | 'operator' | 'auditor' | 'guest';

export interface RealityOneObserverProjectionSet {
  source: VSREvaluateResult;
  projections: VSRObserverProjection[];
  verification: VSRObserverProjectionVerification;
}

export function createRealityOneObserverProfile(kind: RealityOneObserverKind, observerId = `observer:${kind}`, subjectId = kind === 'owner' ? 'subject:owner' : undefined): VSRObserverProfile {
  const presets: Record<RealityOneObserverKind, Pick<VSRObserverProfile, 'roles' | 'scopes' | 'clearance'>> = {
    owner: { roles: ['owner'], scopes: ['intent.read', 'report.read', 'evidence.read', 'execution.read'], clearance: 4 },
    operator: { roles: ['operator'], scopes: ['intent.read', 'report.read', 'evidence.read', 'execution.read'], clearance: 3 },
    auditor: { roles: ['auditor'], scopes: ['report.read', 'evidence.read', 'execution.read'], clearance: 3 },
    guest: { roles: ['guest'], scopes: ['execution.read'], clearance: 0 },
  };
  return {
    format: 'vsr.observer-profile.v0.1',
    observerId,
    subjectId,
    locale: 'zh-CN',
    ...presets[kind],
    claims: { kind },
  };
}

export interface RealityOneProjectionStep {
  id?: string;
  title: string;
  status: string;
}

export interface RealityOneProjectionSummary {
  intentText: string;
  phase: RealityOneProjectionPhase;
  progress: number;
  status: string;
  authorityStatus: string;
  artifactTitle: string;
  report: string;
  steps: RealityOneProjectionStep[];
  evidenceRoot: string;
  applicationResultHash: string;
  sessionId?: string;
  sequence?: number;
  eventCount?: number;
  lastEventType?: string;
  eventChainRoot?: string;
}

export interface RealityOneLifecycleEvent {
  format: 'reality-one.lifecycle-event.v0.1';
  sessionId: string;
  sequence: number;
  type: RealityOneLifecycleEventType;
  payload?: Record<string, unknown>;
  previousEventHash?: string;
  eventHash?: string;
}

export interface RealityOneReplayFrame {
  sequence: number;
  type: RealityOneLifecycleEventType;
  phase: RealityOneProjectionPhase;
  stateHash: string;
  displayHash: string;
  eventHash: string;
  evaluation: VSREvaluateResult['evaluationStats'];
}

export interface RealityOneReplayManifest {
  format: 'reality-one.vsr-replay.v0.1';
  runtime: 'vsr@0.1.0-alpha.5';
  profile: 'desktop' | 'mobile';
  sessionId: string;
  templateDocumentHash: string;
  eventChainRoot: string;
  finalStateHash: string;
  finalDisplayHash: string;
  frames: RealityOneReplayFrame[];
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
function array(value: unknown): unknown[] { return Array.isArray(value) ? value : []; }
function text(value: unknown, fallback = ''): string { return typeof value === 'string' ? value : fallback; }
function numberValue(value: unknown, fallback = 0): number { const n = Number(value); return Number.isFinite(n) ? n : fallback; }
function clamp(value: number, min: number, max: number): number { return Math.max(min, Math.min(max, value)); }
function truncate(value: string, max: number): string { return value.length <= max ? value : `${value.slice(0, Math.max(0, max - 1))}…`; }
function shortHash(value: string): string { return value.length > 20 ? `${value.slice(0, 10)}…${value.slice(-8)}` : value; }
function solid(color: string): VSRPaint { return { type: 'solid', color }; }

const STEP_LABELS: Record<string, string> = {
  'lar.artifact.inspect': '解析工件',
  'lar.progress.target': '推进进度',
  'lar.report.render': '生成报告',
  'lar.report.attach': '附加报告',
  'hnaf.notification.emit': '发送通知',
};

const PHASE_LABELS: Array<[RealityOneProjectionPhase, string]> = [
  ['understanding', '系统理解'],
  ['permission', '权限确认'],
  ['executing', '正在执行'],
  ['result', '结果完成'],
];

const LIFECYCLE_EVENT_TYPES = new Set<RealityOneLifecycleEventType>([
  'intent.received','intent.understood','authority.requested','authority.resolved','execution.started',
  'execution.step.updated','execution.progress','application.committed','application.failed',
]);

function capabilityFromStepId(stepId: string): string {
  const parts = stepId.split(':');
  return parts.length >= 3 ? parts.slice(2).join(':') : stepId;
}

function normalizeStep(entry: unknown, index: number): RealityOneProjectionStep {
  const step = record(entry);
  const id = text(step.id, text(step.stepId, `step:${index + 1}`));
  const capability = text(step.capabilityId, capabilityFromStepId(id));
  return {
    id,
    title: text(step.title, text(step.label, STEP_LABELS[capability] ?? capability ?? `步骤 ${index + 1}`)),
    status: text(step.status, 'pending'),
  };
}

function mergePlanAndReceipts(planValue: unknown, receiptValue: unknown, maxSteps: number): RealityOneProjectionStep[] {
  const plan = record(planValue);
  const planned = array(plan.steps).map(normalizeStep);
  const receipts = array(receiptValue).map(normalizeStep);
  const receiptById = new Map(receipts.map(step => [step.id, step]));
  const merged = planned.map((step, index) => {
    const receipt = step.id ? receiptById.get(step.id) : undefined;
    return receipt ? { ...step, ...receipt, title: step.title || receipt.title } : { ...step, status: step.status || 'pending' };
  });
  for (const receipt of receipts) if (!receipt.id || !merged.some(step => step.id === receipt.id)) merged.push(receipt);
  return merged.slice(0, maxSteps);
}

export function normalizeRealityOneResult(input: unknown, maxSteps = 6): RealityOneProjectionSummary {
  const root = record(input);
  const intent = record(root.intent);
  const plan = record(root.plan);
  const authority = record(root.authority);
  const execution = record(root.execution);
  const artifact = record(root.artifact);
  const identity = record(artifact.identity);
  const semantic = record(artifact.semantic);
  const fields = record(semantic.fields);
  const progressField = record(fields.progress);
  const statusField = record(fields.status);
  const reportField = record(fields.generated_report);
  const steps = mergePlanAndReceipts(plan, execution.stepReceipts, maxSteps);
  const atomic = record(root.atomicReceipt);
  const evidence = record(root.evidence);
  const rfe = record(evidence.rfe);
  const rawStatus = text(root.status, '');
  const authorityStatus = text(authority.status, 'pending');
  let phase: RealityOneProjectionPhase = 'understanding';
  if (rawStatus === 'committed' || text(atomic.status) === 'committed') phase = 'result';
  else if (rawStatus === 'executing') phase = 'executing';
  else if (authorityStatus === 'approved' || authorityStatus === 'denied') phase = 'permission';
  return {
    intentText: text(intent.source, text(root.intentText, '未提供目标')),
    phase,
    progress: clamp(numberValue(progressField.value, numberValue(root.progress, 0)), 0, 100),
    status: text(statusField.value, text(root.status, '未知')),
    authorityStatus,
    artifactTitle: text(identity.title, text(root.artifactTitle, 'Reality One 工件')),
    report: text(reportField.value, text(root.report, '')),
    steps,
    evidenceRoot: text(atomic.finalGlobalRoot, text(rfe.finalGlobalRoot, text(execution.executionRoot, ''))),
    applicationResultHash: text(root.applicationResultHash, text(root.projectionRoot, '')),
  };
}

export function createInitialRealityOneSummary(): RealityOneProjectionSummary {
  return {
    intentText: '等待主体表达目标…',
    phase: 'understanding',
    progress: 0,
    status: '等待目标',
    authorityStatus: 'pending',
    artifactTitle: 'Reality One 实时会话',
    report: '',
    steps: [],
    evidenceRoot: '',
    applicationResultHash: '',
    sessionId: '',
    sequence: 0,
    eventCount: 0,
    lastEventType: '',
    eventChainRoot: '',
  };
}

function phaseForEvent(type: RealityOneLifecycleEventType): RealityOneProjectionPhase {
  if (type.startsWith('intent.')) return 'understanding';
  if (type.startsWith('authority.')) return 'permission';
  if (type.startsWith('execution.')) return 'executing';
  return 'result';
}

function payloadSteps(payload: Record<string, unknown>, fallback: RealityOneProjectionStep[]): RealityOneProjectionStep[] {
  const steps = array(payload.steps);
  return steps.length ? steps.map(normalizeStep) : fallback;
}

export function reduceRealityOneLifecycleEvent(
  current: RealityOneProjectionSummary,
  event: RealityOneLifecycleEvent,
  maxSteps = 6,
): RealityOneProjectionSummary {
  const payload = record(event.payload);
  let next: RealityOneProjectionSummary = {
    ...deepClone(current),
    phase: phaseForEvent(event.type),
    sessionId: event.sessionId,
    sequence: event.sequence,
    eventCount: (current.eventCount ?? 0) + 1,
    lastEventType: event.type,
    eventChainRoot: event.eventHash ?? current.eventChainRoot ?? '',
  };

  if (event.type === 'intent.received') {
    next = {
      ...next,
      intentText: text(payload.intentText, text(payload.source, current.intentText)),
      status: '正在理解目标',
      authorityStatus: 'pending',
      progress: 0,
      report: '',
      evidenceRoot: '',
      applicationResultHash: '',
      steps: [],
    };
  } else if (event.type === 'intent.understood') {
    next = {
      ...next,
      intentText: text(payload.intentText, current.intentText),
      artifactTitle: text(payload.artifactTitle, current.artifactTitle),
      status: text(payload.status, '目标与执行路径已生成'),
      steps: payloadSteps(payload, current.steps).slice(0, maxSteps),
    };
  } else if (event.type === 'authority.requested') {
    next = { ...next, status: text(payload.status, '等待权限确认'), authorityStatus: 'pending' };
  } else if (event.type === 'authority.resolved') {
    const authorityStatus = text(payload.status, text(payload.authorityStatus, 'pending'));
    next = {
      ...next,
      authorityStatus,
      status: text(payload.message, authorityStatus === 'approved' ? '权限已批准' : authorityStatus === 'denied' ? '权限被拒绝' : '权限待处理'),
    };
  } else if (event.type === 'execution.started') {
    const steps = payloadSteps(payload, current.steps).slice(0, maxSteps);
    if (steps.length && !steps.some(step => step.status === 'running')) steps[0] = { ...steps[0]!, status: 'running' };
    next = { ...next, status: text(payload.status, '正在执行'), steps };
  } else if (event.type === 'execution.step.updated') {
    const incoming = normalizeStep(payload.step ?? payload, current.steps.length);
    const steps = [...current.steps];
    const index = incoming.id ? steps.findIndex(step => step.id === incoming.id) : numberValue(payload.index, -1);
    if (index >= 0 && index < steps.length) steps[index] = { ...steps[index]!, ...incoming };
    else steps.push(incoming);
    next = {
      ...next,
      status: text(payload.message, incoming.status === 'completed' ? `已完成：${incoming.title}` : `执行中：${incoming.title}`),
      progress: clamp(numberValue(payload.progress, current.progress), 0, 100),
      steps: steps.slice(0, maxSteps),
    };
  } else if (event.type === 'execution.progress') {
    next = {
      ...next,
      status: text(payload.status, current.status || '正在执行'),
      progress: clamp(numberValue(payload.progress, current.progress), 0, 100),
      report: text(payload.report, current.report),
    };
  } else if (event.type === 'application.committed') {
    const result = payload.result ?? payload.applicationResult ?? payload;
    const normalized = normalizeRealityOneResult(result, maxSteps);
    next = {
      ...normalized,
      phase: 'result',
      status: text(payload.status, normalized.status === 'committed' ? '已提交' : normalized.status),
      sessionId: event.sessionId,
      sequence: event.sequence,
      eventCount: (current.eventCount ?? 0) + 1,
      lastEventType: event.type,
      eventChainRoot: event.eventHash ?? current.eventChainRoot ?? '',
    };
  } else if (event.type === 'application.failed') {
    next = {
      ...next,
      phase: 'result',
      status: '执行失败',
      report: text(payload.error, text(payload.message, 'Reality One 会话执行失败。')),
      evidenceRoot: text(payload.evidenceRoot, current.evidenceRoot),
      steps: current.steps.map(step => step.status === 'running' ? { ...step, status: 'failed' } : step),
    };
  }
  return next;
}

function eventHashInput(event: RealityOneLifecycleEvent, previousEventHash: string): Record<string, unknown> {
  return {
    format: event.format,
    sessionId: event.sessionId,
    sequence: event.sequence,
    type: event.type,
    payload: event.payload ?? {},
    previousEventHash,
  };
}

export function sealRealityOneLifecycleEvent(event: RealityOneLifecycleEvent, previousEventHash = ''): RealityOneLifecycleEvent {
  if (event.format !== 'reality-one.lifecycle-event.v0.1') throw new Error(`Unsupported Reality One event format: ${event.format}`);
  if (!event.sessionId) throw new Error('Reality One lifecycle event requires sessionId.');
  if (!LIFECYCLE_EVENT_TYPES.has(event.type)) throw new Error(`Unsupported Reality One lifecycle event type: ${String(event.type)}`);
  if (event.payload !== undefined && (!event.payload || typeof event.payload !== 'object' || Array.isArray(event.payload))) throw new Error('Reality One lifecycle event payload must be an object.');
  if (!Number.isInteger(event.sequence) || event.sequence <= 0) throw new Error('Reality One lifecycle event sequence must be a positive integer.');
  if (event.previousEventHash !== undefined && event.previousEventHash !== previousEventHash) throw new Error(`Reality One event chain mismatch at sequence ${event.sequence}.`);
  const eventHash = semanticHash(eventHashInput(event, previousEventHash));
  if (event.eventHash !== undefined && event.eventHash !== eventHash) throw new Error(`Reality One event hash mismatch at sequence ${event.sequence}.`);
  return { ...deepClone(event), previousEventHash, eventHash };
}

function rect(id: string, x: number, y: number, width: number, height: number, color: string, radius = 18, zIndex = 0, parentId?: string): VSRNode {
  return { id, parentId, type: 'rect', zIndex, layout: { x, y, width, height }, appearance: { fill: solid(color) }, content: { cornerRadius: radius } };
}
function label(id: string, value: string, x: number, y: number, width: number, height: number, size: number, color: string, zIndex = 2, weight: number | 'bold' | 'normal' = 'normal', parentId?: string): VSRNode {
  return { id, parentId, type: 'text', zIndex, layout: { x, y, width, height }, appearance: { fill: solid(color) }, content: { text: value, fontSize: size, fontWeight: weight, lineHeight: 1.3, wrap: 'word', overflow: 'ellipsis' } };
}
function boundLabel(id: string, binding: string, x: number, y: number, width: number, height: number, size: number, color: string, zIndex = 2, weight: number | 'bold' | 'normal' = 'normal', parentId?: string): VSRNode {
  return { id, parentId, type: 'text', zIndex, layout: { x, y, width, height }, appearance: { fill: solid(color) }, content: { text: { binding }, fontSize: size, fontWeight: weight, lineHeight: 1.3, wrap: 'word', overflow: 'ellipsis' } };
}
function bindingTrack(id: string, property: string, binding: string) {
  return { id, property, mode: 'binding' as const, binding };
}

interface ResolvedProjectionOptions {
  profile: 'desktop' | 'mobile';
  width: number;
  height: number;
  duration: number;
  maxSteps: number;
}

function resolveOptions(options: RealityOneProjectionOptions): ResolvedProjectionOptions {
  const profile = options.profile ?? 'desktop';
  return {
    profile,
    width: options.width ?? (profile === 'mobile' ? 390 : 1280),
    height: options.height ?? (profile === 'mobile' ? 844 : 720),
    duration: options.duration ?? 4,
    maxSteps: options.maxSteps ?? (profile === 'mobile' ? 4 : 6),
  };
}

function projectionVariables(summary: RealityOneProjectionSummary, options: ResolvedProjectionOptions): Record<string, VSRValue> {
  const pad = options.profile === 'mobile' ? 20 : 42;
  const contentWidth = options.width - pad * 2;
  const progressTrackWidth = contentWidth - 36;
  const activeFill = solid('#1768c8');
  const idleFill = solid('#12243a');
  const activeText = solid('#ffffff');
  const idleText = solid('#7f9ab7');
  const variables: Record<string, VSRValue> = {
    intentText: truncate(summary.intentText, options.profile === 'mobile' ? 92 : 180),
    phase: summary.phase,
    progress: summary.progress,
    progressText: `${Math.round(summary.progress)}%`,
    progressWidth: Math.max(2, progressTrackWidth * summary.progress / 100),
    status: summary.status,
    authorityStatus: summary.authorityStatus,
    statusLine: `状态：${summary.status}　 权限：${summary.authorityStatus}`,
    artifactTitle: truncate(summary.artifactTitle, options.profile === 'mobile' ? 30 : 58),
    report: truncate(summary.report || (summary.phase === 'result' ? '执行已完成，结果已写入现实连续性与证据链。' : '会话状态会随 Reality One 事件持续更新。'), options.profile === 'mobile' ? 130 : 300),
    evidenceLine: `证据根：${shortHash(summary.evidenceRoot || summary.applicationResultHash || summary.eventChainRoot || '待生成')}`,
    liveLine: summary.eventCount ? `实时事件 ${summary.eventCount} · 序列 ${summary.sequence ?? 0} · ${summary.lastEventType ?? ''}` : '等待 Reality One 生命周期事件',
    eventChainRoot: summary.eventChainRoot ?? '',
  };
  for (const [phase] of PHASE_LABELS) {
    const active = summary.phase === phase;
    variables[`phase_${phase}_fill`] = active ? activeFill : idleFill;
    variables[`phase_${phase}_text`] = active ? activeText : idleText;
  }
  for (let index = 0; index < options.maxSteps; index++) {
    const step = summary.steps[index];
    const status = step?.status ?? 'pending';
    variables[`step${index}`] = {
      visible: Boolean(step),
      title: step ? truncate(step.title, 32) : '',
      status,
      dotFill: solid(status === 'completed' ? '#1d9f6e' : status === 'running' ? '#1768c8' : status === 'failed' ? '#b94b58' : '#31506d'),
      statusFill: solid(status === 'completed' ? '#58d6a4' : status === 'running' ? '#75b9ff' : status === 'failed' ? '#ff8f9a' : '#8aa4bf'),
    };
  }
  return variables;
}

export function createRealityOneLiveDocument(options: RealityOneProjectionOptions = {}, initial: RealityOneProjectionSummary = createInitialRealityOneSummary()): VSRDocument {
  const resolved = resolveOptions(options);
  const { profile, width, height, duration, maxSteps } = resolved;
  const pad = profile === 'mobile' ? 20 : 42;
  const contentWidth = width - pad * 2;
  const headerY = profile === 'mobile' ? 26 : 30;
  const phaseY = profile === 'mobile' ? 86 : 88;
  const intentY = profile === 'mobile' ? 138 : 142;
  const intentH = profile === 'mobile' ? 126 : 112;
  const progressY = intentY + intentH + 18;
  const progressH = profile === 'mobile' ? 104 : 94;
  const stepsY = progressY + progressH + 18;
  const reportY = height - 188;
  const stepsH = Math.max(80, reportY - stepsY - 18);
  const nodes: VSRNode[] = [
    rect('background', 0, 0, width, height, '#07111f', 0, -100),
    rect('glow', width * .63, -height * .2, width * .55, height * .58, '#0b2d5b', Math.round(width * .1), -90),
    label('brand', 'Reality One｜现实入口', pad, headerY, contentWidth * .65, 40, profile === 'mobile' ? 24 : 28, '#f5f9ff', 3, 'bold'),
    label('runtime', 'VSR 实时投影', width - pad - (profile === 'mobile' ? 112 : 160), headerY + 4, profile === 'mobile' ? 112 : 160, 28, 13, '#82b8ff', 3),
    rect('intent-card', pad, intentY, contentWidth, intentH, '#102238', 20, 0),
    label('intent-title', '你的目标', pad + 18, intentY + 14, 120, 24, 13, '#78a7e8', 2, 'bold'),
    boundLabel('intent-text', 'vars.intentText', pad + 18, intentY + 42, contentWidth - 36, intentH - 52, profile === 'mobile' ? 18 : 20, '#f4f8ff', 2, 'bold'),
    rect('progress-card', pad, progressY, contentWidth, progressH, '#0d1d30', 18, 0),
    boundLabel('artifact-title', 'vars.artifactTitle', pad + 18, progressY + 14, contentWidth * .62, 24, 14, '#c9ddff', 2, 'bold'),
    boundLabel('progress-value', 'vars.progressText', width - pad - 92, progressY + 10, 74, 32, 24, '#6db5ff', 2, 'bold'),
    rect('progress-track', pad + 18, progressY + 52, contentWidth - 36, 14, '#223850', 7, 1),
    { ...rect('progress-fill', pad + 18, progressY + 52, 2, 14, '#2f8cff', 7, 2), tracks: [bindingTrack('progress-width', 'layout.width', 'vars.progressWidth')] },
    boundLabel('status-line', 'vars.statusLine', pad + 18, progressY + 72, contentWidth - 36, 20, 12, '#8faac8', 2),
    rect('steps-card', pad, stepsY, contentWidth, stepsH, '#0b1929', 18, 0),
    label('steps-title', '执行路径', pad + 18, stepsY + 14, 160, 24, 14, '#d8e8ff', 2, 'bold'),
    boundLabel('live-line', 'vars.liveLine', pad + 148, stepsY + 14, contentWidth - 166, 24, 11, '#6f8ba8', 2),
    rect('report-card', pad, reportY, contentWidth, height - reportY - pad, '#10243a', 18, 0),
    label('report-title', '结果与证据', pad + 18, reportY + 14, 160, 24, 14, '#d8e8ff', 2, 'bold'),
    boundLabel('report', 'vars.report', pad + 18, reportY + 42, contentWidth - 36, profile === 'mobile' ? 76 : 72, 13, '#bed2eb', 2),
    boundLabel('evidence', 'vars.evidenceLine', pad + 18, height - pad - 28, contentWidth - 36, 18, 11, '#6f8ba8', 2),
  ];

  const chipGap = profile === 'mobile' ? 6 : 12;
  const chipWidth = (contentWidth - chipGap * 3) / 4;
  PHASE_LABELS.forEach(([phase, name], index) => {
    const x = pad + index * (chipWidth + chipGap);
    const phaseRect = rect(`phase-${phase}`, x, phaseY, chipWidth, 34, '#12243a', 12, 0);
    phaseRect.tracks = [bindingTrack(`phase-${phase}-fill`, 'appearance.fill', `vars.phase_${phase}_fill`)];
    const phaseText = label(`phase-label-${phase}`, name, x + 4, phaseY + 8, chipWidth - 8, 20, profile === 'mobile' ? 10 : 12, '#7f9ab7', 2, 'normal');
    phaseText.tracks = [bindingTrack(`phase-${phase}-text`, 'appearance.fill', `vars.phase_${phase}_text`)];
    nodes.push(phaseRect, phaseText);
  });

  const rowHeight = profile === 'mobile' ? 42 : 38;
  const desktopRows = Math.ceil(maxSteps / 2);
  const desktopColumnGap = 22;
  const desktopColumnWidth = (contentWidth - 36 - desktopColumnGap) / 2;
  for (let index = 0; index < maxSteps; index++) {
    const column = profile === 'mobile' ? 0 : Math.floor(index / desktopRows);
    const row = profile === 'mobile' ? index : index % desktopRows;
    const columnX = pad + 18 + column * (desktopColumnWidth + desktopColumnGap);
    const rowWidth = profile === 'mobile' ? contentWidth - 36 : desktopColumnWidth;
    const y = stepsY + 48 + row * rowHeight;
    const groupId = `step-row-${index}`;
    nodes.push({ id: groupId, type: 'group', visible: { binding: `vars.step${index}.visible` }, layout: { x: 0, y: 0, width, height } });
    const dot = rect(`step-dot-${index}`, columnX, y + 5, 22, 22, '#31506d', 11, 1, groupId);
    dot.tracks = [bindingTrack(`step-dot-fill-${index}`, 'appearance.fill', `vars.step${index}.dotFill`)];
    nodes.push(dot);
    nodes.push(label(`step-index-${index}`, String(index + 1), columnX, y + 8, 22, 16, 10, '#ffffff', 2, 'bold', groupId));
    nodes.push(boundLabel(`step-title-${index}`, `vars.step${index}.title`, columnX + 34, y + 4, rowWidth - 132, 24, 13, '#dcecff', 2, 'bold', groupId));
    const status = boundLabel(`step-status-${index}`, `vars.step${index}.status`, columnX + rowWidth - 78, y + 4, 78, 24, 11, '#8aa4bf', 2, 'normal', groupId);
    status.tracks = [bindingTrack(`step-status-fill-${index}`, 'appearance.fill', `vars.step${index}.statusFill`)];
    nodes.push(status);
  }

  const policyByNode: Record<string, Record<string, unknown>> = {
    'intent-text': {
      format: 'vsr.observer-policy.v0.1',
      anyScope: ['intent.read'],
      deny: 'redact',
      redactionText: '•••• 目标内容受权限保护',
      reason: 'intent-privacy',
    },
    'live-line': {
      format: 'vsr.observer-policy.v0.1',
      anyRole: ['operator', 'auditor'],
      minClearance: 2,
      deny: 'hide',
      reason: 'runtime-telemetry',
    },
    report: {
      format: 'vsr.observer-policy.v0.1',
      anyScope: ['report.read'],
      deny: 'redact',
      redactionText: '•••• 结果详情已脱敏',
      reason: 'result-privacy',
    },
    evidence: {
      format: 'vsr.observer-policy.v0.1',
      anyScope: ['evidence.read'],
      minClearance: 3,
      deny: 'hide',
      reason: 'evidence-boundary',
    },
  };
  for (const node of nodes) {
    const policy = policyByNode[node.id];
    if (policy) node.extensions = { ...(node.extensions ?? {}), 'vsr:observer-policy': policy };
  }

  return {
    specVersion: '0.1',
    runtimeTarget: 'vsr@0.1.0-alpha.5',
    metadata: {
      id: `reality-one-live-${profile}`,
      title: 'Reality One 实时生命周期投影',
      duration,
      defaultFps: 30,
      seed: 20260630,
      authoringTool: 'VSR adapter-reality-one live projection',
      description: 'A stable Visual IR template whose variables are updated by Reality One lifecycle events.',
    },
    canvas: { width, height, background: solid('#07111f'), layoutMode: 'responsive' },
    variables: projectionVariables(initial, resolved),
    nodes,
    outputs: [
      { id: `${profile}-interactive`, type: 'interactive', width, height, responsive: true },
      { id: `${profile}-image`, type: 'image', width, height },
    ],
    extensions: {
      'reality-one:projection-mode': 'lifecycle-event-stream-v0.1',
      'reality-one:max-steps': maxSteps,
      'vsr:observer-projection': 'observer-policy-v0.1',
    },
  };
}

export class RealityOneVSRSession {
  readonly options: ResolvedProjectionOptions;
  readonly document: VSRDocument;
  readonly runtime: VSRRuntimeSession;
  readonly observerProjection: VSRPreparedObserverProjection;
  private summary: RealityOneProjectionSummary;
  private events: RealityOneLifecycleEvent[] = [];
  private chainRoot = '';
  private sessionId = '';

  constructor(options: RealityOneProjectionOptions = {}, initial: RealityOneProjectionSummary = createInitialRealityOneSummary()) {
    this.options = resolveOptions(options);
    this.summary = deepClone(initial);
    this.document = createRealityOneLiveDocument(this.options, this.summary);
    this.runtime = new VSRRuntimeSession(this.document, { width: this.options.width, height: this.options.height, dpr: 1 });
    this.observerProjection = prepareObserverProjection(this.document);
  }

  currentSummary(): RealityOneProjectionSummary { return deepClone(this.summary); }
  eventLog(): RealityOneLifecycleEvent[] { return deepClone(this.events); }
  eventChainRoot(): string { return this.chainRoot; }
  stateHash(): string { return semanticHash(this.summary); }

  append(event: RealityOneLifecycleEvent): RealityOneLifecycleEvent {
    if (this.events.length === 0) {
      this.sessionId = event.sessionId;
      if (event.sequence !== 1) throw new Error(`Reality One event stream must start at sequence 1, received ${event.sequence}.`);
    } else {
      if (event.sessionId !== this.sessionId) throw new Error(`Reality One session mismatch: expected ${this.sessionId}, received ${event.sessionId}.`);
      const expected = this.events.length + 1;
      if (event.sequence !== expected) throw new Error(`Reality One event sequence mismatch: expected ${expected}, received ${event.sequence}.`);
    }
    const sealed = sealRealityOneLifecycleEvent(event, this.chainRoot);
    this.events.push(sealed);
    this.chainRoot = sealed.eventHash!;
    this.summary = reduceRealityOneLifecycleEvent(this.summary, sealed, this.options.maxSteps);
    this.summary.eventChainRoot = this.chainRoot;
    this.runtime.setVariables(projectionVariables(this.summary, this.options));
    return deepClone(sealed);
  }

  evaluate(time = 0): VSREvaluateResult { return this.runtime.evaluate(time); }

  private observerInvariant(): Record<string, VSRValue> {
    return {
      sessionId: this.summary.sessionId ?? '',
      sequence: this.summary.sequence ?? 0,
      eventCount: this.summary.eventCount ?? 0,
      phase: this.summary.phase,
      progress: this.summary.progress,
      status: this.summary.status,
      authorityStatus: this.summary.authorityStatus,
      eventChainRoot: this.chainRoot,
      applicationResultHash: this.summary.applicationResultHash,
    };
  }

  evaluateForObserver(observer: VSRObserverProfile, time = 0): VSRObserverProjection {
    const source = this.evaluate(time);
    return projectDisplayForObserver(this.observerProjection, source.displayState, observer, { invariant: this.observerInvariant() });
  }

  evaluateForObservers(observers: VSRObserverProfile[], time = 0): RealityOneObserverProjectionSet {
    const source = this.evaluate(time);
    const invariant = this.observerInvariant();
    const projections = observers.map(observer => projectDisplayForObserver(this.observerProjection, source.displayState, observer, { invariant }));
    return { source, projections, verification: verifyObserverProjectionSet(projections) };
  }

  reset(initial: RealityOneProjectionSummary = createInitialRealityOneSummary()): void {
    this.summary = deepClone(initial);
    this.events = [];
    this.chainRoot = '';
    this.sessionId = '';
    this.runtime.replaceVariables(projectionVariables(this.summary, this.options));
    this.runtime.clearEvents();
    this.runtime.invalidate();
  }

  replay(events: RealityOneLifecycleEvent[]): RealityOneReplayManifest {
    this.reset();
    const frames: RealityOneReplayFrame[] = [];
    for (const event of events) {
      const sealed = this.append(event);
      const result = this.evaluate(0);
      frames.push({
        sequence: sealed.sequence,
        type: sealed.type,
        phase: this.summary.phase,
        stateHash: this.stateHash(),
        displayHash: result.semanticHash,
        eventHash: sealed.eventHash!,
        evaluation: result.evaluationStats,
      });
    }
    const final = this.evaluate(0);
    return {
      format: 'reality-one.vsr-replay.v0.1',
      runtime: 'vsr@0.1.0-alpha.5',
      profile: this.options.profile,
      sessionId: this.sessionId,
      templateDocumentHash: documentHash(this.document),
      eventChainRoot: this.chainRoot,
      finalStateHash: this.stateHash(),
      finalDisplayHash: final.semanticHash,
      frames,
    };
  }

  snapshotDocument(): VSRDocument {
    const snapshot = deepClone(this.document);
    snapshot.variables = projectionVariables(this.summary, this.options);
    snapshot.metadata = {
      ...snapshot.metadata,
      id: `${snapshot.metadata.id}-${this.sessionId || 'snapshot'}-${this.summary.sequence ?? 0}`,
      title: `${snapshot.metadata.title}｜${this.summary.status}`,
    };
    snapshot.extensions = {
      ...snapshot.extensions,
      'reality-one:summary': deepClone(this.summary),
      'reality-one:event-chain-root': this.chainRoot,
      'reality-one:event-count': this.events.length,
    };
    return snapshot;
  }

  dispose(): void { this.runtime.dispose(); }
}

function lifecycleEvent(sessionId: string, sequence: number, type: RealityOneLifecycleEventType, payload: Record<string, unknown>): RealityOneLifecycleEvent {
  return { format: 'reality-one.lifecycle-event.v0.1', sessionId, sequence, type, payload };
}

export function realityOneResultToLifecycleEvents(input: unknown, sessionId?: string, maxSteps = 6): RealityOneLifecycleEvent[] {
  const root = record(input);
  const intent = record(root.intent);
  const plan = record(root.plan);
  const authority = record(root.authority);
  const execution = record(root.execution);
  const artifact = record(root.artifact);
  const identity = record(artifact.identity);
  const summary = normalizeRealityOneResult(input, maxSteps);
  const id = sessionId ?? `reality-one:${summary.applicationResultHash.slice(0, 16) || semanticHash(input).slice(0, 16)}`;
  const plannedSteps = array(plan.steps).map(normalizeStep).slice(0, maxSteps).map(step => ({ ...step, status: 'pending' }));
  const events: RealityOneLifecycleEvent[] = [];
  let sequence = 1;
  events.push(lifecycleEvent(id, sequence++, 'intent.received', { intentText: text(intent.source, summary.intentText) }));
  events.push(lifecycleEvent(id, sequence++, 'intent.understood', { intentText: summary.intentText, artifactTitle: text(identity.title, summary.artifactTitle), steps: plannedSteps }));
  events.push(lifecycleEvent(id, sequence++, 'authority.requested', { scopes: array(plan.requiredScopes), hostCapabilities: array(plan.requiredHostCapabilities) }));
  events.push(lifecycleEvent(id, sequence++, 'authority.resolved', { status: text(authority.status, summary.authorityStatus), denied: array(authority.denied) }));
  events.push(lifecycleEvent(id, sequence++, 'execution.started', { steps: plannedSteps }));
  const receipts = array(execution.stepReceipts);
  receipts.slice(0, maxSteps).forEach((receipt, index) => {
    const step = normalizeStep(receipt, index);
    const progress = step.id?.includes('lar.progress.target') ? summary.progress : undefined;
    events.push(lifecycleEvent(id, sequence++, 'execution.step.updated', { step, ...(progress === undefined ? {} : { progress }) }));
  });
  events.push(lifecycleEvent(id, sequence++, 'application.committed', { result: deepClone(input), status: summary.status }));
  return events;
}

export function realityOneResultToVSR(input: unknown, options: RealityOneProjectionOptions = {}): VSRDocument {
  const session = new RealityOneVSRSession(options);
  session.replay(realityOneResultToLifecycleEvents(input, undefined, session.options.maxSteps));
  const document = session.snapshotDocument();
  session.dispose();
  return document;
}
