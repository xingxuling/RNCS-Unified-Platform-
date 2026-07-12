import type { AppType } from "@/constants/app-runtime/appTypes";
import type { AppRuntimeMode } from "@/constants/app-runtime/appRuntimeModes";

export interface AppIntentResult {
  appType: AppType;
  confidence: number;
  runtimeModeRecommendation: AppRuntimeMode;
  requiredDigitalRoles: string[];
  requiredEngines: string[];
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  reason: string;
}

export function classifyAppIntent(rawIdea: string): AppIntentResult {
  const raw = (rawIdea || "").toLowerCase();
  let appType: AppType = "TOOL_APP";
  let runtimeMode: AppRuntimeMode = "HANDOFF_ONLY";
  let confidence = 0.5;
  let reason = "默认识别为通用工具应用。";

  const match = (re: RegExp, t: AppType, m: AppRuntimeMode, c: number, r: string) => {
    if (re.test(raw)) { appType = t; runtimeMode = m; confidence = c; reason = r; }
  };

  match(/官网|landing|介绍|展示|主页/, "LANDING_PAGE_APP", "STATIC_PREVIEW", 0.85, "命中落地页关键词");
  match(/dashboard|仪表盘|看板|数据/, "DASHBOARD_APP", "REACT_DRAFT", 0.8, "命中仪表盘关键词");
  match(/管理|admin|后台/, "ADMIN_PANEL_APP", "REACT_DRAFT", 0.75, "命中后台关键词");
  match(/chat|聊天|对话|机器人|bot/, "CHATBOT_APP", "REACT_DRAFT", 0.85, "命中聊天关键词");
  match(/音乐|歌词|suno|歌曲|prompt/, "MUSIC_TOOL_APP", "STATIC_PREVIEW", 0.8, "命中音乐工具关键词");
  match(/世界|角色|剧情|world|narrative/, "WORLD_BUILDER_APP", "REACT_DRAFT", 0.8, "命中世界构建关键词");
  match(/番茄|计时|pomodoro|计算器|工具|生成器/, "TOOL_APP", "STATIC_PREVIEW", 0.85, "命中工具/生成器关键词");
  match(/作品集|portfolio|个人/, "PORTFOLIO_APP", "STATIC_PREVIEW", 0.8, "命中作品集关键词");
  match(/表单|问卷|form|收集/, "FORM_APP", "STATIC_PREVIEW", 0.8, "命中表单关键词");
  match(/游戏|game|小游戏/, "MINI_GAME_APP", "STATIC_PREVIEW", 0.75, "命中小游戏关键词");
  match(/任务|todo|看板|kanban/, "WORKFLOW_APP", "STATIC_PREVIEW", 0.8, "命中流程/任务关键词");
  match(/知识库|wiki|术语/, "KNOWLEDGE_BASE_APP", "REACT_DRAFT", 0.8, "命中知识库关键词");

  const highRisk = /登录|支付|payment|token|密码|password|数据库|database|api key/.test(raw);
  const riskLevel: "LOW" | "MEDIUM" | "HIGH" = highRisk ? "HIGH" : raw.length > 80 ? "MEDIUM" : "LOW";

  return {
    appType,
    confidence,
    runtimeModeRecommendation: runtimeMode,
    requiredDigitalRoles: [
      "DIGITAL_PRODUCT_MANAGER","DIGITAL_ARCHITECT","DIGITAL_PROGRAMMER",
      "DIGITAL_DESIGNER","DIGITAL_QA","DIGITAL_DOCUMENTATION_LEAD",
      ...(highRisk ? ["DIGITAL_GOVERNANCE_OFFICER"] : []),
    ],
    requiredEngines: ["sequenceAI","sequenceObjectArchitecture","codeGeneration","softwareQA","workspace"],
    riskLevel,
    reason,
  };
}
