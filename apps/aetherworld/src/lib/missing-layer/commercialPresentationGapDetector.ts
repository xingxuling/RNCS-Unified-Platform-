export interface CommercialPresentationGapResult {
  presentationGapScore: number;
  missingDemoFlows: string[];
  missingPitchPages: string[];
  missingUseCases: string[];
  missingBeforeAfterExamples: string[];
  missingPricingOrPoCInfo: string[];
  recommendedShowcaseUpgrade: string[];
}

export function detectCommercialPresentationGaps(): CommercialPresentationGapResult {
  return {
    presentationGapScore: 70,
    missingDemoFlows: ["普通用户演示路径", "创作者演示路径", "企业合作方演示路径"],
    missingPitchPages: ["Public Landing", "Pitch Deck Page"],
    missingUseCases: ["音乐创作案例", "世界构建案例", "原型加速案例"],
    missingBeforeAfterExamples: ["传统流程 vs Aetherworld 流程对比"],
    missingPricingOrPoCInfo: ["Pricing 页", "PoC 入口"],
    recommendedShowcaseUpgrade: ["补 Commercial Showcase 模块", "补 3 分钟演示路径", "补案例与前后对比"],
  };
}
