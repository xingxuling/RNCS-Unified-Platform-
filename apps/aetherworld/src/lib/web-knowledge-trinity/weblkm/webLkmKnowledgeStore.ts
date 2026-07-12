import type { WebLkmKnowledgeItem, WebLkmEvidenceItem } from "../webKnowledgeTrinityTypes";
import { newWktId } from "../webKnowledgeTrinityTypes";
import type { WebKnowledgeSourceType } from "@/constants/web-knowledge-trinity/webKnowledgeSourceTypes";

// Seed knowledge base — small but representative. In production this would
// be assembled from Workspace, encyclopedias, learning docs, etc.
const SEED: Array<Omit<WebLkmKnowledgeItem, "createdAt" | "updatedAt">> = [
  {
    knowledgeId: "k_app_runtime_overview",
    title: "Aether App Runtime v0.1 概览",
    sourceType: "PRODUCT_ENCYCLOPEDIA",
    sourceId: "app-runtime",
    contentSummary: "App Runtime 将用户想法转换为 App 项目对象、需求、架构、文件树、代码草案、HTML 预览、QA 与交接包。",
    keywords: ["App", "Runtime", "应用", "生成", "网页", "项目", "番茄钟"],
    domainTags: ["app-runtime", "generation"],
    version: "0.1",
    freshnessStatus: "CURRENT",
    privacyLevel: "PUBLIC_DEMO",
    usableBy: ["ALL"],
    safetyNotes: ["不声称真实部署"],
  },
  {
    knowledgeId: "k_code_sandbox_overview",
    title: "Aether Code Sandbox Bridge v0.2",
    sourceType: "PRODUCT_ENCYCLOPEDIA",
    sourceId: "code-sandbox",
    contentSummary: "Code Sandbox 提供模拟构建、错误摘要、修复建议、Patch 草案与外部 Codex/Cursor 交接包。",
    keywords: ["代码", "运行", "错误", "修复", "patch", "构建", "sandbox"],
    domainTags: ["code-sandbox", "qa"],
    version: "0.2",
    freshnessStatus: "CURRENT",
    privacyLevel: "PUBLIC_DEMO",
    usableBy: ["ALL"],
    safetyNotes: ["禁止真实执行危险命令"],
  },
  {
    knowledgeId: "k_webllm_overview",
    title: "Aether WebLLM Runtime v0.3",
    sourceType: "PRODUCT_ENCYCLOPEDIA",
    sourceId: "webllm",
    contentSummary: "WebLLM 提供浏览器本地 LLM 推理，包含神经启发控制层、可用性检测与规则降级。",
    keywords: ["WebLLM", "本地", "LLM", "浏览器", "WebGPU", "推理"],
    domainTags: ["webllm", "model"],
    version: "0.3",
    freshnessStatus: "CURRENT",
    privacyLevel: "PUBLIC_DEMO",
    usableBy: ["ALL"],
    safetyNotes: ["不向模型传 Full60 原始数列"],
  },
  {
    knowledgeId: "k_weblcm_overview",
    title: "Aether WebLCM Runtime v0.4",
    sourceType: "PRODUCT_ENCYCLOPEDIA",
    sourceId: "weblcm",
    contentSummary: "WebLCM 把文本与对象压缩为概念对象、概念链与概念图谱，为 WebLLM 提供高层语义控制。",
    keywords: ["WebLCM", "概念", "概念链", "概念图谱", "压缩"],
    domainTags: ["weblcm", "concept"],
    version: "0.4",
    freshnessStatus: "CURRENT",
    privacyLevel: "PUBLIC_DEMO",
    usableBy: ["ALL"],
    safetyNotes: ["先概念后语言"],
  },
  {
    knowledgeId: "k_calculus_missing_layer",
    title: "Missing-Layer Detection Calculus",
    sourceType: "CALCULUS_UNIVERSE",
    sourceId: "missing-layer",
    contentSummary: "在系统中识别缺层、断层与缺口，输出补层建议。",
    keywords: ["缺层", "补层", "缺口", "missing", "layer"],
    domainTags: ["calculus", "missing-layer"],
    version: "1.0",
    freshnessStatus: "CURRENT",
    privacyLevel: "PUBLIC_DEMO",
    usableBy: ["ALL"],
    safetyNotes: [],
  },
  {
    knowledgeId: "k_constant_local_first",
    title: "常数：LOCAL_FIRST",
    sourceType: "CONSTANT_UNIVERSE",
    sourceId: "LOCAL_FIRST",
    contentSummary: "Aetherworld 优先本地运行，外部 API 只能作为可选 Provider。",
    keywords: ["LOCAL_FIRST", "本地", "常数"],
    domainTags: ["constant", "runtime"],
    version: "1.0",
    freshnessStatus: "CURRENT",
    privacyLevel: "PUBLIC_DEMO",
    usableBy: ["ALL"],
    safetyNotes: [],
  },
  {
    knowledgeId: "k_constant_full60_privacy",
    title: "常数：FULL60_PRIVACY",
    sourceType: "CONSTANT_UNIVERSE",
    sourceId: "FULL60_PRIVACY",
    contentSummary: "Full60 原始数列不得公开，不得传给模型。",
    keywords: ["FULL60", "隐私", "常数"],
    domainTags: ["constant", "privacy"],
    version: "1.0",
    freshnessStatus: "CURRENT",
    privacyLevel: "PUBLIC_DEMO",
    usableBy: ["ALL"],
    safetyNotes: [],
  },
  {
    knowledgeId: "k_qa_rules_overview",
    title: "Software QA 规则总览",
    sourceType: "SOFTWARE_QA_RULES",
    sourceId: "qa",
    contentSummary: "QA 涵盖逻辑一致性、命名规范、空状态、错误态、隐私边界与执行边界检查。",
    keywords: ["QA", "质量", "检查", "审计"],
    domainTags: ["qa"],
    version: "1.0",
    freshnessStatus: "CURRENT",
    privacyLevel: "PUBLIC_DEMO",
    usableBy: ["ALL"],
    safetyNotes: [],
  },
  {
    knowledgeId: "k_world_engine_overview",
    title: "数列世界引擎",
    sourceType: "WORLD_ENGINE",
    sourceId: "world-engine",
    contentSummary: "数列世界引擎用于生成世界观、地理、角色、组织、文化、剧情线与世界主题曲。",
    keywords: ["世界", "world", "engine", "剧情", "角色"],
    domainTags: ["world", "narrative"],
    version: "1.0",
    freshnessStatus: "CURRENT",
    privacyLevel: "PUBLIC_DEMO",
    usableBy: ["ALL"],
    safetyNotes: ["虚构边界"],
  },
  {
    knowledgeId: "k_vocal_engine_overview",
    title: "声乐引擎",
    sourceType: "PRODUCT_ENCYCLOPEDIA",
    sourceId: "vocal",
    contentSummary: "声乐引擎用于设计歌曲结构、声乐画像、情绪曲线与生成 Suno 风格 Prompt。",
    keywords: ["声乐", "歌", "歌词", "vocal", "Suno"],
    domainTags: ["vocal"],
    version: "1.0",
    freshnessStatus: "CURRENT",
    privacyLevel: "PUBLIC_DEMO",
    usableBy: ["ALL"],
    safetyNotes: ["不模拟人声"],
  },
  {
    knowledgeId: "k_agent_binding_overview",
    title: "Agent Knowledge-Personality Binding",
    sourceType: "PRODUCT_ENCYCLOPEDIA",
    sourceId: "agent-binding",
    contentSummary: "把外部 Agent / Tool / 框架绑定到 Aetherworld 的知识层、人格层、计算法路由与治理守卫。",
    keywords: ["Agent", "binding", "知识人格", "工具绑定"],
    domainTags: ["agent"],
    version: "1.0",
    freshnessStatus: "CURRENT",
    privacyLevel: "PUBLIC_DEMO",
    usableBy: ["ALL"],
    safetyNotes: [],
  },
  {
    knowledgeId: "k_system_constitution",
    title: "System Constitution",
    sourceType: "SYSTEM_CONSTITUTION",
    sourceId: "constitution",
    contentSummary: "系统宪法定义最高边界：隐私、安全、虚构边界、Demo/Real 分离、防卡脖子等。",
    keywords: ["宪法", "Constitution", "边界", "治理"],
    domainTags: ["governance"],
    version: "1.0",
    freshnessStatus: "CURRENT",
    privacyLevel: "PUBLIC_DEMO",
    usableBy: ["ALL"],
    safetyNotes: [],
  },
];

