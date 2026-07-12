// 文案语言层级 Copy Language Levels
export interface CopyLanguageLevel {
  id: string;
  name: string;
  enName: string;
  description: string;
  jargonAllowance: "very_low" | "low" | "medium" | "high";
  audienceHint: string;
}

export const COPY_LANGUAGE_LEVELS: CopyLanguageLevel[] = [
  { id: "BEGINNER", name: "普通", enName: "Beginner", jargonAllowance: "very_low",
    description: "普通用户，几乎不懂术语。", audienceHint: "用日常语言" },
  { id: "ADVANCED", name: "进阶", enName: "Advanced", jargonAllowance: "medium",
    description: "熟悉系统的用户。", audienceHint: "可用部分术语" },
  { id: "PROFESSIONAL", name: "高阶", enName: "Professional", jargonAllowance: "high",
    description: "高阶用户/合作方/研究方向。", audienceHint: "保留术语，结构化" },
  { id: "ENTERPRISE", name: "企业", enName: "Enterprise", jargonAllowance: "low",
    description: "企业决策者。", audienceHint: "去命运化、强调流程与验证" },
  { id: "GAME_LORE", name: "游戏世界观", enName: "Game Lore", jargonAllowance: "medium",
    description: "虚拟世界叙事场景。", audienceHint: "叙事语调" },
  { id: "XIAOHONGSHU", name: "小红书", enName: "Xiaohongshu", jargonAllowance: "very_low",
    description: "小红书读者。", audienceHint: "情绪 + 痛点 + 低术语" },
];
