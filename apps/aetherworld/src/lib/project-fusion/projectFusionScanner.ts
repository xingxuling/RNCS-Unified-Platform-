// 项目融合 · 扫描器
// 由于 Lovable 同账号项目读取在运行时受限，扫描器以「候选登记表」形式工作：
// - 接收用户/Chat 提供的项目描述
// - 内置常见同账号项目类型识别规则
// - 输出 SameAccountProjectCandidate

import type { SameAccountProjectCandidate, FusionRiskLevel } from "./projectFusionTypes";
import { sanitizeFusionInput, detectHighRiskSignals } from "./projectFusionSafetyPolicy";

interface TypeRule {
  type: string;
  keywords: RegExp[];
  modules: string[];
  components: string[];
  logic: string[];
  dataModels: string[];
  routes: string[];
  uiPatterns: string[];
}

const TYPE_RULES: TypeRule[] = [
  {
    type: "AI Chat / Agent",
    keywords: [/chat/i, /agent/i, /assistant/i, /对话/, /助手/],
    modules: ["Chat Session", "Agent Coordinator", "Tool Calling"],
    components: ["MessageBubble", "InputBar", "SessionSidebar"],
    logic: ["session persistence", "streaming runtime", "intent classifier"],
    dataModels: ["ChatMessage", "ChatSession", "AgentProfile"],
    routes: ["/chat", "/agents"],
    uiPatterns: ["双栏会话布局", "流式回答卡片"],
  },
  {
    type: "Workspace / Project",
    keywords: [/workspace/i, /项目管理/, /object/i, /工作区/],
    modules: ["Object Store", "Versioning", "Relations"],
    components: ["ObjectCard", "ObjectDetail", "VersionTimeline"],
    logic: ["save/load", "version diff", "relation graph"],
    dataModels: ["WorkspaceObject", "Version"],
    routes: ["/workspace", "/objects"],
    uiPatterns: ["列表 + 详情双栏", "状态徽章"],
  },
  {
    type: "Calendar / Scheduler",
    keywords: [/calendar/i, /schedule/i, /日历/, /任务/, /trigger/i],
    modules: ["Task Queue", "Trigger", "Heatmap"],
    components: ["MonthGrid", "TaskList", "Heatmap"],
    logic: ["状态机", "重复规则", "提醒"],
    dataModels: ["ScheduledTask", "CalendarTrigger"],
    routes: ["/calendar", "/scheduler"],
    uiPatterns: ["月视图 / 日视图切换", "热力图"],
  },
  {
    type: "Store / Plugin / Capability",
    keywords: [/store/i, /plugin/i, /插件/, /capability/i, /webxxm/i],
    modules: ["Package Manifest", "Install Flow", "Permission Prompt"],
    components: ["PackageCard", "InstallDialog"],
    logic: ["install/enable", "permission scope", "version compare"],
    dataModels: ["CapabilityPackage", "InstalledAsset"],
    routes: ["/store"],
    uiPatterns: ["卡片网格 + 详情抽屉"],
  },
  {
    type: "Social / Publish",
    keywords: [/social/i, /feed/i, /发布/, /社区/, /community/i],
    modules: ["Feed", "Publisher", "Audit"],
    components: ["FeedItem", "PublishForm"],
    logic: ["内容审核", "公开/私有可见性"],
    dataModels: ["SocialPost"],
    routes: ["/social"],
    uiPatterns: ["时间线信息流"],
  },
  {
    type: "World / Character / Narrative",
    keywords: [/world/i, /character/i, /世界/, /角色/, /narrative/i, /叙事/],
    modules: ["World Engine", "Narrative", "Vocal"],
    components: ["CharacterCard", "SceneRenderer"],
    logic: ["状态推进", "关系图谱"],
    dataModels: ["Character", "Scene"],
    routes: ["/world", "/characters"],
    uiPatterns: ["角色卡 + 关系图"],
  },
  {
    type: "Code Sandbox / App Builder",
    keywords: [/sandbox/i, /app builder/i, /code/i, /运行时/, /runtime/i],
    modules: ["Sandbox", "Runner", "Diagnostics"],
    components: ["CodeEditor", "RunPanel"],
    logic: ["运行结果展示", "错误捕获"],
    dataModels: ["RunResult"],
    routes: ["/sandbox", "/app-runtime"],
    uiPatterns: ["编辑 + 预览双栏"],
  },
  {
    type: "Analytics / Dashboard",
    keywords: [/analytics/i, /dashboard/i, /统计/, /指标/, /metrics/i],
    modules: ["Metric Aggregator", "Time Series"],
    components: ["MetricCard", "Chart"],
    logic: ["聚合", "时间窗口"],
    dataModels: ["MetricPoint"],
    routes: ["/analytics", "/dashboard"],
    uiPatterns: ["指标卡 + 折线 / 柱状图"],
  },
  {
    type: "Record / Audit / Verification",
    keywords: [/record/i, /audit/i, /回验/, /审计/, /verification/i],
    modules: ["Event Log", "Importance Scorer"],
    components: ["RecordList", "ImportanceBadge"],
    logic: ["事件采集", "重要性评分"],
    dataModels: ["RecordEvent"],
    routes: ["/record-center"],
    uiPatterns: ["日志流 + 重要度标识"],
  },
  {
    type: "LLM Provider / Local Gateway",
    keywords: [/ollama/i, /llm/i, /provider/i, /gateway/i, /本地模型/],
    modules: ["Provider Adapter", "Health Probe"],
    components: ["ProviderCard", "ModelPicker"],
    logic: ["重试 / 超时", "健康探针"],
    dataModels: ["ProviderProfile", "ModelInfo"],
    routes: ["/llm-providers"],
    uiPatterns: ["供应商卡片网格"],
  },
  {
    type: "Personal OS / Life OS",
    keywords: [/life os/i, /personal os/i, /生活os/, /虚拟世界/, /virtual world/i],
    modules: ["Daily Stream", "Object Universe"],
    components: ["Timeline", "ObjectGraph"],
    logic: ["跨域聚合", "时间轴"],
    dataModels: ["DailyObject"],
    routes: ["/life", "/world-os"],
    uiPatterns: ["时间轴 + 对象网格"],
  },
];

