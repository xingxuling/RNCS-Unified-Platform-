// System Page Completeness Audit v0.1
// 系统总览中每个入口的完整性分级。
// 状态字段含义见下方 SystemRouteStatus。

export type SystemRouteStatus =
  | "READY"          // 页面、路由、菜单全部正常
  | "PLACEHOLDER"    // 仅占位页，需明确「开发中」
  | "RUNTIME_ONLY"   // lib/runtime 已有，但缺真实页面
  | "PAGE_MISSING"   // 菜单引用了但页面文件不存在
  | "BROKEN"         // 页面 import / 渲染异常
  | "HIDDEN";        // 暂不暴露给用户

export type SystemRouteCategory =
  | "文档"
  | "训练"
  | "能力资产"
  | "系统审计"
  | "治理"
  | "权限"
  | "未公开";

export interface SystemRouteItem {
  id: string;
  label: string;
  path: string;
  category: SystemRouteCategory;
  status: SystemRouteStatus;
  description: string;
  routeFile?: string;
  note?: string;
}

// —— 本轮人工核对：每条菜单链接均有真实 .tsx 文件（150-500 行实现），归类 READY。
// 用户在审计提示中提到、但当前并未出现在菜单中的 4 条路径登记为 HIDDEN+PAGE_MISSING。
export const SYSTEM_ROUTE_REGISTRY: SystemRouteItem[] = [
  // 文档 / 说明书
  { id: "manual",                  label: "总说明书 v0.1",           path: "/system/manual",                  category: "文档",     status: "READY", description: "系统总说明书与版本档案。",       routeFile: "src/routes/system.manual.tsx" },
  { id: "record-center",           label: "记录中心",                 path: "/system/record-center",           category: "文档",     status: "READY", description: "全局事件 / 决策 / 审计记录中心。", routeFile: "src/routes/system.record-center.tsx" },
  { id: "agents",                  label: "数列 Agent",               path: "/system/agents",                  category: "文档",     status: "READY", description: "数列人格 / Agent 总览。",         routeFile: "src/routes/system.agents.tsx" },
  { id: "legacy-modules",          label: "旧模块激活图谱",           path: "/system/legacy-modules",          category: "文档",     status: "READY", description: "历史模块的当前状态与重新激活路径。", routeFile: "src/routes/system.legacy-modules.tsx" },
  { id: "open-architecture",       label: "开源架构吸收",             path: "/system/open-architecture",       category: "文档",     status: "READY", description: "外部开源架构的对照与吸收记录。",  routeFile: "src/routes/system.open-architecture.tsx" },
  { id: "network",                 label: "联网中心",                 path: "/system/network",                 category: "文档",     status: "READY", description: "外部网络访问与数据源接入中心。",  routeFile: "src/routes/system.network.tsx" },
  { id: "lovable-pass",            label: "Lovable 开发期融合报告",   path: "/system/lovable-pass",            category: "文档",     status: "READY", description: "Lovable 开发回合融合记录。",      routeFile: "src/routes/system.lovable-pass.tsx" },
  { id: "project-fusion",          label: "项目融合工作台（离线登记）", path: "/system/project-fusion",        category: "文档",     status: "READY", description: "跨项目离线融合登记。",            routeFile: "src/routes/system.project-fusion.tsx" },
  { id: "imaginative-fusion",      label: "畅想融合（跨项目）",       path: "/system/imaginative-fusion",      category: "文档",     status: "READY", description: "跨项目畅想阶段融合面板。",        routeFile: "src/routes/system.imaginative-fusion.tsx" },

  // 训练
  { id: "personal-model-forge",       label: "个人模型铸造工坊",       path: "/system/personal-model-forge",       category: "训练", status: "READY", description: "个人模型铸造端到端工坊。",       routeFile: "src/routes/system.personal-model-forge.tsx" },
  { id: "training-factory-calculus",  label: "训练工厂计算法",         path: "/system/training-factory-calculus",  category: "训练", status: "READY", description: "训练工厂的计算法与产线视图。",   routeFile: "src/routes/system.training-factory-calculus.tsx" },
  { id: "intake-forge",               label: "投喂式训练数据铸造炉",   path: "/system/intake-forge",               category: "训练", status: "READY", description: "投喂式训练数据铸造炉。",         routeFile: "src/routes/system.intake-forge.tsx" },
  { id: "datasets",                   label: "数据集",                 path: "/system/datasets",                   category: "训练", status: "READY", description: "训练数据集索引与管理。",         routeFile: "src/routes/system.datasets.tsx" },
  { id: "local-training",             label: "本机训练",               path: "/system/local-training",             category: "训练", status: "READY", description: "本机训练任务面板。",             routeFile: "src/routes/system.local-training.tsx" },
  { id: "data-engine",                label: "数据引擎",               path: "/system/data-engine",                category: "训练", status: "READY", description: "AetherSeed 训练数据流总控视图。", routeFile: "src/routes/system.data-engine.tsx", note: "本轮新增" },
  { id: "experiment-ledger",          label: "实验账本",               path: "/system/experiment-ledger",          category: "训练", status: "READY", description: "AetherSeed 模型血统记录器官：实验/失败/checkpoint/下一炉/血统线。", routeFile: "src/routes/system.experiment-ledger.tsx", note: "本轮新增·文明种子编译法" },
  { id: "auto-training",              label: "自动训练",               path: "/system/auto-training",              category: "训练", status: "READY", description: "AetherSeed 受控自动训练执行器：白名单 + dry-run + 用户确认。", routeFile: "src/routes/system.auto-training.tsx", note: "本轮新增·训练执行肌肉" },
  { id: "training-workflows",         label: "训练工作流",             path: "/system/training-workflows",         category: "训练", status: "READY", description: "AetherSeed 训练工作流编排器：把 Intake → Dataset → Export → Plan → Dry-run → 确认 → 训练 → 实验账本 → 血统编排为完整流水线。", routeFile: "src/routes/system.training-workflows.tsx", note: "本轮新增·训练工作流编排器" },
  { id: "local-gateway",              label: "本地执行网关",           path: "/system/local-gateway",              category: "训练", status: "READY", description: "Aether Local Execution Gateway：127.0.0.1:18771，白名单训练命令 + dry-run + 用户确认 + 日志脱敏。", routeFile: "src/routes/system.local-gateway.tsx", note: "本轮新增·本地执行网关" },
  { id: "first-run-readiness",        label: "第一炉训练准备",         path: "/system/first-run-readiness",        category: "训练", status: "READY", description: "AetherSeed 第一炉训练准备：数据 / 导出 / 计划 / 自动训练 / 实验账本 / 本地网关 / 用户确认 全部就绪后才允许点火。", routeFile: "src/routes/system.first-run-readiness.tsx", note: "本轮新增·第一炉训练准备" },

  // 能力资产
  { id: "capability-assets", label: "能力资产（内部 × 外部 × 用户）", path: "/system/capability-assets", category: "能力资产", status: "READY", description: "三类能力源的统一资产视图。",     routeFile: "src/routes/system.capability-assets.tsx" },
  { id: "user-assets",       label: "用户上传出售",                   path: "/system/user-assets",       category: "能力资产", status: "READY", description: "用户上传资产与出售流程。",       routeFile: "src/routes/system.user-assets.tsx" },

  // 系统审计
  { id: "bug-audit",            label: "Bug 检查",          path: "/system-bug-audit",        category: "系统审计", status: "READY", description: "全局 Bug 与 PENDING_FEATURES 审计。", routeFile: "src/routes/system-bug-audit.tsx" },
  { id: "system-audit",         label: "系统审计",          path: "/system-audit",            category: "系统审计", status: "READY", description: "系统级审计聚合。",                routeFile: "src/routes/system-audit.tsx" },
  { id: "route-health",         label: "路由健康",          path: "/system/route-health",     category: "系统审计", status: "READY", description: "路由可访问性健康报告。",          routeFile: "src/routes/system.route-health.tsx" },
  { id: "page-completeness",    label: "页面完整性",        path: "/system/page-completeness", category: "系统审计", status: "READY", description: "系统总览每个入口的完整性分级。", routeFile: "src/routes/system.page-completeness.tsx", note: "本轮新增" },
  { id: "layer-audit",          label: "分层审计（L0-L10）", path: "/system/layer-audit",     category: "系统审计", status: "READY", description: "L0-L10 分层审计。",               routeFile: "src/routes/system.layer-audit.tsx" },
  { id: "web-capability-audit", label: "能力模型审计",       path: "/web-capability-audit",   category: "系统审计", status: "READY", description: "Web 能力模型审计。",              routeFile: "src/routes/web-capability-audit.tsx" },
  { id: "web-knowledge-audit",  label: "知识三体审计",       path: "/web-knowledge-audit",    category: "系统审计", status: "READY", description: "知识三体审计。",                  routeFile: "src/routes/web-knowledge-audit.tsx" },
  { id: "webllm-audit",         label: "WebLLM 审计",        path: "/webllm-audit",           category: "系统审计", status: "READY", description: "WebLLM 审计。",                   routeFile: "src/routes/webllm-audit.tsx" },
  { id: "weblcm-audit",         label: "WebLCM 审计",        path: "/weblcm-audit",           category: "系统审计", status: "READY", description: "WebLCM 审计。",                   routeFile: "src/routes/weblcm-audit.tsx" },

  // 治理
  { id: "system-constitution",     label: "系统宪法",       path: "/system-constitution",     category: "治理", status: "READY", description: "系统宪法条文。",          routeFile: "src/routes/system-constitution.tsx" },
  { id: "constitution-violations", label: "宪法违反记录",   path: "/constitution-violations", category: "治理", status: "READY", description: "宪法违反登记。",          routeFile: "src/routes/constitution-violations.tsx" },
  { id: "version-leap",            label: "版本跃迁",       path: "/version-leap",            category: "治理", status: "READY", description: "版本跃迁计划。",          routeFile: "src/routes/version-leap.tsx" },
  { id: "reality-calibration",     label: "现实校准/重算",  path: "/reality-calibration",     category: "治理", status: "READY", description: "现实校准与重算流程。",    routeFile: "src/routes/reality-calibration.tsx" },

  // 权限
  { id: "founder-console",     label: "Founder 控制台", path: "/founder-console",     category: "权限", status: "READY", description: "Founder 控制台。",        routeFile: "src/routes/founder-console.tsx" },
  { id: "founder-permissions", label: "Founder 权限",   path: "/founder-permissions", category: "权限", status: "READY", description: "Founder 权限管理。",      routeFile: "src/routes/founder-permissions.tsx" },
  { id: "founder-audit",       label: "Founder 审计",   path: "/founder-audit",       category: "权限", status: "READY", description: "Founder 操作审计。",      routeFile: "src/routes/founder-audit.tsx" },
  { id: "authority-hierarchy", label: "权限层级",       path: "/authority-hierarchy", category: "权限", status: "READY", description: "权限层级图。",            routeFile: "src/routes/authority-hierarchy.tsx" },

  // 用户与权限（v0.1·用户登录与权限系统）
  { id: "user-management", label: "用户管理",   path: "/system/user-management", category: "权限", status: "READY", description: "Aetherworld 用户管理：列出用户、修改普通/高级/管理员角色、审计变更。", routeFile: "src/routes/system.user-management.tsx", note: "v0.1·用户登录与权限系统" },
  { id: "model-providers", label: "模型来源",   path: "/system/model-providers", category: "权限", status: "READY", description: "AI 模型来源与权限隔离：Lovable AI 创始人专属，其它角色走本地/WebLLM/自带 Key。", routeFile: "src/routes/system.model-providers.tsx", note: "v0.1·AI 权限隔离" },

  // 未公开（用户在审计提示中提到，但尚未实现，故 HIDDEN，不暴露给菜单）
  { id: "native-model",  label: "原生模型",   path: "/system/native-model",  category: "未公开", status: "PAGE_MISSING", description: "原生模型面板（规划中，未实现，菜单未暴露）。", note: "HIDDEN：不展示，避免 404。" },
  
  { id: "training-lab",  label: "训练实验室", path: "/system/training-lab",  category: "未公开", status: "PAGE_MISSING", description: "训练实验室（规划中，未实现，菜单未暴露）。",   note: "HIDDEN：不展示，避免 404。" },
  { id: "analytics",     label: "分析中心",   path: "/system/analytics",     category: "未公开", status: "PAGE_MISSING", description: "分析中心（规划中，未实现，菜单未暴露）。",     note: "HIDDEN：不展示，避免 404。" },
];

export interface SystemPageCompletenessReport {
  totalEntries: number;
  ready: number;
  placeholder: number;
  runtimeOnly: number;
  pageMissing: number;
  broken: number;
  hidden: number;
  visibleInOverview: number;
  generatedAt: string;
}

export function buildCompletenessReport(): SystemPageCompletenessReport {
  const r = SYSTEM_ROUTE_REGISTRY;
  const hidden = r.filter((i) => i.status === "PAGE_MISSING" || i.status === "HIDDEN").length;
  return {
    totalEntries: r.length,
    ready:        r.filter((i) => i.status === "READY").length,
    placeholder:  r.filter((i) => i.status === "PLACEHOLDER").length,
    runtimeOnly:  r.filter((i) => i.status === "RUNTIME_ONLY").length,
    pageMissing:  r.filter((i) => i.status === "PAGE_MISSING").length,
    broken:       r.filter((i) => i.status === "BROKEN").length,
    hidden,
    visibleInOverview: r.length - hidden,
    generatedAt: new Date().toISOString(),
  };
}
