// 项目融合 · Chat Bridge
import {
  runProjectFusionPipeline,
  PROJECT_FUSION_CALCULUS,
} from "./projectFusionRuntime";
import type { ProjectFusionScanReport } from "./projectFusionTypes";
import {
  getLovablePassScanReport,
  type SameAccountProjectScanReport,
} from "./lovablePassScanReport";

export interface ChatProjectFusionInfo {
  calculusId: typeof PROJECT_FUSION_CALCULUS;
  question: string;
  summary: string;
  /** 运行时无法扫描账号，仅给出说明文案 + 已保存的 Lovable Pass 报告 */
  runtimeDisclaimer: string;
  /** 由 Lovable 开发期保存到项目里的真实扫描报告（如果存在） */
  savedLovablePassReport?: SameAccountProjectScanReport;
  /** 仅在用户显式登记候选项目时才生成的离线 Bridge Plan 报告 */
  report?: ProjectFusionScanReport;
  warnings: string[];
}

const TRIGGER_KEYWORDS = [
  "同账号项目", "同账号", "项目融合", "项目吸收", "项目复用",
  "把.*项目.*融合", "把.*项目.*吸收", "把.*项目.*参考",
  "哪些项目.*可以.*融合", "哪些项目.*值得参考", "哪些项目.*webxxm",
  "哪些.*ui.*可以复用", "哪些.*调度.*迁移",
  "project fusion", "same account project", "reuse project",
];

export function detectProjectFusionIntent(raw: string): boolean {
  if (!raw) return false;
  return TRIGGER_KEYWORDS.some((k) => new RegExp(k, "i").test(raw));
}

const RUNTIME_DISCLAIMER =
  "当前运行时不能直接读取 Lovable 同账号项目。请在 Lovable 开发环境中执行 Same-Account Project Fusion Pass。" +
  "若项目内已保存融合报告，我会基于该报告继续分析，不会编造扫描结果。";

/** 从 Chat 输入中粗略抽取用户显式登记的候选项目 */
function extractExplicitCandidates(raw: string): { projectName: string; description: string }[] {
  const lines = raw
    .split(/\r?\n|[；;]|、/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !/^(同账号|项目融合|哪些|可以|怎么|如何)/.test(l) && /[:：]/.test(l));
  return lines.slice(0, 8).map((l) => ({ projectName: l.split(/[:：]/)[0].slice(0, 40), description: l }));
}

export function buildChatProjectFusionInfo(rawInput: string): ChatProjectFusionInfo | undefined {
  if (!rawInput || !detectProjectFusionIntent(rawInput)) return undefined;

  const saved = getLovablePassScanReport();
  const explicit = extractExplicitCandidates(rawInput);
  const report = explicit.length > 0 ? runProjectFusionPipeline(explicit, { apply: false }) : undefined;

  const summaryParts: string[] = [];
  if (saved) {
    summaryParts.push(
      `已读取 Lovable 开发期保存的扫描报告（${saved.totalAccessibleProjects} 可访问 · ${saved.highValueProjects.length} 高价值 · ${saved.fusionPlans.length} 融合计划）。`
    );
  }
  if (report) {
    const fuseNow = report.plans.filter((p) => p.riskLevel === "LOW").length;
    const bridge = report.plans.filter((p) => p.riskLevel !== "LOW").length;
    summaryParts.push(`基于你显式登记的 ${explicit.length} 个候选额外生成：可直接复用 ${fuseNow} · 需 Bridge Plan ${bridge}。`);
  }
  if (summaryParts.length === 0) {
    summaryParts.push("当前没有可分析的内容。请到 /system/lovable-pass 查看真实开发期报告，或在消息里以「项目名：说明」格式登记候选。");
  }

  return {
    calculusId: PROJECT_FUSION_CALCULUS,
    question: rawInput,
    summary: summaryParts.join(" "),
    runtimeDisclaimer: RUNTIME_DISCLAIMER,
    savedLovablePassReport: saved,
    report,
    warnings: report?.warnings ?? [],
  };
}

export { PROJECT_FUSION_CALCULUS };

