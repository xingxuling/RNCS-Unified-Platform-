// Aether 统一导航域配置
// 仅用于响应式外壳渲染，不删除任何现有路由。
import type { LucideIcon } from "lucide-react";
import {
  Home, MessageSquare, CalendarDays, Sparkles, LayoutGrid, Users,
  Globe2, AppWindow, Cpu, FolderKanban, Boxes, ShieldCheck, BookOpen,
  Crown, Menu, Bell, User, Plus,
} from "lucide-react";

export interface AetherNavigationItem {
  to: string;
  label: string;
  badge?: string;
  founderOnly?: boolean;
}

export interface AetherNavigationDomain {
  id: string;
  label: string;
  icon: LucideIcon;
  primaryPath: string;
  children: AetherNavigationItem[];
  mobileTab?: boolean;
  founderOnly?: boolean;
  badge?: string;
}

export const AETHER_NAV_DOMAINS: AetherNavigationDomain[] = [
  {
    id: "HOME", label: "首页", icon: Home, primaryPath: "/",
    children: [
      { to: "/", label: "主控台" },
      { to: "/index", label: "今日摘要" },
      { to: "/onboarding", label: "新手引导" },
      { to: "/quick-start-manager", label: "快速开始" },
      { to: "/learn", label: "学习中心" },
      { to: "/showcase", label: "示例库" },
    ],
  },
  {
    id: "CHAT", label: "对话", icon: MessageSquare, primaryPath: "/chat",
    children: [
      { to: "/chat", label: "对话主页" },
      { to: "/aether-chat", label: "Aether Chat" },
      { to: "/chat-history", label: "历史会话" },
      { to: "/ask-sequence-ai", label: "数列 AI 问答" },
      { to: "/free-input", label: "自由输入" },
      { to: "/free-answer", label: "自由问答" },
    ],
  },
  {
    id: "CALENDAR", label: "日历", icon: CalendarDays, primaryPath: "/calendar",
    children: [
      { to: "/calendar", label: "日历总览" },
      { to: "/calendar/today", label: "今日" },
      { to: "/calendar/tasks", label: "任务" },
      { to: "/calendar/triggers", label: "触发器" },
      { to: "/trigger-calendar", label: "触发日历" },
      { to: "/calendar/settings", label: "日历设置" },
    ],
  },
  {
    id: "STORE", label: "商店", icon: Sparkles, primaryPath: "/store",
    children: [
      { to: "/store", label: "商店总览" },
      { to: "/store/installed", label: "已安装" },
      { to: "/store/my-assets", label: "我的资产" },
      { to: "/store/updates", label: "更新" },
      { to: "/store/transactions", label: "交易记录" },
      { to: "/webxxm-store", label: "WebXXM 商店" },
      { to: "/webxxm-installed", label: "WebXXM 已装" },
    ],
  },
  {
    id: "WORKSPACE", label: "工作区", icon: LayoutGrid, primaryPath: "/workspace",
    children: [
      { to: "/workspace", label: "工作区" },
      { to: "/workspace-switcher", label: "切换工作区" },
      { to: "/canvas-workspace", label: "画布工作区" },
      { to: "/runs", label: "运行记录" },
      { to: "/run-console", label: "运行控制台" },
      { to: "/value-ledger", label: "价值账本" },
    ],
  },
  {
    id: "SOCIAL", label: "社交", icon: Users, primaryPath: "/social",
    children: [
      { to: "/social", label: "社交总览" },
      { to: "/social/feed", label: "动态流" },
      { to: "/social/publish", label: "发布" },
      { to: "/social/collections", label: "收藏" },
      { to: "/social/me", label: "我的主页" },
      { to: "/social/settings", label: "社交设置" },
      { to: "/social/audit", label: "社交审计" },
      { to: "/social-graph", label: "社交图谱" },
    ],
  },
  {
    id: "WORLD", label: "世界", icon: Globe2, primaryPath: "/worlds",
    children: [
      { to: "/worlds", label: "世界总览" },
      { to: "/world-engine", label: "世界引擎" },
      { to: "/world-runtime", label: "RNCS 世界驾驶舱" },
      { to: "/web-world-runtime", label: "Web 世界运行时" },
      { to: "/world-map", label: "世界地图" },
      { to: "/world-npcs", label: "NPC" },
      { to: "/world-quests", label: "任务" },
      { to: "/world-canon", label: "世界正典" },
      { to: "/world-presentation", label: "世界呈现" },
      { to: "/personal-world", label: "个人世界" },
    ],
  },
  {
    id: "APP", label: "应用", icon: AppWindow, primaryPath: "/apps",
    children: [
      { to: "/apps", label: "应用总览" },
      { to: "/app-runtime", label: "App Runtime" },
      { to: "/app-projects", label: "应用项目" },
      { to: "/app-preview", label: "应用预览" },
      { to: "/code-sandbox", label: "代码沙箱" },
      { to: "/code-runs", label: "代码运行" },
      { to: "/code-generator", label: "代码生成" },
      { to: "/app-runtime-audit", label: "运行审计" },
    ],
  },
  {
    id: "MODEL", label: "模型", icon: Cpu, primaryPath: "/llm-providers",
    children: [
      { to: "/llm-providers", label: "模型概览" },
      { to: "/llm-providers/settings", label: "模型设置" },
      { to: "/llm-providers/test", label: "模型测试" },
      { to: "/core-model-setup", label: "核心模型设置" },
      { to: "/real-webllm", label: "WebLLM" },
      { to: "/real-webllm-settings", label: "WebLLM 设置" },
      { to: "/webllm-models", label: "WebLLM 模型" },
      { to: "/webllm-test", label: "WebLLM 测试" },
      { to: "/web-models", label: "Web 模型" },
      { to: "/model-registry", label: "模型注册表" },
    ],
  },
  {
    id: "PROJECT", label: "项目", icon: FolderKanban, primaryPath: "/projects",
    children: [
      { to: "/projects", label: "项目总览" },
      { to: "/project-intake-forge", label: "项目投喂编译炉" },
      { to: "/app-projects", label: "应用项目" },
      { to: "/personal-app-profile", label: "个人应用资料" },
    ],
  },
  {
    id: "OBJECT", label: "对象", icon: Boxes, primaryPath: "/objects",
    children: [
      { to: "/objects", label: "对象总览" },
      { to: "/object-inspector", label: "对象检查器" },
      { to: "/object-ontology", label: "对象本体" },
      { to: "/object-essence", label: "对象本质" },
      { to: "/sequence-objects", label: "数列对象" },
      { to: "/sequence-object-compiler", label: "数列对象编译" },
    ],
  },
  {
    id: "SYSTEM", label: "系统", icon: ShieldCheck, primaryPath: "/system",
    children: [
      { to: "/system", label: "系统总览" },
      { to: "/system/agent-blueprints", label: "Agent 蓝图总控" },
      { to: "/system/autonomous-factory", label: "无人工厂总控" },
      { to: "/system/data-engine", label: "数据引擎" },
      { to: "/system-gap-map", label: "系统缺口地图" },
      { to: "/system-audit", label: "系统审计" },
      { to: "/system-constitution", label: "系统宪法" },
      { to: "/system-evolution-map", label: "演化地图" },
      { to: "/system-upgrade-planner", label: "升级规划" },
      { to: "/command-center", label: "指令中心" },
      { to: "/release-notes", label: "发布说明" },
      { to: "/release-readiness", label: "发布就绪" },
      { to: "/version-timeline", label: "版本时间线" },
      { to: "/integrations/lovable", label: "Lovable 能力" },
    ],
  },
  {
    id: "DOCS", label: "文档", icon: BookOpen, primaryPath: "/docs",
    children: [
      { to: "/docs", label: "文档总览" },
      { to: "/docs-audit", label: "文档审计" },
      { to: "/module-docs", label: "模块文档" },
      { to: "/technical-manual", label: "技术手册" },
      { to: "/faq", label: "FAQ" },
      { to: "/tutorials", label: "教程" },
      { to: "/glossary", label: "术语表" },
      { to: "/terminology-dictionary", label: "术语词典" },
      { to: "/encyclopedia", label: "百科" },
    ],
  },
  {
    id: "FOUNDER", label: "Founder", icon: Crown, primaryPath: "/founder", founderOnly: true,
    children: [
      { to: "/founder", label: "Founder 控制台" },
      { to: "/founder-console", label: "Founder Console" },
      { to: "/founder-terminal", label: "Founder Terminal" },
      { to: "/founder-permissions", label: "权限" },
      { to: "/founder-audit", label: "审计" },
      { to: "/account", label: "账户" },
      { to: "/account/security", label: "安全" },
      { to: "/account/settings", label: "账户设置" },
    ],
  },
  {
    id: "FULL_NAV", label: "完整导航", icon: Menu, primaryPath: "/command-canvas",
    children: [
      { to: "/command-canvas", label: "完整导航" },
      { to: "/command-center", label: "指令中心" },
    ],
  },
];

