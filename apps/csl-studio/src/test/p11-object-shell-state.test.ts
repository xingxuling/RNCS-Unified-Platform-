// P11 — ObjectShellState 统一状态对象
import { describe, it, expect } from 'vitest';
import {
  toStatusBarProps, toShellActionContext, isBehaviorallyEquivalent,
  type ObjectShellState,
} from '@/csl/ui/object-shell-state';

const base: ObjectShellState = {
  objectId: 'demo-1',
  objectName: '演示一',
  bucket: 'template',
  lockState: 'editable',
  oseStatus: 'pass',
  compat: 'compatible',
  shellMode: 'showcase',
  hasWorkspace: false,
};

describe('P11 — ObjectShellState', () => {
  it('toStatusBarProps 抽出 ObjectStatusBar 所需字段', () => {
    const p = toStatusBarProps(base);
    expect(p).toEqual({
      shellMode: 'showcase',
      bucket: 'template',
      lockState: 'editable',
      oseStatus: 'pass',
      compat: 'compatible',
      objectName: '演示一',
    });
  });

  it('toShellActionContext 抽出 capability 所需字段', () => {
    const c = toShellActionContext(base);
    expect(c.shellMode).toBe('showcase');
    expect(c.lockState).toBe('editable');
    expect(c.compat).toBe('compatible');
    expect(c.hasWorkspace).toBe(false);
  });

  it('isBehaviorallyEquivalent 基于行为字段', () => {
    const b2: ObjectShellState = { ...base, objectName: '另一个名字', origin: '差异来源' };
    expect(isBehaviorallyEquivalent(base, b2)).toBe(true);
    const b3: ObjectShellState = { ...base, lockState: 'read_only' };
    expect(isBehaviorallyEquivalent(base, b3)).toBe(false);
    const b4: ObjectShellState = { ...base, shellMode: 'viewer' };
    expect(isBehaviorallyEquivalent(base, b4)).toBe(false);
  });
});
