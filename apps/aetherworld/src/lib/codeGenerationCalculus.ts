// 代码生成计算法 Code Generation Calculus
import { getCodeTaskType } from "@/constants/codeTaskTypes";
import { getCodeTarget } from "@/constants/codeGenerationTargets";
import { pickPromptMode } from "@/constants/codePromptModes";
import { DEFAULT_DO_NOT_BREAK, scanCodeRisks } from "@/constants/codeSafetyRules";
import { planCodeTask, type PlannedFile } from "./codeTaskPlanner";
import { compileCodePrompt } from "./codePromptCompiler";
import { generateAcceptanceCriteria } from "./codeAcceptanceCriteriaGenerator";
import { analyzeDependencies } from "./codeDependencyAnalyzer";
import { runCodeSafetyGuard } from "./codeGenerationSafetyGuard";

export interface CodeGenerationInput {
  sourceModule?: string;
  targetFeature: string;
  taskType: string;
  targetTool: "LOVABLE" | "CODEX" | "CURSOR" | "GENERIC";
  currentVersion?: string;
  affectedModules: string[];
  doNotBreak: string[];
  requiredFiles?: string[];
  acceptanceCriteria?: string[];
  safetyLevel: "LOW" | "MEDIUM" | "HIGH";
  scopeMode: "PATCH" | "MODULE" | "BULK" | "REFACTOR" | "SYSTEM_LAYER";
}

export interface CodeGenerationResult {
  recommendedTaskType: string;
  recommendedPromptMode: string;
  targetFiles: PlannedFile[];
  dependencyWarnings: string[];
  generatedPrompt: string;
  acceptanceChecklist: string[];
  qaChecklist: string[];
  recalculationImpact: string[];
  documentationImpact: string[];
  riskWarnings: string[];
}

export function generateCodeTask(input: CodeGenerationInput): CodeGenerationResult {
  const taskType = getCodeTaskType(input.taskType);
  const promptMode = pickPromptMode(input.targetTool, input.scopeMode);

  const doNotBreak = Array.from(new Set([
    ...DEFAULT_DO_NOT_BREAK,
    ...(taskType?.typicalDoNotBreak ?? []),
    ...input.doNotBreak,
  ]));

  const plan = planCodeTask({
    taskTypeId: input.taskType,
    targetFeature: input.targetFeature,
    requiredFiles: input.requiredFiles ?? [],
    scopeMode: input.scopeMode,
  });

  const acceptance = generateAcceptanceCriteria({
    taskTypeId: input.taskType,
    plannedFiles: plan,
    extra: input.acceptanceCriteria ?? [],
  });

  const dep = analyzeDependencies({
    affectedModules: input.affectedModules,
    plannedFiles: plan,
  });

  const prompt = compileCodePrompt({
    input, promptModeId: promptMode, plan, acceptance, doNotBreak,
    dependencyWarnings: dep.warnings,
  });

  const safety = runCodeSafetyGuard({ input, generatedPrompt: prompt });
  const safetyRiskFromText = scanCodeRisks(prompt + input.targetFeature)
    .map(h => `[${h.rule.severity}] ${h.rule.description}（命中：${h.matched}）`);

  return {
    recommendedTaskType: taskType?.name ?? input.taskType,
    recommendedPromptMode: promptMode,
    targetFiles: plan,
    dependencyWarnings: dep.warnings,
    generatedPrompt: prompt,
    acceptanceChecklist: acceptance,
    qaChecklist: buildQAChecklist(input, plan),
    recalculationImpact: dep.recalculationImpact,
    documentationImpact: dep.documentationImpact,
    riskWarnings: [...safety, ...safetyRiskFromText],
  };
}

function buildQAChecklist(input: CodeGenerationInput, plan: PlannedFile[]): string[] {
  const list: string[] = [
    "运行类型检查，确认无报错。",
    "确认 Demo/Real 隔离未被破坏。",
    "确认 Safety Boundary 文案仍可见。",
  ];
  if (plan.some(f => f.path.startsWith("src/routes/"))) {
    list.push("确认新路由已在侧边栏可见（如适用）。");
  }
  if (plan.some(f => f.path.includes("constants/"))) {
    list.push("确认新常数已纳入 Constant Universe（如适用）。");
  }
  if (input.taskType === "FOUNDER_PROTECTED_FEATURE") {
    list.push("确认 Founder Gate 在普通用户视角隐藏。");
  }
  if (input.taskType === "EXPORT_FEATURE") {
    list.push("确认导出内容包含安全边界。");
  }
  return list;
}
