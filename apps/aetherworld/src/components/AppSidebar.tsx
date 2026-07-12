import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, User, CalendarRange, GitBranch,
  Library, RefreshCcw, ScrollText, Sparkles,
  ShieldCheck, Layers, Radio, GitMerge, Activity, MapPin, Wand2,
  BookOpen, Globe, Brain, UserCheck, Rocket, GitPullRequestArrow, LifeBuoy, Bug, RotateCw, MonitorSmartphone,
  Compass, Boxes, Languages, Workflow, ListChecks, PlayCircle,
  Crown, KeyRound, ShieldAlert, BookMarked,
  Orbit, Globe2, Map, Swords, Users2, Network, GitGraph,
  Code2, PenLine, Cpu, Dna, Puzzle, Moon, Atom, FlaskConical, Lightbulb, Sun, Notebook, Footprints,
  HelpCircle, BookCopy, Eye, Binary, Terminal, ClipboardCheck, Languages as LangIcon,
  Music, Mic2, Music2,
  Hammer, FileCode2, Database, BookText, Drama, ScrollText as ScrollIcon, Gamepad2,
  MessageSquare, BotMessageSquare, Bot, MessagesSquare,
  Library as LibraryIcon, FolderTree, ClipboardList,
} from "lucide-react";

const NAV_KNOWLEDGE_BEGINNER = [
  { url: "/knowledge-base", title: "知识库", en: "Knowledge Base", icon: LibraryIcon },
  { url: "/vocabulary",     title: "词汇百科", en: "Vocabulary",    icon: BookCopy },
];
const NAV_KNOWLEDGE_ADVANCED = [
  { url: "/world-knowledge",    title: "世界知识引擎", en: "World Knowledge",   icon: LibraryIcon },
  { url: "/knowledge-base",     title: "知识库",       en: "Knowledge Base",    icon: BookMarked },
  { url: "/knowledge-sources",  title: "知识来源",     en: "Knowledge Sources", icon: FolderTree },
  { url: "/knowledge-audit",    title: "知识审计",     en: "Knowledge Audit",   icon: ClipboardList },
  { url: "/vocabulary",              title: "术语宇宙",     en: "Vocabulary",        icon: BookCopy },
  { url: "/vocabulary-categories",   title: "词汇分类",     en: "Categories",        icon: FolderTree },
  { url: "/vocabulary-relations",    title: "词汇关系",     en: "Relations",         icon: Network },
  { url: "/vocabulary-localization", title: "词汇本地化",   en: "Localization",      icon: Languages },
  { url: "/vocabulary-audit",        title: "词汇审计",     en: "Vocab Audit",       icon: ClipboardList },
];
const NAV_KNOWLEDGE_FOUNDER = [
  { url: "/world-knowledge",    title: "World Knowledge Engine", en: "Knowledge Console", icon: LibraryIcon },
  { url: "/knowledge-base",     title: "Knowledge Base",         en: "Knowledge Base",    icon: BookMarked },
  { url: "/knowledge-sources",  title: "Knowledge Sources",      en: "Sources",           icon: FolderTree },
  { url: "/knowledge-audit",    title: "Knowledge Audit",        en: "Audit",             icon: ClipboardList },
  { url: "/vocabulary",              title: "Vocabulary Codex Engine", en: "Codex",         icon: BookCopy },
  { url: "/vocabulary-categories",   title: "Vocabulary Categories",   en: "Categories",    icon: FolderTree },
  { url: "/vocabulary-relations",    title: "Vocabulary Relations",    en: "Relations",     icon: Network },
  { url: "/vocabulary-localization", title: "Vocabulary Localization", en: "Localization",  icon: Languages },
  { url: "/vocabulary-audit",        title: "Vocabulary Audit",        en: "Audit",         icon: ClipboardList },
];

const NAV_SEQ_OBJECT_BEGINNER = [
  { url: "/sequence-object-architecture", title: "对象生成", en: "Objects", icon: Boxes },
  { url: "/sequence-objects",              title: "我的对象", en: "My Objects", icon: Boxes },
];
const NAV_SEQ_OBJECT_ADVANCED = [
  { url: "/sequence-object-architecture", title: "数列对象架构", en: "Architecture", icon: Boxes },
  { url: "/sequence-object-compiler",     title: "对象编译器",   en: "Compiler",     icon: Hammer },
  { url: "/sequence-objects",             title: "数列对象",     en: "Objects",      icon: Boxes },
  { url: "/sequence-object-examples",     title: "对象示例",     en: "Examples",     icon: ListChecks },
  { url: "/sequence-object-audit",        title: "对象审计",     en: "Audit",        icon: ShieldCheck },
];
const NAV_SEQ_OBJECT_FOUNDER = [
  { url: "/sequence-object-architecture", title: "Sequence Object Architecture Engine", en: "Engine",   icon: Boxes },
  { url: "/sequence-object-compiler",     title: "Sequence Object Compiler",            en: "Compiler", icon: Hammer },
  { url: "/sequence-objects",             title: "Sequence Objects",                    en: "Objects",  icon: Boxes },
  { url: "/sequence-object-examples",     title: "Sequence Object Examples",            en: "Examples", icon: ListChecks },
  { url: "/sequence-object-audit",        title: "Sequence Object Audit",               en: "Audit",    icon: ShieldCheck },
];

const NAV_CROSS_FUNCTIONAL_BEGINNER = [
  { url: "/cross-functional-calculus",  title: "跨功能应用",       en: "Cross-Functional",  icon: Workflow },
  { url: "/cross-functional-workflows", title: "跨功能工作流",     en: "Workflows",         icon: GitMerge },
];
const NAV_CROSS_FUNCTIONAL_ADVANCED = [
  { url: "/cross-functional-calculus",  title: "功能跨域计算法",   en: "Cross-Functional Calculus", icon: Workflow },
  { url: "/cross-functional-workflows", title: "跨域工作流",       en: "Workflows",                 icon: GitMerge },
  { url: "/cross-functional-examples",  title: "跨域示例",         en: "Examples",                  icon: ListChecks },
  { url: "/cross-functional-audit",     title: "跨域审计",         en: "Cross-Func Audit",          icon: ShieldCheck },
];
const NAV_CROSS_FUNCTIONAL_FOUNDER = [
  { url: "/cross-functional-calculus",  title: "Cross-Functional Application Calculus", en: "Calculus",  icon: Workflow },
  { url: "/cross-functional-workflows", title: "Cross-Functional Workflows",            en: "Workflows", icon: GitMerge },
  { url: "/cross-functional-examples",  title: "Cross-Functional Examples",             en: "Examples",  icon: ListChecks },
  { url: "/cross-functional-audit",     title: "Cross-Functional Audit",                en: "Audit",     icon: ShieldCheck },
];

const NAV_MISSING_LAYER_ADVANCED = [
  { url: "/missing-layer-calculus",   title: "系统缺层识别",   en: "Missing-Layer Calculus", icon: ShieldCheck },
  { url: "/system-gap-map",           title: "系统缺口地图",   en: "System Gap Map",         icon: Boxes },
  { url: "/system-upgrade-planner",   title: "系统升级规划",   en: "Upgrade Planner",        icon: GitMerge },
  { url: "/missing-layer-audit",      title: "缺层审计",       en: "Missing-Layer Audit",    icon: ListChecks },
  { url: "/system-evolution-map",     title: "系统演化地图",   en: "System Evolution Map",   icon: Workflow },
];
const NAV_MISSING_LAYER_FOUNDER = [
  { url: "/missing-layer-calculus",   title: "Missing-Layer Detection Calculus", en: "Calculus",        icon: ShieldCheck },
  { url: "/system-gap-map",           title: "System Gap Map",                   en: "Gap Map",         icon: Boxes },
  { url: "/system-upgrade-planner",   title: "System Upgrade Planner",           en: "Upgrade Planner", icon: GitMerge },
  { url: "/missing-layer-audit",      title: "Missing-Layer Audit",              en: "Audit",           icon: ListChecks },
  { url: "/system-evolution-map",     title: "System Evolution Map",             en: "Evolution Map",   icon: Workflow },
];

