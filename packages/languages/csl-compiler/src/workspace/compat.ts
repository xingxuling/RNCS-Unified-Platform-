// CSL Workspace — 兼容性检查
// MVP-2 Phase 7:导入 bundle / 加载老 workspace 时的版本判定
//
// 三档判定:
//   compatible    四字段全部 ≤ 当前,且 grammarVersion 完全相等
//   read_only     grammar/spec/compiler 比当前老(老到当前还能解释)
//   incompatible  grammar 比当前新;或字段缺失/解析失败
//
// 纪律:不写自动迁移,不写 grammar 升降。只回答"能不能开"。

import {
  CURRENT_GRAMMAR_VERSION, CURRENT_SPEC_VERSION,
  CURRENT_COMPILER_VERSION, CURRENT_OSE_POLICY_VERSION,
  compareSemver, type VersionStamps,
} from '../version-stamps';

export type CompatVerdict = 'compatible' | 'read_only' | 'incompatible';

export interface CompatCheckResult {
  verdict: CompatVerdict;
  current: VersionStamps;
  imported: VersionStamps;
  reasons: string[];
  primaryHint: string;
}

const GRAMMAR_ORDER: Record<string, number> = { 'v0.8': 1, 'v0.9': 2 };

function grammarRank(v: string): number {
  return GRAMMAR_ORDER[v] ?? 0;
}

export function checkBundleCompat(imported: VersionStamps): CompatCheckResult {
  const current: VersionStamps = {
    grammarVersion: CURRENT_GRAMMAR_VERSION,
    specVersion: CURRENT_SPEC_VERSION,
    compilerVersion: CURRENT_COMPILER_VERSION,
    osePolicyVersion: CURRENT_OSE_POLICY_VERSION,
  };
  const reasons: string[] = [];

  const importedRank = grammarRank(imported.grammarVersion);

  // 1) grammar 比当前新 → incompatible
  if (importedRank === 0) {
    return {
      verdict: 'incompatible',
      current, imported,
      reasons: [`未知语法版本:${imported.grammarVersion}`],
      primaryHint: `[版本] 此运行包来自未知语法版本(${imported.grammarVersion}),当前编辑器无法加载`,
    };
  }
  if (importedRank > grammarRank(CURRENT_GRAMMAR_VERSION)) {
    return {
      verdict: 'incompatible',
      current, imported,
      reasons: [`运行包语法版本 ${imported.grammarVersion} 高于当前 ${CURRENT_GRAMMAR_VERSION}`],
      primaryHint: `[版本] 此运行包来自更新版本(${imported.grammarVersion}),当前编辑器无法加载。请升级 CSL 版本或仅查看 manifest`,
    };
  }
  if (imported.specVersion > CURRENT_SPEC_VERSION) {
    return {
      verdict: 'incompatible',
      current, imported,
      reasons: [`spec 版本 ${imported.specVersion} 高于当前 ${CURRENT_SPEC_VERSION}`],
      primaryHint: `[版本] 此运行包的规格版本(spec=${imported.specVersion})高于当前编辑器(spec=${CURRENT_SPEC_VERSION}),无法加载`,
    };
  }
  if (compareSemver(imported.compilerVersion, CURRENT_COMPILER_VERSION) > 0) {
    return {
      verdict: 'incompatible',
      current, imported,
      reasons: [`编译器版本 ${imported.compilerVersion} 高于当前 ${CURRENT_COMPILER_VERSION}`],
      primaryHint: `[版本] 此运行包由更新的编译器(${imported.compilerVersion})生成,当前编辑器无法加载`,
    };
  }

  // 2) grammar 老 → 可以解释但只读(避免被新 IR 形态污染)
  if (imported.grammarVersion !== CURRENT_GRAMMAR_VERSION) {
    reasons.push(`运行包语法 ${imported.grammarVersion},当前编辑器 ${CURRENT_GRAMMAR_VERSION}`);
  }
  if (imported.specVersion < CURRENT_SPEC_VERSION) {
    reasons.push(`spec 版本旧(${imported.specVersion} → ${CURRENT_SPEC_VERSION})`);
  }
  if (compareSemver(imported.compilerVersion, CURRENT_COMPILER_VERSION) < 0) {
    reasons.push(`编译器版本旧(${imported.compilerVersion} → ${CURRENT_COMPILER_VERSION})`);
  }
  if (imported.osePolicyVersion !== CURRENT_OSE_POLICY_VERSION) {
    reasons.push(`治理规则版本不一致(${imported.osePolicyVersion} → ${CURRENT_OSE_POLICY_VERSION})`);
  }

  if (reasons.length === 0) {
    return {
      verdict: 'compatible',
      current, imported,
      reasons: [],
      primaryHint: `已导入运行包:版本一致(${imported.grammarVersion})`,
    };
  }

  return {
    verdict: 'read_only',
    current, imported,
    reasons,
    primaryHint: `[版本] 此运行包来自更早版本(${imported.grammarVersion} / spec=${imported.specVersion}),仅可只读查看,不可编辑或重新导出`,
  };
}

/** workspace.lastBuildStamps 与编辑器是否同源 — 用于顶部提示 */
export function checkWorkspaceStampsDrift(
  workspaceGrammar: string,
  lastBuildStamps?: VersionStamps,
): { drifted: boolean; hint: string | null } {
  // grammar 不一致最重要
  if (workspaceGrammar !== CURRENT_GRAMMAR_VERSION && lastBuildStamps?.grammarVersion === workspaceGrammar) {
    // workspace 的 grammar 与编辑器最高支持不同,但只要 workspace.cslVersion 在支持范围内,允许编辑
    // 这里不报漂移 — 用户主动用 v0.8 编辑是合法的
  }
  if (!lastBuildStamps) return { drifted: false, hint: null };

  if (lastBuildStamps.grammarVersion !== workspaceGrammar) {
    return {
      drifted: true,
      hint: `[版本] 此工作区由 ${lastBuildStamps.grammarVersion} 构建,当前编辑器为 ${workspaceGrammar}。切换版本以保持一致`,
    };
  }
  if (compareSemver(lastBuildStamps.compilerVersion, CURRENT_COMPILER_VERSION) !== 0) {
    return {
      drifted: true,
      hint: `[版本] 编译器版本变化(${lastBuildStamps.compilerVersion} → ${CURRENT_COMPILER_VERSION}),IR 可能有差异,建议重新构建`,
    };
  }
  if (lastBuildStamps.osePolicyVersion !== CURRENT_OSE_POLICY_VERSION) {
    return {
      drifted: true,
      hint: `[版本] 治理规则已更新(${lastBuildStamps.osePolicyVersion} → ${CURRENT_OSE_POLICY_VERSION}),原快照的诊断仅供参考`,
    };
  }
  return { drifted: false, hint: null };
}
