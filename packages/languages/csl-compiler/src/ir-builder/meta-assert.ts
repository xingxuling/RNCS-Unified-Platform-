// IR._meta 完整性断言 — P1 收尾
// 任何被 runtime / projection / export 消费的 IR,_meta 必须完整。
// 缺字段直接抛错,绝不允许静默通过。

import type { IRContainer } from '../types';

/** _meta 必须包含的字段(按 IRMeta 接口 7 项核心) */
const REQUIRED_META_FIELDS = [
  'profileId',
  'grammarVersion',
  'specVersion',
  'compilerVersion',
  'osePolicyVersion',
  'featureFlags',
  'enabledModes',
] as const;

const REQUIRED_OSE_POLICY_FIELDS = [
  'version',
  'enabledHooks',
  'blockingHooks',
] as const;

export interface IRMetaCheckResult {
  ok: boolean;
  missing: string[];
  reasons: string[];
}

/** 纯检查版,返回缺失字段列表 */
export function checkIRMetaCompleteness(ir: IRContainer): IRMetaCheckResult {
  const missing: string[] = [];
  const reasons: string[] = [];
  if (!ir._meta) {
    return { ok: false, missing: ['_meta'], reasons: ['IR._meta 缺失,profile 未在 buildIR 阶段注入'] };
  }
  const m = ir._meta as unknown as Record<string, unknown>;
  for (const f of REQUIRED_META_FIELDS) {
    if (m[f] === undefined || m[f] === null) {
      missing.push(f);
      reasons.push(`_meta.${f} 缺失`);
    }
  }
  // featureFlags 必须是非空对象
  if (m.featureFlags && typeof m.featureFlags === 'object' && Object.keys(m.featureFlags as object).length === 0) {
    reasons.push('_meta.featureFlags 是空对象,profile 编译异常');
  }
  // enabledModes 必须是数组
  if (m.enabledModes !== undefined && !Array.isArray(m.enabledModes)) {
    missing.push('enabledModes');
    reasons.push('_meta.enabledModes 不是数组');
  }
  // osePolicySet 子字段
  const ops = m.osePolicySet as Record<string, unknown> | undefined;
  if (!ops) {
    missing.push('osePolicySet');
    reasons.push('_meta.osePolicySet 缺失');
  } else {
    for (const f of REQUIRED_OSE_POLICY_FIELDS) {
      if (ops[f] === undefined || ops[f] === null) {
        missing.push(`osePolicySet.${f}`);
        reasons.push(`_meta.osePolicySet.${f} 缺失`);
      }
    }
  }
  return { ok: missing.length === 0 && reasons.length === 0, missing, reasons };
}

/** 抛错版,在 buildIR 末尾调用,生产路径强制把关 */
export function assertIRMetaComplete(ir: IRContainer): void {
  const r = checkIRMetaCompleteness(ir);
  if (!r.ok) {
    throw new Error(
      `[IR/_meta] 完整性检查失败 — 缺字段: [${r.missing.join(', ')}];详情: ${r.reasons.join('; ')}`,
    );
  }
}