function inferRisk(raw: string): FusionRiskLevel {
  const highSignals = detectHighRiskSignals(raw);
  if (highSignals.length >= 2) return "HIGH";
  if (highSignals.length === 1) return "MEDIUM";
  return "LOW";
}

export interface ScanInput {
  projectName: string;
  description: string;
}

export function scanProjectCandidate(input: ScanInput): SameAccountProjectCandidate {
  const safeDesc = sanitizeFusionInput(input.description ?? "");
  const matched = TYPE_RULES.filter((r) => r.keywords.some((k) => k.test(safeDesc)));
  const rule = matched[0];
  const risk = inferRisk(safeDesc);

  const recommendation =
    risk === "HIGH"
      ? "BRIDGE_LATER"
      : matched.length === 0
      ? "REFERENCE_ONLY"
      : risk === "MEDIUM"
      ? "BRIDGE_LATER"
      : "FUSE_NOW";

  return {
    id: `PFC-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    projectName: input.projectName || "未命名项目",
    projectType: rule?.type ?? "Other",
    description: safeDesc.slice(0, 800),
    detectedModules: rule?.modules ?? [],
    reusableComponents: rule?.components ?? [],
    reusableLogic: rule?.logic ?? [],
    reusableDataModels: rule?.dataModels ?? [],
    reusableRoutes: rule?.routes ?? [],
    reusableUiPatterns: rule?.uiPatterns ?? [],
    riskLevel: risk,
    fusionRecommendation: recommendation,
    notes: matched.length === 0
      ? "未匹配到已知项目类型，仅作参考登记。"
      : `识别为「${rule!.type}」，风险 ${risk}。`,
    createdAt: new Date().toISOString(),
  };
}

/** 批量扫描（同账号清单形式） */
export function scanProjectCandidates(inputs: ScanInput[]): SameAccountProjectCandidate[] {
  return inputs.map(scanProjectCandidate);
}
