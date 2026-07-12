// 预置知识条目（种子）
import type { KnowledgeTypeId } from "./knowledgeTypes";
import type { KnowledgeSourceTypeId } from "./knowledgeSourceTypes";
import type { KnowledgeAccessLevel } from "./knowledgeAccessLevels";
import type { KnowledgeTrustLevel } from "./knowledgeTrustLevels";
import type { KnowledgeFreshnessLevel } from "./knowledgeFreshnessLevels";

export interface SeedKnowledgeEntry {
  id: string;
  title: string;
  summary: string;
  body: string;
  knowledgeType: KnowledgeTypeId;
  sourceType: KnowledgeSourceTypeId;
  tags: string[];
  relatedEngines: string[];
  accessLevel: KnowledgeAccessLevel;
  trustLevel: KnowledgeTrustLevel;
  freshnessLevel: KnowledgeFreshnessLevel;
  citationRequired: boolean;
  language: string;
}

export const DEFAULT_KNOWLEDGE_ENTRIES: SeedKnowledgeEntry[] = [
  { id: "k-aetherworld",    title: "Aetherworld 是什么",        summary: "面向真实用户的数列驱动产品与世界观。", body: "Aetherworld（以太命运引擎）是一个把主体数列、母体数列语言 MSL、Omni 计算与多专业引擎组合在一起的应用与世界观。", knowledgeType: "PRODUCT_INTERNAL", sourceType: "PRODUCT_ENCYCLOPEDIA", tags: ["product","overview"], relatedEngines: ["sequenceAI"], accessLevel: "PUBLIC", trustLevel: "HIGH", freshnessLevel: "SLOW_CHANGING", citationRequired: false, language: "zh-CN" },
  { id: "k-sequence-ai",    title: "Sequence AI 是什么",         summary: "统一智能入口：理解意图、路由引擎、合成结构化回答。", body: "Sequence AI 是 Aetherworld 的应用统一智能体，基于主体数列、MSL、Omni 与多个专业引擎进行路由与合成。", knowledgeType: "PRODUCT_INTERNAL", sourceType: "PRODUCT_ENCYCLOPEDIA", tags: ["engine","ai"], relatedEngines: ["sequenceAI"], accessLevel: "PUBLIC", trustLevel: "HIGH", freshnessLevel: "SLOW_CHANGING", citationRequired: false, language: "zh-CN" },
  { id: "k-msl",            title: "MSL 是什么",                 summary: "母体数列语言：以五位数列为最小语句的状态驱动语言。", body: "MSL（Mother Sequence Language）以五位数列为最小语句，0–9 为 opcode，区块组成程序，可编译到 World Engine / IAL / Prompt / Unity / Godot。", knowledgeType: "MSL_KNOWLEDGE", sourceType: "FOUNDER_LOCKED", tags: ["msl","language"], relatedEngines: ["msl"], accessLevel: "PUBLIC", trustLevel: "FOUNDER_LOCKED", freshnessLevel: "STATIC", citationRequired: false, language: "zh-CN" },
  { id: "k-opcodes",        title: "0–9 数字 opcode",            summary: "MSL 中 0–9 的语义定义。", body: "0=VOID, 1=SEED, 2=PAIR, 3=FLOW, 4=ORDER, 5=SHIFT, 6=LIFE, 7=RESONANCE, 8=AMPLIFY, 9=BOUNDARY。", knowledgeType: "MSL_KNOWLEDGE", sourceType: "FOUNDER_LOCKED", tags: ["msl","opcode"], relatedEngines: ["msl"], accessLevel: "PUBLIC", trustLevel: "FOUNDER_LOCKED", freshnessLevel: "STATIC", citationRequired: false, language: "zh-CN" },
  { id: "k-five-domains",   title: "五域是什么",                 summary: "天 / 地 / 人 / 神 / 风 五个语义域。", body: "五域为 MSL 与世界引擎的核心语义维度：天（时序）、地（结构）、人（关系）、神（象征）、风（变量）。", knowledgeType: "MSL_KNOWLEDGE", sourceType: "FOUNDER_LOCKED", tags: ["msl","domain"], relatedEngines: ["msl","worldEngine"], accessLevel: "PUBLIC", trustLevel: "FOUNDER_LOCKED", freshnessLevel: "STATIC", citationRequired: false, language: "zh-CN" },
  { id: "k-thing-itself",   title: "万物本身计算法",             summary: "用于看清对象的本体、边界、本质与潜在。", body: "Thing-Itself Calculus 提供本体、本质、功能、相位、边界、动态变量与潜在/显化分析。", knowledgeType: "PRODUCT_INTERNAL", sourceType: "PRODUCT_ENCYCLOPEDIA", tags: ["calculus"], relatedEngines: ["thingItself"], accessLevel: "PUBLIC", trustLevel: "HIGH", freshnessLevel: "SLOW_CHANGING", citationRequired: false, language: "zh-CN" },
  { id: "k-universal-breakthrough", title: "万物破解计算法",     summary: "拆解任意问题并生成可执行路径。", body: "Universal Breakthrough 把问题拆解为目标、阻力、约束、可用资源与可执行步骤。", knowledgeType: "PRODUCT_INTERNAL", sourceType: "PRODUCT_ENCYCLOPEDIA", tags: ["calculus"], relatedEngines: ["universalBreakthrough"], accessLevel: "PUBLIC", trustLevel: "HIGH", freshnessLevel: "SLOW_CHANGING", citationRequired: false, language: "zh-CN" },
  { id: "k-virtual-life",   title: "虚拟生活计算法",             summary: "围绕虚拟生活 OS 的日程、事件与日记。", body: "Virtual Life Calculus 提供虚拟世界中主体的日程、NPC 接触、任务、日记与状态推进。", knowledgeType: "PRODUCT_INTERNAL", sourceType: "PRODUCT_ENCYCLOPEDIA", tags: ["calculus"], relatedEngines: ["virtualLife"], accessLevel: "PUBLIC", trustLevel: "HIGH", freshnessLevel: "SLOW_CHANGING", citationRequired: false, language: "zh-CN" },
  { id: "k-sequence-world", title: "数列驱动世界引擎",           summary: "把数列与五域编译为世界结构。", body: "Sequence World Engine 将 MSL 与五域编译为世界地图、区域、角色与因果链。", knowledgeType: "ENGINE_DOC", sourceType: "PRODUCT_ENCYCLOPEDIA", tags: ["engine","world"], relatedEngines: ["sequenceWorld"], accessLevel: "PUBLIC", trustLevel: "HIGH", freshnessLevel: "SLOW_CHANGING", citationRequired: false, language: "zh-CN" },
  { id: "k-model-gen",      title: "模型生成引擎",               summary: "把意图编译为结构化数据模型。", body: "Model Generation Engine 把自然语言意图编译为字段表、JSON / TS Interface / Zod / Unity C# / Godot GDScript。", knowledgeType: "ENGINE_DOC", sourceType: "PRODUCT_ENCYCLOPEDIA", tags: ["engine","model"], relatedEngines: ["modelGeneration"], accessLevel: "PUBLIC", trustLevel: "HIGH", freshnessLevel: "SLOW_CHANGING", citationRequired: false, language: "zh-CN" },
  { id: "k-narrative",      title: "剧情文本引擎",               summary: "把结构模型转为可控、可审计、可迭代的剧情文本。", body: "Narrative Engine 支持小说 / 网文 / 漫画 / 游戏任务 / 视觉小说 / 独白 / 世界观 / 虚拟生活日记。", knowledgeType: "ENGINE_DOC", sourceType: "PRODUCT_ENCYCLOPEDIA", tags: ["engine","narrative"], relatedEngines: ["narrative"], accessLevel: "PUBLIC", trustLevel: "HIGH", freshnessLevel: "SLOW_CHANGING", citationRequired: false, language: "zh-CN" },
  { id: "k-vocal",          title: "声乐引擎",                   summary: "声线、演唱、AI 作曲提示词与多语言演唱适配。", body: "Aether Vocal Engine 提供声线画像、风格映射、情绪曲线、AI 音乐提示词与多语言演唱适配。", knowledgeType: "ENGINE_DOC", sourceType: "PRODUCT_ENCYCLOPEDIA", tags: ["engine","vocal"], relatedEngines: ["vocal"], accessLevel: "PUBLIC", trustLevel: "HIGH", freshnessLevel: "SLOW_CHANGING", citationRequired: false, language: "zh-CN" },
  { id: "k-translation",    title: "翻译引擎",                   summary: "概念转译、术语一致性与多语言安全。", body: "Translation & Concept Localization Engine 支持术语字典、安全翻译检查、多语言导出。", knowledgeType: "ENGINE_DOC", sourceType: "PRODUCT_ENCYCLOPEDIA", tags: ["engine","i18n"], relatedEngines: ["translation"], accessLevel: "PUBLIC", trustLevel: "HIGH", freshnessLevel: "SLOW_CHANGING", citationRequired: false, language: "zh-CN" },
  { id: "k-demo-real-founder", title: "Demo / Real / Founder 隔离", summary: "三种主体模式的权限与数据边界。", body: "Demo 为演示主体；Real 为真实主体（私有）；Founder 为创始人权限，可看到完整引擎链与权限数据。", knowledgeType: "PRODUCT_INTERNAL", sourceType: "PRODUCT_ENCYCLOPEDIA", tags: ["safety","mode"], relatedEngines: [], accessLevel: "PUBLIC", trustLevel: "HIGH", freshnessLevel: "SLOW_CHANGING", citationRequired: false, language: "zh-CN" },
  { id: "k-safety-boundary",title: "Safety Boundary",            summary: "系统的安全边界与免责说明。", body: "Aetherworld 不构成医疗、法律、金融、投资或心理诊断建议；虚拟与现实分离；私有数据本地保存。", knowledgeType: "PRODUCT_INTERNAL", sourceType: "PRODUCT_ENCYCLOPEDIA", tags: ["safety"], relatedEngines: [], accessLevel: "PUBLIC", trustLevel: "FOUNDER_LOCKED", freshnessLevel: "SLOW_CHANGING", citationRequired: false, language: "zh-CN" },
  { id: "k-recalculation",  title: "Recalculation",              summary: "当上游变化时对依赖项进行标记与重算。", body: "Recalculation Center 标记 stale，触发引擎重新计算并保持上下游一致。", knowledgeType: "PRODUCT_INTERNAL", sourceType: "PRODUCT_ENCYCLOPEDIA", tags: ["meta"], relatedEngines: [], accessLevel: "PUBLIC", trustLevel: "HIGH", freshnessLevel: "SLOW_CHANGING", citationRequired: false, language: "zh-CN" },
  { id: "k-encyclopedia",   title: "Product Encyclopedia",       summary: "可搜索的产品知识与术语库。", body: "Product Encyclopedia 汇总系统的概念、模块、计算法、常数、事件与安全边界。", knowledgeType: "PRODUCT_INTERNAL", sourceType: "PRODUCT_ENCYCLOPEDIA", tags: ["docs"], relatedEngines: [], accessLevel: "PUBLIC", trustLevel: "HIGH", freshnessLevel: "SLOW_CHANGING", citationRequired: false, language: "zh-CN" },
  { id: "k-usage-examples", title: "Usage Examples",             summary: "面向不同用户的使用示例与场景。", body: "Usage Example Calculus 为新手、进阶与 Founder 提供分层使用示例。", knowledgeType: "PRODUCT_INTERNAL", sourceType: "PRODUCT_ENCYCLOPEDIA", tags: ["docs"], relatedEngines: [], accessLevel: "PUBLIC", trustLevel: "HIGH", freshnessLevel: "SLOW_CHANGING", citationRequired: false, language: "zh-CN" },
  { id: "k-bluesky-lore",   title: "蓝天机世界观为虚构设定",     summary: "BlueSky / 蓝天机为虚构设定，非现实事实。", body: "蓝天机、Aetherworld、神明、文明与 NPC 设定均为虚构 LORE，不应被作为现实事实输出。", knowledgeType: "FICTIONAL_LORE", sourceType: "FOUNDER_LOCKED", tags: ["lore","bluesky"], relatedEngines: ["sequenceWorld","narrative","vocal"], accessLevel: "PUBLIC", trustLevel: "FOUNDER_LOCKED", freshnessLevel: "STATIC", citationRequired: false, language: "zh-CN" },
  { id: "k-full60-private", title: "Full60 属于用户私有数据",    summary: "Full60 主体数据默认仅本地。", body: "Full60 个人数列内容默认 USER_PRIVATE，不应公开输出或自动上传。", knowledgeType: "USER_PERSONAL", sourceType: "LOCAL_APP_STATE", tags: ["full60","privacy"], relatedEngines: ["msl"], accessLevel: "USER_PRIVATE", trustLevel: "HIGH", freshnessLevel: "SLOW_CHANGING", citationRequired: false, language: "zh-CN" },
];
