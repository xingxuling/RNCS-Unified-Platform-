// 产品文档：章节注册表
export interface DocSectionDef {
  id: string;
  cn: string;
  en: string;
}

export const DOC_SECTIONS: DocSectionDef[] = [
  { id: "overview",    cn: "产品总览",   en: "Product Overview" },
  { id: "whitepaper",  cn: "理论白皮书", en: "Theory Whitepaper" },
  { id: "manual",      cn: "使用手册",   en: "User Manual" },
  { id: "manualCalc",  cn: "使用手册计算法", en: "Manual Calculus" },
  { id: "isolation",   cn: "Demo / Real 隔离规范", en: "Demo / Real Isolation" },
  { id: "feedbackEntry", cn: "回验入口规范", en: "Feedback Entry Protocol" },
  { id: "softwareQA",  cn: "软件测试反馈计算法", en: "Software QA Feedback Calculus" },
  { id: "accuracy",    cn: "预测有效率定义与回验统计", en: "Accuracy Definition & Stats" },
  { id: "recalculation", cn: "总重新计算算法", en: "Global Recalculation Engine" },
  { id: "uiFit",       cn: "多用户端 UI 适评算法", en: "Multi-Client UI Fit Evaluation" },
  { id: "dimensionEvent", cn: "预测维度与事件算法", en: "Prediction Dimension & Event Algorithm" },
  { id: "languageFit", cn: "产品与用户语言计算法", en: "Product–User Language Translation" },
  { id: "abstractPromptForge", cn: "抽象迁移化提示词计算法", en: "Abstract Transfer Prompt Calculus" },
  { id: "eventLibraryAudit", cn: "事件库查重补全计算法", en: "Event Library Deduplication & Completion" },
  { id: "calculus",    cn: "计算法文档", en: "Calculus Documentation" },
  { id: "constants",   cn: "常数系统",   en: "Constants System" },
  { id: "determinant", cn: "定数计算法", en: "Determinant Number" },
  { id: "feedback",    cn: "回验规范",   en: "Feedback Protocol" },
  { id: "value",       cn: "历史 · 商业价值", en: "Historical & Financial Value" },
  { id: "roadmap",     cn: "版本路线图", en: "Roadmap" },
  { id: "safety",      cn: "安全边界",   en: "Safety & Boundary" },
  { id: "glossary",    cn: "术语表",     en: "Glossary" },
  { id: "backlinks",   cn: "回链 · 章节 ↔ 模块", en: "Backlinks · Sections ↔ Modules" },
  { id: "maintenance", cn: "维护节奏",   en: "Maintenance Cadence" },
];
