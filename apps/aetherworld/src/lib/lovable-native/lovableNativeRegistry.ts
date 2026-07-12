import type {
  LovableCapabilityEntry,
  LovableCapabilityId,
} from "./lovableNativeTypes";

/**
 * Lovable 原生能力注册表。
 *
 * 状态字段只是「初始声明」，运行时可以由各 adapter 的 detect() 覆盖。
 * 这里不做副作用，只暴露纯数据。
 */
export const LOVABLE_NATIVE_REGISTRY: LovableCapabilityEntry[] = [
  {
    capabilityId: "LOVABLE_CLOUD",
    chineseName: "Lovable 云后端",
    enLabel: "Lovable Cloud",
    purpose: "全托管数据库 / 存储 / 鉴权 / 边缘函数，可作为 Aetherworld 默认后端。",
    fitFor: ["工作区", "用户系统", "对象系统", "社交", "商店", "触发日历"],
    status: "ENABLED",
    recommendation: "RECOMMEND_NOW",
    configEntry: "/system",
    risks: ["仍需保留可迁移到自托管后端的抽象，避免锁定。"],
  },
  {
    capabilityId: "LOVABLE_AI",
    chineseName: "Lovable AI 网关",
    enLabel: "Lovable AI Gateway",
    purpose: "免密接入 Gemini / GPT 系列模型，作为云端推理 Provider 之一。",
    fitFor: ["对话", "WebCodeM", "WebStoryM", "QA", "结构化抽取"],
    status: "AVAILABLE",
    recommendation: "RECOMMEND_NOW",
    configEntry: "/llm-providers/settings",
    risks: [
      "云端推理与本地 WebLLM / Ollama 不同，敏感主体数据请优先用本地 Provider。",
      "存在按用量计费与速率限制。",
    ],
  },
  {
    capabilityId: "LOVABLE_BUILD_URL",
    chineseName: "Lovable 构建链接",
    enLabel: "Lovable Build with URL",
    purpose: "把 WebCodeM / App Runtime 的草案直接转成 Lovable 可一键创建的应用链接。",
    fitFor: ["WebCodeM", "App Runtime", "对话承接", "示例库"],
    status: "AVAILABLE",
    recommendation: "RECOMMEND_NOW",
    configEntry: "/integrations/lovable",
    risks: ["生成的链接会公开 Prompt 内容，避免放入敏感数列。"],
  },
  {
    capabilityId: "LOVABLE_GITHUB_SYNC",
    chineseName: "GitHub / GitLab 同步",
    enLabel: "GitHub Sync",
    purpose: "通过 Handoff Pack 引导用户把代码同步到外部仓库。",
    fitFor: ["WebCodeM", "Handoff Pack"],
    status: "PARTIAL",
    recommendation: "RECOMMEND_LATER",
    configEntry: "/integrations/lovable",
    risks: ["当前不直接操作仓库，仅生成同步清单与提交建议。"],
  },
  {
    capabilityId: "LOVABLE_MCP",
    chineseName: "MCP 上下文连接器",
    enLabel: "MCP / Chat Connectors",
    purpose: "把 Notion / Linear / Miro 等作为 Lovable 代理的上下文来源。",
    fitFor: ["创作", "项目管理", "构建上下文"],
    status: "AVAILABLE",
    recommendation: "OPTIONAL",
    configEntry: "/integrations/lovable",
    risks: ["MCP 工具只为 Lovable 代理本身扩展能力，不会出现在 Aetherworld 的运行时。"],
  },
  {
    capabilityId: "LOVABLE_CONNECTORS",
    chineseName: "App 连接器",
    enLabel: "App Connectors",
    purpose: "通过 Lovable Connector Gateway 调用 Slack / Gmail / Sheets 等服务。",
    fitFor: ["触发日历", "提醒系统", "应用 Runtime", "WebXXM"],
    status: "AVAILABLE",
    recommendation: "OPTIONAL",
    configEntry: "/integrations/lovable",
    risks: ["凭据为工作区主账户，不代表终端用户授权，注意区分使用场景。"],
  },
  {
    capabilityId: "LOVABLE_STRIPE",
    chineseName: "Stripe 支付",
    enLabel: "Stripe Payments",
    purpose: "为 Aether Store 二阶段交易接入内置 Stripe 支付。",
    fitFor: ["商店", "订单", "订阅"],
    status: "AVAILABLE",
    recommendation: "RECOMMEND_LATER",
    configEntry: "/integrations/lovable",
    risks: ["内测阶段不接真实支付，先以演示流程为主。"],
  },
  {
    capabilityId: "LOVABLE_RESEND",
    chineseName: "Resend 邮件",
    enLabel: "Resend / Lovable Email",
    purpose: "发送鉴权邮件、提醒、商店通知。",
    fitFor: ["用户系统", "提醒系统", "商店"],
    status: "AVAILABLE",
    recommendation: "RECOMMEND_LATER",
    configEntry: "/integrations/lovable",
    risks: ["发送频率受 Resend 计费与限速影响。"],
  },
  {
    capabilityId: "LOVABLE_GOOGLE_MAPS",
    chineseName: "Google 地图",
    enLabel: "Google Maps Platform",
    purpose: "为世界 / 现实数据 / 触发日历提供地理与位置能力。",
    fitFor: ["世界", "现实数据", "触发"],
    status: "AVAILABLE",
    recommendation: "OPTIONAL",
    configEntry: "/integrations/lovable",
    risks: ["按调用计费；公开页面避免泄漏地址级数据。"],
  },
  {
    capabilityId: "LOVABLE_GEMINI_ENTERPRISE",
    chineseName: "Gemini 企业搜索",
    enLabel: "Gemini Enterprise",
    purpose: "跨 Google 数据源做结构化搜索与摘要。",
    fitFor: ["WebKnowledgeM", "WebResearchM"],
    status: "AVAILABLE",
    recommendation: "OPTIONAL",
    configEntry: "/integrations/lovable",
    risks: ["企业级权限，需谨慎评估隐私边界。"],
  },
  {
    capabilityId: "LOVABLE_SEO_AEO",
    chineseName: "SEO / AI 搜索体检",
    enLabel: "SEO & AEO Review",
    purpose: "在发布前后做搜索引擎 / AI 搜索可见性检查。",
    fitFor: ["系统发布", "Notice System", "对话承接"],
    status: "ENABLED",
    recommendation: "RECOMMEND_NOW",
    configEntry: "/integrations/lovable",
    risks: ["扫描结果具有时延，发布前请预留几分钟。"],
  },
  {
    capabilityId: "LOVABLE_CUSTOM_DOMAIN",
    chineseName: "自定义域名",
    enLabel: "Custom Domain",
    purpose: "为发布的 Aetherworld 项目绑定自有域名。",
    fitFor: ["发布", "品牌"],
    status: "PARTIAL",
    recommendation: "OPTIONAL",
    configEntry: "/integrations/lovable",
    risks: ["DNS 传播可能耗时；代理模式会影响合规扫描归属。"],
  },
  {
    capabilityId: "LOVABLE_MOBILE_WORKFLOW",
    chineseName: "移动端工作流",
    enLabel: "Mobile App Workflow",
    purpose: "在 Lovable 移动 App 中继续迭代 Aetherworld 项目。",
    fitFor: ["多设备", "对话", "示例库"],
    status: "AVAILABLE",
    recommendation: "OPTIONAL",
    configEntry: "/integrations/lovable",
    risks: ["与桌面端为同一项目；编辑冲突由 Lovable 历史版本兜底。"],
  },
];

export function getCapability(
  id: LovableCapabilityId,
): LovableCapabilityEntry | undefined {
  return LOVABLE_NATIVE_REGISTRY.find((c) => c.capabilityId === id);
}

export function listRecommendedNow(): LovableCapabilityEntry[] {
  return LOVABLE_NATIVE_REGISTRY.filter((c) => c.recommendation === "RECOMMEND_NOW");
}
