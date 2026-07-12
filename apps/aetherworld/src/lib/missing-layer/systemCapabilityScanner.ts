import type { SystemLayerType } from "@/constants/missing-layer/systemLayerTypes";

export interface SystemCapability {
  capabilityId: string;
  capabilityName: string;
  layerType: SystemLayerType;
  moduleId: string;
  status: "NOT_FOUND" | "DRAFT" | "PARTIAL" | "ACTIVE" | "STABLE" | "NEEDS_REVIEW";
  relatedModules: string[];
  inputs: string[];
  outputs: string[];
  reusableBy: string[];
  qaStatus?: string;
  documentationStatus?: string;
  runtimeStatus?: string;
}

export interface SystemCapabilityMap {
  totalCapabilities: number;
  activeCapabilities: number;
  partialCapabilities: number;
  missingDocsCount: number;
  missingQaCount: number;
  missingRuntimeCount: number;
  missingObjectLayerCount: number;
  capabilities: SystemCapability[];
}

const CAPABILITIES: SystemCapability[] = [
  { capabilityId: "vocal", capabilityName: "Vocal Engine", layerType: "FUNCTION_LAYER", moduleId: "vocal-engine", status: "ACTIVE", relatedModules: ["narrative", "translation"], inputs: ["lyrics"], outputs: ["song"], reusableBy: ["narrative"], qaStatus: "PARTIAL", documentationStatus: "ACTIVE", runtimeStatus: "ACTIVE" },
  { capabilityId: "narrative", capabilityName: "Narrative Engine", layerType: "FUNCTION_LAYER", moduleId: "narrative-engine", status: "ACTIVE", relatedModules: ["vocal", "world"], inputs: ["character"], outputs: ["story"], reusableBy: ["vocal", "translation"], qaStatus: "ACTIVE", documentationStatus: "ACTIVE", runtimeStatus: "ACTIVE" },
  { capabilityId: "world", capabilityName: "Sequence World Engine", layerType: "FUNCTION_LAYER", moduleId: "sequence-world", status: "ACTIVE", relatedModules: ["narrative"], inputs: ["seed"], outputs: ["world"], reusableBy: ["narrative", "multi-world"], qaStatus: "ACTIVE", documentationStatus: "ACTIVE", runtimeStatus: "ACTIVE" },
  { capabilityId: "model", capabilityName: "Model Generation", layerType: "FUNCTION_LAYER", moduleId: "model-gen", status: "ACTIVE", relatedModules: ["code"], inputs: ["prompt"], outputs: ["model"], reusableBy: ["code"], qaStatus: "PARTIAL", documentationStatus: "PARTIAL", runtimeStatus: "ACTIVE" },
  { capabilityId: "code", capabilityName: "Code Generation", layerType: "FUNCTION_LAYER", moduleId: "code-gen", status: "ACTIVE", relatedModules: ["model"], inputs: ["spec"], outputs: ["code"], reusableBy: ["workspace"], qaStatus: "PARTIAL", documentationStatus: "PARTIAL", runtimeStatus: "ACTIVE" },
  { capabilityId: "runtime-spine", capabilityName: "Runtime Spine", layerType: "RUNTIME_LAYER", moduleId: "runtime-spine", status: "ACTIVE", relatedModules: ["*"], inputs: ["intent"], outputs: ["trace"], reusableBy: ["*"], qaStatus: "ACTIVE", documentationStatus: "ACTIVE", runtimeStatus: "ACTIVE" },
  { capabilityId: "workspace", capabilityName: "Workspace", layerType: "LIFECYCLE_LAYER", moduleId: "workspace", status: "ACTIVE", relatedModules: ["clm"], inputs: ["object"], outputs: ["saved"], reusableBy: ["*"], qaStatus: "ACTIVE", documentationStatus: "ACTIVE", runtimeStatus: "ACTIVE" },
  { capabilityId: "clm", capabilityName: "CLM", layerType: "LIFECYCLE_LAYER", moduleId: "clm", status: "ACTIVE", relatedModules: ["workspace"], inputs: ["object"], outputs: ["lifecycle"], reusableBy: ["*"], qaStatus: "ACTIVE", documentationStatus: "ACTIVE", runtimeStatus: "ACTIVE" },
  { capabilityId: "sequence-object", capabilityName: "Sequence Object Architecture", layerType: "OBJECT_LAYER", moduleId: "sequence-object", status: "ACTIVE", relatedModules: ["*"], inputs: ["seed"], outputs: ["object"], reusableBy: ["*"], qaStatus: "ACTIVE", documentationStatus: "ACTIVE", runtimeStatus: "ACTIVE" },
  { capabilityId: "cross-functional", capabilityName: "Cross-Functional Calculus", layerType: "WORKFLOW_LAYER", moduleId: "cross-functional", status: "ACTIVE", relatedModules: ["*"], inputs: ["object"], outputs: ["bridged"], reusableBy: ["*"], qaStatus: "ACTIVE", documentationStatus: "ACTIVE", runtimeStatus: "ACTIVE" },
  { capabilityId: "vocabulary", capabilityName: "Vocabulary Encyclopedia", layerType: "KNOWLEDGE_LAYER", moduleId: "vocabulary", status: "ACTIVE", relatedModules: ["docs"], inputs: ["term"], outputs: ["entry"], reusableBy: ["docs"], qaStatus: "ACTIVE", documentationStatus: "ACTIVE", runtimeStatus: "PARTIAL" },
  { capabilityId: "product-encyclopedia", capabilityName: "Product Encyclopedia", layerType: "KNOWLEDGE_LAYER", moduleId: "product-encyclopedia", status: "ACTIVE", relatedModules: ["docs"], inputs: ["module"], outputs: ["doc"], reusableBy: ["docs"], qaStatus: "ACTIVE", documentationStatus: "ACTIVE", runtimeStatus: "PARTIAL" },
  { capabilityId: "calculus-universe", capabilityName: "Calculus Universe", layerType: "KNOWLEDGE_LAYER", moduleId: "calculus-universe", status: "ACTIVE", relatedModules: ["docs"], inputs: ["calc"], outputs: ["entry"], reusableBy: ["docs"], qaStatus: "ACTIVE", documentationStatus: "ACTIVE", runtimeStatus: "PARTIAL" },
  { capabilityId: "system-constitution", capabilityName: "System Constitution", layerType: "GOVERNANCE_LAYER", moduleId: "system-constitution", status: "ACTIVE", relatedModules: ["*"], inputs: ["rule"], outputs: ["enforcement"], reusableBy: ["*"], qaStatus: "ACTIVE", documentationStatus: "ACTIVE", runtimeStatus: "ACTIVE" },
  { capabilityId: "software-qa", capabilityName: "Software QA", layerType: "QA_LAYER", moduleId: "software-qa", status: "ACTIVE", relatedModules: ["*"], inputs: ["module"], outputs: ["report"], reusableBy: ["*"], qaStatus: "ACTIVE", documentationStatus: "ACTIVE", runtimeStatus: "ACTIVE" },
  { capabilityId: "recalculation", capabilityName: "Recalculation", layerType: "QA_LAYER", moduleId: "recalculation", status: "ACTIVE", relatedModules: ["*"], inputs: ["trigger"], outputs: ["recalc"], reusableBy: ["*"], qaStatus: "ACTIVE", documentationStatus: "ACTIVE", runtimeStatus: "ACTIVE" },
  { capabilityId: "text-dynamic", capabilityName: "Text Dynamic Update", layerType: "DOCUMENTATION_LAYER", moduleId: "text-dynamic", status: "ACTIVE", relatedModules: ["docs"], inputs: ["change"], outputs: ["stale"], reusableBy: ["docs"], qaStatus: "ACTIVE", documentationStatus: "ACTIVE", runtimeStatus: "ACTIVE" },
  { capabilityId: "version-leap", capabilityName: "Version Leap Engine", layerType: "GOVERNANCE_LAYER", moduleId: "version-leap", status: "ACTIVE", relatedModules: ["*"], inputs: ["change"], outputs: ["leap"], reusableBy: ["*"], qaStatus: "ACTIVE", documentationStatus: "ACTIVE", runtimeStatus: "ACTIVE" },
  { capabilityId: "learning-docs", capabilityName: "Learning Docs", layerType: "DOCUMENTATION_LAYER", moduleId: "learning-docs", status: "ACTIVE", relatedModules: ["docs"], inputs: ["topic"], outputs: ["doc"], reusableBy: ["*"], qaStatus: "ACTIVE", documentationStatus: "ACTIVE", runtimeStatus: "PARTIAL" },
  { capabilityId: "multi-world", capabilityName: "Multi-World Network", layerType: "FUNCTION_LAYER", moduleId: "multi-world", status: "ACTIVE", relatedModules: ["world"], inputs: ["world"], outputs: ["federation"], reusableBy: ["world"], qaStatus: "PARTIAL", documentationStatus: "PARTIAL", runtimeStatus: "ACTIVE" },
  { capabilityId: "reality-calibration", capabilityName: "Reality Data Calibration", layerType: "DATA_LAYER", moduleId: "reality-calibration", status: "ACTIVE", relatedModules: ["qa"], inputs: ["data"], outputs: ["calibrated"], reusableBy: ["*"], qaStatus: "ACTIVE", documentationStatus: "ACTIVE", runtimeStatus: "ACTIVE" },
  { capabilityId: "constant-universe", capabilityName: "Constant Universe", layerType: "KNOWLEDGE_LAYER", moduleId: "constant-universe", status: "ACTIVE", relatedModules: ["docs"], inputs: ["constant"], outputs: ["entry"], reusableBy: ["docs"], qaStatus: "ACTIVE", documentationStatus: "ACTIVE", runtimeStatus: "PARTIAL" },
  { capabilityId: "hybrid-compression", capabilityName: "Hybrid Compression", layerType: "EXPORT_LAYER", moduleId: "hybrid-compression", status: "ACTIVE", relatedModules: ["export"], inputs: ["object"], outputs: ["compressed"], reusableBy: ["*"], qaStatus: "PARTIAL", documentationStatus: "PARTIAL", runtimeStatus: "ACTIVE" },
  { capabilityId: "commercial-showcase", capabilityName: "Commercial Showcase", layerType: "COMMERCIAL_LAYER", moduleId: "commercial-showcase", status: "PARTIAL", relatedModules: [], inputs: [], outputs: ["pitch"], reusableBy: [], qaStatus: "DRAFT", documentationStatus: "DRAFT", runtimeStatus: "DRAFT" },
];

export function scanSystemCapabilities(): SystemCapabilityMap {
  const caps = CAPABILITIES;
  return {
    totalCapabilities: caps.length,
    activeCapabilities: caps.filter(c => c.status === "ACTIVE" || c.status === "STABLE").length,
    partialCapabilities: caps.filter(c => c.status === "PARTIAL" || c.status === "DRAFT").length,
    missingDocsCount: caps.filter(c => !c.documentationStatus || c.documentationStatus === "DRAFT" || c.documentationStatus === "PARTIAL").length,
    missingQaCount: caps.filter(c => !c.qaStatus || c.qaStatus === "DRAFT" || c.qaStatus === "PARTIAL").length,
    missingRuntimeCount: caps.filter(c => !c.runtimeStatus || c.runtimeStatus === "DRAFT" || c.runtimeStatus === "PARTIAL").length,
    missingObjectLayerCount: caps.filter(c => c.layerType === "FUNCTION_LAYER" && !c.outputs.some(o => o.endsWith("object"))).length,
    capabilities: caps,
  };
}