const NAV_DIGITAL_ROLES_BEGINNER = [
  { url: "/digital-roles",          title: "数字团队",       en: "Digital Team",     icon: Workflow },
  { url: "/digital-role-examples",  title: "数字团队示例",   en: "Examples",         icon: ListChecks },
];
const NAV_DIGITAL_ROLES_ADVANCED = [
  { url: "/digital-roles",          title: "数字角色计算法", en: "Digital Roles",    icon: Workflow },
  { url: "/digital-team-workflow",  title: "数字团队工作流", en: "Team Workflow",    icon: GitMerge },
  { url: "/digital-role-entry",     title: "数字角色详情",   en: "Role Entry",       icon: Boxes },
  { url: "/digital-role-examples",  title: "数字角色示例",   en: "Examples",         icon: ListChecks },
  { url: "/digital-role-audit",     title: "数字角色审计",   en: "Audit",            icon: ShieldCheck },
];
const NAV_DIGITAL_ROLES_FOUNDER = [
  { url: "/digital-roles",          title: "Digital Role Calculus", en: "Calculus", icon: Workflow },
  { url: "/digital-team-workflow",  title: "Digital Team Workflow", en: "Workflow", icon: GitMerge },
  { url: "/digital-role-entry",     title: "Digital Role Entry",    en: "Entry",    icon: Boxes },
  { url: "/digital-role-examples",  title: "Digital Role Examples", en: "Examples", icon: ListChecks },
  { url: "/digital-role-audit",     title: "Digital Role Audit",    en: "Audit",    icon: ShieldCheck },
];

const NAV_APP_RUNTIME_BEGINNER = [
  { url: "/app-runtime",          title: "应用生成",       en: "App Runtime",  icon: Rocket },
  { url: "/app-projects",         title: "应用项目",       en: "Projects",     icon: FolderTree },
];
const NAV_APP_RUNTIME_ADVANCED = [
  { url: "/app-runtime",          title: "App Runtime",    en: "Runtime",      icon: Rocket },
  { url: "/app-projects",         title: "应用项目",       en: "Projects",     icon: FolderTree },
  { url: "/app-project-entry",    title: "项目详情",       en: "Project Entry",icon: FileCode2 },
  { url: "/app-preview",          title: "应用预览",       en: "Preview",      icon: Eye },
  { url: "/app-runtime-examples", title: "运行时示例",     en: "Examples",     icon: ListChecks },
  { url: "/app-runtime-audit",    title: "运行时审计",     en: "Audit",        icon: ShieldCheck },
];
const NAV_APP_RUNTIME_FOUNDER = [
  { url: "/app-runtime",          title: "Aether App Runtime", en: "Runtime",      icon: Rocket },
  { url: "/app-projects",         title: "App Projects",       en: "Projects",     icon: FolderTree },
  { url: "/app-project-entry",    title: "App Project Entry",  en: "Entry",        icon: FileCode2 },
  { url: "/app-preview",          title: "App Preview",        en: "Preview",      icon: Eye },
  { url: "/app-runtime-examples", title: "Runtime Examples",   en: "Examples",     icon: ListChecks },
  { url: "/app-runtime-audit",    title: "Runtime Audit",      en: "Audit",        icon: ShieldCheck },
];

const NAV_AGENT_BINDING_ADVANCED = [
  { url: "/agent-binding",           title: "Agent 绑定",        en: "Agent Binding",  icon: Workflow },
  { url: "/agent-binding-registry",  title: "Agent 绑定注册表",  en: "Registry",       icon: Boxes },
  { url: "/agent-binding-entry",     title: "Agent 绑定详情",    en: "Entry",          icon: FileCode2 },
  { url: "/agent-binding-examples",  title: "Agent 绑定示例",    en: "Examples",       icon: ListChecks },
  { url: "/agent-binding-audit",     title: "Agent 绑定审计",    en: "Audit",          icon: ShieldCheck },
];
const NAV_AGENT_BINDING_FOUNDER = [
  { url: "/agent-binding",           title: "Aether Agent Substrate", en: "Substrate", icon: Workflow },
  { url: "/agent-binding-registry",  title: "Binding Registry",       en: "Registry",  icon: Boxes },
  { url: "/agent-binding-entry",     title: "Binding Entry",          en: "Entry",     icon: FileCode2 },
  { url: "/agent-binding-examples",  title: "Binding Examples",       en: "Examples",  icon: ListChecks },
  { url: "/agent-binding-audit",     title: "Binding Audit",          en: "Audit",     icon: ShieldCheck },
];

const NAV_CODE_SANDBOX_ADVANCED = [
  { url: "/code-sandbox",          title: "代码运行桥",     en: "Code Sandbox",   icon: Terminal },
  { url: "/code-runs",             title: "运行记录",       en: "Runs",           icon: ClipboardList },
  { url: "/code-run-entry",        title: "运行详情",       en: "Run Entry",      icon: FileCode2 },
  { url: "/code-sandbox-examples", title: "沙箱示例",       en: "Examples",       icon: ListChecks },
  { url: "/code-sandbox-audit",    title: "沙箱审计",       en: "Audit",          icon: ShieldCheck },
];
const NAV_CODE_SANDBOX_FOUNDER = [
  { url: "/code-sandbox",          title: "Aether Code Sandbox Bridge", en: "Bridge",   icon: Terminal },
  { url: "/code-runs",             title: "Code Runs",                  en: "Runs",     icon: ClipboardList },
  { url: "/code-run-entry",        title: "Code Run Entry",             en: "Entry",    icon: FileCode2 },
  { url: "/code-sandbox-examples", title: "Code Sandbox Examples",      en: "Examples", icon: ListChecks },
  { url: "/code-sandbox-audit",    title: "Code Sandbox Audit",         en: "Audit",    icon: ShieldCheck },
];

const NAV_WEBLLM_ADVANCED = [
  { url: "/webllm-runtime",       title: "WebLLM 本地 AI",   en: "WebLLM Runtime",  icon: Brain },
  { url: "/webllm-models",        title: "WebLLM 模型",      en: "Models",          icon: Boxes },
  { url: "/webllm-test",          title: "WebLLM 测试",      en: "Test",            icon: PlayCircle },
  { url: "/webllm-neuro-control", title: "神经启发控制层",    en: "Neuro Control",   icon: Brain },
  { url: "/webllm-examples",      title: "WebLLM 示例",      en: "Examples",        icon: ListChecks },
  { url: "/webllm-audit",         title: "WebLLM 审计",      en: "Audit",           icon: ShieldCheck },
];
const NAV_WEBLLM_FOUNDER = [
  { url: "/webllm-runtime",       title: "Aether WebLLM Runtime",     en: "Runtime",       icon: Brain },
  { url: "/webllm-models",        title: "WebLLM Models",             en: "Models",        icon: Boxes },
  { url: "/webllm-test",          title: "WebLLM Test",               en: "Test",          icon: PlayCircle },
  { url: "/webllm-neuro-control", title: "Neuro-Inspired Control",    en: "Neuro Control", icon: Brain },
  { url: "/webllm-examples",      title: "WebLLM Examples",           en: "Examples",      icon: ListChecks },
  { url: "/webllm-audit",         title: "WebLLM Audit",              en: "Audit",         icon: ShieldCheck },
];

const NAV_WEBLCM_ADVANCED = [
  { url: "/weblcm-runtime",        title: "WebLCM 概念运行时", en: "WebLCM Runtime", icon: Brain },
  { url: "/weblcm-concepts",       title: "WebLCM 概念库",     en: "Concepts",       icon: ListChecks },
  { url: "/weblcm-concept-graph",  title: "WebLCM 概念图谱",   en: "Concept Graph",  icon: Boxes },
  { url: "/weblcm-concept-search", title: "WebLCM 概念检索",   en: "Concept Search", icon: PlayCircle },
  { url: "/weblcm-examples",       title: "WebLCM 示例",       en: "Examples",       icon: ListChecks },
  { url: "/weblcm-audit",          title: "WebLCM 审计",       en: "Audit",          icon: ShieldCheck },
];
const NAV_WEBLCM_FOUNDER = [
  { url: "/weblcm-runtime",        title: "Aether WebLCM Runtime", en: "Runtime",        icon: Brain },
  { url: "/weblcm-concepts",       title: "WebLCM Concepts",       en: "Concepts",       icon: ListChecks },
  { url: "/weblcm-concept-graph",  title: "WebLCM Concept Graph",  en: "Concept Graph",  icon: Boxes },
  { url: "/weblcm-concept-search", title: "WebLCM Concept Search", en: "Concept Search", icon: PlayCircle },
  { url: "/weblcm-examples",       title: "WebLCM Examples",       en: "Examples",       icon: ListChecks },
  { url: "/weblcm-audit",          title: "WebLCM Audit",          en: "Audit",          icon: ShieldCheck },
];

