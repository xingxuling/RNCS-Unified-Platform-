// AetherSeed Auto Training Executor · /system/auto-training
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { listLocalTrainingBundles, getLocalTrainingBundle } from "@/lib/aetherseed-local-training/localTrainingRuntime";
import {
  createAutoTrainingTask,
  performDryRun,
  confirmAndStart,
  markTaskCompleted,
  markTaskFailed,
  cancelTask,
} from "@/lib/aetherseed-auto-training/autoTrainingRuntime";
import {
  buildAutoTrainingSnapshot,
  listTasks,
  getDryRun,
  getCommands,
  listRuns,
} from "@/lib/aetherseed-auto-training/autoTrainingTaskStore";
import {
  AUTO_TRAINING_LEVEL_LABEL,
  AUTO_TRAINING_STATUS_LABEL,
  AUTO_TRAINING_ENV_LABEL,
  AUTO_TRAINING_RUN_STATUS_LABEL,
  type AutoTrainingLevel,
} from "@/lib/aetherseed-auto-training/autoTrainingTypes";
import {
  AUTO_TRAINING_SAFETY_ALLOWED,
  AUTO_TRAINING_SAFETY_FORBIDDEN,
} from "@/lib/aetherseed-auto-training/autoTrainingSafetyPolicy";
import { detectProcessBridge } from "@/lib/aetherseed-auto-training/autoTrainingProcessBridge";
import { listLogs } from "@/lib/aetherseed-auto-training/autoTrainingLogStore";
import { previewCommand } from "@/lib/aetherseed-auto-training/autoTrainingCommandBuilder";
import { UnifiedGatewayStatusBar } from "@/components/system/UnifiedGatewayStatusBar";

export const Route = createFileRoute("/system/auto-training")({
  head: () => ({ meta: [{ title: "自动训练 · AetherSeed · 系统" }] }),
  component: AutoTrainingPage,
});

const LEVELS: AutoTrainingLevel[] = [
  "L0_PLAN_ONLY",
  "L1_COMMAND_PREVIEW",
  "L2_CONFIRM_TO_RUN",
  "L3_SCHEDULED_LOCAL_RUN",
];

