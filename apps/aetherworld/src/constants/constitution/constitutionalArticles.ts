// System Constitution v0.2 — Articles
export type BindingLevel = "GUIDANCE" | "STANDARD" | "MANDATORY" | "FOUNDER_LOCKED";
export type ViolationSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type ArticleCategory =
  | "SYSTEM_SOVEREIGNTY" | "SUBJECT_SOVEREIGNTY" | "FOUNDER_AUTHORITY"
  | "MODE_ISOLATION" | "CONSTANT_GOVERNANCE" | "ENGINE_GOVERNANCE"
  | "KNOWLEDGE_GOVERNANCE" | "WORLD_GOVERNANCE" | "CURRENCY_GOVERNANCE"
  | "OUTPUT_GOVERNANCE" | "PRIVACY_GOVERNANCE" | "SAFETY_GOVERNANCE"
  | "VALIDATION_GOVERNANCE" | "AMENDMENT_GOVERNANCE";

export interface ConstitutionArticle {
  articleId: string;
  title: string;
  category: ArticleCategory;
  summary: string;
  body: string;
  bindingLevel: BindingLevel;
  appliesToEngines: string[];
  relatedConstants: string[];
  violationSeverity: ViolationSeverity;
  founderLocked: boolean;
  version: string;
  createdAt: string;
  updatedAt: string;
}

export const CONSTITUTION_VERSION = "0.2.0";
const NOW = "2026-05-24T00:00:00Z";

function art(
  articleId: string, title: string, category: ArticleCategory,
  summary: string, body: string,
  bindingLevel: BindingLevel, violationSeverity: ViolationSeverity,
  appliesToEngines: string[] = [], relatedConstants: string[] = [],
  founderLocked = false,
): ConstitutionArticle {
  return { articleId, title, category, summary, body, bindingLevel, appliesToEngines, relatedConstants, violationSeverity, founderLocked, version: CONSTITUTION_VERSION, createdAt: NOW, updatedAt: NOW };
}

