import { FAQ_CATEGORIES } from "@/constants/learning/faqCategories";

export interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FAQItem[] = [
  { id: "faq_what_is_aether", category: "GETTING_STARTED", question: "Aetherworld 是什么？", answer: "Aetherworld 是一个数列驱动的元智能操作系统，把问题、想法、数列、世界、剧情、声乐、模型和导出任务转化为可执行结构。" },
  { id: "faq_demo_vs_full60", category: "SUBJECT_MODE", question: "Demo 和 Full60 有什么区别？", answer: "Demo 是演示模式，不基于真实主体数列。Full60 是完整真实主体模式，用于深度个人化生成，默认仅本地保存。" },
  { id: "faq_predict_fate", category: "SAFETY", question: "Aetherworld 是预测命运的吗？", answer: "不是。它可以做结构推演、模拟和回验，但不会保证现实一定发生，也不替代专业判断。" },
  { id: "faq_currency_cashout", category: "SAFETY", question: "数列货币可以提现吗？", answer: "不能。数列货币是内部积分、贡献和虚拟资源系统，不是现实货币，不支持提现、交易或投资。" },
  { id: "faq_full60_privacy", category: "PRIVACY", question: "Full60 数据会上传吗？", answer: "默认仅本地保存，不上云。" },
  { id: "faq_world_is_real", category: "WORLD_ENGINE", question: "生成的世界是现实吗？", answer: "不是。世界引擎输出为虚拟世界，不构成现实预测。" },
  { id: "faq_export_godot", category: "EXPORT", question: "如何导出 Godot 数据？", answer: "在世界引擎或终端运行 world.export --target godot。" },
  { id: "faq_founder", category: "FOUNDER", question: "Founder 功能是什么？", answer: "Founder 拥有系统治理、宪法修订、常数锁定与全系统审计权限。普通用户不会看到 Founder-only 页面。" },
  { id: "faq_storage", category: "STORAGE", question: "我的数据存在哪？", answer: "默认本地存储；导出包含 metadata。" },
  { id: "faq_sequence_basic", category: "SEQUENCE", question: "什么是数列？", answer: "数列是主体的结构化数字表达，用于驱动 MSL 与全系统推理。" },
];

export function listFAQ() {
  return [...FAQ_ITEMS];
}

export function listFAQCategories() {
  return [...FAQ_CATEGORIES];
}

export function searchFAQ(q: string): FAQItem[] {
  const s = q.toLowerCase().trim();
  if (!s) return [];
  return FAQ_ITEMS.filter((f) => f.question.toLowerCase().includes(s) || f.answer.toLowerCase().includes(s));
}

export function faqByCategory(cat: string): FAQItem[] {
  return FAQ_ITEMS.filter((f) => f.category === cat);
}
