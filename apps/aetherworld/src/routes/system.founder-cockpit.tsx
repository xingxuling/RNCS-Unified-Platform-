// 创始人中枢驾驶舱 页面
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  buildDecisionView,
  buildFactoryCards,
  buildFiveDomainStatus,
  buildGrowthScore,
  buildProductForgeItems,
  buildWorldRadarSignals,
  buildEvolutionRows,
  readFactorySnapshot,
} from "@/lib/founder-cockpit/cockpitAggregator";
import {
  loadMode,
  loadSeeds,
  saveMode,
  addSeed,
  COCKPIT_MODE_LABEL,
  type CockpitMode,
} from "@/lib/founder-cockpit/cockpitStore";
import {
  FIVE_DOMAIN_LABEL,
  SEED_KIND_LABEL,
  SEED_OUTCOME_LABEL,
  SEED_STAGE_LABEL,
  type SeedKind,
  type SeedRecord,
} from "@/lib/founder-cockpit/cockpitTypes";

export const Route = createFileRoute("/system/founder-cockpit")({
  head: () => ({
    meta: [
      { title: "创始人中枢驾驶舱 · Aetherworld" },
      { name: "description", content: "创始人 × 专属 AGI 的无人公司操作中枢" },
    ],
  }),
  component: FounderCockpitPage,
});

const MODES: CockpitMode[] = ["OBSERVE", "PLAN", "SEMI_AUTO", "UNATTENDED", "COMPETITION"];

const SEED_KINDS: SeedKind[] = [
  "TEXT",
  "FILE",
  "FOLDER",
  "SCREENSHOT",
  "LINK",
  "LOVABLE_RETURN",
  "USER_FEEDBACK",
  "ERROR_LOG",
  "PRODUCT_IDEA",
  "COMPETITOR",
];

function HealthDot({ health }: { health: "GREEN" | "AMBER" | "RED" | "IDLE" }) {
  const color =
    health === "GREEN"
      ? "bg-emerald-400"
      : health === "AMBER"
        ? "bg-amber-400"
        : health === "RED"
          ? "bg-rose-500"
          : "bg-slate-500";
  return <span className={`inline-block h-2 w-2 rounded-full ${color}`} aria-hidden />;
}

function Section({
  title,
  caption,
  children,
}: {
  title: string;
  caption?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-800/60 bg-slate-950/40 p-4">
      <header className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
        {caption ? <span className="text-xs text-slate-500">{caption}</span> : null}
      </header>
      {children}
    </section>
  );
}

