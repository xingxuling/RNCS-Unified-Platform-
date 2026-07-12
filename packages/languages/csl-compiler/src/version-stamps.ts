// CSL Version Stamps — 单一真源
// MVP-2 Phase 7:版本冻结与并行 diff 机制
//
// 四个正交版本号:
//   - grammarVersion: 语法表面层(lexer/parser 接受的语言版本)
//   - specVersion:    规格层(feature flags / hooks / schemas 契约版本,整数)
//   - compilerVersion: 编译器实现层(任何会改变 IR 输出的代码改动)
//   - osePolicyVersion: 治理层(OSE hook 集合 + severity 判定规则,整数)
//
// 工程纪律:
//   1. 全局唯一硬编码点 — 其他模块禁止内联硬编码版本字符串
//   2. 改动任意字段必须手工 +1 / 升 semver,PR review 把关
//   3. 四者正交,不要合并
//   4. compilerVersion 用 semver,其他用整数

import type { GrammarVersion } from './versions/registry';

/** 当前编辑器最高支持的语法版本(可降级编辑 v0.8) */
export const CURRENT_GRAMMAR_VERSION: GrammarVersion = 'v0.9';

/** 规格契约版本 — feature flags / hooks / schemas 形态变化时 +1 */
export const CURRENT_SPEC_VERSION = 1;

/** 编译器实现版本 — 任何会改变 IR 输出的代码改动升 semver */
export const CURRENT_COMPILER_VERSION = '1.0.0';

/** OSE 治理策略版本 — hook 升 block / 加 fixHint / 改判定时 +1 */
export const CURRENT_OSE_POLICY_VERSION = 2;

/** 四元版本指纹 — 所有产物出生时复制此对象,不允许引用 */
export interface VersionStamps {
  grammarVersion: GrammarVersion;
  specVersion: number;
  compilerVersion: string;
  osePolicyVersion: number;
}

/** 当前 stamps 快照(深拷贝,出厂即冻结) */
export function currentStamps(grammarVersion: GrammarVersion = CURRENT_GRAMMAR_VERSION): VersionStamps {
  return {
    grammarVersion,
    specVersion: CURRENT_SPEC_VERSION,
    compilerVersion: CURRENT_COMPILER_VERSION,
    osePolicyVersion: CURRENT_OSE_POLICY_VERSION,
  };
}

/** 严格相等(四字段) */
export function stampsEqual(a: VersionStamps, b: VersionStamps): boolean {
  return a.grammarVersion === b.grammarVersion
    && a.specVersion === b.specVersion
    && a.compilerVersion === b.compilerVersion
    && a.osePolicyVersion === b.osePolicyVersion;
}

/** 老 bundle 缺字段时的兜底 — 视为最古老版本 */
export function legacyStamps(grammarVersion: GrammarVersion = 'v0.8'): VersionStamps {
  return {
    grammarVersion,
    specVersion: 0,
    compilerVersion: '0.0.0',
    osePolicyVersion: 0,
  };
}

/** 容错读取:任意对象中提取 versionStamps,缺字段补 legacy */
export function extractStamps(obj: unknown): VersionStamps {
  const fallback = legacyStamps();
  if (!obj || typeof obj !== 'object') return fallback;
  const o = obj as Record<string, unknown>;
  const src = (o.versionStamps && typeof o.versionStamps === 'object')
    ? o.versionStamps as Record<string, unknown>
    : o;
  const grammar = src.grammarVersion;
  return {
    grammarVersion: (grammar === 'v0.8' || grammar === 'v0.9') ? grammar : fallback.grammarVersion,
    specVersion: typeof src.specVersion === 'number' ? src.specVersion : fallback.specVersion,
    compilerVersion: typeof src.compilerVersion === 'string' ? src.compilerVersion : fallback.compilerVersion,
    osePolicyVersion: typeof src.osePolicyVersion === 'number' ? src.osePolicyVersion : fallback.osePolicyVersion,
  };
}

/** semver 比较(仅 major.minor.patch,失败按 0.0.0) */
export function compareSemver(a: string, b: string): number {
  const pa = a.split('.').map(n => parseInt(n, 10) || 0);
  const pb = b.split('.').map(n => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    const da = pa[i] ?? 0; const db = pb[i] ?? 0;
    if (da !== db) return da < db ? -1 : 1;
  }
  return 0;
}
