// 进化信号 Evolution Signals
export interface EvolutionSignalDef {
  id: string;
  name: string;
  weight: number;
  category: "USAGE" | "FEEDBACK" | "PROMPT" | "WORLD" | "MODE" | "SYSTEM";
}

export const EVOLUTION_SIGNAL_TYPES: EvolutionSignalDef[] = [
  { id: "FEATURE_USED",            name: "使用功能",        weight: 1.0, category: "USAGE" },
  { id: "FEATURE_SKIPPED",         name: "跳过功能",        weight: -0.5, category: "USAGE" },
  { id: "PAGE_DWELL",              name: "页面停留",        weight: 0.8, category: "USAGE" },
  { id: "QUICK_EXIT",              name: "快速退出",        weight: -0.6, category: "USAGE" },
  { id: "FEEDBACK_SUBMITTED",      name: "提交回验",        weight: 1.5, category: "FEEDBACK" },
  { id: "FEEDBACK_SKIPPED",        name: "跳过回验",        weight: -0.8, category: "FEEDBACK" },
  { id: "PROMPT_COPIED",           name: "复制提示词",      weight: 1.0, category: "PROMPT" },
  { id: "PROMPT_MARKED_EFFECTIVE", name: "提示词有效",      weight: 1.5, category: "PROMPT" },
  { id: "EVENT_VALIDATED",         name: "事件被回验命中",  weight: 1.8, category: "FEEDBACK" },
  { id: "EVENT_WRONG",             name: "事件回验错误",    weight: -1.0, category: "FEEDBACK" },
  { id: "LANGUAGE_MODE_CHANGED",   name: "切换语言层",      weight: 0.6, category: "MODE" },
  { id: "BEGINNER_MODE_EXITED",    name: "退出新手模式",    weight: 1.2, category: "MODE" },
  { id: "FOUNDER_MODE_USED",       name: "使用创始人模式",  weight: 1.5, category: "MODE" },
  { id: "WORLD_GENERATED",         name: "生成个人世界",    weight: 1.2, category: "WORLD" },
  { id: "WORLD_EXPORTED",          name: "导出世界报告",    weight: 1.0, category: "WORLD" },
  { id: "COPY_GENERATED",          name: "生成文案",        weight: 1.0, category: "PROMPT" },
  { id: "CODE_PROMPT_GENERATED",   name: "生成代码提示词",  weight: 1.2, category: "PROMPT" },
  { id: "QA_RUN",                  name: "运行 QA",         weight: 0.9, category: "SYSTEM" },
  { id: "RECALCULATION_RUN",       name: "运行重算",        weight: 0.9, category: "SYSTEM" },
  { id: "MODULE_FAVORITED",        name: "收藏模块",        weight: 1.4, category: "USAGE" },
];

export interface EvolutionSignal {
  id: string;
  type: string;
  timestamp: string;
  subjectId?: string;
  moduleId?: string;
  pageId?: string;
  eventTypeId?: string;
  weight: number;
  metadata?: Record<string, unknown>;
}

export function getSignalDef(type: string): EvolutionSignalDef | undefined {
  return EVOLUTION_SIGNAL_TYPES.find(s => s.id === type);
}