function Section({ title, children, hint }: { title: string; children: React.ReactNode; hint?: string }) {
  return (
    <section className="space-y-2">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
        {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-card/40 px-3 py-2">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

function AutoTrainingPage() {
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((t) => t + 1);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [selectedLevel, setSelectedLevel] = useState<AutoTrainingLevel>("L2_CONFIRM_TO_RUN");
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [failureReason, setFailureReason] = useState("");

  const bundles = useMemo(() => listLocalTrainingBundles(), [tick]);
  const tasks = useMemo(() => listTasks(), [tick]);
  const snap = useMemo(() => buildAutoTrainingSnapshot(), [tick]);
  const bridge = useMemo(() => detectProcessBridge(), [tick]);
  const runs = useMemo(() => listRuns(), [tick]);

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) ?? tasks[0];
  const dry = selectedTask ? getDryRun(selectedTask.id) : undefined;
  const cmds = selectedTask ? getCommands(selectedTask.id) : [];
  const selectedRun = selectedTask ? runs.find((r) => r.taskId === selectedTask.id) : undefined;
  const logs = selectedRun ? listLogs(selectedRun.id) : [];

  function onCreate() {
    const bundle = selectedPlanId ? getLocalTrainingBundle(selectedPlanId) : bundles[0];
    if (!bundle) return;
    const task = createAutoTrainingTask({ bundle, level: selectedLevel });
    performDryRun(task.id, bundle);
    setSelectedTaskId(task.id);
    refresh();
  }

  function onConfirm() {
    if (!selectedTask) return;
    const bundle = selectedTask.localTrainingPlanId
      ? getLocalTrainingBundle(selectedTask.localTrainingPlanId)
      : undefined;
    if (!bundle) return;
    try {
      confirmAndStart({ taskId: selectedTask.id, bundle });
    } catch (e) {
      console.warn(e);
    }
    refresh();
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <header className="space-y-1">
        <div className="text-xs text-muted-foreground">AetherSeed · 训练执行肌肉</div>
        <h1 className="text-2xl font-semibold">自动训练（受控执行器）</h1>
        <p className="text-sm text-muted-foreground">
          本页面只执行 Aetherworld 生成的白名单训练任务，不执行任意命令。所有命令必须先通过 dry-run 校验并由用户确认。
        </p>
      </header>

      <UnifiedGatewayStatusBar prefix="训练前置：" />



      <Section title="自动化等级">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {LEVELS.map((lv) => (
            <button
              key={lv}
              onClick={() => setSelectedLevel(lv)}
              className={`rounded-md border px-3 py-2 text-left text-xs ${
                selectedLevel === lv ? "border-primary bg-primary/10" : "border-border bg-card/40"
              }`}
            >
              <div className="font-medium">{AUTO_TRAINING_LEVEL_LABEL[lv]}</div>
              <div className="mt-1 text-muted-foreground">
                {lv === "L0_PLAN_ONLY" && "只生成训练计划，不执行。"}
                {lv === "L1_COMMAND_PREVIEW" && "生成命令预览，不执行。"}
                {lv === "L2_CONFIRM_TO_RUN" && "用户确认后执行。"}
                {lv === "L3_SCHEDULED_LOCAL_RUN" && "本地定时执行（预留，未启用）。"}
              </div>
            </button>
          ))}
        </div>
      </Section>

      <Section title="总览">
        <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
          <Stat label="任务总数" value={snap.total} />
          <Stat label="等待确认" value={snap.waitingConfirmation} />
          <Stat label="运行中" value={snap.running} />
          <Stat label="完成" value={snap.completed} />
          <Stat label="失败" value={snap.failed} />
          <Stat label="拦截" value={snap.blocked} />
        </div>
        <div className="rounded-md border border-border/60 bg-card/30 px-3 py-2 text-xs text-muted-foreground">
          进程桥：<span className="text-foreground">{bridge.kind}</span> · {bridge.description}
        </div>
      </Section>

      <Section title="① 创建自动训练任务" hint="来源：LocalTrainingPlan">
        {bundles.length === 0 ? (
          <div className="rounded-md border border-dashed border-border bg-card/30 p-4 text-xs text-muted-foreground">
            尚无本机训练计划。请先到 <Link to="/system/local-training" className="text-primary underline">/system/local-training</Link> 创建。
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="rounded-md border border-border bg-background px-2 py-1 text-xs"
            >
              <option value="">最新计划：{bundles[0]?.plan.name}</option>
              {bundles.map((b) => (
                <option key={b.plan.id} value={b.plan.id}>
                  {b.plan.name}
                </option>
              ))}
            </select>
            <button
              onClick={onCreate}
              className="rounded-md border border-primary bg-primary/10 px-3 py-1 text-xs text-primary"
            >
              创建任务并自动 dry-run
            </button>
          </div>
        )}
      </Section>

      {selectedTask && (
        <>
          <Section title="② 当前任务" hint={selectedTask.id}>
            <div className="rounded-md border border-border bg-card/40 p-3 text-xs">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <div className="font-medium text-sm">{selectedTask.name}</div>
                <div>状态：{AUTO_TRAINING_STATUS_LABEL[selectedTask.status]}</div>
                <div>等级：{AUTO_TRAINING_LEVEL_LABEL[selectedTask.level]}</div>
                <div>安全：{selectedTask.safetyStatus}</div>
              </div>
              {selectedTask.blockedReasons.length > 0 && (
                <div className="mt-2 text-rose-300">拦截原因：{selectedTask.blockedReasons.join("；")}</div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {tasks.slice(0, 8).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTaskId(t.id)}
                  className={`rounded border px-2 py-1 text-[11px] ${
                    t.id === selectedTask.id ? "border-primary text-primary" : "border-border text-muted-foreground"
                  }`}
                >
                  {t.name.slice(0, 24)}
                </button>
              ))}
            </div>
          </Section>

          <Section title="③ Dry-run 校验">
            {!dry ? (
              <div className="text-xs text-muted-foreground">未运行 dry-run。</div>
            ) : (
              <div className="space-y-2 rounded-md border border-border bg-card/40 p-3 text-xs">
                <div>
                  环境：<span className="text-foreground">{AUTO_TRAINING_ENV_LABEL[dry.environmentStatus]}</span>
                  ·  风险：{dry.estimatedRisk}
                  ·  可执行：{dry.canRun ? "是" : "否"}
                </div>
                <div className="text-muted-foreground">工作目录：{dry.workingDirectory}</div>
                <div>
                  <div className="text-muted-foreground">命令预览：</div>
                  <pre className="mt-1 overflow-x-auto rounded bg-background/60 p-2">{dry.commandPreview.join("\n")}</pre>
                </div>
                <div>
                  <div className="text-muted-foreground">期望输入：</div>
                  <ul className="ml-4 list-disc">{dry.expectedInputs.map((i, k) => <li key={k}>{i}</li>)}</ul>
                </div>
                <div>
                  <div className="text-muted-foreground">期望输出：</div>
                  <ul className="ml-4 list-disc">{dry.expectedOutputs.map((i, k) => <li key={k}>{i}</li>)}</ul>
                </div>
                {dry.warnings.length > 0 && (
                  <div className="text-amber-300">警告：{dry.warnings.join("；")}</div>
                )}
                {dry.blockedReasons.length > 0 && (
                  <div className="text-rose-300">拦截：{dry.blockedReasons.join("；")}</div>
                )}
              </div>
            )}
          </Section>

          <Section title="④ 用户确认" hint="执行前必读">
            <div className="space-y-2 rounded-md border border-border bg-card/40 p-3 text-xs">
              <ul className="ml-4 list-disc text-muted-foreground">
                <li>将以白名单方式执行上述命令（不使用 shell:true）。</li>
                <li>工作目录：{dry?.workingDirectory ?? "（待 dry-run）"}</li>
                <li>最大运行时长（策略默认）：720 分钟。</li>
                <li>checkpoint 由 train.py 写入工作目录下 checkpoint/。</li>
                <li>若环境为 NEEDS_LOCAL_GATEWAY，将不真实执行，仅生成预览。</li>
              </ul>
              <div className="flex gap-2 pt-1">
                <button
                  disabled={!dry?.canRun}
                  onClick={onConfirm}
                  className="rounded-md border border-primary bg-primary/10 px-3 py-1 text-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  我确认开始训练
                </button>
                <button
                  onClick={() => { if (selectedTask) cancelTask(selectedTask.id, selectedRun?.id); refresh(); }}
                  className="rounded-md border border-border px-3 py-1 text-muted-foreground"
                >
                  取消任务
                </button>
              </div>
            </div>
          </Section>

          <Section title="⑤ 运行状态 / 日志">
            {!selectedRun ? (
              <div className="text-xs text-muted-foreground">尚未启动 Run。</div>
            ) : (
              <div className="space-y-2 rounded-md border border-border bg-card/40 p-3 text-xs">
                <div>
                  Run：{selectedRun.id} · 状态：{AUTO_TRAINING_RUN_STATUS_LABEL[selectedRun.status]}
                  {selectedRun.exitCode !== undefined && ` · exit=${selectedRun.exitCode}`}
                </div>
                <pre className="max-h-48 overflow-auto rounded bg-background/60 p-2 text-[11px]">
                  {logs.map((l) => `[${l.stream}] ${l.line}`).join("\n") || "(无日志)"}
                </pre>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => { markTaskCompleted(selectedTask.id, selectedRun.id, "Founder 手动登记完成"); refresh(); }}
                    className="rounded border border-emerald-500/40 px-2 py-1 text-emerald-300"
                  >
                    手动登记完成
                  </button>
                  <input
                    value={failureReason}
                    onChange={(e) => setFailureReason(e.target.value)}
                    placeholder="失败原因（OOM / loss NaN / 依赖缺失…）"
                    className="flex-1 rounded border border-border bg-background px-2 py-1"
                  />
                  <button
                    disabled={!failureReason}
                    onClick={() => { markTaskFailed(selectedTask.id, selectedRun.id, failureReason); setFailureReason(""); refresh(); }}
                    className="rounded border border-rose-500/40 px-2 py-1 text-rose-300 disabled:opacity-50"
                  >
                    登记失败 + 写回实验账本
                  </button>
                </div>
              </div>
            )}
          </Section>

          <Section title="⑥ 回写">
            <div className="grid grid-cols-2 gap-2 text-xs md:grid-cols-3">
              <Link to="/system/experiment-ledger" className="rounded-md border border-border bg-card/40 p-3 hover:border-primary">
                <div className="font-medium">实验账本</div>
                <div className="text-muted-foreground">查看实验状态、checkpoint、下一炉建议。</div>
              </Link>
              <Link to="/system/data-engine" className="rounded-md border border-border bg-card/40 p-3 hover:border-primary">
                <div className="font-medium">数据引擎</div>
                <div className="text-muted-foreground">总控视图中查看自动训练联动。</div>
              </Link>
              <Link to="/system/local-training" className="rounded-md border border-border bg-card/40 p-3 hover:border-primary">
                <div className="font-medium">本机训练计划</div>
                <div className="text-muted-foreground">查看脚本草案与 Runbook。</div>
              </Link>
            </div>
          </Section>
        </>
      )}

      <Section title="安全边界">
        <div className="grid grid-cols-1 gap-2 text-xs md:grid-cols-2">
          <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3">
            <div className="font-medium text-emerald-300">允许</div>
            <ul className="mt-1 ml-4 list-disc text-muted-foreground">
              {AUTO_TRAINING_SAFETY_ALLOWED.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
          <div className="rounded-md border border-rose-500/30 bg-rose-500/5 p-3">
            <div className="font-medium text-rose-300">禁止</div>
            <ul className="mt-1 ml-4 list-disc text-muted-foreground">
              {AUTO_TRAINING_SAFETY_FORBIDDEN.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        </div>
      </Section>
    </div>
  );
}
