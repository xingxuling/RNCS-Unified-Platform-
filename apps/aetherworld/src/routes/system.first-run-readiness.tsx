// AetherSeed First Run Readiness · /system/first-run-readiness
// 第一炉训练准备：聚合 dataset / 导出 / 计划 / 自动训练 / 实验账本 / 本地网关 的只读状态，
// 用户确认前不显示「可以点火」；本页本身不执行训练、不调用网关 /training/run。
import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  buildFirstRunReadinessSnapshot,
  getUserConfirmed,
  resetFirstRunConfirmation,
  setUserConfirmed,
  type GatewayProbe,
} from "@/lib/aetherseed-first-run/firstRunReadinessRuntime";
import {
  CHECK_STATUS_LABEL,
  READINESS_LEVEL_LABEL,
  type CheckStatus,
  type FirstRunReadinessSnapshot,
  type ReadinessLevel,
} from "@/lib/aetherseed-first-run/firstRunReadinessTypes";
import {
  FIRST_RUN_ALLOWED,
  FIRST_RUN_FORBIDDEN,
  FIRST_RUN_OUTPUT_DIR_ALLOWED,
} from "@/lib/aetherseed-first-run/firstRunSafetyPolicy";
import {
  buildFirstRunValidationFlow,
  type FirstRunValidationFlow,
  type ValidationStep,
} from "@/lib/aetherseed-first-run/firstRunValidationFlow";
import { gatewayDryRun } from "@/lib/local-execution-gateway/localGatewayClient";
import { getUnifiedLocalGatewayStatus } from "@/lib/local-execution-gateway/localGatewayUnifiedState";
import { listLocalTrainingBundles } from "@/lib/aetherseed-local-training/localTrainingRuntime";
import { AetherSeed300mBanner } from "@/components/aetherseed-300m/AetherSeed300mBanner";
import {
  AETHERSEED_300M_MODEL_NAME,
  AETHERSEED_300M_OLLAMA_NAME,
  AETHERSEED_300M_TRAINING_PATH,
  AETHERSEED_300M_RISK_NOTES,
  AETHERSEED_300M_ALLOWED_CORPUS,
  AETHERSEED_300M_FORBIDDEN_CORPUS,
  buildOllamaIntegrationSteps,
} from "@/lib/aetherseed-300m/aetherSeed300mMainLine";

const LEVEL_BADGE: Record<ReadinessLevel, string> = {
  NOT_READY: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  PARTIAL: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  READY_TO_IGNITE: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
};

const STATUS_BADGE: Record<CheckStatus, string> = {
  PASS: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  WARN: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  FAIL: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  PENDING: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
      {children}
    </section>
  );
}

function ValidationStepCard({ step, isCurrent }: { step: ValidationStep; isCurrent: boolean }) {
  return (
    <div className={`rounded-md border p-3 ${
      isCurrent ? "border-primary/50 bg-primary/5" : "border-border bg-card/40"
    }`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full border text-[10px] ${STATUS_BADGE[step.status]}`}>
            {step.order}
          </span>
          <div className="text-sm font-medium">{step.title}</div>
          {step.blocking && (
            <span className="inline-flex items-center rounded-full border border-rose-500/40 bg-rose-500/10 px-2 py-0.5 text-[10px] text-rose-200">
              阻断点火
            </span>
          )}
          {isCurrent && step.status !== "PASS" && (
            <span className="inline-flex items-center rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
              当前步骤
            </span>
          )}
        </div>
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] ${STATUS_BADGE[step.status]}`}>
          {CHECK_STATUS_LABEL[step.status]}
        </span>
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{step.goal}</div>
      <ul className="mt-2 space-y-1">
        {step.subItems.map((it, i) => (
          <li key={i} className="flex items-start gap-2 text-xs">
            <span className={`mt-0.5 inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] ${STATUS_BADGE[it.status]}`}>
              {CHECK_STATUS_LABEL[it.status]}
            </span>
            <div>
              <div className="text-foreground/90">{it.label}</div>
              <div className="text-[11px] text-muted-foreground">{it.note}</div>
            </div>
          </li>
        ))}
      </ul>
      {step.hint && (
        <div className="mt-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1.5 text-[11px] text-amber-200">
          {step.hint}
        </div>
      )}
      {step.jumpRoute && step.jumpLabel && (
        <div className="mt-2">
          <Link
            to={step.jumpRoute}
            className="inline-flex items-center rounded-md border border-border bg-card/60 px-2.5 py-1 text-[11px] hover:border-primary/50"
          >
            {step.jumpLabel} →
          </Link>
        </div>
      )}
    </div>
  );
}

