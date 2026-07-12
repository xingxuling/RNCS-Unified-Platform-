import { scanSystemCapabilities } from "./systemCapabilityScanner";

export interface FeatureFragmentationResult {
  fragmentationScore: number;
  isolatedModules: string[];
  duplicateModules: string[];
  overlappingFunctions: string[];
  suggestedMerges: string[];
  suggestedBridges: string[];
}

export function detectFeatureFragmentation(): FeatureFragmentationResult {
  const cap = scanSystemCapabilities();
  const isolated = cap.capabilities.filter(c => c.relatedModules.length === 0).map(c => c.moduleId);
  const outputs = new Map<string, string[]>();
  for (const c of cap.capabilities) {
    for (const o of c.outputs) {
      outputs.set(o, [...(outputs.get(o) ?? []), c.moduleId]);
    }
  }
  const duplicate = [...outputs.entries()].filter(([, v]) => v.length > 1).flatMap(([, v]) => v);
  const score = Math.min(100, isolated.length * 10 + duplicate.length * 8);

  return {
    fragmentationScore: score,
    isolatedModules: isolated,
    duplicateModules: duplicate,
    overlappingFunctions: [...outputs.entries()].filter(([, v]) => v.length > 1).map(([k]) => k),
    suggestedMerges: duplicate.length > 0 ? ["建议合并重复输出"] : [],
    suggestedBridges: isolated.length > 0 ? isolated.map(m => `为 ${m} 增加 Cross-Functional Bridge`) : [],
  };
}
