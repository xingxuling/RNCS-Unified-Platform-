export type FreeInputTypeId =
  | "SHORT_QUESTION" | "LONG_CONTEXT" | "RAW_IDEA" | "NUMBER_SEQUENCE"
  | "MIXED_TASK" | "EMOTIONAL_STATE" | "PRODUCT_FEEDBACK" | "BUG_REPORT"
  | "CREATIVE_REQUEST" | "TECH_REQUEST" | "TRANSLATION_REQUEST"
  | "MUSIC_REQUEST" | "MODEL_REQUEST" | "UNKNOWN";

export const FREE_INPUT_TYPES: { id: FreeInputTypeId; label: string; hint: string }[] = [
  { id: "SHORT_QUESTION",      label: "短问题",       hint: "10–40 字的直接提问。" },
  { id: "LONG_CONTEXT",        label: "长背景",       hint: "项目/产品/情境完整描述。" },
  { id: "RAW_IDEA",            label: "原始想法",     hint: "灵感片段，结构未成形。" },
  { id: "NUMBER_SEQUENCE",     label: "数列输入",     hint: "包含 5 位/60 位数列。" },
  { id: "MIXED_TASK",          label: "混合任务",     hint: "包含多个并列动词。" },
  { id: "EMOTIONAL_STATE",     label: "状态输入",     hint: "情绪/状态描述。" },
  { id: "PRODUCT_FEEDBACK",    label: "产品反馈",     hint: "用户体验/反馈描述。" },
  { id: "BUG_REPORT",          label: "Bug 反馈",     hint: "缺陷/异常描述。" },
  { id: "CREATIVE_REQUEST",    label: "创作请求",     hint: "剧情/角色/文案创作。" },
  { id: "TECH_REQUEST",        label: "技术请求",     hint: "代码/打包/集成。" },
  { id: "TRANSLATION_REQUEST", label: "翻译请求",     hint: "多语言转换。" },
  { id: "MUSIC_REQUEST",       label: "音乐请求",     hint: "声乐/AI 音乐提示词。" },
  { id: "MODEL_REQUEST",       label: "模型请求",     hint: "Schema/结构生成。" },
  { id: "UNKNOWN",             label: "未识别",       hint: "未匹配到明确类型。" },
];
