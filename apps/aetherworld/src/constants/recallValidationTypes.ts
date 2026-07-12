export interface RecallValidationItem {
  id: string;
  label: string;
  question: string;
}

export const RECALL_VALIDATION_ITEMS: RecallValidationItem[] = [
  { id: "RECURRENCE", label: "重复性", question: "这一材料是否在数周/数月间多次浮现？" },
  { id: "SYMBOL_CONSISTENCY", label: "符号一致性", question: "核心符号是否稳定，未被替换？" },
  { id: "CULTURAL_DISTANCE", label: "文化距离", question: "它是否远离你日常接触的内容？" },
  { id: "BODY_RESONANCE", label: "身体共振", question: "回想时是否有可重复的身体反应？" },
  { id: "NON_FANTASY", label: "去幻想化", question: "排除「希望自己是」的成分后还剩多少？" },
  { id: "NO_MEDIA_SOURCE", label: "无外源", question: "近 6 个月是否接触过相似作品？" },
  { id: "NO_DECISION_DEPENDENCY", label: "无重大决策依赖", question: "你是否未把它作为重大决定的唯一依据？" },
  { id: "CREATIVE_VALUE", label: "创作价值", question: "它是否真的能转为创作素材？" },
];
