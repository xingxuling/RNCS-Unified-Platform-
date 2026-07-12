// Workspace 草案：IMAGINATIVE_FUSION_REPORT / FUSION_IDEA
import type { ImaginativeFusionReport, ImaginativeFusionIdea } from "./imaginativeFusionTypes";

export function buildReportObject(report: ImaginativeFusionReport) {
  return {
    objectType: "IMAGINATIVE_FUSION_REPORT",
    title: `畅想融合报告 · ${report.ideaCount} 创意`,
    payload: {
      id: report.id,
      generatedAt: report.generatedAt,
      sourceProjectCount: report.sourceProjectCount,
      ideaCount: report.ideaCount,
      summary: report.summary,
      topIdeas: report.topIdeas.map(slim),
      p0Ideas: report.p0Ideas.map(slim),
      p1Ideas: report.p1Ideas.map(slim),
      deferredIdeas: report.deferredIdeas.map(slim),
    },
  };
}

export function buildIdeaObject(idea: ImaginativeFusionIdea) {
  return {
    objectType: "FUSION_IDEA",
    title: idea.cnTitle,
    payload: slim(idea),
  };
}

function slim(i: ImaginativeFusionIdea) {
  return {
    id: i.id,
    title: i.title,
    cnTitle: i.cnTitle,
    fusionMode: i.fusionMode,
    sourceProjects: i.sourceProjects,
    targetAetherSystems: i.targetAetherSystems,
    score: {
      potentialValue: i.potentialValue,
      implementationDifficulty: i.implementationDifficulty,
      strategicFit: i.strategicFit,
      novelty: i.novelty,
    },
    riskLevel: i.riskLevel,
    priority: i.recommendedPriority,
    suggestedNextStep: i.suggestedNextStep,
    roadmap: i.roadmap,
  };
}
