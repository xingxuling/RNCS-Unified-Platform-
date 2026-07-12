// P8 — Compare 报告导出
// P10 — Schema 冻结 (FROZEN at schemaVersion=1)
//
// 把 Compare 视图当下的 source/target 与所有比较字段拍平成一个 JSON,本地下载。
// 不依赖工作区,不写服务器,不修改任何对象状态。
//
// ============================================================
// SCHEMA 冻结契约 (P10 起生效)
// ============================================================
// 1. schemaVersion = 1 是当前已冻结版本。任何破坏性变更必须升号 → 2。
// 2. 必填顶层字段 (REQUIRED_TOP_FIELDS):
//      schemaVersion / generatedAt / source / target / fields / summary / sourceDiff
//    读取方必须能容忍这些字段的存在;缺失视为非法报告。
// 3. 必填对象字段 (REQUIRED_OBJECT_FIELDS):
//      id / name / bucket / version / stamps / lockState / oseStatus
//      / enabledModes / capabilities
//    任何对象侧字段不得在 v1 中删除或重命名。
// 4. 可选字段:
//      cslSystem (顶层) / compat (对象侧)
//    可缺省;读取方应做 null-safe 处理。
// 5. 未来扩展 (向后兼容追加规则):
//      a) 新增字段只能"追加",不得改名、不得改义。
//      b) 新增字段必须是可缺省的(读取方按 v1 策略仍能解析)。
//      c) 不向后兼容的变更 → 必须升 schemaVersion 并显式声明 migration。
// 6. 旧版本读取降级:
//      读取方应基于 schemaVersion 判定;遇到未来更高版本时,
//      仍应能读取所有 v1 字段(因为 v1 字段被冻结)。
// ============================================================

import type { ComparableObject } from '@/components/csl/CompareShellView';
import { diffLines, type DiffSummary } from './source-diff';

/** 当前冻结的 schema 版本 — 不可降低。新增不破坏的字段无须升号。 */
export const COMPARE_REPORT_SCHEMA_VERSION = 1;

/** v1 顶层必填字段(用于校验) */
export const REQUIRED_TOP_FIELDS = [
  'schemaVersion', 'generatedAt', 'source', 'target',
  'fields', 'summary', 'sourceDiff',
] as const;

/** v1 对象侧必填字段(用于校验) */
export const REQUIRED_OBJECT_FIELDS = [
  'id', 'name', 'bucket', 'version', 'stamps',
  'lockState', 'oseStatus', 'enabledModes', 'capabilities',
] as const;

export interface CompareReportFieldRow {
  key: string;
  label: string;
  source: string;
  target: string;
  same: boolean;
  /** 字段差异的语义类别:behavior 影响行为,meta 仅元信息 */
  category: 'same' | 'behavior' | 'meta';
}

export interface CompareReportObject {
  id: string;
  name: string;
  bucket: string;
  version: string;
  stamps: {
    grammarVersion: string;
    specVersion: number;
    compilerVersion: string;
    osePolicyVersion: number;
  };
  lockState: string;
  oseStatus: string;
  enabledModes: string[];
  /** 可选字段 — null-safe */
  compat: { verdict: string; primaryHint?: string; reasons: string[] } | null;
  capabilities: { canEdit: boolean; canRun: boolean; canExportBundle: boolean };
}

export interface CompareReport {
  schemaVersion: number;
  generatedAt: string;
  /** 可选元信息(非必填,读取方应做 null-safe) */
  cslSystem?: { note: string };
  source: CompareReportObject;
  target: CompareReportObject;
  fields: CompareReportFieldRow[];
  summary: {
    totalFields: number;
    same: number;
    behavior: number;
    meta: number;
  };
  sourceDiff: {
    enabled: boolean;
    summary: DiffSummary;
  };
}

/** 把 ComparableObject + 源码 拍平成报告对象 */
export function summarizeForReport(o: ComparableObject, _source: string): CompareReportObject {
  return {
    id: o.id,
    name: o.name,
    bucket: o.bucket,
    version: o.version,
    stamps: {
      grammarVersion: o.stamps.grammarVersion,
      specVersion: o.stamps.specVersion,
      compilerVersion: o.stamps.compilerVersion,
      osePolicyVersion: o.stamps.osePolicyVersion,
    },
    lockState: o.lockState,
    oseStatus: o.oseStatus,
    enabledModes: [...o.enabledModes],
    compat: o.compat
      ? { verdict: o.compat.verdict, primaryHint: o.compat.primaryHint, reasons: [...(o.compat.reasons ?? [])] }
      : null,
    capabilities: { canEdit: o.canEdit, canRun: o.canRun, canExportBundle: o.canExportBundle },
  };
  // 注意:不嵌入源码本身,避免报告体积爆炸。源码 diff 单独计算 summary。
}