const NAV_WEB_KNOWLEDGE_TRINITY_ADVANCED = [
  { url: "/web-knowledge-trinity", title: "Web 知识三体",     en: "Knowledge Trinity", icon: Brain },
  { url: "/weblkm-runtime",        title: "WebLKM 知识模型",  en: "WebLKM",            icon: ListChecks },
  { url: "/webcm-runtime",         title: "WebCM 计算法模型", en: "WebCM",             icon: Boxes },
  { url: "/webcom-runtime",        title: "WebCoM 常数模型",  en: "WebCoM",            icon: ShieldCheck },
  { url: "/web-knowledge-search",  title: "知识检索",         en: "Search",            icon: PlayCircle },
  { url: "/web-knowledge-examples",title: "三体示例",         en: "Examples",          icon: ListChecks },
  { url: "/web-knowledge-audit",   title: "三体审计",         en: "Audit",             icon: ShieldCheck },
];
const NAV_WEB_KNOWLEDGE_TRINITY_FOUNDER = [
  { url: "/web-knowledge-trinity", title: "Aether Web Knowledge Trinity", en: "Trinity",  icon: Brain },
  { url: "/weblkm-runtime",        title: "WebLKM Runtime",               en: "WebLKM",   icon: ListChecks },
  { url: "/webcm-runtime",         title: "WebCM Runtime",                en: "WebCM",    icon: Boxes },
  { url: "/webcom-runtime",        title: "WebCoM Runtime",               en: "WebCoM",   icon: ShieldCheck },
  { url: "/web-knowledge-search",  title: "Knowledge Search",             en: "Search",   icon: PlayCircle },
  { url: "/web-knowledge-examples",title: "Trinity Examples",             en: "Examples", icon: ListChecks },
  { url: "/web-knowledge-audit",   title: "Trinity Audit",                en: "Audit",    icon: ShieldCheck },
];

const NAV_WEB_CAPABILITY_ADVANCED = [
  { url: "/web-capabilities",        title: "Web 能力模型",   en: "Capabilities", icon: Brain },
  { url: "/web-capability-run",      title: "运行能力模型",   en: "Run",          icon: PlayCircle },
  { url: "/web-capability-examples", title: "能力模型示例",   en: "Examples",     icon: ListChecks },
  { url: "/web-capability-audit",    title: "能力模型审计",   en: "Audit",        icon: ShieldCheck },
];
const NAV_WEB_CAPABILITY_FOUNDER = [
  { url: "/web-capabilities",        title: "WebXX Capability Models", en: "Capabilities", icon: Brain },
  { url: "/web-capability-run",      title: "Web Capability Run",      en: "Run",          icon: PlayCircle },
  { url: "/web-capability-examples", title: "Web Capability Examples", en: "Examples",     icon: ListChecks },
  { url: "/web-capability-audit",    title: "Web Capability Audit",    en: "Audit",        icon: ShieldCheck },
];


const NAV_TERMINAL_BEGINNER = [
  { url: "/sequence-terminal", title: "高级终端（锁定）", en: "Advanced Terminal", icon: Terminal },
];

const NAV_TERMINAL_ADVANCED = [
  { url: "/sequence-terminal", title: "数列终端",   en: "Sequence Terminal", icon: Terminal },
  { url: "/msl-terminal",      title: "MSL 终端",   en: "MSL Terminal",      icon: Binary },
];
const NAV_TERMINAL_FOUNDER = [
  { url: "/sequence-terminal", title: "Sequence Terminal", en: "Sequence Terminal", icon: Terminal },
  { url: "/msl-terminal",      title: "MSL Terminal",      en: "MSL Terminal",      icon: Binary },
  { url: "/founder-terminal",  title: "Founder Terminal",  en: "Founder Terminal",  icon: Crown },
];

const NAV_CURRENCY_BEGINNER = [
  { url: "/sequence-currency", title: "积分与贡献", en: "Credits", icon: Sparkles },
];
const NAV_CURRENCY_ADVANCED = [
  { url: "/sequence-currency", title: "数列价值",   en: "Sequence Currency", icon: Sparkles },
  { url: "/value-ledger",      title: "价值账本",   en: "Value Ledger",      icon: ClipboardList },
  { url: "/world-resources",   title: "世界资源",   en: "World Resources",   icon: Boxes },
  { url: "/currency-audit",    title: "货币审计",   en: "Currency Audit",    icon: ShieldCheck },
];
const NAV_CURRENCY_FOUNDER = [
  { url: "/sequence-currency", title: "Sequence Currency Engine", en: "Currency Engine", icon: Sparkles },
  { url: "/value-ledger",      title: "Value Ledger",             en: "Ledger",          icon: ClipboardList },
  { url: "/world-resources",   title: "World Resources",          en: "Resources",       icon: Boxes },
  { url: "/currency-audit",    title: "Currency Audit",           en: "Audit",           icon: ShieldCheck },
];

const NAV_COMPRESSION_BEGINNER = [
  { url: "/output-compression", title: "输出压缩", en: "Output Compression", icon: Layers },
];
const NAV_COMPRESSION_ADVANCED = [
  { url: "/output-compression",   title: "输出压缩",     en: "Output Compression", icon: Layers },
  { url: "/hybrid-compression",   title: "黑白箱压缩",   en: "Hybrid Compression", icon: Layers },
  { url: "/compression-audit",    title: "压缩审计",     en: "Compression Audit",  icon: ShieldCheck },
];
const NAV_COMPRESSION_FOUNDER = [
  { url: "/hybrid-compression", title: "Hybrid Compression Engine", en: "HBW Engine",        icon: Layers },
  { url: "/output-compression", title: "Output Compression",        en: "Output",            icon: Layers },
  { url: "/compression-audit",  title: "Compression Audit",         en: "Audit",             icon: ShieldCheck },
];

const NAV_FREE_INPUT_BEGINNER = [
  { url: "/free-answer", title: "随便问", en: "Free Answer", icon: MessagesSquare },
];
const NAV_FREE_INPUT_ADVANCED = [
  { url: "/free-input",  title: "自由输入", en: "Free Input",  icon: MessagesSquare },
  { url: "/free-answer", title: "自由解答", en: "Free Answer", icon: MessageSquare },
];
const NAV_FREE_INPUT_FOUNDER = [
  { url: "/free-input",  title: "Freeform Engine Console", en: "Free Input",  icon: MessagesSquare },
  { url: "/free-answer", title: "Free Answer",              en: "Free Answer", icon: MessageSquare },
];

const NAV_SEQUENCE_AI_BEGINNER = [
  { url: "/ask-sequence-ai", title: "问数列 AI", en: "Ask Sequence AI", icon: MessageSquare },
];
const NAV_SEQUENCE_AI_ADVANCED = [
  { url: "/sequence-ai",     title: "Sequence AI",  en: "Sequence AI",      icon: BotMessageSquare },
  { url: "/ask-sequence-ai", title: "问数列 AI",    en: "Ask Sequence AI",  icon: MessageSquare },
];
const NAV_SEQUENCE_AI_FOUNDER = [
  { url: "/sequence-ai",     title: "Sequence AI Console", en: "Sequence AI", icon: Bot },
  { url: "/ask-sequence-ai", title: "Ask Sequence AI",      en: "Ask",         icon: MessageSquare },
];

const NAV_NARRATIVE_BEGINNER = [
  { url: "/narrative-engine", title: "写剧情", en: "Write Story", icon: BookText },
];
const NAV_NARRATIVE_ADVANCED = [
  { url: "/narrative-engine", title: "剧情文本引擎", en: "Narrative Engine", icon: BookText },
  { url: "/comic-script",     title: "漫画脚本",     en: "Comic Script",     icon: Drama },
  { url: "/game-quest-text",  title: "游戏任务文本", en: "Game Quest Text",  icon: Gamepad2 },
];
const NAV_NARRATIVE_FOUNDER = [
  { url: "/story-forge",      title: "Aether Narrative Engine", en: "Story Forge", icon: ScrollIcon },
  { url: "/narrative-engine", title: "Narrative Engine",        en: "Narrative",   icon: BookText },
  { url: "/comic-script",     title: "Comic Script",            en: "Comic",       icon: Drama },
  { url: "/game-quest-text",  title: "Game Quest Text",         en: "Quest Text",  icon: Gamepad2 },
];

const NAV_VOCAL_BEGINNER = [
  { url: "/vocal-engine", title: "声乐 / 歌曲", en: "Vocal & Song", icon: Music },
];
const NAV_VOCAL_ADVANCED = [
  { url: "/vocal-engine",    title: "声乐引擎",     en: "Vocal Engine",      icon: Music },
  { url: "/voice-profile",   title: "声线画像",     en: "Voice Profile",     icon: Mic2 },
  { url: "/ai-music-prompt", title: "AI 音乐提示词", en: "AI Music Prompt",  icon: Music2 },
];
const NAV_VOCAL_FOUNDER = [
  { url: "/vocal-engine",    title: "Aether Vocal Engine", en: "Vocal Console",  icon: Music },
  { url: "/voice-profile",   title: "Voice Profile",       en: "Voice Profile",  icon: Mic2 },
  { url: "/ai-music-prompt", title: "AI Music Prompt",     en: "AI Music Prompt", icon: Music2 },
];

