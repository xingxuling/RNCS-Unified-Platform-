// 设计建议、原型路径、验证计划
import type { CreationSeed } from "./creationSeedCompiler";
import type { FeasibilityAggregation } from "./creationFeasibilityEngine";
import type { IdentifiedRisk } from "./creationRiskAnalyzer";

export interface DesignSimulation {
  designRecommendations: string[];
  firstPrototypePath: string[];
  validationPlan: string[];
}

export function simulateDesign(seed: CreationSeed, agg: FeasibilityAggregation, risks: IdentifiedRisk[]): DesignSimulation {
  const recs: string[] = [];
  recs.push(`聚焦最强 3 个域：${agg.strongest.map(s => s.domainName).join("、")}。`);
  recs.push(`显著加强最弱 3 个域：${agg.weakest.map(s => s.domainName).join("、")}。`);
  if (risks.some(r => r.id === "COMPLEXITY_OVERLOAD")) recs.push("拆解为 3 个可独立验证的子模块。");
  if (risks.some(r => r.id === "REALITY_RISK")) recs.push("引入对应专业方做技术/合规评估。");
  if (risks.some(r => r.id === "MISREAD_AS_REAL_SIM")) recs.push("在产品文案显式声明：结构化推演 ≠ 真实仿真。");
  if (seed.objectType.id === "MR_DEVICE") recs.push("不要对标 Vision Pro 全功能，先做窄版样机。");
  if (seed.objectType.id === "VIRTUAL_WORLD") recs.push("v0.1 采用文本+卡片+任务+AI NPC 结构原型。");

  const prototype: string[] = [
    "Step 1 · 定义最小可验证范围（单用户/单场景/单功能）",
    "Step 2 · 用现有材料/平台/AI 工具搭一个能运行的雏形",
    "Step 3 · 找 5 位真实目标用户做盲测",
    "Step 4 · 记录反馈、回验关键假设",
  ];

  const validation: string[] = [
    `成功信号：在 4 周内出现 ${seed.objectType.userFriendlyName} 的核心闭环动作。`,
    "失败信号：用户首步即放弃 / 关键约束被证伪。",
    "每周复盘一次，回验最弱域是否被补齐。",
    "高风险领域：必须引入专业评审作为通过条件。",
  ];

  return { designRecommendations: recs, firstPrototypePath: prototype, validationPlan: validation };
}
