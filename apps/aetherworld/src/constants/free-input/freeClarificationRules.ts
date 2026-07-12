export interface FreeClarificationRule {
  id: string;
  description: string;
  condition: (text: string) => boolean;
  question: string;
  fallbackAction: string;
}

export const FREE_CLARIFICATION_RULES: FreeClarificationRule[] = [
  {
    id: "TARGET_LANGUAGE_MISSING",
    description: "翻译请求但未指定目标语言。",
    condition: (t) => /(翻译|translate)/i.test(t) && !/(英文|日文|韩文|法文|繁体|english|japanese|korean|french)/i.test(t),
    question: "你希望翻译成哪种语言？",
    fallbackAction: "默认翻译成英文，并在结果中说明假设。",
  },
  {
    id: "MODEL_TARGET_PLATFORM",
    description: "导出请求但未指定平台。",
    condition: (t) => /(导出|export)/i.test(t) && !/(unity|godot|json|markdown|typescript)/i.test(t),
    question: "你希望导出到哪个平台？（JSON / Unity / Godot / Markdown）",
    fallbackAction: "默认导出 JSON，并附 Markdown 摘要。",
  },
  {
    id: "EMPTY_TOPIC",
    description: "输入过短无主题。",
    condition: (t) => t.trim().length < 4,
    question: "可以再多写一点吗？比如你想分析什么、生成什么、解决什么。",
    fallbackAction: "默认推荐 5 个使用示例。",
  },
];

export const FREE_NO_CLARIFY_HINTS = ["别问多余的", "别问了", "直接", "快", "minimal"];
