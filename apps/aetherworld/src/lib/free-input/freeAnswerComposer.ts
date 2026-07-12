import { runSequenceAI } from "@/lib/sequence-ai/sequenceAI";
import { getToolById, getToolRoute } from "@/lib/sequence-ai/sequenceAIToolRegistry";
import type { SequenceAISubjectMode } from "@/lib/sequence-ai/sequenceAIContextBuilder";
import type { NormalizedFreeInput } from "./freeInputNormalizer";
import type { FreeTaskPlan, FreeTask } from "./freeTaskSplitter";
import type { FreeEngineRoute } from "./freeEngineRouter";
import type { FreeAnswerPlan } from "./freeAnswerPlanner";
import type { AmbiguityResolution } from "./freeAmbiguityResolver";
import type { FreeInputSafetyResult } from "./freeInputSafetyGuard";

export interface FreeQuickAction {
  label: string;
  actionType: string;
  targetEngine: string;
  route?: string;
  payload: Record<string, unknown>;
}

export interface GeneratedAsset {
  id: string;
  kind: string;
  title: string;
  content: string;
}

export interface FreeAnswer {
  title: string;
  answer: string;
  reasoningSummary?: string;
  taskBreakdown: FreeTask[];
  nextActions: string[];
  validationPoints: string[];
  generatedAssets: GeneratedAsset[];
  safetyNotes: string[];
  quickActions: FreeQuickAction[];
  assumptions: string[];
  clarificationQuestion?: string;
}

export interface ComposeOptions {
  founderActive: boolean;
  beginnerMode: boolean;
  subjectMode: SequenceAISubjectMode;
  language: string;
}

function engineName(id: string): string {
  return getToolById(id)?.userVisibleName ?? id;
}

function buildAnswerText(norm: NormalizedFreeInput, plan: FreeAnswerPlan, ambig: AmbiguityResolution): string {
  const eng = engineName(plan.primaryEngine);
  const topic = norm.userProvidedContext || norm.cleanedText.slice(0, 60);
  switch (plan.answerMode) {
    case "STRUCTURED_ANALYSIS":
      return `已用「${eng}」对「${topic}」做结构化分析：先识别对象本体与外部事件，再给出结构权重。`;
    case "STEP_BY_STEP_PLAN":
      return `已为「${topic}」生成可执行行动计划，按依赖关系排序，每一步均可验证。`;
    case "PROMPT_OUTPUT":
      return `已生成可复制 Prompt 草案，已附上下文、目标与回验点。`;
    case "MODEL_OUTPUT":
      return `已基于「${topic}」生成模型字段草案，可继续在模型生成引擎中精化。`;
    case "QA_OUTPUT":
      return `已运行系统检查并给出修复方向，详见生成资产与下一步动作。`;
    case "ENGINE_OUTPUT":
      return `已交由「${eng}」生成结果。假设：${ambig.assumedMeaning}。`;
    case "MIXED_OUTPUT":
      return `已将你的请求拆为多个任务，按依赖顺序依次执行，详见任务拆分。`;
    default:
      return `根据「${eng}」的判断：${topic}。${ambig.assumedMeaning ? `（假设：${ambig.assumedMeaning}）` : ""}`;
  }
}

function buildNextActions(plan: FreeAnswerPlan, tasks: FreeTask[]): string[] {
  const out: string[] = [];
  const eng = engineName(plan.primaryEngine);
  out.push(`进入「${eng}」继续深化或修改参数。`);
  if (tasks.length > 1) out.push("逐项执行任务拆分中的后续步骤。");
  out.push("把关键结论保存到产品百科或虚拟生活日记。");
  out.push("如需正式输出，请先在 24 小时内执行一次最小验证。");
  return out;
}

function buildValidation(plan: FreeAnswerPlan): string[] {
  const out: string[] = ["Safety Boundary 已检查输入与输出是否含高风险。"];
  out.push("Software QA 可对本结果做结构性检查。");
  out.push("如主体数列、引擎注册或语言偏好变化，Recalculation 会自动标记 stale。");
  if (plan.exportOptions.length) out.push(`可导出：${plan.exportOptions.join(" / ")}。`);
  return out;
}

