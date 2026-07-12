// RuntimeGuard — 运行时治理拦截层
//
// MVP-2 范围:五入口统一接入 + 节点治理标记检查 + IR 元一致性双检。
//
// 核心原则:即便非法结构绕过 parser 进入 IR,runtime 也必须拒绝执行。
// 纯函数:输入 (op, ctx) → 输出 GuardResult,不持有状态,不触发副作用。

import type { CapabilityProfile } from '../capability/profile';
import type { IRContainer, IRNodeGovernance } from '../types';

export type GuardOp =
  | 'validate' | 'select' | 'infer' | 'trace'
  | 'callFunction'
  | 'transition' | 'regenerate' | 'emitSignal';

export type GuardSeverity = 'pass' | 'warn' | 'block';

/**
 * OSE 裁决摘要(轻量结构,避免 runtime 依赖 projection 层类型)
 * 由调用方从 OSEReport 通过 computeBlocked 构造后注入
 */
export interface OSEVerdict {
  blocked: boolean;
  reasons: string[];
  /** 首条修复建议(用于 UI 主建议浮起) */
  primaryFixHint?: string;
}

export interface GuardContext {
  profile: CapabilityProfile;
  ir?: IRContainer | null;
  /** 本次操作针对的 IR 节点(可选):guard 据此检查 _disabled/_illegal */
  irNode?: IRNodeGovernance | null;
  /** 被操作目标:函数名 / 主体 id / 信号 id 等 */
  target?: string;
  /** Phase 2.5:OSE 裁决摘要 —— blocked=true 时执行类 op 一律拒绝 */
  oseVerdict?: OSEVerdict | null;
}

export interface GuardResult {
  allowed: boolean;
  /** 分级,UI/export 消费 */
  severity: GuardSeverity;
  /** 诊断文案(中文) */
  reason?: string;
  /** 机器可读策略 id,稳定不变 */
  policyId?: string;
  /** 修复建议 */
  fixHint?: string;
}

export class RuntimeGuardError extends Error {
  public readonly policyId: string;
  public readonly severity: GuardSeverity;
  public readonly fixHint?: string;
  constructor(result: GuardResult) {
    super(result.reason || 'RuntimeGuard 阻止了本次执行');
    this.name = 'RuntimeGuardError';
    this.policyId = result.policyId || 'runtime.guard.unknown';
    this.severity = result.severity;
    this.fixHint = result.fixHint;
  }
}

const ALLOW: GuardResult = { allowed: true, severity: 'pass' };

/**
 * 守卫决策入口。同步返回,不抛异常。
 * 调用方根据 allowed 自行选择抛 RuntimeGuardError 或走降级分支。
 */
export function guard(op: GuardOp, ctx: GuardContext): GuardResult {
  const { profile, ir, irNode, target } = ctx;

  // —— 通用闸 1:节点治理标记 ——
  // 任何 op 只要传了 irNode,都先检查 _illegal / _disabled
  if (irNode) {
    if (irNode._illegal) {
      return {
        allowed: false, severity: 'block',
        policyId: 'runtime.node.illegal',
        reason: irNode._rejectedReason || '节点被标记为非法,不得执行',
        fixHint: '移除该节点,或修复其引用后重新构建 IR',
      };
    }
    if (irNode._disabled) {
      return {
        allowed: false, severity: 'warn',
        policyId: 'runtime.node.disabled',
        reason: irNode._disabledReason || '节点在当前规格下被禁用',
        fixHint: '调整 spec 放开对应 feature,或移除该节点',
      };
    }
  }

  // —— 通用闸 2:IR 元一致性(profile 与 ir._meta 不漂移)——
  if (ir?._meta && ir._meta.profileId !== profile.id) {
    return {
      allowed: false, severity: 'block',
      policyId: 'runtime.ir_meta.profile_mismatch',
      reason: `IR 元数据 profileId(${ir._meta.profileId})与当前 profile(${profile.id})不一致`,
      fixHint: '使用当前 profile 重新构建 IR,或切换到匹配的 profile',
    };
  }


  // —— 通用闸 3(Phase 2.5):OSE 裁决联动 ——
  // 仅对执行类 op 生效;读/推理类不拦(避免诊断读路径与裁决环)
  const isExecOp = op === 'callFunction' || op === 'transition' || op === 'regenerate' || op === 'emitSignal';
  if (isExecOp && ctx.oseVerdict?.blocked) {
    return {
      allowed: false, severity: 'block',
      policyId: 'runtime.ose.blocked',
      reason: `OSE 裁决拒绝执行:${ctx.oseVerdict.reasons.length} 条阻断性诊断(首条:${ctx.oseVerdict.reasons[0] || '(无摘要)'})`,
      fixHint: ctx.oseVerdict.primaryFixHint || '修复 OSE 报告中的 block / block_with_fix_hint 诊断后重试',
    };
  }

  // —— op 专属规则 ——
  switch (op) {
    case 'callFunction': {
      if (!profile.runtimePermissions.allowFunctionCall) {
        return {
          allowed: false, severity: 'block',
          reason: `函数调用被规格层关闭(feature「functions」未启用)`,
          policyId: 'runtime.functions.disabled',
          fixHint: '在 feature-map.csl 中将 F_FUNCTIONS.状态 从 disabled 改为 active,或切换到 v0.9+ 语法版本',
        };
      }
      // IR 元数据双检:防止 "A profile 构建 IR、B profile 执行" 的漂移
      if (ir?._meta && !ir._meta.featureFlags.functions) {
        return {
          allowed: false, severity: 'block',
          policyId: 'runtime.ir_meta.functions_disabled',
          reason: 'IR 在 functions 关闭的规格下构建,不得执行函数调用',
          fixHint: '使用启用 functions 的 profile 重新构建 IR',
        };
      }
      if (target && ir) {
        const exists = ir.functions.some(f => f.name === target);
        if (!exists) {
          return {
            allowed: false, severity: 'block',
            reason: `函数「${target}」在 IR 中不存在`,
            policyId: 'runtime.node.not_found',
            fixHint: `在源码中声明「函数 ${target}(...) { ... }」,或检查拼写`,
          };
        }
      }
      return ALLOW;
    }

    case 'transition':
      return profile.runtimePermissions.allowStageTransition ? ALLOW : {
        allowed: false, severity: 'block',
        reason: '阶段转移被规格层关闭(feature「stage_transitions」未启用)',
        policyId: 'runtime.stage_transitions.disabled',
      };

    case 'regenerate':
      return profile.runtimePermissions.allowRegeneration ? ALLOW : {
        allowed: false, severity: 'block',
        reason: '再生事件被规格层关闭',
        policyId: 'runtime.regeneration.disabled',
      };

    case 'emitSignal':
      return profile.runtimePermissions.allowSignalEmit ? ALLOW : {
        allowed: false, severity: 'block',
        reason: '信号发射被规格层关闭',
        policyId: 'runtime.signals.disabled',
      };

    case 'infer':
      return profile.runtimePermissions.allowInference ? ALLOW : {
        allowed: false, severity: 'warn',
        reason: '推理被规格层关闭',
        policyId: 'runtime.inference.disabled',
      };

    // validate / select / trace 默认放行
    // 保留入口以便下游统一 enforce 调用;未来可按 spec 收紧
    case 'validate':
    case 'select':
    case 'trace':
    default:
      return ALLOW;
  }
}

/** 便捷版:直接抛异常 */
export function enforce(op: GuardOp, ctx: GuardContext): void {
  const r = guard(op, ctx);
  if (!r.allowed) throw new RuntimeGuardError(r);
}
