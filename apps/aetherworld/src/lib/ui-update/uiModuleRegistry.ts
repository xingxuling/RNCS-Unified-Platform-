// UI Module Registry — central registration of all UI-facing modules
import type { UIPriority } from "@/constants/ui-update/uiPriorityLevels";

export type UIRequiredUserMode = "PUBLIC" | "ADVANCED" | "FOUNDER";
export type UIRequiredSubjectMode = "ANY" | "DEMO" | "LIGHT_20" | "FULL_60" | "FOUNDER";

export interface UIModuleDefinition {
  moduleId: string;
  moduleName: string;
  chineseName: string;
  category: "START" | "CREATE" | "WORLD_ENGINE" | "SYSTEM" | "QUALITY" | "FOUNDER";
  route: string;
  requiredUserMode: UIRequiredUserMode;
  requiredSubjectMode?: UIRequiredSubjectMode;
  priority: UIPriority;
  quickStartEligible: boolean;
  dashboardEligible: boolean;
  sidebarVisible: boolean;
  hasUsageExample: boolean;
  hasSafetyNote: boolean;
  hasSubjectModeBadge: boolean;
  hasEmptyState: boolean;
  relatedEngines: string[];
  lastUpdatedAt: string;
}

const NOW = "2026-05-24T00:00:00Z";

function m(
  moduleId: string, chineseName: string, moduleName: string,
  category: UIModuleDefinition["category"], route: string,
  requiredUserMode: UIRequiredUserMode, priority: UIPriority,
  opts: Partial<UIModuleDefinition> = {},
): UIModuleDefinition {
  return {
    moduleId, moduleName, chineseName, category, route, requiredUserMode, priority,
    requiredSubjectMode: opts.requiredSubjectMode ?? "ANY",
    quickStartEligible: opts.quickStartEligible ?? true,
    dashboardEligible: opts.dashboardEligible ?? true,
    sidebarVisible: opts.sidebarVisible ?? true,
    hasUsageExample: opts.hasUsageExample ?? false,
    hasSafetyNote: opts.hasSafetyNote ?? false,
    hasSubjectModeBadge: opts.hasSubjectModeBadge ?? false,
    hasEmptyState: opts.hasEmptyState ?? false,
    relatedEngines: opts.relatedEngines ?? [],
    lastUpdatedAt: opts.lastUpdatedAt ?? NOW,
  };
}

