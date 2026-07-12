// 产品锻造台 - 可发布 / 可测试 / 可出售 资产
import { createFileRoute } from "@tanstack/react-router";
import { buildProductForgeItems } from "@/lib/founder-cockpit/cockpitAggregator";
import type { ProductForgeItem } from "@/lib/founder-cockpit/cockpitTypes";

export const Route = createFileRoute("/system/product-forge")({
  head: () => ({
    meta: [
      { title: "产品锻造台 · Aetherworld" },
      { name: "description", content: "应用、能力包、模型、商店草案、报告、工作流、API" },
    ],
  }),
  component: ProductForgePage,
});

const KIND_LABEL: Record<ProductForgeItem["kind"], string> = {
  APP: "应用",
  PAGE: "页面",
  CAPABILITY: "能力包",
  DATASET: "数据集",
  MODEL: "模型",
  TEMPLATE: "模板",
  REPORT: "报告",
  WORKFLOW: "工作流",
  API: "API",
  STORE_DRAFT: "商店草案",
};

const STATUS_STYLE: Record<ProductForgeItem["status"], string> = {
  DRAFT: "border-slate-600 text-slate-400 bg-slate-800/40",
  TESTABLE: "border-amber-500/50 text-amber-200 bg-amber-500/10",
  RELEASABLE: "border-emerald-500/50 text-emerald-200 bg-emerald-500/10",
  RELEASED: "border-cyan-500/50 text-cyan-200 bg-cyan-500/10",
};

const STATUS_LABEL: Record<ProductForgeItem["status"], string> = {
  DRAFT: "草案",
  TESTABLE: "可测试",
  RELEASABLE: "可发布",
  RELEASED: "已发布",
};

function ProductForgePage() {
  const items = buildProductForgeItems();

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-[#0a0f1f] to-slate-950 px-6 py-8 text-slate-100">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-2xl border border-slate-800/60 bg-slate-950/60 p-6">
          <p className="text-xs uppercase tracking-widest text-cyan-300/80">Product Forge</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-50">产品锻造台</h1>
          <p className="mt-1 text-sm text-slate-400">
            所有可以给用户使用或出售的产物：应用、页面、能力包、数据集、模型、模板、报告、工作流、API、商店草案
          </p>
        </header>

        <section className="grid gap-3 lg:grid-cols-2">
          {items.map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-slate-800/60 bg-slate-950/40 p-4"
            >
              <header className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-slate-100">{item.name}</h2>
                  <p className="text-xs text-slate-500">{KIND_LABEL[item.kind]}</p>
                </div>
                <span
                  className={`rounded-full border px-2 py-0.5 text-xs ${STATUS_STYLE[item.status]}`}
                >
                  {STATUS_LABEL[item.status]}
                </span>
              </header>
              <ul className="mt-3 space-y-1 text-xs text-slate-300">
                <li>
                  <span className="text-slate-500">目标用户：</span>
                  {item.audience}
                </li>
                <li>
                  <span className="text-slate-500">使用价值：</span>
                  {item.value}
                </li>
                <li>
                  <span className="text-slate-500">风险：</span>
                  {item.risk}
                </li>
                <li>
                  <span className="text-slate-500">下一步：</span>
                  <span className="text-cyan-200">{item.nextStep}</span>
                </li>
              </ul>
              <div className="mt-3 flex gap-2 text-xs">
                <button className="rounded-md border border-slate-700 px-3 py-1 text-slate-300 hover:border-slate-500">
                  反馈入口
                </button>
                <button className="rounded-md border border-amber-400/50 bg-amber-500/10 px-3 py-1 text-amber-200 hover:bg-amber-500/20">
                  创始人裁决发布
                </button>
              </div>
            </article>
          ))}
        </section>

        <footer className="rounded-xl border border-slate-800/60 bg-slate-950/40 p-4 text-xs text-slate-500">
          <p>· 真实发布、真实上架、真实支付，必须创始人裁决</p>
        </footer>
      </div>
    </main>
  );
}
