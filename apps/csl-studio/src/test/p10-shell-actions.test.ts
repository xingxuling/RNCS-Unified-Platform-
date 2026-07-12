// P10 — ShellActionBar capability matrix 测试
// 目标:四个壳层 + 四种 lockState/compat 组合下,关键动作的 enabled/reason 必须稳定。

import { describe, it, expect } from 'vitest';
import { getShellCapability, type ShellActionContext } from '@/components/csl/ShellActionBar';

const baseEditable: ShellActionContext = {
  shellMode: 'showcase', lockState: 'editable', compat: 'compatible', oseStatus: 'pass',
};

describe('P10 — ShellActionBar capability matrix', () => {
  it('Showcase + editable + compatible:核心动作均允许', () => {
    expect(getShellCapability(baseEditable, 'convertToWorkspace').enabled).toBe(true);
    expect(getShellCapability(baseEditable, 'openInViewer').enabled).toBe(true);
    expect(getShellCapability(baseEditable, 'openInCompareSrc').enabled).toBe(true);
    expect(getShellCapability(baseEditable, 'exportSource').enabled).toBe(true);
    expect(getShellCapability(baseEditable, 'exportBundle').enabled).toBe(true);
  });

  it('Viewer 壳:openInViewer 自身不可用,exportBundle 不可用', () => {
    const ctx: ShellActionContext = { ...baseEditable, shellMode: 'viewer' };
    expect(getShellCapability(ctx, 'openInViewer').enabled).toBe(false);
    expect(getShellCapability(ctx, 'exportBundle').enabled).toBe(false);
    expect(getShellCapability(ctx, 'exportBundle').reason).toContain('Viewer');
    // 但仍允许转入工作区与对比
    expect(getShellCapability(ctx, 'convertToWorkspace').enabled).toBe(true);
    expect(getShellCapability(ctx, 'openInCompareSrc').enabled).toBe(true);
  });

  it('Compare 壳:exportCompareJSON 仅在 compare 可用', () => {
    const cmp: ShellActionContext = { ...baseEditable, shellMode: 'compare' };
    expect(getShellCapability(cmp, 'exportCompareJSON').enabled).toBe(true);
    expect(getShellCapability(cmp, 'openInCompareSrc').enabled).toBe(false);
    expect(getShellCapability(baseEditable, 'exportCompareJSON').enabled).toBe(false);
  });

  it('Workspace 壳:convertToWorkspace 不可用(已在工作区)', () => {
    const ws: ShellActionContext = { ...baseEditable, shellMode: 'workspace' };
    expect(getShellCapability(ws, 'convertToWorkspace').enabled).toBe(false);
  });

  it('read_only 对象:exportBundle 拒绝,但 forkAsEditable 允许', () => {
    const ro: ShellActionContext = { ...baseEditable, lockState: 'read_only', compat: 'read_only' };
    expect(getShellCapability(ro, 'exportBundle').enabled).toBe(false);
    expect(getShellCapability(ro, 'exportBundle').reason).toMatch(/只读|不兼容/);
    expect(getShellCapability(ro, 'forkAsEditable').enabled).toBe(true);
  });

  it('incompatible 对象:exportSource/Snapshot/Bundle 全部拒绝,但详情/转入(降级)允许', () => {
    const inc: ShellActionContext = { ...baseEditable, lockState: 'incompatible', compat: 'incompatible' };
    expect(getShellCapability(inc, 'exportSource').enabled).toBe(false);
    expect(getShellCapability(inc, 'exportSnapshot').enabled).toBe(false);
    expect(getShellCapability(inc, 'exportBundle').enabled).toBe(false);
    // 转入工作区仍允许(降级为只读副本)
    expect(getShellCapability(inc, 'convertToWorkspace').enabled).toBe(true);
    expect(getShellCapability(inc, 'openInCompareSrc').enabled).toBe(true);
    expect(getShellCapability(inc, 'forkAsEditable').enabled).toBe(true);
    expect(getShellCapability(inc, 'forkAsEditable').reason).toContain('只读副本');
  });

  it('openInPlayground:仅在 hasWorkspace=true 时启用', () => {
    expect(getShellCapability({ ...baseEditable, hasWorkspace: false }, 'openInPlayground').enabled).toBe(false);
    expect(getShellCapability({ ...baseEditable, hasWorkspace: true  }, 'openInPlayground').enabled).toBe(true);
  });

  it('back 动作:恒可用', () => {
    expect(getShellCapability(baseEditable, 'back').enabled).toBe(true);
    expect(getShellCapability({ ...baseEditable, lockState: 'incompatible' }, 'back').enabled).toBe(true);
  });
});
