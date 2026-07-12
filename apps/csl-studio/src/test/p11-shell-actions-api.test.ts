// P11 — Capability matrix 上层接口
import { describe, it, expect } from 'vitest';
import {
  getActionDescriptor, getShellCapabilities, getAvailableActions,
  type ShellActionContext,
} from '@/csl/ui/shell-actions';

const baseEditable: ShellActionContext = {
  shellMode: 'showcase', lockState: 'editable', compat: 'compatible', oseStatus: 'pass', hasWorkspace: true,
};

describe('P11 — shell capability 上层接口', () => {
  it('getActionDescriptor 返回 key/label/enabled/reason', () => {
    const d = getActionDescriptor(baseEditable, 'convertToWorkspace');
    expect(d.key).toBe('convertToWorkspace');
    expect(d.label.length).toBeGreaterThan(0);
    expect(d.enabled).toBe(true);
  });

  it('getShellCapabilities 顺序保留', () => {
    const list = getShellCapabilities(baseEditable, ['back', 'exportSource', 'exportBundle']);
    expect(list.map(x => x.key)).toEqual(['back', 'exportSource', 'exportBundle']);
    expect(list.every(x => typeof x.enabled === 'boolean')).toBe(true);
  });

  it('viewer 不允许 exportBundle,描述符给出 reason', () => {
    const ctx: ShellActionContext = { ...baseEditable, shellMode: 'viewer' };
    const d = getActionDescriptor(ctx, 'exportBundle');
    expect(d.enabled).toBe(false);
    expect(d.reason).toBeTruthy();
  });

  it('compare 壳下 exportCompareJSON 可用、其他壳不可用', () => {
    expect(getActionDescriptor({ ...baseEditable, shellMode: 'compare' }, 'exportCompareJSON').enabled).toBe(true);
    expect(getActionDescriptor(baseEditable, 'exportCompareJSON').enabled).toBe(false);
  });

  it('getAvailableActions 自动过滤不可用项', () => {
    const ctx: ShellActionContext = { ...baseEditable, shellMode: 'viewer' };
    const all = getShellCapabilities(ctx, ['exportBundle', 'exportSource', 'openInViewer']);
    const ava = getAvailableActions(ctx, ['exportBundle', 'exportSource', 'openInViewer']);
    expect(all.length).toBe(3);
    // viewer: openInViewer/exportBundle 都不可用,exportSource (editable+compat) 可用
    expect(ava.map(x => x.key)).toEqual(['exportSource']);
  });

  it('四壳层都能用同一接口拿动作状态', () => {
    const shells = ['showcase', 'workspace', 'compare', 'viewer'] as const;
    for (const sm of shells) {
      const ctx: ShellActionContext = { ...baseEditable, shellMode: sm };
      const list = getShellCapabilities(ctx, ['back', 'openInCompareSrc', 'convertToWorkspace']);
      expect(list.length).toBe(3);
      list.forEach(d => expect(typeof d.enabled).toBe('boolean'));
    }
  });
});
