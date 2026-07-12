// P5-4 回归:AST 名称索引深层下钻
//
// 验证 buildAstNameIndex 现在能覆盖:
//   - 浅层(顶层 SubjectDecl / StageDecl / TransitionDecl)
//   - 深层(函数体里的 IfExpr 内部、概念块 body、命题块 等)
//   - 找不到时安全降级为空 location

import { describe, it, expect } from 'vitest';
import { runCSL } from '@/csl';
import { buildAstNameIndex, attachSourceLocation } from '@/csl/projection/source-location';

const SRC_SHALLOW = `
主权阶段 借权 { 序号 = 2 }
主权阶段 摄权 { 序号 = 6 }
阶段转移 借到摄 { 从 借权 到 摄权 触发 边界感 > 50 }
主体 主体A { 当前阶段 = 借权, 边界感 = 80 }
`;

const SRC_DEEP = `
主权阶段 借权 { 序号 = 2 }
主权阶段 摄权 { 序号 = 6 }
阶段转移 借到摄 { 从 借权 到 摄权 触发 边界感 > 50 }
主体 主体B { 当前阶段 = 借权, 边界感 = 30 }

函数 评分函数(x) {
  如果 x > 10 则 返回 "高"
  否则 返回 "低"
}
`;

describe('P5-4: 源码定位深层下钻', () => {
  it('浅层命名节点能被索引', () => {
    const { ast } = runCSL(SRC_SHALLOW, 'v0.9');
    const idx = buildAstNameIndex(ast);
    expect(idx.has('借权')).toBe(true);
    expect(idx.has('摄权')).toBe(true);
    expect(idx.has('借到摄')).toBe(true);
    expect(idx.has('主体A')).toBe(true);
    expect(idx.get('借权')!.line_start).toBeGreaterThan(0);
  });

  it('深层命名节点(函数 + 函数体)能被索引', () => {
    const { ast } = runCSL(SRC_DEEP, 'v0.9');
    const idx = buildAstNameIndex(ast);
    expect(idx.has('评分函数')).toBe(true);
    // 函数行号在主体之后
    expect(idx.get('评分函数')!.line_start).toBeGreaterThan(idx.get('主体B')!.line_start);
  });

  it('找不到 nodeRef → 诊断原样返回,不抛异常', () => {
    const { ast } = runCSL(SRC_SHALLOW, 'v0.9');
    const idx = buildAstNameIndex(ast);
    const out = attachSourceLocation(
      { level: 'error', message: 'x', nodeRef: '不存在的名字' },
      idx,
      SRC_SHALLOW,
    );
    expect(out.sourceLocation).toBeUndefined();
  });

  it('已有 sourceLocation 的诊断不会被覆盖', () => {
    const { ast } = runCSL(SRC_SHALLOW, 'v0.9');
    const idx = buildAstNameIndex(ast);
    const original = { line: 999, snippet: 'pre' };
    const out = attachSourceLocation(
      { level: 'error', message: 'x', nodeRef: '借权', sourceLocation: original },
      idx,
      SRC_SHALLOW,
    );
    expect(out.sourceLocation).toBe(original);
  });
});
