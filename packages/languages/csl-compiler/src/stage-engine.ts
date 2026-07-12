// ============================================================
// CSL 0.3 — 阶段推进引擎(State Machine Advancement Engine)
//
// P2:接入 RuntimeGuard.guard —— 主体推进必须同时受
//   profile.runtimePermissions(transition / regenerate / emitSignal)
//   + oseVerdict(block 时拒绝执行)
//   双重约束。被阻断时填充 halt_reason='governance_blocked' 并附 diagnostics。
// ============================================================

import type { IRContainer, SubjectSpec, TransitionSpec, ClauseSpec } from './types';
import type { CapabilityProfile } from './capability/profile';
import { guard, type OSEVerdict } from './runtime/guard';


export type TransitionStatus =
  | 'ready'      // 触发条件满足，可推进
  | 'blocked'    // 触发条件存在但不满足
  | 'unknown'    // 触发条件依赖的属性在主体上缺失
  | 'open';      // 无触发条件，默认放行

/** P4:候选转移的治理裁决等级(用于 UI 状态分级展示) */
export type CandidateVerdict =
  | 'ready'                       // 条件满足且未被治理拦
  | 'open'                        // 默认放行
  | 'blocked_by_condition'        // 触发条件不满足
  | 'blocked_by_runtime_guard'    // 被 profile 拦(权限/feature 关闭)
  | 'blocked_by_ose'              // 被 OSE 报告中针对此 transition 的诊断拦
  | 'blocked_by_mode_or_permission' // 被规格层模式/权限拦
  | 'unknown';                    // 属性缺失或无法判定

export interface CandidateTransition {
  transition: TransitionSpec;
  status: TransitionStatus;
  /** 触发条件的可读文本，例如 `不服从感 > 0` */
  trigger_text: string | null;
  /** 主体上对应属性的当前值（缺失时为 undefined） */
  current_value: unknown;
  /** 阻塞或缺失时的原因说明 */
  reason: string | null;
  /** P4:综合治理裁决(condition + runtime guard + OSE 报告) */
  verdict?: CandidateVerdict;
  /** P4:若被治理拦截,说明哪个 policy 拦的 */
  blockedBy?: { policyId: string; reason: string; fixHint?: string; sourceLocation?: { line: number; column?: number; snippet?: string } };
}

export interface PathStep {
  from: string;
  to: string;
  via: string;            // 转移名称
  trigger_text: string | null;
  status: TransitionStatus;
}

/** P2:阶段推进的治理诊断 */
export interface StageGovernanceDiagnostic {
  op: 'transition' | 'regenerate' | 'emitSignal';
  policyId: string;
  reason: string;
  fixHint?: string;
  /** 被阻断的目标(transition 名 / signal 名) */
  target?: string;
  /** P4:目标在源码中的定位(由 dispatch 层注入,演示壳可点击跳转) */
  sourceLocation?: { line: number; column?: number; lineEnd?: number; snippet?: string };
}

export interface SubjectAdvancement {
  subject: SubjectSpec;
  current_stage_defined: boolean;
  candidates: CandidateTransition[];
  auto_path: PathStep[];
  terminal_stage: string;
  /** P2:新增 'governance_blocked' —— 被 profile / OSE 阻断 */
  halt_reason: 'no_outgoing' | 'all_blocked' | 'fork' | 'cycle' | 'completed' | 'governance_blocked';
  /** P2:本次推进过程中累计的治理诊断 */
  governance: StageGovernanceDiagnostic[];
}

// --- 内部：触发条件评估 ---

