// P11 — 跨壳层动作能力接口 (capability matrix 上提)
//
// 目标:把 ShellActionBar 内部的 capability 判断,提到一个
// "上层动作渲染接口"。任何壳层(showcase/workspace/compare/viewer)
// 都只通过本模块拿动作 descriptor,不再各自硬编码 enabled/disabled 判断。
//
// 设计纪律:
//   - 这里只导出"能力 + 文案 + icon key + 原因"。不导出 React 组件。
//   - 不同壳层可自由决定渲染样式,但 enabled/reason 必须来自本模块。
//   - capability 判断的真实实现仍在 ShellActionBar.tsx 中
//     (getShellCapability),本模块对其做 "上层封装 + 描述符聚合"。
//   - 任何新增动作 → 必须同步:ACTIONS / getShellCapability / ICONS / LABELS。

import {
  getShellCapability,
  type ShellActionContext,
  type ShellActionKey,
  type ShellActionState,
} from '@/components/csl/ShellActionBar';
import { ACTIONS } from './action-labels';

export type { ShellActionContext, ShellActionKey, ShellActionState };

/** 动作描述符 — 上层渲染所需的最小完整信息 */
export interface ShellActionDescriptor {
  key: ShellActionKey;
  label: string;
  enabled: boolean;
  /** 不可用时的人类可读原因(可用作 tooltip);可用时也可填解释 */
  reason?: string;
}

/** 动作 → 文案 (与 ShellActionBar 保持一致;back 是壳内通用,不在 ACTIONS 表里) */
const LABELS: Record<ShellActionKey, string> = {
  back: '返回',
  openInViewer: ACTIONS.openInViewer,
  openInCompareSrc: ACTIONS.openInCompareSrc,
  convertToWorkspace: ACTIONS.convertToWorkspace,
  forkAsEditable: ACTIONS.forkAsEditable,
  openInPlayground: ACTIONS.openInPlayground,
  backToShowcase: ACTIONS.backToShowcase,
  exportSource: ACTIONS.exportSource,
  exportSnapshot: ACTIONS.exportSnapshot,
  exportBundle: ACTIONS.exportBundle,
  exportCompareJSON: ACTIONS.exportCompareJSON,
};

/** 单个动作的描述符(上层组件应优先使用此接口而非 getShellCapability) */
export function getActionDescriptor(
  ctx: ShellActionContext,
  key: ShellActionKey
): ShellActionDescriptor {
  const cap: ShellActionState = getShellCapability(ctx, key);
  return {
    key,
    label: LABELS[key],
    enabled: cap.enabled,
    reason: cap.reason,
  };
}

/**
 * 一次性给出多个动作的描述符。
 * 调用方传入 wanted 列表,顺序保留。未列出的动作不返回。
 */
export function getShellCapabilities(
  ctx: ShellActionContext,
  wanted: ShellActionKey[]
): ShellActionDescriptor[] {
  return wanted.map(k => getActionDescriptor(ctx, k));
}

/**
 * 仅返回当前上下文中"可用"的动作描述符。
 * 用于希望"自动隐藏不可用动作"的简化场景 — 但请优先使用
 * getShellCapabilities 并显式禁用 + 解释原因(P10 既定纪律)。
 */
export function getAvailableActions(
  ctx: ShellActionContext,
  wanted: ShellActionKey[]
): ShellActionDescriptor[] {
  return getShellCapabilities(ctx, wanted).filter(d => d.enabled);
}
