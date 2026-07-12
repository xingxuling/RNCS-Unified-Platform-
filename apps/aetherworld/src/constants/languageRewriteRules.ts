// 文案重写规则 · Language Rewrite Rules
export interface LanguageRewriteRule {
  id: string;
  cn: string;
  rule: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export const LANGUAGE_REWRITE_RULES: LanguageRewriteRule[] = [
  { id: "first-time-explain",     cn: "高阶术语首次出现必须解释",                    rule: "On first occurrence, attach tooltip or inline explanation.", severity: "HIGH" },
  { id: "user-main-max-2-jargon", cn: "普通用户主流程不展示超过 2 个高阶术语",       rule: "User-main flow: max 2 HIGH/EXTREME jargon per page.",      severity: "HIGH" },
  { id: "mobile-card-max-1",      cn: "移动端每张卡片最多 1 个高阶术语",             rule: "Mobile cards: max 1 HIGH/EXTREME jargon.",                 severity: "MEDIUM" },
  { id: "enterprise-no-fate",     cn: "企业端不得出现命运化术语",                    rule: "Enterprise: replace 命运/算命/奇点/主体命运.",             severity: "CRITICAL" },
  { id: "demo-no-your-fate",      cn: "Demo 模式不得使用「你的命运」",               rule: "Demo: must not imply real personal fate.",                 severity: "CRITICAL" },
  { id: "full60-privacy-lang",    cn: "Full 60 必须使用隐私友好语言",                rule: "Full 60: privacy-first wording.",                          severity: "HIGH" },
  { id: "feedback-record-result", cn: "回验必须翻译为「记录结果」或「反馈校准」",    rule: "Feedback ⇒ 记录结果 / 反馈校准.",                          severity: "MEDIUM" },
  { id: "determination-plain",    cn: "定数必须翻译为「定没定」或「当前状态」",      rule: "定数 ⇒ 定没定 / 当前状态.",                                severity: "HIGH" },
  { id: "collapse-plain",         cn: "分支塌缩必须翻译为「可能性正在变成现实」",    rule: "分支塌缩 ⇒ 可能性正在变成现实.",                            severity: "HIGH" },
  { id: "singularity-hidden",     cn: "风域奇点默认隐藏，只在高阶解释中显示",        rule: "风域奇点 hidden by default.",                              severity: "CRITICAL" },
];

// 默认普通主流程降级映射
export const DEFAULT_PLAIN_REWRITE_MAP: Record<string, string> = {
  "定数计算法": "当前状态判断",
  "分支塌缩": "可能性正在变成现实",
  "信号净化": "哪些信号是真的",
  "回验": "记录结果",
  "行动许可": "建议动作",
  "真实主体": "我的个人模型",
  "Full 60": "深度个人模型",
  "多计算法内核": "多角度综合判断",
  "预测维度": "事情类型",
  "事件算法": "可能发生的事",
  "风域奇点": "变化核心",
  "地区用户计算法": "地区体验适配",
  "软件测试反馈计算法": "产品自检",
  "总重新计算算法": "重新计算全部结果",
  "多用户端 UI 适评算法": "不同用户界面适配",
};

// 高风险企业禁用词
export const ENTERPRISE_FORBIDDEN_TERMS = [
  "命运", "算命", "宿命", "奇点", "主体命运", "你的命运", "天定", "神断",
];
