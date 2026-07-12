// 个人模型铸造工坊 · 工作台
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { runPersonalModelForge } from "@/lib/personal-model-forge/personalModelForgeRuntime";
import { describeLocation } from "@/lib/personal-model-forge/personalModelForgeChatBridge";
import { analyzeForgeReport } from "@/lib/personal-model-forge/forgeAnalyticsBridge";
import { planSlowTrainingSlots } from "@/lib/personal-model-forge/slowTrainingScheduler";
import { SERVER_PREP_CHECKLIST } from "@/lib/personal-model-forge/serverForgePlanner";
import {
  FORGE_SAFETY_ALLOWED,
  FORGE_SAFETY_FORBIDDEN,
} from "@/lib/personal-model-forge/forgeSafetyPolicy";

export const Route = createFileRoute("/system/personal-model-forge")({
  head: () => ({
    meta: [
      { title: "个人模型铸造工坊 · AetherSeed Personal Model Forge" },
      {
        name: "description",
        content:
          "单人文明编译者的模型训练文明工坊：本机慢速训练炉、服务器爆发训练炉、AetherSeed 血统线与工具链地图。",
      },
    ],
  }),
  component: PersonalModelForgePage,
});

function PersonalModelForgePage() {
  const report = useMemo(() => runPersonalModelForge(), []);
  const analytics = useMemo(() => analyzeForgeReport(report), [report]);
  const localSlots = useMemo(
    () => planSlowTrainingSlots(report.localExperiments),
    [report],
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <header className="space-y-1">
        <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          AetherSeed Personal Model Forge v0.1
        </div>
        <h1 className="text-2xl font-semibold">个人模型铸造工坊</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          单人文明编译者 / time-rich solo developer
          的模型训练文明工坊。本机不是不能训练，而是慢速训练炉；服务器只承担本机无法承担的爆发段。
          Aetherworld 不会自动执行训练 / 上传数据 / 调用外部服务器。
        </p>
      </header>

      {/* 健康度 */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-2 text-[11px]">
        {[
          { k: "工具链", v: analytics.toolchainSize },
          { k: "可用工具", v: analytics.availableTools },
          { k: "本机实验", v: analytics.localCount },
          { k: "服务器实验", v: analytics.serverCount },
          { k: "血统线", v: analytics.bloodlineStages },
        ].map((c) => (
          <div
            key={c.k}
            className="rounded-md border border-border/40 bg-muted/10 p-2 text-center"
          >
            <div className="text-muted-foreground">{c.k}</div>
            <div className="text-lg text-foreground/90">{c.v}</div>
          </div>
        ))}
      </section>

      {/* 1. 工具链地图 */}
      <section className="space-y-2">
        <h2 className="text-sm font-medium">1. 工具链地图</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {report.toolchain.map((t) => (
            <div
              key={t.id}
              className="rounded-md border border-border/40 bg-muted/10 p-3 space-y-1"
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-foreground/90 font-medium">{t.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full border border-border/60 text-muted-foreground">
                  {t.roleLabel} · {t.status}
                </span>
              </div>
              <div className="text-[11px] text-foreground/85">
                能力：{t.capabilities.join("、")}
              </div>
              <div className="text-[10px] text-muted-foreground">
                局限：{t.limitations.join("、")}
              </div>
              {t.notes && (
                <div className="text-[10px] text-emerald-500/80">{t.notes}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 2. 本机慢速训练炉 */}
      <section className="space-y-2">
        <h2 className="text-sm font-medium">2. 本机慢速训练炉</h2>
        <p className="text-[11px] text-muted-foreground">
          适合 Tokenizer、10M / 50M / 100M、Router / MSL 小模型、LoRA / QLoRA、训练 dry-run、长时间低成本实验。
          耗时较长 → 适合夜间 / 长时间运行，不应判为不可行。
        </p>
        <div className="space-y-2">
          {report.localExperiments.map((e) => {
            const slot = localSlots.find((s) => s.experimentId === e.id);
            return (
              <div
                key={e.id}
                className="rounded-md border border-border/40 bg-muted/10 p-3 space-y-1"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="text-foreground/90 text-sm">{e.name}</div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-border/60 text-muted-foreground">
                    {e.experimentTypeLabel} · {describeLocation(e.location)}
                  </span>
                </div>
                <div className="text-[11px] text-foreground/85">
                  目标：{e.goal ?? "—"}
                </div>
                <div className="text-[10px] text-muted-foreground flex flex-wrap gap-x-3">
                  <span>预计：{e.estimatedDuration}</span>
                  {slot && <span>建议窗口：{slot.windowLabel}</span>}
                  <span>成本：{e.costMode}</span>
                </div>
                <div className="text-[10px] text-muted-foreground">
                  数据：{e.datasetRefs.join("、")}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  评测：{(e.evalItems ?? []).join("、")}
                </div>
                {e.failureRisks && e.failureRisks.length > 0 && (
                  <div className="text-[10px] text-amber-500/80">
                    风险：{e.failureRisks.join("、")}
                  </div>
                )}
                {e.nextStep && (
                  <div className="text-[10px] text-emerald-500/80">
                    下一步：{e.nextStep}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. 服务器爆发训练炉 */}
      <section className="space-y-2">
        <h2 className="text-sm font-medium">3. 服务器爆发训练炉</h2>
        <p className="text-[11px] text-muted-foreground">
          服务器用于 AetherSeed-300M / 700M / 1.5B / 3B / 7B 的正式训练。
          只承担本机无法承担的爆发段。本机准备完成后再进入。
        </p>
        <div className="space-y-2">
          {report.serverExperiments.map((e) => (
            <div
              key={e.id}
              className="rounded-md border border-border/40 bg-muted/10 p-3 space-y-1"
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="text-foreground/90 text-sm">{e.name}</div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-border/60 text-muted-foreground">
                  {e.experimentTypeLabel}
                </span>
              </div>
              <div className="text-[11px] text-foreground/85">目标：{e.goal ?? "—"}</div>
              <div className="text-[10px] text-muted-foreground">
                预计：{e.estimatedDuration} · 数据：{e.datasetRefs.join("、")}
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-md border border-border/40 bg-muted/10 p-3 text-[11px] space-y-1">
          <div className="text-muted-foreground">上服务器前检查清单</div>
          <ul className="list-disc list-inside text-foreground/85 space-y-0.5">
            {SERVER_PREP_CHECKLIST.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* 4. AetherSeed 血统线 */}
      <section className="space-y-2">
        <h2 className="text-sm font-medium">4. AetherSeed 血统线</h2>
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          {report.bloodline.map((s, i) => (
            <div key={s.id} className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-md border border-border/60 text-foreground/90">
                {s.modelName}
                <span className="text-muted-foreground"> · {describeLocation(s.forgeLocation)}</span>
              </span>
              {i < report.bloodline.length - 1 && (
                <span className="text-muted-foreground">→</span>
              )}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px]">
          {report.bloodline.map((s) => (
            <div
              key={s.id}
              className="rounded-md border border-border/40 bg-muted/10 p-2"
            >
              <div className="text-foreground/90 text-[11px]">
                {s.modelName} · {s.parameterScale}
              </div>
              <div className="text-muted-foreground">用途：{s.purpose}</div>
              <div className="text-muted-foreground">
                前置：{s.prerequisites.join("、")}
              </div>
              <div className="text-muted-foreground">
                评测：{s.evalRequirements.join("、")}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. 当前语料资产 */}
      <section className="space-y-2">
        <h2 className="text-sm font-medium">5. 当前语料资产</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
          {report.corpusAssets.map((c) => (
            <div
              key={c.id}
              className="rounded-md border border-border/40 bg-muted/10 p-2 flex items-center justify-between gap-2"
            >
              <span className="text-foreground/90">{c.name}</span>
              <span className="text-[10px] text-muted-foreground">
                {c.source} · {c.readiness}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 6. 文明种子编译法 */}
      <section className="space-y-2">
        <h2 className="text-sm font-medium">6. 文明种子编译法（训练路线）</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px]">
          {(
            [
              ["seed", "种子"],
              ["skeleton", "骨架"],
              ["muscle", "肌肉"],
              ["blood", "血液"],
              ["nerve", "神经"],
              ["growth", "生长"],
            ] as const
          ).map(([k, label]) => (
            <div
              key={k}
              className="rounded-md border border-border/40 bg-muted/10 p-2 space-y-1"
            >
              <div className="text-muted-foreground">{label}</div>
              <ul className="list-disc list-inside text-foreground/85 space-y-0.5">
                {report.civilizationSeed[k].map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* 7. 单人时间模型 */}
      <section className="space-y-2">
        <h2 className="text-sm font-medium">7. 单人时间模型（Time-Rich Solo Developer）</h2>
        <ul className="text-[11px] text-foreground/85 list-disc list-inside space-y-0.5">
          {report.soloTimeModelNotes.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      </section>

      {/* 8. 下一步建议 */}
      <section className="space-y-2">
        <h2 className="text-sm font-medium">8. 下一步建议</h2>
        <ul className="text-[11px] text-foreground/85 list-disc list-inside space-y-0.5">
          {report.nextSuggestions.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </section>

      {/* 9. 安全边界 */}
      <section className="space-y-2">
        <h2 className="text-sm font-medium">9. 安全边界</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px]">
          <div className="rounded-md border border-emerald-500/40 bg-emerald-500/5 p-2">
            <div className="text-emerald-500 mb-1">允许</div>
            <ul className="list-disc list-inside space-y-0.5 text-foreground/85">
              {FORGE_SAFETY_ALLOWED.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-md border border-rose-500/40 bg-rose-500/5 p-2">
            <div className="text-rose-500 mb-1">禁止</div>
            <ul className="list-disc list-inside space-y-0.5 text-foreground/85">
              {FORGE_SAFETY_FORBIDDEN.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
