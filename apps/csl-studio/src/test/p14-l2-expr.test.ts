// P14 — L2 expr 最小子集解析测试
import { describe, it, expect } from 'vitest';
import { parseL2Expr, collectExprRefs } from '@/csl/lab/l2';

describe('P14 — L2 expr 最小子集', () => {
  it('字面量 / 标识符 / 比较 ok', () => {
    const r = parseL2Expr('subject != null');
    expect(r.ok).toBe(true);
    expect(r.ast?.kind).toBe('cmp');
  });

  it('member path 与 call 都可解析', () => {
    const r1 = parseL2Expr('subject.status == "admit"');
    expect(r1.ok).toBe(true);
    expect(r1.ast?.kind).toBe('cmp');

    const r2 = parseL2Expr("log.contains('admit')");
    expect(r2.ok).toBe(true);
    expect(r2.ast?.kind).toBe('call');
  });

  it('and / or 逻辑组合', () => {
    const r = parseL2Expr('a > 1 and b < 10');
    expect(r.ok).toBe(true);
    expect(r.ast?.kind).toBe('logic');
  });

  it('数字与布尔字面量', () => {
    const r1 = parseL2Expr('count >= 3');
    expect(r1.ok).toBe(true);
    const r2 = parseL2Expr('flag == true');
    expect(r2.ok).toBe(true);
  });

  it('解析失败时不抛异常,带 fallback 诊断', () => {
    const r = parseL2Expr('@@@$$$');
    expect(r.ok).toBe(false);
    expect(r.diagnostics.length).toBeGreaterThan(0);
    expect(r.raw).toBe('@@@$$$');
  });

  it('空表达式给 info', () => {
    const r = parseL2Expr('   ');
    expect(r.ok).toBe(false);
    expect(r.diagnostics[0].code).toBe('L2_EXPR_EMPTY');
  });

  it('collectExprRefs 收集顶层名', () => {
    const r = parseL2Expr('subject.status == "x" and log.contains("y")');
    expect(r.ok).toBe(true);
    const refs = collectExprRefs(r.ast!);
    expect(refs).toContain('subject');
    expect(refs).toContain('log');
  });
});
