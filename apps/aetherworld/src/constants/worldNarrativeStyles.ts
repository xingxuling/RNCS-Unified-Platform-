// 世界叙事风格
export interface WorldNarrativeStyle {
  id: string;
  name: string;
  tone: string;
  example: string;
}

export const WORLD_NARRATIVE_STYLES: WorldNarrativeStyle[] = [
  { id: "friendly",  name: "亲和清晰",  tone: "通俗、温度感、像朋友说话。",
    example: "你的世界像一片信号森林，很多变化你都能提前察觉。" },
  { id: "balanced",  name: "克制平衡",  tone: "中性、专业、不夸张。",
    example: "当前世界以变化与触发为主，结构稳定度中等。" },
  { id: "poetic",    name: "诗意叙事",  tone: "意象化、有节奏。",
    example: "风穿过你的世界，星火点亮新的小径。" },
  { id: "pragmatic", name: "务实决策",  tone: "聚焦行动与风险。",
    example: "当前最优行动：小步推进、记录回验，不押大注。" },
  { id: "technical", name: "技术语言",  tone: "工程化、参数化。",
    example: "主导域 feng，dominantNumber=5，建议小步推进。" },
];

export const getNarrativeStyle = (id: string) =>
  WORLD_NARRATIVE_STYLES.find(s => s.id === id) ?? WORLD_NARRATIVE_STYLES[0];
