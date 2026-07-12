// P11 — Compare schema migration skeleton
import { describe, it, expect } from 'vitest';
import {
  detectCompareSchemaVersion, migrateCompareReport, upgradeToCurrentSchema,
} from '@/csl/ui/compare-migration';
import { COMPARE_REPORT_SCHEMA_VERSION } from '@/csl/ui/compare-report';

const v1ObjectFields = {
  id: 'x', name: 'X', bucket: 'template', version: 'v0.8',
  stamps: { grammarVersion: 'v0.8', specVersion: 1, compilerVersion: 'c1', osePolicyVersion: 1 },
  lockState: 'editable', oseStatus: 'pass', enabledModes: [],
  capabilities: { canEdit: true, canRun: true, canExportBundle: true },
};

function makeV1Report(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    source: { ...v1ObjectFields, id: 'a', name: 'A' },
    target: { ...v1ObjectFields, id: 'b', name: 'B' },
    fields: [],
    summary: { totalFields: 0, same: 0, behavior: 0, meta: 0 },
    sourceDiff: { enabled: true, summary: { add: 0, del: 0, mod: 0, same: 0 } },
    ...overrides,
  };
}

describe('P11 — compare schema migration', () => {
  it('detectCompareSchemaVersion 拿到版本号', () => {
    expect(detectCompareSchemaVersion(makeV1Report())).toBe(1);
    expect(detectCompareSchemaVersion(null)).toBeNull();
    expect(detectCompareSchemaVersion({})).toBeNull();
  });

  it('合法 v1 → ok_current', () => {
    const r = migrateCompareReport(makeV1Report());
    expect(r.status).toBe('ok_current');
  });

  it('未来 v2 (字段补齐) → forward_compat', () => {
    const r = migrateCompareReport(makeV1Report({ schemaVersion: 2, futureField: 'ignored' }));
    expect(r.status).toBe('forward_compat');
  });

  it('低于 v1 → invalid (validateCompareReport 拒绝)', () => {
    const r = migrateCompareReport(makeV1Report({ schemaVersion: 0 }));
    expect(r.status).toBe('invalid');
  });

  it('缺字段 → invalid', () => {
    const bad = makeV1Report();
    delete (bad as Record<string, unknown>).fields;
    const r = migrateCompareReport(bad);
    expect(r.status).toBe('invalid');
  });

  it('upgradeToCurrentSchema 对 v1 / v2 都返回报告', () => {
    expect(() => upgradeToCurrentSchema(makeV1Report())).not.toThrow();
    expect(() => upgradeToCurrentSchema(makeV1Report({ schemaVersion: 2 }))).not.toThrow();
  });

  it('upgradeToCurrentSchema 对非法报告抛错', () => {
    expect(() => upgradeToCurrentSchema({ junk: true })).toThrow();
  });

  it('当前 SCHEMA 常量仍为 1 (P11 不升号)', () => {
    expect(COMPARE_REPORT_SCHEMA_VERSION).toBe(1);
  });
});