const NAV_MODEL_GEN_BEGINNER = [
  { url: "/model-generation", title: "生成模型", en: "Model Generation", icon: FileCode2 },
];
const NAV_MODEL_GEN_ADVANCED = [
  { url: "/model-generation", title: "模型生成引擎", en: "Model Generation", icon: FileCode2 },
  { url: "/model-registry",   title: "模型注册表",   en: "Model Registry",   icon: Database },
];
const NAV_MODEL_GEN_FOUNDER = [
  { url: "/model-forge",      title: "Aether Model Forge", en: "Model Forge",      icon: Hammer },
  { url: "/model-generation", title: "Model Generation",   en: "Model Generation", icon: FileCode2 },
  { url: "/model-registry",   title: "Model Registry",     en: "Model Registry",   icon: Database },
];
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { isBeginnerMode } from "@/constants/onboardingUserStates";
import { onDataChange } from "@/lib/store";
import { useFounderState } from "@/hooks/useFounderState";
import { FounderModeBadge } from "@/components/FounderModeBadge";
import { CollapsibleSidebarGroup } from "@/components/router/CollapsibleSidebarGroup";
import type { PermissionContext } from "@/lib/router/subRoutePermissionGuard";

const NAV_START = [
  { url: "/onboarding",       title: "快速开始",       en: "Start Here",         icon: PlayCircle },
  { url: "/world-generator",  title: "生成我的世界",   en: "Personal World",     icon: Globe2 },
  { url: "/virtual-world",    title: "生成我的虚拟世界", en: "Virtual World OS",  icon: Globe2 },
];

const NAV_WORLD = [
  { url: "/world-generator", title: "宇宙世界生成模型", en: "World Generator",   icon: Orbit },
  { url: "/personal-world",  title: "我的个人世界",     en: "Personal World",    icon: Globe2 },
];

const NAV_VIRTUAL = [
  { url: "/virtual-world",   title: "虚拟世界总览",  en: "Virtual World OS",  icon: Globe2 },
  { url: "/world-map",       title: "世界地图",      en: "World Map",         icon: Map },
  { url: "/world-character", title: "角色生成",      en: "Character",         icon: UserCheck },
  { url: "/world-quests",    title: "任务板",        en: "Quest Board",       icon: Swords },
  { url: "/world-npcs",      title: "NPC 关系网",    en: "NPC Network",       icon: Users2 },
  { url: "/world-causality", title: "世界因果链",    en: "Causality",         icon: GitGraph },
];

const NAV_OS = [
  { url: "/",             title: "主控台",        en: "Dashboard",          icon: LayoutDashboard },
  { url: "/subject-mode", title: "主体模式",      en: "Subject Mode",       icon: UserCheck },
  { url: "/real-subject-setup", title: "真实主体设置", en: "Real Subject Setup", icon: User },
  { url: "/subject",      title: "我的数字模型",  en: "Subject Seed Core",  icon: User },
  { url: "/real-subject", title: "我的深度模型",  en: "Private Model",      icon: UserCheck },
  { url: "/calendar",     title: "触发日历",      en: "Trigger Calendar",   icon: CalendarRange },
  { url: "/timeline",     title: "未来时间线",    en: "Time-Field Engine",  icon: GitBranch },
];

const NAV_CORE = [
  { url: "/advanced-core",   title: "综合判断",     en: "Advanced Core",         icon: Layers },
  { url: "/signal",          title: "信号可信度",   en: "Signal Quality",        icon: ShieldCheck },
  { url: "/resonance",       title: "共振锁定",     en: "Resonance Lock",        icon: Radio },
  { url: "/branch-collapse", title: "可能性收束",   en: "Convergence",           icon: GitMerge },
  { url: "/vitality",        title: "产品活性",     en: "Product Vitality",      icon: Activity },
  { url: "/geo",             title: "地理因素",     en: "Geo-Factor",            icon: MapPin },
  { url: "/prompt-forge",    title: "AI 指令生成",  en: "Prompt Forge",          icon: Wand2 },
  { url: "/abstract-prompt-forge", title: "抽象提示词", en: "Abstract Forge",     icon: Workflow },
  { url: "/prediction-dimensions", title: "事情类型", en: "Dimensions",          icon: Compass },
  { url: "/event-algorithms",      title: "可能事件", en: "Events",              icon: Boxes },
  { url: "/event-library-audit",   title: "事件库审计", en: "Event Audit",       icon: ListChecks },
];

const NAV_META = [
  { url: "/constants",         title: "常数库",      en: "Constants",          icon: Library },
  { url: "/constants-universe",title: "常数宇宙 v0.2", en: "Constant Universe",  icon: Boxes },
  { url: "/digit-constants",   title: "数字常数",    en: "Digit Constants",    icon: Boxes },
  { url: "/engine-constants",  title: "引擎常数",    en: "Engine Constants",   icon: Boxes },
  { url: "/constant-audit",    title: "常数审计",    en: "Constant Audit",     icon: Boxes },
  { url: "/constant-versions", title: "常数版本",    en: "Constant Versions",  icon: Boxes },
  { url: "/feedback",         title: "记录中心",    en: "Review Center",      icon: RefreshCcw },
  { url: "/feedback-weights", title: "记录权重",    en: "Weight Engine",      icon: Brain },
  { url: "/accuracy",         title: "预测有效率",  en: "Accuracy Metrics",   icon: Activity },
  { url: "/recalculation",    title: "重算中心",    en: "Recalculation",       icon: RotateCw },
  { url: "/constitution",         title: "系统宪法",       en: "Constitution",        icon: ScrollText },
  { url: "/system-constitution",  title: "系统宪法 v0.2",  en: "System Constitution", icon: ScrollText },
  { url: "/authority-hierarchy",  title: "权限层级",       en: "Authority Hierarchy", icon: ShieldAlert },
  { url: "/subject-sovereignty",  title: "主体主权",       en: "Subject Sovereignty", icon: UserCheck },
  { url: "/engine-obligations",   title: "引擎义务",       en: "Engine Obligations",  icon: Workflow },
  { url: "/constitution-violations", title: "宪法违规",    en: "Violations",          icon: ShieldCheck },
];

const NAV_DOCS = [
  { url: "/docs",              title: "产品文档",  en: "Documentation",       icon: BookOpen },
  { url: "/encyclopedia",      title: "产品百科",  en: "Encyclopedia",        icon: BookMarked },
  { url: "/usage-safety",      title: "使用与安全", en: "Usage & Safety",      icon: LifeBuoy },
  { url: "/regional-ux",       title: "地区体验",  en: "Regional UX",         icon: Globe },
  { url: "/beta-launch",       title: "内测发布",  en: "Beta Launch",         icon: Rocket },
  { url: "/version-iteration", title: "版本迭代",  en: "Version Iteration",   icon: GitPullRequestArrow },
  { url: "/software-qa",       title: "软件测试",  en: "Software QA",         icon: Bug },
  { url: "/ui-fit",            title: "多端适配",  en: "UI Fit",              icon: MonitorSmartphone },
  { url: "/language-fit",      title: "语言适配",  en: "Language Fit",        icon: Languages },
];

const NAV_FOUNDER = [
  { url: "/founder-console",     title: "创始人控制台", en: "Founder Console",     icon: Crown },
  { url: "/founder-permissions", title: "权限矩阵",     en: "Founder Permissions", icon: ShieldAlert },
  { url: "/founder-audit",       title: "操作日志",     en: "Audit Log",           icon: KeyRound },
];

const NAV_FOUNDER_LOCKED = [
  { url: "/founder", title: "🔒 创始人模式", en: "Founder Gate · Locked", icon: Crown },
];

const NAV_GENERATION_OS = [
  { url: "/generation-os",  title: "生成 OS 总览", en: "Generation OS",   icon: Cpu },
  { url: "/copy-generator", title: "文案生成",     en: "Copy Generator",  icon: PenLine },
];

const NAV_GENERATION_OS_FOUNDER = [
  { url: "/generation-os",  title: "生成 OS 总览", en: "Generation OS",   icon: Cpu },
  { url: "/code-generator", title: "代码生成",     en: "Code Generator",  icon: Code2 },
  { url: "/copy-generator", title: "文案生成",     en: "Copy Generator",  icon: PenLine },
];

const NAV_BIO_EVOLUTION_BEGINNER = [
  { url: "/bio-evolution",        title: "我的 App 进化", en: "My App Evolves",      icon: Dna },
  { url: "/personal-app-profile", title: "个人 App 配置", en: "Personal App",        icon: Sparkles },
];

const NAV_BIO_EVOLUTION_ADVANCED = [
  { url: "/bio-evolution",        title: "产品自进化",     en: "Bio-Product Evolution", icon: Dna },
  { url: "/personal-app-profile", title: "个人 App 配置",  en: "Personal App Profile",  icon: Sparkles },
];

