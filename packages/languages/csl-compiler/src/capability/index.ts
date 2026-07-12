// CapabilityProfile 单例缓存入口
//
// 使用方式:
//   const profile = getCapabilityProfile('v0.9');
//   if (isFeatureOn(profile, 'functions')) { ... }
//
// 任何模块如果需要自己注入 spec(例如测试),可以用 compileCapabilityProfile 直接构造。

import { compileCapabilityProfile, type CapabilityProfile } from './profile';
import { loadSpecRegistry, type SpecRegistry } from '../specs/loader';
import type { GrammarVersion } from '../versions/registry';

export type { CapabilityProfile, ViewMode, OSESeverity } from './profile';
export {
  compileCapabilityProfile,
  isFeatureOn,
  isModeOn,
  whyModeUnavailable,
  COMPILER_VERSION,
  OSE_POLICY_VERSION,
} from './profile';

let cachedSpec: SpecRegistry | null = null;
const cache = new Map<string, CapabilityProfile>();

/** P1: 自举 stub — loadSpecRegistry 内部递归调用 runCSL 解析自身规格时,
 *  必须有一份临时空 spec 占位,否则会无限递归。
 *  此 stub 仅在 spec 自举阶段短暂可见,加载完成后立即被真实 spec 替换。
 */
const BOOTSTRAP_SPEC_STUB: SpecRegistry = {
  versions: [], features: [], astNodes: [], irTypes: [],
  examples: [], projectionDemos: [], suffixes: [], platforms: [], buildSteps: [],
  oseHooks: [], diagnostics: [],
  rawIRs: {} as any, rawSources: {} as any,
};

function getSpec(): SpecRegistry {
  if (cachedSpec && cachedSpec !== BOOTSTRAP_SPEC_STUB) return cachedSpec;
  if (cachedSpec === BOOTSTRAP_SPEC_STUB) return cachedSpec; // 自举中,返回占位
  // 防递归:先放占位,让 loadSpecRegistry 内部 runCSL 调用拿到 stub profile
  cachedSpec = BOOTSTRAP_SPEC_STUB;
  const real = loadSpecRegistry();
  cachedSpec = real;
  // 清掉自举期间用 stub 编译出的 profile,防止污染
  cache.clear();
  return real;
}

/** 获取当前 version 对应的 CapabilityProfile(带缓存) */
export function getCapabilityProfile(version: GrammarVersion): CapabilityProfile {
  const key = version;
  const hit = cache.get(key);
  if (hit) return hit;
  const spec = getSpec();
  const profile = compileCapabilityProfile(version, spec);
  cache.set(key, profile);
  return profile;
}

/** 测试 / 热更新:清空缓存并重新加载 spec */
export function resetCapabilityCache(): void {
  cachedSpec = null;
  cache.clear();
}
