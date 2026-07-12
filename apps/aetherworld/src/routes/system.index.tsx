// 系统索引 - 六大一级导航
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/system/")({
  head: () => ({ meta: [{ title: "系统 · Aetherworld" }] }),
  component: SystemIndex,
});

interface NavItem {
  to: string;
  label: string;
  cnDesc?: string;
}

interface NavGroup {
  id: string;
  label: string;
  caption: string;
  accent: string;
  items: NavItem[];
}

const GROUPS: NavGroup[] = [
  {
    id: "cockpit",
    label: "中枢",
    caption: "Founder Cockpit · 默认首页",
    accent: "border-cyan-500/40 bg-cyan-500/5",
    items: [
      { to: "/system/founder-cockpit", label: "创始人中枢驾驶舱" },
      { to: "/system/aetherboss-agent", label: "总策 Agent" },
      { to: "/system/local-agi", label: "专属 AGI" },
    ],
  },
  {
    id: "world",
    label: "世界",
    caption: "World Radar · 外界数据、趋势、竞品、机会",
    accent: "border-purple-500/40 bg-purple-500/5",
    items: [
      { to: "/system/world-radar", label: "世界雷达" },
      { to: "/external-data-sources", label: "外部数据源" },
      { to: "/system/network", label: "联网中心" },
      { to: "/system/open-architecture", label: "开源架构吸收" },
    ],
  },
  {
    id: "factory",
    label: "工厂",
    caption: "Factory OS · 五大无人工厂",
    accent: "border-emerald-500/40 bg-emerald-500/5",
    items: [
      { to: "/system/autonomous-factory", label: "无人工厂总控" },
      { to: "/system/intake-forge", label: "种子投喂（材料工厂）" },
      { to: "/system/datasets", label: "数据血池" },
      { to: "/system/data-engine", label: "数据总控" },
      { to: "/system/local-training", label: "造脑配置（本机训练）" },
      { to: "/system/auto-training", label: "自动训练" },
      { to: "/system/unattended-training", label: "无人训练" },
      { to: "/system/training-workflows", label: "训练工作流" },
      { to: "/system/training-factory-calculus", label: "训练工厂计算法" },
      { to: "/system/aetherseed-vl", label: "AetherSeed-VL 多模态" },
      { to: "/system/local-gateway", label: "本地执行网关" },
      { to: "/system/first-run-readiness", label: "第一炉训练准备" },
    ],
  },
  {
    id: "product",
    label: "产品",
    caption: "Product Forge · 应用、能力包、模型、商店草案、报告",
    accent: "border-amber-500/40 bg-amber-500/5",
    items: [
      { to: "/system/product-forge", label: "产品锻造台" },
      { to: "/system/capability-assets", label: "能力资产" },
      { to: "/system/user-assets", label: "用户上传出售" },
      { to: "/system/personal-model-forge", label: "个人模型铸造工坊" },
      { to: "/store", label: "商店首页" },
      { to: "/apps", label: "应用" },
    ],
  },
  {
    id: "evolution",
    label: "进化",
    caption: "Evolution Ledger · 模型血统 / 数据血统 / 失败恢复 / 增长报告",
    accent: "border-pink-500/40 bg-pink-500/5",
    items: [
      { to: "/system/evolution-ledger", label: "进化账本" },
      { to: "/system/experiment-ledger", label: "实验账本（模型血统器官）" },
      { to: "/system/record-center", label: "记录中心" },
      { to: "/system-bug-audit", label: "系统免疫（Bug 审计）" },
      { to: "/system/page-completeness", label: "页面体检" },
      { to: "/system/route-health", label: "路由健康" },
      { to: "/system/layer-audit", label: "分层审计（L0-L10）" },
      { to: "/version-leap", label: "版本跃迁" },
      { to: "/reality-calibration", label: "现实校准 / 重算" },
    ],
  },
  {
    id: "me",
    label: "我的",
    caption: "Founder Profile · 身份、权限、模型来源、账户",
    accent: "border-slate-500/40 bg-slate-500/5",
    items: [
      { to: "/system/founder-profile", label: "创始人档案" },
      { to: "/founder-console", label: "Founder 控制台" },
      { to: "/founder-permissions", label: "Founder 权限" },
      { to: "/founder-audit", label: "Founder 审计" },
      { to: "/authority-hierarchy", label: "权限层级" },
      { to: "/account/settings", label: "账户设置" },
      { to: "/account/security", label: "账户安全" },
      { to: "/system/manual", label: "总说明书" },
      { to: "/system/legacy-modules", label: "旧模块激活图谱" },
    ],
  },
];

function SystemIndex() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-[#0a0f1f] to-slate-950 px-6 py-8 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-2xl border border-slate-800/60 bg-slate-950/60 p-6">
          <p className="text-xs uppercase tracking-widest text-cyan-300/80">
            Aetherworld · Founder × AGI Company Cockpit
          </p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-50">系统 · 六大入口</h1>
          <p className="mt-1 text-sm text-slate-400">
            中枢 / 世界 / 工厂 / 产品 / 进化 / 我的 —— 一个创始人 + 一个专属 AGI 操控一家无人公司
          </p>
          <div className="mt-3">
            <Link
              to="/system/founder-cockpit"
              className="inline-block rounded-md border border-cyan-400/60 bg-cyan-500/15 px-4 py-2 text-sm text-cyan-100 hover:bg-cyan-500/25"
            >
              打开创始人中枢驾驶舱 →
            </Link>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {GROUPS.map((group) => (
            <article
              key={group.id}
              className={`rounded-xl border p-4 ${group.accent}`}
            >
              <header className="mb-3">
                <h2 className="text-lg font-semibold text-slate-100">{group.label}</h2>
                <p className="text-xs text-slate-400">{group.caption}</p>
              </header>
              <ul className="space-y-1 text-sm">
                {group.items.map((item) => (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className="block rounded px-2 py-1 text-slate-300 hover:bg-slate-800/60 hover:text-slate-100"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