const NAV_BREAKTHROUGH_BEGINNER = [
  { url: "/reality-solver", title: "问题拆解器", en: "Reality Solver", icon: Puzzle },
];

const NAV_BREAKTHROUGH_ADVANCED = [
  { url: "/universal-breakthrough", title: "万物破解", en: "Universal Breakthrough", icon: Puzzle },
  { url: "/reality-solver",         title: "问题拆解器", en: "Reality Solver",        icon: Puzzle },
];

const NAV_BREAKTHROUGH_FOUNDER = [
  { url: "/universal-breakthrough", title: "Universal Breakthrough Calculus", en: "Breakthrough Console", icon: Puzzle },
  { url: "/reality-solver",         title: "问题拆解器", en: "Reality Solver", icon: Puzzle },
];

const NAV_RECALL_BEGINNER = [
  { url: "/subconscious-recall", title: "深层记忆记录", en: "Subconscious Recall", icon: Moon },
];

const NAV_RECALL_ADVANCED = [
  { url: "/subconscious-recall", title: "潜意识材料库", en: "Subconscious Recall", icon: Moon },
  { url: "/past-life-recall",    title: "前世感记忆",   en: "Past-Life Recall",   icon: Brain },
];

const NAV_RECALL_FOUNDER = [
  { url: "/past-life-recall",    title: "Past-Life / Archetypal Memory Engine", en: "Recall Engine", icon: Brain },
  { url: "/subconscious-recall", title: "潜意识材料库", en: "Subconscious Recall", icon: Moon },
];

const NAV_CREATION_BEGINNER = [
  { url: "/creation-simulator", title: "创造模拟器", en: "Creation Simulator", icon: Lightbulb },
];

const NAV_CREATION_ADVANCED = [
  { url: "/virtual-creation",         title: "虚拟创造物计算法", en: "Virtual Creation",        icon: FlaskConical },
  { url: "/reality-science-universe", title: "现实科学宇宙常数", en: "Reality Science Universe", icon: Atom },
  { url: "/creation-simulator",       title: "创造模拟器",       en: "Creation Simulator",       icon: Lightbulb },
];

const NAV_CREATION_FOUNDER = [
  { url: "/virtual-creation",         title: "Virtual Creation Calculus", en: "Creation Console",   icon: FlaskConical },
  { url: "/reality-science-universe", title: "Reality Science Universe",  en: "Science Constants",  icon: Atom },
  { url: "/creation-simulator",       title: "创造模拟器",                 en: "Creation Simulator", icon: Lightbulb },
];

const NAV_VIRTUAL_LIFE_BEGINNER = [
  { url: "/virtual-life",    title: "虚拟生活",      en: "Virtual Life",    icon: Footprints },
  { url: "/virtual-day",     title: "今天",          en: "Virtual Day",     icon: Sun },
  { url: "/virtual-journal", title: "生活日记",      en: "Journal",         icon: Notebook },
];

const NAV_VIRTUAL_LIFE_ADVANCED = [
  { url: "/virtual-life",    title: "Virtual Life OS", en: "Virtual Life OS", icon: Footprints },
  { url: "/virtual-day",     title: "虚拟的一天",      en: "Virtual Day",     icon: Sun },
  { url: "/virtual-journal", title: "虚拟生活日记",    en: "Virtual Journal", icon: Notebook },
];

const NAV_VIRTUAL_LIFE_FOUNDER = [
  { url: "/virtual-life",    title: "Virtual Life Calculus", en: "Life Console",    icon: Footprints },
  { url: "/virtual-day",     title: "Virtual Day",           en: "Virtual Day",     icon: Sun },
  { url: "/virtual-journal", title: "Virtual Journal",       en: "Virtual Journal", icon: Notebook },
];

const NAV_USAGE_BEGINNER = [
  { url: "/usage-examples", title: "使用示例",  en: "Usage Examples", icon: HelpCircle },
];
const NAV_USAGE_ADVANCED = [
  { url: "/usage-examples",  title: "使用示例", en: "Usage Examples", icon: HelpCircle },
  { url: "/example-library", title: "示例库",   en: "Example Library", icon: BookCopy },
];
const NAV_USAGE_FOUNDER = [
  { url: "/usage-examples",  title: "Usage Example Calculus", en: "Usage Example Console", icon: HelpCircle },
  { url: "/example-library", title: "示例库",                  en: "Example Library",       icon: BookCopy },
];

const NAV_ONTOLOGY_BEGINNER = [
  { url: "/thing-itself", title: "看清一个东西", en: "Thing Itself", icon: Eye },
];
const NAV_ONTOLOGY_ADVANCED = [
  { url: "/thing-itself",    title: "万物本身",   en: "Thing Itself",     icon: Eye },
  { url: "/object-ontology", title: "对象本体",   en: "Object Ontology",  icon: Layers },
  { url: "/object-essence",  title: "本质读取器", en: "Essence Reader",   icon: Sparkles },
];
const NAV_ONTOLOGY_FOUNDER = [
  { url: "/thing-itself",    title: "Thing-Itself Calculus", en: "Ontology Console", icon: Eye },
  { url: "/object-ontology", title: "对象本体",               en: "Object Ontology",  icon: Layers },
  { url: "/object-essence",  title: "本质读取器",             en: "Essence Reader",   icon: Sparkles },
];

const NAV_SEQUENCE_WORLD_BEGINNER = [
  { url: "/sequence-world", title: "生成世界逻辑", en: "Sequence World", icon: Orbit },
];
const NAV_SEQUENCE_WORLD_ADVANCED = [
  { url: "/sequence-world", title: "数列世界引擎", en: "Sequence World Engine", icon: Orbit },
  { url: "/world-engine",   title: "世界引擎 SDK", en: "World Engine SDK",     icon: Cpu },
  { url: "/engine-export",  title: "引擎导出",     en: "Engine Export",        icon: GitPullRequestArrow },
];
const NAV_SEQUENCE_WORLD_FOUNDER = [
  { url: "/sequence-world", title: "Aether Sequence World Engine SDK", en: "SDK Console", icon: Orbit },
  { url: "/world-engine",   title: "World Engine SDK", en: "World Engine SDK", icon: Cpu },
  { url: "/engine-export",  title: "Engine Export",    en: "Engine Export",    icon: GitPullRequestArrow },
];

const NAV_WORLD_SIM_BEGINNER = [
  { url: "/world-simulation", title: "模拟世界", en: "World Simulation", icon: Orbit },
  { url: "/world-growth",     title: "世界生长", en: "World Growth",     icon: Sparkles },
];
const NAV_WORLD_SIM_ADVANCED = [
  { url: "/world-simulation",   title: "数列世界模拟",  en: "World Simulation",  icon: Orbit },
  { url: "/world-growth",       title: "世界生长 v0.3", en: "World Growth",      icon: Sparkles },
  { url: "/world-canon",        title: "世界正典",      en: "World Canon",       icon: BookMarked },
  { url: "/world-rules",        title: "世界规则",      en: "World Rules",       icon: ShieldCheck },
  { url: "/world-timelines",    title: "世界时间线",    en: "Timelines",         icon: GitBranch },
  { url: "/world-assets",       title: "世界资产",      en: "World Assets",      icon: Database },
  { url: "/world-runtime",      title: "世界运行时",    en: "World Runtime",     icon: GitPullRequestArrow },
  { url: "/world-causal-chain", title: "因果链",        en: "Causal Chain",      icon: GitGraph },
  { url: "/world-snapshots",    title: "世界快照",      en: "Snapshots",         icon: Layers },
];
const NAV_WORLD_SIM_FOUNDER = [
  { url: "/world-simulation",   title: "Sequence World Simulation Core", en: "Simulation Core", icon: Orbit },
  { url: "/world-growth",       title: "Self-Growing World OS",          en: "World Growth",    icon: Sparkles },
  { url: "/world-canon",        title: "World Canon",                    en: "Canon",           icon: BookMarked },
  { url: "/world-rules",        title: "World Rules",                    en: "Rules",           icon: ShieldCheck },
  { url: "/world-timelines",    title: "World Timelines",                en: "Timelines",       icon: GitBranch },
  { url: "/world-assets",       title: "World Asset Registry",           en: "Assets",          icon: Database },
  { url: "/world-runtime",      title: "World Runtime Export",           en: "Runtime",         icon: GitPullRequestArrow },
  { url: "/world-causal-chain", title: "Causal Chain",                   en: "Causal",          icon: GitGraph },
  { url: "/world-snapshots",    title: "World Snapshots",                en: "Snapshots",       icon: Layers },
];

