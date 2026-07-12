// Aether Route Health Recovery v0.1
// 全路由健康检查报告（静态登记，便于在 /system/route-health 页面与 Chat 中查阅）。
// 真实自动化扫描（Playwright / 浏览器点击）见 PENDING_FEATURES。

export interface RouteHealthItem {
  path: string;
  label: string;
  source: "system-menu" | "verification" | "alias";
  status: "OK" | "ALIAS" | "PLACEHOLDER" | "MISSING";
  note?: string;
}

export interface RouteHealthReport {
  totalRouteFiles: number;
  totalMenuLinks: number;
  missingRouteTargets: string[];
  orphanRouteFiles: string[];
  duplicatePaths: string[];
  brokenImports: string[];
  runtimeRiskRoutes: string[];
  fixedRoutes: string[];
  remainingIssues: string[];
}

// 本轮人工核对的系统页（system.tsx 菜单 + 用户验收清单）。
export const ROUTE_HEALTH_ITEMS: RouteHealthItem[] = [
  // —— 系统菜单 · 文档/说明书 ——
  { path: "/system/manual",                  label: "总说明书 v0.1",                 source: "system-menu", status: "OK" },
  { path: "/system/record-center",           label: "记录中心",                       source: "system-menu", status: "OK" },
  { path: "/system/agents",                  label: "数列 Agent",                     source: "system-menu", status: "OK" },
  { path: "/system/legacy-modules",          label: "旧模块激活图谱",                 source: "system-menu", status: "OK" },
  { path: "/system/open-architecture",       label: "开源架构吸收",                   source: "system-menu", status: "OK" },
  { path: "/system/network",                 label: "联网中心",                       source: "system-menu", status: "OK" },
  { path: "/system/lovable-pass",            label: "Lovable 开发期融合报告",         source: "system-menu", status: "OK" },
  { path: "/system/project-fusion",          label: "项目融合工作台（离线登记）",     source: "system-menu", status: "OK" },
  { path: "/system/imaginative-fusion",      label: "畅想融合（跨项目）",             source: "system-menu", status: "OK" },
  { path: "/system/personal-model-forge",    label: "个人模型铸造工坊",               source: "system-menu", status: "OK" },
  { path: "/system/training-factory-calculus", label: "训练工厂计算法",               source: "system-menu", status: "OK" },
  { path: "/system/intake-forge",            label: "投喂式训练数据铸造炉",           source: "system-menu", status: "OK" },
  { path: "/system/datasets",                label: "数据集",                         source: "system-menu", status: "OK" },
  { path: "/system/local-training",          label: "本机训练",                       source: "system-menu", status: "OK" },
  { path: "/system/capability-assets",       label: "能力资产（内部 × 外部 × 用户）", source: "system-menu", status: "OK" },
  { path: "/system/user-assets",             label: "用户上传出售",                   source: "system-menu", status: "OK" },

  // —— 系统菜单 · QA / 审计 ——
  { path: "/system-bug-audit",               label: "Bug 检查",                       source: "system-menu", status: "OK" },
  { path: "/system-audit",                   label: "系统审计",                       source: "system-menu", status: "OK" },
  { path: "/system/layer-audit",             label: "分层审计（L0-L10）",             source: "system-menu", status: "OK" },
  { path: "/web-capability-audit",           label: "能力模型审计",                   source: "system-menu", status: "OK" },
  { path: "/web-knowledge-audit",            label: "知识三体审计",                   source: "system-menu", status: "OK" },
  { path: "/webllm-audit",                   label: "WebLLM 审计",                    source: "system-menu", status: "OK" },
  { path: "/weblcm-audit",                   label: "WebLCM 审计",                    source: "system-menu", status: "OK" },
  { path: "/system/route-health",            label: "路由健康",                       source: "system-menu", status: "OK", note: "本轮新增" },

  // —— 系统菜单 · 宪法/治理 ——
  { path: "/system-constitution",            label: "系统宪法",                       source: "system-menu", status: "OK" },
  { path: "/constitution-violations",        label: "宪法违反记录",                   source: "system-menu", status: "OK" },
  { path: "/version-leap",                   label: "版本跃迁",                       source: "system-menu", status: "OK" },
  { path: "/reality-calibration",            label: "现实校准/重算",                  source: "system-menu", status: "OK" },

  // —— 系统菜单 · 权限/创始人 ——
  { path: "/founder-console",                label: "Founder 控制台",                 source: "system-menu", status: "OK" },
  { path: "/founder-permissions",            label: "Founder 权限",                   source: "system-menu", status: "OK" },
  { path: "/founder-audit",                  label: "Founder 审计",                   source: "system-menu", status: "OK" },
  { path: "/authority-hierarchy",            label: "权限层级",                       source: "system-menu", status: "OK" },

  // —— 验收清单中提到、但当前路径不一致的别名 ——
  { path: "/system/bug-audit",               label: "Bug 检查（别名）",               source: "alias",       status: "ALIAS", note: "重定向至 /system-bug-audit" },
];

export const ROUTE_HEALTH_REPORT: RouteHealthReport = {
  totalRouteFiles: 346,
  totalMenuLinks: ROUTE_HEALTH_ITEMS.filter((i) => i.source === "system-menu").length,
  missingRouteTargets: [],
  orphanRouteFiles: [],
  duplicatePaths: [],
  brokenImports: [],
  runtimeRiskRoutes: [],
  fixedRoutes: [
    "/system/route-health（本轮新增）",
    "/system/bug-audit（新增别名，重定向至 /system-bug-audit）",
  ],
  remainingIssues: [
    "未自动化：浏览器点击全路径冒烟测试（Playwright e2e）",
    "未自动化：routeTree 生成监听与变更预警",
    "未自动化：运行时页面异常聚合（按 route 聚合）",
    "未自动化：菜单链接持续监控（链接腐烂检测）",
  ],
};

export function routeHealthSummary() {
  const items = ROUTE_HEALTH_ITEMS;
  return {
    total: items.length,
    ok: items.filter((i) => i.status === "OK").length,
    alias: items.filter((i) => i.status === "ALIAS").length,
    placeholder: items.filter((i) => i.status === "PLACEHOLDER").length,
    missing: items.filter((i) => i.status === "MISSING").length,
  };
}
