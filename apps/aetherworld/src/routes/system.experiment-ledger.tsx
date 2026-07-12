// AetherSeed Experiment Ledger · /system/experiment-ledger
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import {
  EXPERIMENT_STATUS_LABEL,
  EXPERIMENT_TARGET_LABEL,
  EXPERIMENT_TYPE_LABEL,
  EXPERIMENT_LOCATION_LABEL,
  FAILURE_TYPE_LABEL,
  CHECKPOINT_STATUS_LABEL,
  type ExperimentTargetModel,
  type ExperimentType,
  type ExperimentLocation,
} from "@/lib/aetherseed-experiment-ledger/experimentLedgerTypes";
import {
  buildLedgerSnapshot,
  createExperiment,
  createExperimentFromLocalTrainingPlan,
  generateNextPlan,
  getExperimentDetail,
  recordFailureAndPlan,
} from "@/lib/aetherseed-experiment-ledger/experimentLedgerRuntime";
import {
  markExperimentCompleted,
  markExperimentFailed,
  markExperimentStarted,
  recordMetrics,
} from "@/lib/aetherseed-experiment-ledger/experimentResultRecorder";
import { registerCheckpoint } from "@/lib/aetherseed-experiment-ledger/checkpointRegistry";
import {
  listBloodlineOrdered,
  upsertBloodlineFromExperiment,
} from "@/lib/aetherseed-experiment-ledger/modelBloodlineTracker";
import { listExperiments } from "@/lib/aetherseed-experiment-ledger/experimentLedgerStore";
import { listLocalTrainingBundles } from "@/lib/aetherseed-local-training/localTrainingRuntime";
import {
  EXPERIMENT_LEDGER_SAFETY_ALLOWED,
  EXPERIMENT_LEDGER_SAFETY_FORBIDDEN,
} from "@/lib/aetherseed-experiment-ledger/experimentSafetyPolicy";

export const Route = createFileRoute("/system/experiment-ledger")({
  head: () => ({
    meta: [
      { title: "实验账本 · AetherSeed Experiment Ledger" },
      { name: "description", content: "AetherSeed 训练实验账本：手动登记训练状态、checkpoint、metrics 与失败归因，并生成下一炉建议。" },
    ],
  }),
  component: ExperimentLedgerPage,
});

const TARGETS: ExperimentTargetModel[] = [
  "AETHERSEED_10M","AETHERSEED_50M","AETHERSEED_100M","AETHERSEED_300M",
  "AETHERSEED_700M","AETHERSEED_1_5B","AETHERSEED_3B","AETHERSEED_7B",
  "ROUTER_TINY","MSL_TINY","FORMAT_TINY",
];
const TYPES: ExperimentType[] = [
  "LOCAL_TRAINING","SERVER_TRAINING","EVAL_ONLY","TOKENIZER_TEST",
  "ROUTER_TINY","MSL_TINY","FORMAT_TINY","SFT","PRETRAIN","LORA","QLORA",
];
const LOCATIONS: ExperimentLocation[] = ["LOCAL_PC","GPU_SERVER","UNKNOWN"];