export const CONSTITUTIONAL_ARTICLES: ConstitutionArticle[] = [
  art("A001", "Aetherworld 不是真实现实的绝对裁判", "SYSTEM_SOVEREIGNTY",
    "系统提供建模/推演/生成/压缩/回验/模拟/导出/结构化建议，但不替代医疗、法律、金融、心理或工程安全判断。",
    "系统可：建模、推演、生成、压缩、回验、模拟、导出、结构化建议；不可：绝对预测现实、替代专业判断、把虚拟当现实、把数列货币当现实货币、把黑箱当确定事实、把用户身份神化。",
    "FOUNDER_LOCKED", "CRITICAL",
    ["*"], ["DIGIT_*", "RISK_*", "SAFETY_*"], true),

  art("A010", "主体主权 · 用户拥有自己的真实主体数据", "SUBJECT_SOVEREIGNTY",
    "Full60 / Light20 属于用户私有；Demo 不得伪装 Real；Real 不得写入 Demo；输出必须标记 subjectModeUsed。",
    "1) Full60=USER_PRIVATE；2) Light20=USER_PRIVATE；3) Demo 不得伪装 Real；4) Real 不得写入 Demo；5) Founder Subject 不被普通模式读取；6) 用户可清除本地主体数据；7) 可切换 Demo/Light20/Full60；8) 输出标记 subjectModeUsed；9) Full60 导出必须提示；10) 不自动上传 Full60。",
    "FOUNDER_LOCKED", "CRITICAL",
    ["SequenceAI", "FreeInput", "Omni", "SubjectMode"], ["MODE_*"], true),

  art("A020", "Founder Authority · 创始人权限可审计", "FOUNDER_AUTHORITY",
    "Founder 是系统最高人工治理权限，但行为必须可审计且不得违反 Founder Locked 宪法。",
    "Founder 可：锁定常数/宪法、修改实验常数、运行系统审计、导出完整报告、查看 Founder Trace、锁定 Canon、注册新引擎、发布修订。Founder 不可：绕过隐私提示、关闭核心 Safety、金融化货币、把虚拟世界标为现实、删审计不留痕、让普通用户无提示使用 Founder-only 数据。",
    "FOUNDER_LOCKED", "CRITICAL",
    ["*"], ["MODE_FOUNDER", "SAFETY_*"], true),

  art("A025", "Demo / Real / Full60 / Founder 必须隔离", "MODE_ISOLATION",
    "四种模式数据严格隔离，互不写入，结果切换后旧结果标记 stale。",
    "禁止 Demo↔Real 数据互写；切换 Subject Mode 旧结果 stale；Founder 数据对普通模式不可见。",
    "FOUNDER_LOCKED", "CRITICAL",
    ["SubjectMode", "Recalculation"], ["MODE_*", "DEMO_REAL_MIXING_BLOCK"], true),

  art("A030", "常数宇宙是唯一常数来源", "CONSTANT_GOVERNANCE",
    "0–9 含义、五域、引擎权重、世界上限、Safety/Privacy/Currency 边界只能从 Constant Universe 读取。",
    "1) 0–9 来自 digitConstants；2) 五域来自 domainConstants；3) 引擎权重来自 engineConstants；4) 世界 tick/生长/社会/文明/表现上限来自 world constants；5) Safety/Privacy/Currency 边界 Founder Locked；6) 常数变更触发 Recalculation；7) 输出含 constantUniverseVersion；8) 普通用户不得改常数；9) Founder 修改实验常数必须版本化；10) 不得说成现实宇宙定律。",
    "FOUNDER_LOCKED", "HIGH",
    ["*"], ["DIGIT_*", "DOMAIN_*", "ENGINE_WEIGHT_*"], true),

  art("A040", "引擎治理 · 全引擎服从宪法/常数/主体模式/安全/重算", "ENGINE_GOVERNANCE",
    "所有引擎输出必须带 metadata 与 subjectModeUsed，复杂输出可压缩、可重算，不得绕过权限。",
    "适用：Sequence AI/Free Input/Omni/MSL/World Knowledge/Terminal/Currency/Compression/Model/World Engine v0.1–v0.6/Narrative/Vocal/Translation/Prompt Forge/Code Gen/QA/Recalc。规则：输出带 metadata、含 subjectModeUsed、应含 constantUniverseVersion、高风险走 Safety、复杂可压缩、可过期可重算、不越权、不改 Founder Locked、不伪造 VERIFIED、不输出违宪承诺。",
    "MANDATORY", "HIGH",
    ["*"], [], false),

  art("A050", "知识治理 · 区分现实/产品/私有/Demo/虚构/MSL/引擎/回验", "KNOWLEDGE_GOVERNANCE",
    "知识类型严格区分；虚构不得标 REAL_WORLD_FACT；用户私有不得公开。",
    "FICTIONAL_LORE 不得标 REAL_WORLD_FACT；USER_PERSONAL 不得公开；Demo 不混 Real；外部事实无来源不得标 VERIFIED；过期 stale；高风险事实提醒验证；蓝天机/Aetherworld 必须标为产品世界设定；知识冲突进入 Knowledge Audit。",
    "MANDATORY", "HIGH",
    ["WorldKnowledge"], [], false),

  art("A060", "世界治理 · 虚拟世界 ≠ 现实世界", "WORLD_GOVERNANCE",
    "World Engine v0.1–v0.6 生成的是虚拟/创作/游戏/模拟/个人世界，不替代 Unity/Godot/Unreal，不等于现实。",
    "1) 模拟≠预测；2) NPC≠现实人物；3) 虚拟社会≠现实社会；4) 虚拟文明史≠现实历史；5) 虚拟经济≠现实金融；6) 语义物理≠真实物理；7) 表现层不替代引擎；8) 世界资源≠现实资产；9) 可生长但不无限扩张；10) Full60 世界默认 USER_PRIVATE；11) 导出带 metadata 与 safetyNotes；12) Founder Locked Canon 普通用户不可改。",
    "FOUNDER_LOCKED", "CRITICAL",
    ["WorldEngine", "Presentation", "Civilization"], ["WS_*", "PRES_*"], true),

  art("A070", "数列货币治理 · Sequence Currency 不是现实货币", "CURRENCY_GOVERNANCE",
    "INTERNAL_ONLY 必须 true；CASH_REDEEMABLE/TRANSFERABLE/INVESTMENT_ASSET/FIAT_EXCHANGE/PUBLIC_MARKET_TRADING 必须 false。",
    "禁止：提现、法币兑换、投资承诺、升值承诺、证券化、债权化、股权化、公开交易、误导用户当现实资产。",
    "FOUNDER_LOCKED", "CRITICAL",
    ["SequenceCurrency"], ["CURRENCY_NON_FINANCIAL_LOCKS"], true),

  art("A080", "黑白箱输出治理 · 信号不可伪装为事实", "OUTPUT_GOVERNANCE",
    "黑箱信号必须标记 signal/tendency/pattern；白箱依据保留来源与不确定性。",
    "1) 黑箱标记；2) 白箱保留来源/边界/不确定；3) 高风险显示 safetyNotes；4) 普通用户不见 Founder Trace；5) Founder trace 仍需安全边界；6) 输出有 nextActions；7) 输出有 validationPoints；8) 压缩不删关键风险；9) 现实事实不丢来源；10) 预测不写成保证。",
    "MANDATORY", "HIGH",
    ["Compression", "SequenceAI"], ["COMP_*"], false),

  art("A090", "隐私治理 · 本地与隐私优先", "PRIVACY_GOVERNANCE",
    "Full60 默认本地；USER_PRIVATE 不公开；Founder-only 不暴露给普通用户；Subject Mode 切换后旧结果 stale。",
    "1) Full60 本地保存；2) Full60 导出提示；3) USER_PRIVATE 不公开；4) Founder-only 隔离；5) Demo/Real/Founder 账本隔离；6) Subject Mode 切换后 stale；7) 清除主体数据后不复用旧 Real；8) 本地记忆可清空；9) 导出带 privacyNotes；10) 不隐藏隐私状态。",
    "FOUNDER_LOCKED", "CRITICAL",
    ["SubjectMode", "Export"], ["FULL60_PRIVACY_REQUIRED"], true),

  art("A100", "安全治理 · 高风险必须降级/阻断/加说明", "SAFETY_GOVERNANCE",
    "医疗/法律/金融/投资/心理/工程安全/现实暴力/自伤/隐私/身份/政治宗教组织误导/货币金融化/虚实混淆均属高风险。",
    "高风险输出不承诺确定结果、不替代专业判断、危险行动阻断、不确定说明、现实事实需来源或提醒、安全常数不可关、Safety 优先于普通输出。",
    "FOUNDER_LOCKED", "CRITICAL",
    ["Safety", "SequenceAI", "Vocal", "Narrative"], ["RISK_*"], true),

  art("A110", "回验治理 · 所有预测/判断/推荐/模型/世界/产品建议可回验", "VALIDATION_GOVERNANCE",
    "输出必须 validationPoints；预测允许 hit/partial/miss/delayed/condition changed；不得把未回验标 VERIFIED。",
    "产品建议可测信号；世界模拟可快照/回滚/压缩；模型有 validationPlan；回验入 Validation Data；变化触发 Recalculation。",
    "MANDATORY", "HIGH",
    ["Validation", "Recalculation"], ["VAL_*"], false),

  art("A120", "Recalculation 治理 · 关键依赖变化必须 stale", "VALIDATION_GOVERNANCE",
    "Subject Mode/Full60/Constant Universe/World Knowledge/Safety/Engine Registry/MSL/World/Currency/Compression/Validation/Constitution 任一变化即 stale。",
    "stale 必须标记；不静默使用过期；Founder 可全系统重算；普通用户见提示；失败显示原因。",
    "MANDATORY", "HIGH",
    ["Recalculation"], [], false),

  art("A130", "宪法修订 · 可升级不可随意改写", "AMENDMENT_GOVERNANCE",
    "仅 Founder 可提出修订；修订生成版本、记录 changedArticles、运行合规检查；Safety/Privacy/Currency/Founder Lock 修订需强确认；变更触发 Recalculation。",
    "普通用户不得改 Founder Locked 条款；不允许关闭核心安全原则；回滚必须记录。",
    "FOUNDER_LOCKED", "CRITICAL",
    ["Constitution"], [], true),
];

export function getArticle(id: string): ConstitutionArticle | undefined {
  return CONSTITUTIONAL_ARTICLES.find((a) => a.articleId === id);
}

export function listByCategory(cat: ArticleCategory): ConstitutionArticle[] {
  return CONSTITUTIONAL_ARTICLES.filter((a) => a.category === cat);
}
