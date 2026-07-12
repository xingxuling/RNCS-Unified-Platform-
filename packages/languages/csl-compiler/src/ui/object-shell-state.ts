// P11 — ObjectShellState 统一状态对象
//
// 目标:把 ObjectStatusBar 的若干 props 收紧成一个统一的"对象 + 壳"状态对象,
// 让 showcase / workspace / compare / viewer 不再各自手拼半兼容字段。
//
// 设计纪律:
//   - "对象状态"字段:bucket / lockState / oseStatus / compat / objectName / version / origin
//   - "壳层状态"字段:shellMode
//   - 任何新增字段需先确定属于"对象侧"还是"壳侧",不允许混插。
//   - 本类型不替代 ObjectStatusBar 的 props — 而是上层用 toStatusBarProps()
//     适配,从而保证两边演进同步。

import type {
  ShellMode, ObjectBucket, LockKind, OseStatus,
} from '@/components/csl/ObjectStatusBar';
import type { CompatVerdict } from '../workspace/compat';
import type { GrammarVersion } from '../index';
import type { VersionStamps } from '../version-stamps';

/** 对象侧字段(描述对象本身的事实,与所在壳层无关) */
export interface ObjectIdentityFields {
  /** 对象稳定 id */
  objectId: string;
  /** 用户可见名 */
  objectName: string;
  bucket: ObjectBucket;
  lockState: LockKind;
  oseStatus: OseStatus;
  compat?: CompatVerdict;
  /** 语法版本(可选 — 部分壳如演示模板仅依赖此,部分还有 stamps) */
  version?: GrammarVersion;
  /** 完整版本指纹(可选) */
  stamps?: VersionStamps;
  /** 来源短文本(如"内置演示模板""导入 .csl""本地工作区") */
  origin?: string;
}

/** 壳层侧字段(描述当前对象在哪个壳里被查看) */
export interface ShellContextFields {
  shellMode: ShellMode;
  /** 对象是否真的对应一个工作区(用于 openInPlayground 判定) */
  hasWorkspace?: boolean;
}

/** 统一状态对象 — 任何壳层向 ObjectStatusBar / ShellActionBar 喂数据时的入口 */
export interface ObjectShellState extends ObjectIdentityFields, ShellContextFields {}

/** 适配到 ObjectStatusBar 的 props(显式抽取,避免悄悄漏字段) */
export function toStatusBarProps(s: ObjectShellState) {
  return {
    shellMode: s.shellMode,
    bucket: s.bucket,
    lockState: s.lockState,
    oseStatus: s.oseStatus,
    compat: s.compat,
    objectName: s.objectName,
  } as const;
}

/** 适配到 ShellActionBar 的 ctx(只取动作能力相关字段) */
export function toShellActionContext(s: ObjectShellState) {
  return {
    shellMode: s.shellMode,
    lockState: s.lockState,
    compat: s.compat,
    oseStatus: s.oseStatus,
    hasWorkspace: s.hasWorkspace,
  } as const;
}

/** 调试用:快速判定两个状态在"行为相关字段"上是否一致 */
export function isBehaviorallyEquivalent(a: ObjectShellState, b: ObjectShellState): boolean {
  return a.bucket === b.bucket
      && a.lockState === b.lockState
      && a.oseStatus === b.oseStatus
      && (a.compat ?? null) === (b.compat ?? null)
      && a.shellMode === b.shellMode;
}
