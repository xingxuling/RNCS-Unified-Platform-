// CapabilityProfile — CSL + OSE 唯一真源
// 从 GrammarVersion + SpecRegistry 编译出整条下游(lexer/parser/IR/runtime/projection/OSE)共享的
// 能力描述。所有下游模块禁止再直接读 VERSION_FEATURES,必须走这里。
//
// MVP-1 范围:只落地最小字段集,足以覆盖 functions feature 贯通示范链。
// 第二轮再补:enabledModes 的 modeDependencies / exportMetadata / compat matrix。

import type { GrammarVersion, FeatureFlag } from '../versions/registry';
import { VERSION_FEATURES, ALL_FLAGS } from '../versions/registry';
import type { SpecRegistry } from '../specs/loader';

export type ViewMode = 'form' | 'summary' | 'stage' | 'blocks' | 'mapping' | 'list' | 'detail' | 'dashboard';

/** OSE hook 的治理级别(spec 声明) */
export type OSESeverity = 'pass' | 'warn' | 'block' | 'block_with_fix_hint';

export interface CapabilityProfile {
  /** 指纹:用于缓存命中与版本冻结 */
  readonly id: string;
  readonly grammarVersion: GrammarVersion;
  readonly specVersion: string;
  readonly compilerVersion: string;
  readonly osePolicyVersion: string;

  /** 所有 feature 的开关状态(真源:VERSION_FEATURES ∩ spec.features[状态≠disabled]) */
  readonly featureFlags: Readonly<Record<FeatureFlag, boolean>>;

  /** feature 被关闭的原因(版本不支持 / spec 显式关闭),用于 diagnostic */
  readonly featureDisabledReason: Readonly<Record<string, string>>;

  /** 可用视图模式(硬编码全集;第二轮改由 spec 声明) */
  readonly enabledModes: ReadonlyArray<ViewMode>;
  readonly defaultMode: ViewMode;
  readonly modeConstraints: Readonly<Record<ViewMode, {
    /** 开启该 mode 所依赖的 feature */
    requiredFeatures: FeatureFlag[];
  }>>;

  /** runtime 五大入口的许可 */
  readonly runtimePermissions: {
    readonly allowFunctionCall: boolean;
    readonly allowStageTransition: boolean;
    readonly allowRegeneration: boolean;
    readonly allowSignalEmit: boolean;
    readonly allowInference: boolean;
  };

  /** OSE 治理策略 */
  readonly osePolicies: {
    /** 已接入的 hook 名单(来自 ose-protocol.csl 的 active 列表) */
    readonly enabledHooks: ReadonlyArray<string>;
    /** 升为 block 的 hook 子集(关键结构性 hook) */
    readonly blockingHooks: ReadonlyArray<string>;
    /** 明确仅 warn 的 hook */
    readonly warnOnlyHooks: ReadonlyArray<string>;
  };

  /** Projection 层策略 */
  readonly projectionPolicies: {
    readonly allowCodegen: boolean;
    readonly allowRuntimeHandler: boolean;
    /** true 时,出现 block 级 OSE 诊断 → codegen 产物标记为 blocked */
    readonly requireOSEPass: boolean;
  };

  /** Export 包应包含的内容 */
  readonly exportMetadata: {
    readonly includeIR: boolean;
    readonly includeOSEReport: boolean;
    readonly includeSource: boolean;
  };
}


// MVP-2 Phase 7:版本号统一从 version-stamps 读取,本文件不再硬编码
// 保留旧导出名以兼容现有 import,值改为字符串化的 stamps
import {
  CURRENT_COMPILER_VERSION,
  CURRENT_OSE_POLICY_VERSION,
  CURRENT_SPEC_VERSION,
} from '../version-stamps';
export const COMPILER_VERSION = CURRENT_COMPILER_VERSION;
export const OSE_POLICY_VERSION = String(CURRENT_OSE_POLICY_VERSION);


/** ViewMode 全集与各自依赖的 feature */
const MODE_CONSTRAINTS: Record<ViewMode, { requiredFeatures: FeatureFlag[] }> = {
  form: { requiredFeatures: [] },
  summary: { requiredFeatures: [] },
  list: { requiredFeatures: [] },
  detail: { requiredFeatures: [] },
  dashboard: { requiredFeatures: [] },
  stage: { requiredFeatures: ['subjects', 'sovereignty_stages'] },
  blocks: { requiredFeatures: ['concept_blocks'] },
  mapping: { requiredFeatures: ['mapping_tables'] },
};

