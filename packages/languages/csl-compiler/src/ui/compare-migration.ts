// P11 — Compare 报告 schema migration 预备
//
// 当前版本仍是 v1 (P10 已冻结)。本模块只做"迁移骨架",不做破坏性变更。
//
// 设计意图:
//   - 让未来 v2/v3 出现时,有一个明确的入口 (migrateCompareReport),
//     而不是临时改动 buildCompareReport / validateCompareReport。
//   - 当前所有 v1 输入都"原样返回",仅做必填字段校验委托。
//   - 高于当前版本的输入 → 不静默回退,返回明确状态,由调用方决定。
//
// 纪律:
//   - 本模块不修改 buildCompareReport / downloadCompareReport 的输出。
//   - 不引入新的 schemaVersion 常量 — 仍以 COMPARE_REPORT_SCHEMA_VERSION 为准。
//   - 任何真实迁移逻辑(v1 → v2 字段补全/重命名)都必须在升号时显式登记。

import {
  COMPARE_REPORT_SCHEMA_VERSION,
  validateCompareReport,
  type CompareReport,
  type CompareReportValidation,
} from './compare-report';

export type CompareMigrationOutcome =
  | { status: 'ok_current';     report: CompareReport;  detected: number; validation: CompareReportValidation }
  | { status: 'forward_compat'; report: CompareReport;  detected: number; validation: CompareReportValidation }
  | { status: 'needs_upgrade';  detected: number; from: number; to: number; validation: CompareReportValidation }
  | { status: 'invalid';        detected: number | null; validation: CompareReportValidation };

export function detectCompareSchemaVersion(input: unknown): number | null {
  if (!input || typeof input !== 'object') return null;
  const sv = (input as Record<string, unknown>).schemaVersion;
  return typeof sv === 'number' ? sv : null;
}

/**
 * 迁移入口 — 当前版本 (v1) 下:
 *   - 合法 v1 → ok_current
 *   - 合法但 schemaVersion > 当前 → forward_compat (按 v1 字段读取)
 *   - 合法但 schemaVersion < 当前 → needs_upgrade (留给未来真正实现)
 *   - 校验不过 → invalid
 *
 * 当未来出现 v2 时,在此函数内追加 v1→v2 的字段映射;
 * 严禁在 buildCompareReport 内做向后兼容补丁 — 那会污染输出契约。
 */
export function migrateCompareReport(input: unknown): CompareMigrationOutcome {
  const detected = detectCompareSchemaVersion(input);
  const validation = validateCompareReport(input);

  if (!validation.ok) {
    return { status: 'invalid', detected, validation };
  }

  const sv = detected ?? COMPARE_REPORT_SCHEMA_VERSION;

  if (sv === COMPARE_REPORT_SCHEMA_VERSION) {
    return {
      status: 'ok_current',
      report: input as CompareReport,
      detected: sv,
      validation,
    };
  }

  if (sv > COMPARE_REPORT_SCHEMA_VERSION) {
    // 前向兼容 — v1 字段被冻结,仍可按 v1 读取。
    return {
      status: 'forward_compat',
      report: input as CompareReport,
      detected: sv,
      validation,
    };
  }

  // sv < current — 当前不存在低版本,但保留分支供未来 v2+ 迁移使用
  return {
    status: 'needs_upgrade',
    detected: sv,
    from: sv,
    to: COMPARE_REPORT_SCHEMA_VERSION,
    validation,
  };
}

/**
 * 显式"升级到当前 schema"的便捷入口。
 * 当前 v1 下:
 *   - ok_current / forward_compat → 返回原报告
 *   - needs_upgrade / invalid     → 抛错,要求调用方处理
 *
 * 未来出现 v2 时,在此叠加 stepwise migration (v1→v2→…→current)。
 */
export function upgradeToCurrentSchema(input: unknown): CompareReport {
  const r = migrateCompareReport(input);
  if (r.status === 'ok_current' || r.status === 'forward_compat') {
    return r.report;
  }
  if (r.status === 'needs_upgrade') {
    throw new Error(
      `Compare 报告 schemaVersion=${r.from} 低于当前 v${r.to} — 尚未实现升级路径`,
    );
  }
  throw new Error(`Compare 报告非法 — ${r.validation.reasons.join('; ') || '未知原因'}`);
}
