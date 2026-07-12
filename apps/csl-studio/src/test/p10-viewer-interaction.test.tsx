// P10 — Viewer 交互加厚测试
// 目标:Viewer 壳的关键 UI 元素与返回路径在不同入口下成立。

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CSLViewer from '@/pages/CSLViewer';
import { STAGE_DEMO_TEMPLATES } from '@/csl/stage-demo-templates';

function renderViewer(initial: string) {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <Routes>
        <Route path="/viewer" element={<CSLViewer />} />
        <Route path="*" element={<div>fallback</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('P10 — Viewer 交互与状态可见性', () => {
  beforeEach(() => { localStorage.clear(); });

  it('打开内置模板时,只读 Badge / 状态条 / 可用动作卡片均可见', async () => {
    const tpl = STAGE_DEMO_TEMPLATES[0];
    renderViewer(`/viewer?object=${tpl.id}`);
    expect(await screen.findByText(/Viewer · 只读审阅/)).toBeInTheDocument();
    expect(screen.getByText(/严格只读/)).toBeInTheDocument();
    expect(screen.getByText(/可用动作/)).toBeInTheDocument();
    // 状态条出现"当前壳层:只读查看器"
    expect(screen.getByText(/当前壳层:只读查看器/)).toBeInTheDocument();
  });

  it('返回按钮存在(永远不让用户迷路)', async () => {
    const tpl = STAGE_DEMO_TEMPLATES[0];
    renderViewer(`/viewer?object=${tpl.id}`);
    const back = await screen.findByText(/返回/);
    expect(back).toBeInTheDocument();
  });

  it('from=compare 时,返回路径指向 Compare', async () => {
    const tpl = STAGE_DEMO_TEMPLATES[0];
    renderViewer(`/viewer?object=${tpl.id}&from=compare`);
    expect(await screen.findByText(/返回 Compare/)).toBeInTheDocument();
  });

  it('未指定 object 或 ws 时,显示 loadError 与返回入口', async () => {
    renderViewer('/viewer');
    expect(await screen.findByText(/Viewer 无法加载对象/)).toBeInTheDocument();
    expect(screen.getByText(/返回演示壳/)).toBeInTheDocument();
  });

  it('object 不存在时,显示明确错误', async () => {
    renderViewer('/viewer?object=__not_a_real_id__');
    expect(await screen.findByText(/未找到对象/)).toBeInTheDocument();
  });
});