export const UI_MODULE_REGISTRY: UIModuleDefinition[] = [
  // Start
  m("free-input",          "随便问 / 自由输入", "Free Input",          "START",  "/free-input",        "PUBLIC",   "CORE",      { hasUsageExample: true, hasEmptyState: true, hasSubjectModeBadge: true }),
  m("sequence-ai",         "数列人工智能",      "Sequence AI",         "START",  "/sequence-ai",       "PUBLIC",   "CORE",      { hasUsageExample: true, hasEmptyState: true, hasSubjectModeBadge: true, hasSafetyNote: true }),
  m("subject-mode",        "主体模式",          "Subject Mode",        "START",  "/subject-mode",      "PUBLIC",   "CORE",      { hasSubjectModeBadge: true, hasSafetyNote: true, hasUsageExample: true, hasEmptyState: true }),
  m("real-subject-setup",  "真实主体设置",      "Real Subject Setup",  "START",  "/real-subject-setup","PUBLIC",   "CORE",      { hasSubjectModeBadge: true, hasSafetyNote: true, hasEmptyState: true, hasUsageExample: true }),
  m("learn",               "学习中心",          "Learning Center",     "START",  "/learn",             "PUBLIC",   "CORE",      { hasUsageExample: true, hasEmptyState: true, hasSubjectModeBadge: true }),
  // Create
  m("msl",                 "母体数列语言 MSL",  "MSL",                 "CREATE", "/msl-console",       "ADVANCED", "IMPORTANT", { hasUsageExample: true, hasEmptyState: true, hasSafetyNote: true }),
  m("sequence-terminal",   "数列终端",          "Sequence Terminal",   "CREATE", "/sequence-terminal", "ADVANCED", "IMPORTANT", { hasUsageExample: true, hasSafetyNote: true, hasEmptyState: true }),
  m("model-generation",    "模型生成",          "Model Generation",    "CREATE", "/model-forge",       "PUBLIC",   "IMPORTANT", { hasUsageExample: true, hasEmptyState: true }),
  m("narrative",           "剧情文本",          "Narrative Engine",    "CREATE", "/narrative-engine",  "PUBLIC",   "IMPORTANT", { hasUsageExample: true, hasEmptyState: true }),
  m("vocal",               "声乐 Prompt",       "Vocal Engine",        "CREATE", "/vocal-engine",      "PUBLIC",   "IMPORTANT", { hasUsageExample: true, hasEmptyState: true, hasSafetyNote: true }),
  m("translation",         "翻译引擎",          "Translation Engine",  "CREATE", "/translation-engine","PUBLIC",   "IMPORTANT", { hasUsageExample: true, hasEmptyState: true, hasSafetyNote: true }),
  m("prompt-forge",        "Prompt 锻造",       "Prompt Forge",        "CREATE", "/abstract-prompt-forge", "ADVANCED", "ADVANCED", { hasUsageExample: true, hasEmptyState: true, hasSafetyNote: true }),
  // World Engine
  m("sequence-world",      "数列世界引擎",      "Sequence World",      "WORLD_ENGINE", "/sequence-world",       "PUBLIC",   "IMPORTANT", { hasUsageExample: true, hasEmptyState: true, hasSafetyNote: true }),
  m("world-simulation",    "世界模拟",          "World Simulation",    "WORLD_ENGINE", "/world-simulation",     "ADVANCED", "IMPORTANT", { hasUsageExample: true, hasEmptyState: true, hasSafetyNote: true }),
  m("world-growth",        "世界生长",          "World Growth",        "WORLD_ENGINE", "/world-growth",         "ADVANCED", "ADVANCED",  { hasSafetyNote: true, hasUsageExample: true, hasEmptyState: true }),
  m("world-society",       "世界社会",          "World Society",       "WORLD_ENGINE", "/world-society",        "ADVANCED", "ADVANCED",  { hasSafetyNote: true, hasUsageExample: true, hasEmptyState: true }),
  m("civilization",        "文明演化",          "Civilization",        "WORLD_ENGINE", "/civilization-evolution","ADVANCED", "ADVANCED",  { hasSafetyNote: true, hasUsageExample: true, hasEmptyState: true }),
  m("world-presentation",  "世界表现层",        "World Presentation",  "WORLD_ENGINE", "/world-presentation",   "ADVANCED", "ADVANCED",  { hasSafetyNote: true, hasUsageExample: true, hasEmptyState: true }),
  // System
  m("world-knowledge",     "世界知识引擎",      "World Knowledge",     "SYSTEM", "/world-knowledge",     "ADVANCED", "IMPORTANT", { hasUsageExample: true, hasEmptyState: true }),
  m("constant-universe",   "常数宇宙",          "Constant Universe",   "SYSTEM", "/constants-universe",  "ADVANCED", "IMPORTANT", { hasUsageExample: true, hasEmptyState: true, hasSafetyNote: true }),
  m("system-constitution", "系统宪法",          "System Constitution", "SYSTEM", "/system-constitution", "ADVANCED", "IMPORTANT", { hasUsageExample: true, hasEmptyState: true, hasSafetyNote: true }),
  m("hybrid-compression",  "黑白箱压缩",        "Hybrid Compression",  "SYSTEM", "/hybrid-compression",  "ADVANCED", "ADVANCED",  { hasUsageExample: true, hasEmptyState: true, hasSafetyNote: true }),
  m("sequence-currency",   "数列货币",          "Sequence Currency",   "SYSTEM", "/sequence-currency",   "PUBLIC",   "IMPORTANT", { hasSafetyNote: true, hasUsageExample: true, hasEmptyState: true }),
  m("encyclopedia",        "产品百科",          "Product Encyclopedia","SYSTEM", "/encyclopedia",        "PUBLIC",   "IMPORTANT", { hasUsageExample: true, hasEmptyState: true }),
  m("usage-examples",      "使用示例",          "Usage Examples",      "SYSTEM", "/usage-examples",      "PUBLIC",   "CORE",      { hasUsageExample: true, hasEmptyState: true, hasSubjectModeBadge: true }),
  // Quality
  m("software-qa",         "Software QA",       "Software QA",         "QUALITY", "/software-qa",       "ADVANCED", "IMPORTANT", { hasUsageExample: true, hasEmptyState: true, hasSafetyNote: true }),
  m("recalculation",       "重算中心",          "Recalculation",       "QUALITY", "/recalculation",     "ADVANCED", "IMPORTANT", { hasUsageExample: true, hasEmptyState: true, hasSafetyNote: true }),
  m("ui-update",           "UI 界面更新引擎",   "UI Update Engine",    "QUALITY", "/ui-update-engine",  "ADVANCED", "IMPORTANT", { hasSafetyNote: true, hasUsageExample: true, hasEmptyState: true }),
  m("interface-audit",     "界面审计",          "Interface Audit",     "QUALITY", "/interface-audit",   "ADVANCED", "IMPORTANT", { hasUsageExample: true, hasEmptyState: true }),
  // Founder
  m("founder-terminal",    "Founder Terminal",  "Founder Terminal",    "FOUNDER", "/founder-terminal",  "FOUNDER", "FOUNDER",   { hasSafetyNote: true }),
  m("founder",             "创始人控制台",      "Founder Console",     "FOUNDER", "/founder-console",   "FOUNDER", "FOUNDER",   { hasSafetyNote: true }),
];

export function getModule(moduleId: string): UIModuleDefinition | undefined {
  return UI_MODULE_REGISTRY.find((m) => m.moduleId === moduleId);
}

export function listModulesByCategory(category: UIModuleDefinition["category"]) {
  return UI_MODULE_REGISTRY.filter((m) => m.category === category);
}

export function listModulesForUserMode(userMode: UIRequiredUserMode): UIModuleDefinition[] {
  // PUBLIC sees PUBLIC only; ADVANCED sees PUBLIC + ADVANCED; FOUNDER sees all
  return UI_MODULE_REGISTRY.filter((m) => {
    if (userMode === "FOUNDER") return true;
    if (userMode === "ADVANCED") return m.requiredUserMode !== "FOUNDER";
    return m.requiredUserMode === "PUBLIC";
  });
}
