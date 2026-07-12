// 畅想式融合 · Runtime 编排
import type {
  ImaginativeFusionReport,
  ProjectConceptSeed,
} from "./imaginativeFusionTypes";
import { IMAGINATIVE_FUSION_CALCULUS } from "./imaginativeFusionTypes";
import { extractConceptSeeds } from "./imaginativeProjectConceptExtractor";
import { generateImaginativeIdeas } from "./imaginativeFusionIdeaGenerator";
import { rankIdeas } from "./imaginativeFusionScorer";
import { buildReport } from "./imaginativeFusionRoadmapBuilder";
import { recordImaginativeFusion } from "./imaginativeFusionRecordBridge";
import { buildImaginativeMslFrame } from "./imaginativeFusionMslBridge";
import { buildMemoryUnitDrafts } from "./imaginativeFusionMemoryBridge";
import { buildSchedulerTaskDrafts } from "./imaginativeFusionSchedulerBridge";
import { buildWebXXMPackageIdeas } from "./imaginativeFusionStoreBridge";
import { buildReportObject } from "./imaginativeFusionWorkspaceBridge";

export { IMAGINATIVE_FUSION_CALCULUS };

export interface ImaginativePipelineInput {
  projectName: string;
  description: string;
}

export interface ImaginativePipelineOutput {
  seeds: ProjectConceptSeed[];
  report: ImaginativeFusionReport;
  msl: string;
  workspaceDraft: ReturnType<typeof buildReportObject>;
  memoryDrafts: ReturnType<typeof buildMemoryUnitDrafts>;
  schedulerDrafts: ReturnType<typeof buildSchedulerTaskDrafts>;
  packageIdeas: ReturnType<typeof buildWebXXMPackageIdeas>;
}

export function runImaginativeFusionPipeline(inputs: ImaginativePipelineInput[]): ImaginativePipelineOutput {
  const seeds = extractConceptSeeds(inputs);
  const ideas = generateImaginativeIdeas(seeds);
  const ranked = rankIdeas(ideas);
  const report = buildReport(seeds.length, ranked);

  // 异步桥接，不阻塞返回
  void recordImaginativeFusion(report);

  return {
    seeds,
    report,
    msl: buildImaginativeMslFrame(report),
    workspaceDraft: buildReportObject(report),
    memoryDrafts: buildMemoryUnitDrafts(report),
    schedulerDrafts: buildSchedulerTaskDrafts(report.topIdeas),
    packageIdeas: buildWebXXMPackageIdeas(report.topIdeas),
  };
}
