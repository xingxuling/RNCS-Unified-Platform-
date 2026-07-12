// Engine Weight Constants v0.1 — 引擎权重表
// 给 Chat / Calculus Router 提供 intent → 引擎组合的权重模板。
// 不替代 src/constants/constant-universe/engineConstants.ts（更细颗粒），
// 这里专门服务于 Chat 主链路融合层。

export type EngineRole = "PRIMARY" | "SUPPORT" | "VALIDATION" | "SAFETY";

export interface EngineWeightItem {
  engineId: string;
  weight: number;
  role: EngineRole;
}

export interface EngineWeightProfile {
  intentType: string;
  chineseName: string;
  primaryEngines: EngineWeightItem[];
  supportEngines: EngineWeightItem[];
  validationEngines: EngineWeightItem[];
  safetyWeight: number;
  description: string;
}

const p = (engineId: string, weight: number): EngineWeightItem => ({ engineId, weight, role: "PRIMARY" });
const s = (engineId: string, weight: number): EngineWeightItem => ({ engineId, weight, role: "SUPPORT" });
const v = (engineId: string, weight: number): EngineWeightItem => ({ engineId, weight, role: "VALIDATION" });

export const ENGINE_WEIGHT_PROFILES: EngineWeightProfile[] = [
  {
    intentType: "CHAT_GENERAL",
    chineseName: "普通问答",
    primaryEngines: [p("LightAnswer", 0.5), p("Knowledge", 0.2)],
    supportEngines: [s("Narrative", 0.1)],
    validationEngines: [v("QA", 0.1)],
    safetyWeight: 0.1,
    description: "轻量问答，最小上下文。",
  },
  {
    intentType: "APP_CREATION",
    chineseName: "应用创建",
    primaryEngines: [p("AppRuntime", 0.35), p("WebCodeM", 0.2)],
    supportEngines: [s("CodeSandbox", 0.15), s("Workspace", 0.1)],
    validationEngines: [v("QA", 0.1)],
    safetyWeight: 0.1,
    description: "创建可运行的应用草案。",
  },
  {
    intentType: "CODE_TASK",
    chineseName: "代码任务",
    primaryEngines: [p("WebCodeM", 0.35), p("CodeSandbox", 0.25)],
    supportEngines: [s("PatchEngine", 0.15)],
    validationEngines: [v("QA", 0.15)],
    safetyWeight: 0.1,
    description: "代码生成 / 检查 / 修复。",
  },
  {
    intentType: "WORLD_GENERATION",
    chineseName: "世界生成",
    primaryEngines: [p("SequenceWorld", 0.35), p("MSL", 0.2)],
    supportEngines: [s("ModelGeneration", 0.15), s("Narrative", 0.1), s("Knowledge", 0.1)],
    validationEngines: [],
    safetyWeight: 0.1,
    description: "生成世界结构与基础元素。",
  },
  {
    intentType: "MUSIC_CREATION",
    chineseName: "音乐创作",
    primaryEngines: [p("Vocal", 0.35)],
    supportEngines: [s("Narrative", 0.15), s("World", 0.15), s("PromptForge", 0.15), s("Translation", 0.1)],
    validationEngines: [],
    safetyWeight: 0.1,
    description: "歌词 / 声乐 / Suno Prompt。",
  },
  {
    intentType: "SEQUENCE_TASK",
    chineseName: "数列任务",
    primaryEngines: [p("Terminal", 0.35), p("MSL", 0.2)],
    supportEngines: [s("EngineRegistry", 0.15), s("PermissionGuard", 0.15)],
    validationEngines: [],
    safetyWeight: 0.15,
    description: "数列对象 / MSL 解释。",
  },
  {
    intentType: "SOCIAL_PUBLISH",
    chineseName: "社交发布",
    primaryEngines: [p("SocialDraft", 0.35), p("Narrative", 0.2)],
    supportEngines: [s("Workspace", 0.1)],
    validationEngines: [v("QA", 0.15), v("GovernanceAudit", 0.1)],
    safetyWeight: 0.1,
    description: "草稿生成与发布前治理。",
  },
  {
    intentType: "CALENDAR_TRIGGER",
    chineseName: "日历触发",
    primaryEngines: [p("CalendarTrigger", 0.4), p("EventScheduler", 0.2)],
    supportEngines: [s("Workspace", 0.15)],
    validationEngines: [v("QA", 0.15)],
    safetyWeight: 0.1,
    description: "把意图转为可触发任务。",
  },
  {
    intentType: "STORE_CAPABILITY",
    chineseName: "能力商店",
    primaryEngines: [p("StoreInstaller", 0.35), p("CapabilityRegistry", 0.2)],
    supportEngines: [s("PermissionGuard", 0.2)],
    validationEngines: [v("QA", 0.15)],
    safetyWeight: 0.1,
    description: "能力包安装 / 启用。",
  },
  {
    intentType: "GOVERNANCE_AUDIT",
    chineseName: "治理审计",
    primaryEngines: [p("QA", 0.3), p("SecretGuard", 0.25)],
    supportEngines: [s("BugAudit", 0.2), s("Constitution", 0.15)],
    validationEngines: [],
    safetyWeight: 0.1,
    description: "QA / Bug Audit / Constitution。",
  },
];

export function getEngineWeightProfile(intentType: string): EngineWeightProfile | undefined {
  return ENGINE_WEIGHT_PROFILES.find((e) => e.intentType === intentType);
}
