// P9 — Viewer 壳路由级渲染测试
// 目标:不依赖纯函数测试,而是真实 mount /viewer 路由,
// 覆盖 模板对象 / 用户对象 / 工作区对象 / 非法参数 四种入口。

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CSLViewer from '@/pages/CSLViewer';
import { STAGE_DEMO_TEMPLATES } from '@/csl/stage-demo-templates';
import { createWorkspace } from '@/csl/workspace';

function renderViewer(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/viewer" element={<CSLViewer />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('P9 — Viewer 路由级渲染', () => {
  beforeEach(() => localStorage.clear());

  it('/viewer?object=<template> 能加载内置模板,显示 ObjectStatusBar 与只读源码区', async () => {
    const tpl = STAGE_DEMO_TEMPLATES[0];
    renderViewer(`/viewer?object=${encodeURIComponent(tpl.id)}`);
    expect(await screen.findByText(/Viewer · 只读审阅/)).toBeInTheDocument();
    expect(screen.getByText(/CSL 源码\(只读\)/)).toBeInTheDocument();
    // ObjectStatusBar 必有「当前壳层:只读查看器」文案
    expect(screen.getAllByText(/只读查看器/).length).toBeGreaterThan(0);
  });

  it('/viewer?object=<user_demo> 能从 localStorage 读取用户对象', async () => {
    const id = 'user_paste_p9';
    const list = [{
      id, name: 'P9 用户对象', bucket: 'user_paste',
      version: 'v0.8', code: 'concept A {}',
      lockState: 'editable', origin: '测试',
    }];
    localStorage.setItem('csl:showcase:user_demos', JSON.stringify(list));
    renderViewer(`/viewer?object=${id}&from=recent`);
    expect(await screen.findByText('P9 用户对象')).toBeInTheDocument();
  });

  it('/viewer?ws=<workspace> 能加载真实工作区对象', async () => {
    const w = createWorkspace({
      name: 'P9 工作区',
      cslVersion: 'v0.8',
      source: 'concept B {}',
    });
    renderViewer(`/viewer?ws=${w.id}`);
    expect(await screen.findByText('P9 工作区')).toBeInTheDocument();
    // 工作区对象的 bucket 应展示为 workspace
    expect(screen.getAllByText(/工作区对象/).length).toBeGreaterThan(0);
  });

  it('非法 object 参数 → 安全降级为 loadError,不崩,且仍有返回入口', async () => {
    renderViewer(`/viewer?object=__definitely_not_exists__`);
    expect(await screen.findByText(/Viewer 无法加载对象/)).toBeInTheDocument();
    expect(screen.getByText(/未找到对象/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /返回演示壳/ })).toBeInTheDocument();
  });

  it('完全缺失参数 → loadError 提示「未指定 object 或 ws」', async () => {
    renderViewer(`/viewer`);
    expect(await screen.findByText(/未指定 object 或 ws 参数/)).toBeInTheDocument();
  });
});
