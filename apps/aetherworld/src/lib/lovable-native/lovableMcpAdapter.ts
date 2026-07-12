/**
 * Lovable MCP / Chat Connectors Adapter（只读说明层）
 *
 * 不实际调用 MCP，只在 Aetherworld 内描述 Lovable 可连接的 MCP 上下文源，
 * 方便用户在「Lovable 原生能力」页面查看与跳转配置。
 */
export interface LovableMcpEntry {
  connectorId: string;
  chineseName: string;
  enLabel: string;
  purpose: string;
  fitFor: string[];
}

export const LOVABLE_MCP_ENTRIES: LovableMcpEntry[] = [
  { connectorId: "notion",   chineseName: "Notion 上下文",     enLabel: "Notion",            purpose: "把 Notion 页面作为构建上下文。",       fitFor: ["创作", "知识库"] },
  { connectorId: "linear",   chineseName: "Linear 任务",       enLabel: "Linear",            purpose: "把 Linear Issue 引入对话上下文。",     fitFor: ["项目", "任务"] },
  { connectorId: "miro",     chineseName: "Miro 白板",         enLabel: "Miro",              purpose: "把 Miro 图当作 UI / 流程草案。",        fitFor: ["设计", "应用 Runtime"] },
  { connectorId: "atlassian",chineseName: "Atlassian (Jira)",  enLabel: "Atlassian",         purpose: "Jira / Confluence 上下文接入。",        fitFor: ["项目", "知识库"] },
  { connectorId: "sentry",   chineseName: "Sentry 错误",       enLabel: "Sentry",            purpose: "把 Sentry 错误事件作为修复上下文。",   fitFor: ["WebCodeM", "QA"] },
  { connectorId: "posthog",  chineseName: "PostHog 分析",      enLabel: "PostHog",           purpose: "产品分析 / 实验数据上下文。",          fitFor: ["决策", "策略"] },
];

export const LOVABLE_MCP_NOTE =
  "MCP 连接器只为 Lovable 代理本身提供上下文，Aetherworld 运行时不会直接调用这些工具。";