function buildQuickActions(plan: FreeAnswerPlan, safety: FreeInputSafetyResult): FreeQuickAction[] {
  const blocked = safety.blockedActions;
  const out: FreeQuickAction[] = [];
  const add = (label: string, type: string, engine: string) => {
    if (blocked.includes("HANDOFF_WRITE") && type.startsWith("TO_")) return;
    out.push({ label, actionType: type, targetEngine: engine, route: getToolRoute(engine), payload: {} });
  };
  add("交给 Sequence AI 继续",   "TO_SEQUENCE_AI",      "sequenceAI");
  add("写成 Prompt",              "TO_PROMPT_FORGE",     "promptForge");
  add("做成模型",                 "TO_MODEL_GENERATION", "modelGeneration");
  add("写成剧情",                 "TO_NARRATIVE",        "narrativeTextEngine");
  add("生成声乐提示词",           "TO_VOCAL",            "vocalEngine");
  add("翻译",                     "TO_TRANSLATION",      "translationEngine");
  add("生成使用示例",             "TO_USAGE_EXAMPLES",   "usageExamples");
  add("查产品百科",               "TO_ENCYCLOPEDIA",     "productEncyclopedia");
  if (!blocked.includes("EXPORT")) {
    out.push({ label: "导出 JSON",  actionType: "EXPORT_JSON",  targetEngine: "engineExport", payload: {} });
    out.push({ label: "导出 Godot", actionType: "EXPORT_GODOT", targetEngine: "engineExport", payload: {} });
  }
  out.push({ label: "运行 QA",     actionType: "TO_QA",            targetEngine: "softwareQA",    route: getToolRoute("softwareQA"),    payload: {} });
  out.push({ label: "重新计算",    actionType: "TO_RECALCULATION", targetEngine: "recalculation", route: getToolRoute("recalculation"), payload: {} });
  return out;
}

function buildAssets(norm: NormalizedFreeInput, plan: FreeAnswerPlan, tasks: FreeTask[], safety: FreeInputSafetyResult): GeneratedAsset[] {
  if (safety.blockedActions.includes("GENERATE_ASSET")) return [];
  const base = `free_${Date.now().toString(36)}`;
  const assets: GeneratedAsset[] = [];
  assets.push({
    id: `${base}_summary`,
    kind: "summary",
    title: "结构化摘要",
    content:
      `# Free Answer\n\n- 输入类型：${norm.inputType}\n- 主引擎：${plan.primaryEngine}\n- 任务数：${tasks.length}\n` +
      tasks.map((t, i) => `${i + 1}. [${t.taskIntent}] ${t.inputSlice} → ${t.targetEngine}`).join("\n"),
  });
  if (plan.answerMode === "PROMPT_OUTPUT") {
    assets.push({
      id: `${base}_prompt`,
      kind: "prompt",
      title: "可复制 Prompt",
      content:
        `# Topic\n${norm.userProvidedContext || norm.cleanedText}\n\n# Engine\n${plan.primaryEngine}\n\n# Output requirements\n- Give a structured draft.\n- Include validation checkpoints.\n- Respect Safety Boundary.`,
    });
  }
  if (plan.answerMode === "MODEL_OUTPUT") {
    assets.push({
      id: `${base}_model`,
      kind: "model",
      title: "模型字段草案",
      content:
        `interface FreeAnswerModelDraft {\n  topic: string;\n  primarySignal: string;\n  weight: number;\n  validationPlan: string[];\n}`,
    });
  }
  return assets;
}

export function composeFreeAnswer(
  norm: NormalizedFreeInput,
  plan: FreeAnswerPlan,
  taskPlan: FreeTaskPlan,
  route: FreeEngineRoute,
  ambig: AmbiguityResolution,
  safety: FreeInputSafetyResult,
  opts: ComposeOptions,
): FreeAnswer {
  const sai = runSequenceAI({
    userInput: norm.cleanedText,
    founderActive: opts.founderActive,
    beginnerMode: opts.beginnerMode,
    subjectMode: opts.subjectMode,
    language: opts.language,
    persist: false,
  });

  const blocked = safety.safeResponseMode === "TEXT_ONLY";
  const baseAnswer = blocked
    ? "为安全起见，本次仅提供文字说明，不生成可执行资产，请参考安全提示。"
    : buildAnswerText(norm, plan, ambig);

  const merged = baseAnswer + (sai.response.plainAnswer ? `\n\n${sai.response.plainAnswer}` : "");

  return {
    title: "自由解答",
    answer: merged,
    reasoningSummary:
      opts.beginnerMode && !opts.founderActive
        ? undefined
        : `路由：${route.primaryEngine} ← ${route.rationale}`,
    taskBreakdown: taskPlan.tasks,
    nextActions: buildNextActions(plan, taskPlan.tasks),
    validationPoints: buildValidation(plan),
    generatedAssets: blocked ? [] : buildAssets(norm, plan, taskPlan.tasks, safety),
    safetyNotes: [...safety.requiredNotes, ...sai.response.safetyNotes],
    quickActions: buildQuickActions(plan, safety),
    assumptions: ambig.assumedMeaning ? [ambig.assumedMeaning] : [],
    clarificationQuestion: ambig.clarificationQuestion,
  };
}
