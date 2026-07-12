import { MODEL_TYPES } from "@/constants/model-generation/modelTypes";

export interface ModelTypeResolution {
  recommendedModelType: string;
  alternativeModelTypes: string[];
  reason: string;
  confidence: number;
}

const KEYWORD_MAP: Array<{ keywords: RegExp; type: string; reason: string }> = [
  { keywords: /(声线|唱法|歌曲|音域|vocal|singing|song)/i,                    type: "VOCAL_MODEL",        reason: "包含声乐相关词" },
  { keywords: /(NPC|角色行为|关系网)/i,                                       type: "NPC_MODEL",          reason: "包含 NPC / 角色行为" },
  { keywords: /(世界|world|区域|zone|地图)/i,                                 type: "WORLD_MODEL",        reason: "包含世界 / 区域" },
  { keywords: /(产品|定位|用户)/i,                                            type: "PRODUCT_MODEL",      reason: "包含产品定位" },
  { keywords: /(商业|盈利|定价|渠道|business|revenue)/i,                      type: "BUSINESS_MODEL",     reason: "包含商业要素" },
  { keywords: /(检查|bug|质量|验收|qa)/i,                                     type: "QA_MODEL",           reason: "包含 QA 关键词" },
  { keywords: /(prompt|提示词)/i,                                             type: "PROMPT_MODEL",       reason: "包含 Prompt 关键词" },
  { keywords: /(代码|code|接口|schema|typescript)/i,                          type: "CODE_MODEL",         reason: "包含代码 / Schema 关键词" },
  { keywords: /(翻译|多语言|translation|localization)/i,                      type: "TRANSLATION_MODEL",  reason: "包含翻译 / 本地化" },
  { keywords: /(事件|传播|触发|event)/i,                                      type: "EVENT_MODEL",        reason: "包含事件 / 传播" },
  { keywords: /(关系|trust|relationship|信任)/i,                              type: "RELATIONSHIP_MODEL", reason: "包含关系 / 信任" },
  { keywords: /(决策|选择|decision)/i,                                        type: "DECISION_MODEL",     reason: "包含决策 / 选择" },
  { keywords: /(渲染|颜色|光照|render)/i,                                     type: "RENDER_MODEL",       reason: "包含渲染 / 视觉" },
  { keywords: /(物理|动量|physics|阻力)/i,                                    type: "PHYSICS_MODEL",      reason: "包含语义物理" },
  { keywords: /(动画|镜头|animation|转场)/i,                                  type: "ANIMATION_MODEL",    reason: "包含动画 / 镜头" },
  { keywords: /(主体|用户画像|persona|subject)/i,                             type: "SUBJECT_MODEL",      reason: "包含主体 / 画像" },
  { keywords: /(对象|本身|object)/i,                                          type: "OBJECT_MODEL",       reason: "包含对象 / 本身" },
  { keywords: /(功能|feature)/i,                                              type: "FEATURE_MODEL",      reason: "包含功能 / Feature" },
  { keywords: /(重算|stale|recalc)/i,                                         type: "RECALCULATION_MODEL",reason: "包含重算 / Stale" },
  { keywords: /(omni|路由|route)/i,                                           type: "OMNI_ROUTE_MODEL",   reason: "包含 Omni / 路由" },
];

export function resolveModelType(input: {
  objectName: string;
  objectDescription: string;
  targetUse: string;
  preferredModelType?: string;
}): ModelTypeResolution {
  if (input.preferredModelType && MODEL_TYPES.some(m => m.id === input.preferredModelType)) {
    return {
      recommendedModelType: input.preferredModelType,
      alternativeModelTypes: [],
      reason: "用户显式选择",
      confidence: 1,
    };
  }
  const text = `${input.objectName} ${input.objectDescription} ${input.targetUse}`.toLowerCase();
  const matches = KEYWORD_MAP.filter(k => k.keywords.test(text));
  if (matches.length === 0) {
    return {
      recommendedModelType: "OBJECT_MODEL",
      alternativeModelTypes: ["SUBJECT_MODEL", "FEATURE_MODEL"],
      reason: "未匹配特定关键词，默认 OBJECT_MODEL",
      confidence: 0.4,
    };
  }
  return {
    recommendedModelType: matches[0].type,
    alternativeModelTypes: matches.slice(1, 4).map(m => m.type),
    reason: matches[0].reason,
    confidence: Math.min(1, 0.5 + matches.length * 0.15),
  };
}
