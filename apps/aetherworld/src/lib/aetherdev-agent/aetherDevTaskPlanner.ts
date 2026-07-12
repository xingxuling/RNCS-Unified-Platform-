// AetherDev · 任务规划器
// 基于扫描结果生成 DevTask 列表，含 issueType / 优先级 / 风险 / 提示词 / 成本。
import { compileDevPrompts } from "./aetherDevPromptCompiler";
import { decideCost } from "./aetherDevCostDecider";
import { listBrokenOrMissingRoutes, listOpenBugs } from "./aetherDevProjectScanner";
import { newDevId } from "./aetherDevStore";
import type {
  DevIssueType,
  DevPriority,
  DevProjectSnapshot,
  DevRiskLevel,
  DevTask,
} from "./aetherDevTypes";

interface DraftTask {
  title: string;
  priority: DevPriority;
  issueType: DevIssueType;
  riskLevel: DevRiskLevel;
  targetFiles: string[];
  reason: string;
  expectedChange: string;
  acceptanceTests: string[];
}

function severityToPriority(sev: string): DevPriority {
  if (sev === "BLOCKER") return "P0";
  if (sev === "HIGH") return "P1";
  if (sev === "MEDIUM") return "P2";
  return "P3";
}

function severityToRisk(sev: string): DevRiskLevel {
  if (sev === "BLOCKER" || sev === "HIGH") return "MEDIUM";
  return "LOW";
}

export function planDevTasks(runId: string, snapshot: DevProjectSnapshot): DevTask[] {
  const drafts: DraftTask[] = [];

  // 1. 缺失 / 占位 / 损坏路由 → ROUTE 任务
  for (const r of listBrokenOrMissingRoutes()) {
    drafts.push({
      title: `补齐路由：${r.label}`,
      priority: r.status === "BROKEN" ? "P0" : "P2",
      issueType: "ROUTE",
      riskLevel: r.status === "BROKEN" ? "MEDIUM" : "LOW",
      targetFiles: r.routeFile ? [r.routeFile] : [],
      reason: `${r.label}（${r.path}）当前状态：${r.status}。${r.description}`,
      expectedChange:
        r.status === "PAGE_MISSING"
          ? "新建对应路由文件并提供最小可用页面"
          : "修复占位 / 异常，使页面达到 READY",
      acceptanceTests: [
        `访问 ${r.path} 不出现 404 或运行时错误`,
        "tsc --noEmit 通过",
        "页面包含标题区、操作区、内容区、辅助区四块结构",
      ],
    });
  }

  // 2. 未修复 bug → 按 issueType 分桶
  for (const b of listOpenBugs()) {
    const hay = `${b.module} ${b.page} ${b.description}`;
    const guessType: DevIssueType =
      /路由|route/i.test(hay) ? "ROUTE"
      : /训练|training/i.test(hay) ? "TRAINING_CHAIN"
      : /网关|gateway/i.test(hay) ? "LOCAL_GATEWAY"
      : /工厂|factory/i.test(hay) ? "FACTORY_CHAIN"
      : /chat|对话/i.test(hay) ? "CHAT_BRIDGE"
      : /类型|type/i.test(hay) ? "TYPE_ERROR"
      : "UNKNOWN";
    drafts.push({
      title: `修复：${b.module} · ${b.description.slice(0, 40)}`,
      priority: severityToPriority(b.severity),
      issueType: guessType,
      riskLevel: severityToRisk(b.severity),
      targetFiles: [],
      reason: `${b.description}（复现：${b.reproduce}）`,
      expectedChange: b.suggestion,
      acceptanceTests: ["tsc --noEmit 通过", "相关页面回归正常"],
    });
  }

  // 3. 局部网关未连接 → 提示型任务
  if (!snapshot.localGateway.detected) {
    drafts.push({
      title: "启动本地执行网关 local-gateway",
      priority: "P1",
      issueType: "LOCAL_GATEWAY",
      riskLevel: "LOW",
      targetFiles: ["local-gateway/README.md"],
      reason: "未检测到 local-gateway，无法执行 tsc / build / test 等只读检查命令",
      expectedChange: "在本机启动 local-gateway，并在 /system/local-gateway 验证连接",
      acceptanceTests: ["GET /health 返回 ok", "AetherDev 页面状态条显示「已检测」"],
    });
  }

  return drafts.map((d) => {
    const prompts = compileDevPrompts({
      title: d.title,
      issueType: d.issueType,
      reason: d.reason,
      expectedChange: d.expectedChange,
      targetFiles: d.targetFiles,
      acceptanceTests: d.acceptanceTests,
    });
    const cost = decideCost({
      issueType: d.issueType,
      riskLevel: d.riskLevel,
      priority: d.priority,
      targetFileCount: d.targetFiles.length,
    });
    return {
      id: newDevId("DEV-TASK"),
      runId,
      title: d.title,
      priority: d.priority,
      issueType: d.issueType,
      targetFiles: d.targetFiles,
      reason: d.reason,
      expectedChange: d.expectedChange,
      riskLevel: d.riskLevel,
      acceptanceTests: d.acceptanceTests,
      codexPrompt: prompts.codexPrompt,
      cursorPrompt: prompts.cursorPrompt,
      vscodeSteps: prompts.vscodeSteps,
      cost,
      createdAt: new Date().toISOString(),
    } satisfies DevTask;
  });
}
