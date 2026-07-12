export interface EnginePairDef {
  id: string;
  sourceEngine: string;
  targetEngine: string;
  bridgeType: string;
  description: string;
}

export const CROSS_FUNCTIONAL_ENGINE_PAIRS: EnginePairDef[] = [
  { id: "narr-to-vocal", sourceEngine: "narrative", targetEngine: "vocal", bridgeType: "STORY_TO_SONG", description: "剧情文本 → 角色歌 / 主题曲" },
  { id: "vocal-to-translation", sourceEngine: "vocal", targetEngine: "translation", bridgeType: "LYRIC_MULTILINGUAL", description: "歌词 / 声乐 Prompt → 多语言版本" },
  { id: "vocal-to-prompt", sourceEngine: "vocal", targetEngine: "promptForge", bridgeType: "VOCAL_TO_PROMPT", description: "歌曲设定 → Suno / Udio / MV Prompt" },
  { id: "world-to-narr", sourceEngine: "world", targetEngine: "narrative", bridgeType: "WORLD_TO_STORY", description: "世界观 → 剧情片段 / 任务" },
  { id: "world-to-vocal", sourceEngine: "world", targetEngine: "vocal", bridgeType: "WORLD_TO_THEME_SONG", description: "世界观 → 世界主题曲" },
  { id: "world-to-model", sourceEngine: "world", targetEngine: "model", bridgeType: "WORLD_TO_MODEL", description: "世界观 → 角色 / 场景模型 Prompt" },
  { id: "model-to-code", sourceEngine: "model", targetEngine: "code", bridgeType: "MODEL_TO_CODE", description: "模型描述 → 前端 / 后端代码结构" },
  { id: "product-to-docs", sourceEngine: "productEncyclopedia", targetEngine: "learningDocs", bridgeType: "PRODUCT_TO_DOCS", description: "产品百科 → 教程文档" },
  { id: "vocab-to-docs", sourceEngine: "vocabulary", targetEngine: "learningDocs", bridgeType: "VOCAB_TO_DOCS", description: "词汇 → 新手解释" },
  { id: "ai-to-cross", sourceEngine: "sequenceAI", targetEngine: "crossFunctional", bridgeType: "INTENT_ROUTING", description: "自由输入 → 自动判断跨域路径" },
  { id: "terminal-to-cross", sourceEngine: "sequenceTerminal", targetEngine: "crossFunctional", bridgeType: "COMMAND_WORKFLOW", description: "终端命令 → 跨功能运行" },
  { id: "reality-to-decision", sourceEngine: "realityData", targetEngine: "decision", bridgeType: "DATA_TO_DECISION", description: "外部数据 → 决策分析" },
  { id: "calculus-to-usage", sourceEngine: "calculusUniverse", targetEngine: "usageExamples", bridgeType: "CALCULUS_TO_EXAMPLES", description: "计算法条目 → 使用示例" },
  { id: "workspace-to-any", sourceEngine: "workspace", targetEngine: "*", bridgeType: "REUSE", description: "已保存对象 → 任意功能复用" },
];

export const ENGINE_LABELS: Record<string, string> = {
  narrative: "剧情文本引擎",
  vocal: "声乐引擎",
  translation: "翻译引擎",
  promptForge: "Prompt Forge",
  world: "世界引擎",
  model: "模型生成引擎",
  code: "代码生成",
  productEncyclopedia: "产品百科",
  learningDocs: "教程文档",
  vocabulary: "词汇百科",
  sequenceAI: "Sequence AI",
  sequenceTerminal: "Sequence Terminal",
  crossFunctional: "Cross-Functional Calculus",
  realityData: "现实数据校准",
  decision: "决策分析",
  calculusUniverse: "计算法宇宙",
  usageExamples: "使用示例",
  workspace: "Workspace",
};
