import type { CrossFunctionalIntentType } from "@/constants/cross-functional/crossFunctionalIntentTypes";
import type { CrossFunctionalObjectType } from "@/constants/cross-functional/crossFunctionalVariableTypes";
import type { CrossFunctionalWorkflowType } from "@/constants/cross-functional/crossFunctionalWorkflowTypes";

export interface CrossFunctionalIntent {
  intentId: string;
  intentType: CrossFunctionalIntentType;
  sourceDomain: string;
  targetDomains: string[];
  confidence: number;
  recommendedWorkflowType: CrossFunctionalWorkflowType;
  requiredEngines: string[];
  optionalEngines: string[];
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

const RULES: Array<{
  match: RegExp;
  intent: CrossFunctionalIntentType;
  source: string;
  targets: string[];
  workflow: CrossFunctionalWorkflowType;
  required: string[];
  optional: string[];
}> = [
  { match: /角色.*(歌|主题曲|插曲|OP|ED)/, intent: "CHARACTER_TO_SONG", source: "character", targets: ["vocal","promptForge"], workflow: "CHARACTER_ASSET_PACK", required: ["vocal","promptForge"], optional: ["translation"] },
  { match: /角色.*(剧情|故事|场景)/, intent: "CHARACTER_TO_NARRATIVE", source: "character", targets: ["narrative"], workflow: "CHARACTER_ASSET_PACK", required: ["narrative"], optional: ["vocal"] },
  { match: /角色.*(视觉|图像|模型|MJ|prompt)/i, intent: "CHARACTER_TO_VISUAL_PROMPT", source: "character", targets: ["model","promptForge"], workflow: "CHARACTER_ASSET_PACK", required: ["model","promptForge"], optional: [] },
  { match: /世界.*(剧情|任务)/, intent: "WORLD_TO_NARRATIVE", source: "world", targets: ["narrative"], workflow: "WORLD_ASSET_PACK", required: ["narrative"], optional: ["vocal"] },
  { match: /世界.*(主题曲|歌|音乐)/, intent: "WORLD_TO_SONG", source: "world", targets: ["vocal","promptForge"], workflow: "WORLD_ASSET_PACK", required: ["vocal"], optional: ["translation"] },
  { match: /(世界|世界观).*(任务|quest|游戏)/i, intent: "WORLD_TO_GAME_QUEST", source: "world", targets: ["narrative"], workflow: "WORLD_ASSET_PACK", required: ["narrative"], optional: [] },
  { match: /(故事|剧情).*(歌|主题曲)/, intent: "STORY_TO_SONG", source: "narrative", targets: ["vocal"], workflow: "SONG_PRODUCTION_PACK", required: ["vocal"], optional: ["translation"] },
  { match: /(故事|剧情).*(prompt|提示词)/i, intent: "STORY_TO_PROMPT", source: "narrative", targets: ["promptForge"], workflow: "SONG_PRODUCTION_PACK", required: ["promptForge"], optional: [] },
  { match: /(歌|歌曲).*(剧情|故事)/, intent: "SONG_TO_NARRATIVE", source: "vocal", targets: ["narrative"], workflow: "SONG_PRODUCTION_PACK", required: ["narrative"], optional: [] },
  { match: /(歌词|歌).*(翻译|多语言|日文|英文)/, intent: "SONG_TO_TRANSLATION", source: "vocal", targets: ["translation"], workflow: "SONG_PRODUCTION_PACK", required: ["translation"], optional: [] },
  { match: /(歌词).*(声乐|声线|演唱)/, intent: "SONG_TO_VOCAL_PROMPT", source: "vocal", targets: ["vocal","promptForge"], workflow: "SONG_PRODUCTION_PACK", required: ["vocal"], optional: [] },
  { match: /模型.*(代码|前端|后端|component)/i, intent: "MODEL_TO_CODE", source: "model", targets: ["code"], workflow: "PRODUCT_BUILD_PACK", required: ["code"], optional: [] },
  { match: /产品.*(文档|docs|教程)/i, intent: "PRODUCT_TO_DOCS", source: "productEncyclopedia", targets: ["learningDocs"], workflow: "PRODUCT_BUILD_PACK", required: ["learningDocs"], optional: [] },
  { match: /产品.*(prompt|提示词)/i, intent: "PRODUCT_TO_PROMPT", source: "productEncyclopedia", targets: ["promptForge"], workflow: "PRODUCT_BUILD_PACK", required: ["promptForge"], optional: [] },
  { match: /(数据|外部数据).*(决策|分析)/, intent: "DATA_TO_DECISION", source: "realityData", targets: ["decision"], workflow: "PRODUCT_BUILD_PACK", required: ["decision"], optional: [] },
  { match: /数列.*(世界)/, intent: "SEQUENCE_TO_WORLD", source: "sequence", targets: ["world"], workflow: "SEQUENCE_CREATION_PACK", required: ["world"], optional: [] },
  { match: /数列.*(声乐|歌)/, intent: "SEQUENCE_TO_VOCAL", source: "sequence", targets: ["vocal"], workflow: "SEQUENCE_CREATION_PACK", required: ["vocal"], optional: [] },
  { match: /数列.*(叙事|剧情)/, intent: "SEQUENCE_TO_NARRATIVE", source: "sequence", targets: ["narrative"], workflow: "SEQUENCE_CREATION_PACK", required: ["narrative"], optional: [] },
  { match: /(词汇|术语).*(教程|文档|新手)/, intent: "VOCABULARY_TO_DOCS", source: "vocabulary", targets: ["learningDocs"], workflow: "PRODUCT_BUILD_PACK", required: ["learningDocs"], optional: [] },
  { match: /(引擎|计算法).*(示例|usage)/i, intent: "ENGINE_TO_USAGE_EXAMPLES", source: "calculusUniverse", targets: ["usageExamples"], workflow: "PRODUCT_BUILD_PACK", required: ["usageExamples"], optional: [] },
];

export function detectCrossFunctionalIntent(text: string): CrossFunctionalIntent {
  const t = text.trim();
  for (const r of RULES) {
    if (r.match.test(t)) {
      return {
        intentId: `cfi_${Date.now().toString(36)}`,
        intentType: r.intent,
        sourceDomain: r.source,
        targetDomains: r.targets,
        confidence: 0.82,
        recommendedWorkflowType: r.workflow,
        requiredEngines: r.required,
        optionalEngines: r.optional,
        riskLevel: "LOW",
      };
    }
  }
  return {
    intentId: `cfi_${Date.now().toString(36)}`,
    intentType: "CHARACTER_TO_NARRATIVE",
    sourceDomain: "unknown",
    targetDomains: ["narrative"],
    confidence: 0.3,
    recommendedWorkflowType: "CHARACTER_ASSET_PACK",
    requiredEngines: ["narrative"],
    optionalEngines: [],
    riskLevel: "MEDIUM",
  };
}

export const CROSS_TRIGGER_PHRASES = [
  "把这个变成歌","把这个角色写成剧情","把这个世界生成主题曲","把这个设定转成 prompt",
  "把这个产品生成代码","用这个世界生成任务","生成一整套","做成资产包",
  "跨功能使用","继续用上一个结果","把这个结果拿去另一个引擎",
];

export function shouldTriggerCrossFunctional(text: string): boolean {
  return CROSS_TRIGGER_PHRASES.some((p) => text.includes(p));
}
