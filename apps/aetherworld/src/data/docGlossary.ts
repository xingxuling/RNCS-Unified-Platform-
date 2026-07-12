// 产品文档 · 术语表（Glossary）
// 抽象迁移：产品模块 → 文档术语条目；每个术语包含 中文 / 英文 / 一句话定义 / 出处章节 / 用户语言层级 / 安全注记
export type GlossaryAudience = "PROFESSIONAL" | "USER_FRIENDLY" | "BOTH";

export interface GlossaryTerm {
  cn: string;
  en: string;
  short: string;             // 一句话定义（专业层）
  userFriendly?: string;     // 普通用户改写（必要时）
  section: string;           // 出处章节 id（用于回链跳转）
  audience: GlossaryAudience;
  safety?: string;           // 安全 / 边界注记
}

export const DOC_GLOSSARY: GlossaryTerm[] = [
  {
    cn: "主体数列", en: "Subject Sequence",
    short: "用户的核心结构输入（Light 20 / Full 60），是所有计算法的源头。",
    userFriendly: "你的个人模型基础。",
    section: "manual", audience: "BOTH",
    safety: "Demo 与真实主体必须严格隔离。",
  },
  {
    cn: "定数计算法", en: "Determinant Number Method",
    short: "把多个计算法输出压缩为最终定数判断的收束算法。",
    userFriendly: "判断这件事定没定。",
    section: "determinant", audience: "BOTH",
    safety: "定数值低时禁止重大决策。",
  },
  {
    cn: "分支塌缩", en: "Branch Collapse",
    short: "未来分支从 OPEN → SEMI → COLLAPSED → MANIFESTED 的状态演化。",
    userFriendly: "可能性正在变成现实。",
    section: "calculus", audience: "PROFESSIONAL",
    safety: "高阶术语；普通用户主流程不直接展示。",
  },
  {
    cn: "信号净化", en: "Signal Purification",
    short: "在原始信号中分离真信号与噪声，输出可信度评分。",
    userFriendly: "判断哪些感觉是真的。",
    section: "calculus", audience: "BOTH",
  },
  {
    cn: "折域", en: "Domain Folding",
    short: "天地人神风五域同向共振时的事件强化指数。",
    userFriendly: "很多事情最后都指向同一种变化。",
    section: "whitepaper", audience: "PROFESSIONAL",
  },
  {
    cn: "反冲", en: "Pressure Rebound",
    short: "结构压力释放期，常出现在长触发窗口之后。",
    section: "calculus", audience: "PROFESSIONAL",
  },
  {
    cn: "共振锁定", en: "Resonance Lock",
    short: "多算法输出方向一致时的事件锁定状态。",
    section: "calculus", audience: "PROFESSIONAL",
  },
  {
    cn: "回验", en: "Feedback Validation",
    short: "记录预测的真实发生情况，用于修正未来权重。",
    userFriendly: "记录后来发生了什么。",
    section: "feedbackEntry", audience: "BOTH",
    safety: "每一处预测出现的页面都必须有回验入口。",
  },
  {
    cn: "真实主体", en: "Real Subject",
    short: "用户输入的真实个人模型（Light 20 / Full 60 / Imported）。",
    userFriendly: "你的个人模型。",
    section: "isolation", audience: "BOTH",
    safety: "默认本地存储；不与 Demo 混合。",
  },
  {
    cn: "Full 60", en: "Full 60 Sequence",
    short: "60 组数列、三循环的深度主体建模。",
    userFriendly: "深度个人模型。",
    section: "isolation", audience: "BOTH",
    safety: "高敏感模式，始终显示隐私状态。",
  },
  {
    cn: "多计算法内核", en: "Multi-Calculus Kernel",
    short: "并行运行多种算法并聚合输出的内核架构。",
    userFriendly: "系统会从多个角度一起判断。",
    section: "calculus", audience: "BOTH",
  },
  {
    cn: "事件算法", en: "Event Algorithm",
    short: "把结构信号映射为具体事件类型与触发阶段。",
    userFriendly: "系统判断可能发生什么事。",
    section: "dimensionEvent", audience: "BOTH",
  },
  {
    cn: "提示词计算法", en: "Prompt Calculus",
    short: "根据当前结构与用户语言生成给上层 AI 的指令。",
    userFriendly: "帮你生成下一步给 AI 的指令。",
    section: "abstractPromptForge", audience: "BOTH",
  },
  {
    cn: "行动许可", en: "Action Permission",
    short: "进/守/转/断/等待/补材料/沟通/发布/清理/恢复 的当下可行性判断。",
    userFriendly: "现在能不能做。",
    section: "manual", audience: "BOTH",
  },
  {
    cn: "Demo / Real 隔离", en: "Demo / Real Isolation",
    short: "Demo Persona 与真实主体在数据、回验、文案三层全隔离。",
    section: "isolation", audience: "BOTH",
    safety: "Demo 页面不出现「你的命运」类断言文案。",
  },
  {
    cn: "安全边界", en: "Safety Boundary",
    short: "系统使用范围与禁用场景的边界文案与拦截规则。",
    section: "safety", audience: "BOTH",
    safety: "不构成医疗 / 法律 / 金融 / 心理诊断。",
  },
  {
    cn: "回验入口", en: "Feedback Entry",
    short: "每一处预测出现的页面都强制具备的回验触点。",
    section: "feedbackEntry", audience: "BOTH",
  },
  {
    cn: "抽象迁移化提示词", en: "Abstract Transfer Prompt",
    short: "跨领域复用的提示词模板族 + 变量注入机制。",
    section: "abstractPromptForge", audience: "PROFESSIONAL",
  },
  {
    cn: "事件库查重补全", en: "Event Library Dedup & Completion",
    short: "对已有事件库进行去重、归并、字段补全的非破坏性升级算法。",
    section: "eventLibraryAudit", audience: "PROFESSIONAL",
  },
  {
    cn: "入门简化", en: "Onboarding Simplification",
    short: "新用户 1 分钟内完成首次体验的最小路径计算。",
    section: "manual", audience: "BOTH",
  },
];
