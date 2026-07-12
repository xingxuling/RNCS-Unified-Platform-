// P14 — L2 Viewer / Compare 面板渲染与降级测试
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { L2SummaryPanel } from '@/components/csl/L2SummaryPanel';
import { L2ComparePanel } from '@/components/csl/L2ComparePanel';
import { isLikelyL2Source } from '@/csl/lab/l2';

const L2_SRC = `
引擎 治理引擎:
  模块 准入校验
模块 准入校验:
  前置 主体已声明
前置 主体已声明: subject != null
`.trim();

describe('P14 — isLikelyL2Source', () => {
  it('能识别带 L2 关键字的源码', () => {
    expect(isLikelyL2Source(L2_SRC)).toBe(true);
  });
  it('普通主线源码不会被误判', () => {
    expect(isLikelyL2Source('概念 X { 属性 a }')).toBe(false);
    expect(isLikelyL2Source('')).toBe(false);
    expect(isLikelyL2Source(undefined)).toBe(false);
  });
});

describe('P14 — L2SummaryPanel', () => {
  it('渲染 counts / version / flags 与摘要行', () => {
    render(<L2SummaryPanel source={L2_SRC} mainlineIndex={{ names: new Set() }} />);
    expect(screen.getByTestId('l2-summary-panel')).toBeInTheDocument();
    expect(screen.getByText(/v0\.10-alpha/i)).toBeInTheDocument();
    expect(screen.getByText('引擎')).toBeInTheDocument();
    expect(screen.getByText('模块')).toBeInTheDocument();
  });

  it('非 L2 源码也能安全渲染(显示空提示)', () => {
    render(<L2SummaryPanel source={'概念 X {}'} />);
    expect(screen.getByTestId('l2-summary-panel')).toBeInTheDocument();
    expect(screen.getByText(/未识别到任何 L2/)).toBeInTheDocument();
  });
});

describe('P14 — L2ComparePanel', () => {
  it('两侧都不是 L2 → 给降级卡片,不崩', () => {
    render(<L2ComparePanel sourceName="A" targetName="B" sourceCode="概念 X" targetCode="概念 Y" />);
    expect(screen.getByTestId('l2-compare-panel-empty')).toBeInTheDocument();
  });

  it('两侧均为 L2 → 显示 add/del/mod 计数', () => {
    const a = L2_SRC;
    const b = `
引擎 治理引擎:
  模块 风险监测
模块 风险监测:
  后置 风险已记录
前置 主体已声明: subject != null
`.trim();
    render(<L2ComparePanel sourceName="A" targetName="B" sourceCode={a} targetCode={b} />);
    expect(screen.getByTestId('l2-compare-panel')).toBeInTheDocument();
  });

  it('一侧为 L2 一侧不是 → 也能渲染并给出注意提示', () => {
    render(<L2ComparePanel sourceName="A" targetName="B" sourceCode={L2_SRC} targetCode="概念 X" />);
    expect(screen.getByTestId('l2-compare-panel')).toBeInTheDocument();
    expect(screen.getByText(/未识别为 L2/)).toBeInTheDocument();
  });
});