function FirstRunReadinessPage() {
  const [probe, setProbe] = useState<GatewayProbe | undefined>(undefined);
  const [snap, setSnap] = useState<FirstRunReadinessSnapshot>(() =>
    buildFirstRunReadinessSnapshot(),
  );
  const [flow, setFlow] = useState<FirstRunValidationFlow>(() =>
    buildFirstRunValidationFlow(),
  );
  const [busy, setBusy] = useState(false);

  const refresh = useCallback((p?: GatewayProbe) => {
    const next = p ?? probe;
    setSnap(buildFirstRunReadinessSnapshot(next));
    setFlow(buildFirstRunValidationFlow(next));
  }, [probe]);

  const handleCheckGateway = useCallback(async () => {
    setBusy(true);
    try {
      const s = await getUnifiedLocalGatewayStatus();
      const next: GatewayProbe = {
        connected: s.connected,
        healthOk: s.healthOk,
        dryRunPassed: probe?.dryRunPassed ?? false,
        reason: s.connected ? undefined : (s.reason || "未检测到本地网关连接"),
      };
      setProbe(next);
      refresh(next);
    } finally {
      setBusy(false);
    }
  }, [probe?.dryRunPassed, refresh]);

  const handleDryRun = useCallback(async () => {
    setBusy(true);
    try {
      const bundle = listLocalTrainingBundles()[0];
      if (!bundle) {
        setProbe((cur) => {
          const next: GatewayProbe = {
            connected: cur?.connected ?? false,
            healthOk: cur?.healthOk ?? false,
            dryRunPassed: false,
            reason: "尚无本机训练计划，无法执行 dry-run。",
          };
          refresh(next);
          return next;
        });
        return;
      }
      const r = await gatewayDryRun({
        taskId: `FIRST_RUN_PROBE_${Date.now()}`,
        workingDirectory: "./aether-training",
        executable: "train.py",
        args: ["--config", "config.yaml"],
      });
      setProbe((cur) => {
        const passed = !!r && r.canRun && r.environmentStatus === "READY";
        const next: GatewayProbe = {
          connected: cur?.connected ?? !!r,
          healthOk: cur?.healthOk ?? !!r,
          dryRunPassed: passed,
          reason: passed
            ? undefined
            : r?.blockedReasons?.[0] ?? r?.warnings?.[0] ?? "dry-run 未通过或网关未连接。",
        };
        refresh(next);
        return next;
      });
    } finally {
      setBusy(false);
    }
  }, [refresh]);

  const handleConfirm = useCallback(() => {
    setUserConfirmed(true);
    refresh();
  }, [refresh]);

  const handleRevoke = useCallback(() => {
    resetFirstRunConfirmation();
    refresh();
  }, [refresh]);

  // 初次进入页面时自动探测一次本地网关，统一状态源
  useEffect(() => {
    setSnap(buildFirstRunReadinessSnapshot());
    setFlow(buildFirstRunValidationFlow());
    void handleCheckGateway();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const userConfirmed = getUserConfirmed();

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <header className="space-y-2">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">
          AetherSeed · First Run Readiness
        </div>
        <h1 className="text-2xl font-semibold">第一炉训练准备 · {AETHERSEED_300M_MODEL_NAME}</h1>
        <p className="text-sm text-muted-foreground">
          当前 Aetherworld 第一炉训练主线已收束为 {AETHERSEED_300M_MODEL_NAME}：仅供创始人本人与 Aetherworld 内部使用，
          不公开 / 不开源 / 不上传 / 不下载。本页只聚合 dataset / 导出 / 安全报告 / 本机训练计划 / 自动训练 / 实验账本 / 本地网关 的只读状态，
          所有真实训练动作仍须经 dry-run + 用户确认 + 本地执行网关。
        </p>
      </header>

      <AetherSeed300mBanner
        pageNote={`第一炉训练默认目标：${AETHERSEED_300M_MODEL_NAME}；Ollama 目标名：${AETHERSEED_300M_OLLAMA_NAME}（本轮仅做接入预留，不真正执行 GGUF 转换）。`}
      />

      <Section title="总体状态">
        <div className="rounded-md border border-border bg-card/40 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs text-muted-foreground">综合就绪度</div>
              <div className="text-3xl font-semibold">{snap.score}/100</div>
            </div>
            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs ${LEVEL_BADGE[snap.level]}`}>
              {READINESS_LEVEL_LABEL[snap.level]}
            </span>
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-muted/30">
            <div
              className="h-2 rounded-full bg-primary/70"
              style={{ width: `${snap.score}%` }}
            />
          </div>
          {snap.blockingReasons.length > 0 && (
            <div className="mt-3 text-xs text-rose-300">
              阻断点火（{snap.blockingReasons.length} 条）：第一炉训练必须把所有必填项推到「通过」。
            </div>
          )}
        </div>
      </Section>

      <Section title="实测验收流程（7 步走完才允许点火）">
        <div className="rounded-md border border-border bg-card/30 p-3 text-xs text-muted-foreground">
          按下列 7 步逐项验证；任一阻断项未通过都不会进入「可以点火」。
          本流程不真正训练 / 不调用网关执行 / 不读取本地文件 / 不上传 / 不下载 / 不推荐 50M+ 模型 / 不绕过用户确认。
        </div>
        <ol className="space-y-3">
          {flow.steps.map((s) => (
            <li key={s.id}>
              <ValidationStepCard step={s} isCurrent={s.id === flow.currentStepId} />
            </li>
          ))}
        </ol>
      </Section>

      <Section title={`第一炉首推：${AETHERSEED_300M_MODEL_NAME}`}>
        <div className="rounded-md border border-primary/30 bg-primary/10 p-3 text-sm">
          <div className="font-medium">{flow.primaryRecommendation.modelName}</div>
          <div className="mt-1 text-xs text-foreground/80">{flow.primaryRecommendation.reason}</div>
          <div className="mt-2 text-[11px] text-muted-foreground">
            建议样本 ≤ {flow.primaryRecommendation.recommendedSampleCap} 条 · 第一炉禁止 50M 以上模型
          </div>
        </div>
      </Section>

      <Section title="点火前最后确认清单">
        <ul className="space-y-2">
          {flow.finalChecklist.map((c, i) => (
            <li
              key={i}
              className={`flex items-start gap-3 rounded-md border px-3 py-2 text-xs ${
                c.ok
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : "border-rose-500/30 bg-rose-500/5"
              }`}
            >
              <span className={`mt-0.5 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border text-[10px] ${
                c.ok ? "border-emerald-400 bg-emerald-500/20 text-emerald-200" : "border-rose-400 bg-rose-500/20 text-rose-200"
              }`}>
                {c.ok ? "✓" : "!"}
              </span>
              <div>
                <div className={c.ok ? "text-foreground" : "text-rose-200"}>{c.label}</div>
                <div className="text-[11px] text-muted-foreground">{c.note}</div>
              </div>
            </li>
          ))}
        </ul>
        <div className={`rounded-md border px-3 py-2 text-xs ${
          flow.canIgnite
            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
            : "border-amber-500/40 bg-amber-500/10 text-amber-200"
        }`}>
          {flow.canIgnite
            ? "全部清单已通过且用户已确认；可前往自动训练器点火（系统不会替你点火）。"
            : "尚未具备点火条件：请先把上方未勾选项推到通过，并在「操作按钮」处点击「我已确认第一炉点火」。"}
        </div>
      </Section>

      <Section title="操作按钮">
        <div className="flex flex-wrap gap-2">
          <button
            disabled={busy}
            onClick={handleCheckGateway}
            className="rounded-md border border-border bg-card/60 px-3 py-1.5 text-xs hover:border-primary/50 disabled:opacity-50"
          >
            检查本地网关 /health
          </button>
          <button
            disabled={busy}
            onClick={handleDryRun}
            className="rounded-md border border-border bg-card/60 px-3 py-1.5 text-xs hover:border-primary/50 disabled:opacity-50"
          >
            生成 dry-run（不执行）
          </button>
          <Link
            to="/system/datasets"
            className="rounded-md border border-border bg-card/60 px-3 py-1.5 text-xs hover:border-primary/50"
          >
            检查数据集
          </Link>
          <Link
            to="/system/experiment-ledger"
            className="rounded-md border border-border bg-card/60 px-3 py-1.5 text-xs hover:border-primary/50"
          >
            打开实验账本
          </Link>
          <Link
            to="/system/auto-training"
            className="rounded-md border border-border bg-card/60 px-3 py-1.5 text-xs hover:border-primary/50"
          >
            打开自动训练器
          </Link>
          <Link
            to="/system/local-gateway"
            className="rounded-md border border-border bg-card/60 px-3 py-1.5 text-xs hover:border-primary/50"
          >
            打开本地执行网关
          </Link>
          {userConfirmed ? (
            <button
              onClick={handleRevoke}
              className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-200 hover:border-amber-400"
            >
              撤销点火确认
            </button>
          ) : (
            <button
              onClick={handleConfirm}
              className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-200 hover:border-emerald-400"
            >
              我已确认第一炉点火（仅登记）
            </button>
          )}
        </div>
        <div className="text-[11px] text-muted-foreground">
          本页所有按钮均不会真正启动训练。点火请到
          <Link to="/system/auto-training" className="mx-1 underline">自动训练器</Link>
          走 dry-run + 用户确认 + 本地网关受控执行。
        </div>
      </Section>

      <Section title="检查项">
        <div className="overflow-hidden rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2">项目</th>
                <th className="px-3 py-2">状态</th>
                <th className="px-3 py-2">说明</th>
                <th className="px-3 py-2">必填</th>
                <th className="px-3 py-2">前往</th>
              </tr>
            </thead>
            <tbody>
              {snap.checks.map((c) => (
                <tr key={c.id} className="border-t border-border/60">
                  <td className="px-3 py-2 font-medium">{c.label}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] ${STATUS_BADGE[c.status]}`}>
                      {CHECK_STATUS_LABEL[c.status]}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-foreground/80">{c.detail}</td>
                  <td className="px-3 py-2 text-xs">{c.required ? "是" : "否"}</td>
                  <td className="px-3 py-2 text-xs">
                    {c.remediationRoute ? (
                      <Link to={c.remediationRoute} className="underline">前往</Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="第一炉建议（优先小模型）">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {snap.recommendations.map((r) => (
            <div key={r.modelId} className="rounded-md border border-border bg-card/40 p-3 text-sm">
              <div className="font-medium">{r.modelName}</div>
              <div className="mt-1 text-xs text-foreground/80">{r.reason}</div>
              <div className="mt-2 text-[11px] text-muted-foreground">
                建议样本 ≤ {r.recommendedSampleCap} 条
              </div>
            </div>
          ))}
        </div>
        <div className="text-[11px] text-muted-foreground">
          第一炉禁止推荐 50M 以上模型；先用 Tiny 模型把数据→训练→checkpoint→评测 闭环跑通。
        </div>
      </Section>

      <Section title="风险提示">
        <ul className="space-y-2 text-sm">
          {snap.risks.map((r, i) => (
            <li
              key={i}
              className={`rounded-md border px-3 py-2 ${
                r.level === "WARN"
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
                  : "border-border bg-card/40 text-foreground/80"
              }`}
            >
              {r.text}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="安全边界">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-border bg-card/40 p-3 text-xs">
            <div className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">允许</div>
            <ul className="space-y-0.5 text-foreground/80">
              {FIRST_RUN_ALLOWED.map((x) => <li key={x}>· {x}</li>)}
            </ul>
          </div>
          <div className="rounded-md border border-border bg-card/40 p-3 text-xs">
            <div className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">禁止</div>
            <ul className="space-y-0.5 text-foreground/80">
              {FIRST_RUN_FORBIDDEN.map((x) => <li key={x}>· {x}</li>)}
            </ul>
          </div>
        </div>
        <div className="rounded-md border border-border bg-card/30 px-3 py-2 text-[11px] text-muted-foreground">
          仅允许写入目录：{FIRST_RUN_OUTPUT_DIR_ALLOWED.join("、")}
        </div>
      </Section>

      <Section title="Ollama 接入准备（300M 主线 · 仅预留流程，本轮不执行）">
        <div className="rounded-md border border-border bg-card/40 p-3 text-xs text-muted-foreground">
          目标 Ollama 模型名：<span className="text-foreground">{AETHERSEED_300M_OLLAMA_NAME}</span>。
          以下步骤仅作为流程草案；GGUF 转换、ollama create、Provider 接入均由用户在本机手动完成，本系统不下载模型 / 不上传 checkpoint。
        </div>
        <ol className="space-y-1.5 text-xs">
          {buildOllamaIntegrationSteps().map((s) => (
            <li key={s.order} className="flex gap-2 rounded-md border border-border bg-card/30 px-3 py-2">
              <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border text-[10px]">{s.order}</span>
              <div>
                <div className="text-foreground">{s.title}</div>
                <div className="text-[11px] text-muted-foreground">{s.detail}</div>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="300M 训练路线与风险">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-border bg-card/40 p-3 text-xs">
            <div className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">训练路线优先级</div>
            <ul className="space-y-0.5 text-foreground/80">{AETHERSEED_300M_TRAINING_PATH.map((x) => <li key={x}>· {x}</li>)}</ul>
          </div>
          <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs">
            <div className="mb-1 text-[10px] uppercase tracking-wide text-amber-300">300M 风险提示</div>
            <ul className="space-y-0.5 text-foreground/80">{AETHERSEED_300M_RISK_NOTES.map((x) => <li key={x}>· {x}</li>)}</ul>
          </div>
          <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs">
            <div className="mb-1 text-[10px] uppercase tracking-wide text-emerald-300">允许进入 300M 私有训练的数据</div>
            <ul className="space-y-0.5 text-foreground/80">{AETHERSEED_300M_ALLOWED_CORPUS.map((x) => <li key={x}>· {x}</li>)}</ul>
          </div>
          <div className="rounded-md border border-rose-500/30 bg-rose-500/5 p-3 text-xs">
            <div className="mb-1 text-[10px] uppercase tracking-wide text-rose-300">禁止进入 300M 私有训练</div>
            <ul className="space-y-0.5 text-foreground/80">{AETHERSEED_300M_FORBIDDEN_CORPUS.map((x) => <li key={x}>· {x}</li>)}</ul>
          </div>
        </div>
      </Section>

      <footer className="text-xs text-muted-foreground">
        <Link to="/system" className="underline">返回系统总览</Link>
        <span className="mx-2">·</span>
        <Link to="/system/data-engine" className="underline">数据引擎</Link>
        <span className="mx-2">·</span>
        <Link to="/system/page-completeness" className="underline">页面完整性</Link>
      </footer>
    </div>
  );
}

export const Route = createFileRoute("/system/first-run-readiness")({
  head: () => ({ meta: [{ title: "第一炉训练准备 · Aetherworld" }] }),
  component: FirstRunReadinessPage,
});