function FounderCockpitPage() {
  const [mode, setMode] = useState<CockpitMode>("SEMI_AUTO");
  const [seeds, setSeeds] = useState<SeedRecord[]>([]);
  const [seedKind, setSeedKind] = useState<SeedKind>("TEXT");
  const [seedText, setSeedText] = useState("");

  useEffect(() => {
    setMode(loadMode());
    setSeeds(loadSeeds());
  }, []);

  const snapshot = useMemo(() => readFactorySnapshot(), [seeds.length]);
  const decision = useMemo(() => buildDecisionView(), [snapshot.factoryFailed]);
  const five = useMemo(() => buildFiveDomainStatus(), [snapshot.factoryRunning]);
  const factoryCards = useMemo(() => buildFactoryCards(), [snapshot.trainingSamples]);
  const signals = useMemo(() => buildWorldRadarSignals(), []);
  const products = useMemo(() => buildProductForgeItems(), [snapshot.sealedDatasets]);
  const evolution = useMemo(() => buildEvolutionRows(), [snapshot.factoryFailed]);
  const growth = useMemo(() => buildGrowthScore(), [snapshot.trainingSamples]);

  function handleModeChange(m: CockpitMode) {
    setMode(m);
    saveMode(m);
  }

  function handleDropSeed() {
    if (!seedText.trim()) return;
    const seed = addSeed({ kind: seedKind, summary: seedText.trim() });
    setSeeds((s) => [...s, seed]);
    setSeedText("");
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-[#0a0f1f] to-slate-950 px-6 py-8 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* 顶部身份与状态 */}
        <header className="rounded-2xl border border-slate-800/60 bg-slate-950/60 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-cyan-300/80">
                Founder × AGI Company Cockpit
              </p>
              <h1 className="mt-1 text-3xl font-semibold text-slate-50">创始人中枢驾驶舱</h1>
              <p className="mt-1 text-sm text-slate-400">
                创始人 + 专属 AGI，操控一家无人自动化公司
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-amber-200">
                身份：创始人
              </span>
              <span className="rounded-full border border-purple-500/40 bg-purple-500/10 px-3 py-1 text-purple-200">
                AGI 模式：{COCKPIT_MODE_LABEL[mode]}
              </span>
              <span className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 text-cyan-200">
                今日增长分数：{growth.score}
              </span>
              {mode === "COMPETITION" ? (
                <span className="rounded-full border border-rose-500/40 bg-rose-500/10 px-3 py-1 text-rose-200">
                  ⚡ 竞争模式已开启
                </span>
              ) : null}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {MODES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => handleModeChange(m)}
                className={`rounded-md border px-3 py-1 text-xs transition ${
                  m === mode
                    ? "border-cyan-400 bg-cyan-500/20 text-cyan-100"
                    : "border-slate-700 text-slate-400 hover:border-slate-500"
                }`}
              >
                {COCKPIT_MODE_LABEL[m]}
              </button>
            ))}
          </div>
        </header>

        {/* AGI 总策判断流 */}
        <Section title="AGI 总策判断流" caption="基于当前公司状态的下一步建议">
          <div className="grid gap-4 md:grid-cols-[1fr_auto]">
            <div className="space-y-2 text-sm">
              <p className="text-slate-300">
                <span className="text-slate-500">AGI 观察：</span>
                {decision.observed}
              </p>
              <p className="text-slate-300">
                <span className="text-slate-500">选择工厂：</span>
                <span className="text-cyan-200">{decision.chosenFactory}</span>
              </p>
              <p className="text-slate-300">
                <span className="text-slate-500">判断理由：</span>
                {decision.reason}
              </p>
              <p className="text-slate-300">
                <span className="text-slate-500">预计价值：</span>
                <span
                  className={
                    decision.estimatedValue === "P0"
                      ? "text-rose-300"
                      : decision.estimatedValue === "P1"
                        ? "text-amber-300"
                        : "text-slate-200"
                  }
                >
                  {decision.estimatedValue}
                </span>
              </p>
              <p className="text-slate-300">
                <span className="text-slate-500">下一步：</span>
                {decision.nextStep}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {decision.needsFounderApproval ? (
                <button className="rounded-md border border-amber-400/60 bg-amber-500/10 px-4 py-2 text-xs text-amber-200 hover:bg-amber-500/20">
                  创始人裁决 · 批准推进
                </button>
              ) : (
                <button className="rounded-md border border-emerald-400/60 bg-emerald-500/10 px-4 py-2 text-xs text-emerald-200 hover:bg-emerald-500/20">
                  AGI 自动执行
                </button>
              )}
              <Link
                to="/system/local-agi"
                className="rounded-md border border-slate-700 px-4 py-2 text-center text-xs text-slate-300 hover:border-slate-500"
              >
                打开专属 AGI
              </Link>
            </div>
          </div>
        </Section>

        {/* 主区三列：世界雷达摘要 / 五域 / 公司状态 */}
        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr_1fr]">
          <Section title="天 · 世界雷达摘要">
            <ul className="space-y-2 text-sm">
              {signals.slice(0, 4).map((s) => (
                <li key={s.id} className="rounded-md border border-slate-800/60 bg-slate-900/40 p-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{s.category}</span>
                  </div>
                  <p className="mt-1 text-slate-100">{s.title}</p>
                  <p className="mt-1 text-xs text-slate-400">{s.detail}</p>
                </li>
              ))}
            </ul>
            <Link
              to="/system/world-radar"
              className="mt-3 inline-block text-xs text-cyan-300 hover:text-cyan-200"
            >
              查看完整世界雷达 →
            </Link>
          </Section>

          <Section title="五域状态 · 天地人神风">
            <ul className="space-y-2 text-sm">
              {five.map((d) => (
                <li
                  key={d.domain}
                  className="flex items-start gap-3 rounded-md border border-slate-800/60 bg-slate-900/40 p-3"
                >
                  <HealthDot health={d.health} />
                  <div>
                    <p className="text-slate-100">{d.headline}</p>
                    <p className="text-xs text-slate-400">{d.detail}</p>
                    <p className="text-[10px] uppercase tracking-widest text-slate-600">
                      {FIVE_DOMAIN_LABEL[d.domain]}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="公司当前状态">
            <ul className="space-y-1.5 text-sm text-slate-300">
              <li>数据样本：训练 {snapshot.trainingSamples} / 评测 {snapshot.evalSamples}</li>
              <li>VLM 样本：{snapshot.vlmSamples}</li>
              <li>封版数据集：{snapshot.sealedDatasets}</li>
              <li>能力资产：{snapshot.capabilityAssets}</li>
              <li>工厂任务：{snapshot.factoryTasks}（运行 {snapshot.factoryRunning}）</li>
              <li>
                失败任务：
                <span className={snapshot.factoryFailed > 0 ? "text-rose-300" : "text-emerald-300"}>
                  {snapshot.factoryFailed}
                </span>
              </li>
              <li>AGI 决策：{snapshot.agiDecisions}</li>
              <li>总策 Agent 决策：{snapshot.bossDecisions}</li>
            </ul>
          </Section>
        </div>

        {/* 丢一个种子 */}
        <Section
          title="丢一个种子 · 统一入口"
          caption="种子 → 骨架 → 肌肉 → 血液 → 神经 → 器官 → 文明"
        >
          <div className="grid gap-3 md:grid-cols-[1fr_2fr_auto]">
            <select
              value={seedKind}
              onChange={(e) => setSeedKind(e.target.value as SeedKind)}
              className="rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-200"
            >
              {SEED_KINDS.map((k) => (
                <option key={k} value={k}>
                  {SEED_KIND_LABEL[k]}
                </option>
              ))}
            </select>
            <input
              value={seedText}
              onChange={(e) => setSeedText(e.target.value)}
              placeholder="贴文本、粘链接、写一句产品想法、贴一段错误日志……"
              className="rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600"
            />
            <button
              type="button"
              onClick={handleDropSeed}
              className="rounded-md border border-cyan-500/60 bg-cyan-500/15 px-4 py-2 text-sm text-cyan-200 hover:bg-cyan-500/25"
            >
              丢进去
            </button>
          </div>
          {seeds.length > 0 ? (
            <ul className="mt-4 space-y-2 text-xs">
              {seeds
                .slice(-5)
                .reverse()
                .map((s) => (
                  <li
                    key={s.id}
                    className="rounded-md border border-slate-800/60 bg-slate-900/40 p-2"
                  >
                    <div className="flex items-center justify-between text-slate-400">
                      <span>
                        {SEED_KIND_LABEL[s.kind]} · {SEED_STAGE_LABEL[s.stage]}
                      </span>
                      <span>{new Date(s.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <p className="mt-1 text-slate-200">{s.summary}</p>
                    <p className="mt-1 text-[10px] text-slate-500">
                      可能结果：{s.outcomes.map((o) => SEED_OUTCOME_LABEL[o]).join(" / ")}
                    </p>
                  </li>
                ))}
            </ul>
          ) : (
            <p className="mt-3 text-xs text-slate-500">还没有种子。任何输入都可以变成 Aetherworld 的器官。</p>
          )}
        </Section>

        {/* 五大工厂卡片 */}
        <Section title="地 · 五大工厂" caption="材料 / 训练 / 开发 / 公司 / 系统健康">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {factoryCards.map((c) => (
              <div
                key={c.factory}
                className="rounded-lg border border-slate-800/60 bg-slate-900/40 p-3 text-sm"
              >
                <p className="font-medium text-slate-100">{c.label}</p>
                <ul className="mt-2 space-y-1 text-xs text-slate-400">
                  <li>输入：{c.input}</li>
                  <li>正在运行：{c.running}</li>
                  <li>输出：{c.output}</li>
                  <li>失败：{c.failures}</li>
                  <li>自动化等级：{c.automationLevel}</li>
                </ul>
                <p className="mt-2 text-xs text-cyan-300">下一步：{c.nextStep}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <Link to="/system/autonomous-factory" className="text-cyan-300 hover:text-cyan-200">
              进入无人工厂总控 →
            </Link>
            <Link to="/system/aetherboss-agent" className="text-cyan-300 hover:text-cyan-200">
              打开总策 Agent →
            </Link>
            <Link to="/system/unattended-training" className="text-cyan-300 hover:text-cyan-200">
              无人训练 →
            </Link>
          </div>
        </Section>

        {/* 底部三栏 */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Section title="今日增长报告" caption={`分数 ${growth.score}`}>
            <ul className="space-y-1 text-xs text-slate-300">
              {growth.reasons.map((r, i) => (
                <li key={i}>· {r}</li>
              ))}
            </ul>
            <Link
              to="/system/evolution-ledger"
              className="mt-3 inline-block text-xs text-cyan-300 hover:text-cyan-200"
            >
              查看进化账本 →
            </Link>
          </Section>

          <Section title="产品发布候选">
            <ul className="space-y-1 text-xs text-slate-300">
              {products
                .filter((p) => p.status !== "DRAFT")
                .slice(0, 4)
                .map((p) => (
                  <li key={p.id} className="flex items-center justify-between">
                    <span>{p.name}</span>
                    <span
                      className={
                        p.status === "RELEASABLE"
                          ? "text-emerald-300"
                          : p.status === "RELEASED"
                            ? "text-cyan-300"
                            : "text-amber-300"
                      }
                    >
                      {p.status}
                    </span>
                  </li>
                ))}
            </ul>
            <Link
              to="/system/product-forge"
              className="mt-3 inline-block text-xs text-cyan-300 hover:text-cyan-200"
            >
              打开产品锻造台 →
            </Link>
          </Section>

          <Section title="进化账本快照">
            <ul className="space-y-1 text-xs text-slate-300">
              {evolution.slice(0, 5).map((e) => (
                <li key={e.id}>
                  · [{e.category}] {e.title} — {e.delta}
                </li>
              ))}
            </ul>
            <Link
              to="/system/evolution-ledger"
              className="mt-3 inline-block text-xs text-cyan-300 hover:text-cyan-200"
            >
              查看完整账本 →
            </Link>
          </Section>
        </div>

        {/* 安全边界 */}
        <footer className="rounded-xl border border-slate-800/60 bg-slate-950/40 p-4 text-xs text-slate-500">
          <p className="font-medium text-slate-400">安全边界</p>
          <p className="mt-1">
            · 不自动训练 真实模型 · 不自动上传用户数据 · 不自动支付 · 不执行非白名单命令 · 高风险动作必须创始人裁决
          </p>
        </footer>
      </div>
    </main>
  );
}
