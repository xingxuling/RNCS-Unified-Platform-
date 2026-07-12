export interface GlossaryTerm {
  termId: string;
  term: string;
  chineseTerm: string;
  plainDefinition: string;
  technicalDefinition: string;
  relatedModules: string[];
  examples: string[];
}

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  { termId: "t_aether", term: "Aetherworld", chineseTerm: "Aetherworld", plainDefinition: "数列驱动的元智能操作系统。", technicalDefinition: "由 MSL、Sequence AI、Constant Universe、System Constitution 等子系统构成。", relatedModules: [], examples: [] },
  { termId: "t_sequence_ai", term: "Sequence AI", chineseTerm: "数列人工智能", plainDefinition: "基于主体数列的 AI。", technicalDefinition: "结合 MSL + Subject Mode + Constants 的推理引擎。", relatedModules: ["sequence-ai"], examples: [] },
  { termId: "t_msl", term: "MSL", chineseTerm: "母体数列语言", plainDefinition: "用数列描述世界。", technicalDefinition: "Mother Sequence Language。", relatedModules: ["msl"], examples: [] },
  { termId: "t_full60", term: "Full60", chineseTerm: "Full60", plainDefinition: "完整真实主体数列模式。", technicalDefinition: "60 维主体编码，默认本地。", relatedModules: ["subject-mode"], examples: [] },
  { termId: "t_light20", term: "Light20", chineseTerm: "Light20", plainDefinition: "简化主体数列。", technicalDefinition: "20 维主体编码。", relatedModules: ["subject-mode"], examples: [] },
  { termId: "t_demo", term: "Demo Mode", chineseTerm: "演示模式", plainDefinition: "用演示数据而非真实主体。", technicalDefinition: "", relatedModules: ["subject-mode"], examples: [] },
  { termId: "t_founder", term: "Founder Mode", chineseTerm: "Founder 模式", plainDefinition: "创始人治理模式。", technicalDefinition: "拥有最高权限。", relatedModules: [], examples: [] },
  { termId: "t_constants", term: "Constant Universe", chineseTerm: "常数宇宙", plainDefinition: "系统常数注册与治理层。", technicalDefinition: "v0.2。", relatedModules: ["constants-universe"], examples: [] },
  { termId: "t_constitution", term: "System Constitution", chineseTerm: "系统宪法", plainDefinition: "最高治理规则。", technicalDefinition: "", relatedModules: ["system-constitution"], examples: [] },
  { termId: "t_world_engine", term: "World Engine", chineseTerm: "世界引擎", plainDefinition: "生成虚拟世界。", technicalDefinition: "v0.1-v0.6。", relatedModules: ["world-engine"], examples: [] },
  { termId: "t_world_sim", term: "World Simulation", chineseTerm: "世界模拟", plainDefinition: "tick 演化。", technicalDefinition: "", relatedModules: ["world-simulation"], examples: [] },
  { termId: "t_world_growth", term: "World Growth", chineseTerm: "世界生长", plainDefinition: "世界扩展。", technicalDefinition: "", relatedModules: ["world-growth"], examples: [] },
  { termId: "t_world_society", term: "World Society", chineseTerm: "世界社会", plainDefinition: "派系制度。", technicalDefinition: "", relatedModules: ["world-society"], examples: [] },
  { termId: "t_civ", term: "Civilization Evolution", chineseTerm: "文明演化", plainDefinition: "文明历史。", technicalDefinition: "", relatedModules: [], examples: [] },
  { termId: "t_present", term: "World Presentation", chineseTerm: "世界表现层", plainDefinition: "导出渲染。", technicalDefinition: "", relatedModules: ["world-presentation"], examples: [] },
  { termId: "t_hybrid", term: "Hybrid Compression", chineseTerm: "黑白箱混合压缩", plainDefinition: "压缩输出。", technicalDefinition: "", relatedModules: ["hybrid-compression"], examples: [] },
  { termId: "t_terminal", term: "Sequence Terminal", chineseTerm: "数列终端", plainDefinition: "命令行界面。", technicalDefinition: "", relatedModules: ["sequence-terminal"], examples: [] },
  { termId: "t_currency", term: "Sequence Currency", chineseTerm: "数列货币", plainDefinition: "内部积分。", technicalDefinition: "不可金融化。", relatedModules: ["sequence-currency"], examples: [] },
  { termId: "t_recalc", term: "Recalculation", chineseTerm: "重新计算", plainDefinition: "stale 后重算。", technicalDefinition: "", relatedModules: ["recalculation"], examples: [] },
  { termId: "t_qa", term: "Software QA", chineseTerm: "软件 QA", plainDefinition: "质量审计。", technicalDefinition: "", relatedModules: ["software-qa"], examples: [] },
  { termId: "t_subject_mode", term: "Subject Mode", chineseTerm: "主体模式", plainDefinition: "Demo/Light20/Full60/Founder。", technicalDefinition: "", relatedModules: ["subject-mode"], examples: [] },
  { termId: "t_world_knowledge", term: "World Knowledge", chineseTerm: "世界知识引擎", plainDefinition: "知识管理。", technicalDefinition: "", relatedModules: ["world-knowledge"], examples: [] },
];

export function listGlossary() {
  return [...GLOSSARY_TERMS];
}

export function searchGlossary(q: string): GlossaryTerm[] {
  const s = q.toLowerCase().trim();
  if (!s) return [];
  return GLOSSARY_TERMS.filter((t) => t.term.toLowerCase().includes(s) || t.chineseTerm.includes(s));
}
