// 15 大事件维度目标 — 用于事件库审计与缺口分析
// 不直接重构 PREDICTION_DIMENSIONS，而是建立映射关系，避免破坏已有 dimensionId

export interface EventDimensionTarget {
  id: string;            // 目标维度 ID
  name: string;          // 中文名
  en: string;            // 英文名
  description: string;
  minCount: number;      // 该维度建议事件数下限
  maxCount: number;      // 上限
  /** 现有 PredictionDimensionId 中可视为同义/可映射的维度（不强制重构）。 */
  mapsFromExisting: string[];
}

export const EVENT_DIMENSION_TARGETS: EventDimensionTarget[] = [
  { id: "CAREER",                en: "Career",                name: "事业与职业",     description: "工作、职业方向、合作、项目推进。",
    minCount: 12, maxCount: 18, mapsFromExisting: ["CAREER"] },
  { id: "PRODUCT_STARTUP",       en: "Product & Startup",     name: "产品与创业",     description: "产品活性、迭代、发布窗口、用户反馈、商业化。",
    minCount: 18, maxCount: 25, mapsFromExisting: ["PRODUCT"] },
  { id: "RELATIONSHIP",          en: "Intimate Relationship", name: "亲密关系",       description: "暧昧、恋爱、伴侣、确认、降温与误读。",
    minCount: 15, maxCount: 22, mapsFromExisting: ["RELATIONSHIP"] },
  { id: "SOCIAL_NETWORK",        en: "Social Network",        name: "社交与人脉",     description: "贵人、合作方、弱连接、群体评价。",
    minCount: 10, maxCount: 16, mapsFromExisting: ["SOCIAL_NETWORK"] },
  { id: "FINANCE_RESOURCE",      en: "Finance & Resource",    name: "财务与资源",     description: "收入、订单、现金流、投资与资源流动。",
    minCount: 12, maxCount: 18, mapsFromExisting: ["FINANCE"] },
  { id: "STUDY_APPLICATION",     en: "Study & Application",   name: "学业与申请",     description: "学校、申请、面试、材料、录取与教授反馈。",
    minCount: 10, maxCount: 16, mapsFromExisting: ["STUDY_APPLICATION"] },
  { id: "HEALTH_RECOVERY",       en: "Health & Recovery",     name: "身体与恢复",     description: "睡眠、运动、能量、过载与神经恢复。",
    minCount: 12, maxCount: 18, mapsFromExisting: ["HEALTH_RECOVERY"] },
  { id: "COGNITION_PLASTICITY",  en: "Cognition & Plasticity", name: "认知与大脑可塑性", description: "认知算力、可塑性、判断速度、过载与新结构生成。",
    minCount: 16, maxCount: 24, mapsFromExisting: ["COGNITION"] },
  { id: "CREATION_EXPRESSION",   en: "Creation & Expression", name: "创作与表达",     description: "创作爆发、阻滞、发布、表达型外化。",
    minCount: 12, maxCount: 20, mapsFromExisting: ["CREATION"] },
  { id: "IDENTITY_MAINLINE",     en: "Identity & Mainline",   name: "身份与主线",     description: "自我定位、公开形象、主线对齐与偏离。",
    minCount: 12, maxCount: 18, mapsFromExisting: ["IDENTITY", "SPIRIT_MAINLINE"] },
  { id: "LOCATION_ENVIRONMENT",  en: "Location & Environment", name: "地理与环境",    description: "城市、地区、场域、迁移、居住、家庭节律。",
    minCount: 8,  maxCount: 14, mapsFromExisting: ["LOCATION", "FAMILY_LIFE"] },
  { id: "LEGAL_ADMIN_SYSTEM",    en: "Legal / Admin",         name: "制度与手续",     description: "合同、申请、手续、政策、审核。",
    minCount: 8,  maxCount: 14, mapsFromExisting: ["LEGAL_ADMIN"] },
  { id: "TOOL_AI_PROMPT",        en: "Tool / AI / Prompt",    name: "AI工具与提示词", description: "AI 工具、Prompt 效果、自动化推进与回验。",
    minCount: 12, maxCount: 20, mapsFromExisting: ["PROMPT_TOOLING"] },
  { id: "RISK_CHAOS_NOISE",      en: "Risk / Chaos / Noise",  name: "风险、乱流与噪声", description: "突发、冲突、过载、延迟、伪信号。",
    minCount: 12, maxCount: 20, mapsFromExisting: ["RISK_CHAOS"] },
  { id: "SPIRIT_SYMBOLIC_VALUE", en: "Spirit & Symbolic",     name: "精神、象征与长期价值", description: "意义感、象征事件、长期价值与精神性确认。",
    minCount: 8,  maxCount: 14, mapsFromExisting: ["SPIRIT_MAINLINE"] },
];

export const TOTAL_TARGET_MIN = EVENT_DIMENSION_TARGETS.reduce((s, d) => s + d.minCount, 0);
export const TOTAL_TARGET_MAX = EVENT_DIMENSION_TARGETS.reduce((s, d) => s + d.maxCount, 0);

/** 根据已有 dimensionId 找到目标维度 ID（可能多个目标维度共享同一个 source） */
export function targetIdsForExisting(existingId: string): string[] {
  return EVENT_DIMENSION_TARGETS
    .filter((t) => t.mapsFromExisting.includes(existingId))
    .map((t) => t.id);
}

export function getTarget(id: string): EventDimensionTarget | undefined {
  return EVENT_DIMENSION_TARGETS.find((t) => t.id === id);
}