let STORE: WebLkmKnowledgeItem[] | null = null;

function ensureStore(): WebLkmKnowledgeItem[] {
  if (STORE) return STORE;
  const now = new Date().toISOString();
  STORE = SEED.map((s) => ({
    ...s,
    createdAt: now,
    updatedAt: now,
    evidenceChain: [makeEvidence(s.sourceType, s.sourceId ?? s.knowledgeId, s.title)],
  }));
  return STORE;
}

function makeEvidence(sourceType: WebKnowledgeSourceType, sourceId: string, claim: string): WebLkmEvidenceItem {
  return {
    evidenceId: newWktId("ev"),
    sourceType, sourceId, claim,
    confidence: 0.9,
    createdAt: new Date().toISOString(),
  };
}

export function listKnowledgeItems(): WebLkmKnowledgeItem[] {
  return [...ensureStore()];
}

export function getKnowledgeItem(id: string): WebLkmKnowledgeItem | undefined {
  return ensureStore().find((k) => k.knowledgeId === id);
}

export function addKnowledgeItem(item: Omit<WebLkmKnowledgeItem, "createdAt" | "updatedAt">): WebLkmKnowledgeItem {
  const now = new Date().toISOString();
  const full: WebLkmKnowledgeItem = { ...item, createdAt: now, updatedAt: now };
  ensureStore().push(full);
  return full;
}
