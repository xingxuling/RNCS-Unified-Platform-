// OSEVerdict 稳定 schema — P1 收尾
// 任何跨层(runtime ↔ projection ↔ export)流转的 OSEVerdict 必须满足此 schema。
// 防止未来再次出现"UI blocked 但 runtime 不拦"的退化。

import type { OSEVerdict } from './guard';

export interface OSEVerdictSchemaIssue {
  field: string;
  expected: string;
  got: string;
}

/**
 * 校验任意值是否符合 OSEVerdict 形状。
 * - blocked: boolean (必填)
 * - reasons: string[] (必填,允许空数组)
 * - primaryFixHint: string | undefined (可选)
 */
export function validateOSEVerdict(v: unknown): { ok: boolean; issues: OSEVerdictSchemaIssue[] } {
  const issues: OSEVerdictSchemaIssue[] = [];
  if (!v || typeof v !== 'object') {
    return { ok: false, issues: [{ field: '<root>', expected: 'object', got: typeof v }] };
  }
  const o = v as Record<string, unknown>;
  if (typeof o.blocked !== 'boolean') {
    issues.push({ field: 'blocked', expected: 'boolean', got: typeof o.blocked });
  }
  if (!Array.isArray(o.reasons)) {
    issues.push({ field: 'reasons', expected: 'string[]', got: typeof o.reasons });
  } else {
    for (let i = 0; i < o.reasons.length; i++) {
      if (typeof o.reasons[i] !== 'string') {
        issues.push({ field: `reasons[${i}]`, expected: 'string', got: typeof o.reasons[i] });
        break;
      }
    }
  }
  if (o.primaryFixHint !== undefined && typeof o.primaryFixHint !== 'string') {
    issues.push({ field: 'primaryFixHint', expected: 'string|undefined', got: typeof o.primaryFixHint });
  }
  // 语义对齐:blocked=true 则 reasons 至少一条
  if (o.blocked === true && Array.isArray(o.reasons) && o.reasons.length === 0) {
    issues.push({ field: 'reasons', expected: 'non-empty when blocked=true', got: 'empty array' });
  }
  return { ok: issues.length === 0, issues };
}

/** 抛错版本(供生产路径) */
export function assertOSEVerdict(v: unknown): asserts v is OSEVerdict {
  const r = validateOSEVerdict(v);
  if (!r.ok) {
    const msg = r.issues.map(i => `${i.field}:expected ${i.expected},got ${i.got}`).join('; ');
    throw new Error(`[OSEVerdict/schema] 不符合 schema: ${msg}`);
  }
}