const NAV_WORLD_SOCIETY_BEGINNER = [
  { url: "/world-society",  title: "世界社会", en: "World Society", icon: Orbit },
];
const NAV_WORLD_SOCIETY_ADVANCED = [
  { url: "/world-society",       title: "世界智能体社会", en: "World Agent Society", icon: Orbit },
  { url: "/npc-agents",          title: "NPC 智能体",     en: "NPC Agents",          icon: Cpu },
  { url: "/social-graph",        title: "社会关系图",     en: "Social Graph",        icon: GitGraph },
  { url: "/world-factions",      title: "世界阵营",       en: "Factions",            icon: ShieldCheck },
  { url: "/world-institutions",  title: "制度组织",       en: "Institutions",        icon: BookMarked },
  { url: "/world-economy",       title: "世界经济",       en: "Economy",             icon: Database },
  { url: "/world-beliefs",       title: "世界信仰",       en: "Beliefs",             icon: Sparkles },
  { url: "/civilization-phase",  title: "文明阶段",       en: "Civilization Phase",  icon: Layers },
];
const NAV_WORLD_SOCIETY_FOUNDER = [
  { url: "/world-society",       title: "World Agent Society Core", en: "Agent Society Core", icon: Orbit },
  { url: "/npc-agents",          title: "NPC Agents",               en: "NPC Agents",         icon: Cpu },
  { url: "/social-graph",        title: "Social Graph",              en: "Social Graph",       icon: GitGraph },
  { url: "/world-factions",      title: "World Factions",            en: "Factions",           icon: ShieldCheck },
  { url: "/world-institutions",  title: "World Institutions",        en: "Institutions",       icon: BookMarked },
  { url: "/world-economy",       title: "World Economy",             en: "Economy",            icon: Database },
  { url: "/world-beliefs",       title: "World Beliefs",             en: "Beliefs",            icon: Sparkles },
  { url: "/civilization-phase",  title: "Civilization Phase",        en: "Civilization Phase", icon: Layers },
];

const NAV_CIVILIZATION_BEGINNER = [
  { url: "/civilization-evolution", title: "文明演化", en: "Civilization Evolution", icon: Orbit },
];
const NAV_CIVILIZATION_ADVANCED = [
  { url: "/civilization-evolution", title: "文明历史模拟",   en: "Civilization Evolution", icon: Orbit },
  { url: "/historical-timeline",    title: "历史时间线",     en: "Historical Timeline",    icon: GitGraph },
  { url: "/civilization-chronicle", title: "文明编年史",     en: "Civilization Chronicle", icon: BookText },
  { url: "/technology-tree",        title: "技术树",         en: "Technology Tree",        icon: Cpu },
  { url: "/war-peace",              title: "战争与和平",     en: "War & Peace",            icon: Swords },
  { url: "/civilization-myth",      title: "文明神话",       en: "Civilization Myth",      icon: Sparkles },
  { url: "/historical-figures",     title: "历史人物",       en: "Historical Figures",     icon: Users2 },
];
const NAV_CIVILIZATION_FOUNDER = [
  { url: "/civilization-evolution", title: "Civilization Evolution Core", en: "Evolution Core", icon: Orbit },
  { url: "/historical-timeline",    title: "Historical Timeline",         en: "Timeline",       icon: GitGraph },
  { url: "/civilization-chronicle", title: "Civilization Chronicle",      en: "Chronicle",      icon: BookText },
  { url: "/technology-tree",        title: "Technology Tree",             en: "Tech Tree",      icon: Cpu },
  { url: "/war-peace",              title: "War & Peace",                 en: "War & Peace",    icon: Swords },
  { url: "/civilization-myth",      title: "Civilization Myth",           en: "Myth",           icon: Sparkles },
  { url: "/historical-figures",     title: "Historical Figures",          en: "Figures",        icon: Users2 },
];

const NAV_PRESENTATION_BEGINNER = [
  { url: "/world-presentation", title: "世界表现", en: "World Presentation", icon: Orbit },
];
const NAV_PRESENTATION_ADVANCED = [
  { url: "/world-presentation",        title: "世界表现运行时", en: "World Presentation", icon: Orbit },
  { url: "/render-runtime",            title: "渲染运行时",     en: "Render Runtime",     icon: Sparkles },
  { url: "/semantic-physics-runtime",  title: "语义物理运行时", en: "Semantic Physics",   icon: Atom },
  { url: "/animation-runtime",         title: "动画运行时",     en: "Animation Runtime",  icon: Activity },
  { url: "/camera-language",           title: "镜头语言",       en: "Camera Language",    icon: Eye },
  { url: "/world-audio",               title: "世界声音",       en: "World Audio",        icon: Music2 },
  { url: "/presentation-export",       title: "表现层导出",     en: "Presentation Export", icon: FileCode2 },
];
const NAV_PRESENTATION_FOUNDER = [
  { url: "/world-presentation",        title: "World Presentation Runtime Core", en: "Presentation Core", icon: Orbit },
  { url: "/render-runtime",            title: "Render Runtime",       en: "Render",      icon: Sparkles },
  { url: "/semantic-physics-runtime",  title: "Semantic Physics",     en: "Physics",     icon: Atom },
  { url: "/animation-runtime",         title: "Animation Runtime",    en: "Animation",   icon: Activity },
  { url: "/camera-language",           title: "Camera Language",      en: "Camera",      icon: Eye },
  { url: "/world-audio",               title: "World Audio",          en: "Audio",       icon: Music2 },
  { url: "/presentation-export",       title: "Presentation Export",  en: "Export",      icon: FileCode2 },
];

const NAV_MSL_BEGINNER = [
  { url: "/sequence-language", title: "数列解释器", en: "Sequence Language", icon: Binary },
];
const NAV_MSL_ADVANCED = [
  { url: "/mother-sequence-language", title: "母体数列语言", en: "Mother Sequence Language", icon: Binary },
  { url: "/sequence-language",        title: "数列解释器",   en: "Sequence Language",        icon: Binary },
];
const NAV_MSL_FOUNDER = [
  { url: "/msl-console",              title: "MSL Console",            en: "MSL Console",              icon: Terminal },
  { url: "/mother-sequence-language", title: "Mother Sequence Language", en: "MSL Advanced",           icon: Binary },
  { url: "/sequence-language",        title: "数列解释器",              en: "Sequence Language",        icon: Binary },
];

const NAV_AUDIT = [
  { url: "/system-audit",      title: "系统总验收",   en: "System Integration Audit", icon: ClipboardCheck },
  { url: "/integration-audit", title: "总集成审计",   en: "Integration Audit",        icon: ClipboardCheck },
  { url: "/interface-audit",   title: "界面审计",     en: "Interface Audit",          icon: ClipboardCheck },
  { url: "/subroute-audit",    title: "子路由审计",   en: "Sub-Route Audit",          icon: ClipboardCheck },
];

const NAV_UI_ENGINE = [
  { url: "/ui-update-engine",    title: "UI 界面更新引擎", en: "UI Update Engine",     icon: MonitorSmartphone },
  { url: "/quick-start-manager", title: "快速开始管理",     en: "Quick Start Manager",  icon: PlayCircle },
  { url: "/onboarding-manager",  title: "新手流程管理",     en: "Onboarding Manager",   icon: Compass },
  { url: "/interface-audit",     title: "界面审计",         en: "Interface Audit",      icon: ClipboardCheck },
  { url: "/text-dynamic-update", title: "文本更新",         en: "Text Dynamic Update",  icon: BookCopy },
  { url: "/text-registry",       title: "文本注册表",       en: "Text Registry",        icon: Library },
  { url: "/text-audit",          title: "文本审计",         en: "Text Audit",           icon: ClipboardCheck },
  { url: "/text-versions",       title: "文本版本",         en: "Text Versions",        icon: BookText },
  { url: "/text-localization",   title: "文本本地化",       en: "Text Localization",    icon: LangIcon },
];

const NAV_VERSION_LEAP = [
  { url: "/version-leap",        title: "版本跃迁",       en: "Version Leap",        icon: ClipboardCheck },
  { url: "/release-readiness",   title: "发布就绪",       en: "Release Readiness",   icon: ClipboardCheck },
  { url: "/release-notes",       title: "更新日志",       en: "Release Notes",       icon: BookText },
  { url: "/version-timeline",    title: "版本时间线",     en: "Version Timeline",    icon: BookCopy },
  { url: "/version-audit",       title: "版本审计",       en: "Version Audit",       icon: ClipboardCheck },
];

const NAV_REALITY_DATA = [
  { url: "/reality-data",          title: "现实数据",       en: "Reality Data",          icon: Library },
  { url: "/external-data-sources", title: "外部数据源",     en: "External Sources",      icon: BookCopy },
  { url: "/reality-calibration",   title: "现实校准",       en: "Reality Calibration",   icon: ClipboardCheck },
  { url: "/reality-evidence",      title: "现实证据",       en: "Reality Evidence",      icon: BookMarked },
  { url: "/reality-data-audit",    title: "现实数据审计",   en: "Reality Data Audit",    icon: ClipboardCheck },
];

