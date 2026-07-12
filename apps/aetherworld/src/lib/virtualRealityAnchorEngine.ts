// 现实锚点引擎
export type RealityAnchorType = "ACTION" | "REST" | "FEEDBACK" | "SOCIAL" | "CREATION" | "SAFETY";

export interface RealityAnchor {
  anchorText: string;
  anchorType: RealityAnchorType;
  whyItMatters: string;
}

const ANCHOR_LIB: Record<RealityAnchorType, RealityAnchor[]> = {
  ACTION: [
    { anchorText: "今天现实中只完成一个最小任务。", anchorType: "ACTION", whyItMatters: "限制范围能让一天真的产出。" },
    { anchorText: "把一个想法变成一行可见动作。",     anchorType: "ACTION", whyItMatters: "想法落地才会有反馈可回验。" },
  ],
  REST: [
    { anchorText: "先睡觉，不要继续高负载生成。",     anchorType: "REST",   whyItMatters: "睡眠保护判断力。" },
    { anchorText: "20 分钟不看屏幕。",                anchorType: "REST",   whyItMatters: "神经恢复保护后续效率。" },
  ],
  FEEDBACK: [
    { anchorText: "记录一次现实反馈（命中/未命中）。", anchorType: "FEEDBACK", whyItMatters: "反馈是系统进化的唯一燃料。" },
    { anchorText: "给一个真实用户看一次 Demo。",       anchorType: "FEEDBACK", whyItMatters: "外部信号比内部想法更可信。" },
  ],
  SOCIAL: [
    { anchorText: "给一个真实联系人发一条消息。", anchorType: "SOCIAL", whyItMatters: "把关系任务落到现实通道。" },
    { anchorText: "不要把虚拟 NPC 当成现实具体人。", anchorType: "SOCIAL", whyItMatters: "保持虚拟与现实的边界。" },
  ],
  CREATION: [
    { anchorText: "把一个灵感写进百科条目，不要立刻开发。", anchorType: "CREATION", whyItMatters: "先归档，再决定是否上线。" },
    { anchorText: "今天只产一个最小创作（300 字以内）。",    anchorType: "CREATION", whyItMatters: "持续小产出胜过偶发爆发。" },
  ],
  SAFETY: [
    { anchorText: "不要把虚拟生活当成现实命运的预言。",       anchorType: "SAFETY", whyItMatters: "保留行动自由度。" },
    { anchorText: "如果情绪过高/过低，先停一停再继续。",      anchorType: "SAFETY", whyItMatters: "情绪噪声会污染所有判断。" },
  ],
};

export function pickRealityAnchor(seed: string, preferredType?: RealityAnchorType): RealityAnchor {
  const types: RealityAnchorType[] = preferredType
    ? [preferredType]
    : ["ACTION", "REST", "FEEDBACK", "SOCIAL", "CREATION", "SAFETY"];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  const type = types[Math.abs(h) % types.length];
  const pool = ANCHOR_LIB[type];
  return pool[Math.abs(h >> 3) % pool.length];
}

export function listAnchorsByType(type: RealityAnchorType): RealityAnchor[] {
  return ANCHOR_LIB[type];
}
