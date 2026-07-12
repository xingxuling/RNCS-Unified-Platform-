// P13 — L2 影子分支:summary / compare / OSE 测试
import { describe, it, expect } from 'vitest';
import {
  parseL2, summarizeL2, compareL2, runL2OSE, L2_ALL_FLAGS,
} from '@/csl/lab/l2';

const LEFT = `
引擎 治理引擎:
  模块 准入校验
  职责 合规审核

模块 准入校验:
  前置 主体已声明

职责 合规审核 归属 治理引擎
前置 主体已声明: subject != null
`.trim();

const RIGHT = `
引擎 治理引擎:
  模块 准入校验
  模块 风险监测
  职责 合规审核

模块 准入校验:
  前置 主体已声明
  后置 准入记录已写入

职责 合规审核 归属 治理引擎
前置 主体已声明: subject != null
后置 准入记录已写入: log.contains('admit')
`.trim();

describe('P13 — L2 summary', () => {
  it('summarize 给出四类计数与每行摘要', () => {
    const ir = parseL2(LEFT, { enabled: L2_ALL_FLAGS }).ir;
    const s = summarizeL2(ir);
    expect(s.counts).toEqual({ engines: 1, modules: 1, responsibilities: 1, constraints: 1 });
    expect(s.lines.some(l => l.startsWith('[引擎]'))).toBe(true);
    expect(s.lines.some(l => l.startsWith('[模块]'))).toBe(true);
    expect(s.lines.some(l => l.startsWith('[职责]'))).toBe(true);
    expect(s.lines.some(l => l.startsWith('[约束 前置]'))).toBe(true);
  });
});

describe('P13 — L2 compare', () => {
  it('left vs right 至少出现 add / mod 各一例', () => {
    const a = parseL2(LEFT, { enabled: L2_ALL_FLAGS }).ir;
    const b = parseL2(RIGHT, { enabled: L2_ALL_FLAGS }).ir;
    const r = compareL2(a, b);
    expect(r.counts.add).toBeGreaterThan(0); // 风险监测 / 准入记录已写入
    expect(r.counts.mod).toBeGreaterThan(0); // 引擎 / 模块字段差异
    // 引擎条目应是 mod
    const eng = r.entries.find(e => e.category === 'engine' && e.name === '治理引擎');
    expect(eng?.kind).toBe('mod');
    expect(eng?.fieldDiffs?.some(f => f.field === 'modules')).toBe(true);
  });
});

describe('P13 — L2 OSE 影子治理', () => {
  it('引擎缺模块 → warn', () => {
    const ir = parseL2('引擎 空引擎:', { enabled: L2_ALL_FLAGS }).ir;
    const r = runL2OSE(ir);
    expect(r.diagnostics.some(d => d.code === 'L2_OSE_ENGINE_NO_MODULE')).toBe(true);
  });

  it('模块无前后约束 → warn', () => {
    const ir = parseL2('模块 空模块:', { enabled: L2_ALL_FLAGS }).ir;
    const r = runL2OSE(ir);
    expect(r.diagnostics.some(d => d.code === 'L2_OSE_MODULE_NO_CONSTRAINT')).toBe(true);
  });

  it('职责未归属 → warn', () => {
    const ir = parseL2('职责 孤立职责', { enabled: L2_ALL_FLAGS }).ir;
    const r = runL2OSE(ir);
    expect(r.diagnostics.some(d => d.code === 'L2_OSE_RESP_NO_OWNER')).toBe(true);
  });

  it('模块引用未定义约束 → warn', () => {
    const src = `
模块 X:
  前置 不存在的约束
`.trim();
    const ir = parseL2(src, { enabled: L2_ALL_FLAGS }).ir;
    const r = runL2OSE(ir);
    expect(r.diagnostics.some(d => d.code === 'L2_OSE_CONSTRAINT_UNRESOLVED')).toBe(true);
  });

  it('完整样例下,无 unresolved 约束告警', () => {
    const ir = parseL2(`
模块 准入校验:
  前置 主体已声明
前置 主体已声明: subject != null
`.trim(), { enabled: L2_ALL_FLAGS }).ir;
    const r = runL2OSE(ir);
    expect(r.diagnostics.some(d => d.code === 'L2_OSE_CONSTRAINT_UNRESOLVED')).toBe(false);
  });
});
