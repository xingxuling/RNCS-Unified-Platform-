// P14 — L2 弱绑定与 OSE v2 测试
import { describe, it, expect } from 'vitest';
import {
  parseL2, computeL2WeakBinding, runL2OSEv2, L2_ALL_FLAGS,
} from '@/csl/lab/l2';

const SRC = `
引擎 治理引擎:
  模块 准入校验

模块 准入校验:
  前置 主体已声明
  后置 准入记录已写入

职责 合规审核 归属 治理引擎
职责 流浪职责 归属 不存在引擎

前置 主体已声明: subject != null
后置 准入记录已写入: log.contains('admit')
`.trim();

describe('P14 — L2 弱绑定', () => {
  it('owner 指向不存在引擎 → unresolved', () => {
    const p = parseL2(SRC, { enabled: L2_ALL_FLAGS });
    const b = computeL2WeakBinding(p.ir, { names: new Set() });
    expect(b.unresolved.some(u => u.from === 'responsibility:流浪职责')).toBe(true);
  });

  it('引擎名 / 模块名与主线对象同名 → maybeLinked', () => {
    const p = parseL2(SRC, { enabled: L2_ALL_FLAGS });
    const b = computeL2WeakBinding(p.ir, {
      names: new Set(['治理引擎', '准入校验']),
      byCategory: { concepts: ['治理引擎'], subjects: ['准入校验'] },
    });
    const names = b.maybeLinked.map(m => m.l2Name);
    expect(names).toContain('治理引擎');
    expect(names).toContain('准入校验');
    expect(b.hints.length).toBeGreaterThan(0);
  });

  it('主线名集合为空时不崩,只产 unresolved', () => {
    const p = parseL2(SRC, { enabled: L2_ALL_FLAGS });
    const b = computeL2WeakBinding(p.ir, { names: new Set() });
    expect(b.maybeLinked).toEqual([]);
    expect(b.unresolved.length).toBeGreaterThan(0);
  });
});

describe('P14 — L2 OSE v2', () => {
  it('owner 指向未知引擎 → L2_OSE_RESP_OWNER_UNKNOWN', () => {
    const p = parseL2(SRC, { enabled: L2_ALL_FLAGS });
    const r = runL2OSEv2(p.ir);
    expect(r.diagnostics.some(d => d.code === 'L2_OSE_RESP_OWNER_UNKNOWN')).toBe(true);
  });

  it('约束 expr 冲突 → L2_OSE_CONSTRAINT_EXPR_CONFLICT', () => {
    const conflict = `
前置 X: a == 1
前置 X: a == 2
`.trim();
    const p = parseL2(conflict, { enabled: L2_ALL_FLAGS });
    const r = runL2OSEv2(p.ir);
    expect(r.diagnostics.some(d => d.code === 'L2_OSE_CONSTRAINT_EXPR_CONFLICT')).toBe(true);
  });

  it('约束 kind 冲突 → L2_OSE_CONSTRAINT_KIND_CONFLICT', () => {
    const conflict = `
前置 X: a == 1
后置 X: a == 1
`.trim();
    const p = parseL2(conflict, { enabled: L2_ALL_FLAGS });
    const r = runL2OSEv2(p.ir);
    expect(r.diagnostics.some(d => d.code === 'L2_OSE_CONSTRAINT_KIND_CONFLICT')).toBe(true);
  });

  it('引擎声明未定义模块 → L2_OSE_ENGINE_UNKNOWN_MODULE', () => {
    const src = `
引擎 E:
  模块 不存在模块
`.trim();
    const p = parseL2(src, { enabled: L2_ALL_FLAGS });
    const r = runL2OSEv2(p.ir);
    expect(r.diagnostics.some(d => d.code === 'L2_OSE_ENGINE_UNKNOWN_MODULE')).toBe(true);
  });
});
