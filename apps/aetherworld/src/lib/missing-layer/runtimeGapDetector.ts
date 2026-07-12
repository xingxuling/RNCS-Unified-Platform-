import { scanSystemCapabilities } from "./systemCapabilityScanner";

export interface RuntimeGapResult {
  runtimeGapScore: number;
  modulesWithoutRuntime: string[];
  modulesWithoutTrace: string[];
  modulesWithoutValidation: string[];
  modulesWithoutWorkspaceRecord: string[];
  modulesWithoutQa: string[];
  recommendedRuntimeUpgrade: string[];
}

export function detectRuntimeGaps(): RuntimeGapResult {
  const cap = scanSystemCapabilities();
  const noRuntime = cap.capabilities.filter(c => c.runtimeStatus !== "ACTIVE").map(c => c.moduleId);
  const noQa = cap.capabilities.filter(c => c.qaStatus !== "ACTIVE").map(c => c.moduleId);
  const score = Math.min(100, noRuntime.length * 10 + noQa.length * 6);
  return {
    runtimeGapScore: score,
    modulesWithoutRuntime: noRuntime,
    modulesWithoutTrace: noRuntime,
    modulesWithoutValidation: noQa,
    modulesWithoutWorkspaceRecord: [],
    modulesWithoutQa: noQa,
    recommendedRuntimeUpgrade: noRuntime.map(m => `为 ${m} 接入 Runtime Spine`),
  };
}
