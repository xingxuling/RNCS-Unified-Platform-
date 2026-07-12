import { SYSTEM_LAYER_TYPES, type SystemLayerType } from "@/constants/missing-layer/systemLayerTypes";
import { scanSystemCapabilities } from "./systemCapabilityScanner";

export interface SystemLayer {
  layerType: SystemLayerType;
  modules: string[];
  strengthScore: number;
  maturity: "LOW" | "MEDIUM" | "HIGH" | "OVERBUILT";
  notes: string[];
}

export interface SystemLayerRelation {
  fromLayer: SystemLayerType;
  toLayer: SystemLayerType;
  relationType: "SUPPORTS" | "DEPENDS_ON" | "GOVERNS" | "USES" | "BLOCKS" | "EXPORTS_TO";
  strength: number;
}

export interface SystemLayerMap {
  mapId: string;
  layers: SystemLayer[];
  layerRelations: SystemLayerRelation[];
  weakLayers: SystemLayerType[];
  overloadedLayers: SystemLayerType[];
  missingLayers: SystemLayerType[];
}

export function buildSystemLayerMap(): SystemLayerMap {
  const cap = scanSystemCapabilities();
  const layers: SystemLayer[] = SYSTEM_LAYER_TYPES.map(layerType => {
    const modules = cap.capabilities.filter(c => c.layerType === layerType).map(c => c.moduleId);
    const count = modules.length;
    let maturity: SystemLayer["maturity"] = "LOW";
    if (count === 0) maturity = "LOW";
    else if (count <= 2) maturity = "MEDIUM";
    else if (count <= 5) maturity = "HIGH";
    else maturity = "OVERBUILT";
    const strengthScore = Math.min(100, count * 18);
    const notes: string[] = [];
    if (count === 0) notes.push("该层完全缺失");
    if (maturity === "OVERBUILT") notes.push("该层模块过多，注意整合");
    return { layerType, modules, strengthScore, maturity, notes };
  });

  return {
    mapId: `layermap-${Date.now()}`,
    layers,
    layerRelations: [
      { fromLayer: "FUNCTION_LAYER", toLayer: "OBJECT_LAYER", relationType: "EXPORTS_TO", strength: 70 },
      { fromLayer: "OBJECT_LAYER", toLayer: "WORKFLOW_LAYER", relationType: "USES", strength: 80 },
      { fromLayer: "WORKFLOW_LAYER", toLayer: "RUNTIME_LAYER", relationType: "DEPENDS_ON", strength: 90 },
      { fromLayer: "GOVERNANCE_LAYER", toLayer: "FUNCTION_LAYER", relationType: "GOVERNS", strength: 85 },
      { fromLayer: "QA_LAYER", toLayer: "FUNCTION_LAYER", relationType: "GOVERNS", strength: 80 },
      { fromLayer: "DOCUMENTATION_LAYER", toLayer: "KNOWLEDGE_LAYER", relationType: "SUPPORTS", strength: 75 },
      { fromLayer: "COMMERCIAL_LAYER", toLayer: "UI_LAYER", relationType: "USES", strength: 60 },
    ],
    weakLayers: layers.filter(l => l.maturity === "LOW").map(l => l.layerType),
    overloadedLayers: layers.filter(l => l.maturity === "OVERBUILT").map(l => l.layerType),
    missingLayers: layers.filter(l => l.modules.length === 0).map(l => l.layerType),
  };
}
