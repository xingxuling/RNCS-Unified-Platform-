import { SEQUENCE_AI_PLAIN_TEMPLATES, SEQUENCE_AI_DEFAULT_TITLE } from "@/constants/sequence-ai/sequenceAIResponseFormats";
import type { SequenceAIIntentResult } from "./sequenceAIIntentClassifier";
import type { SequenceAIContext } from "./sequenceAIContextBuilder";
import type { SequenceAIPlan } from "./sequenceAIEnginePlanner";
import type { SafetyVerdict } from "./sequenceAISafetyGovernor";
import { getToolById, getToolRoute } from "./sequenceAIToolRegistry";

export interface SequenceAIQuickAction {
  label: string;
  actionType: string;
  targetEngine: string;
  payload: Record<string, unknown>;
  route?: string;
}

export interface GeneratedAsset {
  id: string;
  kind: string;
  title: string;
  content: string;
}

export interface SequenceAIResponse {
  title: string;
  plainAnswer: string;
  structuralAnswer?: string;
  nextActions: string[];
  validationPoints: string[];
  generatedAssets: GeneratedAsset[];
  engineTrace?: SequenceAIPlan;
  safetyNotes: string[];
  quickActions: SequenceAIQuickAction[];
}

function fill(tpl: string, vars: Record<string, string>): string {
  return tpl.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "—");
}

function buildVerdict(intent: SequenceAIIntentResult): string {
  switch (intent.intent) {
    case "ASK_DECISION":  return "可推进，但需补一项关键验证";
    case "SOLVE_PROBLEM": return "结构性卡点";
    default:              return "结构清晰";
  }
}

function buildReason(intent: SequenceAIIntentResult, ctx: SequenceAIContext): string {
  const obj = intent.objectType ?? "对象本身";
  const seq = ctx.activeSequenceSummary ? `（当前主体数列：${ctx.activeSequenceSummary}）` : "";
  return `结合${obj}的本体结构、外部事件与你的主体画像${seq}得出。`;
}

function buildNextActions(intent: SequenceAIIntentResult, plan: SequenceAIPlan): string[] {
  const out: string[] = [];
  const primaryTool = getToolById(plan.primaryEngine);
  if (primaryTool) out.push(`在「${primaryTool.userVisibleName}」中继续深化。`);
  if (plan.supportingEngines.length) out.push("将结果交给协同引擎进一步生成或验证。");
  out.push("把关键结论加入虚拟生活日记或产品百科留档。");
  if (intent.intent === "ASK_DECISION") out.push("在 24 小时内执行最小成本验证动作。");
  if (intent.intent === "SOLVE_PROBLEM") out.push("把破解假设拆为 1 个可观测指标。");
  return out;
}

function buildValidation(plan: SequenceAIPlan): string[] {
  const out: string[] = ["Safety Boundary 已检查输出是否含高风险表述。"];
  if (plan.validationEngines.includes("softwareQA")) out.push("Software QA 可对本结果再做结构性检查。");
  out.push("若主体数列或引擎注册更新，Recalculation 会标记本结果为 stale。");
  return out;
}

