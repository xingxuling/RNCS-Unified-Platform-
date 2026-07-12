// 把高价值创意压成 SMU 草案（容错调用）
import type { ImaginativeFusionReport } from "./imaginativeFusionTypes";

export function buildMemoryUnitDrafts(report: ImaginativeFusionReport) {
  return report.topIdeas.map((i) => ({
    sequenceCode: `SMU-IFI-${i.id}`,
    title: i.cnTitle,
    abstract: i.description,
    importance: (i.potentialValue + i.strategicFit) / 20,
    tags: [i.fusionMode, ...i.targetAetherSystems],
  }));
}
