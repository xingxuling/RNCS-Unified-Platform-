import { scanSystemCapabilities } from "./systemCapabilityScanner";

export interface ObjectLayerGapResult {
  objectGapScore: number;
  outputsNotObjectized: string[];
  missingObjectTypes: string[];
  missingRuntimeContracts: string[];
  missingWorkspaceSave: string[];
  recommendedObjectization: string[];
}

export function detectObjectLayerGaps(): ObjectLayerGapResult {
  const cap = scanSystemCapabilities();
  const nonObjectized = cap.capabilities
    .filter(c => c.layerType === "FUNCTION_LAYER")
    .filter(c => !c.outputs.some(o => o.includes("object")))
    .map(c => c.moduleId);
  const score = Math.min(100, nonObjectized.length * 12);
  return {
    objectGapScore: score,
    outputsNotObjectized: nonObjectized,
    missingObjectTypes: nonObjectized.map(m => `${m}_OBJECT`),
    missingRuntimeContracts: nonObjectized,
    missingWorkspaceSave: nonObjectized,
    recommendedObjectization: nonObjectized.map(m => `把 ${m} 的输出对象化`),
  };
}
