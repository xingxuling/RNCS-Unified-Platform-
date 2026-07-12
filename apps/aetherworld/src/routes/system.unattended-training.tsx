import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  listRuns,
  subscribeUnattended,
  getRecoveryPlan,
} from "@/lib/aetherseed-unattended/unattendedStore";
import {
  createUnattendedRun,
  confirmRun,
  startRun,
  pauseRun,
  resumeRun,
  cancelRun,
  simulateCheckpoint,
  completeRun,
  failRun,
  summarizeRun,
} from "@/lib/aetherseed-unattended/unattendedRuntime";
import { detectPowerStatus } from "@/lib/aetherseed-unattended/powerCheck";
import {
  getUnifiedLocalGatewayStatus,
  type LocalGatewayStatus,
} from "@/lib/local-execution-gateway/localGatewayUnifiedState";
import type {
  PowerStatusReport,
  UnattendedTrainingMethod,
  UnattendedTrainingRun,
} from "@/lib/aetherseed-unattended/unattendedTypes";

export const Route = createFileRoute("/system/unattended-training")({
  head: () => ({
    meta: [
      { title: "无人值守训练工厂 · AetherSeed" },
      {
        name: "description",
        content:
          "AetherSeed 无人值守训练工厂：屏幕可关闭、训练不中断，本地守护器持续运行，自动写实验账本，自动生成下一炉建议。",
      },
    ],
  }),
  component: UnattendedTrainingPage,
});

const METHODS: { value: UnattendedTrainingMethod; label: string }[] = [
  { value: "SFT", label: "文本 SFT" },
  { value: "LORA", label: "文本 LoRA（推荐）" },
  { value: "QLORA", label: "文本 QLoRA（低显存）" },
  { value: "CONTINUED_TRAINING", label: "继续训练" },
  { value: "VLM_LORA", label: "图文 VLM LoRA" },
  { value: "VLM_SFT", label: "图文 VLM SFT" },
];

const STATUS_LABEL: Record<UnattendedTrainingRun["status"], string> = {
  DRAFT: "草稿",
  READY: "就绪",
  WAITING_ENV: "等待环境",
  RUNNING: "训练中",
  PAUSED: "已暂停",
  FAILED: "失败",
  COMPLETED: "已完成",
  CANCELLED: "已取消",
};

function StatusBadge({ status }: { status: UnattendedTrainingRun["status"] }) {
  const cls =
    status === "RUNNING"
      ? "bg-blue-500/15 text-blue-600 dark:text-blue-300"
      : status === "COMPLETED"
      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300"
      : status === "FAILED"
      ? "bg-red-500/15 text-red-600 dark:text-red-300"
      : status === "PAUSED"
      ? "bg-amber-500/15 text-amber-600 dark:text-amber-300"
      : "bg-muted text-muted-foreground";
  return <span className={`px-2 py-0.5 rounded text-xs ${cls}`}>{STATUS_LABEL[status]}</span>;
}

