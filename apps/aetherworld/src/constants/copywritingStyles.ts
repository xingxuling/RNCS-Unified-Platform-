// 文案风格 Copywriting Styles
export interface CopywritingStyle {
  id: string;
  name: string;
  enName: string;
  description: string;
  jargonTolerance: "low" | "medium" | "high";
  emotionalWeight: number; // 0-10
}

export const COPYWRITING_STYLES: CopywritingStyle[] = [
  { id: "CLEAR_SIMPLE", name: "清楚简单", enName: "Clear & Simple",
    description: "说人话，不堆术语。", jargonTolerance: "low", emotionalWeight: 3 },
  { id: "WARM_GUIDE", name: "温和引导", enName: "Warm Guide",
    description: "温度感、引导感、低压力。", jargonTolerance: "low", emotionalWeight: 6 },
  { id: "HIGH_CONCEPT", name: "高概念", enName: "High Concept",
    description: "高密度概念，适合熟悉系统的用户。", jargonTolerance: "high", emotionalWeight: 5 },
  { id: "ENTERPRISE_SAFE", name: "企业安全", enName: "Enterprise Safe",
    description: "去命运化、强调流程与验证。", jargonTolerance: "medium", emotionalWeight: 2 },
  { id: "XIAOHONGSHU_HOOK", name: "小红书钩子", enName: "Xiaohongshu Hook",
    description: "痛点反差、收藏感、低术语。", jargonTolerance: "low", emotionalWeight: 8 },
  { id: "TECHNICAL_DOC", name: "技术文档", enName: "Technical Doc",
    description: "结构化、可索引、面向开发者。", jargonTolerance: "high", emotionalWeight: 1 },
  { id: "FOUNDER_CODEX", name: "创始人圣典", enName: "Founder Codex",
    description: "系统语、宪法感、严密表述。", jargonTolerance: "high", emotionalWeight: 4 },
  { id: "GAME_LORE", name: "游戏世界观", enName: "Game Lore",
    description: "叙事感、角色感、世界设定语调。", jargonTolerance: "medium", emotionalWeight: 7 },
  { id: "ACTION_ORIENTED", name: "行动导向", enName: "Action Oriented",
    description: "下一步是什么，直接告诉用户。", jargonTolerance: "low", emotionalWeight: 5 },
  { id: "MICROCOPY", name: "短标签文案", enName: "Microcopy",
    description: "1–2 句，极短极清楚。", jargonTolerance: "low", emotionalWeight: 3 },
];

export function pickStylesForTarget(targetId: string): string[] {
  switch (targetId) {
    case "HOMEPAGE_HERO": return ["CLEAR_SIMPLE", "WARM_GUIDE", "HIGH_CONCEPT"];
    case "XIAOHONGSHU_POST":
    case "XIAOHONGSHU_TITLE": return ["XIAOHONGSHU_HOOK", "WARM_GUIDE", "CLEAR_SIMPLE"];
    case "ENTERPRISE_SAFE_COPY":
    case "INVESTOR_PITCH_COPY": return ["ENTERPRISE_SAFE", "TECHNICAL_DOC", "CLEAR_SIMPLE"];
    case "ENCYCLOPEDIA_ENTRY":
    case "PRODUCT_DOCS_SECTION": return ["TECHNICAL_DOC", "CLEAR_SIMPLE", "FOUNDER_CODEX"];
    case "WORLD_REPORT_COPY":
    case "QUEST_DESCRIPTION":
    case "NPC_DIALOGUE": return ["GAME_LORE", "WARM_GUIDE", "HIGH_CONCEPT"];
    case "CTA_COPY":
    case "IN_APP_MICROCOPY":
    case "ERROR_EMPTY_STATE": return ["MICROCOPY", "ACTION_ORIENTED", "CLEAR_SIMPLE"];
    default: return ["CLEAR_SIMPLE", "WARM_GUIDE", "ACTION_ORIENTED"];
  }
}
