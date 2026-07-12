export interface AppIdeaInput {
  inputId: string;
  rawIdea: string;
  appNameSuggestion?: string;
  targetUsers?: string[];
  problemStatement?: string;
  desiredFeatures?: string[];
  designPreference?: string;
  technicalPreference?: string;
  constraints?: string[];
  inferred: boolean;
  createdAt: string;
}

function suggestName(raw: string): string {
  const clean = raw.trim().replace(/[。.!?！？]/g, "").slice(0, 24);
  return clean || "Aether App";
}

export function normalizeAppIdea(rawIdea: string): AppIdeaInput {
  const raw = (rawIdea || "").trim();
  const inferred = raw.length < 40;

  const features: string[] = [];
  if (/番茄|计时|pomodoro/i.test(raw)) features.push("计时器", "开始 / 暂停 / 重置", "完成提示");
  if (/任务|看板|todo/i.test(raw)) features.push("任务列表", "添加任务", "完成标记");
  if (/landing|官网|介绍|展示/i.test(raw)) features.push("Hero 区", "特性区", "CTA");
  if (/dashboard|后台|管理/i.test(raw)) features.push("数据卡片", "列表视图", "筛选");
  if (/chat|聊天|对话/i.test(raw)) features.push("对话窗口", "输入框", "历史记录");
  if (/歌词|suno|音乐/i.test(raw)) features.push("提示词输入", "结构选择", "复制结果");
  if (/世界|角色|剧情/i.test(raw)) features.push("条目列表", "详情编辑", "标签分类");
  if (features.length === 0) features.push("核心功能输入", "结果展示", "保存 / 复制");

  return {
    inputId: `idea-${Date.now()}`,
    rawIdea: raw,
    appNameSuggestion: suggestName(raw),
    targetUsers: ["独立创作者", "效率工具用户"],
    problemStatement: raw || "把一个想法变成可预览的轻量应用。",
    desiredFeatures: features,
    designPreference: "克制、清晰、专业，允许有未来感但不影响阅读。",
    technicalPreference: "优先单页应用，先不接后端。",
    constraints: ["不接入真实付款", "不收集敏感信息", "不声称生产部署"],
    inferred,
    createdAt: new Date().toISOString(),
  };
}
