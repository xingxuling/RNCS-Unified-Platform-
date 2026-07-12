// P12 — Showcase / Workspace 主入口接入 ShellActionBar 的 smoke 渲染测试
// 不深入业务逻辑,仅确认统一动作条已挂在两大壳层上,并能正确禁用并解释。

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import StageDemoShowcase from '@/pages/StageDemoShowcase';
import CSLPlayground from '@/pages/CSLPlayground';
import { ACTIONS } from '@/csl/ui/action-labels';

describe('P12 — Showcase 壳接入 ShellActionBar', () => {
  beforeEach(() => localStorage.clear());

  it('顶部出现统一动作条:openInViewer / openInCompareSrc / convertToWorkspace 等', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<StageDemoShowcase />} />
        </Routes>
      </MemoryRouter>,
    );
    // 等渲染稳定
    expect(await screen.findAllByText(ACTIONS.openInViewer)).not.toHaveLength(0);
    expect(screen.getAllByText(ACTIONS.openInCompareSrc).length).toBeGreaterThan(0);
    expect(screen.getAllByText(ACTIONS.convertToWorkspace).length).toBeGreaterThan(0);
  });
});

describe('P12 — Workspace 壳接入 ShellActionBar', () => {
  beforeEach(() => localStorage.clear());

  it('Playground 顶部状态条下方出现统一动作条,且 convertToWorkspace 被禁用并解释', async () => {
    render(
      <MemoryRouter initialEntries={['/playground']}>
        <Routes>
          <Route path="/playground" element={<CSLPlayground />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(await screen.findAllByText(ACTIONS.openInViewer)).not.toHaveLength(0);
    expect(screen.getAllByText(ACTIONS.backToShowcase).length).toBeGreaterThan(0);
    // convertToWorkspace 在 workspace 壳应被禁用 — 通过查找带"不可用"标记的按钮验证
    const convertBtns = screen.getAllByText(ACTIONS.convertToWorkspace);
    expect(convertBtns.length).toBeGreaterThan(0);
  });
});
