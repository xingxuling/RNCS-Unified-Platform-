// 项目融合 · Runtime 编排
// 流程：scan → analyze → conflict → plan → (optional bridge) → record
import type {
  SameAccountProjectCandidate,
  ProjectFusionPlan,
  ProjectFusionResult,
  ProjectFusionScanReport,
  FusionStatus,
} from "./projectFusionTypes";
import { PROJECT_FUSION_CALCULUS } from "./projectFusionTypes";
import { scanProjectCandidate, scanProjectCandidates, type ScanInput } from "./projectFusionScanner";
import { analyzeCandidate } from "./projectFusionAnalyzer";
import { planFusion } from "./projectFusionBridgePlanner";
import { recordFusionScan, recordFusionApply } from "./projectFusionRecordBridge";
import { buildAuditNote } from "./projectFusionAuditBridge";

export { PROJECT_FUSION_CALCULUS };

export interface FusionPipelineOptions {
  /** 是否执行 bridge 落地（LOW 才会真正生成 Result=SUCCESS；HIGH 一律 BLOCKED） */
  apply?: boolean;
}

export function runProjectFusionPipeline(
  inputs: ScanInput[],
  opts: FusionPipelineOptions = {},
): ProjectFusionScanReport {
  const scanId = `PFR-${Date.now().toString(36)}`;
  const candidates = scanProjectCandidates(inputs);
  const plans: ProjectFusionPlan[] = candidates.map(planFusion);
  const warnings: string[] = [];

  const results: ProjectFusionResult[] = plans.map((p) => {
    const status: FusionStatus =
      !opts.apply
        ? "SKIPPED"
        : p.riskLevel === "HIGH"
        ? "BLOCKED"
        : p.conflicts.length > 0
        ? "PARTIAL"
        : p.fusionType === "REFERENCE_ONLY"
        ? "SKIPPED"
        : "SUCCESS";

    const r: ProjectFusionResult = {
      id: `PFRS-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      planId: p.id,
      status,
      changedFiles: status === "SUCCESS" ? p.filesToCreate : [],
      skippedItems: status === "SKIPPED" ? ["仅登记参考，未落地"] : [],
      conflictNotes: p.conflicts,
      auditNotes: [buildAuditNote(p, { id: "", planId: p.id, status, changedFiles: [], skippedItems: [], conflictNotes: [], auditNotes: [], createdAt: "" })],
      createdAt: new Date().toISOString(),
    };
    if (status === "BLOCKED") warnings.push(`「${p.sourceProjectName}」为高风险，已生成 Bridge Plan，等待确认。`);
    return r;
  });

  // 异步桥接，不阻塞返回
  void recordFusionScan(candidates);
  plans.forEach((p, i) => void recordFusionApply(p, results[i]));

  return {
    scanId,
    candidates,
    plans,
    results,
    warnings,
    createdAt: new Date().toISOString(),
  };
}

/** Workspace 草案对象：PROJECT_FUSION_REPORT */
export function buildWorkspaceReportDraft(report: ProjectFusionScanReport) {
  return {
    objectType: "PROJECT_FUSION_REPORT",
    title: `项目融合报告 · ${report.candidates.length} 候选`,
    payload: {
      scanId: report.scanId,
      candidates: report.candidates,
      plans: report.plans.map((p) => ({
        id: p.id,
        sourceProjectName: p.sourceProjectName,
        fusionType: p.fusionType,
        targetSystems: p.targetSystems,
        risk: p.riskLevel,
        priority: p.recommendedPriority,
        conflicts: p.conflicts,
      })),
      results: report.results.map((r) => ({
        id: r.id,
        planId: r.planId,
        status: r.status,
      })),
      createdAt: report.createdAt,
    },
  };
}

/** Scheduler 草案：高风险或 MEDIUM 项生成 PROJECT_FUSION 任务（WAITING_CONFIRMATION） */
export function buildSchedulerTaskDrafts(report: ProjectFusionScanReport) {
  return report.plans
    .filter((p) => p.riskLevel !== "LOW" || p.fusionType === "FULL_BRIDGE_PLAN")
    .map((p) => ({
      taskType: "PROJECT_FUSION" as const,
      status: "WAITING_CONFIRMATION" as const,
      title: `融合项目：${p.sourceProjectName}`,
      summary: `目标 ${p.targetSystems.join(" / ")}；风险 ${p.riskLevel}；类型 ${p.fusionType}`,
      planId: p.id,
    }));
}

export { scanProjectCandidate, analyzeCandidate, planFusion };