function buildQuickActions(intent: SequenceAIIntentResult, plan: SequenceAIPlan, blocked: string[]): SequenceAIQuickAction[] {
  const out: SequenceAIQuickAction[] = [];
  const allow = (a: string) => !blocked.includes(a);
  if (allow("HANDOFF_WRITE")) {
    out.push({ label: "用这个结果生成 Prompt", actionType: "TO_PROMPT_FORGE", targetEngine: "promptForge", payload: { topic: intent.topic }, route: getToolRoute("promptForge") });
    out.push({ label: "保存到产品百科",         actionType: "TO_ENCYCLOPEDIA", targetEngine: "productEncyclopedia", payload: { topic: intent.topic }, route: getToolRoute("productEncyclopedia") });
    out.push({ label: "生成使用示例",           actionType: "TO_USAGE_EXAMPLES", targetEngine: "usageExamples", payload: { topic: intent.topic }, route: getToolRoute("usageExamples") });
    out.push({ label: "转成模型",               actionType: "TO_MODEL_GENERATION", targetEngine: "modelGeneration", payload: { topic: intent.topic }, route: getToolRoute("modelGeneration") });
    out.push({ label: "转成剧情",               actionType: "TO_NARRATIVE", targetEngine: "narrativeTextEngine", payload: { topic: intent.topic }, route: getToolRoute("narrativeTextEngine") });
    out.push({ label: "转成声乐提示词",         actionType: "TO_VOCAL", targetEngine: "vocalEngine", payload: { topic: intent.topic }, route: getToolRoute("vocalEngine") });
    out.push({ label: "转成世界任务",           actionType: "TO_SEQUENCE_WORLD", targetEngine: "sequenceWorldEngine", payload: { topic: intent.topic }, route: getToolRoute("sequenceWorldEngine") });
  }
  if (allow("EXPORT")) {
    out.push({ label: "导出 JSON",  actionType: "EXPORT_JSON",  targetEngine: "engineExport", payload: { topic: intent.topic } });
    out.push({ label: "导出 Godot", actionType: "EXPORT_GODOT", targetEngine: "engineExport", payload: { topic: intent.topic } });
    out.push({ label: "导出 Unity", actionType: "EXPORT_UNITY", targetEngine: "engineExport", payload: { topic: intent.topic } });
  }
  out.push({ label: "运行 QA",      actionType: "TO_QA",            targetEngine: "softwareQA", payload: {}, route: getToolRoute("softwareQA") });
  out.push({ label: "重新计算",     actionType: "TO_RECALCULATION", targetEngine: "recalculation", payload: {}, route: getToolRoute("recalculation") });
  return out;
}

function buildAssets(intent: SequenceAIIntentResult, plan: SequenceAIPlan, blocked: string[]): GeneratedAsset[] {
  if (blocked.includes("GENERATE_ASSET")) return [];
  const out: GeneratedAsset[] = [];
  const baseId = `sai_${Date.now().toString(36)}`;
  out.push({
    id: `${baseId}_summary`,
    kind: "summary",
    title: "结构化摘要",
    content: `# ${intent.topic || "结构化摘要"}\n\n- 意图：${intent.intent}\n- 主引擎：${plan.primaryEngine}\n- 协同：${plan.supportingEngines.join(", ") || "—"}\n- 回验：${plan.validationEngines.join(", ")}\n`,
  });
  if (["GENERATE_PROMPT", "GENERATE_CODE_PLAN", "GENERATE_MODEL"].includes(intent.intent)) {
    out.push({
      id: `${baseId}_prompt`,
      kind: "prompt",
      title: "可复制 Prompt 草案",
      content: `# Topic: ${intent.topic}\n# Engine: ${plan.primaryEngine}\nPlease generate a draft for "${intent.topic}" using the engine context above, with explicit validation checkpoints.`,
    });
  }
  return out;
}

export function composeSequenceAIResponse(
  intent: SequenceAIIntentResult,
  ctx: SequenceAIContext,
  plan: SequenceAIPlan,
  safety: SafetyVerdict,
): SequenceAIResponse {
  const tpl = SEQUENCE_AI_PLAIN_TEMPLATES[intent.intent] ?? SEQUENCE_AI_PLAIN_TEMPLATES.UNKNOWN;
  const plain = fill(tpl, {
    topic: intent.topic || "你的目标",
    verdict: buildVerdict(intent),
    reason: buildReason(intent, ctx),
  });

  const blocked = safety.blockedActions;
  const showTrace = ctx.founderActive || ctx.userLevel === "STRUCTURED_USER";
  const showAssets = !safety.block;

  const response: SequenceAIResponse = {
    title: SEQUENCE_AI_DEFAULT_TITLE,
    plainAnswer: safety.block
      ? "为安全起见，本次仅提供文字说明，不生成可执行资产。请参考安全提示后再试。"
      : plain,
    structuralAnswer: ctx.userLevel === "PLAIN_USER" ? undefined :
      `引擎路由：${plan.primaryEngine} → [${plan.supportingEngines.join(", ") || "无协同"}] → 验证 [${plan.validationEngines.join(", ")}]`,
    nextActions: buildNextActions(intent, plan),
    validationPoints: buildValidation(plan),
    generatedAssets: showAssets ? buildAssets(intent, plan, blocked) : [],
    engineTrace: showTrace ? plan : undefined,
    safetyNotes: safety.notes,
    quickActions: buildQuickActions(intent, plan, blocked),
  };
  return response;
}
