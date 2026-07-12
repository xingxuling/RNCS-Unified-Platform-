// 训练工作流页面 /system/training-workflows
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useCallback } from "react";
import {
  WORKFLOW_OVERALL_LABEL,
  WORKFLOW_STATUS_LABEL,
  WORKFLOW_STEP_LABEL,
  WORKFLOW_GATE_LABEL,
  type TrainingWorkflow,
  type WorkflowStepId,
} from "@/lib/aetherseed-training-workflow/trainingWorkflowTypes";
import {
  buildWorkflowSnapshot,
  createTrainingWorkflow,
  updateStepStatus,
} from "@/lib/aetherseed-training-workflow/trainingWorkflowRuntime";
import { listWorkflows } from "@/lib/aetherseed-training-workflow/trainingWorkflowStore";
import { planNextAction } from "@/lib/aetherseed-training-workflow/trainingWorkflowNextActionPlanner";
import { planRecovery } from "@/lib/aetherseed-training-workflow/trainingWorkflowRecoveryPlanner";
import {
  TRAINING_WORKFLOW_SAFETY_ALLOWED,
  TRAINING_WORKFLOW_SAFETY_FORBIDDEN,
} from "@/lib/aetherseed-training-workflow/trainingWorkflowSafetyPolicy";
import { checkWorkflowChainCompleteness } from "@/lib/aetherseed-training-workflow/workflowChainCompleteness";
import { UnifiedGatewayStatusBar } from "@/components/system/UnifiedGatewayStatusBar";

export const Route = createFileRoute("/system/training-workflows")({
  head: () => ({
    meta: [
      { title: "训练工作流 · AetherSeed Training Workflow Orchestrator" },
      {
        name: "description",
        content:
          "AetherSeed 训练工作流编排器：把 Intake → Dataset → Export → Plan → Dry-run → 确认 → 训练 → 实验账本 → 血统编排为完整流水线。",
      },
    ],
  }),
  component: TrainingWorkflowsPage,
});

