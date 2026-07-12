// 项目融合 · 冲突检测
// 对照 Aetherworld 当前主要子系统命名，识别可能的命名 / 路由 / 类型 / 状态冲突
import type { SameAccountProjectCandidate } from "./projectFusionTypes";

const EXISTING_ROUTES = [
  "/chat", "/workspace", "/store", "/calendar", "/scheduler",
  "/analytics", "/social", "/sandbox", "/app-runtime",
  "/system", "/system/manual", "/system/record-center",
  "/system/agents", "/system/legacy-modules",
  "/system/open-architecture", "/system/network",
  "/llm-providers",
];

const EXISTING_TYPES = [
  "ChatMessage", "ChatSession", "WorkspaceObject", "ScheduledTask",
  "CalendarTrigger", "CapabilityPackage", "RecordEvent",
  "AgentProfile", "ProviderProfile", "NetworkSource",
  "OpenArchitectureSource",
];

const RESPONSIVE_SHELL_GUARD = [
  "App.tsx", "router.tsx", "__root.tsx",
  "AetherChatShell", "ResponsiveShell",
];

export function detectConflicts(c: SameAccountProjectCandidate): string[] {
  const conflicts: string[] = [];

  for (const r of c.reusableRoutes ?? []) {
    if (EXISTING_ROUTES.includes(r)) {
      conflicts.push(`路由冲突：${r} 与当前 Aetherworld 路由重名，需走 ROUTE_REFERENCE 而非覆盖。`);
    }
  }

  for (const m of c.reusableDataModels ?? []) {
    if (EXISTING_TYPES.includes(m)) {
      conflicts.push(`类型冲突：${m} 已存在于 Aetherworld，融合时需走适配器或新命名。`);
    }
  }

  for (const guard of RESPONSIVE_SHELL_GUARD) {
    if ((c.description ?? "").includes(guard)) {
      conflicts.push(`Shell 冲突：候选项目涉及 ${guard}，禁止覆盖当前 Responsive Shell v1。`);
    }
  }

  if (c.riskLevel === "HIGH") {
    conflicts.push("高风险：含 auth / payment / 外部 API / DB schema 等敏感项，禁止直接融合，仅生成 Bridge Plan。");
  }

  return conflicts;
}