function evalTrigger(
  clause: ClauseSpec,
  values: Record<string, unknown>,
): { status: Exclude<TransitionStatus, 'open'>; reason: string | null } {
  const left = clause.left;
  // 支持 主体.属性 / 候选.属性 / 直接属性 三种写法
  const fieldName = left.includes('.') ? left.split('.').slice(-1)[0] : left;
  const lv = values[fieldName];

  if (lv === undefined) {
    return { status: 'unknown', reason: `主体缺少属性「${fieldName}」` };
  }

  const rv = clause.right;
  const ln = Number(lv);
  const rn = Number(rv);

  let pass = false;
  switch (clause.op) {
    case 'eq':  pass = lv === rv; break;
    case 'neq': pass = lv !== rv; break;
    case 'gt':  pass = ln > rn; break;
    case 'lt':  pass = ln < rn; break;
    case 'gte': pass = ln >= rn; break;
    case 'lte': pass = ln <= rn; break;
    default: pass = true;
  }

  return pass
    ? { status: 'ready', reason: null }
    : { status: 'blocked', reason: `当前 ${fieldName}=${formatVal(lv)}，需要 ${clause.op} ${formatVal(rv)}` };
}

function formatVal(v: unknown): string {
  if (typeof v === 'string') return `"${v}"`;
  return String(v);
}

function triggerText(clause: ClauseSpec | null): string | null {
  if (!clause) return null;
  const opMap: Record<string, string> = {
    eq: '=', neq: '≠', gt: '>', lt: '<', gte: '≥', lte: '≤',
  };
  const op = opMap[clause.op] ?? clause.op;
  return `${clause.left} ${op} ${formatVal(clause.right)}`;
}

// --- 候选评估 ---

export function evaluateCandidates(
  ir: IRContainer,
  subject: SubjectSpec,
  fromStage: string,
): CandidateTransition[] {
  const outgoing = ir.transitions.filter(t => t.from_stage === fromStage);
  return outgoing.map<CandidateTransition>(t => {
    const fieldName = t.trigger?.left?.includes('.')
      ? t.trigger.left.split('.').slice(-1)[0]
      : t.trigger?.left ?? '';
    const current = fieldName ? subject.attributes[fieldName] : undefined;
    const tt = triggerText(t.trigger);

    if (!t.trigger) {
      return {
        transition: t,
        status: 'open',
        trigger_text: null,
        current_value: undefined,
        reason: null,
      };
    }

    const ev = evalTrigger(t.trigger, subject.attributes);
    return {
      transition: t,
      status: ev.status,
      trigger_text: tt,
      current_value: current,
      reason: ev.reason,
    };
  });
}

// --- 自动推进路径（贪心，单一路径） ---

function pickAdvanceable(cands: CandidateTransition[]): CandidateTransition[] {
  return cands.filter(c => c.status === 'ready' || c.status === 'open');
}

export function computeAutoPath(
  ir: IRContainer,
  subject: SubjectSpec,
): { path: PathStep[]; terminal: string; halt: SubjectAdvancement['halt_reason'] } {
  const path: PathStep[] = [];
  const visited = new Set<string>();
  let cur = subject.current_stage;

  if (!cur) {
    return { path, terminal: '', halt: 'no_outgoing' };
  }
  visited.add(cur);

  // 安全上限，避免恶意循环
  for (let i = 0; i < 24; i++) {
    const cands = evaluateCandidates(ir, subject, cur);
    if (cands.length === 0) {
      return { path, terminal: cur, halt: path.length === 0 ? 'no_outgoing' : 'completed' };
    }
    const advanceable = pickAdvanceable(cands);
    if (advanceable.length === 0) {
      return { path, terminal: cur, halt: 'all_blocked' };
    }
    if (advanceable.length > 1) {
      // 路径分歧：保守停止，让用户手动选择
      return { path, terminal: cur, halt: 'fork' };
    }

    const next = advanceable[0];
    const nextStage = next.transition.to_stage;
    path.push({
      from: cur,
      to: nextStage,
      via: next.transition.name,
      trigger_text: next.trigger_text,
      status: next.status,
    });

    if (visited.has(nextStage)) {
      return { path, terminal: nextStage, halt: 'cycle' };
    }
    visited.add(nextStage);
    cur = nextStage;
  }
  return { path, terminal: cur, halt: 'completed' };
}

// --- 主入口 ---

