// P10 — Compare 报告 schema 冻结测试
// 目标:确认 schemaVersion=1 的契约稳定;校验器对缺失字段、非法版本、前向兼容均能正确判断。

import { describe, it, expect } from 'vitest';
import {
  COMPARE_REPORT_SCHEMA_VERSION,
  REQUIRED_TOP_FIELDS,
  REQUIRED_OBJECT_FIELDS,
  buildCompareReport,
  validateCompareReport,
  type CompareReportFieldRow,
} from '@/csl/ui/compare-report';
import type { ComparableObject } from '@/components/csl/CompareShellView';

function mkObj(id: string, overrides: Partial<ComparableObject> = {}): ComparableObject {
  return {
    id, name: `obj-${id}`, bucket: 'template', version: 'v0.8',
    stamps: { grammarVersion: 'v0.8', specVersion: 1, compilerVersion: '0.8.0', osePolicyVersion: 1 },
    lockState: 'editable', oseStatus: 'pass',
    enabledModes: ['scratch','review'],
    canEdit: true, canRun: true, canExportBundle: true,
    ...overrides,
  };
}

const FIELDS: CompareReportFieldRow[] = [
  { key: 'name', label: '对象名', source: 'A', target: 'B', same: false, category: 'meta' },
  { key: 'version', label: '版本', source: 'v0.8', target: 'v0.8', same: true, category: 'same' },
  { key: 'lockState', label: 'lockState', source: 'editable', target: 'read_only', same: false, category: 'behavior' },
];

describe('P10 — Compare 报告 schema 冻结', () => {
  it('SCHEMA_VERSION 必须为 1(冻结值)', () => {
    expect(COMPARE_REPORT_SCHEMA_VERSION).toBe(1);
  });

  it('REQUIRED_TOP_FIELDS 包含已冻结的 7 个顶层字段', () => {
    expect(REQUIRED_TOP_FIELDS).toEqual([
      'schemaVersion','generatedAt','source','target','fields','summary','sourceDiff',
    ]);
  });

  it('REQUIRED_OBJECT_FIELDS 包含已冻结的 9 个对象字段', () => {
    expect(REQUIRED_OBJECT_FIELDS).toEqual([
      'id','name','bucket','version','stamps','lockState','oseStatus','enabledModes','capabilities',
    ]);
  });

  it('buildCompareReport 产出的报告应通过 v1 校验', () => {
    const r = buildCompareReport({
      source: mkObj('a'),
      target: mkObj('b', { lockState: 'read_only' }),
      sourceCode: 'line1\nline2',
      targetCode: 'line1\nline2-changed',
      fields: FIELDS,
    });
    const v = validateCompareReport(r);
    expect(v.ok).toBe(true);
    expect(v.schemaVersion).toBe(1);
    expect(v.forwardCompatible).toBe(false);
    expect(v.missingTopFields).toEqual([]);
    expect(v.missingSourceFields).toEqual([]);
    expect(v.missingTargetFields).toEqual([]);
  });

  it('summary 字段统计应正确', () => {
    const r = buildCompareReport({
      source: mkObj('a'), target: mkObj('b'),
      sourceCode: '', targetCode: '', fields: FIELDS,
    });
    expect(r.summary.totalFields).toBe(3);
    expect(r.summary.same).toBe(1);
    expect(r.summary.behavior).toBe(1);
    expect(r.summary.meta).toBe(1);
    expect(r.sourceDiff.enabled).toBe(true);
    expect(typeof r.sourceDiff.summary.same).toBe('number');
  });

  it('compat 字段是可选的(null-safe)', () => {
    const r = buildCompareReport({
      source: mkObj('a'), target: mkObj('b'),
      sourceCode: '', targetCode: '', fields: FIELDS,
    });
    expect(r.source.compat).toBeNull();
    expect(r.target.compat).toBeNull();
    const v = validateCompareReport(r);
    expect(v.ok).toBe(true);
  });

  it('校验器对缺失顶层字段应报告并 ok=false', () => {
    const v = validateCompareReport({ schemaVersion: 1 });
    expect(v.ok).toBe(false);
    expect(v.missingTopFields).toContain('source');
    expect(v.missingTopFields).toContain('target');
    expect(v.missingTopFields).toContain('fields');
  });

  it('校验器对非法 schemaVersion 应 ok=false', () => {
    const v = validateCompareReport({ schemaVersion: 0, generatedAt: '', source: {}, target: {}, fields: [], summary: {}, sourceDiff: {} });
    expect(v.ok).toBe(false);
    expect(v.reasons.some(r => r.includes('低于已冻结'))).toBe(true);
  });

  it('校验器对未来版本应 ok=true 且 forwardCompatible=true(v1 字段冻结,前向可读)', () => {
    const r = buildCompareReport({
      source: mkObj('a'), target: mkObj('b'),
      sourceCode: '', targetCode: '', fields: FIELDS,
    });
    const future = { ...r, schemaVersion: 2, futureField: 'extra' };
    const v = validateCompareReport(future);
    expect(v.ok).toBe(true);
    expect(v.forwardCompatible).toBe(true);
    expect(v.schemaVersion).toBe(2);
  });

  it('校验器对非对象输入应 ok=false', () => {
    expect(validateCompareReport(null).ok).toBe(false);
    expect(validateCompareReport('not a report').ok).toBe(false);
    expect(validateCompareReport(42).ok).toBe(false);
  });
});
