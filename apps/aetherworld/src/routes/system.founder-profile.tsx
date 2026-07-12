// 创始人档案 - 身份 / 权限 / 模型来源 / 账户 / 设置
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/system/founder-profile")({
  head: () => ({
    meta: [
      { title: "创始人档案 · Aetherworld" },
      { name: "description", content: "身份、权限、模型来源、账户、设置" },
    ],
  }),
  component: FounderProfilePage,
});

function Row({ label, value, link }: { label: string; value: string; link?: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-slate-800/60 bg-slate-900/40 px-3 py-2 text-sm">
      <span className="text-slate-500">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-slate-200">{value}</span>
        {link ? (
          <Link to={link} className="text-xs text-cyan-300 hover:text-cyan-200">
            管理 →
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function FounderProfilePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-[#0a0f1f] to-slate-950 px-6 py-8 text-slate-100">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="rounded-2xl border border-slate-800/60 bg-slate-950/60 p-6">
          <p className="text-xs uppercase tracking-widest text-cyan-300/80">Founder Profile</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-50">创始人档案</h1>
          <p className="mt-1 text-sm text-slate-400">
            身份、权限、模型来源、账户、设置 —— 决定 AGI 可以替你做什么
          </p>
        </header>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-300">身份</h2>
          <Row label="角色" value="创始人 / Founder" />
          <Row label="所属公司" value="Aetherworld 私有无人公司" />
          <Row label="默认语言" value="简体中文" />
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-300">权限与裁决</h2>
          <Row label="高风险动作裁决" value="必须创始人确认" link="/founder-permissions" />
          <Row label="本地执行网关白名单" value="启用" link="/system/local-gateway" />
          <Row label="自动训练" value="dry-run 默认，真实训练需裁决" link="/system/auto-training" />
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-300">模型来源</h2>
          <Row label="基座来源" value="开源 + 私有微调" link="/system/model-providers" />
          <Row label="模型血统" value="AetherSeed × AetherSeed-VL" link="/system/experiment-ledger" />
          <Row label="多模态底座" value="AetherSeed-VL Private v0.1" link="/system/aetherseed-vl" />
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-300">账户与设置</h2>
          <Row label="账户设置" value="—" link="/account/settings" />
          <Row label="账户安全" value="—" link="/account/security" />
          <Row label="第一次启动" value="—" link="/first-use-setup" />
        </section>

        <footer className="rounded-xl border border-slate-800/60 bg-slate-950/40 p-4 text-xs text-slate-500">
          <p>不上传数据 · 不下载未授权模型 · 不跳过许可检查 · 不假装冒烟为正式发布</p>
        </footer>
      </div>
    </main>
  );
}
