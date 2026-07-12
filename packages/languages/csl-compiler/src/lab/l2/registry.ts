// L2 影子分支 — feature gate
// 默认全关。调用方必须显式传入要开的 flags,否则 parser 全部拒绝识别。

import type { L2FeatureFlag, L2GrammarVersion } from './types';

export const L2_ALL_FLAGS: L2FeatureFlag[] = [
  'l2.engines',
  'l2.modules',
  'l2.responsibilities',
  'l2.constraints',
];

export const L2_FEATURE_LABELS: Record<L2FeatureFlag, string> = {
  'l2.engines': '引擎',
  'l2.modules': '模块',
  'l2.responsibilities': '职责',
  'l2.constraints': '前置/后置约束',
};

export const L2_VERSION_LABEL: Record<L2GrammarVersion, string> = {
  'v0.10-alpha': 'v0.10-alpha 影子',
};

/** 关键字 → feature 反向映射,parser 用于在 flag 关闭时给出明确诊断 */
export const L2_KEYWORD_TO_FLAG: Record<string, L2FeatureFlag> = {
  '引擎': 'l2.engines',
  '模块': 'l2.modules',
  '职责': 'l2.responsibilities',
  '前置': 'l2.constraints',
  '后置': 'l2.constraints',
};

export function isL2FlagEnabled(enabled: readonly L2FeatureFlag[], flag: L2FeatureFlag): boolean {
  return enabled.includes(flag);
}
