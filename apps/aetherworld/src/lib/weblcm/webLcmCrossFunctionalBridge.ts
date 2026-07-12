import type { AetherConcept } from "./webLcmTypes";

export interface CrossDomainBridgePlan {
  fromDomain: string;
  toDomain: string;
  bridgeConcepts: AetherConcept[];
  rationale: string;
}

export function planCrossDomainBridge(concepts: AetherConcept[], fromDomain: string, toDomain: string): CrossDomainBridgePlan {
  const bridge = concepts
    .filter(c => c.abstractionLevel === "MEDIUM" || c.abstractionLevel === "HIGH")
    .slice(0, 5);
  return {
    fromDomain,
    toDomain,
    bridgeConcepts: bridge,
    rationale: `从 ${fromDomain} 到 ${toDomain} 的桥接基于 ${bridge.length} 个中层 / 高层概念。`,
  };
}