/** P4:由 dispatch 层注入的诊断查询函数 — 按 transition 名查 OSE 报告中针对它的阻断诊断 */
export type TransitionOseLookup = (transitionName: string) => {
  policyId: string;
  reason: string;
  fixHint?: string;
  sourceLocation?: { line: number; column?: number; snippet?: string };
} | null;

/** P5:模式/权限阻断的来源 — 由调用方提供,真实来自 workspace.lockState 或外部锁 */
export type ModePermissionLock = 'editable' | 'read_only' | 'incompatible';

export interface StageEnforcementContext {
  /** 调用方所知的对象锁定态(workspace.lockState 或演示壳 active.lockState) */
  lockState?: ModePermissionLock;
}

/** P5:统一构造一条 mode/permission 阻断,提供 fixHint */
function buildModePermissionBlock(
  policyId: string,
  reason: string,
  fixHint: string,
): NonNullable<CandidateTransition['blockedBy']> {
  return { policyId, reason, fixHint };
}

/** P4 + P5:为单条候选转移计算综合 verdict */
function computeCandidateVerdict(
  c: CandidateTransition,
  profile: CapabilityProfile | undefined,
  oseLookup: TransitionOseLookup | undefined,
  enforcement: StageEnforcementContext | undefined,
): { verdict: CandidateVerdict; blockedBy?: CandidateTransition['blockedBy'] } {
  // P5-1. lockState 拦截 — 真实触发 blocked_by_mode_or_permission
  const lock = enforcement?.lockState;
  if (lock === 'incompatible') {
    return {
      verdict: 'blocked_by_mode_or_permission',
      blockedBy: buildModePermissionBlock(
        'permission.lockState.incompatible',
        '对象与当前系统版本不兼容,所有阶段推进被禁止',
        '在演示壳中仅查看 metadata,或将源码作为新工作区另存',
      ),
    };
  }
  if (lock === 'read_only') {
    return {
      verdict: 'blocked_by_mode_or_permission',
      blockedBy: buildModePermissionBlock(
        'permission.lockState.read_only',
        '对象处于只读态,不允许触发阶段推进',
        '将对象「另存为可编辑工作区」后,在 Playground 中重新尝试推进',
      ),
    };
  }
  // P5-2. mode 'stage' 未启用 → 视图模式拦截
  if (profile && !profile.enabledModes.includes('stage')) {
    return {
      verdict: 'blocked_by_mode_or_permission',
      blockedBy: buildModePermissionBlock(
        'permission.mode.stage_disabled',
        '视图模式「stage」未启用,阶段推进被规格层拒绝展示与执行',
        '在 spec 中放开 stage 模式所依赖的 feature(subjects + sovereignty_stages)',
      ),
    };
  }
  // 1. profile 关闭 stage_transitions
  if (profile && !profile.runtimePermissions.allowStageTransition) {
    return {
      verdict: 'blocked_by_runtime_guard',
      blockedBy: {
        policyId: 'runtime.stage_transitions.disabled',
        reason: '阶段转移被规格层关闭(feature「stage_transitions」未启用)',
        fixHint: '在 feature-map.csl 中启用 F_STAGE_TRANSITIONS,或切换到 v0.9+ 语法',
      },
    };
  }
  // 2. OSE 针对该 transition 的阻断
  const oseHit = oseLookup?.(c.transition.name);
  if (oseHit) {
    return { verdict: 'blocked_by_ose', blockedBy: oseHit };
  }
  // 3. 触发条件
  if (c.status === 'unknown') return { verdict: 'unknown' };
  if (c.status === 'blocked') return {
    verdict: 'blocked_by_condition',
    blockedBy: { policyId: 'stage.condition.unsatisfied', reason: c.reason || '触发条件未满足' },
  };
  if (c.status === 'open') return { verdict: 'open' };
  return { verdict: 'ready' };
}

/**
 * P2:advanceAllSubjects 现在接收 profile + oseVerdict
 * P4:可选 oseLookup
 * P5:可选 enforcement(lockState 等模式/权限信息)
 */
