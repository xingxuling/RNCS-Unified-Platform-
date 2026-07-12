// Analytics 桥：基于报告生成训练健康度概览
import type { PersonalModelForgeReport } from "./personalModelForgeTypes";

export interface ForgeAnalyticsSnapshot {
  totalExperiments: number;
  localCount: number;
  serverCount: number;
  draftCount: number;
  readyCount: number;
  bloodlineStages: number;
  toolchainSize: number;
  availableTools: number;
  manualTools: number;
  plannedTools: number;
}

export function analyzeForgeReport(report: PersonalModelForgeReport): ForgeAnalyticsSnapshot {
  const all = [...report.localExperiments, ...report.serverExperiments];
  return {
    totalExperiments: all.length,
    localCount: report.localExperiments.length,
    serverCount: report.serverExperiments.length,
    draftCount: all.filter((e) => e.status === "DRAFT").length,
    readyCount: all.filter((e) => e.status === "READY").length,
    bloodlineStages: report.bloodline.length,
    toolchainSize: report.toolchain.length,
    availableTools: report.toolchain.filter((t) => t.status === "AVAILABLE").length,
    manualTools: report.toolchain.filter((t) => t.status === "MANUAL").length,
    plannedTools: report.toolchain.filter((t) => t.status === "PLANNED").length,
  };
}
