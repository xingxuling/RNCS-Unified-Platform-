// P13 — L2 影子分支:parser / gate / AST / IR snapshot 测试
import { describe, it, expect } from 'vitest';
import {
  parseL2, L2_ALL_FLAGS,
} from '@/csl/lab/l2';

const SAMPLE = `
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

describe('P13 — L2 parser / gate', () => {
  it('flag 全关时,所有 L2 顶层声明都被拒绝并给出 L2_FLAG_DISABLED', () => {
    const r = parseL2(SAMPLE, { enabled: [] });
    expect(r.ir.engines).toHaveLength(0);
    expect(r.ir.modules).toHaveLength(0);
    expect(r.ir.responsibilities).toHaveLength(0);
    expect(r.ir.constraints).toHaveLength(0);
    const codes = r.diagnostics.map(d => d.code);
    expect(codes).toContain('L2_FLAG_DISABLED');
  });

  it('全部 flag 开启时,可识别四类语法,IR 形状完整', () => {
    const r = parseL2(SAMPLE, { enabled: L2_ALL_FLAGS });

    expect(r.ir.engines).toEqual([
      { name: '治理引擎', modules: ['准入校验', '风险监测'], responsibilities: ['合规审核'] },
    ]);
    expect(r.ir.modules).toEqual([
      { name: '准入校验', pre: ['主体已声明'], post: ['准入记录已写入'] },
    ]);
    expect(r.ir.responsibilities).toEqual([
      { name: '合规审核', owner: '治理引擎' },
    ]);
    expect(r.ir.constraints).toEqual([
      { name: '主体已声明', kind: 'pre', expr: "subject != null" },
      { name: '准入记录已写入', kind: 'post', expr: "log.contains('admit')" },
    ]);

    // 没有 disabled 诊断
    expect(r.diagnostics.find(d => d.code === 'L2_FLAG_DISABLED')).toBeUndefined();
  });

  it('部分 flag 开启:仅开 engines 时,模块/职责/约束顶层独立声明被拒,但引擎子项中相应 flag 也会被拒', () => {
    const r = parseL2(SAMPLE, { enabled: ['l2.engines'] });
    // 引擎本身识别成功
    expect(r.ir.engines).toHaveLength(1);
    // 引擎的 modules / responsibilities 因子项 flag 关闭被剔除
    expect(r.ir.engines[0].modules).toEqual([]);
    expect(r.ir.engines[0].responsibilities).toEqual([]);
    // 顶层模块/职责/约束都没识别
    expect(r.ir.modules).toHaveLength(0);
    expect(r.ir.responsibilities).toHaveLength(0);
    expect(r.ir.constraints).toHaveLength(0);
  });

  it('AST 节点带 source span', () => {
    const r = parseL2(SAMPLE, { enabled: L2_ALL_FLAGS });
    for (const n of r.program.nodes) {
      expect(n.span.line).toBeGreaterThan(0);
    }
  });
});
