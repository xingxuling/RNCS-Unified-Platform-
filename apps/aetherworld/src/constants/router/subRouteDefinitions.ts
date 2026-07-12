/**
 * 子路由定义
 * Collapsible Sub-Router System
 */

import type { UserMode, SubjectMode } from "./routeGroups";

export interface SubRouteDefinition {
  routeId: string;
  groupId: string;
  subGroupId?: string;
  title: string;          // English / fallback
  chineseTitle: string;
  path: string;
  description?: string;
  requiredUserMode: UserMode;
  requiredSubjectMode?: SubjectMode;
  badge?: string;
  isCore?: boolean;
  isExperimental?: boolean;
  founderOnly?: boolean;
  hidden?: boolean;
  priority?: number;
}

export const SUB_ROUTES: SubRouteDefinition[] = [
  // ============ START ============
  { routeId: "free-answer",       groupId: "START", path: "/free-answer",       title: "Free Answer",       chineseTitle: "随便问",       requiredUserMode: "PUBLIC", isCore: true, priority: 10 },
  { routeId: "ask-sequence-ai",   groupId: "START", path: "/ask-sequence-ai",   title: "Ask Sequence AI",   chineseTitle: "数列 AI",      requiredUserMode: "PUBLIC", isCore: true, priority: 20 },
  { routeId: "onboarding",        groupId: "START", path: "/onboarding",        title: "Quick Start",       chineseTitle: "快速开始",     requiredUserMode: "PUBLIC", isCore: true, priority: 30 },
  { routeId: "subject-mode",      groupId: "START", path: "/subject-mode",      title: "Subject Mode",      chineseTitle: "主体模式",     requiredUserMode: "PUBLIC", priority: 40 },
  { routeId: "real-subject-setup",groupId: "START", path: "/real-subject-setup",title: "Real Subject Setup",chineseTitle: "真实主体设置", requiredUserMode: "PUBLIC", priority: 50 },

  // ============ CREATE ============
  { routeId: "model-generation",  groupId: "CREATE", path: "/model-generation", title: "Model Generation",  chineseTitle: "模型生成",     requiredUserMode: "PUBLIC", isCore: true, priority: 10 },
  { routeId: "narrative-engine",  groupId: "CREATE", path: "/narrative-engine", title: "Narrative Engine",  chineseTitle: "剧情文本",     requiredUserMode: "PUBLIC", isCore: true, priority: 20 },
  { routeId: "vocal-engine",      groupId: "CREATE", path: "/vocal-engine",     title: "Vocal Engine",      chineseTitle: "声乐引擎",     requiredUserMode: "PUBLIC", priority: 30 },
  { routeId: "translation-engine",groupId: "CREATE", path: "/translation-engine",title:"Translation Engine",chineseTitle: "翻译引擎",     requiredUserMode: "PUBLIC", priority: 40 },
  { routeId: "prompt-forge",      groupId: "CREATE", path: "/prompt-forge",     title: "Prompt Forge",      chineseTitle: "提示词锻造",   requiredUserMode: "ADVANCED", priority: 50 },
  { routeId: "code-generator",    groupId: "CREATE", path: "/code-generator",   title: "Code Generation",   chineseTitle: "代码生成",     requiredUserMode: "ADVANCED", priority: 60 },

  // ============ SEQUENCE ============
  { routeId: "sequence-language", groupId: "SEQUENCE", path: "/sequence-language",        title: "Sequence Language", chineseTitle: "数列解释器", requiredUserMode: "PUBLIC", isCore: true, priority: 5 },
  { routeId: "msl",               groupId: "SEQUENCE", path: "/mother-sequence-language", title: "MSL",               chineseTitle: "母体数列语言",requiredUserMode: "ADVANCED", priority: 10 },
  { routeId: "sequence-terminal", groupId: "SEQUENCE", path: "/sequence-terminal",        title: "Sequence Terminal", chineseTitle: "数列终端",   requiredUserMode: "ADVANCED", priority: 20 },
  { routeId: "sequence-currency", groupId: "SEQUENCE", path: "/sequence-currency",        title: "Sequence Currency", chineseTitle: "数列货币",   requiredUserMode: "ADVANCED", priority: 30 },
  { routeId: "hybrid-compression",groupId: "SEQUENCE", path: "/hybrid-compression",       title: "Hybrid Compression",chineseTitle: "黑白箱压缩", requiredUserMode: "ADVANCED", priority: 40 },
  { routeId: "constants-universe",groupId: "SEQUENCE", path: "/constants-universe",       title: "Constant Universe", chineseTitle: "常数宇宙",   requiredUserMode: "ADVANCED", priority: 50 },
  { routeId: "digit-constants",   groupId: "SEQUENCE", path: "/digit-constants",          title: "Digit Constants",   chineseTitle: "数字常数",   requiredUserMode: "FOUNDER",  priority: 60 },
  { routeId: "engine-constants",  groupId: "SEQUENCE", path: "/engine-constants",         title: "Engine Constants",  chineseTitle: "引擎常数",   requiredUserMode: "FOUNDER",  priority: 70 },
  { routeId: "constant-audit",    groupId: "SEQUENCE", path: "/constant-audit",           title: "Constant Audit",    chineseTitle: "常数审计",   requiredUserMode: "FOUNDER",  priority: 80 },

  // ============ WORLD_ENGINE / WORLD_CORE ============
  { routeId: "sequence-world",    groupId: "WORLD_ENGINE", subGroupId: "WORLD_CORE", path: "/sequence-world",     title: "Sequence World Engine", chineseTitle: "数列世界引擎", requiredUserMode: "PUBLIC", isCore: true, priority: 10 },
  { routeId: "world-simulation",  groupId: "WORLD_ENGINE", subGroupId: "WORLD_CORE", path: "/world-simulation",   title: "World Simulation",      chineseTitle: "世界模拟",     requiredUserMode: "PUBLIC", isCore: true, priority: 20 },
  { routeId: "world-runtime",     groupId: "WORLD_ENGINE", subGroupId: "WORLD_CORE", path: "/world-runtime",      title: "World Runtime",         chineseTitle: "世界运行时",   requiredUserMode: "ADVANCED", priority: 30 },
  { routeId: "world-causal-chain",groupId: "WORLD_ENGINE", subGroupId: "WORLD_CORE", path: "/world-causal-chain", title: "Causal Chain",          chineseTitle: "因果链",       requiredUserMode: "ADVANCED", priority: 40 },
  { routeId: "world-snapshots",   groupId: "WORLD_ENGINE", subGroupId: "WORLD_CORE", path: "/world-snapshots",    title: "World Snapshots",       chineseTitle: "世界快照",     requiredUserMode: "ADVANCED", priority: 50 },

  // WORLD_GROWTH
  { routeId: "world-growth",      groupId: "WORLD_ENGINE", subGroupId: "WORLD_GROWTH", path: "/world-growth",   title: "World Growth",   chineseTitle: "世界生长", requiredUserMode: "ADVANCED", priority: 10 },
  { routeId: "world-canon",       groupId: "WORLD_ENGINE", subGroupId: "WORLD_GROWTH", path: "/world-canon",    title: "World Canon",    chineseTitle: "世界正典", requiredUserMode: "ADVANCED", priority: 20 },
  { routeId: "world-timelines",   groupId: "WORLD_ENGINE", subGroupId: "WORLD_GROWTH", path: "/world-timelines",title: "World Timelines",chineseTitle: "世界时间线",requiredUserMode: "ADVANCED", priority: 30 },
  { routeId: "world-assets",      groupId: "WORLD_ENGINE", subGroupId: "WORLD_GROWTH", path: "/world-assets",   title: "World Assets",   chineseTitle: "世界资产", requiredUserMode: "ADVANCED", priority: 40 },
  { routeId: "world-rules",       groupId: "WORLD_ENGINE", subGroupId: "WORLD_GROWTH", path: "/world-rules",    title: "World Rules",    chineseTitle: "世界规则", requiredUserMode: "ADVANCED", priority: 50 },

  // WORLD_SOCIETY
  { routeId: "world-society",     groupId: "WORLD_ENGINE", subGroupId: "WORLD_SOCIETY", path: "/world-society",     title: "World Society",     chineseTitle: "世界社会",     requiredUserMode: "ADVANCED", priority: 10 },
  { routeId: "npc-agents",        groupId: "WORLD_ENGINE", subGroupId: "WORLD_SOCIETY", path: "/npc-agents",        title: "NPC Agents",        chineseTitle: "NPC 智能体",   requiredUserMode: "ADVANCED", priority: 20 },
  { routeId: "social-graph",      groupId: "WORLD_ENGINE", subGroupId: "WORLD_SOCIETY", path: "/social-graph",      title: "Social Graph",      chineseTitle: "社会关系图",   requiredUserMode: "ADVANCED", priority: 30 },
  { routeId: "world-factions",    groupId: "WORLD_ENGINE", subGroupId: "WORLD_SOCIETY", path: "/world-factions",    title: "World Factions",    chineseTitle: "世界阵营",     requiredUserMode: "ADVANCED", priority: 40 },
  { routeId: "world-institutions",groupId: "WORLD_ENGINE", subGroupId: "WORLD_SOCIETY", path: "/world-institutions",title: "World Institutions",chineseTitle: "制度组织",     requiredUserMode: "ADVANCED", priority: 50 },
  { routeId: "world-economy",     groupId: "WORLD_ENGINE", subGroupId: "WORLD_SOCIETY", path: "/world-economy",     title: "World Economy",     chineseTitle: "世界经济",     requiredUserMode: "ADVANCED", priority: 60 },
  { routeId: "world-beliefs",     groupId: "WORLD_ENGINE", subGroupId: "WORLD_SOCIETY", path: "/world-beliefs",     title: "World Beliefs",     chineseTitle: "世界信仰",     requiredUserMode: "ADVANCED", priority: 70 },
  { routeId: "civilization-phase",groupId: "WORLD_ENGINE", subGroupId: "WORLD_SOCIETY", path: "/civilization-phase",title: "Civilization Phase",chineseTitle: "文明阶段",     requiredUserMode: "ADVANCED", priority: 80 },

  // CIVILIZATION
  { routeId: "civilization-evolution", groupId: "WORLD_ENGINE", subGroupId: "CIVILIZATION", path: "/civilization-evolution", title: "Civilization Evolution", chineseTitle: "文明演化",     requiredUserMode: "ADVANCED", priority: 10 },
  { routeId: "historical-timeline",    groupId: "WORLD_ENGINE", subGroupId: "CIVILIZATION", path: "/historical-timeline",    title: "Historical Timeline",    chineseTitle: "历史时间线",   requiredUserMode: "ADVANCED", priority: 20 },
  { routeId: "civilization-chronicle", groupId: "WORLD_ENGINE", subGroupId: "CIVILIZATION", path: "/civilization-chronicle", title: "Civilization Chronicle", chineseTitle: "文明编年史",   requiredUserMode: "ADVANCED", priority: 30 },
  { routeId: "technology-tree",        groupId: "WORLD_ENGINE", subGroupId: "CIVILIZATION", path: "/technology-tree",        title: "Technology Tree",        chineseTitle: "技术树",       requiredUserMode: "ADVANCED", priority: 40 },
  { routeId: "war-peace",              groupId: "WORLD_ENGINE", subGroupId: "CIVILIZATION", path: "/war-peace",              title: "War & Peace",            chineseTitle: "战争与和平",   requiredUserMode: "ADVANCED", priority: 50 },
  { routeId: "civilization-myth",      groupId: "WORLD_ENGINE", subGroupId: "CIVILIZATION", path: "/civilization-myth",      title: "Civilization Myth",      chineseTitle: "文明神话",     requiredUserMode: "ADVANCED", priority: 60 },
  { routeId: "historical-figures",     groupId: "WORLD_ENGINE", subGroupId: "CIVILIZATION", path: "/historical-figures",     title: "Historical Figures",     chineseTitle: "历史人物",     requiredUserMode: "ADVANCED", priority: 70 },

  // PRESENTATION
  { routeId: "world-presentation",       groupId: "WORLD_ENGINE", subGroupId: "PRESENTATION", path: "/world-presentation",       title: "World Presentation",  chineseTitle: "世界表现",     requiredUserMode: "PUBLIC", isCore: true, priority: 10 },
  { routeId: "render-runtime",           groupId: "WORLD_ENGINE", subGroupId: "PRESENTATION", path: "/render-runtime",           title: "Render Runtime",      chineseTitle: "渲染运行时",   requiredUserMode: "ADVANCED", priority: 20 },
  { routeId: "semantic-physics-runtime", groupId: "WORLD_ENGINE", subGroupId: "PRESENTATION", path: "/semantic-physics-runtime", title: "Semantic Physics",    chineseTitle: "语义物理",     requiredUserMode: "ADVANCED", priority: 30 },
  { routeId: "animation-runtime",        groupId: "WORLD_ENGINE", subGroupId: "PRESENTATION", path: "/animation-runtime",        title: "Animation Runtime",   chineseTitle: "动画运行时",   requiredUserMode: "ADVANCED", priority: 40 },
  { routeId: "camera-language",          groupId: "WORLD_ENGINE", subGroupId: "PRESENTATION", path: "/camera-language",          title: "Camera Language",     chineseTitle: "镜头语言",     requiredUserMode: "ADVANCED", priority: 50 },
  { routeId: "world-audio",              groupId: "WORLD_ENGINE", subGroupId: "PRESENTATION", path: "/world-audio",              title: "World Audio",         chineseTitle: "世界声音",     requiredUserMode: "ADVANCED", priority: 60 },
  { routeId: "presentation-export",      groupId: "WORLD_ENGINE", subGroupId: "PRESENTATION", path: "/presentation-export",      title: "Presentation Export", chineseTitle: "表现层导出",   requiredUserMode: "ADVANCED", priority: 70 },

  // ============ KNOWLEDGE ============
  { routeId: "world-knowledge",   groupId: "KNOWLEDGE", path: "/world-knowledge",   title: "World Knowledge",  chineseTitle: "世界知识引擎", requiredUserMode: "PUBLIC", isCore: true, priority: 10 },
  { routeId: "knowledge-base",    groupId: "KNOWLEDGE", path: "/knowledge-base",    title: "Knowledge Base",   chineseTitle: "知识库",       requiredUserMode: "PUBLIC", priority: 20 },
  { routeId: "knowledge-sources", groupId: "KNOWLEDGE", path: "/knowledge-sources", title: "Knowledge Sources",chineseTitle: "知识来源",     requiredUserMode: "ADVANCED", priority: 30 },
  { routeId: "knowledge-audit",   groupId: "KNOWLEDGE", path: "/knowledge-audit",   title: "Knowledge Audit",  chineseTitle: "知识审计",     requiredUserMode: "ADVANCED", priority: 40 },
  { routeId: "encyclopedia",      groupId: "KNOWLEDGE", path: "/encyclopedia",      title: "Encyclopedia",     chineseTitle: "产品百科",     requiredUserMode: "PUBLIC", priority: 50 },
  { routeId: "usage-examples",    groupId: "KNOWLEDGE", path: "/usage-examples",    title: "Usage Examples",   chineseTitle: "使用示例",     requiredUserMode: "PUBLIC", priority: 60 },

  // ============ SYSTEM ============
  { routeId: "system-constitution",   groupId: "SYSTEM", path: "/system-constitution",     title: "System Constitution",      chineseTitle: "系统宪法",       requiredUserMode: "ADVANCED", isCore: true, priority: 10 },
  { routeId: "authority-hierarchy",   groupId: "SYSTEM", path: "/authority-hierarchy",     title: "Authority Hierarchy",      chineseTitle: "权限层级",       requiredUserMode: "ADVANCED", priority: 20 },
  { routeId: "subject-sovereignty",   groupId: "SYSTEM", path: "/subject-sovereignty",     title: "Subject Sovereignty",      chineseTitle: "主体主权",       requiredUserMode: "ADVANCED", priority: 30 },
  { routeId: "engine-obligations",    groupId: "SYSTEM", path: "/engine-obligations",      title: "Engine Obligations",       chineseTitle: "引擎义务",       requiredUserMode: "ADVANCED", priority: 40 },
  { routeId: "constitution-violations",groupId:"SYSTEM", path: "/constitution-violations", title: "Constitutional Violations",chineseTitle: "宪法违规",       requiredUserMode: "ADVANCED", priority: 50 },

  // ============ QUALITY ============
  { routeId: "software-qa",         groupId: "QUALITY", path: "/software-qa",         title: "Software QA",        chineseTitle: "软件质量",     requiredUserMode: "ADVANCED", isCore: true, priority: 10 },
  { routeId: "recalculation",       groupId: "QUALITY", path: "/recalculation",       title: "Recalculation",      chineseTitle: "重新计算",     requiredUserMode: "ADVANCED", priority: 20 },
  { routeId: "integration-audit",   groupId: "QUALITY", path: "/integration-audit",   title: "Integration Audit",  chineseTitle: "总集成审计",   requiredUserMode: "ADVANCED", priority: 30 },
  { routeId: "constant-audit-q",    groupId: "QUALITY", path: "/constant-audit",      title: "Constant Audit",     chineseTitle: "常数审计",     requiredUserMode: "ADVANCED", priority: 40 },
  { routeId: "compression-audit",   groupId: "QUALITY", path: "/compression-audit",   title: "Compression Audit",  chineseTitle: "压缩审计",     requiredUserMode: "ADVANCED", priority: 50 },
  { routeId: "currency-audit",      groupId: "QUALITY", path: "/currency-audit",      title: "Currency Audit",     chineseTitle: "货币审计",     requiredUserMode: "ADVANCED", priority: 60 },
  { routeId: "subroute-audit",      groupId: "QUALITY", path: "/subroute-audit",      title: "Sub-Route Audit",    chineseTitle: "子路由审计",   requiredUserMode: "ADVANCED", priority: 70 },

  // ============ FOUNDER ============
  { routeId: "founder-console",      groupId: "FOUNDER", path: "/founder-console",      title: "Founder Console",       chineseTitle: "创始人控制台", requiredUserMode: "FOUNDER", founderOnly: true, priority: 10 },
  { routeId: "founder-terminal",     groupId: "FOUNDER", path: "/founder-terminal",     title: "Founder Terminal",      chineseTitle: "创始人终端",   requiredUserMode: "FOUNDER", founderOnly: true, priority: 20 },
  { routeId: "founder-permissions",  groupId: "FOUNDER", path: "/founder-permissions",  title: "Founder Permissions",   chineseTitle: "权限矩阵",     requiredUserMode: "FOUNDER", founderOnly: true, priority: 30 },
  { routeId: "founder-audit",        groupId: "FOUNDER", path: "/founder-audit",        title: "Founder Audit",         chineseTitle: "操作日志",     requiredUserMode: "FOUNDER", founderOnly: true, priority: 40 },
  { routeId: "constant-versions",    groupId: "FOUNDER", path: "/constant-versions",    title: "Constant Versions",     chineseTitle: "常数版本",     requiredUserMode: "FOUNDER", founderOnly: true, priority: 50 },
];

export function getSubRoutesByGroup(groupId: string): SubRouteDefinition[] {
  return SUB_ROUTES
    .filter((r) => r.groupId === groupId && !r.hidden)
    .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));
}

export function getSubRoutesBySubGroup(subGroupId: string): SubRouteDefinition[] {
  return SUB_ROUTES
    .filter((r) => r.subGroupId === subGroupId && !r.hidden)
    .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));
}

export function findRouteByPath(path: string): SubRouteDefinition | undefined {
  return SUB_ROUTES.find((r) => r.path === path);
}