const NAV_MULTI_WORLD = [
  { url: "/multi-world-network",   title: "多世界网络",     en: "Multi-World Network",  icon: Library },
  { url: "/world-registry",        title: "世界注册表",     en: "World Registry",       icon: BookCopy },
  { url: "/world-portals",         title: "世界门户",       en: "World Portals",        icon: Compass },
  { url: "/world-travel",          title: "世界互访",       en: "World Travel",         icon: Compass },
  { url: "/cross-world-relations", title: "跨世界关系",     en: "Cross-World Relations", icon: BookMarked },
  { url: "/world-federation",      title: "世界联邦",       en: "World Federation",     icon: ClipboardCheck },
  { url: "/multi-world-export",    title: "多世界导出",     en: "Multi-World Export",   icon: FileCode2 },
];


const NAV_LEARNING_BEGINNER = [
  { url: "/learn",      title: "学习中心",   en: "Learning Center", icon: BookOpen },
  { url: "/tutorials",  title: "教程",       en: "Tutorials",       icon: BookText },
  { url: "/faq",        title: "常见问题",   en: "FAQ",             icon: HelpCircle },
];
const NAV_LEARNING_ADVANCED = [
  { url: "/learn",             title: "学习中心",     en: "Learning Center",  icon: BookOpen },
  { url: "/tutorials",         title: "教程",         en: "Tutorials",        icon: BookText },
  { url: "/docs",              title: "文档",         en: "Docs",             icon: BookCopy },
  { url: "/module-docs",       title: "模块文档",     en: "Module Docs",      icon: Library },
  { url: "/faq",               title: "常见问题",     en: "FAQ",              icon: HelpCircle },
  { url: "/glossary",          title: "术语表",       en: "Glossary",         icon: BookMarked },
  { url: "/technical-manual",  title: "技术手册",     en: "Technical Manual", icon: FileCode2 },
  { url: "/docs-audit",        title: "文档审计",     en: "Docs Audit",       icon: ClipboardCheck },
];
const NAV_LEARNING_FOUNDER = NAV_LEARNING_ADVANCED;