interface BuildOpts {
  source: ComparableObject;
  target: ComparableObject;
  sourceCode: string;
  targetCode: string;
  /** 字段表(从 CompareShellView 派生) */
  fields: CompareReportFieldRow[];
}

export function buildCompareReport(opts: BuildOpts): CompareReport {
  const { source, target, sourceCode, targetCode, fields } = opts;
  const summary = {
    totalFields: fields.length,
    same:     fields.filter(f => f.category === 'same').length,
    behavior: fields.filter(f => f.category === 'behavior').length,
    meta:     fields.filter(f => f.category === 'meta').length,
  };
  const { summary: diffSummary } = diffLines(sourceCode, targetCode);
  return {
    schemaVersion: COMPARE_REPORT_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    cslSystem: { note: 'CSL Compare Report — 仅供审阅,不可还原源码。' },
    source: summarizeForReport(source, sourceCode),
    target: summarizeForReport(target, targetCode),
    fields,
    summary,
    sourceDiff: {
      enabled: true,
      summary: diffSummary,
    },
  };
}

/** 校验结果 — 用于读取/导入端的契约自检 */
export interface CompareReportValidation {
  ok: boolean;
  schemaVersion: number | null;
  /** future: 高于当前已知版本,但仍可按 v1 字段读取 */
  forwardCompatible: boolean;
  missingTopFields: string[];
  missingSourceFields: string[];
  missingTargetFields: string[];
  reasons: string[];
}

/**
 * 校验一个未知来源的 JSON 是否符合 v1 冻结契约。
 * 设计意图:
 *   - 缺失必填字段 → ok=false
 *   - schemaVersion > 当前 → ok=true 且 forwardCompatible=true(v1 字段冻结,前向可读)
 *   - schemaVersion < 1 (例如 0 或不合法) → ok=false
 */
export function validateCompareReport(input: unknown): CompareReportValidation {
  const reasons: string[] = [];
  const missingTopFields: string[] = [];
  const missingSourceFields: string[] = [];
  const missingTargetFields: string[] = [];
  if (!input || typeof input !== 'object') {
    return {
      ok: false, schemaVersion: null, forwardCompatible: false,
      missingTopFields: [...REQUIRED_TOP_FIELDS], missingSourceFields: [], missingTargetFields: [],
      reasons: ['报告不是对象'],
    };
  }
  const obj = input as Record<string, unknown>;
  for (const k of REQUIRED_TOP_FIELDS) {
    if (!(k in obj)) missingTopFields.push(k);
  }
  const sv = typeof obj.schemaVersion === 'number' ? obj.schemaVersion : null;
  if (sv === null) reasons.push('schemaVersion 非法或缺失');
  else if (sv < 1) reasons.push(`schemaVersion=${sv} 低于已冻结的 v1`);

  const checkObjFields = (side: 'source' | 'target', sink: string[]) => {
    const o = obj[side];
    if (!o || typeof o !== 'object') {
      reasons.push(`${side} 缺失或不是对象`);
      sink.push(...REQUIRED_OBJECT_FIELDS);
      return;
    }
    const oo = o as Record<string, unknown>;
    for (const k of REQUIRED_OBJECT_FIELDS) {
      if (!(k in oo)) sink.push(k);
    }
  };
  checkObjFields('source', missingSourceFields);
  checkObjFields('target', missingTargetFields);

  const forwardCompatible = sv !== null && sv > COMPARE_REPORT_SCHEMA_VERSION;
  const ok = missingTopFields.length === 0
          && missingSourceFields.length === 0
          && missingTargetFields.length === 0
          && (sv !== null && sv >= 1);

  return { ok, schemaVersion: sv, forwardCompatible, missingTopFields, missingSourceFields, missingTargetFields, reasons };
}

export function downloadCompareReport(report: CompareReport, filename?: string): void {
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeA = report.source.name.replace(/[^\w.-]+/g, '_').slice(0, 24);
  const safeB = report.target.name.replace(/[^\w.-]+/g, '_').slice(0, 24);
  a.href = url;
  a.download = filename ?? `csl-compare__${safeA}__vs__${safeB}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