// 手机底部 5-Tab
export interface AetherMobileTab {
  id: string;
  label: string;
  icon: LucideIcon;
  to?: string;
  action?: "OPEN_CREATE_SHEET";
}

export const AETHER_MOBILE_TABS: AetherMobileTab[] = [
  { id: "home", label: "首页", icon: Home, to: "/" },
  { id: "chat", label: "对话", icon: MessageSquare, to: "/chat" },
  { id: "create", label: "创建", icon: Plus, action: "OPEN_CREATE_SHEET" },
  { id: "notice", label: "通知", icon: Bell, to: "/command-center" },
  { id: "me", label: "我的", icon: User, to: "/account" },
];

// 手机创建抽屉项
export interface AetherCreateAction {
  id: string;
  label: string;
  description: string;
  to: string;
}

export const AETHER_CREATE_ACTIONS: AetherCreateAction[] = [
  { id: "app", label: "创建应用", description: "生成一个新的 App 草案", to: "/app-runtime" },
  { id: "code", label: "生成代码", description: "在代码沙箱中起草", to: "/code-generator" },
  { id: "world", label: "生成世界", description: "进入世界引擎", to: "/world-engine" },
  { id: "song", label: "生成歌曲", description: "进入声乐引擎", to: "/vocal-engine" },
  { id: "task", label: "创建日历任务", description: "前往日历任务页面", to: "/calendar/tasks" },
  { id: "publish", label: "发布作品", description: "前往社交发布", to: "/social/publish" },
  { id: "sequence", label: "创建数列对象", description: "进入数列对象编译", to: "/sequence-object-compiler" },
];

export function findDomainByPath(path: string): AetherNavigationDomain | undefined {
  // 取最长前缀匹配的子项
  let best: { domain: AetherNavigationDomain; len: number } | null = null;
  for (const d of AETHER_NAV_DOMAINS) {
    for (const c of d.children) {
      if (path === c.to || path.startsWith(c.to + "/")) {
        if (!best || c.to.length > best.len) best = { domain: d, len: c.to.length };
      }
    }
    if (path === d.primaryPath) {
      if (!best || d.primaryPath.length >= best.len) best = { domain: d, len: d.primaryPath.length };
    }
  }
  return best?.domain;
}
