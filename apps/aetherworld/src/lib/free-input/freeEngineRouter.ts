import { getToolRoute } from "@/lib/sequence-ai/sequenceAIToolRegistry";
import type { FreeIntentId } from "@/constants/free-input/freeIntentTypes";
import type { NormalizedFreeInput } from "./freeInputNormalizer";
import type { FreeTaskPlan } from "./freeTaskSplitter";

export interface FreeEngineRoute {
  primaryEngine: string;
  supportingEngines: string[];
  rationale: string;
  route?: string;
}

const PRIORITY_RULES: { test: (n: NormalizedFreeInput) => boolean; engine: string; reason: string }[] = [
  { test: (n) => n.numbersOrSequences.length > 0, engine: "msl", reason: "输入包含数列，优先 MSL 解析。" },
  { test: (n) => /(打包|安卓|ios|godot|unity|sdk)/i.test(n.cleanedText), engine: "codeGeneration", reason: "技术/打包请求，优先代码生成。" },
  { test: (n) => /(歌|唱|声线|suno|udio|歌词)/i.test(n.cleanedText), engine: "vocalEngine", reason: "音乐/声乐请求。" },
  { test: (n) => /(翻译|translate|日文|英文|韩文|法文|繁体)/i.test(n.cleanedText), engine: "translationEngine", reason: "翻译请求。" },
  { test: (n) => /(漫画|剧情|小说|脚本|章节)/i.test(n.cleanedText), engine: "narrativeTextEngine", reason: "创作请求。" },
  { test: (n) => /(模型|schema|结构|字段)/i.test(n.cleanedText), engine: "modelGeneration", reason: "建模请求。" },
  { test: (n) => /(提示词|prompt|lovable|codex)/i.test(n.cleanedText), engine: "promptForge", reason: "提示词生成。" },
  { test: (n) => /(虚拟生活|今日|日记)/i.test(n.cleanedText), engine: "virtualLife", reason: "虚拟生活生成。" },
  { test: (n) => /(检查|审计|缺什么|qa)/i.test(n.cleanedText), engine: "softwareQA", reason: "系统检查/审计。" },
  { test: (n) => /(导出|export)/i.test(n.cleanedText), engine: "engineExport", reason: "导出请求。" },
  { test: (n) => /(怎么办|该不该|破解|卡)/i.test(n.cleanedText), engine: "universalBreakthrough", reason: "决策/破解请求。" },
  { test: (n) => /(是什么|解释|定义)/i.test(n.cleanedText), engine: "productEncyclopedia", reason: "术语解释。" },
  { test: (n) => /(用户|流程|体验)/i.test(n.cleanedText), engine: "usageExamples", reason: "用户/流程问题。" },
];

const SUPPORT_MAP: Record<string, string[]> = {
  msl:                  ["sequenceAI", "modelGeneration"],
  codeGeneration:       ["promptForge", "sequenceWorldEngine"],
  vocalEngine:          ["translationEngine", "promptForge"],
  translationEngine:    ["productEncyclopedia"],
  narrativeTextEngine:  ["modelGeneration", "sequenceWorldEngine"],
  modelGeneration:      ["msl", "promptForge"],
  promptForge:          ["modelGeneration"],
  virtualLife:          ["thingItselfCalculus"],
  softwareQA:           ["systemIntegrationAudit", "recalculation"],
  engineExport:         ["modelGeneration", "sequenceWorldEngine"],
  universalBreakthrough:["thingItselfCalculus", "sequenceAI"],
  productEncyclopedia:  ["usageExamples"],
  usageExamples:        [],
};

export function routeFreeEngines(norm: NormalizedFreeInput, plan: FreeTaskPlan): FreeEngineRoute {
  const rule = PRIORITY_RULES.find((r) => r.test(norm));
  if (rule) {
    return {
      primaryEngine: rule.engine,
      supportingEngines: SUPPORT_MAP[rule.engine] ?? [],
      rationale: rule.reason,
      route: getToolRoute(rule.engine),
    };
  }
  const primary = plan.tasks[0]?.targetEngine ?? "sequenceAI";
  return {
    primaryEngine: primary,
    supportingEngines: SUPPORT_MAP[primary] ?? ["sequenceAI"],
    rationale: "无强匹配规则，使用主任务目标引擎并由 Sequence AI 合成结果。",
    route: getToolRoute(primary),
  };
}
