// sequenceObjectTypeResolver.ts
import type { SequenceObjectType } from "@/constants/sequence-object/sequenceObjectTypes";
import { OBJECT_TYPE_TO_LAYER, type SequenceObjectLayer } from "@/constants/sequence-object/sequenceObjectLayers";

export interface ObjectTypeResolutionResult {
  objectType: SequenceObjectType;
  objectLayer: SequenceObjectLayer;
  confidence: number;
  alternativeTypes: SequenceObjectType[];
  requiredCompilers: string[];
  requiredGuards: string[];
  reason: string;
}

interface Rule { type: SequenceObjectType; patterns: RegExp[]; weight: number; reason: string; }

const RULES: Rule[] = [
  { type: "CHARACTER_OBJECT", patterns: [/角色|人物|character|人设/i], weight: 2, reason: "输入像角色描述" },
  { type: "WORLD_OBJECT", patterns: [/世界|world|宇宙|civilization/i], weight: 2, reason: "输入像世界描述" },
  { type: "SONG_OBJECT", patterns: [/歌|song|声乐|vocal|udio|suno|歌词/i], weight: 2, reason: "输入像歌曲" },
  { type: "STORY_OBJECT", patterns: [/剧情|故事|story|narrative|场景|scene/i], weight: 2, reason: "输入像剧情" },
  { type: "PROMPT_OBJECT", patterns: [/prompt|提示词|提示语/i], weight: 1.5, reason: "输入像提示词" },
  { type: "MODEL_OBJECT", patterns: [/模型|model|公式|formula|参数|variable/i], weight: 2, reason: "输入像模型/公式" },
  { type: "ENGINE_OBJECT", patterns: [/引擎|engine|后端|处理器|processor/i], weight: 2, reason: "输入像引擎" },
  { type: "WORKFLOW_OBJECT", patterns: [/工作流|workflow|流程|pipeline|流水线/i], weight: 2, reason: "输入像工作流" },
  { type: "PRODUCT_OBJECT", patterns: [/产品|product|功能|feature|需求/i], weight: 1.5, reason: "输入像产品需求" },
  { type: "GOVERNANCE_OBJECT", patterns: [/治理|governance|审计|policy/i], weight: 2, reason: "输入像治理规则" },
  { type: "CONSTITUTION_OBJECT", patterns: [/宪法|constitution|根本规则|根本约束/i], weight: 2, reason: "输入像宪法" },
  { type: "LANGUAGE_OBJECT", patterns: [/语言|language|语法|syntax|协议规则/i], weight: 1.5, reason: "输入像语言规则" },
  { type: "PROTOCOL_OBJECT", patterns: [/协议|protocol|约定/i], weight: 1.5, reason: "输入像协议" },
  { type: "CALCULUS_ENTRY_OBJECT", patterns: [/计算法|calculus/i], weight: 2, reason: "输入像计算法条目" },
  { type: "MULTIWORLD_OBJECT", patterns: [/多世界|multiverse|多元宇宙/i], weight: 2, reason: "输入像多世界结构" },
];

export function resolveObjectType(text: string, hint?: SequenceObjectType): ObjectTypeResolutionResult {
  if (hint) {
    return {
      objectType: hint,
      objectLayer: OBJECT_TYPE_TO_LAYER[hint],
      confidence: 1.0,
      alternativeTypes: [],
      requiredCompilers: requiredCompilersFor(hint),
      requiredGuards: requiredGuardsFor(hint),
      reason: "用户显式指定类型",
    };
  }
  const scores: Record<string, number> = {};
  const reasons: string[] = [];
  for (const r of RULES) {
    if (r.patterns.some((p) => p.test(text))) {
      scores[r.type] = (scores[r.type] ?? 0) + r.weight;
      reasons.push(r.reason);
    }
  }
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]) as Array<[SequenceObjectType, number]>;
  const winner = sorted[0]?.[0] ?? "TEXT_OBJECT";
  const total = sorted.reduce((s, [, v]) => s + v, 0) || 1;
  return {
    objectType: winner,
    objectLayer: OBJECT_TYPE_TO_LAYER[winner],
    confidence: sorted[0] ? sorted[0][1] / total : 0.3,
    alternativeTypes: sorted.slice(1, 4).map(([t]) => t),
    requiredCompilers: requiredCompilersFor(winner),
    requiredGuards: requiredGuardsFor(winner),
    reason: reasons.join("；") || "未匹配到强模式，默认 TEXT_OBJECT。",
  };
}

function requiredCompilersFor(t: SequenceObjectType): string[] {
  const layer = OBJECT_TYPE_TO_LAYER[t];
  const base = ["StructureCompiler"];
  if (layer === "RUNTIME_LAYER" || layer === "CIVILIZATION_LAYER") base.push("RuntimeContractEngine");
  if (layer === "ASSET_LAYER" || layer === "STRUCTURE_LAYER") base.push("VariableExtractor");
  return base;
}

function requiredGuardsFor(t: SequenceObjectType): string[] {
  const layer = OBJECT_TYPE_TO_LAYER[t];
  const guards = ["PermissionGuard", "MeaningDriftDetector", "SafetyGuard"];
  if (layer === "CIVILIZATION_LAYER") guards.push("ConstitutionGuard", "CLMReview");
  if (layer === "RUNTIME_LAYER") guards.push("QaBridge");
  return guards;
}