export function advanceAllSubjects(
  ir: IRContainer,
  profile?: CapabilityProfile,
  oseVerdict?: OSEVerdict,
  oseLookup?: TransitionOseLookup,
  enforcement?: StageEnforcementContext,
): SubjectAdvancement[] {
  const stageNames = new Set(ir.stages.map(s => s.name));

  // P5:全局 mode/permission 阻断 — lockState / mode 'stage' 未启用
  const globalLock: { policyId: string; reason: string; fixHint?: string } | null =
    enforcement?.lockState === 'incompatible'
      ? {
          policyId: 'permission.lockState.incompatible',
          reason: '对象与当前系统版本不兼容,阶段推进整体被拒绝',
          fixHint: '在演示壳中仅查看 metadata,或将源码作为新工作区另存',
        }
      : enforcement?.lockState === 'read_only'
      ? {
          policyId: 'permission.lockState.read_only',
          reason: '对象处于只读态,阶段推进整体被拒绝',
          fixHint: '将对象「另存为可编辑工作区」后再尝试推进',
        }
      : profile && !profile.enabledModes.includes('stage')
      ? {
          policyId: 'permission.mode.stage_disabled',
          reason: '视图模式「stage」未在当前规格中启用,阶段推进被拒绝',
          fixHint: '启用 stage 模式所依赖的 feature(subjects + sovereignty_stages)',
        }
      : null;

  return ir.subjects.map<SubjectAdvancement>(subject => {
    const cur = subject.current_stage ?? '';
    const defined = !!cur && stageNames.has(cur);
    const governance: StageGovernanceDiagnostic[] = [];

    const annotateCandidates = (cands: CandidateTransition[]): CandidateTransition[] =>
      cands.map(c => {
        const { verdict, blockedBy } = computeCandidateVerdict(c, profile, oseLookup, enforcement);
        return { ...c, verdict, blockedBy };
      });

    // P5:全局 mode/permission 阻断生效 → 整轮 governance_blocked
    if (globalLock) {
      governance.push({
        op: 'transition',
        policyId: globalLock.policyId,
        reason: globalLock.reason,
        fixHint: globalLock.fixHint,
        target: subject.name,
      });
      return {
        subject,
        current_stage_defined: defined,
        candidates: defined ? annotateCandidates(evaluateCandidates(ir, subject, cur)) : [],
        auto_path: [],
        terminal_stage: cur,
        halt_reason: 'governance_blocked',
        governance,
      };
    }

    if (!profile) {
      governance.push({
        op: 'transition',
        policyId: 'runtime.guard.bypassed',
        reason: 'advanceAllSubjects 未接收 CapabilityProfile,本轮治理校验已跳过',
        fixHint: '调用方应传入 profile 与 oseVerdict 以接入 RuntimeGuard',
      });
    } else {
      const pre = guard('transition', { profile, ir, oseVerdict, target: subject.name });
      if (!pre.allowed) {
        governance.push({
          op: 'transition',
          policyId: pre.policyId || 'runtime.guard.unknown',
          reason: pre.reason || '阶段转移被拒绝',
          fixHint: pre.fixHint,
          target: subject.name,
        });
        return {
          subject,
          current_stage_defined: defined,
          candidates: defined ? annotateCandidates(evaluateCandidates(ir, subject, cur)) : [],
          auto_path: [],
          terminal_stage: cur,
          halt_reason: 'governance_blocked',
          governance,
        };
      }
    }

    const candidates = defined ? annotateCandidates(evaluateCandidates(ir, subject, cur)) : [];
    const { path, terminal, halt } = defined
      ? computeAutoPath(ir, subject)
      : { path: [], terminal: cur, halt: 'no_outgoing' as const };

    return {
      subject,
      current_stage_defined: defined,
      candidates,
      auto_path: path,
      terminal_stage: terminal,
      halt_reason: halt,
      governance,
    };
  });
}


