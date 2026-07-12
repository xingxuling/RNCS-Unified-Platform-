// AetherDev · 成本裁决
// 目标：把小修复推给 Codex / Cursor / 本地 VSCode；只把大 UI / 新页面推给 Lovable。
import type {
  CostDecision,
  DevIssueType,
  DevPriority,
  DevRiskLevel,
} from "./aetherDevTypes";

interface DecideInput {
  issueType: DevIssueType;
  riskLevel: DevRiskLevel;
  priority: DevPriority;
  targetFileCount: number;
}

export function decideCost(input: DecideInput): CostDecision {
  const { issueType, riskLevel, priority, targetFileCount } = input;

  if (riskLevel === "HIGH") {
    return {
      lovableCostRisk: "MEDIUM",
      codexCostRisk: "MEDIUM",
      apiCostRisk: "LOW",
      manualCost: "HIGH",
      recommendedTool: "DEFER",
      reason: "高风险任务需要创始人确认后再决定执行工具",
    };
  }

  if (issueType === "LOCAL_GATEWAY" || issueType === "FACTORY_CHAIN") {
    return {
      lovableCostRisk: "HIGH",
      codexCostRisk: "MEDIUM",
      apiCostRisk: "MEDIUM",
      manualCost: "MEDIUM",
      recommendedTool: "VSCODE_MANUAL",
      reason: "涉及本地网关 / 工厂链路，需在本机环境内验证，优先本地手工修",
    };
  }

  if (issueType === "TYPE_ERROR" || issueType === "STATE_SYNC") {
    return {
      lovableCostRisk: "MEDIUM",
      codexCostRisk: "LOW",
      apiCostRisk: "LOW",
      manualCost: "MEDIUM",
      recommendedTool: "CODEX",
      reason: "类型 / 状态同步类小修复，Codex 单文件最划算",
    };
  }

  if (issueType === "UI_ONLY" && targetFileCount <= 2) {
    return {
      lovableCostRisk: "MEDIUM",
      codexCostRisk: "LOW",
      apiCostRisk: "LOW",
      manualCost: "LOW",
      recommendedTool: "CURSOR",
      reason: "纯 UI 单文件微调，Cursor 直接修最快",
    };
  }

  if (issueType === "ROUTE" && targetFileCount <= 1) {
    return {
      lovableCostRisk: "MEDIUM",
      codexCostRisk: "LOW",
      apiCostRisk: "LOW",
      manualCost: "LOW",
      recommendedTool: "CURSOR",
      reason: "单文件路由补全，Cursor 即可完成",
    };
  }

  if (issueType === "DATA_FLOW" || issueType === "CHAT_BRIDGE" || issueType === "TRAINING_CHAIN") {
    return {
      lovableCostRisk: "MEDIUM",
      codexCostRisk: "MEDIUM",
      apiCostRisk: "LOW",
      manualCost: "MEDIUM",
      recommendedTool: targetFileCount >= 3 ? "LOVABLE" : "CODEX",
      reason:
        targetFileCount >= 3
          ? "跨多文件数据流改动，交给 Lovable 一次性补齐更稳"
          : "数据流类小改，Codex 单点处理更经济",
    };
  }

  if (priority === "P0") {
    return {
      lovableCostRisk: "MEDIUM",
      codexCostRisk: "LOW",
      apiCostRisk: "LOW",
      manualCost: "MEDIUM",
      recommendedTool: "LOVABLE",
      reason: "P0 关键路径，Lovable 一次性闭环优先",
    };
  }

  return {
    lovableCostRisk: "MEDIUM",
    codexCostRisk: "LOW",
    apiCostRisk: "LOW",
    manualCost: "LOW",
    recommendedTool: "CURSOR",
    reason: "默认轻量修改，优先用 Cursor 本地处理",
  };
}
