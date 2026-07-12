export const SEQUENCE_AI_RESPONSE_FORMAT_VERSION = "1.0";

export const SEQUENCE_AI_DEFAULT_TITLE = "数列人工智能 · 结构化建议";

export const SEQUENCE_AI_PLAIN_TEMPLATES: Record<string, string> = {
  ASK_DECISION:
    "基于你的当前主体画像与数列状态，我从多个维度分析了「{topic}」。结论倾向：{verdict}。理由：{reason}。",
  ANALYZE_OBJECT:
    "「{topic}」可以拆为本体、结构、状态与外部关系四个层级。当前最关键的结构特征是：{reason}。",
  SOLVE_PROBLEM:
    "目前的卡点更像是「{verdict}」类型的瓶颈。建议从最低阻力的破解路径开始：{reason}。",
  GENERATE_VIRTUAL_LIFE:
    "已为你生成今日虚拟生活草稿（仅本地）。建议关注：{reason}。",
  GENERATE_WORLD:
    "已规划「{topic}」的世界片段：区域 / NPC / 关键事件。重点：{reason}。",
  GENERATE_MODEL:
    "已为「{topic}」生成结构模型草案。核心字段方向：{reason}。",
  GENERATE_NARRATIVE:
    "已为「{topic}」生成剧情草案：种子 / 节拍 / 场景。核心冲突：{reason}。",
  GENERATE_VOCAL:
    "已为「{topic}」生成声乐与 AI 音乐提示词方向。重点：{reason}。",
  TRANSLATE_LOCALIZE:
    "已为「{topic}」生成多语言版本。术语一致性已纳入检查。",
  GENERATE_PROMPT:
    "已为「{topic}」生成可复制提示词草案。",
  GENERATE_CODE_PLAN:
    "已为「{topic}」生成实现计划草案。",
  RUN_QA:
    "系统检查完成。重点关注：{reason}。",
  RECALCULATE:
    "已标记相关结果为 stale，请按建议顺序重算。",
  EXPORT_ENGINE_DATA:
    "已准备「{topic}」的可导出数据包。",
  EXPLAIN_TERM:
    "「{topic}」的简要解释：{reason}。",
  FOUNDER_SYSTEM_TASK:
    "创始人级任务草案已生成（受权限保护）。",
  UNKNOWN:
    "我还不完全确定你的目标，我从示例库挑了几个最接近的方向供你选择。",
};
