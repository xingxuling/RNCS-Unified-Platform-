// P12 — ObjectStatusBar 调用位回归:确保 toStatusBarProps 抽出的字段
// 与 ObjectStatusBar 的 props 签名严格一致(没有页面层在偷偷拼半兼容字段)。

import { describe, it, expect } from 'vitest';
import {
  toStatusBarProps, toShellActionContext,
  type ObjectShellState,
} from '@/csl/ui/object-shell-state';
import { getShellCapability } from '@/components/csl/ShellActionBar';

const baseState: ObjectShellState = {
  objectId: 'obj_x', objectName: 'X',
  bucket: 'template', lockState: 'editable', oseStatus: 'pass',
  shellMode: 'showcase',
};

describe('P12 — ObjectStatusBar adapter 回归', () => {
  it('toStatusBarProps 输出仅包含 ObjectStatusBar 真正消费的字段', () => {
    const p = toStatusBarProps(baseState);
    expect(Object.keys(p).sort()).toEqual(
      ['bucket', 'compat', 'lockState', 'objectName', 'oseStatus', 'shellMode'].sort()
    );
  });

  it('四种 shellMode 的 toStatusBarProps 都能直接喂给同一组件', () => {
    (['showcase', 'workspace', 'compare', 'viewer'] as const).forEach(mode => {
      const p = toStatusBarProps({ ...baseState, shellMode: mode });
      expect(p.shellMode).toBe(mode);
    });
  });

  it('toShellActionContext 不暴露 objectId / objectName / version (避免渲染层耦合身份)', () => {
    const ctx = toShellActionContext(baseState);
    expect((ctx as Record<string, unknown>).objectId).toBeUndefined();
    expect((ctx as Record<string, unknown>).objectName).toBeUndefined();
    expect((ctx as Record<string, unknown>).version).toBeUndefined();
  });
});

describe('P12 — Showcase / Workspace 接入 capability matrix 的关键判定', () => {
  it('showcase 壳:openInPlayground 在 hasWorkspace=false 时禁用并解释', () => {
    const cap = getShellCapability(
      { ...toShellActionContext(baseState), hasWorkspace: false },
      'openInPlayground'
    );
    expect(cap.enabled).toBe(false);
    expect(cap.reason).toMatch(/工作区/);
  });

  it('showcase 壳:openInPlayground 在 hasWorkspace=true 时允许', () => {
    const cap = getShellCapability(
      { ...toShellActionContext(baseState), hasWorkspace: true },
      'openInPlayground'
    );
    expect(cap.enabled).toBe(true);
  });

  it('workspace 壳:convertToWorkspace 永远禁用并解释「对象已在工作区」', () => {
    const cap = getShellCapability(
      toShellActionContext({ ...baseState, shellMode: 'workspace' }),
      'convertToWorkspace'
    );
    expect(cap.enabled).toBe(false);
    expect(cap.reason).toMatch(/已在工作区/);
  });

  it('workspace 壳:openInViewer / openInCompareSrc / backToShowcase 均可用', () => {
    const ctx = toShellActionContext({ ...baseState, shellMode: 'workspace' });
    expect(getShellCapability(ctx, 'openInViewer').enabled).toBe(true);
    expect(getShellCapability(ctx, 'openInCompareSrc').enabled).toBe(true);
    expect(getShellCapability(ctx, 'backToShowcase').enabled).toBe(true);
  });

  it('viewer 壳:exportBundle 永远禁用并解释「先转入工作区」', () => {
    const cap = getShellCapability(
      toShellActionContext({ ...baseState, shellMode: 'viewer' }),
      'exportBundle'
    );
    expect(cap.enabled).toBe(false);
    expect(cap.reason).toMatch(/工作区/);
  });
});