function ExperimentLedgerPage() {
  const [tick, setTick] = useState(0);
  const [status, setStatus] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  // create form
  const [name, setName] = useState("");
  const [target, setTarget] = useState<ExperimentTargetModel>("AETHERSEED_50M");
  const [expType, setExpType] = useState<ExperimentType>("LOCAL_TRAINING");
  const [location, setLocation] = useState<ExperimentLocation>("LOCAL_PC");
  const [fromPlanId, setFromPlanId] = useState<string>("");

  // metric form
  const [metricsLog, setMetricsLog] = useState("");
  // failure form
  const [failureSummary, setFailureSummary] = useState("");
  // checkpoint form
  const [cpName, setCpName] = useState("");
  const [cpPath, setCpPath] = useState("");

  const bundles = useMemo(() => { void tick; return listLocalTrainingBundles(); }, [tick]);
  const exps = useMemo(() => { void tick; return listExperiments(); }, [tick]);
  const snap = useMemo(() => { void tick; return buildLedgerSnapshot(); }, [tick]);
  const detail = useMemo(() => activeId ? getExperimentDetail(activeId) : undefined, [activeId, tick]);
  const bloodlines = useMemo(() => { void tick; return listBloodlineOrdered(); }, [tick]);

  const refresh = (msg?: string) => { setTick((n) => n + 1); if (msg) setStatus(msg); };

  const handleCreate = useCallback(() => {
    const plan = bundles.find((b) => b.plan.id === fromPlanId)?.plan;
    const exp = plan
      ? createExperimentFromLocalTrainingPlan(plan, { name: name.trim() || undefined })
      : createExperiment({
          name: name.trim() || undefined,
          targetModel: target,
          experimentType: expType,
          location,
        });
    setActiveId(exp.id);
    refresh(`已创建实验 ${exp.id}`);
  }, [bundles, fromPlanId, name, target, expType, location]);

  const handleStart = (id: string) => () => {
    const exp = exps.find((e) => e.id === id);
    if (exp) { markExperimentStarted(exp); refresh("已标记 RUNNING_MANUAL"); }
  };
  const handleComplete = (id: string) => () => {
    const exp = exps.find((e) => e.id === id);
    if (exp) {
      markExperimentCompleted(exp);
      upsertBloodlineFromExperiment(exp);
      refresh("已标记 COMPLETED_MANUAL 并更新血统");
    }
  };
  const handleFail = () => {
    if (!activeId) return;
    const exp = exps.find((e) => e.id === activeId);
    if (!exp) return;
    markExperimentFailed(exp, failureSummary.slice(0, 200));
    recordFailureAndPlan(activeId, failureSummary);
    setFailureSummary("");
    refresh("已登记失败 + 失败报告 + 下一炉建议");
  };
  const handleRecordMetrics = () => {
    if (!activeId) return;
    recordMetrics({ experimentId: activeId, logText: metricsLog });
    setMetricsLog("");
    refresh("已登记 metrics");
  };
  const handleRegisterCp = () => {
    if (!activeId || !cpName.trim()) return;
    registerCheckpoint({ experimentId: activeId, checkpointName: cpName, checkpointPath: cpPath });
    setCpName(""); setCpPath("");
    refresh("已登记 checkpoint（仅手动文本）");
  };
  const handleGenNext = () => {
    if (!activeId) return;
    generateNextPlan(activeId);
    refresh("已生成下一炉建议");
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <header className="space-y-1">
        <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">AetherSeed Experiment Ledger v0.1</div>
        <h1 className="text-2xl font-semibold">实验账本</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          AetherSeed 模型血统训练记录中心。所有状态由 Founder 手动登记；
          本系统不自动执行训练、不读取本地文件、不上传 checkpoint。
        </p>
      </header>

      {/* 总览 */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Stat label="实验总数" value={snap.totalExperiments} />
        <Stat label="待执行" value={snap.readyToRun} />
        <Stat label="训练中" value={snap.running} />
        <Stat label="已完成" value={snap.completed} />
        <Stat label="已失败" value={snap.failed} />
        <Stat label="已评测" value={snap.evaluated} />
        <Stat label="checkpoint" value={snap.checkpointCount} />
        <Stat label="血统记录" value={snap.bloodlineCount} />
      </section>

      {/* 创建 */}
      <section className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-2">
        <div className="text-xs text-muted-foreground">① 创建实验</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="实验名称（可选）"
            className="text-xs bg-background/60 border border-border/50 rounded-md p-2" />
          <select value={fromPlanId} onChange={(e) => setFromPlanId(e.target.value)}
            className="text-xs bg-background/60 border border-border/50 rounded-md p-2">
            <option value="">（手动创建，不绑定本机训练计划）</option>
            {bundles.map((b) => (
              <option key={b.plan.id} value={b.plan.id}>从计划：{b.plan.name}</option>
            ))}
          </select>
          <button onClick={handleCreate}
            className="text-xs px-3 py-1.5 rounded-md border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10">
            创建实验记录
          </button>
        </div>
        {!fromPlanId && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <select value={target} onChange={(e) => setTarget(e.target.value as ExperimentTargetModel)}
              className="text-xs bg-background/60 border border-border/50 rounded-md p-2">
              {TARGETS.map((t) => <option key={t} value={t}>{EXPERIMENT_TARGET_LABEL[t]}</option>)}
            </select>
            <select value={expType} onChange={(e) => setExpType(e.target.value as ExperimentType)}
              className="text-xs bg-background/60 border border-border/50 rounded-md p-2">
              {TYPES.map((t) => <option key={t} value={t}>{EXPERIMENT_TYPE_LABEL[t]}</option>)}
            </select>
            <select value={location} onChange={(e) => setLocation(e.target.value as ExperimentLocation)}
              className="text-xs bg-background/60 border border-border/50 rounded-md p-2">
              {LOCATIONS.map((l) => <option key={l} value={l}>{EXPERIMENT_LOCATION_LABEL[l]}</option>)}
            </select>
          </div>
        )}
        {status && <div className="text-[11px] text-muted-foreground">{status}</div>}
      </section>

      {/* 实验列表 */}
      <section className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-2">
        <div className="text-xs text-muted-foreground">② 实验列表（{exps.length}）</div>
        {exps.length === 0 ? (
          <div className="text-[11px] text-muted-foreground border border-dashed border-border/50 rounded-md p-4 text-center">
            暂无实验记录。可先在 /system/local-training 生成训练计划，再回来创建实验。
          </div>
        ) : (
          <div className="space-y-1.5">
            {exps.map((e) => (
              <button key={e.id} onClick={() => setActiveId(e.id)}
                className={`w-full text-left rounded-md border p-2 text-[11px] space-y-1 transition ${
                  activeId === e.id ? "border-emerald-500/60 bg-emerald-500/10" : "border-border/40 bg-muted/10 hover:border-border/70"
                }`}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-foreground/90">{e.name}</span>
                  <span className="text-muted-foreground">· {EXPERIMENT_TARGET_LABEL[e.targetModel]}</span>
                  <span className="text-muted-foreground">· {EXPERIMENT_LOCATION_LABEL[e.location]}</span>
                  <span className="ml-auto text-emerald-400">{EXPERIMENT_STATUS_LABEL[e.status]}</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap text-[10px] text-muted-foreground">
                  <span>{EXPERIMENT_TYPE_LABEL[e.experimentType]}</span>
                  {e.datasetVersionId && <span>· 数据集 {e.datasetVersionId.slice(0, 12)}</span>}
                  <span className="ml-auto">{new Date(e.createdAt).toLocaleString("zh-CN")}</span>
                </div>
                <div className="flex gap-1">
                  <span onClick={(ev) => { ev.stopPropagation(); handleStart(e.id)(); }}
                    className="text-[10px] px-1.5 py-0.5 rounded border border-sky-500/40 text-sky-400 hover:bg-sky-500/10 cursor-pointer">
                    标记开始
                  </span>
                  <span onClick={(ev) => { ev.stopPropagation(); handleComplete(e.id)(); }}
                    className="text-[10px] px-1.5 py-0.5 rounded border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 cursor-pointer">
                    标记完成
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* 实验详情 + 手动登记 */}
      {detail && (
        <section className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-3">
          <div className="text-xs text-muted-foreground">③ 实验详情 · {detail.exp.name}</div>

          {/* metrics 登记 */}
          <div className="space-y-1">
            <div className="text-[11px] text-foreground/80">登记 metrics（粘贴训练日志摘要自动解析）</div>
            <textarea value={metricsLog} onChange={(e) => setMetricsLog(e.target.value)}
              placeholder={"示例：train_loss=2.8 eval_loss=3.1 perplexity=22 msl_validity=0.91"}
              className="w-full text-[11px] bg-background/60 border border-border/50 rounded-md p-2 min-h-[60px]" />
            <button onClick={handleRecordMetrics}
              className="text-xs px-2 py-1 rounded-md border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10">
              登记 metrics
            </button>
          </div>

          {/* failure 登记 */}
          <div className="space-y-1">
            <div className="text-[11px] text-foreground/80">登记失败（粘贴失败日志摘要，自动归因 + 下一炉建议）</div>
            <textarea value={failureSummary} onChange={(e) => setFailureSummary(e.target.value)}
              placeholder={"示例：CUDA out of memory at step 1200..."}
              className="w-full text-[11px] bg-background/60 border border-border/50 rounded-md p-2 min-h-[60px]" />
            <button onClick={handleFail}
              className="text-xs px-2 py-1 rounded-md border border-rose-500/40 text-rose-400 hover:bg-rose-500/10">
              登记失败 + 生成报告
            </button>
          </div>

          {/* checkpoint 登记 */}
          <div className="space-y-1">
            <div className="text-[11px] text-foreground/80">登记 checkpoint（仅手动文本，本系统不读取本地）</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <input value={cpName} onChange={(e) => setCpName(e.target.value)} placeholder="checkpoint 名称"
                className="text-xs bg-background/60 border border-border/50 rounded-md p-2" />
              <input value={cpPath} onChange={(e) => setCpPath(e.target.value)} placeholder="路径（可选，如 ./out/ckpt-1000.safetensors）"
                className="text-xs bg-background/60 border border-border/50 rounded-md p-2" />
            </div>
            <button onClick={handleRegisterCp}
              className="text-xs px-2 py-1 rounded-md border border-amber-500/40 text-amber-400 hover:bg-amber-500/10">
              登记 checkpoint
            </button>
          </div>

          {/* 下一炉 */}
          <button onClick={handleGenNext}
            className="text-xs px-2 py-1 rounded-md border border-violet-500/40 text-violet-400 hover:bg-violet-500/10">
            生成下一炉建议
          </button>

          {/* 列表展示 */}
          <details open className="text-[11px]">
            <summary className="cursor-pointer text-muted-foreground">Metrics ({detail.metrics.length})</summary>
            {detail.metrics.map((m) => (
              <div key={m.id} className="border border-border/40 rounded-md p-2 mt-1 space-y-0.5">
                <div>train_loss={m.trainLoss ?? "-"} · eval_loss={m.evalLoss ?? "-"} · ppl={m.perplexity ?? "-"}</div>
                <div className="text-muted-foreground">msl={m.mslValidity ?? "-"} · json={m.jsonValidity ?? "-"} · router={m.routerAccuracy ?? "-"}</div>
              </div>
            ))}
          </details>
          <details open className="text-[11px]">
            <summary className="cursor-pointer text-muted-foreground">Checkpoints ({detail.checkpoints.length})</summary>
            {detail.checkpoints.map((c) => (
              <div key={c.id} className="border border-border/40 rounded-md p-2 mt-1">
                {c.checkpointName} · {c.modelFormat} · {CHECKPOINT_STATUS_LABEL[c.status]}
                {c.checkpointPath && <div className="text-muted-foreground">{c.checkpointPath}</div>}
              </div>
            ))}
          </details>
          <details open className="text-[11px]">
            <summary className="cursor-pointer text-muted-foreground">Failures ({detail.failures.length})</summary>
            {detail.failures.map((f) => (
              <div key={f.id} className="border border-rose-500/30 rounded-md p-2 mt-1 space-y-0.5">
                <div className="text-rose-300">{FAILURE_TYPE_LABEL[f.failureType]}</div>
                <div className="text-muted-foreground">{f.summary}</div>
                <div>修复建议：{f.suggestedFixes.join("；")}</div>
              </div>
            ))}
          </details>
          <details open className="text-[11px]">
            <summary className="cursor-pointer text-muted-foreground">下一炉 ({detail.nextPlans.length})</summary>
            {detail.nextPlans.map((p) => (
              <div key={p.id} className="border border-violet-500/30 rounded-md p-2 mt-1">
                [{p.priority}] {p.title} <span className="text-muted-foreground">· {p.recommendationType}</span>
                <div className="text-muted-foreground">{p.rationale}</div>
                <div>建议变更：{p.suggestedChanges.join("；")}</div>
              </div>
            ))}
          </details>
        </section>
      )}

      {/* 血统线 */}
      <section className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-2">
        <div className="text-xs text-muted-foreground">④ 模型血统线</div>
        {bloodlines.length === 0 ? (
          <div className="text-[11px] text-muted-foreground">暂无血统记录。完成首个实验后会自动登记。</div>
        ) : (
          <div className="space-y-1.5">
            {bloodlines.map((b) => (
              <div key={b.id} className="text-[11px] border border-border/40 rounded-md p-2">
                <div className="text-foreground/90">{b.generation} · {b.modelName}</div>
                <div className="text-muted-foreground">能力：{b.capabilitySummary.join("、")}</div>
                <div className="text-muted-foreground">弱点：{b.knownWeaknesses.join("、")}</div>
                <div className="text-muted-foreground">下一目标：{b.nextTargets.join("、")}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 安全策略 */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3">
          <div className="text-emerald-400 mb-1">允许</div>
          <ul className="space-y-1 list-disc list-inside text-muted-foreground">
            {EXPERIMENT_LEDGER_SAFETY_ALLOWED.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        </div>
        <div className="rounded-md border border-rose-500/30 bg-rose-500/5 p-3">
          <div className="text-rose-400 mb-1">禁止</div>
          <ul className="space-y-1 list-disc list-inside text-muted-foreground">
            {EXPERIMENT_LEDGER_SAFETY_FORBIDDEN.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md border border-border bg-card/40 px-4 py-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-foreground">{value}</div>
    </div>
  );
}
