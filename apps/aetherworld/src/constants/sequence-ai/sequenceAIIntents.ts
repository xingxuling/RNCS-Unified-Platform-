export type SequenceAIIntentId =
  | "ASK_DECISION"
  | "ANALYZE_OBJECT"
  | "SOLVE_PROBLEM"
  | "GENERATE_VIRTUAL_LIFE"
  | "GENERATE_WORLD"
  | "GENERATE_MODEL"
  | "GENERATE_NARRATIVE"
  | "GENERATE_VOCAL"
  | "TRANSLATE_LOCALIZE"
  | "GENERATE_PROMPT"
  | "GENERATE_CODE_PLAN"
  | "RUN_QA"
  | "RECALCULATE"
  | "EXPORT_ENGINE_DATA"
  | "EXPLAIN_TERM"
  | "FOUNDER_SYSTEM_TASK"
  | "UNKNOWN";

export interface SequenceAIIntentDef {
  id: SequenceAIIntentId;
  label: string;
  description: string;
  keywords: string[];
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  requiresFounderMode?: boolean;
  requiresSubjectProfile?: boolean;
  targetEngine?: string;
}

export const SEQUENCE_AI_INTENTS: SequenceAIIntentDef[] = [
  { id: "ASK_DECISION", label: "问决策", description: "判断该不该做、推进与否。", keywords: ["该不该", "要不要", "推进", "决定", "选择", "should", "decide"], riskLevel: "MEDIUM", requiresSubjectProfile: true, targetEngine: "universalBreakthrough" },
  { id: "ANALYZE_OBJECT", label: "分析对象", description: "看清一个事物的本体结构。", keywords: ["分析", "看清", "本体", "结构", "拆解", "analyze"], riskLevel: "LOW", targetEngine: "thingItselfCalculus" },
  { id: "SOLVE_PROBLEM", label: "破解问题", description: "找到卡点和突破口。", keywords: ["卡", "解决", "问题", "破解", "瓶颈", "stuck", "solve"], riskLevel: "MEDIUM", targetEngine: "universalBreakthrough" },
  { id: "GENERATE_VIRTUAL_LIFE", label: "虚拟生活", description: "生成虚拟生活/日记。", keywords: ["虚拟生活", "日记", "今天", "virtual life"], riskLevel: "LOW", targetEngine: "virtualLife" },
  { id: "GENERATE_WORLD", label: "生成世界", description: "生成区域/NPC/任务。", keywords: ["世界", "区域", "npc", "任务", "world", "quest"], riskLevel: "LOW", targetEngine: "sequenceWorldEngine" },
  { id: "GENERATE_MODEL", label: "生成模型", description: "生成结构模型/Schema。", keywords: ["模型", "schema", "结构", "字段", "model"], riskLevel: "LOW", targetEngine: "modelGeneration" },
  { id: "GENERATE_NARRATIVE", label: "生成剧情", description: "小说/漫画/任务文本。", keywords: ["剧情", "小说", "漫画", "脚本", "story", "novel", "comic"], riskLevel: "LOW", targetEngine: "narrativeTextEngine" },
  { id: "GENERATE_VOCAL", label: "生成声乐", description: "声线/AI 音乐提示词。", keywords: ["歌", "唱", "声线", "音乐", "suno", "udio", "vocal"], riskLevel: "MEDIUM", targetEngine: "vocalEngine" },
  { id: "TRANSLATE_LOCALIZE", label: "翻译本地化", description: "多语言翻译与本地化。", keywords: ["翻译", "英文", "日文", "韩文", "繁体", "translate"], riskLevel: "LOW", targetEngine: "translationEngine" },
  { id: "GENERATE_PROMPT", label: "生成提示词", description: "Lovable/Codex/Suno 提示词。", keywords: ["提示词", "prompt", "lovable", "codex"], riskLevel: "LOW", targetEngine: "promptForge" },
  { id: "GENERATE_CODE_PLAN", label: "代码计划", description: "生成实现计划/代码骨架。", keywords: ["代码", "实现", "code", "implement"], riskLevel: "MEDIUM", targetEngine: "codeGeneration" },
  { id: "RUN_QA", label: "运行 QA", description: "检查 Bug/系统审计。", keywords: ["检查", "bug", "qa", "审计", "缺什么"], riskLevel: "LOW", targetEngine: "softwareQA" },
  { id: "RECALCULATE", label: "重新计算", description: "重算并标记 stale。", keywords: ["重算", "重新计算", "recalc", "stale"], riskLevel: "LOW", targetEngine: "recalculation" },
  { id: "EXPORT_ENGINE_DATA", label: "导出数据", description: "导出 JSON/Unity/Godot。", keywords: ["导出", "json", "unity", "godot", "export"], riskLevel: "LOW", targetEngine: "engineExport" },
  { id: "EXPLAIN_TERM", label: "解释术语", description: "百科条目/概念解释。", keywords: ["是什么", "解释", "定义", "explain", "what is"], riskLevel: "LOW", targetEngine: "productEncyclopedia" },
  { id: "FOUNDER_SYSTEM_TASK", label: "创始人任务", description: "权限/引擎注册/标准。", keywords: ["founder", "创始人", "引擎注册", "标准"], riskLevel: "HIGH", requiresFounderMode: true, targetEngine: "founderConsole" },
  { id: "UNKNOWN", label: "未知意图", description: "无法识别，使用示例库引导。", keywords: [], riskLevel: "LOW", targetEngine: "usageExamples" },
];

export const SEQUENCE_AI_EXAMPLES: string[] = [
  "我现在该不该推进这个项目？",
  "帮我生成今天的虚拟生活。",
  "解释 55555。",
  "运行 BLOCK 49..60。",
  "给蓝天机写一段漫画脚本。",
  "把这段歌词生成 Suno 提示词。",
  "用我的数列生成一个 NPC 模型。",
  "导出 Godot JSON。",
  "把这个产品想法生成商业模型。",
  "检查整个系统缺什么。",
  "把万物本身计算法翻译成英文普通用户版本。",
  "生成一个使用示例给新手用户。",
];
