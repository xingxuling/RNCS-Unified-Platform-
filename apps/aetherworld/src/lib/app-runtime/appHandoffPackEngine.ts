import type { AppProjectObject, AppHandoffPack } from "./appProjectObjectEngine";
import type { AppHandoffTarget } from "@/constants/app-runtime/appHandoffTargets";

const BASE_SAFETY = [
  "不要删除现有项目功能",
  "不要重写已有业务逻辑",
  "不要让用户输入密码 / token / 支付信息",
  "不要执行危险代码",
  "不要声称已部署生产环境",
];

function buildPrompt(target: AppHandoffTarget, project: AppProjectObject): string {
  const head =
    `项目名称：${project.projectName}\n` +
    `应用类型：${project.appType}\n` +
    `运行时模式：${project.appRuntimeMode}\n` +
    `产品摘要：${project.requirement.productSummary}\n\n`;
  const features = `MVP 功能：\n${project.featureList.map(f => `- ${f.title} (${f.priority}) — ${f.userValue}`).join("\n")}\n\n`;
  const arch = `架构：${project.architecture.frameworkTarget}\n页面：${project.architecture.pageMap.map(p => p.route).join(", ")}\n\n`;

  const tail: Record<AppHandoffTarget, string> = {
    CODEX:  "请基于上述需求与现有文件继续实现 MVP，并补全测试与 README。",
    CURSOR: "请在 Cursor 中打开此项目，按 TODO 修复 bug、补全交互、提升 UI。",
    LOVABLE:"请用 Lovable 继续完善 UI 与页面流程，保持现有业务逻辑不变。",
    V0:     "请生成对应的 React + Tailwind 组件，匹配上述页面结构与组件职责。",
    BOLT:   "请生成可在 Bolt 中运行的 Vite + React 项目，包含上述 MVP。",
    GITHUB_COPILOT: "请按上述 PRD 与架构在 IDE 内逐文件补全实现。",
  };
  return head + features + arch + tail[target];
}

export function generateHandoffPack(project: AppProjectObject, target: AppHandoffTarget): AppHandoffPack {
  return {
    packId: `handoff-${project.projectId}-${target}`,
    targetTool: target,
    title: `${target} Handoff · ${project.projectName}`,
    prompt: buildPrompt(target, project),
    includedFiles: project.codeFiles.map(f => f.path),
    instructions: [
      "保持现有文件结构不变",
      "按 MVP 优先实现 MUST 功能，再扩展 SHOULD",
      "每个功能完成后请补充对应验收测试",
    ],
    acceptanceCriteria: project.featureList.flatMap(f => f.acceptanceCriteria),
    safetyBoundaries: BASE_SAFETY,
  };
}
