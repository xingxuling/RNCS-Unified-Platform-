// 百科分类体系 · 15 categories
export interface EncyclopediaCategory {
  id: string;
  title: string;
  en: string;
  description: string;
  beginnerVisible: boolean;
  founderOnly?: boolean;
}

export const ENCYCLOPEDIA_CATEGORIES: EncyclopediaCategory[] = [
  { id: "getting_started", title: "快速开始", en: "Getting Started", description: "新手第一次接触本产品的最短路径。", beginnerVisible: true },
  { id: "core_concepts", title: "核心概念", en: "Core Concepts", description: "定数、回验、行动许可、信号噪声等基础术语。", beginnerVisible: true },
  { id: "subject_models", title: "主体模型", en: "Subject Models", description: "Demo / Light 20 / Full 60 / Imported / 三循环。", beginnerVisible: true },
  { id: "prediction_system", title: "预测系统", en: "Prediction System", description: "预测维度、事件、时间窗口、触发日历。", beginnerVisible: true },
  { id: "calculus_engines", title: "计算法引擎", en: "Calculus Engines", description: "本产品的所有计算法。", beginnerVisible: false },
  { id: "constant_universe", title: "常数宇宙", en: "Constant Universe", description: "数字、五域、算子、长生、平台常数。", beginnerVisible: false },
  { id: "feedback_accuracy", title: "回验与准确率", en: "Feedback & Accuracy", description: "回验、权重、命中率、样本限制。", beginnerVisible: true },
  { id: "prompt_forge", title: "提示词系统", en: "Prompt Forge", description: "Prompt Forge / Abstract Forge / 模板族。", beginnerVisible: false },
  { id: "ux_language", title: "用户体验与语言", en: "UX & Language", description: "用户语言、地区 UX、多端 UI、新手模式。", beginnerVisible: true },
  { id: "product_ops", title: "产品运行系统", en: "Product Operations", description: "QA、重算、版本迭代、内测发布。", beginnerVisible: false },
  { id: "founder_mode", title: "创始人模式", en: "Founder Mode", description: "控制台、权限、密码、本地保护。", beginnerVisible: false, founderOnly: false },
  { id: "event_universe", title: "事件宇宙", en: "Event Universe", description: "15维度、事件库、阶段、表现形式。", beginnerVisible: false },
  { id: "safety_boundary", title: "安全边界", en: "Safety & Boundaries", description: "非医疗/法律/金融/心理诊断建议。", beginnerVisible: true },
  { id: "marketing", title: "传播与增长", en: "Marketing & Distribution", description: "小红书热度、产品知名度、平台权重。", beginnerVisible: false },
  { id: "advanced_research", title: "高阶与研究", en: "Advanced / Research", description: "计算法宇宙、zb认知单位、大脑恢复/可塑性。", beginnerVisible: false },
];

export function getCategory(id: string) {
  return ENCYCLOPEDIA_CATEGORIES.find(c => c.id === id);
}