function TrainingWorkflowsPage() {
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((n) => n + 1), []);

  const snapshot = useMemo(() => buildWorkflowSnapshot(), [tick]);
  const list = useMemo(() => listWorkflows(), [tick]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(
    () => list.find((w) => w.id === selectedId) ?? list[0] ?? null,
    [list, selectedId],
  );

  const handleCreate = () => {
    const wf = createTrainingWorkflow({
      title: "AetherSeed 完整训练流水线",
      targetModel: "AetherSeed-10M",
      intent: "从原料到模型血统的完整训练工作流",
    });
    setSelectedId(wf.id);
    refresh();
  };

  const handleStepAction = (
    workflowId: string,
    stepId: WorkflowStepId,
    action: "DONE" | "WAIT_CONFIRM" | "MANUAL" | "FAIL" | "READY",
  ) => {
    const map = {
      DONE: "DONE",
      WAIT_CONFIRM: "WAITING_CONFIRMATION",
      MANUAL: "MANUAL_EXTERNAL_ACTION",
      FAIL: "FAILED",
      READY: "READY",
    } as const;
    updateStepStatus(workflowId, stepId, map[action]);
    refresh();
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        <header className="space-y-1">
          <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
            AetherSeed Training Workflow Orchestrator
          </div>
          <h1 className="text-2xl font-display">训练工作流</h1>
          <p className="text-sm text-muted-foreground">
            将 Intake Forge、Dataset、导出、本机训练计划、Auto Training Dry-run、用户确认、训练执行、实验账本、模型血统编排为完整流水线。
            所有高风险步骤强制停在「等待用户确认」或「等待手动训练」。
          </p>
        </header>

        <UnifiedGatewayStatusBar prefix="工作流前置：" />



        {/* 总览 */}
        <section className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <Stat label="工作流总数" value={snapshot.total} />
          <Stat label="进行中" value={snapshot.inProgress} />
          <Stat label="等待确认" value={snapshot.waitingUser} />
          <Stat label="等待手动训练" value={snapshot.waitingManual} />
          <Stat label="已完成" value={snapshot.completed} />
          <Stat label="失败" value={snapshot.failed} />
        </section>

        {/* 创建 */}
        <section className="aether-card p-5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium">创建完整 AetherSeed 训练流水线</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                生成 12 步骨架（仅登记，不启动任何训练）。
              </div>
            </div>
            <button
              type="button"
              onClick={handleCreate}
              className="rounded-md bg-foreground text-background text-sm px-3 py-1.5 hover:bg-foreground/90"
            >
              创建工作流
            </button>
          </div>
        </section>

        {/* 工作流列表 */}
        <section className="space-y-2">
          <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            工作流列表
          </div>
          {list.length === 0 ? (
            <div className="aether-card p-6 text-sm text-muted-foreground">
              暂无训练工作流。点击上方「创建工作流」即可生成首条骨架。
            </div>
          ) : (
            <div className="aether-card divide-y divide-border/40">
              {list.map((wf) => (
                <button
                  key={wf.id}
                  type="button"
                  onClick={() => setSelectedId(wf.id)}
                  className={`w-full text-left px-4 py-3 hover:bg-muted/30 ${
                    selected?.id === wf.id ? "bg-muted/30" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm truncate">{wf.title}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        目标 {wf.targetModel} · 当前 {WORKFLOW_STEP_LABEL[wf.currentStepId]}
                      </div>
                    </div>
                    <div className="text-[11px] text-muted-foreground shrink-0">
                      {WORKFLOW_OVERALL_LABEL[wf.overallStatus]}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* 当前工作流详情 */}
        {selected && <WorkflowDetail wf={selected} onAction={handleStepAction} />}

        {/* 安全说明 */}
        <section className="grid md:grid-cols-2 gap-3">
          <div className="aether-card p-4">
            <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
              允许的操作
            </div>
            <ul className="text-xs space-y-1 text-muted-foreground">
              {TRAINING_WORKFLOW_SAFETY_ALLOWED.map((s) => (
                <li key={s}>· {s}</li>
              ))}
            </ul>
          </div>
          <div className="aether-card p-4">
            <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
              禁止的操作
            </div>
            <ul className="text-xs space-y-1 text-muted-foreground">
              {TRAINING_WORKFLOW_SAFETY_FORBIDDEN.map((s) => (
                <li key={s}>· {s}</li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="aether-card p-3">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </div>
      <div className="text-2xl font-display mt-1">{value}</div>
    </div>
  );
}

function WorkflowDetail({
  wf,
  onAction,
}: {
  wf: TrainingWorkflow;
  onAction: (
    workflowId: string,
    stepId: WorkflowStepId,
    action: "DONE" | "WAIT_CONFIRM" | "MANUAL" | "FAIL" | "READY",
  ) => void;
}) {
  const next = planNextAction(wf);
  const recovery = planRecovery(wf);
  const chain = checkWorkflowChainCompleteness(wf);


  return (
    <section className="space-y-3">
      <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
        当前工作流：{wf.title}
      </div>

      {/* 真实闭环检查 */}
      <div
        className={`aether-card p-4 border ${
          chain.complete ? "border-emerald-500/40" : "border-amber-500/40"
        }`}
      >
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="text-xs text-muted-foreground">真实闭环检查</div>
          <div
            className={`text-[11px] px-2 py-0.5 rounded-full border ${
              chain.complete
                ? "border-emerald-500/40 text-emerald-300"
                : "border-amber-500/40 text-amber-300"
            }`}
          >
            {chain.complete ? "已闭环" : "未真正完成"} · {chain.presentCount}/{chain.requiredCount}
          </div>
        </div>
        <div className="text-[11px] mt-1 text-foreground/80">{chain.reason}</div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-2 text-[11px]">
          {chain.links.map((l) => (
            <div
              key={l.kind}
              className={`rounded-md border p-2 ${
                l.presentId
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : l.required
                  ? "border-amber-500/30 bg-amber-500/5"
                  : "border-border/40 bg-muted/10"
              }`}
            >
              <div className="text-foreground/90">{l.label}{l.required ? "" : "（可选）"}</div>
              <div className="text-[10px] text-muted-foreground truncate">
                {l.presentId ?? "未绑定"}
              </div>
            </div>
          ))}
        </div>
      </div>



      {/* 下一步建议 */}
      {next && (
        <div className="aether-card p-4">
          <div className="text-xs text-muted-foreground">下一步建议</div>
          <div className="text-sm mt-1 font-medium">
            {next.label}
            {next.blocking && (
              <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400">
                需用户操作
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-1">{next.hint}</div>
        </div>
      )}

      {/* 失败恢复 */}
      {recovery && (
        <div className="aether-card p-4 border-red-500/30">
          <div className="text-xs text-red-400">阻断 / 失败 · 恢复建议</div>
          <div className="text-sm mt-1">{recovery.failedStepLabel}：{recovery.rootCauseGuess}</div>
          <ul className="text-xs text-muted-foreground mt-2 space-y-1">
            {recovery.recoveryActions.map((a) => (
              <li key={a}>· {a}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 步骤时间线 */}
      <div className="aether-card divide-y divide-border/40">
        {wf.steps.map((s) => (
          <div key={s.id} className="px-4 py-3 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm">{s.label}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  Gate: {WORKFLOW_GATE_LABEL[s.gateLevel]} · 状态: {WORKFLOW_STATUS_LABEL[s.status]}
                </div>
                {s.blockedReason && (
                  <div className="text-[11px] text-red-400 mt-1">
                    阻断原因：{s.blockedReason}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 shrink-0">
                <SmallBtn onClick={() => onAction(wf.id, s.id, "READY")}>就绪</SmallBtn>
                {s.gateLevel === "L2_CONFIRM" && (
                  <SmallBtn
                    onClick={() => onAction(wf.id, s.id, "WAIT_CONFIRM")}
                  >
                    等待确认
                  </SmallBtn>
                )}
                {s.gateLevel === "L3_MANUAL_ONLY" && (
                  <SmallBtn onClick={() => onAction(wf.id, s.id, "MANUAL")}>
                    手动训练中
                  </SmallBtn>
                )}
                <SmallBtn onClick={() => onAction(wf.id, s.id, "DONE")} primary>
                  {s.gateLevel === "L2_CONFIRM" ? "我确认开始训练" : "完成"}
                </SmallBtn>
                <SmallBtn onClick={() => onAction(wf.id, s.id, "FAIL")} danger>
                  失败
                </SmallBtn>
              </div>
            </div>
            {s.artifacts.length > 0 && (
              <div className="text-[11px] text-muted-foreground">
                关联产物：
                {s.artifacts.map((a) => `${a.label}(${a.kind})`).join(" · ")}
              </div>
            )}
          </div>
        ))}
      </div>

      {wf.notes.length > 0 && (
        <div className="aether-card p-4">
          <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            备注
          </div>
          <ul className="text-xs text-muted-foreground mt-2 space-y-1">
            {wf.notes.map((n, i) => (
              <li key={i}>· {n}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function SmallBtn({
  children,
  onClick,
  primary,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
  danger?: boolean;
}) {
  const base = "text-[11px] px-2 py-1 rounded border transition-colors";
  const cls = primary
    ? "bg-foreground text-background border-foreground hover:bg-foreground/90"
    : danger
      ? "border-red-500/40 text-red-400 hover:bg-red-500/10"
      : "border-border/60 text-muted-foreground hover:text-foreground hover:border-border";
  return (
    <button type="button" onClick={onClick} className={`${base} ${cls}`}>
      {children}
    </button>
  );
}
