// P12 — Viewer 启动恢复 / compatPanelOpen 联动 / 失效安全降级

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CSLViewer from '@/pages/CSLViewer';
import { STAGE_DEMO_TEMPLATES } from '@/csl/stage-demo-templates';
import { saveViewerState, loadViewerState, makeObjectKey } from '@/csl/ui/viewer-state';

function renderViewer(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/viewer" element={<CSLViewer />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('P12 — Viewer 启动恢复闭环', () => {
  beforeEach(() => localStorage.clear());

  it('URL 缺参数 + 存在 viewer-state → 自动恢复到上次对象', async () => {
    const tpl = STAGE_DEMO_TEMPLATES[0];
    saveViewerState({
      lastObjectKey: makeObjectKey('object', tpl.id),
      from: 'recent',
    });
    renderViewer('/viewer');
    expect(await screen.findByText(/Viewer · 只读审阅/)).toBeInTheDocument();
    // 模板名应可见 — 证明对象成功恢复
    expect(await screen.findByText(tpl.name)).toBeInTheDocument();
  });

  it('URL 缺参数 + viewer-state 指向已失效对象 → 安全降级到 loadError,不进入循环', async () => {
    saveViewerState({
      lastObjectKey: makeObjectKey('object', '__gone_object_p12__'),
      from: 'recent',
    });
    renderViewer('/viewer');
    expect(await screen.findByText(/Viewer 无法加载对象/)).toBeInTheDocument();
    expect(screen.getByText(/未找到对象/)).toBeInTheDocument();
  });

  it('URL 显式参数优先于 viewer-state(不被旧状态覆盖)', async () => {
    const t0 = STAGE_DEMO_TEMPLATES[0];
    const t1 = STAGE_DEMO_TEMPLATES[1] ?? STAGE_DEMO_TEMPLATES[0];
    saveViewerState({
      lastObjectKey: makeObjectKey('object', t0.id),
      from: 'recent',
    });
    renderViewer(`/viewer?object=${encodeURIComponent(t1.id)}`);
    expect(await screen.findByText(t1.name)).toBeInTheDocument();
  });

  it('打开对象后写入 viewer-state(包含 from / lastObjectKey)', async () => {
    const tpl = STAGE_DEMO_TEMPLATES[0];
    renderViewer(`/viewer?object=${encodeURIComponent(tpl.id)}&from=showcase`);
    await screen.findByText(tpl.name);
    await waitFor(() => {
      const s = loadViewerState();
      expect(s).not.toBeNull();
      expect(s!.lastObjectKey).toBe(makeObjectKey('object', tpl.id));
      expect(s!.from).toBe('showcase');
    });
  });
});
