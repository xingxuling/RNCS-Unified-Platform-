// P11 — Viewer 状态持久化
import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadViewerState, saveViewerState, clearViewerState,
  makeObjectKey, parseObjectKey, deriveRestoreParams,
} from '@/csl/ui/viewer-state';

describe('P11 — viewer-state', () => {
  beforeEach(() => clearViewerState());

  it('save / load 往返', () => {
    saveViewerState({ lastObjectKey: 'object|tpl-1', from: 'showcase', scrollY: 120 });
    const s = loadViewerState();
    expect(s).not.toBeNull();
    expect(s!.lastObjectKey).toBe('object|tpl-1');
    expect(s!.from).toBe('showcase');
    expect(s!.scrollY).toBe(120);
    expect(typeof s!.ts).toBe('number');
  });

  it('损坏数据安全降级为 null', () => {
    localStorage.setItem('csl:viewer:state:v1', '{not json');
    expect(loadViewerState()).toBeNull();
    localStorage.setItem('csl:viewer:state:v1', JSON.stringify({ junk: 1 }));
    expect(loadViewerState()).toBeNull();
  });

  it('makeObjectKey / parseObjectKey 互逆', () => {
    expect(parseObjectKey(makeObjectKey('object', 'abc'))).toEqual({ kind: 'object', id: 'abc' });
    expect(parseObjectKey(makeObjectKey('ws', 'w-1'))).toEqual({ kind: 'ws', id: 'w-1' });
    expect(parseObjectKey('garbage')).toBeNull();
    expect(parseObjectKey('foo|bar')).toBeNull(); // foo 非合法 kind
  });

  it('deriveRestoreParams 给出合理 URL params', () => {
    saveViewerState({ lastObjectKey: 'ws|w-77', from: 'workspace' });
    const s = loadViewerState()!;
    expect(deriveRestoreParams(s)).toEqual({ from: 'workspace', ws: 'w-77' });
    saveViewerState({ lastObjectKey: 'object|tpl-x', from: 'compare' });
    const s2 = loadViewerState()!;
    expect(deriveRestoreParams(s2)).toEqual({ from: 'compare', object: 'tpl-x' });
  });

  it('clearViewerState 清空', () => {
    saveViewerState({ lastObjectKey: 'object|x', from: 'direct' });
    expect(loadViewerState()).not.toBeNull();
    clearViewerState();
    expect(loadViewerState()).toBeNull();
  });
});