/**
 * 从 GrammarVersion + SpecRegistry 编译 CapabilityProfile
 * H5: blockingHooks 完全由 spec.oseHooks[].severity 决定,代码层不再持有主权
 * spec 为 null 时走纯 version 模式(向后兼容 runCSL 老调用方),此时无 blocking hook
 */
export function compileCapabilityProfile(
  grammarVersion: GrammarVersion,
  spec: SpecRegistry | null,
): CapabilityProfile {
  // 1) feature flags:version 允许 ∧ spec 未 disabled
  const versionEnabled = new Set(VERSION_FEATURES[grammarVersion]);
  const specDisabledIds = new Set(
    (spec?.features || [])
      .filter(f => f.status === 'disabled')
      .map(f => f.id),
  );
  const featureFlags = {} as Record<FeatureFlag, boolean>;
  const featureDisabledReason: Record<string, string> = {};
  for (const flag of ALL_FLAGS) {
    const versionOk = versionEnabled.has(flag);
    const specOk = !specDisabledIds.has(flag);
    featureFlags[flag] = versionOk && specOk;
    if (!versionOk) featureDisabledReason[flag] = `feature「${flag}」不在 ${grammarVersion} 允许列表中`;
    else if (!specOk) featureDisabledReason[flag] = `feature「${flag}」被 spec(feature-map.csl)标记为 disabled`;
  }

  // 2) enabledModes:根据 modeConstraints 过滤
  const allModes: ViewMode[] = ['form', 'summary', 'list', 'detail', 'dashboard', 'stage', 'blocks', 'mapping'];
  const enabledModes = allModes.filter(m =>
    MODE_CONSTRAINTS[m].requiredFeatures.every(f => featureFlags[f]),
  );

  // 3) runtime permissions:由 feature 推导
  const runtimePermissions = {
    allowFunctionCall: featureFlags.functions,
    allowStageTransition: featureFlags.stage_transitions,
    allowRegeneration: featureFlags.regeneration_events,
    allowSignalEmit: featureFlags.signals,
    allowInference: true, // 始终允许,未来可由 spec 关闭
  };

  // 4) OSE 策略:H5 — severity / blocking 完全从 spec 派生
  const activeHooks = (spec?.oseHooks || []).filter(h => h.status === 'active');
  const enabledHooks = activeHooks.map(h => h.id);
  const blockingHooks = activeHooks
    .filter(h => h.severity === 'block' || h.severity === 'block_with_fix_hint')
    .map(h => h.id);
  const warnOnlyHooks = activeHooks
    .filter(h => h.severity === 'warn')
    .map(h => h.id);

  // 5) 指纹
  const id = [
    grammarVersion,
    COMPILER_VERSION,
    OSE_POLICY_VERSION,
    Array.from(specDisabledIds).sort().join(','),
    blockingHooks.slice().sort().join(','),
  ].join('|');

  return {
    id,
    grammarVersion,
    specVersion: spec ? String(CURRENT_SPEC_VERSION) : 'spec-absent',
    compilerVersion: COMPILER_VERSION,
    osePolicyVersion: OSE_POLICY_VERSION,
    featureFlags,
    featureDisabledReason,
    enabledModes,
    defaultMode: enabledModes[0] || 'form',
    modeConstraints: MODE_CONSTRAINTS,
    runtimePermissions,
    osePolicies: {
      enabledHooks,
      blockingHooks,
      warnOnlyHooks,
    },
    projectionPolicies: {
      allowCodegen: true,
      allowRuntimeHandler: true,
      requireOSEPass: true,
    },
    exportMetadata: {
      includeIR: true,
      includeOSEReport: true,
      includeSource: true,
    },
  };
}

/** 便捷查询 */
export function isFeatureOn(profile: CapabilityProfile, flag: FeatureFlag): boolean {
  return profile.featureFlags[flag] === true;
}

export function isModeOn(profile: CapabilityProfile, mode: ViewMode): boolean {
  return profile.enabledModes.includes(mode);
}

export function whyModeUnavailable(profile: CapabilityProfile, mode: ViewMode): string | null {
  if (profile.enabledModes.includes(mode)) return null;
  const missing = profile.modeConstraints[mode].requiredFeatures.filter(f => !profile.featureFlags[f]);
  if (missing.length === 0) return '视图模式未在规格中声明';
  return `视图模式「${mode}」依赖的 feature 未启用: ${missing.join(', ')}`;
}
