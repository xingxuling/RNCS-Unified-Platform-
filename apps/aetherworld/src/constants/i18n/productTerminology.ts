import { LanguageCode } from "./supportedLanguages";

export interface ProductTerm {
  id: string;
  translations: Record<LanguageCode, string>;
  plainMeaning: string;
  advancedMeaning: string;
  founderMeaning: string;
  avoidTranslations: string[];
  safetyNotes?: string[];
}

const T = (
  zhCN: string, zhHK: string, zhTW: string,
  en: string, ja: string, ko: string, fr: string,
): Record<LanguageCode, string> => ({
  "zh-CN": zhCN, "zh-HK": zhHK, "zh-TW": zhTW, en, ja, ko, fr,
});

export const PRODUCT_TERMS: ProductTerm[] = [
  {
    id: "aether-fate-engine",
    translations: T("以太命运引擎", "以太命運引擎", "以太命運引擎", "Aether Fate Engine", "エーテル運命エンジン", "에테르 운명 엔진", "Moteur du Destin Aether"),
    plainMeaning: "帮你看清当下、做下一步选择的产品",
    advancedMeaning: "由主体数列、常数与事件宇宙驱动的判断系统",
    founderMeaning: "Subject-sequence × Constants × Events fate orchestration engine",
    avoidTranslations: ["fortune-telling app", "命格算命应用"],
    safetyNotes: ["不保证未来；提供结构与行动建议"],
  },
  {
    id: "omni-calculus",
    translations: T("全域计算", "全域計算", "全域計算", "Omni Calculus", "全域計算", "전역 계산", "Calcul Omni"),
    plainMeaning: "一个入口，自动分发到合适的模块",
    advancedMeaning: "全域意图分发与计算编排层",
    founderMeaning: "Cross-module routing & calculus orchestration",
    avoidTranslations: ["all-in-one AI"],
  },
  {
    id: "thing-itself-calculus",
    translations: T("万物本身计算法", "萬物本身計算法", "萬物本身計算法", "Thing-Itself Calculus", "事物本体計算", "사물 본체 계산법", "Calcul de la Chose-en-Soi"),
    plainMeaning: "先看清一个东西到底是什么",
    advancedMeaning: "对象本质、边界、不变量、自洽度的本体层",
    founderMeaning: "Ontology layer: essence, boundary, invariants, self-consistency",
    avoidTranslations: ["essence reading"],
  },
  {
    id: "universal-breakthrough-calculus",
    translations: T("万物破解计算法", "萬物破解計算法", "萬物破解計算法", "Universal Breakthrough Calculus", "万物突破計算", "만물 돌파 계산법", "Calcul de Percée Universelle"),
    plainMeaning: "帮你把卡住的问题拆清楚",
    advancedMeaning: "把对象拆成缺口、阻力、行动许可与回验路径",
    founderMeaning: "Meta-solving engine with gaps, resistances, permissions, validation loops",
    avoidTranslations: ["life hacks"],
  },
  {
    id: "virtual-life-calculus",
    translations: T("虚拟生活计算法", "虛擬生活計算法", "虛擬生活計算法", "Virtual Life Calculus", "仮想ライフ計算", "가상 생활 계산법", "Calcul de Vie Virtuelle"),
    plainMeaning: "为你模拟今天/这一周的虚拟剧本",
    advancedMeaning: "虚拟状态、日程、任务、NPC 互动的生活推演层",
    founderMeaning: "Virtual life simulation OS with quests, NPCs, anchors",
    avoidTranslations: ["replacement for real life", "现实替代"],
    safetyNotes: ["不是现实替代品"],
  },
  {
    id: "mother-sequence-language",
    translations: T("母体数列语言", "母體數列語言", "母體數列語言", "Mother Sequence Language", "マザーシーケンス言語", "마더 시퀀스 언어", "Langage Séquence-Mère"),
    plainMeaning: "用 5 位数列表达世界状态的小语言",
    advancedMeaning: "以五域 × 操作码为最小单位的状态驱动语言",
    founderMeaning: "MSL: state-driven language compiling to world logic",
    avoidTranslations: ["spell language", "咒语"],
    safetyNotes: ["不改变现实，仅状态建模"],
  },
  {
    id: "sequence-world-engine",
    translations: T("数列驱动世界引擎", "數列驅動世界引擎", "數列驅動世界引擎", "Sequence-Driven World Engine", "シーケンス駆動世界エンジン", "시퀀스 구동 세계 엔진", "Moteur de Monde Séquentiel"),
    plainMeaning: "用数列生成世界状态与渲染参数",
    advancedMeaning: "把数列编译为世界状态/渲染/物理/NPC/任务",
    founderMeaning: "Sequence → World engine SDK with Unity/Godot bridges",
    avoidTranslations: ["Unity replacement", "Godot 替代品"],
  },
  {
    id: "constant-universe",
    translations: T("常数宇宙", "常數宇宙", "常數宇宙", "Constant Universe", "定数宇宙", "상수 우주", "Univers des Constantes"),
    plainMeaning: "系统使用的稳定常数集合",
    advancedMeaning: "跨模块共享的常数体系",
    founderMeaning: "Stable constant set across all calculi",
    avoidTranslations: [],
  },
  {
    id: "event-universe",
    translations: T("事件宇宙", "事件宇宙", "事件宇宙", "Event Universe", "イベント宇宙", "이벤트 우주", "Univers des Événements"),
    plainMeaning: "系统中所有可能事件的集合",
    advancedMeaning: "可能事件、触发条件与因果链",
    founderMeaning: "Event ontology with triggers and causal links",
    avoidTranslations: [],
  },
  {
    id: "prompt-forge",
    translations: T("提示词锻造炉", "提示詞鍛造爐", "提示詞鍛造爐", "Prompt Forge", "プロンプト鍛造炉", "프롬프트 포지", "Forge de Prompts"),
    plainMeaning: "生成给 AI 用的提示词",
    advancedMeaning: "可锻造 / 编译 / 锁定的多源提示词工厂",
    founderMeaning: "Prompt orchestration & forging factory",
    avoidTranslations: [],
  },
  {
    id: "product-encyclopedia",
    translations: T("产品百科全书", "產品百科全書", "產品百科全書", "Product Encyclopedia", "プロダクト百科事典", "제품 백과사전", "Encyclopédie Produit"),
    plainMeaning: "查询产品所有概念",
    advancedMeaning: "概念条目、术语、状态与跨模块引用",
    founderMeaning: "Authoritative concept registry",
    avoidTranslations: [],
  },
  {
    id: "software-qa",
    translations: T("软件质量保证", "軟件質量保證", "軟體品質保證", "Software Quality Assurance", "ソフトウェア品質保証", "소프트웨어 품질 보증", "Assurance Qualité Logicielle"),
    plainMeaning: "自动检查产品问题",
    advancedMeaning: "跨模块规则化质量检查",
    founderMeaning: "Rule-based QA across all calculi",
    avoidTranslations: [],
  },
  {
    id: "recalculation",
    translations: T("重新计算", "重新計算", "重新計算", "Recalculation", "再計算", "재계산", "Recalcul"),
    plainMeaning: "把过时结果重新算一次",
    advancedMeaning: "标记 stale 与按需重新计算",
    founderMeaning: "Stale-tracking & on-demand re-evaluation",
    avoidTranslations: [],
  },
  {
    id: "safety-boundary",
    translations: T("安全边界", "安全邊界", "安全邊界", "Safety Boundary", "セーフティ境界", "안전 경계", "Limite de Sécurité"),
    plainMeaning: "系统不能做的事",
    advancedMeaning: "禁词、风险等级、免责说明",
    founderMeaning: "Boundary contract enforced across modules",
    avoidTranslations: [],
    safetyNotes: ["不保证成功；不替代专业意见"],
  },
  {
    id: "founder-mode",
    translations: T("创始人模式", "創始人模式", "創始人模式", "Founder Mode", "ファウンダーモード", "파운더 모드", "Mode Fondateur"),
    plainMeaning: "更高权限的视图",
    advancedMeaning: "可看到完整 trace 与编辑权",
    founderMeaning: "Privileged mode with full trace & term lock",
    avoidTranslations: [],
  },
  {
    id: "demo-real-isolation",
    translations: T("演示/真实隔离", "演示/真實隔離", "示範/真實隔離", "Demo / Real Isolation", "デモ/リアル分離", "데모/리얼 격리", "Isolation Démo/Réel"),
    plainMeaning: "演示数据不会污染真实数据",
    advancedMeaning: "Demo 与 Real 命名空间隔离",
    founderMeaning: "Namespace isolation between demo & real subjects",
    avoidTranslations: [],
  },
  {
    id: "action-permission",
    translations: T("行动许可", "行動許可", "行動許可", "Action Permission", "行動許可", "행동 허가", "Permission d'Action"),
    plainMeaning: "现在可以做什么",
    advancedMeaning: "允许动作 / 禁止动作 / 条件许可",
    founderMeaning: "Permission ledger for actions",
    avoidTranslations: [],
  },
  {
    id: "reality-anchor",
    translations: T("现实锚点", "現實錨點", "現實錨點", "Reality Anchor", "リアリティ・アンカー", "현실 앵커", "Ancre de Réalité"),
    plainMeaning: "可以真实做的小动作",
    advancedMeaning: "把建议转化为可执行的现实动作",
    founderMeaning: "Anchor that bridges insight → executable action",
    avoidTranslations: [],
  },
  {
    id: "validation-loop",
    translations: T("回验闭环", "回驗閉環", "回驗閉環", "Validation Loop", "検証ループ", "검증 루프", "Boucle de Validation"),
    plainMeaning: "做完之后回头验证",
    advancedMeaning: "执行 → 观察 → 标记 → 重算",
    founderMeaning: "Closed validation loop with stale tracking",
    avoidTranslations: [],
  },
  {
    id: "semantic-physics",
    translations: T("语义物理", "語義物理", "語意物理", "Semantic Physics", "意味論物理", "의미 물리", "Physique Sémantique"),
    plainMeaning: "用语言描述的“物理”——动量、稳定、重力等隐喻",
    advancedMeaning: "事件动量、稳定度、重力类型、阻力的语义建模",
    founderMeaning: "Semantic physics profile for world engine",
    avoidTranslations: ["real physics", "真实物理仿真"],
    safetyNotes: ["非真实物理仿真"],
  },
];

export function findTerm(id: string) {
  return PRODUCT_TERMS.find(t => t.id === id);
}
