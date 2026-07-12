// 代码依赖分析器
import type { PlannedFile } from "./codeTaskPlanner";

export interface DependencyAnalysisInput {
  affectedModules: string[];
  plannedFiles: PlannedFile[];
}

export interface DependencyAnalysisResult {
  warnings: string[];
  recalculationImpact: string[];
  documentationImpact: string[];
}

const RECALC_TRIGGERS = [
  "Constant Universe", "Event Universe", "Feedback Weights", "Product Language",
  "Platform Constants", "Encyclopedia", "Safety Boundary", "Prompt Templates",
];
const DOC_TRIGGERS = ["Encyclopedia", "Product Docs", "Safety Boundary"];

export function analyzeDependencies(i: DependencyAnalysisInput): DependencyAnalysisResult {
  const warnings: string[] = [];
  const recalc: string[] = [];
  const docs: string[] = [];

  for (const m of i.affectedModules) {
    if (RECALC_TRIGGERS.some(t => m.includes(t))) recalc.push(`Recalculation 需要标记 ${m} stale。`);
    if (DOC_TRIGGERS.some(t => m.includes(t))) docs.push(`文档/百科需要同步 ${m}。`);
  }

  const paths = i.plannedFiles.map(p => p.path);
  if (paths.some(p => p.includes("constants/")) && !i.affectedModules.includes("Constant Universe")) {
    warnings.push("新增常数文件，但未声明 Constant Universe 受影响。");
  }
  if (paths.some(p => p.includes("routes/")) && !paths.some(p => p.includes("AppSidebar"))) {
    warnings.push("新增路由但未编辑 AppSidebar，普通用户可能无法发现新页面。");
  }
  if (paths.some(p => p.includes("Founder")) && !i.affectedModules.includes("Founder Mode")) {
    warnings.push("涉及 Founder 模块，但未声明 Founder Mode 受影响。");
  }
  return { warnings, recalculationImpact: recalc, documentationImpact: docs };
}