const NAV_I18N_BEGINNER = [
  { url: "/language-center", title: "语言", en: "Language", icon: LangIcon },
];
const NAV_I18N_ADVANCED = [
  { url: "/language-center",         title: "语言中心",   en: "Language Center",        icon: LangIcon },
  { url: "/translation-engine",      title: "翻译引擎",   en: "Translation Engine",     icon: LangIcon },
  { url: "/terminology-dictionary",  title: "术语字典",   en: "Terminology Dictionary", icon: BookCopy },
];
const NAV_I18N_FOUNDER = [
  { url: "/language-center",         title: "Translation & Concept Localization", en: "Localization Console", icon: LangIcon },
  { url: "/translation-engine",      title: "Translation Engine",                 en: "Translation Engine",   icon: LangIcon },
  { url: "/terminology-dictionary",  title: "Terminology Dictionary",             en: "Terminology",          icon: BookCopy },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const path = useRouterState({ select: (r) => r.location.pathname });
  const [beginner, setBeginner] = useState(true);
  const [mounted, setMounted] = useState(false);
  const { active: founderActive } = useFounderState();

  useEffect(() => {
    setMounted(true);
    const sync = () => setBeginner(isBeginnerMode());
    sync();
    const off = onDataChange(sync);
    return off;
  }, []);

  const renderGroup = (label: string, items: typeof NAV_OS) => (
    <SidebarGroup>
      <SidebarGroupLabel className="text-[10px] tracking-[0.2em] text-muted-foreground">{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const active = item.url === "/" ? path === "/" : path.startsWith(item.url);
            return (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton asChild isActive={active}>
                  <Link to={item.url} className="flex items-center gap-3">
                    <item.icon className="w-4 h-4 shrink-0" />
                    {!collapsed && (
                      <span className="flex flex-col leading-tight">
                        <span className="text-sm">{item.title}</span>
                        <span className="text-[10px] text-muted-foreground tracking-wider">{item.en}</span>
                      </span>
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="px-4 py-5">
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-md aether-card-elevated flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <div className="font-display text-lg gold-text">Aether</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Fate Engine · v1.0 RC · {beginner ? "新手模式" : "高级模式"}
              </div>
              <div className="mt-1.5"><FounderModeBadge compact /></div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {mounted && !collapsed && (
          <div className="px-2 pt-2 pb-1">
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground px-2 mb-1">
              Quick Nav · 可折叠导航 v2
            </div>
            <CollapsibleSidebarGroup
              permissionContext={
                {
                  userMode: founderActive ? "FOUNDER" : beginner ? "PUBLIC" : "ADVANCED",
                  founderActive,
                } as PermissionContext
              }
            />
            <div className="gold-divider my-2" />
          </div>
        )}
        {renderGroup(
          founderActive ? "Aether Command Canvas" : "指挥画布 · Command Canvas",
          [
            { url: "/command-canvas",   title: "指挥画布",   en: "Command Canvas",  icon: LayoutDashboard },
            { url: "/command-center",   title: "指挥中心",   en: "Command Center",  icon: MessageSquare },
            { url: "/canvas-workspace", title: "画布工作区", en: "Canvas",          icon: Boxes },
            { url: "/object-inspector", title: "对象检查器", en: "Inspector",       icon: Eye },
            { url: "/run-console",      title: "运行控制台", en: "Runs",            icon: PlayCircle },
            { url: "/capability-dock",  title: "能力坞",     en: "Capability Dock", icon: Layers },
          ],
        )}
        {renderGroup(
          founderActive ? "Sequence AI Console" : beginner ? "问数列 AI" : "Sequence AI · 数列人工智能",
          founderActive ? NAV_SEQUENCE_AI_FOUNDER : beginner ? NAV_SEQUENCE_AI_BEGINNER : NAV_SEQUENCE_AI_ADVANCED,
        )}
        {renderGroup(
          founderActive ? "Freeform Engine Console" : beginner ? "随便问" : "自由输入与自由解答",
          founderActive ? NAV_FREE_INPUT_FOUNDER : beginner ? NAV_FREE_INPUT_BEGINNER : NAV_FREE_INPUT_ADVANCED,
        )}
        {renderGroup("入门", NAV_START)}
        {renderGroup(
          founderActive ? "Thing-Itself Calculus" : beginner ? "看清一个东西" : "万物本身",
          founderActive ? NAV_ONTOLOGY_FOUNDER : beginner ? NAV_ONTOLOGY_BEGINNER : NAV_ONTOLOGY_ADVANCED,
        )}
        {renderGroup(
          founderActive ? "Usage Example Calculus" : beginner ? "使用示例" : "示例 · 示例库",
          founderActive ? NAV_USAGE_FOUNDER : beginner ? NAV_USAGE_BEGINNER : NAV_USAGE_ADVANCED,
        )}
        {renderGroup("预测系统", NAV_OS)}
        {renderGroup("宇宙世界生成", NAV_WORLD)}
        {renderGroup(founderActive ? "World Operating Substrate" : "虚拟世界 OS", NAV_VIRTUAL)}
        {!beginner && renderGroup("综合判断内核", NAV_CORE)}
        {!beginner && renderGroup("常数 · 记录 · 宪法", NAV_META)}
        {renderGroup("产品文档", beginner ? NAV_DOCS.filter(d => ["/docs","/encyclopedia","/usage-safety"].includes(d.url)) : NAV_DOCS)}
        {!beginner && renderGroup("Generation OS · 生成层", founderActive ? NAV_GENERATION_OS_FOUNDER : NAV_GENERATION_OS)}
        {renderGroup(
          founderActive ? "Bio-Product Evolution Console" : beginner ? "App 个人进化" : "产品自进化",
          beginner ? NAV_BIO_EVOLUTION_BEGINNER : NAV_BIO_EVOLUTION_ADVANCED,
        )}
        {renderGroup(
          founderActive ? "Universal Breakthrough Calculus" : beginner ? "问题拆解" : "万物破解",
          founderActive ? NAV_BREAKTHROUGH_FOUNDER : beginner ? NAV_BREAKTHROUGH_BEGINNER : NAV_BREAKTHROUGH_ADVANCED,
        )}
        {renderGroup(
          founderActive ? "Past-Life / Subconscious Recall Engine" : beginner ? "自我探索" : "潜意识调用",
          founderActive ? NAV_RECALL_FOUNDER : beginner ? NAV_RECALL_BEGINNER : NAV_RECALL_ADVANCED,
        )}
        {renderGroup(
          founderActive ? "Virtual Creation · Reality Science" : beginner ? "创造模拟" : "虚拟创造物 · 现实科学",
          founderActive ? NAV_CREATION_FOUNDER : beginner ? NAV_CREATION_BEGINNER : NAV_CREATION_ADVANCED,
        )}
        {renderGroup(
          founderActive ? "Virtual Life Calculus" : beginner ? "虚拟生活" : "Virtual Life OS",
          founderActive ? NAV_VIRTUAL_LIFE_FOUNDER : beginner ? NAV_VIRTUAL_LIFE_BEGINNER : NAV_VIRTUAL_LIFE_ADVANCED,
        )}
        {renderGroup(
          founderActive ? "Aether Sequence World Engine SDK" : beginner ? "生成世界逻辑" : "数列世界引擎",
          founderActive ? NAV_SEQUENCE_WORLD_FOUNDER : beginner ? NAV_SEQUENCE_WORLD_BEGINNER : NAV_SEQUENCE_WORLD_ADVANCED,
        )}
        {renderGroup(
          founderActive ? "Sequence World Simulation Core" : beginner ? "模拟世界" : "数列世界模拟",
          founderActive ? NAV_WORLD_SIM_FOUNDER : beginner ? NAV_WORLD_SIM_BEGINNER : NAV_WORLD_SIM_ADVANCED,
        )}
        {renderGroup(
          founderActive ? "World Agent Society Core" : beginner ? "世界社会" : "世界智能体社会",
          founderActive ? NAV_WORLD_SOCIETY_FOUNDER : beginner ? NAV_WORLD_SOCIETY_BEGINNER : NAV_WORLD_SOCIETY_ADVANCED,
        )}
        {renderGroup(
          founderActive ? "Civilization Evolution Core" : beginner ? "文明演化" : "文明历史模拟",
          founderActive ? NAV_CIVILIZATION_FOUNDER : beginner ? NAV_CIVILIZATION_BEGINNER : NAV_CIVILIZATION_ADVANCED,
        )}
        {renderGroup(
          founderActive ? "World Presentation Runtime Core" : beginner ? "世界表现" : "世界表现运行时",
          founderActive ? NAV_PRESENTATION_FOUNDER : beginner ? NAV_PRESENTATION_BEGINNER : NAV_PRESENTATION_ADVANCED,
        )}
        {renderGroup(
          founderActive ? "MSL · Mother Sequence Language" : beginner ? "数列解释器" : "母体数列语言",
          founderActive ? NAV_MSL_FOUNDER : beginner ? NAV_MSL_BEGINNER : NAV_MSL_ADVANCED,
        )}
        {renderGroup(
          founderActive ? "Translation & Concept Localization" : beginner ? "语言" : "语言翻译引擎",
          founderActive ? NAV_I18N_FOUNDER : beginner ? NAV_I18N_BEGINNER : NAV_I18N_ADVANCED,
        )}
        {renderGroup(
          founderActive ? "Aether Vocal Engine" : beginner ? "声乐 / 歌曲" : "声乐引擎",
          founderActive ? NAV_VOCAL_FOUNDER : beginner ? NAV_VOCAL_BEGINNER : NAV_VOCAL_ADVANCED,
        )}
        {renderGroup(
          founderActive ? "Aether Model Forge" : beginner ? "生成模型" : "模型生成引擎",
          founderActive ? NAV_MODEL_GEN_FOUNDER : beginner ? NAV_MODEL_GEN_BEGINNER : NAV_MODEL_GEN_ADVANCED,
        )}
        {renderGroup(
          founderActive ? "Aether Narrative Engine" : beginner ? "写剧情" : "剧情文本引擎",
          founderActive ? NAV_NARRATIVE_FOUNDER : beginner ? NAV_NARRATIVE_BEGINNER : NAV_NARRATIVE_ADVANCED,
        )}
        {renderGroup(
          founderActive ? "World Knowledge Engine" : beginner ? "知识库" : "世界知识引擎",
          founderActive ? NAV_KNOWLEDGE_FOUNDER : beginner ? NAV_KNOWLEDGE_BEGINNER : NAV_KNOWLEDGE_ADVANCED,
        )}
        {renderGroup(
          founderActive ? "Sequence Terminal · 数列终端" : beginner ? "终端 · Terminal" : "数列终端 · Sequence Terminal",
          founderActive ? NAV_TERMINAL_FOUNDER : beginner ? NAV_TERMINAL_BEGINNER : NAV_TERMINAL_ADVANCED,
        )}
        {renderGroup(
          founderActive ? "Hybrid Compression Engine" : beginner ? "输出压缩" : "黑白箱压缩 · Compression",
          founderActive ? NAV_COMPRESSION_FOUNDER : beginner ? NAV_COMPRESSION_BEGINNER : NAV_COMPRESSION_ADVANCED,
        )}
        {renderGroup("学习中心 · Learning", beginner ? NAV_LEARNING_BEGINNER : founderActive ? NAV_LEARNING_FOUNDER : NAV_LEARNING_ADVANCED)}
        {!beginner && renderGroup("系统验收 · Audit", NAV_AUDIT)}
        {!beginner && renderGroup("UI 界面更新 · UI Engine", NAV_UI_ENGINE)}
        {!beginner && renderGroup("版本跃迁 · Version Leap", NAV_VERSION_LEAP)}
        {!beginner && renderGroup("现实数据 · Reality Data", NAV_REALITY_DATA)}
        {renderGroup("多世界网络 · Multi-World Network", NAV_MULTI_WORLD)}
        {renderGroup(
          founderActive ? "Cross-Functional Application Calculus" : beginner ? "跨功能应用" : "功能跨域运用 · Cross-Functional",
          founderActive ? NAV_CROSS_FUNCTIONAL_FOUNDER : beginner ? NAV_CROSS_FUNCTIONAL_BEGINNER : NAV_CROSS_FUNCTIONAL_ADVANCED,
        )}
        {!beginner && renderGroup(
          founderActive ? "Missing-Layer Detection Calculus" : "系统缺层识别 · Missing-Layer",
          founderActive ? NAV_MISSING_LAYER_FOUNDER : NAV_MISSING_LAYER_ADVANCED,
        )}
        {renderGroup(
          founderActive ? "Digital Role Calculus" : beginner ? "数字团队" : "数字角色 · Digital Roles",
          founderActive ? NAV_DIGITAL_ROLES_FOUNDER : beginner ? NAV_DIGITAL_ROLES_BEGINNER : NAV_DIGITAL_ROLES_ADVANCED,
        )}
        {renderGroup(
          founderActive ? "Aether App Runtime" : beginner ? "应用生成" : "App Runtime · 应用运行时",
          founderActive ? NAV_APP_RUNTIME_FOUNDER : beginner ? NAV_APP_RUNTIME_BEGINNER : NAV_APP_RUNTIME_ADVANCED,
        )}
        {!beginner && renderGroup(
          founderActive ? "Aether Agent Substrate" : "Agent 绑定 · Knowledge-Personality",
          founderActive ? NAV_AGENT_BINDING_FOUNDER : NAV_AGENT_BINDING_ADVANCED,
        )}
        {!beginner && renderGroup(
          founderActive ? "Aether Code Sandbox Bridge" : "代码运行桥 · Code Sandbox",
          founderActive ? NAV_CODE_SANDBOX_FOUNDER : NAV_CODE_SANDBOX_ADVANCED,
        )}
        {!beginner && renderGroup(
          founderActive ? "Aether WebLLM Runtime" : "WebLLM 本地 AI · Neuro-Inspired",
          founderActive ? NAV_WEBLLM_FOUNDER : NAV_WEBLLM_ADVANCED,
        )}
        {!beginner && renderGroup(
          founderActive ? "Aether WebLCM Runtime" : "WebLCM 概念运行时 · 概念器官",
          founderActive ? NAV_WEBLCM_FOUNDER : NAV_WEBLCM_ADVANCED,
        )}
        {!beginner && renderGroup(
          founderActive ? "Aether Web Knowledge Trinity" : "Web 知识三体 · WebLKM/WebCM/WebCoM",
          founderActive ? NAV_WEB_KNOWLEDGE_TRINITY_FOUNDER : NAV_WEB_KNOWLEDGE_TRINITY_ADVANCED,
        )}
        {!beginner && renderGroup(
          founderActive ? "WebXX Capability Models" : "Web 能力模型 · WebXX Capabilities",
          founderActive ? NAV_WEB_CAPABILITY_FOUNDER : NAV_WEB_CAPABILITY_ADVANCED,
        )}
        {renderGroup("Founder · 创始人", founderActive ? NAV_FOUNDER : NAV_FOUNDER_LOCKED)}


      </SidebarContent>

      <SidebarFooter className="px-3 py-3">
        {!collapsed && (
          <div className="text-[10px] text-muted-foreground/70 leading-relaxed px-1">
            v1.0 Private Beta Candidate · 私密内测候选版
            <div className="gold-divider my-2" />
            预测 ≠ 断言未来；行动可改变结果。
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