function UnattendedTrainingPage() {
  const [runs, setRuns] = useState<UnattendedTrainingRun[]>(() => listRuns());
  const [power, setPower] = useState<PowerStatusReport | null>(null);
  const [daemon, setDaemon] = useState<LocalGatewayStatus | null>(null);
  const [form, setForm] = useState({
    targetModelName: "AetherSeed-300M-LoRA-v0.1",
    baseModelId: "Qwen2.5-0.5B",
    trainingMethod: "LORA" as UnattendedTrainingMethod,
    datasetVersionId: "AetherSeed-300M-Smoke-Dataset-v0.1",
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => subscribeUnattended(() => setRuns(listRuns())), []);
  useEffect(() => {
    void detectPowerStatus().then(setPower);
    void getUnifiedLocalGatewayStatus().then(setDaemon);
  }, []);

  const selected = useMemo(
    () => runs.find((r) => r.id === selectedId) ?? runs[0],
    [runs, selectedId],
  );
  const plan = selected ? getRecoveryPlan(selected.id) : undefined;

  function handleCreate() {
    const r = createUnattendedRun({ ...form, daemonRunning: daemon?.daemon.available ?? false });
    setSelectedId(r.id);
  }

  const daemonAvailable = daemon?.daemon.available ?? false;
  const daemonLabel = !daemon
    ? "检测中…"
    : daemonAvailable
    ? `${daemon.daemon.mode} / 可用`
    : "DAEMON_OFFLINE";

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/system" className="hover:underline">系统</Link>
          <span>/</span>
          <span>无人值守训练工厂</span>
        </div>
        <h1 className="text-2xl font-semibold">无人值守训练工厂</h1>
        <p className="text-sm text-muted-foreground">
          屏幕可以关闭，但训练必须继续。本地守护器（local-gateway）独立运行，浏览器关闭不影响训练。
          自动写实验账本、自动检测 checkpoint、自动生成下一炉建议。
        </p>
      </header>

      {/* 环境状态 */}
      <section className="grid md:grid-cols-2 gap-4">
        <div className="border rounded-lg p-4 space-y-2">
          <h2 className="font-semibold">本地守护器</h2>
          <div className="text-sm">
            状态：
            <span className={daemonAvailable ? "text-emerald-600" : "text-red-600"}>
              {daemonLabel}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {daemon?.daemon.message ?? ""}
          </p>
          {!daemonAvailable && (
            <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
{`cd local-gateway
npm install
npm run local-gateway  # 默认 http://127.0.0.1:18771`}
            </pre>
          )}
        </div>

        <div className="border rounded-lg p-4 space-y-2">
          <h2 className="font-semibold">电源与息屏检查</h2>
          <div className="text-sm space-y-1">
            <div>是否接通电源：{String(power?.pluggedIn ?? "检测中…")}</div>
            <div>检测方式：{power?.detectionMethod ?? "—"}</div>
            <p className="text-xs text-muted-foreground">{power?.recommendation}</p>
          </div>
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground">Windows 设置提示（手动）</summary>
            <ul className="list-disc list-inside mt-2 space-y-1">
              {power?.manualWindowsHints.map((h) => <li key={h}>{h}</li>)}
            </ul>
            <pre className="mt-2 bg-muted p-2 rounded overflow-x-auto">
{power?.manualCommandHints.join("\n")}
            </pre>
            <p className="text-muted-foreground mt-1">系统不会自动修改电源设置，请手动复制执行。</p>
          </details>
        </div>
      </section>

      {/* 创建任务 */}
      <section className="border rounded-lg p-4 space-y-3">
        <h2 className="font-semibold">创建无人值守训练任务</h2>
        <div className="grid md:grid-cols-4 gap-3 text-sm">
          <label className="space-y-1">
            <span className="text-muted-foreground">目标模型名</span>
            <input
              className="w-full border rounded px-2 py-1 bg-background"
              value={form.targetModelName}
              onChange={(e) => setForm({ ...form, targetModelName: e.target.value })}
            />
          </label>
          <label className="space-y-1">
            <span className="text-muted-foreground">底座模型</span>
            <input
              className="w-full border rounded px-2 py-1 bg-background"
              value={form.baseModelId}
              onChange={(e) => setForm({ ...form, baseModelId: e.target.value })}
            />
          </label>
          <label className="space-y-1">
            <span className="text-muted-foreground">训练方式</span>
            <select
              className="w-full border rounded px-2 py-1 bg-background"
              value={form.trainingMethod}
              onChange={(e) =>
                setForm({ ...form, trainingMethod: e.target.value as UnattendedTrainingMethod })
              }
            >
              {METHODS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-muted-foreground">数据集版本</span>
            <input
              className="w-full border rounded px-2 py-1 bg-background"
              value={form.datasetVersionId}
              onChange={(e) => setForm({ ...form, datasetVersionId: e.target.value })}
            />
          </label>
        </div>
        <button
          onClick={handleCreate}
          className="px-4 py-1.5 rounded bg-primary text-primary-foreground text-sm hover:opacity-90"
        >
          创建任务
        </button>
        <p className="text-xs text-muted-foreground">
          说明：默认推荐 LoRA / QLoRA / SFT。无需从零训练。使用 Aetherworld 数据集、实验账本与本地接入，
          训练出的模型即可登记为 AetherSeed 血统模型。
        </p>
      </section>

      {/* 任务列表 + 详情 */}
      <section className="grid md:grid-cols-3 gap-4">
        <div className="border rounded-lg p-3 space-y-2">
          <h3 className="font-semibold text-sm">训练任务（{runs.length}）</h3>
          {runs.length === 0 && (
            <p className="text-xs text-muted-foreground">暂无任务。创建一个开始无人值守训练。</p>
          )}
          {runs.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedId(r.id)}
              className={`w-full text-left p-2 rounded border text-xs hover:bg-muted ${
                selected?.id === r.id ? "border-primary" : ""
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium truncate">{r.targetModelName}</span>
                <StatusBadge status={r.status} />
              </div>
              <div className="text-muted-foreground truncate">{r.trainingMethod} · {r.id}</div>
            </button>
          ))}
        </div>

        <div className="md:col-span-2 border rounded-lg p-4 space-y-3 text-sm">
          {!selected ? (
            <p className="text-muted-foreground">请选择或创建一个训练任务</p>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{selected.targetModelName}</h3>
                  <p className="text-xs text-muted-foreground">runId：{selected.id}</p>
                </div>
                <StatusBadge status={selected.status} />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <Info label="训练方式" value={selected.trainingMethod} />
                <Info label="数据集版本" value={selected.datasetVersionId} />
                <Info label="日志路径" value={selected.logPath} />
                <Info label="Checkpoint 目录" value={selected.checkpointDir} />
                <Info label="最新 checkpoint" value={selected.latestCheckpoint ?? "—"} />
                <Info label="心跳" value={selected.lastHeartbeatAt ?? "—"} />
                <Info label="实验账本" value={selected.experimentLedgerId ?? "—"} />
                <Info label="用户确认" value={selected.userConfirmed ? "已确认" : "未确认"} />
              </div>

              <div className="bg-muted/50 p-2 rounded text-xs font-mono break-all">
                {selected.commandPreview}
              </div>

              <div className="flex flex-wrap gap-2">
                {!selected.userConfirmed && (
                  <Btn onClick={() => confirmRun(selected.id)}>我确认本次无人值守训练计划</Btn>
                )}
                {selected.userConfirmed && selected.status !== "RUNNING" && selected.status !== "COMPLETED" && (
                  <Btn onClick={() => startRun(selected.id)}>开始训练</Btn>
                )}
                {selected.status === "RUNNING" && (
                  <>
                    <Btn onClick={() => pauseRun(selected.id)}>暂停</Btn>
                    <Btn onClick={() => simulateCheckpoint(selected.id, `step-${Date.now() % 10000}`)}>
                      模拟 checkpoint
                    </Btn>
                    <Btn onClick={() => completeRun(selected.id)}>模拟完成</Btn>
                    <Btn onClick={() => failRun(selected.id, "OOM", "GPU 显存不足（模拟）")}>
                      模拟失败 (OOM)
                    </Btn>
                  </>
                )}
                {selected.status === "PAUSED" && (
                  <Btn onClick={() => resumeRun(selected.id)}>继续</Btn>
                )}
                {selected.status !== "COMPLETED" && selected.status !== "CANCELLED" && (
                  <Btn onClick={() => cancelRun(selected.id)} variant="ghost">取消任务</Btn>
                )}
              </div>

              {selected.evalSummary && (
                <Box title="自动评测">{selected.evalSummary}</Box>
              )}
              {selected.nextPlanSummary && (
                <Box title="下一炉建议">{selected.nextPlanSummary}</Box>
              )}
              {selected.failureReason && (
                <Box title="失败原因" tone="error">{selected.failureReason}</Box>
              )}
              {plan && (
                <Box title="失败恢复计划" tone="warn">
                  <div>类型：{plan.failureType}</div>
                  <div>可从 checkpoint 恢复：{plan.canResumeFromCheckpoint ? "是" : "否"}</div>
                  <ul className="list-disc list-inside mt-1">
                    {plan.recommendedActions.map((a) => <li key={a}>{a}</li>)}
                  </ul>
                </Box>
              )}

              <p className="text-xs text-muted-foreground border-t pt-2">
                {summarizeRun(selected)}
              </p>
            </>
          )}
        </div>
      </section>

      {/* 模型归属 */}
      <section className="border rounded-lg p-4 space-y-2 text-sm">
        <h2 className="font-semibold">AetherSeed 模型归属定义</h2>
        <p className="text-muted-foreground">
          AetherSeed 模型不要求从零训练。符合以下任一条件即可登记为 AetherSeed 血统模型：
        </p>
        <ul className="list-disc list-inside text-xs space-y-0.5 text-muted-foreground">
          <li>使用 Aetherworld 数据集训练</li>
          <li>使用 AetherSeed LoRA / QLoRA / Adapter</li>
          <li>使用 AetherSeed SFT 数据微调</li>
          <li>使用 Aetherworld 实验账本记录</li>
          <li>接入 Aetherworld 模型来源 / 工作流</li>
          <li>由 AetherSeed 训练工厂持续迭代</li>
        </ul>
        <p className="text-xs text-muted-foreground">
          安全边界：不上传数据、不执行非白名单命令、不自动修改系统电源设置、不训练 BLOCK 样本。
        </p>
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="border rounded px-2 py-1 bg-background">
      <div className="text-muted-foreground text-[10px]">{label}</div>
      <div className="truncate" title={value}>{value}</div>
    </div>
  );
}

function Btn({
  children,
  onClick,
  variant = "primary",
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "primary" | "ghost";
}) {
  const cls =
    variant === "primary"
      ? "bg-primary text-primary-foreground hover:opacity-90"
      : "border hover:bg-muted";
  return (
    <button onClick={onClick} className={`text-xs px-3 py-1 rounded ${cls}`}>
      {children}
    </button>
  );
}

function Box({
  title,
  children,
  tone = "info",
}: {
  title: string;
  children: React.ReactNode;
  tone?: "info" | "warn" | "error";
}) {
  const cls =
    tone === "error"
      ? "border-red-500/40 bg-red-500/5"
      : tone === "warn"
      ? "border-amber-500/40 bg-amber-500/5"
      : "border-border bg-muted/30";
  return (
    <div className={`border rounded p-2 text-xs ${cls}`}>
      <div className="font-medium mb-1">{title}</div>
      <div>{children}</div>
    </div>
  );
}
